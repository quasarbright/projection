import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { ProjectProvider, useProjects } from './ProjectContext';
import * as api from '../services/api';
import type { Project } from '../../../../types';

vi.mock('../services/api');
const mockedApi = vi.mocked(api);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ProjectProvider>{children}</ProjectProvider>
);

describe('ProjectContext', () => {
  const mockProjects: Project[] = [
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
    baseUrl: './',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw error when useProjects is used outside provider', () => {
    expect(() => {
      renderHook(() => useProjects());
    }).toThrow('useProjects must be used within a ProjectProvider');
  });

  it('should fetch projects on mount', async () => {
    mockedApi.getProjects.mockResolvedValue({
      projects: mockProjects,
      config: mockConfig,
    });
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    const { result } = renderHook(() => useProjects(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projects).toEqual(mockProjects);
    expect(result.current.config).toEqual(mockConfig);
    expect(mockedApi.getProjects).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch projects error', async () => {
    const mockError = {
      message: 'Failed to fetch projects',
      status: 500,
    };

    mockedApi.getProjects.mockRejectedValue(mockError);
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.projects).toEqual([]);
  });

  it('should create a new project', async () => {
    mockedApi.getProjects.mockResolvedValue({
      projects: mockProjects,
      config: mockConfig,
    });
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    const newProject: Project = {
      id: 'project-3',
      title: 'Project 3',
      description: 'Description 3',
      creationDate: '2024-01-03',
      tags: ['tag3'],
      pageLink: 'https://example.com/3',
    };

    mockedApi.createProject.mockResolvedValue({
      success: true,
      project: newProject,
    });

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createProject(newProject);
    });

    expect(result.current.projects).toHaveLength(3);
    expect(result.current.projects[2]).toEqual(newProject);
    expect(mockedApi.createProject).toHaveBeenCalledWith(newProject);
  });

  it('should handle create project validation errors', async () => {
    mockedApi.getProjects.mockResolvedValue({
      projects: mockProjects,
      config: mockConfig,
    });
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    const invalidProject: Project = {
      id: 'Invalid ID',
      title: '',
      description: '',
      creationDate: 'invalid',
      tags: [],
      pageLink: '',
    };

    mockedApi.createProject.mockResolvedValue({
      success: false,
      project: invalidProject,
      errors: [
        { field: 'id', message: 'Invalid ID format', severity: 'error' },
      ],
    });

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.createProject(invalidProject);
      })
    ).rejects.toMatchObject({
      message: 'Validation failed',
    });

    expect(result.current.projects).toHaveLength(2);
  });

  it('should update an existing project', async () => {
    mockedApi.getProjects.mockResolvedValue({
      projects: mockProjects,
      config: mockConfig,
    });
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    const updatedProject: Project = {
      ...mockProjects[0],
      title: 'Updated Project 1',
    };

    mockedApi.updateProject.mockResolvedValue({
      success: true,
      project: updatedProject,
    });

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateProject('project-1', updatedProject);
    });

    expect(result.current.projects[0].title).toBe('Updated Project 1');
    expect(mockedApi.updateProject).toHaveBeenCalledWith('project-1', updatedProject);
  });

  it('should delete a project', async () => {
    mockedApi.getProjects.mockResolvedValue({
      projects: mockProjects,
      config: mockConfig,
    });
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    mockedApi.deleteProject.mockResolvedValue({
      success: true,
      deletedId: 'project-1',
    });

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteProject('project-1');
    });

    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].id).toBe('project-2');
    expect(mockedApi.deleteProject).toHaveBeenCalledWith('project-1');
  });

  it('should fetch tags', async () => {
    const mockTags = [
      { name: 'javascript', count: 5 },
      { name: 'typescript', count: 3 },
    ];

    mockedApi.getProjects.mockResolvedValue({
      projects: mockProjects,
      config: mockConfig,
    });
    mockedApi.getTags.mockResolvedValue({ tags: mockTags });

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tags).toEqual(mockTags);
    expect(mockedApi.getTags).toHaveBeenCalledTimes(1);
  });

  it('should clear error', async () => {
    const mockError = {
      message: 'Test error',
      status: 500,
    };

    mockedApi.getProjects.mockRejectedValue(mockError);
    mockedApi.getTags.mockResolvedValue({ tags: [] });

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
