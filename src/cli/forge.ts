import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium, type Browser, type Page } from 'playwright';
import { createServer } from 'vite';
import * as THREE from 'three';
import type {
  AnimationRequest,
  InspectRequest,
  SpritesRequest,
  ViewSpec,
  ViewsRequest,
} from '../render/page.js';
import type * as Pipeline from '../pipeline.js';
import type * as ClipCheck from '../clip-check.js';
import { OUT_DIR, ROOT, assetPath, listAssets } from '../pipeline.js';

const HELP = `forge — build and look at 3D assets

  pnpm forge list
  pnpm forge build   <asset>            mesh + export GLB, print stats (no browser)
  pnpm forge render  <asset> [options]  GLB + turnaround sheet to look at
  pnpm forge sprites <asset> [options]  GLB + pixel-art sprite frames (add --clip for animated sheets)
  pnpm forge animate <asset> [options]  GLB + animation review strips and GIFs
  pnpm forge all     <asset>            render + sprites + every animation (strips and sprite sheets)
  pnpm forge inspect <asset>            numbers instead of pictures: visibility per part, silhouette,
                                        values, colors, ground contact, floating parts
  pnpm forge check   <asset>            clip clearance: does a held weapon, shield, or staff pass
                                        through the head (fails) or the body (reported) in any clip?
                                        --clip attack,victory  --fps 60 (no browser)

render options
  --views front,three-quarter,side,back,top,back-three-quarter  (default: first four)
  --size 512           pixels per view
  --ref / --no-ref     show the asset's reference image above the views (default: on if set)
  --focus x,y,z,r      zoom every view on a sphere (world meters), e.g. the face
  --az 30 --el 10      add one custom view
  --bg '#aeb3ba'       background color

sprite options
  --size 128  --dirs 8|4|1  --elevation 30  --colors 0 (palette size, 0 = full color)
  --outline none|dark|black  --ss 4 (supersample)  --margin 0.06
  --clip walk|all      animated sprite sheet (rows = directions, columns = frames) and GIF

animation options
  --clip walk          one clip (default: all clips)
  --frames 8           poses in the review strip and in animated sprite sheets
  --views three-quarter,side   rows of the review strip

common
  --fast               skip UV unwrap and texture baking (vertex colors; about 3x faster)
  --texture 2048       atlas size (default: the asset's texture.size, else 1024; 0 = off)
  --watch              keep running; rebuild and re-render when a file changes
`;

const NAMED_VIEWS: Record<string, Omit<ViewSpec, 'name' | 'focus'>> = {
  front: { azimuth: 0, elevation: 8 },
  'three-quarter': { azimuth: 35, elevation: 12 },
  side: { azimuth: 90, elevation: 6 },
  back: { azimuth: 180, elevation: 8 },
  'back-three-quarter': { azimuth: 215, elevation: 12 },
  top: { azimuth: 25, elevation: 55 },
};

const T0 = performance.now();
const phase = (label: string) => {
  if (process.env.FORGE_DEBUG) console.log(`[${Math.round(performance.now() - T0)} ms] ${label}`);
};

