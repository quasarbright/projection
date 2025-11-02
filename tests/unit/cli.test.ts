import { CLI } from '../../src/cli/index';

// Mock the command modules
jest.mock('../../src/cli/init', () => ({
  init: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../src/cli/build', () => ({
  build: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../src/cli/dev', () => ({
  dev: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../src/cli/serve', () => ({
  serve: jest.fn().mockResolvedValue(undefined)
}));

import { init } from '../../src/cli/init';
import { build } from '../../src/cli/build';
import { dev } from '../../src/cli/dev';
import { serve } from '../../src/cli/serve';

describe('CLI', () => {
  let cli: CLI;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    cli = new CLI('1.0.0');
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('Command routing', () => {
    it('should route to init command', async () => {
      await cli.run(['init']);

      expect(init).toHaveBeenCalledTimes(1);
      expect(init).toHaveBeenCalledWith({});
    });

    it('should route to build command', async () => {
      await cli.run(['build']);

      expect(build).toHaveBeenCalledTimes(1);
      expect(build).toHaveBeenCalledWith({});
    });

    it('should route to dev command', async () => {
      await cli.run(['dev']);

      expect(dev).toHaveBeenCalledTimes(1);
      expect(dev).toHaveBeenCalledWith({});
    });

    it('should route to serve command', async () => {
      await cli.run(['serve']);

      expect(serve).toHaveBeenCalledTimes(1);
      expect(serve).toHaveBeenCalledWith({});
    });
  });

  describe('Argument parsing', () => {
    it('should parse boolean flags', async () => {
      await cli.run(['init', '--force', '--minimal']);

      expect(init).toHaveBeenCalledWith({
        force: true,
        minimal: true
      });
    });

    it('should parse key-value options', async () => {
      await cli.run(['build', '--config', 'custom.js', '--output', 'dist']);

      expect(build).toHaveBeenCalledWith({
        config: 'custom.js',
        output: 'dist'
      });
    });

    it('should parse mixed boolean and key-value options', async () => {
      await cli.run(['dev', '--port', '3000', '--no-open']);

      expect(dev).toHaveBeenCalledWith({
        port: '3000',
        noOpen: true
      });
    });

    it('should convert kebab-case to camelCase', async () => {
      await cli.run(['dev', '--no-open']);

      expect(dev).toHaveBeenCalledWith({
        noOpen: true
      });
    });

    it('should handle numeric values as strings', async () => {
      await cli.run(['serve', '--port', '8080']);

      expect(serve).toHaveBeenCalledWith({
        port: '8080'
      });
    });

    it('should handle multiple options', async () => {
      await cli.run(['build', '--config', 'my.config.js', '--output', 'public', '--clean']);

      expect(build).toHaveBeenCalledWith({
        config: 'my.config.js',
        output: 'public',
        clean: true
      });
    });
  });

  describe('Help display', () => {
    it('should show help with --help flag', async () => {
      await cli.run(['--help']);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('Projection - Static Site Generator');
      expect(output).toContain('USAGE:');
      expect(output).toContain('COMMANDS:');
      expect(output).toContain('init');
      expect(output).toContain('build');
      expect(output).toContain('dev');
      expect(output).toContain('serve');
    });

    it('should show help with -h flag', async () => {
      await cli.run(['-h']);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('Projection - Static Site Generator');
    });

    it('should show help when no command provided', async () => {
      await cli.run([]);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('Projection - Static Site Generator');
    });
  });

  describe('Version display', () => {
    it('should show version with --version flag', async () => {
      await cli.run(['--version']);

      expect(consoleLogSpy).toHaveBeenCalledWith('projection v1.0.0');
    });

    it('should show version with -v flag', async () => {
      await cli.run(['-v']);

      expect(consoleLogSpy).toHaveBeenCalledWith('projection v1.0.0');
    });
  });

  describe('Unknown command handling', () => {
    it('should handle unknown command gracefully', async () => {
      await expect(cli.run(['unknown'])).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown command: unknown')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Run \'projection --help\' for usage information.')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should suggest help for typos', async () => {
      await expect(cli.run(['biuld'])).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown command: biuld')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('projection --help')
      );
    });
  });

  describe('Error handling', () => {
    it('should handle command execution errors', async () => {
      const mockError = new Error('Command failed');
      (build as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(cli.run(['build'])).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Command failed: Command failed')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle errors with custom messages', async () => {
      const mockError = new Error('Invalid configuration');
      (init as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(cli.run(['init'])).rejects.toThrow('process.exit called');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid configuration')
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle empty options object', async () => {
      await cli.run(['build']);

      expect(build).toHaveBeenCalledWith({});
    });

    it('should handle flag at end of arguments', async () => {
      await cli.run(['init', '--force']);

      expect(init).toHaveBeenCalledWith({
        force: true
      });
    });

    it('should handle multiple flags in sequence', async () => {
      await cli.run(['init', '--force', '--minimal']);

      expect(init).toHaveBeenCalledWith({
        force: true,
        minimal: true
      });
    });

    it('should handle options with equals sign (not supported, treated as value)', async () => {
      await cli.run(['build', '--config=custom.js']);

      // Since we don't parse = syntax, this becomes a boolean flag
      expect(build).toHaveBeenCalledWith({
        'config=custom.js': true
      });
    });
  });
});
