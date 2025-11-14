/**
 * Admin server for managing project data through a web interface
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { AdminServerConfig } from './types';
import { FileManager } from './file-manager';
import { ImageManager } from './image-manager';
import { DeploymentService } from './deployment-service';
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
  private imageManager: ImageManager;
  private configLoader: ConfigLoader;
  private connections: Set<any>;
  private upload: multer.Multer;

  constructor(config: AdminServerConfig) {
    this.config = config;
    this.app = express();
    this.fileManager = new FileManager(config.projectsFilePath);
    this.imageManager = new ImageManager(path.dirname(config.projectsFilePath));
    this.configLoader = new ConfigLoader(path.dirname(config.projectsFilePath));
    this.connections = new Set();
    
    // Configure multer for file uploads
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: ImageManager.getMaxFileSize()
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = ImageManager.getSupportedMimeTypes();
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Supported types: PNG, JPG, JPEG, GIF, WebP'));
        }
      }
    });
    
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

    // Serve screenshots directory for thumbnail images
    const screenshotsPath = path.join(path.dirname(this.config.projectsFilePath), 'screenshots');
    this.app.use('/screenshots', express.static(screenshotsPath));

    // Serve template assets (CSS/JS) for preview iframe
    const templatePath = path.join(__dirname, '../../templates/default');
    this.app.use('/styles', express.static(path.join(templatePath, 'styles')));
    this.app.use('/scripts', express.static(path.join(templatePath, 'scripts')));
    this.app.use('/assets', express.static(path.join(templatePath, 'assets')));

    // Serve static files from the admin client build directory
    const clientBuildPath = path.join(__dirname, '../client');
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

    // GET /api/preview - Generate full portfolio HTML with admin controls
    this.app.get('/api/preview', async (req: Request, res: Response) => {
      try {
        // Load current project data
        const projectsData = await this.fileManager.readProjects();
        
        // Load configuration
        const config = await this.configLoader.load({
          configPath: this.config.configFilePath
        });
        
        // Instantiate HTMLBuilder with adminMode: true
        const htmlBuilder = new HTMLBuilder(config, { adminMode: true });
        
        // Generate HTML
        const html = htmlBuilder.generateHTML(projectsData);
        
        // Set appropriate headers
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Allow iframe from same origin
        
        res.send(html);
      } catch (error: any) {
        console.error('Error generating preview:', error);
        res.status(500).json({
          error: 'Failed to generate preview',
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

    // POST /api/projects/:id/thumbnail - Upload thumbnail image
    this.app.post('/api/projects/:id/thumbnail', this.upload.single('thumbnail'), async (req: Request, res: Response) => {
      try {
        const projectId = req.params.id;
        const file = req.file;
        const isEditMode = req.query.edit === 'true'; // Check if editing existing project

        if (!file) {
          res.status(400).json({
            success: false,
            error: 'No file uploaded',
            message: 'Request must include a file in the "thumbnail" field'
          });
          return;
        }

        let thumbnailLink: string;

        if (isEditMode) {
          // For edit mode, save as temporary file
          thumbnailLink = await this.imageManager.saveTempImage(projectId, {
            buffer: file.buffer,
            mimetype: file.mimetype,
            size: file.size
          });
        } else {
          // For new projects, save directly
          thumbnailLink = await this.imageManager.saveImage(projectId, {
            buffer: file.buffer,
            mimetype: file.mimetype,
            size: file.size
          });

          // If project exists, update its thumbnailLink
          try {
            const projectsData = await this.fileManager.readProjects();
            const project = projectsData.projects.find(p => p.id === projectId);

            if (project) {
              const updatedProject = { ...project, thumbnailLink };
              await this.fileManager.updateProject(projectId, updatedProject);
            }
          } catch (error) {
            // Ignore errors reading/updating project - the image is saved regardless
            console.log('Note: Image saved but project not updated (may not exist yet)');
          }
        }

        res.json({
          success: true,
          thumbnailLink,
          isTemp: isEditMode
        });
      } catch (error: any) {
        console.error('Error uploading thumbnail:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to upload thumbnail',
          message: error.message
        });
      }
    });

    // DELETE /api/projects/:id/thumbnail - Delete thumbnail image
    this.app.delete('/api/projects/:id/thumbnail', async (req: Request, res: Response) => {
      try {
        const projectId = req.params.id;
        const isTemp = req.query.temp === 'true';

        if (isTemp) {
          // Delete temp file
          await this.imageManager.deleteTempImage(projectId);
        } else {
          // Delete the image file
          await this.imageManager.deleteImage(projectId);

          // If project exists, clear its thumbnailLink
          try {
            const projectsData = await this.fileManager.readProjects();
            const project = projectsData.projects.find(p => p.id === projectId);

            if (project) {
              const updatedProject = { ...project, thumbnailLink: undefined };
              await this.fileManager.updateProject(projectId, updatedProject);
            }
          } catch (error) {
            // Ignore errors reading/updating project
            console.log('Note: Image deleted but project not updated (may not exist)');
          }
        }

        res.json({
          success: true
        });
      } catch (error: any) {
        console.error('Error deleting thumbnail:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete thumbnail',
          message: error.message
        });
      }
    });

    // POST /api/projects/:id/thumbnail/commit - Commit temporary thumbnail
    this.app.post('/api/projects/:id/thumbnail/commit', async (req: Request, res: Response) => {
      try {
        const projectId = req.params.id;

        // Commit the temp file (rename to final)
        const thumbnailLink = await this.imageManager.commitTempImage(projectId);

        if (!thumbnailLink) {
          res.status(404).json({
            success: false,
            error: 'No temporary thumbnail found',
            message: `No temporary thumbnail found for project: ${projectId}`
          });
          return;
        }

        res.json({
          success: true,
          thumbnailLink
        });
      } catch (error: any) {
        console.error('Error committing thumbnail:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to commit thumbnail',
          message: error.message
        });
      }
    });

    // POST /api/projects/:id/thumbnail/cancel - Cancel temporary thumbnail
    this.app.post('/api/projects/:id/thumbnail/cancel', async (req: Request, res: Response) => {
      try {
        const projectId = req.params.id;

        // Delete the temp file
        await this.imageManager.deleteTempImage(projectId);

        res.json({
          success: true
        });
      } catch (error: any) {
        console.error('Error canceling thumbnail:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to cancel thumbnail',
          message: error.message
        });
      }
    });

    // GET /api/deploy/status - Check deployment readiness and configuration
    this.app.get('/api/deploy/status', async (req: Request, res: Response) => {
      try {
        const cwd = path.dirname(this.config.projectsFilePath);
        const status = await DeploymentService.getDeploymentStatus(cwd);
        
        res.json(status);
      } catch (error: any) {
        console.error('Error checking deployment status:', error);
        res.status(500).json({
          error: 'Failed to check deployment status',
          message: error.message
        });
      }
    });

    // GET /api/deploy/config - Get deployment configuration details
    this.app.get('/api/deploy/config', async (req: Request, res: Response) => {
      try {
        const cwd = path.dirname(this.config.projectsFilePath);
        const config = await DeploymentService.getDeploymentConfig(cwd);
        
        res.json(config);
      } catch (error: any) {
        console.error('Error getting deployment config:', error);
        res.status(500).json({
          error: 'Failed to get deployment configuration',
          message: error.message
        });
      }
    });

    // POST /api/deploy - Trigger deployment to GitHub Pages
    this.app.post('/api/deploy', async (req: Request, res: Response) => {
      try {
        const cwd = path.dirname(this.config.projectsFilePath);
        const deployRequest = req.body;
        
        // Validate request body
        if (deployRequest.force !== undefined && typeof deployRequest.force !== 'boolean') {
          res.status(400).json({
            error: 'Invalid request',
            message: 'force must be a boolean'
          });
          return;
        }

        if (deployRequest.message !== undefined && typeof deployRequest.message !== 'string') {
          res.status(400).json({
            error: 'Invalid request',
            message: 'message must be a string'
          });
          return;
        }

        // Execute deployment
        const result = await DeploymentService.deploy(cwd, deployRequest);
        
        if (result.success) {
          res.json(result);
        } else {
          res.status(500).json(result);
        }
      } catch (error: any) {
        console.error('Error during deployment:', error);
        res.status(500).json({
          success: false,
          message: 'Deployment failed',
          error: {
            code: 'DEPLOYMENT_ERROR',
            message: error.message
          }
        });
      }
    });

    // Fallback route for client-side routing (SPA)
    // Use a regex pattern to match all paths that don't start with /api
    this.app.get(/^(?!\/api).*$/, (req: Request, res: Response) => {
      const indexPath = path.join(__dirname, '../client/index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          res.status(404).send('Admin client not found. Please build the admin client first.');
        }
      });
    });
  }

  /**
   * Start the admin server
   * @returns The actual port the server is listening on
   */
  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, () => {
          const actualPort = this.server.address().port;
          console.log(`Admin server running at http://localhost:${actualPort}`);
          resolve(actualPort);
        });

        // Track connections for graceful shutdown
        this.server.on('connection', (conn: any) => {
          this.connections.add(conn);
          conn.on('close', () => {
            this.connections.delete(conn);
          });
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

      // Close all active connections
      for (const conn of this.connections) {
        conn.destroy();
      }
      this.connections.clear();

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
 * @returns Object containing the server instance and the actual port it's running on
 */
export async function startAdminServer(config: AdminServerConfig): Promise<{ server: AdminServer; port: number }> {
  const server = new AdminServer(config);
  const actualPort = await server.start();

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

  return { server, port: actualPort };
}
