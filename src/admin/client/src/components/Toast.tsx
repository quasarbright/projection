import { useEffect, useState } from 'react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isExiting) return;

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration);

    return () => {
      clearTimeout(exitTimer);
    };
  }, [duration, isExiting]);

  useEffect(() => {
    if (!isExiting) return;

    const removeTimer = setTimeout(() => {
      onClose();
    }, 300); // Match the fadeOut animation duration

    return () => {
      clearTimeout(removeTimer);
    };
  }, [isExiting, onClose]);

  const handleClose = () => {
    setIsExiting(true);
  };

  return (
    <div 
      className={`toast toast-${type} ${isExiting ? 'toast-exiting' : ''}`} 
      role="alert" 
      aria-live="polite"
    >
      <div className="toast-content">
        <span className="toast-icon">{getIcon(type)}</span>
        <span className="toast-message">{message}</span>
        <button
          className="toast-close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function getIcon(type: ToastType): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'info':
      return 'ℹ';
    default:
      return '';
  }
}
