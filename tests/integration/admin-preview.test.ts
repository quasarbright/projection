/**
 * Integration tests for admin preview mode
 * Tests the complete flow of preview mode including postMessage communication
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import request from 'supertest';
import { AdminServer } from '../../src/admin/server';
import { AdminServerConfig } from '../../src/admin/server/types';

describe('Admin Preview Flow Integration', () => {
  let tempDir: string;
  let originalCwd: string;
  let server: AdminServer;
  let projectsFilePath: string;

  beforeEach(async () => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projection-preview-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);

    // Create projects file
    projectsFilePath = path.join(tempDir, 'projects.yaml');
    createProjectsFile();

    // Create config file
    createConfigFile();

    // Create screenshots directory
    fs.mkdirSync(path.join(tempDir, 'screenshots'), { recursive: true });

    // Initialize admin server
    const config: AdminServerConfig = {
      port: 0, // Use random available port
      projectsFilePath,
      configFilePath: path.join(tempDir, 'projection.config.json'),
      autoOpen: false,
      cors: true
    };

    server = new AdminServer(config);
  });

  afterEach(async () => {
    // Stop server
    if (server) {
      await server.stop();
    }

    // Restore original working directory
    process.chdir(originalCwd);

    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  /**
   * Helper function to create a valid projects.yaml file
   */
  function createProjectsFile(): void {
    const content = `
projects:
  - id: "test-project-1"
    title: "Test Project 1"
    description: "First test project"
    creationDate: "2024-01-15"
    tags:
      - "test"
      - "preview"
    pageLink: "https://example.com/project1"
    sourceLink: "https://github.com/user/project1"
    thumbnailLink: "./screenshots/test-project-1.png"
    featured: true
  
  - id: "test-project-2"
    title: "Test Project 2"
    description: "Second test project"
    creationDate: "2024-02-20"
    tags:
      - "test"
    pageLink: "https://example.com/project2"
`;

    fs.writeFileSync(projectsFilePath, content, 'utf-8');
  }

  /**
   * Helper function to create a config file
   */
  function createConfigFile(): void {
    const config = {
      title: "Preview Test Portfolio",
      description: "Testing preview mode",
      baseUrl: "./",
    };
    fs.writeFileSync(path.join(tempDir, 'projection.config.json'), JSON.stringify(config, null, 2), 'utf-8');
  }

  describe('Preview Endpoint', () => {
    it('should return HTML with admin controls when accessing /api/preview', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200)
        .expect('Content-Type', /html/);

      // Verify HTML structure
      expect(response.text).toContain('<!DOCTYPE html>');
      expect(response.text).toContain('<html');
      expect(response.text).toContain('</html>');

      // Verify project content is included
      expect(response.text).toContain('Test Project 1');
      expect(response.text).toContain('Test Project 2');
      expect(response.text).toContain('test-project-1');
      expect(response.text).toContain('test-project-2');
    });

    it('should include admin controls in preview HTML', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      // Verify admin controls are present
      expect(response.text).toContain('admin-controls');
      expect(response.text).toContain('admin-edit');
      expect(response.text).toContain('admin-delete');
      expect(response.text).toContain('admin-create');
    });

    it('should include postMessage script in preview HTML', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      // Verify postMessage communication script is included
      expect(response.text).toContain('window.parent.postMessage');
      expect(response.text).toContain('admin-action');
    });

    it('should include admin styles in preview HTML', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      // Verify admin-specific CSS is included
      expect(response.text).toContain('.admin-controls');
      expect(response.text).toContain('.admin-btn');
      expect(response.text).toContain('.admin-edit');
      expect(response.text).toContain('.admin-delete');
    });

    it('should set X-Frame-Options header to SAMEORIGIN', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('should include create action handler in postMessage script', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      // The create button is in the admin UI, not the preview iframe
      // But the preview should have the handler for create actions
      expect(response.text).toContain('admin-create');
      expect(response.text).toMatch(/action:\s*['"]create['"]/);
    });
  });

  describe('Preview Updates After Data Changes', () => {
    it('should reflect new project in preview after creation', async () => {
      // Get initial preview
      const initialPreview = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      expect(initialPreview.text).not.toContain('test-project-3');

      // Create a new project
      const newProject = {
        id: 'test-project-3',
        title: 'Test Project 3',
        description: 'Third test project',
        creationDate: '2024-03-15',
        tags: ['test', 'new'],
        pageLink: 'https://example.com/project3'
      };

      await request(server.getApp())
        .post('/api/projects')
        .send({ project: newProject })
        .expect(201);

      // Get updated preview
      const updatedPreview = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      expect(updatedPreview.text).toContain('test-project-3');
      expect(updatedPreview.text).toContain('Test Project 3');
      expect(updatedPreview.text).toContain('Third test project');
    });

    it('should reflect updated project in preview after edit', async () => {
      // Update existing project
      const updatedProject = {
        id: 'test-project-1',
        title: 'Updated Project Title',
        description: 'Updated description',
        creationDate: '2024-01-15',
        tags: ['test', 'updated'],
        pageLink: 'https://example.com/updated',
        sourceLink: 'https://github.com/user/updated',
        thumbnailLink: './screenshots/test-project-1.png',
        featured: true
      };

      await request(server.getApp())
        .put('/api/projects/test-project-1')
        .send({ project: updatedProject })
        .expect(200);

      // Get updated preview
      const preview = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      expect(preview.text).toContain('Updated Project Title');
      expect(preview.text).toContain('Updated description');
      expect(preview.text).not.toContain('First test project');
    });

    it('should remove deleted project from preview', async () => {
      // Verify project exists in preview
      const initialPreview = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      expect(initialPreview.text).toContain('test-project-2');

      // Delete the project
      await request(server.getApp())
        .delete('/api/projects/test-project-2')
        .expect(200);

      // Get updated preview
      const updatedPreview = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      expect(updatedPreview.text).not.toContain('test-project-2');
      expect(updatedPreview.text).not.toContain('Test Project 2');
    });
  });

  describe('PostMessage Communication Structure', () => {
    it('should include edit action postMessage for each project', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      // Verify edit button postMessage structure
      expect(response.text).toMatch(/window\.parent\.postMessage\s*\(\s*\{[^}]*type:\s*['"]admin-action['"]/);
      expect(response.text).toMatch(/action:\s*['"]edit['"]/);
      expect(response.text).toMatch(/projectId/);
    });

    it('should include delete action postMessage for each project', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      // Verify delete button postMessage structure
      expect(response.text).toMatch(/action:\s*['"]delete['"]/);
    });

    it('should include create action postMessage for create button', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      // Verify create button postMessage structure
      expect(response.text).toMatch(/action:\s*['"]create['"]/);
    });

    it('should include data-project-id attributes on admin buttons', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      // Verify data attributes for project identification
      expect(response.text).toContain('data-project-id="test-project-1"');
      expect(response.text).toContain('data-project-id="test-project-2"');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when projects file cannot be loaded', async () => {
      // Delete projects file
      fs.unlinkSync(projectsFilePath);

      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Failed to generate preview');
    });

    it('should return 500 when config file is invalid', async () => {
      // Create invalid config file (invalid JSON)
      fs.writeFileSync(
        path.join(tempDir, 'projection.config.json'),
        '{ invalid json syntax',
        'utf-8'
      );

      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Admin Controls Positioning', () => {
    it('should position admin controls on each project card', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      // Verify admin controls are within project cards
      const html = response.text;
      
      // Check that admin-controls div appears for each project
      const controlsMatches = html.match(/class="admin-controls"/g);
      expect(controlsMatches).toBeTruthy();
      expect(controlsMatches!.length).toBeGreaterThanOrEqual(2); // At least 2 projects
    });

    it('should include both edit and delete buttons for each project', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      const html = response.text;
      
      // Count edit and delete buttons
      const editButtons = html.match(/class="[^"]*admin-edit[^"]*"/g);
      const deleteButtons = html.match(/class="[^"]*admin-delete[^"]*"/g);
      
      expect(editButtons).toBeTruthy();
      expect(deleteButtons).toBeTruthy();
      expect(editButtons!.length).toBe(deleteButtons!.length); // Same number of each
      expect(editButtons!.length).toBeGreaterThanOrEqual(2); // At least 2 projects
    });
  });

  describe('Preview Content Validation', () => {
    it('should include all project metadata in preview', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      const html = response.text;

      // Verify all project data is present
      expect(html).toContain('Test Project 1');
      expect(html).toContain('First test project');
      expect(html).toContain('test-project-1');
      expect(html).toContain('https://example.com/project1');
      expect(html).toContain('https://github.com/user/project1');
    });

    it('should apply featured styling to featured projects', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      const html = response.text;

      // Verify featured class is applied
      expect(html).toMatch(/class="[^"]*featured[^"]*"/);
    });

    it('should include all tags for each project', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      const html = response.text;

      // Verify tags are present
      expect(html).toContain('test');
      expect(html).toContain('preview');
    });
  });

  describe('Security Headers', () => {
    it('should set Content-Type header to text/html', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    it('should allow iframe embedding from same origin only', async () => {
      const response = await request(server.getApp())
        .get('/api/preview')
        .expect(200);

      // X-Frame-Options: SAMEORIGIN prevents embedding from other origins
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });
});
