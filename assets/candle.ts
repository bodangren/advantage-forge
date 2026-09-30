import { defineAsset, sdf, profile, rgb, mixRgb, noise } from '../src/index.js';

// Design note (8 lines):
// - Role: small lit table candle for tavern tables. Reads at 128 px as one warm dot of light.
// - Size: ~0.18 m tall total, stands on y = 0, faces +Z. Saucer 0.06 m diameter.
// - The one idea: a squat beeswax stub whose amber flame is the only bright accent in a dark room.
// - Shape language: round/soft dominant (dished saucer, bulged wax column, teardrop flame).
// - Palette: beeswax cream #f3dfa4 shading to #d8b878, dark iron #4a4f55 saucer,
//   flame gradient #ffd23a / #ffa010 / #ff6a00 / #e8400a (matte, emissive #ff5a00 at 0.25). Dark iron base vs bright flame = focal contrast.
// - Materials: dark iron (metal), beeswax (wax), blackened wick, emissive flame.
// - Details: saucer lip ring, melt taper + drip ridge near the wax top, tiny black wick nub.
// - Rig/animation: none (static prop).

const IRON = '#4a4f55';
const WAX_LIGHT = '#f3dfa4';
const WAX_DARK = '#d8b878';
const WICK = '#241a10';
const FLAME = '#ffb255';
const smooth = (e0: number, e1: number, v: number): number => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'candle',
  description: 'Short lit beeswax table candle in a small dark-iron saucer.',
  detail: 0.0035,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',

  build(k) {
    // ------------------------------------------------------------- iron saucer
    // Shallow dish with an upturned lip ring; a low socket cup seats the wax.
    const saucer = sdf.smoothUnion(
      0.004,
      sdf.cylinder(0.03, 0.006, 0.002).at(0, 0.003, 0), // dish floor
      sdf.torus(0.0265, 0.0042).at(0, 0.0075, 0), // lip ring
      sdf.cylinder(0.014, 0.012, 0.003).at(0, 0.007, 0), // socket cup
    );
    k.body('saucer', saucer, { color: IRON, roughness: 0.5, metalness: 0.7, detail: 0.0035 });

    // ------------------------------------------------------------- wax column
    // Revolved profile: sunk base, straight column, drip ridge bulge, melt-rounded top.
    const waxProfile = profile.polygon(
      [
        [0.0, 0.004],
        [0.0125, 0.004],
        [0.0135, 0.02],
        [0.0128, 0.06],
        [0.0122, 0.1],
        [0.0132, 0.118], // drip ridge
        [0.0118, 0.132],
        [0.0095, 0.14], // melt taper into the top
        [0.0, 0.143],
      ],
      { smooth: true, samples: 10 },
    );
    const wax = sdf.revolve(waxProfile).paintFn((x, y, z, _base) => {
      // Warm cream at the top, shading to deeper beeswax at the base.
      const t = Math.max(0, Math.min(1, (y - 0.005) / 0.135));
      const grad = mixRgb(rgb(WAX_DARK), rgb(WAX_LIGHT), t * t * (3 - 2 * t));
      // Faint wax mottling so the column is not a flat tube.
      const m = noise.fbm(x * 60, y * 40, z * 60, 2) * 0.05;
      return mixRgb(grad, rgb(WAX_LIGHT), Math.max(0, m));
    });
    k.body('wax', wax, { color: WAX_LIGHT, roughness: 0.55, metalness: 0, detail: 0.003 });

    // ------------------------------------------------------------- wick
    // Tiny blackened nub poking out of the melt pool.
    const wick = sdf.cone([0, 0.138, 0], [0, 0.1555, 0], 0.0028, 0.0016);
    k.body('wick', wick, { color: WICK, roughness: 0.8, metalness: 0, detail: 0.0025 });

    // ------------------------------------------------------------- flame
    // Teardrop flame: round belly tapering to a point. Matte gradient flame (yellow base to
    // red-orange tip) with a low emissive, so it reads orange instead of salmon.
    const flame = sdf
      .chain([[0, 0.166, 0, 0.0125], [0, 0.18, 0, 0.008], [0, 0.198, 0, 0.0012]], 0.006)
      .paintFn((x, y, z, _base) => {
        const t = Math.max(0, Math.min(1, (y - 0.156) / 0.042 + Math.hypot(x, z) * 8));
        let c = mixRgb(rgb('#ffd23a'), rgb('#ffa010'), smooth(0, 0.35, t));
        c = mixRgb(c, rgb('#ff6a00'), smooth(0.35, 0.7, t));
        return mixRgb(c, rgb('#e8400a'), smooth(0.7, 1, t));
      });
    k.body('flame', flame, {
      color: FLAME,
      roughness: 0.95,
      metalness: 0,
      emissive: '#ff5a00',
      emissiveIntensity: 0.25,
      detail: 0.0025,
    });
  },
});
