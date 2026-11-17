/// <reference lib="dom" />
/**
 * Browser test for the dynamic background on touch screens.
 *
 * A finger that starts over the background has to scroll the portfolio, even when the
 * background sketch blocks touch scrolling itself (touch-action: none on its canvas and a
 * touchmove handler that calls preventDefault, like the boids and p5 sketches). The background
 * should still see the finger, and on desktop it keeps getting native mouse events.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import express from 'express';
import { chromium, Browser, Page } from 'playwright';
import { execSync } from 'child_process';
import { build } from '../../src/cli/build';

jest.setTimeout(60000);

// A same-origin background that behaves like a sketch: it blocks touch scrolling and records
// the events that reach it.
const BACKGROUND_HTML = `<!DOCTYPE html>
<html><head><style>
  html, body { margin: 0; height: 100%; }
  body { touch-action: none; }
  canvas { display: block; width: 100vw; height: 100vh; touch-action: none; }
</style></head>
<body><canvas></canvas><div id="inline"></div><script>
  document.getElementById('inline').style.touchAction = 'none';
  window.got = [];
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'mousemove', 'touchstart', 'touchmove', 'touchend']) {
    window.addEventListener(type, (e) => {
      const p = e.touches ? e.touches[0] || e.changedTouches[0] : e;
      window.got.push({ type, x: p && p.clientX, y: p && p.clientY });
    });
  }
  window.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
</script></body></html>`;

const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [tabindex], .project-card, .bg-pill';

describe('dynamic background on touch screens', () => {
  let tempDir: string;
  let originalCwd: string;
  let server: http.Server;
  let baseUrl: string;
  let browser: Browser;

  beforeAll(async () => {
    // build() copies scripts and styles from lib/templates, so bring them up to date with src/
    execSync('npm run copy-templates', { cwd: path.join(__dirname, '../..'), stdio: 'ignore' });
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projection-bg-touch-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);

    // Enough projects that the page scrolls
    const projects = Array.from({ length: 30 }, (_, i) => `
  - id: "p${i}"
    title: "Project ${i}"
    description: "Project number ${i}"
    creationDate: "2024-01-${String((i % 28) + 1).padStart(2, '0')}"
    tags: ["test"]
    pageLink: "https://example.com/p${i}"`).join('');
    fs.writeFileSync('projects.yaml', `projects:${projects}\n`);
    fs.writeFileSync('projection.config.json', JSON.stringify({
      title: 'Touch Test', description: 'x', baseUrl: './', dynamicBackgrounds: ['bg/'],
    }));
    await build();
    fs.mkdirSync(path.join('dist', 'bg'));
    fs.writeFileSync(path.join('dist', 'bg', 'index.html'), BACKGROUND_HTML);

    const app = express();
    app.use(express.static(path.join(tempDir, 'dist')));
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    const address = server.address() as { port: number };
    baseUrl = `http://127.0.0.1:${address.port}/`;

    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser?.close();
    await new Promise((resolve) => server?.close(resolve));
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  async function open(options: Parameters<Browser['newContext']>[0]): Promise<Page> {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    await page.goto(baseUrl);
    await page.waitForFunction(() => {
      const frame = document.getElementById('dynamic-background') as HTMLIFrameElement | null;
      return !!(frame && frame.classList.contains('ready') && (frame.contentWindow as any)?.got);
    });
    return page;
  }

  // A spot in the hero where nothing clickable is on top, so the finger is over the background
  async function backgroundSpot(page: Page): Promise<{ x: number; y: number }> {
    const spot = await page.evaluate((interactive) => {
      for (let y = 120; y < window.innerHeight - 40; y += 20) {
        for (let x = 20; x < window.innerWidth - 20; x += 20) {
          const el = document.elementFromPoint(x, y);
          if (el && (el.id === 'dynamic-background' || !el.closest(interactive))) return { x, y };
        }
      }
      return null;
    }, INTERACTIVE);
    expect(spot).not.toBeNull();
    return spot!;
  }

  const phone = {
    viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1,
  };

  it('scrolls the page when a touch scroll starts over the background', async () => {
    const page = await open(phone);
    const { x, y } = await backgroundSpot(page);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.synthesizeScrollGesture', {
      x, y, yDistance: -400, gestureSourceType: 'touch', speed: 800,
    });
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    await page.context().close();
  });

  it('passes the touch on to the background, at the same spot', async () => {
    const page = await open(phone);
    const { x, y } = await backgroundSpot(page);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    // in steps past Chrome's touch slop, which holds back touchmoves for the first ~15px
    for (let i = 1; i <= 6; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 2 * i, y: y + 10 * i }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(100);
    const got: { type: string; x: number; y: number }[] = await page.evaluate(() =>
      ((document.getElementById('dynamic-background') as HTMLIFrameElement).contentWindow as any).got);
    const types = new Set(got.map((e) => e.type));
    for (const type of ['touchstart', 'touchmove', 'touchend', 'pointerdown', 'pointermove']) {
      expect(types).toContain(type);
    }
    const moves = got.filter((e) => e.type === 'touchmove');
    const last = moves[moves.length - 1];
    expect(last.x).toBeCloseTo(x + 12, 0);
    expect(last.y).toBeCloseTo(y + 60, 0);
    await page.context().close();
  });

  // iOS Safari won't scroll the page when the content under the finger has touch-action: none,
  // even inside an iframe with pointer-events: none, so the background's own touch-action has to
  // go. Chromium doesn't behave this way, so this checks the cause rather than the scroll.
  async function frameTouchActions(page: Page): Promise<string[]> {
    return page.evaluate(() => {
      const doc = (document.getElementById('dynamic-background') as HTMLIFrameElement).contentDocument!;
      return ['html', 'body', 'canvas', '#inline'].map((sel) => getComputedStyle(doc.querySelector(sel)!).touchAction);
    });
  }

  it("turns off the background's touch-action: none on touch screens", async () => {
    const page = await open(phone);
    expect(await frameTouchActions(page)).toEqual(['auto', 'auto', 'auto', 'auto']);
    await page.context().close();
  });

  it("leaves the background's touch-action alone on desktop", async () => {
    const page = await open({ viewport: { width: 1280, height: 800 } });
    expect(await frameTouchActions(page)).toEqual(['auto', 'none', 'none', 'none']);
    await page.context().close();
  });

  it('still gives the background native mouse events on desktop', async () => {
    const page = await open({ viewport: { width: 1280, height: 800 } });
    const { x, y } = await backgroundSpot(page);
    expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, { x, y }))
      .toBe('dynamic-background');
    await page.mouse.move(x, y);
    await page.mouse.move(x + 20, y + 10);
    const got: { type: string }[] = await page.evaluate(() =>
      ((document.getElementById('dynamic-background') as HTMLIFrameElement).contentWindow as any).got);
    // exactly one mousemove per move: the native one, not a forwarded copy on top
    expect(got.filter((e) => e.type === 'mousemove').length).toBe(2);
    await page.context().close();
  });
});
