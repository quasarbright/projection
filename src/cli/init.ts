import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { Logger } from '../utils/logger';
import { GitHelper } from '../utils/git-helper';
import { DeploymentConfigLoader } from '../utils/deployment-config';

interface InitOptions {
  force?: boolean;
  format?: 'yaml' | 'json';
  minimal?: boolean;
}

/**
 * Initialize a new Projection project in the current directory
 */
export async function init(options: InitOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const format = options.format || 'yaml';
  const projectsFileName = format === 'yaml' ? 'projects.yaml' : 'projects.json';
  const configFileName = 'projection.config.js';

  const projectsFilePath = path.join(cwd, projectsFileName);
  const configFilePath = path.join(cwd, configFileName);

  // Check for existing files
  const projectsExists = fs.existsSync(projectsFilePath);
  const configExists = fs.existsSync(configFilePath);

  if ((projectsExists || configExists) && !options.force) {
    const existingFiles = [];
    if (projectsExists) existingFiles.push(projectsFileName);
    if (configExists) existingFiles.push(configFileName);

    Logger.newline();
    Logger.warn('The following files already exist:');
    Logger.list(existingFiles);
    Logger.newline();
    Logger.dim('Use --force to overwrite existing files.');
    Logger.newline();
    
    const shouldContinue = await promptUser('Do you want to overwrite these files? (y/N): ');
    if (!shouldContinue.toLowerCase().startsWith('y')) {
      Logger.newline();
      Logger.error('Initialization cancelled.');
      Logger.newline();
      return;
    }
  }

  // Get template directory path
  const templateDir = getTemplateDirectory();
  
  // Detect Git repository and extract deployment info
  const gitInfo = await detectGitRepository(cwd);

  // Copy projects file
  await copyProjectsTemplate(templateDir, projectsFilePath, format, options.minimal);

  // Copy config file with deployment support
  await copyConfigTemplate(templateDir, configFilePath, gitInfo);

  // Display success message with deployment instructions
  displaySuccessMessage(projectsFileName, configFileName, gitInfo);
}

/**
 * Git repository information for deployment
 */
interface GitRepositoryInfo {
  isGitRepo: boolean;
  hasRemote: boolean;
  repositoryUrl: string | null;
  baseUrl: string | null;
  repoName: string | null;
}

/**
 * Detect Git repository and extract deployment information
 */
async function detectGitRepository(cwd: string): Promise<GitRepositoryInfo> {
  const result: GitRepositoryInfo = {
    isGitRepo: false,
    hasRemote: false,
    repositoryUrl: null,
    baseUrl: null,
    repoName: null,
  };

  // Check if Git is installed
  const gitInstalled = await GitHelper.isGitInstalled();
  if (!gitInstalled) {
    return result;
  }

  // Validate repository
  try {
    const validation = await GitHelper.validateRepository(cwd);
    result.isGitRepo = validation.isGitRepo;
    result.hasRemote = validation.hasRemote;

    if (validation.hasRemote && validation.remoteUrl) {
      result.repositoryUrl = validation.remoteUrl;
      
      // Extract repository name and generate baseUrl
      result.repoName = DeploymentConfigLoader.extractRepoName(validation.remoteUrl);
      result.baseUrl = `/${result.repoName}/`;
    }
  } catch (error) {
    // Silently fail - Git detection is optional during init
  }

  return result;
}

/**
 * Get the template directory path
 */
function getTemplateDirectory(): string {
  // In development (running from src), templates are in src/templates/init
  // In production (running from lib), templates are in lib/templates/init
  const devPath = path.join(__dirname, '..', 'templates', 'init');
  const prodPath = path.join(__dirname, '..', '..', 'lib', 'templates', 'init');
  
  if (fs.existsSync(devPath)) {
    return devPath;
  } else if (fs.existsSync(prodPath)) {
    return prodPath;
  } else {
    // Try relative to the compiled location
    const compiledPath = path.join(__dirname, '..', 'templates', 'init');
    if (fs.existsSync(compiledPath)) {
      return compiledPath;
    }
    throw new Error('Template directory not found. Please ensure the package is installed correctly.');
  }
}

/**
 * Copy the projects template file
 */
async function copyProjectsTemplate(
  templateDir: string,
  targetPath: string,
  format: 'yaml' | 'json',
  minimal?: boolean
): Promise<void> {
  const templatePath = path.join(templateDir, 'projects.yaml.template');
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  let content = fs.readFileSync(templatePath, 'utf-8');

  if (minimal) {
    // Create minimal version with only one project
    content = createMinimalProjectsContent(format);
  } else if (format === 'json') {
    // Convert YAML template to JSON
    content = convertYamlTemplateToJson(content);
  }

  fs.writeFileSync(targetPath, content, 'utf-8');
  Logger.success(`Created ${path.basename(targetPath)}`);
}

