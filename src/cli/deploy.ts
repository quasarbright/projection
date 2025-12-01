import { GitHelper } from '../utils/git-helper';
import { DeploymentConfigLoader, DeployOptions } from '../utils/deployment-config';
import { ProjectFileFinder } from '../utils/project-file-finder';
import { BuildHelper } from '../utils/build-helper';
import { Logger } from '../utils/logger';
import { ProjectionError, ErrorCodes } from '../utils/errors';
import * as fs from 'fs';
import * as path from 'path';
import * as ghpages from 'gh-pages';

/**
 * Display comprehensive help documentation for the deploy command
 */
export function showDeployHelp(): void {
  console.log(`
${'\x1b[1m'}Projection Deploy - GitHub Pages Deployment${'\x1b[0m'}

${'\x1b[1m'}DESCRIPTION:${'\x1b[0m'}
  Deploy your portfolio site to GitHub Pages with a single command.
  Automatically builds your site and pushes it to the gh-pages branch.

${'\x1b[1m'}USAGE:${'\x1b[0m'}
  projection deploy [options]

${'\x1b[1m'}OPTIONS:${'\x1b[0m'}
  -b, --branch <branch>     Target branch for deployment
                            Default: gh-pages
                            
  -m, --message <message>   Custom commit message for deployment
                            Default: "Deploy to GitHub Pages - <timestamp>"
                            
  -r, --remote <remote>     Git remote to push to
                            Default: origin
                            
  -d, --dir <dir>           Build directory to deploy
                            Default: dist
                            
  --no-build                Skip the build step and deploy existing files
                            Use this if you've already built your site
                            
  --dry-run                 Simulate deployment without actually pushing
                            Useful for testing your configuration
                            
  --force                   Force push to remote (overwrites remote history)
                            ${'\x1b[33m'}⚠️  Use with caution!${'\x1b[0m'}
                            
  --help                    Show this help message

${'\x1b[1m'}EXAMPLES:${'\x1b[0m'}

  ${'\x1b[36m'}# Basic deployment (most common)${'\x1b[0m'}
  projection deploy

  ${'\x1b[36m'}# Deploy to a custom branch${'\x1b[0m'}
  projection deploy --branch main

  ${'\x1b[36m'}# Deploy with a custom commit message${'\x1b[0m'}
  projection deploy --message "Update portfolio with new projects"

  ${'\x1b[36m'}# Deploy without rebuilding (use existing dist folder)${'\x1b[0m'}
  projection deploy --no-build

  ${'\x1b[36m'}# Test deployment without actually pushing${'\x1b[0m'}
  projection deploy --dry-run

  ${'\x1b[36m'}# Deploy to a different remote${'\x1b[0m'}
  projection deploy --remote upstream

  ${'\x1b[36m'}# Force push (overwrites remote history)${'\x1b[0m'}
  projection deploy --force

  ${'\x1b[36m'}# Deploy from a custom build directory${'\x1b[0m'}
  projection deploy --dir build

  ${'\x1b[36m'}# Combine multiple options${'\x1b[0m'}
  projection deploy --branch gh-pages --message "v2.0 release" --no-build

${'\x1b[1m'}CONFIGURATION:${'\x1b[0m'}

  You can configure deployment settings in your projection.config.json:

  ${'\x1b[2m'}{
    title: "My Portfolio",
    baseUrl: "/my-repo/",
    homepage: "portfolio.example.com",
    deployBranch: "gh-pages"
  }${'\x1b[0m'}

  ${'\x1b[1m'}baseUrl:${'\x1b[0m'}      The URL path where your site will be hosted
                 For project sites: /repository-name/
                 For user sites: /
                 
  ${'\x1b[1m'}homepage:${'\x1b[0m'}     Custom domain for your site (creates CNAME file)
                 Example: "portfolio.example.com"
                 
  ${'\x1b[1m'}deployBranch:${'\x1b[0m'} Default branch for deployment (default: gh-pages)

${'\x1b[1m'}REQUIREMENTS:${'\x1b[0m'}

  Before deploying, ensure you have:
  
  ${'\x1b[32m'}✓${'\x1b[0m'} Git installed and configured
  ${'\x1b[32m'}✓${'\x1b[0m'} A Git repository initialized (git init)
  ${'\x1b[32m'}✓${'\x1b[0m'} A remote configured (git remote add origin <url>)
  ${'\x1b[32m'}✓${'\x1b[0m'} A projects file (projects.yaml, projects.yml, or projects.json)
  ${'\x1b[32m'}✓${'\x1b[0m'} Git credentials configured for pushing

${'\x1b[1m'}FIRST-TIME SETUP:${'\x1b[0m'}

  1. Initialize Git repository:
     ${'\x1b[2m'}git init${'\x1b[0m'}

  2. Add your GitHub repository as remote:
     ${'\x1b[2m'}git remote add origin https://github.com/username/repo.git${'\x1b[0m'}

  3. Configure baseUrl in projection.config.json:
     ${'\x1b[2m'}baseUrl: "/repo/"${'\x1b[0m'}

  4. Deploy your site:
     ${'\x1b[2m'}projection deploy${'\x1b[0m'}

  5. Enable GitHub Pages in repository settings:
     - Go to Settings → Pages
     - Set source to "gh-pages" branch
     - Save and wait for deployment

${'\x1b[1m'}TROUBLESHOOTING:${'\x1b[0m'}

  ${'\x1b[1m'}Problem:${'\x1b[0m'} Git is not installed
  ${'\x1b[1m'}Solution:${'\x1b[0m'} Install Git from https://git-scm.com/

  ${'\x1b[1m'}Problem:${'\x1b[0m'} Not a git repository
  ${'\x1b[1m'}Solution:${'\x1b[0m'} Run 'git init' to initialize a repository

  ${'\x1b[1m'}Problem:${'\x1b[0m'} No git remote found
  ${'\x1b[1m'}Solution:${'\x1b[0m'} Run 'git remote add origin <url>' to add a remote

  ${'\x1b[1m'}Problem:${'\x1b[0m'} Authentication failed
  ${'\x1b[1m'}Solution:${'\x1b[0m'} Configure Git credentials:
           - Use SSH keys: https://docs.github.com/en/authentication
           - Or configure credential helper: git config credential.helper store
           - Or use personal access token

  ${'\x1b[1m'}Problem:${'\x1b[0m'} Push rejected due to conflicts
  ${'\x1b[1m'}Solution:${'\x1b[0m'} Use --force flag to force push (overwrites remote)
           ${'\x1b[2m'}projection deploy --force${'\x1b[0m'}
           ${'\x1b[33m'}⚠️  Warning: This will overwrite the remote branch history${'\x1b[0m'}

  ${'\x1b[1m'}Problem:${'\x1b[0m'} Build fails during deployment
  ${'\x1b[1m'}Solution:${'\x1b[0m'} Fix build errors first, or use --no-build to deploy existing files
           ${'\x1b[2m'}projection build${'\x1b[0m'} (to test build separately)
           ${'\x1b[2m'}projection deploy --no-build${'\x1b[0m'} (to deploy without building)

  ${'\x1b[1m'}Problem:${'\x1b[0m'} Site shows 404 or broken links
  ${'\x1b[1m'}Solution:${'\x1b[0m'} Check that baseUrl in config matches your repository name
           For https://username.github.io/repo/, use baseUrl: "/repo/"

  ${'\x1b[1m'}Problem:${'\x1b[0m'} Site not updating after deployment
  ${'\x1b[1m'}Solution:${'\x1b[0m'} GitHub Pages can take a few minutes to update
           - Check repository Settings → Pages for deployment status
           - Clear browser cache and try again
           - Verify gh-pages branch has the latest changes

  ${'\x1b[1m'}Problem:${'\x1b[0m'} Custom domain not working
  ${'\x1b[1m'}Solution:${'\x1b[0m'} Ensure homepage is set in config and DNS is configured:
           1. Add homepage: "yourdomain.com" to projection.config.json
           2. Configure DNS records with your domain provider
           3. Enable HTTPS in GitHub Pages settings

${'\x1b[1m'}WORKFLOW:${'\x1b[0m'}

  The deploy command performs these steps:
  
  1. ${'\x1b[2m'}Validates Git installation and repository setup${'\x1b[0m'}
  2. ${'\x1b[2m'}Checks for projects file${'\x1b[0m'}
  3. ${'\x1b[2m'}Loads deployment configuration${'\x1b[0m'}
  4. ${'\x1b[2m'}Builds the site (unless --no-build)${'\x1b[0m'}
  5. ${'\x1b[2m'}Adds .nojekyll file to disable Jekyll${'\x1b[0m'}
  6. ${'\x1b[2m'}Adds CNAME file if custom domain configured${'\x1b[0m'}
  7. ${'\x1b[2m'}Pushes to gh-pages branch${'\x1b[0m'}
  8. ${'\x1b[2m'}Displays deployment URL and instructions${'\x1b[0m'}

${'\x1b[1m'}MORE INFORMATION:${'\x1b[0m'}

  GitHub Pages Documentation:
  https://docs.github.com/en/pages

  Projection Documentation:
  https://github.com/quasarbright/projection

`);
}

