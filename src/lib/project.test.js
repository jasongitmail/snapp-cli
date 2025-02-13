import { jest } from '@jest/globals';

jest.unstable_mockModule('chalk', () => ({
  default: {
    red: jest.fn((text) => `red: ${text}`),
    green: jest.fn((text) => `green: ${text}`),
    reset: jest.fn((text) => `reset: ${text}`),
  },
}));

jest.unstable_mockModule('enquirer', () => ({
  default: {
    prompt: jest.fn(),
  },
}));

jest.unstable_mockModule('fs-extra', () => ({
  default: {
    existsSync: jest.fn(),
    mkdir: jest.fn(),
    cd: jest.fn(),
    readJsonSync: jest.fn(),
    writeJSONSync: jest.fn(),
    copySync: jest.fn(),
    writeFileSync: jest.fn(),
    readFileSync: jest.fn(),
    emptyDirSync: jest.fn(),
    mkdirsSync: jest.fn(),
    mkdirSync: jest.fn(),
  },
}));

jest.unstable_mockModule('node:child_process', () => ({
  spawnSync: jest.fn(),
}));

jest.unstable_mockModule('path', () => ({
  join: jest.fn(),
  dirname: jest.fn(),
  resolve: jest.fn(),
  sep: '/',
}));

jest.unstable_mockModule('url', () => ({
  fileURLToPath: jest.fn(),
}));

jest.unstable_mockModule('ora', () => ({
  default: () => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn(),
    fail: jest.fn(),
  }),
}));

jest.unstable_mockModule('shelljs', () => ({
  default: {
    which: jest.fn(),
    exit: jest.fn(),
    mkdir: jest.fn(),
    cd: jest.fn(),
    exec: jest.fn(),
    rm: jest.fn(),
    pwd: jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue('/current/path'),
    }),
    cp: jest.fn(),
    mv: jest.fn(),
  },
}));

jest.unstable_mockModule('util', () => ({
  promisify: jest.fn(),
}));

jest.unstable_mockModule('./helpers.js', () => ({
  setProjectName: jest.fn(),
  setupProject: jest.fn(),
  step: jest.fn(),
}));

let fs, shell, enquirer, Constants, helpers, spawnSync;

beforeAll(async () => {
  const child_process = await import('node:child_process');
  spawnSync = child_process.spawnSync;
  fs = (await import('fs-extra')).default;
  shell = (await import('shelljs')).default;
  enquirer = (await import('enquirer')).default;
  Constants = (await import('./constants.js')).default;
  helpers = await import('./helpers.js');
});

