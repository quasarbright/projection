# Implementation Plan

- [x] 1. Set up TypeScript project structure and configuration
  - Create package.json with TypeScript dependencies (typescript, @types/node, ts-node)
  - Create tsconfig.json with ES2020 target and strict mode
  - Set up build scripts (tsc compilation)
  - Create src/ directory structure (cli/, generator/, types/, utils/)
  - Create tests/ directory structure with Jest configuration
  - Add jest.config.js with ts-jest preset
  - Move existing generator.js to src/generator/legacy.js as reference (will be refactored)
  - Create .gitignore to exclude lib/ (compiled output) and node_modules/
  - _Requirements: 1.2, 1.4_

- [x] 1.1 Archive and clean up old code structure
  - Create archive/ directory to preserve original implementation
  - Move generator.js to archive/generator.js
  - Move design.md to archive/design.md (original design doc)
  - Keep styles/, scripts/, and assets/ directories (will be moved to lib/templates/default/ in task 8)
  - Keep projects.yaml as example data
  - Remove nodemon.json (will be replaced by chokidar in dev command)
  - Update .gitignore to exclude archive/ from npm package
  - _Requirements: 10.1, 10.2_

- [x] 2. Define TypeScript types and interfaces
  - Create src/types/project.ts with Project and ProjectsData interfaces
  - Create src/types/config.ts with Config interface
  - Add URL slug validation regex pattern for project IDs
  - Create src/utils/errors.ts with ProjectionError class
  - _Requirements: 4.2, 4.3, 10.1_

- [x] 3. Implement configuration loading system
  - Create src/generator/config.ts with ConfigLoader class
  - Implement config file discovery (projection.config.js, projection.config.json, embedded in YAML)
  - Implement config merging with defaults
  - Implement config validation with clear error messages
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3.1 Write unit tests for configuration loading
  - Test config file discovery priority
  - Test config merging and defaults
  - Test config validation errors
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Implement project data validation
  - Create src/generator/validator.ts with Validator class
  - Implement required field validation (id, title, pageLink, creationDate)
  - Implement project ID format validation (URL slug pattern)
  - Implement date format validation
  - Implement duplicate ID detection
  - Return structured validation errors instead of process.exit
  - _Requirements: 4.2, 4.3_

- [x] 4.1 Write unit tests for project validation
  - Test required field validation
  - Test project ID slug format validation
  - Test date format validation
  - Test duplicate ID detection
  - _Requirements: 4.2, 4.3_

- [x] 5. Refactor HTML generation to TypeScript
  - Create src/generator/html-builder.ts with HTMLBuilder class
  - Port generateHTML function from generator.js
  - Port generateProjectCard function
  - Port generateTagFilter function
  - Port generateModal function
  - Maintain backward compatibility with existing output
  - _Requirements: 6.2, 6.3, 10.3, 10.4_

- [x] 5.1 Write unit tests for HTML generation
  - Test project card HTML generation
  - Test tag filter generation
  - Test path resolution (relative, absolute, URLs)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.2_

- [x] 6. Implement asset management system
  - Create src/generator/asset-copier.ts with AssetCopier class
  - Implement template resolution (user custom vs bundled)
  - Implement asset copying for styles, scripts, and static assets
  - Support user customization by checking for local styles/ and scripts/ directories
  - Copy bundled templates from lib/templates/default/ as fallback (lib/ is the compiled output)
  - _Requirements: 1.2, 5.1, 5.2, 5.3, 7.1, 7.2, 7.3_

- [x] 7. Create main generator orchestrator
  - Create src/generator/index.ts with Generator class
  - Implement generate() method that orchestrates the build process
  - Implement loadProjectData() to find and parse projects.yaml/json
  - Integrate ConfigLoader, Validator, HTMLBuilder, and AssetCopier
  - Implement writeOutput() to write generated HTML
  - Add progress logging and error handling
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8. Bundle default template assets
  - Create src/templates/default/ directory structure
  - Move existing styles/ directory to src/templates/default/styles/
  - Move existing scripts/ directory to src/templates/default/scripts/
  - Move existing assets/ directory to src/templates/default/assets/
  - Remove now-empty original directories from project root
  - Update package.json files field to include lib/templates/ (compiled output)
  - _Requirements: 1.2, 7.2, 7.3_

