import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Backward Compatibility Tests', () => {
  const distPath = path.join(process.cwd(), 'dist');
  const indexPath = path.join(distPath, 'index.html');

  beforeAll(() => {
    // Build the project
    execSync('npm run build', { stdio: 'inherit' });
    execSync('node bin/projection.js build', { stdio: 'inherit' });
  });

  test('should generate dist/index.html', () => {
    expect(fs.existsSync(indexPath)).toBe(true);
  });

  test('should copy all required assets', () => {
    const requiredAssets = [
      'dist/styles/main.css',
      'dist/styles/cards.css',
      'dist/styles/modal.css',
      'dist/scripts/search.js',
      'dist/scripts/filter.js',
      'dist/scripts/modal.js',
      'dist/scripts/dynamic-background.js',
      'dist/favicon.ico'
    ];

    requiredAssets.forEach(asset => {
      expect(fs.existsSync(path.join(process.cwd(), asset))).toBe(true);
    });
  });

  test('should include all projects from projects.yaml', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    // Check for specific projects that should be present
    const expectedProjects = [
      'minesweeper',
      'dinner-debt',
      'julia-image',
      'complex-dynamics',
      'mandelbrot-shader',
      'blog',
      'syntax-spec',
      'project-display'
    ];

    expectedProjects.forEach(projectId => {
      expect(html).toContain(`data-project-id="${projectId}"`);
    });
  });

  test('should include site configuration from projects.yaml', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    // Check for config values
    expect(html).toContain('<title>Mike Delmonaco</title>');
    expect(html).toContain('My coding projects');
    expect(html).toContain('94 projects'); // Total project count
  });

  test('should include dynamic background iframe', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    expect(html).toContain('id="dynamic-background"');
    expect(html).toContain('<iframe');
  });

  test('should include search functionality', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    expect(html).toContain('id="search-input"');
    expect(html).toContain('placeholder="Search projects..."');
    expect(html).toContain('src="scripts/search.js"');
  });

  test('should include filter functionality', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    expect(html).toContain('class="tag-filter');
    expect(html).toContain('data-tag="all"');
    expect(html).toContain('data-tag="featured"');
    expect(html).toContain('src="scripts/filter.js"');
  });

  test('should include sort controls', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    expect(html).toContain('id="sort-select"');
    expect(html).toContain('Date (Newest)');
    expect(html).toContain('Date (Oldest)');
    expect(html).toContain('Name (A-Z)');
  });

  test('should embed PROJECTS_DATA in HTML', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    expect(html).toContain('window.PROJECTS_DATA');
    expect(html).toContain('"projects":');
    expect(html).toContain('"config":');
  });

  test('should generate project cards with correct structure', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    // Check for project card structure
    expect(html).toContain('class="project-card');
    expect(html).toContain('class="project-title"');
    expect(html).toContain('class="project-description"');
    expect(html).toContain('class="project-tags"');
    expect(html).toContain('class="project-date"');
  });

  test('should mark featured projects correctly', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    // Check for featured class
    expect(html).toContain('class="project-card featured"');
  });

  test('should resolve relative paths correctly', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    // Check that relative paths are resolved with baseUrl
    expect(html).toContain('https://quasarbright.github.io/');
  });

  test('should include external links with proper attributes', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    // Check for external link attributes
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener');
  });

  test('should include all unique tags', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    const expectedTags = [
      'featured',
      'web',
      'AI',
      'fractal',
      'shader',
      'programming-languages',
      'game',
      'cellular-automata'
    ];

    expectedTags.forEach(tag => {
      expect(html).toContain(`data-tag="${tag}"`);
    });
  });

  test('should include footer with generator attribution', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    expect(html).toContain('class="site-footer"');
    expect(html).toContain('Generated with');
    expect(html).toContain('Projection');
  });

  test('should include proper meta tags', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    expect(html).toContain('<meta charset="UTF-8">');
    expect(html).toContain('<meta name="viewport"');
    expect(html).toContain('<meta name="description"');
  });

  test('should load all JavaScript files', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    const requiredScripts = [
      'scripts/search.js',
      'scripts/filter.js',
      'scripts/modal.js',
      'scripts/dynamic-background.js'
    ];

    requiredScripts.forEach(script => {
      expect(html).toContain(`src="${script}"`);
    });
  });

  test('should load all CSS files', () => {
    const html = fs.readFileSync(indexPath, 'utf-8');
    
    const requiredStyles = [
      'styles/main.css',
      'styles/cards.css'
    ];

    requiredStyles.forEach(style => {
      expect(html).toContain(`href="${style}"`);
    });
  });
});
