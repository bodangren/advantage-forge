/**
 * Chibi Quest village: the settlement one size up from the hamlet, matched to
 * docs/village-mockups/village-quest_001.jpg. It reuses the hamlet kit (cottage, barn,
 * farm-field, fence, shop-stall, well, roads) and the tavern kit for an outdoor inn corner.
 *
 * +X is east, -Z is north, +Z is south. Yaw 0 faces south. Ground tiles are 2 m and meet
 * on even centers. A market square sits north of the east-west road; a lane runs north
 * from the square. Characters that are still being built are optional slots.
 */
import type { Place } from './chibi-quest.js';

// One grass ring beyond the border trees, so every trunk and canopy stands on the ground.
const XS = range(-18, 18, 2);
const ZS = range(-14, 14, 2);
const ROAD_Z = 2;

type Gate = 'n' | 's' | 'e' | 'w';

interface House {
  x: number;
  z: number;
  yaw: number;
  yardW: number;
  yardD: number;
  gate: Gate;
  /** Path end, on the near edge of a road or the square. */
  path: readonly [number, number];
}

const HOUSES: readonly House[] = [
  { x: -5.6, z: -9.2, yaw: 90, yardW: 6.6, yardD: 5.6, gate: 'e', path: [-1.2, -9.2] },
  { x: 5.6, z: -9.2, yaw: 270, yardW: 6.6, yardD: 5.6, gate: 'w', path: [1.2, -9.2] },
  { x: -11.8, z: -3.6, yaw: 90, yardW: 6.4, yardD: 6.0, gate: 'e', path: [-5.2, -3.2] },
  { x: 11.8, z: -3.6, yaw: 270, yardW: 6.4, yardD: 6.0, gate: 'w', path: [5.2, -3.2] },
  { x: -1.4, z: 7.8, yaw: 180, yardW: 6.8, yardD: 6.2, gate: 'n', path: [-1.4, 3.1] },
  { x: 6.4, z: 7.8, yaw: 180, yardW: 6.8, yardD: 6.2, gate: 'n', path: [6.4, 3.1] },
];

/** Market square cells (dirt), north of the road. */
const SQUARE: readonly (readonly [number, number])[] = [-6, -4, -2, 0, 2, 4, 6].flatMap((x) =>
  [-6, -4, -2, 0].map((z) => [x, z] as const),
);

/** Dirt patches in front of cottage doors. */
const FRONTS: readonly (readonly [number, number])[] = [
  [-4, -8], [-2, -8], [4, -8], [-8, -4], [-8, -2], [8, -4], [8, -2], [-2, 6], [6, 4], [6, 6], [-4, 4], [-4, 6],
];

/** Inn corner cells (dirt), south-east. */
const INN: readonly (readonly [number, number])[] = [
  [12, 6],
  [14, 6],
  [12, 8],
  [14, 8],
];

/** x, z, asset, yaw, scale. Border trees in clumps with gaps; roads stay open. Canopies stay on the ground. */
const TREES: readonly (readonly [number, number, 'oak-tree' | 'pine-tree', number, number])[] = [
  [-16.6, -12.4, 'pine-tree', 18, 0.9],
  [-14.2, -12.8, 'oak-tree', 140, 1.1],
  [-11.4, -12.2, 'oak-tree', 60, 0.82],
  [-9.0, -13.0, 'pine-tree', 200, 1.0],
  [-5.8, -12.9, 'oak-tree', 90, 0.74],
  [5.4, -12.8, 'oak-tree', 250, 1.05],
  [8.4, -12.3, 'pine-tree', 10, 0.86],
  [11.6, -12.9, 'oak-tree', 70, 1.15],
  [14.4, -12.2, 'oak-tree', 160, 0.8],
  [16.8, -12.8, 'pine-tree', 40, 1.08],
  [-17.0, -8.8, 'oak-tree', 110, 1.12],
  [-16.8, -5.6, 'pine-tree', 20, 0.72],
  [-17.4, -1.4, 'oak-tree', 300, 0.9],
  [17.2, -8.6, 'oak-tree', 45, 0.96],
  [16.9, -5.4, 'pine-tree', 80, 1.04],
  [17.4, -0.8, 'oak-tree', 15, 0.78],
  [-17.2, 5.6, 'pine-tree', 55, 0.94],
  [-17.0, 9.6, 'oak-tree', 125, 1.1],
  [-16.2, 12.8, 'oak-tree', 8, 0.8],
  [17.4, 4.6, 'oak-tree', 210, 0.86],
  [17.2, 11.4, 'pine-tree', 35, 1.0],
  [14.2, 12.9, 'oak-tree', 95, 1.12],
  [10.4, 12.8, 'pine-tree', 18, 0.76],
  [2.4, 12.9, 'oak-tree', 260, 0.9],
  [-4.8, 12.8, 'pine-tree', 75, 0.84],
  [-8.6, -6.2, 'oak-tree', 33, 0.62],
  [8.8, -6.0, 'oak-tree', 150, 0.66],
  [9.6, 11.8, 'oak-tree', 70, 0.64],
];

