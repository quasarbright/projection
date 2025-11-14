import React, { useState } from 'react';
import './ErrorDialog.css';

interface ErrorDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  errorCode?: string;
  details?: string;
  solution?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export function ErrorDialog({
  isOpen,
  title,
  message,
  errorCode,
  details,
  solution,
  onClose,
  onRetry,
}: ErrorDialogProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div
      className="error-dialog-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-dialog-title"
      aria-describedby="error-dialog-description"
    >
      <div className="error-dialog">
        <div className="error-dialog-header">
          <span className="error-icon">❌</span>
          <h2 id="error-dialog-title" className="error-dialog-title">
            {title}
          </h2>
        </div>

        <div className="error-dialog-body">
          <p id="error-dialog-description" className="error-message">
            {message}
          </p>

          {errorCode && (
            <div className="error-code">
              <span className="error-code-label">Error Code:</span>
              <code>{errorCode}</code>
            </div>
          )}

          {solution && (
            <div className="error-solution">
              <div className="solution-header">
                <span className="solution-icon">💡</span>
                <strong>How to fix this:</strong>
              </div>
              <p className="solution-text">{solution}</p>
            </div>
          )}

          {details && (
            <div className="error-details-section">
              <button
                type="button"
                className="details-toggle"
                onClick={toggleDetails}
                aria-expanded={showDetails}
              >
                <span className="toggle-icon">{showDetails ? '▼' : '▶'}</span>
                {showDetails ? 'Hide Details' : 'View Details'}
              </button>

              {showDetails && (
                <div className="error-details">
                  <pre>{details}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="error-dialog-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
          {onRetry && (
            <button
              type="button"
              className="btn-primary"
              onClick={onRetry}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Get user-friendly error information based on error code
 */
export function getErrorInfo(errorCode: string, errorMessage: string): {
  title: string;
  message: string;
  solution: string;
} {
  switch (errorCode) {
    case 'AUTH_ERROR':
      return {
        title: 'Authentication Failed',
        message: 'Unable to authenticate with GitHub. Your credentials may be invalid or expired.',
        solution: 'Set up SSH keys or a personal access token. Visit GitHub Settings > SSH and GPG keys to add an SSH key, or Settings > Developer settings > Personal access tokens to create a token. For SSH, run "ssh-keygen" to generate a key and add it to GitHub.',
      };

    case 'PUSH_REJECTED':
      return {
        title: 'Push Rejected',
        message: 'The push was rejected, likely due to conflicts with the remote branch.',
        solution: 'The remote branch has changes that conflict with your local deployment. You can either: 1) Use force push to overwrite remote changes (warning: this will discard remote changes), or 2) Manually pull and merge changes from the remote branch first.',
      };

    case 'BUILD_ERROR':
      return {
        title: 'Build Failed',
        message: 'The site build failed. There may be validation errors in your project data.',
        solution: 'Check your project data for errors. Ensure all required fields are filled, image paths are valid, and URLs are properly formatted. Review the error details below for specific validation issues.',
      };

    case 'GIT_ERROR':
      return {
        title: 'Git Error',
        message: 'A Git operation failed during deployment.',
        solution: 'Ensure Git is properly configured and you have the necessary permissions. Check that your repository URL is correct and you have push access. Run "git remote -v" to verify your remote configuration.',
      };

    case 'NETWORK_ERROR':
      return {
        title: 'Network Error',
        message: 'Unable to connect to GitHub. Check your internet connection.',
        solution: 'Verify your internet connection is working. If you\'re behind a proxy or firewall, ensure Git is configured to work with it. Try accessing github.com in your browser to confirm connectivity.',
      };

    case 'DEPLOYMENT_ERROR':
    default:
      return {
        title: 'Deployment Failed',
        message: errorMessage || 'An unexpected error occurred during deployment.',
        solution: 'Review the error details below. If the problem persists, try running the deployment from the command line with "projection deploy" for more detailed output. You can also check the GitHub repository settings to ensure GitHub Pages is enabled.',
      };
  }
}
