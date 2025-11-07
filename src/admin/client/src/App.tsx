import React, { useState } from 'react';
import { ProjectProvider, useProjects } from './context/ProjectContext';
import './styles/App.css';

function AppContent() {
  const { projects, config, loading, error } = useProjects();
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);

  const handleNewProject = () => {
    setShowNewProjectForm(true);
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
            <p>Projects loaded: {projects.length}</p>
            {/* Project list and forms will be added in later tasks */}
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
