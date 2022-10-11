const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const sh = require('shelljs');
const util = require('util');
const gittar = require('gittar');
const { prompt } = require('enquirer');
const { spawnSync } = require('child_process');
const { red, green, reset } = require('chalk');

const shExec = util.promisify(sh.exec);

/**
 * Create a new zkApp project with recommended dir structure, Prettier config,
 * testing lib, etc. Warns if already exists and does NOT overwrite.
 * @param {string} name  Desired dir name or path. Will recursively create
 *                       dirs without overwriting existing content, if needed.
 * @return {promise<void>}
 */
async function project({ name, ui }) {
  const isWindows = process.platform === 'win32';

  if (fs.existsSync(name)) {
    console.error(red(`Directory already exists. Not proceeding`));
    return;
  }

  // Git must be initialized before running `npm install` b/c Husky runs an
  // NPM `prepare` script to set up its pre-commit hook within `.git`.
  // Check before fetching project template, to not leave crud on user's system.
  if (!sh.which('git')) {
    console.error(red('Please ensure Git is installed, then try again.'));
    return;
  }

  let res;
  if (!ui) {
    try {
      res = await prompt({
        type: 'select',
        name: 'ui',
        choices: ['svelte', 'next', 'vue', 'empty', 'none'],
        message: (state) => {
          // Make the step text green upon success, else use the reset color.
          const style =
            state.submitted && !state.cancelled ? state.styles.success : reset;
          return style('Create an accompanying UI project too?');
        },
        prefix: (state) => {
          // Show a cyan question mark when not submitted.
          // Show a green check mark if submitted.
          // Show a red "x" if ctrl+C is pressed (default is a magenta).
          if (!state.submitted) return state.symbols.question;
          return !state.cancelled
            ? state.symbols.check
            : red(state.symbols.cross);
        },
      });
    } catch (err) {
      // If ctrl+c is pressed it will throw.
      return;
    }

    ui = res.ui;
  }

  sh.mkdir('-p', name); // Create path/to/dir with their desired name
  sh.cd(name); // Set dir for shell commands. Doesn't change user's dir in their CLI.

  // If user wants a UI framework installed alongside their smart contract,
  // we'll create this dir structure:
  //   /<name>     (with .git)
  //     ui/
  //     contracts/
  // - We use NPM for the UI projects for consistency with our smart contract
  //   project, as opposed to Yarn or PNPM.
  // - spawnSync with stdio:inherit allows the child process to be interactive.
  if (ui) {
    switch (ui) {
      case 'svelte':
        spawnSync('npm', ['create', 'svelte@latest', 'ui'], {
          stdio: 'inherit',
        });
        break;
      case 'next':
        // https://nextjs.org/docs/api-reference/create-next-app#options
        spawnSync('npx', ['create-next-app@latest', 'ui', '--use-npm'], {
          stdio: 'inherit',
        });
        shExec('rm -rf ui/.git'); // Remove NextJS' .git; we will init .git in our monorepo's root.
        break;
      case 'vue':
        spawnSync('npm', ['init', 'vue@latest', 'ui'], { stdio: 'inherit' });
        break;
      case 'empty':
        sh.mkdir('ui');
        break;
      case 'none':
        // `zk project <name>` now shows a dropdown to allow users to select
        // from available UI project options. Because of this, we also need
        // `--ui none` in order to allow devs to create a project w/o a UI.
        ui = false;
        break;
    }
    ora(green(`UI: Set up project`)).succeed();

    if (ui && ui !== 'empty') {
      // Use `install`, not `ci`, b/c these won't have package-lock.json yet.
      await step(
        'UI: NPM install',
        `npm install --prefix=ui --silent > ${
          isWindows ? 'NUL' : '"/dev/null" 2>&1'
        }`
      );
    }
  }

  // Initialize .git in the root, whether monorepo or not.
  await step('Initialize Git repo', 'git init -q');

  // Scaffold smart contract project
  if (ui) {
    sh.mkdir('contracts');
    sh.cd('contracts');
  }
  if (!(await fetchProjectTemplate())) return;

  // Make Husky work if using a monorepo. It needs some changes to work when
  // .git lives one dir level above package.json. Note that Husky's pre-commit
  // checks only apply to the contracts project, not to the UI, unless the dev
  // set that up themselves. It's more valuable for the smart contract.
  // Source: https://github.com/typicode/husky/issues/348#issuecomment-899344732
  if (ui) {
    // https://github.com/o1-labs/zkapp-cli/blob/main/templates/project-ts/package.json#L20
    let x = fs.readJSONSync(`package.json`);
    x.scripts.prepare = 'cd .. && husky install contracts/.husky';
    fs.writeJSONSync(`package.json`, x, { spaces: 2 });

    // https://github.com/o1-labs/zkapp-cli/blob/main/templates/project-ts/.husky/pre-commit#L3
    let y = fs.readFileSync(`.husky/pre-commit`, 'utf-8');
    const targetStr = 'husky.sh"\n';
    y = y.replace(targetStr, targetStr + '\ncd contracts');
    fs.writeFileSync(`.husky/pre-commit`, y, 'utf-8');
  }

  // `/dev/null` on Mac or Linux and 'NUL' on Windows is the only way to silence
  // Husky's install log msg. (Note: The contract project template commits
  // package-lock.json so we can use `npm ci` for faster installation.)
  await step(
    'NPM install',
    `npm ci --silent > ${isWindows ? 'NUL' : '"/dev/null" 2>&1'}`
  );

  await setProjectName('.', name.split(path.sep).pop());

  if (ui) sh.cd('..'); // back to project root

  // `-n` (no verify) skips Husky's pre-commit hooks.
  await step(
    'Git init commit',
    'git add . && git commit -m "Init commit" -q -n && git branch -m main'
  );

  const str =
    `\nSuccess!\n` +
    `\nNext steps:` +
    `\n  cd ${name}` +
    `\n  git remote add origin <your-repo-url>` +
    `\n  git push -u origin main`;

  console.log(green(str));
}

