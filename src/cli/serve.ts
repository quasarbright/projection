import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

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
    console.error(`\n❌ Error: Directory '${dir}' not found.`);
    console.error(`\n💡 Run 'projection build' first to generate the site.\n`);
    process.exit(1);
  }

  // Check if index.html exists
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error(`\n❌ Error: No index.html found in '${dir}' directory.`);
    console.error(`\n💡 Run 'projection build' first to generate the site.\n`);
    process.exit(1);
  }

  console.log(`\n🚀 Starting server...`);
  console.log(`📁 Serving: ${distPath}`);
  console.log(`🌐 Server URL: http://localhost:${port}`);
  
  if (shouldOpen) {
    console.log(`🔗 Opening browser...`);
  }
  
  console.log(`\n💡 Press Ctrl+C to stop the server\n`);

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
    console.error(`\n❌ Failed to start server: ${error.message}`);
    console.error(`\n💡 Make sure you have Node.js installed.\n`);
    process.exit(1);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n❌ Server exited with code ${code}\n`);
      process.exit(code);
    }
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down server...\n');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
}