beforeEach(() => {
  jest.clearAllMocks();
  global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
  spawnSync.mockImplementation(() => {
    return JSON.stringify({ status: 0 });
  });
  jest.spyOn(process, 'exit').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('project.js', () => {
  describe('project()', () => {
    it('should exit if directory already exists', async () => {
      fs.existsSync.mockReturnValue(true);
      shell.which.mockReturnValue(false);
      shell.exit.mockImplementation(() => {
        throw new Error('process.exit');
      });
      const { default: project } = await import('./project.js');

      await expect(
        project({ name: 'test-project', ui: 'next' })
      ).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith(
        'red: Directory already exists. Not proceeding'
      );
      expect(shell.exit).toHaveBeenCalledWith(1);
    });

    it('should exit if Git is not installed', async () => {
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(false);
      shell.exit.mockImplementation(() => {
        throw new Error('process.exit');
      });
      const { default: project } = await import('./project.js');

      await expect(
        project({ name: 'test-project', ui: 'next' })
      ).rejects.toThrow('process.exit');

      expect(console.error).toHaveBeenCalledWith(
        'red: Please ensure Git is installed, then try again.'
      );
      expect(shell.exit).toHaveBeenCalledWith(1);
    });

    it('should throw if failed to setup the GH Pages for Next.js UI', async () => {
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(true);
      const mockMessage = jest.fn(() => 'Message');
      const mockPrefix = jest.fn(() => `Prefix`);
      enquirer.prompt.mockImplementation(async ({ message, prefix }) => {
        await message(mockMessage);
        await prefix(mockPrefix);
        return { ui: 'none' };
      });
      const { default: project } = await import('./project.js');

      await expect(
        project({ name: 'test-project', ui: 'next' })
      ).rejects.toThrow();
      expect(console.error).toHaveBeenCalledWith('red: Aborted');
    });

    it('should exit if UI selection throws', async () => {
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(true);
      const mockMessage = jest.fn(() => 'Message');
      const mockPrefix = jest.fn(() => `Prefix`);
      enquirer.prompt.mockImplementation(async ({ message, prefix }) => {
        await message(mockMessage);
        await prefix(mockPrefix);
        return { ui: 'none' };
      });
      const { default: project } = await import('./project.js');

      await project({ name: 'test-project' });

      expect(console.error).toHaveBeenCalledWith('red: Aborted');
    });

    it('should prompt for UI type if not provided (Next.js UI, TypeScript)', async () => {
      const stepMock = jest.fn(async (name, fn) => {
        Promise.resolve(fn());
      });
      helpers.step.mockImplementation(stepMock);
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      enquirer.prompt
        .mockResolvedValueOnce({ ui: 'next' })
        .mockResolvedValueOnce({ useGHPages: 'no' });
      fs.readFileSync.mockImplementation(() => {
        return '';
      });
      fs.readJsonSync.mockReturnValue({ scripts: {} });
      const { default: project } = await import('./project.js');

      await project({ name: 'test-project' });

      expect(shell.mkdir).toHaveBeenCalledWith('-p', 'test-project');
      expect(shell.cd).toHaveBeenCalledWith('test-project');
      expect(spawnSync).toHaveBeenCalledWith(
        'npx',
        [
          'create-next-app@14.2.12',
          'ui',
          '--use-npm',
          '--no-src-dir',
          '--ts',
          '--import-alias "@/*"',
          '--app',
        ],
        {
          stdio: 'inherit',
          shell: true,
        }
      );
      expect(shell.cd).toHaveBeenCalledWith('contracts');
      expect(enquirer.prompt).toHaveBeenCalledWith({
        type: 'select',
        name: 'ui',
        choices: Constants.uiTypes,
        message: expect.any(Function),
        prefix: expect.any(Function),
      });
      checkUiProjectSetup(shell.exec.mock.calls);
      checkIfProjectSetupSuccessful();
    });

    it('should setup the project (Next.js UI, JavaScript)', async () => {
      const stepMock = jest.fn(async (name, fn) => {
        Promise.resolve(fn());
      });
      helpers.step.mockImplementation(stepMock);
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      enquirer.prompt
        .mockResolvedValueOnce({ ui: 'next' })
        .mockResolvedValueOnce({ useGHPages: 'no' });
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('tsconfig.json')) {
          const error = new Error();
          error.code = 'ENOENT';
          throw error;
        }
        return '';
      });
      fs.readJsonSync.mockReturnValue({ scripts: {} });
      const { default: project } = await import('./project.js');

      await project({ name: 'test-project' });

      checkIfProjectSetupSuccessful();
    });

    it('should setup the project (Next.js UI, JavaScript, no logs on error)', async () => {
      const stepMock = jest.fn(async (name, fn) => {
        Promise.resolve(fn());
      });
      helpers.step.mockImplementation(stepMock);
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      enquirer.prompt
        .mockResolvedValueOnce({ ui: 'next' })
        .mockResolvedValueOnce({ useGHPages: 'no' });
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('tsconfig.json')) {
          const error = new Error();
          error.code = 'EACCES';
          throw error;
        }
        return '';
      });
      fs.readJsonSync.mockReturnValue({ scripts: {} });
      const { default: project } = await import('./project.js');

      await project({ name: 'test-project' });

      checkIfProjectSetupSuccessful();
    });

    it('should setup the project (Next.js UI with GH Pages, TypeScript)', async () => {
      const stepMock = jest.fn(async (name, fn) => {
        Promise.resolve(fn());
      });
      helpers.step.mockImplementation(stepMock);
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      enquirer.prompt
        .mockResolvedValueOnce({ ui: 'next' })
        .mockResolvedValueOnce({ useGHPages: 'yes' });
      fs.readFileSync.mockImplementation(() => {
        return '';
      });
      fs.readJsonSync.mockReturnValue({ scripts: {} });
      const { default: project } = await import('./project.js');

      await project({ name: 'test-project' });

      checkIfProjectSetupSuccessful();
    });

    it('should setup the project (Next.js UI with GH Pages, JavaScript)', async () => {
      const stepMock = jest.fn(async (name, fn) => {
        Promise.resolve(fn());
      });
      helpers.step.mockImplementation(stepMock);
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      enquirer.prompt
        .mockResolvedValueOnce({ ui: 'next' })
        .mockResolvedValueOnce({ useGHPages: 'yes' });
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('tsconfig.json')) {
          throw new Error();
        }
        return '';
      });
      fs.readJsonSync.mockReturnValue({ scripts: {} });
      const { default: project } = await import('./project.js');

      await project({ name: 'test-project' });

      checkIfProjectSetupSuccessful();
    });

    it('should setup the project (Next.js UI with GH Pages and NUL redirect on Windows)', async () => {
      const originalPlatform = process.platform;
      try {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        });
        const stepMock = jest.fn(async (name, fn) => {
          Promise.resolve(fn());
        });
        helpers.step.mockImplementation(stepMock);
        fs.existsSync.mockReturnValue(false);
        shell.which.mockReturnValue(true);
        helpers.setupProject.mockResolvedValue(true);
        enquirer.prompt
          .mockResolvedValueOnce({ ui: 'next' })
          .mockResolvedValueOnce({ useGHPages: 'yes' });
        fs.readFileSync.mockImplementation(() => {
          return '';
        });
        fs.readJsonSync.mockReturnValue({ scripts: {} });
        const { default: project } = await import('./project.js');

        await project({ name: 'test-project' });

        checkIfProjectSetupSuccessful();
      } finally {
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        });
      }
    });

    it('should setup the project (SvelteKit UI, TypeScript)', async () => {
      const stepMock = jest.fn(async (name, fn) => {
        Promise.resolve(fn());
      });
      helpers.step.mockImplementation(stepMock);
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      fs.readJsonSync.mockReturnValue({ scripts: {} });
      fs.readFileSync.mockImplementation(() => {
        return '';
      });
      const { default: project } = await import('./project.js');

      await project({ name: 'test-project', ui: 'svelte' });

      expect(shell.mkdir).toHaveBeenCalledWith('-p', 'test-project');
      expect(shell.cd).toHaveBeenCalledWith('test-project');
      expect(spawnSync).toHaveBeenCalledWith('npx', ['sv', 'create', 'ui'], {
        stdio: 'inherit',
        shell: true,
      });
      expect(shell.cd).toHaveBeenCalledWith('contracts');
      checkUiProjectSetup(shell.exec.mock.calls);
      checkIfProjectSetupSuccessful();
    });

    it('should setup the project (SvelteKit UI, JavaScript, no logs on error)', async () => {
      const stepMock = jest.fn(async (name, fn) => {
        Promise.resolve(fn());
      });
      helpers.step.mockImplementation(stepMock);
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      fs.readJsonSync.mockReturnValue({ scripts: {}, dependencies: {} });
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('tsconfig.json')) {
          const error = new Error();
          error.code = 'EACCES';
          throw error;
        }
        return '';
      });
      const { default: project } = await import('./project.js');

      await project({ name: 'test-project', ui: 'svelte' });

      checkIfProjectSetupSuccessful();
    });

    it('should setup the project (SvelteKit UI, JavaScript)', async () => {
      const stepMock = jest.fn(async (name, fn) => {
        Promise.resolve(fn());
      });
      helpers.step.mockImplementation(stepMock);
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      fs.readJsonSync.mockReturnValue({ scripts: {}, dependencies: {} });
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('tsconfig.json')) {
          const error = new Error();
          error.code = 'ENOENT';
          throw error;
        }
        return '';
      });
      const { default: project } = await import('./project.js');

      await project({ name: 'test-project', ui: 'svelte' });

      checkIfProjectSetupSuccessful();
    });

    it('should setup the project (NuxtJS UI, without default Git init)', async () => {
      const stepMock = jest.fn(async (name, fn) => {
        Promise.resolve(fn());
      });
      helpers.step.mockImplementation(stepMock);
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      fs.readFileSync.mockImplementation(() => {
        return '';
      });
      const { default: project } = await import('./project.js');

      await project({ name: 'test-project', ui: 'nuxt' });

      expect(shell.mkdir).toHaveBeenCalledWith('-p', 'test-project');
      expect(shell.cd).toHaveBeenCalledWith('test-project');
      expect(spawnSync).toHaveBeenCalledWith('npx', ['nuxi', 'init', 'ui'], {
        stdio: 'inherit',
        shell: true,
      });
      expect(shell.cd).toHaveBeenCalledWith('contracts');
      checkUiProjectSetup(shell.exec.mock.calls);
      checkIfProjectSetupSuccessful();
    });

    it('should setup the project (NuxtJS UI, with default Git init)', async () => {
      const stepMock = jest.fn(async (name, fn) => {
        Promise.resolve(fn());
      });
      helpers.step.mockImplementation(stepMock);
      fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
      shell.which.mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      fs.readFileSync.mockImplementation(() => {
        return '';
      });
      const { default: project } = await import('./project.js');

      await project({ name: 'test-project', ui: 'nuxt' });

      checkIfProjectSetupSuccessful();
    });

    it('should perform npm install with NUL redirect on Windows', async () => {
      const originalPlatform = process.platform;
      try {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        });
        const stepMock = jest.fn(async (name, fn) => {
          Promise.resolve(fn());
        });
        helpers.step.mockImplementation(stepMock);
        fs.existsSync.mockReturnValue(false);
        shell.which.mockReturnValue(true);
        helpers.setupProject.mockResolvedValue(true);
        enquirer.prompt.mockResolvedValueOnce({ useGHPages: 'no' });
        fs.readFileSync.mockImplementation((path) => {
          if (path.includes('tsconfig.json')) {
            return 'tsconfig.json content';
          } else if (path.includes('next.config.mjs')) {
            return 'next.config.mjs content';
          }
          return '';
        });
        fs.readJsonSync.mockReturnValue({ scripts: {} });
        const { default: project } = await import('./project.js');

        await project({ name: 'test-project', ui: 'next' });

        checkUiProjectSetup(shell.exec.mock.calls, true);
      } finally {
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        });
      }
    });

    it('should setup the project (no UI)', async () => {
      const stepMock = jest.fn(async (name, fn) => {
        Promise.resolve(fn());
      });
      helpers.step.mockImplementation(stepMock);
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      const { default: project } = await import('./project.js');

      await project({ name: 'test-project', ui: 'none' });

      checkProjectSetupNoUi(shell.exec.mock.calls);
      checkIfProjectSetupSuccessful();
    });

    it('should setup the project with undefined UI', async () => {
      const stepMock = jest.fn(async (name, fn) => {
        Promise.resolve(fn());
      });
      helpers.step.mockImplementation(stepMock);
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      enquirer.prompt.mockResolvedValueOnce({ ui: undefined });
      fs.readJsonSync.mockReturnValue({ scripts: {} });
      const { default: project } = await import('./project.js');

      await project({ name: 'test-project' });

      checkIfProjectSetupSuccessful();
    });

    it('should setup the project with empty UI', async () => {
      const stepMock = jest.fn(async (name, fn) => {
        Promise.resolve(fn());
      });
      helpers.step.mockImplementation(stepMock);
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      const { default: project } = await import('./project.js');

      await project({ name: 'test-project', ui: 'empty' });

      checkProjectSetupNoUi(shell.exec.mock.calls);
      checkIfProjectSetupSuccessful();
    });

    it('should exit with code 1 if setupProject fails', async () => {
      const stepMock = jest.fn(async (name, fn) => {
        Promise.resolve(fn());
      });
      helpers.step.mockImplementation(stepMock);
      fs.existsSync.mockReturnValue(false);
      shell.which.mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(false);
      shell.exit.mockImplementation(() => {
        throw new Error('process.exit');
      });
      const { default: project } = await import('./project.js');

      await expect(
        project({ name: 'test-project', ui: 'none' })
      ).rejects.toThrow('process.exit');
      expect(shell.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('scaffoldNext()', () => {
    it('should set up a Next.js project', async () => {
      const mockRun = jest.fn().mockResolvedValue('no');
      jest.spyOn(enquirer, 'prompt').mockImplementation(() => ({
        run: mockRun,
      }));
      fs.existsSync.mockReturnValue(false);
      shell.rm.mockReturnValue(true);
      shell.cp.mockReturnValue(true);
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('tsconfig.json')) {
          return 'tsconfig.json content';
        } else if (path.includes('next.config.mjs')) {
          return 'next.config.mjs content';
        }
        return '';
      });
      fs.writeFileSync.mockImplementation(() => {});
      fs.readJsonSync.mockReturnValue({ scripts: {} });
      fs.writeJSONSync.mockImplementation(() => {});

      const { scaffoldNext } = await import('./project.js');

      await scaffoldNext('test-project');

      expect(enquirer.prompt).toHaveBeenCalledWith({
        type: 'select',
        name: 'useGHPages',
        choices: ['no', 'yes'],
        message: expect.any(Function),
        prefix: expect.any(Function),
      });
      expect(spawnSync).toHaveBeenCalledWith(
        'npx',
        [
          'create-next-app@14.2.24',
          'ui',
          '--use-npm',
          '--no-src-dir',
          '--ts',
          '--import-alias "@/*"',
          '--app',
        ],
        {
          stdio: 'inherit',
          shell: true,
        }
      );
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('scaffoldNuxt()', () => {
    it('should set up a Nuxt.js project', async () => {
      fs.existsSync.mockReturnValue(false);
      shell.rm.mockReturnValue(true);
      shell.cp.mockReturnValue(true);
      fs.mkdirSync.mockReturnValue(true);
      fs.copySync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => 'nuxt.config.ts content');
      fs.writeFileSync.mockImplementation(() => {});
      const { scaffoldNuxt } = await import('./project.js');

      scaffoldNuxt();

      expect(spawnSync).toHaveBeenCalledWith('npx', ['nuxi', 'init', 'ui'], {
        stdio: 'inherit',
        shell: true,
      });
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('scaffoldSvelte()', () => {
    it('should set up a SvelteKit project', async () => {
      fs.existsSync.mockReturnValue(false);
      shell.cp.mockReturnValue(true);
      fs.readFileSync.mockImplementation((path) => {
        if (path.includes('tsconfig.json')) {
          return 'tsconfig.json content';
        }
        return '';
      });
      fs.writeFileSync.mockImplementation(() => {});
      fs.copySync.mockReturnValue(true);
      fs.mkdirsSync.mockReturnValue(true);
      fs.emptyDirSync.mockReturnValue(true);
      const { scaffoldSvelte } = await import('./project.js');

      scaffoldSvelte();

      expect(spawnSync).toHaveBeenCalledWith('npx', ['sv', 'create', 'ui'], {
        stdio: 'inherit',
        shell: true,
      });
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('message()', () => {
    it('should return styled message based on state', async () => {
      const { message } = await import('./project.js');

      const resultSuccess = message(
        {
          submitted: true,
          cancelled: false,
          styles: { success: (text) => `success: ${text}` },
        },
        'Test Message'
      );
      const resultReset = message(
        {
          submitted: false,
          cancelled: false,
          styles: { success: (text) => `success: ${text}` },
        },
        'Test Message'
      );

      expect(resultSuccess).toBe('success: Test Message');
      expect(resultReset).toBe('reset: Test Message');
    });
  });

  describe('prefix()', () => {
    it('should return appropriate prefix based on state', async () => {
      const { prefix } = await import('./project.js');

      const resultQuestion = prefix({
        submitted: false,
        cancelled: false,
        symbols: { question: '?', check: '✔', cross: '✖' },
      });
      const resultCheck = prefix({
        submitted: true,
        cancelled: false,
        symbols: { question: '?', check: '✔', cross: '✖' },
      });
      const resultCross = prefix({
        submitted: true,
        cancelled: true,
        symbols: { question: '?', check: '✔', cross: '✖' },
      });

      expect(resultQuestion).toBe('?');
      expect(resultCheck).toBe('✔');
      expect(resultCross).toBe('red: ✖');
    });
  });
});

function checkProjectSetupNoUi(shellExecCalls) {
  expect(shellExecCalls[0][0]).toBe('git init -q');
  expect(shellExecCalls[1][0]).toBe('npm install --silent > "/dev/null" 2>&1');
  expect(shellExecCalls[2][0]).toBe('npm run build --silent');
  expect(shellExecCalls[3][0]).toBe(
    'git add . && git commit -m "Init commit" -q -n && git branch -m main'
  );
}

function checkUiProjectSetup(shellExecCalls, isWindows = false) {
  expect(shellExecCalls[0][0]).toBe(
    'npm install --silent > ' + (isWindows ? 'NUL' : '"/dev/null" 2>&1')
  );
  expect(shellExecCalls[1][0]).toBe('git init -q');
  expect(shellExecCalls[2][0]).toBe(
    'npm install --silent > ' + (isWindows ? 'NUL' : '"/dev/null" 2>&1')
  );
  expect(shellExecCalls[3][0]).toBe('npm run build --silent');
  expect(shellExecCalls[4][0]).toBe(
    'git add . && git commit -m "Init commit" -q -n && git branch -m main'
  );
}

function checkIfProjectSetupSuccessful() {
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('Success!\n\nNext steps:')
  );
}
