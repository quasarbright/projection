import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render success toast with message', () => {
    const onClose = vi.fn();
    render(<Toast message="Success message" type="success" onClose={onClose} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-success');
  });

  it('should render error toast with message', () => {
    const onClose = vi.fn();
    render(<Toast message="Error message" type="error" onClose={onClose} />);

    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-error');
  });

  it('should render info toast with message', () => {
    const onClose = vi.fn();
    render(<Toast message="Info message" type="info" onClose={onClose} />);

    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('toast-info');
  });

  it('should display success icon', () => {
    const onClose = vi.fn();
    render(<Toast message="Success" type="success" onClose={onClose} />);

    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('should display error icon', () => {
    const onClose = vi.fn();
    render(<Toast message="Error" type="error" onClose={onClose} />);

    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('should display info icon', () => {
    const onClose = vi.fn();
    render(<Toast message="Info" type="info" onClose={onClose} />);

    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const onClose = vi.fn();
    render(<Toast message="Test" type="success" onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close notification/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should auto-dismiss after default duration', () => {
    const onClose = vi.fn();
    render(<Toast message="Test" type="success" onClose={onClose} />);

    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(4000);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should auto-dismiss after custom duration', () => {
    const onClose = vi.fn();
    render(<Toast message="Test" type="success" onClose={onClose} duration={2000} />);

    vi.advanceTimersByTime(2000);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not auto-dismiss before duration expires', () => {
    const onClose = vi.fn();
    render(<Toast message="Test" type="success" onClose={onClose} duration={5000} />);

    vi.advanceTimersByTime(3000);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should have proper accessibility attributes', () => {
    const onClose = vi.fn();
    render(<Toast message="Test" type="success" onClose={onClose} />);

    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });
});
