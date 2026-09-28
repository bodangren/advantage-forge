import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — stone obelisk (catalog props/world/obelisk).
 *
 * Role: Sunken Vault landmark. It must read at 128 px as a stone needle with a cyan glow.
 * Size: 2.0 m tall. It stands on y = 0, centred on the Y axis, and faces +Z.
 * One idea: a chunky tapered shaft and pyramid tip, with glowing runes down the front
 *   face and a cyan wisp that leaks off the stone.
 * Shape language: square and triangular (a monument), with soft bevels and round rubble.
 * Palette: stone #6f7680 / dark #4b525c / pale #9aa2ab, moss #3f6b52,
 *   glow #6ad0ff on a dark base #0c2430.
 * Materials: one stone body (roughness 0.9) and one emissive glow body (roughness 0.32).
 * Detail: stepped plinth, tapered shaft, pyramid (big); rune column and wisp (focal);
 *   rubble and a chipped corner (small). No rig.
 */

const STONE = rgb('#6f7680');
const STONE_DARK = rgb('#4b525c');
const STONE_SHADOW = rgb('#373c44');
const STONE_PALE = rgb('#9aa2ab');
const MOSS = rgb('#3f6b52');
const MOSS_DARK = rgb('#2a4a38');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

// Shaft before the bevel inflate. The visible face sits BEVEL meters outside this.
const SY0 = 0.4;
const SY1 = 1.74;
const SH0 = 0.17;
const SH1 = 0.1;
const BEVEL = 0.022;
const TILT_DEG = (Math.atan2(SH0 - SH1, SY1 - SY0) * 180) / Math.PI;

/** Half-width of the bevelled shaft face at height y. */
const shaftHalf = (y: number): number => {
  const t = clamp01((y - SY0) / (SY1 - SY0));
  return SH0 + (SH1 - SH0) * t + BEVEL;
};

/**
 * Square frustum along Y. half0 is the half-width at y0, half1 at y1.
 * Edges are sharp; call .round() for the chibi bevel.
 */
const squareFrustum = (y0: number, y1: number, half0: number, half1: number): Sdf => {
  const slope = (half1 - half0) / (y1 - y0);
  const len = Math.hypot(slope, 1);
  const ny = -slope / len;
  const nSide = 1 / len;
  const offset = ny * y0 + nSide * half0;
  const half = Math.max(half0, half1);
  let shape = sdf.box([half * 2 + 0.008, y1 - y0, half * 2 + 0.008]).at(0, (y0 + y1) / 2, 0);
  const planes: Array<[number, number, number]> = [
    [0, ny, nSide],
    [0, ny, -nSide],
    [nSide, ny, 0],
    [-nSide, ny, 0],
  ];
  for (const n of planes) shape = shape.intersect(sdf.halfSpace(n, offset));
  return shape;
};

/** Place a glyph built in the XY plane onto the tapered +Z face. inset < 0 sits proud. */
const onFace = (shape: Sdf, y: number, inset = -0.008): Sdf =>
  shape.rotateX(-TILT_DEG).at(0, y, shaftHalf(y) - inset);

const stonePaint = (x: number, y: number, z: number): Rgb => {
  const t = clamp01(y / 1.9);
  let c = mixRgb(STONE_DARK, STONE, 0.28 + 0.64 * t);
  const patch = noise.fbm(x * 3.2, y * 2.4, z * 3.2, 3);
  c = mixRgb(c, STONE_DARK, clamp01(-patch) * 0.28);
  c = mixRgb(c, STONE_PALE, clamp01(patch - 0.12) * 0.18);
  const lip = Math.max(
    smoothstep(0.016, 0.0, Math.abs(y - 0.18)),
    smoothstep(0.014, 0.0, Math.abs(y - 0.3)),
    smoothstep(0.014, 0.0, Math.abs(y - 0.42)),
  );
  c = mixRgb(c, STONE_PALE, lip * 0.4);
  c = mixRgb(c, STONE_PALE, smoothstep(1.64, 1.96, y) * 0.42);
  c = mixRgb(c, STONE_SHADOW, smoothstep(0.18, 0.0, y) * 0.4);
  for (const gy of [0.72, 1.16, 1.52]) {
    c = mixRgb(c, STONE_SHADOW, smoothstep(0.016, 0.002, Math.abs(y - gy)) * 0.65);
  }
  if (y < 0.28) {
    const back = smoothstep(0.1, -0.3, z);
    const m = noise.fbm(x * 5, y * 4, z * 5, 2);
    const amt = smoothstep(0.28, 0.02, y) * (0.28 + 0.72 * back) * clamp01(m + 0.12);
    c = mixRgb(c, MOSS, amt * 0.55);
    c = mixRgb(c, MOSS_DARK, amt * 0.25);
  }
  return c;
};

