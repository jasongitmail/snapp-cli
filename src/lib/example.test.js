import { jest } from '@jest/globals';

jest.unstable_mockModule('chalk', () => ({
  default: {
    red: jest.fn((text) => `red: ${text}`),
    green: jest.fn((text) => `green: ${text}`),
  },
}));

jest.unstable_mockModule('enquirer', () => ({
  default: {
    prompt: jest.fn(),
  },
}));

jest.unstable_mockModule('fs-extra', () => ({
  default: {
    readJsonSync: jest.fn(),
    writeJsonSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    cpSync: jest.fn(),
    existsSync: jest.fn(),
  },
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
    exec: jest.fn(),
    which: jest.fn(),
    exit: jest.fn(),
    cd: jest.fn(),
    pwd: jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue('/current/path'),
    }),
    rm: jest.fn(),
    mv: jest.fn(),
    mkdir: jest.fn(),
  },
}));

jest.unstable_mockModule('./helpers.js', () => ({
  default: jest.fn(),
  isDirEmpty: jest.fn(),
  setupProject: jest.fn(),
  step: jest.fn(),
  replaceInFile: jest.fn(),
  titleCase: jest.fn(),
  kebabCase: jest.fn(),
  setProjectName: jest.fn(),
}));

jest.unstable_mockModule('util', () => ({
  promisify: jest.fn(),
}));

let fs, shell, enquirer, Constants, helpers, chalk;

