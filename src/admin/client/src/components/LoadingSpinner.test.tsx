import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render spinner', () => {
    render(<LoadingSpinner />);

    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('should render with message', () => {
    render(<LoadingSpinner message="Loading projects..." />);

    expect(screen.getByText('Loading projects...')).toBeInTheDocument();
  });

  it('should render without message by default', () => {
    render(<LoadingSpinner />);

    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  it('should apply small size class', () => {
    const { container } = render(<LoadingSpinner size="small" />);

    expect(container.querySelector('.loading-spinner-small')).toBeInTheDocument();
  });

  it('should apply medium size class by default', () => {
    const { container } = render(<LoadingSpinner />);

    expect(container.querySelector('.loading-spinner-medium')).toBeInTheDocument();
  });

  it('should apply large size class', () => {
    const { container } = render(<LoadingSpinner size="large" />);

    expect(container.querySelector('.loading-spinner-large')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });
});
