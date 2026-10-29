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
 * Round 2 (Review A and Review C):
 *  - RA-FS-4: freeze the view case counts (shelf/bookcase/bookshelf) and the classroom
 *    bookcase. Prove each freeze fails when the deliverable is removed (A4).
 *  - RA-FS-3: narrow the mounted-fixture skip list to the fixtures that are truly
 *    mounted (chandelier, torch-sconce, wall-sconce). A free-standing fixture such as
 *    candle-cluster is an item and must rest on a board.
 *  - RA-FS-7: add an item height table with a clearance rule and an item depth table
 *    with a board-depth rule. Both apply to the in-scope shelves only.
 *  - RC-FS-1: assert the required item kinds of every shelf place. The lab must place
 *    a vial.
 *  - RA-FS-14: remove the always-true `shelf counts` assertion.
 *
 * Round 3 (Review A round 4):
 *  - RA-FS-15/17: give a bookshelf and a bookcase their measured centred footprint and
 *    fail when a floor prop footprint enters it. The guild-hall barrel at
 *    [-6.4, 0, 2.6] must fail.
 *  - RA-FS-16: fail when a haunted-library bookcase enters the door depth band
 *    (DEPTH.door and the door bounds at its scale).
 *  - RA-FS-18: correct the five under-measured item table entries from the stats.json
 *    bounds (sack height, basket depth, vial height, apple height, mug height).
 *
 * No WebGL, no network, no file write. The maps export `places()`; the five game views
 * run their build functions against a recording stub.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Timeline } from '../../src/apk3d/stage/timeline.js';
import type { GLTF, Stage3D } from '../../src/apk3d/stage/index.js';
import { buildHall } from '../../src/games/enchanted-library/view/hall.js';
import { buildLibrary, DEPTH, DOOR_SCALE } from '../../src/games/haunted-library/view/library.js';
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

// The shelf board geometry from `assets/shelf.ts`, used by the clearance and depth rules.
const BOARD_T = 0.045; // board thickness (m)
const BACK_INNER = 0.03; // back panel inner face, local z (m)
const BOARD_FRONT = 0.28; // board front edge, local z (m)
const FRAME_FRONT = 0.3; // frame front, local z (m), equals the footprint depth
const FRAME_TOP_BOTTOM = 1.43; // bottom of the frame board above the top board (m)

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
  scale: number;
  label: string;
  index: number;
}

interface BlockCase {
  asset: 'bookcase' | 'bookshelf';
  x: number;
  z: number;
  yawRad: number;
  scale: number;
  label: string;
  index: number;
}

