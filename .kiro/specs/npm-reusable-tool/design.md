# Design Document: Projection NPM Package

## Overview

This design transforms the existing static site generator into a reusable npm package called "projection" that developers can install globally or use via npx. The package will bundle all template assets (CSS, JavaScript, HTML generation logic) while allowing users to provide their own project data and optional customizations in their own directories.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User's Project                        │
│  ┌────────────────┐  ┌──────────────────┐              │
│  │ projects.yaml  │  │ projection.config│              │
│  └────────────────┘  └──────────────────┘              │
│  ┌────────────────┐  ┌──────────────────┐              │
│  │ styles/ (opt)  │  │ scripts/ (opt)   │              │
│  └────────────────┘  └──────────────────┘              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Projection CLI (npm package)                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Commands: init, build, dev, serve                 │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Bundled Assets: CSS, JS, Templates               │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Generator Engine                                  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Generated Site                        │
│                      dist/                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │  index.html, styles/, scripts/, assets/           │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Package Structure

```
projection/                      # npm package root
├── bin/
│   └── projection.js           # CLI entry point (#!/usr/bin/env node)
├── src/                        # TypeScript source files
│   ├── cli/
│   │   ├── init.ts            # Init command implementation
│   │   ├── build.ts           # Build command implementation
│   │   ├── dev.ts             # Dev server command
│   │   ├── serve.ts           # Serve command implementation
│   │   └── index.ts           # CLI orchestrator
│   ├── generator/
│   │   ├── index.ts           # Main generator logic (refactored from generator.js)
│   │   ├── config.ts          # Configuration loading and validation
│   │   ├── validator.ts       # Project data validation
│   │   ├── html-builder.ts    # HTML generation functions
│   │   └── asset-copier.ts    # Asset management
│   ├── types/
│   │   ├── project.ts         # Project type definitions
│   │   └── config.ts          # Config type definitions
│   └── utils/
│       ├── errors.ts          # Custom error classes
│       └── logger.ts          # Logging utilities
├── lib/                        # Compiled JavaScript output
│   └── templates/
│       ├── default/
│       │   ├── styles/        # Bundled CSS files
│       │   │   ├── main.css
│       │   │   ├── cards.css
│       │   │   └── modal.css
│       │   ├── scripts/       # Bundled JS files
│       │   │   ├── search.js
│       │   │   ├── filter.js
│       │   │   ├── modal.js
│       │   │   └── dynamic-background.js
│       │   └── assets/
│       │       └── favicon.ico
│       └── init/
│           ├── projects.yaml.template    # Sample projects file
│           └── projection.config.js.template
├── tests/                      # Jest test files
│   ├── unit/
│   │   ├── config.test.ts
│   │   ├── validator.test.ts
│   │   └── html-builder.test.ts
│   └── integration/
│       ├── cli.test.ts
│       └── generator.test.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── README.md
└── LICENSE
```

## Components and Interfaces

### 1. CLI Interface

#### Command Structure

**projection init [options]**
- Creates starter files in current directory
- Options:
  - `--force`: Overwrite existing files
  - `--format <yaml|json>`: Choose data format (default: yaml)
  - `--minimal`: Create minimal example instead of full sample

**projection build [options]**
- Generates static site from project data
- Options:
  - `--config <path>`: Custom config file path
  - `--output <path>`: Custom output directory (default: dist)
  - `--clean`: Clean output directory before build

**projection dev [options]**
- Starts development server with hot reload
- Options:
  - `--port <number>`: Server port (default: 8080)
  - `--config <path>`: Custom config file path
  - `--no-open`: Don't open browser automatically

**projection serve [options]**
- Serves the generated dist directory
- Options:
  - `--port <number>`: Server port (default: 8080)
  - `--open`: Open browser automatically

#### CLI Module Interface

```javascript
// lib/cli/index.js
class CLI {
  constructor() {
    this.commands = {
      init: require('./init'),
      build: require('./build'),
      dev: require('./dev'),
      serve: require('./serve')
    };
  }
  
  async run(args) {
    // Parse command and options
    // Execute appropriate command
  }
}
```

