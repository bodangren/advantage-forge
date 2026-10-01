/**
 * Chibi Quest hamlet. One assembly of the baked GLBs, matched to
 * docs/hamlet-mockups/chibi-quest.png.
 *
 * +X is east, -Z is north, +Z is south. The well is the origin.
 * Yaw 0 faces south. Ground tiles are 2 m and meet on even centers.
 *
 * These props are still in progress. The page skips a slot when its GLB
 * is absent, and shows it when the file arrives:
 *   hay-bale, well-stone (one rock, placed as a ring) or well-stones (one ring),
 *   stepping-stone, clothesline.
 */

export interface Place {
  asset: string;
  at: readonly [number, number, number];
  /** Degrees around Y. 0 faces south (+Z). */
  yaw?: number;
  scale?: number;
  /** Absent GLB is a gap, not an error. */
  optional?: boolean;
}

const TILE = 2;
const RIVER_Z = 12;

// One grass ring beyond the border trees, so every trunk and canopy stands on the ground.
const XS: readonly number[] = range(-20, 20, TILE);
const ZS: readonly number[] = range(-18, 16, TILE);

type Gate = 'n' | 's' | 'e' | 'w';

interface House {
  x: number;
  z: number;
  yaw: number;
  yardW: number;
  yardD: number;
  gate: Gate;
  /** Path end, on the near edge of a road. */
  path: readonly [number, number];
}

const HOUSES: readonly House[] = [
  { x: -9, z: -12.2, yaw: 0, yardW: 7.4, yardD: 6.8, gate: 's', path: [-9, -1.35] },
  { x: -14.6, z: -6.4, yaw: 90, yardW: 7.2, yardD: 6.6, gate: 'e', path: [-10.2, -1.35] },
  { x: -5, z: -6.6, yaw: 0, yardW: 7.2, yardD: 6.6, gate: 's', path: [-5, -1.35] },
  { x: 8.2, z: -12.2, yaw: 0, yardW: 7.4, yardD: 6.8, gate: 's', path: [9.2, -1.35] },
  { x: 13.8, z: -6.5, yaw: 270, yardW: 7.2, yardD: 6.6, gate: 'w', path: [9.6, -1.35] },
  { x: -4.6, z: 5.8, yaw: 180, yardW: 6.4, yardD: 6.6, gate: 'n', path: [-4.6, 1.4] }, // yard x -7.8 to -1.4: clear of the N-S road (x -1 to 1) and the farm fence (x -8.2)
  { x: 7.4, z: 6.2, yaw: 180, yardW: 7.4, yardD: 6.8, gate: 'n', path: [7.4, 1.4] },
];

/**
 * x, z, asset, yaw, scale. Border trees sit in clumps with gaps, not on a frame.
 * Every trunk and canopy stays on the ground (the outer grass ring carries them).
 * A few smaller trees stand in the meadows.
 */
const TREES: readonly (readonly [number, number, 'oak-tree' | 'pine-tree', number, number])[] = [
  [-17.4, -16.2, 'pine-tree', 18, 0.68],
  [-15.5, -14.4, 'oak-tree', 140, 1.18],
  [-16.8, -13.2, 'oak-tree', 60, 0.78],
  [-11.6, -16.6, 'oak-tree', 200, 0.84],
  [-10.2, -14.6, 'pine-tree', 30, 1.12],
  [-12.8, -13.6, 'oak-tree', 90, 0.66],
  [-5.8, -14.8, 'oak-tree', 250, 1.05],
  [-4.2, -16.8, 'pine-tree', 10, 0.74],
  [5.4, -16.4, 'oak-tree', 70, 0.7],
  [6.8, -14.2, 'oak-tree', 160, 1.2],
  [8.6, -16.2, 'pine-tree', 40, 0.86],
  [13.4, -14.8, 'pine-tree', 110, 1.08],
  [15.8, -16.6, 'oak-tree', 20, 0.76],
  [14.6, -13.4, 'oak-tree', 300, 0.92],
  [-18.2, -11.4, 'oak-tree', 45, 1.14],
  [-16.4, -10.2, 'pine-tree', 80, 0.72],
  [-17.6, -7.4, 'oak-tree', 15, 0.88],
  [-15.8, -8.6, 'oak-tree', 190, 1.06],
  [-18.0, -5.2, 'pine-tree', 55, 0.64],
  [-17.2, 3.6, 'oak-tree', 125, 0.96],
  [-15.6, 5.2, 'pine-tree', 8, 0.7],
  [-18.2, 6.4, 'oak-tree', 210, 1.16],
  [-16.6, 10.6, 'oak-tree', 35, 0.82],
  [-18.4, 9.2, 'pine-tree', 95, 1.02],
  [18.2, -12.6, 'pine-tree', 22, 0.9],
  [16.2, -11.2, 'oak-tree', 175, 1.15],
  [17.8, -8.4, 'oak-tree', 50, 0.68],
  [15.4, -6.8, 'pine-tree', 130, 0.86],
  [18.4, -4.6, 'oak-tree', 240, 1.04],
  [16.8, 3.8, 'oak-tree', 12, 0.74],
  [18.2, 5.6, 'pine-tree', 88, 1.12],
  [15.2, 7.4, 'oak-tree', 155, 0.82],
  [17.6, 10.2, 'oak-tree', 40, 1.08],
  [18.6, 8.2, 'pine-tree', 200, 0.66],
  [-16.4, 13.2, 'oak-tree', 28, 1.1],
  [-14.2, 15.2, 'pine-tree', 75, 0.78],
  [-15.6, 15.8, 'oak-tree', 140, 0.64],
  [-8.6, 13.6, 'pine-tree', 18, 0.92],
  [-10.4, 14.9, 'oak-tree', 260, 1.16],
  [-6.2, 15.7, 'oak-tree', 95, 0.72],
  [4.6, 15.4, 'oak-tree', 33, 0.8],
  [6.8, 13.4, 'pine-tree', 150, 1.05],
  [8.2, 15.8, 'oak-tree', 70, 0.66],
  [13.2, 14.8, 'oak-tree', 210, 1.14],
  [15.6, 13.2, 'pine-tree', 48, 0.76],
  [16.8, 15.4, 'oak-tree', 120, 0.9],
  [3.6, -9.2, 'oak-tree', 64, 0.7],
  [2.2, 9.6, 'oak-tree', 18, 0.66],
  [-15.2, 1.2, 'oak-tree', 100, 0.72],
];

