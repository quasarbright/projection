/**
 * Waits for the GitHub Pages build triggered by a deploy push to finish.
 * Uses the gh CLI; when gh is missing or unauthenticated, returns without waiting.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * How waiting for a Pages build ended.
 * 'skipped' means gh isn't available or the repository isn't on GitHub.
 */
export type PagesWaitResult =
  | { status: 'completed'; conclusion: string }
  | { status: 'timeout' }
  | { status: 'skipped' };

export class PagesWaiter {
  static async isGhCliAvailable(): Promise<boolean> {
    try {
      await execFileAsync('gh', ['--version']);
      return true;
    } catch {
      return false;
    }
  }

  static extractOwnerRepo(repositoryUrl: string): string | null {
    const match = repositoryUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
    return null;
  }

  /**
   * Wait for the pages-build-deployment run created after `pushedAt` to complete.
   * @param repositoryUrl Git remote URL of the repository
   * @param pushedAt Time recorded just before the push, used to identify the triggered run
   */
  static async waitForDeployment(repositoryUrl: string, pushedAt: Date, timeoutMs = 180000): Promise<PagesWaitResult> {
    const ownerRepo = PagesWaiter.extractOwnerRepo(repositoryUrl);
    if (!ownerRepo || !(await PagesWaiter.isGhCliAvailable())) {
      return { status: 'skipped' };
    }

    const pollInterval = 5000;
    const deadline = Date.now() + timeoutMs;

    // First, wait for a pages-build-deployment run triggered after our push
    let runId: number | null = null;
    while (Date.now() < deadline) {
      try {
        const { stdout } = await execFileAsync('gh', [
          'run', 'list',
          '--repo', ownerRepo,
          '--workflow', 'pages-build-deployment',
          '--limit', '5',
          '--json', 'databaseId,status,conclusion,createdAt',
        ]);
        const runs: Array<{ databaseId: number; status: string; conclusion: string; createdAt: string }> = JSON.parse(stdout);
        const triggered = runs.find(r => new Date(r.createdAt) >= pushedAt);
        if (triggered) {
          if (triggered.status === 'completed') {
            return { status: 'completed', conclusion: triggered.conclusion }; // already done by the time we checked
          }
          runId = triggered.databaseId;
          break;
        }
      } catch {
        // gh not authed or API call failed — fall through to timeout
      }
      await new Promise<void>(resolve => setTimeout(resolve, pollInterval));
    }

    if (!runId) {
      return { status: 'timeout' }; // Run never appeared — the push itself still succeeded
    }

    // Now poll the specific run until it completes
    while (Date.now() < deadline) {
      await new Promise<void>(resolve => setTimeout(resolve, pollInterval));
      try {
        const { stdout } = await execFileAsync('gh', [
          'run', 'view', String(runId),
          '--repo', ownerRepo,
          '--json', 'status,conclusion',
        ]);
        const run: { status: string; conclusion: string } = JSON.parse(stdout);
        if (run.status === 'completed') {
          return { status: 'completed', conclusion: run.conclusion };
        }
      } catch {
        // Keep polling on transient errors
      }
    }
    return { status: 'timeout' };
  }
}
