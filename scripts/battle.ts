/**
 * The Chibi Quest battle teaser: roster, stills, and the two videos (16:9 and 9:16).
 *
 *   node --import tsx scripts/battle.ts roster                        src/showcase/battle/roster.json
 *   node --import tsx scripts/battle.ts frames 16x9 3 8.5 30          stills at these seconds
 *   node --import tsx scripts/battle.ts record 16x9 [--fps 30] [--from s --to s]
 *   node --import tsx scripts/battle.ts sheet 16x9                    a contact sheet of the video
 *   node --import tsx scripts/battle.ts frames 16x9 36.3 '?cam=px,py,pz,lx,ly,lz,fov'   a still with a fixed camera
 *   node --import tsx scripts/battle.ts thumb 16x9 '?bg=/out/battle/frames/<still>.png'  the thumbnail (thumb.html)
 *   node --import tsx scripts/battle.ts serve                         keep the page up for ?play
 *
 * Output: out/battle/ (frames/, chibi-quest-battle-<format>.mp4 and the silent video). The
 * soundtrack comes from scripts/battle-audio.ts. See docs/guild-battle-teaser.md.
 */
import { execFileSync, spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { performance } from 'node:perf_hooks';
import { chromium } from 'playwright';
import { createServer, type Plugin } from 'vite';

const ROOT = process.cwd();
const OUT = join(ROOT, 'out');
const DIR = join(OUT, 'battle');
mkdirSync(join(DIR, 'frames'), { recursive: true });

type Format = '16x9' | '9x16';
const SIZE: Record<Format, { width: number; height: number }> = {
  '16x9': { width: 1920, height: 1080 },
  '9x16': { width: 1080, height: 1920 },
};
const DURATION = 45;

// ---------------------------------------------------------------- roster
interface RosterEntry {
  name: string;
  side: 'hero' | 'enemy' | 'monster';
  group: string;
  /** Rest-pose bounds in meters: height, width (x), depth (z). */
  height: number;
  width: number;
  depth: number;
  clips: string[];
  presets: string[];
  /** The asset source is committed (accepted by its production run). */
  committed: boolean;
}

/** The necromancer is an enemy (owner decision 2026-09-30), although the catalog also lists it as a hero. */
const NOT_HEROES = new Set(['necromancer']);

function roster(): void {
  const catalog = readFileSync(join(ROOT, 'docs', 'fantasy-world-asset-catalog.tsv'), 'utf8').split('\n');
  const header = catalog[0]!.split('\t');
  const col = (name: string): number => header.indexOf(name);
  const tracked = new Set(
    execFileSync('git', ['ls-files', 'assets'], { encoding: 'utf8' })
      .split('\n')
      .map((f) => f.replace(/^assets\//, '').replace(/\.ts$/, '')),
  );
  const out: RosterEntry[] = [];
  const seen = new Set<string>();
  for (const line of catalog.slice(1)) {
    const cells = line.split('\t');
    const family = cells[col('family')];
    const side = family === 'heroes' ? 'hero' : family === 'enemies' ? 'enemy' : family === 'monsters' ? 'monster' : null;
    if (!side) continue;
    const name = (cells[col('id')] ?? '').split('/').pop()!;
    if (!name || seen.has(name)) continue;
    if (side === 'hero' && NOT_HEROES.has(name)) continue;
    const glb = join(OUT, name, `${name}.glb`);
    const stats = join(OUT, name, 'stats.json');
    if (!existsSync(glb) || !existsSync(stats)) continue;
    const s = JSON.parse(readFileSync(stats, 'utf8')) as { bounds: { size: number[] } };
    const clips = glbClips(glb);
    if (!clips.includes('idle')) continue;
    const tex = join(OUT, name, 'textures');
    const presets = existsSync(tex)
      ? readdirSync(tex)
          .map((f) => /^baseColor\.(.+)\.png$/.exec(f)?.[1])
          .filter((p): p is string => !!p)
          .sort()
      : [];
    seen.add(name);
    out.push({
      name,
      side,
      group: cells[col('group')] ?? '',
      height: +s.bounds.size[1]!.toFixed(3),
      width: +s.bounds.size[0]!.toFixed(3),
      depth: +s.bounds.size[2]!.toFixed(3),
      clips,
      presets,
      committed: tracked.has(name),
    });
  }
  out.sort((a, b) => a.side.localeCompare(b.side) || a.name.localeCompare(b.name));
  // A frozen copy of the cast: production runs rebuild models while the videos render, and
  // both formats must show the same models.
  for (const e of out) {
    const dst = join(DIR, 'cast', e.name);
    mkdirSync(join(dst, 'textures'), { recursive: true });
    copyFileSync(join(OUT, e.name, `${e.name}.glb`), join(dst, `${e.name}.glb`));
    for (const p of e.presets) copyFileSync(join(OUT, e.name, 'textures', `baseColor.${p}.png`), join(dst, 'textures', `baseColor.${p}.png`));
  }
  const file = join(ROOT, 'src', 'showcase', 'battle', 'roster.json');
  writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
  const count = (side: string): number => out.filter((e) => e.side === side).length;
  console.log(`roster ${file}: ${count('hero')} heroes, ${count('enemy')} enemies, ${count('monster')} monsters`);
  const open = out.filter((e) => !e.committed).map((e) => e.name);
  if (open.length) console.log(`  not committed (crowd only, no close-ups): ${open.join(', ')}`);
}

/** Animation names from a GLB's JSON chunk. */
function glbClips(file: string): string[] {
  const buf = readFileSync(file);
  const len = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + len).toString('utf8')) as { animations?: { name: string }[] };
  return (json.animations ?? []).map((a) => a.name);
}

// ---------------------------------------------------------------- page server
const TYPES: Record<string, string> = { '.glb': 'model/gltf-binary', '.png': 'image/png', '.wav': 'audio/wav', '.json': 'application/json', '.mp3': 'audio/mpeg' };

function serveOut(): Plugin {
  return {
    name: 'battle-out',
    configureServer(s) {
      s.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://x');
        if (!url.pathname.startsWith('/out/')) return next();
        const file = normalize(join(OUT, decodeURIComponent(url.pathname.slice(5))));
        if (!file.startsWith(OUT + sep) || !existsSync(file) || !statSync(file).isFile()) {
          res.statusCode = 404;
          res.end('missing');
          return;
        }
        res.setHeader('content-type', TYPES[extname(file)] ?? 'application/octet-stream');
        res.end(readFileSync(file));
      });
    },
  };
}

