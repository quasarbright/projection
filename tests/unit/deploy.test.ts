import { deploy } from '../../src/cli/deploy';
import { GitHelper } from '../../src/utils/git-helper';
import { DeploymentConfigLoader } from '../../src/utils/deployment-config';
import { ProjectFileFinder } from '../../src/utils/project-file-finder';
import { ProjectionError } from '../../src/utils/errors';
import { Generator } from '../../src/generator';
import * as fs from 'fs';
import * as ghpages from 'gh-pages';

// Mock dependencies
jest.mock('../../src/utils/git-helper');
jest.mock('../../src/utils/deployment-config');
jest.mock('../../src/utils/project-file-finder');
jest.mock('../../src/generator');
jest.mock('fs');
jest.mock('gh-pages');

describe('deploy command', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Git installation validation', () => {
    it('should validate Git is installed', async () => {
      // Mock successful validation
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

      await deploy({ dryRun: true });

      expect(GitHelper.isGitInstalled).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Git is installed'));
    });

    it('should throw error if Git is not installed', async () => {
      (GitHelper.isGitInstalled as jest.Mock).mockResolvedValue(false);

      await expect(deploy()).rejects.toThrow(ProjectionError);
      await expect(deploy()).rejects.toThrow('Git is not installed or not in PATH');
    });
  });

  describe('Git repository validation', () => {
    beforeEach(() => {
      (GitHelper.isGitInstalled as jest.Mock).mockResolvedValue(true);
    });

    it('should validate Git repository exists', async () => {
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

      await deploy({ dryRun: true });

      expect(GitHelper.validateRepository).toHaveBeenCalledWith(process.cwd(), 'origin');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Git repository validated')
      );
    });

    it('should throw error if not a Git repository', async () => {
      (GitHelper.validateRepository as jest.Mock).mockResolvedValue({
        isGitRepo: false,
        hasRemote: false,
        remoteName: 'origin',
        remoteUrl: '',
        currentBranch: ''
      });

      await expect(deploy()).rejects.toThrow(ProjectionError);
      await expect(deploy()).rejects.toThrow('Not a git repository');
    });

    it('should throw error if no remote configured', async () => {
      (GitHelper.validateRepository as jest.Mock).mockResolvedValue({
        isGitRepo: true,
        hasRemote: false,
        remoteName: 'origin',
        remoteUrl: '',
        currentBranch: 'main'
      });

      await expect(deploy()).rejects.toThrow(ProjectionError);
      await expect(deploy()).rejects.toThrow("No git remote 'origin' found");
    });

    it('should use custom remote from options', async () => {
      (GitHelper.validateRepository as jest.Mock).mockResolvedValue({
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'upstream',
        remoteUrl: 'https://github.com/org/repo.git',
        currentBranch: 'main'
      });
      (ProjectFileFinder.find as jest.Mock).mockReturnValue({
        path: '/test/projects.yaml',
        format: 'yaml'
      });
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/org/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'upstream'
      });

      await deploy({ remote: 'upstream', dryRun: true });

      expect(GitHelper.validateRepository).toHaveBeenCalledWith(process.cwd(), 'upstream');
    });
  });

  describe('Projects file validation', () => {
    beforeEach(() => {
      (GitHelper.isGitInstalled as jest.Mock).mockResolvedValue(true);
      (GitHelper.validateRepository as jest.Mock).mockResolvedValue({
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main'
      });
    });

    it('should verify projects file exists', async () => {
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

      await deploy({ dryRun: true });

      expect(ProjectFileFinder.find).toHaveBeenCalledWith(process.cwd());
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Found projects file')
      );
    });

    it('should throw error if projects file not found', async () => {
      (ProjectFileFinder.find as jest.Mock).mockReturnValue(null);
      (ProjectFileFinder.getSupportedFileNames as jest.Mock).mockReturnValue([
        'projects.yaml',
        'projects.yml',
        'projects.json'
      ]);

      await expect(deploy()).rejects.toThrow(ProjectionError);
      await expect(deploy()).rejects.toThrow('No projects file found');
    });
  });

  describe('Deployment configuration', () => {
    beforeEach(() => {
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
    });

    it('should load deployment configuration', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'origin'
      });

      await deploy({ dryRun: true });

      expect(DeploymentConfigLoader.load).toHaveBeenCalledWith(process.cwd(), {
        dryRun: true
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Configuration loaded')
      );
    });

    it('should pass options to configuration loader', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'deploy',
        buildDir: 'build',
        remote: 'origin'
      });

      const options = {
        branch: 'deploy',
        dir: 'build',
        dryRun: true
      };

      await deploy(options);

      expect(DeploymentConfigLoader.load).toHaveBeenCalledWith(process.cwd(), options);
    });
  });

  describe('Pre-deployment summary', () => {
    beforeEach(() => {
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
    });

    it('should display deployment summary', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'origin'
      });

      await deploy({ dryRun: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Deployment Summary'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://github.com/user/repo.git')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('gh-pages'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('dist'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('/repo/'));
    });

    it('should display custom domain if configured', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: 'example.com',
        baseUrl: '/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'origin'
      });

      await deploy({ dryRun: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('example.com'));
    });

    it('should indicate dry run mode', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'origin'
      });

      await deploy({ dryRun: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('DRY RUN'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Dry run complete')
      );
    });
  });

  describe('Error handling', () => {
    it('should display helpful error messages for ProjectionError', async () => {
      (GitHelper.isGitInstalled as jest.Mock).mockResolvedValue(false);

      await expect(deploy()).rejects.toThrow(ProjectionError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Git is not installed')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Solution:')
      );
    });

    it('should re-throw non-ProjectionError errors', async () => {
      const unexpectedError = new Error('Unexpected error');
      (GitHelper.isGitInstalled as jest.Mock).mockRejectedValue(unexpectedError);

      await expect(deploy()).rejects.toThrow('Unexpected error');
    });

    it('should display Git installation link when Git is not installed', async () => {
      (GitHelper.isGitInstalled as jest.Mock).mockResolvedValue(false);

      await expect(deploy()).rejects.toThrow(ProjectionError);

      const logCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const output = logCalls.join('\n');
      
      expect(output).toContain('https://git-scm.com/');
      expect(output).toContain('Git is required for deployment');
    });

    it('should display git init instructions when not a repository', async () => {
      (GitHelper.isGitInstalled as jest.Mock).mockResolvedValue(true);
      (GitHelper.validateRepository as jest.Mock).mockResolvedValue({
        isGitRepo: false,
        hasRemote: false,
        remoteName: 'origin',
        remoteUrl: '',
        currentBranch: ''
      });

      await expect(deploy()).rejects.toThrow(ProjectionError);

      const logCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const output = logCalls.join('\n');
      
      expect(output).toContain('git init');
      expect(output).toContain('Git repository is required');
    });

    it('should display add remote instructions when no remote configured', async () => {
      (GitHelper.isGitInstalled as jest.Mock).mockResolvedValue(true);
      (GitHelper.validateRepository as jest.Mock).mockResolvedValue({
        isGitRepo: true,
        hasRemote: false,
        remoteName: 'origin',
        remoteUrl: '',
        currentBranch: 'main'
      });

      await expect(deploy()).rejects.toThrow(ProjectionError);

      const logCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const output = logCalls.join('\n');
      
      expect(output).toContain('git remote add origin');
      expect(output).toContain('Git remote is required');
    });

    it('should display credential setup guide for authentication failures', async () => {
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

      const mockGenerator = {
        generate: jest.fn().mockResolvedValue(undefined),
        getConfig: jest.fn().mockReturnValue({ baseUrl: '/' }),
        getOutputDir: jest.fn().mockReturnValue('/test/dist')
      };
      (Generator.create as jest.Mock).mockResolvedValue(mockGenerator);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.rmSync as jest.Mock).mockImplementation(() => {});
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      (DeploymentConfigLoader.extractRepoName as jest.Mock).mockReturnValue('repo');
      (DeploymentConfigLoader.generateGitHubPagesUrl as jest.Mock).mockReturnValue(
        'https://user.github.io/repo'
      );

      (ghpages.publish as jest.Mock).mockImplementation((dir, options, callback) => {
        callback(new Error('Authentication failed: permission denied'));
      });

      await expect(deploy()).rejects.toThrow(ProjectionError);

      const logCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const output = logCalls.join('\n');
      
      expect(output).toContain('Authentication failed');
      expect(output).toContain('Git credentials');
      expect(output).toContain('SSH keys');
      expect(output).toContain('https://docs.github.com');
    });

    it('should display troubleshooting tips for push failures', async () => {
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

      const mockGenerator = {
        generate: jest.fn().mockResolvedValue(undefined),
        getConfig: jest.fn().mockReturnValue({ baseUrl: '/' }),
        getOutputDir: jest.fn().mockReturnValue('/test/dist')
      };
      (Generator.create as jest.Mock).mockResolvedValue(mockGenerator);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.rmSync as jest.Mock).mockImplementation(() => {});
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      (DeploymentConfigLoader.extractRepoName as jest.Mock).mockReturnValue('repo');
      (DeploymentConfigLoader.generateGitHubPagesUrl as jest.Mock).mockReturnValue(
        'https://user.github.io/repo'
      );

      (ghpages.publish as jest.Mock).mockImplementation((dir, options, callback) => {
        callback(new Error('Push rejected due to conflicts'));
      });

      await expect(deploy()).rejects.toThrow(ProjectionError);

      const logCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const output = logCalls.join('\n');
      
      expect(output).toContain('Push rejected');
      expect(output).toContain('--force flag');
      expect(output).toContain('conflicts');
    });

    it('should log detailed error information for debugging', async () => {
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

      const mockGenerator = {
        generate: jest.fn().mockResolvedValue(undefined),
        getConfig: jest.fn().mockReturnValue({ baseUrl: '/' }),
        getOutputDir: jest.fn().mockReturnValue('/test/dist')
      };
      (Generator.create as jest.Mock).mockResolvedValue(mockGenerator);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.rmSync as jest.Mock).mockImplementation(() => {});
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      (DeploymentConfigLoader.extractRepoName as jest.Mock).mockReturnValue('repo');
      (DeploymentConfigLoader.generateGitHubPagesUrl as jest.Mock).mockReturnValue(
        'https://user.github.io/repo'
      );

      const detailedError = new Error('Detailed error with stack trace and context');
      (ghpages.publish as jest.Mock).mockImplementation((dir, options, callback) => {
        callback(detailedError);
      });

      try {
        await deploy();
      } catch (error) {
        expect(error).toBeInstanceOf(ProjectionError);
        if (error instanceof ProjectionError) {
          expect(error.details.originalError).toBe(detailedError.message);
        }
      }
    });

    it('should display solution and required fields for validation errors', async () => {
      (GitHelper.isGitInstalled as jest.Mock).mockResolvedValue(false);

      try {
        await deploy();
      } catch (error) {
        expect(error).toBeInstanceOf(ProjectionError);
        if (error instanceof ProjectionError) {
          expect(error.details.solution).toBeDefined();
          expect(error.details.required).toBeDefined();
        }
      }

      const logCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const output = logCalls.join('\n');
      
      expect(output).toContain('Solution:');
    });

    it('should handle repository not found errors with helpful message', async () => {
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

      const mockGenerator = {
        generate: jest.fn().mockResolvedValue(undefined),
        getConfig: jest.fn().mockReturnValue({ baseUrl: '/' }),
        getOutputDir: jest.fn().mockReturnValue('/test/dist')
      };
      (Generator.create as jest.Mock).mockResolvedValue(mockGenerator);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.rmSync as jest.Mock).mockImplementation(() => {});
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      (DeploymentConfigLoader.extractRepoName as jest.Mock).mockReturnValue('repo');
      (DeploymentConfigLoader.generateGitHubPagesUrl as jest.Mock).mockReturnValue(
        'https://user.github.io/repo'
      );

      (ghpages.publish as jest.Mock).mockImplementation((dir, options, callback) => {
        callback(new Error('Repository does not exist'));
      });

      await expect(deploy()).rejects.toThrow(ProjectionError);

      const logCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const output = logCalls.join('\n');
      
      expect(output).toContain('Repository or remote not found');
      expect(output).toContain('git remote -v');
      expect(output).toContain('repository permissions');
    });

    it('should display all error details when ProjectionError has multiple fields', async () => {
      (GitHelper.isGitInstalled as jest.Mock).mockResolvedValue(true);
      (GitHelper.validateRepository as jest.Mock).mockResolvedValue({
        isGitRepo: false,
        hasRemote: false,
        remoteName: 'origin',
        remoteUrl: '',
        currentBranch: ''
      });

      try {
        await deploy();
      } catch (error) {
        expect(error).toBeInstanceOf(ProjectionError);
        if (error instanceof ProjectionError) {
          expect(error.message).toBe('Not a git repository');
          expect(error.details.solution).toContain('git init');
          expect(error.details.required).toContain('Git repository is required');
        }
      }

      const errorCalls = consoleErrorSpy.mock.calls.map(call => call.join(' '));
      const logCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const allOutput = [...errorCalls, ...logCalls].join('\n');
      
      expect(allOutput).toContain('Not a git repository');
      expect(allOutput).toContain('Solution:');
    });
  });

  describe('Options handling', () => {
    beforeEach(() => {
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
    });

    it('should handle empty options', async () => {
      await deploy({ dryRun: true });

      expect(GitHelper.validateRepository).toHaveBeenCalledWith(process.cwd(), 'origin');
    });

    it('should handle all options', async () => {
      const options = {
        branch: 'deploy',
        message: 'Custom message',
        remote: 'upstream',
        dir: 'build',
        noBuild: true,
        dryRun: true,
        force: true
      };

      await deploy(options);

      expect(DeploymentConfigLoader.load).toHaveBeenCalledWith(process.cwd(), options);
    });
  });

  describe('Option parsing and validation', () => {
    let mockGenerator: any;

    beforeEach(() => {
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

      // Mock generator
      mockGenerator = {
        generate: jest.fn().mockResolvedValue(undefined),
        getConfig: jest.fn().mockReturnValue({ baseUrl: '/' }),
        getOutputDir: jest.fn().mockReturnValue('/test/dist')
      };
      (Generator.create as jest.Mock).mockResolvedValue(mockGenerator);

      // Mock fs
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.rmSync as jest.Mock).mockImplementation(() => {});
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      // Mock gh-pages
      (ghpages.publish as jest.Mock).mockImplementation((dir, options, callback) => {
        callback(null);
      });

      // Mock DeploymentConfigLoader static methods
      (DeploymentConfigLoader.extractRepoName as jest.Mock).mockReturnValue('repo');
      (DeploymentConfigLoader.generateGitHubPagesUrl as jest.Mock).mockReturnValue(
        'https://user.github.io/repo'
      );
    });

    describe('--branch flag', () => {
      it('should accept custom deployment branch', async () => {
        (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
          repositoryUrl: 'https://github.com/user/repo.git',
          homepage: null,
          baseUrl: '/repo/',
          branch: 'production',
          buildDir: 'dist',
          remote: 'origin'
        });

        await deploy({ branch: 'production' });

        expect(DeploymentConfigLoader.load).toHaveBeenCalledWith(
          process.cwd(),
          expect.objectContaining({ branch: 'production' })
        );
        expect(ghpages.publish).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ branch: 'production' }),
          expect.any(Function)
        );
      });

      it('should use default gh-pages branch when not specified', async () => {
        await deploy();

        expect(ghpages.publish).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ branch: 'gh-pages' }),
          expect.any(Function)
        );
      });

      it('should handle branch names with special characters', async () => {
        (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
          repositoryUrl: 'https://github.com/user/repo.git',
          homepage: null,
          baseUrl: '/repo/',
          branch: 'feature/deploy-v2',
          buildDir: 'dist',
          remote: 'origin'
        });

        await deploy({ branch: 'feature/deploy-v2' });

        expect(ghpages.publish).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ branch: 'feature/deploy-v2' }),
          expect.any(Function)
        );
      });
    });

    describe('--message flag', () => {
      it('should accept custom commit message', async () => {
        const customMessage = 'Release v1.2.3';
        await deploy({ message: customMessage });

        expect(ghpages.publish).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ message: customMessage }),
          expect.any(Function)
        );
      });

      it('should use default message with timestamp when not specified', async () => {
        await deploy();

        const publishCall = (ghpages.publish as jest.Mock).mock.calls[0];
        const options = publishCall[1];
        expect(options.message).toMatch(/Deploy to GitHub Pages - \d{4}-\d{2}-\d{2}T/);
      });

      it('should use default message when empty string provided', async () => {
        await deploy({ message: '' });

        const publishCall = (ghpages.publish as jest.Mock).mock.calls[0];
        const options = publishCall[1];
        // Empty string is falsy, so default message is used
        expect(options.message).toMatch(/Deploy to GitHub Pages - \d{4}-\d{2}-\d{2}T/);
      });

      it('should handle multi-line commit messages', async () => {
        const multiLineMessage = 'Deploy v1.0\n\nChanges:\n- Feature A\n- Feature B';
        await deploy({ message: multiLineMessage });

        expect(ghpages.publish).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ message: multiLineMessage }),
          expect.any(Function)
        );
      });
    });

    describe('--remote flag', () => {
      it('should accept custom Git remote', async () => {
        (GitHelper.validateRepository as jest.Mock).mockResolvedValue({
          isGitRepo: true,
          hasRemote: true,
          remoteName: 'upstream',
          remoteUrl: 'https://github.com/org/repo.git',
          currentBranch: 'main'
        });
        (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
          repositoryUrl: 'https://github.com/org/repo.git',
          homepage: null,
          baseUrl: '/repo/',
          branch: 'gh-pages',
          buildDir: 'dist',
          remote: 'upstream'
        });

        await deploy({ remote: 'upstream' });

        expect(GitHelper.validateRepository).toHaveBeenCalledWith(process.cwd(), 'upstream');
        expect(ghpages.publish).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ remote: 'upstream' }),
          expect.any(Function)
        );
      });

      it('should use default origin remote when not specified', async () => {
        await deploy();

        expect(GitHelper.validateRepository).toHaveBeenCalledWith(process.cwd(), 'origin');
        expect(ghpages.publish).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ remote: 'origin' }),
          expect.any(Function)
        );
      });

      it('should validate that specified remote exists', async () => {
        (GitHelper.validateRepository as jest.Mock).mockResolvedValue({
          isGitRepo: true,
          hasRemote: false,
          remoteName: 'nonexistent',
          remoteUrl: '',
          currentBranch: 'main'
        });

        await expect(deploy({ remote: 'nonexistent' })).rejects.toThrow(ProjectionError);
        await expect(deploy({ remote: 'nonexistent' })).rejects.toThrow(
          "No git remote 'nonexistent' found"
        );
      });
    });

    describe('--dir flag', () => {
      it('should accept custom build directory', async () => {
        (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
          repositoryUrl: 'https://github.com/user/repo.git',
          homepage: null,
          baseUrl: '/repo/',
          branch: 'gh-pages',
          buildDir: 'public',
          remote: 'origin'
        });

        await deploy({ dir: 'public' });

        expect(DeploymentConfigLoader.load).toHaveBeenCalledWith(
          process.cwd(),
          expect.objectContaining({ dir: 'public' })
        );
        expect(Generator.create).toHaveBeenCalledWith(
          expect.objectContaining({ outputDir: 'public' })
        );
      });

      it('should use default dist directory when not specified', async () => {
        await deploy();

        expect(Generator.create).toHaveBeenCalledWith(
          expect.objectContaining({ outputDir: 'dist' })
        );
      });

      it('should handle relative paths', async () => {
        (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
          repositoryUrl: 'https://github.com/user/repo.git',
          homepage: null,
          baseUrl: '/repo/',
          branch: 'gh-pages',
          buildDir: './build/output',
          remote: 'origin'
        });

        await deploy({ dir: './build/output' });

        expect(ghpages.publish).toHaveBeenCalledWith(
          expect.stringContaining('build/output'),
          expect.anything(),
          expect.any(Function)
        );
      });

      it('should handle absolute paths', async () => {
        (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
          repositoryUrl: 'https://github.com/user/repo.git',
          homepage: null,
          baseUrl: '/repo/',
          branch: 'gh-pages',
          buildDir: '/tmp/build',
          remote: 'origin'
        });

        await deploy({ dir: '/tmp/build' });

        expect(ghpages.publish).toHaveBeenCalledWith(
          '/tmp/build',
          expect.anything(),
          expect.any(Function)
        );
      });
    });

    describe('--no-build flag', () => {
      it('should skip build when flag is set', async () => {
        await deploy({ noBuild: true });

        expect(Generator.create).not.toHaveBeenCalled();
        expect(mockGenerator.generate).not.toHaveBeenCalled();
      });

      it('should run build by default', async () => {
        await deploy();

        expect(Generator.create).toHaveBeenCalled();
        expect(mockGenerator.generate).toHaveBeenCalled();
      });

      it('should display skip message when build is skipped', async () => {
        await deploy({ noBuild: true });

        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Skipping build')
        );
      });

      it('should still validate build directory exists when skipping build', async () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);

        await expect(deploy({ noBuild: true })).rejects.toThrow(ProjectionError);
      });
    });

    describe('--dry-run flag', () => {
      it('should simulate deployment without making changes', async () => {
        await deploy({ dryRun: true });

        expect(Generator.create).not.toHaveBeenCalled();
        expect(ghpages.publish).not.toHaveBeenCalled();
      });

      it('should display dry run indicator in summary', async () => {
        await deploy({ dryRun: true });

        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('DRY RUN')
        );
      });

      it('should complete validation steps in dry run', async () => {
        await deploy({ dryRun: true });

        expect(GitHelper.isGitInstalled).toHaveBeenCalled();
        expect(GitHelper.validateRepository).toHaveBeenCalled();
        expect(ProjectFileFinder.find).toHaveBeenCalled();
        expect(DeploymentConfigLoader.load).toHaveBeenCalled();
      });

      it('should display completion message for dry run', async () => {
        await deploy({ dryRun: true });

        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Dry run complete')
        );
      });

      it('should stop before build phase in dry run', async () => {
        await deploy({ dryRun: true });

        expect(consoleLogSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('Building site')
        );
      });
    });

    describe('--force flag', () => {
      it('should enable force push when flag is set', async () => {
        await deploy({ force: true });

        expect(ghpages.publish).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ force: true }),
          expect.any(Function)
        );
      });

      it('should not enable force push by default', async () => {
        await deploy();

        const publishCall = (ghpages.publish as jest.Mock).mock.calls[0];
        const options = publishCall[1];
        expect(options.force).toBeUndefined();
      });

      it('should allow force push to resolve conflicts', async () => {
        // First attempt fails with conflict
        (ghpages.publish as jest.Mock).mockImplementationOnce((dir, options, callback) => {
          callback(new Error('Push rejected due to conflicts'));
        });

        await expect(deploy()).rejects.toThrow(ProjectionError);

        // Second attempt with force succeeds
        (ghpages.publish as jest.Mock).mockImplementationOnce((dir, options, callback) => {
          callback(null);
        });

        await deploy({ force: true });

        expect(ghpages.publish).toHaveBeenLastCalledWith(
          expect.anything(),
          expect.objectContaining({ force: true }),
          expect.any(Function)
        );
      });
    });

    describe('Combined options', () => {
      it('should handle multiple options together', async () => {
        (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
          repositoryUrl: 'https://github.com/user/repo.git',
          homepage: null,
          baseUrl: '/repo/',
          branch: 'production',
          buildDir: 'build',
          remote: 'upstream'
        });

        const options = {
          branch: 'production',
          message: 'Production deployment',
          remote: 'upstream',
          dir: 'build',
          force: true
        };

        await deploy(options);

        expect(DeploymentConfigLoader.load).toHaveBeenCalledWith(
          process.cwd(),
          expect.objectContaining(options)
        );
        expect(ghpages.publish).toHaveBeenCalledWith(
          expect.stringContaining('build'),
          expect.objectContaining({
            branch: 'production',
            message: 'Production deployment',
            remote: 'upstream',
            force: true
          }),
          expect.any(Function)
        );
      });

      it('should handle noBuild with dryRun', async () => {
        await deploy({ noBuild: true, dryRun: true });

        expect(Generator.create).not.toHaveBeenCalled();
        expect(ghpages.publish).not.toHaveBeenCalled();
      });

      it('should handle all flags simultaneously', async () => {
        (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
          repositoryUrl: 'https://github.com/user/repo.git',
          homepage: null,
          baseUrl: '/repo/',
          branch: 'deploy',
          buildDir: 'output',
          remote: 'origin'
        });

        const allOptions = {
          branch: 'deploy',
          message: 'Full deployment',
          remote: 'origin',
          dir: 'output',
          noBuild: false,
          dryRun: false,
          force: true
        };

        await deploy(allOptions);

        expect(DeploymentConfigLoader.load).toHaveBeenCalledWith(
          process.cwd(),
          allOptions
        );
      });
    });

    describe('Option validation', () => {
      it('should pass undefined options as empty object', async () => {
        await deploy();

        expect(DeploymentConfigLoader.load).toHaveBeenCalledWith(
          process.cwd(),
          {}
        );
      });

      it('should preserve boolean false values', async () => {
        await deploy({ noBuild: false, dryRun: false, force: false });

        expect(Generator.create).toHaveBeenCalled();
        expect(ghpages.publish).toHaveBeenCalled();
      });

      it('should handle options with undefined values', async () => {
        await deploy({ branch: undefined, message: undefined });

        expect(DeploymentConfigLoader.load).toHaveBeenCalledWith(
          process.cwd(),
          { branch: undefined, message: undefined }
        );
      });
    });
  });

  describe('Build integration', () => {
    let mockGenerator: any;

    beforeEach(() => {
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

      // Mock generator
      mockGenerator = {
        generate: jest.fn().mockResolvedValue(undefined),
        getConfig: jest.fn().mockReturnValue({ baseUrl: '/' }),
        getOutputDir: jest.fn().mockReturnValue('/test/dist')
      };
      (Generator.create as jest.Mock).mockResolvedValue(mockGenerator);

      // Mock fs
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.rmSync as jest.Mock).mockImplementation(() => {});
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      // Mock gh-pages
      (ghpages.publish as jest.Mock).mockImplementation((dir, options, callback) => {
        callback(null);
      });

      // Mock DeploymentConfigLoader static methods
      (DeploymentConfigLoader.extractRepoName as jest.Mock).mockReturnValue('repo');
      (DeploymentConfigLoader.generateGitHubPagesUrl as jest.Mock).mockReturnValue(
        'https://user.github.io/repo'
      );
    });

    it('should call build before deployment by default', async () => {
      await deploy();

      expect(Generator.create).toHaveBeenCalledWith({
        cwd: process.cwd(),
        outputDir: 'dist',
        clean: false
      });
      expect(mockGenerator.generate).toHaveBeenCalled();
    });

    it('should pass baseUrl from deployment config to build', async () => {
      await deploy();

      expect(mockGenerator.getConfig).toHaveBeenCalled();
      const config = mockGenerator.getConfig();
      expect(config.baseUrl).toBe('/repo/');
    });

    it('should clean build directory before building', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await deploy();

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.rmSync).toHaveBeenCalledWith(
        expect.stringContaining('dist'),
        { recursive: true, force: true }
      );
    });

    it('should skip build when --no-build flag is set', async () => {
      await deploy({ noBuild: true });

      expect(Generator.create).not.toHaveBeenCalled();
      expect(mockGenerator.generate).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping build')
      );
    });

    it('should handle build failures and abort deployment', async () => {
      const buildError = new ProjectionError(
        'Build failed',
        'RUNTIME_ERROR' as any,
        { message: 'Invalid project data' }
      );
      mockGenerator.generate.mockRejectedValue(buildError);

      await expect(deploy()).rejects.toThrow(ProjectionError);
      await expect(deploy()).rejects.toThrow('Build failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Build failed')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Deployment aborted')
      );
    });

    it('should display build progress messages', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      await deploy();

      // Check that build-related messages are displayed
      const allCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const output = allCalls.join('\n');
      
      expect(output).toContain('Building site');
      expect(output).toContain('Build complete');
    });

    it('should use custom build directory from options', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'gh-pages',
        buildDir: 'build',
        remote: 'origin'
      });

      await deploy({ dir: 'build' });

      expect(Generator.create).toHaveBeenCalledWith({
        cwd: process.cwd(),
        outputDir: 'build',
        clean: false
      });
    });

    it('should handle non-ProjectionError build failures', async () => {
      const unexpectedError = new Error('Unexpected build error');
      mockGenerator.generate.mockRejectedValue(unexpectedError);

      await expect(deploy()).rejects.toThrow(ProjectionError);
      await expect(deploy()).rejects.toThrow('Build failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Build failed')
      );
    });

    it('should display build errors with details', async () => {
      const buildError = new ProjectionError(
        'Validation failed',
        'VALIDATION_ERROR' as any,
        {
          errors: ['Missing required field: title', 'Invalid URL format']
        }
      );
      mockGenerator.generate.mockRejectedValue(buildError);

      await expect(deploy()).rejects.toThrow(ProjectionError);

      // Check that error messages are displayed
      const errorCalls = consoleErrorSpy.mock.calls.map(call => call.join(' '));
      const logCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const allOutput = [...errorCalls, ...logCalls].join('\n');
      
      expect(allOutput).toContain('Build failed');
      expect(allOutput).toContain('Errors:');
    });

    it('should not clean directory if it does not exist', async () => {
      let callCount = 0;
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        callCount++;
        // First call is for checking if build dir exists to clean it (should return false)
        // Subsequent calls are for deployment phase checks (should return true)
        return callCount > 1;
      });

      await deploy();

      expect(fs.rmSync).not.toHaveBeenCalled();
    });
  });

  describe('gh-pages deployment', () => {
    let mockGenerator: any;

    beforeEach(() => {
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

      // Mock generator
      mockGenerator = {
        generate: jest.fn().mockResolvedValue(undefined),
        getConfig: jest.fn().mockReturnValue({ baseUrl: '/' }),
        getOutputDir: jest.fn().mockReturnValue('/test/dist')
      };
      (Generator.create as jest.Mock).mockResolvedValue(mockGenerator);

      // Mock fs
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.rmSync as jest.Mock).mockImplementation(() => {});
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      // Mock gh-pages
      (ghpages.publish as jest.Mock).mockImplementation((dir, options, callback) => {
        callback(null);
      });

      // Mock DeploymentConfigLoader static methods
      (DeploymentConfigLoader.extractRepoName as jest.Mock).mockReturnValue('repo');
      (DeploymentConfigLoader.generateGitHubPagesUrl as jest.Mock).mockReturnValue(
        'https://user.github.io/repo'
      );
    });

    it('should add .nojekyll file to build directory', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        return !path.endsWith('.nojekyll');
      });

      await deploy();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.nojekyll'),
        '',
        'utf8'
      );
    });

    it('should not add .nojekyll if it already exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await deploy();

      expect(fs.writeFileSync).not.toHaveBeenCalledWith(
        expect.stringContaining('.nojekyll'),
        expect.anything(),
        expect.anything()
      );
    });

    it('should add CNAME file when homepage is configured', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: 'example.com',
        baseUrl: '/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'origin'
      });

      await deploy();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('CNAME'),
        'example.com',
        'utf8'
      );
    });

    it('should not add CNAME file when homepage is not configured', async () => {
      await deploy();

      expect(fs.writeFileSync).not.toHaveBeenCalledWith(
        expect.stringContaining('CNAME'),
        expect.anything(),
        expect.anything()
      );
    });

    it('should configure gh-pages with correct options', async () => {
      await deploy();

      expect(ghpages.publish).toHaveBeenCalledWith(
        expect.stringContaining('dist'),
        expect.objectContaining({
          branch: 'gh-pages',
          dest: '.',
          remote: 'origin',
          dotfiles: true,
          add: true
        }),
        expect.any(Function)
      );
    });

    it('should use custom branch from options', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'deploy',
        buildDir: 'dist',
        remote: 'origin'
      });

      await deploy({ branch: 'deploy' });

      expect(ghpages.publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          branch: 'deploy'
        }),
        expect.any(Function)
      );
    });

    it('should use custom commit message from options', async () => {
      await deploy({ message: 'Custom deployment message' });

      expect(ghpages.publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          message: 'Custom deployment message'
        }),
        expect.any(Function)
      );
    });

    it('should use default commit message with timestamp', async () => {
      await deploy();

      expect(ghpages.publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          message: expect.stringContaining('Deploy to GitHub Pages')
        }),
        expect.any(Function)
      );
    });

    it('should enable force push when --force flag is set', async () => {
      await deploy({ force: true });

      expect(ghpages.publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          force: true
        }),
        expect.any(Function)
      );
    });

    it('should not enable force push by default', async () => {
      await deploy();

      const publishCall = (ghpages.publish as jest.Mock).mock.calls[0];
      const options = publishCall[1];
      expect(options.force).toBeUndefined();
    });

    it('should display success message after deployment', async () => {
      await deploy();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Deployment successful')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://user.github.io/repo')
      );
    });

    it('should display custom domain URL when homepage is configured', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: 'example.com',
        baseUrl: '/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'origin'
      });

      await deploy();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('example.com')
      );
    });

    it('should display GitHub Pages setup instructions', async () => {
      await deploy();

      const allCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const output = allCalls.join('\n');

      expect(output).toContain('If this is your first deployment');
      expect(output).toContain('repository settings');
      expect(output).toContain('gh-pages');
    });

    it('should display deployment branch in success message', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'production',
        buildDir: 'dist',
        remote: 'origin'
      });

      await deploy({ branch: 'production' });

      const allCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const output = allCalls.join('\n');

      expect(output).toContain('Branch');
      expect(output).toContain('production');
    });

    it('should display commit message in success message', async () => {
      const customMessage = 'Release v2.0.0';
      await deploy({ message: customMessage });

      const allCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const output = allCalls.join('\n');

      expect(output).toContain('Commit');
      expect(output).toContain(customMessage);
    });

    it('should display estimated time for GitHub Pages to update', async () => {
      await deploy();

      const allCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const output = allCalls.join('\n');

      expect(output).toContain('may take a few minutes');
      expect(output).toContain('GitHub Pages to update');
    });

    it('should display complete success information with all fields', async () => {
      const customMessage = 'Deploy production build';
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'origin'
      });

      await deploy({ message: customMessage });

      const allCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const output = allCalls.join('\n');

      // Verify all required success message components
      expect(output).toContain('Deployment successful');
      expect(output).toContain('Site URL');
      expect(output).toContain('https://user.github.io/repo');
      expect(output).toContain('Branch');
      expect(output).toContain('gh-pages');
      expect(output).toContain('Commit');
      expect(output).toContain(customMessage);
      expect(output).toContain('Your site has been deployed to GitHub Pages');
      expect(output).toContain('may take a few minutes');
    });

    it('should provide instructions for enabling GitHub Pages on first deployment', async () => {
      await deploy();

      const allCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const output = allCalls.join('\n');

      expect(output).toContain('If this is your first deployment');
      expect(output).toContain('Go to your repository settings on GitHub');
      expect(output).toContain('Navigate to Pages section');
      expect(output).toContain("Ensure the source is set to the 'gh-pages' branch");
    });

    it('should display custom branch name in setup instructions', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'deploy',
        buildDir: 'dist',
        remote: 'origin'
      });

      await deploy({ branch: 'deploy' });

      const allCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const output = allCalls.join('\n');

      expect(output).toContain("Ensure the source is set to the 'deploy' branch");
    });

    it('should throw error if build directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(deploy({ noBuild: true })).rejects.toThrow(ProjectionError);
      
      // The error message will be "Deployment failed" but the original error is about build directory
      const errorCalls = consoleErrorSpy.mock.calls.map(call => call.join(' '));
      const logCalls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      const allOutput = [...errorCalls, ...logCalls].join('\n');
      
      expect(allOutput).toContain('Deployment failed');
    });

    it('should handle authentication errors', async () => {
      (ghpages.publish as jest.Mock).mockImplementation((dir, options, callback) => {
        callback(new Error('Permission denied (publickey)'));
      });

      await expect(deploy()).rejects.toThrow(ProjectionError);
      await expect(deploy()).rejects.toThrow('Deployment failed');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Authentication failed')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('SSH keys')
      );
    });

    it('should handle push rejection errors', async () => {
      (ghpages.publish as jest.Mock).mockImplementation((dir, options, callback) => {
        callback(new Error('Push rejected due to conflicts'));
      });

      await expect(deploy()).rejects.toThrow(ProjectionError);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Push rejected')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('--force flag')
      );
    });

    it('should handle repository not found errors', async () => {
      (ghpages.publish as jest.Mock).mockImplementation((dir, options, callback) => {
        callback(new Error('Repository not found'));
      });

      await expect(deploy()).rejects.toThrow(ProjectionError);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Repository or remote not found')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('git remote -v')
      );
    });

    it('should handle generic gh-pages errors', async () => {
      (ghpages.publish as jest.Mock).mockImplementation((dir, options, callback) => {
        callback(new Error('Unknown deployment error'));
      });

      await expect(deploy()).rejects.toThrow(ProjectionError);
      await expect(deploy()).rejects.toThrow('Deployment failed');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown deployment error')
      );
    });

    it('should use custom remote from options', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'upstream'
      });

      await deploy({ remote: 'upstream' });

      expect(ghpages.publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          remote: 'upstream'
        }),
        expect.any(Function)
      );
    });

    it('should preserve commit history with add: true', async () => {
      await deploy();

      expect(ghpages.publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          add: true
        }),
        expect.any(Function)
      );
    });

    it('should include dotfiles with dotfiles: true', async () => {
      await deploy();

      expect(ghpages.publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          dotfiles: true
        }),
        expect.any(Function)
      );
    });

    it('should deploy to root of gh-pages branch with dest: "."', async () => {
      await deploy();

      expect(ghpages.publish).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          dest: '.'
        }),
        expect.any(Function)
      );
    });

    it('should use custom build directory from options', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'gh-pages',
        buildDir: 'build',
        remote: 'origin'
      });

      await deploy({ dir: 'build' });

      expect(ghpages.publish).toHaveBeenCalledWith(
        expect.stringContaining('build'),
        expect.anything(),
        expect.any(Function)
      );
    });

    it('should handle absolute build directory paths', async () => {
      (DeploymentConfigLoader.load as jest.Mock).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        homepage: null,
        baseUrl: '/repo/',
        branch: 'gh-pages',
        buildDir: '/absolute/path/to/dist',
        remote: 'origin'
      });

      await deploy();

      expect(ghpages.publish).toHaveBeenCalledWith(
        '/absolute/path/to/dist',
        expect.anything(),
        expect.any(Function)
      );
    });
  });
});
