import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Config } from '../types/config';
import { ProjectsData } from '../types/project';
import { ConfigLoader } from './config';
import { Validator } from './validator';
import { HTMLBuilder } from './html-builder';
import { AssetCopier } from './asset-copier';
import { ProjectionError, ErrorCodes } from '../utils/errors';
import { Logger } from '../utils/logger';
import { ProjectFileFinder } from '../utils/project-file-finder';

/**
 * Options for the Generator
 */
export interface GeneratorOptions {
  /** Working directory (defaults to process.cwd()) */
  cwd?: string;
  /** Explicit config file path */
  configPath?: string;
  /** Output directory (overrides config) */
  outputDir?: string;
  /** Whether to clean output directory before build */
  clean?: boolean;
  /** Enable admin mode with edit/delete controls (for preview only) */
  adminMode?: boolean;
  /** Override baseUrl (useful for dev server) */
  baseUrl?: string;
}

/**
 * Main generator orchestrator that coordinates the build process
 */
export class Generator {
  private config: Config;
  private cwd: string;
  private outputDir: string;
  private adminMode: boolean;
  private configLoader: ConfigLoader;
  private validator: Validator;
  private htmlBuilder: HTMLBuilder;
  private assetCopier: AssetCopier;

  constructor(config: Config, cwd: string = process.cwd(), adminMode: boolean = false) {
    this.config = config;
    this.cwd = cwd;
    this.adminMode = adminMode;
    this.outputDir = path.isAbsolute(config.output || 'dist')
      ? config.output || 'dist'
      : path.join(cwd, config.output || 'dist');
    
    this.configLoader = new ConfigLoader(cwd);
    this.validator = new Validator(cwd);
    this.htmlBuilder = new HTMLBuilder(config, { adminMode: this.adminMode });
    this.assetCopier = new AssetCopier(cwd, this.outputDir);
  }

  /**
   * Create a Generator instance by loading configuration
   */
  static async create(options: GeneratorOptions = {}): Promise<Generator> {
    const cwd = options.cwd || process.cwd();
    const configLoader = new ConfigLoader(cwd);
    
    // Load configuration
    const config = await configLoader.load({
      configPath: options.configPath
    });

    // Override output directory if specified in options
    if (options.outputDir) {
      config.output = options.outputDir;
    }

    // Override baseUrl if specified in options (useful for dev server)
    if (options.baseUrl !== undefined) {
      config.baseUrl = options.baseUrl;
    }

    // Pass adminMode to constructor (defaults to false for production builds)
    const adminMode = options.adminMode || false;

    return new Generator(config, cwd, adminMode);
  }

  /**
   * Main generation method that orchestrates the entire build process
   */
  async generate(): Promise<void> {
    try {
      Logger.header('🚀 Starting build process');

      // 1. Load project data
      Logger.step('Loading project data...');
      const projectsData = await this.loadProjectData();
      Logger.success(`Loaded ${projectsData.projects.length} project${projectsData.projects.length !== 1 ? 's' : ''}`);

      // 2. Validate projects
      Logger.step('Validating project data...');
      const warnings = this.validator.validate(projectsData.projects);
      Logger.success('Validation passed');

      // Display warnings if any
      if (warnings.length > 0) {
        Logger.newline();
        Logger.warn(`Found ${warnings.length} warning${warnings.length !== 1 ? 's' : ''}:`);
        warnings.forEach(warning => {
          const projectInfo = warning.projectId ? `[${warning.projectId}]` : `[Project ${warning.projectIndex}]`;
          Logger.dim(`   ${projectInfo} ${warning.field}: ${warning.message}`);
        });
        Logger.newline();
      }

      // 3. Clean output directory if requested
      if (this.outputDir && fs.existsSync(this.outputDir)) {
        Logger.step('Cleaning output directory...');
        this.cleanOutputDirectory();
        Logger.success('Output directory cleaned');
      }

      // 4. Generate HTML
      Logger.step('Generating HTML...');
      const html = this.htmlBuilder.generateHTML(projectsData);
      Logger.success('HTML generated');

      // 5. Write output
      Logger.step('Writing output files...');
      await this.writeOutput(html);
      Logger.success('Output written');

      // 6. Copy assets
      Logger.step('Copying assets...');
      const thumbnails = projectsData.projects
        .map(p => p.thumbnailLink)
        .filter((t): t is string => !!t);
      await this.assetCopier.copyAssets(this.config, thumbnails);
      Logger.success('Assets copied');

      Logger.newline();
      Logger.icon('✨', `Build complete! Output: ${this.outputDir}`, '\x1b[32m');
    } catch (error) {
      if (error instanceof ProjectionError) {
        throw error;
      }
      
      throw new ProjectionError(
        'Build process failed',
        ErrorCodes.RUNTIME_ERROR,
        { originalError: (error as Error).message }
      );
    }
  }

