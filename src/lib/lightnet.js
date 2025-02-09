import chalk from 'chalk';
import createDebug from 'debug';
import decompress from 'decompress';
import enquirer from 'enquirer';
import fs from 'fs-extra';
import dns from 'node:dns';
import path from 'node:path';
import opener from 'opener';
import ora from 'ora';
import semver from 'semver';
import shell from 'shelljs';
import { getBorderCharacters, table } from 'table';
import Constants from './constants.js';
import { isDirEmpty, step } from './helpers.js';
import { checkLocalPortsAvailability } from './network-helpers.js';
import { sleep } from './time-helpers.js';

// Module external API
export {
  lightnetExplorer,
  lightnetFollowLogs,
  lightnetSaveLogs,
  lightnetStart,
  lightnetStatus,
  lightnetStop,
};

// Module internal API (exported for testing purposes)
export {
  buildDebugLogger,
  checkDockerEngineAvailability,
  copyContainerLogToHost,
  dockerContainerIdMatchesConfig,
  downloadExplorerRelease,
  executeCmd,
  fetchExplorerReleases,
  generateLogsDirPath,
  getAvailableDockerEngineResources,
  getBlockchainNetworkReadinessMaxAttempts,
  getCurrentExplorerVersion,
  getDockerContainerId,
  getDockerContainerStartupCmdPorts,
  getDockerContainerState,
  getDockerContainerVolume,
  getLocalExplorerVersions,
  getLogFilePaths,
  getProcessToLogFileMapping,
  getRequiredDockerContainerPorts,
  getSystemQuotes,
  handleDockerContainerPresence,
  handleExplorerReleasePresence,
  handleStartCommandChecks,
  handleStopCommandChecks,
  handleYesNoConfirmation,
  isEnoughDockerEngineResourcesAvailable,
  launchExplorer,
  printBlockchainNetworkProperties,
  printCmdDebugLog,
  printDockerContainerProcessesLogPaths,
  printExplorerVersions,
  printExtendedDockerContainerState,
  printUsefulUrls,
  printZkAppSnippet,
  processArchiveNodeApiLogs,
  processMultiNodeLogs,
  processSingleNodeLogs,
  promptForDockerContainerProcess,
  removeDanglingDockerImages,
  removeDockerContainer,
  removeDockerVolume,
  saveDockerContainerProcessesLogs,
  secondsToHms,
  shellExec,
  stopDockerContainer,
  streamDockerContainerFileContent,
  updateCurrentExplorerVersion,
  waitForBlockchainNetworkReadiness,
};

dns.setDefaultResultOrder('ipv4first');

const debug = createDebug('zk:lightnet');
const debugLog = buildDebugLogger();
const lightnetConfigFile = path.resolve(
  `${Constants.lightnetWorkDir}/config.json`
);
const lightnetLogsDir = path.resolve(`${Constants.lightnetWorkDir}/logs`);
const lightnetExplorerDir = path.resolve(
  `${Constants.lightnetWorkDir}/explorer`
);
const lightnetExplorerConfigFile = path.resolve(
  `${lightnetExplorerDir}/config.json`
);
const lightnetDockerContainerName = 'mina-local-lightnet';
const archiveNodeApiProcessName = 'Archive-Node-API application';
const minaArchiveProcessName = 'Mina Archive process';
const multiPurposeMinaDaemonProcessName = 'Mina multi-purpose Daemon';
const DockerContainerState = {
  RUNNING: 'running',
  NOT_FOUND: 'not-found',
};
const ContainerLogFilesPrefix = {
  SINGLE_NODE: '/root',
  MULTI_NODE: '/root/.mina-network/mina-local-network-2-1-1/nodes',
};
const commonServicesPorts = [8080, 8181];
const archivePorts = [5432, 8282];
const singleNodePorts = [3085];
const multiNodePorts = [4001, 4006, 5001, 6001];
const { quotes, escapeQuotes } = getSystemQuotes();

/**
 * Starts the lightweight Mina blockchain network Docker container.
 * @param {object}  argv - The arguments object provided by yargs.
 * @param {string}  argv.mode - The mode to start the lightnet in.
 * @param {string}  argv.type - The type of lightnet to start.
 * @param {string}  argv.proofLevel - The proof level to use.
 * @param {string}  argv.minaBranch - The Mina branch to use.
 * @param {boolean} argv.archive - Whether to start the Mina Archive process and the Archive-Node-API application.
 * @param {boolean} argv.sync - Whether to wait for the network to sync.
 * @param {boolean} argv.pull - Whether to pull the latest version of the Docker image from the Docker Hub.
 * @param {string}  argv.minaLogLevel - Mina processes logging level to use.
 * @param {number}  argv.slotTime - The slot time for block production to use.
 * @returns {Promise<void>}
 */
