import { expect, test } from '@playwright/test';
import { prepareEnvironment } from '@shimkiv/cli-testing-library';
import { NetworkId } from 'mina-signer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import Constants from '../../src/lib/constants.js';
import { generateInputsForOptionSelection } from '../utils/cli-utils.js';
import {
  TestConstants,
  cleanupFeePayerCache,
  cleanupFeePayerCacheByAlias,
  removeEnvCustomLoaders,
  restoreFeePayerCache,
} from '../utils/common-utils.js';
import {
  checkZkConfig,
  maybeZkConfig,
  zkConfig,
} from '../utils/config-utils.js';
import {
  acquireAvailableAccount,
  getMinaGraphQlEndpoint,
  releaseAcquiredAccount,
} from '../utils/network-utils.js';
import { zkProject } from '../utils/project-utils.js';

test.describe('zkApp-CLI', () => {
  test.beforeAll(removeEnvCustomLoaders);

  test(`should not create deployment alias if not within the project dir, @parallel @smoke @config @fail-cases`, async () => {
    const cliArg = 'config';
    const { execute, cleanup, path } = await prepareEnvironment();
    console.info(`[Test Execution] Path: ${path}`);

    try {
      const { stdout, code } = await execute('zk', cliArg);
      console.info(`[CLI StdOut] zk ${cliArg}: ${JSON.stringify(stdout)}`);
      expect(code).toBeGreaterThan(0);
      expect(stdout.at(-1)).toContain(
        "config.json not found. Make sure you're in a zkApp project directory."
      );
    } finally {
      await cleanup();
    }
  });

  test(`should not list deployment aliases if not within the project dir, @parallel @smoke @config @fail-cases`, async () => {
    const cliArg = 'config --list';
    const { execute, cleanup, path } = await prepareEnvironment();
    console.info(`[Test Execution] Path: ${path}`);

    try {
      const { stdout, code } = await execute('zk', cliArg);
      console.info(`[CLI StdOut] zk ${cliArg}: ${JSON.stringify(stdout)}`);
      expect(code).toBeGreaterThan(0);
      expect(stdout.at(-1)).toContain(
        "config.json not found. Make sure you're in a zkApp project directory."
      );
    } finally {
      await cleanup();
    }
  });

  test(`should list deployment aliases, @parallel @smoke @config`, async () => {
    const projectName = crypto.randomUUID();
    const { spawn, cleanup, path, execute } = await prepareEnvironment();
    console.info(`[Test Execution] Path: ${path}`);

    try {
      await test.step('Project generation', async () => {
        await zkProject(projectName, 'none', true, spawn);
      });
      await test.step('Deploy aliases listing', async () => {
        const cliArg = 'config --list';
        const { stdout, stderr, code } = await execute(
          'zk',
          cliArg,
          projectName
        );
        console.info(`[Config CLI StdOut] zk ${cliArg}: ${stdout}`);
        console.info(`[Config CLI StdErr] zk ${cliArg}: ${stderr}`);
        expect(code).toBe(0);
        expect(stdout.some((line) => line.includes('None found'))).toBeTruthy();
      });
    } finally {
      await cleanup();
    }
  });

  test(`should not create deployment alias if procedure was cancelled, @parallel @smoke @config @fail-cases`, async () => {
    const projectName = crypto.randomUUID();
    const networkId: NetworkId = 'testnet';
    const deploymentAlias = crypto.randomUUID();
    const feePayerAlias = crypto.randomUUID();
    const feePayerAccount = await acquireAvailableAccount();
    const minaGraphQlEndpoint = await getMinaGraphQlEndpoint();
    const { spawn, cleanup, path } = await prepareEnvironment();
    console.info(`[Test Execution] Path: ${path}`);

    try {
      await test.step('Project generation', async () => {
        await zkProject(projectName, 'none', true, spawn);
      });
      await test.step('Deployment alias creation cancellation', async () => {
        const { exitCode } = await zkConfig({
          processHandler: spawn,
          workDir: `${path}/${projectName}`,
          networkId,
          deploymentAlias,
          feePayerAlias,
          feePayerAccount,
          feePayerMgmtType: 'recover',
          minaGraphQlEndpoint,
          transactionFee: '0.01',
          interruptProcess: true,
          runFrom: `./${projectName}`,
          waitForCompletion: true,
        });
        expect(exitCode).toBeGreaterThan(0);
        expect(
          fs.existsSync(`${Constants.feePayerCacheDir}/${feePayerAlias}`)
        ).toBeFalsy();
        expect(TestConstants.defaultProjectConfig).toEqual(
          expect.objectContaining(
            JSON.parse(
              fs.readFileSync(`${path}/${projectName}/config.json`, 'utf8')
            )
          )
        );
      });
    } finally {
      // Just in case, should not be created as validated above
      cleanupFeePayerCacheByAlias(feePayerAlias);
      await releaseAcquiredAccount(feePayerAccount);
      await cleanup();
    }
  });

  test(`should properly validate input field values, @serial @smoke @config`, async () => {
    const projectName = crypto.randomUUID();
    const networkId: NetworkId = 'testnet';
    const deploymentAlias = crypto.randomUUID();
    const feePayerAlias = crypto.randomUUID();
    // Serial because of  the following new aliases
    const newDeploymentAlias = '  this is  the   deployment    alias  ';
    const newFeePayerAlias = '  this is  the   fee-payer    alias  ';
    const feePayerAccount = await acquireAvailableAccount();
    const feePayerMgmtType = 'recover';
    const minaGraphQlEndpoint = await getMinaGraphQlEndpoint();
    const transactionFee = '0.01';
    const { spawn, cleanup, path } = await prepareEnvironment();
    console.info(`[Test Execution] Path: ${path}`);

    try {
      await test.step('Project generation and deployment alias creation', async () => {
        await zkProject(projectName, 'none', true, spawn);
        await zkConfig({
          processHandler: spawn,
          workDir: `${path}/${projectName}`,
          networkId,
          deploymentAlias,
          feePayerAlias,
          feePayerAccount,
          feePayerMgmtType,
          minaGraphQlEndpoint,
          transactionFee,
          interruptProcess: false,
          runFrom: `./${projectName}`,
          waitForCompletion: true,
        });
      });
      await test.step('Input field values validation', async () => {
        const bypassCachedAccountSelectionInteractiveDialog = {
          'Use stored account': ['arrowDown', 'enter'],
        };

        const { exitCode, stdOut } = await maybeZkConfig({
          processHandler: spawn,
          runner: 'zk',
          command: 'config',
          runFrom: `./${projectName}`,
          waitForCompletion: true,
          interactiveDialog: {
            'Create a name (can be anything)': ['enter'],
            'Name is required': ['  ', 'enter'],
            'Name is required.': [
              'backSpace',
              'backSpace',
              deploymentAlias,
              'enter',
            ],
            'Name already exists': [
              ...Array.from(
                { length: deploymentAlias.length },
                () => 'backSpace'
              ),
              ` ${deploymentAlias} `,
              'enter',
            ],
            'Name already exists.': [
              'backSpace',
              'backSpace',
              ...Array.from(
                { length: deploymentAlias.length },
                () => 'backSpace'
              ),
              newDeploymentAlias,
              'enter',
            ],
            'Choose the target network': generateInputsForOptionSelection(
              networkId,
              Constants.networkIds
            ),
            'Set the Mina GraphQL API URL to deploy to': ['enter'],
            'Url is required.': [' ', 'enter'],
            'Url is required': ['backSpace', 'not-url', 'backSpace', 'enter'],
            'Enter a valid URL.': [
              ...Array.from({ length: 'not-url'.length }, () => 'backSpace'),
              minaGraphQlEndpoint,
              'enter',
            ],
            'Set transaction fee to use when deploying': ['enter'],
            'Fee is required': [' ', 'enter'],
            'Fee is required.': ['backSpace', ' -1 ', 'enter'],
            "Fee can't be negative": [
              'backSpace',
              'backSpace',
              'backSpace',
              'backSpace',
              `  ${transactionFee}  `,
              'enter',
            ],
            ...bypassCachedAccountSelectionInteractiveDialog,
            'Recover fee payer account from an existing base58 private key': [
              'enter',
            ],
            'Create an alias for this account': ['enter'],
            'Fee payer alias is required': [' ', 'enter'],
            'Fee payer alias is required.': [
              'backSpace',
              feePayerAlias,
              'enter',
            ],
            'already exists': [
              ...Array.from(
                { length: feePayerAlias.length },
                () => 'backSpace'
              ),
              ` ${feePayerAlias} `,
              'enter',
            ],
            'already exist': [
              ...Array.from(
                { length: ` ${feePayerAlias} `.length },
                () => 'backSpace'
              ),
              newFeePayerAlias,
              'enter',
            ],
            'Account private key (base58)': ['enter'],
            'Enter a valid private key': ['  ', 'enter'],
            'Enter a valid private key.': [
              'backSpace',
              'backSpace',
              `${feePayerAccount.sk.substring(
                0,
                feePayerAccount.sk.length - 1
              )}#`,
              'enter',
            ],
            // Yeah, not perfect text pattern but it's acceptable for the tests
            'Enter a valid private ke': [
              ...Array.from(
                { length: feePayerAccount.sk.length },
                () => 'backSpace'
              ),
              `  ${feePayerAccount.sk}  `,
              'enter',
            ],
          },
        });

        checkZkConfig({
          workDir: `${path}/${projectName}`,
          networkId,
          deploymentAlias: newDeploymentAlias,
          feePayerAlias: newFeePayerAlias,
          feePayerAccount,
          feePayerMgmtType,
          minaGraphQlEndpoint,
          transactionFee,
          stdOut,
          exitCode,
        });
      });
    } finally {
      cleanupFeePayerCacheByAlias(feePayerAlias);
      cleanupFeePayerCacheByAlias(newFeePayerAlias);
      await releaseAcquiredAccount(feePayerAccount);
      await cleanup();
    }
  });

  test(`should create deployment alias in case of no cached fee payer account available, @serial @smoke @config`, async () => {
    const projectName = crypto.randomUUID();
    const networkId: NetworkId = 'testnet';
    const deploymentAlias = crypto.randomUUID();
    const feePayerAlias = crypto.randomUUID();
    const feePayerAccount = await acquireAvailableAccount();
    const feePayerMgmtType = 'recover';
    const minaGraphQlEndpoint = await getMinaGraphQlEndpoint();
    const transactionFee = '0.01';
    const { spawn, cleanup, path } = await prepareEnvironment();
    console.info(`[Test Execution] Path: ${path}`);

    try {
      await test.step('Project generation', async () => {
        await zkProject(projectName, 'none', true, spawn);
      });
      await test.step('Cleanup Fee Payer cache', async () => {
        cleanupFeePayerCache();
      });
      await test.step('Deployment alias creation and results validation', async () => {
        const { exitCode, stdOut } = await zkConfig({
          processHandler: spawn,
          workDir: `${path}/${projectName}`,
          networkId,
          deploymentAlias,
          feePayerAlias,
          feePayerAccount,
          feePayerMgmtType,
          minaGraphQlEndpoint,
          transactionFee,
          interruptProcess: false,
          runFrom: `./${projectName}`,
          waitForCompletion: true,
        });
        checkZkConfig({
          workDir: `${path}/${projectName}`,
          networkId,
          deploymentAlias,
          feePayerAlias,
          feePayerAccount,
          feePayerMgmtType,
          minaGraphQlEndpoint,
          transactionFee,
          stdOut,
          exitCode,
        });
      });
    } finally {
      restoreFeePayerCache();
      await releaseAcquiredAccount(feePayerAccount);
      await cleanup();
    }
  });

  test(`should create deployment aliases using available fee payer account management approaches, @serial @smoke @config`, async () => {
    const projectName = crypto.randomUUID();
    const networkId: NetworkId = 'testnet';
    let deploymentAlias = crypto.randomUUID();
    let feePayerAlias = crypto.randomUUID();
    const feePayerAccount = await acquireAvailableAccount();
    const minaGraphQlEndpoint = await getMinaGraphQlEndpoint();
    const transactionFee = '0.01';
    const { spawn, cleanup, path } = await prepareEnvironment();
    console.info(`[Test Execution] Path: ${path}`);

    try {
      await test.step('Project generation', async () => {
        await zkProject(projectName, 'none', true, spawn);
      });
      await test.step('Cleanup Fee Payer cache', async () => {
        cleanupFeePayerCache();
      });
      for (const feePayerMgmtType of TestConstants.feePayerMgmtTypes) {
        deploymentAlias = crypto.randomUUID();
        if (feePayerMgmtType !== 'cached') {
          feePayerAlias = crypto.randomUUID();
        }
        await test.step(`Deployment alias creation (feePayerMgmtType=${feePayerMgmtType}) and results validation`, async () => {
          const { exitCode, stdOut } = await zkConfig({
            processHandler: spawn,
            workDir: `${path}/${projectName}`,
            networkId,
            deploymentAlias,
            feePayerAlias,
            feePayerAccount,
            feePayerMgmtType,
            minaGraphQlEndpoint,
            transactionFee,
            interruptProcess: false,
            runFrom: `./${projectName}`,
            waitForCompletion: true,
          });
          checkZkConfig({
            workDir: `${path}/${projectName}`,
            networkId,
            deploymentAlias,
            feePayerAlias,
            feePayerAccount,
            feePayerMgmtType,
            minaGraphQlEndpoint,
            transactionFee,
            stdOut,
            exitCode,
          });
        });
      }
      deploymentAlias = crypto.randomUUID();
      await test.step(`Deployment alias creation (feePayerMgmtType=another) and results validation`, async () => {
        const { exitCode, stdOut } = await zkConfig({
          processHandler: spawn,
          workDir: `${path}/${projectName}`,
          networkId,
          deploymentAlias,
          feePayerAlias,
          feePayerAccount,
          feePayerMgmtType: feePayerAlias,
          minaGraphQlEndpoint,
          transactionFee,
          interruptProcess: false,
          runFrom: `./${projectName}`,
          waitForCompletion: true,
        });
        checkZkConfig({
          workDir: `${path}/${projectName}`,
          networkId,
          deploymentAlias,
          feePayerAlias,
          feePayerAccount,
          feePayerMgmtType: feePayerAlias,
          minaGraphQlEndpoint,
          transactionFee,
          stdOut,
          exitCode,
        });
      });
    } finally {
      restoreFeePayerCache();
      await releaseAcquiredAccount(feePayerAccount);
      await cleanup();
    }
  });

  // TODO: https://github.com/o1-labs/zkapp-cli/issues/582
});
