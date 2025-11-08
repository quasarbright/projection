/**
 * Integration tests for admin development workflow
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Admin Development Scripts', () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const adminClientPackageJsonPath = path.join(process.cwd(), 'src/admin/client/package.json');

  it('should have admin:dev script in main package.json', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts['admin:dev']).toBeDefined();
    expect(packageJson.scripts['admin:dev']).toContain('concurrently');
  });

  it('should have admin:server:dev script for server auto-restart', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    expect(packageJson.scripts['admin:server:dev']).toBeDefined();
    expect(packageJson.scripts['admin:server:dev']).toContain('nodemon');
  });

  it('should have admin:client:dev script for client hot reloading', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    expect(packageJson.scripts['admin:client:dev']).toBeDefined();
    expect(packageJson.scripts['admin:client:dev']).toContain('npm run dev');
  });

  it('should have nodemon as a dev dependency', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    expect(packageJson.devDependencies).toBeDefined();
    expect(packageJson.devDependencies.nodemon).toBeDefined();
  });

  it('should have concurrently as a dev dependency', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    expect(packageJson.devDependencies).toBeDefined();
    expect(packageJson.devDependencies.concurrently).toBeDefined();
  });

  it('should have dev script in admin client package.json', () => {
    const packageJson = JSON.parse(fs.readFileSync(adminClientPackageJsonPath, 'utf-8'));
    
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts.dev).toBeDefined();
    expect(packageJson.scripts.dev).toContain('vite');
  });

  it('should configure vite dev server with proxy', () => {
    const viteConfigPath = path.join(process.cwd(), 'src/admin/client/vite.config.ts');
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');
    
    // Check for proxy configuration
    expect(viteConfig).toContain('proxy');
    expect(viteConfig).toContain('/api');
    expect(viteConfig).toContain('localhost:3000');
  });

  it('should configure nodemon to watch server files', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const nodemonScript = packageJson.scripts['admin:server:dev'];
    
    expect(nodemonScript).toContain('--watch');
    expect(nodemonScript).toContain('src/admin/server');
    expect(nodemonScript).toContain('--ext ts');
  });

  it('should run admin server through CLI in dev mode', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const nodemonScript = packageJson.scripts['admin:server:dev'];
    
    // Should execute the admin command through the CLI
    expect(nodemonScript).toContain('admin');
    expect(nodemonScript).toContain('--port 3000');
  });
});
