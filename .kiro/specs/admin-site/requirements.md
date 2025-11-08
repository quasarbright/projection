# Requirements Document

## Introduction

This document specifies the requirements for an admin site feature for the Projection static site generator. The admin site will provide a web-based interface for managing project data, allowing users to create, edit, and delete projects without manually editing YAML or JSON files. The admin site will run locally during development and provide a user-friendly alternative to manual file editing.

## Glossary

- **Admin Site**: A web-based administrative interface for managing project data
- **Projection System**: The static site generator that creates portfolio websites from project data
- **Project Entry**: A single project record containing metadata like title, description, tags, links, and dates
- **Projects Data File**: The YAML or JSON file containing all project entries (projects.yaml, projects.yml, or projects.json)
- **Dev Server**: The local development server that serves the portfolio site with hot reloading
- **Admin Server**: The local server that hosts the admin interface
- **Portfolio Site**: The generated static website that displays projects to end users

## Requirements

### Requirement 1

**User Story:** As a portfolio owner, I want to access a web-based admin interface, so that I can manage my projects without editing files manually

#### Acceptance Criteria

1. WHEN the user runs a new CLI command "projection admin", THE Projection System SHALL start the Admin Server on a configurable port (default 3000)
2. WHEN the Admin Server starts, THE Projection System SHALL open the admin interface in the default web browser automatically
3. WHEN the user accesses the admin interface, THE Admin Site SHALL display a dashboard showing all existing projects
4. WHERE the user specifies a custom port using "--port" flag, THE Projection System SHALL start the Admin Server on the specified port
5. WHEN the user stops the Admin Server process, THE Projection System SHALL gracefully shut down and release the port

### Requirement 2

**User Story:** As a portfolio owner, I want to view all my projects in a list, so that I can see what projects I have at a glance

#### Acceptance Criteria

1. WHEN the admin dashboard loads, THE Admin Site SHALL display all projects from the Projects Data File in a table or card layout
2. THE Admin Site SHALL display key project information including title, creation date, tags, and featured status for each project
3. WHEN the user clicks on a project in the list, THE Admin Site SHALL navigate to a detailed view of that project
4. THE Admin Site SHALL provide sorting options by date, title, or featured status
5. THE Admin Site SHALL provide filtering options by tags

### Requirement 3

**User Story:** As a portfolio owner, I want to create new projects through the admin interface, so that I can add projects without editing YAML files

#### Acceptance Criteria

1. WHEN the user clicks a "New Project" button, THE Admin Site SHALL display a form with fields for all project properties
2. THE Admin Site SHALL provide input fields for id, title, description, creationDate, tags, pageLink, sourceLink, thumbnailLink, and featured status
3. WHEN the user submits the form with valid data, THE Admin Site SHALL add the new project to the Projects Data File
4. WHEN the user submits the form with invalid data, THE Admin Site SHALL display validation error messages indicating which fields are invalid
5. WHEN a new project is successfully created, THE Admin Site SHALL update the project list to include the new project

### Requirement 4

**User Story:** As a portfolio owner, I want to edit existing projects through the admin interface, so that I can update project information without editing YAML files

#### Acceptance Criteria

1. WHEN the user clicks an "Edit" button for a project, THE Admin Site SHALL display a form pre-filled with the current project data
2. THE Admin Site SHALL allow the user to modify any project field except the id
3. WHEN the user submits the form with valid changes, THE Admin Site SHALL update the project in the Projects Data File
4. WHEN the user submits the form with invalid data, THE Admin Site SHALL display validation error messages
5. WHEN a project is successfully updated, THE Admin Site SHALL reflect the changes in the project list

### Requirement 5

**User Story:** As a portfolio owner, I want to delete projects through the admin interface, so that I can remove outdated projects without editing YAML files

#### Acceptance Criteria

1. WHEN the user clicks a "Delete" button for a project, THE Admin Site SHALL display a confirmation dialog
2. WHEN the user confirms deletion, THE Admin Site SHALL remove the project from the Projects Data File
3. WHEN a project is successfully deleted, THE Admin Site SHALL update the project list to remove the deleted project
4. WHEN the user cancels deletion, THE Admin Site SHALL close the confirmation dialog without making changes
5. THE Admin Site SHALL prevent accidental deletion by requiring explicit confirmation

### Requirement 6

