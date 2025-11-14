import React from 'react';
import './DeployDialog.css';

interface DeploymentInfo {
  repositoryUrl: string;
  branch: string;
  baseUrl: string;
  homepage: string | null;
  buildDir: string;
}

interface DeployDialogProps {
  isOpen: boolean;
  deployConfig: DeploymentInfo;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeployDialog({
  isOpen,
  deployConfig,
  onConfirm,
  onCancel,
}: DeployDialogProps) {
  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div
      className="deploy-dialog-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deploy-dialog-title"
      aria-describedby="deploy-dialog-description"
    >
      <div className="deploy-dialog">
        <div className="deploy-dialog-header">
          <h2 id="deploy-dialog-title" className="deploy-dialog-title">
            🚀 Deploy to GitHub Pages
          </h2>
        </div>

        <div className="deploy-dialog-body">
          <p id="deploy-dialog-description" className="deploy-dialog-description">
            Your portfolio will be deployed with the following configuration:
          </p>

          <div className="deploy-config-details">
            <div className="config-item">
              <span className="config-label">Repository:</span>
              <span className="config-value">{deployConfig.repositoryUrl}</span>
            </div>

            <div className="config-item">
              <span className="config-label">Branch:</span>
              <span className="config-value">{deployConfig.branch}</span>
            </div>

            <div className="config-item">
              <span className="config-label">Base URL:</span>
              <span className="config-value">{deployConfig.baseUrl}</span>
            </div>

            {deployConfig.homepage && (
              <div className="config-item">
                <span className="config-label">Custom Domain:</span>
                <span className="config-value">{deployConfig.homepage}</span>
              </div>
            )}

            <div className="config-item">
              <span className="config-label">Build Directory:</span>
              <span className="config-value">{deployConfig.buildDir}</span>
            </div>
          </div>

          <div className="deploy-warning">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">
              This will build your site and push it to the <strong>{deployConfig.branch}</strong> branch,
              making it publicly accessible.
            </span>
          </div>
        </div>

        <div className="deploy-dialog-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCancel}
            autoFocus
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-deploy"
            onClick={handleConfirm}
          >
            Deploy Now
          </button>
        </div>
      </div>
    </div>
  );
}
