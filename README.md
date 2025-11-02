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

### GitHub Pages

```bash
# Build your site
projection build

# Deploy to gh-pages branch
# Option 1: Using gh-pages package
npm install -g gh-pages
gh-pages -d dist

# Option 2: Manual deployment
git subtree push --prefix dist origin gh-pages
```

**Configure baseUrl for GitHub Pages:**
```javascript
// projection.config.js
module.exports = {
  baseUrl: "https://username.github.io/repository-name/"
};
```

### Netlify

1. Build your site: `projection build`
2. Drag and drop the `dist/` folder to Netlify
3. Or connect your Git repository with build command: `projection build`

### Vercel

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

### Static Hosting

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
