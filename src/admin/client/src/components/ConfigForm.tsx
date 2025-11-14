import React from 'react';
import type { Config } from '../../../../types';
import './ConfigForm.css';

interface ConfigFormProps {
  config: Config;
  onChange: (config: Partial<Config>) => void;
  errors: Record<string, string>;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({
  config,
  onChange,
  errors,
}) => {
  const handleInputChange = (field: keyof Config, value: any) => {
    onChange({ [field]: value });
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return false;
    
    // Check if it's a relative path
    if (url.startsWith('./') || url.startsWith('../') || url === '.') {
      return true;
    }
    
    // Check if it's an absolute path
    if (url.startsWith('/')) {
      return true;
    }
    
    // Try to parse as URL
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="config-form">
      <div className="form-group">
        <label htmlFor="title">
          Site Title <span className="required">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={config.title || ''}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className={errors.title ? 'error' : ''}
          placeholder="My Projects"
        />
        {errors.title && <span className="error-message">{errors.title}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="description">
          Site Description <span className="required">*</span>
        </label>
        <textarea
          id="description"
          value={config.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className={errors.description ? 'error' : ''}
          placeholder="A showcase of my coding projects"
          rows={3}
        />
        {errors.description && <span className="error-message">{errors.description}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="baseUrl">
          Base URL <span className="required">*</span>
        </label>
        <input
          id="baseUrl"
          type="text"
          value={config.baseUrl || ''}
          onChange={(e) => handleInputChange('baseUrl', e.target.value)}
          onBlur={(e) => {
            const value = e.target.value;
            if (value && !validateUrl(value)) {
              // Could set a local validation error here
            }
          }}
          className={errors.baseUrl ? 'error' : ''}
          placeholder="./ or https://example.com"
        />
        <small className="help-text">
          Use "./" for relative paths or a full URL like "https://example.com"
        </small>
        {errors.baseUrl && <span className="error-message">{errors.baseUrl}</span>}
      </div>

    </div>
  );
};
