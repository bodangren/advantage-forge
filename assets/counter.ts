import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — tavern bar counter (props/furniture/counter).
 *
 * Role: the tavern's bar counter, one 2 m tile long; must read at 128 px as a
 *   long dark-fronted bar with a pale thick top.
 * Size: 2.0 m long (X), 0.75 m tall, 0.55 m deep; stands on y = 0, front faces +Z.
 * One idea: a chunky honest bar — pale honey-oak slab floating over a dark
 *   walnut plank front with a brass foot rail.
 * Shape language: square dominant (slab top, plank carcass, plinth), round
 *   secondary (soft bevels everywhere, round brass rail).
 * Palette: honey oak #b5814a top (dominant light), pale cut wood #c9a06a wear,
 *   dark walnut #6b4226 front (dominant dark), deep #54331d seams/plinth,
 *   brass #caa24a rail accent. Value plan: pale top vs dark front = the read.
 * Materials: oak top (roughness 0.75), walnut carcass (roughness 0.8),
 *   deep plinth (roughness 0.85), brass rail (metalness 1, roughness 0.35).
 * Detail: primary slab + carcass + plinth + rail; secondary plank grooves,
 *   per-plank tint, top boards + wear; tertiary grain in bump. Focal: the top.
 * Rig/animation: none (static prop).
 */

const OAK = rgb('#b5814a');
const OAK_PALE = rgb('#c9a06a');
const OAK_DEEP = rgb('#8a5f30');
const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const WALNUT_LIT = rgb('#7d5230');

const TOP_LEN = 2.0;
const TOP_H = 0.08;
const TOP_Y = 0.71; // spans 0.67..0.75
const BODY_LEN = 1.94;
const BODY_FRONT = 0.24;

export default defineAsset({
  name: 'counter',
  description:
    'Tavern bar counter: thick honey-oak top over a dark walnut plank front with a brass foot rail.',
  detail: 0.008,
  reference: 'reference/mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ top
    // Thick slab with a soft bevel, overhanging the front by ~4.5 cm.
    const topShape = sdf.box([TOP_LEN, TOP_H, 0.56], 0.016).at(0, TOP_Y, 0.005);
    const topPaint = (x: number, y: number, z: number) => {
      // Boards run along the length; seams across Z (~3 boards).
      const v = (z + 0.275) / 0.185;
      const f = v - Math.floor(v);
      const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 18);
      const board = Math.floor(v);
      const tint = noise.random(board, 21, 8);
      const grain = 0.5 + 0.5 * noise.fbm(x * 7, y * 60, z * 26, 2);
      let c = mixRgb(OAK, OAK_PALE, 0.15 + 0.4 * tint);
      c = mixRgb(c, OAK_DEEP, 0.18 * grain);
      // Pale worn center where mugs slide; darker toward the back edge.
      const wear =
        Math.max(0, 1 - Math.abs(x) / 0.85) * Math.max(0, 1 - Math.abs(z - 0.03) / 0.24);
      c = mixRgb(c, OAK_PALE, 0.55 * wear);
      c = mixRgb(c, OAK_DEEP, 0.3 * Math.max(0, (-z - 0.1) / 0.2));
      c = mixRgb(c, OAK_DEEP, 0.6 * seam);
      return c;
    };
    k.body('top', topShape.paintFn(topPaint), {
      color: '#b5814a',
      roughness: 0.75,
      metalness: 0,
      detail: 0.006,
      paintWeight: 2,
      bump: (x, y, z) => {
        const v = (z + 0.275) / 0.185;
        const f = v - Math.floor(v);
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 18);
        return -0.0022 * seam + 0.0012 * noise.fbm(x * 24, y * 60, z * 24, 2);
      },
      maxTriangles: 1200,
    });

    // -------------------------------------------------------------- carcass
    // Dark walnut front, ends, and back with chunky vertical plank divisions.
    const carcassShape = sdf.box([BODY_LEN, 0.62, 0.49], 0.012).at(0, 0.36, -0.005);
    const PLANK_W = 0.215;
    const carcassPaint = (x: number, y: number, z: number) => {
      const u = (x + BODY_LEN / 2) / PLANK_W;
      const idx = Math.floor(u);
      const f = u - idx;
      const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 8);
      const tint = noise.random(idx, 11, 5);
      const grain = 0.5 + 0.5 * noise.fbm(x * 34, y * 5, z * 34, 2);
      let c = mixRgb(WALNUT, WALNUT_LIT, 0.5 * tint);
      c = mixRgb(c, WALNUT_DEEP, 0.3 * (1 - tint) + 0.18);
      c = mixRgb(c, WALNUT_DEEP, 0.18 * grain);
      // Shadow ledge tucked under the top, shaded foot near the floor.
      c = mixRgb(c, WALNUT_DEEP, 0.6 * Math.max(0, (y - 0.56) / 0.11));
      c = mixRgb(c, WALNUT_DEEP, 0.45 * Math.max(0, (0.14 - y) / 0.14));
      // Chunky dark divisions between planks.
      c = mixRgb(c, WALNUT_DEEP, 0.9 * seam);
      return c;
    };
    k.body('carcass', carcassShape.paintFn(carcassPaint), {
      color: '#6b4226',
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      bump: (x, y, z) => {
        const u = (x + BODY_LEN / 2) / PLANK_W;
        const f = u - Math.floor(u);
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 8);
        return -0.004 * seam + 0.0012 * noise.fbm(x * 30, y * 6, z * 30, 2);
      },
      maxTriangles: 2000,
    });

    // --------------------------------------------------------------- plinth
    // Recessed toe-kick in deep walnut so the counter sits solidly.
    const plinthShape = sdf.box([1.8, 0.1, 0.4], 0.01).at(0, 0.05, -0.03);
    k.body('plinth', plinthShape, {
      color: '#54331d',
      roughness: 0.85,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 400,
    });

    // ----------------------------------------------------------------- rail
    // Low brass foot rail proud of the front, on three small brackets.
    const railBar = sdf.cylinder(0.018, 1.7, 0.006).rotateZ(90).at(0, 0.16, BODY_FRONT + 0.07);
    const bracketAt = (x: number) =>
      sdf.box([0.035, 0.035, 0.09], 0.008).at(x, 0.16, BODY_FRONT + 0.03);
    const railShape = sdf.union(railBar, bracketAt(-0.7), bracketAt(0), bracketAt(0.7));
    k.body('rail', railShape, {
      color: '#caa24a',
      roughness: 0.35,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 1200,
    });
  },
});