async function start(port?: number) {
  const server = await createServer({
    root: ROOT,
    configFile: false,
    logLevel: 'error',
    plugins: [serveOut()],
    optimizeDeps: { entries: ['battle.html'] },
    server: { port: port ?? 6100 + Math.floor(Math.random() * 300), strictPort: false, hmr: false, watch: null },
  });
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error('Could not start the page server.');
  return { server, url };
}

async function openPage(url: string, format: Format, query = '') {
  const browser = await chromium.launch({
    args: ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: SIZE[format], deviceScaleFactor: 1 });
  page.setDefaultTimeout(600_000);
  page.on('pageerror', (e) => console.error(`[page] ${e.message}`));
  page.on('console', (m) => {
    if (process.env.BATTLE_DEBUG || m.type() === 'error' || m.type() === 'warning' || m.text().startsWith('battle:')) console.error(`[page] ${m.text()}`);
  });
  page.on('requestfailed', (r) => console.error(`[page] request failed ${r.url()} ${r.failure()?.errorText}`));
  await page.goto(`${url}battle.html?format=${format}${query.replace(/^\?/, '&')}`, { timeout: 300_000 });
  if (process.env.BATTLE_DEBUG) {
    for (let i = 0; i < 24 && !(await page.evaluate(() => window.__battle?.ready === true)); i++) {
      await new Promise((r) => setTimeout(r, 15000));
      console.error(`[debug] ${await page.evaluate(() => document.querySelector('.loading-bar i')?.getAttribute('style') ?? 'no bar')} ${await page.evaluate(() => document.body.innerText.slice(0, 300))}`);
    }
  }
  await page.waitForFunction(() => window.__battle?.ready === true, undefined, { timeout: 1_200_000, polling: 1000 });
  await page.evaluate(() => document.fonts.ready);
  return { browser, page };
}

const fmtT = (t: number): string => t.toFixed(2).padStart(6, '0');
const clock = (t: number): string => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

async function frames(format: Format, times: number[], query = ''): Promise<void> {
  const { server, url } = await start();
  const t0 = performance.now();
  const { browser, page } = await openPage(url, format, query);
  console.log(`loaded in ${((performance.now() - t0) / 1000).toFixed(1)} s`);
  writeFileSync(join(DIR, `info-${format}.json`), JSON.stringify(await page.evaluate(() => window.__battle!.info()), null, 1));
  for (const t of times) {
    const t1 = performance.now();
    await page.evaluate((x) => window.__battle!.seek(x), t);
    const file = join(DIR, 'frames', `${format}-t${fmtT(t)}.png`);
    await page.screenshot({ path: file });
    console.log(`frame  ${file}  ${((performance.now() - t1) / 1000).toFixed(2)} s`);
  }
  await browser.close();
  await server.close();
}

