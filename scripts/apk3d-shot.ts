/**
 * QC for the standalone host and its 3D games: plays the whole flow in headless Chromium and
 * saves screenshots of each step, in portrait (a 390 x 844 phone) and landscape (1280 x 720).
 *
 *   node --import tsx scripts/apk3d-shot.ts [portrait|landscape|both] [--game <id>] [--story <id>] [--dist] [--2d]
 *
 * The page opens with `?qc=1` (the device gate then accepts headless Chromium's software
 * renderer). The game bot answers from the story data, with one wrong answer on purpose.
 * `--2d` plays the game's 2D (Phaser) view (`?renderer=phaser`), with real drags on its canvas.
 * Output: out/apk3d-shots/<game>/<layout>[-2d]/NN-<step>.png
 */
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';
import { createServer, preview } from 'vite';

const ROOT = process.cwd();
const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const GAME = arg('game') ?? 'monster-encounters';
const STORY = arg('story');
const TWO_D = process.argv.includes('--2d');

async function server() {
  const port = 5190 + Math.floor(Math.random() * 200);
  if (process.argv.includes('--dist')) {
    const p = await preview({ configFile: join(ROOT, 'vite.demo.config.ts'), logLevel: 'error', preview: { port, strictPort: false } });
    return { s: { close: () => p.close() }, url: p.resolvedUrls!.local[0]! };
  }
  const s = await createServer({ configFile: join(ROOT, 'vite.demo.config.ts'), logLevel: 'error', server: { port, strictPort: false, hmr: false } });
  await s.listen();
  return { s, url: s.resolvedUrls!.local[0]! };
}

/** Monster Encounters bot: answers the current challenge from the story (or a wrong option). */
async function answerMonsterEncounters(page: Page, wrong: boolean): Promise<string> {
  return page.evaluate((wrongArg) => {
    const g = (window as unknown as { __apk3dGame: { quest: { state: { challenge: any } }; story: any } }).__apk3dGame;
    const c = g.quest.state.challenge;
    const story = g.story;
    const card = document.querySelector('.card')!;
    if (c.kind === 'sentence') {
      const s = story.sentences.find((x: any) => x.id === c.itemId);
      const used = new Set<string>();
      const order = s.words.map((w: string) => {
        const t = c.tokens.find((k: any) => k.text === w && !used.has(k.id));
        used.add(t.id);
        return t.id;
      });
      if (wrongArg) order.reverse();
      for (const id of order) (card.querySelector(`[data-tok="${CSS.escape(id)}"]`) as HTMLElement).click();
      (card.querySelector('[data-check]') as HTMLElement).click();
      return `sentence ${wrongArg ? 'wrong' : 'right'}`;
    }
    let right = '';
    if (c.kind === 'word') right = story.vocabulary.find((w: any) => w.id === c.itemId).translation;
    else if (c.kind === 'fill') right = story.fills.find((f: any) => f.id === c.itemId).answer.toLowerCase();
    else {
      const q = story.questions.find((x: any) => x.id === c.itemId);
      right = q.options[q.answer];
    }
    const opt = c.options.find((o: any) => (wrongArg ? o.text.toLowerCase() !== right.toLowerCase() : o.text.toLowerCase() === right.toLowerCase()));
    (card.querySelector(`[data-opt="${CSS.escape(opt.id)}"]`) as HTMLElement).click();
    return `${c.kind} ${wrongArg ? 'wrong' : 'right'}`;
  }, wrong);
}

async function playMonsterEncounters(page: Page, shot: (name: string) => Promise<void>): Promise<void> {
  let turn = 0;
  let wrongDone = false;
  let lastPlace = '';
  for (;;) {
    const state = await page.waitForFunction(
      () => {
        const card = document.querySelector('.card.on');
        const res = document.querySelector('.results.on');
        return res ? 'results' : card && !card.querySelector('.feedback') ? 'card' : false;
      },
      undefined,
      { timeout: 120_000, polling: 200 },
    );
    if ((await state.jsonValue()) === 'results') return;
    await page.waitForTimeout(400);
    const place = await page.evaluate(() => document.querySelector('[data-place]')?.textContent ?? '');
    if (place !== lastPlace) {
      lastPlace = place;
      await shot(`encounter-${place.split('·')[0]!.trim().replace('/', 'of')}`);
    }
    turn++;
    const wrong = !wrongDone && turn === 3;
    console.log(`turn   ${turn}: ${await answerMonsterEncounters(page, wrong)}`);
    if (wrong) {
      wrongDone = true;
      await page.waitForSelector('.feedback.bad');
      await page.waitForTimeout(300);
      await shot('feedback-wrong');
      await page.click('[data-action="go"]');
      await page.waitForTimeout(1600);
      await shot('after-wrong');
    } else if (turn === 1) {
      await page.waitForTimeout(900);
      await shot('attack');
    }
    if (turn > 80) throw new Error('Too many turns');
  }
}

