import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';

// nature/terrain/pond — small forest pond (Chibi Quest terrain dressing).
//
// Role: landmark dressing for the forest clearing; must read as "pond" instantly at 128 px.
// Size: 3.0 x 2.2 m footprint, flat on y = 0, front toward +Z. The grass rim tops at
// y = 0.09 and the water sits at y = 0.07, 2 cm below the rim.
// One idea: a hand-formed clay bowl of calm teal water dropped into bright grass, hugged by
// a ring of chunky rounded stones with two lily pads floating on it.
// Shape language: round everywhere — displaced slab, puffy torus lip, egg stones, dome pads.
// Palette (60/30/10): grass #7ec850 / #4a8a3f dominant; stones #8a94a0 (two warm #c9b18a)
// secondary; water #3fa8c8 focal with pads #5fae4a as accent; wet bank #3f6e35, soil
// skirt #7a5a38.
// Materials: grass bank (roughness 0.9), water (0.05, opacity 0.92), stones (0.88),
// pads (0.55), tufts (0.85). No rig, no animation.
// Detail: dish + lip + damp ring (primary), 12 stones + 2 veined pads (medium, focal),
// 6 tufts + soil skirt (small).

const WATER_Y = 0.07; // water surface, 2 cm below the rim
const ASPECT = 0.72; // plan ellipse: z radius = x radius * ASPECT (3.0 x 2.2 m)

const C = {
  grass: rgb('#7ec850'),
  grassDark: rgb('#4a8a3f'),
  wet: rgb('#3f6e35'),
  soil: rgb('#7a5a38'),
  soilDark: rgb('#5c4227'),
  water: rgb('#3fa8c8'),
  waterDeep: rgb('#17617f'),
  waterLight: rgb('#6cc4d8'),
  stone: rgb('#8a94a0'),
  stoneLight: rgb('#c8c4bc'),
  stoneDark: rgb('#5c646e'),
  stoneWarm: rgb('#c9b18a'),
  pad: rgb('#5fae4a'),
  vein: rgb('#3a7a33'),
  tuft: rgb('#4f9e3e'),
};

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
/** Smoothstep, tolerant of a > b. */
const sstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - t * 2);
};

/** Shared low-frequency clay wobble so bank and waterline wander together. */
const wobble = (x: number, y: number, z: number): number => noise.fbm(x * 2.1, y * 2.1, z * 2.1, 3);

/** [angleDeg, sizeScale, warm] of the stone ring, front (+Z) at 90 deg. */
const STONES: ReadonlyArray<readonly [number, number, boolean]> = [
  [95, 1.0, true],
  [68, 0.62, false],
  [42, 0.82, false],
  [18, 0.55, false],
  [-8, 1.05, false],
  [-34, 0.66, true],
  [-60, 0.86, false],
  [-86, 0.52, false],
  [-112, 0.98, false],
  [-138, 0.64, true],
  [-162, 0.8, false],
  [174, 0.58, false],
  [148, 0.9, true],
  [122, 0.6, false],
];

/** [x, z, radius, notch angle deg] of the two lily pads. */
const PADS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0.42, 0.1, 0.17, 205],
  [-0.38, -0.18, 0.135, 35],
];

/** Damp band on the bank just above the waterline. */
const bankPaint = (x: number, y: number, z: number): Rgb => {
  const big = noise.fbm(x * 2.4, 0, z * 2.4, 3);
  const small = noise.fbm(x * 7, 0, z * 7, 2);
  const v = clamp01(big * 0.45 + small * 0.25 + 0.5);
  let c = mixRgb(C.grass, C.grassDark, v * 0.5);
  const re = Math.hypot(x / 1.3, z / 0.94);
  const wet = (1 - sstep(0.8, 0.95, re)) * sstep(0.058, 0.068, y) * (1 - sstep(0.08, 0.093, y));
  c = mixRgb(c, C.wet, wet * 0.6);
  const soil = mixRgb(C.soil, C.soilDark, 0.35 + 0.3 * noise.fbm(x * 9, y * 9, z * 9, 2));
  c = mixRgb(c, soil, 1 - sstep(0.026, 0.048, y));
  return c;
};

/** Calm teal: deeper toward the middle, a shallow light rim, faint drifting tone. */
const waterPaint = (x: number, y: number, z: number): Rgb => {
  const re = Math.hypot(x / 1.06, z / 0.79);
  let c = mixRgb(C.waterDeep, C.water, sstep(0.35, 0.9, re));
  c = mixRgb(c, C.waterLight, sstep(0.85, 1.05, re) * 0.25);
  c = mixRgb(c, C.waterDeep, 0.1 * sstep(0.3, 0.9, noise.fbm(x * 5, y * 5, z * 5, 2)));
  return c;
};

