/** Phase 3 T7 browser check for old-browser built-ins.
 *
 * Starts the demo dev server, deletes four ES2022+ built-ins before the first page script runs,
 * starts Spellweavers Run in the 2D view, plays player actions, and writes out/old-browser/check.json
 * with two screenshots. The dev server starts and stops inside this one process.
 *
 * Artifact fields: `game` is the fixed game id; `deleted` names the four removed built-ins;
 * `started` is true after the Phaser game mounts; `moves` counts accepted player actions;
 * `action_inputs` names the inputs that caused them; `negative_control` records a quiet window
 * that must show no action change; `state_changed` records an unspecific digest change and is not
 * the move gate; `errors` holds scrubbed messages and trimmed stacks; `absent_in_page` reports each
 * deleted name as `undefined`.
 *
 * Run: node scripts/old-browser-check.mjs --game spellweavers-run
 */
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { connect } from 'node:net';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = '/home/daniebo/Desktop/advantage-forge';
const HOME = process.env.HOME ?? '';
const OUT_DIR = join(ROOT, 'measure', 'runs', 'old_browser_builtins_20261122', 'mutant-r3-foreign-server-child-wrapper-out');
const GAME = 'spellweavers-run';
const BASE = 'http://127.0.0.1:5199/demo/index.html';
const PAGE_URL = `${BASE}?qc=1&renderer=phaser`;
const PORT = 5199;
const VIEWPORT = { width: 1280, height: 800 };
const DELETED = ['structuredClone', 'Array.prototype.at', 'Array.prototype.findLastIndex', 'Object.hasOwn'];
const START_PNG = join(OUT_DIR, `${GAME}-start.png`);
const MOVE_PNG = join(OUT_DIR, `${GAME}-move.png`);
const CHECK_JSON = join(OUT_DIR, 'check.json');
const USAGE = `usage: node scripts/old-browser-check.mjs --game ${GAME}`;

const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(USAGE);
  process.exit(0);
}
let game;
let badArgs = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--game') game = args[++i];
  else badArgs = true;
}
if (badArgs || game !== GAME) {
  console.error(USAGE);
  process.exit(1);
}

/** Replace the cwd and the home directory and flatten line breaks. */
function scrub(text) {
  let out = String(text ?? '');
  out = out.split(ROOT).join('<repo>');
  if (HOME) out = out.split(HOME).join('<home>');
  return out.replace(/\s+/g, ' ').trim().slice(0, 500);
}

/** One concise message per error. No absolute path and no stack enters check.json. */
function describe(error) {
  const message = scrub(error?.message ?? String(error));
  const stack = typeof error?.stack === 'string' ? scrub(error.stack).slice(0, 300) : '';
  return stack && stack !== message ? `${message} | ${stack}` : message;
}

let server = null;
let serverExit = null;

