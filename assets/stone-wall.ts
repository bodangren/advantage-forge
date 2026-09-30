import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * architecture/building-parts/stone-wall — ashlar stone wall tile (blacksmith shop kit).
 *
 * Role: forge backdrop wall module. Tiles on a 2 m grid with `timber-wall`; must read at
 *   128 px in the interior cutaway, from both faces.
 * Size: 2.0 m long (X), 1.5 m tall, stone core 0.12 m thick, blocks proud to ~0.16 m,
 *   capstone coping proud to 0.17 m. Stands on y = 0, centered on z = 0, flush ends at
 *   x = ±1 so tiles butt cleanly.
 * One idea: chunky hand-cut ashlar blocks, each one its own warm grey, seated in dark
 *   recessed mortar — a wall that was laid by someone who took pride in it.
 * Shape language: square and sturdy (workshop) with soft 20 mm bevels on every stone edge
 *   (chibi soft). Blocks are cut boxes, not blobs.
 * Rework: dark rough fieldstone #6e6a64..#8a847a, 6 irregular courses, mortar #3a3632, sooty cap, oak sill #5a3a22.
 * Old palette: stone #8a8a82 dominant, mortar/joints #5e5e58 (shaded in
 *   its own hue to #5f5b52 / #3f3f38 for worn blocks and joint cores), worn light #a6a398.
 *   Capstone band and joints share the darker #5e5e58. Sill beam matches timber-wall:
 *   walnut #6b4226 / deep #54331d.
 * Materials: one matte stone body (roughness 0.92, metalness 0, grit bump), one walnut
 *   sill (roughness 0.8, grain bump).
 * Detail: four ashlar courses of varied widths (periodic per row, so tiles continue the
 *   bond), segmented coping, walnut sill. Grit, mottle and lichen stay in paint and bump.
 * Rig/animation: none.
 */

const STONE = rgb('#7a6e62'); // warm brown-grey fieldstone base
const STONE_DARK = rgb('#5e544a'); // darker blocks blocks
const STONE_LIGHT = rgb('#948878'); // lightest stones
const MORTAR = rgb('#3a3632'); // deep dark joints
const MORTAR_DEEP = rgb('#2b2825'); // joint core
const CAP_DARK = rgb('#645a50'); // capstone shade, one step below the field
const CAP_LIGHT = rgb('#857a6c'); // capstone worn top
const LICHEN = rgb('#8f9a76'); // one small patch of place
const WALNUT = rgb('#3e2c20'); // dark oak sill (less saturated: #4a3020 rendered orange)
const WALNUT_DEEP = rgb('#2e2016');
const WALNUT_LIFT = rgb('#4c3828');

const LEN = 2.0;
const H = 1.5;
const CORE_D = 0.12; // stone core thickness (family contract)
const SILL_H = 0.18; // matches timber-wall sill band
const CAP_H = 0.18; // coping band, matches timber-wall top rail
const FIELD_BOT = SILL_H; // first bed joint sits on the sill
const FIELD_TOP = H - CAP_H; // 1.32: top of the block field
const ROWS = 6; // six courses of fieldstone
const ROW_H = (FIELD_TOP - FIELD_BOT) / ROWS; // 0.285 m course height
const GAP = 0.03; // mortar joint width
const BLOCK_D = 0.152; // base block depth; per-block jitter sits proud of the core
const CAP_D = 0.17; // coping overhangs the field so the top reads as a cap

/** Ashlar course widths, bottom to top. Each row sums to LEN, so the bond is periodic
 *  over the tile and continues across every butt joint; end blocks keep a cut face at
 *  x = ±1. No vertical joint lines up with the course above or below. */
const COURSES: number[][] = Array.from({ length: ROWS }, (_, row) => {
  const n = 4 + (row % 2) + (row === 2 ? 1 : 0);
  const raw = Array.from({ length: n }, (_, i) => 0.55 + 0.9 * noise.random(row, i, 41));
  const sum = raw.reduce((a, v) => a + v, 0);
  return raw.map((v) => (v / sum) * LEN);
});
const CAP_COURSE = [0.62, 0.41, 0.55, 0.42];

