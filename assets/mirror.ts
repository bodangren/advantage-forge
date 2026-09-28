import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — standing oval mirror (props/furniture/mirror).
 *
 * Role: furniture prop / landmark for the cozy chibi tavern-hamlet; must read at 128 px.
 * Size: 1.6 m tall, 1.08 m wide, 0.58 m deep, stands on y = 0, glass faces +Z.
 * One idea: one big, calm oval — a thick rounded gold ring holding a pale-blue glass lens,
 *   balanced on a chunky honey-oak stand with two splayed feet and a rear brace.
 * Shape language: round dominant (oval ring, lens, beveled feet), square secondary
 *   (the blocky oak base gives the round frame a sturdy footing).
 * Palette: gold frame #d2a63f (accent, metalness 1), pale-blue glass #cfe3ec (focal,
 *   glossy low roughness), honey oak #b5814a dominant, warm brown #8a5a35 and dark
 *   walnut #6b4226 (shade), pale cut wood #c9a06a (light).
 * Materials: gold (roughness 0.3, metalness 1), glass (roughness 0.05, metalness 0.15),
 *   wood (roughness 0.82, metalness 0). Grain and carving in `bump` only.
 * Detail: primary oval frame + glass + stand mass; secondary inner lip, feet, brace;
 *   tertiary grain and gold patina in paint/bump. Focal point: the bright glass lens.
 * Rig/animation: none (static prop).
 */

const C = {
  gold: '#d2a63f',
  goldLight: '#f0cf72',
  goldDark: '#946a1c',
  glass: '#cfe3ec',
  oak: '#b5814a',
  brown: '#8a5a35',
  walnut: '#6b4226',
  pale: '#c9a06a',
};

const RING_R = 0.55; // frame ring mean radius before the oval squash
const RING_TUBE = 0.085; // frame thickness
const FRAME_Y = 0.889; // frame centre height; top lands at 1.6 m
const OVAL: [number, number, number] = [0.85, 1.12, 1.12]; // squash to a tall oval, deep ring

const GOLD = rgb(C.gold);
const GOLD_LIGHT = rgb(C.goldLight);
const GOLD_DARK = rgb(C.goldDark);
const OAK = rgb(C.oak);
const BROWN = rgb(C.brown);
const WALNUT = rgb(C.walnut);
const PALE = rgb(C.pale);

export default defineAsset({
  name: 'mirror',
  description:
    'Standing oval mirror in a carved gold frame on a honey-oak stand with two feet; pale-blue glass.',
  detail: 0.006,
  reference: 'docs/item-mockups/mirror-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ gold frame
    // A torus rotated to face +Z and squashed into a tall oval.
    const ring = sdf.torus(RING_R, RING_TUBE).rotateX(90).scale(OVAL);
    // Inner lip: a thinner ring at the glass opening, pushed forward, reads as a carved rim.
    const lip = sdf.torus(RING_R - 0.068, 0.03).rotateX(90).scale(OVAL);
    const frame = sdf
      .smoothUnion(0.022, ring, lip.at(0, 0, 0.04))
      .at(0, FRAME_Y, 0);

    const goldPaint = (x: number, y: number, z: number) => {
      const patina = 0.5 + 0.5 * noise.fbm(x * 13, y * 13, z * 13, 2);
      let c = mixRgb(GOLD, GOLD_LIGHT, 0.25 + 0.4 * patina);
      // The back plate reads darker; crevices pick up the dark gold.
      c = mixRgb(c, GOLD_DARK, 0.35 * Math.max(0, (0.05 - z) / 0.12));
      return c;
    };
    k.body('frame-gold', frame.paintFn(goldPaint), {
      color: C.gold,
      roughness: 0.3,
      metalness: 1,
      detail: 0.009,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 22, y * 22, z * 22, 2),
      maxTriangles: 1450,
    });

    // ------------------------------------------------------------------ glass lens
    // A shallow pale-blue lens, its rim hidden behind the ring tube.
    const glass = sdf.ellipsoid([0.393, 0.513, 0.03]).at(0, FRAME_Y, 0);
    k.body('glass', glass, {
      color: C.glass,
      roughness: 0.05,
      metalness: 0.15,
      detail: 0.012,
      maxTriangles: 400,
    });

    // ------------------------------------------------------------------ wooden stand
    // Tapered pedestal the frame sits in, two splayed feet, a tie bar, and a rear brace.
    const pedestal = sdf
      .extrude(
        profile.polygon(
          [
            [-0.17, 0],
            [0.17, 0],
            [0.13, 0.22],
            [-0.13, 0.22],
          ],
          { smooth: true, samples: 8 },
        ),
        0.24,
        0.03,
      )
      .at(0, 0.029, -0.01);
    const feet = sdf.box([0.34, 0.14, 0.32], 0.05).at(0.3, 0.07, 0.02).mirror('x', 0);
    const bar = sdf.box([0.8, 0.09, 0.2], 0.035).at(0, 0.05, -0.02);
    const brace = sdf
      .capsule([0, 0.19, -0.1], [0, 0.05, -0.33], 0.032)
      .smoothUnion(0.03, sdf.box([0.24, 0.09, 0.18], 0.035).at(0, 0.045, -0.31));
    const stand = sdf.smoothUnion(0.02, pedestal, feet, bar, brace);

    const woodPaint = (x: number, y: number, z: number) => {
      const tint = noise.random(Math.floor(x * 7), Math.floor(y * 5), 3);
      let c = mixRgb(OAK, BROWN, 0.12 + 0.4 * tint);
      // Grain stretched along the timber; darker seams at the ground and crevices.
      const grain = 0.5 + 0.5 * noise.fbm(x * 8, y * 55, z * 8, 2);
      c = mixRgb(c, WALNUT, 0.22 * grain);
      c = mixRgb(c, WALNUT, 0.4 * Math.max(0, (0.09 - y) / 0.09));
      // Sun-lit cut top edges.
      c = mixRgb(c, PALE, 0.22 * Math.max(0, (y - 0.26) / 0.12));
      return c;
    };
    k.body('stand-wood', stand.paintFn(woodPaint), {
      color: C.oak,
      roughness: 0.82,
      metalness: 0,
      detail: 0.011,
      paintWeight: 2,
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 9, y * 60, z * 9, 2),
      maxTriangles: 1100,
    });
  },
});
