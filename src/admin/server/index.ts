/**
 * Admin server for managing project data through a web interface
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { AdminServerConfig } from './types';
import { FileManager } from './file-manager';
import { ConfigLoader } from '../../generator/config';
import { Validator } from '../../generator/validator';
import { HTMLBuilder } from '../../generator/html-builder';
import { Project } from '../../types';

/**
 * Admin server class that provides a web interface for managing projects
 */
export class AdminServer {
  private app: Express;
  private config: AdminServerConfig;
  private server: any;
  private fileManager: FileManager;
  private configLoader: ConfigLoader;

  constructor(config: AdminServerConfig) {
    this.config = config;
    this.app = express();
    this.fileManager = new FileManager(config.projectsFilePath);
    this.configLoader = new ConfigLoader(path.dirname(config.projectsFilePath));
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Set up Express middleware
   */
  private setupMiddleware(): void {
    // Enable CORS for development
    if (this.config.cors) {
      this.app.use(cors());
    }

    // Parse JSON request bodies
    this.app.use(express.json());

    // Parse URL-encoded request bodies
    this.app.use(express.urlencoded({ extended: true }));

    // Serve static files from the admin client build directory
    const clientBuildPath = path.join(__dirname, '../client/dist');
    this.app.use(express.static(clientBuildPath));
  }

  /**
   * Set up Express routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // GET /api/projects - Read all projects and config
    this.app.get('/api/projects', async (req: Request, res: Response) => {
      try {
        const projectsData = await this.fileManager.readProjects();
        const config = await this.configLoader.load({
          configPath: this.config.configFilePath
        });
        
        res.json({
          projects: projectsData.projects,
          config
        });
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          res.status(404).json({
            error: 'Projects file not found',
            message: `Could not find projects file at ${this.config.projectsFilePath}. Try running 'projection init' first.`,
            path: this.config.projectsFilePath
          });
        } else {
          console.error('Error reading projects:', error);
          res.status(500).json({
            error: 'Failed to read projects',
            message: error.message
          });
        }
      }
    });

    // POST /api/projects - Create a new project
    this.app.post('/api/projects', async (req: Request, res: Response) => {
      try {
        const newProject: Project = req.body.project;
        
        if (!newProject) {
          res.status(400).json({
            error: 'Invalid request',
            message: 'Request body must contain a "project" field'
          });
          return;
        }

        // Read existing projects for validation
        const projectsData = await this.fileManager.readProjects();
        const allProjects = [...projectsData.projects, newProject];

        // Validate the new project
        const validator = new Validator(path.dirname(this.config.projectsFilePath));
        const validationResult = validator.validateProjects(allProjects);

        if (!validationResult.valid) {
          res.status(400).json({
            success: false,
            errors: validationResult.errors,
            message: 'Validation failed'
          });
          return;
        }

        // Add the project
        await this.fileManager.addProject(newProject);

        res.status(201).json({
          success: true,
          project: newProject,
          warnings: validationResult.warnings
        });
      } catch (error: any) {
        console.error('Error creating project:', error);
        res.status(500).json({
          error: 'Failed to create project',
          message: error.message
        });
      }
    });

    // PUT /api/projects/:id - Update an existing project
    this.app.put('/api/projects/:id', async (req: Request, res: Response) => {
      try {
        const projectId = req.params.id;
        const updatedProject: Project = req.body.project;
        
        if (!updatedProject) {
          res.status(400).json({
            error: 'Invalid request',
            message: 'Request body must contain a "project" field'
          });
          return;
        }

        // Read existing projects
        const projectsData = await this.fileManager.readProjects();
        const projectIndex = projectsData.projects.findIndex(p => p.id === projectId);

        if (projectIndex === -1) {
          res.status(404).json({
            error: 'Project not found',
            message: `No project found with id: ${projectId}`
          });
          return;
        }

        // Create updated projects array for validation
        const allProjects = [...projectsData.projects];
        allProjects[projectIndex] = updatedProject;

        // Validate the updated project
        const validator = new Validator(path.dirname(this.config.projectsFilePath));
        const validationResult = validator.validateProjects(allProjects);

        if (!validationResult.valid) {
          res.status(400).json({
            success: false,
            errors: validationResult.errors,
            message: 'Validation failed'
          });
          return;
        }

        // Update the project
        await this.fileManager.updateProject(projectId, updatedProject);

        res.json({
          success: true,
          project: updatedProject,
          warnings: validationResult.warnings
        });
      } catch (error: any) {
        console.error('Error updating project:', error);
        res.status(500).json({
          error: 'Failed to update project',
          message: error.message
        });
      }
    });

    // DELETE /api/projects/:id - Delete a project
    this.app.delete('/api/projects/:id', async (req: Request, res: Response) => {
      try {
        const projectId = req.params.id;

        // Read existing projects to verify it exists
        const projectsData = await this.fileManager.readProjects();
        const projectExists = projectsData.projects.some(p => p.id === projectId);

        if (!projectExists) {
          res.status(404).json({
            error: 'Project not found',
            message: `No project found with id: ${projectId}`
          });
          return;
        }

        // Delete the project
        await this.fileManager.deleteProject(projectId);

        res.json({
          success: true,
          deletedId: projectId
        });
      } catch (error: any) {
        console.error('Error deleting project:', error);
        res.status(500).json({
          error: 'Failed to delete project',
          message: error.message
        });
      }
    });

    // GET /api/tags - Get all unique tags with usage counts
    this.app.get('/api/tags', async (req: Request, res: Response) => {
      try {
        const projectsData = await this.fileManager.readProjects();
        
        // Count tag usage
        const tagCounts = new Map<string, number>();
        
        projectsData.projects.forEach(project => {
          project.tags.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
        });

        // Convert to array and sort by count (descending), then by name
        const tags = Array.from(tagCounts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => {
            if (b.count !== a.count) {
              return b.count - a.count;
            }
            return a.name.localeCompare(b.name);
          });

        res.json({ tags });
      } catch (error: any) {
        console.error('Error reading tags:', error);
        res.status(500).json({
          error: 'Failed to read tags',
          message: error.message
        });
      }
    });

    // GET /api/config - Get merged configuration
    this.app.get('/api/config', async (req: Request, res: Response) => {
      try {
        const config = await this.configLoader.load({
          configPath: this.config.configFilePath
        });
        
        res.json({ config });
      } catch (error: any) {
        console.error('Error loading config:', error);
        res.status(500).json({
          error: 'Failed to load configuration',
          message: error.message
        });
      }
    });

    // POST /api/preview - Generate preview HTML for a project
    this.app.post('/api/preview', async (req: Request, res: Response) => {
      try {
        const partialProject: Partial<Project> = req.body.project;
        
        if (!partialProject) {
          res.status(400).json({
            error: 'Invalid request',
            message: 'Request body must contain a "project" field'
          });
          return;
        }

        // Load config for preview rendering
        const config = await this.configLoader.load({
          configPath: this.config.configFilePath
        });

        // Create a complete project with defaults for missing fields
        const previewProject: Project = {
          id: partialProject.id || 'preview',
          title: partialProject.title || 'Untitled Project',
          description: partialProject.description || 'No description provided',
          creationDate: partialProject.creationDate || new Date().toISOString().split('T')[0],
          tags: partialProject.tags || [],
          pageLink: partialProject.pageLink || '#',
          sourceLink: partialProject.sourceLink,
          thumbnailLink: partialProject.thumbnailLink,
          featured: partialProject.featured || false
        };

        // Generate HTML using HTMLBuilder
        const htmlBuilder = new HTMLBuilder(config);
        const cardHTML = htmlBuilder.generateProjectCard(previewProject);

        // Wrap in a complete HTML document with styles
        const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <link rel="stylesheet" href="/styles/main.css">
  <link rel="stylesheet" href="/styles/cards.css">
  <style>
    body {
      padding: 20px;
      background: #1a1a2e;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    .projects-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      max-width: 600px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div class="projects-grid">
    ${cardHTML}
  </div>
</body>
</html>`;

        res.send(fullHTML);
      } catch (error: any) {
        console.error('Error generating preview:', error);
        res.status(500).json({
          error: 'Failed to generate preview',
          message: error.message
        });
      }
    });

    // Fallback route for client-side routing (SPA)
    // Use a regex pattern to match all paths that don't start with /api
    this.app.get(/^(?!\/api).*$/, (req: Request, res: Response) => {
      const indexPath = path.join(__dirname, '../client/dist/index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          res.status(404).send('Admin client not found. Please build the admin client first.');
        }
      });
    });
  }

  /**
   * Start the admin server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, () => {
          console.log(`Admin server running at http://localhost:${this.config.port}`);
          resolve();
        });

        // Handle port already in use error
        this.server.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            const portError = new Error(
              `Port ${this.config.port} is already in use. Please choose a different port using --port flag.`
            );
            reject(portError);
          } else {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the admin server gracefully
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err: Error | undefined) => {
        if (err) {
          reject(err);
        } else {
          console.log('Admin server stopped gracefully');
          resolve();
        }
      });
    });
  }

  /**
   * Get the Express app instance (useful for testing)
   */
  getApp(): Express {
    return this.app;
  }
}

/**
 * Create and start an admin server with the given configuration
 */
export async function startAdminServer(config: AdminServerConfig): Promise<AdminServer> {
  const server = new AdminServer(config);
  await server.start();

  // Handle graceful shutdown on SIGINT (Ctrl+C) and SIGTERM
  const shutdownHandler = async () => {
    console.log('\nShutting down admin server...');
    try {
      await server.stop();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', shutdownHandler);
  process.on('SIGTERM', shutdownHandler);

  return server;
}