const EPS = 1e-4;
const atEnd = (v: number): boolean => Math.abs(Math.abs(v) - LEN / 2) < EPS;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number): number => {
  const s = clamp01((v - a) / (b - a));
  return s * s * (3 - 2 * s);
};

/** Course and cell under a point in the block field; block x-range with the end rule. */
function courseAt(y: number): { row: number; widths: number[] } | null {
  if (y < FIELD_BOT - EPS || y >= FIELD_TOP + EPS) return null;
  const row = Math.min(ROWS - 1, Math.max(0, Math.floor((y - FIELD_BOT) / ROW_H)));
  return { row, widths: COURSES[row] };
}

/** A laid block: x span, y span, depth, bevel, tint id. */
interface Block {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  d: number;
  bevel: number;
  id: number;
  z: number; // depth center offset, kept 0; depth jitter does the work
}

function buildCourse(widths: number[], row: number, idBase: number): Block[] {
  const blocks: Block[] = [];
  let lo = -LEN / 2;
  for (let cell = 0; cell < widths.length; cell++) {
    const hi = lo + widths[cell];
    const x0 = lo + (atEnd(lo) ? 0 : GAP / 2);
    const x1 = hi - (atEnd(hi) ? 0 : GAP / 2);
    const y0 = FIELD_BOT + row * ROW_H + GAP / 2;
    const y1 = y0 + ROW_H - GAP;
    const id = idBase + cell;
    const r = noise.random(id, 3, 11);
    blocks.push({
      x0,
      x1,
      y0: y0 + (r - 0.5) * 0.035, // courses stay level; blocks settle a hair
      y1: y1 + (noise.random(id, 9, 31) - 0.5) * 0.03 + (r - 0.5) * 0.035,
      d: BLOCK_D + (noise.random(id, 5, 17) - 0.5) * 0.02 - 0.004 + 0.012 * noise.random(id, 19, 53),
      bevel: 0.02 + 0.01 * noise.random(id, 7, 23),
      id,
      z: 0.006 * noise.random(id, 19, 53) + 0.003,
    });
    lo = hi;
  }
  return blocks;
}

const FIELD_BLOCKS: Block[] = COURSES.flatMap((w, row) => buildCourse(w, row, row * 8 + 1));
const CAP_BLOCKS: Block[] = buildCourse(CAP_COURSE, 0, 71).map((b, i) => ({
  ...b,
  y0: FIELD_TOP,
  y1: i === 0 ? H : H - 0.04 * noise.random(i, 61, 67),
  d: CAP_D,
  bevel: 0.024,
}));

/** Distance from a point to the nearest cut edge of a block face (0 on the edge). */
function faceInset(b: Block, x: number, y: number): number {
  return Math.min(x - b.x0, b.x1 - x, y - b.y0, b.y1 - y);
}

/** Is the point on a block face (vs the mortar core behind it)? */
function blockAt(x: number, y: number): { b: Block; cap: boolean } | null {
  if (y >= FIELD_TOP) {
    for (const b of CAP_BLOCKS) if (faceInset(b, x, y) >= -EPS) return { b, cap: true };
    return null;
  }
  const c = courseAt(y);
  if (!c) return null;
  for (const b of FIELD_BLOCKS) {
    if (b.y0 - EPS <= y && y <= b.y1 + EPS && faceInset(b, x, y) >= -EPS) return { b, cap: false };
  }
  return null;
}

