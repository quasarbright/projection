import * as path from 'path';
import { spawn } from 'child_process';
import { startAdminServer } from '../admin/server';
import { AdminServerConfig } from '../admin/server/types';
import { Logger } from '../utils/logger';
import { ProjectFileFinder } from '../utils/project-file-finder';

/**
 * Options for the admin command
 */
export interface AdminOptions {
  /** Port to run admin server on (default: 3000) */
  port?: number | string;
  /** Automatically open browser (default: true) */
  open?: boolean;
  /** Disable auto-open browser */
  noOpen?: boolean;
  /** Path to projects file */
  projects?: string;
  /** Path to config file */
  config?: string;
}

/**
 * Open a URL in the default browser
 */
function openBrowser(url: string): void {
  const platform = process.platform;
  let command: string;
  
  if (platform === 'darwin') {
    command = 'open';
  } else if (platform === 'win32') {
    command = 'start';
  } else {
    command = 'xdg-open';
  }

  const child = spawn(command, [url], {
    stdio: 'ignore',
    detached: true,
    shell: platform === 'win32'
  });

  child.unref();
}



/**
 * Admin command - starts the admin server for managing projects
 */
export async function admin(options: AdminOptions = {}): Promise<void> {
  try {
    const cwd = process.cwd();
    
    // Parse port option (can be string or number from CLI)
    const port = options.port ? parseInt(options.port.toString(), 10) : 3000;
    
    if (isNaN(port) || port < 1 || port > 65535) {
      Logger.newline();
      Logger.error(`Invalid port number: ${options.port}`);
      Logger.newline();
      Logger.info('Port must be a number between 1 and 65535.');
      Logger.newline();
      process.exit(1);
    }
    
    // Determine if browser should auto-open
    // Default is true unless --no-open is specified
    const shouldOpen = options.noOpen ? false : (options.open !== false);
    
    // Find projects file using shared utility
    const projectFileResult = ProjectFileFinder.resolve(cwd, options.projects);
    
    if (!projectFileResult) {
      Logger.newline();
      if (options.projects) {
        Logger.error(`Projects file not found: ${options.projects}`);
      } else {
        Logger.error('No projects file found.');
        Logger.newline();
        Logger.info(`Expected one of: ${ProjectFileFinder.getSupportedFileNames().join(', ')}`);
      }
      Logger.newline();
      Logger.info('Run \'projection init\' to create a new project.');
      Logger.newline();
      process.exit(1);
    }
    
    const projectsFilePath = projectFileResult.path;
    
    // Resolve config file path if provided
    const configFilePath = options.config 
      ? path.resolve(cwd, options.config)
      : undefined;
    
    // Create admin server configuration
    const serverConfig: AdminServerConfig = {
      port,
      projectsFilePath,
      configFilePath,
      autoOpen: shouldOpen,
      cors: true
    };
    
    // Display startup message
    Logger.newline();
    Logger.header('🚀 Starting Admin Server');
    Logger.keyValue('Projects file', projectsFilePath);
    Logger.keyValue('Server URL', `http://localhost:${port}`);
    
    if (shouldOpen) {
      Logger.icon('🔗', 'Opening browser...', '\x1b[36m');
    }
    
    Logger.newline();
    Logger.dim('💡 Press Ctrl+C to stop the server');
    Logger.newline();
    
    // Start the admin server
    await startAdminServer(serverConfig);
    
    // Open browser if requested
    if (shouldOpen) {
      // Small delay to ensure server is ready
      setTimeout(() => {
        openBrowser(`http://localhost:${port}`);
      }, 500);
    }
    
  } catch (error: any) {
    Logger.newline();
    
    if (error.message && error.message.includes('already in use')) {
      Logger.error(error.message);
      Logger.newline();
      Logger.info('Try using a different port with --port flag:');
      Logger.dim('  projection admin --port 3001');
    } else {
      Logger.error(`Failed to start admin server: ${error.message}`);
      Logger.newline();
      Logger.dim('Please check the error message above for details.');
    }
    
    Logger.newline();
    process.exit(1);
  }
}