const BUSHES: readonly (readonly [number, number, number])[] = [
  [-11.2, -9.4, 20],
  [-7.2, -9.2, 60],
  [5.4, -9.6, 10],
  [11.2, -9.2, 80],
  [-7.0, 8.4, 30], // back corner of the yard at x -4.6
  [4.2, 3.8, 110],
  [-7.4, 1.7, 0],
  [14.2, 3.2, 40],
  [-3.2, -14.6, 15],
  [10.4, 10.2, 70],
  [1.8, -5.2, 50],
  [-2.1, 3.4, 90], // front corner of the yard at x -4.6
];

const FLOWERS: readonly (readonly [number, number])[] = [
  [-7.6, -11.4],
  [-12.8, -6.6],
  [-3.6, -6.2],
  [6.6, -11.2],
  [12.2, -6.6],
  [-3.2, 3.3], // in front of the cottage at x -4.6
  [6.0, 5.6],
  [1.6, 4.2],
  [-2.2, -4.4],
  [10.6, 2.2],
  [-15.2, -3.2],
  [14.8, 7.4],
];

const BOULDERS: readonly (readonly [number, number, number, number])[] = [
  [-15.4, 11.1, 20, 1.15],
  [-8.2, 10.85, 60, 0.9],
  [4.8, 10.9, 10, 1.05],
  [11.6, 11.15, 80, 1.2],
  [-6.4, 13.35, 30, 0.85],
  [8.2, 13.4, 110, 1],
  [-16.2, -3.4, 0, 1.1],
  [15.4, 6.4, 40, 0.95],
  [2.8, -14.6, 15, 0.8],
  [-10.6, 14.1, 70, 1.05],
];

/** Worn yards. Roads and the river overwrite these cells. */
const DIRT: readonly (readonly [number, number])[] = [
  [4, -2],
  [6, -2],
  [8, -2],
  [4, -4],
  [6, -4],
  [8, -4],
  [-14, 6],
  [-12, 6],
  [-10, 6],
];

