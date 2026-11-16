import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — A-frame towel stand (trial arm 1, towel-rack-b).
 *
 * Role: bathhouse prop that stands on the floor; must read at 128 px.
 * Size: 0.62 m wide (X), 0.34 m deep (Z), 0.82 m tall (Y). Stands on y = 0,
 *   centred on the Y axis, faces +Z, with the wide towel facing the viewer.
 * One idea: a light wooden A-frame stand with a thick top rail, draped by one
 *   large cream towel whose teal hem stripe and wavy edge break the frame's
 *   outline, plus a small hand towel on an iron side peg.
 * Shape language: triangular (the splayed A-frame legs) holding one soft round
 *   mass (the draped towel) as the focal point.
 * Palette: honey oak #b5814a / warm brown #8a5a35 (wood), pale cut wood
 *   #c9a06a, dark walnut #6b4226 (foot shade), linen cream #efe6d2 / shade
 *   #d8ccb2 (large light mass), teal #4f8f8a (small accent), iron #4a4f55,
 *   rope #c9a06a.
 * Materials: wood (0.82, 0), cloth (0.9, 0), worn iron (0.5, 0.7), rope (0.9, 0).
 * Detail list: primary four splayed legs, two rails, draped towel; secondary
 *   knobbed rail ends, wavy hem, teal stripe, cream fringe, hand towel, iron
 *   peg; tertiary rope ties at the joints and wood grain in paint and bump.
 * Rig/animation: none (static prop).
 */

const HONEY = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const LINEN = rgb('#efe6d2');
const LINEN_SHADE = rgb('#d8ccb2');
const TEAL = rgb('#4f8f8a');
const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const woodPaint = (x: number, y: number, z: number) => {
  const g = 0.5 + 0.5 * noise.fbm(x * 22, y * 5, z * 22, 2);
  let c = mixRgb(BROWN, HONEY, 0.4 + 0.45 * g);
  const grain = 0.5 + 0.5 * noise.fbm(x * 55, y * 12, z * 55, 2);
  c = mixRgb(c, PALE, 0.14 * grain);
  c = mixRgb(c, WALNUT, 0.5 * clamp01((0.09 - y) / 0.09)); // shaded feet
  c = mixRgb(c, PALE, 0.3 * clamp01((y - 0.74) / 0.06)); // lit rail tops
  return c;
};

const woodBump = (x: number, y: number, z: number): number =>
  0.0012 * noise.fbm(x * 42, y * 10, z * 42, 2);

const clothPaint = (x: number, y: number, z: number) => {
  const n = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2);
  let c = mixRgb(LINEN_SHADE, LINEN, 0.55 + 0.4 * n);
  c = mixRgb(c, LINEN_SHADE, 0.28 * clamp01((0.55 - y) / 0.2)); // lower shade
  // One teal stripe above the wavy hem of the wide towel.
  const stripe = clamp01((y - 0.398) / 0.006) * clamp01((0.446 - y) / 0.006);
  c = mixRgb(c, TEAL, 0.92 * stripe);
  c = mixRgb(c, LINEN, 0.75 * clamp01((0.385 - y) / 0.018)); // cream fringe
  return c;
};

const clothBump = (x: number, y: number, z: number): number =>
  0.0008 * noise.fbm(x * 82, y * 82, z * 82, 2);

const wrinkle = (x: number, y: number, z: number): number =>
  noise.fbm(x * 16, y * 12, z * 16, 2);

const cloth = {
  roughness: 0.9,
  metalness: 0,
  textureDensity: 2,
  paintWeight: 2,
} as const;

