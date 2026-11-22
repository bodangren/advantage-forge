/**
 * Measures the Rune Match audio preload budget with a real browser and a slow-3G profile.
 * The page, the files, and the fetches are real. The script observes resource timing, decodes,
 * and the first effect. It installs no stub and changes no bus call.
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
const EFFECT_FILES = new Set(
  ['tap', 'right', 'wrong', 'level-end', 'whoosh', 'pop'].flatMap((name) => [`${name}.ogg`, `${name}.mp3`]),
);
const MAX_BYTES = 100000;
const MAX_SECONDS = 1.5;
const LATENCY_MS = 300;
const DOWNLOAD_BYTES_PER_SECOND = Math.round((1.6 * 1024 * 1024) / 8);
const USAGE = 'usage: node scripts/audio-budget.mjs --game rune-match';
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
if (args.includes('--help') || args.includes('-h')) {
  console.log(USAGE);
  process.exit(0);
}
const gameIndex = args.indexOf('--game');
const game = gameIndex >= 0 ? args[gameIndex + 1] : undefined;
if (game !== 'rune-match') {
  console.error(USAGE);
  process.exit(1);
}

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
      if (response.ok) {
        // A foreign listener can answer while --strictPort makes vite exit. Accept only our child.
        await sleep(250);
        if (server.exitCode !== null || server.signalCode !== null) {
          fail(
            `vite exited before it served the page (${server.exitCode ?? server.signalCode}): ${serverLog.slice(-2000)}`,
          );
        }
        if (serverLog.includes('ready in')) return;
      }
    } catch {
      // The port is not open yet; poll again.
    }
    await sleep(250);
  }
  fail(`vite did not answer within 60 s: ${serverLog.slice(-2000)}`);
}

let browser;
let stopping = false;
const stopOnSignal = (signal) => {
  if (stopping) return;
  stopping = true;
  void (async () => {
    if (browser) await browser.close().catch(() => {});
    await stopServer(server);
    process.exit(signal === 'SIGINT' ? 130 : 143);
  })();
};
process.on('SIGINT', () => stopOnSignal('SIGINT'));
process.on('SIGTERM', () => stopOnSignal('SIGTERM'));

try {
  await waitForServer();
  browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  // Observe decodes and the first effect from the page. No bus or fetch stub is installed.
  await page.addInitScript(() => {
    const budget = {
      decodes: 0,
      decodeTimes: [],
      fileStarts: 0,
      events: [],
      markAt: null,
      unlockAt: null,
    };
    const responseFiles = new WeakMap();
    const decodedFiles = new WeakMap();
    const arrayBuffer = Response.prototype.arrayBuffer;
    Response.prototype.arrayBuffer = function (...params) {
      return arrayBuffer.apply(this, params).then((data) => {
        const path = new URL(this.url, location.href).pathname;
        const file = path.slice(path.lastIndexOf('/') + 1);
        if (/\.(ogg|mp3)$/.test(file)) responseFiles.set(data, file);
        return data;
      });
    };
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function (data, ...params) {
      return decode.apply(this, [data, ...params]).then((buffer) => {
        budget.decodes += 1;
        budget.decodeTimes.push(performance.now());
        decodedFiles.set(buffer, responseFiles.get(data) ?? null);
        return buffer;
      });
    };
    const bufferStart = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...params) {
      const file = decodedFiles.get(this.buffer);
      if (file) {
        budget.fileStarts += 1;
        budget.events.push({ at: performance.now(), kind: 'file', file });
      }
      return bufferStart.apply(this, params);
    };
    const oscStart = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...params) {
      budget.events.push({ at: performance.now(), kind: 'synth' });
      return oscStart.apply(this, params);
    };
    window.__audioBudget = budget;
  });
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
  await page.evaluate(() => {
    if (window.__audioBudget) window.__audioBudget.markAt = performance.now();
  });
  await page.locator('[data-start]').click();
  const canvas = page.locator('.game-layer canvas').first();
  await canvas.waitFor({ state: 'visible', timeout: 240000 });
  const box = await canvas.boundingBox();
  if (!box) fail('the 2D game canvas has no visible bounds');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.evaluate(() => {
    if (window.__audioBudget) window.__audioBudget.unlockAt = performance.now();
  });
  await page.keyboard.press('Space');

  // The first game effect can follow the spawn banner, so wait for an effect after the unlock.
  const effectDeadline = Date.now() + 60000;
  while (Date.now() < effectDeadline) {
    const seen = await page.evaluate(() => {
      const budget = window.__audioBudget;
      return (
        !!budget && budget.unlockAt !== null && budget.events.some((event) => event.at >= budget.unlockAt)
      );
    });
    if (seen) break;
    await sleep(200);
  }

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

  const observed = await page.evaluate(() => {
    const budget = window.__audioBudget;
    if (!budget) {
      return { decodes: 0, decodeTimes: [], fileStarts: 0, events: [], markAt: null, unlockAt: null };
    }
    return {
      decodes: budget.decodes,
      decodeTimes: budget.decodeTimes,
      fileStarts: budget.fileStarts,
      events: budget.events,
      markAt: budget.markAt,
      unlockAt: budget.unlockAt,
    };
  });
  const decoded = observed.decodes;
  if (!Number.isInteger(decoded) || decoded !== files) {
    fail(`successful decodes ${decoded} differ from the ${files} fetched files`, rows);
  }
  // Resource timing keeps the network window. This separate window also covers decoding.
  const firstRequestAt = Math.min(...rows.map((row) => row.startTime));
  const lastDecodeAt = Math.max(...observed.decodeTimes);
  const decodeSeconds = (lastDecodeAt - firstRequestAt) / 1000;
  if (!(decodeSeconds > 0 && decodeSeconds <= MAX_SECONDS)) {
    fail(`decode window ${decodeSeconds} s exceeds ${MAX_SECONDS} s`, rows);
  }
  if (observed.markAt === null) fail('the effect marker was not installed before launch', rows);
  const effectMarker = 'before-launch';
  const firstEffectEvent = observed.events.find(
    (event) => event.kind === 'file' && event.at >= observed.markAt && EFFECT_FILES.has(event.file),
  );
  if (!firstEffectEvent) {
    fail(
      `no file-backed Rune Match effect after the launch marker (observed ${JSON.stringify(observed)})`,
      rows,
    );
  }
  const firstEffect = firstEffectEvent.file;
  const firstEffectAfterUnlock =
    observed.unlockAt === null ? undefined : observed.events.find((event) => event.at >= observed.unlockAt);
  const fileEffect = observed.fileStarts > 0 && firstEffectAfterUnlock?.kind === 'file';
  if (!fileEffect) {
    fail(
      `first effect did not play a decoded file (decoded starts ${observed.fileStarts}, first event ${JSON.stringify(firstEffectAfterUnlock)})`,
      rows,
    );
  }

  const result = {
    bytes,
    files,
    seconds,
    decodeSeconds,
    decoded,
    fileEffect,
    effectMarker,
    firstEffect,
  };
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