/** Block paint: per-block value steps, worn crown, shaded edges, damp base, lichen. */
function blockPaint(x: number, y: number, z: number, b: Block): Rgb {
  // The mason's hand: some blocks near-joint dark, some worn pale, most in between.
  const t = (noise.random(b.id, 13, 29) - 0.5) * 2;
  let c = mixRgb(STONE, STONE_LIGHT, clamp01(0.5 + t * 0.5));
  if (noise.random(b.id, 43, 47) > 0.86) c = mixRgb(c, STONE_DARK, 0.75);
  const mottle = noise.fbm(x * 6, y * 6, z * 6, 3, 5);
  c = mottle < 0 ? mixRgb(c, STONE_DARK, -mottle * 0.2) : mixRgb(c, STONE_LIGHT, mottle * 0.12);
  // Slight dark bias: the reference wall's average sits below the base grey.
  c = mixRgb(c, STONE_DARK, 0.05);
  const din = Math.max(0, faceInset(b, x, y));
  // Worn crown: the middle of each face softens lighter, like the reference blocks.
  const wear = smoothstep(0.02, 0.1, din);
  c = mixRgb(c, STONE_LIGHT, wear * wear * 0.12);
  // Shade toward the joint, faking the groove's occlusion.
  c = mixRgb(c, STONE_DARK, (1 - smoothstep(0, 0.06, din)) * 0.5);
  // Damp rise from the ground and the sill's shadow.
  c = mixRgb(c, STONE_DARK, smoothstep(0.42, 0.18, y) * 0.3);
  // Soot creeping down from the cap.
  c = mixRgb(c, rgb('#2a2724'), smoothstep(1.0, 1.32, y) * 0.35);
  // One small lichen patch, low on the left, where rain runs off the sill joint.
  const lx = x + 0.62;
  const ly = y - 0.3;
  const patch = smoothstep(0.17, 0.04, Math.hypot(lx * 1.3, ly)) * (0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2, 3));
  c = mixRgb(c, LICHEN, clamp01(patch) * 0.3);
  return c;
}

/** Capstone paint: the darker coping stone, worn lighter on top, tight value range. */
function capPaint(x: number, y: number, z: number, b: Block): Rgb {
  const t = (noise.random(b.id, 31, 37) - 0.5) * 2;
  let c = t < 0 ? mixRgb(STONE, CAP_DARK, 0.5 - t * 0.3) : mixRgb(STONE, CAP_LIGHT, t * 0.4);
  const mottle = noise.fbm(x * 7, y * 7, z * 7, 3, 5);
  c = mottle < 0 ? mixRgb(c, CAP_DARK, -mottle * 0.16) : mixRgb(c, CAP_LIGHT, mottle * 0.1);
  // Anchor the band a step below the field so the coping reads at sprite size.
  c = mixRgb(c, CAP_DARK, 0.26);
  // Weathered top face and outer edge catch the light.
  c = mixRgb(c, CAP_LIGHT, smoothstep(1.44, 1.5, y) * 0.2);
  c = mixRgb(c, rgb('#23201d'), 0.06 + 0.14 * smoothstep(1.35, 1.5, y));
  return c;
}

/** Mortar paint: recessed joints, faintly gritty, darker toward the joint core. */
function mortarPaint(x: number, y: number, z: number): Rgb {
  const g = noise.fbm(x * 12, y * 12, z * 12, 2, 5);
  let c = mixRgb(MORTAR, MORTAR_DEEP, 0.5 + clamp01(g) * 0.3);
  c = mixRgb(c, MORTAR_DEEP, smoothstep(0.4, 0.18, y) * 0.2);
  return c;
}

/** Grit and per-block settling, shared by paint and bump so pits line up. */
function stoneBump(x: number, y: number, z: number): number {
  const hit = blockAt(x, y);
  if (hit) {
    const din = Math.max(0, faceInset(hit.b, x, y));
    // Gentle face crown on the cut block, plus grit.
    const dome = 0.002 * smoothstep(0, 0.07, din);
    const grit = 0.0022 * noise.fbm(x * 22, y * 34, z * 34, 3, 7) + 0.0004 * noise.noise3(x * 90, y * 90, z * 90, 7);
    return dome + grit;
  }
  // Mortar bed sits a touch deeper and rougher.
  return -0.0006 + 0.0009 * noise.fbm(x * 30, y * 30, z * 30, 2, 5);
}

