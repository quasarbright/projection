/**
 * Custom error class for Projection-specific errors
 */
export class ProjectionError extends Error {
  /** Error code for categorization */
  public readonly code: string;
  /** Additional error details */
  public readonly details: Record<string, any>;

  constructor(message: string, code: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'ProjectionError';
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProjectionError);
    }
  }

  /**
   * Formats the error as a user-friendly message
   */
  toUserMessage(): string {
    let message = `❌ Error: ${this.message}\n`;

    if (Object.keys(this.details).length > 0) {
      message += '\nDetails:\n';
      for (const [key, value] of Object.entries(this.details)) {
        message += `  ${key}: ${value}\n`;
      }
    }

    return message;
  }
}

/**
 * Error codes for different error categories
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFIG_ERROR: 'CONFIG_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  RUNTIME_ERROR: 'RUNTIME_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
