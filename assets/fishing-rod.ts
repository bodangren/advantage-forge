import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Fishing rod, 1.6 m long, lying flat on y = 0 along the X axis (butt at -X, tip at +X).
 * Role: a pickup / crafting prop in the village; reads at 128 px.
 * One idea: a segmented bamboo rod with a chunky red reel and a red-and-white float on a
 * slack line lying beside the tip.
 * Shape language: long thin round forms with a few chunky accents (reel, float).
 * Palette: honey oak bamboo #b5814a with warm brown nodes #8a5a35, dark walnut handle #6b4226,
 * red accent #d9483b (reel + float), worn iron fittings #4a4f55, straw stem #e0bb60.
 * Materials: wood (rod, handle, crank knob), red painted wood (reel discs, float), iron
 * (band, reel post, crank, tip guide, hook), cream line.
 * Details: bamboo node bands, handle trim band, tip guide ring, J-hook with barb.
 * No rig or animation: a static prop. Triangle budget: under 3,000.
 */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const RED = rgb('#d9483b');
const CREAM = rgb('#f2eadb');
const OAK = rgb('#b5814a');
const OAK_DARK = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const STRAW = rgb('#e0bb60');

// Rod spine: from the handle end (-0.49) to the tip (0.80), center height tapers 0.013 -> 0.008.
const rodRadiusAt = (x: number) => {
  const t = clamp01((x + 0.49) / 1.29);
  return 0.014 - t * 0.007;
};
const rodYAt = (x: number) => {
  const t = clamp01((x + 0.49) / 1.29);
  return 0.0145 - t * 0.005;
};

export default defineAsset({
  name: 'fishing-rod',
  description: 'Bamboo fishing rod with a red reel, a slack line, a red-and-white float, and a hook.',
  detail: 0.008,
  reference: 'docs/item-mockups/fishing-rod-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ handle
    const handle = sdf
      .capsule([-0.78, 0.024, 0], [-0.52, 0.024, 0], 0.024)
      .paintFn((x, y, z, base) => {
        // pale trim band near the front of the grip
        if (x > -0.555 && x < -0.535) return PALE;
        const grain = 0.5 + 0.5 * noise.fbm(x * 40, y * 8, z * 8, 2);
        return mixRgb(base, OAK_DARK, grain * 0.4);
      });
    k.body('handle', handle, {
      color: '#6b4226',
      roughness: 0.8,
      detail: 0.01,
      maxError: 0.0025,
      bump: (x, y, z) => 0.0008 * Math.abs(Math.sin(x * 120)) + 0.0004 * noise.fbm(x * 60, y * 10, z * 10, 2),
    });

    // ------------------------------------------------------------------ bamboo rod
    const rod = sdf
      .cone([-0.49, 0.0145, 0], [0.8, 0.0095, 0], 0.014, 0.007)
      .paintFn((x, y, z) => {
        // bamboo node bands every ~0.14 m, plus a pale tip section
        const u = x + 0.49;
        const f = (u / 0.14) % 1;
        let c = OAK;
        if (f < 0.06) c = OAK_DARK;
        const vary = 0.5 + 0.5 * noise.fbm(x * 5, y * 30, z * 30, 2);
        c = mixRgb(c, PALE, vary * 0.25);
        if (x > 0.55) c = mixRgb(c, PALE, 0.45);
        return c;
      });
    k.body('rod', rod, {
      color: '#b5814a',
      roughness: 0.8,
      detail: 0.009,
      maxError: 0.002,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 8, y * 60, z * 60, 2),
    });

    // ------------------------------------------------------------------ reel (red spool on a post above the rod)
    const spool = sdf.union(
      sdf.cylinder(0.038, 0.006).rotateX(90).at(-0.38, 0.082, 0.022),
      sdf.cylinder(0.038, 0.006).rotateX(90).at(-0.38, 0.082, -0.022),
      sdf.cylinder(0.015, 0.036, 0.004).rotateX(90).at(-0.38, 0.082, 0),
    );
    k.body('reel', spool, {
      color: '#d9483b',
      roughness: 0.55,
      detail: 0.006,
      maxError: 0.002,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 90, y * 90, z * 12, 2),
    });

    // ------------------------------------------------------------------ iron fittings: butt cap, band, post, hub, crank, tip guide, hook
    const gx = 0.72;
    const guide = sdf.torus(0.0085, 0.002).rotateX(90).at(gx, rodYAt(gx) + rodRadiusAt(gx) + 0.004, 0);
    const crankArm = sdf.capsule([-0.38, 0.082, 0.026], [-0.352, 0.108, 0.026], 0.0035);
    const iron = sdf.union(
      sdf.cylinder(0.0235, 0.009).rotateZ(90).at(-0.786, 0.024, 0), // butt cap
      sdf.cylinder(0.0145, 0.014).rotateZ(90).at(-0.38, rodYAt(-0.38), 0), // reel seat band
      sdf.cylinder(0.0055, 0.05).at(-0.38, 0.045, 0), // reel post
      sdf.cylinder(0.008, 0.007).rotateX(90).at(-0.38, 0.082, 0.026), // spool hub
      crankArm,
      guide,
    );
    k.body('iron', iron, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
      maxError: 0.0015,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 200, y * 200, z * 200, 2),
    });

    const knob = sdf.capsule([-0.352, 0.108, 0.029], [-0.352, 0.108, 0.055], 0.006);
    k.body('crank-knob', knob, { color: '#6b4226', roughness: 0.75, detail: 0.004, maxError: 0.0015 });

    // J-hook built from primitives in the XY plane (shank, bend, barbed point), laid flat.
    const hook = sdf
      .union(
        sdf.capsule([0, 0.016, 0], [0, 0.004, 0], 0.0024),
        sdf.capsule([0, 0.004, 0], [0.005, 0.0012, 0], 0.0024),
        sdf.cone([0.005, 0.0012, 0], [0.0072, 0.005, 0], 0.0022, 0.0005),
      )
      .rotateX(90)
      .at(1.005, 0.0045, 0.148);
    k.body('hook', hook, {
      color: '#363a3f',
      roughness: 0.45,
      metalness: 0.7,
      detail: 0.0025,
      maxError: 0.0006,
    });

    // ------------------------------------------------------------------ line: tip -> guide -> slack on the ground -> float
    const line = sdf.chain(
      [
        [0.79, 0.016, 0, 0.0032],
        [0.72, 0.019, 0, 0.0032],
        [0.745, 0.007, 0.028, 0.0032],
        [0.81, 0.0035, 0.062, 0.0032],
        [0.885, 0.0035, 0.092, 0.0032],
        [0.938, 0.013, 0.115, 0.0032],
        [0.945, 0.032, 0.118, 0.0032],
      ],
      0.01,
    );
    k.body('line', line, { color: '#e9dfc9', roughness: 0.6, detail: 0.005, maxError: 0.0015 });

    // ------------------------------------------------------------------ float: red bottom, cream top, straw stem
    const float = sdf
      .sphere(0.018)
      .at(0.945, 0.018, 0.118)
      .smoothUnion(0.004, sdf.cone([0.945, 0.032, 0.118], [0.945, 0.048, 0.118], 0.0035, 0.0018))
      .paintFn((x, y, z) => {
        if (y > 0.031) return STRAW;
        const t = clamp01((y - 0.016) / 0.005);
        return mixRgb(RED, CREAM, t);
      });
    k.body('float', float, {
      color: '#d9483b',
      roughness: 0.5,
      detail: 0.005,
      maxError: 0.0015,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 150, y * 150, z * 150, 2),
    });
  },
});