async function main(): Promise<void> {
  phase('cli start');
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      views: { type: 'string' },
      size: { type: 'string' },
      ref: { type: 'boolean' },
      'no-ref': { type: 'boolean' },
      focus: { type: 'string' },
      az: { type: 'string' },
      el: { type: 'string' },
      bg: { type: 'string' },
      dirs: { type: 'string' },
      elevation: { type: 'string' },
      colors: { type: 'string' },
      outline: { type: 'string' },
      ss: { type: 'string' },
      margin: { type: 'string' },
      watch: { type: 'boolean' },
      fast: { type: 'boolean' },
      texture: { type: 'string' },
      clip: { type: 'string' },
      fps: { type: 'string' },
      frames: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  const [command, name] = positionals;
  if (!command || values.help) {
    console.log(HELP);
    return;
  }
  if (command === 'list') {
    for (const a of listAssets()) console.log(a);
    return;
  }
  if (!['build', 'render', 'sprites', 'animate', 'all', 'inspect', 'check'].includes(command))
    throw new Error(`Unknown command '${command}'.\n${HELP}`);
  if (!name) throw new Error(`Usage: pnpm forge ${command} <asset>`);
  const file = assetPath(name);

  const server = await createServer({
    root: ROOT,
    // No config file: the CLI only serves the render page, and loading vite.config.ts would write
    // a bundled copy into node_modules (read-only in benchmark containers).
    configFile: false,
    ...(process.env.FORGE_VITE_CACHE ? { cacheDir: process.env.FORGE_VITE_CACHE } : {}),
    logLevel: 'error',
    server: {
      port: 5400 + Math.floor(Math.random() * 400),
      strictPort: false,
      hmr: false,
      // One-shot commands need no file watcher. Several forge runs at once (and the thousands of
      // files under bench/) otherwise use up the system's inotify watches (ENOSPC).
      watch: values.watch ? { ignored: ['**/bench/**', '**/out/**', '**/node_modules/**', '**/.git/**'] } : null,
    },
  });
  phase('vite server created');
  let browser: Browser | null = null;
  let page: Page | null = null;
  const needsBrowser = command !== 'build' && command !== 'check';
  try {
    if (needsBrowser) {
      await server.listen();
      phase('vite listening');
      const url = server.resolvedUrls?.local[0];
      if (!url) throw new Error('Could not start the render server.');
      // Use the real GPU when there is one; FORGE_GL=software forces the SwiftShader fallback.
      const gpuArgs =
        process.env.FORGE_GL === 'software'
          ? ['--enable-unsafe-swiftshader']
          : ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'];
      browser = await chromium.launch({ args: gpuArgs });
      phase('chromium launched');
      page = await browser.newPage();
      page.on('pageerror', (e) => console.error(`[page] ${e.message}`));
      page.on('console', (m) => {
        if (m.type() === 'error') console.error(`[page] ${m.text()}`);
      });
      await page.goto(`${url}render.html`);
      await page.waitForFunction(() => window.forge?.ready === true, undefined, { timeout: 60_000 });
      phase('render page ready');
    }

    const run = async () => {
      const t0 = performance.now();
      const pipeline = (await server.ssrLoadModule('/src/pipeline.ts')) as typeof Pipeline;
      phase('pipeline loaded');
      if (command === 'check') {
        const checker = (await server.ssrLoadModule('/src/clip-check.ts')) as typeof ClipCheck;
        const def = pipeline.checkDefinition(await server.ssrLoadModule(file), name);
        const report = await checker.checkClips(def, {
          ...(values.fps !== undefined ? { fps: num(values.fps, 60) } : {}),
          ...(values.clip !== undefined && values.clip !== 'all' ? { clips: String(values.clip).split(',') } : {}),
        });
        console.log(checker.formatClipCheck(name, report));
        if (!report.ok) process.exitCode = 1;
        return;
      }
      let built;
      try {
        const mod = await server.ssrLoadModule(file);
        const textureSize = values.fast
          ? 0
          : values.texture !== undefined
            ? num(values.texture, 1024)
            : undefined;
        built = await pipeline.buildToGlb(pipeline.checkDefinition(mod, name), file, textureSize);
      } catch (error) {
        server.ssrFixStacktrace(error as Error);
        throw error;
      }
      const { result, glb } = built;
      const out = join(OUT_DIR, name);
      mkdirSync(out, { recursive: true });
      const glbPath = join(out, `${name}.glb`);
      writeFileSync(glbPath, glb);
      writeFileSync(join(out, 'stats.json'), JSON.stringify(result.stats, null, 2));
      const atlas = result.root.userData.forgeTextures as
        { baseColor: Uint8Array; normal: Uint8Array; orm: Uint8Array } | undefined;
      rmSync(join(out, 'textures'), { recursive: true, force: true });
      if (atlas) {
        mkdirSync(join(out, 'textures'), { recursive: true });
        writeFileSync(join(out, 'textures', 'baseColor.png'), atlas.baseColor);
        writeFileSync(join(out, 'textures', 'normal.png'), atlas.normal);
        writeFileSync(join(out, 'textures', 'orm.png'), atlas.orm);
      }
      const buildMs = Math.round(performance.now() - t0);
      printStats(result.stats, buildMs, glbPath, glb.length);

      if (!page) return;
      const pg = page;
      await pg.unrouteAll();
      await page.route(
        (u) => u.pathname === '/__forge/asset.glb',
        (r) => r.fulfill({ body: Buffer.from(glb), contentType: 'model/gltf-binary' }),
      );
      const def = (await server.ssrLoadModule(file)).default as { reference?: string };
      const useRef = values['no-ref'] !== true && def.reference !== undefined;
      if (useRef) {
        const refFile = join(ROOT, def.reference!);
        await page.route(
          (u) => u.pathname === '/__forge/reference',
          (r) =>
            r.fulfill({
              body: readFileSync(refFile),
              contentType: extname(refFile) === '.png' ? 'image/png' : 'image/jpeg',
            }),
        );
      }

      if (command === 'render' || command === 'all') {
        const t1 = performance.now();
        const req: ViewsRequest = {
          glbUrl: `/__forge/asset.glb?t=${Date.now()}`,
          views: viewList(values),
          size: num(values.size, 512),
          background: values.bg ?? '#aeb3ba',
          title: name,
          ...(useRef ? { referenceUrl: `/__forge/reference?t=${Date.now()}` } : {}),
        };
        const res = await page.evaluate((r) => window.forge.renderViews(r), req);
        rmSync(join(out, 'views'), { recursive: true, force: true });
        mkdirSync(join(out, 'views'), { recursive: true });
        for (const [view, data] of Object.entries(res.views))
          writePng(join(out, 'views', `${view}.png`), data);
        writePng(join(out, 'render.png'), res.sheet);
        console.log(`render   ${rel(join(out, 'render.png'))}  (${Math.round(performance.now() - t1)} ms)`);
      }
      const clips = await page.evaluate(
        (u) => window.forge.listClips(u),
        `/__forge/asset.glb?t=${Date.now()}`,
      );
      const wanted = (all: boolean): string[] => {
        if (values.clip === undefined || values.clip === 'all') return all ? clips.map((c) => c.name) : [];
        if (!clips.some((c) => c.name === values.clip))
          throw new Error(
            `No animation '${values.clip}'. Clips: ${clips.map((c) => c.name).join(', ') || '(none)'}.`,
          );
        return [values.clip];
      };
      const frameCount = num(values.frames, 8);

      const sprites = async (clip: string | null) => {
        const t2 = performance.now();
        const size = command === 'all' ? 128 : num(values.size, 128);
        const req: SpritesRequest = {
          glbUrl: `/__forge/asset.glb?t=${Date.now()}`,
          size,
          directions: num(values.dirs, 8) as 1 | 4 | 8,
          elevation: num(values.elevation, 30),
          supersample: num(values.ss, 4),
          colors: num(values.colors, 0),
          outline: (values.outline ?? 'dark') as SpritesRequest['outline'],
          margin: num(values.margin, 0.06),
          ...(clip ? { clip, frames: frameCount } : {}),
        };
        const res = await pg.evaluate((r) => window.forge.renderSprites(r), req);
        const dir = clip ? join(out, 'sprites', clip) : join(out, 'sprites');
        if (clip) rmSync(dir, { recursive: true, force: true });
        else
          for (const f of ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE', 'sheet', 'preview'])
            rmSync(join(dir, `${f}.png`), { force: true });
        mkdirSync(dir, { recursive: true });
        for (const [d, data] of Object.entries(res.frames)) writePng(join(dir, `${d}.png`), data);
        writePng(join(dir, 'sheet.png'), res.sheet);
        writePng(join(dir, 'preview.png'), res.preview);
        if (res.gif) writeFileSync(join(dir, `${clip}.gif`), Buffer.from(res.gif, 'base64'));
        writeFileSync(
          join(dir, 'metrics.json'),
          JSON.stringify({ size, clip, metrics: res.metrics, palette: res.palette }, null, 2),
        );
        console.log(`sprites  ${rel(join(dir, 'preview.png'))}  (${Math.round(performance.now() - t2)} ms)`);
        if (!clip) {
          const sizes = Object.entries(res.metrics)
            .map(([d, m]) => `${d} ${m ? `${m.width}x${m.height}` : 'EMPTY'}`)
            .join('  ');
          console.log(`         occupied: ${sizes}`);
        }
      };

      const animate = async (clip: string) => {
        const t3 = performance.now();
        const req: AnimationRequest = {
          glbUrl: `/__forge/asset.glb?t=${Date.now()}`,
          clip,
          frames: frameCount,
          views: viewList(values.views ? values : { ...values, views: 'three-quarter,side' }),
          size: 320,
          background: values.bg ?? '#aeb3ba',
          gifSize: 400,
        };
        const res = await pg.evaluate((r) => window.forge.renderAnimation(r), req);
        const dir = join(out, 'anim');
        mkdirSync(dir, { recursive: true });
        writePng(join(dir, `${clip}.png`), res.strip);
        if (res.gif) writeFileSync(join(dir, `${clip}.gif`), Buffer.from(res.gif, 'base64'));
        console.log(
          `animate  ${rel(join(dir, `${clip}.png`))}  + .gif  (${res.duration.toFixed(2)} s clip, ${Math.round(performance.now() - t3)} ms)`,
        );
      };

      if (command === 'inspect') {
        const req: InspectRequest = {
          glbUrl: `/__forge/asset.glb?t=${Date.now()}`,
          views: viewList(values.views ? values : { ...values, views: 'front,three-quarter,side,back,top' }),
          size: 256,
        };
        const res = await pg.evaluate((r) => window.forge.inspectAsset(r), req);
        const text = inspectionReport(name, result, res);
        writeFileSync(join(out, 'inspect.md'), text);
        writeFileSync(join(out, 'inspect.json'), JSON.stringify(res, null, 2));
        console.log(text);
      }
      if (command === 'sprites') {
        const list = values.clip === undefined ? [null] : wanted(true);
        for (const c of list) await sprites(c);
      }
      if (command === 'animate') {
        const list = wanted(true);
        if (list.length === 0)
          throw new Error(`'${name}' has no animations. Add k.skeleton() and k.animation().`);
        for (const c of list) await animate(c);
      }
      if (command === 'all') {
        await sprites(null);
        for (const c of wanted(true)) {
          await animate(c);
          await sprites(c);
        }
      }
    };

    await runSafely(run);
    if (values.watch) {
      console.log('watching assets/ and src/ … (Ctrl+C to stop)');
      let timer: NodeJS.Timeout | null = null;
      let busy = false;
      server.watcher.add(join(ROOT, 'assets'));
      server.watcher.on('change', (f) => {
        if (!f.endsWith('.ts')) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
          if (busy) return;
          busy = true;
          console.log(`\nchanged ${rel(f)}`);
          await runSafely(run);
          busy = false;
        }, 150);
      });
      await new Promise(() => {});
    }
  } finally {
    if (!values.watch) {
      await browser?.close();
      phase('browser closed');
      await server.close();
      phase('server closed');
    }
  }
}

