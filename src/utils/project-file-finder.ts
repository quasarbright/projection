import * as fs from 'fs';
import * as path from 'path';

/**
 * Result of finding a projects file
 */
export interface ProjectFileResult {
  /** Full path to the projects file */
  path: string;
  /** File format detected from extension */
  format: 'yaml' | 'json';
}

/**
 * Shared utility for finding and validating projects files
 * Follows DRY principle by centralizing project file discovery logic
 */
export class ProjectFileFinder {
  private static readonly POSSIBLE_FILES = [
    'projects.yaml',
    'projects.yml',
    'projects.json'
  ];

  /**
   * Find the projects file in the specified directory
   * Searches for projects.yaml, projects.yml, or projects.json in order
   * 
   * @param cwd - Directory to search in
   * @returns ProjectFileResult if found, null otherwise
   */
  static find(cwd: string): ProjectFileResult | null {
    for (const fileName of this.POSSIBLE_FILES) {
      const filePath = path.join(cwd, fileName);
      if (fs.existsSync(filePath)) {
        return {
          path: filePath,
          format: this.detectFormat(filePath)
        };
      }
    }
    
    return null;
  }

  /**
   * Find the projects file or throw an error if not found
   * 
   * @param cwd - Directory to search in
   * @returns ProjectFileResult
   * @throws Error if no projects file is found
   */
  static findOrThrow(cwd: string): ProjectFileResult {
    const result = this.find(cwd);
    
    if (!result) {
      throw new Error(
        `No projects file found. Expected one of: ${this.POSSIBLE_FILES.join(', ')}`
      );
    }
    
    return result;
  }

  /**
   * Get all possible projects file paths for a directory
   * Useful for error messages showing what was searched
   * 
   * @param cwd - Directory to get paths for
   * @returns Array of possible file paths
   */
  static getPossiblePaths(cwd: string): string[] {
    return this.POSSIBLE_FILES.map(fileName => path.join(cwd, fileName));
  }

  /**
   * Validate that a specific projects file exists
   * 
   * @param filePath - Path to validate
   * @returns true if file exists, false otherwise
   */
  static exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Resolve a projects file path (handles relative and absolute paths)
   * If path is provided, resolves it relative to cwd
   * If path is not provided, searches for default projects files
   * 
   * @param cwd - Base directory
   * @param providedPath - Optional path provided by user
   * @returns ProjectFileResult if found, null otherwise
   */
  static resolve(cwd: string, providedPath?: string): ProjectFileResult | null {
    if (providedPath) {
      const resolvedPath = path.isAbsolute(providedPath)
        ? providedPath
        : path.resolve(cwd, providedPath);
      
      if (fs.existsSync(resolvedPath)) {
        return {
          path: resolvedPath,
          format: this.detectFormat(resolvedPath)
        };
      }
      
      return null;
    }
    
    return this.find(cwd);
  }

  /**
   * Detect file format from extension
   * 
   * @param filePath - Path to detect format for
   * @returns 'yaml' or 'json'
   */
  private static detectFormat(filePath: string): 'yaml' | 'json' {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.yaml' || ext === '.yml') {
      return 'yaml';
    } else if (ext === '.json') {
      return 'json';
    }
    
    // Default to YAML if extension is unclear
    return 'yaml';
  }

  /**
   * Get list of supported file names
   * 
   * @returns Array of supported file names
   */
  static getSupportedFileNames(): string[] {
    return [...this.POSSIBLE_FILES];
  }
}
