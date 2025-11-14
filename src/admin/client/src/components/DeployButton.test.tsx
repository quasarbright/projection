import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeployButton } from './DeployButton';
import * as api from '../services/api';

vi.mock('../services/api');

describe('DeployButton', () => {
  const mockOnDeployStart = vi.fn();
  const mockOnDeployComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Initial State', () => {
    it('should render deploy button', () => {
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: true,
        gitInstalled: true,
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main',
      });

      render(<DeployButton />);

      expect(screen.getByRole('button', { name: /Deploy to GitHub Pages/i })).toBeInTheDocument();
    });

    it('should show loading state while checking Git status', () => {
      vi.mocked(api.checkDeploymentStatus).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<DeployButton />);

      expect(screen.getByText(/Checking.../i)).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /Loading/i })).toBeInTheDocument();
    });

    it('should fetch Git status on mount', async () => {
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: true,
        gitInstalled: true,
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main',
      });

      render(<DeployButton />);

      await waitFor(() => {
        expect(api.checkDeploymentStatus).toHaveBeenCalled();
      });
    });
  });

  describe('Git Status Validation', () => {
    it('should disable button when Git is not installed', async () => {
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: false,
        gitInstalled: false,
        isGitRepo: false,
        hasRemote: false,
        remoteName: '',
        remoteUrl: '',
        currentBranch: '',
        issues: ['Git is not installed or not in PATH'],
      });

      render(<DeployButton />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
      });
    });

    it('should disable button when not a Git repository', async () => {
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: false,
        gitInstalled: true,
        isGitRepo: false,
        hasRemote: false,
        remoteName: 'origin',
        remoteUrl: '',
        currentBranch: '',
        issues: ['Not a Git repository'],
      });

      render(<DeployButton />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
      });
    });

    it('should disable button when no remote configured', async () => {
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: false,
        gitInstalled: true,
        isGitRepo: true,
        hasRemote: false,
        remoteName: 'origin',
        remoteUrl: '',
        currentBranch: 'main',
        issues: ['No Git remote configured'],
      });

      render(<DeployButton />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
      });
    });

    it('should enable button when Git is properly configured', async () => {
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: true,
        gitInstalled: true,
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main',
      });

      render(<DeployButton />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Tooltip Display', () => {
    it('should show tooltip on hover when button is disabled', async () => {
      const user = userEvent.setup();
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: false,
        gitInstalled: false,
        isGitRepo: false,
        hasRemote: false,
        remoteName: '',
        remoteUrl: '',
        currentBranch: '',
        issues: ['Git is not installed or not in PATH'],
      });

      render(<DeployButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeDisabled();
      });

      const container = screen.getByRole('button').parentElement!;
      await user.hover(container);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        expect(screen.getByText(/Git is not installed/i)).toBeInTheDocument();
      });
    });

    it('should show appropriate tooltip message for each issue', async () => {
      const user = userEvent.setup();
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: false,
        gitInstalled: true,
        isGitRepo: false,
        hasRemote: false,
        remoteName: 'origin',
        remoteUrl: '',
        currentBranch: '',
        issues: ['Not a Git repository'],
      });

      render(<DeployButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeDisabled();
      });

      const container = screen.getByRole('button').parentElement!;
      await user.hover(container);

      await waitFor(() => {
        expect(screen.getByText(/Not a Git repository/i)).toBeInTheDocument();
      });
    });
  });

  describe('Deployment Flow', () => {
    it('should open confirmation dialog when button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: true,
        gitInstalled: true,
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main',
      });
      vi.mocked(api.getDeploymentConfig).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        branch: 'gh-pages',
        baseUrl: '/repo/',
        homepage: null,
        buildDir: 'dist',
      });

      render(<DeployButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(api.getDeploymentConfig).toHaveBeenCalled();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should call onDeployStart when deployment begins', async () => {
      const user = userEvent.setup();
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: true,
        gitInstalled: true,
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main',
      });
      vi.mocked(api.getDeploymentConfig).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        branch: 'gh-pages',
        baseUrl: '/repo/',
        homepage: null,
        buildDir: 'dist',
      });
      vi.mocked(api.triggerDeployment).mockResolvedValue({
        success: true,
        message: 'Deployment completed successfully',
        url: 'https://user.github.io/repo',
        branch: 'gh-pages',
        duration: 45000,
      });

      render(<DeployButton onDeployStart={mockOnDeployStart} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Deploy Now/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnDeployStart).toHaveBeenCalled();
      });
    });

    it('should show deploying state during deployment', async () => {
      const user = userEvent.setup();
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: true,
        gitInstalled: true,
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main',
      });
      vi.mocked(api.getDeploymentConfig).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        branch: 'gh-pages',
        baseUrl: '/repo/',
        homepage: null,
        buildDir: 'dist',
      });
      vi.mocked(api.triggerDeployment).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<DeployButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Deploy Now/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Deploying.../i)).toBeInTheDocument();
        expect(screen.getByRole('status', { name: /Deploying/i })).toBeInTheDocument();
      });
    });

    it('should call onDeployComplete with success on successful deployment', async () => {
      const user = userEvent.setup();
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: true,
        gitInstalled: true,
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main',
      });
      vi.mocked(api.getDeploymentConfig).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        branch: 'gh-pages',
        baseUrl: '/repo/',
        homepage: null,
        buildDir: 'dist',
      });
      vi.mocked(api.triggerDeployment).mockResolvedValue({
        success: true,
        message: 'Deployment completed successfully',
        url: 'https://user.github.io/repo',
        branch: 'gh-pages',
        duration: 45000,
      });

      render(<DeployButton onDeployComplete={mockOnDeployComplete} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Deploy Now/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnDeployComplete).toHaveBeenCalledWith(
          true,
          'https://user.github.io/repo',
          undefined
        );
      });
    });

    it('should show success state after successful deployment', async () => {
      const user = userEvent.setup();
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: true,
        gitInstalled: true,
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main',
      });
      vi.mocked(api.getDeploymentConfig).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        branch: 'gh-pages',
        baseUrl: '/repo/',
        homepage: null,
        buildDir: 'dist',
      });
      vi.mocked(api.triggerDeployment).mockResolvedValue({
        success: true,
        message: 'Deployment completed successfully',
        url: 'https://user.github.io/repo',
        branch: 'gh-pages',
        duration: 45000,
      });

      render(<DeployButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Deploy Now/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Deployed!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error dialog on deployment failure', async () => {
      const user = userEvent.setup();
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: true,
        gitInstalled: true,
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main',
      });
      vi.mocked(api.getDeploymentConfig).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        branch: 'gh-pages',
        baseUrl: '/repo/',
        homepage: null,
        buildDir: 'dist',
      });
      vi.mocked(api.triggerDeployment).mockResolvedValue({
        success: false,
        message: 'Deployment failed',
        duration: 10000,
        error: {
          code: 'BUILD_ERROR',
          message: 'Build validation failed',
          details: 'Invalid project data',
        },
      });

      render(<DeployButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Deploy Now/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Build validation failed/i)).toBeInTheDocument();
      });
    });

    it('should call onDeployComplete with error on failure', async () => {
      const user = userEvent.setup();
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: true,
        gitInstalled: true,
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main',
      });
      vi.mocked(api.getDeploymentConfig).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        branch: 'gh-pages',
        baseUrl: '/repo/',
        homepage: null,
        buildDir: 'dist',
      });
      const deployError = {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        details: 'Permission denied',
      };
      vi.mocked(api.triggerDeployment).mockResolvedValue({
        success: false,
        message: 'Deployment failed',
        duration: 5000,
        error: deployError,
      });

      render(<DeployButton onDeployComplete={mockOnDeployComplete} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Deploy Now/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnDeployComplete).toHaveBeenCalledWith(false, undefined, deployError);
      });
    });

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: true,
        gitInstalled: true,
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main',
      });
      vi.mocked(api.getDeploymentConfig).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        branch: 'gh-pages',
        baseUrl: '/repo/',
        homepage: null,
        buildDir: 'dist',
      });
      vi.mocked(api.triggerDeployment).mockRejectedValue(
        new Error('Network error')
      );

      render(<DeployButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Deploy Now/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dialog Interactions', () => {
    it('should close confirmation dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(api.checkDeploymentStatus).mockResolvedValue({
        ready: true,
        gitInstalled: true,
        isGitRepo: true,
        hasRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/user/repo.git',
        currentBranch: 'main',
      });
      vi.mocked(api.getDeploymentConfig).mockResolvedValue({
        repositoryUrl: 'https://github.com/user/repo.git',
        branch: 'gh-pages',
        baseUrl: '/repo/',
        homepage: null,
        buildDir: 'dist',
      });

      render(<DeployButton />);

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });
});
