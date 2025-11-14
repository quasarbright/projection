import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { Logger } from '../utils/logger';
import { PortFinder } from '../utils/port-finder';

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
  /** Show help */
  help?: boolean;
}

/**
 * Display help for the serve command
 */
function showServeHelp(): void {
  console.log(`
Projection Serve - Serve Built Site

USAGE:
  projection serve [options]

DESCRIPTION:
  Serves the generated site with a local HTTP server.
  Use this to preview the built site before deployment.

OPTIONS:
  --port <number>   Server port (default: 8080)
  --open            Open browser automatically
  --dir <path>      Directory to serve (default: dist)
  --help            Show this help message

EXAMPLES:
  projection serve                  # Serve on port 8080
  projection serve --port 3000      # Use custom port
  projection serve --open           # Open browser automatically
  projection serve --dir public     # Serve custom directory

NOTE:
  Run 'projection build' first to generate the site.

`);
}

/**
 * Serve command - serves the generated dist directory with a local HTTP server
 */
export async function serve(options: ServeOptions = {}): Promise<void> {
  if (options.help) {
    showServeHelp();
    return;
  }
  const requestedPort = options.port || 8080;
  const userSuppliedPort = options.port !== undefined;
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

  // Find available port with fallback behavior
  let port: number;
  let portResult;
  
  try {
    portResult = await PortFinder.findPortWithFallback(requestedPort, userSuppliedPort);
    port = portResult.port;
  } catch (error: any) {
    Logger.newline();
    Logger.error(error.message);
    Logger.newline();
    process.exit(1);
  }

  Logger.newline();
  Logger.header('🚀 Starting server');
  Logger.keyValue('Serving', distPath);
  
  // Show port fallback message if needed
  if (!portResult.wasRequested) {
    Logger.newline();
    Logger.icon('⚠️', `Port ${requestedPort} was in use, using port ${port} instead`, '\x1b[33m');
  }
  
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
