import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AssetCopier } from '../../src/generator/asset-copier';
import { Config } from '../../src/types/config';

describe('AssetCopier', () => {
  let tempDir: string;
  let outputDir: string;
  let assetCopier: AssetCopier;
  let mockConfig: Config;

  beforeEach(() => {
    // Create temporary directories for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projection-asset-test-'));
    outputDir = path.join(tempDir, 'dist');
    
    assetCopier = new AssetCopier(tempDir, outputDir);
    
    mockConfig = {
      title: 'Test',
      description: 'Test',
      baseUrl: './',
      dynamicBackgrounds: [],
      output: 'dist'
    };
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('copyUserAssetDirectories', () => {
    it('should copy screenshots directory when it exists', async () => {
      // Create screenshots directory with test files
      const screenshotsDir = path.join(tempDir, 'screenshots');
      fs.mkdirSync(screenshotsDir);
      fs.writeFileSync(path.join(screenshotsDir, 'test1.png'), 'fake png data');
      fs.writeFileSync(path.join(screenshotsDir, 'test2.jpg'), 'fake jpg data');

      // Create minimal required directories for copyAssets
      const stylesDir = path.join(tempDir, 'styles');
      const scriptsDir = path.join(tempDir, 'scripts');
      fs.mkdirSync(stylesDir);
      fs.mkdirSync(scriptsDir);
      fs.writeFileSync(path.join(stylesDir, 'main.css'), '/* css */');
      fs.writeFileSync(path.join(scriptsDir, 'main.js'), '// js');

      await assetCopier.copyAssets(mockConfig);

      // Verify screenshots directory was copied
      const outputScreenshotsDir = path.join(outputDir, 'screenshots');
      expect(fs.existsSync(outputScreenshotsDir)).toBe(true);
      expect(fs.existsSync(path.join(outputScreenshotsDir, 'test1.png'))).toBe(true);
      expect(fs.existsSync(path.join(outputScreenshotsDir, 'test2.jpg'))).toBe(true);
      
      // Verify content
      const content1 = fs.readFileSync(path.join(outputScreenshotsDir, 'test1.png'), 'utf-8');
      expect(content1).toBe('fake png data');
    });

    it('should copy images directory when it exists', async () => {
      // Create images directory with test files
      const imagesDir = path.join(tempDir, 'images');
      fs.mkdirSync(imagesDir);
      fs.writeFileSync(path.join(imagesDir, 'logo.png'), 'logo data');
      fs.writeFileSync(path.join(imagesDir, 'banner.jpg'), 'banner data');

      // Create minimal required directories
      const stylesDir = path.join(tempDir, 'styles');
      const scriptsDir = path.join(tempDir, 'scripts');
      fs.mkdirSync(stylesDir);
      fs.mkdirSync(scriptsDir);
      fs.writeFileSync(path.join(stylesDir, 'main.css'), '/* css */');
      fs.writeFileSync(path.join(scriptsDir, 'main.js'), '// js');

      await assetCopier.copyAssets(mockConfig);

      // Verify images directory was copied
      const outputImagesDir = path.join(outputDir, 'images');
      expect(fs.existsSync(outputImagesDir)).toBe(true);
      expect(fs.existsSync(path.join(outputImagesDir, 'logo.png'))).toBe(true);
      expect(fs.existsSync(path.join(outputImagesDir, 'banner.jpg'))).toBe(true);
    });

    it('should copy multiple asset directories simultaneously', async () => {
      // Create multiple asset directories
      const screenshotsDir = path.join(tempDir, 'screenshots');
      const imagesDir = path.join(tempDir, 'images');
      const photosDir = path.join(tempDir, 'photos');
      
      fs.mkdirSync(screenshotsDir);
      fs.mkdirSync(imagesDir);
      fs.mkdirSync(photosDir);
      
      fs.writeFileSync(path.join(screenshotsDir, 'screen1.png'), 'screen');
      fs.writeFileSync(path.join(imagesDir, 'image1.png'), 'image');
      fs.writeFileSync(path.join(photosDir, 'photo1.jpg'), 'photo');

      // Create minimal required directories
      const stylesDir = path.join(tempDir, 'styles');
      const scriptsDir = path.join(tempDir, 'scripts');
      fs.mkdirSync(stylesDir);
      fs.mkdirSync(scriptsDir);
      fs.writeFileSync(path.join(stylesDir, 'main.css'), '/* css */');
      fs.writeFileSync(path.join(scriptsDir, 'main.js'), '// js');

      await assetCopier.copyAssets(mockConfig);

      // Verify all directories were copied
      expect(fs.existsSync(path.join(outputDir, 'screenshots', 'screen1.png'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'images', 'image1.png'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'photos', 'photo1.jpg'))).toBe(true);
    });

    it('should copy nested subdirectories within asset directories', async () => {
      // Create nested directory structure
      const screenshotsDir = path.join(tempDir, 'screenshots');
      const projectsSubdir = path.join(screenshotsDir, 'projects');
      const demoSubdir = path.join(screenshotsDir, 'demos');
      
      fs.mkdirSync(screenshotsDir);
      fs.mkdirSync(projectsSubdir);
      fs.mkdirSync(demoSubdir);
      
      fs.writeFileSync(path.join(screenshotsDir, 'main.png'), 'main');
      fs.writeFileSync(path.join(projectsSubdir, 'project1.png'), 'project1');
      fs.writeFileSync(path.join(demoSubdir, 'demo1.png'), 'demo1');

      // Create minimal required directories
      const stylesDir = path.join(tempDir, 'styles');
      const scriptsDir = path.join(tempDir, 'scripts');
      fs.mkdirSync(stylesDir);
      fs.mkdirSync(scriptsDir);
      fs.writeFileSync(path.join(stylesDir, 'main.css'), '/* css */');
      fs.writeFileSync(path.join(scriptsDir, 'main.js'), '// js');

      await assetCopier.copyAssets(mockConfig);

      // Verify nested structure was preserved
      expect(fs.existsSync(path.join(outputDir, 'screenshots', 'main.png'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'screenshots', 'projects', 'project1.png'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'screenshots', 'demos', 'demo1.png'))).toBe(true);
    });

    it('should not fail when no asset directories exist', async () => {
      // Create only required directories
      const stylesDir = path.join(tempDir, 'styles');
      const scriptsDir = path.join(tempDir, 'scripts');
      fs.mkdirSync(stylesDir);
      fs.mkdirSync(scriptsDir);
      fs.writeFileSync(path.join(stylesDir, 'main.css'), '/* css */');
      fs.writeFileSync(path.join(scriptsDir, 'main.js'), '// js');

      // Should not throw
      await expect(assetCopier.copyAssets(mockConfig)).resolves.not.toThrow();

      // Verify output directory exists but no asset directories
      expect(fs.existsSync(outputDir)).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'screenshots'))).toBe(false);
      expect(fs.existsSync(path.join(outputDir, 'images'))).toBe(false);
    });

    it('should handle all supported asset directory names', async () => {
      // Create all supported directory names
      const dirNames = ['images', 'screenshots', 'img', 'photos', 'media', 'assets'];
      
      for (const dirName of dirNames) {
        const dir = path.join(tempDir, dirName);
        fs.mkdirSync(dir);
        fs.writeFileSync(path.join(dir, 'test.txt'), `${dirName} content`);
      }

      // Create minimal required directories
      const stylesDir = path.join(tempDir, 'styles');
      const scriptsDir = path.join(tempDir, 'scripts');
      fs.mkdirSync(stylesDir);
      fs.mkdirSync(scriptsDir);
      fs.writeFileSync(path.join(stylesDir, 'main.css'), '/* css */');
      fs.writeFileSync(path.join(scriptsDir, 'main.js'), '// js');

      await assetCopier.copyAssets(mockConfig);

      // Verify all directories were copied
      for (const dirName of dirNames) {
        const outputPath = path.join(outputDir, dirName, 'test.txt');
        expect(fs.existsSync(outputPath)).toBe(true);
        const content = fs.readFileSync(outputPath, 'utf-8');
        expect(content).toBe(`${dirName} content`);
      }
    });

    it('should preserve file permissions when copying', async () => {
      // Create screenshots directory with executable file
      const screenshotsDir = path.join(tempDir, 'screenshots');
      fs.mkdirSync(screenshotsDir);
      const testFile = path.join(screenshotsDir, 'test.sh');
      fs.writeFileSync(testFile, '#!/bin/bash\necho "test"');
      fs.chmodSync(testFile, 0o755);

      // Create minimal required directories
      const stylesDir = path.join(tempDir, 'styles');
      const scriptsDir = path.join(tempDir, 'scripts');
      fs.mkdirSync(stylesDir);
      fs.mkdirSync(scriptsDir);
      fs.writeFileSync(path.join(stylesDir, 'main.css'), '/* css */');
      fs.writeFileSync(path.join(scriptsDir, 'main.js'), '// js');

      await assetCopier.copyAssets(mockConfig);

      // Verify file was copied with permissions
      const outputFile = path.join(outputDir, 'screenshots', 'test.sh');
      expect(fs.existsSync(outputFile)).toBe(true);
      
      const stats = fs.statSync(outputFile);
      // Check if file is executable (mode includes execute bit)
      expect(stats.mode & 0o111).toBeGreaterThan(0);
    });
  });

  describe('regression tests', () => {
    it('should handle the amogus.png use case', async () => {
      // Regression test for the specific issue reported:
      // User has screenshots/amogus.png and references it as thumbnailLink
      const screenshotsDir = path.join(tempDir, 'screenshots');
      fs.mkdirSync(screenshotsDir);
      fs.writeFileSync(path.join(screenshotsDir, 'amogus.png'), 'PNG image data');

      // Create minimal required directories
      const stylesDir = path.join(tempDir, 'styles');
      const scriptsDir = path.join(tempDir, 'scripts');
      fs.mkdirSync(stylesDir);
      fs.mkdirSync(scriptsDir);
      fs.writeFileSync(path.join(stylesDir, 'main.css'), '/* css */');
      fs.writeFileSync(path.join(scriptsDir, 'main.js'), '// js');

      await assetCopier.copyAssets(mockConfig);

      // Verify the exact file path that would be referenced in HTML
      const expectedPath = path.join(outputDir, 'screenshots', 'amogus.png');
      expect(fs.existsSync(expectedPath)).toBe(true);
      
      const content = fs.readFileSync(expectedPath, 'utf-8');
      expect(content).toBe('PNG image data');
    });

    it('should not interfere with existing styles and scripts copying', async () => {
      // Ensure new functionality doesn't break existing asset copying
      const screenshotsDir = path.join(tempDir, 'screenshots');
      const stylesDir = path.join(tempDir, 'styles');
      const scriptsDir = path.join(tempDir, 'scripts');
      
      fs.mkdirSync(screenshotsDir);
      fs.mkdirSync(stylesDir);
      fs.mkdirSync(scriptsDir);
      
      fs.writeFileSync(path.join(screenshotsDir, 'test.png'), 'image');
      fs.writeFileSync(path.join(stylesDir, 'main.css'), 'body { color: red; }');
      fs.writeFileSync(path.join(scriptsDir, 'app.js'), 'console.log("test");');

      await assetCopier.copyAssets(mockConfig);

      // Verify all assets were copied
      expect(fs.existsSync(path.join(outputDir, 'screenshots', 'test.png'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'styles', 'main.css'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'scripts', 'app.js'))).toBe(true);
      
      // Verify content is correct
      const cssContent = fs.readFileSync(path.join(outputDir, 'styles', 'main.css'), 'utf-8');
      expect(cssContent).toBe('body { color: red; }');
    });
  });
});
