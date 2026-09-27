import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — round wooden stew bowl (props/food/bowl).
 *
 * Role: tavern table dressing for the chibi hamlet game; must read at 128 px.
 * Size: 0.18 m diameter, 0.09 m tall, stands on y = 0, faces +Z.
 * One idea: a stout honey-oak bowl with a thick rolled lip, holding a puddle
 *   of deep-orange stew with chunky bits poking out — the meal reads first.
 * Shape language: round dominant (revolved body, rolled lip, domed stew),
 *   small square accents (chunky veg lumps, knobby bone).
 * Palette: honey oak #b5814a (dominant), sun-lit oak #d9a869, dark oak #5f3d1e;
 *   deep stew #8a4a18, vegetable green #6a8a3a, bone cream #ece0c0 (accents).
 * Materials: wood (roughness 0.8, grain in bump), moist stew (roughness 0.4),
 *   matte veg (roughness 0.7), satin bone (roughness 0.45).
 * Detail: primary revolved bowl + stew dome; secondary lip roll, base ring,
 *   2 veg lumps + 1 bone; tertiary wood grain in bump only.
 * Rig/animation: none (static prop).
 */

const OAK = rgb('#b5814a');
const OAK_LIGHT = rgb('#d9a869');
const OAK_DARK = rgb('#5f3d1e');
const STEW = rgb('#8a4a18');
const STEW_LIGHT = rgb('#9c5517');
const VEG = rgb('#6a8a3a');
const VEG_LIGHT = rgb('#8aa84e');
const BONE = rgb('#ece0c0');
const BONE_DARK = rgb('#d8c8a0');

const H = 0.091; // rim height

export default defineAsset({
  name: 'bowl',
  description:
    'Stout honey-oak stew bowl with a thick rolled lip, a puddle of deep-orange stew, two vegetable lumps, and one bone.',
  detail: 0.005,
  reference: 'reference/mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- bowl body
    // Revolved cross-section: flat ground foot, chunky base ring, soft outer
    // taper, thick rolled lip, inner wall down to a thick floor (stew sits in
    // it). U = radius, V = height.
    const bowlProfile = profile.polygon(
      [
        [0, 0.0],
        [0.042, 0.0],
        [0.058, 0.004],
        [0.066, 0.012], // chunky base ring bulge
        [0.067, 0.022],
        [0.071, 0.034],
        [0.082, 0.052], // soft outer taper
        [0.089, 0.07],
        [0.0915, 0.081], // roll into the lip
        [0.089, 0.089],
        [0.082, 0.091], // lip top
        [0.076, 0.088],
        [0.0735, 0.08], // inner wall
        [0.068, 0.062],
        [0.056, 0.048],
        [0.02, 0.039], // thick inner floor
        [0, 0.038],
      ],
      { smooth: true, samples: 16 },
    );
    const bowlShape = sdf
      .revolve(bowlProfile)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const woodPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 48, z * 22, 2);
      const patch = 0.5 + 0.5 * noise.fbm(x * 6, y * 9, z * 6, 2);
      let c = mixRgb(OAK, OAK_LIGHT, 0.05 + 0.14 * patch);
      c = mixRgb(c, OAK_LIGHT, 0.07 * grain);
      // Damp shaded foot, sun-lit shoulder and lip.
      const t = Math.min(1, Math.max(0, y / H));
      c = mixRgb(c, OAK_DARK, 0.38 * Math.max(0, 1 - t / 0.35) ** 2);
      c = mixRgb(c, OAK_LIGHT, 0.13 * Math.max(0, (t - 0.6) / 0.4));
      // Shadowed interior band above the stew makes the orange surface pop.
      const rad = Math.hypot(x, z);
      if (rad < 0.0825 && y > 0.075) {
        c = mixRgb(c, OAK_DARK, 0.5 * Math.min(1, (y - 0.075) / 0.016));
      }
      return c;
    };
    k.body('bowl-wood', bowlShape.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.005,
      paintWeight: 2,
      maxTriangles: 800,
      bump: (x, y, z) =>
        0.0016 * noise.fbm(x * 26, y * 40, z * 26, 2) +
        0.0009 * noise.fbm(x * 60, y * 14, z * 60, 2),
    });

    // ------------------------------------------------------------------ stew
    // Puddle just below the rim: wide flat surface with a soft rounded edge,
    // tucked into the inner wall.
    const stewShape = sdf
      .cylinder(0.0745, 0.03, 0.006)
      .at(0, 0.068, 0)
      .paintFn((x, y, z) => {
        const swirl = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
        let c = mixRgb(STEW, STEW_LIGHT, 0.18 * swirl);
        // Deeper toward the edges so the puddle reads round from above.
        const rad = Math.hypot(x, z);
        return mixRgb(c, STEW, Math.min(1, Math.max(0, (rad - 0.045) / 0.028)) * 0.5);
      });
    k.body('stew', stewShape, {
      color: '#8a4a18',
      roughness: 0.9,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 220,
    });

    // ---------------------------------------------------- vegetable lumps x2
    const vegLump = (x: number, y: number, z: number) =>
      sdf
        .ellipsoid([0.0135, 0.0115, 0.0135])
        .displace(0.002, (px, py, pz) => noise.fbm(px * 45, py * 45, pz * 45, 2))
        .at(x, y, z)
        .paintFn((px, py, pz) => {
          const top = Math.min(1, Math.max(0, (py - y) / 0.0115 + 0.5));
          const speck = 0.5 + 0.5 * noise.fbm(px * 60, py * 60, pz * 60, 2);
          return mixRgb(mixRgb(VEG, VEG_LIGHT, 0.3 * top), VEG, 0.25 * speck);
        });
    k.body('veg-a', vegLump(-0.024, 0.0835, 0.014), {
      color: '#6a8a3a',
      roughness: 0.7,
      detail: 0.004,
      maxTriangles: 140,
    });
    k.body('veg-b', vegLump(0.02, 0.0825, -0.02), {
      color: '#6a8a3a',
      roughness: 0.7,
      detail: 0.004,
      maxTriangles: 140,
    });

    // -------------------------------------------------------------- bone x1
    // Cartoon bone: capsule shaft with two knobs at each end, tilted so one
    // end pokes out of the stew.
    const r = 0.005;
    const kr = 0.0085;
    const hl = 0.02; // half shaft length
    const koff = 0.0075; // knob offset from shaft axis
    const boneLocal = sdf
      .smoothUnion(
        0.0035,
        sdf.capsule([-hl, 0, 0], [hl, 0, 0], r),
        sdf.sphere(kr).at(-hl, 0, koff),
        sdf.sphere(kr).at(-hl, 0, -koff),
        sdf.sphere(kr).at(hl, 0, koff),
        sdf.sphere(kr).at(hl, 0, -koff),
      )
      .paintFn((px, py) => mixRgb(BONE, BONE_DARK, 0.3 * Math.min(1, Math.max(0, 0.5 - py / 0.012))));
    const boneShape = boneLocal.rotate(0, -52, 21).at(-0.002, 0.088, 0.001);
    k.body('bone', boneShape, {
      color: '#ece0c0',
      roughness: 0.45,
      detail: 0.0035,
      maxTriangles: 170,
    });
  },
});
