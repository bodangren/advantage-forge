import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * architecture/building-parts/plaster-wall-window — modular tavern wall with a shuttered window.
 *
 * Role: 2 m modular wall run for the Chibi Quest tavern (batch anchor `tavern-quest_001.jpg`);
 *   the windowed sibling of `plaster-wall`. Reads at 128 px. Back side stays clean for tiling.
 * Size: 2.0 m long along X (posts flush at x = ±1.0 so segments tile), 1.5 m tall, 0.12 m thick,
 *   stands on y = 0, faces +Z. Window opening 0.6 x 0.6 centered at y ≈ 0.95.
 * One idea: a warm plaster field framed by chunky dark walnut timber, and at its center the
 *   focal point — a deep shuttered window with folded-back leaves and evening-blue glass.
 * Shape language: square/boxy mass (sturdy, reliable) with soft bevels everywhere (friendly).
 * Palette (tavern contract): plaster warm white #f0e4cc, walnut #6b4226, deep walnut #54331d,
 *   window recess very dark blue #1a2433 (not emissive), worn iron #3d4047. Value plan: light
 *   plaster field (dominant), dark timber grid (secondary), near-black glass (focal contrast).
 * Materials: plaster (roughness 0.95), walnut timber (0.8), shutter boards (0.8), glass (0.18),
 *   worn iron straps (0.5 / metalness 0.7).
 * Detail list: (1) timber grid — end posts, sill beam, top rail, braces split to flank the
 *   window, (2) window: proud frame, chunky deep sill, recessed glass, muntin cross (focal),
 *   (3) two shutter leaves standing open with iron strap hinges, (4) paint: plaster patches,
 *   ground splash, wood grain, plank grooves.
 * Rig/animation: none.
 */

// ---------------------------------------------------------------- palette (tavern contract)
const PLASTER = rgb('#f0e4cc');
const PLASTER_DARK = rgb('#dccda9');
const PLASTER_LIGHT = rgb('#f7eeda');
const SPLASH = rgb('#c7b28c');
const WALNUT = rgb('#6b4226');
const WALNUT_LIGHT = rgb('#7d5030');
const DEEP = rgb('#54331d');
const RECESS = rgb('#1a2433');
const IRON = rgb('#3d4047');

// ---------------------------------------------------------------- layout (meters)
const LEN = 2.0;
const H = 1.5;
const THICK = 0.12;

const POST_W = 0.13;
const POST_X = LEN / 2 - POST_W / 2; // 0.935 — outer face flush at ±1.0 for tiling
const POST_FRONT = 0.1;
const TIMBER_BACK = -THICK / 2 + 0.005; // timbers stop just behind the plaster plane: clean back

const WIN_CY = 0.95;
const WIN_HALF = 0.3; // opening 0.6 x 0.6
const JAMB_W = 0.08;
const FRAME_FRONT = 0.085;
const SHUTTER_TILT = 14; // degrees the open leaves cant out from the plaster
const SHUTTER_HINGE_Z = 0.0845;
const BOARD = 0.1; // shutter board width

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
/** Smooth groove weight: 1 at a board edge, 0 at the board centre. */
const grooveAt = (f: number) => Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 3);

