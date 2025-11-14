/**
 * Deployment service for wrapping CLI deployment functionality
 * Provides deployment capabilities for the admin interface
 */

import { GitHelper, GitValidationResult } from '../../utils/git-helper';
import { DeploymentConfigLoader, DeployOptions } from '../../utils/deployment-config';
import { ProjectFileFinder } from '../../utils/project-file-finder';
import { deploy as cliDeploy } from '../../cli/deploy';

/**
 * Response from deployment status check
 */
export interface DeployStatusResponse {
  ready: boolean;
  gitInstalled: boolean;
  isGitRepo: boolean;
  hasRemote: boolean;
  remoteName: string;
  remoteUrl: string;
  currentBranch: string;
  deployConfig?: {
    branch: string;
    baseUrl: string;
    homepage: string | null;
    buildDir: string;
  };
  issues?: string[];
}

/**
 * Request body for deployment
 */
export interface DeployRequest {
  force?: boolean;
  message?: string;
}

/**
 * Response from deployment execution
 */
export interface DeployResponse {
  success: boolean;
  message: string;
  url?: string;
  branch?: string;
  duration?: number;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Service class that encapsulates deployment logic for the admin interface
 */
export class DeploymentService {
  /**
   * Check if deployment is possible and get configuration
   * @param cwd Current working directory
   * @returns Promise resolving to deployment status
   */
  static async getDeploymentStatus(cwd: string): Promise<DeployStatusResponse> {
    const issues: string[] = [];
    
    // Check Git installation
    const gitInstalled = await GitHelper.isGitInstalled();
    if (!gitInstalled) {
      issues.push('Git is not installed or not in PATH');
    }

    // Initialize response with defaults
    const response: DeployStatusResponse = {
      ready: false,
      gitInstalled,
      isGitRepo: false,
      hasRemote: false,
      remoteName: 'origin',
      remoteUrl: '',
      currentBranch: '',
      issues
    };

    // If Git is not installed, return early
    if (!gitInstalled) {
      return response;
    }

    // Validate Git repository
    const validation: GitValidationResult = await GitHelper.validateRepository(cwd, 'origin');
    response.isGitRepo = validation.isGitRepo;
    response.hasRemote = validation.hasRemote;
    response.remoteName = validation.remoteName;
    response.remoteUrl = validation.remoteUrl;
    response.currentBranch = validation.currentBranch;

    if (!validation.isGitRepo) {
      issues.push('Not a Git repository');
    }

    if (!validation.hasRemote) {
      issues.push('No Git remote configured');
    }

    // Check for projects file
    const projectFile = ProjectFileFinder.find(cwd);
    if (!projectFile) {
      issues.push('No projects file found');
    }

    // If we have a valid Git setup, try to load deployment config
    if (validation.isGitRepo && validation.hasRemote) {
      try {
        const config = await DeploymentConfigLoader.load(cwd, {});
        response.deployConfig = {
          branch: config.branch,
          baseUrl: config.baseUrl,
          homepage: config.homepage,
          buildDir: config.buildDir
        };
      } catch (error) {
        issues.push('Failed to load deployment configuration');
      }
    }

    // Deployment is ready if there are no issues
    response.ready = issues.length === 0;
    response.issues = issues.length > 0 ? issues : undefined;

    return response;
  }

  /**
   * Get deployment configuration details
   * @param cwd Current working directory
   * @returns Promise resolving to deployment configuration
   */
  static async getDeploymentConfig(cwd: string): Promise<{
    repositoryUrl: string;
    branch: string;
    baseUrl: string;
    homepage: string | null;
    buildDir: string;
  }> {
    try {
      const config = await DeploymentConfigLoader.load(cwd, {});
      return {
        repositoryUrl: config.repositoryUrl,
        branch: config.branch,
        baseUrl: config.baseUrl,
        homepage: config.homepage,
        buildDir: config.buildDir
      };
    } catch (error: any) {
      throw new Error(`Failed to load deployment configuration: ${error.message}`);
    }
  }

  /**
   * Execute deployment
   * @param cwd Current working directory
   * @param options Deployment options
   * @returns Promise resolving to deployment result
   */
  static async deploy(cwd: string, options: DeployRequest = {}): Promise<DeployResponse> {
    const startTime = Date.now();

    try {
      // Prepare deploy options for CLI function
      const deployOptions: DeployOptions = {
        force: options.force,
        message: options.message,
        noBuild: false // Always build for admin deployments
      };

      // Change to the target directory and execute deployment
      const originalCwd = process.cwd();
      process.chdir(cwd);

      try {
        // Execute the CLI deploy function
        await cliDeploy(deployOptions);

        // Calculate duration
        const duration = Date.now() - startTime;

        // Load config to get deployment URL
        const config = await DeploymentConfigLoader.load(cwd, {});
        const url = config.homepage || DeploymentConfigLoader.generateGitHubPagesUrl(config.repositoryUrl);

        return {
          success: true,
          message: 'Deployment completed successfully',
          url,
          branch: config.branch,
          duration
        };
      } finally {
        // Restore original working directory
        process.chdir(originalCwd);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Parse error to provide helpful information
      let errorCode = 'DEPLOYMENT_ERROR';
      let errorMessage = error.message || 'Deployment failed';
      let errorDetails: any = undefined;

      // Check for specific error types
      if (error.code) {
        errorCode = error.code;
      }

      if (error.details) {
        errorDetails = error.details;
      } else if (error.stack) {
        errorDetails = error.stack;
      }

      // Categorize common errors based on message content
      const lowerMessage = errorMessage.toLowerCase();
      
      if (lowerMessage.includes('permission denied') || 
          lowerMessage.includes('authentication failed') ||
          lowerMessage.includes('publickey') ||
          lowerMessage.includes('access denied') ||
          lowerMessage.includes('401') ||
          lowerMessage.includes('403')) {
        errorCode = 'AUTH_ERROR';
        errorMessage = 'Authentication failed. Unable to push to GitHub.';
      } else if (lowerMessage.includes('rejected') || 
                 lowerMessage.includes('conflict') ||
                 lowerMessage.includes('non-fast-forward') ||
                 lowerMessage.includes('failed to push')) {
        errorCode = 'PUSH_REJECTED';
        errorMessage = 'Push rejected. The remote branch has changes that conflict with your local changes.';
      } else if (lowerMessage.includes('validation') ||
                 lowerMessage.includes('invalid project') ||
                 lowerMessage.includes('required field') ||
                 lowerMessage.includes('build failed')) {
        errorCode = 'BUILD_ERROR';
        errorMessage = 'Build failed. There are validation errors in your project data.';
      } else if (lowerMessage.includes('not a git repository') ||
                 lowerMessage.includes('no remote') ||
                 lowerMessage.includes('git') ||
                 lowerMessage.includes('repository not found')) {
        errorCode = 'GIT_ERROR';
        errorMessage = 'Git error. Check your repository configuration.';
      } else if (lowerMessage.includes('network') ||
                 lowerMessage.includes('timeout') ||
                 lowerMessage.includes('econnrefused') ||
                 lowerMessage.includes('enotfound')) {
        errorCode = 'NETWORK_ERROR';
        errorMessage = 'Network error. Check your internet connection.';
      }

      return {
        success: false,
        message: 'Deployment failed',
        duration,
        error: {
          code: errorCode,
          message: errorMessage,
          details: errorDetails
        }
      };
    }
  }
}
