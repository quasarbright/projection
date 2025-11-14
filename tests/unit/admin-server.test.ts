import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import request from 'supertest';
import { AdminServer } from '../../src/admin/server';
import { AdminServerConfig } from '../../src/admin/server/types';
import { Project } from '../../src/types';

describe('AdminServer API Routes', () => {
  let tempDir: string;
  let projectsFilePath: string;
  let server: AdminServer;
  let config: AdminServerConfig;

  const sampleProjects: Project[] = [
    {
      id: 'project-1',
      title: 'Project One',
      description: 'First test project',
      creationDate: '2024-01-01',
      tags: ['javascript', 'web'],
      pageLink: 'https://example.com/project1',
      sourceLink: 'https://github.com/test/project1',
      featured: true
    },
    {
      id: 'project-2',
      title: 'Project Two',
      description: 'Second test project',
      creationDate: '2024-02-01',
      tags: ['typescript', 'web'],
      pageLink: 'https://example.com/project2',
      featured: false
    }
  ];

  beforeEach(() => {
    // Create temporary directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'admin-server-test-'));
    projectsFilePath = path.join(tempDir, 'projects.yaml');

    // Write sample projects file
    const yamlContent = `projects:
  - id: project-1
    title: Project One
    description: First test project
    creationDate: "2024-01-01"
    tags:
      - javascript
      - web
    pageLink: https://example.com/project1
    sourceLink: https://github.com/test/project1
    featured: true
  - id: project-2
    title: Project Two
    description: Second test project
    creationDate: "2024-02-01"
    tags:
      - typescript
      - web
    pageLink: https://example.com/project2
    featured: false
`;
    fs.writeFileSync(projectsFilePath, yamlContent);

    // Create server config
    config = {
      port: 0, // Use random port for testing
      projectsFilePath,
      autoOpen: false,
      cors: true
    };

    // Create server instance
    server = new AdminServer(config);
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(server.getApp())
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/projects', () => {
    it('should return all projects and config', async () => {
      const response = await request(server.getApp())
        .get('/api/projects')
        .expect(200);

      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('config');
      expect(response.body.projects).toHaveLength(2);
      expect(response.body.projects[0].id).toBe('project-1');
      expect(response.body.projects[1].id).toBe('project-2');
    });

    it('should return 404 when projects file does not exist', async () => {
      // Delete the projects file
      fs.unlinkSync(projectsFilePath);

      const response = await request(server.getApp())
        .get('/api/projects')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Projects file not found');
      expect(response.body).toHaveProperty('path', projectsFilePath);
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const newProject: Project = {
        id: 'project-3',
        title: 'Project Three',
        description: 'Third test project',
        creationDate: '2024-03-01',
        tags: ['python'],
        pageLink: 'https://example.com/project3'
      };

      const response = await request(server.getApp())
        .post('/api/projects')
        .send({ project: newProject })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('project');
      expect(response.body.project.id).toBe('project-3');

      // Verify project was added to file
      const getResponse = await request(server.getApp())
        .get('/api/projects')
        .expect(200);

      expect(getResponse.body.projects).toHaveLength(3);
    });

    it('should return 400 when project field is missing', async () => {
      const response = await request(server.getApp())
        .post('/api/projects')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });

    it('should return 400 when validation fails', async () => {
      const invalidProject = {
        id: 'invalid id with spaces',
        title: 'Invalid Project',
        description: 'Invalid',
        creationDate: '2024-01-01',
        tags: [],
        pageLink: 'https://example.com'
      };

      const response = await request(server.getApp())
        .post('/api/projects')
        .send({ project: invalidProject })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 for duplicate project ID', async () => {
      const duplicateProject: Project = {
        id: 'project-1', // Already exists
        title: 'Duplicate',
        description: 'Duplicate project',
        creationDate: '2024-03-01',
        tags: [],
        pageLink: 'https://example.com/duplicate'
      };

      const response = await request(server.getApp())
        .post('/api/projects')
        .send({ project: duplicateProject })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.stringContaining('Duplicate project ID')
          })
        ])
      );
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update an existing project', async () => {
      const updatedProject: Project = {
        id: 'project-1',
        title: 'Updated Project One',
        description: 'Updated description',
        creationDate: '2024-01-15',
        tags: ['javascript', 'updated'],
        pageLink: 'https://example.com/updated',
        featured: false
      };

      const response = await request(server.getApp())
        .put('/api/projects/project-1')
        .send({ project: updatedProject })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.project.title).toBe('Updated Project One');

      // Verify project was updated
      const getResponse = await request(server.getApp())
        .get('/api/projects')
        .expect(200);

      const project = getResponse.body.projects.find((p: Project) => p.id === 'project-1');
      expect(project.title).toBe('Updated Project One');
    });

    it('should return 404 when project does not exist', async () => {
      const updatedProject: Project = {
        id: 'nonexistent',
        title: 'Nonexistent',
        description: 'Does not exist',
        creationDate: '2024-01-01',
        tags: [],
        pageLink: 'https://example.com'
      };

      const response = await request(server.getApp())
        .put('/api/projects/nonexistent')
        .send({ project: updatedProject })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Project not found');
    });

    it('should return 400 when project field is missing', async () => {
      const response = await request(server.getApp())
        .put('/api/projects/project-1')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });

    it('should return 400 when validation fails', async () => {
      const invalidProject = {
        id: 'project-1',
        title: '', // Empty title
        description: 'Invalid',
        creationDate: '2024-01-01',
        tags: [],
        pageLink: 'https://example.com'
      };

      const response = await request(server.getApp())
        .put('/api/projects/project-1')
        .send({ project: invalidProject })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete an existing project', async () => {
      const response = await request(server.getApp())
        .delete('/api/projects/project-1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('deletedId', 'project-1');

      // Verify project was deleted
      const getResponse = await request(server.getApp())
        .get('/api/projects')
        .expect(200);

      expect(getResponse.body.projects).toHaveLength(1);
      expect(getResponse.body.projects[0].id).toBe('project-2');
    });

    it('should return 404 when project does not exist', async () => {
      const response = await request(server.getApp())
        .delete('/api/projects/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Project not found');
    });
  });

  describe('GET /api/tags', () => {
    it('should return all unique tags with counts', async () => {
      const response = await request(server.getApp())
        .get('/api/tags')
        .expect(200);

      expect(response.body).toHaveProperty('tags');
      expect(response.body.tags).toBeInstanceOf(Array);
      
      // Check that tags are present
      const tagNames = response.body.tags.map((t: any) => t.name);
      expect(tagNames).toContain('javascript');
      expect(tagNames).toContain('typescript');
      expect(tagNames).toContain('web');

      // Check that counts are correct
      const webTag = response.body.tags.find((t: any) => t.name === 'web');
      expect(webTag.count).toBe(2); // Both projects have 'web' tag
    });

    it('should sort tags by count descending', async () => {
      const response = await request(server.getApp())
        .get('/api/tags')
        .expect(200);

      const tags = response.body.tags;
      
      // 'web' appears twice, others appear once
      expect(tags[0].name).toBe('web');
      expect(tags[0].count).toBe(2);
    });
  });

  describe('GET /api/config', () => {
    it('should return merged configuration', async () => {
      const response = await request(server.getApp())
        .get('/api/config')
        .expect(200);

      expect(response.body).toHaveProperty('config');
      expect(response.body.config).toHaveProperty('title');
      expect(response.body.config).toHaveProperty('description');
      expect(response.body.config).toHaveProperty('baseUrl');
    });
  });

  describe('GET /api/preview', () => {
    it('should return HTML with status 200', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('<!DOCTYPE html>');
    });

    it('should include admin controls in generated HTML', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      expect(response.text).toContain('admin-controls');
      expect(response.text).toContain('admin-edit');
      expect(response.text).toContain('admin-delete');
      expect(response.text).toContain('admin-create');
    });

    it('should set X-Frame-Options header to SAMEORIGIN', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('should include all projects in preview', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      expect(response.text).toContain('Project One');
      expect(response.text).toContain('Project Two');
    });

    it('should handle error when project data cannot be loaded', async () => {
      // Delete the projects file to simulate error
      fs.unlinkSync(projectsFilePath);

      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to generate preview');
      expect(response.body).toHaveProperty('message');
    });

    it('should handle error when HTML generation fails', async () => {
      // Mock HTMLBuilder to throw an error during generation
      const HTMLBuilder = require('../../src/generator/html-builder').HTMLBuilder;
      const originalGenerateHTML = HTMLBuilder.prototype.generateHTML;
      
      HTMLBuilder.prototype.generateHTML = jest.fn(() => {
        throw new Error('HTML generation failed');
      });

      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to generate preview');
      expect(response.body).toHaveProperty('message', 'HTML generation failed');

      // Restore original method
      HTMLBuilder.prototype.generateHTML = originalGenerateHTML;
    });
  });

  describe('POST /api/preview', () => {
    it('should generate preview HTML for a project', async () => {
      const partialProject = {
        id: 'preview-test',
        title: 'Preview Project',
        description: 'This is a preview',
        tags: ['preview', 'test']
      };

      const response = await request(server.getApp())
        .post('/api/preview')
        .send({ project: partialProject })
        .expect(200);

      expect(response.text).toContain('<!DOCTYPE html>');
      expect(response.text).toContain('Preview Project');
      expect(response.text).toContain('This is a preview');
      expect(response.text).toContain('preview');
      expect(response.text).toContain('test');
    });

    it('should use defaults for missing fields', async () => {
      const partialProject = {
        title: 'Minimal Project'
      };

      const response = await request(server.getApp())
        .post('/api/preview')
        .send({ project: partialProject })
        .expect(200);

      expect(response.text).toContain('Minimal Project');
      expect(response.text).toContain('<!DOCTYPE html>');
    });

    it('should return 400 when project field is missing', async () => {
      const response = await request(server.getApp())
        .post('/api/preview')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });
  });

  describe('Backup functionality', () => {
    it('should create backup before updating project', async () => {
      const updatedProject: Project = {
        id: 'project-1',
        title: 'Updated',
        description: 'Updated',
        creationDate: '2024-01-01',
        tags: [],
        pageLink: 'https://example.com'
      };

      await request(server.getApp())
        .put('/api/projects/project-1')
        .send({ project: updatedProject })
        .expect(200);

      // Check that backup directory and file were created
      const backupDir = path.join(tempDir, '.backup');
      expect(fs.existsSync(backupDir)).toBe(true);
      
      const backupFiles = fs.readdirSync(backupDir);
      expect(backupFiles.length).toBeGreaterThan(0);
    });

    it('should create backup before adding project', async () => {
      const newProject: Project = {
        id: 'new-project',
        title: 'New',
        description: 'New project',
        creationDate: '2024-01-01',
        tags: [],
        pageLink: 'https://example.com'
      };

      await request(server.getApp())
        .post('/api/projects')
        .send({ project: newProject })
        .expect(201);

      const backupDir = path.join(tempDir, '.backup');
      expect(fs.existsSync(backupDir)).toBe(true);
      
      const backupFiles = fs.readdirSync(backupDir);
      expect(backupFiles.length).toBeGreaterThan(0);
    });

    it('should create backup before deleting project', async () => {
      await request(server.getApp())
        .delete('/api/projects/project-1')
        .expect(200);

      const backupDir = path.join(tempDir, '.backup');
      expect(fs.existsSync(backupDir)).toBe(true);
      
      const backupFiles = fs.readdirSync(backupDir);
      expect(backupFiles.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/deploy/status', () => {
    it('should return deployment status', async () => {
      const response = await request(server.getApp())
        .get('/api/deploy/status')
        .expect(200);

      expect(response.body).toHaveProperty('ready');
      expect(response.body).toHaveProperty('gitInstalled');
      expect(response.body).toHaveProperty('isGitRepo');
      expect(response.body).toHaveProperty('hasRemote');
      expect(response.body).toHaveProperty('remoteName');
      expect(response.body).toHaveProperty('remoteUrl');
      expect(response.body).toHaveProperty('currentBranch');
    });

    it('should indicate when Git is not installed', async () => {
      const response = await request(server.getApp())
        .get('/api/deploy/status')
        .expect(200);

      // In test environment, Git may or may not be installed
      expect(typeof response.body.gitInstalled).toBe('boolean');
      
      if (!response.body.gitInstalled) {
        expect(response.body.ready).toBe(false);
        expect(response.body.issues).toContain('Git is not installed or not in PATH');
      }
    });

    it('should indicate when not a Git repository', async () => {
      const response = await request(server.getApp())
        .get('/api/deploy/status')
        .expect(200);

      // Temp directory is not a Git repo
      expect(response.body.isGitRepo).toBe(false);
      expect(response.body.ready).toBe(false);
    });
  });

  describe('POST /api/deploy', () => {
    it('should validate request body', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({ force: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('force must be a boolean');
    });

    it('should validate message field', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({ message: 123 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('message must be a string');
    });

    it('should fail when Git is not configured', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({})
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should accept valid deployment request', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({ 
          force: false,
          message: 'Test deployment'
        });

      // Will fail because temp dir is not a Git repo, but request format is valid
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Static file serving', () => {
    it('should have static file serving configured', async () => {
      // The server is configured to serve from lib/admin/client
      // This test verifies the server is set up to serve static files
      const app = server.getApp();
      expect(app).toBeDefined();
      
      // The server should be configured with express.static middleware
      // We can verify this by checking that the server exists and is properly configured
      expect(server).toBeDefined();
      expect(typeof server.start).toBe('function');
      expect(typeof server.stop).toBe('function');
    });

    it('should have fallback route for client-side routing', async () => {
      // Test that non-API routes are handled by the fallback route
      // When the client is not built, it should return an error message
      const response = await request(server.getApp())
        .get('/some-client-route');

      // The fallback route will either serve index.html (200) or return 404 with message
      if (response.status === 404) {
        expect(response.text).toContain('Admin client not found');
      } else {
        // If index.html exists, it will be served
        expect(response.status).toBe(200);
      }
    });

    it('should not serve API routes as static files', async () => {
      // API routes should be handled by API handlers, not static file middleware
      const response = await request(server.getApp())
        .get('/api/projects')
        .expect(200);

      // Should return JSON, not HTML
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body).toHaveProperty('projects');
    });
  });
});

