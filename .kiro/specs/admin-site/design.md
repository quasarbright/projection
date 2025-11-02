# Admin Site Design Document

## Overview

The admin site will be a separate web application that runs alongside the existing Projection system. It will provide a modern, user-friendly interface for managing project data through CRUD operations. The admin site will be built as a single-page application (SPA) using a lightweight frontend framework and will communicate with a backend API server that handles file I/O operations.

### Architecture Decision

We'll implement the admin site as a separate Express.js server with a React frontend. This approach:
- Keeps the admin functionality separate from the core static site generation
- Allows for future expansion (authentication, cloud storage, etc.)
- Provides a familiar development experience with modern web technologies
- Maintains backward compatibility with existing Projection functionality

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   CLI Command   │
│ projection admin│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│      Admin Server (Express)         │
│  ┌───────────────────────────────┐  │
│  │   REST API Endpoints          │  │
│  │   - GET /api/projects         │  │
│  │   - POST /api/projects        │  │
│  │   - PUT /api/projects/:id     │  │
│  │   - DELETE /api/projects/:id  │  │
│  │   - GET /api/tags             │  │
│  │   - GET /api/config           │  │
│  │   - GET /api/preview/:id      │  │
│  └───────────┬───────────────────┘  │
│              │                       │
│  ┌───────────▼───────────────────┐  │
│  │   File System Manager         │  │
│  │   - Read projects.yaml/json   │  │
│  │   - Write with comment        │  │
│  │     preservation (YAML)       │  │
│  │   - Uses existing Validator   │  │
│  │   - Preserve file format      │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   Shared Logic (Reused)       │  │
│  │   - Validator (existing)      │  │
│  │   - HTMLBuilder (existing)    │  │
│  │   - Config loader (existing)  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         │
         │ HTTP
         ▼
┌─────────────────────────────────────┐
│   Admin Frontend (React SPA)        │
│  ┌───────────────────────────────┐  │
│  │   Components                  │  │
│  │   - ProjectList               │  │
│  │   - ProjectForm               │  │
│  │   - ProjectCard (uses         │  │
│  │     server-rendered preview)  │  │
│  │   - TagManager                │  │
│  │   - PreviewPane (iframe)      │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   State Management (Context)  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Code Reuse Strategy

**1. Validation Logic**
- The admin server will import and use the existing `Validator` class from `src/generator/validator.ts`
- No duplication of validation rules
- Consistent validation between CLI and admin interface
- API will return the same `ValidationError` format

**2. Preview Rendering**
- The admin server will use the existing `HTMLBuilder` class to generate preview HTML
- Add a new API endpoint `/api/preview/:id` that returns server-rendered HTML
- Frontend will display preview in an iframe pointing to this endpoint
- This ensures preview matches the actual generated site exactly
- No need to duplicate CSS or rendering logic in React

**3. Configuration Loading**
- Reuse existing config loading logic from `src/generator/config.ts`
- Admin server will use the same config resolution order
- Ensures consistency between admin and build commands

**4. File Format Detection**
- Reuse existing file detection logic
- Consistent behavior across all commands

### Directory Structure

```
src/
├── admin/
│   ├── server/
│   │   ├── index.ts              # Express server setup
│   │   ├── routes.ts             # API route definitions
│   │   ├── file-manager.ts       # File I/O operations
│   │   ├── validator.ts          # Project validation logic
│   │   └── types.ts              # TypeScript types
│   └── client/
│       ├── src/
│       │   ├── App.tsx           # Main React component
│       │   ├── components/
│       │   │   ├── ProjectList.tsx
│       │   │   ├── ProjectForm.tsx
│       │   │   ├── ProjectCard.tsx
│       │   │   ├── TagManager.tsx
│       │   │   ├── PreviewPane.tsx
│       │   │   └── ConfirmDialog.tsx
│       │   ├── context/
│       │   │   └── ProjectContext.tsx
│       │   ├── hooks/
│       │   │   └── useProjects.ts
│       │   ├── services/
│       │   │   └── api.ts        # API client
│       │   └── styles/
│       │       └── admin.css
│       ├── public/
│       │   └── index.html
│       └── package.json
├── cli/
│   └── admin.ts                  # New CLI command
```

## Components and Interfaces

### Backend Components

#### 1. Admin Server (Express)

**Responsibilities:**
- Start HTTP server on specified port
- Serve static admin frontend files
- Handle API requests
- Manage file system operations
- Validate incoming data

**Key Methods:**
```typescript
class AdminServer {
  constructor(config: AdminServerConfig)
  start(): Promise<void>
  stop(): Promise<void>
  private setupRoutes(): void
  private setupMiddleware(): void
}
```