async function lightnetStart({
  mode,
  type,
  proofLevel,
  minaBranch,
  archive,
  sync,
  pull,
  minaLogLevel,
  slotTime,
}) {
  let containerId = null;
  let containerVolume = null;
  await checkDockerEngineAvailability();
  await step('Checking prerequisites', async () => {
    await handleStartCommandChecks(lightnetDockerContainerName, mode, archive);
  });
  await step(
    'Stopping and removing the existing Docker container',
    async () => {
      await stopDockerContainer(lightnetDockerContainerName);
      await removeDockerContainer(lightnetDockerContainerName);
    }
  );
  if (pull) {
    await step('Pulling the corresponding Docker image', async () => {
      await executeCmd(
        `docker pull o1labs/mina-local-network:${minaBranch}-latest-${
          type === 'fast' ? 'lightnet' : 'devnet'
        }`
      );
      await removeDanglingDockerImages();
    });
  }
  await step(
    'Starting the lightweight Mina blockchain network Docker container',
    async () => {
      await executeCmd(
        `docker run --name ${lightnetDockerContainerName} --pull=missing -id ` +
          `--env NETWORK_TYPE="${mode}" ` +
          `--env PROOF_LEVEL="${proofLevel}" ` +
          `--env LOG_LEVEL="${minaLogLevel}" ` +
          `--env RUN_ARCHIVE_NODE="${archive}" ` +
          `--env SLOT_TIME="${slotTime}" ` +
          getDockerContainerStartupCmdPorts(mode, archive) +
          `o1labs/mina-local-network:${minaBranch}-latest-${
            type === 'fast' ? 'lightnet' : 'devnet'
          }`
      );
      containerId = await getDockerContainerId(lightnetDockerContainerName);
      containerVolume = await getDockerContainerVolume(
        lightnetDockerContainerName
      );
    }
  );
  await step('Preserving the network configuration', async () => {
    const data = {
      containerId,
      containerVolume,
      mode,
      type,
      proofLevel,
      minaBranch,
      archive,
      sync,
      pull,
      minaLogLevel,
      slotTime,
    };
    debugLog(
      'Updating file %s with JSON content: %O',
      lightnetConfigFile,
      data
    );
    fs.outputJsonSync(lightnetConfigFile, data, { spaces: 2, flag: 'w' });
  });
  if (sync) {
    let runTime = null;
    await step('Waiting for the blockchain network readiness', async () => {
      const startTime = performance.now();
      await waitForBlockchainNetworkReadiness(mode);
      runTime = chalk.green.bold(
        secondsToHms(Math.round((performance.now() - startTime) / 1000))
      );
    });
    const statusColored = chalk.green.bold('is ready');
    console.log(`\nBlockchain network ${statusColored} in ${runTime}.`);
    await lightnetStatus(true);
  } else {
    const statusColored = chalk.green.bold('is running');
    console.log(
      `\nThe lightweight Mina blockchain network Docker container ${statusColored}.` +
        '\nPlease check the network readiness a bit later by executing:\n\n' +
        chalk.green.bold('zk lightnet status') +
        '\n'
    );
  }
}

/**
 * Stops the lightweight Mina blockchain network Docker container.
 * @param {object}  argv - The arguments object provided by yargs.
 * @param {boolean} argv.saveLogs - Whether to save the Docker container processes logs to the host file system.
 * @param {boolean} argv.cleanUp - Whether to perform the clean up.
 * @returns {Promise<void>}
 */
async function lightnetStop({ saveLogs, cleanUp }) {
  let logsDir = null;
  await checkDockerEngineAvailability();
  await step('Checking prerequisites', async () => {
    await handleStopCommandChecks(lightnetDockerContainerName);
  });
  await step(
    'Stopping the lightweight Mina blockchain network Docker container',
    async () => {
      await stopDockerContainer(lightnetDockerContainerName);
    }
  );
  if (
    saveLogs &&
    fs.existsSync(lightnetConfigFile) &&
    DockerContainerState.NOT_FOUND !==
      (await getDockerContainerState(lightnetDockerContainerName))
  ) {
    await step('Preserving the Docker container processes logs', async () => {
      logsDir = await saveDockerContainerProcessesLogs();
    });
  }
  if (cleanUp) {
    await step(
      'Cleaning up' +
        '\n  - Docker container' +
        '\n  - Dangling Docker images' +
        '\n  - Docker volume' +
        '\n  - Blockchain network configuration',
      async () => {
        await removeDockerContainer(lightnetDockerContainerName);
        await removeDanglingDockerImages();
        if (fs.existsSync(lightnetConfigFile)) {
          await removeDockerVolume(
            fs.readJSONSync(lightnetConfigFile).containerVolume
          );
        }
        debugLog('Removing file or dir %s\n\n\n\n', lightnetConfigFile);
        fs.removeSync(lightnetConfigFile);
      }
    );
  }
  if (logsDir) {
    const boldLogs = chalk.reset.bold('logs');
    console.log(
      `\nThe Docker container processes ${boldLogs} can be found at the following path:\n\n` +
        chalk.green.bold(logsDir) +
        '\n'
    );
    console.log('Done\n');
  } else {
    if (fs.existsSync(lightnetLogsDir) && isDirEmpty(lightnetLogsDir)) {
      debugLog('Removing file or dir %s\n\n\n\n', lightnetLogsDir);
      fs.removeSync(lightnetLogsDir);
    }
    console.log('\nDone\n');
  }
}

/**
 * Gets the lightweight Mina blockchain network status.
 * @param {boolean} preventDockerEngineAvailabilityCheck - Whether to prevent the Docker Engine availability check.
 * @returns {Promise<void>}
 */
async function lightnetStatus(preventDockerEngineAvailabilityCheck = false) {
  if (!preventDockerEngineAvailabilityCheck) {
    await checkDockerEngineAvailability();
  }
  const containerState = await getDockerContainerState(
    lightnetDockerContainerName
  );
  if (DockerContainerState.NOT_FOUND === containerState) {
    console.log(
      chalk.red(
        '\nThe lightweight Mina blockchain network Docker container does not exist!'
      )
    );
    shell.exit(1);
  }
  console.log(chalk.reset.bold('\nLightweight Mina blockchain network'));
  console.log(
    chalk.reset(
      '\nMore information can be found at:\nhttps://docs.minaprotocol.com/zkapps/testing-zkapps-lightnet\n'
    )
  );
  if (
    DockerContainerState.RUNNING === containerState &&
    fs.existsSync(lightnetConfigFile)
  ) {
    printUsefulUrls();
    printDockerContainerProcessesLogPaths();
    await printBlockchainNetworkProperties();
    printZkAppSnippet();
    await printExtendedDockerContainerState(lightnetDockerContainerName);
  } else {
    console.log(
      chalk.yellow.bold(
        '\nWarning:\nThe lightweight Mina blockchain network Docker container is either ' +
          '\nnot running or it was created outside of this application.' +
          '\nOnly limited information is available.'
      )
    );
    await printExtendedDockerContainerState(lightnetDockerContainerName);
  }
}

