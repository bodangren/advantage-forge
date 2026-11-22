/**
 * Measures the Rune Match audio preload budget with a real browser and a slow-3G profile.
 * The page, the files, and the fetches are real. The script only observes resource timing.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = 5199;
const BASE = `http://127.0.0.1:${PORT}`;
const PROBE_URL = `${BASE}/demo/index.html`;
const PAGE_URL = `${BASE}/demo/index.html?renderer=phaser`;
const OUT = join(ROOT, 'out', 'audio-budget', 'rune-match.json');
const AUDIO_PREFIX = '/demo/audio/chibi/';
const MAX_BYTES = 100000;
const MAX_SECONDS = 1.5;
const LATENCY_MS = 300;
const DOWNLOAD_BYTES_PER_SECOND = Math.round((1.6 * 1024 * 1024) / 8);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Prints the row details on a failed gate, so a zero or a foreign row is visible. */
function fail(message, rows) {
  if (rows) console.error(`audio-budget rows: ${JSON.stringify(rows, null, 2)}`);
  throw new Error(`audio-budget: ${message}`);
}

/** Sends SIGTERM, then SIGKILL after five seconds if the child is still alive. */
async function stopServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 5000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    child.kill('SIGTERM');
  });
}

const args = process.argv.slice(2);
const gameIndex = args.indexOf('--game');
const game = gameIndex >= 0 ? args[gameIndex + 1] : undefined;
if (game !== 'rune-match') fail('pass --game rune-match');

const set = JSON.parse(readFileSync(join(ROOT, 'sounds', 'sets', 'chibi.json'), 'utf8'));
const allowed = new Set(set.sounds.flatMap((sound) => [`${sound.name}.ogg`, `${sound.name}.mp3`]));

// A failed run must not leave an earlier measurement for the test to read.
rmSync(OUT, { force: true });

// The demo config sets root=demo and publicDir=public; base /demo/ keeps the /demo/audio/chibi/
// URLs the row filter and the on-disk byte check need. The root config serves no public files.
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--config',
    'vite.demo.config.ts',
    '--base',
    '/demo/',
    '--port',
    String(PORT),
    '--strictPort',
    '--host',
    '127.0.0.1',
  ],
  { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
);
let serverLog = '';
server.stdout.on('data', (chunk) => {
  serverLog += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  serverLog += chunk.toString();
});

async function waitForServer() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.signalCode !== null) {
      fail(
        `vite exited before it answered (${server.exitCode ?? server.signalCode}): ${serverLog.slice(-2000)}`,
      );
    }
    try {
      const response = await fetch(PROBE_URL);
      await response.arrayBuffer();
      if (response.ok) return;
    } catch {
      // The port is not open yet; poll again.
    }
    await sleep(250);
  }
  fail(`vite did not answer within 60 s: ${serverLog.slice(-2000)}`);
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.stack ?? String(error)));

  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: LATENCY_MS,
    downloadThroughput: DOWNLOAD_BYTES_PER_SECOND,
    uploadThroughput: -1,
  });

  // The same flow as the Phase 3 browser probe, with no stub and no injected map.
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__apk3dReady === true, null, { timeout: 120000 });
  await page.waitForSelector('[data-game]:not(.soon)', { timeout: 120000 });
  await page.locator('[data-game="rune-match"]:not(.soon)').click();
  await page.waitForFunction(() => !document.querySelector('[data-read]')?.disabled, null, {
    timeout: 60000,
  });
  await page.locator('[data-read]').click();
  await page.waitForSelector('[data-next]', { timeout: 120000 });
  await page.locator('[data-next]').click();
  await page.waitForSelector('[data-start]', { timeout: 240000 });
  await page.locator('[data-start]').click();
  const canvas = page.locator('.game-layer canvas').first();
  await canvas.waitFor({ state: 'visible', timeout: 240000 });
  const box = await canvas.boundingBox();
  if (!box) fail('the 2D game canvas has no visible bounds');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.keyboard.press('Space');

  const countRows = () =>
    page.evaluate(
      ({ prefix, names }) =>
        performance.getEntriesByType('resource').filter((entry) => {
          const path = new URL(entry.name).pathname;
          return path.startsWith(prefix) && names.includes(path.slice(prefix.length));
        }).length,
      { prefix: AUDIO_PREFIX, names: [...allowed] },
    );
  const readRows = () =>
    page.evaluate(
      ({ prefix, names }) =>
        performance
          .getEntriesByType('resource')
          .filter((entry) => {
            const path = new URL(entry.name).pathname;
            return path.startsWith(prefix) && names.includes(path.slice(prefix.length));
          })
          .map((entry) => {
            const path = new URL(entry.name).pathname;
            return {
              url: entry.name,
              file: path.slice(prefix.length),
              startTime: entry.startTime,
              responseEnd: entry.responseEnd,
              encodedBodySize: entry.encodedBodySize,
            };
          }),
      { prefix: AUDIO_PREFIX, names: [...allowed] },
    );

  const deadline = Date.now() + 60000;
  let previous = -1;
  let stable = 0;
  while (Date.now() < deadline) {
    const count = await countRows();
    stable = count > 0 && count === previous ? stable + 1 : 0;
    previous = count;
    if (stable >= 5) break;
    await sleep(200);
  }
  if (stable < 5) fail('audio resource rows did not stabilize within 60 s');
  const rows = await readRows();

  if (rows.length < 1) fail('zero audio resource rows', rows);
  for (const row of rows) {
    if (!/\.(ogg|mp3)$/.test(row.file) || !allowed.has(row.file)) {
      fail(`foreign audio row ${row.url}`, rows);
    }
    if (!(row.encodedBodySize > 0)) fail(`zero encoded bytes for ${row.url}`, rows);
  }
  const files = rows.length;
  if (files !== 6) fail(`expected 6 mapped files, got ${files}`, rows);
  const bytes = rows.reduce((sum, row) => sum + row.encodedBodySize, 0);
  if (!Number.isInteger(bytes) || bytes <= 0 || bytes > MAX_BYTES) {
    fail(`encoded bytes ${bytes} are outside the budget`, rows);
  }
  const diskBytes = rows.reduce(
    (sum, row) => sum + statSync(join(ROOT, 'demo', 'public', 'audio', 'chibi', row.file)).size,
    0,
  );
  if (bytes !== diskBytes) fail(`encoded bytes ${bytes} differ from disk bytes ${diskBytes}`, rows);
  const seconds =
    (Math.max(...rows.map((row) => row.responseEnd)) - Math.min(...rows.map((row) => row.startTime))) / 1000;
  if (!(seconds > 0 && seconds <= MAX_SECONDS))
    fail(`load window ${seconds} s exceeds ${MAX_SECONDS} s`, rows);
  if (consoleErrors.length || pageErrors.length) {
    fail(`page errors ${JSON.stringify({ consoleErrors, pageErrors })}`, rows);
  }

  const result = { bytes, files, seconds };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error.stack ?? String(error));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  await stopServer(server);
}
