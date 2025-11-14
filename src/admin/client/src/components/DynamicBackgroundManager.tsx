import React, { useState } from 'react';
import { BackgroundPreviewCard } from './BackgroundPreviewCard';
import { BackgroundPreviewModal } from './BackgroundPreviewModal';
import './DynamicBackgroundManager.css';

interface DynamicBackgroundManagerProps {
  backgrounds: string[];
  onChange: (backgrounds: string[]) => void;
}

export const DynamicBackgroundManager: React.FC<DynamicBackgroundManagerProps> = ({
  backgrounds,
  onChange,
}) => {
  const [newBackgroundUrl, setNewBackgroundUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null);

  // Validate URL format
  const validateUrl = (url: string): { valid: boolean; error?: string } => {
    // Check if empty
    if (!url.trim()) {
      return { valid: false, error: 'URL cannot be empty' };
    }

    // Check if valid URL format
    try {
      new URL(url);
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }

    // Check if already exists
    if (backgrounds.includes(url)) {
      return { valid: false, error: 'This background already exists' };
    }

    return { valid: true };
  };

  // Handle adding a new background
  const handleAddBackground = () => {
    const validation = validateUrl(newBackgroundUrl);
    
    if (!validation.valid) {
      setUrlError(validation.error || 'Invalid URL');
      return;
    }

    onChange([...backgrounds, newBackgroundUrl]);
    setNewBackgroundUrl('');
    setUrlError('');
  };

  // Handle removing a background
  const handleRemoveBackground = (index: number) => {
    const newBackgrounds = backgrounds.filter((_, i) => i !== index);
    onChange(newBackgrounds);
  };

  // Handle expanding preview
  const handleExpandPreview = (url: string) => {
    setExpandedPreview(url);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewBackgroundUrl(e.target.value);
    if (urlError) {
      setUrlError('');
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddBackground();
    }
  };

  return (
    <div className="dynamic-background-manager">
      <div className="description-section">
        <p className="description-text">
          Dynamic backgrounds are web pages (like p5.js sketches, animations, or visualizations) 
          that will be displayed as the background of your portfolio site. Each time a visitor loads your 
          portfolio, one background will be randomly selected from your list. These background pages should be
          full screen. <a href="https://quasarbright.github.io/p5js/honeycomb-mst/" target="_blank">Example</a>
        </p>
      </div>

      <div className="add-background-section">
        <label htmlFor="background-url-input">Add Background URL:</label>
        <div className="add-background-controls">
          <input
            id="background-url-input"
            type="text"
            value={newBackgroundUrl}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="https://example.com/background"
            className={urlError ? 'error' : ''}
          />
          <button
            onClick={handleAddBackground}
            className="add-button"
            disabled={!newBackgroundUrl.trim()}
          >
            Add
          </button>
        </div>
        {urlError && <div className="error-message">{urlError}</div>}
      </div>

      <div className="backgrounds-list-section">
        <h3>Current Backgrounds ({backgrounds.length}):</h3>
        {backgrounds.length === 0 ? (
          <p className="empty-message">
            No backgrounds added yet. Add a URL above to get started.
          </p>
        ) : (
          <div className="background-grid">
            {backgrounds.map((url, index) => (
              <BackgroundPreviewCard
                key={`${url}-${index}`}
                url={url}
                onDelete={() => handleRemoveBackground(index)}
                onExpand={() => handleExpandPreview(url)}
                isPaused={expandedPreview !== null}
              />
            ))}
          </div>
        )}
      </div>

      <BackgroundPreviewModal
        url={expandedPreview}
        onClose={() => setExpandedPreview(null)}
      />
    </div>
  );
};
