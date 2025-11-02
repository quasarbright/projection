import { Generator, GeneratorOptions } from '../generator';
import { ProjectionError } from '../utils/errors';

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
    console.log(`\n✨ Build successful!`);
    console.log(`📁 Output location: ${outputDir}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   - Open ${outputDir}/index.html in your browser`);
    console.log(`   - Run 'projection serve' to preview with a local server`);
    console.log(`   - Run 'projection dev' for development with live reload\n`);

  } catch (error) {
    if (error instanceof ProjectionError) {
      // Display user-friendly error message
      console.error(`\n❌ Build failed: ${error.message}\n`);
      
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
      // Unexpected error
      console.error(`\n❌ Unexpected error during build:\n`);
      console.error((error as Error).message);
      console.error('\nPlease report this issue if it persists.\n');
      process.exit(1);
    }
  }
}
