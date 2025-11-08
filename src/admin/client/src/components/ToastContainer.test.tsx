import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContainer';

function TestComponent() {
  const { showSuccess, showError, showInfo } = useToast();

  return (
    <div>
      <button onClick={() => showSuccess('Success message')}>Show Success</button>
      <button onClick={() => showError('Error message')}>Show Error</button>
      <button onClick={() => showInfo('Info message')}>Show Info</button>
    </div>
  );
}

describe('ToastContainer', () => {
  it('should throw error when useToast is used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within ToastProvider');

    consoleError.mockRestore();
  });

  it('should render children', () => {
    render(
      <ToastProvider>
        <div>Test content</div>
      </ToastProvider>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should provide toast context methods', () => {
    let contextValue: any;
    
    function TestConsumer() {
      contextValue = useToast();
      return <div>Test</div>;
    }

    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    expect(contextValue).toBeDefined();
    expect(typeof contextValue.showSuccess).toBe('function');
    expect(typeof contextValue.showError).toBe('function');
    expect(typeof contextValue.showInfo).toBe('function');
    expect(typeof contextValue.showToast).toBe('function');
  });
});
