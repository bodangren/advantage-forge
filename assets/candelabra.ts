import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — three-arm table candelabra, lit (props/furniture/candelabra).
 *
 * Role: warm accent light on tavern tables; must read at 128 px as one dark
 *   metal silhouette with three warm flame blobs.
 * Size: ~0.46 m tall, ~0.33 m wide over the cups; stands on y = 0, faces +Z.
 * One idea: three curved iron arms cradle three lit flames above a chunky
 *   swelled column on a strapped walnut foot.
 * Shape language: round dominant (swelled column, S-curved arms, cup dishes);
 *   square secondary (flat walnut disc, straight strap band).
 * Palette: dark iron #4a4f55 (dominant), walnut #6b4226 base, wax cream
 *   #f2eadb, flame amber #ffb255 + hot core #fff1c2 (accent, emissive).
 * Materials: worn iron (roughness 0.5, metalness 0.7), walnut (0.8), wax
 *   (0.6), flame (emissive 2.2). Turned-wood grain in base bump only.
 * Detail: base + strap, swelled column, junction collar, three chain arms,
 *   revolved drip cups, candle stumps, teardrop flames. Focal: the flames.
 * Rig/animation: none (static prop).
 */

const IRON = '#4a4f55';
const IRON_DARK = '#3e4349';
const WALNUT = '#6b4226';
const WALNUT_DEEP = '#54331d';
const WAX = '#f2eadb';
const FLAME = '#ffb255';
const FLAME_HOT = '#fff1c2';

export default defineAsset({
  name: 'candelabra',
  description:
    'Three-arm iron table candelabra on a strapped walnut foot, with drip cups and three lit amber flames.',
  detail: 0.005,
  texture: { size: 1024 },
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',

  build(k) {
    // ------------------------------------------------------------------ walnut foot
    const base = sdf.cylinder(0.08, 0.025, 0.006).at(0, 0.0125, 0);
    const basePaint = (x: number, y: number, z: number) => {
      const r = Math.hypot(x, z);
      const ring = 0.5 + 0.5 * Math.sin(r * 240 + 3 * noise.fbm(x * 6, y * 6, z * 6, 2));
      const streak = 0.5 + 0.5 * noise.fbm(x * 28, y * 9, z * 28, 2);
      let c = mixRgb(rgb(WALNUT), rgb(WALNUT_DEEP), 0.28 * ring + 0.22 * streak);
      c = mixRgb(c, rgb('#7d4f2e'), 0.15 * (0.5 + 0.5 * noise.fbm(x * 9, y * 3, z * 9, 2)));
      // Sun-catch the top face so the wood reads against the iron foot ring.
      const top = Math.max(0, Math.min(1, (y - 0.016) / 0.009));
      c = mixRgb(c, rgb('#7a4a2c'), 0.16 * top);
      return c;
    };
    k.body('base', base.paintFn(basePaint), {
      color: WALNUT,
      roughness: 0.8,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 500,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 10, z * 30, 2),
    });

    // ------------------------------------------------------------------ ironwork
    // Strap band hugging the foot disc: thin shell of the base, cut to a band.
    const baseShell = base.round(0.006).subtract(base.round(-0.004));
    const strap = baseShell.intersect(sdf.box([0.3, 0.012, 0.3], 0.005).at(0, 0.011, 0));
    // Column: foot ring, tapering stem, low swell, junction hub + collar.
    // Column: foot ring, tapering stem, low swell, junction hub + collar.
    // The cone starts high enough that its rounded cap stays inside the wood.
    const column = sdf.smoothUnion(
      0.012,
      sdf.torus(0.046, 0.015).at(0, 0.034, 0),
      sdf.cone([0, 0.07, 0], [0, 0.296, 0], 0.05, 0.026),
      sdf.sphere(0.055).at(0, 0.115, 0),
      sdf.sphere(0.037).at(0, 0.3, 0),
      sdf.torus(0.03, 0.012).at(0, 0.288, 0),
    );
    // One S-curved arm along +Z (dips out of the hub, then sweeps up), copied
    // to three seats at 120°. Ends embedded in a small revolved drip cup.
    const arm = sdf.chain(
      [
        [0, 0.298, 0.018, 0.018],
        [0, 0.29, 0.06, 0.0145],
        [0, 0.3, 0.098, 0.0125],
        [0, 0.337, 0.122, 0.011],
        [0, 0.363, 0.132, 0.0105],
      ],
      0.008,
    );
    const cupProfile = profile.polygon(
      [
        [0, 0],
        [0.012, 0],
        [0.014, 0.012],
        [0.03, 0.02],
        [0.034, 0.03],
        [0.033, 0.036],
      ],
      { smooth: true, samples: 8 },
    );
    const cup = sdf.revolve(cupProfile).at(0, 0.355, 0.132);
    const armSet = sdf.union(
      arm,
      cup,
      arm.rotateY(120),
      cup.rotateY(120),
      arm.rotateY(240),
      cup.rotateY(240),
    );
    const ironPaint = (x: number, y: number, z: number) => {
      const n = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2);
      return mixRgb(rgb(IRON), rgb(IRON_DARK), 0.35 * n);
    };
    const iron = sdf
      .union(column, armSet, strap)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(ironPaint);
    k.body('iron', iron, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0065,
      maxTriangles: 3400,
    });

    // ------------------------------------------------------------------ candles + flames
    const candle = sdf.cylinder(0.012, 0.052, 0.005).at(0, 0.401, 0.132);
    const candles = sdf.union(candle, candle.rotateY(120), candle.rotateY(240));
    k.body('wax', candles, {
      color: WAX,
      roughness: 0.6,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 300,
    });

    // Teardrop flame: round belly + smaller tip, pale hot core at the bottom.
    const flame = sdf
      .smoothUnion(
        0.007,
        sdf.sphere(0.015).at(0, 0.436, 0.132),
        sdf.sphere(0.008).at(0, 0.453, 0.132),
      )
      .paintFn((_x, y, _z) => {
        const t = Math.max(0, Math.min(1, (y - 0.424) / 0.04));
        const core = Math.max(0, Math.min(1, t / 0.4));
        const tip = Math.max(0, Math.min(1, (t - 0.6) / 0.4));
        return mixRgb(mixRgb(rgb(FLAME_HOT), rgb(FLAME), core), rgb('#f59e33'), tip);
      });
    const flames = sdf.union(flame, flame.rotateY(120), flame.rotateY(240));
    k.body('flame', flames, {
      color: FLAME,
      roughness: 0.2,
      metalness: 0,
      emissive: FLAME,
      emissiveIntensity: 2.0,
      detail: 0.0045,
      maxTriangles: 700,
    });
  },
});