/**
 * Saves the lightweight Mina blockchain network Docker container processes logs to the host file system.
 * @returns {Promise<void>}
 */
async function lightnetSaveLogs() {
  let logsDir = null;
  await checkDockerEngineAvailability();
  if (
    fs.existsSync(lightnetConfigFile) &&
    DockerContainerState.NOT_FOUND !==
      (await getDockerContainerState(lightnetDockerContainerName))
  ) {
    await step('Preserving the Docker container processes logs', async () => {
      logsDir = await saveDockerContainerProcessesLogs();
    });
    if (logsDir) {
      const boldLogs = chalk.reset.bold('logs');
      console.log(
        `\nThe Docker container processes ${boldLogs} were preserved at the following path:\n\n` +
          chalk.green.bold(logsDir) +
          '\n'
      );
    } else {
      console.log(
        chalk.red(
          '\nIssue happened during the Docker container processes logs preservation!'
        )
      );
      shell.exit(1);
    }
  } else {
    console.log(
      chalk.red(
        '\nIt is impossible to preserve the logs at the moment!' +
          '\nPlease ensure that the lightweight Mina blockchain network Docker container exists, then try again.'
      )
    );
    shell.exit(1);
  }
}

/**
 * Follows one of the lightweight Mina blockchain network Docker container processes logs.
 * @param {object}  argv - The arguments object provided by yargs.
 * @param {string}  argv.process - The name of the Docker container process to follow the logs of.
 * @returns {Promise<void>}
 */
async function lightnetFollowLogs({ process }) {
  await checkDockerEngineAvailability();
  const isDockerContainerRunning =
    fs.existsSync(lightnetConfigFile) &&
    DockerContainerState.RUNNING ===
      (await getDockerContainerState(lightnetDockerContainerName));
  if (!isDockerContainerRunning) {
    console.log(
      chalk.red(
        '\nIt is impossible to follow the logs at the moment!' +
          '\nPlease ensure that the lightweight Mina blockchain network Docker container is up and running, then try again.'
      )
    );
    shell.exit(1);
  }
  const lightnetConfig = fs.readJSONSync(lightnetConfigFile);
  const processToLogFileMapping = getProcessToLogFileMapping(lightnetConfig);
  const selectedProcess =
    process || (await promptForDockerContainerProcess(processToLogFileMapping));
  const logFilePath = processToLogFileMapping.get(selectedProcess);

  await step('Docker container file content streaming', async () => {
    await streamDockerContainerFileContent(
      lightnetDockerContainerName,
      logFilePath
    );
  });
}

/**
 * Launches the lightweight Mina explorer.
 * @param {object}  argv - The arguments object provided by yargs.
 * @param {string}  argv.use - The version of the lightweight Mina explorer to use.
 * @param {boolean} argv.list - Whether to list the available versions of the lightweight Mina explorer.
 * @returns {Promise<void>}
 */
async function lightnetExplorer({ use, list }) {
  if (list) {
    await printExplorerVersions();
  } else {
    await launchExplorer(use);
  }
}

async function printExplorerVersions() {
  try {
    const releasesPrintLimit = 5;
    const border = getBorderCharacters('norc');
    const boldTitle = chalk.reset.bold('Lightweight Mina explorer versions');
    const versions = [
      [boldTitle, '', ''],
      ['Version', 'Published on', 'Is in use?'],
    ];
    const releases = await fetchExplorerReleases();
    const currentVersion = getCurrentExplorerVersion();
    if (!releases || releases.length === 0) {
      versions.push([
        chalk.yellow('No data available yet.\nPlease try again later.'),
        '',
        '',
      ]);
      console.log(
        '\n' +
          table(versions, {
            border,
            spanningCells: [
              { col: 0, row: 0, colSpan: 3, alignment: 'center' },
              { col: 0, row: 2, colSpan: 3, alignment: 'center' },
            ],
          })
      );
      return;
    }
    for (const release of releases.slice(0, releasesPrintLimit)) {
      versions.push([
        chalk.reset.bold(release.name),
        new Date(release.published_at).toLocaleString(),
        currentVersion === release.name ? chalk.reset.green.bold('✓ Yes') : '',
      ]);
    }
    console.log(
      '\n' +
        table(versions, {
          border,
          spanningCells: [{ col: 0, row: 0, colSpan: 3, alignment: 'center' }],
        })
    );
    if (releases.length > releasesPrintLimit) {
      console.log(
        `Only ${chalk.green.bold(
          releasesPrintLimit
        )} most recent versions are shown.` +
          '\nPlease refer to the GitHub repository for the full list of available versions:' +
          chalk.green(
            '\nhttps://github.com/o1-labs/mina-lightweight-explorer/releases'
          )
      );
    }
  } catch (error) {
    debugLog('%o', error);
    console.log(
      chalk.red(
        '\nIssue happened while fetching the lightweight Mina explorer available versions!'
      )
    );
    shell.exit(1);
  }
}

