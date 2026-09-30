import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - wooden tavern chair (props/furniture/chair), catch-up rework.
 *
 * Role: seat furniture for a cozy tavern; background prop at 128 px, seen from above.
 * Size: 0.42 x 0.72 x 0.45 m (x, y, z). Seat top at 0.35 m. Stands on y = 0, faces +Z.
 * One idea: a slatted ladder back with a curved top rail over a plank seat with clear gaps.
 * Shape language: square dominant (planks, posts), round secondary (turned rings, bevels).
 * Palette: seat #b07a45 (light), frame #8a5a30 darkened a little (mid-dark) so the seat reads
 *   from above, pale worn front edge #c9a06a.
 * Materials: wood, roughness 0.82. Grain is in `bump`.
 * Detail: primary seat planks + back; secondary splayed legs, rings, stretchers, slats;
 *   tertiary grain and worn seat front. Focal point: the seat.
 * Rig/animation: none.
 */

const SEAT_C = rgb('#b07a45');
const FRAME_C = rgb('#7d5029');
const FRAME_LIGHT = rgb('#8a5a30');
const FRAME_DARK = rgb('#4d301a');
const PALE = rgb('#c9a06a');

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

const SEAT_TOP = 0.35;
const PLANK_T = 0.04;
const PLANK_W = 0.132;
const GAP = 0.012;
const SEAT_D = 0.4;
const LEAN = -8;
const POST_X = 0.172;
const BACK_Z = -0.165;
const BACK_Y = 0.3;

export default defineAsset({
  name: 'chair',
  description: 'Tavern chair: three-plank seat with gaps, splayed turned legs, slatted back with a curved top rail.',
  detail: 0.007,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ seat
    const plank = (x: number) =>
      sdf.box([PLANK_W, PLANK_T, SEAT_D], 0.012).at(x, SEAT_TOP - PLANK_T / 2, 0);
    const seat = sdf.union(plank(-(PLANK_W + GAP)), plank(0), plank(PLANK_W + GAP)).paintFn((x, y, z) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 6, z * 6, 3);
      let c = mixRgb(SEAT_C, PALE, 0.12 * grain + 0.1 * noise.random(Math.round(x * 8), 3, 7));
      c = mixRgb(c, PALE, 0.6 * smoothstep(0.17, 0.2, z));
      return c;
    });
    k.body('seat', seat, {
      color: '#b07a45',
      roughness: 0.82,
      metalness: 0,
      detail: 0.006,
      textureDensity: 1.5,
      paintWeight: 2,
      maxTriangles: 2200,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 6, z * 6, 3),
    });

    // ------------------------------------------------------------------ back
    // Built in a local frame (origin at the seat pivot), then leaned.
    const H = 0.42;
    const post = sdf.box([0.05, H, 0.04], 0.01).at(POST_X, H / 2, 0);
    const posts = sdf.union(post, post.mirror('x', 0));
    const topRail = sdf
      .extrude(
        profile.polygon(
          [
            [-0.172, 0.3],
            [-0.172, 0.345],
            [-0.1, 0.4],
            [0, 0.425],
            [0.1, 0.4],
            [0.172, 0.345],
            [0.172, 0.3],
          ],
          { smooth: true, samples: 6 },
        ),
        0.036,
        0.008,
      );
    const lowRail = sdf.box([0.34, 0.04, 0.034], 0.01).at(0, 0.085, 0);
    const slat = (x: number) => sdf.box([0.045, 0.3, 0.026], 0.01).at(x, 0.23, 0);
    const back = sdf
      .union(posts, topRail, lowRail, slat(-0.065), slat(0.065), slat(0))
      .rotateX(LEAN)
      .at(0, BACK_Y, BACK_Z);
    k.body('back', back, {
      color: '#7d5029',
      roughness: 0.84,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 2200,
      bump: (x, y, z) => 0.0011 * noise.fbm(x * 8, y * 28, z * 8, 2),
    });

    // ------------------------------------------------------------------ frame
    const leg = (sx: number, sz: number) =>
      sdf.cone([sx * 0.16, 0.29, sz * 0.148], [sx * 0.182, 0, sz * 0.168], 0.027, 0.022);
    const ring = (sx: number, sz: number) =>
      sdf.torus(0.03, 0.013).at(sx * 0.171, 0.17, sz * 0.158);
    const legs: any[] = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) legs.push(leg(sx, sz), ring(sx, sz));
    const stretch = (a: [number, number, number], b: [number, number, number]) => sdf.capsule(a, b, 0.018);
    const parts = [
      ...legs,
      stretch([0.17, 0.11, 0.158], [0.17, 0.11, -0.158]),
      stretch([-0.17, 0.11, 0.158], [-0.17, 0.11, -0.158]),
      stretch([-0.17, 0.11, 0.158], [0.17, 0.11, 0.158]),
      stretch([-0.17, 0.11, -0.158], [0.17, 0.11, -0.158]),
      sdf.box([0.03, 0.04, 0.32], 0.008).at(0.165, 0.315, 0),
      sdf.box([0.03, 0.04, 0.32], 0.008).at(-0.165, 0.315, 0),
      sdf.box([0.3, 0.04, 0.03], 0.008).at(0, 0.315, 0.15),
      sdf.box([0.3, 0.04, 0.03], 0.008).at(0, 0.315, -0.15),
    ];
    const frame = sdf.smoothUnion(0.01, ...parts).paintFn((x, y, z) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 20, y * 5, z * 20, 3);
      let c = mixRgb(FRAME_C, FRAME_LIGHT, 0.6 * grain);
      return mixRgb(c, FRAME_DARK, 0.3 * (1 - smoothstep(0.004, 0.07, y)));
    });
    k.body('frame', frame, {
      color: '#7d5029',
      roughness: 0.84,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 2500,
      bump: (x, y, z) => 0.0009 * noise.fbm(x * 20, y * 5, z * 20, 2),
    });
    // paint the back in the frame family too
  },
});
