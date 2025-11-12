import { GitHelper } from '../../src/utils/git-helper';

// Mock child_process at the module level
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

jest.mock('util', () => ({
  promisify: jest.fn((fn) => fn),
}));

const { exec } = require('child_process');

describe('GitHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isGitInstalled', () => {
    it('should return true when Git is installed', async () => {
      exec.mockResolvedValue({ stdout: 'git version 2.39.0', stderr: '' });

      const result = await GitHelper.isGitInstalled();

      expect(result).toBe(true);
      expect(exec).toHaveBeenCalledWith('git --version');
    });

    it('should return false when Git is not installed', async () => {
      exec.mockRejectedValue(new Error('command not found'));

      const result = await GitHelper.isGitInstalled();

      expect(result).toBe(false);
    });

    it('should return false when Git command fails', async () => {
      exec.mockRejectedValue(new Error('Git error'));

      const result = await GitHelper.isGitInstalled();

      expect(result).toBe(false);
    });
  });

  describe('getCurrentBranch', () => {
    const mockCwd = '/test/project';

    it('should return current branch name', async () => {
      exec.mockResolvedValue({ stdout: 'main\n', stderr: '' });

      const result = await GitHelper.getCurrentBranch(mockCwd);

      expect(result).toBe('main');
      expect(exec).toHaveBeenCalledWith('git rev-parse --abbrev-ref HEAD', { cwd: mockCwd });
    });

    it('should trim whitespace from branch name', async () => {
      exec.mockResolvedValue({ stdout: '  feature/test-branch  \n', stderr: '' });

      const result = await GitHelper.getCurrentBranch(mockCwd);

      expect(result).toBe('feature/test-branch');
    });

    it('should handle different branch names', async () => {
      exec.mockResolvedValue({ stdout: 'develop\n', stderr: '' });

      const result = await GitHelper.getCurrentBranch(mockCwd);

      expect(result).toBe('develop');
    });

    it('should throw error when not in a Git repository', async () => {
      exec.mockRejectedValue(new Error('not a git repository'));

      await expect(GitHelper.getCurrentBranch(mockCwd)).rejects.toThrow(
        'Unable to determine current Git branch'
      );
    });

    it('should throw error when Git command fails', async () => {
      exec.mockRejectedValue(new Error('fatal: Git error'));

      await expect(GitHelper.getCurrentBranch(mockCwd)).rejects.toThrow(
        'Unable to determine current Git branch'
      );
    });
  });

  describe('getRepositoryUrl', () => {
    const mockCwd = '/test/project';

    it('should return repository URL for origin remote', async () => {
      const mockUrl = 'https://github.com/user/repo.git';
      exec.mockResolvedValue({ stdout: `${mockUrl}\n`, stderr: '' });

      const result = await GitHelper.getRepositoryUrl(mockCwd);

      expect(result).toBe(mockUrl);
      expect(exec).toHaveBeenCalledWith('git remote get-url origin', { cwd: mockCwd });
    });

    it('should return repository URL for custom remote', async () => {
      const mockUrl = 'https://github.com/user/repo.git';
      exec.mockResolvedValue({ stdout: `${mockUrl}\n`, stderr: '' });

      const result = await GitHelper.getRepositoryUrl(mockCwd, 'upstream');

      expect(result).toBe(mockUrl);
      expect(exec).toHaveBeenCalledWith('git remote get-url upstream', { cwd: mockCwd });
    });

    it('should handle SSH URLs', async () => {
      const mockUrl = 'git@github.com:user/repo.git';
      exec.mockResolvedValue({ stdout: `${mockUrl}\n`, stderr: '' });

      const result = await GitHelper.getRepositoryUrl(mockCwd);

      expect(result).toBe(mockUrl);
    });

    it('should trim whitespace from URL', async () => {
      const mockUrl = 'https://github.com/user/repo.git';
      exec.mockResolvedValue({ stdout: `  ${mockUrl}  \n`, stderr: '' });

      const result = await GitHelper.getRepositoryUrl(mockCwd);

      expect(result).toBe(mockUrl);
    });

    it('should return null when remote does not exist', async () => {
      exec.mockRejectedValue(new Error('fatal: No such remote'));

      const result = await GitHelper.getRepositoryUrl(mockCwd);

      expect(result).toBeNull();
    });

    it('should return null when not in a Git repository', async () => {
      exec.mockRejectedValue(new Error('not a git repository'));

      const result = await GitHelper.getRepositoryUrl(mockCwd);

      expect(result).toBeNull();
    });
  });

  describe('validateRepository', () => {
    const mockCwd = '/test/project';

    it('should return complete validation result for valid repository', async () => {
      exec
        .mockResolvedValueOnce({ stdout: '.git\n', stderr: '' }) // git rev-parse --git-dir
        .mockResolvedValueOnce({ stdout: 'main\n', stderr: '' }) // getCurrentBranch
        .mockResolvedValueOnce({ stdout: 'https://github.com/user/repo.git\n', stderr: '' }); // getRepositoryUrl

      const result = await GitHelper.validateRepository(mockCwd);

      expect(result).toEqual({
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main',
      });
    });

    it('should validate with custom remote name', async () => {
      exec
        .mockResolvedValueOnce({ stdout: '.git\n', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'develop\n', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'https://github.com/user/repo.git\n', stderr: '' });

      const result = await GitHelper.validateRepository(mockCwd, 'upstream');

      expect(result.remoteName).toBe('upstream');
      expect(result.hasRemote).toBe(true);
    });

    it('should return false for isGitRepo when not in a Git repository', async () => {
      exec.mockRejectedValue(new Error('not a git repository'));

      const result = await GitHelper.validateRepository(mockCwd);

      expect(result).toEqual({
        isGitRepo: false,
        hasRemote: false,
        remoteName: 'origin',
        remoteUrl: '',
        currentBranch: '',
      });
    });

    it('should handle repository without remote', async () => {
      exec
        .mockResolvedValueOnce({ stdout: '.git\n', stderr: '' }) // git rev-parse --git-dir
        .mockResolvedValueOnce({ stdout: 'main\n', stderr: '' }) // getCurrentBranch
        .mockRejectedValueOnce(new Error('fatal: No such remote')); // getRepositoryUrl

      const result = await GitHelper.validateRepository(mockCwd);

      expect(result).toEqual({
        isGitRepo: true,
        hasRemote: false,
        remoteName: 'origin',
        remoteUrl: '',
        currentBranch: 'main',
      });
    });

    it('should handle repository without current branch', async () => {
      exec
        .mockResolvedValueOnce({ stdout: '.git\n', stderr: '' }) // git rev-parse --git-dir
        .mockRejectedValueOnce(new Error('fatal: ref HEAD is not a symbolic ref')) // getCurrentBranch
        .mockResolvedValueOnce({ stdout: 'https://github.com/user/repo.git\n', stderr: '' }); // getRepositoryUrl

      const result = await GitHelper.validateRepository(mockCwd);

      expect(result).toEqual({
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: '',
      });
    });

    it('should handle repository with neither branch nor remote', async () => {
      exec
        .mockResolvedValueOnce({ stdout: '.git\n', stderr: '' }) // git rev-parse --git-dir
        .mockRejectedValueOnce(new Error('fatal: ref HEAD is not a symbolic ref')) // getCurrentBranch
        .mockRejectedValueOnce(new Error('fatal: No such remote')); // getRepositoryUrl

      const result = await GitHelper.validateRepository(mockCwd);

      expect(result).toEqual({
        isGitRepo: true,
        hasRemote: false,
        remoteName: 'origin',
        remoteUrl: '',
        currentBranch: '',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty directory path', async () => {
      exec.mockRejectedValue(new Error('not a git repository'));

      const result = await GitHelper.validateRepository('');

      expect(result.isGitRepo).toBe(false);
    });

    it('should handle directory with special characters', async () => {
      const specialDir = '/test/my-project (v2)';
      exec
        .mockResolvedValueOnce({ stdout: '.git\n', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'main\n', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'https://github.com/user/repo.git\n', stderr: '' });

      const result = await GitHelper.validateRepository(specialDir);

      expect(result.isGitRepo).toBe(true);
      expect(exec).toHaveBeenCalledWith('git rev-parse --git-dir', { cwd: specialDir });
    });

    it('should handle URLs with special characters', async () => {
      const mockCwd = '/test/project';
      const urlWithSpaces = 'https://github.com/user/my%20repo.git';
      exec.mockResolvedValue({ stdout: `${urlWithSpaces}\n`, stderr: '' });

      const result = await GitHelper.getRepositoryUrl(mockCwd);

      expect(result).toBe(urlWithSpaces);
    });
  });
});