beforeAll(async () => {
  fs = (await import('fs-extra')).default;
  shell = (await import('shelljs')).default;
  enquirer = (await import('enquirer')).default;
  chalk = (await import('chalk')).default;
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
  fs.readFileSync.mockReturnValue('old text');
  fs.readJsonSync.mockReturnValue({ scripts: {} });
  jest.spyOn(process, 'exit').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('example.js', () => {
  describe('example()', () => {
    it('should exit if Git is not installed', async () => {
      shell.which.mockReturnValue(false);
      enquirer.prompt.mockResolvedValue({ example: 'sudoku' });
      const { default: example } = await import('./example.js');

      await example();

      expect(console.error).toHaveBeenCalledWith(
        'red: Please ensure Git is installed, then try again.'
      );
      expect(shell.exit).toHaveBeenCalledWith(1);
    });

    it('should prompt for example type if none is provided', async () => {
      shell.which.mockReturnValue(true);
      enquirer.prompt.mockResolvedValue({ example: 'sudoku' });
      fs.existsSync.mockReturnValueOnce(false).mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      helpers.isDirEmpty.mockReturnValue(false);
      shell.exec.mockResolvedValue({ code: 0 });
      const { default: example } = await import('./example.js');

      await example();

      expect(enquirer.prompt).toHaveBeenCalledWith({
        type: 'select',
        name: 'example',
        choices: Constants.exampleTypes,
        message: expect.any(Function),
        prefix: expect.any(Function),
      });
      expect(shell.cd).toHaveBeenCalledWith('sudoku');
      expect(helpers.setupProject).toHaveBeenCalled();
      expect(helpers.step).toHaveBeenCalled();
    });

    it('should exit if setupProject fails', async () => {
      shell.which.mockReturnValue(true);
      enquirer.prompt.mockResolvedValue({ example: 'sudoku' });
      fs.existsSync.mockReturnValueOnce(false).mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(false);
      const { default: example } = await import('./example.js');

      await example();

      expect(shell.exit).toHaveBeenCalledWith(1);
    });

    it('should exit if updateExampleSources fails', async () => {
      shell.which.mockReturnValue(true);
      enquirer.prompt.mockResolvedValue({ example: 'sudoku' });
      fs.existsSync.mockReturnValueOnce(false).mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      helpers.isDirEmpty.mockReturnValue(true);
      const { default: example } = await import('./example.js');

      await example();

      expect(shell.exit).toHaveBeenCalledWith(1);
    });

    it('should initialize Git repo and perform npm install', async () => {
      shell.which.mockReturnValue(true);
      enquirer.prompt.mockResolvedValue({ example: 'sudoku' });
      fs.existsSync.mockReturnValueOnce(false).mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      helpers.isDirEmpty.mockReturnValue(false);
      const stepMock = jest.fn(async (name, fn) => {
        Promise.resolve(fn());
      });
      helpers.step.mockImplementation(stepMock);
      const { default: example } = await import('./example.js');

      await example();

      expect(shell.cd).toHaveBeenCalledWith('sudoku');
      const calls = shell.exec.mock.calls;
      expect(calls[0][0]).toBe('git init -q');
      expect(calls[1][0]).toBe('npm install --silent > "/dev/null" 2>&1');
      expect(calls[2][0]).toBe(
        'git add . && git commit -m "Init commit" -q -n && git branch -m main'
      );
    });

    it('should initialize Git repo and perform npm install with NUL redirect on Windows', async () => {
      const originalPlatform = process.platform;
      try {
        shell.which.mockReturnValue(true);
        enquirer.prompt.mockResolvedValue({ example: 'sudoku' });
        fs.existsSync.mockReturnValueOnce(false).mockReturnValue(true);
        helpers.setupProject.mockResolvedValue(true);
        helpers.isDirEmpty.mockReturnValue(false);
        const stepMock = jest.fn(async (name, fn) => {
          Promise.resolve(fn());
        });
        helpers.step.mockImplementation(stepMock);

        Object.defineProperty(process, 'platform', {
          value: 'win32',
        });
        const { default: example } = await import('./example.js');

        await example();

        expect(shell.cd).toHaveBeenCalledWith('sudoku');
        const calls = shell.exec.mock.calls;
        expect(calls[0][0]).toBe('git init -q');
        expect(calls[1][0]).toBe('npm install --silent > NUL');
        expect(calls[2][0]).toBe(
          'git add . && git commit -m "Init commit" -q -n && git branch -m main'
        );
      } finally {
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        });
      }
    });

    it('should exit with code 0 on success', async () => {
      jest.spyOn(shell, 'which').mockReturnValue(true);
      enquirer.prompt.mockResolvedValue({ example: 'sudoku' });
      fs.existsSync.mockReturnValueOnce(false).mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      helpers.isDirEmpty.mockReturnValue(false);
      shell.exec.mockImplementation((cmd, callback) => callback(0, '', ''));
      const { default: example } = await import('./example.js');

      await example();

      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should succeed when called with an example name', async () => {
      jest.spyOn(shell, 'which').mockReturnValue(true);
      fs.existsSync.mockReturnValueOnce(false).mockReturnValue(true);
      helpers.setupProject.mockResolvedValue(true);
      helpers.isDirEmpty.mockReturnValue(false);
      const { default: example } = await import('./example.js');

      await example('sudoku');

      expect(shell.cd).toHaveBeenCalledWith('sudoku');
      const calls = shell.exec.mock.calls;
      expect(calls[0][0]).toBe('git init -q');
      expect(calls[1][0]).toBe('npm install --silent > "/dev/null" 2>&1');
      expect(calls[2][0]).toBe(
        'git add . && git commit -m "Init commit" -q -n && git branch -m main'
      );
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should style the prompt message correctly based on state', async () => {
      shell.which.mockReturnValue(true);
      fs.existsSync.mockReturnValue(false); // Prevent infinite recursion in findUniqueDir
      helpers.setupProject.mockResolvedValue(true);
      helpers.isDirEmpty.mockReturnValue(false);
      const mockState = {
        submitted: true,
        cancelled: false,
        styles: {
          success: jest.fn((text) => `success: ${text}`),
        },
        symbols: {
          question: '?',
          check: '✔',
          cross: '✖',
        },
      };
      const { default: example } = await import('./example.js');

      // Test case when state is submitted and not cancelled
      enquirer.prompt.mockResolvedValueOnce({ example: 'sudoku' });
      await example();
      const firstCall = enquirer.prompt.mock.calls[0][0];
      expect(firstCall.message(mockState)).toBe('success: Choose an example');

      // Test case when state is not submitted
      enquirer.prompt.mockResolvedValueOnce({ example: 'sudoku' });
      await example();
      const secondCall = enquirer.prompt.mock.calls[1][0];
      expect(secondCall.prefix({ ...mockState, submitted: false })).toBe('?');

      // Test case when state is submitted and cancelled
      enquirer.prompt.mockResolvedValueOnce({ example: 'sudoku' });
      await example();
      const thirdCall = enquirer.prompt.mock.calls[2][0];
      expect(thirdCall.prefix({ ...mockState, cancelled: true })).toBe(
        'red: ✖'
      );

      // Test case when state is submitted and not cancelled
      enquirer.prompt.mockResolvedValueOnce({ example: 'sudoku' });
      await example();
      const fourthCall = enquirer.prompt.mock.calls[3][0];
      expect(fourthCall.prefix(mockState)).toBe('✔');

      // Test case when state is neither submitted nor cancelled (chalk.reset)
      const mockStateReset = {
        ...mockState,
        submitted: false,
        cancelled: false,
      };
      chalk.reset = jest.fn((text) => `reset: ${text}`);
      enquirer.prompt.mockResolvedValueOnce({ example: 'sudoku' });
      await example();
      const fifthCall = enquirer.prompt.mock.calls[4][0];
      expect(fifthCall.message(mockStateReset)).toBe(
        'reset: Choose an example'
      );
    });
  });

  describe('addStartScript()', () => {
    it('should add start script to package.json', async () => {
      const originalPackageJsonContent = {
        scripts: {
          other: 'command',
        },
      };
      let updatedPackageJsonContent;
      fs.readJsonSync.mockReturnValue(originalPackageJsonContent);
      fs.writeJsonSync.mockImplementation((filePath, json) => {
        if (filePath.includes('package.json')) {
          updatedPackageJsonContent = json;
        }
      });
      const { addStartScript } = await import('./example.js');

      addStartScript('/path/to/package.json');

      expect(fs.writeJsonSync).toHaveBeenCalledWith(
        '/path/to/package.json',
        updatedPackageJsonContent,
        { spaces: 2 }
      );
      expect(updatedPackageJsonContent.scripts.start).toBe(
        'node build/src/run.js'
      );
    });
  });

  describe('updateExampleSources()', () => {
    it('should update example sources and return true on success', async () => {
      helpers.isDirEmpty.mockReturnValue(false);
      fs.cpSync.mockImplementation(() => {});
      const { updateExampleSources } = await import('./example.js');

      const result = await updateExampleSources('sudoku', 'dir');

      expect(result).toBe(true);
    });

    it('should return false if example not found', async () => {
      helpers.isDirEmpty.mockReturnValue(true);
      const { updateExampleSources } = await import('./example.js');

      const result = await updateExampleSources('sudoku', 'dir');

      expect(result).toBe(false);
    });

    it('should return false and log error if fs operation throws', async () => {
      helpers.isDirEmpty.mockReturnValue(false);
      fs.cpSync.mockImplementation(() => {
        throw new Error('Test error');
      });
      const { updateExampleSources } = await import('./example.js');

      const result = await updateExampleSources('sudoku', 'dir');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(new Error('Test error'));
    });
  });

  describe('findUniqueDir()', () => {
    it('should return unique directory name', async () => {
      fs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
      const { findUniqueDir } = await import('./example.js');

      const result = findUniqueDir('dir');

      expect(result).toBe('dir1');
    });
  });
});
