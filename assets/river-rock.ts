import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * nature/terrain/river-rock — cluster of three smooth, rounded river rocks for the Chibi Quest
 * forest clearing (catalog id `nature/terrain/river-rock`).
 *
 * Role: foreground terrain prop near a stream, reads at the 128 px sprite size.
 * Size: about 0.5 m wide, 0.25 m tall, flat base on y = 0, facing +Z. No rig, no clips.
 * One idea: three distinct rounded river stones nestled together — a tall pointed one in
 *   back, a chubby round one on the right, and a small flatter pebble on the front-left —
 *   glossy cool gray with a wet sheen on top and a thin moss ring where they touch the
 *   ground.
 * Shape language: round and chunky (Chibi Quest), flattened ovals, soft bevels everywhere.
 * Palette: cool stone #8a94a0 (dark #5b6670, lit #aab4bf, sheen #cad3dc), moss ring
 *   #4a9a4f (deep #2f7a3f, sunny #7ec850).
 * Materials: stone (roughness 0.35, wet sheen), moss (roughness 0.95, fine bump).
 * Detail list: three distinct rocks with their own crowns (big), soft sheen on the tops
 *   (medium), thin moss ring at the ground contact + faint grain (small).
 *   Focal point: the wet sheen on the tallest crown.
 * Rig/animation: none.
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const stoneDark = rgb('#5b6670');
const stoneLight = rgb('#aab4bf');
const sheen = rgb('#cad3dc');
const mossDeep = rgb('#2f7a3f');
const mossBright = rgb('#7ec850');

export default defineAsset({
  name: 'river-rock',
  description:
    'Cluster of three smooth cool-gray river rocks, 0.5 m wide, wet sheen and a moss ring at the base.',
  detail: 0.006,
  reference: 'docs/item-mockups/river-rock-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ blockout
    // Three distinct, flattened river stones (wider than tall), nestled together. The big
    // one has a pointed crown like the reference; the mid is a chubby disc; the small is
    // a flatter pebble. Each rock stands slightly apart so its silhouette reads in the
    // front view, then a tight smoothUnion (k 0.018) just connects them at the seam.
    //
    //   big: tall with a pointed crown, back-center-left
    //   mid: round and chubby, right side
    //   small: flatter pebble, front-left
    const bigBase = sdf.ellipsoid([0.18, 0.16, 0.16]).rotateY(8).at(-0.02, 0.14, -0.02);
    const bigPeak = sdf.ellipsoid([0.1, 0.09, 0.1]).at(-0.02, 0.26, -0.02);
    const big = bigBase.smoothUnion(0.06, bigPeak);
    const mid = sdf.ellipsoid([0.17, 0.09, 0.15]).rotateZ(-6).rotateY(-18).at(0.18, 0.08, 0.07);
    const small = sdf.ellipsoid([0.1, 0.05, 0.09]).rotateZ(10).at(-0.16, 0.045, 0.15);

    // A small lower fillet (k 0.018) so the three stones nestle without melting into one blob.
    // Round + a soft displace adds the chunky Chibi Quest feel and breaks the perfect-egg read.
    const rocks = big
      .smoothUnion(0.018, mid)
      .smoothUnion(0.018, small)
      .displace(0.006, (x, y, z) => noise.fbm(x * 5.5, y * 5.5, z * 5.5, 3, 4))
      .round(0.01)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // ------------------------------------------------------------------ paint (stone + moss)
    // Cool gray with a darker base, a lit crown, a soft wet sheen, a moss band at the
    // ground contact, and a tiny grain.
    const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const t = clamp01(y / 0.28); // 0 at ground, 1 at the tall crown
      let c = mixRgb(stoneDark, base, clamp01(0.32 + t * 0.68));
      c = mixRgb(c, stoneLight, clamp01((t - 0.55) / 0.45) * 0.55);

      // Soft tonal patches so the gray is not a single flat value.
      const patch = noise.fbm(x * 4.5, y * 4.5, z * 4.5, 3, 7);
      c = mixRgb(c, stoneDark, clamp01(-patch) * 0.35);
      c = mixRgb(c, stoneLight, clamp01(patch) * 0.18);

      // Wet sheen: a smooth highlight on the upper third of the rocks.
      const sheenBand = clamp01((t - 0.7) / 0.3);
      c = mixRgb(c, sheen, sheenBand * 0.22);

      // A few soft gloss spots on the tallest crown.
      const gloss = noise.fbm(x * 9, y * 9, z * 9, 3, 21);
      const glossSpot = clamp01((gloss - 0.55) * 4) * sheenBand;
      c = mixRgb(c, sheen, glossSpot * 0.3);

      // Damp darkening right at the base, so the moss paint reads against a wet stone.
      const damp = clamp01((0.035 - y) / 0.035);
      c = mixRgb(c, stoneDark, damp * 0.55);

      // Moss band on the bottom 3.5 cm, broken up by noise so it is not a clean line.
      const mossMask = clamp01((0.035 - y) / 0.035) *
        (0.55 + 0.45 * noise.fbm(x * 14, y * 14, z * 14, 3, 21));
      const n = noise.fbm(x * 18, y * 18, z * 18, 3, 6);
      let mossColor = mixRgb(mossDeep, rgb('#4a9a4f'), clamp01(0.4 + n * 0.6));
      mossColor = mixRgb(mossColor, mossDeep, clamp01(-n) * 0.5);
      mossColor = mixRgb(mossColor, mossBright, clamp01((n - 0.25) * 1.6) * 0.6);
      c = mixRgb(c, mossColor, mossMask * 0.95);

      // A fine grain (kept gentle — these are smooth stones, not gritty granite).
      const grain = noise.fbm(x * 60, y * 60, z * 60, 2, 13);
      c = mixRgb(c, stoneDark, clamp01(grain) * 0.18);

      return c;
    };

    // ------------------------------------------------------------------ bodies
    k.body('rocks', rocks.paintFn(stonePaint), {
      color: '#8a94a0',
      roughness: 0.35,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 2700,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0009 * noise.fbm(x * 38, y * 38, z * 38, 3, 11) +
        0.0004 * noise.noise3(x * 95, y * 95, z * 95, 5),
    });
  },
});