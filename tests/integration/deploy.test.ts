import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { deploy } from '../../src/cli/deploy';
import { execSync } from 'child_process';

// Mock gh-pages to avoid actual deployment
jest.mock('gh-pages', () => ({
  publish: jest.fn((dir, options, callback) => {
    // Simulate successful deployment
    callback(null);
  })
}));

describe('CLI deploy command integration', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projection-deploy-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);

    // Initialize a git repository
    execSync('git init', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'ignore' });
    execSync('git remote add origin https://github.com/test/test-repo.git', { cwd: tempDir, stdio: 'ignore' });
  });

  afterEach(() => {
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
config:
  title: "Test Projects"
  description: "Test portfolio"
  baseUrl: "/test-repo/"

projects:
  - id: "test-project-1"
    title: "Test Project 1"
    description: "A test project"
    creationDate: "2024-01-15"
    tags:
      - "test"
    pageLink: "https://example.com/project1"
`;
    
    fs.writeFileSync(
      path.join(tempDir, 'projects.yaml'),
      content,
      'utf-8'
    );
  }

  /**
   * Helper function to create a pre-built dist directory
   */
  function createDistDirectory(): void {
    const distDir = path.join(tempDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(
      path.join(distDir, 'index.html'),
      '<html><body>Test</body></html>',
      'utf-8'
    );
  }

  it('should validate Git installation', async () => {
    createProjectsFile();
    createDistDirectory();

    // This should succeed since Git is installed in the test environment
    await expect(deploy({ noBuild: true })).resolves.not.toThrow();
  });

  it('should validate Git repository exists', async () => {
    // Remove .git directory to simulate no repository
    const gitDir = path.join(tempDir, '.git');
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true });
    }

    createProjectsFile();
    createDistDirectory();

    await expect(deploy({ noBuild: true })).rejects.toThrow();
  });

  it('should validate Git remote is configured', async () => {
    // Remove the remote
    execSync('git remote remove origin', { cwd: tempDir, stdio: 'ignore' });

    createProjectsFile();
    createDistDirectory();

    await expect(deploy({ noBuild: true })).rejects.toThrow();
  });

  it('should validate projects file exists', async () => {
    createDistDirectory();

    // No projects file created
    await expect(deploy({ noBuild: true })).rejects.toThrow();
  });

  it('should support dry-run mode', async () => {
    createProjectsFile();
    createDistDirectory();

    // Dry run should complete without errors
    await expect(deploy({ noBuild: true, dryRun: true })).resolves.not.toThrow();
  });

  it('should skip build when --no-build flag is set', async () => {
    createProjectsFile();
    createDistDirectory();

    // Should use existing dist directory
    await expect(deploy({ noBuild: true })).resolves.not.toThrow();
    
    // Verify dist directory still exists
    expect(fs.existsSync(path.join(tempDir, 'dist'))).toBe(true);
  });

  it('should accept custom branch option', async () => {
    createProjectsFile();
    createDistDirectory();

    await expect(deploy({ 
      noBuild: true, 
      branch: 'main' 
    })).resolves.not.toThrow();
  });

  it('should accept custom remote option', async () => {
    // Add another remote
    execSync('git remote add upstream https://github.com/test/upstream.git', { cwd: tempDir, stdio: 'ignore' });
    
    createProjectsFile();
    createDistDirectory();

    await expect(deploy({ 
      noBuild: true, 
      remote: 'upstream' 
    })).resolves.not.toThrow();
  });

  it('should accept custom build directory', async () => {
    createProjectsFile();
    
    // Create custom build directory
    const buildDir = path.join(tempDir, 'build');
    fs.mkdirSync(buildDir, { recursive: true });
    fs.writeFileSync(
      path.join(buildDir, 'index.html'),
      '<html><body>Test</body></html>',
      'utf-8'
    );

    await expect(deploy({ 
      noBuild: true, 
      dir: 'build' 
    })).resolves.not.toThrow();
  });

  it('should fail if build directory does not exist', async () => {
    createProjectsFile();

    // No dist directory created
    await expect(deploy({ noBuild: true })).rejects.toThrow();
  });
});
