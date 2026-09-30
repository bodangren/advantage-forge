import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Vec3 } from '../src/index.js';

/**
 * Design note — cut log (catalog `nature/terrain/log`).
 *
 * Role: a placeable forest-floor prop; reads at 128 px and sits beside the hamlet set.
 * Size: 1.2 m long along X, 0.3 m thick (radius 0.15), stands on y = 0, faces +Z.
 * One idea: a stubby chunky log cut square at both ends — a rough warm-brown bark tube
 *   framed by two pale, ringed cut faces, with a small green moss patch on the sunny top.
 * Shape language: round dominant (tube, soft bevels, gentle lumps), a few triangular
 *   branch knobs break the pure cylinder silhouette.
 * Palette (contract): bark #8a5a35, dark bark #5f3d22, deep #3d2717, sunlit #a8763f,
 *   crown #c99a58; pale cut wood #d2ab72, ring #a87d4b, heart #c9a06a;
 *   moss #4a8a3f / #356b2f / #6fae4a.
 * Value plan: mid bark body, dark ground shadow, bright pale cut faces (focal), small
 *   green moss accent on top.
 * Materials: bark + cut wood (one wood body, roughness 0.82, metalness 0, groove and
 *   grain relief baked in `bump`), moss (roughness 0.9).
 * Detail list: tube + end cuts (primary), branch knobs (secondary), moss patch (accent),
 *   bark furrows + growth rings in `bump` (tertiary). Focal point: the pale cut face.
 * Rig/animation: none (static prop).
 */

const BARK = rgb('#6b4226');
const BARK_DARK = rgb('#4a2c18');
const BARK_DEEP = rgb('#2f1c10');
const BARK_LIGHT = rgb('#7f5230');
const CUT = rgb('#e0c48a');
const CUT_RING = rgb('#b08a50');
const CUT_HEART = rgb('#d4b378');
const MOSS = rgb('#4a8a3f');
const MOSS_DARK = rgb('#356b2f');
const MOSS_LIGHT = rgb('#6fae4a');

const AXIS_Y = 0.11; // log axis height (radius 0.15 -> rests on y = 0)
const HALF_LEN = 0.23; // 1.2 m long
const R = 0.108; // core radius (lumps push the max thickness to ~0.3)

const MOSS_X = -0.1;
const MOSS_SEED: Vec3 = [0, 9, 0];

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

// End faces sit at x = +/-HALF_LEN; this weight blends bark into the pale cut wood.
const faceW = (x: number): number => clamp01((Math.abs(x) - (HALF_LEN - 0.014)) / 0.009);

// Small moss patch on the sunny top-front quadrant.
const mossW = (x: number, y: number, z: number): number => {
  const d = Math.hypot(x - MOSS_SEED[0], y - MOSS_SEED[1], z - MOSS_SEED[2]);
  const patch = clamp01((0.115 - d) / 0.04);
  const top = clamp01((y - (AXIS_Y + 0.015)) / 0.05);
  const clump = clamp01(0.35 + 0.8 * noise.fbm(x * 11, y * 11, z * 11, 2, 51));
  return patch * top * clump;
};

const mossColor = (x: number, y: number, z: number): Rgb => {
  const v = noise.fbm(x * 11, y * 9, z * 9, 2, 23);
  let mc = mixRgb(MOSS_DARK, MOSS, clamp01(0.35 + v * 0.9));
  mc = mixRgb(mc, MOSS_LIGHT, clamp01(v * 1.2 + 0.35) * 0.5);
  return mc;
};

// ------------------------------------------------------------------ paint

const barkPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  let c = base;
  const fw = faceW(x);
  const keep = 1 - fw;
  if (keep > 0.002) {
    // Bark furrows run along the length (X) and wrap around the tube.
    const g = noise.fbm(x * 1.6, y * 9, z * 9, 3, 7) + 0.35 * noise.fbm(x * 6, y * 26, z * 26, 2, 37);
    let bc = mixRgb(BARK, BARK_DARK, clamp01((-g - 0.0) * 3.2) * 0.95);
    bc = mixRgb(bc, BARK_LIGHT, clamp01((g - 0.08) * 2.6) * 0.5);
    // Chunky bark plates give the surface some large-scale variation.
    const plate = noise.fbm(x * 3.2, y * 5.5, z * 5.5, 2, 19);
    bc = mixRgb(bc, BARK_DARK, clamp01(plate * 1.8) * 0.38);
    bc = mixRgb(bc, BARK_LIGHT, clamp01(-plate * 1.8) * 0.22);
    // Shaded ground contact below, a narrow sunlit crown on top.
    bc = mixRgb(bc, BARK_DEEP, clamp01((AXIS_Y - y) / 0.12) * 0.8);
    bc = mixRgb(bc, BARK_LIGHT, clamp01((y - AXIS_Y) / 0.12) * 0.16);
    bc = mixRgb(bc, rgb('#c99a58'), clamp01((y - (AXIS_Y + 0.105)) / 0.04) * 0.35);
    // Moss creeping out of the patch.
    const mw = mossW(x, y, z);
    if (mw > 0.003) bc = mixRgb(bc, mossColor(x, y, z), mw);
    c = mixRgb(c, bc, keep);
  }
  if (fw > 0.002) {
    // Pale cut face with bold growth rings around the axis.
    const d = Math.hypot(y - AXIS_Y, z);
    const warp = noise.fbm(x * 2.5, y * 20, z * 20, 2, 31) * 0.018;
    const ring = Math.pow(0.5 + 0.5 * Math.cos((d + warp) * 150), 8);
    let fc = mixRgb(CUT, CUT_RING, ring * 0.9);
    fc = mixRgb(fc, CUT_HEART, clamp01((0.022 - d) / 0.022) * 0.5);
    // Small dark heart at the very centre.
    fc = mixRgb(fc, CUT_RING, clamp01((0.012 - d) / 0.01) * 0.7);
    const mot = noise.fbm(x * 6, y * 14, z * 14, 2, 41);
    fc = mixRgb(fc, CUT_RING, clamp01(mot * 1.1) * 0.12);
    // Thin dark bark rim right at the cut edge.
    fc = mixRgb(fc, BARK_DARK, clamp01((d - 0.09) / 0.03) * 0.6);
    c = mixRgb(c, fc, fw);
  }
  return c;
};

const barkBump = (x: number, y: number, z: number): number => {
  const fw = faceW(x);
  const keep = 1 - fw;
  const g = noise.fbm(x * 1.6, y * 9, z * 9, 3, 7);
  let b = 0.006 * g * keep;
  b += 0.0016 * noise.noise3(x * 70, y * 70, z * 70, 5) * keep;
  // Cut face: fine recessed growth rings plus a little crosscut grain.
  const d = Math.hypot(y - AXIS_Y, z);
  const ring = Math.pow(0.5 + 0.5 * Math.cos(d * 150), 8);
  b += (-0.0022 * ring + 0.0006 * noise.fbm(x * 20, y * 18, z * 18, 2, 9)) * fw;
  // Moss fuzz.
  b += 0.0015 * noise.fbm(x * 40, y * 40, z * 40, 2, 5) * mossW(x, y, z);
  return b;
};

export default defineAsset({
  name: 'wood-log',
  description:
    'Cut log lying along X: rough brown bark with a bump texture, two pale growth-ring cut ends, and a small moss patch.',
  reference: 'docs/item-mockups/wood-log-mock.jpg',
  detail: 0.006,
  texture: { size: 1024 },

  build(k) {
    const core = sdf.cylinder(R, HALF_LEN * 2 + 0.02, 0.0).rotateZ(90).at(0, AXIS_Y, 0);
    const lumps = sdf
      .ellipsoid([0.12, 0.116, 0.112])
      .at(-0.1, AXIS_Y, 0.004)
      .smoothUnion(0.04, sdf.ellipsoid([0.12, 0.114, 0.11]).at(0.1, AXIS_Y, -0.004));
    const stub = sdf.cone([0.0, AXIS_Y + 0.08, 0.0], [0.0, AXIS_Y + 0.17, 0.0], 0.03, 0.024);
    const log = core
      .smoothUnion(0.03, lumps)
      .smoothUnion(0.015, stub)
      .smoothIntersect(0.01, sdf.halfSpace([1, 0, 0], HALF_LEN))
      .smoothIntersect(0.01, sdf.halfSpace([-1, 0, 0], HALF_LEN))
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    k.body('log-wood', log.paintFn(barkPaint), {
      color: '#6b4226',
      roughness: 0.82,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 3000,
      paintWeight: 2,
      textureDensity: 2,
      bump: barkBump,
    });

    // Leaf pair on the stub tip.
    const tip = AXIS_Y + 0.17;
    const leafA = sdf.ellipsoid([0.05, 0.008, 0.026]).rotateZ(20).at(0.04, tip + 0.01, 0);
    const leafB = sdf.ellipsoid([0.05, 0.008, 0.026]).rotateZ(-20).at(-0.04, tip + 0.01, 0);
    k.body('log-leaf', leafA.smoothUnion(0.01, leafB).paint(rgb('#4f9a3a')), {
      color: '#4f9a3a',
      roughness: 0.85,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 400,
    });
  },
});
