/**
 * The showcase tour: stills, scouting, and the full video.
 *
 *   node --import tsx scripts/showcase.ts frames 12 30.5 61        stills at these seconds
 *   node --import tsx scripts/showcase.ts scout hamlet 10,8,10 0,0,0 [fov]   one camera, any set
 *   node --import tsx scripts/showcase.ts record [--fps 30] [--from s --to s]
 *   node --import tsx scripts/showcase.ts serve                    keep the page up for ?play
 *
 * Output: out/showcase/ (frames/, chibi-quest-tour.mp4 and the silent video, captions .srt,
 * voiceover.md). The soundtrack comes from scripts/showcase-audio.ts.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { performance } from 'node:perf_hooks';
import { chromium } from 'playwright';
import { createServer, type Plugin } from 'vite';
import { tour } from '../src/showcase/script.js';

const ROOT = process.cwd();
const OUT = join(ROOT, 'out');
const DIR = join(OUT, 'showcase');
mkdirSync(join(DIR, 'frames'), { recursive: true });

const TYPES: Record<string, string> = { '.glb': 'model/gltf-binary', '.png': 'image/png', '.wav': 'audio/wav', '.json': 'application/json' };

function serveOut(): Plugin {
  return {
    name: 'showcase-out',
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
    server: { port: port ?? 5800 + Math.floor(Math.random() * 300), strictPort: false, hmr: false, watch: null },
  });
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error('Could not start the page server.');
  return { server, url };
}

async function openPage(url: string, query = '') {
  const browser = await chromium.launch({
    args: ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  // A busy machine can take long for one frame; never give up on a screenshot too early.
  page.setDefaultTimeout(300_000);
  page.on('pageerror', (e) => console.error(`[page] ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') console.error(`[page] ${m.text()}`);
  });
  await page.goto(`${url}showcase.html${query}`, { timeout: 180_000 });
  await page.waitForFunction(() => window.__showcase?.ready === true, undefined, { timeout: 600_000, polling: 500 });
  await page.evaluate(() => document.fonts.ready);
  return { browser, page };
}

const fmtT = (t: number): string => t.toFixed(2).padStart(7, '0');

function srtTime(t: number): string {
  const ms = Math.round(t * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
}

function clock(t: number): string {
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
}

/** Captions (.srt) from the narration, and a voice-over script with the on-screen text beside it. */
function writeScripts(): void {
  const srt = tour.narration.map((n, i) => `${i + 1}\n${srtTime(n.start)} --> ${srtTime(n.end)}\n${n.text}\n`).join('\n');
  writeFileSync(join(DIR, 'chibi-quest-tour.srt'), srt);
  const onScreen = (a: number, b: number): string =>
    tour.captions
      .filter((c) => c.start < b && c.end > a && c.kind !== 'tag')
      .map((c) => [c.text, c.sub].filter(Boolean).join(' / ').replace(/\n/g, ' '))
      .join('; ');
  const rows = tour.narration.map((n) => `| ${clock(n.start)} | ${n.text} | ${onScreen(n.start, n.end) || ' '} |`);
  const md = [
    `# ${tour.title}: voice-over script`,
    '',
    `Length ${clock(tour.duration)}. Read each line when its time comes; the on-screen text is shown for reference.`,
    'Energy: upbeat and warm, like a friendly guide talking to a class of 8 to 11 year olds. Leave the quest',
    'countdowns silent (3, 2, 1) so viewers can answer out loud, then read the answer with the check mark.',
    '',
    '| Time | Narrator | On screen |',
    '| --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
  writeFileSync(join(DIR, 'voiceover.md'), md);

  const yt = [
    `# ${tour.title}: YouTube upload notes`,
    '',
    '## Title',
    '',
    'Welcome to CHIBI QUEST! Heroes, Monsters, and Learning Quests (Sneak Peek)',
    '',
    '## Description',
    '',
    'A brand-new world is coming to your learning apps! Meet seven heroes, explore a village, a forest,',
    'and a spooky vault, solve quests with math, words, and science, and team up against a fire dragon.',
    'Pause at each quest and try to answer before the countdown ends!',
    '',
    ...tour.chapters.map((c) => `${clock(c.t)} ${c.title}`),
    '',
    '## Learning moments',
    '',
    '| Time | Quest | Skill | Grades |',
    '| --- | --- | --- | --- |',
    ...tour.lessons.map((l) => `| ${clock(l.t)} | ${l.quest} | ${l.skill} | ${l.grades} |`),
    '',
    '## Files',
    '',
    '- `chibi-quest-tour.mp4`: 1920 x 1080, 30 fps, H.264 with the AAC soundtrack (-15 LUFS).',
    '- `chibi-quest-tour.silent.mp4`: the same picture without sound, for an editor who adds a voice-over.',
    '- `soundtrack.wav`: the music and sound effects alone.',
    '- `chibi-quest-tour.srt`: captions of the narration (upload as English subtitles after the voice-over is recorded).',
    '- `voiceover.md`: the narration script with timings.',
    '',
    '## Audience settings',
    '',
    'The video is made for children aged 8 to 11. On YouTube, set the audience to "Yes, it\'s made for kids".',
    '',
  ].join('\n');
  writeFileSync(join(DIR, 'youtube.md'), yt);
}

async function frames(times: number[]): Promise<void> {
  const { server, url } = await start();
  const { browser, page } = await openPage(url);
  for (const t of times) {
    await page.evaluate((x) => window.__showcase!.seek(x), t);
    const file = join(DIR, 'frames', `t${fmtT(t)}.png`);
    await page.screenshot({ path: file });
    console.log(`frame  ${file}`);
  }
  await browser.close();
  await server.close();
}

async function scout(set: string, pos: string, look: string, fov: string | undefined): Promise<void> {
  const { server, url } = await start();
  const q = `?scout=${encodeURIComponent(set)}&pos=${pos}&look=${look}${fov ? `&fov=${fov}` : ''}`;
  const { browser, page } = await openPage(url, q);
  const file = join(DIR, 'frames', `scout-${set}.png`);
  await page.evaluate(() => window.__showcase!.seek(0));
  await page.screenshot({ path: file });
  console.log(`scout  ${file}`);
  await browser.close();
  await server.close();
}

/** Many planning cameras in one session: a JSON list of { name, set, pos, look, fov?, mood?, t? }. */
async function views(file: string): Promise<void> {
  const list = JSON.parse(readFileSync(file, 'utf8')) as { name: string; t?: number; set: string; pos: number[]; look: number[]; fov?: number; mood?: string }[];
  const { server, url } = await start();
  const { browser, page } = await openPage(url);
  for (const v of list) {
    await page.evaluate(([x, t]) => window.__showcase!.view(x as never, t as number), [v, v.t ?? 0] as const);
    const out = join(DIR, 'frames', `view-${v.name}.png`);
    await page.screenshot({ path: out });
    console.log(`view   ${out}`);
  }
  await browser.close();
  await server.close();
}

/**
 * A 1280 x 720 YouTube thumbnail: one moment of the tour (the boss battle by default) with its
 * captions hidden and the title and a tag line on top.
 */
async function thumbnail(at: number): Promise<void> {
  const t = at > 0 ? at : (tour.captions.find((c) => c.text === 'Work together to win!')?.start ?? 0) + 1.6;
  const { server, url } = await start();
  const { browser, page } = await openPage(url);
  await page.evaluate((x) => window.__showcase!.seek(x), t);
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('.overlay > *').forEach((el) => (el.style.display = 'none'));
    const overlay = document.querySelector('.overlay')!;
    const title = document.createElement('div');
    title.className = 'cap cap-title';
    title.style.cssText = 'display:block;opacity:1;top:22%;transform:translate(-50%,-50%) rotate(-3deg)';
    title.innerHTML = '<div class="cap-text">CHIBI QUEST</div><div class="cap-sub">Heroes! Monsters! Learning quests!</div>';
    overlay.append(title);
  });
  const file = join(DIR, 'thumbnail.png');
  const big = await page.screenshot();
  await browser.close();
  await server.close();
  writeFileSync(join(DIR, 'thumbnail-1080.png'), big);
  await new Promise<void>((resolve, reject) => {
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(DIR, 'thumbnail-1080.png'), '-vf', 'scale=1280:720:flags=lanczos', file], { stdio: 'inherit' });
    ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`))));
  });
  console.log(`thumb  ${file}`);
}

async function record(fps: number, from: number, to: number): Promise<void> {
  writeScripts();
  const { server, url } = await start();
  const { browser, page } = await openPage(url);
  const silent = join(DIR, 'chibi-quest-tour.silent.mp4');
  const ff = spawn(
    'ffmpeg',
    ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-vf', 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p',
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-movflags', '+faststart', silent],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  );
  const n = Math.round((to - from) * fps);
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    const t = from + i / fps;
    await page.evaluate((x) => window.__showcase!.seek(x), t);
    const jpg = await page.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % (fps * 5) === 0) {
      const el = (performance.now() - t0) / 1000;
      const eta = i > 0 ? (el / i) * (n - i) : 0;
      console.log(`record ${clock(t)} / ${clock(to)}  frame ${i}/${n}  eta ${Math.round(eta / 60)} min`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  await server.close();
  console.log(`video  ${silent}`);
  const wav = join(DIR, 'soundtrack.wav');
  if (existsSync(wav)) {
    const final = join(DIR, 'chibi-quest-tour.mp4');
    await new Promise<void>((resolve, reject) => {
      const mux = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', final], { stdio: 'inherit' });
      mux.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg mux exit ${code}`))));
    });
    console.log(`video  ${final}  (with soundtrack)`);
  } else console.log('no soundtrack.wav yet: run scripts/showcase-audio.ts, then record again or mux by hand');
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  const flag = (name: string, def: number): number => {
    const i = rest.indexOf(`--${name}`);
    return i >= 0 ? Number(rest[i + 1]) : def;
  };
  if (cmd === 'frames') await frames(rest.map(Number).filter((x) => Number.isFinite(x)));
  else if (cmd === 'scout') await scout(rest[0] ?? 'hamlet', rest[1] ?? '20,20,20', rest[2] ?? '0,0,0', rest[3]);
  else if (cmd === 'views') await views(rest[0] ?? 'views.json');
  else if (cmd === 'record') await record(flag('fps', 30), flag('from', 0), flag('to', tour.duration));
  else if (cmd === 'scripts') writeScripts();
  else if (cmd === 'thumbnail') await thumbnail(Number(rest[0] ?? 0));
  else if (cmd === 'serve') {
    const { url } = await start(5173);
    console.log(`open ${url}showcase.html?play`);
  } else console.log('usage: showcase.ts frames <t...> | scout <set> x,y,z x,y,z [fov] | record [--fps n] | scripts | serve');
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
