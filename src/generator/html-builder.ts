import { Project, ProjectsData } from '../types/project';
import { Config } from '../types/config';

/**
 * Options for configuring HTMLBuilder behavior
 */
export interface HTMLBuilderOptions {
  adminMode?: boolean;
}

/**
 * HTMLBuilder class handles the generation of HTML content for the portfolio site
 */
export class HTMLBuilder {
  private config: Config;
  private adminMode: boolean;

  constructor(config: Config, options: HTMLBuilderOptions = {}) {
    this.config = config;
    this.adminMode = options.adminMode || false;
  }

  /**
   * Generates admin control buttons for a project card
   * Only included when adminMode is true
   */
  private generateAdminControls(projectId: string): string {
    if (!this.adminMode) return '';
    
    return `
      <div class="admin-controls">
        <button class="admin-btn admin-edit" data-project-id="${projectId}" title="Edit project">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Edit
        </button>
        <button class="admin-btn admin-delete" data-project-id="${projectId}" title="Delete project">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Delete
        </button>
      </div>`;
  }

  /**
   * Generates the create new project button for header
   * Disabled - create button is in admin UI, not preview
   */
  private generateCreateButton(): string {
    return '';
  }

  /**
   * Generates admin-specific CSS styles
   * Only included when adminMode is true
   */
  private generateAdminStyles(): string {
    if (!this.adminMode) return '';
    
    return `
  <style>
    .admin-controls {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 8px;
      z-index: 10;
      opacity: 0.8;
      transition: opacity 0.2s ease;
    }
    
    .project-card:hover .admin-controls {
      opacity: 1;
    }
    
    .admin-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .admin-btn:hover {
      background: white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      transform: translateY(-1px);
    }
    
    .admin-edit {
      color: #4c63d2;
    }
    
    .admin-delete {
      color: #e53e3e;
    }
    
    .admin-create {
      background: #4c63d2;
      color: white;
      border-color: #4c63d2;
      margin-left: 1rem;
    }
    
    .admin-create:hover {
      background: #3c51b4;
    }
    
    .project-card {
      position: relative;
    }
  </style>`;
  }

  /**
   * Generates postMessage communication JavaScript
   * Only included when adminMode is true
   */
  private generateAdminScript(): string {
    if (!this.adminMode) return '';
    
    return `
  <script>
    (function() {
      // Disable card click navigation in admin mode
      // Use capture phase to intercept before modal.js handler
      document.addEventListener('click', function(e) {
        const card = e.target.closest('.project-card');
        
        // If clicking on a card (but not on a link or tag), stop the event
        // This prevents modal.js from opening the project link
        if (card && !e.target.closest('a') && !e.target.closest('.tag')) {
          e.stopImmediatePropagation();
        }
        
        // Handle edit button clicks
        if (e.target.closest('.admin-edit')) {
          const projectId = e.target.closest('.admin-edit').dataset.projectId;
          window.parent.postMessage({
            type: 'admin-action',
            action: 'edit',
            projectId: projectId
          }, window.location.origin);
        }
        
        // Handle delete button clicks
        if (e.target.closest('.admin-delete')) {
          const projectId = e.target.closest('.admin-delete').dataset.projectId;
          window.parent.postMessage({
            type: 'admin-action',
            action: 'delete',
            projectId: projectId
          }, window.location.origin);
        }
        
        // Handle create button click
        if (e.target.closest('.admin-create')) {
          window.parent.postMessage({
            type: 'admin-action',
            action: 'create'
          }, window.location.origin);
        }
      }, true);
    })();
  </script>`;
  }

  /**
   * Formats a date string into a human-readable format
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Resolves a thumbnail path based on the base URL
   * Handles absolute URLs, relative paths, and domain-absolute paths
   */
  resolveThumbnailPath(thumbnailLink: string | undefined, baseUrl: string): string {
    if (!thumbnailLink) {
      return baseUrl + 'images/magnet pendulum.PNG';
    }

    // If it's already an absolute URL (http/https), return as-is
    if (thumbnailLink.startsWith('http://') || thumbnailLink.startsWith('https://')) {
      return thumbnailLink;
    }

    // If it starts with '/', it's an absolute path from domain root - leave as-is
    if (thumbnailLink.startsWith('/')) {
      return thumbnailLink;
    }

    // If it starts with './', it's relative to base URL
    if (thumbnailLink.startsWith('./')) {
      return baseUrl + thumbnailLink.substring(2);
    }

    // If it starts with '../', it's relative to base URL parent
    if (thumbnailLink.startsWith('../')) {
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');
      const parentUrl = cleanBaseUrl.substring(0, cleanBaseUrl.lastIndexOf('/') + 1);
      return parentUrl + thumbnailLink.substring(3);
    }

    // Otherwise, treat as relative to base URL
    return baseUrl + thumbnailLink;
  }

