/**
 * Red check for the track "fill every empty shelf in the games and scene maps".
 *
 * Rules (test-strategy.md):
 *  - R1 (F1/F2): every `shelf` holds at least one item (x and z inside the footprint
 *    after the yaw, y > 0).
 *  - R2 (F3/F4): every item over a `shelf` or `cabinet` footprint rests on a support
 *    top within 0.01 m.
 *  - R3 (F5): no item stands inside a `shelf` or `cabinet` footprint at floor level.
 *  - R4 (F7): the two library views place no `shelf` and no `bookshelf`.
 *  - R5 (F8): the frozen count table holds per map.
 *
 * No WebGL, no network, no file write. The maps export `places()`; the five game views
 * run their build functions against a recording stub.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Timeline } from '../../src/apk3d/stage/timeline.js';
import type { GLTF, Stage3D } from '../../src/apk3d/stage/index.js';
import { buildHall } from '../../src/games/enchanted-library/view/hall.js';
import { buildLibrary } from '../../src/games/haunted-library/view/library.js';
import { buildShop } from '../../src/games/potion-rush/view/shop.js';
import { buildLab } from '../../src/games/alchemists-synthesis/view/lab.js';
import { buildForge } from '../../src/games/rune-forge-chamber/view/forge.js';

const DEG = Math.PI / 180;

/** The same shape as `scenes/chibi-quest.ts` `Place`. */
interface P {
  asset: string;
  at: readonly [number, number, number];
  yaw?: number;
  scale?: number;
}

// ---------------------------------------------------------------- geometry

const SHELF_HALF_W = 0.65;
const SHELF_DEPTH = 0.3;
const SHELF_TOPS = [0.4725, 0.8025, 1.1125];
const CABINET_HALF_W = 0.5;
const CABINET_HALF_D = 0.225;
const CABINET_TOP = 0.99;
const TOL = 0.01;

const CASE_ASSETS = new Set(['shelf', 'bookcase', 'bookshelf', 'cabinet']);

type CaseKind = 'shelf' | 'cabinet';

interface CasePlace {
  kind: CaseKind;
  x: number;
  z: number;
  yawRad: number;
  scale: number;
  label: string;
  index: number;
}

interface ItemPlace {
  asset: string;
  x: number;
  y: number;
  z: number;
  label: string;
  index: number;
}

function toLocal(dx: number, dz: number, rad: number): { x: number; z: number } {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: c * dx - s * dz, z: s * dx + c * dz };
}

function caseTops(kind: CaseKind, scale: number): number[] {
  return kind === 'shelf' ? SHELF_TOPS.map((t) => t * scale) : [CABINET_TOP * scale];
}

/** True when a local point falls inside the case footprint (shelf: back face at origin). */
function insideFootprint(kind: CaseKind, localX: number, localZ: number, scale: number): boolean {
  if (kind === 'shelf') {
    return Math.abs(localX) <= SHELF_HALF_W * scale + TOL && localZ >= -TOL && localZ <= SHELF_DEPTH * scale + TOL;
  }
  return Math.abs(localX) <= CABINET_HALF_W * scale + TOL && Math.abs(localZ) <= CABINET_HALF_D * scale + TOL;
}

/** Structural pieces never counted as an item and never float over or inside a case. */
function isStructural(asset: string): boolean {
  const SUFFIX = /(floor|ground|road|path|river|water|wall|window|door|gate|arch|column|pillar|stairs|ladder|bridge|dock|pier|roof|chimney|ceiling|fence|railing|walkway|plank|beam)$/;
  const PREFIX = /^(wall|door|window|gate|arch|column|pillar|stairs|ladder|bridge|roof|chimney|ceiling|fence|railing|walkway|ruin|cliff|boulder|cave|tunnel|street|trail|hill|mountain|pond|puddle|snowbank|sand-dune)/;
  // Structural pieces and mounted fixtures are never a shelf item and never float over
  // or stand inside a case. The single `candle` stays an item: the archive candle is the
  // R3 target, and a desk candle is clutter.
  const NAMED = new Set([
    'carpet', 'rug', 'tapestry', 'curtain', 'banner', 'awning', 'beam', 'plank', 'archway', 'walkway', 'railing',
    'chandelier', 'candle-cluster', 'lantern', 'torch-sconce', 'wall-sconce', 'torch', 'candelabra', 'brazier',
    'fireplace', 'campfire', 'campfire-out', 'watchfire',
  ]);
  return SUFFIX.test(asset) || PREFIX.test(asset) || NAMED.has(asset);
}

