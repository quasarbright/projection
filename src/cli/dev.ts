import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import * as browserSync from 'browser-sync';
import { Generator, GeneratorOptions } from '../generator';
import { ProjectionError } from '../utils/errors';

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
}

/**
 * Dev command - starts development server with file watching and live reload
 */
export async function dev(options: DevOptions = {}): Promise<void> {
  const port = options.port || 8080;
  const shouldOpen = !options.noOpen;
  const cwd = process.cwd();

  console.log('\n🚀 Starting development server...\n');

  try {
    // Prepare generator options
    const generatorOptions: GeneratorOptions = {
      cwd,
      configPath: options.config,
      outputDir: options.output
    };

    // Create generator instance
    let generator = await Generator.create(generatorOptions);
    const outputDir = generator.getOutputDir();

    // Perform initial build
    console.log('📦 Performing initial build...\n');
    await generator.generate();
    console.log('');

    // Check if dist directory exists after build
    if (!fs.existsSync(outputDir)) {
      console.error(`\n❌ Error: Output directory '${outputDir}' was not created.\n`);
      process.exit(1);
    }

    // Initialize browser-sync
    const bs = browserSync.create();

    // Start browser-sync server
    bs.init({
      server: outputDir,
      port,
      open: shouldOpen,
      notify: false,
      ui: false,
      logLevel: 'silent'
    }, (err: Error | null) => {
      if (err) {
        console.error(`\n❌ Failed to start dev server: ${err.message}\n`);
        process.exit(1);
      }

      console.log(`\n✨ Development server running!`);
      console.log(`📁 Serving: ${outputDir}`);
      console.log(`🌐 Local: http://localhost:${port}`);
      console.log(`👀 Watching for changes...\n`);
      console.log(`💡 Press Ctrl+C to stop\n`);
    });

    // Set up file watcher
    const watchPaths = [
      path.join(cwd, 'projects.yaml'),
      path.join(cwd, 'projects.yml'),
      path.join(cwd, 'projects.json'),
      path.join(cwd, 'projection.config.js'),
      path.join(cwd, 'projection.config.json'),
      path.join(cwd, 'styles'),
      path.join(cwd, 'scripts')
    ];

    // Filter to only watch paths that exist
    const existingPaths = watchPaths.filter(p => fs.existsSync(p));

    if (existingPaths.length === 0) {
      console.log('⚠️  Warning: No files to watch. Make sure you have projects.yaml or config files.\n');
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
        console.log('🔄 Change detected, rebuilding...');
        
        // Recreate generator to pick up config changes
        generator = await Generator.create(generatorOptions);
        await generator.generate();
        
        console.log('✓ Rebuild complete\n');
        
        // Reload browser
        bs.reload();
      } catch (error) {
        if (error instanceof ProjectionError) {
          console.error(`\n❌ Rebuild failed: ${error.message}`);
          
          if (error.details) {
            if (error.details.errors && Array.isArray(error.details.errors)) {
              console.error('Errors:');
              error.details.errors.forEach((err: string) => {
                console.error(`  - ${err}`);
              });
            } else if (error.details.message) {
              console.error(`${error.details.message}`);
            }
          }
          console.error('\n👀 Watching for changes...\n');
        } else {
          console.error(`\n❌ Unexpected error during rebuild:`);
          console.error((error as Error).message);
          console.error('\n👀 Watching for changes...\n');
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
      console.log(`📝 Changed: ${relativePath}`);
      rebuild();
    });

    watcher.on('add', (filePath) => {
      const relativePath = path.relative(cwd, filePath);
      console.log(`➕ Added: ${relativePath}`);
      rebuild();
    });

    watcher.on('unlink', (filePath) => {
      const relativePath = path.relative(cwd, filePath);
      console.log(`➖ Removed: ${relativePath}`);
      rebuild();
    });

    watcher.on('error', (error) => {
      console.error(`\n❌ Watcher error: ${error.message}\n`);
    });

    // Handle graceful shutdown
    const shutdown = () => {
      console.log('\n\n👋 Shutting down development server...');
      watcher.close();
      bs.exit();
      console.log('✓ Server stopped\n');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    if (error instanceof ProjectionError) {
      console.error(`\n❌ Failed to start dev server: ${error.message}\n`);
      
      if (error.details) {
        if (error.details.errors && Array.isArray(error.details.errors)) {
          console.error('Errors:');
          error.details.errors.forEach((err: string) => {
            console.error(`  - ${err}`);
          });
          console.error('');
        } else if (error.details.message) {
          console.error(`${error.details.message}\n`);
        }
      }
      
      process.exit(1);
    } else {
      console.error(`\n❌ Unexpected error:\n`);
      console.error((error as Error).message);
      console.error('\nPlease report this issue if it persists.\n');
      process.exit(1);
    }
  }
}
