import { useState } from 'react';
import { ProjectProvider, useProjects } from './context/ProjectContext';
import { ProjectList } from './components/ProjectList';
import { ProjectForm } from './components/ProjectForm';
import type { Project } from '../../../types';
import './styles/App.css';

function AppContent() {
  const { projects, config, loading, error, createProject, updateProject, deleteProject, tags } = useProjects();
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleNewProject = () => {
    setShowNewProjectForm(true);
    setEditingProject(null);
    setSuccessMessage(null);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowNewProjectForm(false);
    setSuccessMessage(null);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId);
        setSuccessMessage('Project deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  const handleSaveProject = async (project: Project) => {
    if (editingProject) {
      await updateProject(editingProject.id, project);
      setSuccessMessage('Project updated successfully');
    } else {
      await createProject(project);
      setSuccessMessage('Project created successfully');
    }
    setEditingProject(null);
    setShowNewProjectForm(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleCancelForm = () => {
    setShowNewProjectForm(false);
    setEditingProject(null);
  };

  const showForm = showNewProjectForm || editingProject !== null;
  const existingProjectIds = projects.map((p) => p.id);
  const existingTags = tags.map((t) => t.name);

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
        {loading && <div className="loading">Loading projects...</div>}
        {error && (
          <div className="error">
            <p>Error: {error.message}</p>
          </div>
        )}
        {successMessage && (
          <div className="success-message">
            <p>{successMessage}</p>
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
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}

export default App;
