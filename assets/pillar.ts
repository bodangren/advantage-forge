import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * architecture/dungeon/pillar — round-2 reroll.
 *
 * Role: free-standing dungeon masonry pillar that tiles with the canon wall pieces; read at
 *   128 px from the top-down dungeon camera as a chunky blue-gray stone column.
 * Size: 1.43 m tall, square shaft 0.60 m on a side, plinth/capital 0.70 m max. Stands on y = 0,
 *   centered on the Y axis, faces +Z.
 * One idea: the canon wall folded into a column — two 0.60 m courses of deep-pillowed blocks over
 *   a recessed navy joint bed, alternating full blocks and half-blocks, moss only at the base.
 * Shape language: square dominant (sturdy masonry), round secondary (deep pillow bevels).
 * Palette: joint bed #2a3547 (dark), block face #4a5d75 (mid), worn top #7a8ba0 (light),
 *   moss accent #3fae9a at the base only.
 * Materials: stone shaft (roughness 0.9, metalness 0, fbm grain in `bump`), navy joint bed
 *   (roughness 0.92), moss (roughness 0.9). No metal.
 * Detail list: two 0.60 m courses of canon blocks (big), plinth and capital slabs (big),
 *   deep pillow bevels + recessed navy joints (big/medium), per-block tint + worn paint
 *   (medium), base moss clumps and haze (accent).
 * Rig/animation: none.
 */

const C = {
  joint: rgb('#2a3547'),
  block: rgb('#4a5d75'),
  blockDark: rgb('#35465a'),
  blockTeal: rgb('#3f6577'),
  worn: rgb('#7a8ba0'),
  wornHi: rgb('#a6b6c9'),
  moss: rgb('#3fae9a'),
  mossMid: rgb('#4d9f70'),
  mossDark: rgb('#274f3f'),
};

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

// --------------------------------------------------------------- masonry canon
// Course height 0.60 m, blocks ~0.55 to 0.60 m long, deep rounded pillow bevels (~0.045 m),
// joints recessed ~0.03 m into a deep navy bed. Matches assets/wall.ts and wall-corner.ts.
const S = 0.6; // shaft side (square footprint)
const D = 0.22; // block depth (face block thickness)
const GAP = 0.03; // joint gap between blocks
const BEVEL = 0.04; // deep rounded pillow bevel
const BLOCK_H = 0.575; // block extent height; the rest is the horizontal joint
const PITCH = 0.6; // course pitch = canon 0.60 m
const JOINT_DEPTH = 0.03; // joint bed recess
const PLINTH_H = 0.12; // chunky square base plinth, two steps
const CAP_H = 0.12; // chunky square capital, two steps
const SHAFT_Y0 = PLINTH_H - 0.01; // top of the plinth / bottom of the shaft, overlapped 0.01
const SHAFT_H = PITCH * 2; // 1.20 m = two full courses
const SHAFT_TOP = SHAFT_Y0 + SHAFT_H; // 1.31 m
const TOP = SHAFT_TOP + CAP_H; // 1.43 m overall
const HALF_L = (S - GAP) / 2; // half-block length
const HALF_C = GAP / 2 + HALF_L / 2; // half-block center offset from the face center
const R = S / 2 - D / 2; // block center so the block face lands on S/2
const C1 = SHAFT_Y0 + BLOCK_H / 2; // bottom course center
const C2 = C1 + PITCH; // top course center

/** A canon block: a rounded box with a deep pillow bevel (flat face, cushioned edges). */
const pillow = (size: readonly [number, number, number]): Sdf => sdf.box(size, BEVEL);

// --------------------------------------------------------------- shaft blocks
// Two courses. Bottom: full blocks span the +Z/-Z faces, half-blocks fill the +X/-X faces.
// Top: swapped. Every face therefore alternates a full block and two half-blocks, exactly
// like a staggered run of canon wall blocks.
const blocks: Sdf[] = [];
const push = (s: Sdf): void => {
  blocks.push(s);
};
for (const cz of [R, -R]) push(pillow([S, BLOCK_H, D]).at(0, C1, cz));
for (const cx of [R, -R])
  for (const cz of [HALF_C, -HALF_C]) push(pillow([D, BLOCK_H, HALF_L]).at(cx, C1, cz));
