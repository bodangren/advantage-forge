import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GIFEncoder, applyPalette as gifPalette, quantize } from 'gifenc';
import { Studio } from './studio.js';
import {
  applyPalette,
  buildPalette,
  downsample,
  occupied,
  outline,
  type OutlineMode,
  type Pixels,
} from './pixel.js';

/** A named camera for the turnaround sheet. */
export interface ViewSpec {
  readonly name: string;
  readonly azimuth: number;
  readonly elevation: number;
  /** Zoom on a region: world-space center and radius. Default: the whole asset. */
  readonly focus?: { readonly center: readonly [number, number, number]; readonly radius: number };
}

export interface ViewsRequest {
  readonly glbUrl: string;
  readonly views: readonly ViewSpec[];
  readonly size: number;
  readonly background: string;
  readonly referenceUrl?: string;
  readonly title?: string;
}

export interface SpritesRequest {
  readonly glbUrl: string;
  readonly size: number;
  readonly directions: 1 | 4 | 8;
  /** Camera elevation in degrees: 0 = side view, 30 = classic RPG, 90 = top down. */
  readonly elevation: number;
  readonly supersample: number;
  /** Palette size; 0 keeps full color. */
  readonly colors: number;
  readonly outline: OutlineMode;
  /** Empty space around the sprite as a fraction of the frame. */
  readonly margin: number;
  /** Animate: render this clip as `frames` evenly spaced poses per direction. */
  readonly clip?: string;
  readonly frames?: number;
}

export interface AnimationRequest {
  readonly glbUrl: string;
  readonly clip: string;
  /** Poses in the review strip. */
  readonly frames: number;
  readonly views: readonly ViewSpec[];
  readonly size: number;
  readonly background: string;
  /** Size of the animated GIF (0 = none). */
  readonly gifSize: number;
}

const DIRECTION_NAMES: Record<number, readonly string[]> = {
  1: ['S'],
  4: ['S', 'W', 'N', 'E'],
  8: ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'],
};

const studio = new Studio();
const loader = new GLTFLoader();
let current: { scene: THREE.Object3D; mixer: THREE.AnimationMixer; clips: THREE.AnimationClip[] } | null =
  null;

async function load(url: string): Promise<THREE.Object3D> {
  const gltf = await loader.loadAsync(url);
  current = { scene: gltf.scene, mixer: new THREE.AnimationMixer(gltf.scene), clips: gltf.animations };
  studio.setAsset(gltf.scene);
  return gltf.scene;
}

/** Put the loaded asset into the pose of `clip` at time `t` (seconds). */
function poseAt(clip: THREE.AnimationClip, t: number): void {
  const { mixer, scene } = current!;
  mixer.stopAllAction();
  const action = mixer.clipAction(clip);
  action.reset().play();
  mixer.setTime(t);
  scene.updateMatrixWorld(true);
}

function findClip(name: string): THREE.AnimationClip {
  const clip = current!.clips.find((c) => c.name === name);
  if (!clip)
    throw new Error(
      `No animation '${name}'. Clips: ${current!.clips.map((c) => c.name).join(', ') || '(none)'}.`,
    );
  return clip;
}

/** Evenly spaced sample times; a looping clip skips its last frame (it equals the first). */
function sampleTimes(clip: THREE.AnimationClip, frames: number): number[] {
  const loop = (clip.userData as { loop?: boolean } | undefined)?.loop ?? true;
  return Array.from(
    { length: frames },
    (_, i) => (clip.duration * i) / (loop ? frames : Math.max(1, frames - 1)),
  );
}

/** Bounds of the posed (skinned) asset over all given times; also moves the ground to the lowest point. */
function animatedBounds(clip: THREE.AnimationClip, times: readonly number[]): void {
  const box = new THREE.Box3();
  for (const t of times) {
    poseAt(clip, t);
    box.expandByObject(current!.scene, true);
  }
  studio.bounds.copy(box);
  studio.ground.position.y = box.min.y;
}

