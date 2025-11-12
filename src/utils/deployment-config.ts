import * as path from 'path';
import { ConfigLoader } from '../generator/config';
import { GitHelper } from './git-helper';
import { ProjectionError, ErrorCodes } from './errors';

/**
 * Options passed from command-line for deployment
 */
export interface DeployOptions {
  branch?: string;
  message?: string;
  remote?: string;
  dir?: string;
  noBuild?: boolean;
  dryRun?: boolean;
  force?: boolean;
  help?: boolean;
}

/**
 * Complete deployment configuration after merging all sources
 */
export interface DeploymentConfig {
  repositoryUrl: string;
  homepage: string | null;
  baseUrl: string;
  branch: string;
  buildDir: string;
  remote: string;
}

/**
 * Loads and merges deployment configuration from multiple sources:
 * 1. Command-line options (highest priority)
 * 2. Projection config file
 * 3. Auto-detected values from Git
 * 4. Default values (lowest priority)
 */
export class DeploymentConfigLoader {
  /**
   * Load complete deployment configuration
   * @param cwd Current working directory
   * @param options Command-line options
   * @returns Promise resolving to complete deployment configuration
   * @throws ProjectionError if Git repository is not properly configured
   */
  static async load(cwd: string, options: DeployOptions = {}): Promise<DeploymentConfig> {
    // Get remote name (from options or default)
    const remote = options.remote || 'origin';

    // Get repository URL from Git
    const repositoryUrl = await this.getRepositoryUrl(cwd, remote);
    if (!repositoryUrl) {
      throw new ProjectionError(
        `No Git remote '${remote}' found`,
        ErrorCodes.CONFIG_ERROR,
        { 
          remote,
          solution: `Run 'git remote add ${remote} <url>' to add a remote`
        }
      );
    }

    // Load Projection config
    const configLoader = new ConfigLoader(cwd);
    const projectionConfig = await configLoader.load();

    // Extract repository name and generate GitHub Pages URL
    const repoName = this.extractRepoName(repositoryUrl);
    const githubPagesUrl = this.generateGitHubPagesUrl(repositoryUrl);

    // Determine baseUrl (from config or auto-generated)
    let baseUrl = projectionConfig.baseUrl;
    if (!baseUrl || baseUrl === './') {
      // Auto-generate baseUrl from repository name
      baseUrl = `/${repoName}/`;
    }

    // Get homepage from config (for custom domains)
    const homepage = (projectionConfig as any).homepage || null;

    // Determine branch (priority: CLI option > config > default)
    const branch = options.branch || (projectionConfig as any).deployBranch || 'gh-pages';

    // Determine build directory (priority: CLI option > config > default)
    const buildDir = options.dir || projectionConfig.output || 'dist';

    return {
      repositoryUrl,
      homepage,
      baseUrl,
      branch,
      buildDir,
      remote,
    };
  }

  /**
   * Get repository URL from Git remote
   * @param cwd Current working directory
   * @param remote Git remote name
   * @returns Promise resolving to repository URL or null if not found
   */
  private static async getRepositoryUrl(cwd: string, remote: string): Promise<string | null> {
    return await GitHelper.getRepositoryUrl(cwd, remote);
  }

  /**
   * Extract repository name from Git remote URL
   * Supports both HTTPS and SSH URLs
   * @param repositoryUrl Git remote URL
   * @returns Repository name (e.g., 'my-portfolio')
   * @example
   * extractRepoName('https://github.com/user/my-portfolio.git') // 'my-portfolio'
   * extractRepoName('git@github.com:user/my-portfolio.git') // 'my-portfolio'
   */
  static extractRepoName(repositoryUrl: string): string {
    // Remove .git suffix if present
    let url = repositoryUrl.replace(/\.git$/, '');

    // Extract the last part of the path
    const parts = url.split('/');
    const repoName = parts[parts.length - 1];

    // Handle SSH URLs (git@github.com:user/repo)
    if (repoName.includes(':')) {
      const colonParts = repoName.split(':');
      return colonParts[colonParts.length - 1];
    }

    return repoName;
  }

  /**
   * Generate GitHub Pages URL from repository URL
   * @param repositoryUrl Git remote URL
   * @returns GitHub Pages URL
   * @example
   * generateGitHubPagesUrl('https://github.com/user/my-portfolio.git')
   * // Returns: 'https://user.github.io/my-portfolio'
   * 
   * generateGitHubPagesUrl('git@github.com:user/my-portfolio.git')
   * // Returns: 'https://user.github.io/my-portfolio'
   */
  static generateGitHubPagesUrl(repositoryUrl: string): string {
    // Extract username and repo name
    let url = repositoryUrl.replace(/\.git$/, '');

    // Handle HTTPS URLs
    if (url.includes('github.com/')) {
      const match = url.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
      if (match) {
        const [, username, repoName] = match;
        return `https://${username}.github.io/${repoName}`;
      }
    }

    // Handle SSH URLs
    if (url.includes('git@github.com:')) {
      const match = url.match(/git@github\.com:([\w-]+)\/([\w-]+)/);
      if (match) {
        const [, username, repoName] = match;
        return `https://${username}.github.io/${repoName}`;
      }
    }

    // Fallback: just return the repository URL
    return repositoryUrl;
  }
}
