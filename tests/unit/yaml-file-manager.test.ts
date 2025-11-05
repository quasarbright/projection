import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { YAMLFileManager } from '../../src/admin/server/yaml-file-manager';
import { Project } from '../../src/types';

describe('YAMLFileManager', () => {
  let tempDir: string;
  let testFilePath: string;
  let manager: YAMLFileManager;

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
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yaml-test-'));
    testFilePath = path.join(tempDir, 'projects.yaml');
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('readProjects', () => {
    it('should read projects from YAML file', async () => {
      const yamlContent = `projects:
  - id: project-1
    title: Project One
    description: First project
    creationDate: "2024-01-01"
    tags:
      - tag1
    pageLink: https://example.com
`;
      fs.writeFileSync(testFilePath, yamlContent);
      manager = new YAMLFileManager(testFilePath);

      const data = await manager.readProjects();

      expect(data.projects).toHaveLength(1);
      expect(data.projects[0].id).toBe('project-1');
      expect(data.projects[0].title).toBe('Project One');
    });

    it('should handle empty projects array', async () => {
      const yamlContent = `projects: []`;
      fs.writeFileSync(testFilePath, yamlContent);
      manager = new YAMLFileManager(testFilePath);

      const data = await manager.readProjects();

      expect(data.projects).toEqual([]);
    });

    it('should handle file with config and projects', async () => {
      const yamlContent = `config:
  title: My Portfolio
  description: My projects

projects:
  - id: project-1
    title: Project One
    description: First project
    creationDate: "2024-01-01"
    tags:
      - tag1
    pageLink: https://example.com
`;
      fs.writeFileSync(testFilePath, yamlContent);
      manager = new YAMLFileManager(testFilePath);

      const data = await manager.readProjects();

      expect(data.config).toBeDefined();
      expect(data.config?.title).toBe('My Portfolio');
      expect(data.projects).toHaveLength(1);
    });
  });

  describe('updateProject', () => {
    it('should update an existing project', async () => {
      const yamlContent = `projects:
  - id: test-project
    title: Old Title
    description: Old description
    creationDate: "2024-01-01"
    tags:
      - old
    pageLink: https://old.com
`;
      fs.writeFileSync(testFilePath, yamlContent);
      manager = new YAMLFileManager(testFilePath);

      await manager.readProjects();
      await manager.updateProject('test-project', sampleProject);

      const updatedContent = fs.readFileSync(testFilePath, 'utf-8');
      expect(updatedContent).toContain('Test Project');
      expect(updatedContent).toContain('A test project');
      expect(updatedContent).not.toContain('Old Title');
    });

    it('should preserve comments when updating', async () => {
      const yamlContent = `# This is a comment about projects
projects:
  # Comment about first project
  - id: test-project
    title: Old Title
    description: Old description
    creationDate: "2024-01-01"
    tags:
      - old
    pageLink: https://old.com
  # Comment about second project
  - id: another-project
    title: Another Project
    description: Another description
    creationDate: "2024-01-02"
    tags:
      - other
    pageLink: https://another.com
`;
      fs.writeFileSync(testFilePath, yamlContent);
      manager = new YAMLFileManager(testFilePath);

      await manager.readProjects();
      await manager.updateProject('test-project', sampleProject);

      const updatedContent = fs.readFileSync(testFilePath, 'utf-8');
      
      // Verify comments are preserved
      expect(updatedContent).toContain('# This is a comment about projects');
      expect(updatedContent).toContain('# Comment about second project');
      
      // Verify update happened
      expect(updatedContent).toContain('Test Project');
      expect(updatedContent).toContain('A test project');
      
      // Verify other project unchanged
      expect(updatedContent).toContain('Another Project');
    });

    it('should throw error when project not found', async () => {
      const yamlContent = `projects:
  - id: other-project
    title: Other
    description: Other project
    creationDate: "2024-01-01"
    tags: []
    pageLink: https://other.com
`;
      fs.writeFileSync(testFilePath, yamlContent);
      manager = new YAMLFileManager(testFilePath);

      await manager.readProjects();

      await expect(
        manager.updateProject('nonexistent', sampleProject)
      ).rejects.toThrow('Project with id "nonexistent" not found');
    });

    it('should throw error when document not loaded', async () => {
      manager = new YAMLFileManager(testFilePath);

      await expect(
        manager.updateProject('test-project', sampleProject)
      ).rejects.toThrow('Document not loaded');
    });
  });

  describe('addProject', () => {
    it('should add a new project to existing projects', async () => {
      const yamlContent = `projects:
  - id: existing-project
    title: Existing
    description: Existing project
    creationDate: "2024-01-01"
    tags: []
    pageLink: https://existing.com
`;
      fs.writeFileSync(testFilePath, yamlContent);
      manager = new YAMLFileManager(testFilePath);

      await manager.readProjects();
      await manager.addProject(sampleProject);

      const data = await manager.readProjects();
      expect(data.projects).toHaveLength(2);
      expect(data.projects[1].id).toBe('test-project');
    });

    it('should create projects array if it does not exist', async () => {
      const yamlContent = `config:
  title: My Portfolio
`;
      fs.writeFileSync(testFilePath, yamlContent);
      manager = new YAMLFileManager(testFilePath);

      await manager.readProjects();
      await manager.addProject(sampleProject);

      const data = await manager.readProjects();
      expect(data.projects).toHaveLength(1);
      expect(data.projects[0].id).toBe('test-project');
    });

    it('should throw error when document not loaded', async () => {
      manager = new YAMLFileManager(testFilePath);

      await expect(
        manager.addProject(sampleProject)
      ).rejects.toThrow('Document not loaded');
    });
  });

  describe('deleteProject', () => {
    it('should delete an existing project', async () => {
      const yamlContent = `projects:
  - id: project-1
    title: Project One
    description: First project
    creationDate: "2024-01-01"
    tags: []
    pageLink: https://one.com
  - id: project-2
    title: Project Two
    description: Second project
    creationDate: "2024-01-02"
    tags: []
    pageLink: https://two.com
`;
      fs.writeFileSync(testFilePath, yamlContent);
      manager = new YAMLFileManager(testFilePath);

      await manager.readProjects();
      await manager.deleteProject('project-1');

      const data = await manager.readProjects();
      expect(data.projects).toHaveLength(1);
      expect(data.projects[0].id).toBe('project-2');
    });

    it('should throw error when project not found', async () => {
      const yamlContent = `projects:
  - id: project-1
    title: Project One
    description: First project
    creationDate: "2024-01-01"
    tags: []
    pageLink: https://one.com
`;
      fs.writeFileSync(testFilePath, yamlContent);
      manager = new YAMLFileManager(testFilePath);

      await manager.readProjects();

      await expect(
        manager.deleteProject('nonexistent')
      ).rejects.toThrow('Project with id "nonexistent" not found');
    });

    it('should throw error when document not loaded', async () => {
      manager = new YAMLFileManager(testFilePath);

      await expect(
        manager.deleteProject('test-project')
      ).rejects.toThrow('Document not loaded');
    });
  });
});
