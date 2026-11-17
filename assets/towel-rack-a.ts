import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';

/**
 * Design note — small wooden towel stand (bathhouse prop).
 *
 * Role: bathhouse prop for the Chibi Quest pack; a player sees it small, so it must read
 *   at 128 px.
 * Size: 0.62 m wide (X), 0.34 m deep (Z), 0.82 m tall (Y); stands on y = 0, centred on the
 *   Y axis, faces +Z. The hanging towel faces the viewer.
 * One idea: a light wooden trestle with 2 A-frame feet and a thick top rail, and one wide
 *   linen towel that hangs over the rail down to 0.35 m with a teal stripe at its hem. The
 *   towel breaks the outline of the frame. A small hand towel hangs from an iron peg.
 * Shape language: triangular (the A-frame legs), one strong horizontal line (the top rail),
 *   one soft rectangle (the hanging towel).
 * Palette: honey oak #b5814a (frame) with warm brown #8a5a35 (grain), pale cut wood #c9a06a
 *   (sawn ends) and dark walnut #6b4226 (shaded feet); linen cream #efe6d2 (the large light
 *   mass of the towel) with linen shade #d8ccb2 (hem and folds); teal #4f8f8a (the small
 *   accent, the hem stripe); iron #4a4f55 (the peg); rope #c9a06a (the ties).
 * Materials: wood (roughness 0.82, metalness 0), cloth (roughness 0.9, metalness 0), worn
 *   iron (roughness 0.5, metalness 0.7), rope (roughness 0.9, metalness 0).
 * Detail list: primary the 4 leaning legs, the top rail and the lower rail; secondary the
 *   wide towel over the rail, the iron peg with the hand towel, the rope ties; tertiary the
 *   wavy hem, the teal stripe and the cream fringe in paint. Focal point: the cream towel.
 * Rig/animation: none (static prop).
 */

const WOOD_HONEY = rgb('#b5814a');
const WOOD_BROWN = rgb('#8a5a35');
const WOOD_PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const LINEN = rgb('#efe6d2');
const LINEN_SHADE = rgb('#d8ccb2');
const FRINGE = rgb('#f8f1e4');
const TEAL = rgb('#4f8f8a');
const IRON = rgb('#4a4f55');
const ROPE = rgb('#c9a06a');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const RAIL_Y = 0.783; // the centre of the top rail
const RAIL_R = 0.018;
const APEX_Y = 0.765; // where the legs meet under the rail
const FRAME_X = 0.2; // the side frames
const HEM_Y = 0.35; // the wavy hem of the wide towel

/** The fine weave, in the normal map only. */
const clothBump = (x: number, y: number, z: number): number =>
  0.0007 * (noise.fbm(x * 95, y * 95, z * 95, 2) - 0.5) + 0.001 * (noise.fbm(x * 13, y * 6, z * 13, 2) - 0.5);

const woodPaint = (x: number, y: number, z: number) => {
  const grain = 0.5 + 0.5 * noise.fbm(x * 34, y * 5, z * 34, 2);
  let c = mixRgb(WOOD_HONEY, WOOD_BROWN, 0.28 + 0.42 * (1 - grain));
  const patch = 0.5 + 0.5 * noise.fbm(x * 7, y * 7, z * 7, 2);
  c = mixRgb(c, WALNUT, 0.22 * patch);
  // The shaded feet and the pale sawn ends.
  c = mixRgb(c, WALNUT, 0.8 * clamp01((0.13 - y) / 0.13));
  c = mixRgb(c, WOOD_PALE, 0.3 * clamp01((y - 0.74) / 0.06));
  return c;
};

const woodBump = (x: number, y: number, z: number): number => 0.0012 * (noise.fbm(x * 30, y * 30, z * 30, 2) - 0.5);

const clothPaint = (base: Rgb, shade: Rgb) => (x: number, y: number, z: number): Rgb => {
  const weave = 0.5 + 0.5 * noise.fbm(x * 80, y * 80, z * 80, 2);
  let c = mixRgb(base, shade, 0.22 * (1 - weave));
  const crease = 0.5 + 0.5 * noise.fbm(x * 7, y * 5, z * 7, 2);
  c = mixRgb(c, shade, 0.24 * (1 - crease));
  // The hem and the folds hold a soft shadow.
  c = mixRgb(c, shade, 0.45 * clamp01((HEM_Y + 0.06 - y) / 0.06));
  return c;
};

/** Soft cloth wrinkles, vertical drape that grows toward the hem, and a wavy hem. */
const hemWave = (x: number, y: number, z: number): number => {
  const wrinkle = 0.0025 * noise.fbm(x * 6, y * 5, z * 6, 2);
  const drop = clamp01((RAIL_Y - y) / (RAIL_Y - HEM_Y));
  const drape = 0.005 * Math.sin(x * 55) * (0.25 + 0.75 * drop);
  const near = clamp01((HEM_Y + 0.05 - y) / 0.05);
  const hem = 0.007 * Math.cos(x * 45) * near;
  return wrinkle + drape + hem;
};

