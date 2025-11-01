// Filter and sort functionality
class ProjectFilter {
  constructor() {
    this.tagFilters = document.querySelectorAll('.tag-filter');
    this.projectTags = document.querySelectorAll('.project-tags .tag');
    this.sortSelect = document.getElementById('sort-select');
    this.clearFiltersBtn = document.getElementById('clear-filters');
    this.projectsGrid = document.getElementById('projects-grid');
    
    this.activeFilters = new Set(['all']);
    this.currentSort = 'date';
    this.searchActive = false;
    
    this.init();
  }
  
  init() {
    // Tag filter buttons
    this.tagFilters.forEach(filter => {
      filter.addEventListener('click', (e) => {
        this.toggleTagFilter(e.target.dataset.tag);
      });
    });
    
    // Tags in project cards (for quick filtering)
    this.projectTags.forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleTagFilter(e.target.dataset.tag);
      });
    });
    
    // Sort select
    this.sortSelect.addEventListener('change', (e) => {
      this.setSortOrder(e.target.value);
    });
    
    // Clear filters button
    this.clearFiltersBtn.addEventListener('click', () => {
      this.clearAllFilters();
    });
  }
  
  toggleTagFilter(tag) {
    if (tag === 'all') {
      this.clearAllFilters();
      return;
    }
    
    // Remove 'all' filter when selecting specific tags
    this.activeFilters.delete('all');
    
    if (this.activeFilters.has(tag)) {
      this.activeFilters.delete(tag);
    } else {
      this.activeFilters.add(tag);
    }
    
    // If no filters active, activate 'all'
    if (this.activeFilters.size === 0) {
      this.activeFilters.add('all');
    }
    
    this.updateFilterUI();
    this.applyFilters();
  }
  
  updateFilterUI() {
    this.tagFilters.forEach(filter => {
      const tag = filter.dataset.tag;
      filter.classList.toggle('active', this.activeFilters.has(tag));
    });
    
    // Update tag highlighting in cards and modal
    this.updateTagHighlighting();
  }
  
  updateTagHighlighting() {
    // Update tags in project cards
    document.querySelectorAll('.project-tags .tag').forEach(tag => {
      const tagName = tag.dataset.tag;
      tag.classList.toggle('active-filter', this.activeFilters.has(tagName) && !this.activeFilters.has('all'));
    });
    
    // Update tags in modal if it's open
    document.querySelectorAll('.modal-tags .tag').forEach(tag => {
      const tagName = tag.dataset.tag;
      tag.classList.toggle('active-filter', this.activeFilters.has(tagName) && !this.activeFilters.has('all'));
    });
  }
  
  applyFilters() {
    // If search is active, don't override search results
    if (this.searchActive) {
      return;
    }
    
    const projectCards = document.querySelectorAll('.project-card');
    let visibleCount = 0;
    
    projectCards.forEach(card => {
      if (this.shouldShowProject(card)) {
        card.style.display = 'block';
        card.classList.remove('filtered-out');
        visibleCount++;
      } else {
        card.style.display = 'none';
        card.classList.add('filtered-out');
      }
    });
    
    // Apply sorting to visible cards
    this.sortProjects();
    
    // Show/hide no results message
    this.toggleNoResults(visibleCount === 0);
    
    // Update URL with active filters
    this.updateURL();
  }
  
  shouldShowProject(card) {
    // If 'all' is active, show all projects
    if (this.activeFilters.has('all')) {
      return true;
    }
    
    const projectId = card.dataset.projectId;
    const project = window.PROJECTS_DATA.projects.find(p => p.id === projectId);
    
    if (!project) return false;
    
    // Check if project has ALL of the active filter tags
    return [...this.activeFilters].every(filterTag => {
      // Handle 'featured' specially - check the featured field instead of tags
      if (filterTag === 'featured') {
        return project.featured === true;
      }
      // For all other tags, check the tags array
      return project.tags.includes(filterTag);
    });
  }
  
  setSortOrder(sortOrder) {
    this.currentSort = sortOrder;
    this.sortProjects();
    this.updateURL();
  }
  
  sortProjects() {
    const projectsContainer = this.projectsGrid;
    const projectCards = Array.from(projectsContainer.querySelectorAll('.project-card'));
    
    // Only sort visible cards
    const visibleCards = projectCards.filter(card => 
      card.style.display !== 'none'
    );
    
    visibleCards.sort((a, b) => {
      const projectA = window.PROJECTS_DATA.projects.find(p => p.id === a.dataset.projectId);
      const projectB = window.PROJECTS_DATA.projects.find(p => p.id === b.dataset.projectId);
      
      switch (this.currentSort) {
        case 'date':
          return new Date(projectB.creationDate) - new Date(projectA.creationDate);
        case 'date-asc':
          return new Date(projectA.creationDate) - new Date(projectB.creationDate);
        case 'name':
          return projectA.title.localeCompare(projectB.title);
        case 'name-desc':
          return projectB.title.localeCompare(projectA.title);
        default:
          return new Date(projectB.creationDate) - new Date(projectA.creationDate);
      }
    });
    
    // Reorder DOM elements
    visibleCards.forEach(card => {
      projectsContainer.appendChild(card);
    });
  }
  
  clearAllFilters() {
    this.activeFilters.clear();
    this.activeFilters.add('all');
    this.updateFilterUI();
    this.applyFilters();
    
    // Clear search as well
    if (window.projectSearch) {
      window.projectSearch.clearSearch();
    }
  }
  
  toggleNoResults(show) {
    const noResults = document.getElementById('no-results');
    noResults.style.display = show ? 'block' : 'none';
  }
  
  updateURL() {
    const params = {};
    
    // Add active filters to URL (except 'all')
    const filterTags = [...this.activeFilters].filter(tag => tag !== 'all');
    if (filterTags.length > 0) {
      params.tags = filterTags.join(',');
    }
    
    // Add sort order to URL
    params.sort = this.currentSort;
    
    const url = new URL(window.location);
    
    // Remove all our parameters first
    url.searchParams.delete('tags');
    url.searchParams.delete('sort');
    
    // Then add the current ones
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
    
    window.history.replaceState({}, '', url);
  }
  
  // Public method to set filters from external sources (like URL params)
  setFilters(tags, sort) {
    if (tags && tags.length > 0) {
      this.activeFilters.clear();
      tags.forEach(tag => this.activeFilters.add(tag));
    }
    
    if (sort) {
      this.currentSort = sort;
      this.sortSelect.value = sort;
    }
    
    this.updateFilterUI();
    this.applyFilters();
  }
}

// Initialize filters when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.projectFilter = new ProjectFilter();
  
  // Load filters from URL parameters if present
  const urlParams = new URLSearchParams(window.location.search);
  const tagFilters = urlParams.get('tags');
  const sortOrder = urlParams.get('sort');
  
  if (tagFilters || sortOrder) {
    const tags = tagFilters ? tagFilters.split(',') : [];
    window.projectFilter.setFilters(tags, sortOrder);
  }
  
  // Initial tag highlighting
  window.projectFilter.updateTagHighlighting();
}); 