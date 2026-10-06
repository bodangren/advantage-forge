/**
 * The avatar review page (`avatar.html`, docs/avatar-system.md section 8): the avatar pack in
 * `out/packs/avatar/<version>/` (scripts/avatar-pack.ts) composed with `composeAvatar`.
 *
 *   /avatar.html                      the 15 starter sets in idle
 *   ?clip=walk&t=0.3                  every avatar in one clip, frozen at a time (seconds)
 *   ?random=30&seed=7                 30 random loadouts from the ready catalog (seeded)
 *   ?bench=30                         30 random loadouts walking; window.__avatarFps (and __avatarLoad) after 5 s
 *   ?portraits                        the same avatars as 2D portraits (portrait layers, no 3D)
 *   ?hero=knight&turn=20              one starter set alone, turned (degrees, default 0 = facing
 *                                     front), on a transparent background (the RPG skin hero
 *                                     portraits, scripts/rpg-skin.ts)
 *   ?hero=none&turn=-25               the bare base with the default hair, framed the same way (the
 *                                     skin's "no hero yet" silhouette)
 *
 * The page sets `window.__avatarReady` when every avatar is on the stage, for screenshots.
 */
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { avatarModelOf, composeAvatar, type HairForm, type LoadedGltf, loadoutErrors, type AvatarModel, type AvatarPiece, type ComposedAvatar } from '../apk3d/avatar/compose.js';
import { avatarPackPath } from '../apk3d/avatar/pack.js';
import { PORTRAIT_SIZE, portraitPixels, portraitPlan, recolorLayer, stackLayers, type PortraitItem } from '../apk3d/avatar/portrait.js';
import type { VariantTable } from '../apk3d/avatar/tint.js';
import { STARTER_SETS } from '../apk3d/avatar/starters.js';

const PACK = `/out/${avatarPackPath()}/`;
/** Grid spacing of the 3D review in meters: between columns, between rows. */
const COLUMN = 1.3;
const ROW = 2;

interface CatalogItem {
  id: string;
  slot: string;
  tier: number;
  twoHanded: boolean;
  equip: { hides: string[]; hair: HairForm } | null;
  dyes: VariantTable | null;
  files: { model: string; capped?: string; tucked?: string };
}
interface Catalog {
  base: { file: string; clips: string[]; variants: VariantTable | null };
  items: CatalogItem[];
}
interface Look {
  label: string;
  tints: Record<string, string>;
  pieces: string[];
}

declare global {
  interface Window {
    __avatarReady?: boolean;
    __avatarFps?: number;
    /** Draw calls and triangles of one frame. */
    __avatarLoad?: { calls: number; triangles: number };
    __avatarErrors?: string[];
  }
}

const params = new URLSearchParams(location.search);
const clipName = params.get('clip') ?? (params.has('bench') ? 'walk' : 'idle');
const frozenAt = params.has('t') ? Number(params.get('t')) : null;
const bench = Number(params.get('bench') ?? 0);
const randomCount = bench || Number(params.get('random') ?? 0);
let seed = Number(params.get('seed') ?? 7);
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};
const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)]!;
/** One starter set alone (the hero portrait shot), or null for the grid. */
const hero = params.get('hero');

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const models = new Map<string, Promise<AvatarModel>>();
const model = (file: string) => {
  let m = models.get(file);
  if (!m) {
    m = loader.loadAsync(PACK + file).then((g: GLTF) => avatarModelOf(g as unknown as LoadedGltf));
    models.set(file, m);
  }
  return m;
};

function randomLooks(catalog: Catalog, count: number): Look[] {
  const bySlot = new Map<string, CatalogItem[]>();
  for (const item of catalog.items) bySlot.set(item.slot, [...(bySlot.get(item.slot) ?? []), item]);
  const tintOptions = { skin: ['fair', 'light', 'tan', 'brown', 'deep'], hair: ['brown', 'black', 'blond', 'auburn', 'silver', 'teal'], eyes: ['brown', 'blue', 'green', 'hazel', 'violet'], cloth: ['sky', 'linen', 'moss', 'rose', 'slate'] };
  return Array.from({ length: count }, (_, i) => {
    const chosen: CatalogItem[] = [];
    for (const [slot, items] of bySlot) if (slot === 'hair' || rand() >= 0.3) chosen.push(pick(items));
    // A two-handed weapon leaves no offhand piece.
    const pieces = chosen.filter((item, _, all) => item.slot !== 'offhand' || !all.some((c) => c.twoHanded)).map((item) => item.id);
    const tints = Object.fromEntries(Object.entries(tintOptions).map(([s, o]) => [s, pick(o)]));
    return { label: `random ${i + 1}`, tints, pieces };
  });
}

