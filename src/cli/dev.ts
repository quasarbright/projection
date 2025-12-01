import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import * as browserSync from 'browser-sync';
import { Generator, GeneratorOptions } from '../generator';
import { ProjectionError } from '../utils/errors';
import { Logger } from '../utils/logger';

/**
 * Options for the dev command
 */
export interface DevOptions {
  /** Path to custom config file */
  config?: string;
  /** Custom output directory */
  output?: string;
  /** Port for the dev server (default: 8080) */
  port?: number;
  /** Don't open browser automatically */
  noOpen?: boolean;
  /** Show help */
  help?: boolean;
}

/**
 * Display help for the dev command
 */
function showDevHelp(): void {
  console.log(`
Projection Dev - Development Server

USAGE:
  projection dev [options]

DESCRIPTION:
  Starts a development server with live reload. Automatically rebuilds
  and refreshes the browser when project files change.

OPTIONS:
  --config <path>   Path to custom config file
  --output <path>   Custom output directory (default: dist)
  --port <number>   Server port (default: 8080)
  --no-open         Don't open browser automatically
  --help            Show this help message

EXAMPLES:
  projection dev                    # Start dev server on port 8080
  projection dev --port 3000        # Use custom port
  projection dev --no-open          # Don't open browser

WATCHED FILES:
  projects.yaml / projects.yml / projects.json
  projection.config.json
  styles/
  scripts/

The server will automatically rebuild when any of these files change.

`);
}

/**
 * Dev command - starts development server with file watching and live reload
 */
export async function dev(options: DevOptions = {}): Promise<void> {
  if (options.help) {
    showDevHelp();
    return;
  }
  const port = options.port || 8080;
  const shouldOpen = !options.noOpen;
  const cwd = process.cwd();

  Logger.newline();
  Logger.header('🚀 Starting development server');
  Logger.newline();

  try {
    // Prepare generator options
    const generatorOptions: GeneratorOptions = {
      cwd,
      configPath: options.config,
      outputDir: options.output,
      baseUrl: './' // Force relative paths for dev server
    };

    // Create generator instance
    let generator = await Generator.create(generatorOptions);
    const outputDir = generator.getOutputDir();

    // Perform initial build
    Logger.step('Performing initial build...');
    Logger.newline();
    await generator.generate();

    // Check if dist directory exists after build
    if (!fs.existsSync(outputDir)) {
      Logger.newline();
      Logger.error(`Output directory '${outputDir}' was not created.`);
      Logger.newline();
      process.exit(1);
    }

    // Initialize browser-sync
    const bs = browserSync.create();

    // Start browser-sync server with middleware to serve screenshots
    bs.init({
      server: {
        baseDir: outputDir,
        routes: {
          '/screenshots': path.join(cwd, 'screenshots')
        }
      },
      port,
      open: shouldOpen,
      notify: false,
      ui: false,
      logLevel: 'silent'
    }, (err: Error | null) => {
      if (err) {
        Logger.newline();
        Logger.error(`Failed to start dev server: ${err.message}`);
        Logger.newline();
        process.exit(1);
      }

      Logger.newline();
      Logger.icon('✨', 'Development server running!', '\x1b[32m');
      Logger.keyValue('Serving', outputDir);
      Logger.keyValue('Local', `http://localhost:${port}`);
      Logger.icon('👀', 'Watching for changes...', '\x1b[36m');
      Logger.newline();
      Logger.dim('💡 Press Ctrl+C to stop');
      Logger.newline();
    });

    // Set up file watcher
    const watchPaths = [
      path.join(cwd, 'projects.yaml'),
      path.join(cwd, 'projects.yml'),
      path.join(cwd, 'projects.json'),
      path.join(cwd, 'projection.config.json'),
      path.join(cwd, 'styles'),
      path.join(cwd, 'scripts')
    ];

    // Filter to only watch paths that exist
    const existingPaths = watchPaths.filter(p => fs.existsSync(p));

    if (existingPaths.length === 0) {
      Logger.warn('No files to watch. Make sure you have projects.yaml or config files.');
      Logger.newline();
    }

    const watcher = chokidar.watch(existingPaths, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      }
    });

    // Track rebuild state to prevent concurrent rebuilds
    let isRebuilding = false;
    let rebuildQueued = false;

    const rebuild = async () => {
      if (isRebuilding) {
        rebuildQueued = true;
        return;
      }

      isRebuilding = true;

      try {
        Logger.icon('🔄', 'Change detected, rebuilding...', '\x1b[33m');
        
        // Recreate generator to pick up config changes
        generator = await Generator.create(generatorOptions);
        await generator.generate();
        
        Logger.success('Rebuild complete');
        Logger.newline();
        
        // Reload browser
        bs.reload();
      } catch (error) {
        if (error instanceof ProjectionError) {
          Logger.newline();
          Logger.error(`Rebuild failed: ${error.message}`);
          
          if (error.details) {
            if (error.details.errors && Array.isArray(error.details.errors)) {
              Logger.error('Errors:');
              error.details.errors.forEach((err: string) => {
                Logger.dim(`  • ${err}`);
              });
            } else if (error.details.message) {
              Logger.dim(error.details.message);
            }
          }
          Logger.newline();
          Logger.icon('👀', 'Watching for changes...', '\x1b[36m');
          Logger.newline();
        } else {
          Logger.newline();
          Logger.error('Unexpected error during rebuild:');
          Logger.dim((error as Error).message);
          Logger.newline();
          Logger.icon('👀', 'Watching for changes...', '\x1b[36m');
          Logger.newline();
        }
      } finally {
        isRebuilding = false;
        
        // If another change came in while rebuilding, rebuild again
        if (rebuildQueued) {
          rebuildQueued = false;
          setTimeout(() => rebuild(), 100);
        }
      }
    };

    // Watch for file changes
    watcher.on('change', (filePath) => {
      const relativePath = path.relative(cwd, filePath);
      Logger.icon('📝', `Changed: ${relativePath}`, '\x1b[33m');
      rebuild();
    });

    watcher.on('add', (filePath) => {
      const relativePath = path.relative(cwd, filePath);
      Logger.icon('➕', `Added: ${relativePath}`, '\x1b[32m');
      rebuild();
    });

    watcher.on('unlink', (filePath) => {
      const relativePath = path.relative(cwd, filePath);
      Logger.icon('➖', `Removed: ${relativePath}`, '\x1b[31m');
      rebuild();
    });

    watcher.on('error', (error) => {
      Logger.newline();
      Logger.error(`Watcher error: ${error.message}`);
      Logger.newline();
    });

    // Handle graceful shutdown
    const shutdown = () => {
      Logger.newline();
      Logger.newline();
      Logger.icon('👋', 'Shutting down development server...', '\x1b[33m');
      watcher.close();
      bs.exit();
      Logger.success('Server stopped');
      Logger.newline();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    if (error instanceof ProjectionError) {
      Logger.newline();
      Logger.error(`Failed to start dev server: ${error.message}`);
      Logger.newline();
      
      if (error.details) {
        if (error.details.errors && Array.isArray(error.details.errors)) {
          Logger.error('Errors:');
          error.details.errors.forEach((err: string) => {
            Logger.dim(`  • ${err}`);
          });
          Logger.newline();
        } else if (error.details.message) {
          Logger.dim(error.details.message);
          Logger.newline();
        }
      }
      
      process.exit(1);
    } else {
      Logger.newline();
      Logger.error('Unexpected error:');
      Logger.dim((error as Error).message);
      Logger.newline();
      Logger.dim('Please report this issue if it persists.');
      Logger.newline();
      process.exit(1);
    }
  }
}