  /**
   * Resolves a page link based on the base URL
   * Handles absolute URLs, relative paths, and domain-absolute paths
   */
  resolvePageLink(pageLink: string, baseUrl: string): string {
    // If it's already a full URL, use it as-is
    if (pageLink.startsWith('http://') || pageLink.startsWith('https://')) {
      return pageLink;
    }

    // If it starts with '/', it's an absolute path from domain root
    if (pageLink.startsWith('/')) {
      return pageLink;
    }

    // If it starts with './', it's relative to base URL
    if (pageLink.startsWith('./')) {
      return baseUrl + pageLink.substring(2);
    }

    // If it starts with '../', it's relative to base URL parent
    if (pageLink.startsWith('../')) {
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');
      const parentUrl = cleanBaseUrl.substring(0, cleanBaseUrl.lastIndexOf('/') + 1);
      return parentUrl + pageLink.substring(3);
    }

    // Otherwise, treat as relative to base URL
    return baseUrl + pageLink;
  }

  /**
   * Generates HTML for a single project card
   */
  generateProjectCard(project: Project): string {
    const formattedDate = this.formatDate(project.creationDate);
    const tags = project.tags
      .filter(tag => tag !== 'featured')
      .map(tag => `<span class="tag" data-tag="${tag}">${tag}</span>`)
      .join('');
    const featuredClass = project.featured ? ' featured' : '';

    // Use thumbnail as background image if it exists
    const backgroundStyle = project.thumbnailLink
      ? ` style="background-image: url('${this.resolveThumbnailPath(project.thumbnailLink, this.config.baseUrl)}');"`
      : '';

    // Resolve the page link for the title hyperlink
    const resolvedPageLink = this.resolvePageLink(project.pageLink, this.config.baseUrl);

    // Generate admin controls if in admin mode
    const adminControls = this.generateAdminControls(project.id);

    return `
    <div class="project-card${featuredClass}" data-project-id="${project.id}"${backgroundStyle}>
      ${adminControls}
      <div class="card-content">
        <div class="card-info">
          <h3 class="project-title">
            <a href="${resolvedPageLink}" target="_blank" rel="noopener noreferrer" class="title-link">
              ${project.title}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-left: 6px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"></path><polyline points="15,3 21,3 21,9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </h3>
          <p class="project-date">${formattedDate}</p>
          <p class="project-description">${project.description}</p>
        </div>
        <div class="card-bottom">
          <div class="project-tags">${tags}</div>
          ${project.sourceLink ? `<div class="card-actions">
            <a href="${project.sourceLink}" class="btn-secondary" target="_blank" rel="noopener">Source Code <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-left: 4px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"></path><polyline points="15,3 21,3 21,9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>
          </div>` : ''}
        </div>
      </div>
    </div>`;
  }

  /**
   * Generates HTML for the tag filter section
   */
  generateTagFilter(allTags: string[]): string {
    const tagButtons = allTags.map(tag => {
      if (tag === 'featured') {
        return `<button class="tag-filter" data-tag="${tag}">★ ${tag}</button>`;
      }
      return `<button class="tag-filter" data-tag="${tag}">${tag}</button>`;
    }).join('');

    return `
    <div class="filter-section">
      <div class="search-container">
        <input type="text" id="search-input" placeholder="Search projects...">
        <button id="clear-search">Clear</button>
      </div>
      <div class="tag-filters">
        <button class="tag-filter active" data-tag="all">All</button>
        ${tagButtons}
      </div>
      <div class="sort-controls">
        <label>Sort by:</label>
        <select id="sort-select">
          <option value="date">Date (Newest)</option>
          <option value="date-asc">Date (Oldest)</option>
          <option value="name">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
        </select>
      </div>
    </div>`;
  }