const BUSHES: readonly (readonly [number, number, number])[] = [
  [-8.9, -11.6, 20],
  [8.8, -11.4, 60],
  [-14.8, -0.2, 10],
  [14.9, -0.4, 80],
  [-5.6, 0.9, 30],
  [5.7, 0.8, 110],
  [3.2, 6.0, 0],
  [10.2, 5.8, 40],
  [-7.0, 12.4, 15],
  [15.6, 9.8, 70],
  [-3.2, -6.6, 50],
  [3.4, -6.8, 90],
];

const FLOWERS: readonly (readonly [number, number])[] = [
  [-7.8, -7.2],
  [7.9, -7.4],
  [-13.6, -6.2],
  [13.4, -6.4],
  [-3.4, 5.6],
  [8.8, 5.8],
  [-15.4, 3.6],
  [15.6, 3.8],
  [1.8, 11.6],
  [-9.8, -0.6],
  [9.9, -0.8],
  [4.6, -11.2],
];

export function villagePlaces(): Place[] {
  const places: Place[] = [...ground()];

  // Market square: the well, lanterns at the corners, two stalls on the north side.
  places.push(prop('well', -2.6, -1.4, 0));
  for (const [x, z] of [
    [-4.7, -4.7],
    [4.7, -4.7],
    [-4.7, 0.7],
    [4.7, 0.7],
  ] as const)
    places.push(prop('lantern', x, z, 0));
  places.push(prop('shop-stall', 0.2, -4.1, 0));
  places.push(prop('shop-stall', 3.1, -4.1, 0));
  places.push(prop('barrel', -1.5, -4.4, 20));
  places.push(prop('barrel', 4.7, -3.0, 40));
  places.push(prop('crate', 4.6, -2.2, 15));
  places.push(prop('crate', -1.4, -3.4, 70));
  places.push(prop('sack', -0.9, -2.9, 10));
  places.push(prop('sack', 4.2, -1.7, 60));
  places.push(prop('pumpkin', 1.7, -2.9, 15));
  places.push(prop('pumpkin', 2.3, -2.7, 50));
  places.push(prop('apple', 1.5, -3.4, 0));
  places.push(prop('apple', 1.62, -3.3, 30));
  places.push(prop('signpost', -5.4, 1.4, 0));

  // North lane gate and the road ends.
  places.push(prop('signpost', 2.2, -12.4, 180));
  places.push(prop('signpost', -16.2, 6.0, 90));
  places.push(prop('signpost', 16.2, -1.6, 270));
  for (const z of [-11.4, -7.6]) {
    places.push(prop('torch', -3.4, z, 0, 0, 1, true));
    places.push(prop('torch', 1.4, z, 0, 0, 1, true));
  }

  // Farm: the barn faces the road; two fields behind a fence to the south.
  places.push(prop('barn', -12.0, 6.6, 180));
  places.push(prop('farm-field', -13.0, 11.0, 0));
  places.push(prop('farm-field', -8.5, 11.0, 0));
  places.push(...fenceRect(-10.75, 11.0, 9.6, 4.2, 'n'));
  places.push(prop('hay-bale', -8.4, 4.6, 15));
  places.push(prop('hay-bale', -7.7, 5.1, 40));
  places.push(prop('hay-bale', -8.3, 5.5, 70));
  places.push(prop('barrel', -15.2, 4.2, 25));
  places.push(prop('pumpkin', -6.9, 9.4, 40));

  // Cottages with fenced yards and stepping-stone paths.
  for (const house of HOUSES) {
    places.push(prop('cottage', house.x, house.z, house.yaw));
    if (house === HOUSES[1] || house === HOUSES[4])
      places.push(...fenceRect(house.x, house.z, house.yardW, house.yardD, house.gate));
    const [dx, dz] = offset(house.yaw, 1.45);
    const gate = gateCenter(house);
    const out = beyond(house.x, house.z, gate, 1.1);
    places.push(...stonesAlong([[house.x + dx, house.z + dz], gate, out, house.path]));
  }
  places.push(prop('clothesline', -1.4, 10.3, 0));
  places.push(prop('clothesline', 12.0, -5.7, 90));

  // Inn corner, south-east: tables, stools, a bench, drinks, and barrels.
  const TOP = 0.6;
  places.push(prop('round-table', 12.2, 6.2, 0));
  places.push(prop('round-table', 14.4, 8.4, 30));
  for (const [x, z, yaw] of [
    [11.3, 6.1, 90],
    [13.1, 6.3, 270],
    [12.2, 7.1, 180],
    [13.5, 8.5, 90],
    [15.3, 8.3, 270],
  ] as const)
    places.push(prop('stool', x, z, yaw));
  places.push(prop('bench', 13.3, 4.9, 0));
  places.push(prop('tankard', 12.0, 6.05, 20, TOP));
  places.push(prop('mug', 12.45, 6.35, 80, TOP));
  places.push(prop('tankard', 14.3, 8.2, 140, TOP));
  places.push(prop('bread', 14.6, 8.6, 10, TOP, 1, true));
  places.push(prop('barrel', 15.3, 5.4, 10));
  places.push(prop('barrel', 15.6, 6.3, 70));
  places.push(prop('crate', 11.0, 8.9, 25));

  // People. The new NPCs are optional until their GLBs exist.
  places.push(prop('shopkeeper', 0.2, -5.4, 0, 0, 1, true));
  places.push(prop('quest-giver', -0.9, -0.2, 110, 0, 1, true));
  places.push(prop('adventurer', 0.4, 0.3, 250));
  places.push(prop('villager', 7.6, -1.9, 270, 0, 1, true));
  places.push(prop('innkeeper', 13.6, 7.0, 220, 0, 1, true));
  places.push(prop('farmer', -9.6, 10.6, 200));
  places.push(prop('guard', -0.9, -12.0, 180));
  places.push(prop('blacksmith', 3.0, -1.9, 160));

  for (const [x, z, asset, yaw, scale] of TREES) places.push(prop(asset, x, z, yaw, 0, scale));
  for (const [x, z, yaw] of BUSHES) places.push(prop('bush', x, z, yaw));
  for (const [x, z] of FLOWERS) places.push(prop('wildflowers', x, z, (x * 40 + z * 20) % 360));
  places.push(prop('rock-cluster', -15.0, -10.6, 70));
  places.push(prop('rock-cluster', 15.2, 11.2, 280));
  places.push(prop('fallen-log', 13.8, -10.8, 35));
  places.push(prop('tree-stump', -13.4, -9.4, 0));
  places.push(prop('boulder', 9.8, 5.6, 20, 0, 0.9));
  places.push(prop('boulder', -10.4, -0.2, 60, 0, 0.8));
  return places;
}