#### 2. File Manager

**Responsibilities:**
- Read projects data file (YAML/JSON)
- Write projects data file while preserving format AND comments
- Detect file format
- Handle file watching for external changes
- Backup files before modifications

**Key Methods:**
```typescript
class FileManager {
  constructor(projectsFilePath: string)
  readProjects(): Promise<ProjectsData>
  writeProjects(data: ProjectsData): Promise<void>
  updateProject(projectId: string, project: Project): Promise<void>  // Surgical update
  addProject(project: Project): Promise<void>  // Append without rewriting
  deleteProject(projectId: string): Promise<void>  // Remove without rewriting
  detectFormat(): 'yaml' | 'json'
  createBackup(): Promise<string>
  watchFile(callback: (data: ProjectsData) => void): void
}
```

**Comment Preservation Strategy:**

For YAML files, we'll use a surgical update approach:
1. Read the file as text (not parsed)
2. Use regex/string manipulation to locate and update specific project entries
3. For updates: Replace only the lines for that specific project
4. For additions: Append to the projects array
5. For deletions: Remove only the lines for that specific project
6. This preserves comments, formatting, and other projects' exact formatting

For JSON files:
- JSON doesn't support comments, so standard parse/stringify is fine
- Use pretty-printing with 2-space indentation to maintain readability

#### 3. Project Validator (Reused from existing code)

**Responsibilities:**
- Validate project data against schema
- Check ID uniqueness
- Validate date formats
- Validate URL formats
- Provide detailed error messages

**Implementation:**
- Import and use the existing `Validator` class from `src/generator/validator.ts`
- Wrap it in API route handlers to return appropriate HTTP responses
- No new validation logic needed - reuse existing implementation

**Existing Methods (from src/generator/validator.ts):**
```typescript
class Validator {
  validate(projects: Project[]): ValidationWarning[]
  validateProjects(projects: Project[]): ValidationResult
  // Plus private methods for specific validations
}
```

**API Wrapper:**
```typescript
// In admin server routes
function validateProjectForAPI(project: Project, allProjects: Project[]) {
  const validator = new Validator(process.cwd());
  const result = validator.validateProjects([...allProjects, project]);
  return result;
}
```

### Frontend Components

#### 1. App Component

**Responsibilities:**
- Main application layout
- Routing (if using React Router)
- Global state provider
- Error boundary

#### 2. ProjectList Component

**Responsibilities:**
- Display all projects in a table/grid
- Provide sorting and filtering controls
- Handle project selection
- Show project count and statistics

**Props:**
```typescript
interface ProjectListProps {
  projects: Project[]
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
  onNew: () => void
}
```

#### 3. ProjectForm Component

**Responsibilities:**
- Render form for creating/editing projects
- Handle form validation
- Show validation errors
- Provide tag autocomplete
- Show live preview

**Props:**
```typescript
interface ProjectFormProps {
  project?: Project  // undefined for new project
  onSave: (project: Project) => Promise<void>
  onCancel: () => void
  existingTags: string[]
}
```

#### 4. ProjectCard Component

**Responsibilities:**
- Display project preview
- Match styling of main portfolio site
- Show thumbnail, title, description, tags
- Render featured badge if applicable

**Props:**
```typescript
interface ProjectCardProps {
  project: Project
  config: Config
  isPreview?: boolean
}
```

#### 5. TagManager Component

**Responsibilities:**
- Display tag input with autocomplete
- Show existing tags as chips
- Allow adding/removing tags
- Show tag suggestions

**Props:**
```typescript
interface TagManagerProps {
  selectedTags: string[]
  availableTags: string[]
  onChange: (tags: string[]) => void
}
```

#### 6. PreviewPane Component

**Responsibilities:**
- Show live preview of project card
- Update in real-time as form changes
- Display using portfolio site styles (via server-rendered HTML)

**Implementation Strategy:**
- Use an iframe that loads from `/api/preview`
- POST the current project data to the preview endpoint
- Server uses existing `HTMLBuilder` to generate preview HTML
- This ensures 100% accuracy - preview matches actual output exactly
- No need to duplicate CSS or HTML generation in React

**Props:**
```typescript
interface PreviewPaneProps {
  project: Partial<Project>
  config: Config
}
```