async function runSafely(run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (error) {
    const e = error as Error;
    console.error(`\nBUILD FAILED: ${e.message}`);
    if (e.stack)
      console.error(
        e.stack
          .split('\n')
          .filter((l) => !l.includes('node_modules'))
          .slice(1, 8)
          .join('\n'),
      );
    process.exitCode = 1;
  }
}

function viewList(values: Record<string, unknown>): ViewSpec[] {
  const names =
    typeof values.views === 'string' ? values.views.split(',') : ['front', 'three-quarter', 'side', 'back'];
  let focus: ViewSpec['focus'];
  if (typeof values.focus === 'string') {
    const f = values.focus.split(',').map(Number);
    if (f.length !== 4 || f.some((v) => !Number.isFinite(v))) throw new Error('--focus needs x,y,z,radius');
    focus = { center: [f[0]!, f[1]!, f[2]!], radius: f[3]! };
  }
  const views: ViewSpec[] = names.map((n) => {
    const v = NAMED_VIEWS[n.trim()];
    if (!v) throw new Error(`Unknown view '${n}'. Known: ${Object.keys(NAMED_VIEWS).join(', ')}`);
    return { name: n.trim(), ...v, ...(focus ? { focus } : {}) };
  });
  if (typeof values.az === 'string' || typeof values.el === 'string') {
    const azimuth = num(values.az as string | undefined, 0);
    const elevation = num(values.el as string | undefined, 10);
    views.push({ name: `az${azimuth} el${elevation}`, azimuth, elevation, ...(focus ? { focus } : {}) });
  }
  return views;
}

