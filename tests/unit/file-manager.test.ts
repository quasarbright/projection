import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FileManager } from '../../src/admin/server/file-manager';
import { Project } from '../../src/types';

describe('FileManager', () => {
  let tempDir: string;
  let yamlFilePath: string;
  let jsonFilePath: string;

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
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'file-manager-test-'));
    yamlFilePath = path.join(tempDir, 'projects.yaml');
    jsonFilePath = path.join(tempDir, 'projects.json');
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('format detection', () => {
    it('should detect YAML format from .yaml extension', () => {
      const manager = new FileManager(yamlFilePath);
      expect(manager.getFormat()).toBe('yaml');
    });

    it('should detect YAML format from .yml extension', () => {
      const ymlPath = path.join(tempDir, 'projects.yml');
      const manager = new FileManager(ymlPath);
      expect(manager.getFormat()).toBe('yaml');
    });

    it('should detect JSON format from .json extension', () => {
      const manager = new FileManager(jsonFilePath);
      expect(manager.getFormat()).toBe('json');
    });

    it('should default to YAML for unknown extensions', () => {
      const unknownPath = path.join(tempDir, 'projects.txt');
      const manager = new FileManager(unknownPath);
      expect(manager.getFormat()).toBe('yaml');
    });
  });

  describe('YAML file operations', () => {
    it('should delegate to YAML manager for YAML files', async () => {
      const yamlContent = `projects:
  - id: project-1
    title: Project One
    description: First project
    creationDate: "2024-01-01"
    tags: []
    pageLink: https://example.com
`;
      fs.writeFileSync(yamlFilePath, yamlContent);
      const manager = new FileManager(yamlFilePath);

      const data = await manager.readProjects();

      expect(data.projects).toHaveLength(1);
      expect(data.projects[0].id).toBe('project-1');
    });
  });

  describe('JSON file operations', () => {
    it('should delegate to JSON manager for JSON files', async () => {
      const jsonContent = {
        projects: [
          {
            id: 'project-1',
            title: 'Project One',
            description: 'First project',
            creationDate: '2024-01-01',
            tags: [],
            pageLink: 'https://example.com'
          }
        ]
      };
      fs.writeFileSync(jsonFilePath, JSON.stringify(jsonContent));
      const manager = new FileManager(jsonFilePath);

      const data = await manager.readProjects();

      expect(data.projects).toHaveLength(1);
      expect(data.projects[0].id).toBe('project-1');
    });
  });

  describe('backup functionality', () => {
    it('should create backup before updating project', async () => {
      const yamlContent = `projects:
  - id: test-project
    title: Old Title
    description: Old description
    creationDate: "2024-01-01"
    tags: []
    pageLink: https://old.com
`;
      fs.writeFileSync(yamlFilePath, yamlContent);
      const manager = new FileManager(yamlFilePath);

      await manager.readProjects();
      await manager.updateProject('test-project', sampleProject);

      // Check that backup file was created
      const files = fs.readdirSync(tempDir);
      const backupFiles = files.filter(f => f.includes('.backup-'));
      expect(backupFiles.length).toBeGreaterThan(0);
    });

    it('should create backup before adding project', async () => {
      const yamlContent = `projects: []`;
      fs.writeFileSync(yamlFilePath, yamlContent);
      const manager = new FileManager(yamlFilePath);

      await manager.readProjects();
      await manager.addProject(sampleProject);

      const files = fs.readdirSync(tempDir);
      const backupFiles = files.filter(f => f.includes('.backup-'));
      expect(backupFiles.length).toBeGreaterThan(0);
    });

    it('should create backup before deleting project', async () => {
      const yamlContent = `projects:
  - id: test-project
    title: Test
    description: Test project
    creationDate: "2024-01-01"
    tags: []
    pageLink: https://test.com
`;
      fs.writeFileSync(yamlFilePath, yamlContent);
      const manager = new FileManager(yamlFilePath);

      await manager.readProjects();
      await manager.deleteProject('test-project');

      const files = fs.readdirSync(tempDir);
      const backupFiles = files.filter(f => f.includes('.backup-'));
      expect(backupFiles.length).toBeGreaterThan(0);
    });

    it('should preserve original content in backup', async () => {
      const originalContent = `projects:
  - id: test-project
    title: Original Title
    description: Original description
    creationDate: "2024-01-01"
    tags: []
    pageLink: https://original.com
`;
      fs.writeFileSync(yamlFilePath, originalContent);
      const manager = new FileManager(yamlFilePath);

      await manager.readProjects();
      await manager.updateProject('test-project', sampleProject);

      const files = fs.readdirSync(tempDir);
      const backupFile = files.find(f => f.includes('.backup-'));
      expect(backupFile).toBeDefined();

      const backupContent = fs.readFileSync(
        path.join(tempDir, backupFile!),
        'utf-8'
      );
      expect(backupContent).toBe(originalContent);
    });

    it('should include timestamp in backup filename', async () => {
      const yamlContent = `projects: []`;
      fs.writeFileSync(yamlFilePath, yamlContent);
      const manager = new FileManager(yamlFilePath);

      await manager.readProjects();
      const backupPath = await manager.createBackup();

      expect(backupPath).toContain('.backup-');
      expect(backupPath).toMatch(/\.backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
    });
  });

  describe('file watching', () => {
    it('should call callback when file changes externally', (done) => {
      const yamlContent = `projects:
  - id: project-1
    title: Original
    description: Original project
    creationDate: "2024-01-01"
    tags: []
    pageLink: https://original.com
`;
      fs.writeFileSync(yamlFilePath, yamlContent);
      const manager = new FileManager(yamlFilePath);

      manager.readProjects().then(() => {
        manager.watchFile((data) => {
          expect(data.projects[0].title).toBe('Updated');
          manager.stopWatching();
          done();
        });

        // Simulate external file change after a short delay
        setTimeout(() => {
          const updatedContent = `projects:
  - id: project-1
    title: Updated
    description: Updated project
    creationDate: "2024-01-01"
    tags: []
    pageLink: https://updated.com
`;
          fs.writeFileSync(yamlFilePath, updatedContent);
        }, 200);
      });
    }, 10000);

    it('should stop watching when stopWatching is called', async () => {
      const yamlContent = `projects: []`;
      fs.writeFileSync(yamlFilePath, yamlContent);
      const manager = new FileManager(yamlFilePath);

      await manager.readProjects();
      
      let callbackCount = 0;
      manager.watchFile(() => {
        callbackCount++;
      });

      manager.stopWatching();

      // Change file after stopping watcher
      await new Promise(resolve => setTimeout(resolve, 100));
      fs.writeFileSync(yamlFilePath, `projects:\n  - id: new\n    title: New\n    description: New\n    creationDate: "2024-01-01"\n    tags: []\n    pageLink: https://new.com`);
      
      // Wait to ensure callback is not called
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(callbackCount).toBe(0);
    });
  });

  describe('unified operations', () => {
    it('should update project in YAML file', async () => {
      const yamlContent = `projects:
  - id: test-project
    title: Old Title
    description: Old description
    creationDate: "2024-01-01"
    tags: []
    pageLink: https://old.com
`;
      fs.writeFileSync(yamlFilePath, yamlContent);
      const manager = new FileManager(yamlFilePath);

      await manager.readProjects();
      await manager.updateProject('test-project', sampleProject);

      const data = await manager.readProjects();
      expect(data.projects[0].title).toBe('Test Project');
    });

    it('should add project to JSON file', async () => {
      const jsonContent = { projects: [] };
      fs.writeFileSync(jsonFilePath, JSON.stringify(jsonContent));
      const manager = new FileManager(jsonFilePath);

      await manager.readProjects();
      await manager.addProject(sampleProject);

      const data = await manager.readProjects();
      expect(data.projects).toHaveLength(1);
      expect(data.projects[0].id).toBe('test-project');
    });

    it('should delete project from YAML file', async () => {
      const yamlContent = `projects:
  - id: test-project
    title: Test
    description: Test project
    creationDate: "2024-01-01"
    tags: []
    pageLink: https://test.com
  - id: keep-project
    title: Keep
    description: Keep this
    creationDate: "2024-01-02"
    tags: []
    pageLink: https://keep.com
`;
      fs.writeFileSync(yamlFilePath, yamlContent);
      const manager = new FileManager(yamlFilePath);

      await manager.readProjects();
      await manager.deleteProject('test-project');

      const data = await manager.readProjects();
      expect(data.projects).toHaveLength(1);
      expect(data.projects[0].id).toBe('keep-project');
    });
  });
});