**Preview Endpoint:**
```typescript
// POST /api/preview
// Body: { project: Partial<Project> }
// Returns: HTML string with just the project card + styles
app.post('/api/preview', (req, res) => {
  const { project } = req.body;
  const htmlBuilder = new HTMLBuilder(config);
  const cardHTML = htmlBuilder.generateProjectCard(project as Project);
  const fullHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="/styles/main.css">
        <link rel="stylesheet" href="/styles/cards.css">
      </head>
      <body style="padding: 20px; background: #1a1a2e;">
        ${cardHTML}
      </body>
    </html>
  `;
  res.send(fullHTML);
});
```

## Data Models

### API Request/Response Types

```typescript
// GET /api/projects
interface GetProjectsResponse {
  projects: Project[]
  config: Config
}

// POST /api/projects
interface CreateProjectRequest {
  project: Project
}

interface CreateProjectResponse {
  success: boolean
  project: Project
  errors?: ValidationError[]  // Reuses existing ValidationError type
}

// PUT /api/projects/:id
interface UpdateProjectRequest {
  project: Project
}

interface UpdateProjectResponse {
  success: boolean
  project: Project
  errors?: ValidationError[]  // Reuses existing ValidationError type
}

// DELETE /api/projects/:id
interface DeleteProjectResponse {
  success: boolean
  deletedId: string
}

// GET /api/tags
interface GetTagsResponse {
  tags: TagInfo[]
}

interface TagInfo {
  name: string
  count: number
}

// POST /api/preview
interface PreviewRequest {
  project: Partial<Project>
}
// Returns: HTML string

// Validation types (REUSED from src/generator/validator.ts)
// No need to redefine - import from existing code:
// import { ValidationError, ValidationResult } from '../generator/validator';
```

### Admin Server Configuration

```typescript
interface AdminServerConfig {
  port: number
  projectsFilePath: string
  configFilePath?: string
  autoOpen: boolean
  cors: boolean
}
```

## YAML Comment Preservation

### Challenge
YAML supports comments, but the current library (js-yaml) strips comments when parsing. We want to preserve comments when editing projects.

### Solution: Use yaml Library with Comment Preservation

We'll use the **`yaml`** npm package (not js-yaml) which has built-in support for comment preservation through its Document API.

**Library: `yaml` (https://eemeli.org/yaml/)**
- Maintains comments, whitespace, and formatting
- Provides a Document API for programmatic modifications
- Can parse and stringify while preserving structure
- Well-maintained and widely used

### Implementation Approach

```typescript
import { parseDocument, Document } from 'yaml';

class YAMLFileManager {
  private doc: Document;
  
  async readProjects(): Promise<ProjectsData> {
    const fileContent = await fs.promises.readFile(this.filePath, 'utf-8');
    this.doc = parseDocument(fileContent);
    
    // Convert to plain JS object for validation and use
    const data = this.doc.toJS();
    return data;
  }
  
  async updateProject(projectId: string, updatedProject: Project): Promise<void> {
    // Navigate the document structure
    const projects = this.doc.get('projects');
    const projectIndex = projects.items.findIndex(
      (p: any) => p.get('id') === projectId
    );
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    // Update the specific project node
    // This preserves comments around and within the project
    projects.items[projectIndex] = this.doc.createNode(updatedProject);
    
    // Write back to file
    await fs.promises.writeFile(this.filePath, this.doc.toString(), 'utf-8');
  }
  
  async addProject(project: Project): Promise<void> {
    const projects = this.doc.get('projects');
    projects.items.push(this.doc.createNode(project));
    await fs.promises.writeFile(this.filePath, this.doc.toString(), 'utf-8');
  }
  
  async deleteProject(projectId: string): Promise<void> {
    const projects = this.doc.get('projects');
    const projectIndex = projects.items.findIndex(
      (p: any) => p.get('id') === projectId
    );
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }
    