const game = '(window.__apk3d.game())';

/** The next word each cauldron needs (the customer's order at that counter spot). */
const NEEDS = `(() => {
  const s = ${game}.state();
  return s.cauldrons.map((c, i) => {
    const slot = s.slots[i];
    if (!slot || c.ready) return null;
    const order = s.orders.find((o) => o.id === (c.orderId ?? slot.orderId));
    return order ? order.words[c.words.length] ?? null : null;
  });
})()`;

/** Potion Rush: one real drag, one wrong drop, then the bot at a person's pace. */
async function playPotionRush(page: Page, shot: (name: string) => Promise<void>): Promise<void> {
  await page.waitForSelector('.order-bubble.on', { timeout: 120_000 });
  await page.waitForTimeout(2500);
  await shot('first-order');
  // One real drag from a word tag to its cauldron.
  for (let tries = 0; tries < 60; tries++) {
    const move = await page.evaluate((needsSrc) => {
      const needs = eval(needsSrc) as (string | null)[];
      const s = (window as any).__apk3d.game().state();
      for (const b of s.belt) {
        const i = needs.findIndex((w) => w && w.toLowerCase() === b.word.toLowerCase());
        const tag = document.querySelector(`[data-item="${b.id}"]`);
        const zone = document.querySelector(`[data-cauldron="${i}"]`);
        if (i < 0 || !tag || !zone || b.position < 0.2 || b.position > 0.85) continue;
        const a = tag.getBoundingClientRect();
        const z = zone.getBoundingClientRect();
        return { from: [a.x + a.width / 2, a.y + a.height / 2], to: [z.x + z.width / 2, z.y + z.height / 2] };
      }
      return null;
    }, NEEDS);
    if (move) {
      await page.mouse.move(move.from[0]!, move.from[1]!);
      await page.mouse.down();
      for (let k = 1; k <= 8; k++) await page.mouse.move(move.from[0]! + ((move.to[0]! - move.from[0]!) * k) / 8, move.from[1]! + ((move.to[1]! - move.from[1]!) * k) / 8);
      await shot('dragging');
      await page.mouse.up();
      await page.waitForTimeout(700);
      await shot('after-drag');
      break;
    }
    await page.waitForTimeout(500);
  }
  // One wrong word on purpose.
  for (let tries = 0; tries < 60; tries++) {
    const done = await page.evaluate((needsSrc) => {
      const needs = eval(needsSrc) as (string | null)[];
      const s = (window as any).__apk3d.game().state();
      const i = needs.findIndex((w) => w);
      const item = s.belt.find((b: any) => i >= 0 && b.word.toLowerCase() !== needs[i]!.toLowerCase() && b.position > 0.2);
      if (!item) return false;
      (window as any).__apk3d.game().dispatch({ type: 'drop', itemId: item.id, cauldron: i });
      return true;
    }, NEEDS);
    if (done) {
      await page.waitForTimeout(250);
      await shot('wrong-word');
      break;
    }
    await page.waitForTimeout(500);
  }
  let readyShot = false;
  let rushShot = false;
  let brewShot = false;
  const started = Date.now();
  for (;;) {
    const state = await page.evaluate(() => {
      if (document.querySelector('.results.on')) return 'results';
      (window as any).__apk3d.game()?.auto();
      return document.querySelector('.rush-sign.on') ? 'rush' : document.querySelector('.drop-zone.ready') ? 'ready' : 'play';
    });
    if (state === 'results') return;
    if (state === 'ready' && !readyShot) {
      readyShot = true;
      await shot('potion-ready');
    }
    if (state === 'rush' && !rushShot) {
      rushShot = true;
      await shot('rush');
    }
    if (!brewShot && Date.now() - started > 12_000) {
      brewShot = true;
      await shot('brewing');
    }
    if (Date.now() - started > 20 * 60_000) throw new Error('The shift did not end in 20 minutes');
    await page.waitForTimeout(700);
  }
}

