import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — adventurer's backpack (equipment/accessories/backpack).
 *
 * Role: gear item for the chibi heroes; reads at 128 px as one stuffed
 *   travel pack standing upright. Size: 0.42 m wide, ~0.5 m tall with the
 *   blanket roll, 0.26 m deep, standing on y = 0, facing +Z.
 * One idea: a soft canvas rucksack packed full for a long journey — bulging
 *   tan body, a leather flap over the top, two buckled straps, and a rolled
 *   red-brown blanket strapped on top.
 * Shape language: round dominant (stuffed body, rolled blanket), square
 *   secondary (leather flap with straight folded edge, strap buckles).
 * Palette: burlap tan #c8a86b dominant, leather #8a5a35 secondary,
 *   red-brown blanket #9a4a3a accent, dark iron #3d4047 buckles.
 * Value plan: canvas mid-light, leather mid-dark, blanket warm accent,
 *   iron darkest with metalness — buckles are the focal point.
 * Materials: canvas cloth (rough 0.9, weave bump), leather (rough 0.62,
 *   grain bump), blanket cloth (rough 0.9), worn iron (rough 0.5, metal 0.75).
 * Detail: primary stuffed body + flap + blanket roll; secondary straps,
 *   buckles, side pouch, back shoulder straps; tertiary weave bump, stitch
 *   bands on the flap, blanket end shading.
 * Rig/animation: none (static equipment item).
 */

const CANVAS = rgb('#c8a86b');
const CANVAS_SHADE = rgb('#a8895a');
const CANVAS_LIGHT = rgb('#dcc08a');
const LEATHER = rgb('#8a5a35');
const LEATHER_SHADE = rgb('#6e4426');
const LEATHER_LIGHT = rgb('#a57144');
const BLANKET = rgb('#9a4a3a');
const BLANKET_SHADE = rgb('#7d3a2d');
const BLANKET_LIGHT = rgb('#b05f4c');
const IRON = '#3d4047';

