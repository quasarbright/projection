/**
 * Configuration options for the portfolio generator
 */
export interface Config {
  /** Site title */
  title: string;
  /** Site description */
  description: string;
  /** Base URL for path resolution */
  baseUrl: string;
  /** Number of items per page (for pagination, future use) */
  itemsPerPage?: number;
  /** Array of background iframe URLs for dynamic backgrounds */
  dynamicBackgrounds?: string[];
  /** Fallback thumbnail image path */
  defaultScreenshot?: string;
  /** Path to custom styles directory */
  customStyles?: string;
  /** Path to custom scripts directory */
  customScripts?: string;
  /** Output directory path (default: dist) */
  output?: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Config = {
  title: "My Projects",
  description: "A showcase of my coding projects",
  baseUrl: "./",
  itemsPerPage: 20,
  dynamicBackgrounds: [],
  defaultScreenshot: undefined,
  customStyles: undefined,
  customScripts: undefined,
  output: "dist"
};