/**
 * Copy the config template file
 */
async function copyConfigTemplate(
  templateDir: string, 
  targetPath: string, 
  gitInfo: GitRepositoryInfo
): Promise<void> {
  const templatePath = path.join(templateDir, 'projection.config.js.template');
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  let content = fs.readFileSync(templatePath, 'utf-8');

  // If Git repository with remote is detected, update baseUrl
  if (gitInfo.hasRemote && gitInfo.baseUrl) {
    content = content.replace(
      /baseUrl:\s*"\.\/"/,
      `baseUrl: "${gitInfo.baseUrl}"`
    );
  }

  fs.writeFileSync(targetPath, content, 'utf-8');
  Logger.success(`Created ${path.basename(targetPath)}`);
}

/**
 * Create minimal projects content
 */
function createMinimalProjectsContent(format: 'yaml' | 'json'): string {
  if (format === 'json') {
    return JSON.stringify({
      config: {
        title: "My Projects",
        description: "A showcase of my coding projects",
        baseUrl: "./"
      },
      projects: [
        {
          id: "my-first-project",
          title: "My First Project",
          description: "Replace this with your own project!",
          creationDate: new Date().toISOString().split('T')[0],
          tags: ["example"],
          pageLink: "https://example.com"
        }
      ]
    }, null, 2);
  } else {
    const today = new Date().toISOString().split('T')[0];
    return `# Projection Project Data

config:
  title: "My Projects"
  description: "A showcase of my coding projects"
  baseUrl: "./"

projects:
  - id: "my-first-project"
    title: "My First Project"
    description: "Replace this with your own project!"
    creationDate: "${today}"
    tags:
      - "example"
    pageLink: "https://example.com"
`;
  }
}

/**
 * Convert YAML template to JSON format (basic conversion)
 */
function convertYamlTemplateToJson(yamlContent: string): string {
  // For now, we'll use a simple approach
  // In a real implementation, we'd parse the YAML and convert to JSON
  // But since this is a template with comments, we'll create a clean JSON version
  return JSON.stringify({
    config: {
      title: "My Projects",
      description: "A showcase of my coding projects",
      baseUrl: "./",
      itemsPerPage: 20,
      dynamicBackgrounds: []
    },
    projects: [
      {
        id: "example-project",
        title: "Example Project",
        description: "This is an example project demonstrating all available fields. Replace this with your own projects!",
        creationDate: "2024-01-15",
        tags: ["web", "javascript", "example"],
        pageLink: "https://example.com/project",
        sourceLink: "https://github.com/username/example-project",
        thumbnailLink: "./images/example-thumbnail.png",
        featured: true
      },
      {
        id: "minimal-project",
        title: "Minimal Project",
        description: "A minimal project with only required fields.",
        creationDate: "2024-02-20",
        tags: ["example"],
        pageLink: "https://example.com/minimal"
      }
    ]
  }, null, 2);
}

/**
 * Prompt user for input
 */
function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Display success message with next steps
 */
function displaySuccessMessage(
  projectsFile: string, 
  configFile: string, 
  gitInfo: GitRepositoryInfo
): void {
  Logger.newline();
  Logger.icon('🎉', 'Successfully initialized Projection project!', '\x1b[32m');
  Logger.newline();
  Logger.info('Created files:');
  Logger.list([projectsFile, configFile]);
  Logger.newline();

  // Display Git repository information if detected
  if (gitInfo.isGitRepo && gitInfo.hasRemote) {
    Logger.info('Git repository detected:');
    Logger.list([
      `Repository: ${gitInfo.repositoryUrl}`,
      `Base URL configured: ${gitInfo.baseUrl}`
    ]);
    Logger.newline();
  } else if (gitInfo.isGitRepo && !gitInfo.hasRemote) {
    Logger.warn('Git repository detected but no remote configured.');
    Logger.dim('Add a remote to enable GitHub Pages deployment:');
    Logger.dim('  git remote add origin <repository-url>');
    Logger.newline();
  }

  Logger.info('Next steps:');
  const steps = [
    `Edit ${projectsFile} to add your projects`,
    `Customize ${configFile} if needed`,
    `Run 'projection build' to generate your site`,
    `Run 'projection dev' to start development server`
  ];

  // Add deployment step if Git is configured
  if (gitInfo.isGitRepo && gitInfo.hasRemote) {
    steps.push(`Run 'projection deploy' to deploy to GitHub Pages`);
  }

  Logger.numberedList(steps);
  Logger.newline();
  Logger.dim('📚 Documentation: https://github.com/quasarbright/projection');
  Logger.newline();
  Logger.icon('🚀', 'Happy building!', '\x1b[36m');
  Logger.newline();
}
