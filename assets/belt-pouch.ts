import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — leather belt pouch (equipment/accessories/belt-pouch).
 *
 * Role: hero gear accessory. Reads at 128 px as a chunky little leather
 *   pouch worn on a belt; one focal point (the brass button on the closure).
 * Size: 0.15 m wide, ~0.11 m tall, 0.04 m deep, stands on y = 0, faces +Z.
 * One idea: a chubby rounded leather sack, wider than tall, with a folded
 *   flap, a vertical closure strap, a brass button + brass keeper, and a
 *   thin leather belt loop on the back.
 * Shape language: round dominant (squat body, folded rounded flap, circular
 *   brass button, soft scalloped trim), square secondary (flat flap edge,
 *   brass keeper bar).
 * Palette: leather #8a5a35 dominant, dark leather #5c3a22 secondary,
 *   brass #d4a93a accent (button + keeper = focal), pale thread #d8b878.
 * Value plan: mid leather body, dark trim peeking under the flap, mid-dark
 *   belt-loop leather behind; the bright brass button is the focal point.
 * Materials: leather (rough 0.62), dark leather (rough 0.68) on belt loop,
 *   polished brass (rough 0.3, metal 1) on button + keeper.
 * Detail: pouch body, folded flap with stitch line, scalloped trim band,
 *   vertical strap with stitched edges, brass button with raised rim,
 *   brass keeper bar, back belt loop with stitch holes.
 * Rig/animation: none (static item).
 */

const LEATHER = rgb('#8a5a35');
const LEATHER_DARK = rgb('#5c3a22');
const LEATHER_LIGHT = rgb('#a57144');
const THREAD = rgb('#d8b878');
const BRASS = '#d4a93a';

const W = 0.15;
const BODY_H = 0.135;
const D = 0.04;