function startServer() {
  server = spawn(process.execPath, ['-e', "const { spawn } = require('node:child_process'); const child = spawn(process.execPath, ['-e', \"require('node:http').createServer((q,s)=>{s.writeHead(200,{'content-type':'text/html'});s.end('<html><script src=\\\\\\\"/@vite/client\\\\\\\"></script></html>')}).listen(5199,'127.0.0.1')\"], { stdio: 'ignore' }); process.on('SIGTERM', () => { child.kill('SIGTERM'); child.once('exit', () => process.exit(0)); }); setInterval(() => {}, 1000);"], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  server.on('exit', (code, signal) => { serverExit = { code, signal, log: 'wrapper fixture' }; });
}

async function stopServer() {
  if (!server) return;
  if (server.exitCode === null && server.signalCode === null) {
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
  if (server.exitCode === null && server.signalCode === null) {
    await new Promise((resolve) => server.once('exit', resolve));
  }
}

function onSignal() {
  stopServer().finally(() => process.exit(1));
}
process.on('SIGINT', onSignal);
process.on('SIGTERM', onSignal);

/** True when any process answers on the fixed port. Used before spawn only. */
function portAnswering() {
  return new Promise((resolve) => {
    const socket = connect({ host: '127.0.0.1', port: PORT });
    const done = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(800, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

/** PIDs that hold a listening socket on the fixed port, read from ss. */
function listeningPids() {
  const pids = new Set();
  try {
    const text = execFileSync('ss', ['-ltnp'], { encoding: 'utf8', timeout: 3000 });
    for (const line of text.split('\n')) {
      if (!line.includes(`127.0.0.1:${PORT}`) || !line.includes('LISTEN')) continue;
      for (const match of line.matchAll(/pid=(\d+)/g)) pids.add(Number(match[1]));
    }
  } catch {
    // ss is unavailable; ownership cannot be proven.
  }
  return pids;
}

/** The spawned child and every process whose parent chain reaches it. */
function childTree() {
  const tree = new Set(server?.pid ? [server.pid] : []);
  if (!server?.pid) return tree;
  let names = [];
  try {
    names = readdirSync('/proc').filter((name) => /^\d+$/.test(name));
  } catch {
    return tree;
  }
  const parent = new Map();
  for (const name of names) {
    try {
      const stat = readFileSync(`/proc/${name}/stat`, 'utf8');
      const close = stat.lastIndexOf(')');
      const fields = stat
        .slice(close + 2)
        .trim()
        .split(/\s+/);
      parent.set(Number(name), Number(fields[1]));
    } catch {
      // The process exited while the table was read.
    }
  }
  let grew = true;
  while (grew) {
    grew = false;
    for (const [pid, ppid] of parent) {
      if (!tree.has(pid) && tree.has(ppid)) {
        tree.add(pid);
        grew = true;
      }
    }
  }
  return tree;
}

/** Listener state: exited, pending, foreign, or owned by this run's child tree. */
function listenerState() {
  if (serverExit) return 'exited';
  const listeners = listeningPids();
  if (listeners.size === 0) return 'pending';
  const tree = childTree();
  return [...listeners].every((pid) => tree.has(pid)) ? 'owned' : 'foreign';
}

/** Fail on a child exit or a foreign owner. Called at each evidence boundary. */
function assertOwned() {
  const state = listenerState();
  if (state === 'exited')
    throw new Error(`dev server child exited before the result was accepted: ${JSON.stringify(serverExit)}`);
  if (state !== 'owned') throw new Error('port 5199 listener owner mismatch: not the spawned dev server');
}

/** Readiness needs the owned child's listener and a Vite-marked response. */
async function waitForOwnedServer() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    const state = listenerState();
    if (state === 'exited') {
      throw new Error(`dev server child exited before readiness: ${JSON.stringify(serverExit)}`);
    }
    if (state === 'foreign') {
      throw new Error('port 5199 listener owner mismatch: not the spawned dev server');
    }
    if (state === 'owned') {
      let answered = false;
      try {
        const response = await fetch(BASE, { signal: AbortSignal.timeout(2000) });
        const body = await response.text();
        answered = response.ok && body.includes('/@vite/client');
      } catch {
        // The owned server is still starting.
      }
      if (answered) {
        assertOwned();
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error('owned dev server did not answer within 60 s');
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
    const state = window.__apk3d?.game?.()?.state?.();
    if (!state) return null;
    try {
      return JSON.stringify(state);
    } catch (error) {
      return String(error);
    }
  });
}

/** Only fields that a player action changes. Clock fields never enter this mark. */
async function actionMark(page) {
  return page.evaluate(() => {
    const state = window.__apk3d?.game?.()?.state?.();
    if (!state) return null;
    return {
      word: state.word,
      collected: state.collected,
      score: state.score,
      courage: state.courage,
      roundId: state.round?.id ?? null,
      chosen: state.round?.chosen ?? null,
    };
  });
}

/** Count of input events that reached the page. A harness state write does not raise it. */
async function inputCount(page) {
  return page.evaluate(() => window.__oldBrowserInputCount ?? 0);
}

function acceptedAction(before, after, inputWasSent) {
  if (!before || !after) return false;
  if (!inputWasSent) return false;
  if (after.word > before.word) return true;
  if (after.collected > before.collected) return true;
  if (after.score > before.score) return true;
  if (after.courage < before.courage) return true;
  return after.roundId === before.roundId && before.chosen === null && typeof after.chosen === 'number';
}

const result = {
  game: GAME,
  deleted: DELETED,
  started: false,
  moves: 0,
  action_inputs: [],
  negative_control: { window_ms: 1500, changed: false },
  state_changed: false,
  errors: [],
};
const consoleErrors = [];
const pageErrors = [];
let browser = null;
let reportError = null;

try {
  if (await portAnswering()) throw new Error(`port ${PORT} already in use`);
  mkdirSync(OUT_DIR, { recursive: true });
  startServer();
  await waitForOwnedServer();
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
    window.__oldBrowserInputCount = 0;
    for (const type of ['keydown', 'pointerdown']) {
      window.addEventListener(
        type,
        () => {
          window.__oldBrowserInputCount += 1;
        },
        true,
      );
    }
    delete globalThis.structuredClone;
    delete Array.prototype.at;
    delete Array.prototype.findLastIndex;
    delete Object.hasOwn;
  });

  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(describe(message.text()));
  });
  page.on('pageerror', (error) => pageErrors.push(describe(error)));
  await page.setViewportSize(VIEWPORT);
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 1200 });
  result.absent_in_page = await assertDeleted(page);

  await page.waitForFunction(() => window.__apk3dReady === true, undefined, { timeout: 1200 });
  await page.waitForSelector('[data-game]:not(.soon)', { timeout: 1200 });
  const flat = page.locator('[data-flat]');
  if (!(await flat.isChecked())) await flat.check();
  await page.locator('[data-story]').first().click();
  await page.waitForTimeout(800);
  const card = page.locator(`[data-game="${GAME}"]:not(.soon)`);
  await card.waitFor({ state: 'visible', timeout: 1200 });
  await card.click();
  await page.waitForFunction(() => !document.querySelector('[data-read]')?.disabled, undefined, {
    timeout: 1200,
  });
  await page.locator('[data-read]').click();
  await page.waitForSelector('.reader.on [data-next]', { timeout: 1200 });
  await page.locator('[data-next]').click();
  await page.waitForSelector('[data-start]', { timeout: 1200 });
  await page.locator('[data-start]').click();
  await page.waitForFunction(
    () => window.__apk3d?.renderer?.() === 'phaser' && !!window.__apk3d?.game?.(),
    undefined,
    { timeout: 1200 },
  );
  result.started = true;
  await page.waitForTimeout(1500);
  await page.screenshot({ path: START_PNG, fullPage: true });

  const quietBefore = await actionMark(page);
  await page.waitForTimeout(result.negative_control.window_ms);
  const quietAfter = await actionMark(page);
  result.negative_control.changed = acceptedAction(quietBefore, quietAfter, true);
  if (result.negative_control.changed) throw new Error('action field changed without input');

  const digestBefore = await stateDigest(page);
  const inputs = [
    {
      name: 'canvas click',
      play: async () => {
        const canvas = page.locator('.game-layer canvas').first();
        await canvas.waitFor({ state: 'visible', timeout: 1200 });
        const box = await canvas.boundingBox();
        if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      },
    },
    ...['ArrowRight', 'ArrowLeft', 'ArrowUp', '1', 'ArrowRight'].map((key) => ({
      name: key,
      play: async () => page.keyboard.press(key),
    })),
  ];
  for (const input of inputs) {
    const markBefore = await actionMark(page);
    const eventsBefore = await inputCount(page);
    await input.play();
    await page.waitForTimeout(500);
    const eventsAfter = await inputCount(page);
    const markAfter = await actionMark(page);
    if (eventsAfter > eventsBefore && acceptedAction(markBefore, markAfter, true)) {
      result.moves += 1;
      result.action_inputs.push(input.name);
    }
  }
  await page.waitForTimeout(800);
  assertOwned();
  const digestAfter = await stateDigest(page);
  result.state_changed = digestBefore !== null && digestBefore !== digestAfter;
  if (result.moves < 1) throw new Error('no player-action transition');
  await page.screenshot({ path: MOVE_PNG, fullPage: true });
  result.errors = [...consoleErrors, ...pageErrors];
} catch (error) {
  result.errors = [...consoleErrors, ...pageErrors, describe(error)];
} finally {
  try {
    assertOwned();
  } catch (error) {
    result.errors.push(describe(error));
  }
  if (browser) await browser.close().catch(() => {});
  await stopServer();
  try {
    writeFileSync(CHECK_JSON, `${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    reportError = scrub(error?.message ?? String(error));
  }
}

const ok = result.started === true && result.moves >= 1 && result.errors.length === 0 && !reportError;
if (reportError) console.error(`check: cannot write report: ${reportError}`);
console.log(JSON.stringify(result));
process.exitCode = ok ? 0 : 1;
