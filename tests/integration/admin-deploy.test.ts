import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import request from 'supertest';
import { AdminServer } from '../../src/admin/server';
import { AdminServerConfig } from '../../src/admin/server/types';
import { execSync } from 'child_process';

describe('Deployment API Integration Tests', () => {
  let tempDir: string;
  let projectsFilePath: string;
  let server: AdminServer;
  let config: AdminServerConfig;
  let isGitRepo: boolean = false;

  beforeEach(() => {
    // Create temporary directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-api-test-'));
    projectsFilePath = path.join(tempDir, 'projects.yaml');

    // Write sample projects file
    const yamlContent = `projects:
  - id: test-project
    title: Test Project
    description: A test project
    creationDate: "2024-01-01"
    tags:
      - test
    pageLink: https://example.com
`;
    fs.writeFileSync(projectsFilePath, yamlContent);

    // Create server config
    config = {
      port: 0,
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

  describe('GET /api/deploy/status', () => {
    it('should return deployment status with all required fields', async () => {
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
      expect(typeof response.body.ready).toBe('boolean');
      expect(typeof response.body.gitInstalled).toBe('boolean');
    });

    it('should indicate not ready when not a Git repository', async () => {
      const response = await request(server.getApp())
        .get('/api/deploy/status')
        .expect(200);

      expect(response.body.ready).toBe(false);
      expect(response.body.isGitRepo).toBe(false);
      expect(response.body.issues).toBeDefined();
      expect(response.body.issues).toContain('Not a Git repository');
    });

    it('should indicate not ready when no remote configured', async () => {
      // Initialize Git repo but don't add remote
      try {
        execSync('git init', { cwd: tempDir, stdio: 'ignore' });
        isGitRepo = true;
      } catch (error) {
        // Git not available, skip this test
        return;
      }

      const response = await request(server.getApp())
        .get('/api/deploy/status')
        .expect(200);

      expect(response.body.ready).toBe(false);
      expect(response.body.isGitRepo).toBe(true);
      expect(response.body.hasRemote).toBe(false);
      expect(response.body.issues).toContain('No Git remote configured');
    });

    it('should return deployment config when Git is properly configured', async () => {
      // Initialize Git repo with remote
      try {
        execSync('git init', { cwd: tempDir, stdio: 'ignore' });
        execSync('git remote add origin https://github.com/test/repo.git', {
          cwd: tempDir,
          stdio: 'ignore'
        });
        isGitRepo = true;
      } catch (error) {
        // Git not available, skip this test
        return;
      }

      const response = await request(server.getApp())
        .get('/api/deploy/status')
        .expect(200);

      expect(response.body.isGitRepo).toBe(true);
      expect(response.body.hasRemote).toBe(true);
      expect(response.body.remoteUrl).toBe('https://github.com/test/repo.git');
      
      // Should have deployment config if everything is set up
      if (response.body.ready) {
        expect(response.body.deployConfig).toBeDefined();
        expect(response.body.deployConfig.branch).toBeDefined();
        expect(response.body.deployConfig.baseUrl).toBeDefined();
      }
    });

    it('should handle errors gracefully', async () => {
      // This should not crash even if there are issues
      const response = await request(server.getApp())
        .get('/api/deploy/status')
        .expect(200);

      expect(response.body).toHaveProperty('ready');
      expect(response.body).toHaveProperty('gitInstalled');
    });
  });

  describe('POST /api/deploy', () => {
    it('should validate request body structure', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({ force: 'not-a-boolean' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('force must be a boolean');
    });

    it('should validate message field type', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({ message: 12345 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('message must be a string');
    });

    it('should accept empty request body', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({});

      // Will fail due to Git not configured, but request format is valid
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
    });

    it('should accept valid deployment options', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({
          force: true,
          message: 'Test deployment'
        });

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      
      // Will fail because temp dir is not properly configured
      if (!response.body.success) {
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should fail when Git is not configured', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({})
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
      expect(response.body.error).toBeDefined();
    });

    it('should return error details on failure', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({});

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('duration');
    });

    it('should categorize Git errors appropriately', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({});

      if (!response.body.success) {
        expect(response.body.error.code).toMatch(/GIT_ERROR|BUILD_ERROR|DEPLOYMENT_ERROR/);
      }
    });

    it('should handle force deployment option', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({ force: true });

      // Request should be processed (even if it fails due to Git config)
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
    });

    it('should handle custom commit message', async () => {
      const customMessage = 'Deploy version 1.0.0';
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({ message: customMessage });

      // Request should be processed
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
    });

    it('should return deployment duration', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({});

      expect(response.body).toHaveProperty('duration');
      expect(typeof response.body.duration).toBe('number');
      expect(response.body.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Deployment Error Scenarios', () => {
    it('should handle missing projects file', async () => {
      // Delete projects file
      fs.unlinkSync(projectsFilePath);

      const response = await request(server.getApp())
        .get('/api/deploy/status')
        .expect(200);

      expect(response.body.ready).toBe(false);
      expect(response.body.issues).toContain('No projects file found');
    });

    it('should handle invalid Git configuration', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({});

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should provide helpful error messages', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({});

      if (!response.body.success) {
        expect(response.body.error.message).toBeDefined();
        expect(response.body.error.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe('API Response Format', () => {
    it('should return consistent status response format', async () => {
      const response = await request(server.getApp())
        .get('/api/deploy/status')
        .expect(200);

      // Check all required fields are present
      const requiredFields = [
        'ready',
        'gitInstalled',
        'isGitRepo',
        'hasRemote',
        'remoteName',
        'remoteUrl',
        'currentBranch'
      ];

      requiredFields.forEach(field => {
        expect(response.body).toHaveProperty(field);
      });
    });

    it('should return consistent deployment response format', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({});

      // Check required fields
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('duration');

      if (!response.body.success) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error).toHaveProperty('message');
      }
    });

    it('should include issues array when deployment is not ready', async () => {
      const response = await request(server.getApp())
        .get('/api/deploy/status')
        .expect(200);

      if (!response.body.ready) {
        expect(response.body.issues).toBeDefined();
        expect(Array.isArray(response.body.issues)).toBe(true);
        expect(response.body.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Content-Type Headers', () => {
    it('should return JSON for status endpoint', async () => {
      const response = await request(server.getApp())
        .get('/api/deploy/status')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return JSON for deploy endpoint', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .send({});

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should accept JSON request body', async () => {
      const response = await request(server.getApp())
        .post('/api/deploy')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ force: false }));

      expect(response.body).toHaveProperty('success');
    });
  });
});
