import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DeploymentConfigLoader, DeployOptions } from '../../src/utils/deployment-config';
import { GitHelper } from '../../src/utils/git-helper';
import { ProjectionError, ErrorCodes } from '../../src/utils/errors';

// Mock GitHelper
jest.mock('../../src/utils/git-helper');

describe('DeploymentConfigLoader', () => {
  let tempDir: string;
  const mockGitHelper = GitHelper as jest.Mocked<typeof GitHelper>;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projection-deploy-test-'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('extractRepoName', () => {
    it('should extract repo name from HTTPS URL', () => {
      const url = 'https://github.com/user/my-portfolio.git';
      const result = DeploymentConfigLoader.extractRepoName(url);
      expect(result).toBe('my-portfolio');
    });

    it('should extract repo name from HTTPS URL without .git', () => {
      const url = 'https://github.com/user/my-portfolio';
      const result = DeploymentConfigLoader.extractRepoName(url);
      expect(result).toBe('my-portfolio');
    });

    it('should extract repo name from SSH URL', () => {
      const url = 'git@github.com:user/my-portfolio.git';
      const result = DeploymentConfigLoader.extractRepoName(url);
      expect(result).toBe('my-portfolio');
    });

    it('should extract repo name from SSH URL without .git', () => {
      const url = 'git@github.com:user/my-portfolio';
      const result = DeploymentConfigLoader.extractRepoName(url);
      expect(result).toBe('my-portfolio');
    });

    it('should handle repo names with hyphens', () => {
      const url = 'https://github.com/user/my-awesome-portfolio.git';
      const result = DeploymentConfigLoader.extractRepoName(url);
      expect(result).toBe('my-awesome-portfolio');
    });

    it('should handle repo names with underscores', () => {
      const url = 'https://github.com/user/my_portfolio_site.git';
      const result = DeploymentConfigLoader.extractRepoName(url);
      expect(result).toBe('my_portfolio_site');
    });

    it('should handle repo names with numbers', () => {
      const url = 'https://github.com/user/portfolio-2024.git';
      const result = DeploymentConfigLoader.extractRepoName(url);
      expect(result).toBe('portfolio-2024');
    });
  });

  describe('generateGitHubPagesUrl', () => {
    it('should generate GitHub Pages URL from HTTPS URL', () => {
      const url = 'https://github.com/user/my-portfolio.git';
      const result = DeploymentConfigLoader.generateGitHubPagesUrl(url);
      expect(result).toBe('https://user.github.io/my-portfolio');
    });

    it('should generate GitHub Pages URL from HTTPS URL without .git', () => {
      const url = 'https://github.com/user/my-portfolio';
      const result = DeploymentConfigLoader.generateGitHubPagesUrl(url);
      expect(result).toBe('https://user.github.io/my-portfolio');
    });

    it('should generate GitHub Pages URL from SSH URL', () => {
      const url = 'git@github.com:user/my-portfolio.git';
      const result = DeploymentConfigLoader.generateGitHubPagesUrl(url);
      expect(result).toBe('https://user.github.io/my-portfolio');
    });

    it('should generate GitHub Pages URL from SSH URL without .git', () => {
      const url = 'git@github.com:user/my-portfolio';
      const result = DeploymentConfigLoader.generateGitHubPagesUrl(url);
      expect(result).toBe('https://user.github.io/my-portfolio');
    });

    it('should handle usernames with hyphens', () => {
      const url = 'https://github.com/my-user/portfolio.git';
      const result = DeploymentConfigLoader.generateGitHubPagesUrl(url);
      expect(result).toBe('https://my-user.github.io/portfolio');
    });

    it('should handle repo names with special characters', () => {
      const url = 'https://github.com/user/my-awesome-portfolio-2024.git';
      const result = DeploymentConfigLoader.generateGitHubPagesUrl(url);
      expect(result).toBe('https://user.github.io/my-awesome-portfolio-2024');
    });

    it('should fallback to original URL for non-GitHub URLs', () => {
      const url = 'https://gitlab.com/user/repo.git';
      const result = DeploymentConfigLoader.generateGitHubPagesUrl(url);
      expect(result).toBe(url);
    });
  });

  describe('load', () => {
    it('should load deployment config with default values', async () => {
      const repoUrl = 'https://github.com/user/my-portfolio.git';
      mockGitHelper.getRepositoryUrl.mockResolvedValue(repoUrl);

      // Create minimal config
      const configPath = path.join(tempDir, 'projection.config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        title: 'My Portfolio',
        description: 'Test portfolio',
        baseUrl: './'
      }));

      const result = await DeploymentConfigLoader.load(tempDir, {});

      expect(result).toEqual({
        repositoryUrl: repoUrl,
        homepage: null,
        baseUrl: '/my-portfolio/',
        branch: 'gh-pages',
        buildDir: 'dist',
        remote: 'origin',
      });
    });

    it('should use baseUrl from config when provided', async () => {
      const repoUrl = 'https://github.com/user/my-portfolio.git';
      mockGitHelper.getRepositoryUrl.mockResolvedValue(repoUrl);

      const configPath = path.join(tempDir, 'projection.config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        title: 'My Portfolio',
        description: 'Test portfolio',
        baseUrl: '/custom-base/'
      }));

      const result = await DeploymentConfigLoader.load(tempDir, {});

      expect(result.baseUrl).toBe('/custom-base/');
    });

    it('should auto-generate baseUrl when config has default value', async () => {
      const repoUrl = 'https://github.com/user/awesome-project.git';
      mockGitHelper.getRepositoryUrl.mockResolvedValue(repoUrl);

      const configPath = path.join(tempDir, 'projection.config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        title: 'My Portfolio',
        description: 'Test portfolio',
        baseUrl: './'
      }));

      const result = await DeploymentConfigLoader.load(tempDir, {});

      expect(result.baseUrl).toBe('/awesome-project/');
    });

    it('should use homepage from config when provided', async () => {
      const repoUrl = 'https://github.com/user/my-portfolio.git';
      mockGitHelper.getRepositoryUrl.mockResolvedValue(repoUrl);

      const configPath = path.join(tempDir, 'projection.config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        title: 'My Portfolio',
        description: 'Test portfolio',
        baseUrl: '/my-portfolio/',
        homepage: 'portfolio.example.com'
      }, null, 2));

      const result = await DeploymentConfigLoader.load(tempDir, {});

      expect(result.homepage).toBe('portfolio.example.com');
    });

    it('should use deployBranch from config when provided', async () => {
      const repoUrl = 'https://github.com/user/my-portfolio.git';
      mockGitHelper.getRepositoryUrl.mockResolvedValue(repoUrl);

      const configPath = path.join(tempDir, 'projection.config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        title: 'My Portfolio',
        description: 'Test portfolio',
        baseUrl: '/my-portfolio/',
        deployBranch: 'production'
      }, null, 2));

      const result = await DeploymentConfigLoader.load(tempDir, {});

      expect(result.branch).toBe('production');
    });

    it('should prioritize CLI options over config values', async () => {
      const repoUrl = 'https://github.com/user/my-portfolio.git';
      mockGitHelper.getRepositoryUrl.mockResolvedValue(repoUrl);

      const configPath = path.join(tempDir, 'projection.config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        title: 'My Portfolio',
        description: 'Test portfolio',
        baseUrl: '/my-portfolio/',
        deployBranch: 'production',
        output: 'build'
      }, null, 2));

      const options: DeployOptions = {
        branch: 'custom-branch',
        dir: 'public',
        remote: 'upstream'
      };

      const result = await DeploymentConfigLoader.load(tempDir, options);

      expect(result.branch).toBe('custom-branch');
      expect(result.buildDir).toBe('public');
      expect(result.remote).toBe('upstream');
    });

    it('should use custom remote from options', async () => {
      const repoUrl = 'https://github.com/user/my-portfolio.git';
      mockGitHelper.getRepositoryUrl.mockResolvedValue(repoUrl);

      const configPath = path.join(tempDir, 'projection.config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        title: 'My Portfolio',
        description: 'Test portfolio',
        baseUrl: './'
      }));

      const options: DeployOptions = {
        remote: 'upstream'
      };

      const result = await DeploymentConfigLoader.load(tempDir, options);

      expect(result.remote).toBe('upstream');
      expect(mockGitHelper.getRepositoryUrl).toHaveBeenCalledWith(tempDir, 'upstream');
    });

    it('should throw error when no Git remote found', async () => {
      mockGitHelper.getRepositoryUrl.mockResolvedValue(null);

      const configPath = path.join(tempDir, 'projection.config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        title: 'My Portfolio',
        description: 'Test portfolio',
        baseUrl: './'
      }));

      await expect(DeploymentConfigLoader.load(tempDir, {})).rejects.toThrow(ProjectionError);
      await expect(DeploymentConfigLoader.load(tempDir, {})).rejects.toMatchObject({
        code: ErrorCodes.CONFIG_ERROR,
        message: expect.stringContaining("No Git remote 'origin' found"),
        details: {
          remote: 'origin',
          solution: expect.stringContaining('git remote add')
        }
      });
    });

    it('should throw error with custom remote name when not found', async () => {
      mockGitHelper.getRepositoryUrl.mockResolvedValue(null);

      const configPath = path.join(tempDir, 'projection.config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        title: 'My Portfolio',
        description: 'Test portfolio',
        baseUrl: './'
      }));

      const options: DeployOptions = {
        remote: 'upstream'
      };

      await expect(DeploymentConfigLoader.load(tempDir, options)).rejects.toThrow(ProjectionError);
      await expect(DeploymentConfigLoader.load(tempDir, options)).rejects.toMatchObject({
        message: expect.stringContaining("No Git remote 'upstream' found"),
        details: {
          remote: 'upstream'
        }
      });
    });

    it('should handle SSH URLs correctly', async () => {
      const repoUrl = 'git@github.com:quasarbright/projects.git';
      mockGitHelper.getRepositoryUrl.mockResolvedValue(repoUrl);

      const configPath = path.join(tempDir, 'projection.config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        title: 'My Projects',
        description: 'Test projects',
        baseUrl: './'
      }));

      const result = await DeploymentConfigLoader.load(tempDir, {});

      expect(result.repositoryUrl).toBe(repoUrl);
      expect(result.baseUrl).toBe('/projects/');
    });

    it('should use output from config for buildDir', async () => {
      const repoUrl = 'https://github.com/user/my-portfolio.git';
      mockGitHelper.getRepositoryUrl.mockResolvedValue(repoUrl);

      const configPath = path.join(tempDir, 'projection.config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        title: 'My Portfolio',
        description: 'Test portfolio',
        baseUrl: '/my-portfolio/',
        output: 'build'
      }));

      const result = await DeploymentConfigLoader.load(tempDir, {});

      expect(result.buildDir).toBe('build');
    });

    it('should handle all options together', async () => {
      const repoUrl = 'https://github.com/user/my-portfolio.git';
      mockGitHelper.getRepositoryUrl.mockResolvedValue(repoUrl);

      const configPath = path.join(tempDir, 'projection.config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        title: 'My Portfolio',
        description: 'Test portfolio',
        baseUrl: '/custom/',
        homepage: 'example.com',
        deployBranch: 'main',
        output: 'public'
      }, null, 2));

      const options: DeployOptions = {
        branch: 'deploy',
        dir: 'dist',
        remote: 'upstream'
      };

      const result = await DeploymentConfigLoader.load(tempDir, options);

      expect(result).toEqual({
        repositoryUrl: repoUrl,
        homepage: 'example.com',
        baseUrl: '/custom/',
        branch: 'deploy',
        buildDir: 'dist',
        remote: 'upstream',
      });
    });
  });
});
