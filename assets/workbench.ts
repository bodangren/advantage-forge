import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — smithy workbench (props/craft-and-trade/workbench).
 *
 * Role: the blacksmith's heavy workbench; reads at 128 px as one stout bench
 *   with a dark iron vice biting the front-right corner of the top.
 * Size: 1.2 m long (X), 0.6 m deep (Z), 0.85 m tall; stands on y = 0, faces +Z.
 * One idea: a thick honey-oak slab floating on four chunky square legs, the
 *   iron vice the single dark accent that breaks the silhouette at the end.
 * Shape language: square dominant (slab, square legs, stretcher frame), round
 *   secondary (soft bevels, the vice's round screw and tommy bar).
 * Palette: honey oak #b5814a top (light dominant), walnut shadow #8a5a35 frame
 *   (mid), iron #4a4f55 vice (dark focal), pale cut wear #c9a06a on the top.
 * Materials: oak top (roughness 0.75), walnut frame (roughness 0.85),
 *   iron vice (metalness 0.85, roughness 0.45).
 * Detail: primary slab + legs + stretchers; secondary vice base, jaws, screw;
 *   tertiary plank seams, grain, wear. Focal: the iron vice.
 * Rework: top carries a hammer, chisel, saw, wood block and shavings plus two
 *   stains and knife marks; the lower shelf holds two boards and a small box.
 * Rig: none (static prop).
 */

const HONEY = rgb('#b5814a');
const HONEY_PALE = rgb('#c9a06a');
const HONEY_DEEP = rgb('#8a5f30');
const WALNUT = rgb('#8a5a35');
const WALNUT_DEEP = rgb('#54331d');
const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');

const LEN = 1.2;
const DEPTH = 0.6;
const TOP_T = 0.06;
const TOP_Y = 0.82; // spans 0.79..0.85
const HALF_L = LEN / 2;
const HALF_D = DEPTH / 2;

const LEG = 0.11; // chunky square section
const LEG_X = 0.465;
const LEG_Z = 0.2;
const STRETCH_Y = 0.11;
const STRETCH_H = 0.06;
const STRETCH_W = 0.06;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ---------------------------------------------------------------- top paint
const topPaint = (x: number, y: number, z: number) => {
  // Three boards run along the length; seams across Z stay faint.
  const v = (z + HALF_D) / 0.2;
  const idx = Math.floor(v);
  const f = v - idx;
  const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 12);
  const tint = noise.random(idx, 7, 3);
  const grain = 0.5 + 0.5 * noise.fbm(x * 6, y * 50, z * 24, 2);
  let c = mixRgb(HONEY, HONEY_PALE, 0.12 + 0.35 * tint);
  c = mixRgb(c, HONEY_DEEP, 0.16 * grain);
  // Sun-bleached upper slab: pale on the top face and around its upper edge.
  const upper = clamp01((y - 0.8) / 0.02);
  c = mixRgb(c, HONEY_PALE, 0.55 * upper);
  // Extra wear across the working top and along the front edge.
  const top = clamp01((y - (0.85 - 0.012)) / 0.008);
  c = mixRgb(c, HONEY_PALE, 0.8 * top);
  const edge = 1 - clamp01(Math.min(HALF_L - Math.abs(x), HALF_D - Math.abs(z)) / 0.08);
  c = mixRgb(c, HONEY_PALE, edge * top);
  // Pale cut end grain on the two end faces.
  const end = 1 - clamp01((HALF_L - Math.abs(x)) / 0.012);
  c = mixRgb(c, HONEY_PALE, 0.65 * end);
  // Shaded underside; faint seams.
  const low = clamp01((0.8 - y) / 0.015);
  c = mixRgb(c, HONEY_DEEP, 0.3 * low);
  const under = clamp01((0.795 - y) / 0.012);
  c = mixRgb(c, WALNUT_DEEP, 0.45 * under);
  c = mixRgb(c, HONEY_DEEP, 0.85 * seam);
  // Two dark oil stains and knife marks on the working face.
  if (y > 0.84) {
    const s1 = clamp01(1 - Math.hypot((x + 0.05) / 0.13, (z - 0.02) / 0.07));
    const s2 = clamp01(1 - Math.hypot((x - 0.32) / 0.08, (z + 0.17) / 0.06));
    c = mixRgb(c, WALNUT_DEEP, 0.75 * Math.max(s1, s2) ** 0.5 * (s1 + s2 > 0 ? 1 : 0));
    const cut = Math.max(0, 1 - Math.abs(Math.sin((x * 9 + z * 31) * 3.1)) * 9) * (noise.random(Math.floor(x * 14), Math.floor(z * 14), 1) > 0.8 ? 1 : 0);
    c = mixRgb(c, HONEY_DEEP, 0.7 * cut);
  }
  return c;
};