interface BlockIssue {
  item: ItemPlace;
  block: BlockCase;
  detail: string;
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

/** The index of the shelf board whose top matches an item y, or -1 when none matches. */
function restingBoard(kind: CaseKind, y: number, scale: number): number {
  if (kind !== 'shelf') return -1;
  return SHELF_TOPS.map((t) => t * scale).findIndex((t) => Math.abs(y - t) <= TOL + 1e-6);
}

/** Structural pieces never counted as an item and never float over or inside a case. */
function isStructural(asset: string): boolean {
  const SUFFIX = /(floor|ground|road|path|river|water|wall|window|door|gate|arch|column|pillar|stairs|ladder|bridge|dock|pier|roof|chimney|ceiling|fence|railing|walkway|plank|beam)$/;
  const PREFIX = /^(wall|door|window|gate|arch|column|pillar|stairs|ladder|bridge|roof|chimney|ceiling|fence|railing|walkway|ruin|cliff|boulder|cave|tunnel|street|trail|hill|mountain|pond|puddle|snowbank|sand-dune)/;
  // Structural pieces and truly mounted fixtures are never a shelf item and never float
  // over or stand inside a case. Free-standing props (candle-cluster, lantern, torch,
  // candelabra, brazier, fireplace, campfire, campfire-out, watchfire) stand on y = 0 and
  // must be checked as items. The single `candle` stays an item (the archive candle is the
  // R3 target, and a desk candle is clutter).
  const NAMED = new Set([
    'carpet', 'rug', 'tapestry', 'curtain', 'banner', 'awning', 'beam', 'plank', 'archway', 'walkway', 'railing',
    'chandelier', 'torch-sconce', 'wall-sconce',
  ]);
  return SUFFIX.test(asset) || PREFIX.test(asset) || NAMED.has(asset);
}

// Item sizes in metres at scale 1, from the asset design notes. The clearance and depth
// rules only apply to item kinds that rest on an in-scope shelf board.
const ITEM_HEIGHT: Record<string, number> = {
  bottle: 0.22, vial: 0.132, jar: 0.45, basket: 0.47, crate: 0.41, sack: 0.437, bread: 0.17, apple: 0.133, mug: 0.124,
};
const ITEM_DEPTH: Record<string, number> = {
  bottle: 0.07, vial: 0.066, jar: 0.264, basket: 0.415, crate: 0.44, sack: 0.35, bread: 0.25, apple: 0.12, mug: 0.091,
};

// Measured case footprints, read from out/<asset>/stats.json. A bookshelf or a bookcase
// is centred on its origin (unlike a shelf, whose back face sits at the origin).
const BOOKSHELF_HALF_W = 0.5; // bookshelf size 1.0 wide
const BOOKSHELF_MIN_Z = -0.175;
const BOOKSHELF_MAX_Z = 0.193; // size 0.368 deep
const BOOKCASE_HALF_W = 0.64; // bookcase size 1.28 wide
const BOOKCASE_MIN_Z = -0.215;
const BOOKCASE_MAX_Z = 0.235; // size 0.45 deep

// The haunted-library door depth band. DEPTH.door and DOOR_SCALE come from library.ts;
// the door mesh z bounds (min z -0.13, max z 0.205) come from out/door/stats.json.
const DOOR_MIN_Z = -0.13;

// Floor prop footprint radius (half of the larger x or z extent) at scale 1, from
// out/<asset>/stats.json. Used only to keep solid props out of a bookshelf or bookcase.
const FLOOR_RADIUS: Record<string, number> = {
  barrel: 0.341, // x and z extent 0.681 (round)
  crate: 0.27, // 0.54 x 0.444
  sack: 0.178, // 0.355 x 0.32
  chest: 0.383, // 0.765 x 0.527
};

// The shelves that this track owns and must fix. Pre-existing shelves (apothecary,
// bakery, general-store) and the cabinets (school, archive) stay out of the clearance and
// depth rules.
const CLEARANCE_SCOPES = new Set([
  'potion-rush', 'alchemists-synthesis', 'rune-forge-chamber',
  'bathhouse', 'warehouse', 'inn', 'alchemy-lab',
]);

// The required item kinds per place, from spec.md FR-3. A missing kind is a failure (RC-FS-1).
const REQUIRED_KINDS: Record<string, string[]> = {
  'alchemists-synthesis': ['bottle', 'vial'],
  'potion-rush': ['bottle', 'bread', 'apple'],
  'rune-forge-chamber': ['crate', 'sack'],
  bathhouse: ['jar', 'basket'],
  warehouse: ['crate', 'sack'],
};

interface CaseCounts {
  shelf: number;
  bookcase: number;
  bookshelf: number;
}

// The frozen view case counts (Review A probe). Each count must fail when the deliverable
// is removed, which the A4 fixture proves.
const FROZEN_VIEW_CASES: Record<string, CaseCounts> = {
  'enchanted-library': { shelf: 0, bookcase: 8, bookshelf: 0 },
  'haunted-library': { shelf: 0, bookcase: 8, bookshelf: 0 },
  'potion-rush': { shelf: 2, bookcase: 0, bookshelf: 0 },
  'alchemists-synthesis': { shelf: 2, bookcase: 0, bookshelf: 0 },
  'rune-forge-chamber': { shelf: 2, bookcase: 0, bookshelf: 0 },
};

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

interface ClearanceIssue {
  item: ItemPlace;
  casePlace: CasePlace;
  head: number;
  nextBottom: number;
}

interface DepthIssue {
  item: ItemPlace;
  casePlace: CasePlace;
  detail: string;
}

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
  /** Items on an in-scope shelf whose top passes the board above. */
  clearanceIssues: ClearanceIssue[];
  /** Items on an in-scope shelf that enter the back panel or leave the board front. */
  depthIssues: DepthIssue[];
  /** Items on an in-scope shelf whose kind has no height or depth entry. */
  coverageIssues: string[];
  /** Every bookcase and bookshelf placement, in row order. */
  blocks: BlockCase[];
  /** Floor props whose footprint enters a bookcase or bookshelf footprint. */
  blockIssues: BlockIssue[];
}

