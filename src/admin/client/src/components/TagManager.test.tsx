import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagManager } from './TagManager';

describe('TagManager', () => {
  const mockOnChange = vi.fn();
  const availableTags = ['react', 'typescript', 'nodejs', 'javascript', 'python', 'rust'];
  const selectedTags = ['react', 'typescript'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render tag input field', () => {
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText(/Add tags/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Type to add tags/i)).toBeInTheDocument();
    });

    it('should render selected tags as chips', () => {
      render(
        <TagManager
          selectedTags={selectedTags}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('typescript')).toBeInTheDocument();
    });

    it('should render remove buttons for each tag', () => {
      render(
        <TagManager
          selectedTags={selectedTags}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText(/Remove react tag/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Remove typescript tag/i)).toBeInTheDocument();
    });

    it('should render helper text', () => {
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/Press Enter to add a tag/i)).toBeInTheDocument();
    });

    it('should not show placeholder when tags are selected', () => {
      render(
        <TagManager
          selectedTags={selectedTags}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByPlaceholderText(/Type to add tags/i)).not.toBeInTheDocument();
    });
  });

  describe('Tag Operations', () => {
    it('should add a new tag when Enter is pressed', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, 'newtag{Enter}');

      expect(mockOnChange).toHaveBeenCalledWith(['newtag']);
    });

    it('should trim and lowercase tags before adding', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, '  NewTag  {Enter}');

      expect(mockOnChange).toHaveBeenCalledWith(['newtag']);
    });

    it('should not add empty tags', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, '   {Enter}');

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should not add duplicate tags', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={selectedTags}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, 'react{Enter}');

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should remove tag when remove button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={selectedTags}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const removeButton = screen.getByLabelText(/Remove react tag/i);
      await user.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith(['typescript']);
    });

    it('should remove last tag when backspace is pressed on empty input', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={selectedTags}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.click(input);
      await user.keyboard('{Backspace}');

      expect(mockOnChange).toHaveBeenCalledWith(['react']);
    });

    it('should clear input after adding a tag', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i) as HTMLInputElement;
      await user.type(input, 'newtag{Enter}');

      expect(input.value).toBe('');
    });
  });

  describe('Autocomplete', () => {
    it('should show suggestions when typing', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, 'java');

      await waitFor(() => {
        expect(screen.getByText('javascript')).toBeInTheDocument();
      });
    });

    it('should filter suggestions based on input', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, 'type');

      await waitFor(() => {
        expect(screen.getByText('typescript')).toBeInTheDocument();
        expect(screen.queryByText('javascript')).not.toBeInTheDocument();
      });
    });

    it('should not show already selected tags in suggestions', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={selectedTags}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, 'react');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('should prioritize tags that start with input', async () => {
      const user = userEvent.setup();
      const tags = ['javascript', 'java', 'typescript'];
      render(
        <TagManager
          selectedTags={[]}
          availableTags={tags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, 'java');

      await waitFor(() => {
        const suggestions = screen.getAllByRole('option');
        expect(suggestions[0]).toHaveTextContent('java');
        expect(suggestions[1]).toHaveTextContent('javascript');
      });
    });

    it('should add tag from suggestions when clicked', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, 'node');

      await waitFor(() => {
        expect(screen.getByText('nodejs')).toBeInTheDocument();
      });

      await user.click(screen.getByText('nodejs'));

      expect(mockOnChange).toHaveBeenCalledWith(['nodejs']);
    });

    it('should navigate suggestions with arrow keys', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, 'script');

      await waitFor(() => {
        expect(screen.getByText('javascript')).toBeInTheDocument();
        expect(screen.getByText('typescript')).toBeInTheDocument();
      });

      // Arrow down to highlight first suggestion
      await user.keyboard('{ArrowDown}');
      
      await waitFor(() => {
        const suggestions = screen.getAllByRole('option');
        expect(suggestions[0]).toHaveClass('highlighted');
      });

      // Arrow down to highlight second suggestion
      await user.keyboard('{ArrowDown}');
      
      await waitFor(() => {
        const suggestions = screen.getAllByRole('option');
        expect(suggestions[1]).toHaveClass('highlighted');
      });

      // Arrow up to go back to first
      await user.keyboard('{ArrowUp}');
      
      await waitFor(() => {
        const suggestions = screen.getAllByRole('option');
        expect(suggestions[0]).toHaveClass('highlighted');
      });
    });

    it('should select highlighted suggestion with Enter', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, 'node');

      await waitFor(() => {
        expect(screen.getByText('nodejs')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(mockOnChange).toHaveBeenCalledWith(['nodejs']);
    });

    it('should close suggestions with Escape key', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, 'node');

      await waitFor(() => {
        expect(screen.getByText('nodejs')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('should hide suggestions when input is empty', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, 'node');

      await waitFor(() => {
        expect(screen.getByText('nodejs')).toBeInTheDocument();
      });

      await user.clear(input);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      render(
        <TagManager
          selectedTags={selectedTags}
          availableTags={availableTags}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      expect(input).toBeDisabled();
    });

    it('should disable remove buttons when disabled prop is true', () => {
      render(
        <TagManager
          selectedTags={selectedTags}
          availableTags={availableTags}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const removeButton = screen.getByLabelText(/Remove react tag/i);
      expect(removeButton).toBeDisabled();
    });

    it('should add disabled class to container when disabled', () => {
      const { container } = render(
        <TagManager
          selectedTags={selectedTags}
          availableTags={availableTags}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const tagContainer = container.querySelector('.tag-input-container');
      expect(tagContainer).toHaveClass('disabled');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
      expect(input).toHaveAttribute('aria-controls', 'tag-suggestions');
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded when suggestions are shown', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, 'node');

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have proper role attributes for suggestions', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, 'node');

      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        expect(listbox).toBeInTheDocument();
        expect(screen.getByRole('option')).toBeInTheDocument();
      });
    });

    it('should have aria-selected on highlighted suggestion', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          selectedTags={[]}
          availableTags={availableTags}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByLabelText(/Add tags/i);
      await user.type(input, 'node');

      await waitFor(() => {
        expect(screen.getByText('nodejs')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        const option = screen.getByRole('option');
        expect(option).toHaveAttribute('aria-selected', 'true');
      });
    });
  });
});
