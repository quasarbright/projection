import { DeploymentService } from '../../src/admin/server/deployment-service';
import { GitHelper } from '../../src/utils/git-helper';
import { DeploymentConfigLoader } from '../../src/utils/deployment-config';
import { ProjectFileFinder } from '../../src/utils/project-file-finder';
import { deploy as cliDeploy } from '../../src/cli/deploy';

// Mock dependencies
jest.mock('../../src/utils/git-helper');
jest.mock('../../src/utils/deployment-config');
jest.mock('../../src/utils/project-file-finder');
jest.mock('../../src/cli/deploy');

describe('DeploymentService', () => {
  const testCwd = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDeploymentStatus', () => {
    it('should return not ready when Git is not installed', async () => {
      (GitHelper.isGitInstalled as jest.Mock).mockResolvedValue(false);

      const result = await DeploymentService.getDeploymentStatus(testCwd);

      expect(result.ready).toBe(false);
      expect(result.gitInstalled).toBe(false);
      expect(result.issues).toContain('Git is not installed or not in PATH');
    });

    it('should return not ready when not a Git repository', async () => {
      (GitHelper.isGitInstalled as jest.Mock).mockResolvedValue(true);
      (GitHelper.validateRepository as jest.Mock).mockResolvedValue({
        isGitRepo: false,
        hasRemote: false,
        remoteName: 'origin',
        remoteUrl: '',
        currentBranch: ''
      });
      (ProjectFileFinder.find as jest.Mock).mockReturnValue({
        path: '/test/projects.yaml',
        format: 'yaml'
      });

      const result = await DeploymentService.getDeploymentStatus(testCwd);

      expect(result.ready).toBe(false);
      expect(result.isGitRepo).toBe(false);
      expect(result.issues).toContain('Not a Git repository');
    });

    it('should return not ready when no remote configured', async () => {
      (GitHelper.isGitInstalled as jest.Mock).mockResolvedValue(true);
      (GitHelper.validateRepository as jest.Mock).mockResolvedValue({
        isGitRepo: true,
        hasRemote: false,
        remoteName: 'origin',
        remoteUrl: '',
        currentBranch: 'main'
      });
      (ProjectFileFinder.find as jest.Mock).mockReturnValue({
        path: '/test/projects.yaml',
        format: 'yaml'
      });

      const result = await DeploymentService.getDeploymentStatus(testCwd);

      expect(result.ready).toBe(false);
      expect(result.hasRemote).toBe(false);
      expect(result.issues).toContain('No Git remote configured');
    });

    it('should return not ready when no projects file found', async () => {
      (GitHelper.isGitInstalled as jest.Mock).mockResolvedValue(true);
      (GitHelper.validateRepository as jest.Mock).mockResolvedValue({
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main'
      });
      (ProjectFileFinder.find as jest.Mock).mockReturnValue(null);

      const result = await DeploymentService.getDeploymentStatus(testCwd);

      expect(result.ready).toBe(false);
      expect(result.issues).toContain('No projects file found');
    });

    it('should return ready when all validations pass', async () => {
      (GitHelper.isGitInstalled as jest.Mock).mockResolvedValue(true);
      (GitHelper.validateRepository as jest.Mock).mockResolvedValue({
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main'
      });
      (ProjectFileFinder.find as jest.Mock).mockReturnValue({
        path: '/test/projects.yaml',
        format: 'yaml'
      });
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'origin'
      });

      const result = await DeploymentService.getDeploymentStatus(testCwd);

      expect(result.ready).toBe(true);
      expect(result.gitInstalled).toBe(true);
      expect(result.isGitRepo).toBe(true);
      expect(result.hasRemote).toBe(true);
      expect(result.remoteName).toBe('origin');
      expect(result.remoteUrl).toBe('https://github.com/user/repo.git');
      expect(result.currentBranch).toBe('main');
      expect(result.deployConfig).toEqual({
        branch: 'gh-pages',
        baseUrl: '/repo/',
        homepage: null,
        buildDir: 'dist'
      });
      expect(result.issues).toBeUndefined();
    });

    it('should handle deployment config load failure gracefully', async () => {
      (GitHelper.isGitInstalled as jest.Mock).mockResolvedValue(true);
      (GitHelper.validateRepository as jest.Mock).mockResolvedValue({
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main'
      });
      (ProjectFileFinder.find as jest.Mock).mockReturnValue({
        path: '/test/projects.yaml',
        format: 'yaml'
      });
      (DeploymentConfigLoader.load as jest.Mock).mockRejectedValue(
        new Error('Config load failed')
      );

      const result = await DeploymentService.getDeploymentStatus(testCwd);

      expect(result.ready).toBe(false);
      expect(result.issues).toContain('Failed to load deployment configuration');
      expect(result.deployConfig).toBeUndefined();
    });
  });

  describe('getDeploymentConfig', () => {
    it('should return deployment configuration', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: 'example.com',
        baseUrl: '/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'origin'
      });

      const result = await DeploymentService.getDeploymentConfig(testCwd);

      expect(result).toEqual({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: 'example.com',
        baseUrl: '/',
        branch: 'gh-pages',
        buildDir: 'dist'
      });
    });

    it('should throw error when config load fails', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockRejectedValue(
        new Error('Config not found')
      );

      await expect(DeploymentService.getDeploymentConfig(testCwd)).rejects.toThrow(
        'Failed to load deployment configuration: Config not found'
      );
    });
  });

  describe('deploy', () => {
    const originalCwd = process.cwd();

    beforeEach(() => {
      jest.spyOn(process, 'chdir').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should execute deployment successfully', async () => {
      (cliDeploy as jest.Mock).mockResolvedValue(undefined);
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'origin'
      });
      (DeploymentConfigLoader.generateGitHubPagesUrl as jest.Mock).mockReturnValue(
        'https://user.github.io/repo'
      );

      const result = await DeploymentService.deploy(testCwd);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Deployment completed successfully');
      expect(result.url).toBe('https://user.github.io/repo');
      expect(result.branch).toBe('gh-pages');
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(process.chdir).toHaveBeenCalledWith(testCwd);
      expect(process.chdir).toHaveBeenCalledWith(originalCwd);
    });

    it('should use homepage URL when configured', async () => {
      (cliDeploy as jest.Mock).mockResolvedValue(undefined);
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: 'https://example.com',
        baseUrl: '/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'origin'
      });

      const result = await DeploymentService.deploy(testCwd);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com');
    });

    it('should pass force option to CLI deploy', async () => {
      (cliDeploy as jest.Mock).mockResolvedValue(undefined);
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'origin'
      });
      (DeploymentConfigLoader.generateGitHubPagesUrl as jest.Mock).mockReturnValue(
        'https://user.github.io/repo'
      );

      await DeploymentService.deploy(testCwd, { force: true });

      expect(cliDeploy).toHaveBeenCalledWith({
        force: true,
        message: undefined,
        noBuild: false
      });
    });

    it('should pass custom message to CLI deploy', async () => {
      (cliDeploy as jest.Mock).mockResolvedValue(undefined);
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'origin'
      });
      (DeploymentConfigLoader.generateGitHubPagesUrl as jest.Mock).mockReturnValue(
        'https://user.github.io/repo'
      );

      await DeploymentService.deploy(testCwd, { message: 'Custom deploy message' });

      expect(cliDeploy).toHaveBeenCalledWith({
        force: undefined,
        message: 'Custom deploy message',
        noBuild: false
      });
    });

    it('should restore working directory on error', async () => {
      (cliDeploy as jest.Mock).mockRejectedValue(new Error('Deploy failed'));

      await DeploymentService.deploy(testCwd);

      expect(process.chdir).toHaveBeenCalledWith(originalCwd);
    });

    it('should categorize authentication errors', async () => {
      (cliDeploy as jest.Mock).mockRejectedValue(
        new Error('Permission denied (publickey)')
      );

      const result = await DeploymentService.deploy(testCwd);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AUTH_ERROR');
      expect(result.error?.message).toBe(
        'Authentication failed. Unable to push to GitHub.'
      );
    });

    it('should categorize push rejected errors', async () => {
      (cliDeploy as jest.Mock).mockRejectedValue(
        new Error('Push rejected due to conflicts')
      );

      const result = await DeploymentService.deploy(testCwd);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PUSH_REJECTED');
      expect(result.error?.message).toContain('Push rejected');
    });

    it('should categorize build errors', async () => {
      (cliDeploy as jest.Mock).mockRejectedValue(
        new Error('Build failed: validation error')
      );

      const result = await DeploymentService.deploy(testCwd);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BUILD_ERROR');
      expect(result.error?.message).toContain('Build failed');
    });

    it('should categorize Git errors', async () => {
      (cliDeploy as jest.Mock).mockRejectedValue(
        new Error('Not a git repository')
      );

      const result = await DeploymentService.deploy(testCwd);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GIT_ERROR');
      expect(result.error?.message).toContain('Git error');
    });

    it('should categorize network errors', async () => {
      (cliDeploy as jest.Mock).mockRejectedValue(
        new Error('Network timeout: ECONNREFUSED')
      );

      const result = await DeploymentService.deploy(testCwd);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
      expect(result.error?.message).toContain('Network error');
    });

    it('should include error details in response', async () => {
      const error = new Error('Deployment failed with details');
      error.stack = 'Error stack trace...';
      (cliDeploy as jest.Mock).mockRejectedValue(error);

      const result = await DeploymentService.deploy(testCwd);

      expect(result.success).toBe(false);
      expect(result.error?.details).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });
});
