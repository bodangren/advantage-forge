import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * architecture/building-parts/brick-wall — garden wall tile (Chibi Quest village set).
 *
 * Role: free-standing boundary wall tile that butts against plaster-wall on the same 2 m
 *   module; must read at 128 px in the village map.
 * Size: 2.0 m long (X), 1.5 m tall, 0.18 m thick; stands on y = 0, centered on z = 0,
 *   flat cut ends at x = ±1 so tiles butt cleanly.
 * One idea: plump hand-made bread-loaf bricks in running bond, creamy mortar showing fat
 *   between them, a chunky pale stone capping — the mock's cheerful masonry.
 * Shape language: rounded chunky (22 mm bevels on every brick) inside a square slab mass.
 * Palette: brick #b8584a with lighter #d07c62 and darker #99473b courses; mortar #e6dcc3;
 *   cap stone #eadfc7 shading to #c6b896. Value plan: mid bricks, pale joints, light cap.
 * Materials: brick (roughness 0.9), mortar (0.95), cap stone (0.88) — one body each.
 * Detail list: bricks + cap blocks (big), mortar joints + per-brick jitter (medium),
 *   grain, mottle, dirt wash at the base (small).
 * Rig/animation: none.
 */

const BRICK = rgb('#b8584a'); // contract
const BRICK_LIGHT = rgb('#d07c62'); // paler kiln bricks
const BRICK_DARK = rgb('#99473b'); // over-fired bricks, mottle, dirt
const MORTAR = rgb('#e6dcc3'); // pale creamy joints
const MORTAR_SHADE = rgb('#cdc0a2'); // recessed mortar, mottle
const CAP = rgb('#eadfc7'); // pale cap stone
const CAP_SHADE = rgb('#c6b896'); // weathered cap, shadowed underside
const CAP_LIGHT = rgb('#f4ecd9'); // sun-bleached cap tops

const LEN = 2.0; // flush ends at x = ±1, matches plaster-wall
const H = 1.5; // total height, cap top at exactly H
const D = 0.18; // wall thickness along Z
const CAP_H = 0.09;
const WALL_H = H - CAP_H; // 1.41 m of brickwork
const COURSES = 10;
const CH = WALL_H / COURSES; // 0.141 m course height
const FULL = 0.4; // brick spacing along a course
const HALF = FULL / 2;
const JOINT_X = 0.011; // half of a 22 mm vertical joint
const JOINT_Y = 0.009; // half of an 18 mm bed joint
const R = 0.027; // chunky brick bevel

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Brick cells of one course; odd courses shift by half a brick (running bond). */
const rowCells = (row: number): Array<{ x0: number; x1: number }> => {
  const cells: Array<{ x0: number; x1: number }> = [];
  if (row % 2 === 0) {
    for (let i = 0; i < 5; i++) cells.push({ x0: -1 + i * FULL, x1: -1 + (i + 1) * FULL });
  } else {
    cells.push({ x0: -1, x1: -1 + HALF });
    for (let i = 0; i < 4; i++)
      cells.push({ x0: -1 + HALF + i * FULL, x1: -1 + HALF + (i + 1) * FULL });
    cells.push({ x0: 1 - HALF, x1: 1 });
  }
  return cells;
};

// ------------------------------------------------------------ brick layout (module scope)
interface Piece {
  x: number; // center X
  y: number; // center Y
  v: number; // per-piece tint seed
}

const brickShapes: Sdf[] = [];
const brickIds: Piece[] = [];

for (let row = 0; row < COURSES; row++) {
  for (const cell of rowCells(row)) {
    const i = brickIds.length;
    const rnd = (s: number): number => noise.random(i * 7 + 1, row * 13 + s, 5);
    // Shrink inner edges for mortar joints; keep the outer ends flush so tiles butt.
    const x0 = cell.x0 <= -1 + 1e-6 ? cell.x0 : cell.x0 + JOINT_X;
    const x1 = cell.x1 >= 1 - 1e-6 ? cell.x1 : cell.x1 - JOINT_X;
    const y0 = row * CH + JOINT_Y + rnd(3) * 0.005; // slight settling upward
    const y1 = (row + 1) * CH - JOINT_Y;
    const depth = D - 0.006 - rnd(1) * 0.008;
    const cx = (x0 + x1) / 2 + (rnd(4) - 0.5) * 0.008;
    const cy = (y0 + y1) / 2;
    const yaw = (rnd(2) - 0.5) * 2.4; // hand-laid tilt
    brickShapes.push(sdf.box([x1 - x0, y1 - y0, depth], R).rotateZ(yaw).at(cx, cy, 0));
    brickIds.push({ x: (x0 + x1) / 2, y: cy, v: noise.random(i * 3 + 2, row * 11 + 7, 9) });
  }
}

const wall = sdf.intersect(
  sdf.union(...brickShapes),
  sdf.box([LEN, H + 0.2, 0.44]).at(0, (H + 0.2) / 2 - 0.03, 0),
);

// ------------------------------------------------------------- cap blocks (module scope)
const capShapes: Sdf[] = [];
const capIds: Piece[] = [];
const capJoints = [-1, -0.5, 0, 0.5, 1];