/**
 * A pointer drag in page pixels: a real finger (CDP touch events) on a phone, the mouse on a wide
 * screen. `during` runs before the release (for a screenshot mid-drag).
 */
async function drag(page: Page, from: number[], to: number[], during: () => Promise<void>): Promise<void> {
  const steps = 8;
  const at = (k: number) => ({ x: from[0]! + ((to[0]! - from[0]!) * k) / steps, y: from[1]! + ((to[1]! - from[1]!) * k) / steps });
  if (page.viewportSize()!.width < 700) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [at(0)] });
    for (let k = 1; k <= steps; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [at(k)] });
    await during();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    return;
  }
  await page.mouse.move(from[0]!, from[1]!);
  await page.mouse.down();
  for (let k = 1; k <= steps; k++) await page.mouse.move(at(k).x, at(k).y);
  await during();
  await page.mouse.up();
}

/** Potion Rush in 2D: one real drag on the canvas (checked), one tap, one wrong drop, then the bot. */
async function playPotionRush2D(page: Page, shot: (name: string) => Promise<void>): Promise<void> {
  await page.waitForFunction(() => (window as any).__apk3d.renderer() === 'phaser' && (window as any).__apk3d.game()?.state().slots.some(Boolean), undefined, { timeout: 120_000, polling: 250 });
  await page.waitForTimeout(2500);
  await shot('first-order');
  /** Page pixels of a game pixel of the 2D canvas. */
  const PAGE = `((x, y) => { const c = document.querySelector('.game-layer canvas'); const r = c.getBoundingClientRect(); const s = window.__apk3d.game().size(); return [r.x + (x * r.width) / s.width, r.y + (y * r.height) / s.height]; })`;
  let dragged = false;
  for (let tries = 0; tries < 60 && !dragged; tries++) {
    const move = await page.evaluate(([needsSrc, pageSrc]) => {
      const needs = eval(needsSrc!) as (string | null)[];
      const toPage = eval(pageSrc!) as (x: number, y: number) => number[];
      const g = (window as any).__apk3d.game();
      const s = g.state();
      const p = g.points();
      for (const it of p.items) {
        const b = s.belt.find((x: any) => x.id === it.id);
        const i = needs.findIndex((w) => w && w.toLowerCase() === it.word.toLowerCase());
        if (i < 0 || !b || b.position < 0.25 || b.position > 0.8) continue;
        return { id: it.id as string, cauldron: i, words: s.cauldrons[i].words.length as number, from: toPage(it.x, it.y), to: toPage(p.cauldrons[i].x, p.cauldrons[i].y) };
      }
      return null;
    }, [NEEDS, PAGE]);
    if (!move) {
      await page.waitForTimeout(500);
      continue;
    }
    await drag(page, move.from, move.to, () => shot('dragging'));
    await page.waitForTimeout(700);
    await shot('after-drag');
    const took = await page.evaluate(({ id, cauldron, words }) => {
      const s = (window as any).__apk3d.game().state();
      return !s.belt.some((b: any) => b.id === id) && (s.cauldrons[cauldron].words.length > words || s.cauldrons[cauldron].ready || s.served > 0);
    }, move);
    console.log(`drag   ${took ? 'the cauldron took the dragged word' : 'FAILED'}`);
    if (!took) throw new Error('A real drag on the 2D canvas did not put the word into its cauldron');
    dragged = true;
  }
  if (!dragged) throw new Error('No word to drag appeared in 30 s');
  // One wrong word on purpose.
  for (let tries = 0; tries < 60; tries++) {
    const done = await page.evaluate((needsSrc) => {
      const needs = eval(needsSrc) as (string | null)[];
      const s = (window as any).__apk3d.game().state();
      const i = needs.findIndex((w) => w);
      const item = s.belt.find((b: any) => i >= 0 && b.word.toLowerCase() !== needs[i]!.toLowerCase() && b.position > 0.2);
      if (!item) return false;
      (window as any).__apk3d.game().dispatch({ type: 'drop', itemId: item.id, cauldron: i });
      return true;
    }, NEEDS);
    if (done) {
      await page.waitForTimeout(250);
      await shot('wrong-word');
      break;
    }
    await page.waitForTimeout(500);
  }
  let readyShot = false;
  let rushShot = false;
  let brewShot = false;
  const started = Date.now();
  for (;;) {
    const state = await page.evaluate(() => {
      if (document.querySelector('.results.on')) return 'results';
      const g = (window as any).__apk3d.game();
      if (!g) return 'play';
      g.auto();
      const s = g.state();
      return s.rush ? 'rush' : s.cauldrons.some((c: any) => c.ready) ? 'ready' : 'play';
    });
    if (state === 'results') return;
    if (state === 'ready' && !readyShot) {
      readyShot = true;
      await shot('potion-ready');
    }
    if (state === 'rush' && !rushShot) {
      rushShot = true;
      await shot('rush');
    }
    if (!brewShot && Date.now() - started > 12_000) {
      brewShot = true;
      await shot('brewing');
    }
    if (Date.now() - started > 20 * 60_000) throw new Error('The shift did not end in 20 minutes');
    await page.waitForTimeout(700);
  }
}