**User Story:** As a portfolio owner, I want the admin interface to validate my input, so that I can avoid creating invalid project data

#### Acceptance Criteria

1. WHEN the user enters a project id, THE Admin Site SHALL validate that the id matches the pattern /^[a-z0-9]+(?:-[a-z0-9]+)*$/
2. WHEN the user enters a project id, THE Admin Site SHALL validate that the id is unique across all projects
3. WHEN the user enters a creation date, THE Admin Site SHALL validate that the date is in YYYY-MM-DD format
4. THE Admin Site SHALL validate that required fields (id, title, description, creationDate, tags, pageLink) are not empty
5. WHEN validation fails, THE Admin Site SHALL display clear error messages explaining what needs to be corrected

### Requirement 7

**User Story:** As a portfolio owner, I want the admin interface to preserve my data format, so that my existing YAML or JSON files remain compatible

#### Acceptance Criteria

1. WHEN the Admin Site modifies the Projects Data File, THE Projection System SHALL preserve the original file format (YAML or JSON)
2. WHERE the Projects Data File is in YAML format, THE Projection System SHALL write changes back in YAML format
3. WHERE the Projects Data File is in JSON format, THE Projection System SHALL write changes back in JSON format
4. WHEN the Admin Site writes to the Projects Data File, THE Projection System SHALL preserve embedded configuration if present
5. THE Projection System SHALL maintain proper formatting and indentation when writing to the Projects Data File

### Requirement 8

**User Story:** As a portfolio owner, I want to preview my changes, so that I can see how projects will look before publishing

#### Acceptance Criteria

1. WHEN the user is viewing or editing a project in the admin interface, THE Admin Site SHALL display a preview of how the project card will appear
2. THE Admin Site SHALL render the preview using the same styling as the Portfolio Site
3. WHEN the user changes project data in the form, THE Admin Site SHALL update the preview in real-time
4. THE Admin Site SHALL provide a link to view the full Portfolio Site in a new tab
5. THE Admin Site SHALL indicate when changes have been saved to the Projects Data File

### Requirement 9

**User Story:** As a portfolio owner, I want to manage tags easily, so that I can maintain consistent tagging across projects

#### Acceptance Criteria

1. WHEN the user is adding or editing tags, THE Admin Site SHALL display a list of existing tags used across all projects
2. THE Admin Site SHALL allow the user to select from existing tags or create new tags
3. THE Admin Site SHALL provide autocomplete suggestions when typing tag names
4. THE Admin Site SHALL display tag usage statistics showing how many projects use each tag
5. THE Admin Site SHALL allow the user to add or remove multiple tags at once

### Requirement 10

**User Story:** As a portfolio owner, I want the admin interface to be responsive, so that I can manage projects from any device

#### Acceptance Criteria

1. WHEN the user accesses the admin interface on a mobile device, THE Admin Site SHALL display a mobile-optimized layout
2. THE Admin Site SHALL be fully functional on screen widths down to 320 pixels
3. THE Admin Site SHALL use responsive design patterns for forms, tables, and navigation
4. WHEN the user rotates their device, THE Admin Site SHALL adapt the layout to the new orientation
5. THE Admin Site SHALL provide touch-friendly controls on mobile devices

### Requirement 11

**User Story:** As a portfolio owner, I want to upload thumbnail images for my projects, so that I can visually showcase my work without manually managing file paths

#### Acceptance Criteria

1. WHEN the user is creating or editing a project, THE Admin Site SHALL provide a file upload control for thumbnail images
2. WHEN the user selects an image file, THE Admin Site SHALL validate that the file is a supported image format (PNG, JPG, JPEG, GIF, WebP)
3. WHEN the user uploads a valid image, THE Projection System SHALL save the image to the screenshots directory with the filename pattern "<project-id>.<extension>"
4. WHEN an image is successfully uploaded, THE Projection System SHALL update the project's thumbnailLink field with the relative path "screenshots/<project-id>.<extension>"
5. WHEN a project already has a thumbnail and the user uploads a new image, THE Projection System SHALL replace the existing thumbnail file
6. WHEN the user removes a thumbnail, THE Projection System SHALL delete the image file from the screenshots directory and clear the thumbnailLink field
7. WHEN the user views the project form, THE Admin Site SHALL display a preview of the current thumbnail image if one exists
8. THE Admin Site SHALL validate that uploaded image files do not exceed 5 megabytes in size
