/**
 * The Storytime song recorder: the Sprout cast in the classroom, on the timeline of Workbooks'
 * spec.json and Storytime's stage.json (`src/song/timeline.ts`), as a silent video or stills.
 *
 *   node --import tsx scripts/song-record.ts record <spec.json> <stage.json> --out <dir> [--fps 24] [--from s --to s] [--portrait] [--frames]
 *   node --import tsx scripts/song-record.ts stills <spec.json> <stage.json> --out <dir> --at 0,12,20 [--portrait]
 *   node --import tsx scripts/song-record.ts sheet  <spec.json> <stage.json> --out <dir> [--count 12] [--portrait]
 *
 * record: <dir>/song.mp4 (1920x1080, H.264 yuv420p, no sound; video t = song t) or song-phone.mp4
 *   (1080x1920) with --portrait; --frames also keeps JPEG frames in <dir>/frames/.
 * stills: <dir>/still-<t>.png.  sheet: <count> stills at even times, tiled into <dir>/sheet.png.
 * Every run appends to <dir>/render.txt (timeline, page notes, timing).
 * Heavy: run under `flock ~/Desktop/primary-parity-progress/heavy.lock`, one at a time.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, appendFileSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { performance } from 'node:perf_hooks';
import { chromium, type Page } from 'playwright';
import { createServer, type Plugin } from 'vite';
import { buildTimeline, describe, type Spec, type Stage, type Timeline } from '../src/song/timeline.js';

const ROOT = process.cwd();
const OUT = join(ROOT, 'out');
const TYPES: Record<string, string> = { '.glb': 'model/gltf-binary', '.png': 'image/png', '.json': 'application/json' };

function serveOut(): Plugin {
  return {
    name: 'song-out',
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

interface Opts {
  out: string;
  fps: number;
  from: number;
  to: number | null;
  portrait: boolean;
  frames: boolean;
  at: number[];
  count: number;
}

function parseArgs(argv: string[]): { command: string; spec: string; stage: string; opts: Opts } {
  const [command, spec, stage, ...rest] = argv;
  if (!command || !spec || !stage) throw new Error('Usage: song-record.ts record|stills|sheet <spec.json> <stage.json> --out <dir> [options]');
  const opts: Opts = { out: '', fps: 24, from: 0, to: null, portrait: false, frames: false, at: [], count: 12 };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]!;
    const v = (): string => rest[++i] ?? '';
    if (a === '--out') opts.out = v();
    else if (a === '--fps') opts.fps = Number(v());
    else if (a === '--from') opts.from = Number(v());
    else if (a === '--to') opts.to = Number(v());
    else if (a === '--portrait') opts.portrait = true;
    else if (a === '--frames') opts.frames = true;
    else if (a === '--at') opts.at = v().split(',').map(Number);
    else if (a === '--count') opts.count = Number(v());
    else throw new Error(`Unknown option ${a}`);
  }
  if (!opts.out) throw new Error('--out <dir> is required');
  return { command, spec, stage, opts };
}

async function openPage(portrait: boolean): Promise<{ page: Page; close: () => Promise<void> }> {
  const server = await createServer({
    root: ROOT,
    configFile: false,
    logLevel: 'error',
    plugins: [serveOut()],
    server: { port: 5900 + Math.floor(Math.random() * 300), strictPort: false, hmr: false, watch: null },
  });
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error('Could not start the page server.');
  const browser = await chromium.launch({ args: ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const size = portrait ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
  page.setDefaultTimeout(300_000);
  page.on('pageerror', (e) => console.error(`[page] ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') console.error(`[page] ${m.text()}`);
  });
  await page.goto(`${url}song.html${portrait ? '?portrait' : ''}`, { timeout: 180_000 });
  await page.waitForFunction(() => window.__song?.ready === true, undefined, { timeout: 600_000, polling: 500 });
  return {
    page,
    close: async () => {
      await browser.close();
      await server.close();
    },
  };
}

const clock = (t: number): string => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

function ffmpeg(args: string[], stdin: 'pipe' | 'ignore' = 'ignore'): ReturnType<typeof spawn> {
  return spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: [stdin, 'inherit', 'inherit'] });
}
const done = (p: ReturnType<typeof spawn>): Promise<void> =>
  new Promise((res, rej) => p.on('close', (code) => (code === 0 ? res() : rej(new Error(`ffmpeg exit ${code}`)))));

async function main(): Promise<void> {
  const { command, spec: specPath, stage: stagePath, opts } = parseArgs(process.argv.slice(2));
  const spec = JSON.parse(readFileSync(resolve(specPath), 'utf8')) as Spec;
  const stage = JSON.parse(readFileSync(resolve(stagePath), 'utf8')) as Stage;
  const tl: Timeline = buildTimeline(spec, stage);
  mkdirSync(opts.out, { recursive: true });
  const log = join(opts.out, 'render.txt');
  const note = (s: string): void => {
    console.log(s);
    appendFileSync(log, s + '\n');
  };
  note(`\n# ${command} ${new Date().toISOString()}  spec ${specPath}  stage ${stagePath}${opts.portrait ? '  portrait' : ''}`);
  note(describe(tl));

  const t0 = performance.now();
  const { page, close } = await openPage(opts.portrait);
  const notes = await page.evaluate((data) => window.__song!.load(data), tl);
  for (const n of notes) note(`page: ${n}`);
  note(`page ready in ${Math.round((performance.now() - t0) / 1000)} s`);

  const still = async (t: number, file: string): Promise<void> => {
    await page.evaluate((x) => window.__song!.seek(x), t);
    await page.screenshot({ path: file, type: 'png' });
  };

  if (command === 'stills' || command === 'sheet') {
    const times = command === 'stills' ? opts.at : Array.from({ length: opts.count }, (_, i) => ((i + 0.5) * tl.duration) / opts.count);
    const files: string[] = [];
    for (const t of times) {
      const file = join(opts.out, `still-${t.toFixed(2).padStart(6, '0')}.png`);
      await still(t, file);
      files.push(file);
      note(`still ${clock(t)} ${file}`);
    }
    if (command === 'sheet') {
      const cols = 4;
      const rows = Math.ceil(files.length / cols);
      const inputs = files.flatMap((f) => ['-i', f]);
      const scale = opts.portrait ? 'scale=-1:480' : 'scale=480:-1';
      const filter = `${files.map((_, i) => `[${i}:v]${scale}[v${i}]`).join(';')};${files.map((_, i) => `[v${i}]`).join('')}concat=n=${files.length}:v=1:a=0,tile=${cols}x${rows}:padding=4:color=white[out]`;
      const sheet = join(opts.out, 'sheet.png');
      await done(ffmpeg([...inputs, '-filter_complex', filter, '-map', '[out]', sheet]));
      note(`sheet ${rows}x${cols} ${sheet}`);
    }
  } else if (command === 'record') {
    const from = opts.from;
    const to = opts.to ?? tl.duration;
    const n = Math.round((to - from) * opts.fps);
    const video = join(opts.out, opts.portrait ? 'song-phone.mp4' : 'song.mp4');
    if (opts.frames) mkdirSync(join(opts.out, 'frames'), { recursive: true });
    const ff = ffmpeg(
      ['-f', 'image2pipe', '-framerate', String(opts.fps), '-c:v', 'mjpeg', '-i', '-',
        '-vf', 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
        '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-movflags', '+faststart', video],
      'pipe',
    );
    const t1 = performance.now();
    for (let i = 0; i < n; i++) {
      const t = from + i / opts.fps;
      await page.evaluate((x) => window.__song!.seek(x), t);
      const jpg = await page.screenshot({ type: 'jpeg', quality: 94 });
      if (opts.frames) writeFileSync(join(opts.out, 'frames', `f${String(i).padStart(5, '0')}.jpg`), jpg);
      if (!ff.stdin!.write(jpg)) await new Promise((r) => ff.stdin!.once('drain', r));
      if (i % (opts.fps * 10) === 0) {
        const el = (performance.now() - t1) / 1000;
        const eta = i > 0 ? (el / i) * (n - i) : 0;
        console.log(`record ${clock(t)} / ${clock(to)}  frame ${i}/${n}  eta ${Math.round(eta / 60)} min`);
      }
    }
    ff.stdin!.end();
    await done(ff);
    note(`video ${video}: ${n} frames at ${opts.fps} fps, ${clock(from)} to ${clock(to)}, ${Math.round((performance.now() - t1) / 1000)} s (${((performance.now() - t1) / 1000 / n).toFixed(2)} s per frame)`);
  } else {
    throw new Error(`Unknown command ${command}`);
  }
  await close();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
