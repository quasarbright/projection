/**
 * Unit tests for package.json scripts and dependencies
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Package.json Configuration', () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  let packageJson: any;

  beforeAll(() => {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  });

  describe('Admin Scripts', () => {
    it('should have admin:build script', () => {
      expect(packageJson.scripts['admin:build']).toBeDefined();
      expect(packageJson.scripts['admin:build']).toContain('npm run build');
    });

    it('should have admin:dev script', () => {
      expect(packageJson.scripts['admin:dev']).toBeDefined();
      expect(packageJson.scripts['admin:dev']).toContain('concurrently');
      expect(packageJson.scripts['admin:dev']).toContain('admin:server:dev');
      expect(packageJson.scripts['admin:dev']).toContain('admin:client:dev');
    });

    it('should have admin:server:dev script', () => {
      expect(packageJson.scripts['admin:server:dev']).toBeDefined();
      expect(packageJson.scripts['admin:server:dev']).toContain('nodemon');
    });

    it('should have admin:client:dev script', () => {
      expect(packageJson.scripts['admin:client:dev']).toBeDefined();
      expect(packageJson.scripts['admin:client:dev']).toContain('npm run dev');
    });

    it('should include admin:build in main build script', () => {
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.build).toContain('admin:build');
    });
  });

  describe('Dependencies', () => {
    it('should have express dependency', () => {
      expect(packageJson.dependencies.express).toBeDefined();
    });

    it('should have yaml dependency', () => {
      expect(packageJson.dependencies.yaml).toBeDefined();
    });

    it('should have cors dependency', () => {
      expect(packageJson.dependencies.cors).toBeDefined();
    });

    it('should have chokidar dependency', () => {
      expect(packageJson.dependencies.chokidar).toBeDefined();
    });
  });

  describe('Dev Dependencies', () => {
    it('should have concurrently dev dependency', () => {
      expect(packageJson.devDependencies.concurrently).toBeDefined();
    });

    it('should have nodemon dev dependency', () => {
      expect(packageJson.devDependencies.nodemon).toBeDefined();
    });

    it('should have TypeScript types for express', () => {
      expect(packageJson.devDependencies['@types/express']).toBeDefined();
    });

    it('should have TypeScript types for cors', () => {
      expect(packageJson.devDependencies['@types/cors']).toBeDefined();
    });

    it('should have supertest for API testing', () => {
      expect(packageJson.devDependencies.supertest).toBeDefined();
    });

    it('should have TypeScript types for supertest', () => {
      expect(packageJson.devDependencies['@types/supertest']).toBeDefined();
    });
  });

  describe('Admin Client Package', () => {
    const adminClientPackageJsonPath = path.join(
      process.cwd(),
      'src/admin/client/package.json'
    );
    let adminClientPackageJson: any;

    beforeAll(() => {
      adminClientPackageJson = JSON.parse(
        fs.readFileSync(adminClientPackageJsonPath, 'utf-8')
      );
    });

    it('should have react dependency', () => {
      expect(adminClientPackageJson.dependencies.react).toBeDefined();
    });

    it('should have react-dom dependency', () => {
      expect(adminClientPackageJson.dependencies['react-dom']).toBeDefined();
    });

    it('should have axios dependency', () => {
      expect(adminClientPackageJson.dependencies.axios).toBeDefined();
    });

    it('should have vite dev dependency', () => {
      expect(adminClientPackageJson.devDependencies.vite).toBeDefined();
    });

    it('should have TypeScript dev dependency', () => {
      expect(adminClientPackageJson.devDependencies.typescript).toBeDefined();
    });

    it('should have build script', () => {
      expect(adminClientPackageJson.scripts.build).toBeDefined();
      expect(adminClientPackageJson.scripts.build).toContain('vite build');
    });

    it('should have dev script', () => {
      expect(adminClientPackageJson.scripts.dev).toBeDefined();
      expect(adminClientPackageJson.scripts.dev).toContain('vite');
    });

    it('should have test script', () => {
      expect(adminClientPackageJson.scripts.test).toBeDefined();
      expect(adminClientPackageJson.scripts.test).toContain('vitest');
    });
  });

  describe('Build Process Integration', () => {
    it('should build TypeScript before copying templates', () => {
      const buildScript = packageJson.scripts.build;
      const tscIndex = buildScript.indexOf('tsc');
      const copyIndex = buildScript.indexOf('copy-templates');
      
      expect(tscIndex).toBeLessThan(copyIndex);
    });

    it('should build admin client after copying templates', () => {
      const buildScript = packageJson.scripts.build;
      const copyIndex = buildScript.indexOf('copy-templates');
      const adminBuildIndex = buildScript.indexOf('admin:build');
      
      expect(copyIndex).toBeLessThan(adminBuildIndex);
    });

    it('should have copy-templates script', () => {
      expect(packageJson.scripts['copy-templates']).toBeDefined();
      expect(packageJson.scripts['copy-templates']).toContain('mkdir');
      expect(packageJson.scripts['copy-templates']).toContain('cp');
    });
  });

  describe('Package Metadata', () => {
    it('should have correct package name', () => {
      expect(packageJson.name).toBe('projection');
    });

    it('should have main entry point', () => {
      expect(packageJson.main).toBe('lib/index.js');
    });

    it('should have types entry point', () => {
      expect(packageJson.types).toBe('lib/index.d.ts');
    });

    it('should have bin entry point', () => {
      expect(packageJson.bin).toBeDefined();
      expect(packageJson.bin.projection).toBe('bin/projection.js');
    });

    it('should include lib directory in files', () => {
      expect(packageJson.files).toContain('lib/');
    });

    it('should include bin directory in files', () => {
      expect(packageJson.files).toContain('bin/');
    });
  });
});