async function launchExplorer(use) {
  try {
    let useVersion;
    let release = null;
    const releases = await fetchExplorerReleases();
    if (releases === null) {
      console.log(
        chalk.yellow('  ' + 'Attempting to use the latest local version.')
      );
      const localVersions = getLocalExplorerVersions();
      if (localVersions.length === 0) {
        console.log(
          chalk.red(
            '\nNo local versions of the lightweight Mina explorer are available. Please check your network connection and try again.'
          )
        );
        shell.exit(1);
      }
      useVersion = localVersions[0];
    } else {
      if (releases.length === 0) {
        console.log(
          chalk.red(
            '\nNo lightweight Mina explorer versions are available yet. Please try again later.'
          )
        );
        shell.exit(1);
      }
      useVersion = use === 'latest' ? releases[0].name : use;
      release = releases.find((release) => release.name === useVersion);
    }
    const explorerReleasePath = path.resolve(
      `${lightnetExplorerDir}/${useVersion}`
    );
    const explorerReleaseIndexFilePath = path.resolve(
      `${explorerReleasePath}/index.html`
    );
    if (releases && !release) {
      console.log(
        chalk.red(
          `\nThe specified version ("${useVersion}") of the lightweight Mina explorer does not exist or is not available for download.`
        )
      );
      shell.exit(1);
    }
    await handleExplorerReleasePresence(explorerReleasePath, release);
    await updateCurrentExplorerVersion(useVersion);
    await step('Launching the lightweight Mina explorer', async () => {
      opener(`file://${explorerReleaseIndexFilePath}`);
    });
    console.log(
      chalk.reset(
        '\nThe lightweight Mina explorer is available at the following path:' +
          '\n\n' +
          chalk.green.bold(explorerReleaseIndexFilePath) +
          '\n'
      )
    );
  } catch (error) {
    debugLog('%o', error);
    console.log(
      chalk.red(
        '\nIssue happened while launching the lightweight Mina explorer!'
      )
    );
    shell.exit(1);
  }
}

function getCurrentExplorerVersion() {
  if (fs.existsSync(lightnetExplorerConfigFile)) {
    return fs.readJSONSync(lightnetExplorerConfigFile).version;
  }
  return null;
}

async function updateCurrentExplorerVersion(version) {
  const currentVersion = getCurrentExplorerVersion();
  if (currentVersion !== version) {
    await step(
      'Updating the current lightweight Mina explorer version in use',
      async () => {
        let explorerConfig = { version };
        if (fs.existsSync(lightnetExplorerConfigFile)) {
          explorerConfig = fs.readJSONSync(lightnetExplorerConfigFile);
          explorerConfig.version = version;
        }
        fs.ensureDirSync(lightnetExplorerDir);
        fs.outputJsonSync(lightnetExplorerConfigFile, explorerConfig, {
          spaces: 2,
          flag: 'w',
        });
      }
    );
  }
}

async function fetchExplorerReleases() {
  const stepName =
    'Fetching the lightweight Mina explorer releases information...';
  const spin = ora({
    text: stepName,
    discardStdin: true,
  }).start();
  try {
    const explorerReleasesUrl =
      'https://api.github.com/repos/o1-labs/mina-lightweight-explorer/releases';
    let releases = [];
    debugLog('URL in use: %s', explorerReleasesUrl);
    const response = await fetch(explorerReleasesUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(
        `Received ${response.status} status code from the GitHub API.`
      );
    }
    releases = await response.json();
    spin.succeed(chalk.green(stepName));
    return releases;
  } catch (error) {
    spin.warn(chalk.yellow(stepName));
    console.log(
      '  ' +
        chalk.yellow(
          'Warning: Unable to fetch lightweight Mina explorer releases. This may be due to connectivity issues.'
        )
    );
    return null;
  }
}

