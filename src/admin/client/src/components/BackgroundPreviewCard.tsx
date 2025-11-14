import React, { useState, useRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import './BackgroundPreviewCard.css';

interface BackgroundPreviewCardProps {
  url: string;
  onDelete: () => void;
  onExpand: () => void;
  isPaused?: boolean;
}

type LoadState = 'loading' | 'loaded' | 'error';

export const BackgroundPreviewCard: React.FC<BackgroundPreviewCardProps> = ({
  url,
  onDelete,
  onExpand,
  isPaused = false,
}) => {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Append ?background=true to URL
  const previewUrl = url.includes('?')
    ? `${url}&background=true`
    : `${url}?background=true`;
  
  // When paused, use empty src to unload iframe
  const iframeSrc = isPaused ? '' : previewUrl;

  // Truncate URL for display
  const truncateUrl = (url: string, maxLength: number = 40): string => {
    if (url.length <= maxLength) return url;
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname + urlObj.search;
      
      if (domain.length + path.length <= maxLength) {
        return domain + path;
      }
      
      const availableLength = maxLength - domain.length - 3;
      return domain + '...' + path.slice(-availableLength);
    } catch {
      return url.slice(0, maxLength - 3) + '...';
    }
  };

  // Handle iframe load
  const handleLoad = () => {
    setLoadState('loaded');
  };

  // Handle iframe error
  const handleError = () => {
    setLoadState('error');
  };

  return (
    <div className="background-preview-card">
      <div className="preview-container">
        {isPaused ? (
          <div className="paused-overlay">
            <span className="paused-icon">⏸</span>
            <span className="paused-text">Paused</span>
          </div>
        ) : (
          <>
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              onLoad={handleLoad}
              onError={handleError}
              sandbox="allow-scripts allow-same-origin"
              title={`Background preview: ${url}`}
              className={`preview-iframe ${loadState}`}
            />
            {loadState === 'loading' && (
              <div className="loading-overlay">
                <LoadingSpinner />
              </div>
            )}
            {loadState === 'error' && (
              <div className="error-overlay">
                <span className="error-icon">⚠️</span>
                <span className="error-text">Failed to load</span>
              </div>
            )}
          </>
        )}
      </
div>

      <div className="card-info">
        <div className="status-indicator">
          {loadState === 'loaded' && (
            <span className="status-icon success" title="Loaded successfully">
              ✓
            </span>
          )}
          {loadState === 'error' && (
            <span className="status-icon error" title="Failed to load">
              ⚠️
            </span>
          )}
          {loadState === 'loading' && (
            <span className="status-icon loading" title="Loading...">
              ⋯
            </span>
          )}
        </div>
        <div className="url-display" title={url}>
          {truncateUrl(url)}
        </div>
      </div>

      <div className="card-actions">
        <button
          className="action-button expand-button"
          onClick={onExpand}
          title="Expand preview"
          aria-label="Expand preview"
        >
          🔍
        </button>
        <button
          className="action-button delete-button"
          onClick={onDelete}
          title="Delete background"
          aria-label="Delete background"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};