  /**
   * Load project data from projects.yaml or projects.json
   */
  async loadProjectData(): Promise<ProjectsData> {
    // Use shared utility to find projects file
    const projectFileResult = ProjectFileFinder.find(this.cwd);

    if (!projectFileResult) {
      throw new ProjectionError(
        'Projects file not found',
        ErrorCodes.FILE_NOT_FOUND,
        {
          message: `Could not find ${ProjectFileFinder.getSupportedFileNames().join(', ')} in the current directory`,
          searchedPaths: ProjectFileFinder.getPossiblePaths(this.cwd),
          cwd: this.cwd
        }
      );
    }

    const projectsPath = projectFileResult.path;

    try {
      const content = fs.readFileSync(projectsPath, 'utf-8');
      const ext = path.extname(projectsPath);

      let data: any;
      if (ext === '.yaml' || ext === '.yml') {
        data = yaml.load(content);
      } else if (ext === '.json') {
        data = JSON.parse(content);
      } else {
        throw new ProjectionError(
          `Unsupported file format: ${ext}`,
          ErrorCodes.PARSE_ERROR,
          { path: projectsPath }
        );
      }

      // Validate structure
      if (!data || typeof data !== 'object') {
        throw new ProjectionError(
          'Invalid projects file: must contain an object',
          ErrorCodes.PARSE_ERROR,
          { path: projectsPath }
        );
      }

      if (!data.projects || !Array.isArray(data.projects)) {
        throw new ProjectionError(
          'Invalid projects file: must contain a "projects" array',
          ErrorCodes.PARSE_ERROR,
          { path: projectsPath }
        );
      }

      return {
        config: data.config,
        projects: data.projects
      };
    } catch (error) {
      if (error instanceof ProjectionError) {
        throw error;
      }

      throw new ProjectionError(
        `Failed to parse projects file: ${projectsPath}`,
        ErrorCodes.PARSE_ERROR,
        {
          path: projectsPath,
          originalError: (error as Error).message
        }
      );
    }
  }

  /**
   * Write generated HTML to output file
   */
  async writeOutput(html: string): Promise<void> {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      try {
        fs.mkdirSync(this.outputDir, { recursive: true });
      } catch (error) {
        throw new ProjectionError(
          `Failed to create output directory: ${this.outputDir}`,
          ErrorCodes.FILE_WRITE_ERROR,
          {
            path: this.outputDir,
            originalError: (error as Error).message
          }
        );
      }
    }

    const outputPath = path.join(this.outputDir, 'index.html');

    try {
      fs.writeFileSync(outputPath, html, 'utf-8');
    } catch (error) {
      throw new ProjectionError(
        `Failed to write output file: ${outputPath}`,
        ErrorCodes.FILE_WRITE_ERROR,
        {
          path: outputPath,
          originalError: (error as Error).message
        }
      );
    }
  }

  /**
   * Clean the output directory
   */
  private cleanOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      return;
    }

    try {
      // Remove all files and subdirectories
      const entries = fs.readdirSync(this.outputDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(this.outputDir, entry.name);
        
        if (entry.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (error) {
      throw new ProjectionError(
        `Failed to clean output directory: ${this.outputDir}`,
        ErrorCodes.FILE_WRITE_ERROR,
        {
          path: this.outputDir,
          originalError: (error as Error).message
        }
      );
    }
  }

  /**
   * Get the output directory path
   */
  getOutputDir(): string {
    return this.outputDir;
  }

  /**
   * Get the current configuration
   */
  getConfig(): Config {
    return this.config;
  }
}
