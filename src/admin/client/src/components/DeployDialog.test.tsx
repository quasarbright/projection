import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeployDialog } from './DeployDialog';

describe('DeployDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  const mockDeployConfig = {
    repositoryUrl: 'https://github.com/user/repo.git',
    branch: 'gh-pages',
    baseUrl: '/repo/',
    homepage: null,
    buildDir: 'dist',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <DeployDialog
          isOpen={false}
          deployConfig={mockDeployConfig}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <DeployDialog
          isOpen={true}
          deployConfig={mockDeployConfig}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Deploy to GitHub Pages/i)).toBeInTheDocument();
    });

    it('should display deployment configuration details', () => {
      render(
        <DeployDialog
          isOpen={true}
          deployConfig={mockDeployConfig}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('https://github.com/user/repo.git')).toBeInTheDocument();
      expect(screen.getByText('gh-pages')).toBeInTheDocument();
      expect(screen.getByText('/repo/')).toBeInTheDocument();
      expect(screen.getByText('dist')).toBeInTheDocument();
    });

    it('should display custom domain when homepage is configured', () => {
      const configWithHomepage = {
        ...mockDeployConfig,
        homepage: 'https://example.com',
      };

      render(
        <DeployDialog
          isOpen={true}
          deployConfig={configWithHomepage}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('https://example.com')).toBeInTheDocument();
      expect(screen.getByText(/Custom Domain:/i)).toBeInTheDocument();
    });

    it('should not display custom domain section when homepage is null', () => {
      render(
        <DeployDialog
          isOpen={true}
          deployConfig={mockDeployConfig}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText(/Custom Domain:/i)).not.toBeInTheDocument();
    });

    it('should display warning message', () => {
      render(
        <DeployDialog
          isOpen={true}
          deployConfig={mockDeployConfig}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/making it publicly accessible/i)).toBeInTheDocument();
      expect(screen.getByText(/gh-pages/i)).toBeInTheDocument();
    });

    it('should render confirm and cancel buttons', () => {
      render(
        <DeployDialog
          isOpen={true}
          deployConfig={mockDeployConfig}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /Deploy Now/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm when Deploy Now button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <DeployDialog
          isOpen={true}
          deployConfig={mockDeployConfig}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /Deploy Now/i });
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <DeployDialog
          isOpen={true}
          deployConfig={mockDeployConfig}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should call onCancel when clicking overlay background', async () => {
      const user = userEvent.setup();
      render(
        <DeployDialog
          isOpen={true}
          deployConfig={mockDeployConfig}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const overlay = screen.getByRole('dialog').parentElement!;
      await user.click(overlay);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when clicking dialog content', async () => {
      const user = userEvent.setup();
      render(
        <DeployDialog
          isOpen={true}
          deployConfig={mockDeployConfig}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');
      await user.click(dialog);

      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <DeployDialog
          isOpen={true}
          deployConfig={mockDeployConfig}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'deploy-dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'deploy-dialog-description');
    });

    it('should have cancel button focused by default', () => {
      render(
        <DeployDialog
          isOpen={true}
          deployConfig={mockDeployConfig}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      expect(cancelButton).toHaveAttribute('autoFocus');
    });
  });
});