### 2. Configuration System

#### Configuration File Formats

**Option 1: Standalone config file (projection.config.js)**
```javascript
module.exports = {
  title: "My Projects",
  description: "A showcase of my coding projects",
  baseUrl: "https://username.github.io/",
  itemsPerPage: 20,
  dynamicBackgrounds: [
    "https://example.com/background1",
    "https://example.com/background2"
  ],
  // Optional: override default templates
  customStyles: "./my-styles",
  customScripts: "./my-scripts"
};
```

**Option 2: Embedded in projects.yaml (backward compatible)**
```yaml
config:
  title: "My Projects"
  description: "A showcase of my coding projects"
  baseUrl: "https://username.github.io/"
  
projects:
  - id: "project-1"
    # ...
```

#### Configuration Loading Priority
1. Command-line `--config` option
2. `projection.config.js` in current directory
3. `projection.config.json` in current directory
4. `config` section in projects.yaml/projects.json
5. Default configuration

#### Config Module Interface

```javascript
// lib/generator/config.js
class ConfigLoader {
  async load(cwd, options = {}) {
    // Load config from various sources
    // Merge with defaults
    // Validate configuration
    // Return normalized config object
  }
  
  validate(config) {
    // Validate required fields
    // Check types
    // Return validation errors or null
  }
  
  getDefaults() {
    return {
      title: "My Projects",
      description: "A showcase of my coding projects",
      baseUrl: "./",
      itemsPerPage: 20,
      dynamicBackgrounds: [],
      defaultScreenshot: null
    };
  }
}
```

### 3. Generator Engine

#### Refactored Generator Architecture

The current `generator.js` will be split into modular components:

**lib/generator/index.js** - Main orchestrator
```javascript
class Generator {
  constructor(config, cwd) {
    this.config = config;
    this.cwd = cwd;
    this.validator = new Validator();
    this.htmlBuilder = new HTMLBuilder(config);
  }
  
  async generate() {
    // 1. Load project data
    const projectsData = await this.loadProjectData();
    
    // 2. Validate projects
    this.validator.validate(projectsData.projects);
    
    // 3. Generate HTML
    const html = this.htmlBuilder.generateHTML(projectsData);
    
    // 4. Write output
    await this.writeOutput(html);
    
    // 5. Copy assets
    await this.copyAssets();
  }
  
  async loadProjectData() {
    // Find and read projects.yaml/json from cwd
  }
  
  async copyAssets() {
    // Copy bundled templates OR user's custom templates
  }
}
```

**lib/generator/html-builder.js** - HTML generation
```javascript
class HTMLBuilder {
  constructor(config) {
    this.config = config;
  }
  
  generateHTML(projectsData) {
    // Same logic as current generateHTML function
    // But uses config from constructor
  }
  
  generateProjectCard(project) {
    // Same as current function
  }
  
  generateTagFilter(allTags) {
    // Same as current function
  }
}
```

**lib/generator/validator.js** - Validation logic
```javascript
class Validator {
  validate(projects) {
    // Same validation logic as current validateProjects
    // But returns structured errors instead of exiting
  }
}
```

### 4. Asset Management

#### Template Resolution Strategy

1. **Check for user customizations** in current working directory:
   - `./styles/` directory → use custom styles
   - `./scripts/` directory → use custom scripts
   - `./assets/` directory → use custom assets

2. **Fall back to bundled templates** from package:
   - `<package>/lib/templates/default/styles/`
   - `<package>/lib/templates/default/scripts/`
   - `<package>/lib/templates/default/assets/`

3. **Copy strategy**:
   - Always copy to `dist/styles/`, `dist/scripts/`, `dist/assets/`
   - User files take precedence over bundled files
   - Merge: if user provides `styles/custom.css`, copy both bundled and custom

#### Asset Copier Interface

