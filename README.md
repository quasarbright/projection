# 🎬 Projection

A modern, reusable static site generator that creates beautiful, interactive galleries to showcase your coding projects. Generate your portfolio site with a single command.

## ✨ Features

- **📦 Easy Installation** - Install globally from source
- **🚀 Quick Setup** - Initialize a new project in seconds
- **📱 Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **🔍 Search & Filter** - Real-time search and tag-based filtering
- **🌙 Dark Theme** - Modern dark color scheme
- **⭐ Featured Projects** - Highlight your best work
- **🏷️ Flexible Tagging** - Organize projects with tags (ANY/ALL filtering)
- **📊 Multiple Formats** - Support for both YAML and JSON
- **🔥 Hot Reloading** - Development server with automatic rebuild and refresh
- **🎨 Customizable** - Override default styles and scripts
- **🎯 TypeScript** - Built with TypeScript for reliability

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [CLI Commands](#-cli-commands)
- [Configuration](#-configuration)
- [Project Data Format](#-project-data-format)
- [Customization](#-customization)
- [Examples](#-examples)
- [Troubleshooting](#-troubleshooting)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## 📦 Installation

### Requirements

- Node.js 14.0.0 or higher

### Install from Source

```bash
# Clone the repository
git clone https://github.com/quasarbright/projection.git
cd projection

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (makes 'projection' command available)
npm link
```

Now you can use the `projection` command from anywhere on your system!

## 🚀 Quick Start

### 1. Initialize a New Project

```bash
# Create a new directory for your portfolio
mkdir my-portfolio
cd my-portfolio

# Initialize with sample files
projection init
```

This creates:
- `projects.yaml` - Sample project data
- `projection.config.js` - Configuration file with defaults

### 2. Edit Your Projects

Edit `projects.yaml` to add your own projects:

```yaml
projects:
  - id: "my-awesome-project"
    title: "My Awesome Project"
    description: "A brief description of what this project does"
    creationDate: "2024-01-15"
    tags: ["web", "javascript"]
    pageLink: "https://example.com/my-project"
    sourceLink: "https://github.com/username/my-project"
    thumbnailLink: "./screenshots/project.png"
    featured: true
```

### 3. Start Development Server

```bash
projection dev
```

This will:
- Build your site
- Start a local server at http://localhost:8080
- Watch for changes and auto-reload
- Open your browser automatically

### 4. Build for Production

```bash
projection build
```

Your site will be generated in the `dist/` directory, ready for deployment.

## 🛠️ CLI Commands

### `projection init`

Initialize a new Projection project with sample files.

**Usage:**
```bash
projection init [options]
```

**Options:**
- `--force` - Overwrite existing files without prompting
- `--format <yaml|json>` - Choose data format (default: yaml)
- `--minimal` - Create minimal example instead of full sample

**Examples:**
```bash
# Initialize with default settings
projection init

# Force overwrite existing files
projection init --force

# Initialize with JSON format
projection init --format json

# Create minimal example
projection init --minimal
```

### `projection build`

Generate the static site from your project data.

**Usage:**
```bash
projection build [options]
```

**Options:**
- `--config <path>` - Path to custom config file
- `--output <path>` - Custom output directory (default: dist)
- `--clean` - Clean output directory before build

**Examples:**
```bash
# Basic build
projection build

# Build with custom config
projection build --config my-config.js

# Build to custom directory
projection build --output public

# Clean build
projection build --clean
```

### `projection dev`

Start development server with file watching and live reload.

**Usage:**
```bash
projection dev [options]
```

**Options:**
- `--config <path>` - Path to custom config file
- `--output <path>` - Custom output directory (default: dist)
- `--port <number>` - Server port (default: 8080)
- `--no-open` - Don't open browser automatically

**Examples:**
```bash
# Start dev server
projection dev

# Use custom port
projection dev --port 3000

# Don't open browser
projection dev --no-open

# Use custom config
projection dev --config my-config.js
```

**What it watches:**
- `projects.yaml` / `projects.yml` / `projects.json`
- `projection.config.js` / `projection.config.json`
- `styles/` directory (if exists)
- `scripts/` directory (if exists)

### `projection serve`

Serve the generated site with a local HTTP server.

**Usage:**
```bash
projection serve [options]
```

**Options:**
- `--port <number>` - Server port (default: 8080)
- `--open` - Open browser automatically
- `--dir <path>` - Directory to serve (default: dist)

**Examples:**
```bash
# Serve the dist directory
projection serve

# Serve on custom port and open browser
projection serve --port 3000 --open

# Serve custom directory
projection serve --dir public
```

### Help and Version

```bash
# Show help
projection --help
projection -h

# Show version
projection --version
projection -v
```

## ⚙️ Configuration

### Configuration File Formats

Projection supports multiple configuration formats. It will look for configuration in this order:

1. Command-line `--config` option
2. `projection.config.js` in current directory
3. `projection.config.json` in current directory
4. `config` section in `projects.yaml` / `projects.json`
5. Default configuration

### projection.config.js

**Recommended format** - JavaScript configuration file:

```javascript
module.exports = {
  // Site title (displayed in header)
  title: "My Projects",
  
  // Site description (used in meta tags)
  description: "A showcase of my coding projects",
  
  // Base URL for resolving relative paths
  baseUrl: "https://username.github.io/",
  
  // Number of items per page (for future pagination)
  itemsPerPage: 20,
  
  // Dynamic background iframe URLs (optional)
  dynamicBackgrounds: [
    "https://example.com/background1",
    "https://example.com/background2"
  ],
  
  // Fallback thumbnail image (optional)
  defaultScreenshot: "./images/default-thumbnail.png",
  
  // Custom styles directory (optional)
  customStyles: "./my-styles",
  
  // Custom scripts directory (optional)
  customScripts: "./my-scripts",
  
  // Output directory (default: dist)
  output: "dist"
};
```

### projection.config.json

JSON format configuration:

```json
{
  "title": "My Projects",
  "description": "A showcase of my coding projects",
  "baseUrl": "https://username.github.io/",
  "itemsPerPage": 20,
  "dynamicBackgrounds": [],
  "defaultScreenshot": null,
  "output": "dist"
}
```

### Embedded Configuration

You can also embed configuration in your `projects.yaml`:

```yaml
config:
  title: "My Projects"
  description: "A showcase of my coding projects"
  baseUrl: "https://username.github.io/"
  itemsPerPage: 20

projects:
  - id: "project-1"
    # ...
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | "My Projects" | Site title displayed in header |
| `description` | string | "A showcase of my coding projects" | Site description and meta description |
| `baseUrl` | string | "./" | Base URL for resolving relative paths |
| `itemsPerPage` | number | 20 | Number of projects per page (future use) |
| `dynamicBackgrounds` | string[] | [] | Array of background iframe URLs |
| `defaultScreenshot` | string | undefined | Fallback thumbnail image path |
| `customStyles` | string | undefined | Path to custom styles directory |
| `customScripts` | string | undefined | Path to custom scripts directory |
| `output` | string | "dist" | Output directory path |

### Path Resolution

The `baseUrl` is used to resolve relative paths in your project data:

- **Relative paths** (`./path`, `../path`, `filename`) → Resolved relative to `baseUrl`
- **Absolute paths** (`/path`) → Used as-is
- **Full URLs** (`https://...`) → Used as-is

**Example:**
```javascript
// Config
baseUrl: "https://username.github.io/portfolio/"

// Project data
pageLink: "./my-project/"  // → https://username.github.io/portfolio/my-project/
pageLink: "/absolute"      // → /absolute
pageLink: "https://..."    // → https://...
```

## 📊 Project Data Format

### Supported Formats

Projection automatically detects and reads project data from:
1. `projects.yaml` (recommended)
2. `projects.yml`
3. `projects.json`

### YAML Format (Recommended)

```yaml
projects:
  - id: "awesome-project"
    title: "Awesome Project"
    description: "This project does amazing things with modern web technologies"
    creationDate: "2024-01-15"
    tags: ["web", "javascript", "typescript"]
    pageLink: "./awesome-project/"
    sourceLink: "https://github.com/username/awesome-project"
    thumbnailLink: "./screenshots/awesome.png"
    featured: true
    
  - id: "another-project"
    title: "Another Project"
    description: "A different project with different features"
    creationDate: "2024-02-20"
    tags: ["python", "data-science"]
    pageLink: "https://example.com/another-project"
    thumbnailLink: "./screenshots/another.png"
```

### JSON Format

```json
{
  "projects": [
    {
      "id": "awesome-project",
      "title": "Awesome Project",
      "description": "This project does amazing things",
      "creationDate": "2024-01-15",
      "tags": ["web", "javascript"],
      "pageLink": "./awesome-project/",
      "sourceLink": "https://github.com/username/awesome-project",
      "thumbnailLink": "./screenshots/awesome.png",
      "featured": true
    }
  ]
}
```

### Project Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ Yes | Unique identifier (must be valid URL slug: lowercase, alphanumeric, hyphens only) |
| `title` | string | ✅ Yes | Display name of the project |
| `description` | string | ✅ Yes | Project description (truncated with ellipsis on cards) |
| `creationDate` | string | ✅ Yes | ISO date string (YYYY-MM-DD format) |
| `tags` | string[] | ✅ Yes | Array of tags for categorization and filtering |
| `pageLink` | string | ✅ Yes | Primary link to the project (page, demo, or live site) |
| `sourceLink` | string | ❌ No | Link to source code repository (shows "Source Code" button) |
| `thumbnailLink` | string | ❌ No | Path or URL to project screenshot (used as card background) |
| `featured` | boolean | ❌ No | Highlight the project with special styling (border and badge) |

### Field Validation Rules

#### Project ID (`id`)
- Must be unique across all projects
- Must be a valid URL slug:
  - Lowercase letters only
  - Can contain numbers and hyphens
  - Cannot start or end with a hyphen
  - Pattern: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`

**Valid IDs:**
```yaml
id: "my-project"
id: "project-123"
id: "awesome-web-app"
```

**Invalid IDs:**
```yaml
id: "My-Project"      # ❌ Contains uppercase
id: "-my-project"     # ❌ Starts with hyphen
id: "my_project"      # ❌ Contains underscore
id: "my project"      # ❌ Contains space
```

#### Creation Date (`creationDate`)
- Must be in ISO date format: `YYYY-MM-DD`
- Used for sorting projects by date

**Valid dates:**
```yaml
creationDate: "2024-01-15"
creationDate: "2023-12-31"
```

**Invalid dates:**
```yaml
creationDate: "01/15/2024"  # ❌ Wrong format
creationDate: "2024-1-5"    # ❌ Missing leading zeros
```

## 🎨 Customization

### Custom Styles

You can override the default styles by creating a `styles/` directory in your project:

```bash
mkdir styles
# Add your custom CSS files
```

**Directory structure:**
```
my-portfolio/
├── styles/
│   ├── main.css      # Override main styles
│   ├── cards.css     # Override card styles
│   └── custom.css    # Add your own styles
├── projects.yaml
└── projection.config.js
```

If the `styles/` directory exists, Projection will use your custom styles instead of the bundled defaults. You can copy the default styles and modify them:

**Default styles included:**
- `main.css` - Layout, theme, components, dark color scheme
- `cards.css` - Project card styling, 3D hover effects, background images
- `modal.css` - Modal styling (for future use)

### Custom Scripts

Similarly, you can override JavaScript functionality:

```bash
mkdir scripts
# Add your custom JavaScript files
```

**Default scripts included:**
- `search.js` - Real-time search functionality
- `filter.js` - Tag filtering and sorting
- `modal.js` - Modal functionality (for future use)
- `dynamic-background.js` - Dynamic background effects

### Custom Assets

Place additional assets in an `assets/` directory:

```bash
mkdir assets
# Add favicon, images, etc.
```

### Template Resolution

Projection uses this priority for templates:

1. **User custom files** in your project directory (`styles/`, `scripts/`, `assets/`)
2. **Bundled defaults** from the package

This allows you to:
- Use defaults out of the box
- Override specific files as needed
- Mix custom and default files

## 💡 Examples

### Example 1: Personal Portfolio

```bash
# Initialize project
mkdir my-portfolio && cd my-portfolio
projection init

# Edit projects.yaml with your projects
# ...

# Start development
projection dev
```

### Example 2: GitHub Pages Deployment

```bash
# Build for GitHub Pages
projection build

# Configure for GitHub Pages
# In projection.config.js:
module.exports = {
  title: "My Projects",
  baseUrl: "https://username.github.io/repository-name/"
};

# Deploy dist/ to gh-pages branch
```

### Example 3: Custom Styling

```bash
# Initialize project
projection init

# Create custom styles
mkdir styles
echo "body { background: #1a1a2e; }" > styles/custom.css

# Build with custom styles
projection build
```

### Example 4: Multiple Environments

```bash
# Development config
projection dev --config dev.config.js

# Production config
projection build --config prod.config.js --output public
```

### Example 5: JSON Format

```bash
# Initialize with JSON
projection init --format json

# Edit projects.json
# ...

# Build
projection build
```

## 🔧 Troubleshooting

### Build Fails with "Projects file not found"

**Problem:** Projection can't find your project data file.

**Solution:**
```bash
# Make sure you have one of these files:
ls projects.yaml  # or projects.yml or projects.json

# If not, initialize a new project:
projection init
```

### Invalid Project ID Error

**Problem:** Project ID doesn't match the required format.

**Solution:** Project IDs must be valid URL slugs:
```yaml
# ✅ Good
id: "my-awesome-project"
id: "project-123"

# ❌ Bad
id: "My Project"        # Use: "my-project"
id: "project_name"      # Use: "project-name"
id: "-my-project"       # Use: "my-project"
```

### Dev Server Port Already in Use

**Problem:** Port 8080 is already in use.

**Solution:**
```bash
# Use a different port
projection dev --port 3000
```

### Changes Not Reflecting in Browser

**Problem:** Browser shows old content after changes.

**Solution:**
1. Make sure dev server is running (`projection dev`)
2. Check console for rebuild messages
3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Clear browser cache

### Missing Thumbnails

**Problem:** Project thumbnails not showing.

**Solution:**
1. Check that `thumbnailLink` paths are correct
2. Verify images exist at specified paths
3. Use relative paths from your project root:
   ```yaml
   thumbnailLink: "./images/project.png"
   ```
4. Or use absolute URLs:
   ```yaml
   thumbnailLink: "https://example.com/image.png"
   ```

### Build Output Directory Not Created

**Problem:** `dist/` directory doesn't exist after build.

**Solution:**
```bash
# Check for build errors
projection build

# Try cleaning first
projection build --clean

# Check file permissions
ls -la
```

### TypeScript Errors During Development

**Problem:** Seeing TypeScript compilation errors.

**Solution:**
```bash
# Rebuild the package
npm run build

# If you're developing the package itself:
npm install
npm run build
```

### Module Not Found Errors

**Problem:** Getting "Cannot find module" errors.

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# For global installation, re-link:
cd /path/to/projection
npm run build
npm link
```

## 🚢 Deployment

The generated `dist/` directory contains everything needed for deployment.

### Deploying to GitHub Pages

Projection includes a built-in `deploy` command that makes deploying to GitHub Pages effortless. It automatically builds your site and publishes it to the `gh-pages` branch.

#### Quick Start

```bash
# Deploy your site in one command
projection deploy
```

That's it! Your site will be built and deployed to GitHub Pages automatically.

#### Prerequisites

Before deploying, make sure you have:

1. **Git installed** on your system
2. **A Git repository** initialized in your project:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. **A remote repository** configured (usually on GitHub):
   ```bash
   git remote add origin https://github.com/username/repository-name.git
   ```

#### Step-by-Step Deployment

**1. Configure your site for GitHub Pages**

Add a `baseUrl` to your `projection.config.js`:

```javascript
module.exports = {
  title: "My Portfolio",
  description: "My awesome projects",
  baseUrl: "/repository-name/",  // Important for GitHub Pages!
};
```

The `baseUrl` should match your repository name:
- For `https://github.com/username/my-portfolio` → use `baseUrl: "/my-portfolio/"`
- For user/org sites (`username.github.io`) → use `baseUrl: "/"`

**2. Deploy your site**

```bash
projection deploy
```

This command will:
- ✅ Validate your Git setup
- ✅ Build your site with the correct base URL
- ✅ Create/update the `gh-pages` branch
- ✅ Push your site to GitHub
- ✅ Display your GitHub Pages URL

**3. Enable GitHub Pages (first time only)**

After your first deployment:

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Click **Save**

Your site will be live at `https://username.github.io/repository-name/` within a few minutes!

#### Configuration Options

##### In projection.config.js

```javascript
module.exports = {
  // Required for GitHub Pages
  baseUrl: "/repository-name/",
  
  // Optional: Custom domain (creates CNAME file)
  homepage: "portfolio.example.com",
  
  // Optional: Custom deployment branch
  deployBranch: "gh-pages",
};
```

##### Command-Line Options

```bash
# Deploy to a custom branch
projection deploy --branch main

# Custom commit message
projection deploy --message "Update portfolio with new projects"

# Use a different Git remote
projection deploy --remote upstream

# Skip the build step (use existing dist/)
projection deploy --no-build

# Deploy from a custom directory
projection deploy --dir build

# Simulate deployment without pushing
projection deploy --dry-run

# Force push (overwrites remote history)
projection deploy --force
```

#### Examples for Different Repository Types

##### Example 1: Project Repository (most common)

**Repository:** `https://github.com/username/my-portfolio`

**Configuration:**
```javascript
// projection.config.js
module.exports = {
  title: "My Portfolio",
  baseUrl: "/my-portfolio/",
};
```

**Deploy:**
```bash
projection deploy
```

**Result:** Site live at `https://username.github.io/my-portfolio/`

##### Example 2: User/Organization Site

**Repository:** `https://github.com/username/username.github.io`

**Configuration:**
```javascript
// projection.config.js
module.exports = {
  title: "My Portfolio",
  baseUrl: "/",  // Root path for user sites
};
```

**Deploy:**
```bash
projection deploy
```

**Result:** Site live at `https://username.github.io/`

##### Example 3: Custom Domain

**Repository:** `https://github.com/username/portfolio`

**Configuration:**
```javascript
// projection.config.js
module.exports = {
  title: "My Portfolio",
  baseUrl: "/",  // Root path for custom domains
  homepage: "portfolio.example.com",  // Creates CNAME file
};
```

**Deploy:**
```bash
projection deploy
```

**DNS Setup (required for custom domains):**
1. Add a CNAME record pointing to `username.github.io`
2. Or add A records pointing to GitHub's IPs:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`

**Result:** Site live at `https://portfolio.example.com/`

##### Example 4: Deploy to Different Branch

```bash
# Deploy to 'main' branch instead of 'gh-pages'
projection deploy --branch main
```

Then configure GitHub Pages to use the `main` branch.

#### Troubleshooting Deployment

##### "Git is not installed"

**Problem:** Git is not found on your system.

**Solution:**
```bash
# Install Git
# macOS (with Homebrew):
brew install git

# Windows: Download from https://git-scm.com/
# Linux (Ubuntu/Debian):
sudo apt-get install git
```

##### "Not a git repository"

**Problem:** Your project is not a Git repository.

**Solution:**
```bash
# Initialize Git repository
git init
git add .
git commit -m "Initial commit"
```

##### "No git remote found"

**Problem:** No remote repository is configured.

**Solution:**
```bash
# Add a remote (replace with your repository URL)
git remote add origin https://github.com/username/repository-name.git

# Verify remote was added
git remote -v
```

##### "Authentication failed"

**Problem:** Git cannot authenticate with GitHub.

**Solution:**

**Option 1: Use SSH (recommended)**
```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add SSH key to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Add public key to GitHub:
# 1. Copy your public key:
cat ~/.ssh/id_ed25519.pub
# 2. Go to GitHub → Settings → SSH and GPG keys → New SSH key
# 3. Paste your key and save

# Update remote to use SSH
git remote set-url origin git@github.com:username/repository-name.git
```

**Option 2: Use Personal Access Token**
```bash
# 1. Create a token on GitHub:
#    Settings → Developer settings → Personal access tokens → Generate new token
#    Select 'repo' scope

# 2. Use token as password when prompted, or configure credential helper:
git config --global credential.helper store

# 3. Next time you push, enter your token as the password
```

##### "Failed to push to remote"

**Problem:** Push was rejected due to conflicts or permissions.

**Solution:**

**If there are conflicts:**
```bash
# Force push (caution: overwrites remote)
projection deploy --force
```

**If you don't have permissions:**
- Verify you have write access to the repository
- Check that you're pushing to the correct remote
- Ensure your authentication is working

##### "Site not updating after deployment"

**Problem:** GitHub Pages shows old content after deployment.

**Solution:**
1. **Wait a few minutes** - GitHub Pages can take 1-10 minutes to update
2. **Check GitHub Actions** - Go to your repository → Actions tab to see build status
3. **Hard refresh browser** - Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)
4. **Verify gh-pages branch** - Check that the branch has your latest changes
5. **Check GitHub Pages settings** - Ensure it's configured to use the `gh-pages` branch

##### "404 errors for assets (CSS, images)"

**Problem:** Your site loads but CSS and images are broken.

**Solution:** Check your `baseUrl` configuration:

```javascript
// ❌ Wrong - missing trailing slash
baseUrl: "/my-portfolio"

// ✅ Correct - includes trailing slash
baseUrl: "/my-portfolio/"

// ❌ Wrong - for project sites
baseUrl: "/"

// ✅ Correct - for project sites
baseUrl: "/repository-name/"
```

After fixing, redeploy:
```bash
projection deploy
```

##### "Custom domain not working"

**Problem:** Custom domain shows 404 or doesn't resolve.

**Solution:**

1. **Verify CNAME file exists:**
   ```bash
   # Check gh-pages branch for CNAME file
   git checkout gh-pages
   cat CNAME  # Should contain your domain
   git checkout main
   ```

2. **Check DNS configuration:**
   - CNAME record should point to `username.github.io`
   - DNS changes can take up to 48 hours to propagate
   - Use `dig portfolio.example.com` to verify DNS

3. **Configure in GitHub:**
   - Go to Settings → Pages
   - Enter your custom domain
   - Enable "Enforce HTTPS" (after DNS propagates)

4. **Update your config:**
   ```javascript
   module.exports = {
     baseUrl: "/",  // Root for custom domains
     homepage: "portfolio.example.com",
   };
   ```

##### "Build fails during deployment"

**Problem:** The build step fails before deployment.

**Solution:**
```bash
# Test build locally first
projection build

# Check for errors in your projects.yaml
# Common issues:
# - Invalid project IDs
# - Missing required fields
# - Invalid date formats

# If build works locally, try:
projection deploy --clean
```

##### "Permission denied (publickey)"

**Problem:** SSH authentication is failing.

**Solution:**
```bash
# Test SSH connection
ssh -T git@github.com

# If it fails, check your SSH key:
ls -la ~/.ssh

# Add your SSH key to the agent
ssh-add ~/.ssh/id_ed25519

# Or use HTTPS instead of SSH
git remote set-url origin https://github.com/username/repository-name.git
```

#### Advanced Deployment Workflows

##### Automated Deployment with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install Projection
      run: |
        git clone https://github.com/quasarbright/projection.git
        cd projection
        npm install
        npm run build
        npm link
        cd ..
    
    - name: Deploy
      run: projection deploy --message "Deploy from GitHub Actions"
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

##### Deploy from a Monorepo

```bash
# If your portfolio is in a subdirectory
cd portfolio/
projection deploy

# Or specify the directory
projection deploy --dir ../portfolio/dist
```

##### Preview Deployments

```bash
# Deploy to a preview branch
projection deploy --branch preview

# View at: https://username.github.io/repository-name/ (configure Pages to use preview branch)
```

#### Best Practices

1. **Always commit your changes first:**
   ```bash
   git add .
   git commit -m "Update projects"
   projection deploy
   ```

2. **Test locally before deploying:**
   ```bash
   projection dev  # Test in development
   projection build  # Test production build
   projection serve  # Serve production build locally
   projection deploy  # Deploy when ready
   ```

3. **Use meaningful commit messages:**
   ```bash
   projection deploy --message "Add new machine learning projects"
   ```

4. **Keep your baseUrl in sync:**
   - If you rename your repository, update `baseUrl` in your config
   - Redeploy after changing `baseUrl`

5. **Don't commit dist/ to main branch:**
   - Add `dist/` to `.gitignore` on your main branch
   - The deploy command handles the gh-pages branch separately

6. **Use SSH for authentication:**
   - More secure than HTTPS with tokens
   - No need to enter credentials repeatedly

### Other Deployment Options

#### Netlify

1. Build your site: `projection build`
2. Drag and drop the `dist/` folder to Netlify
3. Or connect your Git repository with build command: `projection build`

#### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**vercel.json:**
```json
{
  "buildCommand": "projection build",
  "outputDirectory": "dist"
}
```

#### Static Hosting

Upload the contents of `dist/` to any static hosting service:
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps
- Cloudflare Pages
- Surge.sh

## 📁 Project Structure

```
my-portfolio/
├── projects.yaml              # Your project data
├── projection.config.js       # Configuration (optional)
├── styles/                    # Custom styles (optional)
│   ├── main.css
│   └── custom.css
├── scripts/                   # Custom scripts (optional)
│   └── custom.js
├── assets/                    # Static assets (optional)
│   └── favicon.ico
├── screenshots/               # Project thumbnails
│   ├── project1.png
│   └── project2.png
└── dist/                      # Generated site (created by build)
    ├── index.html
    ├── styles/
    ├── scripts/
    └── assets/
```

## 🔄 Migration Guide

### Migrating from Version 1.x

If you were using the original version of Projection (running `node generator.js` directly), here's how to migrate to the new npm package version:

#### What Changed

**Version 2.0** is a complete refactor that transforms Projection from a personal tool into a reusable npm package. The good news: **your existing project data works without any changes!**

#### Migration Steps

1. **Install the new version:**
   ```bash
   # From source (recommended for now)
   cd /path/to/projection
   npm install
   npm run build
   npm link
   ```

2. **Your existing files work as-is:**
   - `projects.yaml` - No changes needed ✅
   - Embedded config in YAML - Still supported ✅
   - Custom styles/scripts - Still work ✅

3. **Update your workflow:**
   ```bash
   # Old way:
   node generator.js
   
   # New way:
   projection build
   
   # For development with live reload:
   projection dev
   ```

4. **Optional: Extract configuration (recommended):**
   
   If you have config embedded in your `projects.yaml`:
   ```yaml
   config:
     title: "My Projects"
     description: "..."
   
   projects:
     - id: "project-1"
       # ...
   ```
   
   You can extract it to a separate `projection.config.js`:
   ```javascript
   module.exports = {
     title: "My Projects",
     description: "...",
     // ... other config
   };
   ```
   
   Then remove the `config:` section from `projects.yaml`. Both approaches work!

#### What Was Moved to Archive

To preserve the original implementation while transitioning to the new architecture:

- **`archive/generator.js`** - Original generator script (kept for reference)
- **`archive/design.md`** - Original design document

These files are preserved but no longer used. The new implementation is in `src/` and compiles to `lib/`.

#### New Features You Get

- ✨ **CLI Commands** - `init`, `build`, `dev`, `serve`
- 🔥 **Hot Reload** - Automatic rebuild and browser refresh
- 🎨 **Better Logging** - Colored, informative console output
- ✅ **Validation** - Better error messages with suggestions
- 📦 **Bundled Templates** - No need to copy template files
- 🔧 **TypeScript** - Better code quality and maintainability

#### Troubleshooting Migration

**Problem:** "Command not found: projection"

**Solution:**
```bash
# Make sure you've linked the package
cd /path/to/projection
npm link

# Or use npx
npx projection build
```

**Problem:** "Projects file not found"

**Solution:** Make sure you're in the directory containing `projects.yaml`:
```bash
cd /path/to/your/portfolio
projection build
```

**Problem:** Build output looks different

**Solution:** The HTML structure is the same, but if you had custom modifications to the generator, you may need to:
- Use custom styles in `styles/` directory
- Use custom scripts in `scripts/` directory
- Check the new configuration options

#### Need Help?

- Check the [Troubleshooting](#-troubleshooting) section
- Review the [CHANGELOG.md](CHANGELOG.md) for detailed changes
- Open an issue on [GitHub](https://github.com/quasarbright/projection/issues)

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report bugs** - Open an issue with details and reproduction steps
2. **Suggest features** - Share your ideas for improvements
3. **Submit pull requests** - Fix bugs or add features

### Development Setup

```bash
# Clone the repository
git clone https://github.com/quasarbright/projection.git
cd projection

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Test locally
npm link
projection init
projection dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- config.test.ts
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **GitHub Repository:** https://github.com/quasarbright/projection
- **Live Demo:** https://quasarbright.github.io/projection/
- **Author:** [Mike Delmonaco](https://quasarbright.github.io/)
- **Issues:** https://github.com/quasarbright/projection/issues

## 🙏 Acknowledgments

Built with ❤️ using:
- TypeScript
- Chokidar (file watching)
- Browser-sync (live reload)
- js-yaml (YAML parsing)

---

**Need help?** Open an issue on GitHub or check the [troubleshooting section](#-troubleshooting).