    projects.items.splice(projectIndex, 1);
    await fs.promises.writeFile(this.filePath, this.doc.toString(), 'utf-8');
  }
}
```

### Benefits

- **Preserves all comments**: Comments before, after, and within projects
- **Maintains formatting**: Indentation and structure preserved
- **Robust**: Well-tested library used in production
- **Clean API**: Document-based manipulation is intuitive
- **No regex hacks**: Proper AST-based manipulation

### Fallback for JSON

JSON doesn't support comments, so we use standard parse/stringify with pretty-printing:

```typescript
class JSONFileManager {
  async writeProjects(data: ProjectsData): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(this.filePath, json, 'utf-8');
  }
}
```

### Migration Note

The admin server will use the `yaml` package for comment-preserving operations, while the existing build commands can continue using `js-yaml` (since they don't need to preserve comments). Both libraries can coexist.

## Error Handling

### Backend Error Handling

1. **File Not Found Errors**
   - Return 404 with helpful message
   - Suggest running `projection init`

2. **File Parse Errors**
   - Return 400 with parse error details
   - Indicate line number if possible

3. **Validation Errors**
   - Return 400 with detailed validation errors
   - Include field-specific error messages

4. **File Write Errors**
   - Return 500 with error details
   - Restore from backup if available
   - Log error for debugging

5. **Server Errors**
   - Return 500 with generic message
   - Log full error details
   - Don't expose internal details to client

### Frontend Error Handling

1. **Network Errors**
   - Show toast notification
   - Provide retry option
   - Indicate offline status

2. **Validation Errors**
   - Display inline field errors
   - Highlight invalid fields
   - Prevent form submission

3. **API Errors**
   - Show error modal with details
   - Provide action buttons (retry, cancel)
   - Log errors to console

4. **State Errors**
   - Use error boundaries
   - Show fallback UI
   - Provide refresh option

## Testing Strategy

### Backend Testing

1. **Unit Tests**
   - FileManager: read/write operations, format detection
   - ProjectValidator: validation rules, error messages
   - API routes: request handling, response formatting

2. **Integration Tests**
   - Full API workflow: create → read → update → delete
   - File format preservation (YAML/JSON)
   - Concurrent request handling
   - Backup and restore functionality

3. **Test Data**
   - Sample YAML files with various configurations
   - Sample JSON files
   - Invalid data for validation testing
   - Edge cases (empty files, malformed data)

### Frontend Testing

1. **Component Tests**
   - ProjectForm: validation, submission
   - ProjectList: sorting, filtering
   - TagManager: autocomplete, selection
   - PreviewPane: rendering accuracy

2. **Integration Tests**
   - Full CRUD workflow through UI
   - Form validation and error display
   - Preview updates on form changes

3. **E2E Tests**
   - Complete user workflows
   - Create new project end-to-end
   - Edit existing project end-to-end
   - Delete project with confirmation

### Manual Testing Checklist

- [ ] Start admin server with default port
- [ ] Start admin server with custom port
- [ ] Create new project with all fields
- [ ] Create new project with minimal fields
- [ ] Edit existing project
- [ ] Delete project with confirmation
- [ ] Cancel delete operation
- [ ] Validate ID format
- [ ] Validate date format
- [ ] Validate required fields
- [ ] Test tag autocomplete
- [ ] Test preview updates
- [ ] Test on mobile device
- [ ] Test with YAML file
- [ ] Test with JSON file
- [ ] Test with embedded config
- [ ] Verify file format preservation

## UI/UX Design

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Header: Projection Admin                    [New] │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌───────────────────────────┐│
│  │ Filters/Search  │  │                           ││
│  │ [Search box]    │  │   Project List/Form       ││
│  │                 │  │                           ││
│  │ Sort by:        │  │   (Main content area)     ││
│  │ [Dropdown]      │  │                           ││
│  │                 │  │                           ││
│  │ Tags:           │  │                           ││
│  │ [Tag filters]   │  │                           ││
│  │                 │  │                           ││
│  └─────────────────┘  └───────────────────────────┘│
├─────────────────────────────────────────────────────┤
│  Footer: X projects | View Portfolio Site          │
└─────────────────────────────────────────────────────┘
```

### Color Scheme

- Use similar dark theme as main portfolio site
- Primary color: #4a9eff (blue for actions)
- Success: #4caf50 (green)
- Danger: #f44336 (red)
- Warning: #ff9800 (orange)
- Background: #1a1a2e (dark)
- Surface: #16213e (slightly lighter)
- Text: #e0e0e0 (light gray)

### Form Layout

