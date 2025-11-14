import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { build } from '../../src/cli/build';

describe('CLI build command', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projection-build-test-'));
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

  /**
   * Helper function to create a valid projects.yaml file
   */
  function createProjectsFile(content?: string): void {
    const defaultContent = `
projects:
  - id: "test-project-1"
    title: "Test Project 1"
    description: "A test project"
    creationDate: "2024-01-15"
    tags:
      - "test"
      - "example"
    pageLink: "https://example.com/project1"
    sourceLink: "https://github.com/user/project1"
    thumbnailLink: "./images/project1.png"
    featured: true
  
  - id: "test-project-2"
    title: "Test Project 2"
    description: "Another test project"
    creationDate: "2024-02-20"
    tags:
      - "test"
    pageLink: "https://example.com/project2"
`;
    
    fs.writeFileSync(
      path.join(tempDir, 'projects.yaml'),
      content || defaultContent,
      'utf-8'
    );
    
    // Also create default config file if not exists
    const configPath = path.join(tempDir, 'projection.config.json');
    if (!fs.existsSync(configPath)) {
      const config = {
        title: "Test Projects",
        description: "Test portfolio",
        baseUrl: "./"
      };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    }
  }

  /**
   * Helper function to create a config file
   */
  function createConfigFile(configPath: string = 'projection.config.json'): void {
    const config = {
      title: "Custom Title",
      description: "Custom description",
      baseUrl: "./",
      dynamicBackgrounds: []
    };
    fs.writeFileSync(path.join(tempDir, configPath), JSON.stringify(config, null, 2), 'utf-8');
  }

  describe('Successful build with sample data', () => {
    it('should generate index.html in dist directory', async () => {
      createProjectsFile();

      await build();

      const outputPath = path.join(tempDir, 'dist', 'index.html');
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should generate valid HTML content', async () => {
      createProjectsFile();

      await build();

      const outputPath = path.join(tempDir, 'dist', 'index.html');
      const html = fs.readFileSync(outputPath, 'utf-8');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain('Test Project 1');
      expect(html).toContain('Test Project 2');
    });

    it('should copy assets to dist directory', async () => {
      createProjectsFile();

      await build();

      const stylesDir = path.join(tempDir, 'dist', 'styles');
      const scriptsDir = path.join(tempDir, 'dist', 'scripts');

      expect(fs.existsSync(stylesDir)).toBe(true);
      expect(fs.existsSync(scriptsDir)).toBe(true);
    });

    it('should include project data in generated HTML', async () => {
      createProjectsFile();

      await build();

      const outputPath = path.join(tempDir, 'dist', 'index.html');
      const html = fs.readFileSync(outputPath, 'utf-8');

      expect(html).toContain('test-project-1');
      expect(html).toContain('test-project-2');
      expect(html).toContain('Test Project 1');
      expect(html).toContain('A test project');
    });

    it('should use config from projects.yaml', async () => {
      createProjectsFile();

      await build();

      const outputPath = path.join(tempDir, 'dist', 'index.html');
      const html = fs.readFileSync(outputPath, 'utf-8');

      expect(html).toContain('Test Projects');
      expect(html).toContain('Test portfolio');
    });
  });

  describe('Build with custom config path', () => {
    it('should use custom config file when --config is specified', async () => {
      createProjectsFile();
      createConfigFile('custom.config.json');

      await build({ config: 'custom.config.json' });

      const outputPath = path.join(tempDir, 'dist', 'index.html');
      const html = fs.readFileSync(outputPath, 'utf-8');

      expect(html).toContain('Custom Title');
      expect(html).toContain('Custom description');
    });

    it('should handle absolute config path', async () => {
      createProjectsFile();
      const configPath = path.join(tempDir, 'my-config.json');
      createConfigFile('my-config.json');

      await build({ config: configPath });

      const outputPath = path.join(tempDir, 'dist', 'index.html');
      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });

  describe('Build with custom output directory', () => {
    it('should output to custom directory when --output is specified', async () => {
      createProjectsFile();

      await build({ output: 'build' });

      const outputPath = path.join(tempDir, 'build', 'index.html');
      expect(fs.existsSync(outputPath)).toBe(true);
      
      // Should not create dist directory
      const distPath = path.join(tempDir, 'dist');
      expect(fs.existsSync(distPath)).toBe(false);
    });

    it('should create nested output directories', async () => {
      createProjectsFile();

      await build({ output: 'output/public' });

      const outputPath = path.join(tempDir, 'output', 'public', 'index.html');
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should copy assets to custom output directory', async () => {
      createProjectsFile();

      await build({ output: 'custom-dist' });

      const stylesDir = path.join(tempDir, 'custom-dist', 'styles');
      const scriptsDir = path.join(tempDir, 'custom-dist', 'scripts');

      expect(fs.existsSync(stylesDir)).toBe(true);
      expect(fs.existsSync(scriptsDir)).toBe(true);
    });
  });

  describe('Error handling for invalid data', () => {
    it('should fail when projects.yaml is missing', async () => {
      // Don't create projects file
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      await expect(build()).rejects.toThrow('Process.exit');
      
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });

    it('should fail when project is missing required fields', async () => {
      const invalidContent = `
config:
  title: "Test"
  description: "Test"
  baseUrl: "./"

projects:
  - id: "test-project"
    title: "Test Project"
    # Missing description, creationDate, tags, pageLink
`;
      createProjectsFile(invalidContent);

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      await expect(build()).rejects.toThrow('Process.exit');
      
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });

    it('should fail when project ID is invalid format', async () => {
      const invalidContent = `
config:
  title: "Test"
  description: "Test"
  baseUrl: "./"

projects:
  - id: "Invalid ID With Spaces"
    title: "Test Project"
    description: "Test"
    creationDate: "2024-01-15"
    tags: ["test"]
    pageLink: "https://example.com"
`;
      createProjectsFile(invalidContent);

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      await expect(build()).rejects.toThrow('Process.exit');
      
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });

    it('should fail when projects.yaml has invalid YAML syntax', async () => {
      const invalidYaml = `
config:
  title: "Test"
  description: "Test"
  baseUrl: "./"

projects:
  - id: "test"
    title: "Test"
    description: "Test"
    creationDate: "2024-01-15"
    tags: ["test"
    # Missing closing bracket
    pageLink: "https://example.com"
`;
      fs.writeFileSync(path.join(tempDir, 'projects.yaml'), invalidYaml, 'utf-8');

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      await expect(build()).rejects.toThrow('Process.exit');
      
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });

    it('should fail when config file is invalid', async () => {
      createProjectsFile();
      
      // Create invalid config file (invalid JSON)
      fs.writeFileSync(
        path.join(tempDir, 'projection.config.json'),
        '{ invalid json syntax',
        'utf-8'
      );

      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      await expect(build()).rejects.toThrow();
      
      exitSpy.mockRestore();
    });
  });

  describe('Clean option', () => {
    it('should clean output directory when --clean is specified', async () => {
      createProjectsFile();

      // Create dist directory with existing files
      const distDir = path.join(tempDir, 'dist');
      fs.mkdirSync(distDir, { recursive: true });
      fs.writeFileSync(path.join(distDir, 'old-file.txt'), 'old content');
      fs.writeFileSync(path.join(distDir, 'index.html'), 'old html');

      await build({ clean: true });

      // Old file should be removed
      expect(fs.existsSync(path.join(distDir, 'old-file.txt'))).toBe(false);
      
      // New index.html should exist
      const newHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
      expect(newHtml).not.toBe('old html');
      expect(newHtml).toContain('Test Project 1');
    });

    it('should not fail if output directory does not exist when --clean is specified', async () => {
      createProjectsFile();

      await build({ clean: true });

      const outputPath = path.join(tempDir, 'dist', 'index.html');
      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });

  describe('JSON format support', () => {
    it('should build from projects.json file', async () => {
      const projectsData = {
        projects: [
          {
            id: "json-project",
            title: "JSON Project",
            description: "A project from JSON",
            creationDate: "2024-01-15",
            tags: ["json", "test"],
            pageLink: "https://example.com/json"
          }
        ]
      };

      fs.writeFileSync(
        path.join(tempDir, 'projects.json'),
        JSON.stringify(projectsData, null, 2),
        'utf-8'
      );
      
      // Create config file
      const config = {
        title: "JSON Test Projects",
        description: "Test with JSON",
        baseUrl: "./"
      };
      fs.writeFileSync(
        path.join(tempDir, 'projection.config.json'),
        JSON.stringify(config, null, 2),
        'utf-8'
      );

      await build();

      const outputPath = path.join(tempDir, 'dist', 'index.html');
      const html = fs.readFileSync(outputPath, 'utf-8');

      expect(html).toContain('JSON Test Projects');
      expect(html).toContain('JSON Project');
      expect(html).toContain('json-project');
    });
  });
});
