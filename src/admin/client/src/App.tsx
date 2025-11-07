import React, { useState } from 'react';
import { ProjectProvider, useProjects } from './context/ProjectContext';
import { ProjectList } from './components/ProjectList';
import type { Project } from '../../types';
import './styles/App.css';

function AppContent() {
  const { projects, config, loading, error, deleteProject } = useProjects();
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleNewProject = () => {
    setShowNewProjectForm(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    // Form component will be added in later tasks
    console.log('Edit project:', project);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId);
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Projection Admin</h1>
        <button className="btn-primary" onClick={handleNewProject}>
          New Project
        </button>
      </header>

      <main className="app-main">
        {loading && <div className="loading">Loading projects...</div>}
        {error && (
          <div className="error">
            <p>Error: {error.message}</p>
          </div>
        )}
        {!loading && !error && (
          <div className="content">
            <ProjectList
              projects={projects}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
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
