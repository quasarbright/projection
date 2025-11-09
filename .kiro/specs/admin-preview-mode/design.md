# Design Document

## Overview

This feature extends the existing portfolio generator to support an admin preview mode where the generated HTML includes interactive edit/delete controls. The design leverages the existing HTMLBuilder class with minimal modifications, adds a new preview endpoint to the admin server, and implements iframe-based communication using the postMessage API. The solution maintains the DRY principle by reusing the exact same HTML generation code for both preview and production builds.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Admin React Application (Parent)              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  App.tsx                                          │  │
│  │  - Manages view state (list/form/preview)        │  │
│  │  - Listens for postMessage events                │  │
│  │  - Handles edit/delete/create actions            │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │  <iframe src="/api/preview">                      │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │  Generated Portfolio HTML (Admin Mode)      │ │  │
│  │  │  - Project cards with edit/delete buttons   │ │  │
│  │  │  - Create new project button                │ │  │
│  │  │  - postMessage script for communication     │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Admin Express Server                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │  GET /api/preview                                 │  │
│  │  - Loads project data                            │  │
│  │  - Creates HTMLBuilder with adminMode: true     │  │
│  │  - Returns generated HTML                        │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │  HTMLBuilder (Modified)                          │  │
│  │  - Accepts adminMode parameter                   │  │
│  │  - Injects admin controls when enabled          │  │
│  │  - Includes postMessage script in admin mode    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Communication Flow

```
User clicks "Edit" button in iframe
         │
         ▼
Iframe: button click handler
         │
         ▼
Iframe: postMessage({ type: 'edit', projectId: '...' })
         │
         ▼
Parent: window.addEventListener('message', handler)
         │
         ▼
Parent: Verify origin and message structure
         │
         ▼
Parent: Call onEdit(projectId)
         │
         ▼
Parent: Display ProjectForm component
         │
         ▼
User saves changes
         │
         ▼
Parent: Update project via API
         │
         ▼
Parent: Refresh iframe (iframe.src = iframe.src)
```

## Components and Interfaces

### 1. HTMLBuilder Modifications

**File:** `src/generator/html-builder.ts`

Add an `adminMode` parameter to the constructor and modify generation methods:

