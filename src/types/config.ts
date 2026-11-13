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
  /** Page heading shown in the hero and the top bar, e.g. "Coding Projects" (default: "Projects") */
  heading?: string;
  /** Where the site title in the top bar links to, e.g. your home page. Not a link when unset. */
  homeUrl?: string;
  /** Array of background iframe URLs for dynamic backgrounds */
  dynamicBackgrounds?: string[];
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
  dynamicBackgrounds: [],
  customStyles: undefined,
  customScripts: undefined,
  output: "dist"
};
