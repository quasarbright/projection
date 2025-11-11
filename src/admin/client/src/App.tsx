import { useState, useEffect, useRef } from 'react';
import { ProjectProvider, useProjects } from './context/ProjectContext';
import { ProjectForm } from './components/ProjectForm';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, useToast } from './components/ToastContainer';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ConfirmDialog } from './components/ConfirmDialog';
import type { Project } from '../../../types';
import './styles/App.css';

type ViewMode = 'form' | 'preview';

interface AdminActionMessage {
  type: 'admin-action';
  action: 'edit' | 'delete' | 'create';
  projectId?: string;
}

function AppContent() {
  const { projects, loading, error, createProject, updateProject, deleteProject, tags } = useProjects();
  const { showSuccess, showError } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    projectId: string;
    projectTitle: string;
  }>({ isOpen: false, projectId: '', projectTitle: '' });
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle postMessage events from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin (same origin for security)
      if (event.origin !== window.location.origin) {
        console.warn('Ignored message from unexpected origin:', event.origin);
        return;
      }

      // Validate message structure
      if (!event.data || event.data.type !== 'admin-action') {
        return;
      }

      const message = event.data as AdminActionMessage;
      const { action, projectId } = message;

      switch (action) {
        case 'edit':
          if (projectId) {
            handleEditFromPreview(projectId);
          }
          break;
        case 'delete':
          if (projectId) {
            handleDeleteFromPreview(projectId);
          }
          break;
        case 'create':
          handleCreateFromPreview();
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [projects]);

  const handleEditFromPreview = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setEditingProject(project);
      setViewMode('form');
    }
  };

  const handleDeleteFromPreview = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setConfirmDialog({
        isOpen: true,
        projectId: project.id,
        projectTitle: project.title,
      });
    }
  };

  const handleCreateFromPreview = () => {
    setEditingProject(null);
    setViewMode('form');
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteProject(confirmDialog.projectId);
      showSuccess('Project deleted successfully');
      setConfirmDialog({ isOpen: false, projectId: '', projectTitle: '' });
      refreshPreview();
    } catch (err) {
      console.error('Failed to delete project:', err);
      showError('Failed to delete project');
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ isOpen: false, projectId: '', projectTitle: '' });
  };

  const refreshPreview = () => {
    if (iframeRef.current) {
      // Force reload by updating src
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 0);
    }
  };

  const handleNewProject = () => {
    setEditingProject(null);
    setViewMode('form');
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
      setViewMode('preview');
      refreshPreview();
    } catch (err) {
      console.error('Failed to save project:', err);
      showError('Failed to save project');
    }
  };

  const handleCancelForm = () => {
    setEditingProject(null);
    setViewMode('preview');
  };

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
        {viewMode !== 'form' && (
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
            {viewMode === 'preview' && (
              <div className="preview-container">
                <iframe
                  ref={iframeRef}
                  src="/api/preview"
                  className="preview-iframe"
                  title="Portfolio Preview"
                />
              </div>
            )}

            {viewMode === 'form' && (
              <ProjectForm
                project={editingProject || undefined}
                onSave={handleSaveProject}
                onCancel={handleCancelForm}
                existingTags={existingTags}
                tagCounts={tagCounts}
                existingProjectIds={existingProjectIds}
              />
            )}
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Project"
        message={`Are you sure you want to delete "${confirmDialog.projectTitle}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />
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