/** Walnut grain along the sill, matching timber-wall's band treatment. */
const sillGrain = (x: number, y: number, z: number): number => noise.fbm(x * 48, y * 18, z * 22, 3, 7);

function sillPaint(x: number, y: number, z: number, base: Rgb): Rgb {
  const g = sillGrain(x, y, z);
  let c = mixRgb(base, WALNUT_DEEP, clamp01(g) * 0.46);
  c = mixRgb(c, WALNUT_LIFT, clamp01(-g) * 0.14);
  // Hand-oil and shop-floor dirt low on the beam; a worn, lighter crown on top.
  c = mixRgb(c, WALNUT_DEEP, smoothstep(0.1, 0.0, y) * 0.3);
  c = mixRgb(c, WALNUT_LIFT, smoothstep(0.14, 0.18, y) * 0.18);
  return c;
}

export default defineAsset({
  name: 'stone-wall',
  description:
    'Ashlar stone wall tile: six courses of dark rough fieldstone in deep mortar, a sooty darker coping, and a dark oak sill. 2 m long, tiles on a 2 m grid.',
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  detail: 0.009,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ stone field
    // The mortar core is the wall itself; every block is a cut box seated through it and
    // proud on both faces, so the wall reads identically from the street and the shop.
    const core = sdf.box([LEN, FIELD_TOP - FIELD_BOT + CAP_H - 0.05, CORE_D]).at(0, (FIELD_BOT + H - 0.05) / 2, 0);

    const blockShape = (b: Block): Sdf => {
      let sh: Sdf = sdf.box([b.x1 - b.x0, b.y1 - b.y0, b.d], b.bevel);
      const r = noise.random(b.id, 71, 73);
      if (r > 0.64) {
        // chipped corner: a small tilted box cut from a front corner (never at a tile end)
        const sx = noise.random(b.id, 79, 83) > 0.5 ? 1 : -1;
        const sy = noise.random(b.id, 89, 97) > 0.5 ? 1 : -1;
        const cx = sx > 0 ? (atEnd(b.x1) ? -1 : 1) : atEnd(b.x0) ? 1 : -1;
        const chip = sdf
          .box([0.05, 0.045, 0.06], 0.008)
          .rotate(25 * sy, 30 * cx, 20)
          .at((cx * (b.x1 - b.x0)) / 2, (sy * (b.y1 - b.y0)) / 2, b.d / 2);
        sh = sdf.subtract(sh, chip);
      }
      return sh.at((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, b.z);
    };

    const stones: Sdf[] = FIELD_BLOCKS.map(blockShape);
    const caps: Sdf[] = CAP_BLOCKS.map(blockShape);
    const wall = sdf.smoothUnion(0.005, core, ...stones, ...caps);

    k.body('stone', wall.paintFn((x, y, z, base) => {
      const hit = blockAt(x, y);
      if (!hit) return mortarPaint(x, y, z);
      return hit.cap ? capPaint(x, y, z, hit.b) : blockPaint(x, y, z, hit.b);
    }), {
      color: STONE,
      roughness: 0.92,
      metalness: 0,
      detail: 0.009,
      maxError: 0.002,
      maxTriangles: 8200,
      paintWeight: 2,
      bump: stoneBump,
    });

    // ------------------------------------------------------------------ sill beam
    // Matches timber-wall's sill exactly (2.0 × 0.18 × 0.18 walnut, 18 mm bevel) so the
    // two wall families sit side by side with the same base band.
    const sill = sdf.box([LEN, SILL_H, 0.18], 0.018).at(0, SILL_H / 2, 0);
    k.body('sill', sill.paintFn(sillPaint), {
      color: WALNUT,
      roughness: 0.8,
      metalness: 0,
      detail: 0.011,
      maxError: 0.002,
      maxTriangles: 600,
      paintWeight: 2,
      bump: (x, y, z) => 0.0016 * sillGrain(x, y, z) + 0.00035 * noise.noise3(x * 80, y * 80, z * 80, 7),
    });
  },
});