for (const cx of [R, -R]) push(pillow([D, BLOCK_H, S]).at(cx, C2, 0));
for (const cz of [R, -R])
  for (const cx of [HALF_C, -HALF_C]) push(pillow([HALF_L, BLOCK_H, D]).at(cx, C2, cz));

const blockPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const course = y < 0.7 ? 0 : 1;
  // Per-block tint so the courses are not one flat value.
  const bi = Math.round(x * 3.3) * 13 + Math.round(z * 3.3) * 7 + course * 101;
  const t1 = noise.random(bi, course, 7);
  const t2 = noise.random(bi, course, 31);
  let c = mixRgb(base, C.blockDark, 0.08 + 0.3 * t1);
  c = mixRgb(c, C.blockTeal, 0.22 * t2);
  // Broad damp blotches, darker low on the column.
  const patch = noise.fbm(x * 3.1, y * 3.1, z * 3.1, 3, 4);
  c = mixRgb(c, C.blockDark, clamp01(-patch) * 0.22);
  c = mixRgb(c, C.worn, clamp01(patch) * 0.1);
  // Worn, lighter stone on the upper shoulder of the shaft (under the capital).
  const wear = smoothstep(SHAFT_TOP - 0.14, SHAFT_TOP, y);
  c = mixRgb(c, C.worn, wear * 0.5);
  c = mixRgb(c, C.wornHi, wear * wear * 0.18);
  // Ground contact shadow, then moss creeping up from the base only.
  c = mixRgb(c, C.blockDark, smoothstep(0.24, 0.1, y) * 0.32);
  const m = noise.fbm(x * 3.0 + 20, y * 3.0, z * 3.0 + 20, 3, 9);
  const mossAmt = clamp01((m - 0.08) * 2.6) * smoothstep(0.34, 0.1, y);
  c = mixRgb(c, C.mossMid, mossAmt * 0.5);
  c = mixRgb(c, C.moss, mossAmt * 0.28);
  c = mixRgb(c, C.mossDark, mossAmt * 0.22);
  return c;
};

const blockShape = sdf.union(...blocks).paint(C.block).paintFn(blockPaint);

// --------------------------------------------------------------- joint bed
// Recessed navy core behind every block face and between every course; this is what the
// 0.03 m joints expose. Reaches from the plinth to the capital.
const coreH = SHAFT_TOP - SHAFT_Y0;
const jointBed = sdf
  .box([S - 2 * JOINT_DEPTH, coreH, S - 2 * JOINT_DEPTH], 0.01)
  .at(0, SHAFT_Y0 + coreH / 2, 0);

// --------------------------------------------------------------- plinth + capital
const trimPillow = (w: number, h: number): Sdf => {
  const r = Math.min(0.024, h / 2 - 0.004);
  return sdf
    .box([w, h, w], r)
    .smoothUnion(
      0.018,
      sdf.ellipsoid([w / 2 + 0.008, Math.max(h * 0.12, h / 2 - 0.02), w / 2 + 0.008]),
    );
};

const plinth = sdf.union(
  trimPillow(0.7, 0.08).at(0, 0.04, 0),
  trimPillow(0.62, 0.04).at(0, 0.1, 0),
);
const capital = sdf.union(
  trimPillow(0.62, 0.04).at(0, SHAFT_TOP + 0.02, 0),
  trimPillow(0.7, 0.08).at(0, SHAFT_TOP + 0.08, 0),
);

const plinthPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const n = noise.fbm(x * 5, y * 5, z * 5, 3, 3);
  let c = mixRgb(base, C.blockDark, clamp01(0.12 + 0.2 * n));
  // Grime low, a faint worn lip where the shaft meets the plinth.
  c = mixRgb(c, C.blockDark, smoothstep(0.1, 0.0, y) * 0.4);
  c = mixRgb(c, C.worn, smoothstep(0.06, PLINTH_H, y) * 0.3);
  // Moss haze at the very base only.
  const m = noise.fbm(x * 3.4 + 4, y * 3.4, z * 3.4 + 4, 3, 12);
  c = mixRgb(c, C.moss, clamp01((m - 0.1) * 2.4) * smoothstep(0.16, 0.0, y) * 0.4);
  return c;
};

const capitalPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const n = noise.fbm(x * 4.2, y * 4.2, z * 4.2, 3, 6);
  let c = mixRgb(base, C.blockDark, clamp01(0.1 + 0.22 * n));
  // Pale worn top: the brightest value on the whole pillar reads from above.
  const wear = smoothstep(TOP - 0.1, TOP, y);
  c = mixRgb(c, C.worn, wear * 0.9);
  c = mixRgb(c, C.wornHi, wear * wear * 0.5);
  // A dark shadow line where the capital overhangs the shaft.
  c = mixRgb(c, C.joint, smoothstep(SHAFT_TOP + 0.06, SHAFT_TOP, y) * 0.35);
  const topNoise = noise.fbm(x * 9, y * 9, z * 9, 3, 15);
  c = mixRgb(c, C.blockDark, clamp01(-topNoise) * wear * 0.22);
  return c;
};

// --------------------------------------------------------------- moss clumps
// Small flat teal clumps hugging the plinth and the very bottom of the shaft. Base only.
const clumps: Sdf[] = [];
const clump = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): void => {
  clumps.push(sdf.ellipsoid([sx, sy, sz]).at(cx, cy, cz));
};
// Distance from the axis to the square face for a given angle.
const squareR = (a: number, half: number): number =>
  half / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
let seed = 0;
const rnd = (): number => noise.random(seed++, 5, 3);
// A few small, flat clumps hugging the plinth base.
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2 + 0.36;
  const rr = squareR(a, 0.36);
  const s = 0.7 + 0.5 * rnd();
  clump(Math.cos(a) * rr, 0.008 * s + 0.008, Math.sin(a) * rr, 0.075 * s, 0.02 * s, 0.058 * s);
}
// A couple of smaller clumps creeping onto the bottom of the shaft.
for (let i = 0; i < 4; i++) {
  const a = (i / 4) * Math.PI * 2 + 0.9;
  const rr = squareR(a, 0.3);
  const s = 0.7 + 0.4 * rnd();
  clump(Math.cos(a) * rr, SHAFT_Y0 + 0.018 + 0.01 * s, Math.sin(a) * rr, 0.05 * s, 0.02 * s, 0.04 * s);
}
const mossShape = sdf
  .union(...clumps)
  .intersect(sdf.halfSpace([0, -1, 0], 0))
  .paint(C.moss)
  .paintFn((x, y, z, base) =>
    mixRgb(
      base,
      C.mossDark,
      clamp01(0.55 - y * 3.0) * (0.6 + 0.4 * noise.fbm(x * 16, y * 16, z * 16, 3)),
    ),
  );

export default defineAsset({
  name: 'pillar',
  description:
    'Dungeon pillar: two 0.60 m courses of chunky canon blocks on a square plinth and capital, deep pillow bevels, recessed navy joints, worn tops and moss at the base only.',
  detail: 0.018,
  reference: 'docs/dungeon-mockups/masonry-canon.png',
  texture: { size: 1024 },

  build(k) {
    k.body('joint-bed', jointBed, {
      color: C.joint,
      roughness: 0.92,
      metalness: 0,
      detail: 0.02,
      maxError: 0.01,
    });
    k.body('blocks', blockShape, {
      color: C.block,
      roughness: 0.9,
      metalness: 0,
      detail: 0.015,
      maxError: 0.006,
      paintWeight: 2,
      bump: (x, y, z) => 0.0032 * noise.fbm(x * 13, y * 13, z * 13, 3),
    });
    k.body('plinth', plinth.paint(C.block).paintFn(plinthPaint), {
      color: C.block,
      roughness: 0.9,
      metalness: 0,
      detail: 0.018,
      maxError: 0.006,
      paintWeight: 2,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 15, y * 15, z * 15, 3),
    });
    k.body('capital', capital.paint(C.block).paintFn(capitalPaint), {
      color: C.block,
      roughness: 0.9,
      metalness: 0,
      detail: 0.018,
      maxError: 0.006,
      paintWeight: 2,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 15, y * 15, z * 15, 3),
    });
    k.body('moss', mossShape, {
      color: C.moss,
      roughness: 0.9,
      metalness: 0,
      detail: 0.012,
      maxError: 0.006,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 24, y * 24, z * 24, 2),
    });
  },
});