```typescript
export interface HTMLBuilderOptions {
  adminMode?: boolean;
}

export class HTMLBuilder {
  private config: Config;
  private adminMode: boolean;

  constructor(config: Config, options: HTMLBuilderOptions = {}) {
    this.config = config;
    this.adminMode = options.adminMode || false;
  }

  /**
   * Generates admin control buttons for a project card
   */
  private generateAdminControls(projectId: string): string {
    if (!this.adminMode) return '';
    
    return `
      <div class="admin-controls">
        <button class="admin-btn admin-edit" data-project-id="${projectId}" title="Edit project">
          <svg><!-- Edit icon --></svg>
          Edit
        </button>
        <button class="admin-btn admin-delete" data-project-id="${projectId}" title="Delete project">
          <svg><!-- Delete icon --></svg>
          Delete
        </button>
      </div>
    `;
  }

  /**
   * Generates the create new project button for header
   */
  private generateCreateButton(): string {
    if (!this.adminMode) return '';
    
    return `
      <button class="admin-btn admin-create" id="admin-create-btn">
        <svg><!-- Plus icon --></svg>
        Create New Project
      </button>
    `;
  }

  /**
   * Generates postMessage communication script
   */
  private generateAdminScript(): string {
    if (!this.adminMode) return '';
    
    return `
      <script>
        (function() {
          // Handle edit button clicks
          document.addEventListener('click', function(e) {
            if (e.target.closest('.admin-edit')) {
              const projectId = e.target.closest('.admin-edit').dataset.projectId;
              window.parent.postMessage({
                type: 'admin-action',
                action: 'edit',
                projectId: projectId
              }, '*');
            }
            
            // Handle delete button clicks
            if (e.target.closest('.admin-delete')) {
              const projectId = e.target.closest('.admin-delete').dataset.projectId;
              window.parent.postMessage({
                type: 'admin-action',
                action: 'delete',
                projectId: projectId
              }, '*');
            }
            
            // Handle create button click
            if (e.target.closest('.admin-create')) {
              window.parent.postMessage({
                type: 'admin-action',
                action: 'create'
              }, '*');
            }
          });
        })();
      </script>
    `;
  }

  /**
   * Generates admin-specific CSS
   */
  private generateAdminStyles(): string {
    if (!this.adminMode) return '';
    
    return `
      <style>
        .admin-controls {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 8px;
          z-index: 10;
        }
        
        .admin-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .admin-btn:hover {
          background: white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          transform: translateY(-1px);
        }
        
        .admin-edit {
          color: #4c63d2;
        }
        
        .admin-delete {
          color: #e53e3e;
        }
        
        .admin-create {
          background: #4c63d2;
          color: white;
          border-color: #4c63d2;
          margin-left: 1rem;
        }
        
        .admin-create:hover {
          background: #3c51b4;
        }
        
        .project-card {
          position: relative;
        }
        
        /* Ensure admin controls are visible on hover */
        .project-card:hover .admin-controls {
          opacity: 1;
        }
        
        .admin-controls {
          opacity: 0.8;
          transition: opacity 0.2s ease;
        }
      </style>
    `;
  }

  /**
   * Modified generateProjectCard to include admin controls
   */
  generateProjectCard(project: Project): string {
    const adminControls = this.generateAdminControls(project.id);
    
    // ... existing card generation code ...
    
    return `
    <div class="project-card${featuredClass}" data-project-id="${project.id}"${backgroundStyle}>
      ${adminControls}
      <div class="card-content">
        <!-- existing card content -->
      </div>
    </div>`;
  }

  /**
   * Modified generateHTML to include admin features
   */
  generateHTML(projectsData: ProjectsData): string {
    // ... existing generation code ...
    
    const createButton = this.generateCreateButton();
    const adminStyles = this.generateAdminStyles();
    const adminScript = this.generateAdminScript();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- existing head content -->
  ${adminStyles}
</head>
<body>
  <header class="site-header">
    <div class="container">
      <h1>${mergedConfig.title}${createButton}</h1>
      <!-- rest of header -->
    </div>
  </header>
  
  <!-- existing body content -->
  
  <!-- existing scripts -->
  ${adminScript}
</body>
</html>`;
  }
}
```

### 2. Admin Server Preview Endpoint

**File:** `src/admin/server/index.ts`

Add a new endpoint that generates preview HTML:

```typescript
/**
 * Preview endpoint - generates portfolio HTML with admin controls
 */