function gifBase64(frames: readonly HTMLCanvasElement[], delayMs: number): string {
  const gif = GIFEncoder();
  for (const c of frames) {
    const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    const palette = quantize(data, 256);
    gif.writeFrame(gifPalette(data, palette), c.width, c.height, { palette, delay: delayMs });
  }
  gif.finish();
  const bytes = gif.bytes();
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function snapshot(width: number, height: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  c.getContext('2d')!.drawImage(studio.renderer.domElement, 0, 0);
  return c;
}

function canvasToPixels(source: CanvasImageSource, width: number, height: number): Pixels {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(source, 0, 0);
  return { width, height, data: ctx.getImageData(0, 0, width, height).data };
}

function pixelsToCanvas(p: Pixels, scale = 1, checker = false): HTMLCanvasElement {
  const src = document.createElement('canvas');
  src.width = p.width;
  src.height = p.height;
  src.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(p.data), p.width, p.height), 0, 0);
  if (scale === 1 && !checker) return src;
  const c = document.createElement('canvas');
  c.width = p.width * scale;
  c.height = p.height * scale;
  const ctx = c.getContext('2d')!;
  if (checker) drawChecker(ctx, c.width, c.height, 8);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

function drawChecker(ctx: CanvasRenderingContext2D, w: number, h: number, cell: number): void {
  for (let y = 0; y < h; y += cell)
    for (let x = 0; x < w; x += cell) {
      ctx.fillStyle = ((x + y) / cell) % 2 === 0 ? '#d9d9de' : '#c4c4cb';
      ctx.fillRect(x, y, cell, cell);
    }
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.font = '600 15px system-ui, sans-serif';
  const w = ctx.measureText(text).width + 12;
  ctx.fillStyle = 'rgba(20,20,26,0.72)';
  ctx.fillRect(x, y, w, 22);
  ctx.fillStyle = '#f4f4f6';
  ctx.fillText(text, x + 6, y + 16);
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

async function renderViews(req: ViewsRequest): Promise<{ sheet: string; views: Record<string, string> }> {
  await load(req.glbUrl);
  studio.setBackground(req.background);
  studio.ground.visible = true;
  const cam = studio.perspective;
  const images: Record<string, HTMLCanvasElement> = {};
  const views: Record<string, string> = {};
  // One distance for every view so the turnaround keeps a constant scale: fit the height and the
  // widest horizontal extent (bounds diagonal in XZ) with a small margin.
  const size = studio.bounds.getSize(new THREE.Vector3());
  const fitRadius = (Math.max(size.y, Math.hypot(size.x, size.z)) / 2) * 1.18;
  for (const v of req.views) {
    const center = v.focus ? new THREE.Vector3(...v.focus.center) : studio.center;
    const radius = v.focus ? v.focus.radius : fitRadius;
    const distance = radius / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    cam.near = distance / 50;
    cam.far = distance * 10;
    studio.aim(cam, center, distance, v.azimuth, v.elevation);
    studio.render(cam, req.size, req.size);
    const c = document.createElement('canvas');
    c.width = req.size;
    c.height = req.size;
    c.getContext('2d')!.drawImage(studio.renderer.domElement, 0, 0);
    images[v.name] = c;
    views[v.name] = c.toDataURL('image/png');
  }

  const cols = Math.min(4, req.views.length);
  const rows = Math.ceil(req.views.length / cols);
  const gap = 4;
  const width = cols * req.size + (cols - 1) * gap;
  let refImg: HTMLImageElement | null = null;
  let refH = 0;
  let refW = 0;
  if (req.referenceUrl) {
    // Show the reference at about the same scale as one row of views.
    refImg = await loadImage(req.referenceUrl);
    refH = Math.min(req.size, Math.round((refImg.height / refImg.width) * width));
    refW = Math.round((refImg.width / refImg.height) * refH);
  }
  const sheet = document.createElement('canvas');
  sheet.width = width;
  sheet.height = refH + (refImg ? gap : 0) + rows * req.size + (rows - 1) * gap;
  const ctx = sheet.getContext('2d')!;
  ctx.fillStyle = '#1b1c20';
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  if (refImg) {
    const x = Math.round((width - refW) / 2);
    ctx.drawImage(refImg, x, 0, refW, refH);
    label(ctx, 'reference', x + 8, 8);
  }
  req.views.forEach((v, i) => {
    const x = (i % cols) * (req.size + gap);
    const y = refH + (refImg ? gap : 0) + Math.floor(i / cols) * (req.size + gap);
    ctx.drawImage(images[v.name]!, x, y);
    label(ctx, i === 0 && req.title ? `${req.title} · ${v.name}` : v.name, x + 8, y + 8);
  });
  return { sheet: sheet.toDataURL('image/png'), views };
}

async function renderSprites(req: SpritesRequest): Promise<{
  frames: Record<string, string>;
  sheet: string;
  preview: string;
  gif: string | null;
  palette: number[][];
  metrics: Record<string, { x: number; y: number; width: number; height: number } | null>;
}> {
  await load(req.glbUrl);
  studio.setBackground(null);
  studio.ground.visible = false;
  const names = DIRECTION_NAMES[req.directions];
  if (!names) throw new Error('directions must be 1, 4, or 8.');
  const clip = req.clip ? findClip(req.clip) : null;
  const times = clip ? sampleTimes(clip, req.frames ?? 8) : [0];
  if (clip) animatedBounds(clip, times);

  // One fixed frame for every direction and pose: a vertical cylinder around the asset, so the
  // sprite never changes scale or ground line when it turns or moves.
  const b = studio.bounds;
  const c = b.getCenter(new THREE.Vector3());
  let R = 0;
  const corner = new THREE.Vector3();
  for (let i = 0; i < 8; i++) {
    corner.set(i & 1 ? b.max.x : b.min.x, 0, i & 4 ? b.max.z : b.min.z);
    R = Math.max(R, Math.hypot(corner.x - c.x, corner.z - c.z));
  }
  const el = THREE.MathUtils.degToRad(req.elevation);
  const h = b.max.y - b.min.y;
  const spanY = h * Math.cos(el) + 2 * R * Math.sin(el);
  const spanX = 2 * R;
  const span = Math.max(spanX, spanY) / (1 - 2 * req.margin);
  const cam = studio.ortho;
  // Project the ground contact and top to put the ground line at the bottom margin.
  const bottom = -R * Math.sin(el) - (span - spanY) / 2;
  cam.left = -span / 2;
  cam.right = span / 2;
  cam.bottom = bottom;
  cam.top = bottom + span;
  const pivot = new THREE.Vector3(c.x, b.min.y, c.z);
  const distance = (h + R) * 4;
  cam.near = 0.01;
  cam.far = distance * 3;
  cam.updateProjectionMatrix();

  const full = req.size * req.supersample;
  const raw: Pixels[][] = names.map(() => []);
  times.forEach((t) => {
    if (clip) poseAt(clip, t);
    names.forEach((_, i) => {
      studio.aim(cam, pivot, distance, (360 / names.length) * i, req.elevation);
      studio.render(cam, full, full);
      raw[i]!.push(downsample(canvasToPixels(studio.renderer.domElement, full, full), req.supersample));
    });
  });

  const palette = req.colors > 0 ? buildPalette(raw.flat(), req.colors) : [];
  const finished = raw.map((row) =>
    row.map((p) => outline(palette.length ? applyPalette(p, palette) : p, req.outline)),
  );

  // Sheet: one row per direction, one column per pose.
  const frames: Record<string, string> = {};
  const metrics: Record<string, ReturnType<typeof occupied>> = {};
  const sheet = document.createElement('canvas');
  sheet.width = req.size * times.length;
  sheet.height = req.size * names.length;
  const sctx = sheet.getContext('2d')!;
  finished.forEach((row, d) =>
    row.forEach((p, f) => {
      const key = clip ? `${names[d]}_${f}` : names[d]!;
      const canvas = pixelsToCanvas(p);
      frames[key] = canvas.toDataURL('image/png');
      metrics[key] = occupied(p);
      sctx.drawImage(canvas, f * req.size, d * req.size);
    }),
  );
  if (!clip) {
    // A static sheet is a single row of directions.
    sheet.width = req.size * names.length;
    sheet.height = req.size;
    finished.forEach((row, d) => sctx.drawImage(pixelsToCanvas(row[0]!), d * req.size, 0));
  }

  // Preview for reviewing: upscaled with nearest neighbor on a checkerboard, labeled.
  const cells = clip
    ? finished.flatMap((row, d) => row.map((p, f) => ({ p, text: f === 0 ? names[d]! : '' })))
    : finished.map((row, d) => ({ p: row[0]!, text: names[d]! }));
  const cols = clip ? times.length : Math.min(4, names.length);
  const rows = Math.ceil(cells.length / cols);
  const scale = Math.max(1, Math.floor(Math.min(1600 / (req.size * cols), 1600 / (req.size * rows), 4)));
  const cell = req.size * scale;
  const preview = document.createElement('canvas');
  preview.width = cols * cell;
  preview.height = rows * cell;
  const pctx = preview.getContext('2d')!;
  cells.forEach(({ p, text }, i) => {
    const x = (i % cols) * cell;
    const y = Math.floor(i / cols) * cell;
    pctx.drawImage(pixelsToCanvas(p, scale, true), x, y);
    if (text) label(pctx, text, x + 6, y + 6);
  });

  // Animated GIF: every direction side by side, playing the clip, on a flat backdrop.
  let gif: string | null = null;
  if (clip) {
    const gs = 2;
    const gifFrames = times.map((_, f) => {
      const g = document.createElement('canvas');
      g.width = req.size * gs * Math.min(names.length, 4);
      g.height = req.size * gs * Math.ceil(names.length / 4);
      const gctx = g.getContext('2d')!;
      gctx.fillStyle = '#c9ccd2';
      gctx.fillRect(0, 0, g.width, g.height);
      gctx.imageSmoothingEnabled = false;
      finished.forEach((row, d) =>
        gctx.drawImage(
          pixelsToCanvas(row[f]!),
          (d % 4) * req.size * gs,
          Math.floor(d / 4) * req.size * gs,
          req.size * gs,
          req.size * gs,
        ),
      );
      return g;
    });
    gif = gifBase64(gifFrames, Math.round((clip.duration * 1000) / times.length));
  }

  return {
    frames,
    sheet: sheet.toDataURL('image/png'),
    preview: preview.toDataURL('image/png'),
    gif,
    palette,
    metrics,
  };
}

/**
 * Review an animation: a strip with one row per view and one column per pose (for reading), plus
 * a smooth animated GIF of the first view (for watching).
 */
async function renderAnimation(
  req: AnimationRequest,
): Promise<{ strip: string; gif: string | null; duration: number }> {
  await load(req.glbUrl);
  const clip = findClip(req.clip);
  studio.setBackground(req.background);
  studio.ground.visible = true;
  const gifTimes = sampleTimes(clip, Math.max(2, Math.round(clip.duration * 20)));
  const times = sampleTimes(clip, req.frames);
  animatedBounds(clip, [...times, ...gifTimes]);
  const cam = studio.perspective;
  const size = studio.bounds.getSize(new THREE.Vector3());
  const center = studio.bounds.getCenter(new THREE.Vector3());
  const fitRadius = (Math.max(size.y, Math.hypot(size.x, size.z)) / 2) * 1.12;
  // A view with a focus (--focus) zooms on that sphere, as in the turnaround views.
  const aimView = (v: AnimationRequest['views'][number]) => {
    const c = v.focus ? new THREE.Vector3(...v.focus.center) : center;
    const radius = v.focus ? v.focus.radius : fitRadius;
    const distance = radius / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    cam.near = distance / 50;
    cam.far = distance * 10;
    studio.aim(cam, c, distance, v.azimuth, v.elevation);
  };

  const gap = 3;
  const strip = document.createElement('canvas');
  strip.width = times.length * req.size + (times.length - 1) * gap;
  strip.height = req.views.length * req.size + (req.views.length - 1) * gap;
  const ctx = strip.getContext('2d')!;
  ctx.fillStyle = '#1b1c20';
  ctx.fillRect(0, 0, strip.width, strip.height);
  req.views.forEach((v, r) => {
    times.forEach((t, f) => {
      poseAt(clip, t);
      aimView(v);
      studio.render(cam, req.size, req.size);
      const x = f * (req.size + gap);
      const y = r * (req.size + gap);
      ctx.drawImage(studio.renderer.domElement, x, y);
      label(ctx, `${f === 0 ? `${clip.name} · ${v.name} · ` : ''}t=${t.toFixed(2)}`, x + 6, y + 6);
    });
  });

  let gif: string | null = null;
  if (req.gifSize > 0) {
    const v = req.views[0]!;
    const frames = gifTimes.map((t) => {
      poseAt(clip, t);
      aimView(v);
      studio.render(cam, req.gifSize, req.gifSize);
      return snapshot(req.gifSize, req.gifSize);
    });
    gif = gifBase64(frames, Math.round((clip.duration * 1000) / gifTimes.length));
  }
  return { strip: strip.toDataURL('image/png'), gif, duration: clip.duration };
}

export interface InspectRequest {
  readonly glbUrl: string;
  readonly views: readonly ViewSpec[];
  readonly size: number;
}

export interface ViewInspection {
  readonly view: string;
  /** Silhouette bounding box as fractions of the frame, and share of the frame covered. */
  readonly silhouette: { readonly width: number; readonly height: number; readonly coverage: number };
  /** Share of the silhouette each body covers in this view (0 = not visible). */
  readonly bodies: Record<string, number>;
  /** Share of silhouette pixels that are dark (luminance < 0.25), mid, and light (> 0.7). */
  readonly values: { readonly dark: number; readonly mid: number; readonly light: number };
  /** Dominant colors (hex) with their share of the silhouette. */
  readonly palette: readonly { readonly hex: string; readonly share: number }[];
}

/**
 * Numbers instead of pixels, for checking an asset without looking at it: which bodies are
 * visible from each view, how big the silhouette is, and how values and colors are spread.
 */
async function inspectAsset(req: InspectRequest): Promise<{ views: ViewInspection[]; bodies: string[] }> {
  const scene = await load(req.glbUrl);
  studio.setBackground('#000000');
  studio.ground.visible = false;
  const meshes: THREE.Mesh[] = [];
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) meshes.push(o);
  });
  const names = meshes.map((m) => m.name || `mesh${meshes.indexOf(m)}`);
  const idMaterials = meshes.map((_, i) => {
    const id = i + 1;
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(((id * 53) % 256) / 255, ((id * 97) % 256) / 255, ((id * 193) % 256) / 255),
    });
  });
  const idOf = new Map<number, number>();
  meshes.forEach((_, i) => {
    const id = i + 1;
    idOf.set((((id * 53) % 256) << 16) | (((id * 97) % 256) << 8) | ((id * 193) % 256), i);
  });
  const original = meshes.map((m) => m.material);
  const cam = studio.perspective;
  const size = studio.bounds.getSize(new THREE.Vector3());
  const fitRadius = (Math.max(size.y, Math.hypot(size.x, size.z)) / 2) * 1.18;
  const distance = fitRadius / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  cam.near = distance / 50;
  cam.far = distance * 10;
  const N = req.size;
  const views: ViewInspection[] = [];
  for (const v of req.views) {
    studio.aim(cam, studio.center, distance, v.azimuth, v.elevation);
    // Shaded render for values and colors.
    meshes.forEach((m, i) => (m.material = original[i]!));
    studio.setBackground('#000000');
    studio.render(cam, N, N);
    const shaded = canvasToPixels(studio.renderer.domElement, N, N);
    // ID render: flat unique colors, no tone mapping or color management.
    meshes.forEach((m, i) => (m.material = idMaterials[i]!));
    const tm = studio.renderer.toneMapping;
    const cs = studio.renderer.outputColorSpace;
    studio.renderer.toneMapping = THREE.NoToneMapping;
    studio.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    studio.render(cam, N, N);
    const ids = canvasToPixels(studio.renderer.domElement, N, N);
    studio.renderer.toneMapping = tm;
    studio.renderer.outputColorSpace = cs;

    const counts = new Array<number>(meshes.length).fill(0);
    let total = 0;
    let x0 = N,
      y0 = N,
      x1 = -1,
      y1 = -1;
    let dark = 0,
      mid = 0,
      light = 0;
    const solid: number[][] = [];
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const o = (y * N + x) * 4;
        const key = (ids.data[o]! << 16) | (ids.data[o + 1]! << 8) | ids.data[o + 2]!;
        const idx = idOf.get(key);
        if (idx === undefined) continue;
        counts[idx]!++;
        total++;
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
        const r = shaded.data[o]! / 255,
          g = shaded.data[o + 1]! / 255,
          b = shaded.data[o + 2]! / 255;
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (lum < 0.25) dark++;
        else if (lum > 0.7) light++;
        else mid++;
        if ((x + y) % 3 === 0) solid.push([shaded.data[o]!, shaded.data[o + 1]!, shaded.data[o + 2]!]);
      }
    const pal = buildPalette(
      [{ width: solid.length, height: 1, data: new Uint8ClampedArray(solid.flatMap((c) => [...c, 255])) }],
      6,
    );
    const shares = pal.map((c) => ({ c, n: 0 }));
    for (const px of solid) {
      let best = 0,
        bd = Infinity;
      pal.forEach((c, i) => {
        const d = (px[0]! - c[0]!) ** 2 + (px[1]! - c[1]!) ** 2 + (px[2]! - c[2]!) ** 2;
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      shares[best]!.n++;
    }
    const r3 = (v: number) => Math.round(v * 1000) / 1000;
    views.push({
      view: v.name,
      silhouette: {
        width: total ? r3((x1 - x0 + 1) / N) : 0,
        height: total ? r3((y1 - y0 + 1) / N) : 0,
        coverage: r3(total / (N * N)),
      },
      bodies: Object.fromEntries(names.map((n, i) => [n, total ? r3(counts[i]! / total) : 0])),
      values: {
        dark: r3(dark / Math.max(1, total)),
        mid: r3(mid / Math.max(1, total)),
        light: r3(light / Math.max(1, total)),
      },
      palette: shares
        .filter((sh) => sh.n > 0)
        .sort((a, b) => b.n - a.n)
        .map((sh) => ({
          hex: '#' + sh.c.map((x) => Math.round(x!).toString(16).padStart(2, '0')).join(''),
          share: r3(sh.n / Math.max(1, solid.length)),
        })),
    });
  }
  meshes.forEach((m, i) => (m.material = original[i]!));
  return { views, bodies: names };
}

/** Names and durations of the clips in a GLB. */
async function listClips(glbUrl: string): Promise<{ name: string; duration: number }[]> {
  await load(glbUrl);
  return current!.clips.map((c) => ({ name: c.name, duration: c.duration }));
}

declare global {
  interface Window {
    forge: {
      renderViews: typeof renderViews;
      renderSprites: typeof renderSprites;
      renderAnimation: typeof renderAnimation;
      listClips: typeof listClips;
      inspectAsset: typeof inspectAsset;
      ready: boolean;
    };
  }
}

window.forge = { renderViews, renderSprites, renderAnimation, listClips, inspectAsset, ready: true };
