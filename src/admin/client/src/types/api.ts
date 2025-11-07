import type { Project, ProjectsData, Config } from '../../../../types';

export interface GetProjectsResponse {
  projects: Project[];
  config: Config;
}

export interface CreateProjectRequest {
  project: Project;
}

export interface CreateProjectResponse {
  success: boolean;
  project: Project;
  errors?: ValidationError[];
}

export interface UpdateProjectRequest {
  project: Project;
}

export interface UpdateProjectResponse {
  success: boolean;
  project: Project;
  errors?: ValidationError[];
}

export interface DeleteProjectResponse {
  success: boolean;
  deletedId: string;
}

export interface GetTagsResponse {
  tags: TagInfo[];
}

export interface TagInfo {
  name: string;
  count: number;
}

export interface PreviewRequest {
  project: Partial<Project>;
}

export interface ValidationError {
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ApiError {
  message: string;
  errors?: ValidationError[];
  status?: number;
}
