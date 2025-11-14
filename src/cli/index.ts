import { init } from './init';
import { build } from './build';
import { dev } from './dev';
import { serve } from './serve';
import { admin } from './admin';
import { deploy } from './deploy';

/**
 * CLI class that orchestrates command routing and argument parsing
 */
export class CLI {
  private version: string;
  private commands: Map<string, (options?: any) => Promise<void>>;

  constructor(version: string = '1.0.0') {
    this.version = version;
    this.commands = new Map<string, (options?: any) => Promise<void>>([
      ['init', init as (options?: any) => Promise<void>],
      ['build', build as (options?: any) => Promise<void>],
      ['dev', dev as (options?: any) => Promise<void>],
      ['serve', serve as (options?: any) => Promise<void>],
      ['admin', admin as (options?: any) => Promise<void>],
      ['deploy', deploy as (options?: any) => Promise<void>]
    ]);
  }

  /**
   * Parse command-line arguments and execute the appropriate command
   */
  async run(args: string[]): Promise<void> {
    // Remove node and script path from args
    const [command, ...rest] = args;

    // Handle special flags
    if (!command || command === '--help' || command === '-h') {
      this.showHelp();
      return;
    }

    if (command === '--version' || command === '-v') {
      this.showVersion();
      return;
    }

    // Get command handler
    const handler = this.commands.get(command);

    if (!handler) {
      console.error(`\n❌ Unknown command: ${command}\n`);
      console.log(`Run 'projection --help' for usage information.\n`);
      process.exit(1);
    }

    // Parse options for the command
    const options = this.parseOptions(rest);

    // Execute command
    try {
      await handler(options);
    } catch (error) {
      console.error(`\n❌ Command failed: ${(error as Error).message}\n`);
      process.exit(1);
    }
  }

  /**
   * Parse command-line options into an object
   */
  private parseOptions(args: string[]): Record<string, any> {
    const options: Record<string, any> = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      // Handle flags (--flag or -f)
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        
        // Check if next arg is a value or another flag
        const nextArg = args[i + 1];
        if (nextArg && !nextArg.startsWith('-')) {
          // It's a key-value pair
          options[this.camelCase(key)] = nextArg;
          i++; // Skip next arg since we consumed it
        } else {
          // It's a boolean flag
          options[this.camelCase(key)] = true;
        }
      } else if (arg.startsWith('-') && arg.length === 2) {
        // Short flag
        const key = arg.slice(1);
        const nextArg = args[i + 1];
        
        if (nextArg && !nextArg.startsWith('-')) {
          options[key] = nextArg;
          i++;
        } else {
          options[key] = true;
        }
      }
    }
    
    return options;
  }

  /**
   * Convert kebab-case to camelCase
   */
  private camelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Display help text
   */
  private showHelp(): void {
    console.log(`
Projection - Static Site Generator for Project Portfolios

USAGE:
  projection <command> [options]

COMMANDS:
  init              Initialize a new Projection project
  build             Generate the static site from project data
  dev               Start development server with live reload
  serve             Serve the generated site with a local HTTP server
  admin             Start admin interface for managing projects
  deploy            Deploy the portfolio site to GitHub Pages

OPTIONS:
  -h, --help        Show this help message
  -v, --version     Show version number

COMMAND OPTIONS:

  projection init [options]
    --force         Overwrite existing files without prompting
    --format <fmt>  Choose data format: yaml or json (default: yaml)
    --minimal       Create minimal example instead of full sample

  projection build [options]
    --config <path> Path to custom config file
    --output <path> Custom output directory (default: dist)
    --clean         Clean output directory before build

  projection dev [options]
    --config <path> Path to custom config file
    --output <path> Custom output directory (default: dist)
    --port <number> Server port (default: 8080)
    --no-open       Don't open browser automatically

  projection serve [options]
    --port <number> Server port (default: 8080)
    --open          Open browser automatically
    --dir <path>    Directory to serve (default: dist)

  projection admin [options]
    --port <number> Server port (default: 3000)
    --no-open       Don't open browser automatically
    --projects <path> Path to projects file
    --config <path> Path to config file

  projection deploy [options]
    -b, --branch <branch>   Target branch (default: gh-pages)
    -m, --message <message> Custom commit message
    -r, --remote <remote>   Git remote (default: origin)
    -d, --dir <dir>         Build directory (default: dist)
    --no-build              Skip build step
    --dry-run               Simulate deployment without pushing
    --force                 Force push to remote
    --help                  Show detailed deploy help

EXAMPLES:
  # Initialize a new project
  projection init

  # Build with custom config
  projection build --config my-config.json

  # Start dev server on port 3000
  projection dev --port 3000

  # Serve the generated site
  projection serve --open

  # Start admin interface
  projection admin

  # Start admin on custom port
  projection admin --port 3001

  # Deploy to GitHub Pages
  projection deploy

  # Show detailed deployment help
  projection deploy --help

  # Deploy with custom branch and message
  projection deploy --branch main --message "Update site"

  # Deploy without building (use existing dist)
  projection deploy --no-build

  # Simulate deployment (dry run)
  projection deploy --dry-run

DOCUMENTATION:
  https://github.com/quasarbright/projection

`);
  }

  /**
   * Display version information
   */
  private showVersion(): void {
    console.log(`projection v${this.version}`);
  }
}

/**
 * Main entry point for the CLI
 */
export async function main(args: string[]): Promise<void> {
  // Get version from package.json
  let version = '1.0.0';
  try {
    const packageJson = require('../../package.json');
    version = packageJson.version;
  } catch (error) {
    // Use default version if package.json not found
  }

  const cli = new CLI(version);
  await cli.run(args);
}
