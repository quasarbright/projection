import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Generator } from '../../src/generator/index';
import { ProjectionError } from '../../src/utils/errors';

describe('Generator', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projection-test-'));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('loadProjectData', () => {
    it('should load projects from projects.yaml', async () => {
      const projectsYaml = `
projects:
  - id: test-project
    title: Test Project
    description: A test project
    creationDate: "2024-01-15"
    tags:
      - test
    pageLink: https://example.com
`;
      fs.writeFileSync(path.join(tempDir, 'projects.yaml'), projectsYaml);
      
      // Create config file
      const config = {
        title: 'Test Projects',
        description: 'Test description',
        baseUrl: './'
      };
      fs.writeFileSync(path.join(tempDir, 'projection.config.json'), JSON.stringify(config));

      const generator = await Generator.create({ cwd: tempDir });
      const projectsData = await generator['loadProjectData']();

      expect(projectsData.projects).toHaveLength(1);
      expect(projectsData.projects[0].id).toBe('test-project');
      expect(projectsData.projects[0].title).toBe('Test Project');
    });

    it('should load projects from projects.json', async () => {
      const projectsJson = {
        projects: [
          {
            id: 'json-project',
            title: 'JSON Project',
            description: 'A JSON test project',
            creationDate: '2024-01-15',
            tags: ['test'],
            pageLink: 'https://example.com'
          }
        ]
      };
      fs.writeFileSync(path.join(tempDir, 'projects.json'), JSON.stringify(projectsJson));

      const generator = await Generator.create({ cwd: tempDir });
      const projectsData = await generator['loadProjectData']();

      expect(projectsData.projects).toHaveLength(1);
      expect(projectsData.projects[0].id).toBe('json-project');
    });

    it('should throw error when projects file not found', async () => {
      const generator = await Generator.create({ cwd: tempDir });

      await expect(generator['loadProjectData']()).rejects.toThrow(ProjectionError);
    });
  });

  describe('generate', () => {
    it('should generate complete site with all assets', async () => {
      const projectsYaml = `
projects:
  - id: test-project
    title: Test Project
    description: A test project
    creationDate: "2024-01-15"
    tags:
      - test
    pageLink: https://example.com
`;
      fs.writeFileSync(path.join(tempDir, 'projects.yaml'), projectsYaml);
      
      // Create config file
      const config = {
        title: 'Test Site',
        description: 'Test description',
        baseUrl: './'
      };
      fs.writeFileSync(path.join(tempDir, 'projection.config.json'), JSON.stringify(config));

      // Create mock template directories (since bundled templates don't exist yet - task 8)
      const stylesDir = path.join(tempDir, 'styles');
      const scriptsDir = path.join(tempDir, 'scripts');
      fs.mkdirSync(stylesDir);
      fs.mkdirSync(scriptsDir);
      fs.writeFileSync(path.join(stylesDir, 'main.css'), '/* test css */');
      fs.writeFileSync(path.join(scriptsDir, 'search.js'), '// test js');

      const generator = await Generator.create({ cwd: tempDir });
      await generator.generate();

      const outputDir = generator.getOutputDir();
      
      // Verify index.html was created
      expect(fs.existsSync(path.join(outputDir, 'index.html'))).toBe(true);
      
      // Verify HTML content
      const html = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf-8');
      expect(html).toContain('Test Site');
      expect(html).toContain('Test Project');
      expect(html).toContain('test-project');
      
      // Verify assets were copied
      expect(fs.existsSync(path.join(outputDir, 'styles', 'main.css'))).toBe(true);
      expect(fs.existsSync(path.join(outputDir, 'scripts', 'search.js'))).toBe(true);
    });
  });
});
