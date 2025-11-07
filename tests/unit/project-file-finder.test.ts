import * as fs from 'fs';
import * as path from 'path';
import { ProjectFileFinder } from '../../src/utils/project-file-finder';

jest.mock('fs');

describe('ProjectFileFinder', () => {
  const mockCwd = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('find', () => {
    it('should find projects.yaml', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath === path.join(mockCwd, 'projects.yaml');
      });

      const result = ProjectFileFinder.find(mockCwd);

      expect(result).not.toBeNull();
      expect(result?.path).toBe(path.join(mockCwd, 'projects.yaml'));
      expect(result?.format).toBe('yaml');
    });

    it('should find projects.yml', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath === path.join(mockCwd, 'projects.yml');
      });

      const result = ProjectFileFinder.find(mockCwd);

      expect(result).not.toBeNull();
      expect(result?.path).toBe(path.join(mockCwd, 'projects.yml'));
      expect(result?.format).toBe('yaml');
    });

    it('should find projects.json', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath === path.join(mockCwd, 'projects.json');
      });

      const result = ProjectFileFinder.find(mockCwd);

      expect(result).not.toBeNull();
      expect(result?.path).toBe(path.join(mockCwd, 'projects.json'));
      expect(result?.format).toBe('json');
    });

    it('should return null when no projects file exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = ProjectFileFinder.find(mockCwd);

      expect(result).toBeNull();
    });

    it('should prioritize projects.yaml over projects.yml', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath === path.join(mockCwd, 'projects.yaml') ||
               filePath === path.join(mockCwd, 'projects.yml');
      });

      const result = ProjectFileFinder.find(mockCwd);

      expect(result?.path).toBe(path.join(mockCwd, 'projects.yaml'));
    });

    it('should prioritize projects.yml over projects.json', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath === path.join(mockCwd, 'projects.yml') ||
               filePath === path.join(mockCwd, 'projects.json');
      });

      const result = ProjectFileFinder.find(mockCwd);

      expect(result?.path).toBe(path.join(mockCwd, 'projects.yml'));
    });
  });

  describe('findOrThrow', () => {
    it('should return result when file exists', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath === path.join(mockCwd, 'projects.yaml');
      });

      const result = ProjectFileFinder.findOrThrow(mockCwd);

      expect(result).not.toBeNull();
      expect(result.path).toBe(path.join(mockCwd, 'projects.yaml'));
    });

    it('should throw error when no file exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => ProjectFileFinder.findOrThrow(mockCwd)).toThrow(
        'No projects file found'
      );
    });

    it('should include expected file names in error message', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => ProjectFileFinder.findOrThrow(mockCwd)).toThrow(
        /projects\.yaml.*projects\.yml.*projects\.json/
      );
    });
  });

  describe('getPossiblePaths', () => {
    it('should return all possible file paths', () => {
      const paths = ProjectFileFinder.getPossiblePaths(mockCwd);

      expect(paths).toHaveLength(3);
      expect(paths).toContain(path.join(mockCwd, 'projects.yaml'));
      expect(paths).toContain(path.join(mockCwd, 'projects.yml'));
      expect(paths).toContain(path.join(mockCwd, 'projects.json'));
    });

    it('should work with different directories', () => {
      const customDir = '/custom/dir';
      const paths = ProjectFileFinder.getPossiblePaths(customDir);

      expect(paths).toHaveLength(3);
      expect(paths[0]).toContain(customDir);
    });
  });

  describe('exists', () => {
    it('should return true when file exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = ProjectFileFinder.exists('/some/path/projects.yaml');

      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith('/some/path/projects.yaml');
    });

    it('should return false when file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = ProjectFileFinder.exists('/some/path/projects.yaml');

      expect(result).toBe(false);
    });
  });

  describe('resolve', () => {
    it('should find default file when no path provided', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath === path.join(mockCwd, 'projects.yaml');
      });

      const result = ProjectFileFinder.resolve(mockCwd);

      expect(result).not.toBeNull();
      expect(result?.path).toBe(path.join(mockCwd, 'projects.yaml'));
    });

    it('should resolve relative path when provided', () => {
      const relativePath = 'data/projects.yaml';
      const expectedPath = path.resolve(mockCwd, relativePath);

      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath === expectedPath;
      });

      const result = ProjectFileFinder.resolve(mockCwd, relativePath);

      expect(result).not.toBeNull();
      expect(result?.path).toBe(expectedPath);
    });

    it('should handle absolute path when provided', () => {
      const absolutePath = '/absolute/path/projects.yaml';

      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath === absolutePath;
      });

      const result = ProjectFileFinder.resolve(mockCwd, absolutePath);

      expect(result).not.toBeNull();
      expect(result?.path).toBe(absolutePath);
    });

    it('should return null when provided path does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = ProjectFileFinder.resolve(mockCwd, 'missing.yaml');

      expect(result).toBeNull();
    });

    it('should detect format from provided path', () => {
      const jsonPath = 'custom/data.json';
      const expectedPath = path.resolve(mockCwd, jsonPath);

      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath === expectedPath;
      });

      const result = ProjectFileFinder.resolve(mockCwd, jsonPath);

      expect(result?.format).toBe('json');
    });
  });

  describe('getSupportedFileNames', () => {
    it('should return array of supported file names', () => {
      const fileNames = ProjectFileFinder.getSupportedFileNames();

      expect(fileNames).toHaveLength(3);
      expect(fileNames).toContain('projects.yaml');
      expect(fileNames).toContain('projects.yml');
      expect(fileNames).toContain('projects.json');
    });

    it('should return a copy of the array', () => {
      const fileNames1 = ProjectFileFinder.getSupportedFileNames();
      const fileNames2 = ProjectFileFinder.getSupportedFileNames();

      expect(fileNames1).not.toBe(fileNames2);
      expect(fileNames1).toEqual(fileNames2);
    });
  });

  describe('format detection', () => {
    it('should detect yaml format from .yaml extension', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath.endsWith('.yaml');
      });

      const result = ProjectFileFinder.find(mockCwd);

      expect(result?.format).toBe('yaml');
    });

    it('should detect yaml format from .yml extension', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath.endsWith('.yml');
      });

      const result = ProjectFileFinder.find(mockCwd);

      expect(result?.format).toBe('yaml');
    });

    it('should detect json format from .json extension', () => {
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath.endsWith('.json');
      });

      const result = ProjectFileFinder.find(mockCwd);

      expect(result?.format).toBe('json');
    });
  });

  describe('edge cases', () => {
    it('should handle empty directory path', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = ProjectFileFinder.find('');

      expect(result).toBeNull();
    });

    it('should handle directory with special characters', () => {
      const specialDir = '/test/my-project (v2)';
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath === path.join(specialDir, 'projects.yaml');
      });

      const result = ProjectFileFinder.find(specialDir);

      expect(result).not.toBeNull();
      expect(result?.path).toBe(path.join(specialDir, 'projects.yaml'));
    });

    it('should handle Windows-style paths', () => {
      const windowsPath = 'C:\\Users\\test\\project';
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        return filePath === path.join(windowsPath, 'projects.yaml');
      });

      const result = ProjectFileFinder.find(windowsPath);

      expect(result).not.toBeNull();
    });
  });
});
