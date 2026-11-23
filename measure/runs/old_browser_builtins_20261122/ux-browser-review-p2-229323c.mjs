/**
 * Phase 2 UX browser probe: the demo flows with the four targeted built-ins present (pass A) and
 * deleted before any page script runs (pass B). Run it against the demo dev server on
 * http://127.0.0.1:5199/demo/ at HEAD 229323c5d822f1dcb480b8e5ccf767c98a6f0c75.
 *
 * Per pass it reaches, through the demo UI only, Dragon Flight 2D, Dragon Rider 2D,
 * Spellweavers Run 2D, Spellweavers Run 3D, and one host reader flow (src/host/reader.ts).
 * Each case starts the game, plays moves with the keyboard, takes one screenshot, one
 * accessibility snapshot, and records every console error and page error.
 *
 * `?qc=1` lets the device gate accept the headless software renderer, so the 3D edition can run.
 * The 2D edition is chosen through the selector's "flat" checkbox, which is the UI's 2D setting.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const ROOT = '/home/daniebo/Desktop/advantage-forge';
const OUT_DIR = `${ROOT}/measure/runs/old_browser_builtins_20261122`;
const BASE = 'http://127.0.0.1:5199/demo/index.html';
const URL = `${BASE}?qc=1`;
const PREFIX = 'ux-browser-review-p2-229323c';
const OUTPUT = `${OUT_DIR}/${PREFIX}-probe.json`;
const VIEWPORT = { width: 1280, height: 800 };
const AUDITED_HEAD = '229323c5d822f1dcb480b8e5ccf767c98a6f0c75';
const DELETED = ['structuredClone', 'Array.prototype.at', 'Array.prototype.findLastIndex', 'Object.hasOwn'];
const GAME_OF = {
  'dragon-flight': 'Dragon Flight',
  'dragon-rider': 'Dragon Rider',
  'spellweavers-run': 'Spellweavers Run',
};
const GAME_CASES = [
  { id: 'dragon-flight', title: 'Dragon Flight', renderer: 'phaser', label: 'dragon-flight-2d' },
  { id: 'dragon-rider', title: 'Dragon Rider', renderer: 'phaser', label: 'dragon-rider-2d' },
  { id: 'spellweavers-run', title: 'Spellweavers Run', renderer: 'phaser', label: 'spellweavers-run-2d' },
  { id: 'spellweavers-run', title: 'Spellweavers Run', renderer: 'three', label: 'spellweavers-run-3d' },
];
const PASSES = [
  { id: 'A', name: 'normal', deleteBuiltins: false },
  { id: 'B', name: 'deleted-builtins', deleteBuiltins: true },
];

const git = (args) => execSync(`git ${args}`, { cwd: ROOT, encoding: 'utf8' }).trim();

mkdirSync(OUT_DIR, { recursive: true });

/** The in-page assertion that the four globals are absent. */
async function verifyDeleted(page) {
  return page.evaluate((names) => {
    const at = (path) => {
      if (path === 'structuredClone') return typeof globalThis.structuredClone;
      if (path === 'Object.hasOwn') return typeof Object.hasOwn;
      if (path === 'Array.prototype.at') return typeof Array.prototype.at;
      if (path === 'Array.prototype.findLastIndex') return typeof Array.prototype.findLastIndex;
      return 'unknown';
    };
    return Object.fromEntries(names.map((name) => [name, { type: at(name), absent: at(name) === 'undefined' }]));
  }, DELETED);
}

/** A bounded fingerprint of the mounted game state, so a move that changes it is visible. */
async function stateDigest(page) {
  return page.evaluate(() => {
    const game = window.__apk3d?.game?.();
    if (!game) return { ok: false, reason: 'no-game-hook' };
    try {
      const state = game.state?.();
      const json = JSON.stringify(state);
      if (typeof json !== 'string') return { ok: false, reason: 'state-not-json' };
      return { ok: true, length: json.length, sample: json.slice(0, 600) };
    } catch (error) {
      return { ok: false, reason: String(error) };
    }
  });
}

/** The visible DOM outline: a canvas-only edition has an empty accessibility tree, this shows it. */
async function domOutline(page) {
  return page.evaluate(() => {
    const canvases = [...document.querySelectorAll('canvas')]
      .filter((c) => c.getClientRects().length > 0)
      .map((c) => {
        const box = c.getBoundingClientRect();
        return { width: c.width, height: c.height, css: [Math.round(box.width), Math.round(box.height)] };
      });
    return { canvases, visible_text: document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 400) };
  });
}