function printStats(stats: Pipeline.BuildStats, ms: number, glbPath: string, bytes: number): void {
  const s = stats.bounds.size;
  console.log(
    `${stats.name}: ${stats.triangles.toLocaleString()} triangles, ${s[0]} x ${s[1]} x ${s[2]} m, built in ${ms} ms`,
  );
  for (const b of stats.bodies)
    console.log(`  ${b.name.padEnd(22)} ${String(b.triangles).padStart(7)} tris  (${b.milliseconds} ms)`);
  if (stats.texture)
    console.log(
      `texture  ${stats.texture.size}x${stats.texture.size} atlas: base color, normal, occlusion/roughness/metal (${stats.texture.milliseconds} ms)`,
    );
  else console.log('texture  none (vertex colors)');
  console.log(`glb      ${rel(glbPath)}  (${Math.round(bytes / 1024)} KB)`);
}

function writePng(path: string, dataUrl: string): void {
  writeFileSync(path, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));
}

function num(v: string | undefined, fallback: number): number {
  if (v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Expected a number, got '${v}'.`);
  return n;
}

const rel = (p: string) => relative(process.cwd(), p);

main().catch((error: unknown) => {
  console.error((error as Error).message);
  process.exit(1);
});

/** Readable text for `forge inspect`: what a picture would show, as numbers and warnings. */
function inspectionReport(
  name: string,
  result: { root: THREE.Object3D; stats: Pipeline.BuildStats },
  res: Awaited<ReturnType<typeof window.forge.inspectAsset>>,
): string {
  const lines: string[] = [];
  const warn: string[] = [];
  const s = result.stats;
  lines.push(`# Inspection: ${name}`, '');
  lines.push(
    `Size ${s.bounds.size.join(' x ')} m (x y z); ${s.triangles.toLocaleString()} triangles; lowest point y = ${s.bounds.min[1]} m.`,
  );
  if (Math.abs(s.bounds.min[1]) > 0.02)
    warn.push(
      `The asset does not stand on the ground: lowest point is y = ${s.bounds.min[1]} m (expected 0).`,
    );

  // Floating parts: a body whose box is more than 1 cm from every other body and above the ground.
  const boxes: { name: string; box: THREE.Box3 }[] = [];
  result.root.updateMatrixWorld(true);
  result.root.traverse((o) => {
    if (o instanceof THREE.Mesh) boxes.push({ name: o.name, box: new THREE.Box3().setFromObject(o) });
  });
  for (const a of boxes) {
    const grown = a.box.clone().expandByScalar(0.01);
    const touches = boxes.some((b) => b !== a && grown.intersectsBox(b.box)) || a.box.min.y < 0.02;
    if (!touches) warn.push(`Part '${a.name}' floats: it touches no other part and not the ground.`);
  }

  lines.push('', '## Silhouette per view (fractions of the frame)', '');
  lines.push('| view | width | height | coverage |', '|---|---|---|---|');
  for (const v of res.views)
    lines.push(`| ${v.view} | ${v.silhouette.width} | ${v.silhouette.height} | ${v.silhouette.coverage} |`);

  lines.push('', '## Visible share of the silhouette per part', '');
  lines.push(
    `| part | ${res.views.map((v) => v.view).join(' | ')} |`,
    `|---|${res.views.map(() => '---').join('|')}|`,
  );
  for (const b of res.bodies) {
    const shares = res.views.map((v) => v.bodies[b] ?? 0);
    lines.push(
      `| ${b} | ${shares.map((x) => (x === 0 ? '0 (hidden)' : `${Math.round(x * 1000) / 10}%`)).join(' | ')} |`,
    );
    if (shares.every((x) => x === 0))
      warn.push(`Part '${b}' is not visible from any view: it is buried inside another part.`);
    else if (Math.max(...shares) < 0.003)
      warn.push(`Part '${b}' is barely visible (under 0.3% of the silhouette in every view).`);
  }

  lines.push('', '## Values and colors (shaded render)', '');
  for (const v of res.views.slice(0, 1)) {
    lines.push(
      `Values: dark ${Math.round(v.values.dark * 100)}%, mid ${Math.round(v.values.mid * 100)}%, light ${Math.round(v.values.light * 100)}%.`,
    );
    lines.push(
      `Dominant colors: ${v.palette.map((p) => `${p.hex} ${Math.round(p.share * 100)}%`).join(', ')}.`,
    );
    if (v.values.mid > 0.85)
      warn.push('Almost everything is mid-value: the asset will look flat. Add darker and lighter areas.');
  }

  const front = res.views[0];
  const side = res.views.find((v) => v.view === 'side');
  if (front && side && side.silhouette.coverage < front.silhouette.coverage * 0.25)
    warn.push(
      'The side silhouette is very thin compared with the front: check that the side view still reads.',
    );

  lines.push('', '## Warnings', '');
  lines.push(...(warn.length ? warn.map((w) => `- ${w}`) : ['- none']));
  return lines.join('\n');
}
