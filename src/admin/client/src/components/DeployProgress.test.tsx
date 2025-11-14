import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeployProgress } from './DeployProgress';

describe('DeployProgress', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createMockStatus = (overrides = {}) => ({
    step: 'validating' as const,
    message: 'Validating Git setup...',
    progress: 10,
    startTime: Date.now(),
    ...overrides,
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const status = createMockStatus();
      render(
        <DeployProgress
          isOpen={false}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      const status = createMockStatus();
      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display current step message', () => {
      const status = createMockStatus({
        step: 'building',
        message: 'Building your portfolio...',
      });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Building your portfolio...')).toBeInTheDocument();
    });

    it('should display progress bar with correct percentage', () => {
      const status = createMockStatus({ progress: 45 });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '45');
      expect(screen.getByText('45%')).toBeInTheDocument();
    });
  });

  describe('Step Transitions', () => {
    it('should display validating step', () => {
      const status = createMockStatus({ step: 'validating' });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Validating Git setup/i)).toBeInTheDocument();
    });

    it('should display building step', () => {
      const status = createMockStatus({ step: 'building', progress: 50 });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Building site/i)).toBeInTheDocument();
    });

    it('should display deploying step', () => {
      const status = createMockStatus({ step: 'deploying', progress: 80 });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Deploying to GitHub Pages/i)).toBeInTheDocument();
    });

    it('should display complete step', () => {
      const status = createMockStatus({
        step: 'complete',
        progress: 100,
        endTime: Date.now() + 45000,
      });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Deployment complete!/i)).toBeInTheDocument();
    });

    it('should display error step', () => {
      const status = createMockStatus({
        step: 'error',
        message: 'Deployment failed',
        error: {
          message: 'Build validation failed',
        },
      });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Deployment failed/i)).toBeInTheDocument();
    });

    it('should mark completed steps with checkmark', () => {
      const status = createMockStatus({ step: 'deploying', progress: 80 });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      const steps = screen.getAllByText('✓');
      expect(steps.length).toBeGreaterThan(0); // Validating and Building should be complete
    });
  });

  describe('Time Display', () => {
    it('should display elapsed time', async () => {
      const startTime = Date.now();
      const status = createMockStatus({ startTime });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      // Initially shows 0s
      expect(screen.getByText(/0s/i)).toBeInTheDocument();

      // Advance time by 5 seconds
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.getByText(/5s/i)).toBeInTheDocument();
      });
    });

    it('should display minutes and seconds for longer durations', async () => {
      const startTime = Date.now();
      const status = createMockStatus({ startTime });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      // Advance time by 90 seconds
      vi.advanceTimersByTime(90000);

      await waitFor(() => {
        expect(screen.getByText(/1m 30s/i)).toBeInTheDocument();
      });
    });

    it('should display final duration when deployment is complete', () => {
      const startTime = Date.now();
      const endTime = startTime + 45000; // 45 seconds
      const status = createMockStatus({
        step: 'complete',
        startTime,
        endTime,
      });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/45s/i)).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display error message', () => {
      const status = createMockStatus({
        step: 'error',
        error: {
          message: 'Authentication failed',
        },
      });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });

    it('should display solution when provided', () => {
      const status = createMockStatus({
        step: 'error',
        error: {
          message: 'Authentication failed',
          solution: 'Set up SSH keys or use a personal access token',
        },
      });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Set up SSH keys/i)).toBeInTheDocument();
      expect(screen.getByText(/How to fix this:/i)).toBeInTheDocument();
    });

    it('should display error details in expandable section', () => {
      const status = createMockStatus({
        step: 'error',
        error: {
          message: 'Build failed',
          details: 'Error: Invalid project data\n  at build.js:123',
        },
      });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/View technical details/i)).toBeInTheDocument();
      expect(screen.getByText(/Invalid project data/i)).toBeInTheDocument();
    });

    it('should not show progress bar when in error state', () => {
      const status = createMockStatus({
        step: 'error',
        error: {
          message: 'Deployment failed',
        },
      });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('should show close button when deployment is complete', () => {
      const status = createMockStatus({
        step: 'complete',
        progress: 100,
      });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();
    });

    it('should show close button when deployment has error', () => {
      const status = createMockStatus({
        step: 'error',
        error: {
          message: 'Deployment failed',
        },
      });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();
    });

    it('should not show close button during active deployment', () => {
      const status = createMockStatus({ step: 'building' });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByRole('button', { name: /Close/i })).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const status = createMockStatus({
        step: 'complete',
        progress: 100,
      });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /Close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking overlay after completion', async () => {
      const user = userEvent.setup({ delay: null });
      const status = createMockStatus({
        step: 'complete',
        progress: 100,
      });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      const overlay = screen.getByRole('dialog').parentElement!;
      await user.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when clicking overlay during active deployment', async () => {
      const user = userEvent.setup({ delay: null });
      const status = createMockStatus({ step: 'building' });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      const overlay = screen.getByRole('dialog').parentElement!;
      await user.click(overlay);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const status = createMockStatus();

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'deploy-progress-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'deploy-progress-description');
    });

    it('should have progress bar with proper ARIA attributes', () => {
      const status = createMockStatus({ progress: 60 });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', 'Deployment progress: 60%');
    });

    it('should have close button focused when available', () => {
      const status = createMockStatus({
        step: 'complete',
        progress: 100,
      });

      render(
        <DeployProgress
          isOpen={true}
          status={status}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /Close/i });
      expect(closeButton).toHaveAttribute('autoFocus');
    });
  });
});
