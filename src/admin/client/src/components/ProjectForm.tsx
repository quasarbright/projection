import React, { useState } from 'react';
import type { Project } from '../../../../types';
import { PROJECT_ID_PATTERN } from '../../../../types/project';
import type { ValidationError } from '../types/api';
import { TagManager } from './TagManager';
import { ImageUpload } from './ImageUpload';
import { commitThumbnail, cancelThumbnail } from '../services/api';
import './ProjectForm.css';

interface ProjectFormProps {
  project?: Project;
  onSave: (project: Project) => Promise<void>;
  onCancel: () => void;
  existingTags: string[];
  existingProjectIds?: string[];
}

interface FormErrors {
  id?: string;
  title?: string;
  description?: string;
  creationDate?: string;
  tags?: string;
  pageLink?: string;
  sourceLink?: string;
  thumbnailLink?: string;
}

export function ProjectForm({
  project,
  onSave,
  onCancel,
  existingTags,
  existingProjectIds = [],
}: ProjectFormProps) {
  const isEditMode = !!project;

  // Form state
  const [formData, setFormData] = useState<Project>({
    id: project?.id || '',
    title: project?.title || '',
    description: project?.description || '',
    creationDate: project?.creationDate || '',
    tags: project?.tags || [],
    pageLink: project?.pageLink || '',
    sourceLink: project?.sourceLink || '',
    thumbnailLink: project?.thumbnailLink || '',
    featured: project?.featured || false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<ValidationError[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Validate individual field
  const validateField = (name: keyof Project, value: any): string | undefined => {
    switch (name) {
      case 'id':
        if (!value || value.trim() === '') {
          return 'Project ID is required';
        }
        if (!PROJECT_ID_PATTERN.test(value)) {
          return 'ID must be lowercase letters, numbers, and hyphens only (e.g., my-project-123)';
        }
        if (!isEditMode && existingProjectIds.includes(value)) {
          return 'This ID is already in use';
        }
        break;

      case 'title':
        if (!value || value.trim() === '') {
          return 'Title is required';
        }
        if (value.length > 100) {
          return 'Title must be 100 characters or less';
        }
        break;

      case 'description':
        if (!value || value.trim() === '') {
          return 'Description is required';
        }
        break;

      case 'creationDate':
        if (!value || value.trim() === '') {
          return 'Creation date is required';
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return 'Date must be in YYYY-MM-DD format';
        }
        // Validate it's a real date
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Invalid date';
        }
        break;

      case 'tags':
        if (!Array.isArray(value) || value.length === 0) {
          return 'At least one tag is required';
        }
        break;

      case 'pageLink':
        if (!value || value.trim() === '') {
          return 'Page link is required';
        }
        try {
          new URL(value);
        } catch {
          return 'Must be a valid URL (e.g., https://example.com)';
        }
        break;

      case 'sourceLink':
        if (value && value.trim() !== '') {
          try {
            new URL(value);
          } catch {
            return 'Must be a valid URL';
          }
        }
        break;

      case 'thumbnailLink':
        if (value && value.trim() !== '') {
          // Can be URL or relative path
          if (value.startsWith('http')) {
            try {
              new URL(value);
            } catch {
              return 'Must be a valid URL';
            }
          }
        }
        break;
    }
    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof Project>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle field change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear API errors when user starts typing
    if (apiErrors.length > 0) {
      setApiErrors([]);
    }
  };

  // Handle tags change
  const handleTagsChange = (tags: string[]) => {
    setFormData((prev) => ({
      ...prev,
      tags,
    }));

    // Mark tags as touched
    setTouched((prev) => ({ ...prev, tags: true }));

    // Validate tags
    const error = validateField('tags', tags);
    setErrors((prev) => ({
      ...prev,
      tags: error,
    }));

    // Clear API errors
    if (apiErrors.length > 0) {
      setApiErrors([]);
    }
  };

  // Handle thumbnail change
  const handleThumbnailChange = (thumbnailLink: string | null) => {
    setFormData((prev) => ({
      ...prev,
      thumbnailLink: thumbnailLink || '',
    }));

    // Show success feedback
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);

    // Clear API errors
    if (apiErrors.length > 0) {
      setApiErrors([]);
    }
  };

  // Handle field blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate field on blur
    const error = validateField(name as keyof Project, formData[name as keyof Project]);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setApiErrors([]);

    try {
      // If editing and thumbnail was uploaded as temp, commit it
      if (isEditMode && formData.thumbnailLink && formData.thumbnailLink.includes('.temp')) {
        try {
          const result = await commitThumbnail(formData.id);
          formData.thumbnailLink = result.thumbnailLink;
        } catch (err) {
          console.error('Failed to commit thumbnail:', err);
          // Continue with save anyway
        }
      }

      await onSave(formData);
      // Success - parent component will handle navigation
    } catch (error: any) {
      // Handle API validation errors
      if (error.errors && Array.isArray(error.errors)) {
        setApiErrors(error.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    // If editing and thumbnail was uploaded as temp, cancel it
    if (isEditMode && formData.thumbnailLink && formData.thumbnailLink.includes('.temp')) {
      try {
        await cancelThumbnail(formData.id);
      } catch (err) {
        console.error('Failed to cancel thumbnail:', err);
        // Continue with cancel anyway
      }
    }
    onCancel();
  };

  // Show error for a field
  const showError = (field: keyof FormErrors): boolean => {
    return touched[field] && !!errors[field];
  };

  return (
    <div className="project-form-container">
      <div className="project-form-header">
        <h2>{isEditMode ? 'Edit Project' : 'Create New Project'}</h2>
        <div className="project-form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="project-form"
            className="btn-primary"
            disabled={isSubmitting || Object.keys(errors).some((key) => errors[key as keyof FormErrors])}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {apiErrors.length > 0 && (
        <div className="api-errors">
          <h3>Validation Errors:</h3>
          <ul>
            {apiErrors.map((error, index) => (
              <li key={index}>
                {error.field ? `${error.field}: ` : ''}{error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form id="project-form" onSubmit={handleSubmit} className="project-form">
        <div className="form-group">
          <label htmlFor="id" className="form-label required">
            Project ID
          </label>
          <input
            type="text"
            id="id"
            name="id"
            value={formData.id}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isEditMode || isSubmitting}
            className={`form-input ${showError('id') ? 'error' : ''}`}
            placeholder="my-awesome-project"
            aria-describedby={showError('id') ? 'id-error' : undefined}
            aria-invalid={showError('id')}
          />
          {showError('id') && (
            <span id="id-error" className="error-message" role="alert">
              {errors.id}
            </span>
          )}
          {isEditMode && (
            <span className="field-hint">ID cannot be changed after creation</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="title" className="form-label required">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            className={`form-input ${showError('title') ? 'error' : ''}`}
            placeholder="My Awesome Project"
            aria-describedby={showError('title') ? 'title-error' : undefined}
            aria-invalid={showError('title')}
          />
          {showError('title') && (
            <span id="title-error" className="error-message" role="alert">
              {errors.title}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label required">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            className={`form-textarea ${showError('description') ? 'error' : ''}`}
            placeholder="A brief description of your project..."
            rows={4}
            aria-describedby={showError('description') ? 'description-error' : undefined}
            aria-invalid={showError('description')}
          />
          {showError('description') && (
            <span id="description-error" className="error-message" role="alert">
              {errors.description}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="creationDate" className="form-label required">
            Creation Date
          </label>
          <input
            type="date"
            id="creationDate"
            name="creationDate"
            value={formData.creationDate}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            className={`form-input ${showError('creationDate') ? 'error' : ''}`}
            aria-describedby={showError('creationDate') ? 'creationDate-error' : undefined}
            aria-invalid={showError('creationDate')}
          />
          {showError('creationDate') && (
            <span id="creationDate-error" className="error-message" role="alert">
              {errors.creationDate}
            </span>
          )}
          <span className="field-hint">Format: YYYY-MM-DD</span>
        </div>

        <div className="form-group">
          <label htmlFor="pageLink" className="form-label required">
            Page Link
          </label>
          <input
            type="url"
            id="pageLink"
            name="pageLink"
            value={formData.pageLink}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            className={`form-input ${showError('pageLink') ? 'error' : ''}`}
            placeholder="https://example.com/project"
            aria-describedby={showError('pageLink') ? 'pageLink-error' : undefined}
            aria-invalid={showError('pageLink')}
          />
          {showError('pageLink') && (
            <span id="pageLink-error" className="error-message" role="alert">
              {errors.pageLink}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="sourceLink" className="form-label">
            Source Link (Optional)
          </label>
          <input
            type="url"
            id="sourceLink"
            name="sourceLink"
            value={formData.sourceLink}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            className={`form-input ${showError('sourceLink') ? 'error' : ''}`}
            placeholder="https://github.com/username/repo"
            aria-describedby={showError('sourceLink') ? 'sourceLink-error' : undefined}
            aria-invalid={showError('sourceLink')}
          />
          {showError('sourceLink') && (
            <span id="sourceLink-error" className="error-message" role="alert">
              {errors.sourceLink}
            </span>
          )}
        </div>

        <div className="form-group">
          <ImageUpload
            projectId={formData.id}
            currentThumbnail={formData.thumbnailLink}
            onChange={handleThumbnailChange}
            isEditMode={isEditMode}
          />
          {uploadSuccess && (
            <div className="upload-success">
              ✓ Thumbnail updated successfully
            </div>
          )}
          {!formData.id && (
            <div className="field-hint">
              Image will be saved with the project ID you enter above (or a generated ID if empty)
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
              disabled={isSubmitting}
              className="form-checkbox"
            />
            <span className="checkbox-label">Featured Project</span>
          </label>
          <span className="field-hint">Featured projects are highlighted on the portfolio</span>
        </div>

        <div className="form-group">
          <label className="form-label required">Tags</label>
          <TagManager
            selectedTags={formData.tags}
            availableTags={existingTags}
            onChange={handleTagsChange}
            disabled={isSubmitting}
          />
          {showError('tags') && (
            <span className="error-message" role="alert">
              {errors.tags}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
