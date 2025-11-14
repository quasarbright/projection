/**
 * Image manager for handling thumbnail uploads and deletions
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const rename = promisify(fs.rename);

/**
 * Supported image file extensions
 */
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

/**
 * Supported MIME types for image uploads
 */
const SUPPORTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp'
];

/**
 * Maximum file size in bytes (5 MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Image manager class for handling thumbnail operations
 */
export class ImageManager {
  private screenshotsDir: string;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.screenshotsDir = path.join(projectRoot, 'screenshots');
  }

  /**
   * Ensure the screenshots directory exists
   */
  async ensureScreenshotsDir(): Promise<void> {
    try {
      await stat(this.screenshotsDir);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Directory doesn't exist, create it
        await mkdir(this.screenshotsDir, { recursive: true });
      } else {
        throw error;
      }
    }
  }

  /**
   * Validate an uploaded file
   * @throws Error if validation fails
   */
  validateFile(file: { mimetype: string; size: number }): void {
    // Check MIME type
    if (!SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error(
        `Invalid file type: ${file.mimetype}. Supported types: PNG, JPG, JPEG, GIF, WebP`
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      throw new Error(
        `File too large: ${sizeMB} MB. Maximum size: ${maxSizeMB} MB`
      );
    }
  }

  /**
   * Get the file extension from a MIME type
   */
  private getExtensionFromMimeType(mimetype: string): string {
    const mimeToExt: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp'
    };
    return mimeToExt[mimetype] || '.jpg';
  }

  /**
   * Find an existing thumbnail for a project
   * @returns The filename of the existing thumbnail, or null if not found
   */
  async findExistingThumbnail(projectId: string): Promise<string | null> {
    try {
      const files = await readdir(this.screenshotsDir);
      
      // Look for files matching the project ID with any supported extension
      for (const ext of SUPPORTED_EXTENSIONS) {
        const filename = `${projectId}${ext}`;
        if (files.includes(filename)) {
          return filename;
        }
      }
      
      return null;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Directory doesn't exist yet
        return null;
      }
      throw error;
    }
  }

  /**
   * Save an image file for a project
   * @param projectId The project ID
   * @param file The uploaded file with buffer and mimetype
   * @returns The relative path to the saved image
   */
  async saveImage(
    projectId: string,
    file: { buffer: Buffer; mimetype: string; size: number }
  ): Promise<string> {
    // Validate the file
    this.validateFile(file);

    // Ensure screenshots directory exists
    await this.ensureScreenshotsDir();

    // Delete existing thumbnail if present
    const existingThumbnail = await this.findExistingThumbnail(projectId);
    if (existingThumbnail) {
      const existingPath = path.join(this.screenshotsDir, existingThumbnail);
      try {
        await unlink(existingPath);
      } catch (error: any) {
        // Ignore if file doesn't exist
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    // Determine the file extension from MIME type
    const extension = this.getExtensionFromMimeType(file.mimetype);
    const filename = `${projectId}${extension}`;
    const filePath = path.join(this.screenshotsDir, filename);

    // Save the new file
    await writeFile(filePath, file.buffer);

    // Return the relative path
    return this.getRelativePath(projectId, extension);
  }

  /**
   * Delete an image file for a project
   * @param projectId The project ID
   */
  async deleteImage(projectId: string): Promise<void> {
    const existingThumbnail = await this.findExistingThumbnail(projectId);
    
    if (!existingThumbnail) {
      // No thumbnail to delete
      return;
    }

    const filePath = path.join(this.screenshotsDir, existingThumbnail);
    
    try {
      await unlink(filePath);
    } catch (error: any) {
      // Ignore if file doesn't exist
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Save a temporary image file for a project being edited
   * @param projectId The project ID
   * @param file The uploaded file with buffer and mimetype
   * @returns The relative path to the saved temporary image with admin:// prefix
   */
  async saveTempImage(
    projectId: string,
    file: { buffer: Buffer; mimetype: string; size: number }
  ): Promise<string> {
    // Validate the file
    this.validateFile(file);

    // Ensure screenshots directory exists
    await this.ensureScreenshotsDir();

    // Delete existing temp file if present
    await this.deleteTempImage(projectId);

    // Determine the file extension from MIME type
    const extension = this.getExtensionFromMimeType(file.mimetype);
    const filename = `${projectId}.temp${extension}`;
    const filePath = path.join(this.screenshotsDir, filename);

    // Save the temp file
    await writeFile(filePath, file.buffer);

    // Return the relative path with admin:// prefix
    return `admin://${filename}`;
  }

  /**
   * Commit a temporary image (rename from .temp to final name)
   * @param projectId The project ID
   */
  async commitTempImage(projectId: string): Promise<string | null> {
    try {
      const files = await readdir(this.screenshotsDir);
      
      // Find temp file for this project
      for (const ext of SUPPORTED_EXTENSIONS) {
        const tempFilename = `${projectId}.temp${ext}`;
        if (files.includes(tempFilename)) {
          const tempPath = path.join(this.screenshotsDir, tempFilename);
          
          // Delete existing final file if present
          const existingThumbnail = await this.findExistingThumbnail(projectId);
          if (existingThumbnail) {
            const existingPath = path.join(this.screenshotsDir, existingThumbnail);
            try {
              await unlink(existingPath);
            } catch (error: any) {
              if (error.code !== 'ENOENT') {
                throw error;
              }
            }
          }
          
          // Rename temp to final
          const finalFilename = `${projectId}${ext}`;
          const finalPath = path.join(this.screenshotsDir, finalFilename);
          await rename(tempPath, finalPath);
          
          return this.getRelativePath(projectId, ext);
        }
      }
      
      return null;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete a temporary image file
   * @param projectId The project ID
   */
  async deleteTempImage(projectId: string): Promise<void> {
    try {
      const files = await readdir(this.screenshotsDir);
      
      // Find and delete temp file for this project
      for (const ext of SUPPORTED_EXTENSIONS) {
        const tempFilename = `${projectId}.temp${ext}`;
        if (files.includes(tempFilename)) {
          const tempPath = path.join(this.screenshotsDir, tempFilename);
          try {
            await unlink(tempPath);
          } catch (error: any) {
            if (error.code !== 'ENOENT') {
              throw error;
            }
          }
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Get the relative path for a thumbnail
   * @param projectId The project ID
   * @param extension The file extension (including the dot)
   * @returns The relative path with admin:// prefix (e.g., "admin://project-id.png")
   */
  getRelativePath(projectId: string, extension: string): string {
    return `admin://${projectId}${extension}`;
  }

  /**
   * Get the list of supported file extensions
   */
  static getSupportedExtensions(): string[] {
    return [...SUPPORTED_EXTENSIONS];
  }

  /**
   * Get the list of supported MIME types
   */
  static getSupportedMimeTypes(): string[] {
    return [...SUPPORTED_MIME_TYPES];
  }

  /**
   * Get the maximum file size in bytes
   */
  static getMaxFileSize(): number {
    return MAX_FILE_SIZE;
  }
}
