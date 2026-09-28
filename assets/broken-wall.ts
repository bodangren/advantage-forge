import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * architecture/building-parts/broken-wall — ruined wall tile (Sunken Vault).
 *
 * Role: dungeon ruin tile on the 2 m wall grid; reads at 128 px and from the top-down
 *   camera, so the stepped break and the pale worn treads carry the silhouette.
 * Size: 2.0 m long (X), 1.5 m tall at the left end, stepping down to 0.38 m at the right,
 *   0.4 m thick. Stands on y = 0, centered, faces +Z, flush cut ends at x = ±1.
 * One idea: a wall that died from right to left — five chunky courses march down in a
 *   jagged staircase of cut stubs, with its own blocks tumbled at the foot.
 * Shape language: square/blocky (sturdy masonry) with soft 40 mm pillow bevels (chibi).
 * Palette (scene contract): stone #6f7680 dominant, dark #4b525c joints and shade,
 *   pale worn tops #9aa2b0, moss #4d9f70 / #3fae9a in the cracks only. Light treads,
 *   mid faces, dark joints.
 * Materials: stone blocks (roughness 0.92), recessed grout core (0.97), moss tufts (0.98).
 * Detail list: 5 jagged courses + cut stubs (big), dislodged block on the step (medium),
 *   8 rubble blocks at the foot (medium), moss tufts and crack moss (small accent).
 * Rig/animation: none.
 */

const STONE = rgb('#6f7680'); // mid block face (contract)
const STONE_DARK = rgb('#4b525c'); // shaded blocks and joints (contract)
const DEEP = rgb('#3b414a'); // joint core shadow, in the grout's own hue
const MID2 = rgb('#7c8492'); // lighter block tint
const PALE = rgb('#9aa2b0'); // worn treads and tops
const PALE_HI = rgb('#b3bac6'); // tread highlight
const MOSS = rgb('#3fae9a'); // teal moss accent (set color)
const MOSS_MID = rgb('#4d9f70'); // moss body
const MOSS_DARK = rgb('#2b5344'); // moss shade

const LEN = 2.0; // length along X
const H = 1.5; // full height at the left end
const THICK = 0.4; // depth along Z
const ROUND = 0.042; // pillow bevel on every block
const GAP = 0.045; // joint width; the dark grout core shows through
const INSET = 0.05; // grout recess behind the block faces
const SINK = 0.02; // bottom course sits into the ground, cut flat

// Five courses, bottom to top: a chunky foundation row plus four equal rows.
const ROW_H = [0.4, 0.28, 0.28, 0.28, 0.28];
const ROW_Y: number[] = []; // bottom y of each row
{
  let y = -SINK;
  for (const h of ROW_H) {
    ROW_Y.push(y);
    y += h;
  }
} // tops: 0.38, 0.66, 0.94, 1.22, 1.5

// Right edge of each row — the jagged stepped break, marching right as it descends.
const END_X = [1.0, 0.58, 0.24, -0.08, -0.45];

// Cell boundaries. Even rows and odd rows alternate so the bond is staggered.
const EVEN = [-1, -0.5, 0.05, 0.55, 1];
const ODD = [-1, -0.75, -0.25, 0.25, 0.75, 1];

interface Cell {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  row: number;
  id: number;
  stub: boolean; // cut short by the break; its end face is exposed
}

const cells: Cell[] = [];
{
  let id = 1;
  for (let r = 0; r < ROW_H.length; r++) {
    const bounds = r % 2 === 0 ? EVEN : ODD;
    const end = END_X[r]!;
    const y0 = ROW_Y[r]!;
    const y1 = y0 + ROW_H[r]!;
    for (let i = 0; i < bounds.length - 1; i++) {
      const lo = Math.max(bounds[i]!, -1);
      const hi = Math.min(bounds[i + 1]!, end);
      if (hi - lo < 0.14) continue;
      cells.push({
        x0: lo,
        x1: hi,
        y0,
        y1,
        row: r,
        id: id++,
        stub: end < 0.999 && bounds[i + 1]! > end + 1e-6,
      });
    }
  }
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number): number => {
  const s = clamp01((v - a) / (b - a));
  return s * s * (3 - 2 * s);
};

