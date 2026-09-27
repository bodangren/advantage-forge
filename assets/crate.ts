import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — wooden storage crate (props/containers/crate), tavern set.
 *
 * Role: background storage prop for the cozy chibi tavern; must read at 128 px.
 * Size: 0.5 m wide (X), 0.4 m deep (Z), 0.41 m tall, stands on y = 0, faces +Z.
 * One idea: a stout honey-oak box in a chunky corner-post frame — thick posts,
 *   two fat planks per face, iron banded top and bottom, strap hinges at the back.
 * Shape language: square dominant (sturdy box, posts), round secondary (soft
 *   bevels on every edge, nothing razor sharp).
 * Palette: honey oak #b5814a planks (dominant), #8a5a35 posts and plank shadow,
 *   sun-lit top #d6a561, seam dark #4e2f18; dark iron #4a4f55 as the accent.
 * Materials: wood (roughness 0.8, metalness 0), worn iron (roughness 0.5,
 *   metalness 0.7). Board gaps and grain in `bump` only.
 * Detail: primary box + posts + lid; secondary iron bands, hinges, nail heads;
 *   tertiary plank seams and grain in bump. Focal point: iron bands vs honey oak.
 * Rig/animation: none (static prop).
 */

const OAK = rgb('#b5814a'); // honey oak planks
const OAK_SHADOW = rgb('#8a5a35'); // posts, plank shadow
const OAK_LIGHT = rgb('#d6a561'); // sun-lit top
const SEAM = rgb('#4e2f18'); // board seams, shaded foot
const IRON = '#4a4f55';

const W = 0.5; // width (X)
const D = 0.4; // depth (Z)
const BODY_H = 0.35; // plank body height
const LID_H = 0.05;
const LID_Y = BODY_H + 0.005 + LID_H / 2; // small shadow gap under the lid
const BOARD_H = BODY_H / 2; // two horizontal planks per face
const POST = 0.07; // corner post cross-section
const GROOVE = 0.012; // board separation

/** Plank paint: two boards per face, dark seams, per-board tint, grain, value plan. */
const plankPaint = (x: number, y: number, z: number) => {
  const board = Math.floor(y / BOARD_H);
  const f = y / BOARD_H - board;
  const seam = f < 0.07 || f > 0.93 ? 0.7 : 0;
  const tint = noise.random(board, 11) * 0.3;
  const grain = 0.5 + 0.5 * noise.noise3(x * 5, y * 55, z * 5 + board);
  let c = mixRgb(OAK, OAK_LIGHT, 0.1 + 0.25 * tint + 0.2 * grain);
  // Shaded foot, sun-lit shoulder.
  const t = Math.min(1, Math.max(0, y / BODY_H));
  c = mixRgb(c, SEAM, 0.3 * (1 - t) * (1 - t));
  c = mixRgb(c, OAK_LIGHT, 0.18 * Math.max(0, (t - 0.6) / 0.4));
  return mixRgb(c, SEAM, seam);
};

