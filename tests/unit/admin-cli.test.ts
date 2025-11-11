import * as fs from 'fs';
import * as path from 'path';
import { admin } from '../../src/cli/admin';

// Mock dependencies
jest.mock('../../src/admin/server', () => ({
  startAdminServer: jest.fn().mockResolvedValue({
    server: {
      stop: jest.fn().mockResolvedValue(undefined)
    },
    port: 3000
  })
}));

jest.mock('../../src/utils/port-finder', () => ({
  PortFinder: {
    findPortWithFallback: jest.fn().mockResolvedValue({
      port: 3000,
      wasRequested: true
    })
  }
}));

jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({
    unref: jest.fn()
  })
}));

jest.mock('fs');
jest.mock('../../src/utils/logger', () => ({
  Logger: {
    newline: jest.fn(),
    header: jest.fn(),
    keyValue: jest.fn(),
    icon: jest.fn(),
    dim: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

import { startAdminServer } from '../../src/admin/server';
import { spawn } from 'child_process';
import { Logger } from '../../src/utils/logger';
import { PortFinder } from '../../src/utils/port-finder';

describe('Admin CLI Command', () => {
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;
  let processCwdSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    processCwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('/test/project');

    // Reset all mocks
    jest.clearAllMocks();

    // Default fs.existsSync behavior
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
    processCwdSpy.mockRestore();
  });

  describe('Server startup', () => {
    it('should start admin server with default options', async () => {
      (PortFinder.findPortWithFallback as jest.Mock).mockResolvedValue({
        port: 3000,
        wasRequested: true
      });

      await admin({});

      expect(PortFinder.findPortWithFallback).toHaveBeenCalledWith(3000, false);
      expect(startAdminServer).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 3000,
          projectsFilePath: expect.stringContaining('projects.yaml'),
          autoOpen: true,
          cors: true
        })
      );
    });

    it('should start admin server with custom port', async () => {
      (PortFinder.findPortWithFallback as jest.Mock).mockResolvedValue({
        port: 3001,
        wasRequested: true
      });

      await admin({ port: 3001 });

      expect(PortFinder.findPortWithFallback).toHaveBeenCalledWith(3001, true);
      expect(startAdminServer).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 3001
        })
      );
    });

    it('should parse port from string', async () => {
      (PortFinder.findPortWithFallback as jest.Mock).mockResolvedValue({
        port: 3002,
        wasRequested: true
      });

      await admin({ port: '3002' });

      expect(PortFinder.findPortWithFallback).toHaveBeenCalledWith(3002, true);
      expect(startAdminServer).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 3002
        })
      );
    });

    it('should disable auto-open with noOpen flag', async () => {
      await admin({ noOpen: true });

      expect(startAdminServer).toHaveBeenCalledWith(
        expect.objectContaining({
          autoOpen: false
        })
      );
    });

    it('should respect open: false option', async () => {
      await admin({ open: false });

      expect(startAdminServer).toHaveBeenCalledWith(
        expect.objectContaining({
          autoOpen: false
        })
      );
    });

    it('should use custom projects file path', async () => {
      await admin({ projects: 'custom/projects.yaml' });

      expect(startAdminServer).toHaveBeenCalledWith(
        expect.objectContaining({
          projectsFilePath: path.resolve('/test/project', 'custom/projects.yaml')
        })
      );
    });

    it('should use custom config file path', async () => {
      await admin({ config: 'custom.config.js' });

      expect(startAdminServer).toHaveBeenCalledWith(
        expect.objectContaining({
          configFilePath: path.resolve('/test/project', 'custom.config.js')
        })
      );
    });
  });

  describe('Projects file detection', () => {
    it('should find projects.yaml', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath.endsWith('projects.yaml');
      });

      await admin({});

      expect(startAdminServer).toHaveBeenCalledWith(
        expect.objectContaining({
          projectsFilePath: expect.stringContaining('projects.yaml')
        })
      );
    });

    it('should find projects.yml', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath.endsWith('projects.yml');
      });

      await admin({});

      expect(startAdminServer).toHaveBeenCalledWith(
        expect.objectContaining({
          projectsFilePath: expect.stringContaining('projects.yml')
        })
      );
    });

    it('should find projects.json', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath.endsWith('projects.json');
      });

      await admin({});

      expect(startAdminServer).toHaveBeenCalledWith(
        expect.objectContaining({
          projectsFilePath: expect.stringContaining('projects.json')
        })
      );
    });

    it('should exit if no projects file found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(admin({})).rejects.toThrow('process.exit called');

      expect(Logger.error).toHaveBeenCalledWith('No projects file found.');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit if specified projects file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(admin({ projects: 'missing.yaml' })).rejects.toThrow('process.exit called');

      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Projects file not found')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('Port validation', () => {
    it('should reject invalid port number', async () => {
      await expect(admin({ port: 'invalid' })).rejects.toThrow('process.exit called');

      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid port number')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should reject port below valid range', async () => {
      await expect(admin({ port: -1 })).rejects.toThrow('process.exit called');

      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid port number')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should reject port above valid range', async () => {
      await expect(admin({ port: 70000 })).rejects.toThrow('process.exit called');

      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid port number')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should accept valid port at lower boundary', async () => {
      (PortFinder.findPortWithFallback as jest.Mock).mockResolvedValue({
        port: 1,
        wasRequested: true
      });

      await admin({ port: 1 });

      expect(startAdminServer).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 1
        })
      );
    });

    it('should accept valid port at upper boundary', async () => {
      (PortFinder.findPortWithFallback as jest.Mock).mockResolvedValue({
        port: 65535,
        wasRequested: true
      });

      await admin({ port: 65535 });

      expect(startAdminServer).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 65535
        })
      );
    });
  });

  describe('Browser opening', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (PortFinder.findPortWithFallback as jest.Mock).mockResolvedValue({
        port: 3000,
        wasRequested: true
      });
      (startAdminServer as jest.Mock).mockResolvedValue({
        server: { stop: jest.fn() },
        port: 3000
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should open browser when autoOpen is true', async () => {
      await admin({ open: true });

      // Fast-forward timers to trigger browser opening
      jest.advanceTimersByTime(500);

      expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        ['http://localhost:3000'],
        expect.objectContaining({
          stdio: 'ignore',
          detached: true
        })
      );
    });

    it('should not open browser when noOpen is true', async () => {
      await admin({ noOpen: true });

      jest.advanceTimersByTime(500);

      expect(spawn).not.toHaveBeenCalled();
    });

    it('should open browser with custom port', async () => {
      (PortFinder.findPortWithFallback as jest.Mock).mockResolvedValue({
        port: 4000,
        wasRequested: true
      });
      (startAdminServer as jest.Mock).mockResolvedValue({
        server: { stop: jest.fn() },
        port: 4000
      });

      await admin({ port: 4000 });

      jest.advanceTimersByTime(500);

      expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        ['http://localhost:4000'],
        expect.any(Object)
      );
    });
  });

  describe('Error handling', () => {
    it('should handle port already in use error', async () => {
      const portError = new Error('Port 3000 is already in use. Please choose a different port using --port flag.');
      (startAdminServer as jest.Mock).mockRejectedValueOnce(portError);

      await expect(admin({})).rejects.toThrow('process.exit called');

      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('already in use')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle generic server startup errors', async () => {
      const genericError = new Error('Something went wrong');
      (startAdminServer as jest.Mock).mockRejectedValueOnce(genericError);

      await expect(admin({})).rejects.toThrow('process.exit called');

      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to start admin server')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('Logging', () => {
    it('should display startup information', async () => {
      (PortFinder.findPortWithFallback as jest.Mock).mockResolvedValue({
        port: 3000,
        wasRequested: true
      });
      (startAdminServer as jest.Mock).mockResolvedValue({
        server: { stop: jest.fn() },
        port: 3000
      });

      await admin({});

      expect(Logger.header).toHaveBeenCalledWith('🚀 Starting Admin Server');
      expect(Logger.keyValue).toHaveBeenCalledWith(
        'Projects file',
        expect.any(String)
      );
      expect(Logger.keyValue).toHaveBeenCalledWith(
        'Server URL',
        'http://localhost:3000'
      );
      expect(Logger.dim).toHaveBeenCalledWith(
        '💡 Press Ctrl+C to stop the server'
      );
    });

    it('should show browser opening message when autoOpen is true', async () => {
      await admin({ open: true });

      expect(Logger.icon).toHaveBeenCalledWith(
        '🔗',
        'Opening browser...',
        '\x1b[36m'
      );
    });

    it('should not show browser opening message when noOpen is true', async () => {
      await admin({ noOpen: true });

      expect(Logger.icon).not.toHaveBeenCalledWith(
        '🔗',
        'Opening browser...',
        expect.any(String)
      );
    });

    it('should show port fallback message when default port is in use', async () => {
      (PortFinder.findPortWithFallback as jest.Mock).mockResolvedValue({
        port: 3001,
        wasRequested: false
      });
      (startAdminServer as jest.Mock).mockResolvedValue({
        server: { stop: jest.fn() },
        port: 3001
      });

      await admin({});

      expect(Logger.icon).toHaveBeenCalledWith(
        '⚠️',
        'Port 3000 was in use, using port 3001 instead',
        '\x1b[33m'
      );
      expect(Logger.keyValue).toHaveBeenCalledWith(
        'Server URL',
        'http://localhost:3001'
      );
    });

    it('should not show port fallback message when requested port is available', async () => {
      (PortFinder.findPortWithFallback as jest.Mock).mockResolvedValue({
        port: 3000,
        wasRequested: true
      });

      await admin({});

      expect(Logger.icon).not.toHaveBeenCalledWith(
        '⚠️',
        expect.stringContaining('was in use'),
        expect.any(String)
      );
    });
  });
});