/** Opens the selector and chooses the story and the game through the UI. */
async function chooseInSelector(page, { renderer, gameId }) {
  page.setDefaultTimeout(90000);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => window.__apk3dReady === true, undefined, { timeout: 90000 });
  await page.waitForSelector('[data-story]', { timeout: 60000 });
  await page.waitForSelector('[data-game]:not(.soon)', { timeout: 60000 });
  const flat = page.locator('[data-flat]');
  if (renderer === 'phaser') {
    if (!(await flat.isChecked())) await flat.check();
  } else if (await flat.isChecked()) {
    await flat.uncheck();
  }
  const story = page.locator('[data-story]').first();
  await story.scrollIntoViewIfNeeded();
  await story.click();
  // setStory re-renders the game strip asynchronously; wait for the card of this story.
  await page.waitForTimeout(800);
  const card = gameId ? page.locator(`[data-game="${gameId}"]:not(.soon)`) : page.locator('[data-game]:not(.soon)').first();
  await card.waitFor({ state: 'visible', timeout: 60000 });
  const title = (await card.innerText()).replace(/\s+/g, ' ').trim();
  await card.click();
  await page.waitForTimeout(300);
  const selected = gameId ? await page.locator(`[data-game="${gameId}"].sel`).count() : 1;
  if (!selected) throw new Error(`The game card ${gameId} did not become the selector choice.`);
  const read = page.locator('[data-read]');
  await read.waitFor({ state: 'visible', timeout: 60000 });
  await page.waitForFunction(() => !document.querySelector('[data-read]')?.disabled, undefined, { timeout: 60000 });
  return { story_title: (await story.innerText()).replace(/\s+/g, ' ').trim(), game_title: title };
}

/** Opens the host reader from the selector and returns what the reader rendered. */
async function reachReader(page, { renderer, gameId }) {
  const choice = await chooseInSelector(page, { renderer, gameId });
  await page.locator('[data-read]').click();
  await page.waitForSelector('.reader.on [data-next]', { timeout: 60000 });
  await page.waitForTimeout(700);
  return {
    choice,
    url_after_read: page.url(),
    paragraphs: await page.locator('.reader .para').count(),
    vocab_buttons: await page.locator('.reader .vocab').count(),
    read_to_me_buttons: await page.locator('.reader [data-read]').count(),
    story_title: (await page.locator('.reader h1').first().innerText().catch(() => '')).trim(),
  };
}

/** Advances the open reader to the game briefing and starts the game. */
async function startGame(page, { renderer }) {
  const steps = [];
  await page.waitForSelector('.reader.on [data-next]', { timeout: 60000 });
  await page.locator('[data-next]').click();
  steps.push('Clicked the reader Next button to open the game briefing.');
  await page.waitForSelector('[data-start]', { timeout: 90000 });
  await page.locator('[data-start]').click();
  steps.push(`Clicked Start with the ${renderer} renderer expected.`);
  await page.waitForFunction(
    (expected) => window.__apk3d?.renderer?.() === expected,
    renderer,
    { timeout: 180000 },
  );
  await page.waitForFunction(() => !!window.__apk3d?.game?.(), undefined, { timeout: 180000 });
  const actual = await page.evaluate(() => window.__apk3d.renderer());
  return { steps, renderer_actual: actual };
}

/** Keyboard moves for the answer-choice games, and a pointer gesture where a canvas exists. */
async function playMoves(page, renderer) {
  const moves = [];
  if (renderer === 'phaser') {
    const canvas = page.locator('.game-layer canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 60000 });
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      moves.push({ input: 'pointer', detail: 'clicked the 2D canvas center' });
      await page.waitForTimeout(250);
    }
  }
  for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowUp', '1', 'ArrowRight']) {
    await page.keyboard.press(key);
    moves.push({ input: 'key', detail: key });
    await page.waitForTimeout(400);
  }
  return moves;
}

