# Design Document

## Overview

This design implements GitHub Pages deployment functionality for Projection, using the `gh-pages` npm package to handle the Git operations. The implementation follows the react-gh-pages pattern, allowing users to deploy their portfolio sites with a single command while handling the complexity of branch management and build directory publishing.

## Architecture

### Component Structure

```
src/cli/
  └── deploy.ts          # Deploy command implementation

src/utils/
  └── git-helper.ts      # Git repository validation utilities
  └── deployment-config.ts # Deployment configuration loader

projection.config.js     # Optional deployment configuration
```

### Data Flow

```
User runs `projection deploy`
  ↓
Validate Git repository and configuration
  ↓
Run build process (unless --no-build)
  ↓
Load deployment configuration
  ↓
Call gh-pages.publish() with options
  ↓
Display success message with GitHub Pages URL
```

## Components and Interfaces

### 1. Deploy Command (`src/cli/deploy.ts`)

**Purpose:** Main entry point for the deploy command

**Interface:**
```typescript
export interface DeployOptions {
  branch?: string;        // Target branch (default: 'gh-pages')
  message?: string;       // Commit message
  remote?: string;        // Git remote (default: 'origin')
  dir?: string;          // Build directory (default: 'dist')
  noBuild?: boolean;     // Skip build step
  dryRun?: boolean;      // Simulate deployment
  force?: boolean;       // Force push
}

export async function deploy(options: DeployOptions = {}): Promise<void>
```

**Responsibilities:**
- Parse command-line options
- Validate Git repository setup
- Run build process if needed
- Configure and execute gh-pages deployment
- Display progress and results

### 2. Git Helper (`src/utils/git-helper.ts`)

**Purpose:** Validate Git repository configuration

**Interface:**
```typescript
export interface GitValidationResult {
  isGitRepo: boolean;
  hasRemote: boolean;
  remoteName: string;
  remoteUrl: string;
  currentBranch: string;
}

export class GitHelper {
  static async isGitInstalled(): Promise<boolean>
  static async validateRepository(cwd: string): Promise<GitValidationResult>
  static async getRepositoryUrl(cwd: string, remote: string): Promise<string | null>
  static async getCurrentBranch(cwd: string): Promise<string>
}
```

**Responsibilities:**
- Check if directory is a Git repository
- Verify remote configuration
- Extract repository information

### 3. Deployment Config (`src/utils/deployment-config.ts`)

**Purpose:** Load and validate deployment configuration

**Interface:**
```typescript
export interface DeploymentConfig {
  repositoryUrl: string;
  homepage: string | null;
  baseUrl: string;
  branch: string;
  buildDir: string;
  remote: string;
}

export class DeploymentConfigLoader {
  static async load(cwd: string, options: DeployOptions): Promise<DeploymentConfig>
  static extractRepoName(repositoryUrl: string): string
  static generateGitHubPagesUrl(repositoryUrl: string): string
}
```

**Responsibilities:**
- Detect Git remote URL from repository
- Load Projection config for baseUrl and optional deployment settings
- Merge with command-line options
- Generate default values (branch, build directory, etc.)

### 4. CLI Integration (`src/cli/index.ts`)

**Updates:**
```typescript
program
  .command('deploy')
  .description('Deploy the portfolio site to GitHub Pages')
  .option('-b, --branch <branch>', 'Target branch', 'gh-pages')
  .option('-m, --message <message>', 'Commit message')
  .option('-r, --remote <remote>', 'Git remote', 'origin')
  .option('-d, --dir <dir>', 'Build directory', 'dist')
  .option('--no-build', 'Skip build step')
  .option('--dry-run', 'Simulate deployment')
  .option('--force', 'Force push')
  .action(deploy);
```

## Data Models

### Projection Config Extensions (Optional)

The Projection config file can include optional deployment settings:

```javascript
module.exports = {
  title: "My Portfolio",
  description: "My awesome projects",
  baseUrl: "/my-portfolio/",  // Used for GitHub Pages deployment
  
  // Optional deployment settings
  homepage: "portfolio.example.com",  // Custom domain - creates CNAME file (optional)
  deployBranch: "gh-pages",           // Target branch (default: gh-pages)
};
```

**Homepage field usage:**
- If set, creates a CNAME file in the gh-pages branch
- Enables custom domain support for GitHub Pages
- Should be just the domain (e.g., "example.com" or "www.example.com")
- If not set, no CNAME file is created (uses default GitHub Pages URL)

**Configuration Priority:**
1. Command-line flags (highest priority)
2. Projection config file
3. Auto-detected values from Git
4. Default values (lowest priority)

**Auto-detection:**
- Repository URL: Detected from `git remote get-url origin`
- Base URL: Generated from repository name (e.g., `/repo-name/`)
- Branch: Defaults to `gh-pages`
- Build directory: Defaults to `dist`

### gh-pages Options

```typescript
interface GhPagesOptions {
  branch: string;           // Target branch
  dest: string;            // Destination directory in branch (usually '.')
  message: string;         // Commit message
  remote: string;          // Git remote name
  dotfiles: boolean;       // Include dotfiles
  add: boolean;            // Add to existing files (preserve history)
  nojekyll: boolean;       // Add .nojekyll file
  cname: string | null;    // CNAME for custom domain
  user: {                  // Git user info
    name: string;
    email: string;
  };
}
```

## Error Handling

### Validation Errors