async function downloadExplorerRelease(release) {
  await step(
    'Downloading the lightweight Mina explorer release bundle',
    async () => {
      debugLog('URL in use: %s', release.zipball_url);
      const response = await fetch(release.zipball_url);
      if (!response.ok) {
        throw new Error(
          `Received ${response.status} status code from the GitHub API.`
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      fs.ensureDirSync(lightnetExplorerDir);
      fs.writeFileSync(
        path.resolve(`${lightnetExplorerDir}/${release.name}.zip`),
        Buffer.from(arrayBuffer),
        'binary'
      );
    }
  );
}

async function handleExplorerReleasePresence(explorerReleasePath, release) {
  if (!fs.existsSync(explorerReleasePath) && !!release) {
    const tmpDir = path.resolve(`${explorerReleasePath}-tmp`);
    await step('Preparing the file-system', async () => {
      fs.removeSync(explorerReleasePath);
      fs.ensureDirSync(explorerReleasePath);
      fs.ensureDirSync(tmpDir);
    });
    await downloadExplorerRelease(release);
    await step('Unpacking the release bundle', async () => {
      await decompress(`${explorerReleasePath}.zip`, tmpDir);
    });
    await step('Restructuring the file-system', async () => {
      const extractedDir = fs.readdirSync(tmpDir)[0];
      fs.moveSync(
        path.resolve(`${tmpDir}/${extractedDir}`),
        path.resolve(explorerReleasePath),
        { overwrite: true }
      );
    });
    await step('Cleaning up', async () => {
      fs.removeSync(`${explorerReleasePath}.zip`);
      fs.removeSync(tmpDir);
    });
  }
}

function getLocalExplorerVersions() {
  if (!fs.existsSync(lightnetExplorerDir)) {
    return [];
  }
  const versions = fs.readdirSync(lightnetExplorerDir).filter((file) => {
    const filePath = path.join(lightnetExplorerDir, file);
    return (
      fs.statSync(filePath).isDirectory() && file.match(/^v\d+\.\d+\.\d+$/)
    );
  });
  return versions.sort((a, b) => {
    return semver.compare(b, a);
  });
}

function getProcessToLogFileMapping({ mode, archive }) {
  let mapping = new Map(Constants.lightnetProcessToLogFileMapping);
  if (mode === 'single-node') {
    mapping = new Map([...mapping].slice(0, 3));
    mapping.forEach((value, key) => {
      mapping.set(
        key,
        `${ContainerLogFilesPrefix.SINGLE_NODE}/${value.split(',')[0]}`
      );
    });
  } else {
    mapping.delete(multiPurposeMinaDaemonProcessName);
    mapping.forEach((value, key) => {
      const logFilePaths = value.split(',');
      mapping.set(
        key,
        `${
          archiveNodeApiProcessName === key
            ? ContainerLogFilesPrefix.SINGLE_NODE
            : ContainerLogFilesPrefix.MULTI_NODE
        }/${logFilePaths.length === 1 ? logFilePaths[0] : logFilePaths[1]}`
      );
    });
  }
  if (!archive) {
    mapping.delete(archiveNodeApiProcessName);
    mapping.delete(minaArchiveProcessName);
  }
  return mapping;
}

async function promptForDockerContainerProcess(processToLogFileMapping) {
  /* istanbul ignore next */
  const response = await enquirer.prompt({
    type: 'select',
    name: 'selectedProcess',
    choices: [...processToLogFileMapping.keys()],
    message: () => {
      return chalk.reset(
        'Please select the Docker container process to follow the logs of'
      );
    },
    prefix: (state) => {
      // Shows a cyan question mark when not submitted.
      // Shows a green check mark if submitted.
      // Shows a red "x" if ctrl+C is pressed (default is a magenta).
      if (!state.submitted) return `\n${state.symbols.question}`;
      return !state.cancelled
        ? state.symbols.check
        : chalk.red(state.symbols.cross);
    },
    result: (val) => val.trim(),
  });
  return response.selectedProcess;
}

async function checkDockerEngineAvailability() {
  await step('Checking the Docker Engine availability', async () => {
    if (!shell.which('docker')) {
      console.log(
        chalk.red(
          '\n\nPlease ensure that Docker Engine is installed, then try again.' +
            '\nSee https://docs.docker.com/engine/install/ for more information.'
        )
      );
      shell.exit(1);
    }
    const result = await executeCmd('docker ps -a');
    if (result.code !== 0) {
      console.log(
        chalk.red(
          '\n\nThe command "docker ps -a" failed with the following error:\n' +
            result.stderr +
            '\nPlease ensure that Docker Engine is running properly, then try again.'
        )
      );
      shell.exit(1);
    }
  });
}

async function handleStartCommandChecks(containerName, mode, archive) {
  const containerState = await getDockerContainerState(containerName);
  if (
    DockerContainerState.RUNNING === containerState &&
    fs.existsSync(lightnetConfigFile)
  ) {
    console.log(
      chalk.red(
        '\n\nThe lightweight Mina blockchain network is already running!'
      )
    );
    shell.exit(1);
  } else if (
    DockerContainerState.NOT_FOUND !== containerState &&
    (!fs.existsSync(lightnetConfigFile) ||
      !(await dockerContainerIdMatchesConfig(containerName)))
  ) {
    await handleDockerContainerPresence();
  }
  const requiredDockerContainerPorts = getRequiredDockerContainerPorts(
    mode,
    archive
  );
  debugLog(
    'Checking the following ports availability: %o',
    requiredDockerContainerPorts
  );
  const result = await checkLocalPortsAvailability(
    requiredDockerContainerPorts
  );
  if (result.error) {
    console.log(chalk.red(`\n\n${result.message}`));
    shell.exit(1);
  }
  const { error: resourcesError, message: resourcesErrorMessage } =
    await isEnoughDockerEngineResourcesAvailable(mode, archive);
  if (resourcesError) {
    await handleYesNoConfirmation(resourcesErrorMessage);
  }
}

async function handleStopCommandChecks(containerName) {
  if (
    DockerContainerState.NOT_FOUND !==
      (await getDockerContainerState(containerName)) &&
    (!fs.existsSync(lightnetConfigFile) ||
      !(await dockerContainerIdMatchesConfig(containerName)))
  ) {
    await handleDockerContainerPresence();
  }
}

async function handleDockerContainerPresence() {
  await handleYesNoConfirmation(
    'The lightweight Mina blockchain network Docker container already exists and it was created outside of this application.'
  );
}

async function handleYesNoConfirmation(message) {
  /* istanbul ignore next */
  const res = await enquirer.prompt({
    type: 'select',
    name: 'proceed',
    choices: ['Yes', 'No'],
    message: () => {
      return chalk.reset(
        chalk.bold.yellow(message) +
          chalk.reset('\nDo you want to proceed anyway?')
      );
    },
    prefix: (state) => {
      if (!state.submitted) return `\n${state.symbols.question}`;
      return !state.cancelled
        ? state.symbols.check
        : chalk.red(state.symbols.cross);
    },
    result: (val) => val.trim().toLowerCase(),
  });
  if (res.proceed === 'no') {
    shell.exit(0);
  }
}

async function getDockerContainerState(containerName) {
  const { stdout } = await executeCmd(
    `docker inspect -f ${quotes}{{.State.Status}}${quotes} ${containerName}`
  );
  return stdout.trim() === '' ? DockerContainerState.NOT_FOUND : stdout.trim();
}

async function getDockerContainerId(containerName) {
  const { stdout } = await executeCmd(
    `docker inspect -f ${quotes}{{.Id}}${quotes} ${containerName}`
  );
  return stdout.trim();
}

async function getDockerContainerVolume(containerName) {
  const { stdout } = await executeCmd(
    `docker inspect -f ${quotes}{{range .Mounts}}{{if eq .Type ${escapeQuotes}"volume${escapeQuotes}"}}{{.Name}}{{end}}{{end}}${quotes} ${containerName}`
  );
  return stdout.trim();
}

async function dockerContainerIdMatchesConfig(containerName) {
  const actualId = await getDockerContainerId(containerName);
  const expectedId = fs.readJSONSync(lightnetConfigFile).containerId;
  return actualId === expectedId;
}

async function stopDockerContainer(containerName) {
  await executeCmd(`docker stop ${containerName}`);
}

async function removeDockerContainer(containerName) {
  await executeCmd(`docker rm ${containerName}`);
}

async function removeDockerVolume(volume) {
  await executeCmd(`docker volume rm ${volume}`);
}

async function removeDanglingDockerImages() {
  await executeCmd('docker image prune -f --filter "dangling=true"');
}

async function getAvailableDockerEngineResources() {
  const { stdout } = await executeCmd(
    "docker info -f '{{.NCPU}}:{{.MemTotal}}'"
  );
  const [cpu, memory] = stdout.trim().split(':');
  return {
    cpu: parseInt(cpu),
    memoryGB: parseFloat((parseInt(memory) / 1024 / 1024 / 1024).toFixed(2)),
  };
}

async function streamDockerContainerFileContent(containerName, filePath) {
  try {
    const border = getBorderCharacters('norc');
    console.log(
      '\n' +
        table(
          [[chalk.reset('Use Ctrl+C to stop the file content streaming.')]],
          {
            border,
          }
        )
    );
    debugLog('Streaming the Docker container file %s content...', filePath);
    await executeCmd(
      `docker exec ${containerName} tail -n 50 -f ${filePath}`,
      false
    );
  } catch (error) {
    debugLog('%o', error);
    console.log(
      chalk.red(
        '\nIssue happened while streaming the Docker container file content!'
      )
    );
    shell.exit(1);
  }
}

async function saveDockerContainerProcessesLogs() {
  const logsDir = generateLogsDirPath();
  try {
    fs.ensureDirSync(logsDir);
    const { mode, archive } = fs.readJSONSync(lightnetConfigFile);
    const logFilePaths = getLogFilePaths(mode);
    if (mode === 'single-node') {
      await processSingleNodeLogs(logFilePaths, logsDir);
    } else {
      if (archive) {
        await processArchiveNodeApiLogs(logsDir);
      }
      await processMultiNodeLogs(logFilePaths, logsDir);
    }
    return logsDir;
  } catch (error) {
    debugLog('%o', error);
    fs.removeSync(logsDir);
    return null;
  }
}

function generateLogsDirPath() {
  const timeZoneOffset = new Date().getTimezoneOffset() * 60000;
  const localMoment = new Date(Date.now() - timeZoneOffset);
  return path.resolve(
    `${lightnetLogsDir}/${localMoment
      .toISOString()
      .split('.')[0]
      .replace(/:/g, '-')}`
  );
}

function getLogFilePaths(mode) {
  return [...Constants.lightnetProcessToLogFileMapping.values()].map(
    (value) => {
      const logFilePaths = value.split(',');
      return mode === 'single-node' || logFilePaths.length === 1
        ? logFilePaths[0]
        : logFilePaths[1];
    }
  );
}

async function processSingleNodeLogs(logFilePaths, logsDir) {
  for (const logFilePath of logFilePaths) {
    try {
      await copyContainerLogToHost(
        logFilePath,
        logsDir,
        ContainerLogFilesPrefix.SINGLE_NODE
      );
    } catch (error) {
      /* istanbul ignore next */
      debugLog('%o', error);
    }
  }
}

async function processMultiNodeLogs(logFilePaths, logsDir) {
  for (const logFilePath of logFilePaths) {
    try {
      await copyContainerLogToHost(
        logFilePath,
        logsDir,
        ContainerLogFilesPrefix.MULTI_NODE
      );
    } catch (error) {
      /* istanbul ignore next */
      debugLog('%o', error);
    }
  }
}

async function processArchiveNodeApiLogs(logsDir) {
  try {
    await copyContainerLogToHost(
      Constants.lightnetProcessToLogFileMapping.get(archiveNodeApiProcessName),
      logsDir,
      ContainerLogFilesPrefix.SINGLE_NODE
    );
  } catch (error) {
    /* istanbul ignore next */
    debugLog('%o', error);
  }
}

async function copyContainerLogToHost(logFilePath, logsDir, prefix) {
  const destinationFilePath = path.resolve(
    `${logsDir}/${logFilePath.replace(/\//g, '_')}`
  );
  await executeCmd(
    `docker cp ${lightnetDockerContainerName}:${prefix}/${logFilePath} ${destinationFilePath}`
  );
}

async function getBlockchainNetworkReadinessMaxAttempts(mode) {
  const { cpu: availableCpus } = await getAvailableDockerEngineResources();
  const baseCpus = 8;
  const singleNodeBaseAttempts = 50;
  const multiNodeBaseAttempts = 210;
  const cpusDiff = availableCpus - baseCpus;
  let adjustmentFactor;
  if (cpusDiff <= 0) {
    // Increase maxAttempts for fewer than base CPUs
    adjustmentFactor = 1 + Math.abs(cpusDiff) / baseCpus;
  } else {
    // Decrease maxAttempts for more than base CPUs
    adjustmentFactor = 1 / (1 + cpusDiff / baseCpus);
  }
  const baseAttempts =
    mode === 'single-node' ? singleNodeBaseAttempts : multiNodeBaseAttempts;
  const maxAttempts = Math.round(baseAttempts * adjustmentFactor);
  debugLog(
    'Calculated maximum blockchain network readiness check attempts: %d',
    maxAttempts
  );
  return maxAttempts;
}

async function waitForBlockchainNetworkReadiness(mode) {
  let blockchainSyncAttempt = 1;
  let blockchainIsReady = false;
  const maxAttempts = await getBlockchainNetworkReadinessMaxAttempts(mode);
  const pollingIntervalMs = 10_000;
  const syncStatusGraphQlQuery = {
    query: '{ syncStatus }',
    variables: null,
    operationName: null,
  };
  const debugMessage =
    'Blockchain network readiness check attempt #%d, retrying in %d seconds...';

  const checkEndpoint = async (url) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncStatusGraphQlQuery),
      });
      debugLog(
        'The endpoint checking network response was Ok? %s (HTTP status: %s)',
        response.ok,
        response.status
      );
      if (response.ok) {
        const responseJson = await response.json();
        if (responseJson?.data?.syncStatus === 'SYNCED') {
          return true;
        }
      }
    } catch (e) {
      debugLog('The endpoint checking procedure failed with the error: %s', e);
    }
    return false;
  };

  while (blockchainSyncAttempt <= maxAttempts && !blockchainIsReady) {
    blockchainIsReady =
      (await checkEndpoint(Constants.lightnetMinaDaemonGraphQlEndpoint)) ||
      (await checkEndpoint(
        Constants.lightnetMinaDaemonGraphQlEndpoint.replace(
          '127.0.0.1',
          'localhost'
        )
      ));
    if (!blockchainIsReady) {
      debugLog(debugMessage, blockchainSyncAttempt, pollingIntervalMs / 1_000);
      await sleep(pollingIntervalMs);
      blockchainSyncAttempt++;
    }
  }
  if (!blockchainIsReady) {
    const statusColored = chalk.red.bold('is not ready');
    console.log(
      '\n\nMaximum blockchain network readiness check attempts reached.' +
        `\nThe blockchain network ${statusColored}.` +
        '\nPlease consider cleaning up the environment by executing:\n\n' +
        chalk.green.bold('zk lightnet stop') +
        '\n'
    );
    shell.exit(1);
  }
}

