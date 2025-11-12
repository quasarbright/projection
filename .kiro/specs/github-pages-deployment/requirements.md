# Requirements Document

## Introduction

This feature adds GitHub Pages deployment capabilities to Projection, allowing users to easily deploy their generated portfolio sites to GitHub Pages with a single command, similar to how react-gh-pages works.

## Glossary

- **Projection**: The static site generator tool for creating portfolio websites
- **GitHub Pages**: GitHub's static site hosting service
- **gh-pages**: An npm package that publishes files to a gh-pages branch on GitHub
- **Deploy Command**: A CLI command that builds and deploys the site to GitHub Pages
- **Build Directory**: The output directory containing the generated static site (default: dist)
- **Repository**: The Git repository where the project is hosted
- **Base URL**: The URL path where the site will be hosted (e.g., /repository-name/)

## Requirements

### Requirement 1: Deploy Command

**User Story:** As a developer, I want to deploy my portfolio to GitHub Pages with a single command, so that I can quickly publish my site without manual steps.

#### Acceptance Criteria

1. THE Projection CLI SHALL provide a `deploy` command that builds and deploys the site to GitHub Pages
2. WHEN the user runs `projection deploy`, THE Projection CLI SHALL build the site and push it to the gh-pages branch
3. THE Projection CLI SHALL display progress messages during the deployment process
4. WHEN deployment completes successfully, THE Projection CLI SHALL display the GitHub Pages URL
5. IF deployment fails, THEN THE Projection CLI SHALL display a clear error message with troubleshooting guidance

### Requirement 2: Configuration Support

**User Story:** As a developer, I want to configure deployment settings in my project, so that the deployment works correctly for my repository structure.

#### Acceptance Criteria

1. THE Projection CLI SHALL detect the Git remote URL from the repository
2. THE Projection CLI SHALL read the baseUrl from the Projection config file
3. THE Projection CLI SHALL allow users to specify a custom build directory via command-line flag
4. THE Projection CLI SHALL use the baseUrl from the Projection config when generating the site for deployment
5. WHERE a custom branch is specified, THE Projection CLI SHALL deploy to that branch instead of gh-pages
6. THE Projection CLI SHALL support a `homepage` field in the Projection config for custom domains

### Requirement 3: Pre-deployment Validation

**User Story:** As a developer, I want the tool to validate my setup before deploying, so that I catch configuration issues early.

#### Acceptance Criteria

1. WHEN the user runs `projection deploy`, THE Projection CLI SHALL verify that Git is installed
2. THE Projection CLI SHALL verify that a Git repository exists
3. THE Projection CLI SHALL verify that the repository has a remote configured
4. THE Projection CLI SHALL verify that the projects data file exists

### Requirement 4: Build Integration

**User Story:** As a developer, I want the deploy command to automatically build my site, so that I don't have to run separate commands.

#### Acceptance Criteria

1. WHEN the user runs `projection deploy`, THE Projection CLI SHALL automatically run the build process
2. THE Projection CLI SHALL use the same build configuration as the `projection build` command
3. IF the build fails, THEN THE Projection CLI SHALL abort the deployment and display the build error
4. THE Projection CLI SHALL allow users to skip the build step with a `--no-build` flag
5. THE Projection CLI SHALL clean the build directory before building when deploying
6. THE Projection CLI SHALL build the site regardless of whether dist is in .gitignore on the main branch

### Requirement 5: GitHub Pages Branch Management

**User Story:** As a developer, I want the tool to handle the gh-pages branch automatically, so that I don't have to manage it manually.

#### Acceptance Criteria

1. THE Projection CLI SHALL create a gh-pages branch if it does not exist
2. THE Projection CLI SHALL push the contents of the build directory to the root of the gh-pages branch
3. THE Projection CLI SHALL deploy the dist directory to gh-pages even if dist is gitignored in the main branch
4. THE Projection CLI SHALL create a separate .gitignore in the gh-pages branch that does not ignore the dist contents
5. THE Projection CLI SHALL preserve the commit history of the gh-pages branch
6. THE Projection CLI SHALL add a .nojekyll file to disable Jekyll processing
7. THE Projection CLI SHALL add a CNAME file if a homepage (custom domain) is configured in the Projection config

### Requirement 6: Configuration File Support

**User Story:** As a developer, I want to configure deployment settings in my Projection config, so that deployment works correctly for my site.

#### Acceptance Criteria

1. THE Projection config SHALL support an optional `homepage` field for custom domains
2. THE Projection config SHALL support an optional `deployBranch` field to specify the target branch
3. THE Projection CLI SHALL use these config values as defaults for deployment
4. THE command-line flags SHALL override config file values
5. THE Projection CLI SHALL work without any deployment-specific configuration using sensible defaults

### Requirement 7: Deployment Options

**User Story:** As a developer, I want to customize deployment behavior, so that I can handle different deployment scenarios.

#### Acceptance Criteria

1. THE Projection CLI SHALL support a `--branch` flag to specify a custom deployment branch
2. THE Projection CLI SHALL support a `--message` flag to customize the deployment commit message
3. THE Projection CLI SHALL support a `--remote` flag to specify a custom Git remote
4. THE Projection CLI SHALL support a `--dir` flag to specify a custom build directory
5. WHERE the `--dry-run` flag is provided, THE Projection CLI SHALL simulate deployment without pushing

### Requirement 8: Error Handling and Recovery

**User Story:** As a developer, I want clear error messages when deployment fails, so that I can fix issues quickly.

#### Acceptance Criteria

1. IF the Git repository is not initialized, THEN THE Projection CLI SHALL display instructions to initialize Git
2. IF no remote is configured, THEN THE Projection CLI SHALL display instructions to add a remote
3. IF authentication fails, THEN THE Projection CLI SHALL display instructions for setting up Git credentials
4. IF the push fails due to conflicts, THEN THE Projection CLI SHALL suggest using `--force` flag
5. THE Projection CLI SHALL log detailed error information for troubleshooting

### Requirement 9: Documentation and Help

**User Story:** As a developer, I want clear documentation on how to deploy to GitHub Pages, so that I can set it up correctly.

#### Acceptance Criteria

1. THE Projection CLI SHALL display help text for the deploy command when `projection deploy --help` is run
2. THE help text SHALL include examples of common deployment scenarios
3. THE help text SHALL explain all available flags and options
4. THE README SHALL include a section on deploying to GitHub Pages
5. THE README SHALL include troubleshooting tips for common deployment issues
