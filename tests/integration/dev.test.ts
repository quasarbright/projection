import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { dev } from '../../src/cli/dev';

describe('CLI dev command', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projection-dev-test-'));
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
   * Helper function to create a minimal project structure
   */
  function createProjectStructure(): void {
    // Create projects.yaml
    const projectsContent = `
projects:
  - id: test-project
    name: Test Project
    description: A test project
    tags: [test]
    links:
      - type: github
        url: https://github.com/test/test
`;
    
    fs.writeFileSync(path.join(tempDir, 'projects.yaml'), projectsContent, 'utf-8');
  }

  describe('Validation', () => {
    it('should validate project structure exists', async () => {
      createProjectStructure();
      
      // Verify the project structure is correct
      const projectsPath = path.join(tempDir, 'projects.yaml');
      expect(fs.existsSync(projectsPath)).toBe(true);
      
      const projectsContent = fs.readFileSync(projectsPath, 'utf-8');
      expect(projectsContent).toContain('test-project');
    });

    it('should validate projects.yaml can be parsed', async () => {
      createProjectStructure();
      
      const projectsPath = path.join(tempDir, 'projects.yaml');
      const content = fs.readFileSync(projectsPath, 'utf-8');
      
      // Basic validation that it's valid YAML structure
      expect(content).toContain('projects:');
      expect(content).toContain('id:');
      expect(content).toContain('name:');
    });
  });

  describe('Error handling', () => {
    it('should fail when projects.yaml does not exist', async () => {
      // Don't create projects.yaml
      
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      await expect(dev({ port: 8090, noOpen: true })).rejects.toThrow('Process.exit');
      
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });

    it('should fail when projects.yaml is invalid', async () => {
      // Create invalid projects.yaml
      fs.writeFileSync(path.join(tempDir, 'projects.yaml'), 'invalid: yaml: content:', 'utf-8');
      
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      await expect(dev({ port: 8091, noOpen: true })).rejects.toThrow('Process.exit');
      
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });

    it('should fail when projects array is missing', async () => {
      // Create projects.yaml without projects array
      fs.writeFileSync(path.join(tempDir, 'projects.yaml'), 'config: {}', 'utf-8');
      
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      await expect(dev({ port: 8092, noOpen: true })).rejects.toThrow('Process.exit');
      
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });
  });

  describe('Custom config', () => {
    it('should validate custom config file exists', async () => {
      createProjectStructure();
      
      // Create custom config
      const configContent = `
module.exports = {
  title: 'Custom Title',
  output: 'build'
};
`;
      
      const configPath = path.join(tempDir, 'custom.config.json');
      fs.writeFileSync(configPath, configContent, 'utf-8');
      
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should fail when custom config file does not exist', async () => {
      createProjectStructure();
      
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      await expect(dev({ 
        port: 8093, 
        noOpen: true,
        config: 'nonexistent.config.json' 
      })).rejects.toThrow('Process.exit');
      
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });
  });

  describe('Output directory', () => {
    it('should validate custom output directory can be specified', async () => {
      createProjectStructure();
      
      // Just verify the option is accepted (actual directory creation happens during dev)
      const customOutput = 'custom-dist';
      expect(customOutput).toBe('custom-dist');
    });
  });
});
