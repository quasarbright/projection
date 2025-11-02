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
}

/**
 * Main generator orchestrator that coordinates the build process
 */
export class Generator {
  private config: Config;
  private cwd: string;
  private outputDir: string;
  private configLoader: ConfigLoader;
  private validator: Validator;
  private htmlBuilder: HTMLBuilder;
  private assetCopier: AssetCopier;

  constructor(config: Config, cwd: string = process.cwd()) {
    this.config = config;
    this.cwd = cwd;
    this.outputDir = path.isAbsolute(config.output || 'dist')
      ? config.output || 'dist'
      : path.join(cwd, config.output || 'dist');
    
    this.configLoader = new ConfigLoader(cwd);
    this.validator = new Validator(cwd);
    this.htmlBuilder = new HTMLBuilder(config);
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

    return new Generator(config, cwd);
  }

  /**
   * Main generation method that orchestrates the entire build process
   */
  async generate(): Promise<void> {
    try {
      console.log('🚀 Starting build process...');

      // 1. Load project data
      console.log('📂 Loading project data...');
      const projectsData = await this.loadProjectData();
      console.log(`✓ Loaded ${projectsData.projects.length} projects`);

      // 2. Validate projects
      console.log('✓ Validating project data...');
      const warnings = this.validator.validate(projectsData.projects);
      console.log('✓ Validation passed');

      // Display warnings if any
      if (warnings.length > 0) {
        console.log(`\n⚠️  Found ${warnings.length} warning(s):`);
        warnings.forEach(warning => {
          const projectInfo = warning.projectId ? `[${warning.projectId}]` : `[Project ${warning.projectIndex}]`;
          console.log(`   ${projectInfo} ${warning.field}: ${warning.message}`);
        });
        console.log('');
      }

      // 3. Clean output directory if requested
      if (this.outputDir && fs.existsSync(this.outputDir)) {
        console.log('🧹 Cleaning output directory...');
        this.cleanOutputDirectory();
      }

      // 4. Generate HTML
      console.log('📝 Generating HTML...');
      const html = this.htmlBuilder.generateHTML(projectsData);
      console.log('✓ HTML generated');

      // 5. Write output
      console.log('💾 Writing output files...');
      await this.writeOutput(html);
      console.log('✓ Output written');

      // 6. Copy assets
      console.log('📦 Copying assets...');
      await this.assetCopier.copyAssets(this.config);
      console.log('✓ Assets copied');

      console.log(`\n✨ Build complete! Output: ${this.outputDir}`);
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
    // Try to find projects file in order of preference
    const possiblePaths = [
      path.join(this.cwd, 'projects.yaml'),
      path.join(this.cwd, 'projects.yml'),
      path.join(this.cwd, 'projects.json')
    ];

    let projectsPath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        projectsPath = p;
        break;
      }
    }

    if (!projectsPath) {
      throw new ProjectionError(
        'Projects file not found',
        ErrorCodes.FILE_NOT_FOUND,
        {
          message: 'Could not find projects.yaml, projects.yml, or projects.json in the current directory',
          searchedPaths: possiblePaths,
          cwd: this.cwd
        }
      );
    }

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