app.get('/api/preview', async (req, res) => {
  try {
    // Load current project data
    const projectsData = await fileManager.read();
    
    // Load config
    const configLoader = new ConfigLoader(cwd);
    const config = await configLoader.load();
    
    // Create HTMLBuilder with admin mode enabled
    const htmlBuilder = new HTMLBuilder(config, { adminMode: true });
    
    // Generate HTML
    const html = htmlBuilder.generateHTML(projectsData);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Allow iframe from same origin
    
    res.send(html);
  } catch (error) {
    logger.error('Failed to generate preview:', error);
    res.status(500).json({ 
      error: 'Failed to generate preview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

### 3. Admin React Application Updates

**File:** `src/admin/client/src/App.tsx`

Add preview mode and postMessage handling:

```typescript
type ViewMode = 'list' | 'form' | 'preview';

function AppContent() {
  const { projects, config, loading, error, createProject, updateProject, deleteProject } = useProjects();
  const { showSuccess, showError, showConfirm } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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
      
      const { action, projectId } = event.data;
      
      switch (action) {
        case 'edit':
          handleEditFromPreview(projectId);
          break;
        case 'delete':
          handleDeleteFromPreview(projectId);
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
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setEditingProject(project);
      setViewMode('form');
    }
  };

  const handleDeleteFromPreview = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const confirmed = await showConfirm(
      `Are you sure you want to delete "${project.title}"?`
    );
    
    if (confirmed) {
      try {
        await deleteProject(projectId);
        showSuccess('Project deleted successfully');
        refreshPreview();
      } catch (err) {
        showError('Failed to delete project');
      }
    }
  };

  const handleCreateFromPreview = () => {
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
      setViewMode('preview');
      refreshPreview();
    } catch (err) {
      showError('Failed to save project');
    }
  };

  const handleCancelForm = () => {
    setEditingProject(null);
    setViewMode('preview');
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Projection Admin</h1>
        <div className="view-controls">
          <button 
            className={viewMode === 'preview' ? 'active' : ''}
            onClick={() => setViewMode('preview')}
          >
            Preview
          </button>
          <button 
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            List View
          </button>
        </div>
      </header>

      <main className="app-main">
        {loading && <LoadingSpinner />}
        {error && <div className="error">{error.message}</div>}
        
        {!loading && !error && (
          <>
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
            
            {viewMode === 'list' && (
              <ProjectList
                projects={projects}
                onEdit={(p) => {
                  setEditingProject(p);
                  setViewMode('form');
                }}
                onDelete={handleDeleteFromPreview}
              />
            )}
            
            {viewMode === 'form' && (
              <ProjectForm
                project={editingProject || undefined}
                onSave={handleSaveProject}
                onCancel={handleCancelForm}
                existingTags={/* ... */}
                tagCounts={/* ... */}
                existingProjectIds={/* ... */}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
```

**File:** `src/admin/client/src/styles/admin.css`

Add styles for preview mode:

```css
.view-controls {
  display: flex;
  gap: 0.5rem;
}

.view-controls button {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 2px solid #4c63d2;
  color: #4c63d2;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-controls button.active {
  background: #4c63d2;
  color: white;
}

.preview-container {
  width: 100%;
  height: calc(100vh - 140px);
  position: relative;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}
```

## Data Models

### PostMessage Event Structure

```typescript
interface AdminActionMessage {
  type: 'admin-action';
  action: 'edit' | 'delete' | 'create';
  projectId?: string; // Required for edit/delete, omitted for create
}
```

### HTMLBuilder Options

```typescript
interface HTMLBuilderOptions {
  adminMode?: boolean; // Default: false
}
```

## Error Handling

### Preview Generation Errors

- If project data cannot be loaded, return 500 with error message
- If HTMLBuilder fails, log error and return 500
- Display user-friendly error in iframe if preview fails to load

### postMessage Security

- Verify message origin matches window.location.origin
- Validate message structure before processing
- Ignore malformed or unexpected messages
- Log security warnings for debugging

### Iframe Communication Errors

- Handle cases where iframe fails to load
- Provide fallback UI if preview is unavailable
- Show loading state while iframe loads

## Testing Strategy

### Unit Tests

1. **HTMLBuilder Admin Mode Tests** (`tests/unit/html-builder.test.ts`)
   - Test admin controls are injected when adminMode is true
   - Test admin controls are omitted when adminMode is false
   - Test admin script is included only in admin mode
   - Test admin styles are included only in admin mode
   - Test create button appears in header in admin mode

2. **Preview Endpoint Tests** (`tests/unit/admin-server.test.ts`)
   - Test /api/preview returns HTML with admin controls
   - Test preview endpoint loads current project data
   - Test error handling for missing project data
   - Test X-Frame-Options header is set correctly

### Integration Tests

1. **Admin Preview Flow** (`tests/integration/admin-preview.test.ts`)
   - Test complete flow: load preview → click edit → save → refresh
   - Test delete action from preview
   - Test create action from preview
   - Test preview updates after data changes

2. **postMessage Communication** (`tests/integration/postmessage.test.ts`)
   - Test messages are sent from iframe on button clicks
   - Test parent receives and processes messages correctly
   - Test origin verification works
   - Test malformed messages are ignored

### Manual Testing Checklist

- [ ] Preview displays all projects correctly
- [ ] Edit buttons open form with correct project data
- [ ] Delete buttons show confirmation and remove projects
- [ ] Create button opens empty form
- [ ] Preview refreshes after save/delete/create
- [ ] Admin controls are not visible in production builds
- [ ] Styles match the generated portfolio site
- [ ] Responsive design works in preview
- [ ] No console errors or warnings

## Implementation Notes

### DRY Principle Compliance

- HTMLBuilder is the single source of truth for HTML generation
- Same code generates both preview and production HTML
- Admin mode is a simple flag, not a separate code path
- CSS and JavaScript for portfolio are reused exactly

### Performance Considerations

- Preview regenerates HTML on each request (acceptable for admin use)
- Consider caching if performance becomes an issue
- Iframe refresh is fast since it's same-origin

### Future Enhancements

- Add inline editing (click to edit text directly in preview)
- Add drag-and-drop reordering in preview
- Add real-time preview updates (WebSocket)
- Add mobile preview mode (responsive iframe sizing)
