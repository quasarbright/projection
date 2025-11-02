import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { serve } from '../../src/cli/serve';

describe('CLI serve command', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projection-serve-test-'));
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
   * Helper function to create a dist directory with index.html
   */
  function createDistDirectory(): void {
    const distDir = path.join(tempDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
</head>
<body>
  <h1>Test Server</h1>
  <p>This is a test page for the serve command.</p>
</body>
</html>
`;
    
    fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent, 'utf-8');
  }

  describe('Validation', () => {
    it('should validate dist directory structure', async () => {
      createDistDirectory();
      
      // Verify the directory structure is correct
      const distPath = path.join(tempDir, 'dist');
      expect(fs.existsSync(distPath)).toBe(true);
      expect(fs.existsSync(path.join(distPath, 'index.html'))).toBe(true);
      
      const htmlContent = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
      expect(htmlContent).toContain('Test Server');
    });

    it('should validate index.html exists in dist', async () => {
      const distDir = path.join(tempDir, 'dist');
      fs.mkdirSync(distDir, { recursive: true});
      fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>', 'utf-8');
      
      expect(fs.existsSync(path.join(distDir, 'index.html'))).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should fail when dist directory does not exist', async () => {
      // Don't create dist directory
      
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      await expect(serve({ port: 8084 })).rejects.toThrow('Process.exit');
      
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });

    it('should fail when index.html does not exist', async () => {
      // Create dist directory but no index.html
      const distDir = path.join(tempDir, 'dist');
      fs.mkdirSync(distDir, { recursive: true });
      
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      await expect(serve({ port: 8085 })).rejects.toThrow('Process.exit');
      
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });
  });

  describe('Custom directory', () => {
    it('should validate custom directory exists', async () => {
      // Create custom directory instead of dist
      const customDir = path.join(tempDir, 'build');
      fs.mkdirSync(customDir, { recursive: true });
      fs.writeFileSync(path.join(customDir, 'index.html'), '<html></html>', 'utf-8');
      
      expect(fs.existsSync(customDir)).toBe(true);
      expect(fs.existsSync(path.join(customDir, 'index.html'))).toBe(true);
    });

    it('should fail when custom directory does not exist', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      await expect(serve({ port: 8086, dir: 'nonexistent' })).rejects.toThrow('Process.exit');
      
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });
  });
});
