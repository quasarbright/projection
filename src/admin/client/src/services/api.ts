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

/**
 * Upload a thumbnail image for a project
 */
export async function uploadThumbnail(
  projectId: string,
  file: File,
  isEditMode: boolean = false
): Promise<{ success: boolean; thumbnailLink: string; isTemp?: boolean }> {
  try {
    const formData = new FormData();
    formData.append('thumbnail', file);
    
    const url = isEditMode
      ? `${API_BASE_URL}/projects/${projectId}/thumbnail?edit=true`
      : `${API_BASE_URL}/projects/${projectId}/thumbnail`;
    
    const response = await axios.post<{ success: boolean; thumbnailLink: string; isTemp?: boolean }>(
      url,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Delete a thumbnail image for a project
 */
export async function deleteThumbnail(projectId: string, isTemp: boolean = false): Promise<{ success: boolean }> {
  try {
    const url = isTemp
      ? `/projects/${projectId}/thumbnail?temp=true`
      : `/projects/${projectId}/thumbnail`;
    const response = await apiClient.delete<{ success: boolean }>(url);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Commit a temporary thumbnail (make it permanent)
 */
export async function commitThumbnail(projectId: string): Promise<{ success: boolean; thumbnailLink: string }> {
  try {
    const response = await apiClient.post<{ success: boolean; thumbnailLink: string }>(
      `/projects/${projectId}/thumbnail/commit`
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Cancel a temporary thumbnail (delete it)
 */
export async function cancelThumbnail(projectId: string): Promise<{ success: boolean }> {
  try {
    const response = await apiClient.post<{ success: boolean }>(
      `/projects/${projectId}/thumbnail/cancel`
    );
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}