```javascript
// lib/generator/asset-copier.js
class AssetCopier {
  constructor(cwd, outputDir, packageRoot) {
    this.cwd = cwd;
    this.outputDir = outputDir;
    this.packageRoot = packageRoot;
  }
  
  async copyAssets() {
    // Copy styles (user custom or bundled)
    await this.copyStyles();
    
    // Copy scripts (user custom or bundled)
    await this.copyScripts();
    
    // Copy assets (favicon, etc.)
    await this.copyStaticAssets();
  }
  
  async copyStyles() {
    const userStyles = path.join(this.cwd, 'styles');
    const bundledStyles = path.join(this.packageRoot, 'lib/templates/default/styles');
    
    if (fs.existsSync(userStyles)) {
      // Copy user styles
    } else {
      // Copy bundled styles
    }
  }
}
```

### 5. Development Server

#### Dev Server Features

- Watch for changes to:
  - `projects.yaml` / `projects.json`
  - `projection.config.js` / `projection.config.json`
  - Custom `styles/` directory
  - Custom `scripts/` directory

- On change:
  - Rebuild site
  - Trigger browser refresh (via browser-sync or similar)

#### Dev Server Interface

```javascript
// lib/cli/dev.js
class DevServer {
  constructor(config, cwd) {
    this.config = config;
    this.cwd = cwd;
    this.generator = new Generator(config, cwd);
  }
  
  async start(options = {}) {
    const port = options.port || 8080;
    
    // Initial build
    await this.generator.generate();
    
    // Start file watcher
    this.startWatcher();
    
    // Start HTTP server with live reload
    this.startServer(port);
    
    // Open browser if requested
    if (options.open !== false) {
      this.openBrowser(port);
    }
  }
  
  startWatcher() {
    // Use chokidar or nodemon to watch files
    // On change, rebuild and notify browser
  }
  
  startServer(port) {
    // Use browser-sync or http-server
  }
}
```

## Data Models

### Project Data Model

Maintain backward compatibility with existing schema, with added validation for ID format:

```typescript
interface Project {
  id: string;                    // Required: unique identifier (must be valid URL slug)
  title: string;                 // Required: display name
  description: string;           // Required: project description
  creationDate: string;          // Required: ISO date string
  tags: string[];               // Required: categorization tags
  pageLink: string;             // Required: primary link
  sourceLink?: string;          // Optional: source code link
  thumbnailLink?: string;       // Optional: screenshot path
  featured?: boolean;           // Optional: highlight flag
}

interface ProjectsData {
  config?: Config;              // Optional: embedded config
  projects: Project[];          // Required: array of projects
}

// Validation rules for project ID:
// - Must be lowercase
// - Can contain letters, numbers, and hyphens
// - Cannot start or end with hyphen
// - Regex: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
```

### Configuration Model

```typescript
interface Config {
  title: string;                      // Site title
  description: string;                // Site description
  baseUrl: string;                    // Base URL for path resolution
  itemsPerPage?: number;              // Pagination (future use)
  dynamicBackgrounds?: string[];      // Background iframe URLs
  defaultScreenshot?: string;         // Fallback thumbnail
  customStyles?: string;              // Path to custom styles dir
  customScripts?: string;             // Path to custom scripts dir
  output?: string;                    // Output directory (default: dist)
}
```

## Error Handling

### Error Categories

1. **Configuration Errors**
   - Missing required config fields
   - Invalid config values
   - Config file parse errors

2. **Data Validation Errors**
   - Missing required project fields
   - Invalid date formats
   - Duplicate project IDs

3. **File System Errors**
   - Projects file not found
   - Cannot write to output directory
   - Asset files not found

4. **Runtime Errors**
   - Server port already in use
   - Build process failures

### Error Handling Strategy

```javascript
class ProjectionError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'ProjectionError';
  }
}

// Usage
throw new ProjectionError(
  'Invalid project data',
  'VALIDATION_ERROR',
  { project: 'project-1', field: 'creationDate' }
);
```

