import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Project, Config } from '../../../../types';

// Mock axios with factory function
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      isAxiosError: vi.fn(),
    },
  };
});

// Import after mocking
import axios from 'axios';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getTags,
  getConfig,
  generatePreview,
} from './api';

const mockAxios = vi.mocked(axios);
const mockAxiosInstance = mockAxios.create() as any;

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockAxios.isAxiosError as any).mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getProjects', () => {
    it('should fetch all projects successfully', async () => {
      const mockResponse = {
        data: {
          projects: [
            {
              id: 'test-project',
              title: 'Test Project',
              description: 'A test project',
              creationDate: '2024-01-01',
              tags: ['test'],
              pageLink: 'https://example.com',
            },
          ],
          config: {
            title: 'My Portfolio',
            description: 'Test portfolio',
            baseUrl: './',
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await getProjects();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/projects');
      expect(result).toEqual(mockResponse.data);
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].id).toBe('test-project');
    });

    it('should handle errors when fetching projects', async () => {
      const mockError = {
        response: {
          data: { message: 'Failed to fetch projects' },
          status: 500,
        },
        message: 'Network error',
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);
      (mockAxios.isAxiosError as any).mockReturnValue(true);

      await expect(getProjects()).rejects.toMatchObject({
        message: 'Failed to fetch projects',
        status: 500,
      });
    });
  });

  describe('createProject', () => {
    it('should create a new project successfully', async () => {
      const newProject: Project = {
        id: 'new-project',
        title: 'New Project',
        description: 'A new project',
        creationDate: '2024-01-01',
        tags: ['new'],
        pageLink: 'https://example.com',
      };

      const mockResponse = {
        data: {
          success: true,
          project: newProject,
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await createProject(newProject);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/projects', { project: newProject });
      expect(result.success).toBe(true);
      expect(result.project).toEqual(newProject);
    });

    it('should handle validation errors when creating project', async () => {
      const invalidProject: Project = {
        id: 'Invalid ID',
        title: '',
        description: '',
        creationDate: 'invalid-date',
        tags: [],
        pageLink: '',
      };

      const mockError = {
        response: {
          data: {
            message: 'Validation failed',
            errors: [
              { field: 'id', message: 'Invalid ID format', severity: 'error' },
              { field: 'title', message: 'Title is required', severity: 'error' },
            ],
          },
          status: 400,
        },
        message: 'Bad request',
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);
      (mockAxios.isAxiosError as any).mockReturnValue(true);

      await expect(createProject(invalidProject)).rejects.toMatchObject({
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'id' }),
          expect.objectContaining({ field: 'title' }),
        ]),
      });
    });
  });

  describe('updateProject', () => {
    it('should update an existing project successfully', async () => {
      const updatedProject: Project = {
        id: 'test-project',
        title: 'Updated Project',
        description: 'Updated description',
        creationDate: '2024-01-01',
        tags: ['updated'],
        pageLink: 'https://example.com',
      };

      const mockResponse = {
        data: {
          success: true,
          project: updatedProject,
        },
      };

      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await updateProject('test-project', updatedProject);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/projects/test-project', { project: updatedProject });
      expect(result.success).toBe(true);
      expect(result.project.title).toBe('Updated Project');
    });

    it('should handle project not found error', async () => {
      const project: Project = {
        id: 'nonexistent',
        title: 'Test',
        description: 'Test',
        creationDate: '2024-01-01',
        tags: ['test'],
        pageLink: 'https://example.com',
      };

      const mockError = {
        response: {
          data: { message: 'Project not found' },
          status: 404,
        },
        message: 'Not found',
      };

      mockAxiosInstance.put.mockRejectedValue(mockError);
      (mockAxios.isAxiosError as any).mockReturnValue(true);

      await expect(updateProject('nonexistent', project)).rejects.toMatchObject({
        message: 'Project not found',
        status: 404,
      });
    });
  });

  describe('deleteProject', () => {
    it('should delete a project successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          deletedId: 'test-project',
        },
      };

      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await deleteProject('test-project');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/projects/test-project');
      expect(result.success).toBe(true);
      expect(result.deletedId).toBe('test-project');
    });

    it('should handle errors when deleting project', async () => {
      const mockError = {
        response: {
          data: { message: 'Project not found' },
          status: 404,
        },
        message: 'Not found',
      };

      mockAxiosInstance.delete.mockRejectedValue(mockError);
      (mockAxios.isAxiosError as any).mockReturnValue(true);

      await expect(deleteProject('nonexistent')).rejects.toMatchObject({
        message: 'Project not found',
        status: 404,
      });
    });
  });

  describe('getTags', () => {
    it('should fetch all tags with counts', async () => {
      const mockResponse = {
        data: {
          tags: [
            { name: 'javascript', count: 5 },
            { name: 'typescript', count: 3 },
            { name: 'react', count: 2 },
          ],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await getTags();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tags');
      expect(result.tags).toHaveLength(3);
      expect(result.tags[0]).toEqual({ name: 'javascript', count: 5 });
    });
  });

  describe('getConfig', () => {
    it('should fetch configuration', async () => {
      const mockConfig: Config = {
        title: 'My Portfolio',
        description: 'Test portfolio',
        baseUrl: './',
        itemsPerPage: 20,
      };

      const mockResponse = {
        data: mockConfig,
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await getConfig();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/config');
      expect(result).toEqual(mockConfig);
    });
  });

  describe('generatePreview', () => {
    it('should generate preview HTML', async () => {
      const partialProject: Partial<Project> = {
        title: 'Preview Project',
        description: 'Preview description',
        tags: ['preview'],
      };

      const mockHTML = '<div class="project-card">Preview HTML</div>';
      const mockResponse = {
        data: mockHTML,
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await generatePreview(partialProject);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/preview',
        { project: partialProject },
        { headers: { Accept: 'text/html' } }
      );
      expect(result).toBe(mockHTML);
    });
  });
});
