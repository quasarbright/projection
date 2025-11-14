import React, { useState, useEffect } from 'react';
import type { Config } from '../../../../types';
import { ConfigForm } from './ConfigForm';
import { AdvancedConfigForm } from './AdvancedConfigForm';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: Config;
  onSave: (config: Config) => Promise<void>;
}

type TabType = 'general' | 'backgrounds' | 'advanced';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [formData, setFormData] = useState<Config>(config);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when config prop changes
  useEffect(() => {
    setFormData(config);
    setIsDirty(false);
    setErrors({});
  }, [config]);

  // Handle form data changes
  const handleChange = (updates: Partial<Config>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    setErrors({});

    try {
      await onSave(formData);
      setIsDirty(false);
      onClose();
    } catch (error: any) {
      // Handle validation errors
      if (error.errors && Array.isArray(error.errors)) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.message) {
            // Extract field name from error message if possible
            const match = err.message.match(/^(\w+)/);
            const field = match ? match[1] : 'general';
            errorMap[field] = err.message;
          }
        });
        setErrors(errorMap);
      } else {
        setErrors({ general: error.message || 'Failed to save configuration' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    setFormData(config);
    setIsDirty(false);
    setErrors({});
    onClose();
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-backdrop" onClick={handleBackdropClick}>
      <div className="settings-modal">
        <div className="settings-modal-header">
          <h2>Settings</h2>
          <button
            className="close-button"
            onClick={handleCancel}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="settings-modal-tabs">
          <button
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`tab-button ${activeTab === 'backgrounds' ? 'active' : ''}`}
            onClick={() => setActiveTab('backgrounds')}
          >
            Dynamic Backgrounds
          </button>
          <button
            className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced
          </button>
        </div>

        <div className="settings-modal-content">
          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}

          {activeTab === 'general' && (
            <div className="tab-content">
              <ConfigForm
                config={formData}
                onChange={handleChange}
                errors={errors}
              />
            </div>
          )}

          {activeTab === 'backgrounds' && (
            <div className="tab-content">
              <p>Dynamic backgrounds management will be implemented in task 16</p>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="tab-content">
              <AdvancedConfigForm
                config={formData}
                onChange={handleChange}
              />
            </div>
          )}
        </div>

        <div className="settings-modal-footer">
          <button
            className="cancel-button"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="save-button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