/** Dragon Flight: wait for the first gates (the dragon hovers), then the bot at a person's pace. */
async function playDragonFlight(page: Page, shot: (name: string) => Promise<void>): Promise<void> {
  await page.waitForSelector('.gate-tag', { timeout: 120_000 });
  await page.waitForTimeout(1500);
  await shot('first-gates');
  await page.waitForFunction(() => (window as any).__apk3d.game().state().waiting === true, undefined, { timeout: 120_000, polling: 300 });
  await shot('waiting');
  const shots = new Set<string>();
  const started = Date.now();
  for (;;) {
    const s = await page.evaluate(() => {
      if (document.querySelector('.results.on')) return { phase: 'results', flock: 0 };
      const g = (window as any).__apk3d.game();
      const st = g.state();
      if (st.round && st.round.chosen === null && (st.waiting || st.round.gatesAt - st.distance < 30)) g.auto();
      return { phase: st.phase, flock: st.flock };
    });
    if (s.phase === 'results') return;
    for (const [key, when] of [['flock-3', s.flock >= 3], ['boss', s.phase === 'boss']] as const) {
      if (when && !shots.has(key)) {
        shots.add(key);
        await page.waitForTimeout(key === 'boss' ? 2500 : 600);
        await shot(key);
      }
    }
    if (Date.now() - started > 20 * 60_000) throw new Error('The flight did not end in 20 minutes');
    await page.waitForTimeout(500);
  }
}

/**
 * Arena games (a joystick): the bot steers inside the page every 150 ms, like a steady thumb;
 * screenshots at the start, after the first right word, and whenever a new room or sentence starts.
 */
async function playArena(page: Page, shot: (name: string) => Promise<void>): Promise<void> {
  if (TWO_D) await page.waitForFunction(() => (window as any).__apk3d.renderer() === 'phaser' && (window as any).__apk3d.game()?.state(), undefined, { timeout: 120_000, polling: 250 });
  else await page.waitForSelector('.arena-tag', { timeout: 120_000 });
  await page.waitForTimeout(1500);
  await shot('start');
  // A real finger: a touch drag to the right must move the character (the joystick works).
  if (page.viewportSize()!.width < 700) {
    const pos = () => page.evaluate(() => { const s = (window as any).__apk3d.game().state(); const m = s.hero ?? s.knight ?? s.slime; return m.x as number; });
    const x0 = await pos();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 520 }] });
    for (let k = 1; k <= 8; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200 + k * 9, y: 520 }] });
    await page.waitForTimeout(900);
    await shot('touch-steer');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const x1 = await pos();
    console.log(`touch  steer moved ${(x1 - x0).toFixed(2)} m`);
    if (x1 - x0 < 0.5) throw new Error('A touch drag did not move the character: the joystick does not work');
  }
  await page.evaluate(() => {
    const w = window as any;
    w.__qcBot = setInterval(() => w.__apk3d.game()?.auto(), 150);
  });
  const started = Date.now();
  let lastStage = -1;
  let firstWord = false;
  for (;;) {
    const s = await page.evaluate(() => {
      if (document.querySelector('.results.on')) return null;
      const st = (window as any).__apk3d.game()?.state();
      return st ? { stage: st.room ?? st.sentence ?? st.roundIndex, found: st.next ?? st.roundIndex } : null;
    });
    if (!s) break;
    if (!firstWord && s.found >= 1) {
      firstWord = true;
      await shot('first-word');
    }
    if (s.stage !== lastStage && s.stage > 0 && s.stage <= 3) await shot(`stage-${s.stage + 1}`);
    lastStage = s.stage;
    if (Date.now() - started > 25 * 60_000) throw new Error('The arena game did not end in 25 minutes');
    await page.waitForTimeout(700);
  }
  await page.evaluate(() => clearInterval((window as any).__qcBot));
}

