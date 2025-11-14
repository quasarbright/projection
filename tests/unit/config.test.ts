import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigLoader } from '../../src/generator/config';
import { DEFAULT_CONFIG } from '../../src/types/config';
import { ProjectionError, ErrorCodes } from '../../src/utils/errors';

describe('ConfigLoader', () => {
  let tempDir: string;
  let configLoader: ConfigLoader;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projection-test-'));
    configLoader = new ConfigLoader(tempDir);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Config file discovery priority', () => {
    it('should use explicit configPath when provided', async () => {
      const configPath = path.join(tempDir, 'custom.config.json');
      const customConfig = {
        title: 'Custom Title',
        description: 'Custom Description',
        baseUrl: 'https://custom.com/'
      };
      fs.writeFileSync(configPath, JSON.stringify(customConfig));

      const config = await configLoader.load({ configPath });

      expect(config.title).toBe('Custom Title');
      expect(config.description).toBe('Custom Description');
      expect(config.baseUrl).toBe('https://custom.com/');
    });

    it('should use projection.config.json when no explicit path provided', async () => {
      const configPath = path.join(tempDir, 'projection.config.json');
      const customConfig = {
        title: 'JSON Config Title',
        description: 'JSON Config Description',
        baseUrl: 'https://jsonconfig.com/'
      };
      fs.writeFileSync(configPath, JSON.stringify(customConfig));

      const config = await configLoader.load();

      expect(config.title).toBe('JSON Config Title');
      expect(config.description).toBe('JSON Config Description');
      expect(config.baseUrl).toBe('https://jsonconfig.com/');
    });



    it('should use defaults when no config files exist', async () => {
      const config = await configLoader.load();

      expect(config.title).toBe(DEFAULT_CONFIG.title);
      expect(config.description).toBe(DEFAULT_CONFIG.description);
      expect(config.baseUrl).toBe(DEFAULT_CONFIG.baseUrl);
    });
  });

  describe('Config merging with defaults', () => {
    it('should merge partial config with defaults', async () => {
      const configPath = path.join(tempDir, 'projection.config.json');
      const partialConfig = {
        title: 'Custom Title'
        // description and baseUrl missing
      };
      fs.writeFileSync(configPath, JSON.stringify(partialConfig));

      const config = await configLoader.load();

      expect(config.title).toBe('Custom Title');
      expect(config.description).toBe(DEFAULT_CONFIG.description);
      expect(config.baseUrl).toBe(DEFAULT_CONFIG.baseUrl);
    });

    it('should preserve all user-provided values', async () => {
      const configPath = path.join(tempDir, 'projection.config.json');
      const fullConfig = {
        title: 'Full Config',
        description: 'Complete configuration',
        baseUrl: 'https://full.com/',
        dynamicBackgrounds: ['https://bg1.com', 'https://bg2.com'],
        customStyles: './my-styles',
        customScripts: './my-scripts',
        output: 'build'
      };
      fs.writeFileSync(configPath, JSON.stringify(fullConfig));

      const config = await configLoader.load();

      expect(config).toEqual(fullConfig);
    });

    it('should handle empty config object', async () => {
      const configPath = path.join(tempDir, 'projection.config.json');
      fs.writeFileSync(configPath, JSON.stringify({}));

      const config = await configLoader.load();

      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('Config validation errors', () => {
    it('should throw error for missing title', async () => {
      const configPath = path.join(tempDir, 'projection.config.json');
      const invalidConfig = {
        title: '',
        description: 'Valid description',
        baseUrl: './'
      };
      fs.writeFileSync(configPath, JSON.stringify(invalidConfig));

      await expect(configLoader.load()).rejects.toThrow(ProjectionError);
      await expect(configLoader.load()).rejects.toMatchObject({
        code: ErrorCodes.CONFIG_ERROR,
        details: {
          errors: expect.arrayContaining([
            expect.stringContaining('title must be a non-empty string')
          ])
        }
      });
    });



    it('should throw error for invalid dynamicBackgrounds type', async () => {
      const configPath = path.join(tempDir, 'projection.config.json');
      const invalidConfig = {
        title: 'Valid Title',
        description: 'Valid description',
        baseUrl: './',
        dynamicBackgrounds: 'not-an-array'
      };
      fs.writeFileSync(configPath, JSON.stringify(invalidConfig));

      await expect(configLoader.load()).rejects.toThrow(ProjectionError);
      await expect(configLoader.load()).rejects.toMatchObject({
        code: ErrorCodes.CONFIG_ERROR,
        details: {
          errors: expect.arrayContaining([
            expect.stringContaining('dynamicBackgrounds must be an array')
          ])
        }
      });
    });

    it('should throw error for non-string items in dynamicBackgrounds', async () => {
      const configPath = path.join(tempDir, 'projection.config.json');
      const invalidConfig = {
        title: 'Valid Title',
        description: 'Valid description',
        baseUrl: './',
        dynamicBackgrounds: ['https://valid.com', 123, 'https://another.com']
      };
      fs.writeFileSync(configPath, JSON.stringify(invalidConfig));

      await expect(configLoader.load()).rejects.toThrow(ProjectionError);
      await expect(configLoader.load()).rejects.toMatchObject({
        code: ErrorCodes.CONFIG_ERROR,
        details: {
          errors: expect.arrayContaining([
            expect.stringContaining('dynamicBackgrounds[1] must be a string')
          ])
        }
      });
    });

    it('should throw error for multiple validation failures', async () => {
      const configPath = path.join(tempDir, 'projection.config.json');
      const invalidConfig = {
        title: '',
        description: 123,
        baseUrl: './',
        dynamicBackgrounds: 'invalid'
      };
      fs.writeFileSync(configPath, JSON.stringify(invalidConfig));

      await expect(configLoader.load()).rejects.toThrow(ProjectionError);
      await expect(configLoader.load()).rejects.toMatchObject({
        code: ErrorCodes.CONFIG_ERROR,
        details: {
          errors: expect.arrayContaining([
            expect.stringContaining('title'),
            expect.stringContaining('description'),
            expect.stringContaining('dynamicBackgrounds')
          ])
        }
      });
    });

    it('should throw error for non-existent config file', async () => {
      const configPath = path.join(tempDir, 'nonexistent.config.json');

      await expect(configLoader.load({ configPath })).rejects.toThrow(ProjectionError);
      await expect(configLoader.load({ configPath })).rejects.toMatchObject({
        code: ErrorCodes.FILE_NOT_FOUND
      });
    });

    it('should throw error for invalid JSON syntax', async () => {
      const configPath = path.join(tempDir, 'projection.config.json');
      fs.writeFileSync(configPath, '{ invalid json }');

      await expect(configLoader.load()).rejects.toThrow(ProjectionError);
      await expect(configLoader.load()).rejects.toMatchObject({
        code: ErrorCodes.PARSE_ERROR
      });
    });

    it('should throw error for unsupported file format', async () => {
      const configPath = path.join(tempDir, 'projection.config.txt');
      fs.writeFileSync(configPath, 'some text');

      await expect(configLoader.load({ configPath })).rejects.toThrow(ProjectionError);
      await expect(configLoader.load({ configPath })).rejects.toMatchObject({
        code: ErrorCodes.CONFIG_ERROR,
        details: {
          supportedFormats: ['.json']
        }
      });
    });
  });

  describe('Static methods', () => {
    it('should return default config from getDefaults', () => {
      const defaults = ConfigLoader.getDefaults();

      expect(defaults).toEqual(DEFAULT_CONFIG);
      expect(defaults).not.toBe(DEFAULT_CONFIG); // Should be a copy
    });
  });
});
