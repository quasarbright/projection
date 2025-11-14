import React, { useEffect, useState } from 'react';
import './DeployProgress.css';

interface DeploymentStatus {
  step: 'validating' | 'building' | 'deploying' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
  startTime: number;
  endTime?: number;
  error?: {
    message: string;
    details?: string;
    solution?: string;
  };
}

interface DeployProgressProps {
  isOpen: boolean;
  status: DeploymentStatus;
  onClose?: () => void;
}

export function DeployProgress({
  isOpen,
  status,
  onClose,
}: DeployProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isOpen || status.step === 'complete' || status.step === 'error') {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - status.startTime;
      setElapsedTime(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, status.startTime, status.step]);

  if (!isOpen) {
    return null;
  }

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const getStepIcon = (step: string): string => {
    switch (step) {
      case 'validating':
        return '🔍';
      case 'building':
        return '🔨';
      case 'deploying':
        return '🚀';
      case 'complete':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStepLabel = (step: string): string => {
    switch (step) {
      case 'validating':
        return 'Validating Git setup';
      case 'building':
        return 'Building site';
      case 'deploying':
        return 'Deploying to GitHub Pages';
      case 'complete':
        return 'Deployment complete!';
      case 'error':
        return 'Deployment failed';
      default:
        return 'Processing';
    }
  };

  const isStepComplete = (stepName: string): boolean => {
    const steps = ['validating', 'building', 'deploying', 'complete'];
    const currentIndex = steps.indexOf(status.step);
    const stepIndex = steps.indexOf(stepName);
    return stepIndex < currentIndex || status.step === 'complete';
  };

  const isStepActive = (stepName: string): boolean => {
    return status.step === stepName;
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && (status.step === 'complete' || status.step === 'error')) {
      onClose?.();
    }
  };

  const canClose = status.step === 'complete' || status.step === 'error';
  const displayTime = status.endTime 
    ? formatTime(status.endTime - status.startTime)
    : formatTime(elapsedTime);

  return (
    <div
      className="deploy-progress-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deploy-progress-title"
      aria-describedby="deploy-progress-description"
    >
      <div className="deploy-progress">
        <div className="deploy-progress-header">
          <h2 id="deploy-progress-title" className="deploy-progress-title">
            {getStepIcon(status.step)} {getStepLabel(status.step)}
          </h2>
          <div className="deploy-progress-time">
            {displayTime}
          </div>
        </div>

        <div className="deploy-progress-body">
          <p id="deploy-progress-description" className="deploy-progress-message">
            {status.message}
          </p>

          {status.step !== 'error' && (
            <>
              <div className="deploy-progress-bar">
                <div
                  className="deploy-progress-fill"
                  style={{ width: `${status.progress}%` }}
                  role="progressbar"
                  aria-valuenow={status.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Deployment progress: ${status.progress}%`}
                />
              </div>

              <div className="deploy-progress-percentage">
                {status.progress}%
              </div>

              <div className="deploy-steps">
                <div className={`deploy-step ${isStepComplete('validating') ? 'complete' : ''} ${isStepActive('validating') ? 'active' : ''}`}>
                  <div className="step-icon">
                    {isStepComplete('validating') ? '✓' : '1'}
                  </div>
                  <div className="step-label">Validating</div>
                </div>

                <div className="step-connector" />

                <div className={`deploy-step ${isStepComplete('building') ? 'complete' : ''} ${isStepActive('building') ? 'active' : ''}`}>
                  <div className="step-icon">
                    {isStepComplete('building') ? '✓' : '2'}
                  </div>
                  <div className="step-label">Building</div>
                </div>

                <div className="step-connector" />

                <div className={`deploy-step ${isStepComplete('deploying') ? 'complete' : ''} ${isStepActive('deploying') ? 'active' : ''}`}>
                  <div className="step-icon">
                    {isStepComplete('deploying') ? '✓' : '3'}
                  </div>
                  <div className="step-label">Deploying</div>
                </div>
              </div>
            </>
          )}

          {status.step === 'error' && status.error && (
            <div className="deploy-error">
              <div className="error-message">
                <span className="error-icon-inline">⚠️</span>
                {status.error.message}
              </div>
              {status.error.solution && (
                <div className="error-solution">
                  <div className="solution-header">
                    <span className="solution-icon">💡</span>
                    <strong>How to fix this:</strong>
                  </div>
                  <p className="solution-text">{status.error.solution}</p>
                </div>
              )}
              {status.error.details && (
                <details className="error-details-expandable">
                  <summary>View technical details</summary>
                  <div className="error-details">
                    <pre>{status.error.details}</pre>
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {canClose && (
          <div className="deploy-progress-footer">
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              autoFocus
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
