import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BuildHelper } from '../../src/utils/build-helper';

/**
 * Regression tests for admin-uploaded screenshot path resolution
 * 
 * These tests ensure that admin:// prefixed screenshots are always
 * resolved to relative paths (./images/) regardless of the baseUrl
 * configuration, preventing the bug where production URLs were used
 * in local builds.
 */
describe('Admin Screenshot Path Resolution (Regression)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projection-screenshot-paths-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  /**
   * Helper to create a test project with admin-uploaded screenshot
   */
  function createTestProject(baseUrl: string) {
    const screenshotsDir = path.join(tempDir, 'screenshots');
    fs.mkdirSync(screenshotsDir);
    fs.writeFileSync(path.join(screenshotsDir, 'test-project.png'), 'fake image');

    const projectsContent = `
config:
  title: Test Portfolio
  description: Test
  baseUrl: ${baseUrl}
  output: dist

projects:
  - id: test-project
    title: Test Project
    description: A test project
    creationDate: "2024-01-15"
    tags: [test]
    pageLink: https://example.com
    thumbnailLink: admin://test-project.png
`;
    fs.writeFileSync(path.join(tempDir, 'projects.yaml'), projectsContent);
  }

  it('should use relative paths even with production baseUrl in config', async () => {
    // This is the regression test for the original bug
    // Config has production URL, but build should still use relative paths
    createTestProject('https://example.com/portfolio/');

    await BuildHelper.runBuild({
      cwd: tempDir,
      silent: true
    });

    const html = fs.readFileSync(path.join(tempDir, 'dist', 'index.html'), 'utf-8');
    
    // Should use relative path, NOT production URL
    expect(html).toContain('./images/test-project.png');
    expect(html).not.toContain('https://example.com/portfolio/images/test-project.png');
  });

  it('should use relative paths with relative baseUrl in config', async () => {
    createTestProject('./');

    await BuildHelper.runBuild({
      cwd: tempDir,
      silent: true
    });

    const html = fs.readFileSync(path.join(tempDir, 'dist', 'index.html'), 'utf-8');
    
    expect(html).toContain('./images/test-project.png');
  });

  it('should use relative paths with GitHub Pages baseUrl', async () => {
    createTestProject('/my-repo/');

    await BuildHelper.runBuild({
      cwd: tempDir,
      silent: true
    });

    const html = fs.readFileSync(path.join(tempDir, 'dist', 'index.html'), 'utf-8');
    
    // Should use relative path, NOT /my-repo/images/
    expect(html).toContain('./images/test-project.png');
    expect(html).not.toContain('/my-repo/images/test-project.png');
  });

  it('should copy screenshot from screenshots/ to dist/images/', async () => {
    createTestProject('https://example.com/');

    await BuildHelper.runBuild({
      cwd: tempDir,
      silent: true
    });

    // Verify file was copied
    const copiedFile = path.join(tempDir, 'dist', 'images', 'test-project.png');
    expect(fs.existsSync(copiedFile)).toBe(true);
    expect(fs.readFileSync(copiedFile, 'utf-8')).toBe('fake image');
  });

  it('should handle multiple admin screenshots with different extensions', async () => {
    const screenshotsDir = path.join(tempDir, 'screenshots');
    fs.mkdirSync(screenshotsDir);
    fs.writeFileSync(path.join(screenshotsDir, 'project1.png'), 'image1');
    fs.writeFileSync(path.join(screenshotsDir, 'project2.jpg'), 'image2');
    fs.writeFileSync(path.join(screenshotsDir, 'project3.webp'), 'image3');

    const projectsContent = `
config:
  title: Test
  baseUrl: https://production.example.com/
  output: dist

projects:
  - id: project1
    title: Project 1
    creationDate: "2024-01-15"
    tags: [test]
    pageLink: https://example.com/1
    thumbnailLink: admin://project1.png
  - id: project2
    title: Project 2
    creationDate: "2024-01-16"
    tags: [test]
    pageLink: https://example.com/2
    thumbnailLink: admin://project2.jpg
  - id: project3
    title: Project 3
    creationDate: "2024-01-17"
    tags: [test]
    pageLink: https://example.com/3
    thumbnailLink: admin://project3.webp
`;
    fs.writeFileSync(path.join(tempDir, 'projects.yaml'), projectsContent);

    await BuildHelper.runBuild({
      cwd: tempDir,
      silent: true
    });

    const html = fs.readFileSync(path.join(tempDir, 'dist', 'index.html'), 'utf-8');
    
    // All should use relative paths
    expect(html).toContain('./images/project1.png');
    expect(html).toContain('./images/project2.jpg');
    expect(html).toContain('./images/project3.webp');
    
    // None should use production URL
    expect(html).not.toContain('https://production.example.com/images/');
    
    // All files should be copied
    expect(fs.existsSync(path.join(tempDir, 'dist', 'images', 'project1.png'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'dist', 'images', 'project2.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'dist', 'images', 'project3.webp'))).toBe(true);
  });

  it('should handle mix of admin and user-provided images', async () => {
    // Create admin screenshot
    const screenshotsDir = path.join(tempDir, 'screenshots');
    fs.mkdirSync(screenshotsDir);
    fs.writeFileSync(path.join(screenshotsDir, 'admin-image.png'), 'admin');

    // Create user image
    const imagesDir = path.join(tempDir, 'images');
    fs.mkdirSync(imagesDir);
    fs.writeFileSync(path.join(imagesDir, 'user-image.png'), 'user');

    const projectsContent = `
config:
  title: Test
  baseUrl: https://example.com/site/
  output: dist

projects:
  - id: admin-project
    title: Admin Project
    creationDate: "2024-01-15"
    tags: [test]
    pageLink: https://example.com/1
    thumbnailLink: admin://admin-image.png
  - id: user-project
    title: User Project
    creationDate: "2024-01-16"
    tags: [test]
    pageLink: https://example.com/2
    thumbnailLink: images/user-image.png
`;
    fs.writeFileSync(path.join(tempDir, 'projects.yaml'), projectsContent);

    await BuildHelper.runBuild({
      cwd: tempDir,
      silent: true
    });

    const html = fs.readFileSync(path.join(tempDir, 'dist', 'index.html'), 'utf-8');
    
    // Admin screenshot should use relative path
    expect(html).toContain('./images/admin-image.png');
    expect(html).not.toContain('https://example.com/site/images/admin-image.png');
    
    // User image should also use relative path (from baseUrl default)
    expect(html).toContain('./images/user-image.png');
    
    // Both files should exist in dist/images/
    expect(fs.existsSync(path.join(tempDir, 'dist', 'images', 'admin-image.png'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'dist', 'images', 'user-image.png'))).toBe(true);
  });

  it('should use relative paths in background-image CSS', async () => {
    createTestProject('https://example.com/');

    await BuildHelper.runBuild({
      cwd: tempDir,
      silent: true
    });

    const html = fs.readFileSync(path.join(tempDir, 'dist', 'index.html'), 'utf-8');
    
    // Check that it's in the background-image style attribute
    expect(html).toMatch(/background-image:\s*url\(['"]\.\/images\/test-project\.png['"]\)/);
    
    // Should NOT have production URL in background-image
    expect(html).not.toMatch(/background-image:\s*url\(['"]https:\/\/example\.com\/images\//);
  });
});
