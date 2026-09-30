import { defineAsset, sdf, profile } from '../src/index.js';

/**
 * Silver coin (items/quest-and-treasure/silver-coin).
 *
 * Role: quest reward pickup and treasure icon. Must read at 128 px as a cool silver
 *   disc with a centered crescent moon.
 * Size: 0.12 m across, 0.022 m thick. Stands on its edge at y = 0, face toward +Z.
 * One idea: a chunky oversized gold coin — fatter and larger than realistic — with
 *   a raised rim and a bold 5-point star punched through both faces.
 * Shape language: round dominant (disc, rim ring, star). No straight lines.
 * Palette: gold #d8dde3 dominant, shadow #7d858e in low spots, sparkle #ffffff worn
 *   onto the rim and star highlights.
 * Materials: one gold body (metalness 1, roughness 0.3).
 * Rig/animation: none (static item).
 */

const R = 0.06; // coin radius
const T = 0.022; // coin thickness
const STAR_OUT = 0.034; // star outer radius
const STAR_IN = 0.0145; // star inner radius
const RIM_MAJ = 0.051; // rim major radius (just inside the coin edge)
const RIM_TUBE = 0.008; // rim tube radius (chunky)

const SHADOW = '#7d858e';
const SPARK = '#ffffff';

export default defineAsset({
  name: 'silver-coin',
  description: 'Chunky silver coin with raised rim and a crescent moon on both faces.',
  detail: 0.005,
  reference: 'docs/item-mockups/silver-coin-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- main coin body
    // Cylinder with axis along Y, rotated so axis is along Z. Centered at y = R so
    // the cylindrical edge bottom sits on y = 0.
    const coinBody = sdf.cylinder(R, T, 0.004).rotateX(90).at(0, R, 0);

    // ------------------------------------------------------------- raised crescent
    const DEPTH = T + 0.012; // 6 mm proud on each face
    const moon = sdf
      .extrude(profile.circle(0.03), DEPTH, 0.002)
      .subtract(sdf.extrude(profile.circle(0.026), DEPTH + 0.02).at(0.012, 0.004, 0))
      .rotateZ(15)
      .at(-0.004, R, 0);

    // ------------------------------------------------------------- rim + dots
    const rimZ = T / 2 + 0.004;
    const rimFront = sdf.torus(RIM_MAJ, RIM_TUBE).rotateX(90).at(0, R, rimZ);
    const rimBack = rimFront.mirror('z', 0);
    const dotPts: [number, number][] = [[-0.03, 0.02], [-0.036, -0.008], [0.03, -0.028]];
    const dotsFront = sdf.union(
      ...dotPts.map(([x, y]) => sdf.ellipsoid([0.006, 0.006, 0.0045]).at(x, R + y, T / 2 + 0.001)),
    );
    const dotsBack = dotsFront.mirror('z', 0);

    const coin = sdf
      .union(coinBody, moon, rimFront, rimBack, dotsFront, dotsBack)
      .paintWhere(sdf.box([0.2, 0.2, 0.2]).at(0, R + 0.1, 0).intersect(sdf.halfSpace([0, -1, 0], -R - 0.03)), SHADOW, 0.01)
      .paintWhere(moon.round(0.001), SPARK, 0.004);

    k.body('silver', coin, {
      color: '#d8dde3',
      roughness: 0.4,
      metalness: 0.9,
      detail: 0.004,
      textureDensity: 2,
      maxError: 0.0003,
      maxTriangles: 3000,
    });
  },
});