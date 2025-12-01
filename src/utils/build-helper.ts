import { Generator, GeneratorOptions } from '../generator';
import { ProjectionError, ErrorCodes } from './errors';
import { Logger } from './logger';

/**
 * Options for running a build
 */
export interface BuildHelperOptions {
  /** Working directory (defaults to process.cwd()) */
  cwd?: string;
  /** Path to custom config file */
  configPath?: string;
  /** Custom output directory */
  outputDir?: string;
  /** Clean output directory before build */
  clean?: boolean;
  /** Override baseUrl (useful for dev server) */
  baseUrl?: string;
  /** Enable admin mode with edit/delete controls (for preview only) */
  adminMode?: boolean;
  /** Whether to show build logs */
  silent?: boolean;
}

/**
 * Result of a build operation
 */
export interface BuildResult {
  /** Path to the output directory */
  outputDir: string;
  /** The generator instance used */
  generator: Generator;
}

/**
 * Shared build logic used by build, dev, and deploy commands
 * This ensures consistent behavior across all commands
 */
export class BuildHelper {
  /**
   * Run a build with the given options
   * @throws ProjectionError if build fails
   */
  static async runBuild(options: BuildHelperOptions = {}): Promise<BuildResult> {
    const cwd = options.cwd || process.cwd();

    try {
      if (!options.silent) {
        Logger.header('🚀 Starting build process');
        Logger.newline();
      }

      // Prepare generator options
      // Default to relative paths for all builds (works locally and in production)
      const generatorOptions: GeneratorOptions = {
        cwd,
        configPath: options.configPath,
        outputDir: options.outputDir,
        clean: options.clean,
        baseUrl: options.baseUrl !== undefined ? options.baseUrl : './',
        adminMode: options.adminMode
      };

      // Create generator instance
      const generator = await Generator.create(generatorOptions);

      // Run the build process
      await generator.generate();

      const outputDir = generator.getOutputDir();

      if (!options.silent) {
        Logger.newline();
        Logger.icon('✨', 'Build complete!', '\x1b[32m');
        Logger.keyValue('Output', outputDir);
        Logger.newline();
      }

      return {
        outputDir,
        generator
      };

    } catch (error) {
      if (error instanceof ProjectionError) {
        if (!options.silent) {
          Logger.newline();
          Logger.error(`Build failed: ${error.message}`);
          Logger.newline();
          
          if (error.details) {
            if (error.details.errors && Array.isArray(error.details.errors)) {
              Logger.error('Errors:');
              error.details.errors.forEach((err: any) => {
                if (typeof err === 'string') {
                  Logger.dim(`  • ${err}`);
                } else if (err.message) {
                  const projectInfo = err.projectId ? `[${err.projectId}]` : `[Project ${err.projectIndex}]`;
                  Logger.dim(`  • ${projectInfo} ${err.field}: ${err.message}`);
                } else {
                  Logger.dim(`  • ${JSON.stringify(err)}`);
                }
              });
              Logger.newline();
            } else if (error.details.message) {
              Logger.dim(error.details.message);
              Logger.newline();
            }
          }
        }
        throw error;
      }
      
      // Wrap unexpected errors
      throw new ProjectionError(
        'Build process failed',
        ErrorCodes.RUNTIME_ERROR,
        { originalError: (error as Error).message }
      );
    }
  }
}
