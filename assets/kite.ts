import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import type { Vec2 } from '../src/sdf/profile.js';

/**
 * Design note — paper kite (Chibi Sprouts props).
 *
 * Role: a toy prop that stands on the floor beside the cast; must read at 128 px.
 * Size: 0.50 m tall, 0.36 m wide, 0.35 m deep with the tail; stands on its two lower
 *   wing tips, tilted back 10 degrees, with the tail on the ground behind it.
 * One idea: a red hexagonal paper kite with a cream binding cross and a cream edge
 *   band, wooden spars on its face, standing propped on its two lower tips with a
 *   three-bow cloth tail trailing behind on the ground.
 * Shape language: triangular (the sail's taper and the spars) with round soft cloth
 *   bows as the secondary language.
 * Palette: red #c0503c (sail), cream #efe6d2 (binding cross, edge band, bows), warm
 *   brown #8a5a35 (wooden spars), pale wood #a87545 (grain), cord #d8ccb2, darker
 *   red #9c3d2d (sail shadow). Value plan: a mid red field, the light cream bands as
 *   the brightest areas, the brown spars as the dark lines.
 * Materials: paper sail (0.9, 0), cloth bows and cord (0.9, 0), wood (0.82, 0).
 * Detail list: primary the hexagonal sail with the notch; secondary the cream cross,
 *   the edge band, the two spars, the top loop; tertiary the paper grain, the bows'
 *   folds, the cord twist. The cream cross on the red sail is the focal point.
 * Rig/animation: none (static prop).
 */

const RED = rgb('#c0503c');
const RED_DARK = rgb('#9c3d2d');
const CREAM = rgb('#efe6d2');
const CREAM_SHADE = rgb('#d8ccb2');
const WOOD = rgb('#8a5a35');
const WOOD_PALE = rgb('#a87545');

const DEG = Math.PI / 180;
const LEAN = -10; // degrees; the top goes back (away from the viewer)
const LIFT = 0.0045;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Sail outline in its own plane: two wide shoulders, two lower tips, and a bottom notch. */
const SAIL: Vec2[] = [
  [0, 0.458], // apex
  [0.18, 0.205], // upper right shoulder (widest point)
  [0.082, 0.0], // lower right wing tip
  [0, 0.046], // bottom notch
  [-0.082, 0.0], // lower left wing tip
  [-0.18, 0.205], // upper left shoulder
];

