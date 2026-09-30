import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * nature/terrain/sand-dune — a soft wind-blown sand dune for the Chibi Quest landscape.
 *
 * Role: background terrain prop the player walks past; must read at the 128 px sprite size.
 * Size: 2.5 m long (X), 1.7 m deep (Z), 0.8 m tall, flat base on y = 0, centred, facing +Z.
 * One idea: a soft asymmetric mound, crest left of center, with broad diagonal ripples that wander.
 * Shape language: round; a low lobe on the +X side and a wide flat apron at the foot.
 * Palette: lit sand #f0dfae, ridge highlight #f6e9c0, shaded sand #b8945c.
 * Materials: sand (roughness 0.95), one body, grit in bump.
 * Detail: two blended ellipsoids + apron, sine ripples fading to zero at the foot.
 * Rig/animation: none; it is static terrain.
 */

const sandLight = rgb('#f0dfae');
const sandHi = rgb('#f6e9c0');
const sandShade = rgb('#b8945c');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};

/** Diagonal wandering ripple in [-1, 1], faded to zero at the foot. Shared by displace, paint, bump. */
const ripSine = (x: number, y: number, z: number): number =>
  Math.sin(x * 11 + z * 5 + 2 * noise.fbm(x * 1.2, 0, z * 1.2, 2));
const ripple = (x: number, y: number, z: number): number =>
  (Math.pow(0.5 + 0.5 * ripSine(x, y, z), 2.2) * 2 - 1) * smoothstep(0.0, 0.1, y);

const sandLee = rgb('#c9a86a');
const sandCrest = rgb('#f8ecc8');

const sandPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const up = smoothstep(0.15, 0.7, y);
  const west = smoothstep(0.5, -0.6, x);
  const lit = clamp01(Math.max(up * 0.9, west * 0.7 * smoothstep(0.03, 0.3, y)));
  let c = mixRgb(sandShade, sandLight, lit);
  c = mixRgb(c, sandLee, smoothstep(0.1, -0.5, z) * (1 - up) * 0.8);
  const r = ripple(x, y, z);
  c = mixRgb(c, sandCrest, clamp01(r) * 0.6);
  c = mixRgb(c, sandShade, clamp01(-r) * 0.45);
  const grit = noise.fbm(x * 48, y * 48, z * 48, 2, 29);
  return mixRgb(c, sandShade, clamp01(grit) * 0.12);
};

// The ripple ridges live in the normal map: a displacement strong enough to read tears the surface.
const sandBump = (x: number, y: number, z: number): number =>
  0.012 * ripple(x, y, z) + 0.0016 * noise.fbm(x * 90, y * 90, z * 90, 3, 7) + 0.0022 * noise.fbm(x * 6, y * 6, z * 6, 2, 3);

export default defineAsset({
  name: 'sand-dune',
  description: 'Soft crescent sand dune, 2.5 m long and 0.8 m tall, with wind ripples on every flank.',
  detail: 0.02,
  reference: 'docs/item-mockups/sand-dune-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const main = sdf.ellipsoid([1.15, 0.8, 0.8]).at(-0.2, 0.0, 0.05);
    const lobe = sdf.ellipsoid([0.75, 0.45, 0.6]).at(0.7, 0.0, -0.15);
    const apron = sdf.ellipsoid([1.45, 0.06, 1.0]).at(0, 0.02, 0);
    const dune = main
      .smoothUnion(0.25, lobe)
      .smoothUnion(0.15, apron)
      .scale([0.9, 1, 1])
      .displace(0.012, ripple)
      .intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([4.4, 2, 3]).at(0, 0.5, 0)));
    k.body('sand', dune.paintFn(sandPaint), {
      color: sandLight,
      roughness: 0.95,
      metalness: 0,
      detail: 0.02,
      maxTriangles: 6000,
      paintWeight: 1,
      bump: sandBump,
    });
  },
});