/** The cell a surface point sits in (jitter margin included). */
function cellAt(x: number, y: number): Cell | null {
  for (const c of cells)
    if (x >= c.x0 - 0.02 && x <= c.x1 + 0.02 && y >= c.y0 - 0.02 && y <= c.y1 + 0.02) return c;
  return null;
}

// --------------------------------------------------------------- wall blocks
const blockSdfs: Sdf[] = cells.map((c) => {
  const jx =
    c.x0 <= -0.999 || (c.stub && c.x1 >= END_X[c.row]! - 1e-6)
      ? 0
      : (noise.random(c.id, 1, 4) - 0.5) * 0.016;
  const jy = (noise.random(c.id, 2, 4) - 0.5) * 0.01;
  const jz = (noise.random(c.id, 3, 4) - 0.5) * 0.016;
  const d = THICK + (c.stub ? 0.024 : 0) + (noise.random(c.id, 5, 4) - 0.5) * 0.02;
  // Shrink internal edges by half a joint so the dark grout core shows between blocks.
  // Flush tile ends (x = ±1) and snapped stub faces stay cut and proud.
  const x0 = c.x0 > -0.999 ? c.x0 + GAP / 2 : c.x0;
  const x1 = c.stub || c.x1 > 0.999 ? c.x1 : c.x1 - GAP / 2;
  const y0 = c.row > 0 ? c.y0 + GAP / 2 : c.y0;
  const y1 = c.row < ROW_H.length - 1 ? c.y1 - GAP / 2 : c.y1;
  return sdf
    .box([x1 - x0, y1 - y0, d], ROUND)
    .at((x0 + x1) / 2 + jx, (y0 + y1) / 2 + jy, jz);
});
const wallBlocks = sdf
  .union(...blockSdfs)
  .intersect(sdf.halfSpace([0, -1, 0], 0)); // cut the sunk bottom course flat

/** Block paint: per-block tint, joint shading, pale treads at the break, crack moss. */
function blockPaint(x: number, y: number, z: number, base: Rgb): Rgb {
  const c = cellAt(x, y);
  if (!c) return base;
  const t = (noise.random(c.id, 13, 29) - 0.5) * 2;
  let col = t < 0 ? mixRgb(STONE, STONE_DARK, -t * 0.85) : mixRgb(STONE, MID2, t * 0.35);
  const mottle = noise.fbm(x * 6, y * 6, z * 6, 3, 5);
  col =
    mottle < 0 ? mixRgb(col, STONE_DARK, -mottle * 0.22) : mixRgb(col, MID2, mottle * 0.12);
  // Slight dark bias: the wall's average sits just below the base grey.
  col = mixRgb(col, STONE_DARK, 0.12);
  // Shade toward every joint edge, faking the groove's occlusion.
  const din = Math.min(x - c.x0, c.x1 - x, y - c.y0, c.y1 - y);
  col = mixRgb(col, STONE_DARK, (1 - smoothstep(0, 0.06, din)) * 0.52);
  // Pale worn tread: the exposed top of every step of the break, and the whole top row.
  const exp = c.row === ROW_H.length - 1 ? -2 : END_X[c.row + 1]!;
  const tread = smoothstep(exp, exp + 0.06, x) * smoothstep(c.y1 - 0.09, c.y1, y);
  col = mixRgb(col, PALE, tread * 0.85);
  col = mixRgb(col, PALE_HI, tread * tread * 0.45);
  // A cut stub face reads a touch paler: freshly snapped stone.
  if (c.stub) col = mixRgb(col, PALE, smoothstep(c.x1 - 0.04, c.x1, x) * 0.38);
  // Damp rise and ground contact shadow.
  col = mixRgb(col, STONE_DARK, smoothstep(0.42, 0.15, y) * 0.34);
  // Moss in the cracks: hugging the vertical joints, low on the wall.
  const edge = 1 - smoothstep(0.015, 0.07, Math.min(x - c.x0, c.x1 - x));
  const m = noise.fbm(x * 3 + 20, y * 3, z * 3 + 20, 3, 9);
  const moss = clamp01((m - 0.02) * 2.2) * edge * smoothstep(0.75, 0.1, y);
  col = mixRgb(col, MOSS_MID, moss * 0.6);
  col = mixRgb(col, MOSS, moss * 0.3);
  col = mixRgb(col, MOSS_DARK, moss * 0.25);
  return col;
}

