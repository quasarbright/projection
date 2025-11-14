import * as fs from 'fs';
import * as path from 'path';
import { Config, DEFAULT_CONFIG } from '../types/config';
import { ProjectionError, ErrorCodes } from '../utils/errors';

/**
 * Options for loading configuration
 */
export interface ConfigLoadOptions {
  /** Explicit path to config file */
  configPath?: string;
}

/**
 * Handles loading, merging, and validating configuration from various sources
 */
export class ConfigLoader {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  /**
   * Load configuration from:
   * 1. Explicit configPath option
   * 2. projection.config.json in cwd
   * 3. Default configuration
   */
  async load(options: ConfigLoadOptions = {}): Promise<Config> {
    let config: Partial<Config> = {};

    // Priority 1: Explicit config path
    if (options.configPath) {
      config = await this.loadFromFile(options.configPath);
    } else {
      // Priority 2: projection.config.json
      const jsonConfigPath = path.join(this.cwd, 'projection.config.json');
      if (fs.existsSync(jsonConfigPath)) {
        config = await this.loadFromFile(jsonConfigPath);
      }
    }

    // Merge with defaults
    const mergedConfig = this.mergeWithDefaults(config);

    // Validate
    this.validate(mergedConfig);

    return mergedConfig;
  }

  /**
   * Load configuration from a JSON file
   */
  private async loadFromFile(filePath: string): Promise<Partial<Config>> {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.cwd, filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new ProjectionError(
        `Configuration file not found: ${filePath}`,
        ErrorCodes.FILE_NOT_FOUND,
        { path: absolutePath }
      );
    }

    try {
      const ext = path.extname(absolutePath);

      if (ext === '.json') {
        // Load JSON config
        const content = fs.readFileSync(absolutePath, 'utf-8');
        return JSON.parse(content);
      } else {
        throw new ProjectionError(
          `Unsupported config file format: ${ext}. Only .json is supported.`,
          ErrorCodes.CONFIG_ERROR,
          { path: absolutePath, supportedFormats: ['.json'] }
        );
      }
    } catch (error) {
      if (error instanceof ProjectionError) {
        throw error;
      }

      throw new ProjectionError(
        `Failed to parse configuration file: ${filePath}`,
        ErrorCodes.PARSE_ERROR,
        { path: absolutePath, originalError: (error as Error).message }
      );
    }
  }

  /**
   * Merge user config with defaults
   */
  private mergeWithDefaults(userConfig: Partial<Config>): Config {
    return {
      ...DEFAULT_CONFIG,
      ...userConfig
    };
  }

  /**
   * Validate configuration and throw errors for invalid values
   */
  validate(config: Config): void {
    const errors: string[] = [];

    // Validate required fields
    if (!config.title || typeof config.title !== 'string' || config.title.trim() === '') {
      errors.push('title must be a non-empty string');
    }

    if (!config.description || typeof config.description !== 'string') {
      errors.push('description must be a string');
    }

    if (!config.baseUrl || typeof config.baseUrl !== 'string') {
      errors.push('baseUrl must be a string');
    }

    // Validate optional fields
    if (config.dynamicBackgrounds !== undefined) {
      if (!Array.isArray(config.dynamicBackgrounds)) {
        errors.push('dynamicBackgrounds must be an array');
      } else {
        config.dynamicBackgrounds.forEach((bg, index) => {
          if (typeof bg !== 'string') {
            errors.push(`dynamicBackgrounds[${index}] must be a string`);
          }
        });
      }
    }

    if (config.customStyles !== undefined && typeof config.customStyles !== 'string') {
      errors.push('customStyles must be a string');
    }

    if (config.customScripts !== undefined && typeof config.customScripts !== 'string') {
      errors.push('customScripts must be a string');
    }

    if (config.output !== undefined && typeof config.output !== 'string') {
      errors.push('output must be a string');
    }

    if (errors.length > 0) {
      throw new ProjectionError(
        'Invalid configuration',
        ErrorCodes.CONFIG_ERROR,
        { errors }
      );
    }
  }

  /**
   * Get default configuration
   */
  static getDefaults(): Config {
    return { ...DEFAULT_CONFIG };
  }
}
