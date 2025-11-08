/**
 * Integration tests for admin client build process
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Admin Client Build', () => {
  const adminClientDir = path.join(process.cwd(), 'src/admin/client');
  const buildOutputDir = path.join(process.cwd(), 'lib/admin/client');

  beforeAll(() => {
    // Ensure we're in the project root
    expect(fs.existsSync(adminClientDir)).toBe(true);
  });

  it('should have a build script in package.json', () => {
    const packageJsonPath = path.join(adminClientDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts.build).toBeDefined();
    expect(packageJson.scripts.build).toContain('vite build');
  });

  it('should have vite config with correct output directory', () => {
    const viteConfigPath = path.join(adminClientDir, 'vite.config.ts');
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');
    
    expect(viteConfig).toContain('lib/admin/client');
    expect(viteConfig).toContain('outDir');
  });

  it('should build successfully and create output files', () => {
    // Clean build directory if it exists
    if (fs.existsSync(buildOutputDir)) {
      fs.rmSync(buildOutputDir, { recursive: true, force: true });
    }

    // Run build
    try {
      execSync('npm run build', {
        cwd: adminClientDir,
        stdio: 'pipe',
        encoding: 'utf-8'
      });
    } catch (error: any) {
      throw new Error(`Build failed: ${error.message}\n${error.stdout}\n${error.stderr}`);
    }

    // Verify output directory exists
    expect(fs.existsSync(buildOutputDir)).toBe(true);

    // Verify index.html exists
    const indexHtmlPath = path.join(buildOutputDir, 'index.html');
    expect(fs.existsSync(indexHtmlPath)).toBe(true);

    // Verify assets directory exists
    const assetsDir = path.join(buildOutputDir, 'assets');
    expect(fs.existsSync(assetsDir)).toBe(true);

    // Verify at least one JS file exists in assets
    const assetFiles = fs.readdirSync(assetsDir);
    const jsFiles = assetFiles.filter(file => file.endsWith('.js'));
    expect(jsFiles.length).toBeGreaterThan(0);

    // Verify at least one CSS file exists in assets
    const cssFiles = assetFiles.filter(file => file.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);
  });

  it('should produce valid HTML in index.html', () => {
    const indexHtmlPath = path.join(buildOutputDir, 'index.html');
    
    if (!fs.existsSync(indexHtmlPath)) {
      // Build if not already built
      execSync('npm run build', {
        cwd: adminClientDir,
        stdio: 'pipe'
      });
    }

    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
    
    // Check for essential HTML structure
    expect(indexHtml).toContain('<!DOCTYPE html>');
    expect(indexHtml).toContain('<html');
    expect(indexHtml).toContain('<head>');
    expect(indexHtml).toContain('<body>');
    expect(indexHtml).toContain('<div id="root">');
    
    // Check for script and style references
    expect(indexHtml).toMatch(/<script.*src=.*\.js/);
    expect(indexHtml).toMatch(/<link.*href=.*\.css/);
  });
});
