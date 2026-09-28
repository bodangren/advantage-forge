import { defineAsset, noise, profile, sdf } from '../src/index.js';

/**
 * Mining pick (equipment/tools/mining-pick), 0.85 m long, lying flat on y = 0.
 * Role: hero tool / pickup icon, reads at 128 px as a silhouette.
 * The one idea: a curved double-pointed iron head crowning a straight honey-oak haft.
 * Shape language: square-ish sturdy haft (secondary) + triangular tapering points (dominant).
 * Palette: honey oak #b5814a haft (dominant), dark iron #4a4f55 head (secondary),
 *   gold #d4a93a collar (accent), pale cut wood butt, dark walnut grip.
 * Materials: wood (rough 0.8), leather grip (rough 0.7), worn iron (rough 0.5, metal 0.7),
 *   steel edge paint on the tips, gold collar (metal 1).
 * Detail list: haft + head (primary), eye block and collar (secondary), grain bump (tertiary).
 * No rig: a static tool lying flat, head at the +Z end, tips along X.
 */

const HAFT_R = 0.024;
const HAFT_Y = HAFT_R; // lying on the ground
const HEAD_Z = 0.3; // head sits at the +Z end of the haft
const HEAD_Y = 0.052;

export default defineAsset({
  name: 'mining-pick',
  description: 'Curved double-pointed iron mining pick on a honey-oak haft (equipment/tools/mining-pick).',
  detail: 0.004,
  reference: 'docs/item-mockups/mining-pick-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ haft (honey oak)
    // Straight haft from z = -0.46 (butt) to z = +0.34, lying on y = 0.
    const haft = sdf.cylinder(HAFT_R, 0.8, 0.012).rotateX(90).at(0, HAFT_Y, -0.06);
    k.body('haft', haft, {
      color: '#b5814a',
      roughness: 0.8,
      detail: 0.007,
      // Grain stretched along the haft, plus a subtle per-streak tint.
      paintFn: (x, y, z, base) => {
        const g = noise.fbm(x * 40, y * 40, z * 6, 3);
        return g > 0.25 ? '#8a5a35' : base;
      },
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 60, y * 60, z * 8, 2),
    });

    // Pale cut-wood cap on the butt end.
    const buttCap = sdf.cylinder(0.019, 0.012, 0.004).rotateX(90).at(0, HAFT_Y, -0.458);
    k.body('butt-cap', buttCap, { color: '#c9a06a', roughness: 0.85 });

    // ------------------------------------------------------------------ grip (dark leather)
    const grip = sdf.cylinder(0.028, 0.18, 0.01).rotateX(90).at(0, HAFT_Y + 0.002, -0.33);
    k.body('grip', grip, {
      color: '#5c3a22',
      roughness: 0.7,
      detail: 0.007,
      // Leather strap wound in a spiral around the grip.
      bump: (x, y, z) => 0.0015 * Math.abs(Math.sin(Math.atan2(y - HAFT_Y, x) + z * 150)),
    });

    // ------------------------------------------------------------------ head (worn iron)
    // Curved double point: a tapered chain sweeping out to sharp tips along X,
    // center seated in a chunky eye block around the haft.
    const points: number[][] = [
      [-0.3, 0.03, 0.385, 0.008],
      [-0.23, 0.04, 0.375, 0.014],
      [-0.15, 0.048, 0.355, 0.022],
      [-0.07, 0.052, 0.325, 0.032],
      [0, HEAD_Y, HEAD_Z, 0.042],
      [0.07, 0.052, 0.325, 0.032],
      [0.15, 0.048, 0.355, 0.022],
      [0.23, 0.04, 0.375, 0.014],
      [0.3, 0.03, 0.385, 0.008],
    ];
    const pickArc = sdf.chain(points, 0.02);
    const eyeBlock = sdf.box([0.085, 0.078, 0.07], 0.016).at(0, HEAD_Y, HEAD_Z);
    const head = pickArc.smoothUnion(0.018, eyeBlock);
    // Steel edge on both points: a soft stencil near each tip.
    const edgeL = sdf.sphere(0.032).at(-0.285, 0.031, 0.388);
    const edgeR = sdf.sphere(0.032).at(0.285, 0.031, 0.388);
    k.body(
      'head',
      head.paintWhere(edgeL, '#c8ccd2', 0.01).paintWhere(edgeR, '#c8ccd2', 0.01),
      {
        color: '#4a4f55',
        roughness: 0.5,
        metalness: 0.7,
        detail: 0.007,
        bump: (x, y, z) => 0.0004 * noise.fbm(x * 300, y * 300, z * 300, 2), // hammered iron
      },
    );

    // ------------------------------------------------------------------ collar and pin (gold accent)
    const gold = sdf.union(
      sdf.torus(0.026, 0.007).rotateX(90).at(0, HAFT_Y, 0.2),
      sdf.sphere(0.013).at(0, HEAD_Y + 0.045, HEAD_Z),
    );
    k.body('gold', gold, { color: '#d4a93a', roughness: 0.3, metalness: 1, detail: 0.006 });
  },
});