async function runGameCase(context, pass, entry) {
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.stack ?? String(error)));
  const screenshot = `${OUT_DIR}/${PREFIX}-pass-${pass.id.toLowerCase()}-${entry.label}.png`;
  const result = {
    pass: pass.id,
    builtins_deleted: pass.deleteBuiltins,
    game: entry.id,
    title: entry.title,
    renderer: entry.renderer,
    reached: false,
    started: false,
    moves: [],
    errors: [],
    console_errors: consoleErrors,
    page_errors: pageErrors,
    screenshot,
    accessibility_snapshot: null,
    state_before: null,
    state_after: null,
    interactions: [],
  };
  try {
    await page.setViewportSize(VIEWPORT);
    const reader = await reachReader(page, { renderer: entry.renderer, gameId: entry.id });
    result.interactions.push(
      `Opened the selector, chose the story ${reader.story_title}, set the ${entry.renderer} renderer, and chose the game card ${entry.id}.`,
    );
    const started = await startGame(page, { renderer: entry.renderer });
    result.interactions.push(...started.steps);
    result.renderer_actual = started.renderer_actual;
    result.started = true;
    await page.waitForTimeout(entry.renderer === 'three' ? 2500 : 1500);
    result.state_before = await stateDigest(page);
    result.moves = await playMoves(page, entry.renderer);
    await page.waitForTimeout(1400);
    result.state_after = await stateDigest(page);
    result.moved = JSON.stringify(result.state_before) !== JSON.stringify(result.state_after);
    result.reached = true;
    await page.screenshot({ path: screenshot, fullPage: true });
    result.accessibility_snapshot = await page.locator('body').ariaSnapshot();
    result.accessibility_snapshot_chars = result.accessibility_snapshot.length;
    result.accessibility_note = result.accessibility_snapshot.length
      ? null
      : 'The accessibility tree of the body holds no node. The 2D edition draws its HUD and all content in the Phaser canvas.';
    result.dom = await domOutline(page);
  } catch (error) {
    result.failure = error.stack ?? String(error);
    await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
    result.accessibility_snapshot = await page.locator('body').ariaSnapshot().catch(() => null);
  } finally {
    result.errors = [...consoleErrors, ...pageErrors];
    await page.close().catch(() => {});
  }
  return result;
}

async function runReaderCase(context, pass) {
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.stack ?? String(error)));
  const screenshot = `${OUT_DIR}/${PREFIX}-pass-${pass.id.toLowerCase()}-host-reader.png`;
  const result = {
    pass: pass.id,
    builtins_deleted: pass.deleteBuiltins,
    game: 'host-reader',
    title: 'Host reader (src/host/reader.ts)',
    renderer: 'dom',
    reached: false,
    started: false,
    moves: [],
    errors: [],
    console_errors: consoleErrors,
    page_errors: pageErrors,
    screenshot,
    accessibility_snapshot: null,
    interactions: [],
  };
  try {
    await page.setViewportSize(VIEWPORT);
    const reader = await reachReader(page, { renderer: 'phaser' });
    result.reader = reader;
    result.started = true;
    result.moves.push({ input: 'click', detail: 'clicked Read; the reader opened at the first paragraph' });
    const vocab = page.locator('.reader .vocab').first();
    if (await vocab.count()) {
      await vocab.click();
      await page.waitForSelector('.gloss.on', { timeout: 15000 });
      result.moves.push({ input: 'click', detail: 'clicked a story word; the glossary dialog opened' });
      result.gloss_open = true;
      await page.locator('.gloss .close').click();
    }
    const th = page.locator('[data-th="0"]').first();
    if (await th.count()) {
      await th.click();
      result.translation_shown = await page.locator('[data-p="0"] .th').first().isVisible();
      result.moves.push({ input: 'click', detail: 'toggled the paragraph translation' });
    }
    const readToMe = page.locator('[data-read="0"]').first();
    if (await readToMe.count()) {
      await readToMe.click();
      result.moves.push({ input: 'click', detail: 'started read-aloud on paragraph 1 (the reader lastIndexWhere path)' });
      await page.waitForTimeout(1500);
      result.sentence_marked = (await page.locator('.reader .sent.on').count()) > 0;
      await readToMe.click();
      result.moves.push({ input: 'click', detail: 'stopped read-aloud' });
      await page.waitForTimeout(300);
    }
    result.reached = true;
    await page.screenshot({ path: screenshot, fullPage: true });
    result.accessibility_snapshot = await page.locator('body').ariaSnapshot();
    result.accessibility_snapshot_chars = result.accessibility_snapshot.length;
    result.accessibility_note = result.accessibility_snapshot.length
      ? null
      : 'The accessibility tree of the body holds no node. The 2D edition draws its HUD and all content in the Phaser canvas.';
    result.dom = await domOutline(page);
  } catch (error) {
    result.failure = error.stack ?? String(error);
    await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
    result.accessibility_snapshot = await page.locator('body').ariaSnapshot().catch(() => null);
  } finally {
    result.errors = [...consoleErrors, ...pageErrors];
    await page.close().catch(() => {});
  }
  return result;
}