```
┌─────────────────────────────────────────────────────┐
│  Create/Edit Project                         [Save] │
│                                            [Cancel] │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌───────────────────────┐│
│  │                     │  │                       ││
│  │   Form Fields       │  │   Live Preview        ││
│  │                     │  │                       ││
│  │   ID: [_______]     │  │   [Project Card]      ││
│  │   Title: [_____]    │  │                       ││
│  │   Description:      │  │                       ││
│  │   [___________]     │  │                       ││
│  │   Date: [______]    │  │                       ││
│  │   Tags: [______]    │  │                       ││
│  │   Page Link: [__]   │  │                       ││
│  │   Source: [_____]   │  │                       ││
│  │   Thumbnail: [__]   │  │                       ││
│  │   [ ] Featured      │  │                       ││
│  │                     │  │                       ││
│  └─────────────────────┘  └───────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

- Desktop: > 1024px (two-column layout)
- Tablet: 768px - 1024px (single column, larger touch targets)
- Mobile: < 768px (stacked layout, full-width forms)

## Code Reuse Summary

### What We're Reusing (No Duplication)

1. **Validation Logic** (`src/generator/validator.ts`)
   - Import `Validator` class directly
   - Use existing validation methods
   - Return existing `ValidationError` and `ValidationResult` types
   - Ensures consistency between CLI and admin interface

2. **HTML Generation** (`src/generator/html-builder.ts`)
   - Import `HTMLBuilder` class directly
   - Use `generateProjectCard()` for preview rendering
   - Server-side rendering ensures preview matches actual output
   - No need to duplicate CSS or HTML structure in React

3. **Configuration Loading** (`src/generator/config.ts`)
   - Import existing config loading functions
   - Use same config resolution order
   - Consistent behavior across all commands

4. **Type Definitions** (`src/types/`)
   - Reuse `Project`, `Config`, `ProjectsData` types
   - No duplicate type definitions
   - Type safety across admin and core functionality

5. **Styling** (template CSS files)
   - Admin server serves existing CSS files
   - Preview iframe loads actual portfolio styles
   - Perfect preview accuracy with zero duplication

### What's New (Admin-Specific)

1. **Admin Server** (`src/admin/server/`)
   - Express server setup
   - REST API routes
   - File watching for live updates

2. **File Manager with Comment Preservation** (`src/admin/server/file-manager.ts`)
   - Surgical YAML editing to preserve comments
   - Wraps existing file I/O with smart text manipulation

3. **Admin Frontend** (`src/admin/client/`)
   - React components for UI
   - Form management
   - State management
   - API client

4. **CLI Command** (`src/cli/admin.ts`)
   - New `projection admin` command
   - Server startup and configuration

### Benefits of This Approach

- **Single Source of Truth**: Validation rules defined once
- **Consistency**: Preview matches actual output exactly
- **Maintainability**: Bug fixes in core code automatically apply to admin
- **Smaller Codebase**: No duplicate logic to maintain
- **Type Safety**: Shared types prevent API mismatches

## Technology Stack

### Backend
- **Express.js**: Web server framework
- **yaml**: YAML parsing with comment preservation (new dependency)
- **js-yaml**: Keep for existing build commands (already a dependency)
- **chokidar**: File watching (already a dependency)
- **cors**: CORS middleware for development

### Frontend
- **React**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **CSS Modules** or **Styled Components**: Styling
- **React Hook Form**: Form management
- **Axios**: HTTP client

### Development
- **Concurrently**: Run server and client together
- **Nodemon**: Auto-restart server on changes

## Implementation Phases

### Phase 1: Backend Foundation
- Set up Express server
- Implement FileManager
- Create API routes for CRUD operations
- Add validation logic

### Phase 2: Frontend Foundation
- Set up React app with Vite
- Create basic layout and routing
- Implement API client service
- Set up state management

### Phase 3: Core Features
- Implement ProjectList component
- Implement ProjectForm component
- Add create/edit/delete functionality
- Add form validation

### Phase 4: Enhanced Features
- Add TagManager with autocomplete
- Implement PreviewPane
- Add sorting and filtering
- Improve error handling

### Phase 5: Polish
- Responsive design
- Loading states
- Animations and transitions
- Accessibility improvements

### Phase 6: CLI Integration
- Add `projection admin` command
- Handle port configuration
- Auto-open browser
- Graceful shutdown

## Security Considerations

1. **Local-Only Access**
   - Admin server should only bind to localhost by default
   - No authentication needed for local development
   - Future: Add authentication for remote access

2. **Input Validation**
   - Validate all user input on backend
   - Sanitize file paths to prevent directory traversal
   - Validate URLs to prevent XSS

3. **File System Safety**
   - Create backups before modifications
   - Validate file paths
   - Handle file permissions errors gracefully

4. **CORS**
   - Enable CORS only for development
   - Restrict origins in production builds

## Future Enhancements

1. **Image Upload**
   - Allow uploading thumbnail images
   - Store in assets directory
   - Generate thumbnails automatically

2. **Bulk Operations**
   - Import projects from CSV
   - Export projects to CSV
   - Bulk tag editing

3. **Project Templates**
   - Save project templates
   - Quick-create from template

4. **Analytics**
   - Track project views
   - Show popular projects
   - Tag usage statistics

5. **Collaboration**
   - Multi-user support
   - Change history
   - Conflict resolution

6. **Cloud Integration**
   - Save to cloud storage
   - Sync across devices
   - Backup to cloud
