/**
 * Represents a single project in the portfolio
 */
export interface Project {
  /** Unique identifier (must be valid URL slug: lowercase, alphanumeric, hyphens) */
  id: string;
  /** Display name of the project */
  title: string;
  /** Project description */
  description: string;
  /** ISO date string (YYYY-MM-DD) */
  creationDate: string;
  /** Categorization tags */
  tags: string[];
  /** Primary link to the project */
  pageLink: string;
  /** Optional source code link */
  sourceLink?: string;
  /** Optional screenshot/thumbnail path */
  thumbnailLink?: string;
  /** Optional flag to highlight the project */
  featured?: boolean;
}

/**
 * Container for project data and optional embedded configuration
 */
export interface ProjectsData {
  /** Optional embedded configuration */
  config?: Record<string, any>;
  /** Array of projects */
  projects: Project[];
}

/**
 * URL slug validation pattern for project IDs
 * - Must be lowercase
 * - Can contain letters, numbers, and hyphens
 * - Cannot start or end with hyphen
 */
export const PROJECT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validates if a string is a valid project ID (URL slug format)
 */
export function isValidProjectId(id: string): boolean {
  return PROJECT_ID_PATTERN.test(id);
}
