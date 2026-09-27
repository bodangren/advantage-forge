import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * nature/terrain/rock-cluster — huddle of small rounded stones on a shaded forest-floor patch.
 *
 * Role: gap-filler terrain prop between a single boulder and flat ground; reads at 128 px.
 * Size: about 0.9 m wide, 0.35 m tall, flat base on y = 0, facing +Z. No rig, no clips.
 * One idea: five chunky pebble-like stones leaning on each other around one
 *   dominant lump, with one bright moss cap on the tallest crown.
 * Shape language: round dominant (friendly Chibi Quest stones), soft bevels everywhere.
 * Palette: cool gray stone #8a94a0 (dark crevice #5b6670, lit crown #aab4bf),
 *   forest floor #4a8a3f (deep #2f7a3f, sunny #7ec850, litter #8a5a35), moss accent #4a9a4f / deep #2f7a3f.
 * Materials: stone (roughness 0.9, fine grain bump) and dirt (roughness 0.95, soft bump).
 * Detail list: five merged stones (big), dirt patch (medium), grain + moss paint (small).
 *   Focal point: the moss cap on the tallest crown.
 * Rig/animation: none.
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const grayDark = rgb('#5b6670');
const grayLight = rgb('#aab4bf');
const dirtDark = rgb('#2f7a3f');
const dirtLight = rgb('#7ec850');
const leafBrown = rgb('#8a5a35');
const mossDeep = rgb('#2f7a3f');

export default defineAsset({
  name: 'rock-cluster',
  description: 'Huddle of five small rounded gray stones with one moss cap on a shaded forest-floor patch; 0.9 m wide.',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ stones
    // Five pebble-like lumps: one dominant mass, two medium leaners, two small
    // pebbles. Bottoms are buried in the dirt patch so nothing floats.
    const big = sdf.ellipsoid([0.22, 0.17, 0.2]).rotateY(20).at(0, 0.15, 0.02);
    const left = sdf.ellipsoid([0.15, 0.12, 0.14]).rotateZ(10).at(-0.27, 0.1, 0.09);
    const right = sdf.ellipsoid([0.13, 0.1, 0.12]).rotateZ(-12).at(0.26, 0.08, -0.03);
    const front = sdf.ellipsoid([0.11, 0.08, 0.1]).at(0.08, 0.07, 0.27);
    const back = sdf.ellipsoid([0.1, 0.085, 0.09]).at(-0.06, 0.08, -0.24);
    const pebble = sdf.ellipsoid([0.07, 0.05, 0.06]).at(0.3, 0.05, 0.2);

    const stones = big
      .smoothUnion(0.03, left)
      .smoothUnion(0.03, right)
      .smoothUnion(0.025, front)
      .smoothUnion(0.025, back)
      .smoothUnion(0.02, pebble)
      .displace(0.012, (x, y, z) => noise.fbm(x * 5, y * 5, z * 5, 3, 4))
      .round(0.012)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // ------------------------------------------------------------------ dirt
    // A soft round patch the stones sit in: wider than the huddle, thin, top at y = 0.05.
    const dirt = sdf
      .cylinder(0.5, 0.06, 0.02)
      .scale([1.1, 1, 0.95])
      .at(0, 0.03, 0.02)
      .displace(0.008, (x, y, z) => noise.fbm(x * 4, y * 4, z * 4, 2, 17))
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // ------------------------------------------------------------------ paint
    const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const t = clamp01((y - 0.02) / 0.32);
      let c = mixRgb(grayDark, base, clamp01(0.3 + t * 0.7));
      c = mixRgb(c, grayLight, clamp01((t - 0.6) / 0.4) * 0.5);
      // Soft tonal patches so the gray is not flat.
      const patch = noise.fbm(x * 6, y * 6, z * 6, 3, 7);
      c = mixRgb(c, grayDark, clamp01(-patch) * 0.4);
      c = mixRgb(c, grayLight, clamp01(patch) * 0.14);
      // One moss cap on the tallest crown, broken up by noise.
      const n = noise.fbm(x * 14, y * 14, z * 14, 3, 21);
      const d1 = Math.hypot(x - 0.0, y - 0.31, z - 0.02);
      const m = clamp01((0.13 - d1) / 0.06) * clamp01((n + 0.35) / 0.5);
      c = mixRgb(c, mossDeep, m * 0.9);
      c = mixRgb(c, rgb('#4a9a4f'), m * clamp01(n * 0.8 + 0.55) * 0.85);
      return c;
    };

    const dirtPaint = (x: number, y: number, z: number): Rgb => {
      const base = rgb('#4a8a3f');
      const bigPatch = 0.5 + 0.5 * noise.fbm(x * 3, z * 3, 11, 3);
      const midPatch = 0.5 + 0.5 * noise.fbm(x * 8, z * 8, 23, 2);
      let c = mixRgb(base, dirtDark, clamp01((0.58 - bigPatch) * 2.4) * 0.7);
      c = mixRgb(c, dirtDark, clamp01((0.62 - midPatch) * 2.0) * 0.35);
      c = mixRgb(c, dirtLight, clamp01((0.5 + 0.5 * noise.fbm(x * 2, z * 2, 71, 2) - 0.6) * 2.5) * 0.4);
      // Contact shading under the stones so the huddle sits in the patch.
      const r = Math.hypot(x, z - 0.02);
      c = mixRgb(c, dirtDark, clamp01((0.42 - r) / 0.42) * 0.45);
      const speckle = 0.5 + 0.5 * noise.fbm(x * 26, y * 8, z * 26, 2, 5);
      c = mixRgb(c, leafBrown, clamp01((speckle - 0.62) * 3) * 0.3);
      return c;
    };

    k.body('stones', stones.paintFn(stonePaint), {
      color: '#8a94a0',
      roughness: 0.9,
      metalness: 0,
      detail: 0.007,
      maxTriangles: 1800,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.002 * noise.fbm(x * 40, y * 40, z * 40, 3, 11) +
        0.0007 * noise.noise3(x * 110, y * 110, z * 110, 5),
    });

    k.body('dirt', dirt.paintFn(dirtPaint), {
      color: '#4a8a3f',
      roughness: 0.95,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 550,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 25, y * 6, z * 25, 2, 9),
    });
  },
});
