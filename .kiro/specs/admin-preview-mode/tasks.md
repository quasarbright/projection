# Implementation Plan

- [x] 1. Modify HTMLBuilder to support admin mode
  - Add adminMode parameter to HTMLBuilder constructor with HTMLBuilderOptions interface
  - Create generateAdminControls() method that returns edit/delete button HTML for project cards
  - Create generateCreateButton() method that returns create button HTML for header
  - Create generateAdminStyles() method that returns CSS for admin controls
  - Create generateAdminScript() method that returns postMessage communication JavaScript
  - Update generateProjectCard() to inject admin controls when adminMode is true
  - Update generateHTML() to include create button, admin styles, and admin script when adminMode is true
  - Ensure all admin features are omitted when adminMode is false
  - _Requirements: 1.2, 2.1, 2.3, 3.1, 5.2, 5.3_

- [x] 2. Add preview endpoint to admin server
  - Create GET /api/preview endpoint in src/admin/server/index.ts
  - Load current project data using fileManager
  - Load configuration using ConfigLoader
  - Instantiate HTMLBuilder with adminMode: true
  - Generate HTML and return with appropriate headers (Content-Type, X-Frame-Options)
  - Add error handling for data loading and HTML generation failures
  - _Requirements: 1.1, 5.4, 6.4_

- [x] 3. Update admin React app for preview mode
  - Add ViewMode type ('list' | 'form' | 'preview') to App.tsx
  - Add viewMode state and view control buttons in header
  - Create iframe component with ref for preview display
  - Add postMessage event listener in useEffect hook
  - Implement message origin verification (window.location.origin)
  - Implement message structure validation
  - Create handleEditFromPreview() to switch to form view with selected project
  - Create handleDeleteFromPreview() to show confirmation and delete project
  - Create handleCreateFromPreview() to switch to form view for new project
  - Create refreshPreview() function to reload iframe after data changes
  - Update handleSaveProject() to refresh preview after successful save
  - _Requirements: 1.3, 1.4, 1.5, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 6.2, 6.3, 6.5_

- [x] 4. Add CSS styles for preview mode
  - Add styles for view control buttons in admin.css
  - Add styles for preview-container with full height layout
  - Add styles for preview-iframe with no border and full dimensions
  - Add active state styling for view control buttons
  - Ensure responsive layout for preview mode
  - _Requirements: 2.2, 2.4_

- [x] 5. Update Generator class to pass through adminMode option
  - Modify Generator constructor to accept and store adminMode option
  - Update Generator.create() to accept adminMode in GeneratorOptions
  - Pass adminMode to HTMLBuilder constructor when creating instance
  - Ensure CLI build command never enables admin mode
  - _Requirements: 5.1, 5.4_

- [ ] 6. Write tests for HTMLBuilder admin mode
  - Test that admin controls are injected when adminMode is true
  - Test that admin controls are omitted when adminMode is false
  - Test that admin script is included only in admin mode
  - Test that admin styles are included only in admin mode
  - Test that create button appears in header only in admin mode
  - Test that generated HTML structure is valid with admin controls
  - _Requirements: 1.2, 2.1, 3.1, 5.2, 5.3_

- [ ] 7. Write tests for preview endpoint
  - Test that /api/preview returns HTML with status 200
  - Test that returned HTML includes admin controls
  - Test that X-Frame-Options header is set to SAMEORIGIN
  - Test error handling when project data cannot be loaded
  - Test error handling when HTML generation fails
  - _Requirements: 1.1, 5.4, 6.4_

- [ ] 8. Write integration tests for admin preview flow
  - Test complete flow: load preview, click edit button, save changes, verify refresh
  - Test delete action from preview with confirmation
  - Test create action from preview
  - Test that preview updates after data changes
  - Test postMessage communication between iframe and parent
  - Test origin verification rejects messages from wrong origin
  - Test malformed messages are ignored
  - _Requirements: 1.4, 1.5, 3.2, 3.3, 4.1, 4.2, 4.3, 6.2, 6.3, 6.5_