function ground(): Place[] {
  const cells = new Map<string, { asset: string; yaw: number }>();
  const id = (x: number, z: number) => `${x}:${z}`;
  for (const x of XS) for (const z of ZS) cells.set(id(x, z), { asset: 'grass-ground', yaw: 0 });
  const paint = (x: number, z: number, asset: string, yaw = 0) => {
    if (cells.has(id(x, z))) cells.set(id(x, z), { asset, yaw });
  };
  // Warm sand for the square, the lanes, and the door fronts, as in the mockup (dirt-ground
  // read as dark mud at this size).
  const SAND = 'desert-ground';
  for (const [x, z] of SQUARE) paint(x, z, SAND);
  for (const [x, z] of INN) paint(x, z, SAND);
  for (const [x, z] of FRONTS) paint(x, z, SAND);
  // Wide east-west lane (two tiles) that bends north-east at x = 8.
  for (const x of XS) {
    if (x <= 6) {
      paint(x, ROAD_Z, SAND);
      paint(x, ROAD_Z + 2, SAND);
    } else {
      paint(x, 0, SAND);
      paint(x, ROAD_Z, SAND);
    }
  }
  paint(8, 4, SAND);
  // Wide north lane out of the square.
  for (const z of ZS) if (z <= -8) { paint(-2, z, SAND); paint(0, z, SAND); }
  const places: Place[] = [];
  for (const [k, cell] of cells) {
    const [x, z] = k.split(':').map(Number) as [number, number];
    places.push(prop(cell.asset, x, z, cell.yaw));
  }
  return places;
}

