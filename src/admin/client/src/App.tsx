import { useState } from 'react';
import { ProjectProvider, useProjects } from './context/ProjectContext';
import { ProjectList } from './components/ProjectList';
import { ProjectForm } from './components/ProjectForm';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, useToast } from './components/ToastContainer';
import { LoadingSpinner } from './components/LoadingSpinner';
import type { Project } from '../../../types';
import './styles/App.css';

function AppContent() {
  const { projects, config, loading, error, createProject, updateProject, deleteProject, tags } = useProjects();
  const { showSuccess, showError } = useToast();
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleNewProject = () => {
    setShowNewProjectForm(true);
    setEditingProject(null);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowNewProjectForm(false);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      showSuccess('Project deleted successfully');
    } catch (err) {
      console.error('Failed to delete project:', err);
      showError('Failed to delete project');
    }
  };

  const handleSaveProject = async (project: Project) => {
    try {
      if (editingProject) {
        await updateProject(editingProject.id, project);
        showSuccess('Project updated successfully');
      } else {
        await createProject(project);
        showSuccess('Project created successfully');
      }
      setEditingProject(null);
      setShowNewProjectForm(false);
    } catch (err) {
      console.error('Failed to save project:', err);
      showError('Failed to save project');
    }
  };

  const handleCancelForm = () => {
    setShowNewProjectForm(false);
    setEditingProject(null);
  };

  const showForm = showNewProjectForm || editingProject !== null;
  const existingProjectIds = projects.map((p) => p.id);
  const existingTags = tags.map((t) => t.name);
  const tagCounts = tags.reduce((acc, tag) => {
    acc[tag.name] = tag.count;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Projection Admin</h1>
        {!showForm && (
          <button className="btn-primary" onClick={handleNewProject}>
            New Project
          </button>
        )}
      </header>

      <main className="app-main">
        {loading && <LoadingSpinner size="large" message="Loading projects..." />}
        {error && (
          <div className="error">
            <p>Error: {error.message}</p>
          </div>
        )}
        {!loading && !error && (
          <div className="content">
            {showForm ? (
              <ProjectForm
                project={editingProject || undefined}
                onSave={handleSaveProject}
                onCancel={handleCancelForm}
                existingTags={existingTags}
                tagCounts={tagCounts}
                existingProjectIds={existingProjectIds}
              />
            ) : (
              <ProjectList
                projects={projects}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
              />
            )}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <span>{projects.length} projects</span>
        {config && (
          <a href={config.baseUrl} target="_blank" rel="noopener noreferrer">
            View Portfolio Site
          </a>
        )}
      </footer>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ProjectProvider>
          <AppContent />
        </ProjectProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
