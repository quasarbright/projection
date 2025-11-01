// Search functionality
class ProjectSearch {
  constructor() {
    this.searchInput = document.getElementById('search-input');
    this.clearButton = document.getElementById('clear-search');
    this.noResults = document.getElementById('no-results');
    this.projectsGrid = document.getElementById('projects-grid');
    
    this.init();
  }
  
  init() {
    // Search input event listener
    this.searchInput.addEventListener('input', (e) => {
      this.performSearch(e.target.value);
    });
    
    // Clear search button
    this.clearButton.addEventListener('click', () => {
      this.clearSearch();
    });
    
    // Enter key support
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.searchInput.blur(); // Remove focus after search
      }
    });
  }
  
  performSearch(query) {
    const searchTerm = query.toLowerCase().trim();
    const projectCards = document.querySelectorAll('.project-card');
    let visibleCount = 0;
    
    projectCards.forEach(card => {
      if (this.matchesSearch(card, searchTerm)) {
        card.style.display = 'block';
        card.classList.remove('filtered-out');
        visibleCount++;
      } else {
        card.style.display = 'none';
        card.classList.add('filtered-out');
      }
    });
    
    // Sort visible cards with featured first
    this.sortSearchResults();
    
    // Show/hide no results message
    this.toggleNoResults(visibleCount === 0 && searchTerm !== '');
    
    // Update URL with search query
    this.updateURL({ search: searchTerm });
    
    // If there's an active search, inform the filter system
    if (window.projectFilter && searchTerm) {
      window.projectFilter.searchActive = true;
    } else if (window.projectFilter) {
      window.projectFilter.searchActive = false;
    }
  }
  
  sortSearchResults() {
    const projectsContainer = this.projectsGrid;
    const visibleCards = Array.from(projectsContainer.querySelectorAll('.project-card'))
      .filter(card => card.style.display !== 'none');
    
    visibleCards.sort((a, b) => {
      // Sort by creation date (newest first)
      const aId = a.dataset.projectId;
      const bId = b.dataset.projectId;
      const projectA = window.PROJECTS_DATA.projects.find(p => p.id === aId);
      const projectB = window.PROJECTS_DATA.projects.find(p => p.id === bId);
      
      return new Date(projectB.creationDate) - new Date(projectA.creationDate);
    });
    
    // Reorder DOM elements
    visibleCards.forEach(card => {
      projectsContainer.appendChild(card);
    });
  }
  
  matchesSearch(card, searchTerm) {
    if (!searchTerm) return true;
    
    const projectId = card.dataset.projectId;
    const project = window.PROJECTS_DATA.projects.find(p => p.id === projectId);
    
    if (!project) return false;
    
    // Search in title, description, and tags
    const searchableText = [
      project.title,
      project.description,
      ...project.tags
    ].join(' ').toLowerCase();
    
    return searchableText.includes(searchTerm);
  }
  
  clearSearch() {
    this.searchInput.value = '';
    this.performSearch('');
    
    // Re-apply filters when search is cleared
    if (window.projectFilter) {
      window.projectFilter.searchActive = false;
      window.projectFilter.applyFilters();
    }
  }
  
  toggleNoResults(show) {
    this.noResults.style.display = show ? 'block' : 'none';
  }
  
  updateURL(params) {
    const url = new URL(window.location);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.replaceState({}, '', url);
  }
  
  // Public method to set search from external sources (like URL params)
  setSearch(query) {
    this.searchInput.value = query;
    this.performSearch(query);
  }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.projectSearch = new ProjectSearch();
  
  // Load search from URL parameters if present (with slight delay to ensure DOM is ready)
  setTimeout(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
      window.projectSearch.setSearch(searchQuery);
    }
  }, 50);
}); 