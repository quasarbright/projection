import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Generator } from '../../src/generator';
import { ImageManager } from '../../src/admin/server/image-manager';

describe('Admin Screenshot Upload Integration', () => {
  let tempDir: string;
  let projectsFilePath: string;
  let screenshotsDir: string;

  beforeEach(() => {
    // Create temporary directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projection-admin-screenshot-'));
    projectsFilePath = path.join(tempDir, 'projects.yaml');
    screenshotsDir = path.join(tempDir, 'screenshots');

    // Create screenshots directory
    fs.mkdirSync(screenshotsDir);
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle admin:// prefixed screenshots in build process', async () => {
    // Create a mock screenshot file
    const screenshotFilename = 'project-123.png';
    const screenshotPath = path.join(screenshotsDir, screenshotFilename);
    fs.writeFileSync(screenshotPath, 'fake image data');

    // Create projects file with admin:// prefixed thumbnail
    const projectsContent = `
config:
  title: Test Portfolio
  description: Test Description
  baseUrl: ./
  output: dist

projects:
  - id: project-123
    title: Test Project
    description: A test project with admin-uploaded screenshot
    creationDate: "2024-01-15"
    tags:
      - test
    pageLink: https://example.com
    thumbnailLink: admin://project-123.png
`;
    fs.writeFileSync(projectsFilePath, projectsContent);

    // Run generator
    const generator = await Generator.create({ cwd: tempDir });
    await generator.generate();

    // Verify output
    const outputDir = path.join(tempDir, 'dist');
    const indexPath = path.join(outputDir, 'index.html');
    const copiedImagePath = path.join(outputDir, 'images', screenshotFilename);

    // Check that index.html was generated
    expect(fs.existsSync(indexPath)).toBe(true);

    // Check that screenshot was copied to images/ directory
    expect(fs.existsSync(copiedImagePath)).toBe(true);
    const copiedContent = fs.readFileSync(copiedImagePath, 'utf-8');
    expect(copiedContent).toBe('fake image data');

    // Check that HTML references the correct path in background-image style
    const html = fs.readFileSync(indexPath, 'utf-8');
    expect(html).toContain('./images/project-123.png');
    // The admin:// prefix should appear in the embedded JSON data, but not in the background-image style
    expect(html).toMatch(/background-image:\s*url\(['"]\.\/images\/project-123\.png['"]\)/);
  });

  it('should handle multiple admin:// screenshots', async () => {
    // Create multiple mock screenshot files
    fs.writeFileSync(path.join(screenshotsDir, 'project-1.png'), 'image 1');
    fs.writeFileSync(path.join(screenshotsDir, 'project-2.jpg'), 'image 2');
    fs.writeFileSync(path.join(screenshotsDir, 'project-3.webp'), 'image 3');

    // Create projects file with multiple admin:// prefixed thumbnails
    const projectsContent = `
config:
  title: Test Portfolio
  description: Test Description
  baseUrl: ./
  output: dist

projects:
  - id: project-1
    title: Project 1
    description: First project
    creationDate: "2024-01-15"
    tags: [test]
    pageLink: https://example.com/1
    thumbnailLink: admin://project-1.png
  - id: project-2
    title: Project 2
    description: Second project
    creationDate: "2024-01-16"
    tags: [test]
    pageLink: https://example.com/2
    thumbnailLink: admin://project-2.jpg
  - id: project-3
    title: Project 3
    description: Third project
    creationDate: "2024-01-17"
    tags: [test]
    pageLink: https://example.com/3
    thumbnailLink: admin://project-3.webp
`;
    fs.writeFileSync(projectsFilePath, projectsContent);

    // Run generator
    const generator = await Generator.create({ cwd: tempDir });
    await generator.generate();

    // Verify all screenshots were copied
    const outputDir = path.join(tempDir, 'dist');
    expect(fs.existsSync(path.join(outputDir, 'images', 'project-1.png'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'images', 'project-2.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'images', 'project-3.webp'))).toBe(true);

    // Verify HTML references correct paths
    const html = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf-8');
    expect(html).toContain('./images/project-1.png');
    expect(html).toContain('./images/project-2.jpg');
    expect(html).toContain('./images/project-3.webp');
  });

  it('should handle mix of admin:// and regular paths', async () => {
    // Create admin screenshot
    fs.writeFileSync(path.join(screenshotsDir, 'admin-uploaded.png'), 'admin image');

    // Create regular images directory
    const imagesDir = path.join(tempDir, 'images');
    fs.mkdirSync(imagesDir);
    fs.writeFileSync(path.join(imagesDir, 'user-image.png'), 'user image');

    // Create projects file with mixed thumbnail types
    const projectsContent = `
config:
  title: Test Portfolio
  description: Test Description
  baseUrl: ./
  output: dist

projects:
  - id: project-1
    title: Admin Upload
    description: Uses admin-uploaded screenshot
    creationDate: "2024-01-15"
    tags: [test]
    pageLink: https://example.com/1
    thumbnailLink: admin://admin-uploaded.png
  - id: project-2
    title: User Image
    description: Uses user-provided image
    creationDate: "2024-01-16"
    tags: [test]
    pageLink: https://example.com/2
    thumbnailLink: images/user-image.png
`;
    fs.writeFileSync(projectsFilePath, projectsContent);

    // Run generator
    const generator = await Generator.create({ cwd: tempDir });
    await generator.generate();

    // Verify both images exist in output
    const outputDir = path.join(tempDir, 'dist');
    expect(fs.existsSync(path.join(outputDir, 'images', 'admin-uploaded.png'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'images', 'user-image.png'))).toBe(true);

    // Verify HTML references correct paths
    const html = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf-8');
    expect(html).toContain('./images/admin-uploaded.png');
    expect(html).toContain('./images/user-image.png');
  });

  it('should work with ImageManager integration', async () => {
    // Test that ImageManager returns admin:// prefixed paths
    const imageManager = new ImageManager(tempDir);

    // Mock file upload
    const mockFile = {
      buffer: Buffer.from('test image data'),
      mimetype: 'image/png',
      size: 1024
    };

    // Save image
    const thumbnailLink = await imageManager.saveImage('test-project', mockFile);

    // Verify it returns admin:// prefix
    expect(thumbnailLink).toBe('admin://test-project.png');

    // Verify file was saved to screenshots directory
    const savedPath = path.join(screenshotsDir, 'test-project.png');
    expect(fs.existsSync(savedPath)).toBe(true);
  });

  it('should handle temp files with admin:// prefix', async () => {
    // Create temp screenshot
    fs.writeFileSync(path.join(screenshotsDir, 'project-123.temp.png'), 'temp image');

    // Create projects file with temp thumbnail
    const projectsContent = `
config:
  title: Test Portfolio
  description: Test Description
  baseUrl: ./
  output: dist

projects:
  - id: project-123
    title: Test Project
    description: Project with temp screenshot
    creationDate: "2024-01-15"
    tags: [test]
    pageLink: https://example.com
    thumbnailLink: admin://project-123.temp.png
`;
    fs.writeFileSync(projectsFilePath, projectsContent);

    // Run generator
    const generator = await Generator.create({ cwd: tempDir });
    await generator.generate();

    // Verify temp file was copied
    const outputDir = path.join(tempDir, 'dist');
    expect(fs.existsSync(path.join(outputDir, 'images', 'project-123.temp.png'))).toBe(true);
  });
});