export default defineAsset({
  name: 'plaster-wall-window',
  description:
    'Modular tavern wall, 2 m: warm plaster with chunky walnut posts, sill beam, top rail, and braces flanking a deep shuttered window with evening-blue glass.',
  detail: 0.013,
  texture: { size: 1024 },
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',

  build(k) {
    // ------------------------------------------------------------------ plaster wall
    // Rounded slab with the window cut through; the cut's rounded edge softens the reveal.
    const wallHole = sdf.box([0.62, 0.62, 0.4], 0.012).at(0, WIN_CY, 0);
    const wall = sdf.box([LEN, H, THICK], 0.02).at(0, H / 2, 0).subtract(wallHole);
    const plasterPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const patch = noise.fbm(x * 2.6, y * 2.6, z * 2.6, 3, 4);
      let c = mixRgb(base, PLASTER_DARK, clamp01(patch) * 0.42);
      c = mixRgb(c, PLASTER_LIGHT, clamp01(-patch) * 0.14);
      // Dusty ground splash creeping up from the base.
      c = mixRgb(c, SPLASH, smoothstep(0.32, 0.02, y) * 0.6);
      return c;
    };
    k.body('plaster', wall.paintFn(plasterPaint), {
      color: PLASTER,
      roughness: 0.95,
      metalness: 0,
      detail: 0.016,
      maxError: 0.005,
      maxTriangles: 2400,
      paintWeight: 2,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 14, y * 14, z * 14, 3, 6),
    });

    // ------------------------------------------------------------------ timber frame
    const post = sdf.box([POST_W, H, POST_FRONT - TIMBER_BACK], 0.018).at(POST_X, H / 2, (POST_FRONT + TIMBER_BACK) / 2);
    const beam = sdf.box([LEN, 0.14, POST_FRONT - TIMBER_BACK], 0.018).at(0, 0.07, (POST_FRONT + TIMBER_BACK) / 2);
    const rail = sdf.box([LEN, 0.13, POST_FRONT - TIMBER_BACK], 0.018).at(0, 1.435, (POST_FRONT + TIMBER_BACK) / 2);
    const jamb = sdf
      .box([JAMB_W, 0.76, FRAME_FRONT - TIMBER_BACK], 0.012)
      .at(WIN_HALF + JAMB_W / 2, WIN_CY, (FRAME_FRONT + TIMBER_BACK) / 2)
      .mirror('x', 0);
    const head = sdf.box([0.76, 0.08, FRAME_FRONT - TIMBER_BACK], 0.012).at(0, 1.29, (FRAME_FRONT + TIMBER_BACK) / 2);
    // Chunky deep sill, proud of the plaster on chunky ears.
    const sill = sdf.box([0.88, 0.08, 0.215], 0.015).at(0, 0.61, 0.0525);
    // The single brace of the plain wall splits into two mirrored braces that flank the window.
    // The ends bury into the sill beam and the window sill so the braces read as structure.
    const brace = (side: 1 | -1): Sdf =>
      sdf
        .box([0.7, 0.115, 0.14], 0.014)
        .rotateZ(-side * 45.9)
        .at(side * 0.6575, 0.35, 0.01);
    // Recessed muntin cross in front of the dark glass.
    const muntinH = sdf.box([0.58, 0.05, 0.05], 0.008).at(0, WIN_CY, -0.02);
    const muntinV = sdf.box([0.05, 0.58, 0.05], 0.008).at(0, WIN_CY, -0.02);
    const timberPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const tint = noise.fbm(x * 2.2, y * 2.2, z * 2.2, 3, 7);
      let c = mixRgb(base, WALNUT_LIGHT, clamp01(tint) * 0.22);
      c = mixRgb(c, DEEP, clamp01(-tint) * 0.3);
      // Grain lines run along the horizontal members.
      const grain = noise.fbm(x * 3.2, y * 26, z * 26, 2, 9);
      c = mixRgb(c, DEEP, clamp01(-grain) * 0.22);
      c = mixRgb(c, WALNUT_LIGHT, clamp01(grain) * 0.12);
      return c;
    };
    k.body(
      'timber',
      sdf.smoothUnion(0.012, post, post.mirror('x', 0), beam, rail, jamb, head, sill, brace(-1), brace(1), muntinH, muntinV).paintFn(timberPaint),
      {
        color: WALNUT,
        roughness: 0.8,
        metalness: 0,
        detail: 0.01,
        maxError: 0.004,
        maxTriangles: 3000,
        paintWeight: 2,
        bump: (x, y, z) =>
          0.0022 * noise.fbm(x * 30, y * 30, z * 30, 2, 8) + 0.0008 * noise.noise3(x * 80, y * 80, z * 80, 5),
      },
    );

    // ------------------------------------------------------------------ dark evening glass
    // Opaque very dark blue, recessed deep behind the frame; a cold window of evening outside.
    const glass = sdf.box([0.615, 0.615, 0.055], 0.008).at(0, WIN_CY, -0.0275);
    k.body('glass', glass, {
      color: RECESS,
      roughness: 0.28,
      metalness: 0.05,
      detail: 0.02,
      maxError: 0.008,
      maxTriangles: 60,
    });

    // ------------------------------------------------------------------ shutters, standing open
    // Two leaves hinged at the outer frame edge, canted a touch off the plaster.
    const shutterLeaf = (side: 1 | -1): Sdf =>
      sdf
        .box([0.3, 0.6, 0.045], 0.014)
        .at(side * 0.15, 0, 0)
        .rotateY(side * -SHUTTER_TILT)
        .at(side * (WIN_HALF + JAMB_W), WIN_CY + 0.01, SHUTTER_HINGE_Z);
    const boardF = (x: number): number => (Math.abs(x) - (WIN_HALF + JAMB_W)) / BOARD;
    const shutterPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const f = boardF(x);
      const bi = Math.floor(f) + (x < 0 ? 11 : 0);
      const tint = noise.random(bi, 3, 5);
      let c = mixRgb(base, WALNUT_LIGHT, 0.2 * tint);
      c = mixRgb(c, DEEP, 0.16 * (1 - tint));
      c = mixRgb(c, DEEP, 0.6 * grooveAt(f - Math.floor(f)));
      // Vertical grain: the boards run up the leaf.
      const grain = noise.fbm(x * 30, y * 4, z * 30, 2, 8);
      c = mixRgb(c, DEEP, clamp01(-grain) * 0.2);
      return c;
    };
    k.body('shutters', sdf.union(shutterLeaf(1), shutterLeaf(-1)).paintFn(shutterPaint), {
      color: WALNUT,
      roughness: 0.8,
      metalness: 0,
      detail: 0.009,
      maxError: 0.004,
      maxTriangles: 900,
      paintWeight: 2,
      bump: (x, y, z) => {
        const f = boardF(x) - Math.floor(boardF(x));
        return -0.0035 * grooveAt(f) + 0.0012 * noise.fbm(x * 30, y * 4, z * 30, 2, 8);
      },
    });

    // ------------------------------------------------------------------ iron strap hinges
    // Straps lie on the leaf face near the hinge edge, with a small barrel knuckle.
    const sinT = Math.sin((SHUTTER_TILT * Math.PI) / 180);
    const cosT = Math.cos((SHUTTER_TILT * Math.PI) / 180);
    const strapZ =
      SHUTTER_HINGE_Z + sinT * 0.1 + cosT * (0.0225 + 0.005); // centred on the canted leaf face
    const knuckleZ = SHUTTER_HINGE_Z + cosT * 0.0225;
    const strap = (side: 1 | -1, hy: number): Sdf =>
      sdf
        .box([0.16, 0.036, 0.012], 0.005)
        .at(side * 0.1, 0, 0)
        .rotateY(side * -SHUTTER_TILT)
        .at(side * (WIN_HALF + JAMB_W), hy, strapZ)
        .union(sdf.cylinder(0.015, 0.06, 0.005).at(side * (WIN_HALF + JAMB_W), hy, knuckleZ));
    k.body(
      'iron',
      sdf.union(strap(1, 0.75), strap(1, 1.17), strap(-1, 0.75), strap(-1, 1.17)),
      {
        color: IRON,
        roughness: 0.5,
        metalness: 0.7,
        detail: 0.007,
        maxError: 0.003,
        maxTriangles: 260,
      },
    );
  },
});