async function printExtendedDockerContainerState(containerName) {
  const { stdout } = await executeCmd(
    `docker inspect -f ` +
      `${quotes}Status: {{.State.Status}}; ` +
      `Is running: {{.State.Running}}; ` +
      `{{if .State.ExitCode}}Exit code: {{.State.ExitCode}}; {{end}}` +
      `Killed by OOM: {{.State.OOMKilled}}; ` +
      `{{if .State.Error}}Error: {{.State.Error}}{{end}}${quotes} ${containerName}`
  );
  const boldTitle = chalk.reset.bold('\nDocker container state\n');
  console.log(boldTitle + stdout.trim());
}

function printUsefulUrls() {
  const lightnetConfig = fs.readJSONSync(lightnetConfigFile);
  const archive = lightnetConfig.archive;
  const border = getBorderCharacters('norc');
  const boldTitle = chalk.reset.bold('\nUseful URLs');
  const urls = [
    [
      chalk.bold('Mina Daemon GraphQL endpoint'),
      chalk.reset(Constants.lightnetMinaDaemonGraphQlEndpoint),
    ],
    [
      chalk.bold('Accounts Manager endpoint'),
      chalk.reset(Constants.lightnetAccountManagerEndpoint),
    ],
  ];
  if (archive) {
    urls.push([
      chalk.bold('Archive-Node-API endpoint'),
      chalk.reset(Constants.lightnetArchiveNodeApiEndpoint),
    ]);
    urls.push([
      chalk.bold('PostgreSQL connection string'),
      chalk.reset('postgresql://postgres:postgres@127.0.0.1:5432/archive'),
    ]);
  }
  console.log(boldTitle);
  console.log(
    table(urls, {
      border,
    })
  );
}

