import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as api from './services/api';

vi.mock('./services/api');
const mockedApi = vi.mocked(api);

describe('App Component', () => {
  const mockProjects = [
    {
      id: 'project-1',
      title: 'Project 1',
      description: 'Description 1',
      creationDate: '2024-01-01',
      tags: ['tag1'],
      pageLink: 'https://example.com/1',
    },
    {
      id: 'project-2',
      title: 'Project 2',
      description: 'Description 2',
      creationDate: '2024-01-02',
      tags: ['tag2'],
      pageLink: 'https://example.com/2',
    },
  ];

  const mockConfig = {
    title: 'Test Portfolio',
    description: 'Test description',
    baseUrl: 'https://example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header with title and New Project button', async () => {
    mockedApi.getProjects.mockResolvedValue({
      projects: mockProjects,
      config: mockConfig,
    });
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    render(<App />);

    expect(screen.getByText('Projection Admin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    mockedApi.getProjects.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    render(<App />);

    expect(screen.getByText(/loading projects/i)).toBeInTheDocument();
  });

  it('should display projects after loading', async () => {
    mockedApi.getProjects.mockResolvedValue({
      projects: mockProjects,
      config: mockConfig,
    });
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 2 projects')).toBeInTheDocument();
    });

    expect(screen.queryByText(/loading projects/i)).not.toBeInTheDocument();
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });

  it('should display error message when fetch fails', async () => {
    const mockError = {
      message: 'Failed to fetch projects',
      status: 500,
    };

    mockedApi.getProjects.mockRejectedValue(mockError);
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/error: failed to fetch projects/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/loading projects/i)).not.toBeInTheDocument();
  });

  it('should show ProjectForm when New Project button is clicked', async () => {
    mockedApi.getProjects.mockResolvedValue({
      projects: mockProjects,
      config: mockConfig,
    });
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 2 projects')).toBeInTheDocument();
    });

    const newProjectButton = screen.getByRole('button', { name: /new project/i });
    await user.click(newProjectButton);

    // Form should be displayed
    await waitFor(() => {
      expect(screen.getByText('Create New Project')).toBeInTheDocument();
    });

    // Project list should be hidden
    expect(screen.queryByText('Showing 2 of 2 projects')).not.toBeInTheDocument();
  });

  it('should hide New Project button when form is shown', async () => {
    mockedApi.getProjects.mockResolvedValue({
      projects: mockProjects,
      config: mockConfig,
    });
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument();
    });

    const newProjectButton = screen.getByRole('button', { name: /new project/i });
    await user.click(newProjectButton);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /new project/i })).not.toBeInTheDocument();
    });
  });

  it('should show ProjectForm in edit mode when edit is clicked', async () => {
    mockedApi.getProjects.mockResolvedValue({
      projects: mockProjects,
      config: mockConfig,
    });
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 2 projects')).toBeInTheDocument();
    });

    // Click edit on first project (sorted by date desc, so project-2 is first)
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    // Form should be displayed in edit mode
    await waitFor(() => {
      expect(screen.getByText('Edit Project')).toBeInTheDocument();
    });

    // Form should be pre-filled with project data (ID is disabled in edit mode)
    // First project in sorted order is project-2 (2024-01-02 > 2024-01-01)
    const idInput = screen.getByLabelText(/Project ID/i) as HTMLInputElement;
    expect(idInput.value).toBe('project-2');
    expect(idInput.disabled).toBe(true);
    expect(screen.getByDisplayValue('Project 2')).toBeInTheDocument();
  });

  it('should return to project list when form is cancelled', async () => {
    mockedApi.getProjects.mockResolvedValue({
      projects: mockProjects,
      config: mockConfig,
    });
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 2 projects')).toBeInTheDocument();
    });

    // Open form
    const newProjectButton = screen.getByRole('button', { name: /new project/i });
    await user.click(newProjectButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Project')).toBeInTheDocument();
    });

    // Cancel form
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Should return to project list
    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 2 projects')).toBeInTheDocument();
    });
    expect(screen.queryByText('Create New Project')).not.toBeInTheDocument();
  });

  it('should display zero projects when no projects exist', async () => {
    mockedApi.getProjects.mockResolvedValue({
      projects: [],
      config: mockConfig,
    });
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('0 projects')).toBeInTheDocument();
    });

    expect(screen.getByText(/no projects found/i)).toBeInTheDocument();
  });

  it('should wrap content with ProjectProvider', async () => {
    mockedApi.getProjects.mockResolvedValue({
      projects: mockProjects,
      config: mockConfig,
    });
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    render(<App />);

    // If provider is working, we should see the loaded projects
    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 2 projects')).toBeInTheDocument();
    });

    // Verify API was called (proving context is working)
    expect(mockedApi.getProjects).toHaveBeenCalledTimes(1);
  });
});
