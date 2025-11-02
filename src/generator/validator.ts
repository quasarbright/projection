import * as fs from 'fs';
import * as path from 'path';
import { Project } from '../types/project';
import { isValidProjectId } from '../types/project';
import { ProjectionError, ErrorCodes } from '../utils/errors';

/**
 * Validation error for a specific project
 */
export interface ValidationError {
  /** Project ID (if available) */
  projectId?: string;
  /** Index of the project in the array */
  projectIndex: number;
  /** Field that failed validation */
  field: string;
  /** Error message */
  message: string;
}

/**
 * Validation warning for a specific project
 */
export interface ValidationWarning {
  /** Project ID (if available) */
  projectId?: string;
  /** Index of the project in the array */
  projectIndex: number;
  /** Field that has a warning */
  field: string;
  /** Warning message */
  message: string;
}

/**
 * Result of validation containing all errors and warnings found
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Array of validation errors */
  errors: ValidationError[];
  /** Array of validation warnings */
  warnings: ValidationWarning[];
}

/**
 * Validates project data according to requirements
 */
export class Validator {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  /**
   * Validates an array of projects
   * @param projects - Array of projects to validate
   * @throws ProjectionError if validation fails
   * @returns Array of warnings (non-fatal issues)
   */
  validate(projects: Project[]): ValidationWarning[] {
    const result = this.validateProjects(projects);
    
    if (!result.valid) {
      throw new ProjectionError(
        'Project data validation failed',
        ErrorCodes.VALIDATION_ERROR,
        { errors: result.errors }
      );
    }

    return result.warnings;
  }

  /**
   * Validates projects and returns detailed results
   * @param projects - Array of projects to validate
   * @returns ValidationResult with all errors and warnings found
   */
  validateProjects(projects: Project[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!Array.isArray(projects)) {
      return {
        valid: false,
        errors: [{
          projectIndex: -1,
          field: 'projects',
          message: 'Projects must be an array'
        }],
        warnings: []
      };
    }

    if (projects.length === 0) {
      return {
        valid: false,
        errors: [{
          projectIndex: -1,
          field: 'projects',
          message: 'Projects array cannot be empty'
        }],
        warnings: []
      };
    }

    // Track project IDs for duplicate detection
    const seenIds = new Set<string>();

    projects.forEach((project, index) => {
      // Validate required fields
      errors.push(...this.validateRequiredFields(project, index));

      // Validate project ID format
      if (project.id) {
        errors.push(...this.validateProjectId(project.id, index));
        
        // Check for duplicate IDs
        if (seenIds.has(project.id)) {
          errors.push({
            projectId: project.id,
            projectIndex: index,
            field: 'id',
            message: `Duplicate project ID: "${project.id}"`
          });
        } else {
          seenIds.add(project.id);
        }
      }

      // Validate date format
      if (project.creationDate) {
        errors.push(...this.validateDateFormat(project.creationDate, project.id, index));
      }

      // Check for missing local asset files (warnings only)
      warnings.push(...this.checkLocalAssets(project, index));
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates that all required fields are present
   */
  private validateRequiredFields(project: any, index: number): ValidationError[] {
    const errors: ValidationError[] = [];
    const requiredFields = ['id', 'title', 'pageLink', 'creationDate'];

    requiredFields.forEach(field => {
      if (!project[field] || (typeof project[field] === 'string' && project[field].trim() === '')) {
        errors.push({
          projectId: project.id,
          projectIndex: index,
          field,
          message: `Missing required field: "${field}"`
        });
      }
    });

    return errors;
  }

  /**
   * Validates project ID format (URL slug pattern)
   */
  private validateProjectId(id: string, index: number): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!isValidProjectId(id)) {
      errors.push({
        projectId: id,
        projectIndex: index,
        field: 'id',
        message: `Invalid project ID format: "${id}". Must be lowercase alphanumeric with hyphens, cannot start or end with hyphen`
      });
    }

    return errors;
  }

  /**
   * Validates date format (ISO date string YYYY-MM-DD)
   */
  private validateDateFormat(date: string, projectId: string | undefined, index: number): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check basic format YYYY-MM-DD
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
      errors.push({
        projectId,
        projectIndex: index,
        field: 'creationDate',
        message: `Invalid date format: "${date}". Expected format: YYYY-MM-DD (e.g., "2024-01-15")`
      });
      return errors;
    }

    // Validate that it's a real date by checking if the parsed date matches the input
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      errors.push({
        projectId,
        projectIndex: index,
        field: 'creationDate',
        message: `Invalid date: "${date}". Date does not exist`
      });
      return errors;
    }

    // Check if the date was normalized (e.g., 2024-02-30 becomes 2024-03-01)
    const isoString = parsedDate.toISOString().split('T')[0];
    if (isoString !== date) {
      errors.push({
        projectId,
        projectIndex: index,
        field: 'creationDate',
        message: `Invalid date: "${date}". Date does not exist`
      });
    }

    return errors;
  }

  /**
   * Checks if local asset files exist (generates warnings, not errors)
   */
  private checkLocalAssets(project: Project, index: number): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check thumbnailLink if it's a local path
    if (project.thumbnailLink) {
      warnings.push(...this.checkLocalFile(
        project.thumbnailLink,
        'thumbnailLink',
        project.id,
        index
      ));
    }

    return warnings;
  }

  /**
   * Checks if a file path is local and if it exists
   */
  private checkLocalFile(
    filePath: string,
    field: string,
    projectId: string | undefined,
    index: number
  ): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Skip if it's an absolute URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return warnings;
    }

    // Skip if it's a domain-absolute path (starts with /)
    if (filePath.startsWith('/')) {
      return warnings;
    }

    // It's a local relative path - check if it exists
    let resolvedPath: string;

    if (filePath.startsWith('./')) {
      resolvedPath = path.join(this.cwd, filePath.substring(2));
    } else if (filePath.startsWith('../')) {
      resolvedPath = path.join(this.cwd, filePath);
    } else {
      // Path without prefix - treat as relative to cwd
      resolvedPath = path.join(this.cwd, filePath);
    }

    if (!fs.existsSync(resolvedPath)) {
      warnings.push({
        projectId,
        projectIndex: index,
        field,
        message: `Local file not found: "${filePath}" (resolved to: ${resolvedPath})`
      });
    }

    return warnings;
  }
}