function printDockerContainerProcessesLogPaths() {
  const lightnetConfig = fs.readJSONSync(lightnetConfigFile);
  const mode = lightnetConfig.mode;
  const border = getBorderCharacters('norc');
  const boldTitle = chalk.reset.bold(
    'Logs produced by different processes are redirected into the files' +
      '\nlocated by the following path patterns inside the container:'
  );
  const logs = [
    [chalk.reset(`${ContainerLogFilesPrefix.SINGLE_NODE}/logs/*.log`)],
  ];
  if (mode === 'multi-node') {
    logs.push([
      chalk.reset(`${ContainerLogFilesPrefix.MULTI_NODE}/**/logs/*.log`),
    ]);
  }
  console.log(boldTitle);
  console.log(
    table(logs, {
      border,
    })
  );
  console.log(
    chalk.yellow.bold('Note:') +
      ' By default, important logs of the current session will be saved' +
      '\nto the host file system during the ' +
      chalk.green.bold('zk lightnet stop') +
      ' command execution.' +
      '\nTo disable this behavior, please use the ' +
      chalk.reset.bold('--no-save-logs') +
      ' option.'
  );
}

async function printBlockchainNetworkProperties() {
  const border = getBorderCharacters('norc');
  const boldTitle = chalk.reset.bold('\nBlockchain network properties');
  const noData = [
    [chalk.yellow('No data available yet. Please try again a bit later.')],
  ];
  let data = null;
  try {
    const graphQlQuery = {
      query: `{
        syncStatus
        daemonStatus {
          chainId
          consensusConfiguration {
            k
            slotDuration
            slotsPerEpoch
          }
          commitId
          uptimeSecs
          consensusMechanism
          snarkWorkFee
          numAccounts
        }
      }`,
      variables: null,
      operationName: null,
    };
    debugLog(
      'Fetching the blockchain network properties using GraphQL endpoint %s and query: %O',
      Constants.lightnetMinaDaemonGraphQlEndpoint,
      graphQlQuery
    );
    const response = await fetch(Constants.lightnetMinaDaemonGraphQlEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphQlQuery),
    });
    if (!response.ok) {
      data = noData;
    } else {
      const responseJson = await response.json();
      if (!responseJson?.data) {
        data = noData;
      } else {
        data = [
          [
            chalk.bold('Sync status'),
            chalk.reset(responseJson.data.syncStatus),
          ],
          [
            chalk.bold('Commit ID'),
            chalk.reset(responseJson.data.daemonStatus.commitId),
          ],
          [
            chalk.bold('Chain ID'),
            chalk.reset(responseJson.data.daemonStatus.chainId),
          ],
          [
            chalk.bold('Consensus mechanism'),
            chalk.reset(responseJson.data.daemonStatus.consensusMechanism),
          ],
          [
            chalk.bold('Consensus configuration'),
            chalk.reset(
              `Transaction finality ("k" blocks): ${responseJson.data.daemonStatus.consensusConfiguration.k}` +
                `\nSlot duration (new block every ~): ${
                  responseJson.data.daemonStatus.consensusConfiguration
                    .slotDuration / 1_000
                } seconds` +
                `\nSlots per Epoch: ${responseJson.data.daemonStatus.consensusConfiguration.slotsPerEpoch}`
            ),
          ],
          [
            chalk.bold('SNARK work fee'),
            chalk.reset(
              `${
                responseJson.data.daemonStatus.snarkWorkFee / 1_000_000_000
              } MINA`
            ),
          ],
          [
            chalk.bold('Known accounts'),
            chalk.reset(responseJson.data.daemonStatus.numAccounts),
          ],
          [
            chalk.bold('Uptime'),
            chalk.reset(
              secondsToHms(responseJson.data.daemonStatus.uptimeSecs)
            ),
          ],
        ];
      }
    }
  } catch (error) {
    debugLog(
      'Issue happened while printing the blockchain network properties:\n%o',
      error
    );
    data = noData;
  }
  console.log(boldTitle);
  console.log(
    table(data, {
      border,
    })
  );
}