export default defineAsset({
  name: 'towel-rack-b',
  description:
    'Light wooden A-frame towel stand with a thick top rail, one large cream towel with a teal hem stripe draped over it, a small hand towel on an iron side peg, and rope ties at the joints.',
  detail: 0.012,
  reference: 'docs/bathhouse-mockups/towel-rack-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // -------------------------------------------------------------- A-frames
    // Four legs splay outward in X and Z and meet at the top of each frame.
    // The wood is clipped flat at y = 0 so the feet have no gap.
    const leg = (sx: number, sz: number) =>
      sdf.capsule([sx * 0.255, 0.785, 0], [sx * 0.285, 0.018, sz * 0.15], 0.017);
    const legs = sdf.union(leg(1, 1), leg(1, -1), leg(-1, 1), leg(-1, -1));
    const feet = sdf.union(
      ...[1, -1].flatMap((sx) =>
        [1, -1].map((sz) => sdf.sphere(0.02).scale([1, 0.7, 1]).at(sx * 0.285, 0.014, sz * 0.15)),
      ),
    );
    const topRail = sdf.capsule([-0.285, 0.8, 0], [0.285, 0.8, 0], 0.021);
    const knob = sdf.sphere(0.027);
    const knobs = sdf.union(knob.at(0.293, 0.8, 0), knob.at(-0.293, 0.8, 0));
    const lowerRail = sdf.capsule([-0.268, 0.3, 0], [0.268, 0.3, 0], 0.013);
    const frame = sdf
      .smoothUnion(0.008, legs, feet, topRail, knobs, lowerRail)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(woodPaint);
    k.body('frame', frame, {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      textureDensity: 2,
      paintWeight: 2,
      detail: 0.009,
      maxError: 0.0025,
      maxTriangles: 2400,
      bump: woodBump,
    });

    // ----------------------------------------------------------------- towel
    // A fold over the rail joins a front and a back panel. A low-frequency
    // displace confined to the hem gives the wavy edge. The teal stripe and
    // fringe are paint, not extra bodies.
    const fold = sdf.cylinder(0.027, 0.242, 0.008).rotateZ(90).at(0, 0.802, 0);
    const front = sdf.box([0.24, 0.45, 0.016], 0.007).at(0, 0.575, 0.024);
    const back = sdf.box([0.238, 0.44, 0.014], 0.006).at(0, 0.58, -0.024);
    const hemWave = (x: number, y: number, z: number): number =>
      clamp01((0.395 - y) / 0.045) * Math.sin(x * 78) * 0.0035;
    const towel = sdf
      .smoothUnion(0.009, fold, front, back)
      .displace(0.0015, wrinkle)
      .displace(0.0035, hemWave)
      .paintFn(clothPaint);
    k.body('towel', towel, {
      ...cloth,
      color: '#efe6d2',
      detail: 0.01,
      maxError: 0.003,
      maxTriangles: 2200,
      bump: clothBump,
    });

    // ------------------------------------------------------------ iron peg
    const peg = sdf
      .smoothUnion(
        0.005,
        sdf.capsule([0.265, 0.62, 0], [0.355, 0.62, 0], 0.007),
        sdf.sphere(0.012).at(0.358, 0.62, 0),
      )
      .paintFn((x, y, z) => {
        const t = clamp01((y - 0.6) / 0.04);
        const s = 0.5 + 0.5 * noise.fbm(x * 36, y * 36, z * 36, 2);
        return mixRgb(mixRgb(IRON_DARK, IRON, 0.3 + 0.4 * t), IRON_HI, 0.14 * s);
      });
    k.body('peg', peg, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      maxTriangles: 260,
    });

    // ---------------------------------------------------------- hand towel
    // Small folded cloth hanging from the peg; its rolled top touches the peg.
    const handFold = sdf.capsule([0.3, 0.615, 0], [0.35, 0.615, 0], 0.011);
    const handBody = sdf.box([0.075, 0.11, 0.045], 0.008).at(0.325, 0.555, 0);
    const handTowel = sdf
      .smoothUnion(0.007, handFold, handBody)
      .displace(0.0015, wrinkle)
      .paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2);
        return mixRgb(LINEN_SHADE, LINEN, 0.55 + 0.4 * n);
      });
    k.body('hand-towel', handTowel, {
      ...cloth,
      color: '#efe6d2',
      detail: 0.008,
      maxTriangles: 500,
      bump: clothBump,
    });

    // ------------------------------------------------------------- rope ties
    // Four small wraps at the rail joints: two on the top rail, two on the
    // lower rail. Torus planes are turned to sit around the X-axis rails.
    const wrap = (x: number, y: number, r: number) =>
      sdf.torus(r, 0.005).rotateZ(90).at(x, y, 0);
    const rope = sdf.union(
      wrap(0.255, 0.8, 0.025),
      wrap(-0.255, 0.8, 0.025),
      wrap(0.268, 0.3, 0.017),
      wrap(-0.268, 0.3, 0.017),
    );
    k.body('rope', rope, {
      color: '#c9a06a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 500,
    });
  },
});
