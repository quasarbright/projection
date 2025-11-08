import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export function LoadingSpinner({ size = 'medium', message }: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner loading-spinner-${size}`}>
      <div className="spinner" role="status" aria-label="Loading">
        <div className="spinner-circle"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}