const headStart = git('rev-parse HEAD');
const nonMeasureDiff = git(`diff --stat ${AUDITED_HEAD} ${headStart} -- . ':!measure'`);
const nonMeasureFiles = git(`diff --name-status ${AUDITED_HEAD} ${headStart} -- . ':!measure'`);
const trackedOutsideMeasure = git('status --porcelain --untracked-files=no -- . \':!measure\'');
const summary = {
  schema_version: 1,
  role: 'ux-browser-review',
  track: 'old_browser_builtins_20261122',
  phase: 'Phase 2',
  baseline_sha: '3f6a19214994e7ac05a79a8fa7faeded684267b7',
  audited_head_sha: AUDITED_HEAD,
  head_at_probe_start: headStart,
  head_matches_audited: headStart === AUDITED_HEAD,
  non_measure_diff_audited_to_head: nonMeasureDiff,
  non_measure_diff_empty: nonMeasureDiff === '',
  non_measure_diff_files: nonMeasureFiles,
  tracked_changes_outside_measure: trackedOutsideMeasure,
  base_url: URL,
  browser: 'Chromium headless, Playwright',
  viewport: VIEWPORT,
  deleted_builtins: DELETED,
  note: '?qc=1 makes the device gate accept the headless software renderer, so the 3D edition can mount.',
  passes: [],
};

const browser = await chromium.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
});
try {
  for (const pass of PASSES) {
    const context = await browser.newContext({ viewport: VIEWPORT });
    await context.addInitScript(
      ({ builtins, remove }) => {
        try {
          localStorage.clear();
        } catch {
          // A blocked storage area changes nothing for this probe.
        }
        if (remove) {
          delete globalThis.structuredClone;
          delete Array.prototype.at;
          delete Array.prototype.findLastIndex;
          delete Object.hasOwn;
        }
        window.__probeBuiltins = Object.fromEntries(
          builtins.map((name) => {
            const type =
              name === 'structuredClone'
                ? typeof globalThis.structuredClone
                : name === 'Object.hasOwn'
                  ? typeof Object.hasOwn
                  : name === 'Array.prototype.at'
                    ? typeof Array.prototype.at
                    : typeof Array.prototype.findLastIndex;
            return [name, { type, absent: type === 'undefined' }];
          }),
        );
      },
      { builtins: DELETED, remove: pass.deleteBuiltins },
    );
    const passResult = {
      id: pass.id,
      name: pass.name,
      builtins_deleted: pass.deleteBuiltins,
      init_script_assertion: null,
      cases: [],
    };
    for (const entry of GAME_CASES) {
      passResult.cases.push(await runGameCase(context, pass, entry));
    }
    passResult.cases.push(await runReaderCase(context, pass));
    const first = await context.newPage();
    await first.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await first.waitForFunction(() => window.__apk3dReady === true, undefined, { timeout: 90000 });
    passResult.init_script_assertion = await first.evaluate(() => window.__probeBuiltins ?? null);
    passResult.after_navigation_assertion = await verifyDeleted(first);
    await first.close();
    passResult.summary = {
      cases: passResult.cases.length,
      reached: passResult.cases.filter((c) => c.reached).length,
      with_errors: passResult.cases.filter((c) => c.errors.length > 0).length,
    };
    summary.passes.push(passResult);
  }
} finally {
  await browser.close();
}

summary.summary = {
  passes: summary.passes.length,
  cases: summary.passes.reduce((n, p) => n + p.cases.length, 0),
  reached: summary.passes.reduce((n, p) => n + p.cases.filter((c) => c.reached).length, 0),
  with_errors: summary.passes.reduce((n, p) => n + p.cases.filter((c) => c.errors.length > 0).length, 0),
  all_reached: summary.passes.every((p) => p.cases.every((c) => c.reached)),
  all_clean: summary.passes.every((p) => p.cases.every((c) => c.errors.length === 0)),
};
summary.head_at_probe_end = git('rev-parse HEAD');
summary.non_measure_diff_audited_to_end_head = git(`diff --stat ${AUDITED_HEAD} ${summary.head_at_probe_end} -- . ':!measure'`);

writeFileSync(OUTPUT, `${JSON.stringify(summary, null, 2)}\n`);
for (const pass of summary.passes) {
  for (const c of pass.cases) {
    console.log(
      `${pass.id} ${c.game}/${c.renderer} reached=${c.reached} started=${c.started} moves=${c.moves.length} errors=${c.errors.length}` +
        (c.failure ? ` failure=${c.failure.split('\n')[0]}` : ''),
    );
  }
}
console.log(JSON.stringify(summary.summary));
process.exitCode = summary.summary.all_reached && summary.summary.all_clean ? 0 : 1;
