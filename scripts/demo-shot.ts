/**
 * QC for the Monster Encounters demo: plays the whole game in headless Chromium and saves
 * screenshots of each step, in portrait (a 390 x 844 phone) and landscape (1280 x 720).
 *
 *   node --import tsx scripts/demo-shot.ts [portrait|landscape|both] [story-index]
 *
 * It answers every challenge correctly from the story data, except one wrong answer on purpose
 * (so the feedback path is covered too). Output: out/demo-shots/<layout>/NN-<step>.png
 */
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';
import { createServer, preview } from 'vite';

const ROOT = process.cwd();
const OUT = join(ROOT, 'out', 'demo-shots');

/** The dev server, or with --dist the production build in dist-demo/ (as GitHub Pages serves it). */
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

/** Answers the current challenge; `wrong` picks a wrong option instead. */
async function answer(page: Page, wrong: boolean): Promise<string> {
  return page.evaluate((wrongArg) => {
    const d = (window as unknown as { __demo: { quest: { state: { challenge: any } }; pack: any } }).__demo;
    const c = d.quest.state.challenge;
    const pack = d.pack;
    const card = document.querySelector('.card')!;
    if (c.kind === 'sentence') {
      const s = pack.sentences.find((x: any) => x.id === c.itemId);
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
    if (c.kind === 'word') right = pack.vocabulary.find((w: any) => w.id === c.itemId).th;
    else if (c.kind === 'fill') right = pack.fills.find((f: any) => f.id === c.itemId).answer.toLowerCase();
    else {
      const q = pack.questions.find((x: any) => x.id === c.itemId);
      right = q.options[q.answer];
    }
    const opt = c.options.find((o: any) => (wrongArg ? o.text.toLowerCase() !== right.toLowerCase() : o.text.toLowerCase() === right.toLowerCase()));
    (card.querySelector(`[data-opt="${CSS.escape(opt.id)}"]`) as HTMLElement).click();
    return `${c.kind} ${wrongArg ? 'wrong' : 'right'}`;
  }, wrong);
}

async function play(layout: 'portrait' | 'landscape', story: number): Promise<void> {
  const dir = join(OUT, layout);
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
  await page.goto(url, { timeout: 180_000 });
  await page.waitForFunction(() => (window as unknown as { __demoReady?: boolean }).__demoReady === true, undefined, { timeout: 300_000, polling: 500 });
  await page.waitForTimeout(1500);
  await shot('title');
  await page.click(`[data-story="${story}"]`);
  await page.click('[data-read]');
  await page.waitForSelector('.reader.on .para');
  await page.waitForTimeout(800);
  await shot('reader');
  await page.click('.reader .vocab');
  await page.waitForTimeout(300);
  await shot('reader-gloss');
  await page.click('.gloss .close');
  await page.click('[data-th="0"]');
  await page.waitForTimeout(200);
  await shot('reader-thai');
  await page.click('[data-start]');
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
    const what = await state.jsonValue();
    if (what === 'results') break;
    await page.waitForTimeout(400);
    const place = await page.evaluate(() => document.querySelector('[data-place]')?.textContent ?? '');
    if (place !== lastPlace) {
      lastPlace = place;
      await shot(`encounter-${place.split('·')[0]!.trim().replace('/', 'of')}`);
    }
    turn++;
    const wrong = !wrongDone && turn === 3;
    const did = await answer(page, wrong);
    console.log(`turn   ${turn}: ${did}`);
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
  await page.waitForTimeout(800);
  await shot('results');
  await page.click('[data-class]');
  await page.waitForTimeout(2600);
  await shot('class-boss');
  console.log(`errors ${errors.length ? errors.join(' | ') : 'none'}`);
  await browser.close();
  await s.close();
}

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const which = args[0] ?? 'both';
const story = Number(args[1] ?? 0);
for (const layout of ['portrait', 'landscape'] as const) if (which === 'both' || which === layout) await play(layout, story);
