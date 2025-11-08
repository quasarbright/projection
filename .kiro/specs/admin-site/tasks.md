# Implementation Plan

- [x] 1. Set up admin server foundation
  - Create Express server with TypeScript
  - Set up basic routing structure
  - Add CORS middleware for development
  - Configure server to serve static files
  - Write tests for server initialization and middleware setup
  - _Requirements: 1.1, 1.5_

- [x] 1.1 Create admin server entry point
  - Write `src/admin/server/index.ts` with Express server setup
  - Configure port binding and graceful shutdown
  - Add error handling for port conflicts
  - Write tests for server start/stop and port conflict handling
  - _Requirements: 1.1, 1.5_

- [x] 1.2 Set up admin server types
  - Create `src/admin/server/types.ts` with AdminServerConfig interface
  - Import and reuse existing types from `src/types/`
  - _Requirements: 1.1_

- [x] 2. Implement file management with comment preservation
  - Install `yaml` npm package for comment-preserving YAML operations
  - Create FileManager class that uses yaml Document API
  - Implement read/write operations that preserve comments
  - Add format detection (YAML vs JSON)
  - Write tests for file operations, comment preservation, and format detection
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2.1 Create YAML file manager
  - Write `src/admin/server/yaml-file-manager.ts` using yaml package
  - Implement readProjects() using parseDocument
  - Implement updateProject() that modifies Document nodes
  - Implement addProject() that appends to Document
  - Implement deleteProject() that removes from Document
  - Write tests for YAML CRUD operations and comment preservation
  - _Requirements: 7.2, 7.5_

- [x] 2.2 Create JSON file manager
  - Write `src/admin/server/json-file-manager.ts` for JSON format
  - Implement standard parse/stringify with pretty-printing
  - Use 2-space indentation for readability
  - Write tests for JSON CRUD operations and formatting
  - _Requirements: 7.3_

- [x] 2.3 Create unified file manager interface
  - Write `src/admin/server/file-manager.ts` that delegates to YAML or JSON manager
  - Implement format detection based on file extension
  - Add file backup functionality before modifications
  - Add file watching using existing chokidar dependency
  - Write tests for format detection, backup creation, and file watching
  - _Requirements: 7.1, 7.4_

- [x] 3. Create API routes with validation
  - Implement REST API endpoints for CRUD operations
  - Reuse existing Validator class for validation
  - Return appropriate HTTP status codes and error messages
  - Write comprehensive tests for all API endpoints including success and error cases
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3_

- [x] 3.1 Implement GET /api/projects endpoint
  - Read projects using FileManager
  - Return projects array and config
  - Handle file not found errors
  - Write tests for successful retrieval and file not found scenarios
  - _Requirements: 2.1_

- [x] 3.2 Implement POST /api/projects endpoint
  - Accept new project in request body
  - Validate using existing Validator class
  - Add project using FileManager
  - Return created project or validation errors
  - Write tests for successful creation, validation failures, and duplicate IDs
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3.3 Implement PUT /api/projects/:id endpoint
  - Accept updated project in request body
  - Validate using existing Validator class
  - Update project using FileManager
  - Return updated project or validation errors
  - Write tests for successful updates, validation failures, and project not found
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3.4 Implement DELETE /api/projects/:id endpoint
  - Delete project using FileManager
  - Return success status
  - Handle project not found errors
  - Write tests for successful deletion and project not found scenarios
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 3.5 Implement GET /api/tags endpoint
  - Extract all unique tags from projects
  - Calculate usage count for each tag
  - Return sorted list of tags with counts
  - Write tests for tag extraction, counting, and sorting
  - _Requirements: 9.1, 9.4_

- [x] 3.6 Implement GET /api/config endpoint
  - Load config using existing config loader
  - Return merged configuration
  - Write tests for config loading and merging
  - _Requirements: 2.1_

- [x] 3.7 Implement POST /api/preview endpoint
  - Accept partial project data in request body
  - Use existing HTMLBuilder to generate project card HTML
  - Return complete HTML with styles for iframe display
  - Write tests for preview generation with complete and partial project data
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 4. Add CLI command for admin server
  - Create new `projection admin` command
  - Parse command-line options (port, auto-open)
  - Start admin server and open browser
  - Handle graceful shutdown on Ctrl+C
  - Write tests for CLI command parsing and server startup
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 4.1 Create admin CLI command file
  - Write `src/cli/admin.ts` with command implementation
  - Add port option with default 3000
  - Add auto-open browser option
  - Import and start admin server
  - Write tests for option parsing and server initialization
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 4.2 Register admin command in CLI
  - Update `src/cli/index.ts` to include admin command
  - Add command help text and examples
  - Write tests for command registration
  - _Requirements: 1.1_

