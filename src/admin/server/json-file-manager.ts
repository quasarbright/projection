import * as fs from 'fs';
import { Project, ProjectsData } from '../../types';

/**
 * JSON file manager with pretty-printing
 * Uses standard parse/stringify with 2-space indentation
 */
export class JSONFileManager {
  private filePath: string;
  private data: ProjectsData | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Read projects from JSON file
   */
  async readProjects(): Promise<ProjectsData> {
    const fileContent = await fs.promises.readFile(this.filePath, 'utf-8');
    this.data = JSON.parse(fileContent) as ProjectsData;
    
    // Ensure projects array exists
    if (!this.data.projects) {
      this.data.projects = [];
    }
    
    return this.data;
  }

  /**
   * Update an existing project in the JSON file
   */
  async updateProject(projectId: string, updatedProject: Project): Promise<void> {
    if (!this.data) {
      throw new Error('Data not loaded. Call readProjects() first.');
    }

    const projectIndex = this.data.projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      throw new Error(`Project with id "${projectId}" not found`);
    }

    // Update the project
    this.data.projects[projectIndex] = updatedProject;

    // Write back to file with pretty-printing
    await this.writeData();
  }

  /**
   * Add a new project to the JSON file
   */
  async addProject(project: Project): Promise<void> {
    if (!this.data) {
      throw new Error('Data not loaded. Call readProjects() first.');
    }

    // Add the new project
    this.data.projects.push(project);

    // Write back to file with pretty-printing
    await this.writeData();
  }

  /**
   * Delete a project from the JSON file
   */
  async deleteProject(projectId: string): Promise<void> {
    if (!this.data) {
      throw new Error('Data not loaded. Call readProjects() first.');
    }

    const projectIndex = this.data.projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      throw new Error(`Project with id "${projectId}" not found`);
    }

    // Remove the project
    this.data.projects.splice(projectIndex, 1);

    // Write back to file with pretty-printing
    await this.writeData();
  }

  /**
   * Write data to file with 2-space indentation for readability
   */
  private async writeData(): Promise<void> {
    const json = JSON.stringify(this.data, null, 2);
    await fs.promises.writeFile(this.filePath, json, 'utf-8');
  }
}