const fmt = (n: number): string => {
  const r = Math.round(n * 1000) / 1000;
  return String(r);
};

// ---------------------------------------------------------------- stub

const PLACED = '__measurePlacedName';

/**
 * Runs one game view's build function against a recording stub. The loader returns a
 * fresh tagged `THREE.Object3D` for every model path; `scene.add` records the tag, the
 * position, the uniform scale, and the yaw of each placement made with `place(...)`.
 */
function recordView(
  build: (stage: Stage3D, hero: string) => unknown,
  label: string,
): P[] {
  const placements: P[] = [];
  const scene = new THREE.Scene();

  const realAdd = scene.add.bind(scene);
  (scene as unknown as { add: typeof realAdd }).add = (obj: THREE.Object3D, ...rest: THREE.Object3D[]) => {
    const name = (obj.userData as Record<string, unknown>)[PLACED] as string | undefined;
    if (name) {
      placements.push({
        asset: name,
        at: [obj.position.x, obj.position.y, obj.position.z],
        yaw: obj.rotation.y / DEG,
        scale: obj.scale.x,
      });
    }
    return realAdd(obj, ...rest);
  };

  const loader = {
    modelPath: (name: string): string => `models/${name}.glb`,
    get: (path: string): GLTF => {
      const name = path.replace(/^models\//, '').replace(/\.glb$/, '');
      const g = new THREE.Group();
      g.userData[PLACED] = name;
      return { scene: g, animations: [] } as unknown as GLTF;
    },
  };

  const timeline = new Timeline();
  const stage = {
    scene,
    loader,
    addSun: (): THREE.DirectionalLight => new THREE.DirectionalLight(),
    onFrame: (): (() => void) => () => undefined,
    timeline,
    addActor: (actor: unknown): unknown => actor as unknown,
  } as unknown as Stage3D;

  // A fake document with a canvas and a no-op 2D context, needed by potion-rush.
  const ctx = {
    fillStyle: '', strokeStyle: '', lineWidth: 1,
    fillRect: () => undefined, beginPath: () => undefined, arc: () => undefined,
    moveTo: () => undefined, lineTo: () => undefined, closePath: () => undefined, stroke: () => undefined,
  } as unknown as CanvasRenderingContext2D;
  const canvas = {
    width: 256, height: 32,
    getContext: (): CanvasRenderingContext2D => ctx,
    getBoundingClientRect: (): DOMRect => ({ x: 0, y: 0, width: 300, height: 300, left: 0, top: 0, right: 300, bottom: 300, toJSON: () => ({}) }) as unknown as DOMRect,
  } as unknown as HTMLCanvasElement;
  (globalThis as { document?: unknown }).document = {
    createElement: (tag: string): unknown => (tag === 'canvas' ? canvas : { style: {}, getContext: () => ctx }),
  };

  void label;
  build(stage, '');
  return placements;
}

// ---------------------------------------------------------------- maps

interface MapModule {
  places: () => P[];
}

const mapModules = import.meta.glob<MapModule>('../../scenes/maps/*.ts', { eager: true });

function mapName(path: string): string {
  const base = path.slice(path.lastIndexOf('/') + 1);
  return base.replace(/\.ts$/, '');
}

const MAPS: { name: string; rows: P[] }[] = Object.entries(mapModules)
  .map(([path, mod]) => ({ name: mapName(path), rows: mod.places() }))
  .sort((a, b) => a.name.localeCompare(b.name));

// ---------------------------------------------------------------- audit

interface Audit {
  /** Every shelf placement, in row order. */
  shelves: CasePlace[];
  /** Every cabinet placement, in row order. */
  cabinets: CasePlace[];
  /** Every item placement (not a case, not structural), in row order. */
  items: ItemPlace[];
  /** Items resting on each shelf, by shelf row index. */
  onShelf: Map<number, ItemPlace[]>;
  /** Shelves that hold no item. */
  emptyShelves: CasePlace[];
  /** Items floating above a case footprint (y > 0 but no support top matches). */
  floats: { item: ItemPlace; casePlace: CasePlace }[];
  /** Items standing inside a case footprint at floor level (y <= TOL). */
  inside: { item: ItemPlace; casePlace: CasePlace }[];
}

function audit(rows: P[], label: string): Audit {
  const shelves: CasePlace[] = [];
  const cabinets: CasePlace[] = [];
  const items: ItemPlace[] = [];
  rows.forEach((r, index) => {
    const [x, y, z] = r.at;
    if (r.asset === 'shelf') shelves.push({ kind: 'shelf', x, z, yawRad: (r.yaw ?? 0) * DEG, scale: r.scale ?? 1, label, index });
    else if (r.asset === 'cabinet') cabinets.push({ kind: 'cabinet', x, z, yawRad: (r.yaw ?? 0) * DEG, scale: r.scale ?? 1, label, index });
    else if (!CASE_ASSETS.has(r.asset) && !isStructural(r.asset)) items.push({ asset: r.asset, x, y, z, label, index });
  });

  const cases = [...shelves, ...cabinets];
  const onShelf = new Map<number, ItemPlace[]>();
  for (const s of shelves) {
    const held: ItemPlace[] = [];
    for (const it of items) {
      if (it.y <= 0) continue;
      const local = toLocal(it.x - s.x, it.z - s.z, s.yawRad);
      if (insideFootprint('shelf', local.x, local.z, s.scale)) held.push(it);
    }
    onShelf.set(s.index, held);
  }

  const floats: { item: ItemPlace; casePlace: CasePlace }[] = [];
  const inside: { item: ItemPlace; casePlace: CasePlace }[] = [];
  for (const it of items) {
    for (const c of cases) {
      const local = toLocal(it.x - c.x, it.z - c.z, c.yawRad);
      if (!insideFootprint(c.kind, local.x, local.z, c.scale)) continue;
      if (it.y <= TOL) {
        inside.push({ item: it, casePlace: c });
        break;
      }
      const tops = caseTops(c.kind, c.scale);
      const rests = tops.some((t) => Math.abs(it.y - t) <= TOL + 1e-6);
      if (!rests) floats.push({ item: it, casePlace: c });
      break;
    }
  }

  const emptyShelves = shelves.filter((s) => (onShelf.get(s.index) ?? []).length === 0);
  return { shelves, cabinets, items, onShelf, emptyShelves, floats, inside };
}

function describeCase(c: CasePlace): string {
  return `${c.label} row ${c.index} ${c.kind} at [${fmt(c.x)}, 0, ${fmt(c.z)}] scale ${fmt(c.scale)}`;
}

function describeItem(it: ItemPlace): string {
  return `${it.label} row ${it.index} ${it.asset} at [${fmt(it.x)}, ${fmt(it.y)}, ${fmt(it.z)}]`;
}

// ---------------------------------------------------------------- setup

const MAP_AUDITS: { name: string; a: Audit }[] = MAPS.map((m) => ({ name: m.name, a: audit(m.rows, m.name) }));

interface ViewDef {
  name: string;
  build: (stage: Stage3D) => unknown;
}

const VIEW_DEFS: ViewDef[] = [
  { name: 'enchanted-library', build: (s) => buildHall(s) },
  { name: 'haunted-library', build: (s) => buildLibrary(s) },
  { name: 'potion-rush', build: (s) => buildShop(s, '') },
  { name: 'alchemists-synthesis', build: (s) => buildLab(s, '') },
  { name: 'rune-forge-chamber', build: (s) => buildForge(s, '') },
];

const VIEW_AUDITS: { name: string; rows: P[]; a: Audit }[] = VIEW_DEFS.map((v) => {
  const rows = recordView(v.build, v.name);
  return { name: v.name, rows, a: audit(rows, v.name) };
});

function shelfCountByMap(): Map<string, number> {
  const out = new Map<string, number>();
  for (const { name, a } of MAP_AUDITS) {
    if (a.shelves.length > 0) out.set(name, a.shelves.length);
  }
  return out;
}

function rawBookshelfByMap(): Map<string, number> {
  const out = new Map<string, number>();
  for (const m of MAPS) {
    const n = m.rows.filter((r) => r.asset === 'bookshelf').length;
    if (n > 0) out.set(m.name, n);
  }
  return out;
}

// ---------------------------------------------------------------- tests

describe('filled-shelves check (Red)', () => {
  it('F1: every map shelf holds at least one item', () => {
    const empties = MAP_AUDITS.flatMap(({ a }) => a.emptyShelves);
    const msg = empties.map((c) => `${describeCase(c)} holds 0 items`).join('\n');
    expect(empties.length, `empty map shelves:\n${msg}`).toBe(0);
  });

  it('F2: every view shelf holds at least one item', () => {
    const empties = VIEW_AUDITS.flatMap(({ a }) => a.emptyShelves);
    const msg = empties.map((c) => `${describeCase(c)} holds 0 items`).join('\n');
    expect(empties.length, `empty view shelves:\n${msg}`).toBe(0);
  });

  it('F3: every view item over a case rests on a support top', () => {
    const floats = VIEW_AUDITS.flatMap(({ a }) => a.floats);
    const msg = floats.map((f) => `${describeItem(f.item)} floats over ${describeCase(f.casePlace)}`).join('\n');
    expect(floats.length, `floating view items:\n${msg}`).toBe(0);
  });

  it('F4: no map item floats above a case', () => {
    const floats = MAP_AUDITS.flatMap(({ a }) => a.floats);
    const msg = floats.map((f) => `${describeItem(f.item)} floats over ${describeCase(f.casePlace)}`).join('\n');
    expect(floats.length, `floating map items:\n${msg}`).toBe(0);
  });

  it('F5: no map item stands inside a case', () => {
    const inside = MAP_AUDITS.flatMap(({ a }) => a.inside);
    const msg = inside.map((f) => `${describeItem(f.item)} stands inside ${describeCase(f.casePlace)}`).join('\n');
    expect(inside.length, `items standing inside a case:\n${msg}`).toBe(0);
  });

  it('F6: the four filled maps keep their items', () => {
    const filled = ['alchemy-lab', 'apothecary', 'bakery', 'general-store'];
    const missing = filled.filter((n) => !MAP_AUDITS.some((m) => m.name === n));
    expect(missing, 'filled map is absent from the inventory').toEqual([]);
    const counts = filled.map((n) => `${n}=${MAP_AUDITS.find((m) => m.name === n)!.a.shelves.length}`);
    const empties = filled.flatMap((n) => MAP_AUDITS.find((m) => m.name === n)!.a.emptyShelves);
    expect(`shelf counts: ${counts.join(', ')}`).toBeTruthy();
    const msg = empties.map((c) => `${describeCase(c)} holds 0 items`).join('\n');
    expect(empties.length, `a filled map regressed:\n${msg}`).toBe(0);
  });

  it('F7: the two library views place no shelf and no bookshelf', () => {
    const libs = VIEW_AUDITS.filter((v) => v.name === 'enchanted-library' || v.name === 'haunted-library');
    const placed: string[] = [];
    for (const v of libs) {
      const shelf = v.rows.filter((r) => r.asset === 'shelf').length;
      const bookshelf = v.rows.filter((r) => r.asset === 'bookshelf').length;
      if (shelf > 0) placed.push(`${v.name}: ${shelf} shelf`);
      if (bookshelf > 0) placed.push(`${v.name}: ${bookshelf} bookshelf`);
    }
    expect(placed.join('\n'), 'libraries must use bookcase, not shelf or bookshelf').toBe('');
  });

  it('F8: the frozen count table holds', () => {
    // Measured at Red from the baseline run (strategy text said 37 bookshelf in 10 maps;
    // the live count is 44 in 12 maps — the strategy missed bank and guild-hall, which use
    // double-quoted JSON). The table freezes every pre-existing placement by map.
    const frozenShelf: Record<string, number> = {
      'alchemy-lab': 2, apothecary: 3, bakery: 1, bathhouse: 4, 'general-store': 5, inn: 1, warehouse: 3,
    };
    const frozenBookshelf: Record<string, number> = {
      apothecary: 2, archive: 11, bank: 2, classroom: 2, courthouse: 2, 'guild-hall': 5, library: 6,
      observatory: 3, prison: 1, school: 3, warehouse: 1, 'wizard-tower': 6,
    };
    expect(Object.fromEntries(shelfCountByMap()), 'shelf count table by map').toEqual(frozenShelf);
    expect(Object.fromEntries(rawBookshelfByMap()), 'bookshelf count table by map').toEqual(frozenBookshelf);
  });
});