- [x] 5. Set up React frontend foundation
  - Initialize React app with Vite and TypeScript
  - Set up project structure and routing
  - Create API client service
  - Set up state management with Context API
  - Write tests for API client and state management
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 4.1, 5.1_

- [x] 5.1 Initialize React app
  - Create `src/admin/client` directory
  - Set up Vite configuration for React + TypeScript
  - Create package.json with dependencies (React, TypeScript, Axios)
  - Configure build output to be served by admin server
  - Write tests for build configuration
  - _Requirements: 2.1_

- [x] 5.2 Create API client service
  - Write `src/admin/client/src/services/api.ts`
  - Implement functions for all API endpoints (GET/POST/PUT/DELETE)
  - Add error handling and response typing
  - Use Axios for HTTP requests
  - Write tests for all API client methods with mocked responses
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3_

- [x] 5.3 Set up state management
  - Create `src/admin/client/src/context/ProjectContext.tsx`
  - Implement Context for projects, config, and loading states
  - Create custom hook `useProjects` for consuming context
  - Write tests for context provider and hooks
  - _Requirements: 2.1, 3.5, 4.5, 5.3_

- [x] 5.4 Create main App component
  - Write `src/admin/client/src/App.tsx` with layout structure
  - Add header with title and "New Project" button
  - Add footer with project count and portfolio link
  - Wrap app with ProjectContext provider
  - Write tests for App component rendering
  - _Requirements: 2.1_

- [x] 6. Implement ProjectList component
  - Display all projects in a table or card grid
  - Add sorting controls (by date, name, featured)
  - Add filtering controls (by tags, search)
  - Show project statistics
  - Handle edit and delete actions
  - Write tests for rendering, sorting, filtering, and user interactions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6.1 Create ProjectList component
  - Write `src/admin/client/src/components/ProjectList.tsx`
  - Display projects in a responsive table/grid
  - Show key fields: title, date, tags, featured status
  - Add "Edit" and "Delete" buttons for each project
  - Write tests for component rendering and button interactions
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 6.2 Add sorting functionality
  - Implement sort dropdown with options (date, name, featured)
  - Add ascending/descending toggle
  - Update project list when sort changes
  - Write tests for sorting logic and UI updates
  - _Requirements: 2.4_

- [x] 6.3 Add filtering functionality
  - Implement search input for title/description
  - Add tag filter buttons
  - Show filtered project count
  - Write tests for filtering logic and search functionality
  - _Requirements: 2.5_

- [x] 7. Implement ProjectForm component
  - Create form for adding/editing projects
  - Add input fields for all project properties
  - Implement client-side validation
  - Show validation errors inline
  - Integrate TagManager for tag selection
  - Write tests for form rendering, validation, and submission
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2, 9.3_

- [x] 7.1 Create ProjectForm component
  - Write `src/admin/client/src/components/ProjectForm.tsx`
  - Add input fields for id, title, description, creationDate, pageLink, sourceLink, thumbnailLink
  - Add checkbox for featured status
  - Add Save and Cancel buttons
  - Write tests for form rendering and field interactions
  - _Requirements: 3.1, 3.2, 4.1, 4.2_

- [x] 7.2 Add form validation
  - Validate required fields on blur and submit
  - Validate ID format with regex
  - Validate date format
  - Display inline error messages
  - Disable submit when validation fails
  - Write tests for all validation rules and error display
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7.3 Implement form submission
  - Call API to create or update project
  - Handle API validation errors
  - Show success message on save
  - Update project list after successful save
  - Write tests for successful submission and error handling
  - _Requirements: 3.3, 3.4, 3.5, 4.3, 4.4, 4.5_

- [ ] 8. Implement TagManager component
  - Create tag input with autocomplete
  - Display selected tags as removable chips
  - Show suggestions from existing tags
  - Allow creating new tags
  - Write tests for tag selection, autocomplete, and chip removal
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 8.1 Create TagManager component
  - Write `src/admin/client/src/components/TagManager.tsx`
  - Implement tag input with autocomplete dropdown
  - Display selected tags as chips with remove buttons
  - Fetch available tags from API
  - Write tests for component rendering and tag operations
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 8.2 Add tag autocomplete
  - Filter available tags based on input
  - Show dropdown with matching suggestions
  - Allow selecting from suggestions or typing new tag
  - Write tests for autocomplete filtering and selection
  - _Requirements: 9.3_

- [ ] 9. Implement PreviewPane component
  - Display live preview of project card
  - Use iframe to load server-rendered preview
  - Update preview when form data changes
  - Match portfolio site styling exactly
  - Write tests for preview rendering and updates
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 9.1 Create PreviewPane component
  - Write `src/admin/client/src/components/PreviewPane.tsx`
  - Create iframe that loads from /api/preview endpoint
  - POST current project data to preview endpoint
  - Display loading state while preview generates
  - Write tests for iframe rendering and loading states
  - _Requirements: 8.1, 8.2_