export function chibiQuestPlaces(): Place[] {
  const places: Place[] = [...ground()];

  places.push(prop('well', 0, 0, 0));
  for (const [x, z] of [
    [1.7, -1.7],
    [1.7, 1.7],
    [-1.7, 1.7],
    [-1.7, -1.7],
  ] as const)
    places.push(prop('lantern', x, z, 0));

  places.push(prop('shop-stall', 3.9, -3.55, 0));
  places.push(prop('shop-stall', 6.85, -3.55, 0));
  places.push(prop('barrel', 3.05, -2.55, 20));
  places.push(prop('barrel', 7.7, -2.7, 40));
  places.push(prop('barrel', 5.2, -4.55, 10));
  places.push(prop('pumpkin', 4.6, -2.35, 15));
  places.push(prop('pumpkin', 6.2, -4.35, 50));
  places.push(prop('apple', 3.4, -4.3, 0));
  places.push(prop('apple', 3.55, -4.15, 30));
  places.push(prop('apple', 7.55, -4.4, 80));

  places.push(prop('signpost', -15.4, 1.7, 0));
  places.push(prop('signpost', 15.4, -1.7, 180));

  places.push(prop('barn', -13.2, 4.0, 0));
  places.push(prop('farm-field', -13.2, 8.55, 0));
  places.push(...fenceRect(-12.4, 6.0, 8.4, 9.5, 'n'));
  places.push(prop('barrel', -9.5, 4.5, 25));
  places.push(prop('barrel', -9.5, 5.6, 70));
  places.push(prop('pumpkin', -10.5, 7.3, 10));
  places.push(prop('pumpkin', -15.7, 8.4, 40));
  places.push(prop('pumpkin', -11.4, 10.4, 80));

  for (const house of HOUSES) {
    places.push(prop('cottage', house.x, house.z, house.yaw));
    places.push(...fenceRect(house.x, house.z, house.yardW, house.yardD, house.gate));
    const [dx, dz] = offset(house.yaw, 1.45);
    const gate = gateCenter(house);
    const out = beyond(house.x, house.z, gate, 1.35);
    places.push(...stonesAlong([[house.x + dx, house.z + dz], gate, out, house.path]));
  }

  for (const [x, z, asset, yaw, scale] of TREES) places.push(prop(asset, x, z, yaw, 0, scale));
  for (const [x, z, yaw] of BUSHES) places.push(prop('bush', x, z, yaw, 0, 1));
  for (const [x, z] of FLOWERS) places.push(prop('wildflowers', x, z, (x * 40 + z * 20) % 360));
  for (const [x, z, yaw, scale] of BOULDERS) places.push(prop('boulder', x, z, yaw, 0, scale));

  // Props still being built. One name each. The viewer drops a missing file.
  places.push(prop('hay-bale', -10.1, 2.4, 15, 0, 1, true));
  places.push(prop('hay-bale', -9.3, 2.7, 40, 0, 1, true));
  places.push(prop('hay-bale', -10.0, 3.3, 70, 0, 1, true));
  places.push(prop('clothesline', -11.6, -10.2, 90, 0, 1, true));
  places.push(prop('clothesline', -6.2, 4.4, 8, 0, 1, true));
  places.push(prop('well-stones', 0, 0, 0, 0, 1, true));
  const ring = 14;
  const radius = 1.62;
  for (let i = 0; i < ring; i++) {
    const a = (i / ring) * Math.PI * 2;
    places.push(prop('well-stone', Math.cos(a) * radius, Math.sin(a) * radius, (a * 180) / Math.PI, 0, 1, true));
  }

  return places;
}

function ground(): Place[] {
  const cells = new Map<string, { asset: string; yaw: number }>();
  const id = (x: number, z: number) => `${x}:${z}`;
  for (const x of XS) for (const z of ZS) cells.set(id(x, z), { asset: 'grass-ground', yaw: 0 });

  const paint = (x: number, z: number, asset: string, yaw = 0) => {
    if (!cells.has(id(x, z))) return;
    cells.set(id(x, z), { asset, yaw });
  };

  for (const [x, z] of DIRT) paint(x, z, 'dirt-ground');
  for (const x of XS) if (x !== 0) paint(x, 0, 'dirt-road-straight', 90);
  for (const z of ZS) if (z !== 0 && z !== RIVER_Z) paint(0, z, 'dirt-road-straight', 0);
  paint(0, 0, 'dirt-ground');
  for (const x of XS) paint(x, RIVER_Z, 'river-straight', 90);

  const places: Place[] = [];
  for (const [k, cell] of cells) {
    const [x, z] = k.split(':').map(Number) as [number, number];
    places.push(prop(cell.asset, x!, z!, cell.yaw));
  }
  places.push(prop('bridge', 0, RIVER_Z, 90, 0.01)); // 1 cm above the river banks at y = 0
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

/**
 * Fence runs along local +X. A gate is a 1.8 m hole in the middle of the side,
 * in line with the cottage door.
 */
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
      const dist = start + ((i + 0.5) / count) * run;
      const t = dist / len;
      places.push(prop('fence', x0 + dx * t, z0 + dz * t, yaw));
    }
  }
  return places;
}

/** Middle of the gate. The door faces this point. */
function gateCenter(house: House): [number, number] {
  if (house.gate === 'n') return [house.x, house.z - house.yardD / 2];
  if (house.gate === 's') return [house.x, house.z + house.yardD / 2];
  if (house.gate === 'w') return [house.x - house.yardW / 2, house.z];
  return [house.x + house.yardW / 2, house.z];
}

/** A point past `gate`, moving away from the house. */
function beyond(x: number, z: number, gate: readonly [number, number], dist: number): [number, number] {
  const dx = gate[0] - x;
  const dz = gate[1] - z;
  const len = Math.hypot(dx, dz) || 1;
  return [gate[0] + (dx / len) * dist, gate[1] + (dz / len) * dist];
}

/**
 * One stepping-stone model is a 1.5 m run of stones on a 2 m grass square.
 * Pieces follow the polyline and face along it, with a gap at each bend so a
 * square does not cross a fence. The viewer hides the grass square.
 */
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
    cursor = along - len;
    if (cursor < 0.4) cursor = 0.4;
  }
  return places;
}

/** Local +Z after a yaw, in world XZ. */
function offset(yaw: number, dist: number): [number, number] {
  const t = (yaw * Math.PI) / 180;
  return [Math.sin(t) * dist, Math.cos(t) * dist];
}

function prop(
  asset: string,
  x: number,
  z: number,
  yaw = 0,
  y = 0,
  scale = 1,
  optional = false,
): Place {
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
