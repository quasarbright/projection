import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Result of Git repository validation
 */
export interface GitValidationResult {
  isGitRepo: boolean;
  hasRemote: boolean;
  remoteName: string;
  remoteUrl: string;
  currentBranch: string;
}

/**
 * Helper class for Git repository operations and validation
 */
export class GitHelper {
  /**
   * Check if Git is installed and available in PATH
   * @returns Promise resolving to true if Git is installed, false otherwise
   */
  static async isGitInstalled(): Promise<boolean> {
    try {
      await execAsync('git --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate Git repository setup and configuration
   * @param cwd Current working directory to check
   * @param remote Git remote name to check (default: 'origin')
   * @returns Promise resolving to validation result
   */
  static async validateRepository(
    cwd: string,
    remote: string = 'origin'
  ): Promise<GitValidationResult> {
    const result: GitValidationResult = {
      isGitRepo: false,
      hasRemote: false,
      remoteName: remote,
      remoteUrl: '',
      currentBranch: '',
    };

    // Check if directory is a Git repository
    try {
      await execAsync('git rev-parse --git-dir', { cwd });
      result.isGitRepo = true;
    } catch (error) {
      return result;
    }

    // Get current branch
    try {
      result.currentBranch = await this.getCurrentBranch(cwd);
    } catch (error) {
      // Continue even if we can't get the branch
    }

    // Check if remote exists and get URL
    try {
      const url = await this.getRepositoryUrl(cwd, remote);
      if (url) {
        result.hasRemote = true;
        result.remoteUrl = url;
      }
    } catch (error) {
      // Remote doesn't exist
    }

    return result;
  }

  /**
   * Get the URL of a Git remote
   * @param cwd Current working directory
   * @param remote Git remote name (default: 'origin')
   * @returns Promise resolving to remote URL or null if not found
   */
  static async getRepositoryUrl(
    cwd: string,
    remote: string = 'origin'
  ): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`git remote get-url ${remote}`, { cwd });
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }

  /**
   * Get the current Git branch name
   * @param cwd Current working directory
   * @returns Promise resolving to current branch name
   * @throws Error if not in a Git repository or unable to determine branch
   */
  static async getCurrentBranch(cwd: string): Promise<string> {
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd });
      return stdout.trim();
    } catch (error) {
      throw new Error('Unable to determine current Git branch');
    }
  }
}