  /**
   * Generates HTML for the project modal (currently not used in output)
   */
  generateModal(projects: Project[]): string {
    return `
    <div id="project-modal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modal-title"></h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-image">
            <img id="modal-thumbnail" src="" alt="">
          </div>
          <div class="modal-info">
            <p id="modal-description"></p>
            <p class="modal-date">Created: <span id="modal-date"></span></p>
            <div class="modal-tags" id="modal-tags"></div>
            <div class="modal-actions">
              <a id="modal-primary-link" href="" class="btn-primary" target="_blank" rel="noopener">View Project</a>
              <a id="modal-source-link" href="" class="btn-secondary" target="_blank" rel="noopener" style="display: none;">Source Code</a>
            </div>
          </div>
        </div>
        <div class="modal-navigation">
          <button id="modal-prev" class="nav-btn">← Previous</button>
          <button id="modal-next" class="nav-btn">Next →</button>
        </div>
      </div>
    </div>`;
  }

  /**
   * Generates the complete HTML document for the portfolio site
   */
  generateHTML(projectsData: ProjectsData): string {
    const { projects, config } = projectsData;
    // Constructor config takes precedence over embedded config
    const mergedConfig = { ...config, ...this.config };

    // Sort projects by date (newest first)
    const sortedProjects = [...projects].sort((a, b) => {
      return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
    });

    // Generate all unique tags
    const allTags = [...new Set(projects.flatMap(p => p.tags))].sort();
    // Add featured as a special tag if any projects are featured
    const hasFeaturedProjects = projects.some(p => p.featured);
    if (hasFeaturedProjects && !allTags.includes('featured')) {
      allTags.unshift('featured'); // Add at beginning so it appears first
    }

    // Generate project cards
    const projectCards = sortedProjects.map(project => this.generateProjectCard(project)).join('');

    // Generate components
    const tagFilter = this.generateTagFilter(allTags);

    // Generate dynamic background iframe if configured
    const dynamicBackgroundHTML = mergedConfig.dynamicBackgrounds && mergedConfig.dynamicBackgrounds.length > 0
      ? `<iframe id="dynamic-background" src="" frameborder="0" tabindex="-1" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;"></iframe>`
      : '';

    // Generate admin features if in admin mode
    const createButton = this.generateCreateButton();
    const adminStyles = this.generateAdminStyles();
    const adminScript = this.generateAdminScript();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${this.adminMode ? '<base href="http://localhost:3000/">' : ''}
  <title>${mergedConfig.title}</title>
  <meta name="description" content="${mergedConfig.description}">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link rel="stylesheet" href="styles/main.css">
  <link rel="stylesheet" href="styles/cards.css">
  <!-- <link rel="stylesheet" href="styles/modal.css"> Modal styles not currently used -->${adminStyles}
</head>
<body>
  ${dynamicBackgroundHTML}
  <header class="site-header">
    <div class="container">
      <h1>${mergedConfig.title}${createButton}</h1>
      <p class="site-description">${mergedConfig.description}</p>
      <div class="stats">
        <span>${projects.length} projects</span>
        <span>${projects.filter(p => p.featured).length} featured</span>
        <span>Since ${Math.min(...projects.map(p => new Date(p.creationDate).getFullYear()))}</span>
      </div>
    </div>
  </header>

  <main class="container">
    ${tagFilter}
    
    <div class="projects-grid" id="projects-grid">
      ${projectCards}
    </div>
    
    <div class="no-results" id="no-results" style="display: none;">
      <p>No projects found matching your criteria.</p>
      <button id="clear-filters">Clear all filters</button>
    </div>
  </main>

  <!-- Modal HTML commented out - currently not used -->
  <!-- ${this.generateModal(projects)} -->

  <footer class="site-footer">
    <div class="container">
      <p>Generated with ❤️ by <a href="https://github.com/quasarbright/projection" target="_blank" rel="noopener noreferrer">Projection <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-left: 4px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"></path><polyline points="15,3 21,3 21,9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a></p>
    </div>
  </footer>

  <script>
    window.PROJECTS_DATA = ${JSON.stringify({ 
      projects: sortedProjects, 
      config: {
        title: mergedConfig.title,
        description: mergedConfig.description,
        baseUrl: mergedConfig.baseUrl,
        itemsPerPage: mergedConfig.itemsPerPage,
        dynamicBackgrounds: mergedConfig.dynamicBackgrounds,
        defaultScreenshot: mergedConfig.defaultScreenshot
      }
    }, null, 2)};
  </script>
  <script src="scripts/search.js"></script>
  <script src="scripts/filter.js"></script>
  <script src="scripts/modal.js"></script>
  <script src="scripts/dynamic-background.js"></script>${adminScript}
</body>
</html>`;
  }
}