export default defineAsset({
  name: 'backpack',
  description:
    "An adventurer's backpack: stuffed tan canvas body, leather flap and buckled straps, a rolled red-brown blanket on top, a side pouch, and padded shoulder straps on the back.",
  detail: 0.005,
  reference: 'docs/item-mockups/backpack-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ canvas body
    // Stuffed rucksack: rounded box with a bulging front belly and a soft
    // back, clipped flat on the ground plane.
    const bodyShape = sdf
      .smoothUnion(
        0.045,
        sdf.box([0.4, 0.37, 0.24], 0.055).at(0, 0.185, 0),
        sdf.ellipsoid([0.185, 0.155, 0.08]).at(0, 0.185, 0.055),
        sdf.ellipsoid([0.165, 0.135, 0.06]).at(0, 0.2, -0.05),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // Small side pouch on the character's left (+X): rounded canvas box.
    const pouchBody = sdf.box([0.1, 0.14, 0.15], 0.032).at(0.228, 0.14, 0.012);

    const canvasPaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 4 + 2, y * 4, z * 4, 2);
      const mottle = 0.5 + 0.5 * noise.fbm(x * 13 + 5, y * 13, z * 13, 2);
      let c = mixRgb(CANVAS, CANVAS_LIGHT, 0.06 + 0.14 * patch);
      c = mixRgb(c, CANVAS_SHADE, 0.1 + 0.3 * mottle);
      const t = Math.min(1, Math.max(0, y / 0.4));
      c = mixRgb(c, CANVAS_SHADE, 0.42 * Math.pow(1 - t, 1.6)); // damp seated base
      c = mixRgb(c, CANVAS_LIGHT, 0.12 * Math.max(0, (t - 0.55) / 0.45)); // sun-lit top
      return c;
    };
    const canvasShape = bodyShape
      .smoothUnion(0.02, pouchBody)
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('canvas', canvasShape.paintFn(canvasPaint), {
      color: '#c8a86b',
      roughness: 0.9,
      metalness: 0,
      detail: 0.007,
      paintWeight: 2,
      maxTriangles: 2800,
      bump: (x, y, z) =>
        0.0007 * noise.fbm(x * 190, y * 5, z * 190, 2) +
        0.0007 * noise.fbm(x * 5 + 9, y * 190, z * 5 + 9, 2) +
        0.0005 * noise.fbm(x * 42, y * 42, z * 42, 2),
    });

    // ------------------------------------------------------------------ leather flap
    // A skin of the body cut into the flap region: hugs the top, front, and
    // back down to a straight folded edge with rounded corners.
    const skin = bodyShape.round(0.01).subtract(bodyShape.round(-0.003));
    const flapRegion = sdf.box([0.43, 0.21, 0.34], 0.05).at(0, 0.355, 0);
    const flap = skin.intersect(flapRegion);
    const flapPainted = flap
      .paintFn((x: number, y: number, z: number) => {
        const grain = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2);
        const grainFine = 0.5 + 0.5 * noise.fbm(x * 30, y * 60, z * 30, 2);
        let c = mixRgb(LEATHER, LEATHER_LIGHT, 0.08 + 0.16 * grain);
        c = mixRgb(c, LEATHER_SHADE, 0.18 * grainFine);
        c = mixRgb(c, LEATHER_SHADE, 0.2 * Math.max(0, (0.29 - y) / 0.29)); // shaded lower flap
        return c;
      })
      .paintWhere(sdf.box([0.36, 0.014, 0.6]).at(0, 0.288, 0), LEATHER_SHADE, 0.004) // stitch line
      .paintWhere(sdf.box([0.4, 0.02, 0.6]).at(0, 0.259, 0), LEATHER_SHADE, 0.004); // folded edge

    // Blanket roll frame: local shapes get a slight tilt and a seat on the flap.
    const blanketPose = (s: sdf.Shape) => s.rotateZ(4).at(0, 0.432, 0.005);

    // ------------------------------------------------------------------ leather straps
    // Two front straps over the flap, buckled at the flap edge, plus two
    // padded shoulder straps on the back (-Z), the side pouch flap, and the
    // two tie bands around the blanket roll.
    const STRAP_X = 0.105;
    const strapFront = (x: number) =>
      sdf.box([0.052, 0.345, 0.04], 0.009).at(x, 0.2375, 0.136);
    const strapBack = (x: number) =>
      sdf.box([0.058, 0.3, 0.026], 0.011).at(x, 0.2, -0.122);
    const pouchFlap = sdf.box([0.105, 0.06, 0.155], 0.02).at(0.232, 0.186, 0.012);

    // Blanket tie bands: flat leather rings around the top roll.
    const tieBand = (x: number) =>
      blanketPose(
        sdf
          .cylinder(0.062, 0.02, 0.006)
          .rotateZ(90)
          .subtract(sdf.cylinder(0.054, 0.034).rotateZ(90))
          .at(x, 0, 0),
      );

    const leatherPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 40, z * 22, 2);
      let c = mixRgb(LEATHER, LEATHER_LIGHT, 0.1 + 0.14 * grain);
      c = mixRgb(c, LEATHER_SHADE, 0.22 * Math.max(0, (0.3 - y) / 0.3));
      return c;
    };
    const leatherShape = sdf.union(
      flapPainted,
      strapFront(STRAP_X),
      strapFront(-STRAP_X),
      strapBack(0.085),
      strapBack(-0.085),
      pouchFlap,
      tieBand(0.09),
      tieBand(-0.09),
    );
    k.body('leather', leatherShape, {
      color: '#8a5a35',
      roughness: 0.62,
      metalness: 0,
      detail: 0.006,
      paintWeight: 2,
      maxTriangles: 2200,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 40, y * 80, z * 40, 2),
    });

    // ------------------------------------------------------------------ blanket roll
    // Rolled red-brown blanket across the top, tilted a few degrees, its
    // ends shaded and swirled like a fabric roll.
    const rollLocal = sdf.capsule([-0.155, 0, 0], [0.155, 0, 0], 0.056);
    const blanketPaint = (x: number, y: number, z: number) => {
      const soft = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
      let c = mixRgb(BLANKET, BLANKET_LIGHT, 0.1 * soft);
      const endDark = Math.max(0, (Math.abs(x) - 0.12) / 0.09);
      const swirl =
        0.5 + 0.5 * Math.cos(Math.atan2(z, y - 0.432) * 4 + Math.abs(x) * 30);
      c = mixRgb(c, BLANKET_SHADE, 0.32 * endDark * swirl);
      c = mixRgb(c, BLANKET_SHADE, 0.25 * endDark * endDark);
      return c;
    };
    k.body('blanket', blanketPose(rollLocal).paintFn(blanketPaint), {
      color: '#9a4a3a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.0055,
      paintWeight: 2,
      maxTriangles: 900,
      bump: (x, y, z) => 0.0011 * noise.fbm(x * 60, y * 20, z * 60, 2),
    });

    // ------------------------------------------------------------------ iron buckles
    // Two buckle frames with pins on the front straps, and the pouch button.
    const buckle = (x: number) =>
      sdf
        .box([0.07, 0.056, 0.02], 0.006)
        .subtract(sdf.box([0.048, 0.03, 0.06], 0.004))
        .at(x, 0.27, 0.152);
    const pin = (x: number) => sdf.box([0.054, 0.011, 0.024], 0.003).at(x, 0.27, 0.152);
    const button = sdf.sphere(0.013).at(0.283, 0.174, 0.012);
    k.body('iron', sdf.union(buckle(STRAP_X), buckle(-STRAP_X), pin(STRAP_X), pin(-STRAP_X), button), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.75,
      detail: 0.004,
      maxTriangles: 600,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });
  },
});