for (let b = 0; b < 4; b++) {
  const outer = b === 0 || b === 3;
  const x0 = (capJoints[b] ?? 0) + (b === 0 ? 0 : 0.0075);
  const x1 = (capJoints[b + 1] ?? 0) - (b === 3 ? 0 : 0.0075);
  const drop = noise.random(b * 5 + 3, 2, 8) * 0.006; // uneven capping, tops level
  const hgt = CAP_H - drop;
  const dx = outer ? 0 : (noise.random(b * 9 + 1, 4, 3) - 0.5) * 0.008;
  const cx = (x0 + x1) / 2 + dx;
  capShapes.push(sdf.box([x1 - x0, hgt, 0.22], 0.02).at(cx, H - hgt / 2, 0));
  capIds.push({ x: (x0 + x1) / 2, y: H - hgt / 2, v: noise.random(b * 4 + 3, 6, 2) });
}
const cap = sdf.union(...capShapes);

/** Nearest piece id, y weighted so neighbours on the course above never win. */
const nearest = (x: number, y: number, pieces: Piece[]): Piece => {
  let best = pieces[0] as Piece;
  let bd = Infinity;
  for (const p of pieces) {
    const dx = x - p.x;
    const dy = (y - p.y) * 5;
    const d = dx * dx + dy * dy;
    if (d < bd) {
      bd = d;
      best = p;
    }
  }
  return best;
};

const brickPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const v = nearest(x, y, brickIds).v;
  let c = base;
  if (v > 0.58) c = mixRgb(c, BRICK_LIGHT, ((v - 0.58) / 0.42) * 0.62);
  else if (v < 0.42) c = mixRgb(c, BRICK_DARK, ((0.42 - v) / 0.42) * 0.55);
  const mottle = noise.fbm(x * 16, y * 16, z * 16, 3, 11);
  c = mixRgb(c, BRICK_DARK, clamp01(-mottle) * 0.16);
  c = mixRgb(c, BRICK_LIGHT, clamp01(mottle) * 0.08);
  // Mud splash marks the base course.
  c = mixRgb(c, BRICK_DARK, smoothstep(0.34, 0.02, y) * 0.28);
  return c;
};

const mortarPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const m = noise.fbm(x * 7, y * 9, z * 7, 3, 21);
  let c = mixRgb(base, MORTAR_SHADE, clamp01(-m) * 0.3);
  c = mixRgb(c, CAP_LIGHT, clamp01(m) * 0.14);
  return c;
};

const capPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const v = nearest(x, y, capIds).v;
  let c = base;
  if (v > 0.55) c = mixRgb(c, CAP_LIGHT, ((v - 0.55) / 0.45) * 0.5);
  else if (v < 0.45) c = mixRgb(c, CAP_SHADE, ((0.45 - v) / 0.45) * 0.4);
  const mottle = noise.fbm(x * 10, y * 12, z * 10, 3, 17);
  c = mixRgb(c, CAP_SHADE, clamp01(-mottle) * 0.18);
  // Shade where the cap meets the brickwork, so the overhang reads at sprite size.
  c = mixRgb(c, CAP_SHADE, smoothstep(H - 0.045, H - CAP_H, y) * 0.3);
  return c;
};

export default defineAsset({
  name: 'brick-wall',
  description:
    'Garden wall tile: plump rounded bricks in running bond with pale creamy mortar and a chunky pale stone capping; 2 m, flat ends, tiles with plaster-wall on the same grid.',
  reference: 'docs/item-mockups/brick-wall-mock.jpg',
  detail: 0.014,
  texture: { size: 1024 },

  build(k) {
    // Brickwork: one body, bricks proud of the mortar bed by ~15 mm a side.
    k.body('brick', wall.paintFn(brickPaint), {
      color: BRICK,
      roughness: 0.9,
      metalness: 0,
      detail: 0.012,
      maxError: 0.0025,
      maxTriangles: 4200,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0005 * noise.fbm(x * 30, y * 30, z * 30, 3, 5) +
        0.0002 * noise.noise3(x * 90, y * 90, z * 90, 3),
    });

    // Mortar bed: recessed slab behind the bricks, its ends stepped back so the cut
    // brick headers stand proud at x = ±1.
    k.body(
      'mortar',
      sdf.box([LEN - 0.02, WALL_H, 0.15], 0.008)
        .at(0, WALL_H / 2, 0)
        .paintFn(mortarPaint),
      {
        color: MORTAR,
        roughness: 0.95,
        metalness: 0,
        detail: 0.02,
        maxError: 0.003,
        maxTriangles: 500,
        paintWeight: 2,
        bump: (x, y, z) =>
          0.001 * noise.fbm(x * 13, y * 13, z * 13, 3, 8) +
          0.0003 * noise.noise3(x * 48, y * 48, z * 48, 6),
      },
    );

    // Stone capping: four chunky blocks, tops level at exactly 1.5 m, ends flush.
    k.body('cap', cap.paintFn(capPaint), {
      color: CAP,
      roughness: 0.88,
      metalness: 0,
      detail: 0.012,
      maxError: 0.002,
      maxTriangles: 1100,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0007 * noise.fbm(x * 22, y * 22, z * 22, 3, 4) +
        0.0002 * noise.noise3(x * 70, y * 70, z * 70, 9),
    });
  },
});