function printZkAppSnippet() {
  const boldTitle = chalk.reset.bold('zkApp snippet using o1js API');
  console.log(boldTitle);
  console.log(
    chalk.dim(
      `import {
  Lightnet,
  Mina,
  ...
} from 'o1js';

// Network configuration
const network = Mina.Network({
  mina: '${Constants.lightnetMinaDaemonGraphQlEndpoint}',
  archive: '${Constants.lightnetArchiveNodeApiEndpoint}',
  lightnetAccountManager: '${Constants.lightnetAccountManagerEndpoint}',
});
Mina.setActiveInstance(network);

// Fee payer setup
const feePayerPrivateKey = (await Lightnet.acquireKeyPair()).privateKey
const feePayerAccount = feePayerPrivateKey.toPublicKey();

...

// Release previously acquired key pair
const keyPairReleaseMessage = await Lightnet.releaseKeyPair({
  publicKey: feePayerAccount.toBase58(),
});
if (keyPairReleaseMessage) console.log(keyPairReleaseMessage);`
    )
  );
}

function secondsToHms(seconds) {
  seconds = Number(seconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor((seconds % 3600) % 60);

  let hDisplay = '';
  if (h > 0) {
    hDisplay = h + (h == 1 ? ' hour, ' : ' hours, ');
  }
  let mDisplay = '';
  if (m > 0) {
    mDisplay = m + (m == 1 ? ' minute, ' : ' minutes, ');
  }
  let sDisplay = '';
  if (s > 0) {
    sDisplay = s + (s == 1 ? ' second' : ' seconds');
  }
  const result = hDisplay + mDisplay + sDisplay;
  return result.endsWith(', ') ? result.slice(0, -2) : result;
}

async function isEnoughDockerEngineResourcesAvailable(mode, archive) {
  const { memoryGB: availableMemGB } =
    await getAvailableDockerEngineResources();
  let baseRequiredMemGB = 3.5;
  if (mode === 'single-node' && archive) {
    baseRequiredMemGB += 1.0;
  } else if (mode === 'multi-node') {
    baseRequiredMemGB = 16.0;
  }
  if (availableMemGB < baseRequiredMemGB) {
    return {
      error: true,
      message: `Insufficient Docker Engine resources available. The lightweight Mina blockchain network requires at least ${baseRequiredMemGB} GB of RAM to start.`,
    };
  } else {
    return { error: false };
  }
}

function getRequiredDockerContainerPorts(mode, archive) {
  let ports = commonServicesPorts;
  if (mode === 'single-node') {
    ports = ports.concat(singleNodePorts);
  } else {
    ports = ports.concat(multiNodePorts);
  }
  if (archive) {
    ports = ports.concat(archivePorts);
  }
  return ports;
}

function getDockerContainerStartupCmdPorts(mode, archive) {
  return getRequiredDockerContainerPorts(mode, archive)
    .map((port) => `-p 127.0.0.1:${port}:${port} `)
    .join('');
}

function printCmdDebugLog(command, stdOut, stdErr) {
  let logMessage = chalk.bold(`${command}`);
  if (stdOut) {
    logMessage += chalk.reset(`\nStdOut:\n%o`);
  }
  if (stdErr) {
    logMessage += chalk.reset(`\nStdErr:\n%o`);
  }
  debugLog(logMessage, stdOut, stdErr);
}

async function shellExec(command, options = {}) {
  return new Promise((resolve) => {
    shell.exec(command, options, (code, stdout, stderr) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function executeCmd(command, silent = true) {
  const { code, stdout, stderr } = await shellExec(command, { silent });
  printCmdDebugLog(command, stdout, stderr);
  return { code, stdout, stderr };
}

function buildDebugLogger() {
  return (formatter, ...args) => {
    if (process.env.DEBUG) {
      const namespaces = process.env.DEBUG.split(',');
      if (
        namespaces.includes('*') ||
        namespaces.includes('zk:*') ||
        namespaces.includes('zk:lightnet')
      ) {
        // We want to outline the debug output, so we print new line first.
        console.log('');
      }
    }
    debug(formatter, ...args);
  };
}

function getSystemQuotes() {
  let quotes = "'";
  let escapeQuotes = '';
  if (process.platform === 'win32') {
    quotes = '"';
    const { code } = shell.exec('Get-ChildItem', { silent: true });
    // Is it PowerShell?
    if (code == 0) {
      escapeQuotes = '\\`';
    } else {
      escapeQuotes = '\\"';
    }
  }

  return { quotes, escapeQuotes };
}
