// Modal functionality - CURRENTLY NOT USED
// This modal system is preserved for potential future use
class ProjectModal {
  constructor() {
    this.modal = document.getElementById('project-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.modalThumbnail = document.getElementById('modal-thumbnail');
    this.modalDescription = document.getElementById('modal-description');
    this.modalDate = document.getElementById('modal-date');
    this.modalTags = document.getElementById('modal-tags');
    this.modalPrimaryLink = document.getElementById('modal-primary-link');
    this.modalSourceLink = document.getElementById('modal-source-link');
    this.modalClose = document.querySelector('.modal-close');
    this.modalPrev = document.getElementById('modal-prev');
    this.modalNext = document.getElementById('modal-next');
    
    this.currentProjectIndex = -1;
    this.visibleProjects = [];
    
    this.init();
  }
  
  init() {
    // Card clicks - COMMENTED OUT FOR DIRECT NAVIGATION
    // document.addEventListener('click', (e) => {
    //   const card = e.target.closest('.project-card');
    //   if (card && !e.target.closest('a') && !e.target.closest('.tag')) { // Only open modal if not clicking a link or tag
    //     const projectId = card.dataset.projectId;
    //     this.openModal(projectId);
    //   }
    // });
    
    // Close modal events
    this.modalClose.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
    
    // Navigation buttons
    this.modalPrev.addEventListener('click', () => this.navigateModal(-1));
    this.modalNext.addEventListener('click', () => this.navigateModal(1));
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.modal.classList.contains('active')) return;
      
      switch (e.key) {
        case 'Escape':
          this.closeModal();
          break;
        case 'ArrowLeft':
          this.navigateModal(-1);
          break;
        case 'ArrowRight':
          this.navigateModal(1);
          break;
      }
    });
  }
  
  openModal(projectId) {
    const project = window.PROJECTS_DATA.projects.find(p => p.id === projectId);
    if (!project) return;
    
    // Update visible projects list (only currently visible cards)
    this.updateVisibleProjects();
    this.currentProjectIndex = this.visibleProjects.findIndex(p => p.id === projectId);
    
    // Populate modal content
    this.populateModal(project);
    
    // Show modal
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Focus management
    this.modal.focus();
    
    // Update navigation buttons
    this.updateNavigationButtons();
  }
  
  closeModal() {
    this.modal.classList.add('closing');
    
    setTimeout(() => {
      this.modal.classList.remove('active', 'closing');
      document.body.style.overflow = ''; // Restore scrolling
    }, 300);
  }
  
  resolveThumbnailPath(thumbnailLink) {
    if (!thumbnailLink) {
      const baseUrl = window.PROJECTS_DATA && window.PROJECTS_DATA.config && window.PROJECTS_DATA.config.baseUrl 
        ? window.PROJECTS_DATA.config.baseUrl 
        : 'https://quasarbright.github.io/';
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
    
    // Get base URL from config
    const baseUrl = window.PROJECTS_DATA && window.PROJECTS_DATA.config && window.PROJECTS_DATA.config.baseUrl 
      ? window.PROJECTS_DATA.config.baseUrl 
      : 'https://quasarbright.github.io/';
    
    // If it starts with './', it's relative to base URL + p5js/
    if (thumbnailLink.startsWith('./')) {
      return baseUrl + 'p5js/' + thumbnailLink.substring(2);
    }
    
    // If it starts with '../', it's relative to base URL (one level up from p5js/)
    if (thumbnailLink.startsWith('../')) {
      return baseUrl + thumbnailLink.substring(3);
    }
    
    // Otherwise, treat as relative to base URL + p5js/
    return baseUrl + 'p5js/' + thumbnailLink;
  }
  
  resolvePageLink(pageLink) {
    if (!pageLink) {
      return '#';
    }
    
    // If it's already an absolute URL (http/https), return as-is
    if (pageLink.startsWith('http://') || pageLink.startsWith('https://')) {
      return pageLink;
    }
    
    // If it starts with '/', it's an absolute path from domain root - leave as-is
    if (pageLink.startsWith('/')) {
      return pageLink;
    }
    
    // Get base URL from config
    const baseUrl = window.PROJECTS_DATA && window.PROJECTS_DATA.config && window.PROJECTS_DATA.config.baseUrl 
      ? window.PROJECTS_DATA.config.baseUrl 
      : 'https://quasarbright.github.io/';
    
    // If it starts with './', it's relative to base URL + p5js/
    if (pageLink.startsWith('./')) {
      return baseUrl + 'p5js/' + pageLink.substring(2);
    }
    
    // If it starts with '../', it's relative to base URL (one level up from p5js/)
    if (pageLink.startsWith('../')) {
      return baseUrl + pageLink.substring(3);
    }
    
    // Otherwise, treat as relative to base URL + p5js/
    return baseUrl + 'p5js/' + pageLink;
  }

  populateModal(project) {
    // Title
    this.modalTitle.textContent = project.title;
    
    // Thumbnail
    const thumbnail = this.resolveThumbnailPath(project.thumbnailLink);
    this.modalThumbnail.src = thumbnail;
    this.modalThumbnail.alt = project.title;
    
    // Description
    this.modalDescription.textContent = project.description;
    
    // Date
    const formattedDate = this.formatDate(project.creationDate);
    this.modalDate.textContent = formattedDate;
    
    // Tags
    this.modalTags.innerHTML = project.tags
      .map(tag => `<span class="tag" data-tag="${tag}">${tag}</span>`)
      .join('');
    
    // Make tags clickable for filtering
    this.modalTags.querySelectorAll('.tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.preventDefault();
        const tagName = e.target.dataset.tag;
        this.closeModal();
        setTimeout(() => {
          if (window.projectFilter) {
            window.projectFilter.toggleTagFilter(tagName);
          }
        }, 350);
      });
    });
    
    // Update tag highlighting based on active filters
    if (window.projectFilter) {
      window.projectFilter.updateTagHighlighting();
    }
    
    // Primary link
    this.modalPrimaryLink.href = this.resolvePageLink(project.pageLink);
    this.modalPrimaryLink.innerHTML = this.getLinkText(project.pageLink) + ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-left: 4px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15,3 21,3 21,9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
    
    // Source link
    if (project.sourceLink) {
      this.modalSourceLink.href = this.resolvePageLink(project.sourceLink);
      this.modalSourceLink.innerHTML = 'Source Code <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-left: 4px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15,3 21,3 21,9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
      this.modalSourceLink.style.display = 'inline-block';
    } else {
      this.modalSourceLink.style.display = 'none';
    }
  }
  
  getLinkText(url) {
    if (url.includes('github.com')) return 'View on GitHub';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'Watch Video';
    if (url.includes('editor.p5js.org')) return 'View on p5.js Editor';
    return 'View Project';
  }
  
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  updateVisibleProjects() {
    const visibleCards = Array.from(document.querySelectorAll('.project-card'))
      .filter(card => card.style.display !== 'none')
      .map(card => {
        const projectId = card.dataset.projectId;
        return window.PROJECTS_DATA.projects.find(p => p.id === projectId);
      })
      .filter(Boolean);
    
    this.visibleProjects = visibleCards;
  }
  
  navigateModal(direction) {
    if (this.visibleProjects.length <= 1) return;
    
    const newIndex = this.currentProjectIndex + direction;
    
    if (newIndex >= 0 && newIndex < this.visibleProjects.length) {
      this.currentProjectIndex = newIndex;
      const newProject = this.visibleProjects[this.currentProjectIndex];
      this.populateModal(newProject);
      this.updateNavigationButtons();
    }
  }
  
  updateNavigationButtons() {
    this.modalPrev.disabled = this.currentProjectIndex <= 0;
    this.modalNext.disabled = this.currentProjectIndex >= this.visibleProjects.length - 1;
  }
}

