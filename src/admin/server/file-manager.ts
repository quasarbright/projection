import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { Project, ProjectsData } from '../../types';
import { YAMLFileManager } from './yaml-file-manager';
import { JSONFileManager } from './json-file-manager';

/**
 * File format types
 */
export type FileFormat = 'yaml' | 'json';

/**
 * Unified file manager that delegates to YAML or JSON manager
 * Provides format detection, backup functionality, and file watching
 */
export class FileManager {
  private filePath: string;
  private format: FileFormat;
  private manager: YAMLFileManager | JSONFileManager;
  private watcher: chokidar.FSWatcher | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.format = this.detectFormat();
    
    // Create appropriate manager based on format
    if (this.format === 'yaml') {
      this.manager = new YAMLFileManager(filePath);
    } else {
      this.manager = new JSONFileManager(filePath);
    }
  }

  /**
   * Detect file format based on extension
   */
  private detectFormat(): FileFormat {
    const ext = path.extname(this.filePath).toLowerCase();
    
    if (ext === '.yaml' || ext === '.yml') {
      return 'yaml';
    } else if (ext === '.json') {
      return 'json';
    }
    
    // Default to YAML if extension is unclear
    return 'yaml';
  }

  /**
   * Get the detected file format
   */
  getFormat(): FileFormat {
    return this.format;
  }

  /**
   * Read projects from file
   */
  async readProjects(): Promise<ProjectsData> {
    return await this.manager.readProjects();
  }

  /**
   * Update an existing project
   * Creates a backup before modification
   */
  async updateProject(projectId: string, updatedProject: Project): Promise<void> {
    await this.createBackup();
    await this.manager.updateProject(projectId, updatedProject);
  }

  /**
   * Add a new project
   * Creates a backup before modification
   */
  async addProject(project: Project): Promise<void> {
    await this.createBackup();
    await this.manager.addProject(project);
  }

  /**
   * Delete a project
   * Creates a backup before modification
   */
  async deleteProject(projectId: string): Promise<void> {
    await this.createBackup();
    await this.manager.deleteProject(projectId);
  }

  /**
   * Create a backup of the current file
   * Returns the backup file path
   */
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(this.filePath);
    const basename = path.basename(this.filePath, ext);
    const dirname = path.dirname(this.filePath);
    
    const backupPath = path.join(dirname, `${basename}.backup-${timestamp}${ext}`);
    
    try {
      await fs.promises.copyFile(this.filePath, backupPath);
      return backupPath;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error}`);
    }
  }

  /**
   * Watch file for external changes
   * Calls the callback when the file is modified externally
   */
  watchFile(callback: (data: ProjectsData) => void): void {
    // Close existing watcher if any
    if (this.watcher) {
      this.watcher.close();
    }

    // Create new watcher
    this.watcher = chokidar.watch(this.filePath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      }
    });

    // Handle file changes
    this.watcher.on('change', async () => {
      try {
        const data = await this.readProjects();
        callback(data);
      } catch (error) {
        console.error('Error reading file after change:', error);
      }
    });
  }

  /**
   * Stop watching the file
   */
  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
