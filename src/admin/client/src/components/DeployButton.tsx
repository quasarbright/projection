import { useState, useEffect } from 'react';
import { checkDeploymentStatus, triggerDeployment, getDeploymentConfig } from '../services/api';
import type { DeployStatusResponse, DeployResponse } from '../types/api';
import { ErrorDialog, getErrorInfo } from './ErrorDialog';
import { DeployDialog } from './DeployDialog';
import './DeployButton.css';

interface DeployButtonProps {
  disabled?: boolean;
  onDeployStart?: () => void;
  onDeployComplete?: (success: boolean, url?: string, error?: DeployResponse['error']) => void;
}

type DeploymentState = 'idle' | 'deploying' | 'success' | 'error';

export function DeployButton({
  disabled = false,
  onDeployStart,
  onDeployComplete,
}: DeployButtonProps) {
  const [deploymentState, setDeploymentState] = useState<DeploymentState>('idle');
  const [gitStatus, setGitStatus] = useState<DeployStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [deployError, setDeployError] = useState<DeployResponse['error'] | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deployConfig, setDeployConfig] = useState<any>(null);

  // Fetch Git status on mount
  useEffect(() => {
    fetchGitStatus();
  }, []);

  const fetchGitStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const status = await checkDeploymentStatus();
      setGitStatus(status);
    } catch (error: any) {
      console.error('Failed to check deployment status:', error);
      setGitStatus({
        ready: false,
        gitInstalled: false,
        isGitRepo: false,
        hasRemote: false,
        remoteName: '',
        remoteUrl: '',
        currentBranch: '',
        issues: ['Failed to check Git status'],
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleButtonClick = async () => {
    if (!gitStatus?.ready || disabled || deploymentState === 'deploying') {
      return;
    }

    // Fetch deployment config and show confirmation dialog
    try {
      const config = await getDeploymentConfig();
      setDeployConfig(config);
      setConfirmDialogOpen(true);
    } catch (error: any) {
      console.error('Failed to get deployment config:', error);
      setErrorMessage('Failed to load deployment configuration');
    }
  };

  const handleConfirmDeploy = async () => {
    setConfirmDialogOpen(false);
    
    setDeploymentState('deploying');
    setErrorMessage('');
    setDeployError(null);
    onDeployStart?.();

    try {
      const result = await triggerDeployment();
      
      if (result.success) {
        setDeploymentState('success');
        onDeployComplete?.(true, result.url);
        
        // Reset to idle after 3 seconds
        setTimeout(() => {
          setDeploymentState('idle');
        }, 3000);
      } else {
        setDeploymentState('error');
        setDeployError(result.error || null);
        setErrorMessage(result.error?.message || 'Deployment failed');
        setErrorDialogOpen(true);
        onDeployComplete?.(false, undefined, result.error);
      }
    } catch (error: any) {
      console.error('Deployment failed:', error);
      setDeploymentState('error');
      const errorObj = {
        code: 'DEPLOYMENT_ERROR',
        message: error.message || 'Deployment failed',
        details: error.stack || error.toString(),
      };
      setDeployError(errorObj);
      setErrorMessage(errorObj.message);
      setErrorDialogOpen(true);
      onDeployComplete?.(false, undefined, errorObj);
    }
  };

  const handleCloseErrorDialog = () => {
    setErrorDialogOpen(false);
    // Reset to idle after closing dialog
    setTimeout(() => {
      setDeploymentState('idle');
      setErrorMessage('');
      setDeployError(null);
    }, 300);
  };

  const handleRetryDeploy = () => {
    setErrorDialogOpen(false);
    setDeploymentState('idle');
    setErrorMessage('');
    setDeployError(null);
    // Show confirmation dialog again
    setTimeout(() => {
      handleButtonClick();
    }, 100);
  };

  const handleCancelDeploy = () => {
    setConfirmDialogOpen(false);
  };

  const getTooltipMessage = (): string => {
    // Show error message if there's an active error
    if (errorMessage && deploymentState === 'error') {
      return errorMessage;
    }

    // Show loading state
    if (!gitStatus || isLoadingStatus) {
      return 'Checking Git status...';
    }

    // Show specific issues that prevent deployment
    if (!gitStatus.gitInstalled) {
      return 'Git is not installed. Install Git to enable deployment.';
    }

    if (!gitStatus.isGitRepo) {
      return 'Not a Git repository. Run "git init" to initialize.';
    }

    if (!gitStatus.hasRemote) {
      return `No Git remote configured. Run "git remote add origin <url>" to add a remote.`;
    }

    if (gitStatus.issues && gitStatus.issues.length > 0) {
      return gitStatus.issues.join('. ');
    }

    // Show deploying state
    if (deploymentState === 'deploying') {
      return 'Deployment in progress...';
    }

    // Show success state
    if (deploymentState === 'success') {
      return 'Successfully deployed to GitHub Pages!';
    }

    // Default ready state
    return 'Deploy to GitHub Pages';
  };

  const isButtonDisabled = 
    disabled || 
    isLoadingStatus || 
    !gitStatus?.ready || 
    deploymentState === 'deploying';

  const getButtonContent = () => {
    if (isLoadingStatus) {
      return (
        <>
          <span className="deploy-spinner" role="status" aria-label="Loading"></span>
          <span>Checking...</span>
        </>
      );
    }

    switch (deploymentState) {
      case 'deploying':
        return (
          <>
            <span className="deploy-spinner" role="status" aria-label="Deploying"></span>
            <span>Deploying...</span>
          </>
        );
      case 'success':
        return (
          <>
            <span className="deploy-icon">✓</span>
            <span>Deployed!</span>
          </>
        );
      case 'error':
        return (
          <>
            <span className="deploy-icon">✗</span>
            <span>Failed</span>
          </>
        );
      default:
        return (
          <>
            <span className="deploy-icon">🚀</span>
            <span>Deploy to GitHub Pages</span>
          </>
        );
    }
  };

  const errorInfo = deployError 
    ? getErrorInfo(deployError.code, deployError.message)
    : { title: 'Deployment Failed', message: errorMessage, solution: '' };

  return (
    <>
      <div 
        className="deploy-button-container"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <button
          className={`deploy-button ${deploymentState} ${isButtonDisabled ? 'disabled' : ''}`}
          onClick={handleButtonClick}
          disabled={isButtonDisabled}
          aria-label="Deploy to GitHub Pages"
          aria-disabled={isButtonDisabled}
          title={getTooltipMessage()}
        >
          {getButtonContent()}
        </button>
        
        {showTooltip && (
          <div className="deploy-tooltip" role="tooltip">
            {getTooltipMessage()}
          </div>
        )}
      </div>

      {deployConfig && (
        <DeployDialog
          isOpen={confirmDialogOpen}
          deployConfig={deployConfig}
          onConfirm={handleConfirmDeploy}
          onCancel={handleCancelDeploy}
        />
      )}

      <ErrorDialog
        isOpen={errorDialogOpen}
        title={errorInfo.title}
        message={errorInfo.message}
        errorCode={deployError?.code}
        details={deployError?.details ? JSON.stringify(deployError.details, null, 2) : undefined}
        solution={errorInfo.solution}
        onClose={handleCloseErrorDialog}
        onRetry={handleRetryDeploy}
      />
    </>
  );
}
