/**
 * Admin server for managing project data through a web interface
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { AdminServerConfig } from './types';

/**
 * Admin server class that provides a web interface for managing projects
 */
export class AdminServer {
  private app: Express;
  private config: AdminServerConfig;
  private server: any;

  constructor(config: AdminServerConfig) {
    this.config = config;
    this.app = express();
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

    // Placeholder API routes (will be implemented in later tasks)
    this.app.get('/api/projects', (req: Request, res: Response) => {
      res.status(501).json({ error: 'Not implemented yet' });
    });

    this.app.post('/api/projects', (req: Request, res: Response) => {
      res.status(501).json({ error: 'Not implemented yet' });
    });

    this.app.put('/api/projects/:id', (req: Request, res: Response) => {
      res.status(501).json({ error: 'Not implemented yet' });
    });

    this.app.delete('/api/projects/:id', (req: Request, res: Response) => {
      res.status(501).json({ error: 'Not implemented yet' });
    });

    this.app.get('/api/tags', (req: Request, res: Response) => {
      res.status(501).json({ error: 'Not implemented yet' });
    });

    this.app.get('/api/config', (req: Request, res: Response) => {
      res.status(501).json({ error: 'Not implemented yet' });
    });

    this.app.post('/api/preview', (req: Request, res: Response) => {
      res.status(501).json({ error: 'Not implemented yet' });
    });

    // Fallback route for client-side routing (SPA)
    this.app.get('*', (req: Request, res: Response) => {
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
