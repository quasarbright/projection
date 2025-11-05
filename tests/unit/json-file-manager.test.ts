import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { JSONFileManager } from '../../src/admin/server/json-file-manager';
import { Project } from '../../src/types';

describe('JSONFileManager', () => {
  let tempDir: string;
  let testFilePath: string;
  let manager: JSONFileManager;

  const sampleProject: Project = {
    id: 'test-project',
    title: 'Test Project',
    description: 'A test project',
    creationDate: '2024-01-01',
    tags: ['test', 'sample'],
    pageLink: 'https://test.com',
    sourceLink: 'https://github.com/test/project',
    featured: true
  };

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'json-test-'));
    testFilePath = path.join(tempDir, 'projects.json');
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('readProjects', () => {
    it('should read projects from JSON file', async () => {
      const jsonContent = {
        projects: [
          {
            id: 'project-1',
            title: 'Project One',
            description: 'First project',
            creationDate: '2024-01-01',
            tags: ['tag1'],
            pageLink: 'https://example.com'
          }
        ]
      };
      fs.writeFileSync(testFilePath, JSON.stringify(jsonContent));
      manager = new JSONFileManager(testFilePath);

      const data = await manager.readProjects();

      expect(data.projects).toHaveLength(1);
      expect(data.projects[0].id).toBe('project-1');
      expect(data.projects[0].title).toBe('Project One');
    });

    it('should handle empty projects array', async () => {
      const jsonContent = { projects: [] };
      fs.writeFileSync(testFilePath, JSON.stringify(jsonContent));
      manager = new JSONFileManager(testFilePath);

      const data = await manager.readProjects();

      expect(data.projects).toEqual([]);
    });

    it('should handle file with config and projects', async () => {
      const jsonContent = {
        config: {
          title: 'My Portfolio',
          description: 'My projects'
        },
        projects: [
          {
            id: 'project-1',
            title: 'Project One',
            description: 'First project',
            creationDate: '2024-01-01',
            tags: ['tag1'],
            pageLink: 'https://example.com'
          }
        ]
      };
      fs.writeFileSync(testFilePath, JSON.stringify(jsonContent));
      manager = new JSONFileManager(testFilePath);

      const data = await manager.readProjects();

      expect(data.config).toBeDefined();
      expect(data.config?.title).toBe('My Portfolio');
      expect(data.projects).toHaveLength(1);
    });
  });

  describe('updateProject', () => {
    it('should update an existing project', async () => {
      const jsonContent = {
        projects: [
          {
            id: 'test-project',
            title: 'Old Title',
            description: 'Old description',
            creationDate: '2024-01-01',
            tags: ['old'],
            pageLink: 'https://old.com'
          }
        ]
      };
      fs.writeFileSync(testFilePath, JSON.stringify(jsonContent));
      manager = new JSONFileManager(testFilePath);

      await manager.readProjects();
      await manager.updateProject('test-project', sampleProject);

      const data = await manager.readProjects();
      expect(data.projects[0].title).toBe('Test Project');
      expect(data.projects[0].description).toBe('A test project');
    });

    it('should use 2-space indentation for pretty-printing', async () => {
      const jsonContent = {
        projects: [
          {
            id: 'test-project',
            title: 'Old Title',
            description: 'Old description',
            creationDate: '2024-01-01',
            tags: ['old'],
            pageLink: 'https://old.com'
          }
        ]
      };
      fs.writeFileSync(testFilePath, JSON.stringify(jsonContent));
      manager = new JSONFileManager(testFilePath);

      await manager.readProjects();
      await manager.updateProject('test-project', sampleProject);

      const fileContent = fs.readFileSync(testFilePath, 'utf-8');
      
      // Check for 2-space indentation
      expect(fileContent).toContain('  "projects"');
      expect(fileContent).toContain('    "id"');
    });

    it('should throw error when project not found', async () => {
      const jsonContent = {
        projects: [
          {
            id: 'other-project',
            title: 'Other',
            description: 'Other project',
            creationDate: '2024-01-01',
            tags: [],
            pageLink: 'https://other.com'
          }
        ]
      };
      fs.writeFileSync(testFilePath, JSON.stringify(jsonContent));
      manager = new JSONFileManager(testFilePath);

      await manager.readProjects();

      await expect(
        manager.updateProject('nonexistent', sampleProject)
      ).rejects.toThrow('Project with id "nonexistent" not found');
    });

    it('should throw error when data not loaded', async () => {
      manager = new JSONFileManager(testFilePath);

      await expect(
        manager.updateProject('test-project', sampleProject)
      ).rejects.toThrow('Data not loaded');
    });
  });

  describe('addProject', () => {
    it('should add a new project to existing projects', async () => {
      const jsonContent = {
        projects: [
          {
            id: 'existing-project',
            title: 'Existing',
            description: 'Existing project',
            creationDate: '2024-01-01',
            tags: [],
            pageLink: 'https://existing.com'
          }
        ]
      };
      fs.writeFileSync(testFilePath, JSON.stringify(jsonContent));
      manager = new JSONFileManager(testFilePath);

      await manager.readProjects();
      await manager.addProject(sampleProject);

      const data = await manager.readProjects();
      expect(data.projects).toHaveLength(2);
      expect(data.projects[1].id).toBe('test-project');
    });

    it('should throw error when data not loaded', async () => {
      manager = new JSONFileManager(testFilePath);

      await expect(
        manager.addProject(sampleProject)
      ).rejects.toThrow('Data not loaded');
    });
  });

  describe('deleteProject', () => {
    it('should delete an existing project', async () => {
      const jsonContent = {
        projects: [
          {
            id: 'project-1',
            title: 'Project One',
            description: 'First project',
            creationDate: '2024-01-01',
            tags: [],
            pageLink: 'https://one.com'
          },
          {
            id: 'project-2',
            title: 'Project Two',
            description: 'Second project',
            creationDate: '2024-01-02',
            tags: [],
            pageLink: 'https://two.com'
          }
        ]
      };
      fs.writeFileSync(testFilePath, JSON.stringify(jsonContent));
      manager = new JSONFileManager(testFilePath);

      await manager.readProjects();
      await manager.deleteProject('project-1');

      const data = await manager.readProjects();
      expect(data.projects).toHaveLength(1);
      expect(data.projects[0].id).toBe('project-2');
    });

    it('should throw error when project not found', async () => {
      const jsonContent = {
        projects: [
          {
            id: 'project-1',
            title: 'Project One',
            description: 'First project',
            creationDate: '2024-01-01',
            tags: [],
            pageLink: 'https://one.com'
          }
        ]
      };
      fs.writeFileSync(testFilePath, JSON.stringify(jsonContent));
      manager = new JSONFileManager(testFilePath);

      await manager.readProjects();

      await expect(
        manager.deleteProject('nonexistent')
      ).rejects.toThrow('Project with id "nonexistent" not found');
    });

    it('should throw error when data not loaded', async () => {
      manager = new JSONFileManager(testFilePath);

      await expect(
        manager.deleteProject('test-project')
      ).rejects.toThrow('Data not loaded');
    });
  });
});