/** The first option of each dye slot, or a random one for random looks. */
const dyesOf = (item: CatalogItem): Record<string, string> =>
  item.dyes ? Object.fromEntries(Object.entries(item.dyes.slots).map(([slot, s]) => [slot, randomCount > 0 ? pick(Object.keys(s.options)) : Object.keys(s.options)[0]!])) : {};

/** The looks as 2D portraits: the layers of each loadout recolored and stacked on a canvas. */
async function portraits(catalog: Catalog, looks: Look[]): Promise<void> {
  const items = new Map(catalog.items.map((i) => [i.id, i]));
  const index = (await (await fetch(PACK + 'portraits.json')).json()) as { layers: Record<string, { color: string; mask: string }> };
  const pixels = new Map<string, Promise<[Uint8ClampedArray, Uint8ClampedArray]>>();
  const layer = (name: string) => {
    let p = pixels.get(name);
    if (!p) {
      const files = index.layers[name];
      if (!files) throw new Error(`no portrait layer '${name}'`);
      p = Promise.all([portraitPixels(PACK + files.color), portraitPixels(PACK + files.mask)]);
      pixels.set(name, p);
    }
    return p;
  };
  const itemOf = (id: string): PortraitItem => {
    const item = items.get(id);
    if (!item?.equip) throw new Error(`no ready catalog item '${id}'`);
    return { id, slot: item.slot, hides: item.equip.hides, hair: item.equip.hair, table: item.dyes, dyes: dyesOf(item) };
  };
  const grid = document.createElement('div');
  grid.id = 'portraits';
  document.body.append(grid);
  const started = performance.now();
  for (const look of looks) {
    const plan = portraitPlan({ base: catalog.base.variants, tints: look.tints, pieces: look.pieces.map(itemOf), defaultHair: itemOf('avatar-hair-swept') });
    const layers = await Promise.all(plan.map(async ({ layer: name, scales }) => {
      const [color, mask] = await layer(name);
      return recolorLayer(color, mask, scales);
    }));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = PORTRAIT_SIZE;
    canvas.getContext('2d')!.putImageData(new ImageData(stackLayers(layers), PORTRAIT_SIZE, PORTRAIT_SIZE), 0, 0);
    const figure = document.createElement('figure');
    const caption = document.createElement('figcaption');
    caption.textContent = `${look.label} · ${plan.length} layers`;
    figure.append(canvas, caption);
    grid.append(figure);
  }
  document.getElementById('bar')!.textContent = `${looks.length} portraits · ${Math.round(performance.now() - started)} ms`;
  window.__avatarErrors = [];
  window.__avatarReady = true;
}

