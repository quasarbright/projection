# Changelog

All notable changes to the Projection project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-02

### 🎉 Major Refactor - NPM Package Release

This release represents a complete refactor of Projection from a personal portfolio tool into a reusable npm package that anyone can install and use to create their own project portfolio websites.

### Added

#### Core Features
- **NPM Package Distribution** - Install globally or use via npx
- **TypeScript Implementation** - Complete rewrite in TypeScript for type safety and better maintainability
- **CLI Commands** - Four main commands for different workflows:
  - `projection init` - Initialize a new project with sample files
  - `projection build` - Generate static site from project data
  - `projection dev` - Development server with hot reload
  - `projection serve` - Serve the generated site
- **Configuration System** - Flexible configuration with multiple formats:
  - `projection.config.js` (JavaScript)
  - `projection.config.json` (JSON)
  - Embedded in `projects.yaml`
  - Command-line overrides
- **File Watching** - Automatic rebuild on changes to:
  - Project data files (`projects.yaml`, `projects.json`)
  - Configuration files
  - Custom styles and scripts
- **Live Reload** - Browser automatically refreshes on rebuild during development
- **Colored Console Output** - Beautiful, informative CLI with colored messages
- **Progress Indicators** - Clear feedback during build process
- **Comprehensive Logging** - Logger utility with success, error, warning, and info messages

#### Developer Experience
- **Template System** - Bundled default templates with override support
- **Custom Styles** - Override default CSS by creating a `styles/` directory
- **Custom Scripts** - Override default JavaScript by creating a `scripts/` directory
- **Asset Management** - Automatic copying of styles, scripts, and static assets
- **Path Resolution** - Smart handling of relative, absolute, and URL paths
- **Validation** - Comprehensive project data validation with clear error messages
- **Error Handling** - User-friendly error messages with actionable suggestions

#### Testing
- **Unit Tests** - Comprehensive test coverage for:
  - Configuration loading and validation
  - Project data validation
  - HTML generation
  - Asset management
- **Integration Tests** - End-to-end testing of CLI commands
- **Jest Framework** - Modern testing with TypeScript support

#### Documentation
- **Comprehensive README** - Complete documentation including:
  - Installation instructions
  - Quick start guide
  - CLI command reference
  - Configuration options
  - Project data format specification
  - Customization guide
  - Troubleshooting section
  - Deployment guides
- **Migration Guide** - Instructions for existing users
- **API Documentation** - JSDoc comments throughout codebase
- **Type Definitions** - Full TypeScript type definitions

### Changed

#### Architecture
- **Modular Structure** - Split monolithic generator into focused modules:
  - `ConfigLoader` - Configuration management
  - `Validator` - Project data validation
  - `HTMLBuilder` - HTML generation
  - `AssetCopier` - Asset management
  - `Generator` - Main orchestrator
- **Package Structure** - Organized into logical directories:
  - `src/cli/` - CLI command implementations
  - `src/generator/` - Core generation logic
  - `src/types/` - TypeScript type definitions
  - `src/utils/` - Utility functions
  - `src/templates/` - Bundled templates
- **Build Process** - TypeScript compilation to `lib/` directory
- **Template Location** - Templates now bundled in package at `lib/templates/`

#### Backward Compatibility
- **Existing Projects** - Full backward compatibility maintained
- **Data Format** - Existing `projects.yaml` files work without changes
- **Configuration** - Existing embedded config in YAML still supported
- **Features** - All existing features preserved:
  - Search functionality
  - Tag filtering (ANY/ALL modes)
  - Sorting options
  - Featured projects
  - Dynamic backgrounds
  - Responsive design
  - Dark theme

### Improved

#### Validation
- **Project ID Format** - Enforced URL slug format (lowercase, alphanumeric, hyphens)
- **Date Validation** - Strict ISO date format (YYYY-MM-DD)
- **Required Fields** - Clear validation of required project fields
- **Duplicate Detection** - Prevents duplicate project IDs
- **Error Messages** - Specific, actionable error messages with examples

#### User Experience
- **Initialization** - Quick project setup with `projection init`
- **Development Workflow** - Seamless dev experience with hot reload
- **Build Feedback** - Clear progress messages during build
- **Error Reporting** - Helpful error messages with suggestions
- **Command Options** - Flexible CLI options for different use cases

#### Code Quality
- **Type Safety** - Full TypeScript coverage
- **Error Handling** - Structured error handling with custom error classes
- **Code Organization** - Clear separation of concerns
- **Documentation** - Comprehensive inline documentation
- **Testing** - High test coverage

### Deprecated

- **Direct Script Execution** - Old `node generator.js` approach replaced by CLI commands
- **Nodemon Configuration** - Replaced by built-in file watching with chokidar

### Removed

- **None** - All features maintained for backward compatibility

### Fixed

- **Path Resolution** - Improved handling of relative and absolute paths
- **Asset Copying** - More reliable asset management
- **Configuration Merging** - Better handling of default values
- **Error Messages** - More informative and actionable

### Security

- **Input Validation** - Sanitization of user-provided data
- **Path Validation** - Prevention of directory traversal attacks
- **Dependency Auditing** - Regular security audits of dependencies

### Migration Notes

#### For Existing Users

Your existing setup will continue to work with minimal changes:

1. **Install the package:**
   ```bash
   npm install -g projection
   # or use from source with npm link
   ```

2. **Use new commands:**
   ```bash
   # Instead of: node generator.js
   projection build
   
   # For development:
   projection dev
   ```

3. **Optional: Create config file**
   ```bash
   # Extract config from projects.yaml to projection.config.js
   projection init --force
   ```

#### What Was Moved

- **Original Code** - Moved to `archive/` directory:
  - `archive/generator.js` - Original generator implementation
  - `archive/design.md` - Original design document
- **Templates** - Moved to `src/templates/default/`:
  - Styles, scripts, and assets now bundled in package
  - Can still be overridden by creating local directories

#### Breaking Changes

**None** - Full backward compatibility maintained. Existing `projects.yaml` files and configurations work without modification.

### Technical Details

#### Dependencies

**Production:**
- `js-yaml` - YAML parsing
- `chokidar` - File watching
- `browser-sync` - Live reload
- `http-server` - Static file serving

**Development:**
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions
- `jest` - Testing framework
- `ts-jest` - TypeScript support for Jest

#### Build System

- **Compiler:** TypeScript (tsc)
- **Target:** ES2020
- **Module:** CommonJS
- **Output:** `lib/` directory
- **Source Maps:** Enabled for debugging
- **Declaration Files:** Generated for type support

#### Package Configuration

- **Entry Point:** `lib/index.js`
- **Binary:** `bin/projection.js`
- **Files:** Includes `lib/`, `bin/`, excludes `src/`, `tests/`
- **Engines:** Node.js >= 14.0.0

### Contributors

- Mike Delmonaco (@quasarbright) - Original author and maintainer

### Links

- **Repository:** https://github.com/quasarbright/projection
- **Issues:** https://github.com/quasarbright/projection/issues
- **Documentation:** See README.md

---

## [1.0.0] - 2024-01-15

### Initial Release

- Basic static site generator for project portfolios
- YAML-based project data
- Responsive card-based layout
- Search and filter functionality
- Dark theme
- Dynamic backgrounds
- Featured projects support