/** Lit crowns, grounded dark bases, soft patches on the unioned stone egg. */
const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  let c = base;
  c = mixRgb(c, C.stoneLight, sstep(0.09, 0.16, y) * 0.45);
  c = mixRgb(c, C.stoneDark, (1 - sstep(0.03, 0.085, y)) * 0.5);
  const patch = noise.fbm(x * 6.5, y * 6.5, z * 6.5, 2);
  c = mixRgb(c, C.stoneDark, clamp01(-patch) * 0.28);
  c = mixRgb(c, C.stoneLight, clamp01(patch) * 0.16);
  return c;
};

/** Radial veins, a darker rim, and a painted notch wedge on each lily pad top — all soft
 * ramps, so the vertex-color field stays continuous and reduction stays clean. */
const padPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  for (const [cx, cz, r, notch] of PADS) {
    const dx = x - cx;
    const dz = z - cz;
    const d = Math.hypot(dx, dz);
    if (d < r * 1.02) {
      const a = Math.atan2(dz, dx);
      const step = Math.PI / 4;
      const f = Math.abs(((((a % step) + step) % step) - step) / 2) / (step / 2);
      let c = base;
      const vein = (1 - sstep(0.06, 0.32, f)) * (1 - sstep(0.12, 0.24, d / r));
      c = mixRgb(c, C.vein, vein * 0.6);
      c = mixRgb(c, C.vein, sstep(r * 0.82, r, d) * 0.45);
      let dA = a - (notch * Math.PI) / 180;
      dA = Math.atan2(Math.sin(dA), Math.cos(dA));
      const notchW = (1 - sstep(0.05, 0.17, Math.abs(dA))) * (1 - sstep(0.05, 0.12, d / r));
      c = mixRgb(c, C.vein, notchW * 0.85);
      return c;
    }
  }
  return base;
};

