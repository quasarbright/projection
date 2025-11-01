#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration
const CONFIG = {
  output: 'dist/index.html',
  templateDir: 'templates/',
  stylesDir: 'styles/',
  scriptsDir: 'scripts/',
  baseUrl: '../'
};

// Utility functions
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    process.exit(1);
  }
}

function findAndReadProjectsFile() {
  // Try YAML first, then JSON
  const candidates = ['projects.yaml', 'projects.yml', 'projects.json'];
  
  for (const filename of candidates) {
    if (fs.existsSync(filename)) {
      console.log(`📄 Reading ${filename}...`);
      const content = readFile(filename);
      
      try {
        if (filename.endsWith('.json')) {
          return JSON.parse(content);
        } else {
          return yaml.load(content);
        }
      } catch (error) {
        console.error(`Error parsing ${filename}:`, error.message);
        process.exit(1);
      }
    }
  }
  
  console.error('❌ No projects file found! Please create projects.yaml or projects.json');
  process.exit(1);
}

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function resolveThumbnailPath(thumbnailLink, baseUrl) {
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

function resolvePageLink(pageLink, baseUrl) {
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

function generateProjectCard(project, config) {
  const formattedDate = formatDate(project.creationDate);
  const tags = project.tags.filter(tag => tag !== 'featured').map(tag => `<span class="tag" data-tag="${tag}">${tag}</span>`).join('');
  const featuredClass = project.featured ? ' featured' : '';

  // Use thumbnail as background image if it exists
  const backgroundStyle = project.thumbnailLink ? 
    ` style="background-image: url('${resolveThumbnailPath(project.thumbnailLink, config.baseUrl)}');"` : '';
  
  // Resolve the page link for the title hyperlink
  const resolvedPageLink = resolvePageLink(project.pageLink, config.baseUrl);
  
  return `
    <div class="project-card${featuredClass}" data-project-id="${project.id}"${backgroundStyle}>
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

function generateModal(projects) {
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

function generateTagFilter(allTags) {
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

function generateHTML(projectsData) {
  const { projects, config } = projectsData;
  
  // Sort projects by date (newest first)
  const sortedProjects = projects.sort((a, b) => {
    return new Date(b.creationDate) - new Date(a.creationDate);
  });
  
  // Generate all unique tags
  const allTags = [...new Set(projects.flatMap(p => p.tags))].sort();
  // Add featured as a special tag if any projects are featured
  const hasFeaturedProjects = projects.some(p => p.featured);
  if (hasFeaturedProjects && !allTags.includes('featured')) {
    allTags.unshift('featured'); // Add at beginning so it appears first
  }
  
  // Generate project cards
  const projectCards = sortedProjects.map(project => generateProjectCard(project, config)).join('');
  
  // Generate components
  const tagFilter = generateTagFilter(allTags);
  // const modal = generateModal(projects); // Modal currently not used
  
  // Generate dynamic background iframe if configured
  const dynamicBackgroundHTML = config.dynamicBackgrounds && config.dynamicBackgrounds.length > 0 ? 
    `<iframe id="dynamic-background" src="" frameborder="0" tabindex="-1" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;"></iframe>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  <meta name="description" content="${config.description}">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link rel="stylesheet" href="styles/main.css">
  <link rel="stylesheet" href="styles/cards.css">
  <!-- <link rel="stylesheet" href="styles/modal.css"> Modal styles not currently used -->
</head>
<body>
  ${dynamicBackgroundHTML}
  <header class="site-header">
    <div class="container">
      <h1>${config.title}</h1>
      <p class="site-description">${config.description}</p>
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
  <!-- ${generateModal(projects)} -->

  <footer class="site-footer">
    <div class="container">
      <p>Generated with ❤️ by <a href="https://github.com/quasarbright/quasarbright.github.io/tree/master/p5js/project-display" target="_blank" rel="noopener noreferrer">Projection <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-left: 4px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"></path><polyline points="15,3 21,3 21,9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a></p>
    </div>
  </footer>

  <script>
    window.PROJECTS_DATA = ${JSON.stringify({ projects, config }, null, 2)};
  </script>
  <script src="scripts/search.js"></script>
  <script src="scripts/filter.js"></script>
  <script src="scripts/modal.js"></script>
  <script src="scripts/dynamic-background.js"></script>
</body>
</html>`;
}

function copyAssets() {
  const assetsToOopy = [
    { from: CONFIG.stylesDir, to: 'dist/styles/' },
    { from: CONFIG.scriptsDir, to: 'dist/scripts/' }
    // Screenshots and images are now linked directly via baseUrl, not copied
  ];
  
  // Copy favicon
  const faviconSrc = 'assets/favicon.ico';
  const faviconDest = 'dist/favicon.ico';
  if (fs.existsSync(faviconSrc)) {
    fs.copyFileSync(faviconSrc, faviconDest);
    console.log(`Copied ${faviconSrc} → ${faviconDest}`);
  }
  
  assetsToOopy.forEach(({ from, to }) => {
    if (fs.existsSync(from)) {
      if (!fs.existsSync(to)) {
        fs.mkdirSync(to, { recursive: true });
      }
      
      const files = fs.readdirSync(from);
      files.forEach(file => {
        // Skip hidden files and directories
        if (file.startsWith('.')) return;
        
        const srcPath = path.join(from, file);
        const destPath = path.join(to, file);
        
        // Only copy files, not directories
        if (fs.statSync(srcPath).isFile()) {
          fs.copyFileSync(srcPath, destPath);
          console.log(`Copied ${from}${file} → ${to}${file}`);
        }
      });
    } else {
      console.log(`⚠️  Asset directory not found: ${from}`);
    }
  });
}

function validateProjects(projects) {
  const errors = [];
  
  projects.forEach((project, index) => {
    if (!project.id) errors.push(`Project ${index}: Missing id`);
    if (!project.title) errors.push(`Project ${index}: Missing title`);
    if (!project.pageLink) errors.push(`Project ${index}: Missing pageLink`);
    if (!project.creationDate) errors.push(`Project ${index}: Missing creationDate`);
    
    // Check for valid date
    if (project.creationDate && isNaN(new Date(project.creationDate))) {
      errors.push(`Project ${project.id}: Invalid date format`);
    }
    
    // Check for duplicate IDs
    const duplicates = projects.filter(p => p.id === project.id);
    if (duplicates.length > 1) {
      errors.push(`Duplicate project ID: ${project.id}`);
    }
  });
  
  if (errors.length > 0) {
    console.error('Validation errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
}

// Main execution
function main() {
  console.log('🚀 Starting static site generation...');
  
  // Read and parse projects data
  const projectsData = findAndReadProjectsFile();
  
  // Validate projects
  console.log('✅ Validating project data...');
  validateProjects(projectsData.projects);
  
  // Generate HTML
  console.log('🏗️  Generating HTML...');
  const html = generateHTML(projectsData);
  
  // Write output
  console.log('💾 Writing output file...');
  writeFile(CONFIG.output, html);
  
  // Copy assets
  console.log('📁 Copying assets...');
  copyAssets();
  
  console.log(`✨ Generated ${projectsData.projects.length} projects to ${CONFIG.output}`);
  console.log('🎉 Site generation complete!');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, generateHTML, validateProjects }; 