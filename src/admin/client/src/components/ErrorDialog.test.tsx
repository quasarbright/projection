import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDialog, getErrorInfo } from './ErrorDialog';

describe('ErrorDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Test Error',
    message: 'This is a test error message',
    onClose: vi.fn(),
  };

  it('should not render when isOpen is false', () => {
    const { container } = render(<ErrorDialog {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render error dialog with title and message', () => {
    render(<ErrorDialog {...defaultProps} />);
    
    expect(screen.getByText('Test Error')).toBeInTheDocument();
    expect(screen.getByText('This is a test error message')).toBeInTheDocument();
  });

  it('should display error code when provided', () => {
    render(<ErrorDialog {...defaultProps} errorCode="AUTH_ERROR" />);
    
    expect(screen.getByText('Error Code:')).toBeInTheDocument();
    expect(screen.getByText('AUTH_ERROR')).toBeInTheDocument();
  });

  it('should display solution when provided', () => {
    render(<ErrorDialog {...defaultProps} solution="Try this fix" />);
    
    expect(screen.getByText('How to fix this:')).toBeInTheDocument();
    expect(screen.getByText('Try this fix')).toBeInTheDocument();
  });

  it('should toggle details visibility when clicking View Details', () => {
    render(<ErrorDialog {...defaultProps} details="Detailed error information" />);
    
    const toggleButton = screen.getByText('View Details');
    expect(screen.queryByText('Detailed error information')).not.toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    expect(screen.getByText('Detailed error information')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Hide Details'));
    expect(screen.queryByText('Detailed error information')).not.toBeInTheDocument();
  });

  it('should call onClose when Close button is clicked', () => {
    const onClose = vi.fn();
    render(<ErrorDialog {...defaultProps} onClose={onClose} />);
    
    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onRetry when Try Again button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorDialog {...defaultProps} onRetry={onRetry} />);
    
    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not render Try Again button when onRetry is not provided', () => {
    render(<ErrorDialog {...defaultProps} />);
    
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('should call onClose when clicking overlay', () => {
    const onClose = vi.fn();
    const { container } = render(<ErrorDialog {...defaultProps} onClose={onClose} />);
    
    const overlay = container.querySelector('.error-dialog-overlay');
    fireEvent.click(overlay!);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when clicking dialog content', () => {
    const onClose = vi.fn();
    const { container } = render(<ErrorDialog {...defaultProps} onClose={onClose} />);
    
    const dialog = container.querySelector('.error-dialog');
    fireEvent.click(dialog!);
    
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('getErrorInfo', () => {
  it('should return correct info for AUTH_ERROR', () => {
    const info = getErrorInfo('AUTH_ERROR', 'Auth failed');
    
    expect(info.title).toBe('Authentication Failed');
    expect(info.message).toContain('authenticate with GitHub');
    expect(info.solution).toContain('SSH keys');
  });

  it('should return correct info for PUSH_REJECTED', () => {
    const info = getErrorInfo('PUSH_REJECTED', 'Push rejected');
    
    expect(info.title).toBe('Push Rejected');
    expect(info.message).toContain('conflicts');
    expect(info.solution).toContain('force push');
  });

  it('should return correct info for BUILD_ERROR', () => {
    const info = getErrorInfo('BUILD_ERROR', 'Build failed');
    
    expect(info.title).toBe('Build Failed');
    expect(info.message).toContain('validation errors');
    expect(info.solution).toContain('project data');
  });

  it('should return correct info for GIT_ERROR', () => {
    const info = getErrorInfo('GIT_ERROR', 'Git error');
    
    expect(info.title).toBe('Git Error');
    expect(info.message).toContain('Git operation failed');
    expect(info.solution).toContain('repository URL');
  });

  it('should return correct info for NETWORK_ERROR', () => {
    const info = getErrorInfo('NETWORK_ERROR', 'Network error');
    
    expect(info.title).toBe('Network Error');
    expect(info.message).toContain('internet connection');
    expect(info.solution).toContain('connectivity');
  });

  it('should return default info for unknown error code', () => {
    const info = getErrorInfo('UNKNOWN_ERROR', 'Something went wrong');
    
    expect(info.title).toBe('Deployment Failed');
    expect(info.message).toBe('Something went wrong');
    expect(info.solution).toContain('command line');
  });

  it('should use provided error message for DEPLOYMENT_ERROR', () => {
    const customMessage = 'Custom error message';
    const info = getErrorInfo('DEPLOYMENT_ERROR', customMessage);
    
    expect(info.message).toBe(customMessage);
  });
});
