import { HTMLBuilder } from '../../src/generator/html-builder';
import { Project, ProjectsData } from '../../src/types/project';
import { Config } from '../../src/types/config';

describe('HTMLBuilder', () => {
  let htmlBuilder: HTMLBuilder;
  let config: Config;

  beforeEach(() => {
    config = {
      title: 'Test Portfolio',
      description: 'A test portfolio site',
      baseUrl: './',
      itemsPerPage: 20,
      dynamicBackgrounds: [],
      output: 'dist'
    };
    htmlBuilder = new HTMLBuilder(config);
  });

  const createValidProject = (overrides: Partial<Project> = {}): Project => ({
    id: 'test-project',
    title: 'Test Project',
    description: 'A test project description',
    creationDate: '2024-01-15',
    tags: ['javascript', 'web'],
    pageLink: 'https://example.com/project',
    ...overrides
  });

  describe('resolveThumbnailPath', () => {
    it('should return default path when thumbnailLink is undefined', () => {
      const result = htmlBuilder.resolveThumbnailPath(undefined, './');
      
      expect(result).toBe('./images/magnet pendulum.PNG');
    });

    it('should return absolute HTTP URL as-is', () => {
      const url = 'http://example.com/image.png';
      const result = htmlBuilder.resolveThumbnailPath(url, './');
      
      expect(result).toBe(url);
    });

    it('should return absolute HTTPS URL as-is', () => {
      const url = 'https://example.com/image.png';
      const result = htmlBuilder.resolveThumbnailPath(url, './');
      
      expect(result).toBe(url);
    });

    it('should return domain-absolute path as-is', () => {
      const path = '/images/project.png';
      const result = htmlBuilder.resolveThumbnailPath(path, './');
      
      expect(result).toBe(path);
    });

    it('should resolve relative path starting with ./', () => {
      const result = htmlBuilder.resolveThumbnailPath('./images/project.png', '../');
      
      expect(result).toBe('../images/project.png');
    });

    it('should resolve parent relative path starting with ../', () => {
      const result = htmlBuilder.resolveThumbnailPath('../images/project.png', './base/');
      
      expect(result).toBe('./images/project.png');
    });

    it('should resolve path without prefix as relative to baseUrl', () => {
      const result = htmlBuilder.resolveThumbnailPath('images/project.png', './');
      
      expect(result).toBe('./images/project.png');
    });

    it('should handle baseUrl with trailing slash', () => {
      const result = htmlBuilder.resolveThumbnailPath('images/project.png', 'https://example.com/');
      
      expect(result).toBe('https://example.com/images/project.png');
    });

    it('should handle baseUrl without trailing slash', () => {
      const result = htmlBuilder.resolveThumbnailPath('images/project.png', 'https://example.com');
      
      expect(result).toBe('https://example.comimages/project.png');
    });
  });

  describe('resolvePageLink', () => {
    it('should return absolute HTTP URL as-is', () => {
      const url = 'http://example.com/project';
      const result = htmlBuilder.resolvePageLink(url, './');
      
      expect(result).toBe(url);
    });

    it('should return absolute HTTPS URL as-is', () => {
      const url = 'https://example.com/project';
      const result = htmlBuilder.resolvePageLink(url, './');
      
      expect(result).toBe(url);
    });

    it('should return domain-absolute path as-is', () => {
      const path = '/projects/my-project';
      const result = htmlBuilder.resolvePageLink(path, './');
      
      expect(result).toBe(path);
    });

    it('should resolve relative path starting with ./', () => {
      const result = htmlBuilder.resolvePageLink('./projects/my-project', '../');
      
      expect(result).toBe('../projects/my-project');
    });

    it('should resolve parent relative path starting with ../', () => {
      const result = htmlBuilder.resolvePageLink('../projects/my-project', './base/');
      
      expect(result).toBe('./projects/my-project');
    });

    it('should resolve path without prefix as relative to baseUrl', () => {
      const result = htmlBuilder.resolvePageLink('projects/my-project', './');
      
      expect(result).toBe('./projects/my-project');
    });
  });

  describe('generateProjectCard', () => {
    it('should generate valid HTML for basic project', () => {
      const project = createValidProject();
      const html = htmlBuilder.generateProjectCard(project);
      
      expect(html).toContain('class="project-card"');
      expect(html).toContain('data-project-id="test-project"');
      expect(html).toContain('Test Project');
      expect(html).toContain('A test project description');
      expect(html).toMatch(/January 1[45], 2024/); // Account for timezone differences
    });

    it('should include featured class for featured projects', () => {
      const project = createValidProject({ featured: true });
      const html = htmlBuilder.generateProjectCard(project);
      
      expect(html).toContain('class="project-card featured"');
    });

    it('should not include featured class for non-featured projects', () => {
      const project = createValidProject({ featured: false });
      const html = htmlBuilder.generateProjectCard(project);
      
      expect(html).toContain('class="project-card"');
      expect(html).not.toContain('class="project-card featured"');
    });

    it('should include background style when thumbnailLink is provided', () => {
      const project = createValidProject({ thumbnailLink: 'https://example.com/thumb.png' });
      const html = htmlBuilder.generateProjectCard(project);
      
      expect(html).toContain('style="background-image: url(\'https://example.com/thumb.png\');"');
    });

    it('should not include background style when thumbnailLink is missing', () => {
      const project = createValidProject({ thumbnailLink: undefined });
      const html = htmlBuilder.generateProjectCard(project);
      
      expect(html).not.toContain('background-image');
    });

    it('should generate tags excluding featured tag', () => {
      const project = createValidProject({ tags: ['javascript', 'featured', 'web'] });
      const html = htmlBuilder.generateProjectCard(project);
      
      expect(html).toContain('data-tag="javascript"');
      expect(html).toContain('data-tag="web"');
      expect(html).not.toContain('data-tag="featured"');
    });

    it('should include source code link when sourceLink is provided', () => {
      const project = createValidProject({ sourceLink: 'https://github.com/user/repo' });
      const html = htmlBuilder.generateProjectCard(project);
      
      expect(html).toContain('Source Code');
      expect(html).toContain('href="https://github.com/user/repo"');
    });

    it('should not include source code section when sourceLink is missing', () => {
      const project = createValidProject({ sourceLink: undefined });
      const html = htmlBuilder.generateProjectCard(project);
      
      expect(html).not.toContain('Source Code');
      expect(html).not.toContain('card-actions');
    });

    it('should resolve pageLink using baseUrl', () => {
      const project = createValidProject({ pageLink: './projects/test' });
      const html = htmlBuilder.generateProjectCard(project);
      
      expect(html).toContain('href="./projects/test"');
    });

    it('should include external link icon', () => {
      const project = createValidProject();
      const html = htmlBuilder.generateProjectCard(project);
      
      expect(html).toContain('<svg');
      expect(html).toContain('viewBox="0 0 24 24"');
    });

    it('should format date correctly', () => {
      const project = createValidProject({ creationDate: '2023-12-25' });
      const html = htmlBuilder.generateProjectCard(project);
      
      expect(html).toMatch(/December 2[45], 2023/); // Account for timezone differences
    });

    it('should handle multiple tags', () => {
      const project = createValidProject({ tags: ['javascript', 'typescript', 'react', 'node'] });
      const html = htmlBuilder.generateProjectCard(project);
      
      expect(html).toContain('data-tag="javascript"');
      expect(html).toContain('data-tag="typescript"');
      expect(html).toContain('data-tag="react"');
      expect(html).toContain('data-tag="node"');
    });
  });

  describe('generateTagFilter', () => {
    it('should generate filter section with all tags', () => {
      const tags = ['javascript', 'python', 'web'];
      const html = htmlBuilder.generateTagFilter(tags);
      
      expect(html).toContain('class="filter-section"');
      expect(html).toContain('data-tag="javascript"');
      expect(html).toContain('data-tag="python"');
      expect(html).toContain('data-tag="web"');
    });

    it('should include "All" button with active class', () => {
      const tags = ['javascript'];
      const html = htmlBuilder.generateTagFilter(tags);
      
      expect(html).toContain('data-tag="all"');
      expect(html).toContain('class="tag-filter active"');
    });

    it('should add star icon to featured tag', () => {
      const tags = ['featured', 'javascript'];
      const html = htmlBuilder.generateTagFilter(tags);
      
      expect(html).toContain('★ featured');
    });

    it('should not add star icon to non-featured tags', () => {
      const tags = ['javascript', 'python'];
      const html = htmlBuilder.generateTagFilter(tags);
      
      expect(html).not.toContain('★ javascript');
      expect(html).not.toContain('★ python');
    });

    it('should include search input', () => {
      const tags = ['javascript'];
      const html = htmlBuilder.generateTagFilter(tags);
      
      expect(html).toContain('id="search-input"');
      expect(html).toContain('placeholder="Search projects..."');
    });

    it('should include clear search button', () => {
      const tags = ['javascript'];
      const html = htmlBuilder.generateTagFilter(tags);
      
      expect(html).toContain('id="clear-search"');
      expect(html).toContain('Clear');
    });

    it('should include sort controls', () => {
      const tags = ['javascript'];
      const html = htmlBuilder.generateTagFilter(tags);
      
      expect(html).toContain('id="sort-select"');
      expect(html).toContain('Date (Newest)');
      expect(html).toContain('Date (Oldest)');
      expect(html).toContain('Name (A-Z)');
      expect(html).toContain('Name (Z-A)');
    });

    it('should handle empty tags array', () => {
      const tags: string[] = [];
      const html = htmlBuilder.generateTagFilter(tags);
      
      expect(html).toContain('class="filter-section"');
      expect(html).toContain('data-tag="all"');
    });
  });

  describe('generateModal', () => {
    it('should generate modal HTML structure', () => {
      const projects = [createValidProject()];
      const html = htmlBuilder.generateModal(projects);
      
      expect(html).toContain('id="project-modal"');
      expect(html).toContain('class="modal"');
    });

    it('should include modal header with title and close button', () => {
      const projects = [createValidProject()];
      const html = htmlBuilder.generateModal(projects);
      
      expect(html).toContain('class="modal-header"');
      expect(html).toContain('id="modal-title"');
      expect(html).toContain('class="modal-close"');
    });

    it('should include modal body with image and info sections', () => {
      const projects = [createValidProject()];
      const html = htmlBuilder.generateModal(projects);
      
      expect(html).toContain('class="modal-body"');
      expect(html).toContain('class="modal-image"');
      expect(html).toContain('id="modal-thumbnail"');
      expect(html).toContain('class="modal-info"');
    });

    it('should include modal navigation buttons', () => {
      const projects = [createValidProject()];
      const html = htmlBuilder.generateModal(projects);
      
      expect(html).toContain('id="modal-prev"');
      expect(html).toContain('id="modal-next"');
      expect(html).toContain('← Previous');
      expect(html).toContain('Next →');
    });

    it('should include action buttons', () => {
      const projects = [createValidProject()];
      const html = htmlBuilder.generateModal(projects);
      
      expect(html).toContain('id="modal-primary-link"');
      expect(html).toContain('id="modal-source-link"');
      expect(html).toContain('View Project');
      expect(html).toContain('Source Code');
    });
  });

  describe('admin mode', () => {
    describe('constructor with adminMode option', () => {
      it('should create HTMLBuilder with adminMode disabled by default', () => {
        const builder = new HTMLBuilder(config);
        const projectsData: ProjectsData = {
          projects: [createValidProject()],
          config: {}
        };
        const html = builder.generateHTML(projectsData);
        
        expect(html).not.toContain('admin-controls');
        expect(html).not.toContain('admin-create');
        expect(html).not.toContain('admin-action');
      });

      it('should create HTMLBuilder with adminMode enabled when specified', () => {
        const builder = new HTMLBuilder(config, { adminMode: true });
        const projectsData: ProjectsData = {
          projects: [createValidProject()],
          config: {}
        };
        const html = builder.generateHTML(projectsData);
        
        expect(html).toContain('admin-controls');
        expect(html).toContain('admin-create');
      });

      it('should create HTMLBuilder with adminMode explicitly disabled', () => {
        const builder = new HTMLBuilder(config, { adminMode: false });
        const projectsData: ProjectsData = {
          projects: [createValidProject()],
          config: {}
        };
        const html = builder.generateHTML(projectsData);
        
        expect(html).not.toContain('admin-controls');
        expect(html).not.toContain('admin-create');
      });
    });

    describe('generateProjectCard with admin mode', () => {
      it('should include admin controls when adminMode is true', () => {
        const builder = new HTMLBuilder(config, { adminMode: true });
        const project = createValidProject();
        const html = builder.generateProjectCard(project);
        
        expect(html).toContain('class="admin-controls"');
        expect(html).toContain('class="admin-btn admin-edit"');
        expect(html).toContain('class="admin-btn admin-delete"');
        expect(html).toContain('data-project-id="test-project"');
        expect(html).toContain('Edit');
        expect(html).toContain('Delete');
      });

      it('should not include admin controls when adminMode is false', () => {
        const builder = new HTMLBuilder(config, { adminMode: false });
        const project = createValidProject();
        const html = builder.generateProjectCard(project);
        
        expect(html).not.toContain('admin-controls');
        expect(html).not.toContain('admin-edit');
        expect(html).not.toContain('admin-delete');
      });

      it('should include SVG icons in admin controls', () => {
        const builder = new HTMLBuilder(config, { adminMode: true });
        const project = createValidProject();
        const html = builder.generateProjectCard(project);
        
        expect(html).toContain('<svg');
        expect(html).toContain('viewBox="0 0 24 24"');
      });
    });

    describe('generateHTML with admin mode', () => {
      it('should include admin styles when adminMode is true', () => {
        const builder = new HTMLBuilder(config, { adminMode: true });
        const projectsData: ProjectsData = {
          projects: [createValidProject()],
          config: {}
        };
        const html = builder.generateHTML(projectsData);
        
        expect(html).toContain('<style>');
        expect(html).toContain('.admin-controls');
        expect(html).toContain('.admin-btn');
        expect(html).toContain('rgba(255, 255, 255, 0.95)');
      });

      it('should not include admin styles when adminMode is false', () => {
        const builder = new HTMLBuilder(config, { adminMode: false });
        const projectsData: ProjectsData = {
          projects: [createValidProject()],
          config: {}
        };
        const html = builder.generateHTML(projectsData);
        
        expect(html).not.toContain('.admin-controls');
        expect(html).not.toContain('.admin-btn');
      });

      it('should include admin script when adminMode is true', () => {
        const builder = new HTMLBuilder(config, { adminMode: true });
        const projectsData: ProjectsData = {
          projects: [createValidProject()],
          config: {}
        };
        const html = builder.generateHTML(projectsData);
        
        expect(html).toContain('window.parent.postMessage');
        expect(html).toContain('admin-action');
        expect(html).toContain("type: 'admin-action'");
      });

      it('should not include admin script when adminMode is false', () => {
        const builder = new HTMLBuilder(config, { adminMode: false });
        const projectsData: ProjectsData = {
          projects: [createValidProject()],
          config: {}
        };
        const html = builder.generateHTML(projectsData);
        
        expect(html).not.toContain('admin-action');
        expect(html).not.toContain('window.parent.postMessage');
      });

      it('should include create button in header when adminMode is true', () => {
        const builder = new HTMLBuilder(config, { adminMode: true });
        const projectsData: ProjectsData = {
          projects: [createValidProject()],
          config: {}
        };
        const html = builder.generateHTML(projectsData);
        
        expect(html).toContain('class="admin-btn admin-create"');
        expect(html).toContain('id="admin-create-btn"');
        expect(html).toContain('Create New Project');
      });

      it('should not include create button when adminMode is false', () => {
        const builder = new HTMLBuilder(config, { adminMode: false });
        const projectsData: ProjectsData = {
          projects: [createValidProject()],
          config: {}
        };
        const html = builder.generateHTML(projectsData);
        
        expect(html).not.toContain('admin-create');
        expect(html).not.toContain('Create New Project');
      });

      it('should include postMessage handlers for edit, delete, and create actions', () => {
        const builder = new HTMLBuilder(config, { adminMode: true });
        const projectsData: ProjectsData = {
          projects: [createValidProject()],
          config: {}
        };
        const html = builder.generateHTML(projectsData);
        
        expect(html).toContain("action: 'edit'");
        expect(html).toContain("action: 'delete'");
        expect(html).toContain("action: 'create'");
        expect(html).toContain('window.location.origin');
      });

      it('should generate valid HTML structure with admin controls', () => {
        const builder = new HTMLBuilder(config, { adminMode: true });
        const projectsData: ProjectsData = {
          projects: [createValidProject()],
          config: {}
        };
        const html = builder.generateHTML(projectsData);
        
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html lang="en">');
        expect(html).toContain('</html>');
        expect(html).toContain('</head>');
        expect(html).toContain('</body>');
      });
    });
  });

  describe('generateHTML', () => {
    it('should generate complete HTML document', () => {
      const projectsData: ProjectsData = {
        projects: [createValidProject()],
        config: {}
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('</html>');
    });

    it('should include config title in head and header', () => {
      const projectsData: ProjectsData = {
        projects: [createValidProject()],
        config: {}
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      expect(html).toContain('<title>Test Portfolio</title>');
      expect(html).toContain('<h1>Test Portfolio</h1>');
    });

    it('should include config description in meta and header', () => {
      const projectsData: ProjectsData = {
        projects: [createValidProject()],
        config: {}
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      expect(html).toContain('<meta name="description" content="A test portfolio site">');
      expect(html).toContain('<p class="site-description">A test portfolio site</p>');
    });

    it('should include stylesheet links', () => {
      const projectsData: ProjectsData = {
        projects: [createValidProject()],
        config: {}
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      expect(html).toContain('<link rel="stylesheet" href="styles/main.css">');
      expect(html).toContain('<link rel="stylesheet" href="styles/cards.css">');
    });

    it('should include script tags', () => {
      const projectsData: ProjectsData = {
        projects: [createValidProject()],
        config: {}
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      expect(html).toContain('<script src="scripts/search.js">');
      expect(html).toContain('<script src="scripts/filter.js">');
      expect(html).toContain('<script src="scripts/modal.js">');
      expect(html).toContain('<script src="scripts/dynamic-background.js">');
    });

    it('should sort projects by date (newest first)', () => {
      const projectsData: ProjectsData = {
        projects: [
          createValidProject({ id: 'old', title: 'Old Project', creationDate: '2020-01-01' }),
          createValidProject({ id: 'new', title: 'New Project', creationDate: '2024-01-01' }),
          createValidProject({ id: 'mid', title: 'Mid Project', creationDate: '2022-01-01' })
        ],
        config: {}
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      const newIndex = html.indexOf('New Project');
      const midIndex = html.indexOf('Mid Project');
      const oldIndex = html.indexOf('Old Project');
      
      expect(newIndex).toBeLessThan(midIndex);
      expect(midIndex).toBeLessThan(oldIndex);
    });

    it('should include all unique tags in filter', () => {
      const projectsData: ProjectsData = {
        projects: [
          createValidProject({ id: 'p1', tags: ['javascript', 'web'] }),
          createValidProject({ id: 'p2', tags: ['python', 'web'] }),
          createValidProject({ id: 'p3', tags: ['javascript', 'cli'] })
        ],
        config: {}
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      expect(html).toContain('data-tag="javascript"');
      expect(html).toContain('data-tag="python"');
      expect(html).toContain('data-tag="web"');
      expect(html).toContain('data-tag="cli"');
    });

    it('should add featured tag if any project is featured', () => {
      const projectsData: ProjectsData = {
        projects: [
          createValidProject({ id: 'p1', featured: true, tags: ['javascript'] }),
          createValidProject({ id: 'p2', tags: ['python'] })
        ],
        config: {}
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      expect(html).toContain('★ featured');
    });

    it('should not add featured tag if no projects are featured', () => {
      const projectsData: ProjectsData = {
        projects: [
          createValidProject({ id: 'p1', featured: false, tags: ['javascript'] }),
          createValidProject({ id: 'p2', tags: ['python'] })
        ],
        config: {}
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      expect(html).not.toContain('★ featured');
    });

    it('should include dynamic background iframe when configured', () => {
      const customConfig: Config = {
        ...config,
        dynamicBackgrounds: ['https://example.com/bg1', 'https://example.com/bg2']
      };
      const builder = new HTMLBuilder(customConfig);
      const projectsData: ProjectsData = {
        projects: [createValidProject()],
        config: {}
      };
      const html = builder.generateHTML(projectsData);
      
      expect(html).toContain('id="dynamic-background"');
      expect(html).toContain('<iframe');
    });

    it('should not include dynamic background iframe when not configured', () => {
      const projectsData: ProjectsData = {
        projects: [createValidProject()],
        config: {}
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      expect(html).not.toContain('id="dynamic-background"');
    });

    it('should include stats section with project counts', () => {
      const projectsData: ProjectsData = {
        projects: [
          createValidProject({ id: 'p1', featured: true }),
          createValidProject({ id: 'p2', featured: false }),
          createValidProject({ id: 'p3', featured: true })
        ],
        config: {}
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      expect(html).toContain('3 projects');
      expect(html).toContain('2 featured');
    });

    it('should include earliest project year in stats', () => {
      const projectsData: ProjectsData = {
        projects: [
          createValidProject({ id: 'p1', creationDate: '2020-01-01' }),
          createValidProject({ id: 'p2', creationDate: '2024-01-01' }),
          createValidProject({ id: 'p3', creationDate: '2018-06-15' })
        ],
        config: {}
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      expect(html).toContain('Since 2018');
    });

    it('should embed projects data as JSON in script tag', () => {
      const projectsData: ProjectsData = {
        projects: [createValidProject()],
        config: {}
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      expect(html).toContain('window.PROJECTS_DATA =');
      expect(html).toContain('"id": "test-project"');
      expect(html).toContain('"title": "Test Project"');
    });

    it('should merge embedded config with builder config, with builder config taking precedence', () => {
      const projectsData: ProjectsData = {
        projects: [createValidProject()],
        config: {
          title: 'Embedded Title',
          description: 'Embedded Description'
        }
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      // Builder config (from constructor) should take precedence
      expect(html).toContain('<title>Test Portfolio</title>');
      expect(html).toContain('<h1>Test Portfolio</h1>');
      expect(html).toContain('<meta name="description" content="A test portfolio site">');
    });

    it('should include no-results section', () => {
      const projectsData: ProjectsData = {
        projects: [createValidProject()],
        config: {}
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      expect(html).toContain('id="no-results"');
      expect(html).toContain('No projects found matching your criteria');
      expect(html).toContain('id="clear-filters"');
    });

    it('should include footer with attribution', () => {
      const projectsData: ProjectsData = {
        projects: [createValidProject()],
        config: {}
      };
      const html = htmlBuilder.generateHTML(projectsData);
      
      expect(html).toContain('class="site-footer"');
      expect(html).toContain('Generated with ❤️');
      expect(html).toContain('Projection');
    });
  });
});