export default defineAsset({
  name: 'towel-rack-a',
  description:
    'Light wooden towel stand with two A-frame feet, a thick top rail and a lower rail, a wide linen towel with a teal hem stripe over the top rail, and a small hand towel on an iron peg.',
  detail: 0.008,
  reference: 'docs/bathhouse-mockups/towel-rack-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ frame
    // 4 legs that lean together and meet under the top rail, the thick top rail with
    // round ends, the thinner lower rail, and a short stretcher in each side frame.
    const leg = (x: number, zFoot: number) =>
      sdf.cone([x, 0.02, zFoot], [x, APEX_Y, 0], 0.024, 0.017);
    const topRail = sdf.cylinder(RAIL_R, 0.57, 0.006).rotateZ(90).at(0, RAIL_Y, 0);
    const railEnd = (x: number) => sdf.sphere(0.025).at(x, RAIL_Y, 0);
    const lowerRail = sdf.cylinder(0.012, 0.53, 0.004).rotateZ(90).at(0, 0.3, 0);
    const lowerEnd = (x: number) => sdf.sphere(0.017).at(x, 0.3, 0);
    const stretcher = (x: number) => sdf.cylinder(0.01, 0.27, 0.003).rotateX(90).at(x, 0.085, 0);
    const frame = sdf
      .union(
        leg(-FRAME_X, 0.15),
        leg(-FRAME_X, -0.15),
        leg(FRAME_X, 0.15),
        leg(FRAME_X, -0.15),
        topRail,
        railEnd(-0.285),
        railEnd(0.285),
        lowerRail,
        lowerEnd(-0.265),
        lowerEnd(0.265),
        stretcher(-FRAME_X),
        stretcher(FRAME_X),
      )
      .paintFn(woodPaint);
    k.body('frame', frame, {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      maxError: 0.002,
      maxTriangles: 3000,
      bump: woodBump,
    });

    // ------------------------------------------------------------------ towel
    // One wide towel over the top rail: a fold over the rail, a long front panel with a
    // wavy hem at 0.35 m, and a short back panel.
    const wrap = sdf
      .cylinder(RAIL_R + 0.009, 0.33, 0.004)
      .rotateZ(90)
      .at(0, RAIL_Y, 0)
      .intersect(sdf.halfSpace([0, 1, 0], RAIL_Y));
    // The front panel is an extruded cloth outline: uneven sides and a wavy hem.
    const hem: [number, number][] = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const wave = Math.sin(t * Math.PI * 4) * 0.009;
      hem.push([0.163 - t * 0.326, HEM_Y + wave]);
    }
    const frontPanel = sdf
      .extrude(
        profile.polygon(
          [
            [-0.166, RAIL_Y + 0.017],
            [0.166, RAIL_Y + 0.017],
            [0.165, 0.63],
            [0.161, 0.5],
            ...hem,
            [-0.161, 0.5],
            [-0.165, 0.63],
          ],
          { smooth: true, samples: 24 },
        ),
        0.016,
        0.006,
      )
      .at(0, 0, 0.035);
    const backPanel = sdf.box([0.33, 0.2, 0.016], 0.008).at(0, RAIL_Y - 0.108, -0.035);
    const towel = sdf
      .union(wrap, frontPanel, backPanel)
      .displace(0.006, hemWave)
      .paintFn(clothPaint(LINEN, LINEN_SHADE));
    // The teal stripe near the hem and the cream fringe at the hem.
    const stripe = sdf.box([0.35, 0.024, 0.08], 0).at(0, HEM_Y + 0.042, 0.035);
    const fringe = sdf.box([0.35, 0.018, 0.08], 0).at(0, HEM_Y + 0.006, 0.035);
    k.body(
      'towel',
      towel.paintWhere(stripe, TEAL, 0.003).paintWhere(fringe, FRINGE, 0.003),
      {
        color: '#efe6d2',
        roughness: 0.9,
        metalness: 0,
        detail: 0.008,
        paintWeight: 2,
        maxError: 0.002,
        maxTriangles: 2200,
        bump: clothBump,
      },
    );

    // -------------------------------------------------------------- hand towel
    // A small folded hand towel on an iron peg on the +X side.
    const handTowel = sdf
      .union(
        sdf.box([0.026, 0.18, 0.105], 0.008).at(0.238, 0.5, 0),
        sdf.cylinder(0.012, 0.1, 0.003).rotateX(90).at(0.244, 0.588, 0),
      )
      .displace(0.002, (x, y, z) => 0.002 * noise.fbm(x * 8, y * 6, z * 8, 2))
      .paintFn(clothPaint(LINEN, LINEN_SHADE));
    k.body('hand-towel', handTowel, {
      color: '#efe6d2',
      roughness: 0.9,
      metalness: 0,
      detail: 0.005,
      paintWeight: 2,
      maxError: 0.002,
      maxTriangles: 900,
      bump: clothBump,
    });

    // -------------------------------------------------------------------- peg
    const peg = sdf
      .union(
        sdf.cylinder(0.007, 0.087, 0.002).rotateZ(90).at(0.2335, 0.588, 0),
        sdf.sphere(0.013).at(0.277, 0.588, 0),
      )
      .paintFn(() => IRON);
    k.body('peg', peg, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.003,
      maxTriangles: 300,
    });

    // ------------------------------------------------------------------- rope
    // A rope tie at the top rail and one at each leg joint.
    const rope = sdf
      .union(
        sdf.torus(0.031, 0.007).rotateY(90).at(-FRAME_X, RAIL_Y, 0),
        sdf.torus(0.036, 0.007).at(-FRAME_X, APEX_Y - 0.05, 0),
        sdf.torus(0.036, 0.007).at(FRAME_X, APEX_Y - 0.05, 0),
      )
      .paintFn(() => ROPE);
    k.body('rope', rope, {
      color: '#c9a06a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.003,
      maxTriangles: 700,
    });
  },
});