- [ ] 9.2 Add real-time preview updates
  - Debounce form changes to avoid excessive API calls
  - Update iframe content when project data changes
  - Handle preview errors gracefully
  - Write tests for debouncing and error handling
  - _Requirements: 8.3_

- [ ] 10. Implement ConfirmDialog component
  - Create reusable confirmation dialog
  - Use for delete confirmation
  - Show project title in confirmation message
  - Provide confirm and cancel actions
  - Write tests for dialog display and user interactions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 10.1 Create ConfirmDialog component
  - Write `src/admin/client/src/components/ConfirmDialog.tsx`
  - Display modal overlay with confirmation message
  - Add "Confirm" and "Cancel" buttons
  - Close dialog on cancel or after confirmation
  - Write tests for dialog rendering and button actions
  - _Requirements: 5.1, 5.4_

- [ ] 10.2 Integrate with delete action
  - Show ConfirmDialog when delete button clicked
  - Display project title in confirmation message
  - Call delete API on confirmation
  - Update project list after successful deletion
  - Write tests for delete flow integration
  - _Requirements: 5.2, 5.3_

- [ ] 11. Add responsive design and styling
  - Create CSS for admin interface
  - Implement responsive layouts for mobile/tablet/desktop
  - Use dark theme consistent with portfolio site
  - Add loading states and animations
  - Write tests for responsive behavior and accessibility
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 11.1 Create admin styles
  - Write `src/admin/client/src/styles/admin.css`
  - Define color scheme (dark theme)
  - Style header, footer, and main layout
  - Add button and form input styles
  - Write tests for style application and theme consistency
  - _Requirements: 10.1_

- [ ] 11.2 Implement responsive layouts
  - Add media queries for mobile (< 768px)
  - Add media queries for tablet (768px - 1024px)
  - Add media queries for desktop (> 1024px)
  - Use flexbox/grid for adaptive layouts
  - Write tests for responsive breakpoints
  - _Requirements: 10.2, 10.3, 10.4_

- [ ] 11.3 Add mobile-friendly controls
  - Increase touch target sizes on mobile
  - Optimize form layout for small screens
  - Add mobile-friendly navigation
  - Write tests for mobile interactions
  - _Requirements: 10.5_

- [ ] 12. Add error handling and user feedback
  - Implement error boundaries in React
  - Add toast notifications for success/error messages
  - Show loading spinners during API calls
  - Handle network errors gracefully
  - Write tests for error handling and user feedback
  - _Requirements: 3.4, 4.4, 5.3, 8.5_

- [ ] 12.1 Create error boundary
  - Write error boundary component for React
  - Show fallback UI when errors occur
  - Log errors to console
  - Write tests for error boundary behavior
  - _Requirements: 3.4, 4.4_

- [ ] 12.2 Add toast notification system
  - Create toast component for temporary messages
  - Show success toast after create/update/delete
  - Show error toast for API failures
  - Auto-dismiss after 3-5 seconds
  - Write tests for toast display and dismissal
  - _Requirements: 8.5_

- [ ] 12.3 Add loading states
  - Show spinner while fetching projects
  - Disable form during submission
  - Show loading indicator in preview pane
  - Write tests for loading state transitions
  - _Requirements: 8.5_

- [ ] 13. Build and integration
  - Configure build process for admin client
  - Set up admin server to serve built client files
  - Add development mode with hot reloading
  - Update main package.json scripts
  - Write tests for build process and integration
  - _Requirements: 1.1, 1.2_

- [ ] 13.1 Configure admin client build
  - Update Vite config to output to admin server's public directory
  - Add build script to admin client package.json
  - Configure TypeScript for production build
  - Write tests for build output validation
  - _Requirements: 1.1_

- [ ] 13.2 Configure admin server to serve client
  - Add static file serving middleware to Express
  - Serve built React app from public directory
  - Add fallback route for client-side routing
  - Write tests for static file serving
  - _Requirements: 1.1_

- [ ] 13.3 Add development scripts
  - Create script to run admin server and client concurrently
  - Use nodemon for server auto-restart
  - Use Vite dev server for client hot reloading
  - Write tests for development workflow
  - _Requirements: 1.2_

- [ ] 13.4 Update main package.json
  - Add admin-related scripts (admin:dev, admin:build)
  - Add new dependencies (express, yaml, cors, react, vite)
  - Update build script to include admin client build
  - Write tests for package scripts
  - _Requirements: 1.1_