// Initialize modal when DOM is loaded - COMMENTED OUT FOR DIRECT NAVIGATION
// document.addEventListener('DOMContentLoaded', () => {
//   window.projectModal = new ProjectModal();
// });

// Direct navigation functionality
document.addEventListener('click', (e) => {
  const card = e.target.closest('.project-card');
  if (card && !e.target.closest('a') && !e.target.closest('.tag')) {
    const projectId = card.dataset.projectId;
    const project = window.PROJECTS_DATA.projects.find(p => p.id === projectId);
    
    if (project) {
      // Resolve page link using the same logic as the modal would
      const baseUrl = window.PROJECTS_DATA && window.PROJECTS_DATA.config && window.PROJECTS_DATA.config.baseUrl 
        ? window.PROJECTS_DATA.config.baseUrl 
        : 'https://quasarbright.github.io/';
      
      let resolvedUrl;
      if (project.pageLink.startsWith('http://') || project.pageLink.startsWith('https://')) {
        resolvedUrl = project.pageLink;
      } else if (project.pageLink.startsWith('/')) {
        resolvedUrl = project.pageLink;
      } else if (project.pageLink.startsWith('./')) {
        resolvedUrl = baseUrl + project.pageLink.substring(2);
      } else if (project.pageLink.startsWith('../')) {
        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        const parentUrl = cleanBaseUrl.substring(0, cleanBaseUrl.lastIndexOf('/') + 1);
        resolvedUrl = parentUrl + project.pageLink.substring(3);
      } else {
        resolvedUrl = baseUrl + project.pageLink;
      }
      
      // Open in new tab
      window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
    }
  }
}); 