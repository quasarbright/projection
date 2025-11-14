import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../../types';

/**
 * Manages reading and writing the projection.config.json file
 */
export class ConfigFileManager {
  private configFilePath: string;

  constructor(cwd: string) {
    this.configFilePath = path.join(cwd, 'projection.config.json');
  }

  /**
   * Read configuration from projection.config.json
   */
  async readConfig(): Promise<Config> {
    if (!fs.existsSync(this.configFilePath)) {
      throw new Error(`Configuration file not found: ${this.configFilePath}`);
    }

    const content = await fs.promises.readFile(this.configFilePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Write configuration to projection.config.json
   */
  async writeConfig(config: Config): Promise<void> {
    const content = JSON.stringify(config, null, 2);
    await fs.promises.writeFile(this.configFilePath, content, 'utf-8');
  }

  /**
   * Check if projection.config.json exists
   */
  exists(): boolean {
    return fs.existsSync(this.configFilePath);
  }

  /**
   * Get the config file path
   */
  getFilePath(): string {
    return this.configFilePath;
  }
}
