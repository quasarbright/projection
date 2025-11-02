#!/usr/bin/env node

/**
 * Projection CLI Entry Point
 * 
 * This is the executable entry point for the Projection CLI tool.
 * It loads the compiled CLI module and runs it with command-line arguments.
 */

const path = require('path');

// Determine if we're running from source (development) or compiled (production)
const libPath = path.join(__dirname, '..', 'lib', 'cli', 'index.js');
const srcPath = path.join(__dirname, '..', 'src', 'cli', 'index.ts');

let cliModule;

try {
  // Try to load compiled version first (production)
  cliModule = require(libPath);
} catch (error) {
  try {
    // Fall back to TypeScript source with ts-node (development)
    require('ts-node/register');
    cliModule = require(srcPath);
  } catch (tsError) {
    console.error('\n❌ Error: Could not load Projection CLI.');
    console.error('\nIf you are developing, make sure to run: npm run build');
    console.error('If you installed via npm, please reinstall the package.\n');
    process.exit(1);
  }
}

// Get command-line arguments (skip 'node' and script path)
const args = process.argv.slice(2);

// Run the CLI
cliModule.main(args).catch((error) => {
  console.error('\n❌ Unexpected error:', error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});
