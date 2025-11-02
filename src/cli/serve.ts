import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { Logger } from '../utils/logger';

/**
 * Options for the serve command
 */
export interface ServeOptions {
  /** Port to serve on (default: 8080) */
  port?: number;
  /** Open browser automatically */
  open?: boolean;
  /** Directory to serve (default: dist) */
  dir?: string;
}

/**
 * Serve command - serves the generated dist directory with a local HTTP server
 */
export async function serve(options: ServeOptions = {}): Promise<void> {
  const port = options.port || 8080;
  const dir = options.dir || 'dist';
  const shouldOpen = options.open || false;
  
  const distPath = path.resolve(process.cwd(), dir);

  // Check if dist directory exists
  if (!fs.existsSync(distPath)) {
    Logger.newline();
    Logger.error(`Directory '${dir}' not found.`);
    Logger.newline();
    Logger.info(`Run 'projection build' first to generate the site.`);
    Logger.newline();
    process.exit(1);
  }

  // Check if index.html exists
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    Logger.newline();
    Logger.error(`No index.html found in '${dir}' directory.`);
    Logger.newline();
    Logger.info(`Run 'projection build' first to generate the site.`);
    Logger.newline();
    process.exit(1);
  }

  Logger.newline();
  Logger.header('🚀 Starting server');
  Logger.keyValue('Serving', distPath);
  Logger.keyValue('Server URL', `http://localhost:${port}`);
  
  if (shouldOpen) {
    Logger.icon('🔗', 'Opening browser...', '\x1b[36m');
  }
  
  Logger.newline();
  Logger.dim('💡 Press Ctrl+C to stop the server');
  Logger.newline();

  // Start http-server using npx
  const args = [
    'http-server',
    distPath,
    '-p', port.toString(),
    '-c-1', // Disable caching
    '--cors' // Enable CORS
  ];

  if (shouldOpen) {
    args.push('-o');
  }

  const serverProcess = spawn('npx', args, {
    stdio: 'inherit',
    shell: true
  });

  // Handle process termination
  serverProcess.on('error', (error) => {
    Logger.newline();
    Logger.error(`Failed to start server: ${error.message}`);
    Logger.newline();
    Logger.info('Make sure you have Node.js installed.');
    Logger.newline();
    process.exit(1);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      Logger.newline();
      Logger.error(`Server exited with code ${code}`);
      Logger.newline();
      process.exit(code);
    }
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    Logger.newline();
    Logger.newline();
    Logger.icon('👋', 'Shutting down server...', '\x1b[33m');
    Logger.newline();
    serverProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
}
