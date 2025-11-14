import React, { useEffect } from 'react';
import './BackgroundPreviewModal.css';

interface BackgroundPreviewModalProps {
  url: string | null;
  onClose: () => void;
}

export const BackgroundPreviewModal: React.FC<BackgroundPreviewModalProps> = ({
  url,
  onClose,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (url) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [url, onClose]);

  // Don't render if no URL
  if (!url) return null;

  // Append ?background=true to URL
  const previewUrl = url.includes('?')
    ? `${url}&background=true`
    : `${url}?background=true`;

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="background-preview-modal-backdrop" onClick={handleBackdropClick}>
      <div className="background-preview-modal">
        <div className="modal-header">
          <h3>Background Preview</h3>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close preview"
          >
            ×
          </button>
        </div>

        <div className="modal-url">
          <strong>URL:</strong>{' '}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="url-link"
          >
            {url}
          </a>
        </div>

        <div className="modal-preview">
          <iframe
            src={previewUrl}
            sandbox="allow-scripts allow-same-origin"
            title={`Large preview: ${url}`}
            className="preview-iframe-large"
          />
        </div>

        <div className="modal-footer">
          <button className="close-button-footer" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
