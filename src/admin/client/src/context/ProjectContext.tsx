import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Project, Config } from '../../../../types';
import * as api from '../services/api';
import type { ApiError, TagInfo } from '../types/api';

interface ProjectContextState {
  projects: Project[];
  config: Config | null;
  tags: TagInfo[];
  loading: boolean;
  error: ApiError | null;
  fetchProjects: () => Promise<void>;
  createProject: (project: Project) => Promise<void>;
  updateProject: (projectId: string, project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  fetchTags: () => Promise<void>;
  clearError: () => void;
}

const ProjectContext = createContext<ProjectContextState | undefined>(undefined);

interface ProjectProviderProps {
  children: React.ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getProjects();
      setProjects(response.projects);
      setConfig(response.config);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (project: Project) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.createProject(project);
      if (response.success) {
        setProjects((prev) => [...prev, response.project]);
      } else if (response.errors) {
        throw {
          message: 'Validation failed',
          errors: response.errors,
        } as ApiError;
      }
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProject = useCallback(async (projectId: string, project: Project) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.updateProject(projectId, project);
      if (response.success) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? response.project : p))
        );
      } else if (response.errors) {
        throw {
          message: 'Validation failed',
          errors: response.errors,
        } as ApiError;
      }
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.deleteProject(projectId);
      if (response.success) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      }
    } catch (err) {
      setError(err as ApiError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const response = await api.getTags();
      setTags(response.tags);
    } catch (err) {
      // Tags are not critical, so we don't set error state
      console.error('Failed to fetch tags:', err);
    }
  }, []);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
    fetchTags();
  }, [fetchProjects, fetchTags]);

  const value: ProjectContextState = {
    projects,
    config,
    tags,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    fetchTags,
    clearError,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects(): ProjectContextState {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