export default defineAsset({
  name: 'crate',
  description:
    'Stout honey-oak storage crate with chunky corner posts, iron banding, and strap hinges at the back.',
  detail: 0.006,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ plank body
    // One solid box; a real groove at mid height separates the two planks.
    const box = sdf.box([W, BODY_H, D], 0.015).at(0, BODY_H / 2, 0);
    const groove = sdf.box([W + 0.02, GROOVE, D + 0.02]).at(0, BOARD_H, 0);
    const planks = box.subtract(groove);
    k.body('planks', planks.paintFn(plankPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      textureDensity: 2,
      maxTriangles: 1800,
      bump: (x, y, z) => {
        const f = (y / BOARD_H) % 1;
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 8);
        return -0.0025 * seam + 0.0012 * noise.fbm(x * 24, y * 8, z * 24, 2);
      },
    });

    // ------------------------------------------------------------------ corner posts
    // Chunky vertical posts, slightly proud of the plank faces.
    const post = sdf
      .box([POST, BODY_H, POST], 0.012)
      .at(W / 2 - POST / 2 + 0.01, BODY_H / 2, D / 2 - POST / 2 + 0.01)
      .paintFn((x, y, z) => {
        const grain = 0.5 + 0.5 * noise.noise3(x * 40, y * 6, z * 40);
        const t = Math.min(1, Math.max(0, y / BODY_H));
        let c = mixRgb(OAK_SHADOW, OAK, 0.15 + 0.25 * grain);
        c = mixRgb(c, SEAM, 0.35 * (1 - t) * (1 - t));
        return c;
      });
    const posts = post.mirror('x', 0).mirror('z', 0);
    k.body('posts', posts, {
      color: '#8a5a35',
      roughness: 0.82,
      metalness: 0,
      maxTriangles: 1200,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 6, z * 30, 2),
    });

    // ------------------------------------------------------------------ lid
    // Planked lid with a slight overhang; boards run along X, two real grooves.
    const lidBase = sdf.box([W + 0.04, LID_H, D + 0.04], 0.012).at(0, LID_Y, 0);
    const lidGroove = sdf.union(
      sdf.box([W + 0.06, GROOVE, 0.01]).at(0, LID_Y, -D / 6),
      sdf.box([W + 0.06, GROOVE, 0.01]).at(0, LID_Y, D / 6),
    );
    const lidBoards = 3;
    const lid = lidBase.subtract(lidGroove).paintFn((x, y, z) => {
      const board = Math.floor(((z + (D + 0.04) / 2) / (D + 0.04)) * lidBoards);
      const tint = noise.random(board, 23) * 0.3;
      const grain = 0.5 + 0.5 * noise.noise3(x * 30, y * 6, z * 5 + board);
      const c = mixRgb(OAK, OAK_LIGHT, 0.25 + 0.25 * tint + 0.2 * grain);
      // Darken the lid edge so the overhang reads.
      const edge = Math.max(Math.abs(x) / (W / 2 + 0.02), Math.abs(z) / (D / 2 + 0.02));
      return mixRgb(c, OAK_SHADOW, 0.35 * Math.max(0, edge - 0.82) / 0.18);
    });
    k.body('lid', lid, {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      textureDensity: 2,
      maxTriangles: 1200,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 26, y * 8, z * 26, 2),
    });

    // ------------------------------------------------------------------ iron
    const solid = sdf.union(box, post.mirror('x', 0).mirror('z', 0));
    const shell = solid.round(0.004).subtract(solid.round(-0.0015));
    // Banding wraps the top and bottom edges, posts included.
    const band = (y: number) => shell.intersect(sdf.box([W + 0.1, 0.038, D + 0.1], 0.002).at(0, y, 0));
    const bands = sdf.union(band(0.035), band(BODY_H - 0.03));

    // Two strap hinges at the back: face strap, pin barrel, strap over the lid.
    const hingeX = 0.15;
    const hinge = sdf.union(
      sdf.box([0.05, 0.13, 0.014], 0.005).at(hingeX, BODY_H - 0.075, -D / 2 - 0.006),
      sdf.cylinder(0.013, 0.06).rotateZ(90).at(hingeX, BODY_H + 0.007, -D / 2 - 0.008),
      sdf.box([0.05, 0.014, 0.12], 0.005).at(hingeX, LID_Y + LID_H / 2, -D / 2 + 0.045),
    );

    // Nail heads where the bands cross the posts.
    const nail = (x: number, y: number, z: number) => sdf.sphere(0.009).at(x, y, z);
    const nails = sdf.union(
      nail(W / 2 + 0.008, 0.035, D / 2 + 0.008),
      nail(W / 2 + 0.008, BODY_H - 0.03, D / 2 + 0.008),
    );
    const iron = sdf
      .union(bands, hinge.mirror('x', 0), nails.mirror('x', 0).mirror('z', 0))
      .paintFn((x, y, z) => {
        const wear = 0.5 + 0.5 * noise.noise3(x * 18, y * 18, z * 18);
        return mixRgb(rgb(IRON), rgb('#33373c'), 0.4 * wear);
      });
    k.body('iron', iron, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      maxTriangles: 1800,
    });
  },
});