export default defineAsset({
  name: 'pond',
  description:
    'Forest pond: a hand-formed grass bowl of calm teal water ringed by chunky rounded stones, with two lily pads and grass tufts.',
  detail: 0.01,
  reference: 'docs/item-mockups/pond-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ grass bank
    // A 3.0 x 2.2 m rounded slab, hand-formed by low-frequency displacement (faded at the
    // bottom so it stays flat on y = 0, and damped over the dish so the lip stays calm).
    // The bowl is a barely-displaced dome subtracted with a soft fillet: the waterline is
    // the dome wall crossing y = WATER_Y at x radius 1.0 / z 0.72. A puffy torus blends
    // into the rim as the grass lip the stones sit in.
    const e = (x: number, z: number): number => Math.hypot(x / 1.5, z / 1.1);
    const slab = sdf.box([3.0, 0.18, 2.2], 0.09).displace(
      0.022,
      (x, y, z) => wobble(x, y, z) * sstep(0.015, 0.05, y) * (0.25 + 0.75 * sstep(0.78, 0.98, e(x, z))),
    );
    const dish = sdf
      .ellipsoid([1.17, 0.052, 1.17 * ASPECT])
      .at(0, 0.097, 0)
      .displace(0.002, (x, y, z) => wobble(x + 3.7, y, z - 2.9));
    const lip = sdf.torus(1.33, 0.055).scale([1, 1, ASPECT]).at(0, 0.06, 0);
    const bank = slab
      .smoothSubtract(0.015, dish)
      .smoothUnion(0.04, lip)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(bankPaint);
    k.body('grass', bank, {
      color: C.grass,
      roughness: 0.9,
      metalness: 0,
      detail: 0.02,
      maxTriangles: 1800,
      paintWeight: 2,
      textureDensity: 2,
      bump: (x, y, z) =>
        0.0026 * noise.fbm(x * 26, y * 26, z * 26, 3) + 0.0014 * noise.fbm(x * 8, 3, z * 8, 2),
    });

    // ------------------------------------------------------------------ water
    // A flat-topped lens whose rim is buried in the bank: at y = WATER_Y the lens reaches
    // x 1.04 / z 0.77 while the bowl opens to 1.0 / 0.72, so the visible waterline is the
    // bank edge and the lens edge never shows.
    const water = sdf
      .ellipsoid([1.06, 0.075, 0.79])
      .at(0, 0.055, 0)
      .intersect(sdf.halfSpace([0, 1, 0], WATER_Y))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(waterPaint);
    k.body('water', water, {
      color: C.water,
      roughness: 0.05,
      metalness: 0,
      opacity: 0.92,
      detail: 0.02,
      maxTriangles: 600,
      paintWeight: 2,
      textureDensity: 2,
      bump: (x, y, z) =>
        0.0045 * noise.fbm(x * 3.5, y * 3.5, z * 3.5, 2) +
        0.0014 * noise.fbm(x * 13, y * 13, z * 13, 2),
    });

    // ------------------------------------------------------------------ stone ring
    // Chunky egg stones probed onto the finished lip so each sits half-buried, long axis
    // along the ring, with a big/medium/small rhythm and two warm accents.
    const stoneShapes = STONES.map(([deg, s, warm], i) => {
      const a = (deg * Math.PI) / 180;
      const r = 1.27 + (noise.random(i, 2, 9) - 0.5) * 0.08;
      const px = Math.cos(a) * r;
      const pz = Math.sin(a) * r * ASPECT;
      const hit = sdf.surfacePoint(bank, [px, 0.16, pz]);
      const sy = (0.06 + 0.028 * noise.random(i, 4, 1)) * s;
      const sx = 0.23 * s * (0.9 + 0.2 * noise.random(i, 6, 4));
      const sz = 0.17 * s * (0.9 + 0.2 * noise.random(i, 5, 7));
      const tint = warm
        ? C.stoneWarm
        : mixRgb(mixRgb(C.stoneDark, C.stone, noise.random(i, 8, 3)), C.stoneLight, noise.random(i, 8, 3) * 0.35);
      return sdf
        .ellipsoid([sx, sy, sz])
        .rotateY(deg + 90)
        .rotateZ((noise.random(i, 1, 5) - 0.5) * 9)
        .rotateX((noise.random(i, 7, 2) - 0.5) * 9)
        .at(hit[0], hit[1] + sy * 0.2, hit[2])
        .paint(tint);
    });
    k.body(
      'stones',
      sdf.union(...stoneShapes).paintFn(stonePaint),
      {
        color: C.stone,
        roughness: 0.88,
        metalness: 0,
        detail: 0.01,
        maxTriangles: 2600,
        bump: (x, y, z) =>
          0.0018 * noise.fbm(x * 34, y * 34, z * 34, 2) + 0.0008 * noise.noise3(x * 90, y * 90, z * 90),
      },
    );

    // ------------------------------------------------------------------ lily pads
    // Two flat rounded pads floating proud of the water; the center-to-edge slit is
    // painted (with the veins) so the geometry stays a clean, reduction-friendly disc.
    const padShapes = PADS.map(([px, pz, r]) =>
      sdf.cylinder(r, 0.02, 0.005).at(px, 0.072, pz),
    );
    k.body('pads', sdf.union(...padShapes).paintFn(padPaint), {
      color: C.pad,
      roughness: 0.55,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 400,
    });

    // ------------------------------------------------------------------ grass tufts
    // Small cone triples on the outer skirt between the stones, probed so they never float.
    const tuft = (x: number, y: number, z: number, s: number): sdf.Shape =>
      sdf.union(
        sdf.cone([x, y, z], [x - 0.018 * s, y + 0.062 * s, z + 0.01 * s], 0.015 * s, 0.003),
        sdf.cone(
          [x + 0.012 * s, y, z - 0.007 * s],
          [x + 0.026 * s, y + 0.048 * s, z - 0.014 * s],
          0.012 * s,
          0.003,
        ),
        sdf.cone(
          [x - 0.005 * s, y, z - 0.012 * s],
          [x - 0.02 * s, y + 0.042 * s, z - 0.024 * s],
          0.011 * s,
          0.003,
        ),
      );
    const tuftAngles = [80, 47, 14, -76, -140, 108];
    const tuftShapes = tuftAngles.map((deg, i) => {
      const a = (deg * Math.PI) / 180;
      const hit = sdf.surfacePoint(bank, [Math.cos(a) * 1.42, 0.05, Math.sin(a) * 1.02], -0.006);
      return tuft(hit[0], hit[1], hit[2], 1.2 + 0.5 * noise.random(i, 3, 6));
    });
    k.body('tufts', sdf.union(...tuftShapes), {
      color: C.tuft,
      roughness: 0.85,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 160,
    });
  },
});
