import React from 'react';
import type { Config } from '../../../../types';
import './AdvancedConfigForm.css';

interface AdvancedConfigFormProps {
  config: Config;
  onChange: (config: Partial<Config>) => void;
}

export const AdvancedConfigForm: React.FC<AdvancedConfigFormProps> = ({
  config,
  onChange,
}) => {
  const handleInputChange = (field: keyof Config, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <div className="advanced-config-form">
      <div className="form-group">
        <label htmlFor="customStyles">
          Custom Styles Path
        </label>
        <input
          id="customStyles"
          type="text"
          value={config.customStyles || ''}
          onChange={(e) => handleInputChange('customStyles', e.target.value || undefined)}
          placeholder="path/to/custom-styles"
        />
        <small className="help-text">
          Path to a directory containing custom CSS files
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="customScripts">
          Custom Scripts Path
        </label>
        <input
          id="customScripts"
          type="text"
          value={config.customScripts || ''}
          onChange={(e) => handleInputChange('customScripts', e.target.value || undefined)}
          placeholder="path/to/custom-scripts"
        />
        <small className="help-text">
          Path to a directory containing custom JavaScript files
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="output">
          Output Directory
        </label>
        <input
          id="output"
          type="text"
          value={config.output || ''}
          onChange={(e) => handleInputChange('output', e.target.value || undefined)}
          placeholder="dist"
        />
        <small className="help-text">
          Directory where the generated site will be saved (default: dist)
        </small>
      </div>

      <div className="info-box">
        <strong>Note:</strong> These settings are for advanced users. Changes to these paths
        may require adjusting your project structure or build process.
      </div>
    </div>
  );
};
