import { parseDocument, Document, Scalar, isScalar } from 'yaml';
import * as fs from 'fs';
import { Project, ProjectsData } from '../../types';

/**
 * Helper function to recursively quote date strings in YAML nodes
 */
function quoteDateStrings(node: any): void {
  if (!node) return;
  
  if (isScalar(node)) {
    // If it's a scalar that looks like a date (YYYY-MM-DD), quote it
    if (typeof node.value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(node.value)) {
      node.type = 'QUOTE_DOUBLE';
    }
  } else if (node.items) {
    // It's a collection (array or object)
    for (const item of node.items) {
      if (item && item.value) {
        quoteDateStrings(item.value);
      }
      if (item && item.key) {
        quoteDateStrings(item.key);
      }
    }
  }
}

/**
 * YAML file manager that preserves comments and formatting
 * Uses the yaml package's Document API for surgical updates
 */
export class YAMLFileManager {
  private doc: Document | null = null;
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Read projects from YAML file
   * Parses the file and stores the Document for future modifications
   */
  async readProjects(): Promise<ProjectsData> {
    const fileContent = await fs.promises.readFile(this.filePath, 'utf-8');
    this.doc = parseDocument(fileContent);
    
    // Convert to plain JS object for validation and use
    const data = this.doc.toJS() as ProjectsData;
    
    // Ensure projects array exists
    if (!data.projects) {
      data.projects = [];
    }
    
    return data;
  }

  /**
   * Update an existing project in the YAML file
   * Modifies the Document node directly to preserve comments
   */
  async updateProject(projectId: string, updatedProject: Project): Promise<void> {
    if (!this.doc) {
      throw new Error('Document not loaded. Call readProjects() first.');
    }

    const projects = this.doc.get('projects') as any;
    
    if (!projects || !projects.items) {
      throw new Error('Projects array not found in document');
    }

    // Find the project index
    const projectIndex = projects.items.findIndex(
      (p: any) => p && p.get && p.get('id') === projectId
    );

    if (projectIndex === -1) {
      throw new Error(`Project with id "${projectId}" not found`);
    }

    // Ensure creationDate is a string (not a Date object)
    const projectToSave = {
      ...updatedProject,
      creationDate: typeof updatedProject.creationDate === 'string' 
        ? updatedProject.creationDate 
        : (updatedProject.creationDate as Date).toISOString().split('T')[0]
    };

    // Replace the project node with updated data
    // This preserves comments around the project
    const newNode = this.doc.createNode(projectToSave);
    
    // Force date strings to be quoted
    quoteDateStrings(newNode);
    
    projects.items[projectIndex] = newNode;

    // Write back to file
    await fs.promises.writeFile(this.filePath, this.doc.toString(), 'utf-8');
  }

  /**
   * Add a new project to the YAML file
   * Appends to the projects array while preserving existing structure
   */
  async addProject(project: Project): Promise<void> {
    if (!this.doc) {
      throw new Error('Document not loaded. Call readProjects() first.');
    }

    // Ensure creationDate is a string (not a Date object)
    const projectToSave = {
      ...project,
      creationDate: typeof project.creationDate === 'string' 
        ? project.creationDate 
        : (project.creationDate as Date).toISOString().split('T')[0]
    };

    let projects = this.doc.get('projects') as any;
    
    // If projects doesn't exist, create it with the new project
    if (!projects) {
      this.doc.set('projects', [projectToSave]);
    } else if (projects.items) {
      // If projects exists and has items, add to it
      const newNode = this.doc.createNode(projectToSave);
      
      // Force date strings to be quoted
      quoteDateStrings(newNode);
      
      projects.items.push(newNode);
    } else {
      // Fallback: recreate projects array with new project
      const existingProjects = this.doc.toJS().projects || [];
      this.doc.set('projects', [...existingProjects, projectToSave]);
    }

    // Write back to file
    await fs.promises.writeFile(this.filePath, this.doc.toString(), 'utf-8');
  }

  /**
   * Delete a project from the YAML file
   * Removes the project node while preserving other structure
   */
  async deleteProject(projectId: string): Promise<void> {
    if (!this.doc) {
      throw new Error('Document not loaded. Call readProjects() first.');
    }

    const projects = this.doc.get('projects') as any;
    
    if (!projects || !projects.items) {
      throw new Error('Projects array not found in document');
    }

    // Find the project index
    const projectIndex = projects.items.findIndex(
      (p: any) => p && p.get && p.get('id') === projectId
    );

    if (projectIndex === -1) {
      throw new Error(`Project with id "${projectId}" not found`);
    }

    // Remove the project
    projects.items.splice(projectIndex, 1);

    // Write back to file
    await fs.promises.writeFile(this.filePath, this.doc.toString(), 'utf-8');
  }

}
