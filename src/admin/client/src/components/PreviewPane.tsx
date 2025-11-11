import { useEffect, useRef, useState, useCallback } from 'react';
import type { Project } from '../../../../types';
import { generatePreview } from '../services/api';
import { LoadingSpinner } from './LoadingSpinner';
import './PreviewPane.css';

interface PreviewPaneProps {
  project: Partial<Project>;
  debounceMs?: number;
}

export function PreviewPane({ project, debounceMs = 500 }: PreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadPreview = useCallback(async (projectData: Partial<Project>) => {
    // Don't load preview if project doesn't have minimum required fields
    if (!projectData.title && !projectData.description) {
      setIsLoading(false);
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const html = await generatePreview(projectData);
      // Only update if this request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setPreviewHtml(html);
        setError(null);
      }
    } catch (err: any) {
      // Ignore abort errors
      if (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
        return;
      }
      console.error('Failed to generate preview:', err);
      setError(err.message || 'Failed to generate preview');
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set up debounced preview load
    debounceTimerRef.current = setTimeout(() => {
      loadPreview(project);
    }, debounceMs);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [project, debounceMs, loadPreview]);

  useEffect(() => {
    // Update iframe content when previewHtml changes
    if (iframeRef.current && previewHtml) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(previewHtml);
        iframeDoc.close();
      }
    }
  }, [previewHtml]);

  return (
    <div className="preview-pane">
      <div className="preview-header">
        <h3>Preview</h3>
        {isLoading && <span className="preview-status">Loading...</span>}
      </div>

      <div className="preview-content">
        {error ? (
          <div className="preview-error" role="alert">
            <p>Failed to load preview</p>
            <p className="error-message">{error}</p>
          </div>
        ) : !project.title && !project.description ? (
          <div className="preview-placeholder">
            <p>Fill in project details to see a preview</p>
          </div>
        ) : isLoading ? (
          <div className="preview-loading">
            <LoadingSpinner size="medium" message="Generating preview..." />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className="preview-iframe"
            title="Project preview"
            sandbox="allow-same-origin allow-scripts"
            aria-label="Project card preview"
          />
        )}
      </div>
    </div>
  );
}
