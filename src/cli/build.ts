import { Generator, GeneratorOptions } from '../generator';
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
}

/**
 * Build command - generates the static site from project data
 */
export async function build(options: BuildOptions = {}): Promise<void> {
  try {
    // Prepare generator options
    const generatorOptions: GeneratorOptions = {
      cwd: process.cwd(),
      configPath: options.config,
      outputDir: options.output,
      clean: options.clean
    };

    // Create generator instance
    const generator = await Generator.create(generatorOptions);

    // Run the build process
    await generator.generate();

    // Display success message
    const outputDir = generator.getOutputDir();
    Logger.newline();
    Logger.icon('✨', 'Build successful!', '\x1b[32m');
    Logger.keyValue('Output location', outputDir);
    Logger.newline();
    Logger.info('Next steps:');
    Logger.list([
      `Run 'projection admin' to manage your projects and see a live preview`,
      `Run 'projection dev' to start development server`
    ]);
    Logger.newline();

  } catch (error) {
    if (error instanceof ProjectionError) {
      // Display user-friendly error message
      Logger.newline();
      Logger.error(`Build failed: ${error.message}`);
      Logger.newline();
      
      if (error.details) {
        if (error.details.errors && Array.isArray(error.details.errors)) {
          Logger.error('Errors:');
          error.details.errors.forEach((err: any) => {
            // Handle both string errors and structured validation errors
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
      
      process.exit(1);
    } else {
      // Unexpected error
      Logger.newline();
      Logger.error('Unexpected error during build:');
      Logger.dim((error as Error).message);
      Logger.newline();
      Logger.dim('Please report this issue if it persists.');
      Logger.newline();
      process.exit(1);
    }
  }
}