// --------------------------------------------------------------- grout core
// Recessed dark core behind every joint, stepped down to follow the break.
const groutRows: Sdf[] = [];
for (let r = 0; r < ROW_H.length; r++) {
  const end = END_X[r]! - (END_X[r]! < 0.999 ? 0.05 : 0);
  const y0 = Math.max(ROW_Y[r]! - 0.012, 0);
  const y1 = Math.min(ROW_Y[r]! + ROW_H[r]! + 0.012, H);
  groutRows.push(
    sdf
      .box([end + 1, y1 - y0, THICK - INSET * 2], 0.02)
      .at((-1 + end) / 2, (y0 + y1) / 2, 0),
  );
}
const grout = sdf.union(...groutRows);

function groutPaint(x: number, y: number, z: number, base: Rgb): Rgb {
  const n = noise.fbm(x * 5, y * 5, z * 5, 3, 3);
  let col = mixRgb(base, DEEP, clamp01(0.68 - n * 0.3));
  // Moss settles in the joints: low down, and heavier near the broken, open end.
  const m = noise.fbm(x * 2.5 + 5, y * 2.5, z * 2.5 + 5, 2, 2);
  const low = smoothstep(0.55, 0.05, y);
  const broken = smoothstep(-0.3, 0.5, x);
  col = mixRgb(col, MOSS_DARK, clamp01((m - 0.1) * 2) * (low * 0.6 + broken * 0.25) * 0.6);
  col = mixRgb(col, MOSS_MID, clamp01((m - 0.28) * 2.4) * low * 0.35);
  return col;
}

// --------------------------------------------------------------- rubble + dislodged block
interface Loose {
  c: readonly [number, number, number];
  s: readonly [number, number, number];
  rz: number;
  ry: number;
  id: number;
}
const loose: Loose[] = [
  // Dislodged block, mid-topple against the step of the break.
  { c: [0.41, 0.78, -0.02], s: [0.34, 0.24, 0.3], rz: -9, ry: 0, id: 61 },
  // Tumbled blocks at the foot, heaped toward the broken right end.
  { c: [0.72, 0.11, 0.3], s: [0.36, 0.2, 0.26], rz: 8, ry: 6, id: 62 },
  { c: [0.95, 0.09, 0.06], s: [0.28, 0.16, 0.22], rz: -14, ry: -8, id: 63 },
  { c: [0.52, 0.09, -0.28], s: [0.22, 0.15, 0.18], rz: 22, ry: -12, id: 64 },
  { c: [0.18, 0.1, 0.34], s: [0.3, 0.18, 0.24], rz: -7, ry: 5, id: 65 },
  { c: [-0.34, 0.08, 0.32], s: [0.2, 0.13, 0.16], rz: 16, ry: 0, id: 66 },
  { c: [0.88, 0.1, -0.2], s: [0.26, 0.15, 0.2], rz: -18, ry: 9, id: 67 },
  { c: [0.44, 0.09, 0.27], s: [0.24, 0.16, 0.14], rz: 4, ry: -6, id: 68 }, // leans on the wall foot
  { c: [0.66, 0.07, 0.42], s: [0.15, 0.1, 0.12], rz: 30, ry: 14, id: 69 }, // small chip, front
];
const rubbleSdfs: Sdf[] = loose.map((b) =>
  sdf
    .box([b.s[0], b.s[1], b.s[2]], ROUND * 0.8)
    .rotateZ(b.rz)
    .rotateY(b.ry)
    .at(b.c[0], b.c[1], b.c[2]),
);
const rubble = sdf.union(...rubbleSdfs).intersect(sdf.halfSpace([0, -1, 0], 0));

