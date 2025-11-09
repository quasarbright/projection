# Requirements Document

## Introduction

This feature adds an admin preview mode to the portfolio generator that displays projects in the actual generated portfolio layout with injected edit/delete controls. The admin interface will show an iframe containing the generated HTML with interactive admin buttons, allowing users to edit projects while seeing exactly how they will appear on the live site. Communication between the iframe and parent window will be handled via the postMessage API.

## Glossary

- **Admin Preview Mode**: A mode where the HTMLBuilder generates portfolio HTML with embedded admin controls (edit/delete buttons)
- **Portfolio Generator**: The existing system that generates static HTML portfolio sites from project data
- **HTMLBuilder**: The class responsible for generating HTML markup for the portfolio site
- **Admin Server**: The Express server that serves the admin interface and provides API endpoints
- **Parent Window**: The main admin React application that contains the iframe
- **Iframe Content**: The generated portfolio HTML displayed within an iframe element
- **postMessage API**: Browser API for secure cross-origin communication between windows/iframes
- **Admin Controls**: Edit and delete buttons injected into project cards in admin mode

## Requirements

### Requirement 1

**User Story:** As a portfolio administrator, I want to see my projects displayed in the actual portfolio layout with edit and delete buttons, so that I can manage content while previewing the exact appearance of the live site.

#### Acceptance Criteria

1. WHEN THE Admin Server receives a request for preview HTML, THE Admin Server SHALL generate HTML using the HTMLBuilder with admin mode enabled
2. WHEN THE HTMLBuilder generates HTML in admin mode, THE HTMLBuilder SHALL inject edit and delete buttons into each project card
3. WHEN THE Admin React App displays the preview, THE Admin React App SHALL render the generated HTML within an iframe element
4. WHEN a user clicks an edit button in the iframe, THE Iframe Content SHALL send a postMessage event to the Parent Window containing the project ID
5. WHEN a user clicks a delete button in the iframe, THE Iframe Content SHALL send a postMessage event to the Parent Window containing the project ID and action type

### Requirement 2

**User Story:** As a portfolio administrator, I want the admin controls to be visually distinct from the portfolio content, so that I can easily identify which elements are for administration versus display.

#### Acceptance Criteria

1. THE HTMLBuilder SHALL generate admin control buttons with distinct CSS classes for styling
2. THE Admin Server SHALL serve admin-specific CSS that styles the edit and delete buttons
3. WHEN THE HTMLBuilder generates admin controls, THE HTMLBuilder SHALL position buttons in a consistent location on each project card
4. THE Admin Controls SHALL have hover states that provide visual feedback to users
5. THE Admin Controls SHALL not interfere with the existing portfolio card layout or styling

### Requirement 3

**User Story:** As a portfolio administrator, I want to create new projects from the preview interface, so that I can add content without switching views.

#### Acceptance Criteria

1. WHEN THE HTMLBuilder generates HTML in admin mode, THE HTMLBuilder SHALL inject a "Create New Project" button in the header area
2. WHEN a user clicks the create button in the iframe, THE Iframe Content SHALL send a postMessage event to the Parent Window indicating a create action
3. WHEN THE Parent Window receives a create message, THE Parent Window SHALL display the project creation form
4. WHEN a new project is created, THE Parent Window SHALL refresh the iframe to display the updated portfolio
5. THE Create button SHALL be styled consistently with other admin controls

### Requirement 4

**User Story:** As a portfolio administrator, I want the preview to automatically update when I save changes, so that I can immediately see the results of my edits.

#### Acceptance Criteria

1. WHEN a user saves a project edit, THE Parent Window SHALL refresh the iframe content
2. WHEN a user deletes a project, THE Parent Window SHALL refresh the iframe content
3. WHEN a user creates a new project, THE Parent Window SHALL refresh the iframe content
4. WHEN THE Parent Window refreshes the iframe, THE Admin Server SHALL regenerate the HTML with current project data
5. THE iframe refresh SHALL maintain the user's scroll position when possible

### Requirement 5

**User Story:** As a developer, I want the admin mode to be cleanly separated from production builds, so that admin controls never appear on the public portfolio site.

#### Acceptance Criteria

1. THE HTMLBuilder SHALL accept an optional adminMode parameter that defaults to false
2. WHEN adminMode is false, THE HTMLBuilder SHALL generate HTML without any admin controls or scripts
3. WHEN adminMode is true, THE HTMLBuilder SHALL include admin control markup and postMessage scripts
4. THE Admin Server SHALL only enable admin mode for preview endpoints, not for build commands
5. THE HTMLBuilder SHALL not include admin-specific CSS or JavaScript in production builds

### Requirement 6

**User Story:** As a portfolio administrator, I want secure communication between the iframe and admin interface, so that my admin actions cannot be intercepted or spoofed.

#### Acceptance Criteria

1. WHEN THE Iframe Content sends postMessage events, THE Iframe Content SHALL include an origin verification token
2. WHEN THE Parent Window receives postMessage events, THE Parent Window SHALL verify the message origin matches the expected iframe source
3. THE Parent Window SHALL ignore postMessage events from unexpected origins
4. THE Admin Server SHALL serve the iframe content from the same origin as the admin interface
5. THE postMessage event handlers SHALL validate message structure before processing actions
