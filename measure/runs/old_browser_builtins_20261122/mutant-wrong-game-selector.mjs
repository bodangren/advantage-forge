/** Phase 3 T7 browser check for old-browser built-ins.
 *
 * Starts the demo dev server, deletes four ES2022+ built-ins before the first page script runs,
 * starts Spellweavers Run in the 2D view, plays one move, and writes out/old-browser/check.json
 * with two screenshots. The dev server starts and stops inside this one process.
 *
 * Run: node scripts/old-browser-check.mjs --game spellweavers-run
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = '/home/daniebo/Desktop/advantage-forge';
const OUT_DIR = join(ROOT, 'measure', 'runs', 'old_browser_builtins_20261122', 'mutant-wrong-game-selector');
const GAME = 'spellweavers-run';
const BASE = 'http://127.0.0.1:5199/demo/index.html';
const PAGE_URL = `${BASE}?qc=1&renderer=phaser`;
const VIEWPORT = { width: 1280, height: 800 };
const DELETED = ['structuredClone', 'Array.prototype.at', 'Array.prototype.findLastIndex', 'Object.hasOwn'];
const START_PNG = join(OUT_DIR, `${GAME}-start.png`);
const MOVE_PNG = join(OUT_DIR, `${GAME}-move.png`);
const CHECK_JSON = join(OUT_DIR, 'check.json');

const args = process.argv.slice(2);
const gameAt = args.indexOf('--game');
const game = gameAt >= 0 ? args[gameAt + 1] : undefined;
if (game !== GAME) {
  console.error(`usage: node scripts/old-browser-check.mjs --game ${GAME}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

let server = null;
let serverExit = null;

function startServer() {
  server = spawn(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      '--config',
      'vite.demo.config.ts',
      '--port',
      '5199',
      '--strictPort',
      '--base',
      '/demo/',
    ],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let log = '';
  const collect = (chunk) => {
    log = `${log}${chunk.toString()}`.slice(-4000);
  };
  server.stdout.on('data', collect);
  server.stderr.on('data', collect);
  server.on('exit', (code, signal) => {
    serverExit = { code, signal, log };
  });
}

async function stopServer() {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      try {
        server.kill('SIGKILL');
      } catch {
        // The child is already gone.
      }
      resolve();
    }, 5000);
    server.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    try {
      server.kill('SIGTERM');
    } catch {
      clearTimeout(timer);
      resolve();
    }
  });
}

function onSignal() {
  stopServer().finally(() => process.exit(1));
}
process.on('SIGINT', onSignal);
process.on('SIGTERM', onSignal);

/** Fail fast on a port collision: a strictPort child exits before the page can answer. */
async function waitForServer() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (serverExit) {
      throw new Error(`dev server exited before the page answered: ${JSON.stringify(serverExit)}`);
    }
    try {
      const response = await fetch(BASE, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error('dev server did not answer within 60 s');
}

async function assertDeleted(page) {
  const types = await page.evaluate((names) => {
    const typeOfName = (name) => {
      if (name === 'structuredClone') return typeof globalThis.structuredClone;
      if (name === 'Object.hasOwn') return typeof Object.hasOwn;
      if (name === 'Array.prototype.at') return typeof Array.prototype.at;
      if (name === 'Array.prototype.findLastIndex') return typeof Array.prototype.findLastIndex;
      return 'unknown';
    };
    return Object.fromEntries(names.map((name) => [name, typeOfName(name)]));
  }, DELETED);
  for (const name of DELETED) {
    if (types[name] !== 'undefined') throw new Error(`${name} is present in the page: ${types[name]}`);
  }
  return types;
}

async function stateDigest(page) {
  return page.evaluate(() => {
    const game = window.__apk3d?.game?.();
    if (!game) return null;
    try {
      return JSON.stringify(game.state?.());
    } catch (error) {
      return String(error);
    }
  });
}

const result = { game: GAME, deleted: DELETED, started: false, moves: 0, errors: [] };
const consoleErrors = [];
const pageErrors = [];
let browser = null;

try {
  startServer();
  await waitForServer();
  browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  const context = await browser.newContext({ viewport: VIEWPORT });
  await context.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      // A blocked storage area changes nothing for this check.
    }
    delete globalThis.structuredClone;
    delete Array.prototype.at;
    delete Array.prototype.findLastIndex;
    delete Object.hasOwn;
  });

  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.stack ?? String(error)));
  await page.setViewportSize(VIEWPORT);
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 1500 });
  result.absent_in_page = await assertDeleted(page);

  await page.waitForFunction(() => window.__apk3dReady === true, undefined, { timeout: 1500 });
  await page.waitForSelector('[data-game]:not(.soon)', { timeout: 1500 });
  const flat = page.locator('[data-flat]');
  if (!(await flat.isChecked())) await flat.check();
  await page.locator('[data-story]').first().click();
  await page.waitForTimeout(800);
  const card = page.locator(`[data-game="wrong-game-id"]:not(.soon)`);
  await card.waitFor({ state: 'visible', timeout: 1500 });
  await card.click();
  await page.waitForFunction(() => !document.querySelector('[data-read]')?.disabled, undefined, {
    timeout: 1500,
  });
  await page.locator('[data-read]').click();
  await page.waitForSelector('.reader.on [data-next]', { timeout: 1500 });
  await page.locator('[data-next]').click();
  await page.waitForSelector('[data-start]', { timeout: 1500 });
  await page.locator('[data-start]').click();
  await page.waitForFunction(
    () => window.__apk3d?.renderer?.() === 'phaser' && !!window.__apk3d?.game?.(),
    undefined,
    { timeout: 1500 },
  );
  result.started = true;
  await page.waitForTimeout(1500);
  await page.screenshot({ path: START_PNG, fullPage: true });

  const before = await stateDigest(page);
  const canvas = page.locator('.game-layer canvas').first();
  await canvas.waitFor({ state: 'visible', timeout: 1500 });
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    result.moves += 1;
    await page.waitForTimeout(250);
  }
  for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowUp', '1', 'ArrowRight']) {
    await page.keyboard.press(key);
    result.moves += 1;
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(1400);
  const after = await stateDigest(page);
  if (before === null || before === after) {
    throw new Error('game state did not change after the move');
  }
  result.state_changed = true;
  await page.screenshot({ path: MOVE_PNG, fullPage: true });
  result.errors = [...consoleErrors, ...pageErrors];
} catch (error) {
  result.errors = [...consoleErrors, ...pageErrors, error.stack ?? String(error)];
} finally {
  writeFileSync(CHECK_JSON, `${JSON.stringify(result, null, 2)}\n`);
  if (browser) await browser.close().catch(() => {});
  await stopServer();
}

const ok = result.started === true && result.moves >= 1 && result.errors.length === 0;
console.log(JSON.stringify(result));
process.exitCode = ok ? 0 : 1;
