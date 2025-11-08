import React, { useState, useMemo } from 'react';
import type { Project } from '../../../../types';
import { ConfirmDialog } from './ConfirmDialog';
import './ProjectList.css';

type SortField = 'date' | 'name' | 'featured';
type SortOrder = 'asc' | 'desc';

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

export function ProjectList({ projects, onEdit, onDelete }: ProjectListProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    projectId: string;
    projectTitle: string;
  }>({
    isOpen: false,
    projectId: '',
    projectTitle: '',
  });

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    projects.forEach((project) => {
      project.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [projects]);

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.description.toLowerCase().includes(query)
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((project) =>
        selectedTags.every((tag) => project.tags.includes(tag))
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = a.creationDate.localeCompare(b.creationDate);
          break;
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'featured':
          const aFeatured = a.featured ? 1 : 0;
          const bFeatured = b.featured ? 1 : 0;
          comparison = bFeatured - aFeatured;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [projects, sortField, sortOrder, searchQuery, selectedTags]);

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'date' ? 'desc' : 'asc');
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  const handleDeleteClick = (project: Project) => {
    setDeleteConfirmation({
      isOpen: true,
      projectId: project.id,
      projectTitle: project.title,
    });
  };

  const handleDeleteConfirm = () => {
    onDelete(deleteConfirmation.projectId);
    setDeleteConfirmation({
      isOpen: false,
      projectId: '',
      projectTitle: '',
    });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({
      isOpen: false,
      projectId: '',
      projectTitle: '',
    });
  };

  if (projects.length === 0) {
    return (
      <div className="project-list-empty">
        <p>No projects found. Create your first project to get started!</p>
      </div>
    );
  }

  const hasActiveFilters = searchQuery.trim() !== '' || selectedTags.length > 0;

  return (
    <div className="project-list">
      <div className="project-list-controls">
        <div className="filter-controls">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Search projects"
          />
          {hasActiveFilters && (
            <button
              className="clear-filters-btn"
              onClick={handleClearFilters}
              aria-label="Clear filters"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="sort-controls">
          <label htmlFor="sort-field">Sort by:</label>
          <select
            id="sort-field"
            value={sortField}
            onChange={(e) => handleSortChange(e.target.value as SortField)}
            className="sort-select"
          >
            <option value="date">Date</option>
            <option value="name">Name</option>
            <option value="featured">Featured</option>
          </select>
          <button
            className="sort-order-btn"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            title={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {availableTags.length > 0 && (
        <div className="tag-filters">
          <span className="tag-filters-label">Filter by tags:</span>
          <div className="tag-filter-buttons">
            {availableTags.map((tag) => (
              <button
                key={tag}
                className={`tag-filter-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => handleTagToggle(tag)}
                aria-pressed={selectedTags.includes(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="project-count">
        Showing {filteredAndSortedProjects.length} of {projects.length} projects
      </div>

      {filteredAndSortedProjects.length === 0 ? (
        <div className="project-list-empty">
          <p>No projects match your filters. Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="project-list-grid">
          {filteredAndSortedProjects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-card-header">
              <h3 className="project-title">{project.title}</h3>
              {project.featured && <span className="featured-badge">Featured</span>}
            </div>
            
            <div className="project-meta">
              <span className="project-date">{project.creationDate}</span>
            </div>
            
            <p className="project-description">{project.description}</p>
            
            <div className="project-tags">
              {project.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="project-actions">
              <button
                className="btn-secondary"
                onClick={() => onEdit(project)}
                aria-label={`Edit ${project.title}`}
              >
                Edit
              </button>
              <button
                className="btn-danger"
                onClick={() => handleDeleteClick(project)}
                aria-label={`Delete ${project.title}`}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteConfirmation.projectTitle}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