### User-Friendly Error Messages

```
❌ Error: Invalid project data

Project "awesome-project" is missing required field: creationDate

Expected format: "YYYY-MM-DD"
Example: "2024-01-15"

Fix this in your projects.yaml file and try again.
```

## Testing Strategy

### Unit Tests

1. **Configuration Loading**
   - Test config file discovery
   - Test config merging and defaults
   - Test config validation

2. **Project Data Validation**
   - Test required field validation
   - Test date format validation
   - Test duplicate ID detection

3. **HTML Generation**
   - Test project card generation
   - Test tag filter generation
   - Test path resolution

4. **Asset Management**
   - Test template resolution (user vs bundled)
   - Test asset copying
   - Test file watching

### Integration Tests

1. **CLI Commands**
   - Test `init` command creates correct files
   - Test `build` command generates site
   - Test `dev` command starts server

2. **End-to-End**
   - Create temp directory
   - Run `projection init`
   - Modify projects.yaml
   - Run `projection build`
   - Verify generated HTML

### Test Framework

- Use Jest for all tests (unit and integration)
- Use ts-jest for TypeScript support
- Use temporary directories for integration tests
- Mock file system operations where appropriate
- Use @types/jest for TypeScript type definitions

## Migration Path

### For Existing Users (Backward Compatibility)

The existing setup should work with minimal changes:

1. Install projection globally: `npm install -g projection`
2. Navigate to existing project directory
3. Run `projection build` (reads existing projects.yaml)
4. Generated site is identical to current output

### For New Users

1. Create new directory: `mkdir my-portfolio && cd my-portfolio`
2. Initialize: `npx projection init`
3. Edit `projects.yaml` with your projects
4. Build: `npx projection build`
5. Preview: `npx projection serve`

## Performance Considerations

### Build Performance

- **Incremental builds**: Only regenerate changed parts (future enhancement)
- **Parallel processing**: Process multiple projects concurrently
- **Caching**: Cache parsed YAML/JSON between dev server rebuilds

### Runtime Performance

- **Asset bundling**: Minify CSS/JS in production builds
- **Image optimization**: Optionally optimize thumbnails
- **Lazy loading**: Frontend already implements lazy image loading

## Security Considerations

### Input Validation

- Sanitize user-provided HTML in descriptions
- Validate URLs to prevent XSS
- Escape special characters in generated HTML

### File System Access

- Restrict file operations to current working directory
- Validate paths to prevent directory traversal
- Use safe file writing (atomic writes)

### Dependencies

- Minimize external dependencies
- Regularly audit dependencies for vulnerabilities
- Pin dependency versions

## Accessibility

Maintain existing accessibility features:

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

## Documentation Requirements

### README.md

- Installation instructions (global and npx)
- Quick start guide
- Command reference
- Configuration options
- Examples

### API Documentation

- JSDoc comments for all public APIs
- Type definitions (TypeScript .d.ts files)
- Usage examples

### Migration Guide

- Guide for existing users
- Breaking changes (if any)
- Upgrade instructions

## TypeScript Configuration

### Build Process

- Use TypeScript compiler (tsc) to compile src/ to lib/
- Target ES2020 for modern Node.js compatibility
- Generate declaration files (.d.ts) for type support
- Source maps for debugging

### tsconfig.json Structure

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./lib",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "lib", "tests"]
}
```

### Type Safety Benefits

- Compile-time error detection
- Better IDE autocomplete and refactoring
- Self-documenting code through types
- Easier maintenance and collaboration

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Themes**: Multiple built-in themes
2. **Plugins**: Plugin system for extensibility
3. **Templates**: Alternative layout templates
4. **Analytics**: Built-in analytics integration
5. **SEO**: Enhanced SEO features (sitemap, meta tags)
6. **i18n**: Internationalization support

### Potential Improvements

- GraphQL API for project data
- CMS integration (Contentful, Sanity)
- Image optimization pipeline
- Progressive Web App features
