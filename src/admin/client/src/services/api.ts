import axios, { AxiosError } from 'axios';
import type { Project, Config } from '../../../../types';
import type {
  GetProjectsResponse,
  CreateProjectResponse,
  UpdateProjectResponse,
  DeleteProjectResponse,
  GetTagsResponse,
  ApiError,
} from '../types/api';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Handle API errors and convert to ApiError format
 */
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    const apiError: ApiError = {
      message: axiosError.response?.data?.message || axiosError.message,
      errors: axiosError.response?.data?.errors,
      status: axiosError.response?.status,
    };
    throw apiError;
  }
  throw {
    message: error instanceof Error ? error.message : 'Unknown error occurred',
  } as ApiError;
}

/**
 * Fetch all projects and configuration
 */
export async function getProjects(): Promise<GetProjectsResponse> {
  try {
    const response = await apiClient.get<GetProjectsResponse>('/projects');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Create a new project
 */
export async function createProject(project: Project): Promise<CreateProjectResponse> {
  try {
    const response = await apiClient.post<CreateProjectResponse>('/projects', { project });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Update an existing project
 */
export async function updateProject(projectId: string, project: Project): Promise<UpdateProjectResponse> {
  try {
    const response = await apiClient.put<UpdateProjectResponse>(`/projects/${projectId}`, { project });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<DeleteProjectResponse> {
  try {
    const response = await apiClient.delete<DeleteProjectResponse>(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Get all tags with usage counts
 */
export async function getTags(): Promise<GetTagsResponse> {
  try {
    const response = await apiClient.get<GetTagsResponse>('/tags');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Get configuration
 */
export async function getConfig(): Promise<Config> {
  try {
    const response = await apiClient.get<Config>('/config');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Generate preview HTML for a project
 */
export async function generatePreview(project: Partial<Project>): Promise<string> {
  try {
    const response = await apiClient.post<string>('/preview', { project }, {
      headers: {
        'Accept': 'text/html',
      },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}