/**
 * Fetch project template.
 * @returns {promise<boolean>} True if successful; false if not.
 */
async function fetchProjectTemplate() {
  const projectName = 'project-ts';

  const step = 'Set up project';
  const spin = ora({ text: `${step}...`, discardStdin: true }).start();

  try {
    const src = 'github:o1-labs/zkapp-cli#main';
    await gittar.fetch(src, { force: true });

    // Note: Extract will overwrite any existing dir's contents. Ensure
    // destination does not exist before this.
    const TEMP = '.gittar-temp-dir';
    await gittar.extract(src, TEMP, {
      filter(path) {
        return path.includes(`templates/${projectName}/`);
      },
    });

    // Copy files into current working dir
    sh.cp(
      '-r',
      `${path.join(TEMP, 'templates', projectName)}${path.sep}.`,
      '.'
    );
    sh.rm('-r', TEMP);

    // Create a keys dir because it's not part of the project scaffolding given
    // we have `keys` in our .gitignore.
    sh.mkdir('keys');

    spin.succeed(green(step));
    return true;
  } catch (err) {
    spin.fail(step);
    console.error(err);
    return false;
  }
}

/**
 * Helper for any steps that need to call a shell command.
 * @param {string} step Name of step to show user
 * @param {string} cmd  Shell command to execute.
 * @returns {promise<void>}
 */
async function step(step, cmd) {
  const spin = ora({ text: `${step}...`, discardStdin: true }).start();
  try {
    await shExec(cmd);
    spin.succeed(green(step));
  } catch (err) {
    spin.fail(step);
  }
}

/**
 * Step to replace placeholder names in the project with the properly-formatted
 * version of the user-supplied name as specified via `zk project <name>`
 * @param {string} dir Path to the dir containing target files to be changed.
 * @param {string} name User-provided project name.
 * @returns {promise<void>}
 */
async function setProjectName(dir, name) {
  const step = 'Set project name';
  const spin = ora(`${step}...`).start();

  replaceInFile(path.join(dir, 'README.md'), 'PROJECT_NAME', titleCase(name));
  replaceInFile(
    path.join(dir, 'package.json'),
    'package-name',
    kebabCase(name)
  );

  spin.succeed(green(step));
}

/**
 * Helper to replace text in a file.
 * @param {string} file Path to file
 * @param {string} a    Old text.
 * @param {string} b    New text.
 */
function replaceInFile(file, a, b) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(a, b);
  fs.writeFileSync(file, content);
}

function titleCase(str) {
  return str
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase())
    .join(' ');
}

function kebabCase(str) {
  return str.toLowerCase().replace(' ', '-');
}

module.exports = {
  project,
  step,
  setProjectName,
  replaceInFile,
  titleCase,
  kebabCase,
};
