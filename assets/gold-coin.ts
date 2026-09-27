import { defineAsset, sdf, profile, noise, rgb, mixRgb } from '../src/index.js';

/**
 * Gold coin (items/quest-and-treasure/gold-coin).
 *
 * Role: quest reward pickup and treasure icon. Must read at 128 px as a warm gold
 *   disc with a centered star.
 * Size: 0.12 m across, 0.022 m thick. Stands on its edge at y = 0, face toward +Z.
 * One idea: a chunky oversized gold coin — fatter and larger than realistic — with
 *   a raised rim and a bold 5-point star punched through both faces.
 * Shape language: round dominant (disc, rim ring, star). No straight lines.
 * Palette: gold #f2c14e dominant, shadow #a06b1c in low spots, sparkle #ffe9a8 worn
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

const GOLD = rgb('#f2c14e');
const GOLD_DARK = rgb('#a06b1c');
const SPARK = rgb('#ffe9a8');

export default defineAsset({
  name: 'gold-coin',
  description: 'Chunky gold coin with raised rim and a 5-point star on both faces.',
  detail: 0.005,
  reference: 'docs/item-mockups/gold-coin-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- main coin body
    // Cylinder with axis along Y, rotated so axis is along Z. Centered at y = R so
    // the cylindrical edge bottom sits on y = 0.
    const coinBody = sdf.cylinder(R, T, 0.004).rotateX(90).at(0, R, 0);

    // ------------------------------------------------------------- 5-point star
    // Alternating outer/inner points, top point at +Y. Polygon order is clockwise
    // from the top point; SDF polygon takes either winding.
    const pts: [number, number][] = [];
    for (let i = 0; i < 5; i++) {
      const outerA = ((90 - i * 72) * Math.PI) / 180;
      const innerA = ((90 - i * 72 - 36) * Math.PI) / 180;
      pts.push([STAR_OUT * Math.cos(outerA), STAR_OUT * Math.sin(outerA)]);
      pts.push([STAR_IN * Math.cos(innerA), STAR_IN * Math.sin(innerA)]);
    }
    const starProfile = profile.polygon(pts);

    // Extrude deeper than the coin so the star sticks out from both faces by
    // about 6 mm each side. Co-located with the coin center so it punches through.
    const STAR_DEPTH = T + 0.012;
    const star = sdf.extrude(starProfile, STAR_DEPTH, 0.002).at(0, R, 0);

    // ------------------------------------------------------------- raised rim
    // Torus on each face, raised above the face plane. The outer edge of the rim
    // hugs the coin edge; the inner edge sits well inside so the star has room.
    const RIM_RAISE = 0.004;
    const rimZ = T / 2 + RIM_RAISE;
    const rimFront = sdf.torus(RIM_MAJ, RIM_TUBE).rotateX(90).at(0, R, rimZ);
    const rimBack = rimFront.mirror('z', 0);

    // ------------------------------------------------------------- rim studs
    // 8 small chunky box-shaped studs sitting on top of the rim, sticking UP from
    // the face (not radially outward). They look like rivets marking the rim's
    // edge, in the chunky style of the mock.
    const N_STUDS = 8;
    const studZ = rimZ + 0.0005;
    const studsFront: sdf.Shape[] = [];
    for (let i = 0; i < N_STUDS; i++) {
      const a = (i * Math.PI * 2) / N_STUDS + Math.PI / N_STUDS;
      studsFront.push(
        sdf
          .box([0.008, 0.005, 0.006], 0.0015)
          .rotateZ((a * 180) / Math.PI)
          .at(RIM_MAJ * Math.cos(a), R + RIM_MAJ * Math.sin(a), studZ),
      );
    }
    const studsFrontUnion = sdf.union(...studsFront);
    const studsBackUnion = studsFrontUnion.mirror('z', 0);

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
      .union(coinBody, star, rimFront, rimBack, studsFrontUnion, studsBackUnion)
      .paintFn(goldPaint);

    k.body('gold', coin, {
      color: '#f2c14e',
      roughness: 0.3,
      metalness: 1,
      detail: 0.005,
      textureDensity: 2,
      paintWeight: 1.2,
      maxTriangles: 2400,
    });
  },
});