function audit(rows: P[], label: string): Audit {
  const shelves: CasePlace[] = [];
  const cabinets: CasePlace[] = [];
  const blocks: BlockCase[] = [];
  const items: ItemPlace[] = [];
  rows.forEach((r, index) => {
    const [x, y, z] = r.at;
    if (r.asset === 'shelf') shelves.push({ kind: 'shelf', x, z, yawRad: (r.yaw ?? 0) * DEG, scale: r.scale ?? 1, label, index });
    else if (r.asset === 'cabinet') cabinets.push({ kind: 'cabinet', x, z, yawRad: (r.yaw ?? 0) * DEG, scale: r.scale ?? 1, label, index });
    else if (r.asset === 'bookcase' || r.asset === 'bookshelf') blocks.push({ asset: r.asset, x, z, yawRad: (r.yaw ?? 0) * DEG, scale: r.scale ?? 1, label, index });
    else if (!CASE_ASSETS.has(r.asset) && !isStructural(r.asset)) items.push({ asset: r.asset, x, y, z, scale: r.scale ?? 1, label, index });
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

  // Clearance and depth only apply to the shelves this track owns. A float (no matching
  // board) is reported by F3/F4, not here.
  const clearanceIssues: ClearanceIssue[] = [];
  const depthIssues: DepthIssue[] = [];
  const coverageIssues: string[] = [];
  if (CLEARANCE_SCOPES.has(label)) {
    for (const s of shelves) {
      for (const it of items) {
        if (it.y <= 0) continue;
        const local = toLocal(it.x - s.x, it.z - s.z, s.yawRad);
        if (!insideFootprint('shelf', local.x, local.z, s.scale)) continue;
        const bIdx = restingBoard('shelf', it.y, s.scale);
        if (bIdx < 0) continue;

        const h = ITEM_HEIGHT[it.asset];
        if (h === undefined) {
          coverageIssues.push(`${describeItem(it)} has no height entry (board ${bIdx + 1})`);
        } else {
          const head = it.y + h * it.scale;
          const nextBottom = bIdx < 2 ? (SHELF_TOPS[bIdx + 1]! - BOARD_T) * s.scale : FRAME_TOP_BOTTOM * s.scale;
          if (head > nextBottom + 0.001) clearanceIssues.push({ item: it, casePlace: s, head, nextBottom });
        }

        const d = ITEM_DEPTH[it.asset];
        if (d === undefined) {
          coverageIssues.push(`${describeItem(it)} has no depth entry (board ${bIdx + 1})`);
        } else {
          const half = (d * it.scale) / 2;
          const back = local.z - half;
          const front = local.z + half;
          const parts: string[] = [];
          if (back < BACK_INNER * s.scale - 0.001) parts.push(`back ${fmt(back)} enters the back panel (inner face ${fmt(BACK_INNER * s.scale)})`);
          if (local.z > BOARD_FRONT * s.scale) parts.push(`centre z ${fmt(local.z)} is in front of the board edge ${fmt(BOARD_FRONT * s.scale)}`);
          else if (front > FRAME_FRONT * s.scale + 0.001) parts.push(`front ${fmt(front)} passes the frame front ${fmt(FRAME_FRONT * s.scale)}`);
          if (parts.length > 0) depthIssues.push({ item: it, casePlace: s, detail: parts.join('; ') });
        }
      }
    }
  }

  // RA-FS-15/17: no solid floor prop footprint enters a bookshelf or bookcase footprint.
  // The footprint is a circle of radius FLOOR_RADIUS[asset] against the centred rectangle.
  const blockIssues: BlockIssue[] = [];
  for (const b of blocks) {
    const hw = b.asset === 'bookcase' ? BOOKCASE_HALF_W : BOOKSHELF_HALF_W;
    const minZ = b.asset === 'bookcase' ? BOOKCASE_MIN_Z : BOOKSHELF_MIN_Z;
    const maxZ = b.asset === 'bookcase' ? BOOKCASE_MAX_Z : BOOKSHELF_MAX_Z;
    for (const it of items) {
      if (it.y > TOL) continue; // a prop that stands on the floor
      const r = (FLOOR_RADIUS[it.asset] ?? 0) * it.scale;
      if (r <= 0) continue; // no measured footprint
      const local = toLocal(it.x - b.x, it.z - b.z, b.yawRad);
      const cx = Math.max(-hw * b.scale, Math.min(hw * b.scale, local.x));
      const cz = Math.max(minZ * b.scale, Math.min(maxZ * b.scale, local.z));
      const gap = Math.hypot(local.x - cx, local.z - cz) - r;
      if (gap <= TOL) blockIssues.push({ item: it, block: b, detail: `radius ${fmt(r)} overlaps by ${fmt(-gap)}` });
    }
  }

  const emptyShelves = shelves.filter((s) => (onShelf.get(s.index) ?? []).length === 0);
  return { shelves, cabinets, items, onShelf, emptyShelves, floats, inside, clearanceIssues, depthIssues, coverageIssues, blocks, blockIssues };
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

const ALL_AUDITS: { name: string; a: Audit }[] = [
  ...MAP_AUDITS.map((m) => ({ name: m.name, a: m.a })),
  ...VIEW_AUDITS.map((v) => ({ name: v.name, a: v.a })),
];

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

function viewCaseCounts(rows: P[]): CaseCounts {
  let shelf = 0;
  let bookcase = 0;
  let bookshelf = 0;
  for (const r of rows) {
    if (r.asset === 'shelf') shelf += 1;
    else if (r.asset === 'bookcase') bookcase += 1;
    else if (r.asset === 'bookshelf') bookshelf += 1;
  }
  return { shelf, bookcase, bookshelf };
}

function diffCaseCounts(name: string, got: CaseCounts, want: CaseCounts): string[] {
  const out: string[] = [];
  if (got.shelf !== want.shelf) out.push(`${name}: shelf ${got.shelf} != ${want.shelf}`);
  if (got.bookcase !== want.bookcase) out.push(`${name}: bookcase ${got.bookcase} != ${want.bookcase}`);
  if (got.bookshelf !== want.bookshelf) out.push(`${name}: bookshelf ${got.bookshelf} != ${want.bookshelf}`);
  return out;
}

function classroomBookcaseCount(rows: P[]): number {
  return rows.filter((r) => r.asset === 'bookcase').length;
}

function restingKinds(a: Audit): Set<string> {
  const out = new Set<string>();
  for (const held of a.onShelf.values()) {
    for (const it of held) out.add(it.asset);
  }
  return out;
}

/** RA-FS-16: the haunted-library bookcases must sit behind the door depth band. */
function hauntedDoorIssues(rows: P[]): string[] {
  const bandBack = DEPTH.door + DOOR_MIN_Z * DOOR_SCALE;
  const out: string[] = [];
  rows.forEach((r, index) => {
    if (r.asset !== 'bookcase') return;
    const front = r.at[2] + BOOKCASE_MAX_Z * (r.scale ?? 1);
    if (front > bandBack + TOL) {
      out.push(`row ${index} bookcase at [${fmt(r.at[0])}, ${fmt(r.at[1])}, ${fmt(r.at[2])}]: front ${fmt(front)} enters the door band (back ${fmt(bandBack)})`);
    }
  });
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
    const empties = filled.flatMap((n) => MAP_AUDITS.find((m) => m.name === n)!.a.emptyShelves);
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

  it('the frozen case counts and the classroom bookcase hold (RA-FS-4)', () => {
    const problems: string[] = [];
    for (const v of VIEW_AUDITS) {
      const want = FROZEN_VIEW_CASES[v.name];
      if (!want) {
        problems.push(`${v.name}: no frozen case counts`);
        continue;
      }
      problems.push(...diffCaseCounts(v.name, viewCaseCounts(v.rows), want));
    }
    const classroom = MAPS.find((m) => m.name === 'classroom')!;
    const cb = classroomBookcaseCount(classroom.rows);
    if (cb !== 1) problems.push(`classroom bookcase ${cb} != 1`);
    expect(problems, `frozen case counts:\n${problems.join('\n')}`).toEqual([]);
  });

  it('the frozen counts do not vacuous-pass when the deliverable is removed (RA-FS-4, A4)', () => {
    const pr = VIEW_AUDITS.find((v) => v.name === 'potion-rush')!;
    const prGone = pr.rows.filter((r) => r.asset !== 'shelf');
    const prProblems = diffCaseCounts('potion-rush', viewCaseCounts(prGone), FROZEN_VIEW_CASES['potion-rush']!);
    expect(prProblems, 'potion-rush freeze must fail when its shelves are removed').not.toEqual([]);

    const el = VIEW_AUDITS.find((v) => v.name === 'enchanted-library')!;
    const elGone = el.rows.filter((r) => r.asset !== 'bookcase');
    const elProblems = diffCaseCounts('enchanted-library', viewCaseCounts(elGone), FROZEN_VIEW_CASES['enchanted-library']!);
    expect(elProblems, 'enchanted-library freeze must fail when its bookcases are removed').not.toEqual([]);

    const classroom = MAPS.find((m) => m.name === 'classroom')!;
    const cmGone = classroom.rows.filter((r) => r.asset !== 'bookcase');
    expect(classroomBookcaseCount(cmGone), 'classroom bookcase freeze must fail when the bookcase is removed').not.toBe(1);
  });

  it('every item on an in-scope shelf clears the board above (RA-FS-7)', () => {
    const issues = ALL_AUDITS.flatMap(({ a }) => a.clearanceIssues);
    const msg = issues.map((f) => `${describeItem(f.item)} on ${describeCase(f.casePlace)}: top ${fmt(f.head)} passes the next board bottom ${fmt(f.nextBottom)}`).join('\n');
    expect(issues.length, `clearance issues:\n${msg}`).toBe(0);
  });

  it('every item on an in-scope shelf stays on the board (RA-FS-7)', () => {
    const issues = ALL_AUDITS.flatMap(({ a }) => a.depthIssues);
    const msg = issues.map((f) => `${describeItem(f.item)} on ${describeCase(f.casePlace)}: ${f.detail}`).join('\n');
    expect(issues.length, `board-depth issues:\n${msg}`).toBe(0);
  });

  it('every resting item kind has a height and a depth (RA-FS-7)', () => {
    const issues = ALL_AUDITS.flatMap(({ a }) => a.coverageIssues);
    expect(issues, `missing dimension coverage:\n${issues.join('\n')}`).toEqual([]);
  });

  it('each shelf place keeps its required item kinds (RC-FS-1)', () => {
    const problems: string[] = [];
    for (const [place, required] of Object.entries(REQUIRED_KINDS)) {
      const auditEntry = ALL_AUDITS.find((x) => x.name === place);
      if (!auditEntry) {
        problems.push(`${place}: no audit rows`);
        continue;
      }
      const present = restingKinds(auditEntry.a);
      const missing = required.filter((k) => !present.has(k));
      if (missing.length > 0) problems.push(`${place}: missing ${missing.join(', ')}`);
    }
    expect(problems, `missing required item kinds:\n${problems.join('\n')}`).toEqual([]);
  });

  it('no floor prop footprint enters a bookshelf or bookcase (RA-FS-15/17)', () => {
    const gh = MAP_AUDITS.find((m) => m.name === 'guild-hall')!;
    const issues = gh.a.blockIssues;
    const msg = issues.map((f) => `${describeItem(f.item)} enters the ${f.block.label} ${f.block.asset} at [${fmt(f.block.x)}, 0, ${fmt(f.block.z)}]: ${f.detail}`).join('\n');
    expect(issues.length, `floor props inside a bookshelf or bookcase:\n${msg}`).toBe(0);
  });

  it('the haunted-library bookcases clear the door depth band (RA-FS-16)', () => {
    const hv = VIEW_AUDITS.find((v) => v.name === 'haunted-library')!;
    const issues = hauntedDoorIssues(hv.rows);
    expect(issues, `bookcases in the door band:\n${issues.join('\n')}`).toEqual([]);
  });
});