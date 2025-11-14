import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export function LoadingSpinner({ size = 'medium', message }: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner loading-spinner-${size}`}>
      <div className="loading-spinner-circle" role="status" aria-label="Loading"></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}
