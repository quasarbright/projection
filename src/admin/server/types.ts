/**
 * Type definitions for the admin server
 */

// Reuse existing types from core system
export { Project, ProjectsData, Config } from '../../types';

/**
 * Configuration options for the admin server
 */
export interface AdminServerConfig {
  /** Port number for the admin server (default: 3000) */
  port: number;
  /** Path to the projects data file (YAML or JSON) */
  projectsFilePath: string;
  /** Optional path to the config file */
  configFilePath?: string;
  /** Whether to automatically open browser on server start */
  autoOpen: boolean;
  /** Enable CORS for development */
  cors: boolean;
}
