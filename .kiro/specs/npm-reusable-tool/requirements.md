# Requirements Document

## Introduction

This document outlines the requirements for transforming the existing static site generator from a personal portfolio tool into a reusable npm package that anyone can use to create their own project portfolio websites. The tool should be installable via npm, configurable through simple configuration files, and require minimal setup to generate a professional portfolio site.

## Glossary

- **Generator**: The static site generator system that transforms project data into HTML
- **User**: A developer who installs and uses the npm package to create their portfolio
- **Project Data**: YAML or JSON files containing information about projects to display
- **Template Assets**: CSS, JavaScript, and HTML template files used to generate the site
- **CLI**: Command-line interface for interacting with the Generator
- **Package**: The npm package containing the Generator and all necessary assets

## Requirements

### Requirement 1: Package Installation and Distribution

**User Story:** As a developer, I want to install the portfolio generator via npm, so that I can quickly set up my own portfolio site without forking a repository.

#### Acceptance Criteria

1. WHEN a User executes `npm install -g projection` or `npx projection`, THE Package SHALL be downloaded and made available for use
2. THE Package SHALL include all necessary template assets (CSS, JavaScript, HTML templates) bundled within it
3. THE Package SHALL be published to the npm registry with appropriate metadata and documentation
4. THE Package SHALL specify Node.js version requirements in its package.json

### Requirement 2: Project Initialization

**User Story:** As a developer, I want to initialize a new portfolio project in my directory, so that I get starter files and configuration without manual setup.

#### Acceptance Criteria

1. WHEN a User executes `projection init` in an empty directory, THE CLI SHALL create a sample projects.yaml file with example project entries
2. WHEN a User executes `projection init` in an empty directory, THE CLI SHALL create a configuration file with sensible defaults
3. WHEN a User executes `projection init` in a directory with existing files, THE CLI SHALL prompt for confirmation before overwriting any files
4. THE CLI SHALL provide feedback messages indicating which files were created during initialization

### Requirement 3: Configuration Management

**User Story:** As a developer, I want to configure my portfolio site through a simple configuration file, so that I can customize the site title, description, and other settings without modifying code.

#### Acceptance Criteria

1. THE Generator SHALL read configuration from a file named `projection.config.js`, `projection.config.json`, or from the config section in projects.yaml
2. THE Generator SHALL support configuration options including site title, description, base URL, items per page, and dynamic backgrounds
3. WHERE a configuration option is not provided, THE Generator SHALL use sensible default values
4. THE Generator SHALL validate configuration values and provide clear error messages for invalid configurations

### Requirement 4: Project Data Input

**User Story:** As a developer, I want to define my projects in a YAML or JSON file in my project directory, so that I can easily manage my project data without touching the generator code.

#### Acceptance Criteria

1. THE Generator SHALL read project data from projects.yaml, projects.yml, or projects.json in the User's working directory
2. THE Generator SHALL validate that required project fields (id, title, pageLink, creationDate) are present
3. IF project data validation fails, THEN THE Generator SHALL display specific error messages indicating which projects and fields are invalid
4. THE Generator SHALL support all existing project fields including optional fields like thumbnailLink, sourceLink, tags, and featured status

### Requirement 5: Asset Path Resolution

**User Story:** As a developer, I want to reference my project images and assets using relative paths from my project directory, so that I can organize my assets however I prefer.

#### Acceptance Criteria

1. WHEN a User provides a relative path for thumbnailLink or other asset references, THE Generator SHALL resolve paths relative to the User's working directory
2. THE Generator SHALL support absolute URLs (http/https) for external assets
3. THE Generator SHALL support relative paths starting with ./ or ../ for local assets
4. WHERE an asset path cannot be resolved, THE Generator SHALL use a default placeholder or display a warning

### Requirement 6: Site Generation

**User Story:** As a developer, I want to generate my portfolio site with a single command, so that I can quickly build and preview my site.

#### Acceptance Criteria

1. WHEN a User executes `projection build`, THE Generator SHALL read the project data and configuration from the current directory
2. WHEN a User executes `projection build`, THE Generator SHALL generate a complete HTML site in a dist directory
3. THE Generator SHALL copy all necessary CSS and JavaScript assets to the dist directory
4. THE Generator SHALL display progress messages and a success message upon completion

### Requirement 7: Template Customization

**User Story:** As a developer, I want to optionally customize the CSS and JavaScript of my portfolio, so that I can match my personal branding.

#### Acceptance Criteria

1. WHERE a User creates a `styles` directory with custom CSS files, THE Generator SHALL use those files instead of the default styles
2. WHERE a User creates a `scripts` directory with custom JavaScript files, THE Generator SHALL use those files instead of the default scripts
3. WHERE custom template files are not provided, THE Generator SHALL use the bundled default templates
4. THE Generator SHALL document which files can be customized and their expected structure

### Requirement 8: Development Workflow

**User Story:** As a developer, I want to preview my portfolio locally and see changes automatically, so that I can iterate quickly during development.

#### Acceptance Criteria

1. WHEN a User executes `projection dev`, THE Generator SHALL build the site and start a local development server
2. WHILE the development server is running, THE Generator SHALL watch for changes to project data and configuration files
3. WHEN project data or configuration changes, THE Generator SHALL automatically rebuild the site
4. THE Generator SHALL provide the local server URL in the console output

### Requirement 9: Documentation and Examples

**User Story:** As a developer, I want clear documentation and examples, so that I can understand how to use the tool and customize it for my needs.

#### Acceptance Criteria

1. THE Package SHALL include a comprehensive README with installation instructions, usage examples, and configuration options
2. THE Package SHALL include example project data demonstrating all supported fields and features
3. THE Package SHALL document the expected structure of project data files
4. THE Package SHALL provide examples of common customization scenarios

### Requirement 10: Backward Compatibility

**User Story:** As the original developer, I want my existing portfolio to continue working with the new npm package, so that I don't have to migrate my existing setup.

#### Acceptance Criteria

1. THE Generator SHALL support the existing projects.yaml format without requiring changes
2. THE Generator SHALL support the existing configuration structure embedded in projects.yaml
3. THE Generator SHALL maintain all existing features including search, filtering, sorting, and dynamic backgrounds
4. THE Generator SHALL generate output that is functionally equivalent to the current implementation