1. **Git Not Installed**
   - Error: "Git is not installed or not in PATH"
   - Solution: "Install Git from https://git-scm.com/"

2. **No Git Repository**
   - Error: "Not a git repository"
   - Solution: "Run 'git init' to initialize a repository"

3. **No Remote Configured**
   - Error: "No git remote found"
   - Solution: "Run 'git remote add origin <url>' to add a remote"

4. **Build Failure**
   - Error: "Build failed: <error message>"
   - Solution: "Fix build errors and try again"

### Deployment Errors

1. **Authentication Failure**
   - Error: "Authentication failed"
   - Solution: "Configure Git credentials or use SSH keys"

2. **Push Failure**
   - Error: "Failed to push to remote"
   - Solution: "Check network connection and repository permissions"

3. **Conflict**
   - Error: "Push rejected due to conflicts"
   - Solution: "Use --force flag to force push (caution: overwrites remote)"

## Testing Strategy

### Unit Tests

1. **GitHelper Tests**
   - Test repository validation
   - Test remote URL extraction
   - Test uncommitted changes detection
   - Mock Git commands

2. **DeploymentConfigLoader Tests**
   - Test config loading from package.json
   - Test default value generation
   - Test homepage URL generation
   - Test option merging

3. **Deploy Command Tests**
   - Test option parsing
   - Test validation flow
   - Test error handling
   - Mock gh-pages package

### Integration Tests

1. **End-to-End Deployment**
   - Create test repository
   - Run deploy command
   - Verify gh-pages branch created
   - Verify files deployed correctly
   - Clean up test repository

2. **Build Integration**
   - Test automatic build before deploy
   - Test --no-build flag
   - Test build failure handling

3. **Configuration Tests**
   - Test with various package.json configurations
   - Test with missing configuration
   - Test with custom options

## Implementation Notes

### Using gh-pages Package

The `gh-pages` package handles:
- Creating/updating the gh-pages branch
- Copying files from build directory
- Committing and pushing to remote
- Preserving commit history
- Adding .nojekyll file

**Key Benefits:**
- Battle-tested (used by create-react-app)
- Handles edge cases (empty branch, conflicts, etc.)
- Works with gitignored directories
- Supports all major Git hosting platforms

### Base URL Handling

For GitHub Pages, the base URL depends on the repository type:

1. **User/Organization Site** (`username.github.io`)
   - Base URL: `/`
   - Homepage: `https://username.github.io`

2. **Project Site** (`username.github.io/repo-name`)
   - Base URL: `/repo-name/`
   - Homepage: `https://username.github.io/repo-name`

The deployment process will:
1. Extract repo name from repository URL
2. Generate appropriate homepage URL
3. Update Projection config baseUrl for build
4. Build site with correct base URL
5. Deploy to gh-pages branch

### Gitignore Handling

The gh-pages package automatically handles gitignored directories:
- It uses `git add --force` to add files from the build directory
- The gh-pages branch has its own Git tree
- Files in dist/ are committed to gh-pages even if ignored in main branch
- No changes needed to main branch .gitignore

### Directory Publishing

The deployment publishes the **contents** of the dist directory, not the directory itself:
- Main branch: `dist/index.html`, `dist/styles/main.css`, etc.
- gh-pages branch: `index.html`, `styles/main.css`, etc. (at root)
- Result: Site served at `username.github.io/repo-name/`, not `username.github.io/repo-name/dist/`

Example for `quasarbright/projects`:
- Repository: `github.com/quasarbright/projects`
- Deployment: Contents of `dist/` → root of `gh-pages` branch
- Site URL: `quasarbright.github.io/projects/`
- Base URL in config: `/projects/`

### Init Command Integration

When running `projection init`, the CLI will:
1. Detect if a Git repository exists
2. If Git repository exists, detect the remote URL
3. Generate appropriate baseUrl from repository name
4. Add baseUrl to the generated config file
5. Display instructions for deployment with `projection deploy`

**No npm/package.json required** - Projection works as a standalone CLI tool.

## Security Considerations

1. **Credentials**
   - Use Git's credential helper
   - Support SSH keys
   - Never store credentials in code

2. **Force Push**
   - Warn user before force pushing
   - Require explicit --force flag
   - Explain consequences

3. **Validation**
   - Verify repository ownership
   - Check remote URL format
   - Validate branch names

## Performance Considerations

1. **Build Optimization**
   - Only build when necessary
   - Support --no-build for pre-built sites
   - Clean build directory before building

2. **Deployment Speed**
   - gh-pages uses incremental commits
   - Only changed files are pushed
   - Compression reduces transfer size

3. **Progress Feedback**
   - Show build progress
   - Show deployment progress
   - Display estimated time

## Future Enhancements

1. **Multiple Deployment Targets**
   - Support Netlify, Vercel, etc.
   - Unified deployment interface
   - Target-specific configuration

2. **Deployment History**
   - Track deployment history
   - Rollback capability
   - Deployment analytics

3. **CI/CD Integration**
   - GitHub Actions workflow
   - Automatic deployment on push
   - Preview deployments for PRs

4. **Custom Domain Support**
   - CNAME file generation
   - DNS configuration guidance
   - SSL certificate setup

## Migration Path

For existing Projection users:
1. Ensure your project is in a Git repository with a remote configured
2. Optionally add `baseUrl` to your projection.config.js (or let it auto-detect)
3. Run `projection deploy`

No other changes required - deployment works out of the box with Git.