async function record(format: Format, fps: number, from: number, to: number): Promise<void> {
  const { server, url } = await start();
  const { browser, page } = await openPage(url, format);
  const silent = join(DIR, `chibi-quest-battle-${format}.silent.mp4`);
  const ff = spawn(
    'ffmpeg',
    ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-vf', 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-movflags', '+faststart', silent],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  );
  const n = Math.round((to - from) * fps);
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    const t = from + i / fps;
    await page.evaluate((x) => window.__battle!.seek(x), t);
    const jpg = await page.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % (fps * 2) === 0) {
      const el = (performance.now() - t0) / 1000;
      const eta = i > 0 ? (el / i) * (n - i) : 0;
      console.log(`record ${format} ${clock(t)} / ${clock(to)}  frame ${i}/${n}  ${i > 0 ? (el / i).toFixed(2) : '-'} s/frame  eta ${Math.round(eta / 60)} min`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  await server.close();
  console.log(`video  ${silent}`);
  mux(format);
}

/** The picture with the soundtrack. */
function mux(format: Format): void {
  const silent = join(DIR, `chibi-quest-battle-${format}.silent.mp4`);
  const wav = join(DIR, 'soundtrack.wav');
  if (!existsSync(silent) || !existsSync(wav)) {
    console.log('mux: the silent video or out/battle/soundtrack.wav is missing');
    return;
  }
  const final = join(DIR, `chibi-quest-battle-${format}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final], { stdio: 'inherit' });
  console.log(`video  ${final}  (with soundtrack)`);
}

/** A contact sheet: one frame every 1.5 s of the finished video. */
function sheet(format: Format): void {
  const video = join(DIR, `chibi-quest-battle-${format}.silent.mp4`);
  const file = join(DIR, `sheet-${format}.png`);
  const tile = format === '16x9' ? { w: 384, cols: 6 } : { w: 216, cols: 10 };
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-vf', `fps=1/1.5,scale=${tile.w}:-1,tile=${tile.cols}x${Math.ceil(DURATION / 1.5 / tile.cols)}`, '-frames:v', '1', file], { stdio: 'inherit' });
  console.log(`sheet  ${file}`);
}

/** The thumbnail: thumb.html (the dressing) over a still. Writes thumb-<format>.png and a .jpg to upload. */
async function thumb(format: Format, query: string): Promise<void> {
  const { server, url } = await start();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: SIZE[format], deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error(`[page] ${e.message}`));
  page.on('requestfailed', (r) => console.error(`[page] request failed ${r.url()} ${r.failure()?.errorText}`));
  await page.goto(`${url}thumb.html?format=${format}${query.replace(/^\?/, '&')}`);
  await page.waitForFunction(() => window.__thumb?.ready === true, undefined, { timeout: 120_000 });
  const png = join(DIR, `thumb-${format}.png`);
  await page.screenshot({ path: png });
  await browser.close();
  await server.close();
  // YouTube thumbnails: 1280 x 720 and 2 MB at most. Reels and Shorts covers: 1080 x 1920.
  const jpg = join(DIR, `thumb-${format}.jpg`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-vf', `scale=${format === '16x9' ? '1280:720' : '1080:1920'}:flags=lanczos`, '-q:v', '2', jpg], { stdio: 'inherit' });
  console.log(`thumb  ${png}\nthumb  ${jpg}  ${(statSync(jpg).size / 1e6).toFixed(2)} MB`);
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  const flag = (name: string, def: number): number => {
    const i = rest.indexOf(`--${name}`);
    return i >= 0 ? Number(rest[i + 1]) : def;
  };
  const format = (rest[0] === '9x16' ? '9x16' : '16x9') as Format;
  if (cmd === 'roster') roster();
  else if (cmd === 'frames') {
    const q = rest.find((r) => r.startsWith('?')) ?? '';
    await frames(format, rest.slice(1).map(Number).filter((x) => Number.isFinite(x)), q);
  } else if (cmd === 'record') await record(format, flag('fps', 30), flag('from', 0), flag('to', DURATION));
  else if (cmd === 'mux') mux(format);
  else if (cmd === 'sheet') sheet(format);
  else if (cmd === 'thumb') await thumb(format, rest.find((r) => r.startsWith('?')) ?? '');
  else if (cmd === 'serve') {
    const { url } = await start(5174);
    console.log(`open ${url}battle.html?play&format=${format}`);
  } else console.log('usage: battle.ts roster | frames <16x9|9x16> <t...> [?query] | record <16x9|9x16> | mux <format> | sheet <format> | thumb <format> ?bg=... | serve');
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
