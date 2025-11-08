import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PreviewPane } from './PreviewPane';
import * as api from '../services/api';
import type { Project } from '../../../../types';

vi.mock('../services/api');

describe('PreviewPane', () => {
  const mockGeneratePreview = vi.mocked(api.generatePreview);

  const validProject: Partial<Project> = {
    id: 'test-project',
    title: 'Test Project',
    description: 'A test project description',
    creationDate: '2024-01-15',
    tags: ['react', 'typescript'],
    pageLink: 'https://example.com/project',
    featured: false,
  };

  const mockPreviewHtml = `
    <!DOCTYPE html>
    <html>
      <head><title>Preview</title></head>
      <body>
        <div class="project-card">
          <h3>Test Project</h3>
          <p>A test project description</p>
        </div>
      </body>
    </html>
  `;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGeneratePreview.mockResolvedValue(mockPreviewHtml);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render preview pane with header', () => {
      render(<PreviewPane project={validProject} debounceMs={10} />);

      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('should render iframe for preview', async () => {
      render(<PreviewPane project={validProject} debounceMs={10} />);

      await waitFor(() => {
        const iframe = screen.getByTitle('Project preview');
        expect(iframe).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should hide loading state after preview loads', async () => {
      render(<PreviewPane project={validProject} debounceMs={10} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should show placeholder when project has no title or description', () => {
      render(<PreviewPane project={{}} debounceMs={10} />);

      expect(screen.getByText('Fill in project details to see a preview')).toBeInTheDocument();
      expect(screen.queryByTitle('Project preview')).not.toBeInTheDocument();
    });

    it('should not call API when project is empty', async () => {
      render(<PreviewPane project={{}} debounceMs={10} />);

      // Wait a bit to ensure no calls happen
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockGeneratePreview).not.toHaveBeenCalled();
    });
  });

  describe('Preview Loading', () => {
    it('should call generatePreview with project data', async () => {
      render(<PreviewPane project={validProject} debounceMs={10} />);

      await waitFor(() => {
        expect(mockGeneratePreview).toHaveBeenCalledWith(validProject);
      }, { timeout: 1000 });
    });

    it('should load preview when project has only title', async () => {
      const projectWithTitle = { title: 'Test Project' };
      render(<PreviewPane project={projectWithTitle} debounceMs={10} />);

      await waitFor(() => {
        expect(mockGeneratePreview).toHaveBeenCalledWith(projectWithTitle);
      }, { timeout: 1000 });
    });

    it('should load preview when project has only description', async () => {
      const projectWithDescription = { description: 'Test description' };
      render(<PreviewPane project={projectWithDescription} debounceMs={10} />);

      await waitFor(() => {
        expect(mockGeneratePreview).toHaveBeenCalledWith(projectWithDescription);
      }, { timeout: 1000 });
    });

    it('should update preview when project changes', async () => {
      const { rerender } = render(<PreviewPane project={validProject} debounceMs={10} />);

      await waitFor(() => {
        expect(mockGeneratePreview).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });

      const updatedProject = { ...validProject, title: 'Updated Title' };
      rerender(<PreviewPane project={updatedProject} debounceMs={10} />);

      await waitFor(() => {
        expect(mockGeneratePreview).toHaveBeenCalledTimes(2);
        expect(mockGeneratePreview).toHaveBeenCalledWith(updatedProject);
      }, { timeout: 1000 });
    });

    it('should write HTML to iframe document', async () => {
      render(<PreviewPane project={validProject} debounceMs={10} />);

      await waitFor(() => {
        const iframe = screen.getByTitle('Project preview') as HTMLIFrameElement;
        const iframeDoc = iframe.contentDocument;
        expect(iframeDoc?.body.innerHTML).toContain('Test Project');
      }, { timeout: 1000 });
    });
  });

  describe('Debouncing', () => {
    it('should debounce preview updates', async () => {
      const { rerender } = render(<PreviewPane project={validProject} debounceMs={100} />);

      // Change project multiple times quickly
      rerender(<PreviewPane project={{ ...validProject, title: 'Update 1' }} debounceMs={100} />);
      rerender(<PreviewPane project={{ ...validProject, title: 'Update 2' }} debounceMs={100} />);
      rerender(<PreviewPane project={{ ...validProject, title: 'Update 3' }} debounceMs={100} />);

      // Wait for debounce to complete
      await waitFor(() => {
        expect(mockGeneratePreview).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Should have called API only once with the latest data
      expect(mockGeneratePreview).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Update 3' })
      );
    });

    it('should cancel pending preview when project changes', async () => {
      const { rerender } = render(<PreviewPane project={validProject} debounceMs={100} />);

      // Wait a bit but not long enough for debounce
      await new Promise(resolve => setTimeout(resolve, 50));

      // Change project (should cancel previous timer)
      rerender(<PreviewPane project={{ ...validProject, title: 'Updated' }} debounceMs={100} />);

      // Wait for debounce to complete
      await waitFor(() => {
        expect(mockGeneratePreview).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Should have called API only once
      expect(mockGeneratePreview).toHaveBeenCalledTimes(1);
      expect(mockGeneratePreview).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated' })
      );
    });
  });

  describe('Error Handling', () => {
    it('should display error message when preview fails', async () => {
      const errorMessage = 'Failed to generate preview';
      mockGeneratePreview.mockRejectedValue(new Error(errorMessage));

      render(<PreviewPane project={validProject} debounceMs={10} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load preview')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should display generic error when error has no message', async () => {
      mockGeneratePreview.mockRejectedValue({});

      render(<PreviewPane project={validProject} debounceMs={10} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load preview')).toBeInTheDocument();
        expect(screen.getByText('Failed to generate preview')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should hide loading state when error occurs', async () => {
      mockGeneratePreview.mockRejectedValue(new Error('Test error'));

      render(<PreviewPane project={validProject} debounceMs={10} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should clear previous error when new preview loads successfully', async () => {
      mockGeneratePreview.mockRejectedValueOnce(new Error('First error'));

      const { rerender } = render(<PreviewPane project={validProject} debounceMs={10} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load preview')).toBeInTheDocument();
      }, { timeout: 1000 });

      mockGeneratePreview.mockResolvedValue(mockPreviewHtml);
      const updatedProject = { ...validProject, title: 'Updated' };
      rerender(<PreviewPane project={updatedProject} debounceMs={10} />);

      await waitFor(() => {
        expect(screen.queryByText('Failed to load preview')).not.toBeInTheDocument();
        expect(screen.getByTitle('Project preview')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should have error alert role for accessibility', async () => {
      mockGeneratePreview.mockRejectedValue(new Error('Test error'));

      render(<PreviewPane project={validProject} debounceMs={10} />);

      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toHaveClass('preview-error');
      }, { timeout: 1000 });
    });
  });

  describe('Accessibility', () => {
    it('should have proper iframe attributes', async () => {
      render(<PreviewPane project={validProject} debounceMs={10} />);

      await waitFor(() => {
        const iframe = screen.getByTitle('Project preview');
        expect(iframe).toHaveAttribute('aria-label', 'Project card preview');
        expect(iframe).toHaveAttribute('sandbox', 'allow-same-origin');
      }, { timeout: 1000 });
    });

    it('should have descriptive title for iframe', async () => {
      render(<PreviewPane project={validProject} debounceMs={10} />);

      await waitFor(() => {
        expect(screen.getByTitle('Project preview')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });
});
