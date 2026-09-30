import { defineAsset, sdf, profile, noise, rgb, mixRgb } from '../src/index.js';

/**
 * Copper coin (items/quest-and-treasure/copper-coin).
 *
 * Role: quest reward pickup and treasure icon. Must read at 128 px as a warm copper
 *   disc with a square hole and a ring of six dots.
 * Size: 0.12 m across, 0.022 m thick. Stands on its edge at y = 0, face toward +Z.
 * One idea: a chunky oversized gold coin — fatter and larger than realistic — with
 *   a raised rim and a bold 5-point star punched through both faces.
 * Shape language: round dominant (disc, rim ring, star). No straight lines.
 * Palette: gold #c8773a dominant, shadow #7c4420 in low spots, sparkle #f0b07a worn
 *   onto the rim and star highlights.
 * Materials: one gold body (metalness 1, roughness 0.3).
 * Rig/animation: none (static item).
 */

const R = 0.05; // coin radius
const T = 0.022; // coin thickness
const STAR_OUT = 0.034; // star outer radius
const STAR_IN = 0.0145; // star inner radius
const RIM_MAJ = 0.051; // rim major radius (just inside the coin edge)
const RIM_TUBE = 0.008; // rim tube radius (chunky)

const GOLD = rgb('#c8773a');
const GOLD_DARK = rgb('#7c4420');
const SPARK = rgb('#f0b07a');

export default defineAsset({
  name: 'copper-coin',
  description: 'Chunky copper coin with a square hole and a ring of six raised dots.',
  detail: 0.005,
  reference: 'docs/item-mockups/copper-coin-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- main coin body
    // Cylinder with axis along Y, rotated so axis is along Z. Centered at y = R so
    // the cylindrical edge bottom sits on y = 0.
    const coinBody = sdf.cylinder(R, T, 0.004).rotateX(90).at(0, R, 0);

    // ------------------------------------------------------------- dots and hole
    const RIM_RAISE = 0.004;
    const faceZ = T / 2;
    const rimFront = sdf.torus(0.042, 0.006).rotateX(90).at(0, R, faceZ + 0.002);
    const rimBack = rimFront.mirror('z', 0);
    const dotsF: sdf.Shape[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + Math.PI / 6;
      dotsF.push(
        sdf.ellipsoid([0.0085, 0.0085, 0.006]).at(0.030 * Math.cos(a), R + 0.030 * Math.sin(a), faceZ + RIM_RAISE),
      );
    }
    const dotsFront = sdf.union(...dotsF);
    const dotsBack = dotsFront.mirror('z', 0);
    const hole = sdf.box([0.02, 0.02, 0.2], 0.004).rotateZ(12).at(0, R, 0);

    // ------------------------------------------------------------- paint
    // Subtle warm value variation: deeper gold in low spots, brighter sparkle on
    // worn highlights. Keeps the dominant gold reading at 128 px.
    const goldPaint = (x: number, y: number, z: number) => {
      const n = noise.fbm(x * 16, y * 16, z * 16, 2);
      let c = mixRgb(GOLD, GOLD_DARK, 0.18 + 0.22 * (1 - (n + 1) / 2));
      const hi = noise.fbm(x * 50, y * 50, z * 50, 2);
      if (hi > 0.35) c = mixRgb(c, SPARK, Math.min(1, (hi - 0.35) * 2.5));
      return c;
    };

    const coin = sdf
      .union(coinBody, rimFront, rimBack, dotsFront, dotsBack)
      .subtract(hole)
      .paintFn(goldPaint);

    k.body('gold', coin, {
      color: '#c8773a',
      roughness: 0.4,
      metalness: 1,
      detail: 0.005,
      textureDensity: 2,
      paintWeight: 1.2,
      maxTriangles: 2400,
    });
  },
});