export default defineAsset({
  name: 'belt-pouch',
  description:
    'A small chunky leather belt pouch with a folded flap, scalloped trim peeking below the flap, a stitched closure strap with brass button and brass keeper, and a leather belt loop on the back.',
  detail: 0.005,
  reference: 'docs/item-mockups/belt-pouch-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ pouch body
    // A squashed rounded ellipsoid (slightly wider than tall, flat in Z)
    // clipped at y = 0 so the asset stands on the ground plane.
    const bodyShape = sdf
      .ellipsoid([W / 2 - 0.005, BODY_H / 2, D / 2 - 0.003])
      .at(0, BODY_H / 2, 0)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // ------------------------------------------------------------------ flap
    // A folded flap that drapes over the top portion of the body. It is
    // visibly wider and deeper than the body so it overhangs; the smoothUnion
    // blend is small enough that the flap edge still reads as a seam.
    const flapShape = sdf
      .smoothUnion(
        0.018,
        sdf.box([W + 0.02, BODY_H * 0.5, D + 0.018], 0.018).at(0, BODY_H * 0.76, 0),
        sdf.ellipsoid([W / 2 + 0.024, 0.018, D / 2 + 0.018]).at(0, BODY_H * 0.94, 0),
      )
      .intersect(sdf.halfSpace([0, -1, 0], BODY_H * 0.5));

    // ------------------------------------------------------------------ trim (peeks under flap)
    // A thin leather band that sits where the flap overlaps the body. It is
    // a separate piece because it gets the dark accent color and stitch holes.
    const TRIM_Y = BODY_H * 0.49;
    const trimShape = sdf
      .box([W + 0.022, 0.014, D + 0.02], 0.004)
      .at(0, TRIM_Y, 0)
      .intersect(bodyShape.round(0.006));

    // ------------------------------------------------------------------ closure strap
    // A vertical leather strap over the flap, from just below the flap top
    // down to a tapered point just below the brass keeper. Slightly proud of
    // the flap surface.
    const STRAP_TOP = BODY_H * 0.94;
    const STRAP_BOT = BODY_H * 0.5;
    const STRAP_W = 0.024;
    const STRAP_D = 0.008;
    const STRAP_Z = D / 2 + 0.007;
    const strapShape = sdf
      .smoothUnion(
        0.005,
        sdf.box([STRAP_W, (STRAP_TOP - STRAP_BOT) * 0.95, STRAP_D], 0.004).at(
          0,
          (STRAP_TOP + STRAP_BOT) / 2 + 0.004,
          STRAP_Z,
        ),
        sdf.cone(
          [-STRAP_W / 2, STRAP_BOT + 0.002, STRAP_Z],
          [STRAP_W / 2, STRAP_BOT + 0.002, STRAP_Z],
          STRAP_W / 2 + 0.002,
          0.002,
        ),
      )
      .intersect(sdf.halfSpace([0, -1, 0], STRAP_BOT - 0.001));

    // ------------------------------------------------------------------ combined leather
    const leatherShape = sdf
      .smoothUnion(0.01, bodyShape, flapShape, trimShape, strapShape)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // ------------------------------------------------------------------ leather paint
    // Warm mid brown with low-frequency leather patches, high-frequency grain,
    // a sun-lit upper shoulder and a shaded lower belly. Painted detail:
    // - dark trim band just below the flap edge
    // - pale stitch dashes on the flap edge (front and back)
    // - scalloped triangular pattern on the lower front
    // - pale stitch dashes down each side of the vertical strap
    const leatherPaint = (x: number, y: number, z: number): readonly [number, number, number] => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 7 + 3, y * 7, z * 7, 2);
      const grain = 0.5 + 0.5 * noise.fbm(x * 40, y * 70, z * 40, 2);
      let c = mixRgb(LEATHER, LEATHER_LIGHT, 0.06 + 0.32 * patch);
      c = mixRgb(c, LEATHER_DARK, 0.08 + 0.24 * grain);
      const t = Math.min(1, Math.max(0, y / BODY_H));
      // Stronger sun-lit top-shoulder lift on the flap shoulder.
      c = mixRgb(c, LEATHER_LIGHT, 0.42 * Math.max(0, (t - 0.6) / 0.4));
      // Deeper shaded lower belly.
      c = mixRgb(c, LEATHER_DARK, 0.38 * Math.max(0, (0.32 - y) / 0.32));
      // Slight dark crease right at the flap bottom edge where flap meets body.
      const atFlapEdge = Math.abs(y - TRIM_Y + 0.005) < 0.0025;
      if (atFlapEdge && Math.abs(z) < D / 2 + 0.022) {
        c = mixRgb(c, LEATHER_DARK, 0.55);
      }

      // Scalloped trim band: 5 bold triangular teeth that reach up to the flap
      // edge from a darker band underneath. The teeth show scallops; the
      // narrower valleys between show the band color.
      const N_SCALLOP = 5;
      const SCALLOP_FRONT = z > 0.008;
      const SCALLOP_BACK = z < -0.008;
      const onSideFace = SCALLOP_FRONT || SCALLOP_BACK;
      const SCALLOP_BAND_BOTTOM = TRIM_Y - 0.024;
      const SCALLOP_AMP = 0.02;
      if (onSideFace && y < TRIM_Y + 0.001 && y > SCALLOP_BAND_BOTTOM) {
        const phase = ((x + W * 0.45) / (W * 0.9)) * N_SCALLOP;
        const tScallop = phase - Math.floor(phase);
        const distFromPeak = Math.min(tScallop, 1 - tScallop);
        const waveY = TRIM_Y - distFromPeak * 2 * SCALLOP_AMP;
        if (y < waveY) {
          c = mixRgb(c, LEATHER_DARK, 0.85);
        }
      }

// Stitched flap edge: pale thread dashes running along the flap bottom
const onFlapStitchFront =
  Math.abs(y - TRIM_Y + 0.004) < 0.002 &&
  z > D / 2 - 0.002 &&
  z < D / 2 + 0.025 &&
  Math.sin(x * 280) > 0.1;
const onFlapStitchBack =
  Math.abs(y - TRIM_Y + 0.004) < 0.002 &&
  z < -(D / 2 - 0.002) &&
  z > -(D / 2 + 0.025) &&
  Math.sin(x * 280) > 0.1;
if (onFlapStitchFront || onFlapStitchBack) c = mixRgb(c, THREAD, 0.85);

      // Stitched strap edges (vertical dashes on each side of the strap)
      const onStrap = z > D / 2 + 0.003 && y > STRAP_BOT && y < STRAP_TOP - 0.006;
      const onStrapEdgeL = onStrap && Math.abs(x + STRAP_W / 2) < 0.0015;
      const onStrapEdgeR = onStrap && Math.abs(x - STRAP_W / 2) < 0.0015;
      const stitchPhaseL = Math.sin(y * 200 + 1.2) > -0.05;
      const stitchPhaseR = Math.sin(y * 200 - 1.2) > -0.05;
      if ((onStrapEdgeL && stitchPhaseL) || (onStrapEdgeR && stitchPhaseR)) {
        c = mixRgb(c, THREAD, 0.85);
      }
      return c;
    };

    k.body('leather', leatherShape.paintFn(leatherPaint), {
      color: '#8a5a35',
      roughness: 0.62,
      metalness: 0,
      detail: 0.005,
      paintWeight: 2,
      maxTriangles: 1200,
      bump: (x, y, z) =>
        0.0008 * noise.fbm(x * 30, y * 60, z * 30, 2) +
        0.0005 * noise.fbm(x * 110, y * 110, z * 110, 2),
    });

    // ------------------------------------------------------------------ dark leather (belt loop)
    // Belt loop on the back: a rounded rectangle minus a slightly smaller
    // rounded rectangle for the belt slot. Sticks out 14 mm from the back
    // so it reads from a back view.
    const beltLoopOuter = sdf.box([0.05, BODY_H * 0.78, 0.022], 0.006);
    const beltLoopInner = sdf.box([0.034, BODY_H * 0.66, 0.026], 0.004);
    const beltLoop = beltLoopOuter
      .subtract(beltLoopInner)
      .at(0, BODY_H * 0.55, -(D / 2 + 0.012))
      .paintFn((x, y, z) => {
        const grain = 0.5 + 0.5 * noise.fbm(x * 60, y * 90, z * 60, 2);
        let c = mixRgb(LEATHER_DARK, LEATHER, 0.16 + 0.14 * grain);
        const topBand = Math.abs(y - BODY_H * 0.88) < 0.0035;
        const botBand = Math.abs(y - BODY_H * 0.22) < 0.0035;
        const onStitch = (topBand || botBand) && Math.abs(z) > 0.008 && Math.sin(x * 220) > 0.05;
        if (onStitch) c = mixRgb(c, THREAD, 0.7);
        return c;
      });

    k.body('leather-dark', beltLoop, {
      color: '#5c3a22',
      roughness: 0.68,
      metalness: 0,
      detail: 0.0045,
      paintWeight: 1,
      maxTriangles: 300,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 50, y * 80, z * 50, 2),
    });

    // ------------------------------------------------------------------ brass
    // Round brass button with a raised rim torus, plus a horizontal brass
    // keeper bar below the button. Bright accent = the visual focal point.
    const BUTTON_Y = BODY_H * 0.66;
    const KEEPER_Y = BODY_H * 0.5;
    const BUTTON_Z = D / 2 + 0.024;
    const KEEPER_Z = D / 2 + 0.018;
    const button = sdf.sphere(0.0125).at(0, BUTTON_Y, BUTTON_Z - 0.002);
    const buttonRim = sdf.torus(0.0125, 0.0024).at(0, BUTTON_Y, BUTTON_Z - 0.001);
    const keeper = sdf.box([0.032, 0.011, 0.012], 0.003).at(0, KEEPER_Y, KEEPER_Z);

    k.body('brass', sdf.union(button, buttonRim, keeper), {
      color: BRASS,
      roughness: 0.3,
      metalness: 1,
      detail: 0.0035,
      maxTriangles: 400,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 80, y * 80, z * 80, 2),
    });
  },
});
