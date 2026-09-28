import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — glass vial of glowing green potion (props/containers/vial).
 *
 * Role: hero pickup / inventory prop for chibi adventurers; must read at 128 px.
 * Size: 0.12 m tall, 0.066 m wide at the round bottom, stands on y = 0, faces +Z.
 * One idea: a tiny round-bottomed glass vial whose lower half is a fat glowing
 *   green bulb — the glow is the silhouette and the focal point.
 * Shape language: round dominant (bulb bottom, rolled lip, cork), no secondary.
 * Palette: glass pale mint tint #cfe8d8 (dominant, transparent), glow green
 *   emissive #3dff70 on dark base #0b3d18 (accent, strongest value contrast),
 *   cork pale cut wood #c9a06a with warm brown #8a5a35 streaks (secondary).
 * Materials: glass (roughness 0.1, metalness 0, opacity 0.35), glowing liquid
 *   (roughness 0.2, emissive 1.8), cork (roughness 0.9, metalness 0).
 * Detail: primary bulb + slim neck + rolled lip; secondary cork plug; tertiary
 *   cork grain streaks in paint. Focal point: the green glow in the bulb.
 * Rig/animation: none (static pickup).
 */

const GLASS = '#bfe0cc';
const GLOW = '#2fe066';
const GLOW_DARK = '#0b3d18';
const CORK = rgb('#c9a06a');
const CORK_DARK = rgb('#8a5a35');

export default defineAsset({
  name: 'vial',
  description:
    'Small round-bottomed glass vial with a rolled lip, a pale cork, and glowing green potion inside.',
  detail: 0.005,
  reference: 'docs/item-mockups/vial-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ glass
    // Revolved hollow vial: round bottom bulb, slim tapering tube, rolled lip.
    // Profile goes up the outside, over the lip, and down the inside wall.
    const glassProfile = profile.polygon(
      [
        [0, 0.006],
        [0.02, 0.0],
        [0.03, 0.01],
        [0.033, 0.026],
        [0.03, 0.044],
        [0.024, 0.062],
        [0.02, 0.076],
        [0.0235, 0.084], // rolled rim outer
        [0.0235, 0.093],
        [0.014, 0.093], // rolled rim inner
        [0.0148, 0.085],
        [0.015, 0.076],
        [0.0165, 0.062],
        [0.021, 0.038],
        [0.013, 0.02],
        [0, 0.014], // inner floor
      ],
      { smooth: true, samples: 14 },
    );
    const glassShape = sdf.revolve(glassProfile);
    k.body('glass', glassShape, {
      color: GLASS,
      roughness: 0.12,
      metalness: 0,
      opacity: 0.45,
      detail: 0.004,
      maxTriangles: 1400,
    });

    // ------------------------------------------------------------------ liquid
    // Glowing potion hugging the inside of the bulb, filled to ~63% height,
    // flat meniscus cut. Dark base color so the emissive glow reads saturated.
    const liquidProfile = profile.polygon(
      [
        [0, 0.016],
        [0.014, 0.017],
        [0.021, 0.027],
        [0.021, 0.04],
        [0.018, 0.048],
        [0.015, 0.062],
        [0, 0.062],
      ],
      { smooth: true, samples: 12 },
    );
    k.body('liquid', sdf.revolve(liquidProfile), {
      color: GLOW_DARK,
      roughness: 0.2,
      metalness: 0,
      emissive: GLOW,
      emissiveIntensity: 2,
      detail: 0.006,
      maxTriangles: 500,
    });

    // ------------------------------------------------------------------ cork
    // Tapered plug seated in the neck, domed top, grain streaks along its length.
    const corkShape = sdf
      .smoothUnion(
        0.003,
        sdf.cone([0, 0.091, 0], [0, 0.111, 0], 0.0132, 0.0108),
        sdf.sphere(0.0098).at(0, 0.111, 0),
      )
      .paintFn((x, y, z) => {
        const streak = 0.5 + 0.5 * noise.fbm(x * 60, y * 8, z * 60, 2);
        const fleck = noise.fbm(x * 120, y * 30, z * 120, 2);
        let c = mixRgb(CORK, CORK_DARK, 0.12 * streak);
        c = mixRgb(c, CORK_DARK, 0.15 * Math.max(0, fleck - 0.35));
        // Darker where the cork enters the neck.
        c = mixRgb(c, CORK_DARK, 0.35 * Math.max(0, (0.098 - y) / 0.01));
        return c;
      });
    k.body('cork', corkShape, {
      color: '#c9a06a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 400,
    });
  },
});