// --------------------------------------------------------------- frame paint
const framePaint = (x: number, y: number, z: number) => {
  let c = WALNUT;
  const grain = 0.5 + 0.5 * noise.fbm(x * 16, y * 5, z * 16, 2);
  c = mixRgb(c, WALNUT_DEEP, 0.38 * grain);
  // Contact shadow where the legs meet the slab.
  c = mixRgb(c, WALNUT_DEEP, 0.85 * clamp01((y - 0.66) / 0.12));
  // Pale cut end grain on the outer faces of the legs.
  const endGrain = clamp01((Math.abs(x) - 0.5) / 0.02) * clamp01((y - 0.16) / 0.08);
  c = mixRgb(c, HONEY_PALE, 0.65 * endGrain);
  // Deep shade on the inner faces of the legs, seen through the open frame.
  const inner = clamp01((Math.abs(x) - 0.405) / 0.02) * (1 - clamp01((Math.abs(x) - 0.425) / 0.02));
  c = mixRgb(c, WALNUT_DEEP, 0.75 * clamp01(inner));
  // Feet grounded near the floor, with a softer dark band above them.
  c = mixRgb(c, WALNUT_DEEP, 0.5 * clamp01((0.3 - y) / 0.3));
  c = mixRgb(c, WALNUT_DEEP, clamp01((0.14 - y) / 0.14));
  return c;
};

// ---------------------------------------------------------------- vice paint
const FIXED_FACE_X = 0.55; // inner face of the fixed jaw
const SLIDE_FACE_X = 0.465; // inner face of the sliding jaw
const vicePaint = (x: number, y: number, z: number) => {
  let c = IRON;
  const t = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
  c = mixRgb(c, IRON_DEEP, 0.35 * t);
  // Machined jaw faces catch the light; worn dark along the base plate.
  const face = clamp01(
    1 - Math.abs(x - FIXED_FACE_X) / 0.004 + (1 - Math.abs(x - SLIDE_FACE_X) / 0.004),
  );
  c = mixRgb(c, IRON_LIGHT, 0.5 * clamp01(face) * clamp01((y - 0.855) / 0.01));
  c = mixRgb(c, IRON_DEEP, 0.3 * clamp01((0.875 - y) / 0.012));
  return c;
};