/**
 * Deploy command - builds and deploys the portfolio site to GitHub Pages
 * 
 * @param options - Deployment options from command-line
 * @throws ProjectionError if validation fails or deployment cannot proceed
 */
export async function deploy(options: DeployOptions = {}): Promise<void> {
  // Check if help flag is set
  if (options.help) {
    showDeployHelp();
    return;
  }
  const cwd = process.cwd();

  try {
    Logger.header('🚀 Deploying to GitHub Pages');
    Logger.newline();

    // Step 1: Validate Git installation
    Logger.step('Checking Git installation...');
    const gitInstalled = await GitHelper.isGitInstalled();
    
    if (!gitInstalled) {
      throw new ProjectionError(
        'Git is not installed or not in PATH',
        ErrorCodes.VALIDATION_ERROR,
        {
          solution: 'Install Git from https://git-scm.com/',
          required: 'Git is required for deployment to GitHub Pages'
        }
      );
    }
    Logger.success('Git is installed');

    // Step 2: Validate Git repository and remote configuration
    Logger.step('Validating Git repository...');
    const remote = options.remote || 'origin';
    const validation = await GitHelper.validateRepository(cwd, remote);

    if (!validation.isGitRepo) {
      throw new ProjectionError(
        'Not a git repository',
        ErrorCodes.VALIDATION_ERROR,
        {
          solution: "Run 'git init' to initialize a repository",
          required: 'A Git repository is required for deployment'
        }
      );
    }

    if (!validation.hasRemote) {
      throw new ProjectionError(
        `No git remote '${remote}' found`,
        ErrorCodes.VALIDATION_ERROR,
        {
          solution: `Run 'git remote add ${remote} <url>' to add a remote`,
          required: 'A Git remote is required to push the deployment'
        }
      );
    }

    Logger.success(`Git repository validated (remote: ${remote})`);

    // Step 3: Verify projects data file exists
    Logger.step('Checking for projects file...');
    const projectFile = ProjectFileFinder.find(cwd);
    
    if (!projectFile) {
      const possibleFiles = ProjectFileFinder.getSupportedFileNames();
      throw new ProjectionError(
        'No projects file found',
        ErrorCodes.FILE_NOT_FOUND,
        {
          solution: `Create one of: ${possibleFiles.join(', ')}`,
          required: 'A projects file is required to build the site'
        }
      );
    }
    Logger.success(`Found projects file: ${projectFile.path}`);

    // Step 4: Load deployment configuration
    Logger.step('Loading deployment configuration...');
    const config = await DeploymentConfigLoader.load(cwd, options);
    Logger.success('Configuration loaded');

    // Step 5: Display pre-deployment summary
    Logger.newline();
    Logger.header('📋 Deployment Summary');
    Logger.keyValue('Repository', validation.remoteUrl);
    Logger.keyValue('Branch', config.branch);
    Logger.keyValue('Build Directory', config.buildDir);
    Logger.keyValue('Base URL', config.baseUrl);
    
    if (config.homepage) {
      Logger.keyValue('Custom Domain', config.homepage);
    }
    
    if (options.dryRun) {
      Logger.keyValue('Mode', 'DRY RUN (no changes will be made)');
    }
    
    Logger.newline();

    // If dry-run, stop here
    if (options.dryRun) {
      Logger.info('Dry run complete. No deployment was performed.');
      return;
    }

    // Step 6: Build the site (unless --no-build flag is set)
    if (!options.noBuild) {
      Logger.newline();
      Logger.header('🔨 Building site');
      Logger.newline();

      try {
        // Use shared build helper
        await BuildHelper.runBuild({
          cwd,
          outputDir: config.buildDir,
          clean: true
        });

      } catch (error) {
        Logger.newline();
        Logger.error('Deployment aborted due to build failure');
        Logger.newline();
        
        throw new ProjectionError(
          'Build failed',
          ErrorCodes.RUNTIME_ERROR,
          { originalError: (error as Error).message }
        );
      }
    } else {
      Logger.newline();
      Logger.info('Skipping build (--no-build flag set)');
      Logger.dim(`Using existing files in ${config.buildDir}`);
      Logger.newline();
    }

    // Step 7: Configure and execute gh-pages deployment
    Logger.newline();
    Logger.header('📦 Deploying to GitHub Pages');
    Logger.newline();

    try {
      // Prepare build directory path
      const buildDirPath = path.isAbsolute(config.buildDir)
        ? config.buildDir
        : path.join(cwd, config.buildDir);

      // Verify build directory exists
      if (!fs.existsSync(buildDirPath)) {
        throw new ProjectionError(
          `Build directory not found: ${buildDirPath}`,
          ErrorCodes.FILE_NOT_FOUND,
          {
            solution: 'Run the build first or check the --dir option',
            required: 'The build directory must exist before deployment'
          }
        );
      }

      // Add .nojekyll file to disable Jekyll processing
      const nojekyllPath = path.join(buildDirPath, '.nojekyll');
      if (!fs.existsSync(nojekyllPath)) {
        Logger.step('Adding .nojekyll file...');
        fs.writeFileSync(nojekyllPath, '', 'utf8');
        Logger.success('.nojekyll file added');
      }

      // Add CNAME file if homepage is configured
      if (config.homepage) {
        const cnamePath = path.join(buildDirPath, 'CNAME');
        Logger.step(`Adding CNAME file for ${config.homepage}...`);
        fs.writeFileSync(cnamePath, config.homepage, 'utf8');
        Logger.success('CNAME file added');
      }

      // Configure gh-pages options
      const ghPagesOptions: ghpages.PublishOptions = {
        branch: config.branch,
        dest: '.',
        message: options.message || `Deploy to GitHub Pages - ${new Date().toISOString()}`,
        remote: config.remote,
        dotfiles: true, // Include .nojekyll
        add: true, // Preserve commit history
        ...(options.force && { force: true }) // Force push if requested
      };

      Logger.step('Publishing to GitHub Pages...');
      Logger.dim(`Branch: ${config.branch}`);
      Logger.dim(`Remote: ${config.remote}`);
      Logger.newline();

      // Publish to gh-pages
      await new Promise<void>((resolve, reject) => {
        ghpages.publish(buildDirPath, ghPagesOptions, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Display success message
      Logger.newline();
      Logger.icon('🎉', 'Deployment successful!', '\x1b[32m');
      Logger.newline();

      // Generate GitHub Pages URL
      const repoName = DeploymentConfigLoader.extractRepoName(config.repositoryUrl);
      const githubPagesUrl = config.homepage || DeploymentConfigLoader.generateGitHubPagesUrl(config.repositoryUrl);
      
      Logger.keyValue('Site URL', githubPagesUrl);
      Logger.keyValue('Branch', config.branch);
      if (ghPagesOptions.message) {
        Logger.keyValue('Commit', ghPagesOptions.message);
      }
      Logger.newline();

      Logger.info('Your site has been deployed to GitHub Pages!');
      Logger.dim('Note: It may take a few minutes for GitHub Pages to update.');
      Logger.newline();

      // Provide instructions for enabling GitHub Pages if needed
      Logger.info('If this is your first deployment:');
      Logger.dim('1. Go to your repository settings on GitHub');
      Logger.dim(`2. Navigate to Pages section`);
      Logger.dim(`3. Ensure the source is set to the '${config.branch}' branch`);
      Logger.newline();

    } catch (error) {
      Logger.newline();
      Logger.error('Deployment failed');
      Logger.newline();

      // Handle gh-pages specific errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('permission denied') || errorMessage.includes('authentication')) {
          Logger.dim('Authentication failed. Please check your Git credentials.');
          Logger.newline();
          Logger.info('Solutions:');
          Logger.dim('• Configure Git credentials: git config credential.helper store');
          Logger.dim('• Use SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh');
          Logger.dim('• Check repository permissions');
        } else if (errorMessage.includes('rejected') || errorMessage.includes('conflict')) {
          Logger.dim('Push rejected due to conflicts.');
          Logger.newline();
          Logger.info('Solutions:');
          Logger.dim('• Use --force flag to force push (caution: overwrites remote)');
          Logger.dim('• Manually resolve conflicts in the gh-pages branch');
        } else if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
          Logger.dim('Repository or remote not found.');
          Logger.newline();
          Logger.info('Solutions:');
          Logger.dim('• Verify the remote URL: git remote -v');
          Logger.dim('• Check repository permissions');
          Logger.dim('• Ensure the repository exists on GitHub');
        } else {
          Logger.dim(error.message);
        }

        Logger.newline();
      }

      throw new ProjectionError(
        'Deployment failed',
        ErrorCodes.RUNTIME_ERROR,
        { originalError: (error as Error).message }
      );
    }

  } catch (error) {
    if (error instanceof ProjectionError) {
      Logger.error(error.message);
      Logger.newline();
      
      if (error.details.solution) {
        Logger.info(`Solution: ${error.details.solution}`);
      }
      
      if (error.details.required) {
        Logger.dim(error.details.required);
      }
      
      throw error;
    }
    
    // Re-throw unexpected errors
    throw error;
  }
}