- [x] 9. Create init command templates
  - Create src/templates/init/ directory
  - Create projects.yaml.template with sample project data
  - Create projection.config.js.template with example configuration
  - Include helpful comments in templates
  - _Requirements: 2.1, 2.2, 9.2_

- [x] 10. Implement CLI init command
  - Create src/cli/init.ts with init command implementation
  - Check for existing files and prompt for confirmation if --force not provided
  - Copy projects.yaml.template to current directory
  - Copy projection.config.js.template to current directory
  - Support --format option for yaml/json choice
  - Support --minimal option for minimal example
  - Display success messages with next steps
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 10.1 Write integration tests for init command
  - Test file creation in empty directory
  - Test --force flag behavior
  - Test --format option
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 11. Implement CLI build command
  - Create src/cli/build.ts with build command implementation
  - Parse command-line options (--config, --output, --clean)
  - Load configuration using ConfigLoader
  - Instantiate and run Generator
  - Handle errors with user-friendly messages
  - Display build success message with output location
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 11.1 Write integration tests for build command
  - Test successful build with sample data
  - Test build with custom config path
  - Test build with custom output directory
  - Test error handling for invalid data
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 12. Implement CLI serve command
  - Create src/cli/serve.ts with serve command implementation
  - Use http-server or similar to serve dist/ directory
  - Support --port option (default 8080)
  - Support --open option to launch browser
  - Display server URL in console
  - _Requirements: 8.4_

- [x] 13. Implement CLI dev command with file watching
  - Create src/cli/dev.ts with dev command implementation
  - Perform initial build using Generator
  - Set up file watcher using chokidar for projects.yaml, config files, custom styles/, scripts/
  - On file change, rebuild site automatically
  - Integrate browser-sync for live reload
  - Support --port and --no-open options
  - Display dev server URL and watching status
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 14. Create CLI orchestrator and entry point
  - Create src/cli/index.ts with CLI class
  - Parse command-line arguments (command and options)
  - Route to appropriate command handler (init, build, dev, serve)
  - Implement help text and version display
  - Handle unknown commands gracefully
  - Create bin/projection.js as executable entry point
  - _Requirements: 1.1_

- [ ] 15. Set up npm package configuration
  - Update package.json with correct name, version, description
  - Add bin field pointing to bin/projection.js
  - Add files field to include lib/, bin/, README.md, LICENSE (exclude archive/, tests/, src/)
  - Add keywords for npm discoverability
  - Set up prepublishOnly script to run TypeScript build
  - Add engines field for Node.js version requirement
  - Configure main and types fields for package entry points
  - Remove old scripts (watch, rebuild) that are no longer needed
  - Keep dev dependencies (browser-sync, concurrently) for dev command
  - _Requirements: 1.1, 1.3, 1.4_

- [ ] 16. Create comprehensive README documentation
  - Write installation instructions (npm install -g, npx usage)
  - Write quick start guide with init, build, dev workflow
  - Document all CLI commands and options
  - Document configuration file format and all options
  - Document project data format with all fields
  - Provide examples of common use cases
  - Add troubleshooting section
  - Include link to GitHub repository
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 17. Test backward compatibility with existing setup
  - Use the existing projects.yaml in project root as test data
  - Run projection build in project root directory
  - Verify generated HTML matches output from archive/generator.js
  - Test all existing features (search, filter, sort, dynamic backgrounds)
  - Verify asset paths resolve correctly
  - Compare dist/index.html structure with previous version
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 18. Final cleanup and documentation
  - Add logging and user feedback utilities (src/utils/logger.ts)
  - Add progress messages during build
  - Add colored output for success/error/warning messages
  - Ensure error messages are clear and actionable
  - Update README with migration guide for existing users
  - Document what was moved to archive/ and why
  - Add CHANGELOG.md documenting the refactor
  - _Requirements: 2.4, 6.4, 9.1_


