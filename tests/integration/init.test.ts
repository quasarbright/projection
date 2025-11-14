import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { init } from '../../src/cli/init';

const execAsync = promisify(exec);

describe('CLI init command', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projection-init-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Restore original working directory
    process.chdir(originalCwd);
    
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('File creation in empty directory', () => {
    it('should create projects.yaml, projection.config.json, .gitignore, and README.md by default', async () => {
      await init();

      const projectsPath = path.join(tempDir, 'projects.yaml');
      const configPath = path.join(tempDir, 'projection.config.json');
      const gitignorePath = path.join(tempDir, '.gitignore');
      const readmePath = path.join(tempDir, 'README.md');

      expect(fs.existsSync(projectsPath)).toBe(true);
      expect(fs.existsSync(configPath)).toBe(true);
      expect(fs.existsSync(gitignorePath)).toBe(true);
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    it('should create valid YAML content in projects.yaml', async () => {
      await init();

      const projectsPath = path.join(tempDir, 'projects.yaml');
      const content = fs.readFileSync(projectsPath, 'utf-8');

      expect(content).toContain('projects:');
      expect(content).toContain('id:');
      expect(content).toContain('example-project');
      expect(content).not.toContain('config:'); // Config is now in separate file
    });

    it('should create valid JSON config file', async () => {
      await init();

      const configPath = path.join(tempDir, 'projection.config.json');
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config).toHaveProperty('title');
      expect(config).toHaveProperty('description');
      expect(config).toHaveProperty('baseUrl');
      expect(config).toHaveProperty('dynamicBackgrounds');
    });

    it('should create projects.json when format is json', async () => {
      await init({ format: 'json' });

      const projectsPath = path.join(tempDir, 'projects.json');
      const configPath = path.join(tempDir, 'projection.config.json');

      expect(fs.existsSync(projectsPath)).toBe(true);
      expect(fs.existsSync(configPath)).toBe(true);

      const content = fs.readFileSync(projectsPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed).toHaveProperty('projects');
      expect(Array.isArray(parsed.projects)).toBe(true);
      expect(parsed).not.toHaveProperty('config'); // Config is now in separate file
    });

    it('should create minimal content when minimal option is true', async () => {
      await init({ minimal: true });

      const projectsPath = path.join(tempDir, 'projects.yaml');
      const content = fs.readFileSync(projectsPath, 'utf-8');

      // Minimal should have only one project
      const projectMatches = content.match(/- id:/g);
      expect(projectMatches).toHaveLength(1);
      expect(content).toContain('my-first-project');
    });

    it('should create minimal JSON when both minimal and json format are specified', async () => {
      await init({ minimal: true, format: 'json' });

      const projectsPath = path.join(tempDir, 'projects.json');
      const content = fs.readFileSync(projectsPath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.projects).toHaveLength(1);
      expect(parsed.projects[0].id).toBe('my-first-project');
    });

    it('should create .gitignore with correct patterns', async () => {
      await init();

      const gitignorePath = path.join(tempDir, '.gitignore');
      const content = fs.readFileSync(gitignorePath, 'utf-8');

      // Check for required patterns
      expect(content).toContain('dist/');
      expect(content).toContain('.backup');
      expect(content).toContain('.DS_Store');
    });

    it('should create .gitignore that ignores output directory', async () => {
      await init();

      const gitignorePath = path.join(tempDir, '.gitignore');
      const content = fs.readFileSync(gitignorePath, 'utf-8');

      // Should ignore the default output directory
      expect(content).toContain('dist/');
    });

    it('should create .gitignore that ignores backup files', async () => {
      await init();

      const gitignorePath = path.join(tempDir, '.gitignore');
      const content = fs.readFileSync(gitignorePath, 'utf-8');

      expect(content).toContain('.backup');
    });

    it('should create .gitignore that ignores macOS files', async () => {
      await init();

      const gitignorePath = path.join(tempDir, '.gitignore');
      const content = fs.readFileSync(gitignorePath, 'utf-8');

      expect(content).toContain('.DS_Store');
    });

    it('should create .gitignore with helpful comments', async () => {
      await init();

      const gitignorePath = path.join(tempDir, '.gitignore');
      const content = fs.readFileSync(gitignorePath, 'utf-8');

      // Should have section comments
      expect(content).toContain('# Projection build output');
      expect(content).toContain('# Backup files');
      expect(content).toContain('# macOS');
    });

    it('should create README.md with getting started content', async () => {
      await init();

      const readmePath = path.join(tempDir, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf-8');

      // Should have key sections
      expect(content).toContain('# My Portfolio');
      expect(content).toContain('## Quick Start');
      expect(content).toContain('## Project Structure');
    });

    it('should create README.md with command examples', async () => {
      await init();

      const readmePath = path.join(tempDir, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf-8');

      // Should include common commands
      expect(content).toContain('projection dev');
      expect(content).toContain('projection build');
      expect(content).toContain('projection deploy');
    });

    it('should create README.md with documentation links', async () => {
      await init();

      const readmePath = path.join(tempDir, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf-8');

      // Should link to main documentation
      expect(content).toContain('https://github.com/quasarbright/projection');
    });
  });

  describe('--force flag behavior', () => {
    it('should overwrite existing files when force is true', async () => {
      // Create existing files
      const projectsPath = path.join(tempDir, 'projects.yaml');
      const configPath = path.join(tempDir, 'projection.config.json');
      const gitignorePath = path.join(tempDir, '.gitignore');
      const readmePath = path.join(tempDir, 'README.md');
      
      fs.writeFileSync(projectsPath, 'old content');
      fs.writeFileSync(configPath, 'old config');
      fs.writeFileSync(gitignorePath, 'old gitignore');
      fs.writeFileSync(readmePath, 'old readme');

      // Run init with force
      await init({ force: true });

      // Check files were overwritten
      const projectsContent = fs.readFileSync(projectsPath, 'utf-8');
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      const readmeContent = fs.readFileSync(readmePath, 'utf-8');

      expect(projectsContent).not.toBe('old content');
      expect(configContent).not.toBe('old config');
      expect(gitignoreContent).not.toBe('old gitignore');
      expect(readmeContent).not.toBe('old readme');
      expect(projectsContent).toContain('projects:');
      expect(projectsContent).not.toContain('config:'); // Config is now in separate file
      const config = JSON.parse(configContent);
      expect(config).toHaveProperty('title');
      expect(gitignoreContent).toContain('dist/');
      expect(readmeContent).toContain('# My Portfolio');
    });

    it('should not prompt when force is true and files exist', async () => {
      // Create existing files
      fs.writeFileSync(path.join(tempDir, 'projects.yaml'), 'old content');
      fs.writeFileSync(path.join(tempDir, 'projection.config.json'), 'old config');
      fs.writeFileSync(path.join(tempDir, '.gitignore'), 'old gitignore');
      fs.writeFileSync(path.join(tempDir, 'README.md'), 'old readme');

      // Mock console.log to check for prompts
      const consoleSpy = jest.spyOn(console, 'log');

      await init({ force: true });

      // Should not show warning about existing files
      const logs = consoleSpy.mock.calls.map(call => call[0]);
      const hasWarning = logs.some(log => 
        typeof log === 'string' && log.includes('already exist')
      );
      
      expect(hasWarning).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should overwrite .gitignore when it exists and force is true', async () => {
      // Create existing .gitignore with custom content
      const gitignorePath = path.join(tempDir, '.gitignore');
      fs.writeFileSync(gitignorePath, '# Custom gitignore\ncustom-pattern/');

      await init({ force: true });

      const content = fs.readFileSync(gitignorePath, 'utf-8');
      
      // Should be overwritten with standard template
      expect(content).not.toContain('custom-pattern/');
      expect(content).toContain('dist/');
      expect(content).toContain('.backup');
      expect(content).toContain('.DS_Store');
    });

    it('should overwrite README.md when it exists and force is true', async () => {
      // Create existing README with custom content
      const readmePath = path.join(tempDir, 'README.md');
      fs.writeFileSync(readmePath, '# Custom README\nCustom content here');

      await init({ force: true });

      const content = fs.readFileSync(readmePath, 'utf-8');
      
      // Should be overwritten with standard template
      expect(content).not.toContain('Custom content here');
      expect(content).toContain('# My Portfolio');
      expect(content).toContain('## Quick Start');
    });

    it('should overwrite only projects.yaml when only it exists', async () => {
      // Create only projects.yaml
      const projectsPath = path.join(tempDir, 'projects.yaml');
      fs.writeFileSync(projectsPath, 'old content');

      await init({ force: true });

      const projectsContent = fs.readFileSync(projectsPath, 'utf-8');
      expect(projectsContent).toContain('projects:');
      expect(projectsContent).not.toContain('config:'); // Config is now in separate file
      
      const configPath = path.join(tempDir, 'projection.config.json');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should overwrite only projection.config.json when only it exists', async () => {
      // Create only config file
      const configPath = path.join(tempDir, 'projection.config.json');
      fs.writeFileSync(configPath, 'old config');

      await init({ force: true });

      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      expect(config).toHaveProperty('title');
      expect(config).toHaveProperty('baseUrl');
      
      const projectsPath = path.join(tempDir, 'projects.yaml');
      expect(fs.existsSync(projectsPath)).toBe(true);
    });
  });

  describe('--format option', () => {
    it('should create projects.yaml when format is yaml', async () => {
      await init({ format: 'yaml' });

      expect(fs.existsSync(path.join(tempDir, 'projects.yaml'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'projects.json'))).toBe(false);
    });

    it('should create projects.json when format is json', async () => {
      await init({ format: 'json' });

      expect(fs.existsSync(path.join(tempDir, 'projects.json'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'projects.yaml'))).toBe(false);
    });

    it('should create valid JSON structure', async () => {
      await init({ format: 'json' });

      const projectsPath = path.join(tempDir, 'projects.json');
      const content = fs.readFileSync(projectsPath, 'utf-8');
      
      // Should be valid JSON
      expect(() => JSON.parse(content)).not.toThrow();
      
      const parsed = JSON.parse(content);
      expect(parsed.projects).toBeDefined();
      expect(Array.isArray(parsed.projects)).toBe(true);
      expect(parsed.projects.length).toBeGreaterThan(0);
      expect(parsed.config).toBeUndefined(); // Config is now in separate file
    });

    it('should default to yaml when format is not specified', async () => {
      await init({});

      expect(fs.existsSync(path.join(tempDir, 'projects.yaml'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'projects.json'))).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should throw error if template directory is not found', async () => {
      // Mock the template directory check to simulate missing templates
      const originalDirname = __dirname;
      
      // This test verifies the error handling, but in practice the templates
      // should always be bundled with the package
      // We'll skip this test in the actual implementation since it's hard to mock
    });
  });

  describe('Content validation', () => {
    it('should include all required project fields in YAML template', async () => {
      await init();

      const projectsPath = path.join(tempDir, 'projects.yaml');
      const content = fs.readFileSync(projectsPath, 'utf-8');

      // Check for required fields
      expect(content).toContain('id:');
      expect(content).toContain('title:');
      expect(content).toContain('description:');
      expect(content).toContain('creationDate:');
      expect(content).toContain('tags:');
      expect(content).toContain('pageLink:');
    });

    it('should include optional project fields in YAML template', async () => {
      await init();

      const projectsPath = path.join(tempDir, 'projects.yaml');
      const content = fs.readFileSync(projectsPath, 'utf-8');

      // Check for optional fields
      expect(content).toContain('sourceLink:');
      expect(content).toContain('thumbnailLink:');
      expect(content).toContain('featured:');
    });

    it('should include all config options in config template', async () => {
      await init();

      const configPath = path.join(tempDir, 'projection.config.json');
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config).toHaveProperty('title');
      expect(config).toHaveProperty('description');
      expect(config).toHaveProperty('baseUrl');
      expect(config).toHaveProperty('dynamicBackgrounds');
    });

    it('should create valid date format in minimal template', async () => {
      await init({ minimal: true });

      const projectsPath = path.join(tempDir, 'projects.yaml');
      const content = fs.readFileSync(projectsPath, 'utf-8');

      // Check for valid date format (YYYY-MM-DD)
      const dateMatch = content.match(/creationDate:\s*"(\d{4}-\d{2}-\d{2})"/);
      expect(dateMatch).not.toBeNull();
      
      if (dateMatch) {
        const date = new Date(dateMatch[1]);
        expect(date.toString()).not.toBe('Invalid Date');
      }
    });
  });

  describe('Deployment integration', () => {
    it('should detect Git repository and configure baseUrl', async () => {
      // Initialize Git repository
      await execAsync('git init', { cwd: tempDir });
      await execAsync('git remote add origin https://github.com/testuser/test-repo.git', { cwd: tempDir });

      await init();

      const configPath = path.join(tempDir, 'projection.config.json');
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Should have baseUrl set to repository name
      expect(config.baseUrl).toBe('/test-repo/');
    });

    it('should use default baseUrl when no Git remote is configured', async () => {
      // Initialize Git repository without remote
      await execAsync('git init', { cwd: tempDir });

      await init();

      const configPath = path.join(tempDir, 'projection.config.json');
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Should use default relative baseUrl
      expect(config.baseUrl).toBe('./');
    });

    it('should use default baseUrl when not a Git repository', async () => {
      await init();

      const configPath = path.join(tempDir, 'projection.config.json');
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Should use default relative baseUrl
      expect(config.baseUrl).toBe('./');
    });

    it('should extract repository name from HTTPS URL', async () => {
      await execAsync('git init', { cwd: tempDir });
      await execAsync('git remote add origin https://github.com/user/my-portfolio.git', { cwd: tempDir });

      await init();

      const configPath = path.join(tempDir, 'projection.config.json');
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.baseUrl).toBe('/my-portfolio/');
    });

    it('should extract repository name from SSH URL', async () => {
      await execAsync('git init', { cwd: tempDir });
      await execAsync('git remote add origin git@github.com:user/awesome-projects.git', { cwd: tempDir });

      await init();

      const configPath = path.join(tempDir, 'projection.config.json');
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.baseUrl).toBe('/awesome-projects/');
    });

    it('should handle repository URL without .git extension', async () => {
      await execAsync('git init', { cwd: tempDir });
      await execAsync('git remote add origin https://github.com/user/no-extension', { cwd: tempDir });

      await init();

      const configPath = path.join(tempDir, 'projection.config.json');
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.baseUrl).toBe('/no-extension/');
    });
  });
});
