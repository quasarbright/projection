import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectList } from './ProjectList';
import type { Project } from '../../../../types';

const mockProjects: Project[] = [
  {
    id: 'test-project-1',
    title: 'Test Project 1',
    description: 'This is a test project description',
    creationDate: '2024-01-15',
    tags: ['react', 'typescript'],
    pageLink: 'https://example.com/project1',
    featured: true,
  },
  {
    id: 'test-project-2',
    title: 'Test Project 2',
    description: 'Another test project',
    creationDate: '2024-02-20',
    tags: ['node', 'express'],
    pageLink: 'https://example.com/project2',
    featured: false,
  },
];

describe('ProjectList', () => {
  it('should render empty state when no projects', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={[]} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText(/no projects found/i)).toBeInTheDocument();
  });

  it('should render all projects', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
  });

  it('should display project details', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('This is a test project description')).toBeInTheDocument();
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    // Tags appear in both filter buttons and project cards, so use getAllByText
    expect(screen.getAllByText('react').length).toBeGreaterThan(0);
    expect(screen.getAllByText('typescript').length).toBeGreaterThan(0);
  });

  it('should display featured badge for featured projects', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    // Featured appears in both the sort dropdown and the badge, so check for the badge specifically
    const featuredBadges = screen.getAllByText('Featured').filter(
      (el) => el.classList.contains('featured-badge')
    );
    expect(featuredBadges).toHaveLength(1);
  });

  it('should call onEdit when Edit button is clicked', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    // Projects are sorted by date descending by default, so Project 2 (2024-02-20) comes first
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(mockProjects[1]); // Project 2 is first due to sorting
  });

  it('should show confirmation dialog when Delete button is clicked', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    // Projects are sorted by date descending by default, so Project 2 comes first, Project 1 second
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[1]);

    // Confirmation dialog should appear
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete Project')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete "Test Project 1"/)).toBeInTheDocument();
    
    // onDelete should not be called yet
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('should call onDelete when delete is confirmed', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    // Click delete button for Project 1
    const deleteButton = screen.getByLabelText('Delete Test Project 1');
    fireEvent.click(deleteButton);

    // Confirm deletion - get all buttons and find the one in the dialog
    const allButtons = screen.getAllByRole('button');
    const confirmButton = allButtons.find(btn => 
      btn.textContent === 'Delete' && btn.classList.contains('btn-danger') && btn.type === 'button'
    );
    if (confirmButton) {
      fireEvent.click(confirmButton);
    }

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('test-project-1');
  });

  it('should not call onDelete when delete is cancelled', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    // Click delete button
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Cancel deletion
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onDelete).not.toHaveBeenCalled();
    
    // Dialog should be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should close confirmation dialog after confirming delete', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    // Click delete button for Project 2
    const deleteButton = screen.getByLabelText('Delete Test Project 2');
    fireEvent.click(deleteButton);

    // Confirm deletion - get all buttons and find the one in the dialog
    const allButtons = screen.getAllByRole('button');
    const confirmButton = allButtons.find(btn => 
      btn.textContent === 'Delete' && btn.classList.contains('btn-danger') && btn.type === 'button'
    );
    if (confirmButton) {
      fireEvent.click(confirmButton);
    }

    // Dialog should be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render Edit button with correct aria-label', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByLabelText('Edit Test Project 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit Test Project 2')).toBeInTheDocument();
  });

  it('should render Delete button with correct aria-label', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByLabelText('Delete Test Project 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Test Project 2')).toBeInTheDocument();
  });

  it('should render sort controls', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByLabelText('Sort by:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sort/i })).toBeInTheDocument();
  });

  it('should sort projects by date in descending order by default', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    const projectTitles = screen.getAllByRole('heading', { level: 3 });
    expect(projectTitles[0]).toHaveTextContent('Test Project 2');
    expect(projectTitles[1]).toHaveTextContent('Test Project 1');
  });

  it('should change sort field when dropdown is changed', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'name' } });

    const projectTitles = screen.getAllByRole('heading', { level: 3 });
    expect(projectTitles[0]).toHaveTextContent('Test Project 1');
    expect(projectTitles[1]).toHaveTextContent('Test Project 2');
  });

  it('should toggle sort order when order button is clicked', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    const orderButton = screen.getByRole('button', { name: /sort/i });
    
    // Default is descending (↓)
    expect(orderButton).toHaveTextContent('↓');
    
    // Click to toggle to ascending
    fireEvent.click(orderButton);
    expect(orderButton).toHaveTextContent('↑');
    
    // Projects should now be in ascending order by date
    const projectTitles = screen.getAllByRole('heading', { level: 3 });
    expect(projectTitles[0]).toHaveTextContent('Test Project 1');
    expect(projectTitles[1]).toHaveTextContent('Test Project 2');
  });

  it('should sort by featured status', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'featured' } });

    const projectTitles = screen.getAllByRole('heading', { level: 3 });
    expect(projectTitles[0]).toHaveTextContent('Test Project 1');
    expect(projectTitles[1]).toHaveTextContent('Test Project 2');
  });

  it('should render search input', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
  });

  it('should filter projects by search query in title', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'Project 1' } });

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 2 projects')).toBeInTheDocument();
  });

  it('should filter projects by search query in description', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'Another test' } });

    expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
  });

  it('should render tag filter buttons', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Filter by tags:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'react' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'typescript' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'node' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'express' })).toBeInTheDocument();
  });

  it('should filter projects by selected tag', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    const reactTagButton = screen.getByRole('button', { name: 'react' });
    fireEvent.click(reactTagButton);

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 2 projects')).toBeInTheDocument();
  });

  it('should filter projects by multiple tags (AND logic)', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    const reactTagButton = screen.getByRole('button', { name: 'react' });
    const typescriptTagButton = screen.getByRole('button', { name: 'typescript' });
    
    fireEvent.click(reactTagButton);
    fireEvent.click(typescriptTagButton);

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument();
  });

  it('should toggle tag filter when clicked again', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    const reactTagButton = screen.getByRole('button', { name: 'react' });
    
    // Click to activate
    fireEvent.click(reactTagButton);
    expect(reactTagButton).toHaveClass('active');
    expect(screen.getByText('Showing 1 of 2 projects')).toBeInTheDocument();
    
    // Click again to deactivate
    fireEvent.click(reactTagButton);
    expect(reactTagButton).not.toHaveClass('active');
    expect(screen.getByText('Showing 2 of 2 projects')).toBeInTheDocument();
  });

  it('should show clear filters button when filters are active', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    // Initially no clear button
    expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();

    // Add search query
    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Clear button should appear
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('should clear all filters when clear button is clicked', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    // Apply filters
    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'Project 1' } });
    
    const reactTagButton = screen.getByRole('button', { name: 'react' });
    fireEvent.click(reactTagButton);

    expect(screen.getByText('Showing 1 of 2 projects')).toBeInTheDocument();

    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    expect(searchInput).toHaveValue('');
    expect(reactTagButton).not.toHaveClass('active');
    expect(screen.getByText('Showing 2 of 2 projects')).toBeInTheDocument();
  });

  it('should show message when no projects match filters', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText(/no projects match your filters/i)).toBeInTheDocument();
  });

  it('should display project count', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<ProjectList projects={mockProjects} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Showing 2 of 2 projects')).toBeInTheDocument();
  });
});