async function main(): Promise<void> {
  const catalog = (await (await fetch(PACK + 'catalog.json')).json()) as Catalog;
  const items = new Map(catalog.items.map((i) => [i.id, i]));
  const starters = hero ? STARTER_SETS.filter((s) => s.id === hero) : STARTER_SETS;
  if (hero && hero !== 'none' && starters.length === 0) throw new Error(`no starter set '${hero}'`);
  const looks: Look[] =
    randomCount > 0
      ? randomLooks(catalog, randomCount)
      : hero === 'none'
        ? [{ label: 'none', tints: {}, pieces: [] }]
        : starters.map((s) => ({ label: s.id, tints: { ...s.tints }, pieces: [...s.pieces] }));
  if (params.has('portraits')) return portraits(catalog, looks);
  const base = await model(catalog.base.file);
  const swept = items.get('avatar-hair-swept')!;
  const pieceOf = async (id: string): Promise<AvatarPiece> => {
    const item = items.get(id);
    if (!item) throw new Error(`no ready catalog item '${id}'`);
    const forms = { ...(item.files.capped ? { capped: await model(item.files.capped) } : {}), ...(item.files.tucked ? { tucked: await model(item.files.tucked) } : {}) };
    return { id, model: await model(item.files.model), ...forms, dyes: dyesOf(item) };
  };
  const defaultHair = await pieceOf(swept.id);

  const errors: string[] = [];
  const avatars: { look: Look; avatar: ComposedAvatar }[] = [];
  for (const look of looks) {
    const pieces = await Promise.all(look.pieces.map(pieceOf));
    const problems = loadoutErrors(pieces);
    if (problems.length > 0) {
      errors.push(`${look.label}: ${problems.join('; ')}`);
      continue;
    }
    avatars.push({ look, avatar: composeAvatar(base, { tints: look.tints, pieces, defaultHair }) });
  }

  // A grid of avatars (1.3 m apart, rows 2 m apart), facing the camera at a three-quarter turn.
  const columns = Math.min(avatars.length, avatars.length > 15 ? 10 : 5);
  const rows = Math.ceil(avatars.length / columns);
  const scene = new THREE.Scene();
  scene.background = hero ? null : new THREE.Color('#c9ced6');
  scene.add(new THREE.HemisphereLight('#ffffff', '#5a5f6a', 1.6));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.position.set(3, 6, 5);
  scene.add(sun);
  avatars.forEach(({ avatar }, i) => {
    avatar.root.position.set(((i % columns) - (columns - 1) / 2) * COLUMN, 0, Math.floor(i / columns) * -ROW);
    avatar.root.rotation.y = THREE.MathUtils.degToRad(hero ? Number(params.get('turn') ?? 0) : -25);
    scene.add(avatar.root);
    const action = avatar.actions.get(clipName) ?? avatar.actions.get('idle');
    action?.play();
    avatar.mixer.update(frozenAt ?? (bench ? i * 0.07 : 0));
  });

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: !!hero });
  renderer.setPixelRatio(1);
  renderer.setSize(innerWidth, innerHeight);
  if (hero) {
    renderer.setClearColor(0x000000, 0);
    // avatar.html paints html and body; both must be clear for a transparent shot.
    for (const el of [document.documentElement, document.body]) el.style.background = 'transparent';
    for (const id of ['bar', 'labels']) document.getElementById(id)!.style.display = 'none';
  }
  document.body.append(renderer.domElement);
  // An orthographic view from 28 degrees above that fits the grid in the window.
  const center = new THREE.Vector3(0, 0.5, -((rows - 1) * ROW) / 2);
  const tilt = THREE.MathUtils.degToRad(28);
  const aspect = innerWidth / innerHeight;
  const halfH = Math.max((columns * COLUMN) / 2 / aspect, ((rows - 1) * ROW * Math.sin(tilt) + 1.3) / 2) * 1.1;
  const camera = new THREE.OrthographicCamera(-halfH * aspect, halfH * aspect, halfH, -halfH, 0.1, 200);
  camera.position.copy(center).add(new THREE.Vector3(0, Math.sin(tilt), Math.cos(tilt)).multiplyScalar(40));
  camera.lookAt(center);
  if (hero && avatars[0]) {
    // The hero portrait: the posed avatar fills the frame from 8 degrees above (the Forge front view).
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(avatars[0].avatar.root, true);
    const size = box.getSize(new THREE.Vector3());
    const mid = box.getCenter(new THREE.Vector3());
    const look = THREE.MathUtils.degToRad(8);
    const half = (Math.max(size.x * aspect ** -1, size.y * Math.cos(look) + size.z * Math.sin(look)) / 2) * 1.12;
    Object.assign(camera, { left: -half * aspect, right: half * aspect, top: half, bottom: -half });
    camera.updateProjectionMatrix();
    camera.position.copy(mid).add(new THREE.Vector3(0, Math.sin(look), Math.cos(look)).multiplyScalar(40));
    camera.lookAt(mid);
  }

  const bar = document.getElementById('bar')!;
  bar.textContent = `${avatars.length} avatars · clip ${clipName}${frozenAt !== null ? ` at ${frozenAt} s` : ''}${errors.length ? ` · ${errors.length} loadout error(s)` : ''}`;
  const labels = document.getElementById('labels')!;
  const tags = avatars.map(({ look }) => {
    const span = document.createElement('span');
    span.textContent = look.label;
    labels.append(span);
    return span;
  });
  const place = () => {
    avatars.forEach(({ avatar }, i) => {
      const p = new THREE.Vector3().setFromMatrixPosition(avatar.root.matrixWorld).project(camera);
      tags[i]!.style.left = `${((p.x + 1) / 2) * innerWidth}px`;
      tags[i]!.style.top = `${((1 - p.y) / 2) * innerHeight + 6}px`;
    });
  };

  const clock = new THREE.Clock();
  let frames = 0;
  let started = 0;
  const tick = (now: number) => {
    const dt = clock.getDelta();
    if (frozenAt === null) for (const { avatar } of avatars) avatar.mixer.update(dt);
    renderer.render(scene, camera);
    place();
    if (bench) {
      if (!started) started = now;
      frames++;
      if (now - started > 5000 && window.__avatarFps === undefined) {
        window.__avatarLoad = { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
        window.__avatarFps = (frames * 1000) / (now - started);
      }
    }
    if (frozenAt === null || bench) requestAnimationFrame(tick);
  };
  requestAnimationFrame((now) => {
    tick(now);
    window.__avatarErrors = errors;
    window.__avatarReady = true;
  });
}

void main().catch((e: Error) => {
  document.getElementById('bar')!.textContent = `error: ${e.message}`;
  window.__avatarErrors = [e.message];
  window.__avatarReady = true;
});
