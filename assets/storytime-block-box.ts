import { defineAsset, mixRgb, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 big box of colored blocks, a class A story-page prop.
 * Role: the toy box that Mia waves next to on the classroom rug (`story-page-hello-i-am-mia`).
 *   A child of about 5 years must read it at one look: an open toy box heaped with blocks.
 * Size: the box is 0.50 m wide, 0.36 m deep, 0.28 m high, standing on y = 0 and facing +Z.
 *   The heap stands clearly above the rim (top about 0.45 m, about hip height on Mia).
 *   Two loose blocks sit on the ground on the +X side.
 * One idea: a low, wide, open-top toy box in soft orange with a thin darker rim band and a
 *   rounded hand-hole cut in each short side, full of chunky blocks in four bright colors
 *   (red, blue, yellow, green): cubes, short cylinders, one arch, and one triangle.
 * Shape language: soft rounded boxes everywhere (no sharp edge, no fusion between blocks).
 * Palette: box #e8a04c, rim #c97a2e; blocks red #e2483a, blue #2f7fd0, yellow #f5c33c,
 *   green #43a047.
 * Materials: smooth matte plastic (blocks) and matte painted wood (box).
 * Detail: the hand-holes sit in the short (±X) sides; the loose blocks sit on +X, the side
 *   that the three-quarter and side views show.
 * Rig/animation: none. No text, letter, number, logo, face, or picture.
 */

const BOX = rgb('#e8a04c');
const BOX_LIGHT = rgb('#f2bc72');
const RIM = rgb('#c97a2e');
const RED = rgb('#e2483a');
const BLUE = rgb('#2f7fd0');
const YELLOW = rgb('#f5c33c');
const GREEN = rgb('#43a047');

const WALL = 0.022;
const BOX_H = 0.28;
const HX = 0.25; // outer half width (X)
const HZ = 0.18; // outer half depth (Z)

// A chunky toy cube with soft rounded edges, resting on baseY with a yaw turn.
const cube = (size: number, x: number, baseY: number, z: number, yaw: number) =>
  sdf
    .box([size, size, size], Math.min(0.012, size * 0.14))
    .rotateY(yaw)
    .at(x, baseY + size / 2, z);

// A short standing cylinder block with a soft edge.
const standingCyl = (r: number, h: number, x: number, baseY: number, z: number, yaw: number) =>
  sdf.cylinder(r, h, Math.min(0.01, r * 0.25)).rotateY(yaw).at(x, baseY + h / 2, z);

export default defineAsset({
  name: 'storytime-block-box',
  description: 'A big open toy box of colored blocks: soft orange box with a darker rim band and hand-holes, heaped with bright red, blue, yellow, and green blocks.',
  detail: 0.002,
  texture: { size: 1024 },

  build(k) {
    // The box: a floor slab plus four walls with soft rounded edges, blended at the corners.
    const floor = sdf.box([HX * 2, 0.03, HZ * 2], 0.008).at(0, 0.015, 0);
    const longWall = (z: number) =>
      sdf.box([HX * 2, BOX_H, WALL], 0.008).at(0, BOX_H / 2, z);
    // The short walls carry a rounded hand-hole slot near the top.
    const hole = (x: number) =>
      sdf.box([0.07, 0.038, 0.075], 0.016).at(x, 0.208, 0);
    const shortWall = (x: number) =>
      sdf
        .box([WALL, BOX_H, HZ * 2 - WALL * 2], 0.008)
        .at(x, BOX_H / 2, 0)
        .subtract(hole(x));
    const boxShape = floor
      .smoothUnion(0.006, longWall(HZ - WALL / 2), longWall(-(HZ - WALL / 2)))
      .smoothUnion(0.006, shortWall(HX - WALL / 2), shortWall(-(HX - WALL / 2)))
      .paintFn((x, y, _z, base) => {
        // A soft lighter top edge and a slightly darker base, so the box reads as one
        // plain warm body with depth.
        let c = mixRgb(base, BOX_LIGHT, Math.min(0.3, Math.max(0, (y - 0.2) * 3)));
        if (y < 0.05) c = mixRgb(c, RIM, 0.25);
        void x;
        return c;
      });
    k.body('box', boxShape, { color: BOX, roughness: 0.65, detail: 0.002, maxTriangles: 20000 });

    // The rim band: a thin darker ring around the outside just under the top edge.
    const rimShape = sdf
      .box([HX * 2 + 0.016, 0.04, HZ * 2 + 0.016], 0.01)
      .subtract(sdf.box([HX * 2 - 0.028, 0.06, HZ * 2 - 0.028], 0.008))
      .at(0, 0.262, 0);
    k.body('rim', rimShape, { color: RIM, roughness: 0.6, detail: 0.002, maxTriangles: 8000 });

    // The heap inside the box: two layers of cubes and cylinders, then a top layer that
    // stands clearly above the rim. Every block is its own body in one clear color.
    const FLOOR_TOP = 0.03;
    k.body('block-red-1', cube(0.085, -0.13, FLOOR_TOP, -0.06, 8), { color: RED, roughness: 0.5, detail: 0.002, maxTriangles: 4000 });
    k.body('block-blue-1', cube(0.08, 0.03, FLOOR_TOP, -0.07, -12), { color: BLUE, roughness: 0.5, detail: 0.002, maxTriangles: 4000 });
    k.body('block-yellow-1', standingCyl(0.042, 0.08, 0.155, FLOOR_TOP, -0.03, 0), { color: YELLOW, roughness: 0.5, detail: 0.002, maxTriangles: 6000 });
    k.body('block-green-1', cube(0.075, -0.05, FLOOR_TOP, 0.075, 18), { color: GREEN, roughness: 0.5, detail: 0.002, maxTriangles: 4000 });
    k.body('block-yellow-2', cube(0.07, -0.155, FLOOR_TOP, 0.075, -20), { color: YELLOW, roughness: 0.5, detail: 0.002, maxTriangles: 4000 });
    k.body('block-blue-2', standingCyl(0.038, 0.075, 0.1, FLOOR_TOP, 0.08, 0), { color: BLUE, roughness: 0.5, detail: 0.002, maxTriangles: 6000 });

    const L2 = 0.10; // the second layer rests across the first layer
    k.body('block-green-2', cube(0.08, -0.05, L2, -0.045, 6), { color: GREEN, roughness: 0.5, detail: 0.002, maxTriangles: 4000 });
    k.body('block-red-2', cube(0.075, 0.1, L2, 0.03, -15), { color: RED, roughness: 0.5, detail: 0.002, maxTriangles: 4000 });
    k.body('block-blue-3', cube(0.075, -0.15, 0.105, 0.03, 28), { color: BLUE, roughness: 0.5, detail: 0.002, maxTriangles: 4000 });
    k.body('block-yellow-3', standingCyl(0.04, 0.075, 0.14, 0.105, -0.06, 0), { color: YELLOW, roughness: 0.5, detail: 0.002, maxTriangles: 6000 });

    // The third layer reaches the rim, so the heap reads as one continuous pile.
    const L3 = 0.175;
    k.body('block-green-3', cube(0.075, -0.06, L3, 0.0, 10), { color: GREEN, roughness: 0.5, detail: 0.002, maxTriangles: 4000 });
    k.body('block-red-3', cube(0.07, 0.08, L3, -0.03, -18), { color: RED, roughness: 0.5, detail: 0.002, maxTriangles: 4000 });

    // The arch block: a bridge with a round-top opening, resting across the third layer.
    const archOuter = sdf.box([0.13, 0.1, 0.065], 0.01);
    const archOpening = sdf
      .box([0.06, 0.05, 0.09], 0.008)
      .at(0, -0.028, 0)
      .smoothUnion(0.008, sdf.cylinder(0.03, 0.09).rotateX(90).at(0, -0.003, 0));
    const arch = archOuter.subtract(archOpening).rotateY(12).at(-0.145, 0.245, 0.05);
    k.body('block-arch', arch, { color: BLUE, roughness: 0.5, detail: 0.002, maxTriangles: 6000 });

    // The fourth layer bridges the third layer and carries the peak above the rim.
    k.body('block-yellow-4', cube(0.07, 0.01, 0.245, 0.0, -8), { color: YELLOW, roughness: 0.5, detail: 0.002, maxTriangles: 4000 });
    k.body('block-blue-4', cube(0.068, -0.09, 0.245, 0.03, 14), { color: BLUE, roughness: 0.5, detail: 0.002, maxTriangles: 4000 });

    // The triangle block: a prism with soft edges, tipped to sit on the heap.
    const tri = sdf
      .extrude(profile.polygon([[-0.055, 0], [0.055, 0], [0, 0.075]], { smooth: false }), 0.06, 0.008)
      .at(0, 0, -0.03)
      .rotateX(-8)
      .rotateY(-14)
      .at(0.07, 0.30, -0.03);
    k.body('block-triangle', tri, { color: YELLOW, roughness: 0.5, detail: 0.002, maxTriangles: 6000 });

    // The top cubes: the peak of the heap, clearly above the rim (about hip height on Mia).
    k.body('block-red-top', cube(0.075, -0.04, 0.31, 0.02, 22), { color: RED, roughness: 0.5, detail: 0.002, maxTriangles: 4000 });
    k.body('block-green-top', cube(0.068, -0.11, 0.315, -0.02, -25), { color: GREEN, roughness: 0.5, detail: 0.002, maxTriangles: 4000 });

    // Two loose blocks on the ground on the +X side.
    k.body('block-loose-blue', cube(0.08, 0.37, 0, 0.1, 20), { color: BLUE, roughness: 0.5, detail: 0.002, maxTriangles: 4000 });
    const looseCyl = sdf
      .cylinder(0.036, 0.075, 0.009)
      .rotateX(90)
      .rotateY(30)
      .at(0.40, 0.036, -0.09);
    k.body('block-loose-green', looseCyl, { color: GREEN, roughness: 0.5, detail: 0.002, maxTriangles: 6000 });
  },
});