export default defineAsset({
  name: 'obelisk',
  description:
    'A 2 m stone obelisk: tapered shaft, pyramid tip, stepped base, glowing cyan runes on the front face.',
  detail: 0.012,
  reference: 'docs/item-mockups/obelisk-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // --------------------------------------------------------------- plinth
    const step1 = sdf.box([0.82, 0.18, 0.82], 0.032).at(0, 0.09, 0);
    const step2 = sdf.box([0.62, 0.13, 0.62], 0.026).at(0, 0.225, 0);
    const step3 = sdf.box([0.48, 0.13, 0.48], 0.022).at(0, 0.345, 0);
    const plinth = sdf.smoothUnion(0.014, step1, step2, step3);

    const shaft = squareFrustum(SY0, SY1, SH0, SH1).round(BEVEL);
    // Wider than the shaft top so the pyramidion has a small lip. Tip lands at 2.0 m.
    const pyramid = squareFrustum(1.6, 1.988, 0.128, 0.01).round(0.014);

    const rockSpecs: Array<[number, number, number, number, number, number, number]> = [
      [0.32, 0.09, 0.34, 0.16, 0.1, 0.13, 14],
      [-0.3, 0.08, 0.32, 0.14, 0.09, 0.12, -18],
      [0.36, 0.09, -0.1, 0.14, 0.1, 0.12, 30],
      [-0.34, 0.09, -0.14, 0.15, 0.1, 0.13, -28],
      [0.02, 0.07, 0.42, 0.13, 0.08, 0.11, 6],
    ];
    const rocks = rockSpecs.map(([x, y, z, rx, ry, rz, yaw]) =>
      sdf.ellipsoid([rx, ry, rz]).rotateY(yaw).at(x, y, z),
    );

    // Shallow carved field so the glyphs read as cut into the front face.
    const panel = sdf
      .box([0.16, 0.78, 0.036], 0.01)
      .rotateX(-TILT_DEG)
      .at(0, 1.08, shaftHalf(1.08) - 0.004);
    const chip = sdf.sphere(0.05).at(-0.36, 0.05, -0.32);

    const stone = sdf
      .union(plinth, shaft, pyramid, ...rocks)
      .subtract(panel, chip)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(stonePaint)
      .paintWhere(panel, STONE_DARK, 0.008);

    k.body('stone', stone, {
      color: '#6f7680',
      roughness: 0.9,
      metalness: 0,
      detail: 0.013,
      maxError: 0.0045,
      maxTriangles: 1600,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 16, y * 12, z * 16, 2),
    });

    // --------------------------------------------------------------- glow
    // Horns-up crescent, a branched rune, and a ring-and-bar. They sit proud of the carved field.
    const crescent = sdf
      .torus(0.044, 0.017)
      .rotateX(90)
      .subtract(sdf.sphere(0.038).at(0, -0.02, 0));
    const branched = sdf.smoothUnion(
      0.012,
      sdf.capsule([0, -0.06, 0], [0, 0.06, 0], 0.018),
      sdf.capsule([0, 0.01, 0], [-0.04, 0.06, 0], 0.016),
      sdf.capsule([0, 0.01, 0], [0.04, 0.06, 0], 0.016),
      sdf.capsule([-0.032, -0.038, 0], [0.032, -0.038, 0], 0.015),
    );
    const ring = sdf
      .torus(0.034, 0.015)
      .rotateX(90)
      .smoothUnion(0.008, sdf.capsule([0, -0.026, 0], [0, 0.026, 0], 0.013));

    // A soft ribbon on the +X side, so the three-quarter view shows it crossing
    // the front. It stays clear of the centred rune column.
    const wisp = sdf.chain(
      [
        [0.0, 1.52, 0.12, 0.024],
        [0.14, 1.4, 0.22, 0.04],
        [0.24, 1.24, 0.14, 0.046],
        [0.12, 1.08, 0.28, 0.046],
        [0.22, 0.92, 0.16, 0.044],
        [0.08, 0.76, 0.3, 0.042],
        [0.18, 0.6, 0.14, 0.036],
        [0.06, 0.48, 0.22, 0.03],
        [0.1, 0.4, 0.02, 0.022],
      ],
      0.04,
    );

    const glow = sdf.union(
      onFace(crescent, 1.36),
      onFace(branched, 1.08),
      onFace(ring, 0.82),
      wisp,
    );

    k.body('runes', glow, {
      color: '#0c2430',
      roughness: 0.32,
      metalness: 0,
      emissive: '#6ad0ff',
      emissiveIntensity: 1.8,
      detail: 0.008,
      maxError: 0.003,
      maxTriangles: 1000,
    });
  },
});
