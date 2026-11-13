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

export function frozenFrameUrl(url: string): string {
  try {
    const u = new URL(url);
    const query = new URLSearchParams(u.search);
    query.set('background', 'true');
    return `/api/background-frame/${encodeURIComponent(u.origin + u.pathname)}?${query.toString()}`;
  } catch {
    return url;
  }
}

// The end of the path, which tells backgrounds on the same site apart: "p5js/boids"
function shortPath(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return parts.slice(-2).join('/') || new URL(url).hostname;
  } catch {
    return url;
  }
}

export const BackgroundPreviewCard: React.FC<BackgroundPreviewCardProps> = ({
  url,
  onDelete,
  onExpand,
  isPaused = false,
}) => {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [pageTitle, setPageTitle] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // The admin server serves the page from this origin and freezes it after 60 frames, so a grid
  // of backgrounds shows still frames instead of all running at once. The page's own query
  // string rides along, plus background=true.
  const previewUrl = frozenFrameUrl(url);

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
    try {
      setPageTitle(iframeRef.current?.contentDocument?.title?.trim() || '');
    } catch {
      setPageTitle('');
    }
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
          {loadState === 'loaded' ? (
            <>
              <span className="page-title">{pageTitle || shortPath(url)}</span>
              <span className="page-url">{pageTitle ? shortPath(url) : new URL(url).hostname}</span>
            </>
          ) : truncateUrl(url)}
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
