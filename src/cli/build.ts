import { BuildHelper } from '../utils/build-helper';
import { ProjectionError } from '../utils/errors';
import { Logger } from '../utils/logger';

/**
 * Options for the build command
 */
export interface BuildOptions {
  /** Path to custom config file */
  config?: string;
  /** Custom output directory */
  output?: string;
  /** Clean output directory before build */
  clean?: boolean;
  /** Show help */
  help?: boolean;
}

/**
 * Display help for the build command
 */
function showBuildHelp(): void {
  console.log(`
Projection Build - Generate Static Site

USAGE:
  projection build [options]

DESCRIPTION:
  Generates the static portfolio site from your project data.
  Creates HTML, CSS, and JavaScript files in the output directory.

OPTIONS:
  --config <path>   Path to custom config file
  --output <path>   Custom output directory (default: dist)
  --clean           Clean output directory before build
  --help            Show this help message

EXAMPLES:
  projection build                           # Build with defaults
  projection build --output public           # Custom output directory
  projection build --config my-config.json   # Custom config file
  projection build --clean                   # Clean before building

OUTPUT:
  The generated site will be in the dist/ directory (or custom --output path).
  This directory can be deployed to any static hosting service.

`);
}

/**
 * Build command - generates the static site from project data
 */
export async function build(options: BuildOptions = {}): Promise<void> {
  if (options.help) {
    showBuildHelp();
    return;
  }
  
  try {
    // Use shared build helper
    const result = await BuildHelper.runBuild({
      cwd: process.cwd(),
      configPath: options.config,
      outputDir: options.output,
      clean: options.clean
    });

    // Display success message
    Logger.info('Next steps:');
    Logger.list([
      `Run 'projection admin' to manage your projects and see a live preview`,
      `Run 'projection dev' to start development server`
    ]);
    Logger.newline();

  } catch (error) {
    // Error already logged by BuildHelper
    process.exit(1);
  }
}
