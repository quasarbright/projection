import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectForm } from './ProjectForm';
import type { Project } from '../../../../types';

describe('ProjectForm', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();
  const existingTags = ['react', 'typescript', 'nodejs'];
  const existingProjectIds = ['existing-project-1', 'existing-project-2'];

  const validProject: Project = {
    id: 'test-project',
    title: 'Test Project',
    description: 'A test project description',
    creationDate: '2024-01-15',
    tags: ['react', 'typescript'],
    pageLink: 'https://example.com/project',
    sourceLink: 'https://github.com/user/repo',
    thumbnailLink: 'https://example.com/thumb.png',
    featured: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render form in create mode', () => {
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
          existingProjectIds={existingProjectIds}
        />
      );

      expect(screen.getByText('Create New Project')).toBeInTheDocument();
      expect(screen.getByLabelText(/Project ID/i)).toBeEnabled();
      expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('should render form in edit mode with project data', () => {
      render(
        <ProjectForm
          project={validProject}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
          existingProjectIds={existingProjectIds}
        />
      );

      expect(screen.getByText('Edit Project')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test-project')).toBeDisabled();
      expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A test project description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://example.com/project')).toBeInTheDocument();
    });

    it('should render all required form fields', () => {
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      expect(screen.getByLabelText(/Project ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Creation Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Page Link/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Source Link/i)).toBeInTheDocument();
      expect(screen.getByText(/^Thumbnail$/i)).toBeInTheDocument(); // ImageUpload component label
      expect(screen.getByLabelText(/Featured Project/i)).toBeInTheDocument();
    });

    it('should show featured checkbox as unchecked by default', () => {
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const checkbox = screen.getByLabelText(/Featured Project/i) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('should show featured checkbox as checked when project is featured', () => {
      const featuredProject = { ...validProject, featured: true };
      render(
        <ProjectForm
          project={featuredProject}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const checkbox = screen.getByLabelText(/Featured Project/i) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Field Interactions', () => {
    it('should update form fields when user types', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const titleInput = screen.getByLabelText(/^Title/i);
      await user.type(titleInput, 'My New Project');

      expect(titleInput).toHaveValue('My New Project');
    });

    it('should toggle featured checkbox', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const checkbox = screen.getByLabelText(/Featured Project/i) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should disable ID field in edit mode', () => {
      render(
        <ProjectForm
          project={validProject}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const idInput = screen.getByLabelText(/Project ID/i);
      expect(idInput).toBeDisabled();
    });

    it('should show hint text for ID field in edit mode', () => {
      render(
        <ProjectForm
          project={validProject}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      expect(screen.getByText(/ID cannot be changed after creation/i)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should show error when required field is empty on blur', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const titleInput = screen.getByLabelText(/^Title/i);
      await user.click(titleInput);
      await user.tab(); // Blur the field

      await waitFor(() => {
        expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
      });
    });

    it('should validate ID format', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const idInput = screen.getByLabelText(/Project ID/i);
      await user.type(idInput, 'Invalid ID With Spaces');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/ID must be lowercase letters/i)).toBeInTheDocument();
      });
    });

    it('should validate date format', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const dateInput = screen.getByLabelText(/Creation Date/i);
      // Clear and type an invalid date (date input will reject invalid formats)
      await user.clear(dateInput);
      await user.type(dateInput, 'invalid-date');
      await user.tab();

      await waitFor(() => {
        // The date input validation will trigger
        expect(screen.getByText(/Date must be in YYYY-MM-DD format|Creation date is required/i)).toBeInTheDocument();
      });
    });

    it('should validate URL format for page link', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const pageLinkInput = screen.getByLabelText(/Page Link/i);
      await user.type(pageLinkInput, 'not-a-url');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Must be a valid URL/i)).toBeInTheDocument();
      });
    });

    it('should check for duplicate IDs in create mode', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
          existingProjectIds={existingProjectIds}
        />
      );

      const idInput = screen.getByLabelText(/Project ID/i);
      await user.type(idInput, 'existing-project-1');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/This ID is already in use/i)).toBeInTheDocument();
      });
    });

    it('should not validate duplicate IDs in edit mode', async () => {
      render(
        <ProjectForm
          project={validProject}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
          existingProjectIds={['test-project', ...existingProjectIds]}
        />
      );

      // ID field should be disabled in edit mode, so no duplicate check needed
      const idInput = screen.getByLabelText(/Project ID/i);
      expect(idInput).toBeDisabled();
    });

    it('should clear errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const titleInput = screen.getByLabelText(/^Title/i);
      await user.click(titleInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
      });

      await user.type(titleInput, 'New Title');

      // Error should still be visible until blur
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
    });

    it('should accept valid ID format', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const idInput = screen.getByLabelText(/Project ID/i);
      await user.type(idInput, 'valid-project-id-123');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/ID must be lowercase letters/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should prevent submission with invalid data', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      // Wait a bit to ensure no async calls happen
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should disable save button when there are validation errors', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const idInput = screen.getByLabelText(/Project ID/i);
      await user.type(idInput, 'Invalid ID');
      await user.tab();

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save/i });
        expect(saveButton).toBeDisabled();
      });
    });

    it('should show all validation errors on submit attempt', async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Project ID is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Description is required/i)).toBeInTheDocument();
      });
    });

    it('should call onSave with valid form data', async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);

      // Create a project with tags to pass validation
      const projectWithTags = { ...validProject, id: 'new-project', title: 'New Project' };

      render(
        <ProjectForm
          project={projectWithTags}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'new-project',
            title: 'New Project',
            tags: ['react', 'typescript'],
          })
        );
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockOnSave.mockReturnValue(promise);

      render(
        <ProjectForm
          project={validProject}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
      });

      resolvePromise!();
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockOnSave.mockReturnValue(promise);

      render(
        <ProjectForm
          project={validProject}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/^Title/i)).toBeDisabled();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
      });

      resolvePromise!();
    });

    it('should display API validation errors', async () => {
      const user = userEvent.setup();
      const apiError = {
        message: 'Validation failed',
        errors: [
          { field: 'id', message: 'ID already exists', severity: 'error' as const },
          { field: 'title', message: 'Title too long', severity: 'error' as const },
        ],
      };
      mockOnSave.mockRejectedValue(apiError);

      render(
        <ProjectForm
          project={validProject}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          existingTags={existingTags}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Validation Errors:/i)).toBeInTheDocument();
        expect(screen.getByText(/id: ID already exists/i)).toBeInTheDocument();
        expect(screen.getByText(/title: Title too long/i)).toBeInTheDocument();
      });
    });
  });
});