function fenceRect(x: number, z: number, w: number, d: number, gate: Gate): Place[] {
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const z0 = z - d / 2;
  const z1 = z + d / 2;
  return [
    ...fenceSide(x0, z0, x1, z0, gate === 'n'),
    ...fenceSide(x0, z1, x1, z1, gate === 's'),
    ...fenceSide(x0, z0, x0, z1, gate === 'w'),
    ...fenceSide(x1, z0, x1, z1, gate === 'e'),
  ];
}

/** Fence runs along local +X. A gate is a 1.8 m hole in the middle of the side. */
function fenceSide(x0: number, z0: number, x1: number, z1: number, open: boolean): Place[] {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  const yaw = (Math.atan2(-dz, dx) * 180) / Math.PI;
  const gap = open ? 1.8 : 0;
  const runs: readonly (readonly [number, number])[] = open
    ? [
        [0, (len - gap) / 2],
        [(len + gap) / 2, len],
      ]
    : [[0, len]];
  const places: Place[] = [];
  for (const [start, end] of runs) {
    const run = end - start;
    if (run < 0.85) continue;
    const count = Math.max(1, Math.round(run / 1.8));
    for (let i = 0; i < count; i++) {
      const t = (start + ((i + 0.5) / count) * run) / len;
      places.push(prop('fence', x0 + dx * t, z0 + dz * t, yaw));
    }
  }
  return places;
}

function gateCenter(house: House): [number, number] {
  if (house.gate === 'n') return [house.x, house.z - house.yardD / 2];
  if (house.gate === 's') return [house.x, house.z + house.yardD / 2];
  if (house.gate === 'w') return [house.x - house.yardW / 2, house.z];
  return [house.x + house.yardW / 2, house.z];
}

function beyond(x: number, z: number, gate: readonly [number, number], dist: number): [number, number] {
  const dx = gate[0] - x;
  const dz = gate[1] - z;
  const len = Math.hypot(dx, dz) || 1;
  return [gate[0] + (dx / len) * dist, gate[1] + (dz / len) * dist];
}

/** Stepping stones along a polyline, as in the hamlet. */
function stonesAlong(points: readonly (readonly [number, number])[]): Place[] {
  const places: Place[] = [];
  const step = 1.62;
  let cursor = 0.85;
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1]!;
    const to = points[i]!;
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const len = Math.hypot(dx, dz);
    if (len < 0.2) continue;
    const yaw = (Math.atan2(dx, dz) * 180) / Math.PI;
    let along = cursor;
    while (along < len - 0.45) {
      const t = along / len;
      places.push(prop('stepping-stone', from[0] + dx * t, from[1] + dz * t, yaw, 0, 1, true));
      along += step;
    }
    cursor = Math.max(0.4, along - len);
  }
  return places;
}

/** Local +Z after a yaw, in world XZ. */
function offset(yaw: number, dist: number): [number, number] {
  const t = (yaw * Math.PI) / 180;
  return [Math.sin(t) * dist, Math.cos(t) * dist];
}

function prop(asset: string, x: number, z: number, yaw = 0, y = 0, scale = 1, optional = false): Place {
  const place: Place = { asset, at: [x, y, z] };
  if (yaw !== 0) place.yaw = yaw;
  if (scale !== 1) place.scale = scale;
  if (optional) place.optional = true;
  return place;
}

function range(from: number, to: number, step: number): number[] {
  const values: number[] = [];
  for (let v = from; v <= to + 1e-6; v += step) values.push(Math.round(v * 1000) / 1000);
  return values;
}