/** Distance (m) from a point in the sail plane to the sail outline. */
const edgeDist = (x: number, y: number): number => {
  let best = Infinity;
  for (let i = 0; i < SAIL.length; i++) {
    const [ax, ay] = SAIL[i]!;
    const [bx, by] = SAIL[(i + 1) % SAIL.length]!;
    const vx = bx - ax;
    const vy = by - ay;
    const t = clamp01(((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy));
    const d = Math.hypot(x - (ax + vx * t), y - (ay + vy * t));
    if (d < best) best = d;
  }
  return best;
};

const sailPaint = (x: number, y: number) => {
  let c = mixRgb(RED, RED_DARK, 0.3 * clamp01((0.14 - y) / 0.14));
  c = mixRgb(c, mixRgb(RED, CREAM, 0.1), clamp01((y - 0.14) / 0.32)); // lit upper sail
  // Cream edge binding all round the outline.
  c = mixRgb(c, CREAM, 1 - smoothstep(0.016, 0.022, edgeDist(x, y)));
  // Cream tape cross: over the spine, then over the spreader.
  const spine = 1 - smoothstep(0.013, 0.017, Math.abs(x));
  const spreader = 1 - smoothstep(0.011, 0.015, Math.abs(y - 0.205));
  c = mixRgb(c, CREAM, Math.max(spine, spreader));
  // Paper grain: a faint uneven tint, no pattern.
  return c;
};

const paperBump = (x: number, y: number, z: number): number =>
  0.00014 * noise.fbm(x * 55, y * 55, z * 55, 2) + 0.0002 * noise.fbm(x * 8, y * 9, z * 8, 2);

const woodPaint = (x: number, y: number, z: number) => {
  const g = 0.5 + 0.5 * noise.fbm(x * 40, y * 18, z * 40, 2);
  return mixRgb(WOOD, WOOD_PALE, 0.25 + 0.35 * g);
};

/** One cloth bow lying flat: two loops and a red knot, in its own local frame. */
const bow = () => {
  const loops = sdf
    .union(
      sdf.ellipsoid([0.034, 0.0095, 0.020]).at(0.031, 0.0095, 0).rotateY(-14),
      sdf.ellipsoid([0.034, 0.0095, 0.020]).at(-0.031, 0.0095, 0).rotateY(12),
    )
    .paintFn((x, y, z) => {
      const n = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
      let c = mixRgb(CREAM_SHADE, CREAM, 0.5 + 0.45 * n);
      // A little crease along each loop's inner end.
      c = mixRgb(c, CREAM_SHADE, 0.5 * (1 - smoothstep(0.004, 0.016, Math.hypot(x - 0.012, z))));
      return c;
    });
  const knot = sdf.sphere(0.013).at(0, 0.0115, 0).paint(RED);
  return sdf.smoothUnion(0.004, loops, knot);
};

export default defineAsset({
  name: 'kite',
  description:
    'A red paper kite, 0.5 m tall and 0.36 m wide, propped on its two lower wing tips with a cream binding cross, a cream edge band, wooden spars on its face, a top string loop, and a three-bow cloth tail on the ground behind it.',
  detail: 0.006,
  texture: { size: 1024 },

  build(k) {
    const outline = profile.polygon(SAIL, { smooth: false });
    const sail = sdf
      .extrude(outline, 0.014, 0.004)
      .paintFn((x, y) => sailPaint(x, y))
      .rotateX(LEAN)
      .at(0, LIFT, 0);

    k.body('sail', sail, {
      color: '#c0503c',
      roughness: 0.95,
      metalness: 0,
      detail: 0.0065,
      textureDensity: 2,
      bump: paperBump,
    });

    // Wooden spine and spreader, on the front face, in the plane of the sail.
    const sparZ = 0.012;
    const spars = sdf
      .union(
        sdf.capsule([0, 0.452, sparZ], [0, 0.052, sparZ], 0.0062),
        sdf.capsule([-0.168, 0.205, sparZ], [0.168, 0.205, sparZ], 0.0058),
      )
      .paintFn(woodPaint)
      .rotateX(LEAN)
      .at(0, LIFT, 0);
    k.body('spars', spars, { color: '#8a5a35', roughness: 0.82, metalness: 0, detail: 0.0028 });

    // The string loop at the top point, with a short cord down to the apex.
    const loop = sdf
      .union(
        sdf.torus(0.0115, 0.0038).rotateX(90).at(0, 0.4942, 0),
        sdf.capsule([0, 0.457, 0], [0, 0.4825, 0], 0.0028),
      )
      .rotateX(LEAN)
      .at(0, LIFT, 0)
      .paint(CREAM_SHADE);
    k.body('loop', loop, { color: '#d8ccb2', roughness: 0.9, metalness: 0, detail: 0.0022 });

    // The tail cord, from the bottom notch to the ground behind the kite.
    const cord = sdf
      .chain(
        [
          [0, 0.058, -0.012, 0.0034],
          [0, 0.03, -0.06, 0.0032],
          [0, 0.0095, -0.135, 0.003],
          [0, 0.0075, -0.225, 0.0028],
          [0, 0.0075, -0.318, 0.0026],
        ],
        0.02,
      )
      .paint(CREAM_SHADE);
    k.body('cord', cord, { color: '#d8ccb2', roughness: 0.9, metalness: 0, detail: 0.0032 });

    // Three cloth bows on the tail, lying flat on the ground.
    const bows = [
      { z: -0.085, turn: -18 },
      { z: -0.175, turn: 9 },
      { z: -0.268, turn: -6 },
    ].map(({ z, turn }) => bow().rotateY(turn).at(0, 0.004, z));
    k.body('bows', sdf.union(...bows), { color: '#efe6d2', roughness: 0.9, metalness: 0, detail: 0.0045 });
  },
});