export default defineAsset({
  name: 'workbench',
  description:
    'Heavy honey-oak smithy workbench with a thick beveled top, four chunky square legs, a low stretcher frame, and an iron vice at the front-right end.',
  detail: 0.007,
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ top
    const top = sdf.box([LEN, TOP_T, DEPTH], 0.016).at(0, TOP_Y, 0);
    k.body('top', top.paintFn(topPaint), {
      color: '#b5814a',
      roughness: 0.75,
      metalness: 0,
      detail: 0.006,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) => {
        const v = (z + HALF_D) / 0.2;
        const f = v - Math.floor(v);
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 12);
        const cut = Math.max(0, 1 - Math.abs(Math.sin((x * 9 + z * 31) * 3.1)) * 9) * (noise.random(Math.floor(x * 14), Math.floor(z * 14), 1) > 0.8 ? 1 : 0);
        return -0.003 * seam - 0.0015 * cut + 0.001 * (noise.fbm(x * 24, y * 40, z * 24, 2) - 0.5);
      },
      maxTriangles: 1000,
    });

    // ---------------------------------------------------------------- frame
    // Four square legs slightly inset, joined by a low stretcher frame.
    const leg = (sx: number, sz: number) =>
      sdf.box([LEG, 0.79, LEG], 0.012).at(sx * LEG_X, 0.395, sz * LEG_Z);
    const frame = sdf
      .smoothUnion(
        0.012,
        leg(1, 1),
        leg(-1, 1),
        leg(1, -1),
        leg(-1, -1),
        // Long stretchers along X.
        sdf.box([0.86, STRETCH_H, STRETCH_W], 0.01).at(0, STRETCH_Y, LEG_Z),
        sdf.box([0.86, STRETCH_H, STRETCH_W], 0.01).at(0, STRETCH_Y, -LEG_Z),
        // Short stretchers along Z.
        sdf.box([STRETCH_W, STRETCH_H, 0.32], 0.01).at(LEG_X, STRETCH_Y, 0),
        sdf.box([STRETCH_W, STRETCH_H, 0.32], 0.01).at(-LEG_X, STRETCH_Y, 0),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('frame', frame.paintFn(framePaint), {
      color: '#8a5a35',
      roughness: 0.85,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * (noise.fbm(x * 18, y * 5, z * 18, 2) - 0.5),
      maxTriangles: 900,
    });

    // ----------------------------------------------------------------- vice
    // Iron vice gripping the front-right corner of the top (viewer's right).
    const vice = sdf.union(
      // Base plate bolted onto the slab.
      sdf.box([0.16, 0.02, 0.16], 0.005).at(0.5, 0.86, 0.21),
      // Fixed jaw at the very end.
      sdf.box([0.03, 0.13, 0.16], 0.006).at(0.565, 0.925, 0.21),
      // Sliding jaw facing it.
      sdf.box([0.03, 0.11, 0.16], 0.006).at(0.45, 0.915, 0.21),
      // Screw through both jaws, with a collar nut and a tommy bar.
      sdf.cylinder(0.013, 0.27, 0.003).rotateZ(90).at(0.49, 0.87, 0.21),
      sdf.cylinder(0.02, 0.016, 0.003).rotateZ(90).at(0.585, 0.87, 0.21),
      sdf.cylinder(0.0075, 0.15, 0.003).rotateX(90).at(0.63, 0.87, 0.21),
    );
    k.body('vice', vice.paintFn(vicePaint), {
      color: '#4a4f55',
      roughness: 0.45,
      metalness: 0.85,
      detail: 0.0045,
      paintWeight: 2,
      maxTriangles: 700,
    });

    // ---------------------------------------------------------------- tools
    const TY = 0.85;
    const woodTool = sdf.union(
      // Hammer handle.
      sdf.capsule([-0.44, TY + 0.016, 0.12], [-0.2, TY + 0.016, 0.12], 0.016),
      // Chisel handle.
      sdf.capsule([-0.1, TY + 0.02, -0.04], [-0.02, TY + 0.02, -0.06], 0.02),
      // Saw grip.
      sdf.box([0.07, 0.045, 0.035], 0.012).at(-0.36, TY + 0.025, -0.17).rotateY(8),
      // Block of wood.
      sdf.box([0.13, 0.07, 0.085], 0.012).at(0.16, TY + 0.035, -0.12).rotateY(-12),
      // Shavings.
      sdf.torus(0.022, 0.008).rotateX(70).at(0.05, TY + 0.02, 0.1),
      sdf.torus(0.018, 0.007).rotateX(20).rotateY(40).at(0.12, TY + 0.018, 0.04),
      sdf.torus(0.024, 0.008).rotateX(80).rotateY(70).at(-0.05, TY + 0.02, 0.17),
      sdf.torus(0.016, 0.007).rotateX(50).at(0.25, TY + 0.016, 0.08),
    );
    k.body('tools-wood', woodTool.paintFn((x, y, z) => mixRgb(HONEY_PALE, HONEY_DEEP, 0.35 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2)))), {
      color: '#c9a06a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.004,
      paintWeight: 2,
      bump: (x, y, z) => 0.001 * (noise.fbm(x * 30, y * 8, z * 30, 2) - 0.5),
      maxTriangles: 800,
    });
    const ironTool = sdf.union(
      // Hammer head, 0.04 m square face, with a peen.
      sdf.box([0.05, 0.045, 0.04], 0.008).at(-0.19, TY + 0.03, 0.12),
      sdf.box([0.03, 0.03, 0.03], 0.008).at(-0.155, TY + 0.025, 0.12),
      // Chisel shaft and edge.
      sdf.capsule([-0.02, TY + 0.02, -0.06], [0.11, TY + 0.02, -0.085], 0.013),
      // Saw blade, thickened for the sprite.
      sdf.box([0.26, 0.04, 0.012], 0.004).at(-0.15, TY + 0.03, -0.17).rotateY(8),
    );
    k.body('tools-iron', ironTool.paintFn(vicePaint), {
      color: '#3a3a3e',
      roughness: 0.45,
      metalness: 0.7,
      detail: 0.0035,
      maxTriangles: 600,
    });

    // ---------------------------------------------------------- lower shelf
    const shelf = sdf.union(
      sdf.box([0.76, 0.03, 0.16], 0.008).at(0, 0.155, 0.1),
      sdf.box([0.76, 0.03, 0.16], 0.008).at(0, 0.155, -0.1),
      sdf.box([0.56, 0.03, 0.15], 0.008).at(0.05, 0.185, 0.1).rotateY(3),
      sdf.box([0.22, 0.12, 0.17], 0.012).at(-0.22, 0.23, -0.1),
    );
    k.body('shelf', shelf.paintFn(framePaint), {
      color: '#8a5a35',
      roughness: 0.85,
      metalness: 0,
      detail: 0.006,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * (noise.fbm(x * 18, y * 5, z * 18, 2) - 0.5),
      maxTriangles: 700,
    });
  },
});
