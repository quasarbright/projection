# Requirements Document

## Introduction

This feature adds a "Deploy to GitHub Pages" button to the Projection admin interface, allowing users to deploy their portfolio directly from the web UI without switching to the command line. The button will be positioned to the left of the "New Project" button in the header and will trigger the same deployment functionality available through the CLI.

## Glossary

- **Admin Interface**: The web-based UI for managing Projection projects, accessible via `projection admin` command
- **Deploy Button**: A UI button that triggers GitHub Pages deployment
- **Deployment System**: The existing CLI deployment functionality that builds and pushes to GitHub Pages
- **Admin Server**: The Express server that hosts the admin interface and provides API endpoints
- **Git Helper**: Utility module that handles Git operations and validation

## Requirements

### Requirement 1

**User Story:** As a portfolio manager, I want to deploy my site to GitHub Pages from the admin interface, so that I can publish changes without leaving the web UI.

#### Acceptance Criteria

1. WHEN THE Admin Interface loads, THE Admin Interface SHALL display a "Deploy to GitHub Pages" button in the header to the left of the "New Project" button
2. WHEN THE user clicks the "Deploy to GitHub Pages" button, THE Admin Interface SHALL trigger a deployment process that builds and publishes the site to GitHub Pages
3. WHEN THE deployment process starts, THE Admin Interface SHALL display a loading indicator showing deployment progress
4. WHEN THE deployment completes successfully, THE Admin Interface SHALL display a success message with the GitHub Pages URL
5. IF THE deployment fails, THEN THE Admin Interface SHALL display an error message with details about the failure

### Requirement 2

**User Story:** As a portfolio manager, I want to see the deployment status in real-time, so that I know when my changes are live.

#### Acceptance Criteria

1. WHEN THE deployment is in progress, THE Admin Interface SHALL display the current deployment step (validating, building, pushing)
2. WHEN THE deployment completes, THE Admin Interface SHALL display the total deployment time
3. WHILE THE deployment is running, THE Admin Interface SHALL disable the deploy button to prevent concurrent deployments
4. WHEN THE deployment finishes, THE Admin Interface SHALL re-enable the deploy button

### Requirement 3

**User Story:** As a portfolio manager, I want to be notified if my Git repository is not configured for deployment, so that I can fix the configuration before attempting to deploy.

#### Acceptance Criteria

1. WHEN THE Admin Interface loads, THE Admin Interface SHALL check if Git is installed and the repository is configured
2. IF Git is not installed OR no Git repository exists OR no remote is configured, THEN THE Admin Interface SHALL disable the deploy button
3. WHEN THE user hovers over a disabled deploy button, THE Admin Interface SHALL display a tooltip explaining why deployment is unavailable
4. IF THE Git configuration is invalid, THEN THE Admin Interface SHALL provide a link or instructions to fix the configuration

### Requirement 4

**User Story:** As a portfolio manager, I want to see deployment configuration details, so that I understand where my site will be deployed.

#### Acceptance Criteria

1. WHEN THE user clicks the deploy button, THE Admin Interface SHALL display a confirmation dialog showing the deployment target (repository URL and branch)
2. WHEN THE confirmation dialog is shown, THE Admin Interface SHALL display the configured base URL
3. WHEN THE user confirms deployment, THE Admin Interface SHALL proceed with the deployment process
4. WHEN THE user cancels the confirmation dialog, THE Admin Interface SHALL close the dialog without deploying

### Requirement 5

**User Story:** As a portfolio manager, I want deployment errors to be clear and actionable, so that I can resolve issues quickly.

#### Acceptance Criteria

1. IF THE deployment fails due to authentication, THEN THE Admin Interface SHALL display instructions for setting up SSH keys or personal access tokens
2. IF THE deployment fails due to Git conflicts, THEN THE Admin Interface SHALL suggest using force push or resolving conflicts
3. IF THE deployment fails during the build step, THEN THE Admin Interface SHALL display the build error details
4. WHEN THE deployment fails, THE Admin Interface SHALL provide a "View Details" option to see the full error log