const BOTS: Record<string, (page: Page, shot: (name: string) => Promise<void>) => Promise<void>> = {
  'dungeon-liberator': playArena,
  'devourer-slime': playArena,
  'hero-vs-zombie': playArena,
  'dragon-flight': playDragonFlight,
  'monster-encounters': playMonsterEncounters,
  'potion-rush': playPotionRush,
};

/** The 2D (Phaser) players, for `--2d`. */
const BOTS_2D: Record<string, (page: Page, shot: (name: string) => Promise<void>) => Promise<void>> = {
  'potion-rush': playPotionRush2D,
  'hero-vs-zombie': playArena,
  'devourer-slime': playArena,
  'dungeon-liberator': playArena,
};

async function play(layout: 'portrait' | 'landscape'): Promise<void> {
  const dir = join(ROOT, 'out', 'apk3d-shots', GAME, TWO_D ? `${layout}-2d` : layout);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const { s, url } = await server();
  const browser = await chromium.launch({ args: ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const size = layout === 'portrait' ? { width: 390, height: 844 } : { width: 1280, height: 720 };
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: layout === 'portrait' ? 2 : 1, isMobile: layout === 'portrait', hasTouch: layout === 'portrait' });
  page.setDefaultTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  let n = 0;
  const shot = async (name: string): Promise<void> => {
    const file = join(dir, `${String(++n).padStart(2, '0')}-${name}.png`);
    await page.screenshot({ path: file });
    console.log(`shot   ${file}`);
  };
  await page.goto(`${url}?qc=1${TWO_D ? '&renderer=phaser' : ''}`, { timeout: 180_000 });
  await page.waitForFunction(() => (window as unknown as { __apk3dReady?: boolean }).__apk3dReady === true, undefined, { timeout: 300_000, polling: 500 });
  await page.waitForTimeout(1500);
  if (STORY) await page.click(`[data-story="${STORY}"]`);
  await page.waitForSelector(`[data-game="${GAME}"]`);
  await page.click(`[data-game="${GAME}"]`);
  await page.waitForTimeout(400);
  await shot('selector');
  await page.click('[data-read]');
  await page.waitForSelector('.reader.on .para');
  await page.waitForTimeout(800);
  await shot('reader');
  const vocab = await page.$('.reader .vocab');
  if (vocab) {
    await vocab.click();
    await page.waitForTimeout(300);
    await shot('reader-gloss');
    await page.click('.gloss .close');
  }
  await page.click('[data-next]');
  await page.waitForSelector('.briefing-screen.on [data-start]');
  await page.waitForTimeout(600);
  await shot('briefing');
  await page.click('[data-start]');
  const bot = TWO_D ? BOTS_2D[GAME] : BOTS[GAME];
  if (!bot) throw new Error(`No ${TWO_D ? '2D ' : ''}QC player for ${GAME}`);
  await bot(page, shot);
  await page.waitForTimeout(800);
  await shot('results');
  await page.click('[data-class]');
  await page.waitForTimeout(2600);
  await shot('class-boss');
  const diag = await page.evaluate(() => (window as unknown as { __apk3d: { diagnostics: unknown[] } }).__apk3d.diagnostics);
  console.log(`diagnostics ${diag.length ? JSON.stringify(diag) : 'none'}`);
  console.log(`errors ${errors.length ? errors.join(' | ') : 'none'}`);
  await browser.close();
  await s.close();
}

const which = process.argv.slice(2).find((a) => a === 'portrait' || a === 'landscape' || a === 'both') ?? 'both';
for (const layout of ['portrait', 'landscape'] as const) if (which === 'both' || which === layout) await play(layout);