function rubblePaint(x: number, y: number, z: number, base: Rgb): Rgb {
  let best = loose[0]!;
  let bd = 1e9;
  for (const b of loose) {
    const d = (x - b.c[0]) ** 2 + (y - b.c[1]) ** 2 + (z - b.c[2]) ** 2;
    if (d < bd) {
      bd = d;
      best = b;
    }
  }
  const t = (noise.random(best.id, 13, 29) - 0.5) * 2;
  let col = t < 0 ? mixRgb(STONE, STONE_DARK, -t * 0.7) : mixRgb(STONE, MID2, t * 0.45);
  const mottle = noise.fbm(x * 7, y * 7, z * 7, 3, 6);
  col =
    mottle < 0 ? mixRgb(col, STONE_DARK, -mottle * 0.24) : mixRgb(col, MID2, mottle * 0.16);
  // Worn top faces catch the light.
  col = mixRgb(col, PALE, smoothstep(best.c[1] + best.s[1] * 0.1, best.c[1] + best.s[1] * 0.42, y) * 0.4);
  // Ground shade and a moss patch or two.
  col = mixRgb(col, STONE_DARK, smoothstep(0.12, 0.0, y) * 0.35);
  const m = noise.fbm(x * 9 + 40, y * 9, z * 9 + 40, 3, 8);
  col = mixRgb(col, MOSS_MID, clamp01((m - 0.18) * 2.4) * 0.35);
  return col;
}

// --------------------------------------------------------------- moss tufts
const clump = (cx: number, cy: number, cz: number, s: number, seed: number): Sdf =>
  sdf
    .ellipsoid([0.1 * s, 0.026 * s, 0.03 * s])
    .at(cx, cy, cz)
    .displace(0.014 * s, (x, y, z) => noise.fbm(x * 22, y * 22, z * 22, 3, seed));
const mossGeo = sdf
  .union(
    clump(-0.72, 0.05, 0.19, 1.05, 3),
    clump(-0.38, 0.045, 0.195, 0.8, 8),
    clump(0.1, 0.05, 0.2, 0.9, 4),
    clump(0.6, 0.05, 0.24, 0.85, 9),
    clump(-0.5, 0.05, -0.19, 0.8, 6),
    clump(0.3, 0.05, -0.2, 0.7, 10),
    clump(0.7, 0.395, 0.02, 0.75, 5), // on the low right remnant, reads from above
    clump(0.15, 0.95, 0.02, 0.55, 7), // in the crack on a break tread
  )
  .intersect(sdf.halfSpace([0, -1, 0], 0));
const mossPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const n = noise.fbm(x * 18, y * 18, z * 18, 3, 6);
  let col = mixRgb(MOSS_DARK, MOSS_MID, clamp01(0.28 + 0.55 * noise.fbm(x * 14, y * 14, z * 14, 3, 2)));
  col = mixRgb(col, MOSS, clamp01(0.5 + n * 0.5) * 0.28);
  col = mixRgb(col, MOSS_DARK, clamp01(-n) * 0.55);
  return col;
};

export default defineAsset({
  name: 'broken-wall',
  description:
    'Ruined 2 m wall tile: five courses of chunky pillow blocks stepping down in a jagged break from 1.5 m on the left to knee height on the right, cut stubs, a dislodged block, tumbled rubble at the foot, and moss in the joints.',
  reference: 'docs/item-mockups/broken-wall-mock.jpg',
  detail: 0.018,
  texture: { size: 1024 },

  build(k) {
    k.body('blocks', wallBlocks.paintFn(blockPaint), {
      color: STONE,
      roughness: 0.92,
      metalness: 0,
      detail: 0.018,
      maxError: 0.006,
      maxTriangles: 3200,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0024 * noise.fbm(x * 26, y * 26, z * 26, 3, 11) +
        0.0008 * noise.noise3(x * 82, y * 82, z * 82, 5),
    });
    k.body('grout', grout.paintFn(groutPaint), {
      color: STONE_DARK,
      roughness: 0.97,
      metalness: 0,
      detail: 0.025,
      maxError: 0.01,
      maxTriangles: 900,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 30, y * 30, z * 30, 3, 7),
    });
    k.body('rubble', rubble.paintFn(rubblePaint), {
      color: STONE,
      roughness: 0.92,
      metalness: 0,
      detail: 0.014,
      maxError: 0.004,
      maxTriangles: 1100,
      paintWeight: 2,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 28, y * 28, z * 28, 3, 13),
    });
    k.body('moss', mossGeo.paintFn(mossPaint), {
      color: MOSS_MID,
      roughness: 0.98,
      metalness: 0,
      detail: 0.008,
      maxError: 0.003,
      maxTriangles: 750,
      bump: (x, y, z) => 0.0035 * noise.fbm(x * 60, y * 60, z * 60, 3, 3),
    });
  },
});
