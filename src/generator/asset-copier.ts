import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../types/config';
import { ProjectionError, ErrorCodes } from '../utils/errors';

/**
 * Handles copying of template assets (styles, scripts, static files)
 * with support for user customization
 */
export class AssetCopier {
  private cwd: string;
  private outputDir: string;
  private packageRoot: string;

  constructor(cwd: string, outputDir: string) {
    this.cwd = cwd;
    this.outputDir = outputDir;
    // Package root is where lib/templates/default/ is located
    // When running from compiled code, __dirname will be in lib/generator/
    this.packageRoot = path.resolve(__dirname, '../..');
  }

  /**
   * Copy all assets (styles, scripts, static assets) to output directory
   */
  async copyAssets(config: Config): Promise<void> {
    // Ensure output directory exists
    this.ensureDirectoryExists(this.outputDir);

    // Copy styles
    await this.copyStyles(config);

    // Copy scripts
    await this.copyScripts(config);

    // Copy static assets (favicon, etc.)
    await this.copyStaticAssets();
  }

  /**
   * Copy style files, preferring user custom styles over bundled templates
   */
  private async copyStyles(config: Config): Promise<void> {
    const outputStylesDir = path.join(this.outputDir, 'styles');
    this.ensureDirectoryExists(outputStylesDir);

    // Determine source directory
    let sourceDir: string;
    
    if (config.customStyles) {
      // Use explicitly configured custom styles
      sourceDir = path.isAbsolute(config.customStyles)
        ? config.customStyles
        : path.join(this.cwd, config.customStyles);
    } else {
      // Check for local styles/ directory
      const localStylesDir = path.join(this.cwd, 'styles');
      if (fs.existsSync(localStylesDir) && fs.statSync(localStylesDir).isDirectory()) {
        sourceDir = localStylesDir;
      } else {
        // Fall back to bundled templates
        sourceDir = path.join(this.packageRoot, 'lib/templates/default/styles');
      }
    }

    // Verify source directory exists
    if (!fs.existsSync(sourceDir)) {
      throw new ProjectionError(
        `Styles directory not found: ${sourceDir}`,
        ErrorCodes.FILE_NOT_FOUND,
        { path: sourceDir, type: 'styles' }
      );
    }

    // Copy all files from source to output
    this.copyDirectory(sourceDir, outputStylesDir);
  }

  /**
   * Copy script files, preferring user custom scripts over bundled templates
   */
  private async copyScripts(config: Config): Promise<void> {
    const outputScriptsDir = path.join(this.outputDir, 'scripts');
    this.ensureDirectoryExists(outputScriptsDir);

    // Determine source directory
    let sourceDir: string;
    
    if (config.customScripts) {
      // Use explicitly configured custom scripts
      sourceDir = path.isAbsolute(config.customScripts)
        ? config.customScripts
        : path.join(this.cwd, config.customScripts);
    } else {
      // Check for local scripts/ directory
      const localScriptsDir = path.join(this.cwd, 'scripts');
      if (fs.existsSync(localScriptsDir) && fs.statSync(localScriptsDir).isDirectory()) {
        sourceDir = localScriptsDir;
      } else {
        // Fall back to bundled templates
        sourceDir = path.join(this.packageRoot, 'lib/templates/default/scripts');
      }
    }

    // Verify source directory exists
    if (!fs.existsSync(sourceDir)) {
      throw new ProjectionError(
        `Scripts directory not found: ${sourceDir}`,
        ErrorCodes.FILE_NOT_FOUND,
        { path: sourceDir, type: 'scripts' }
      );
    }

    // Copy all files from source to output
    this.copyDirectory(sourceDir, outputScriptsDir);
  }

  /**
   * Copy static assets (favicon, images, etc.)
   */
  private async copyStaticAssets(): Promise<void> {
    // Check for local assets/ directory
    const localAssetsDir = path.join(this.cwd, 'assets');
    const bundledAssetsDir = path.join(this.packageRoot, 'lib/templates/default/assets');

    // Copy bundled assets first (as defaults)
    if (fs.existsSync(bundledAssetsDir)) {
      const files = fs.readdirSync(bundledAssetsDir);
      for (const file of files) {
        const sourcePath = path.join(bundledAssetsDir, file);
        const destPath = path.join(this.outputDir, file);
        
        if (fs.statSync(sourcePath).isFile()) {
          this.copyFile(sourcePath, destPath);
        }
      }
    }

    // Copy local assets (overwriting bundled if conflicts)
    if (fs.existsSync(localAssetsDir) && fs.statSync(localAssetsDir).isDirectory()) {
      const files = fs.readdirSync(localAssetsDir);
      for (const file of files) {
        const sourcePath = path.join(localAssetsDir, file);
        const destPath = path.join(this.outputDir, file);
        
        if (fs.statSync(sourcePath).isFile()) {
          this.copyFile(sourcePath, destPath);
        }
      }
    }
  }

  /**
   * Recursively copy a directory
   */
  private copyDirectory(sourceDir: string, destDir: string): void {
    this.ensureDirectoryExists(destDir);

    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectory(sourcePath, destPath);
      } else if (entry.isFile()) {
        this.copyFile(sourcePath, destPath);
      }
    }
  }

  /**
   * Copy a single file
   */
  private copyFile(sourcePath: string, destPath: string): void {
    try {
      fs.copyFileSync(sourcePath, destPath);
    } catch (error) {
      throw new ProjectionError(
        `Failed to copy file: ${sourcePath} to ${destPath}`,
        ErrorCodes.FILE_WRITE_ERROR,
        { 
          source: sourcePath, 
          destination: destPath,
          originalError: (error as Error).message 
        }
      );
    }
  }

  /**
   * Ensure a directory exists, creating it if necessary
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
      } catch (error) {
        throw new ProjectionError(
          `Failed to create directory: ${dirPath}`,
          ErrorCodes.FILE_WRITE_ERROR,
          { 
            path: dirPath,
            originalError: (error as Error).message 
          }
        );
      }
    }
  }

  /**
   * Get the resolved path for styles directory
   * (useful for testing and debugging)
   */
  getStylesSource(config: Config): string {
    if (config.customStyles) {
      return path.isAbsolute(config.customStyles)
        ? config.customStyles
        : path.join(this.cwd, config.customStyles);
    }

    const localStylesDir = path.join(this.cwd, 'styles');
    if (fs.existsSync(localStylesDir) && fs.statSync(localStylesDir).isDirectory()) {
      return localStylesDir;
    }

    return path.join(this.packageRoot, 'lib/templates/default/styles');
  }

  /**
   * Get the resolved path for scripts directory
   * (useful for testing and debugging)
   */
  getScriptsSource(config: Config): string {
    if (config.customScripts) {
      return path.isAbsolute(config.customScripts)
        ? config.customScripts
        : path.join(this.cwd, config.customScripts);
    }

    const localScriptsDir = path.join(this.cwd, 'scripts');
    if (fs.existsSync(localScriptsDir) && fs.statSync(localScriptsDir).isDirectory()) {
      return localScriptsDir;
    }

    return path.join(this.packageRoot, 'lib/templates/default/scripts');
  }
}
