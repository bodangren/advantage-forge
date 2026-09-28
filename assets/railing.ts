import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — tavern stair railing (architecture/building-parts/railing).
 *
 * Role: a background rail for the tavern gallery. It must read at 128 px as posts,
 *   a handrail, and a row of spindles.
 * Size: 2.0 m along X, handrail top at 0.9 m, ball finials to 1.17 m. On y = 0,
 *   centered, faces +Z.
 * One idea: chunky square newels with pale ball finials frame five turned balusters.
 * Shape language: round dominant (balls, spindles, rails), square secondary (newels).
 * Palette: honey oak #b5814a (rails, spindles), dark warm shafts (walnut into
 *   #8a5a35), pale cut wood #c9a06a (balls), dark walnut #6b4226 (plinths).
 * Materials: one wood body, roughness 0.82, metalness 0. Grain lives in bump.
 * Detail: plinth, square shaft, cap, and ball; rounded top rail; round bottom rail;
 *   five lathe spindles. Focal point: the two pale balls and the spindle rhythm.
 * Rig/animation: none.
 */

const HONEY = rgb('#b5814a');
const WARM = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');

const POST_X = 0.89;
const PLINTH_W = 0.22;
const SHAFT_W = 0.11;
const CAP_W = 0.18;

const RAIL_TOP = 0.9;
const RAIL_R = 0.046;

const BOT_Y = 0.15;
const BOT_R = 0.045;

const BAL_X = [-0.58, -0.29, 0, 0.29, 0.58];
const BAL_Y0 = 0.11;

/** Turned spindle. Local Y runs from the bottom rail up into the handrail. */
const spindle = sdf.revolve(
  profile.polygon(
    [
      [0, 0],
      [0.034, 0],
      [0.034, 0.03],
      [0.05, 0.05],
      [0.05, 0.08],
      [0.03, 0.1],
      [0.044, 0.12],
      [0.044, 0.145],
      [0.024, 0.17],
      [0.022, 0.22],
      [0.042, 0.28],
      [0.054, 0.35],
      [0.054, 0.41],
      [0.028, 0.47],
      [0.022, 0.5],
      [0.04, 0.55],
      [0.046, 0.58],
      [0.046, 0.61],
      [0.024, 0.63],
      [0.024, 0.66],
      [0.04, 0.685],
      [0.04, 0.72],
      [0.026, 0.745],
      [0.026, 0.78],
      [0, 0.78],
    ],
    { smooth: false },
  ),
);

const newelAt = (x: number) => {
  // Flat foot. The box dips below the ground and the half-space cuts it flush.
  const plinth = sdf
    .box([PLINTH_W, 0.24, 0.2], 0.016)
    .at(x, 0.1, 0)
    .intersect(sdf.halfSpace([0, -1, 0], 0));
  const shaft = sdf.box([SHAFT_W, 0.7, 0.11], 0.012).at(x, 0.46, 0);
  // Square collar, wider than the shaft, so the ball has a capital to sit on.
  const cap = sdf.box([CAP_W, 0.18, 0.17], 0.014).at(x, 0.89, 0);
  const ball = sdf.sphere(0.11).at(x, 1.055, 0);
  return sdf.union(plinth, shaft, cap, ball);
};

const paint = (x: number, y: number, z: number) => {
  const ax = Math.abs(x);
  const post = ax > 0.76;
  const ball = post && y > 0.97;
  const collar = post && y > 0.78 && y <= 0.97;
  let c = HONEY;
  if (post && y < 0.2) c = WALNUT;
  else if (post && y < 0.78) c = mixRgb(WALNUT, WARM, 0.28);
  else if (collar) c = mixRgb(WARM, HONEY, 0.45);
  else if (ball) c = PALE;
  else if (y > 0.885) c = mixRgb(HONEY, PALE, 0.35);
  else if (y > 0.8) c = HONEY;
  else if (y < 0.21) c = mixRgb(WARM, WALNUT, 0.22);

  const n = 0.5 + 0.5 * noise.fbm(x * 3.2, y * 2.4, z * 3.2, 3);
  if (ball) c = mixRgb(c, HONEY, 0.1 * (1 - n));
  else if (post && y < 0.2) c = mixRgb(c, mixRgb(WALNUT, WARM, 0.15), 0.18 * n);
  else c = mixRgb(c, WALNUT, 0.08 * (1 - n));
  return c;
};

export default defineAsset({
  name: 'railing',
  description:
    'A 2 m honey-oak railing: square newels with ball finials, a rounded handrail, and five turned balusters.',
  reference: 'docs/item-mockups/railing-mock.jpg',
  detail: 0.012,
  texture: { size: 1024 },

  build(k) {
    const posts = sdf.union(newelAt(-POST_X), newelAt(POST_X));
    const topRail = sdf.capsule([-0.86, RAIL_TOP - RAIL_R, 0], [0.86, RAIL_TOP - RAIL_R, 0], RAIL_R);
    const bottomRail = sdf.capsule([-0.88, BOT_Y, 0], [0.88, BOT_Y, 0], BOT_R);
    const balusters = sdf.union(...BAL_X.map((x) => spindle.at(x, BAL_Y0, 0)));

    k.body('wood', sdf.union(posts, topRail, bottomRail, balusters).paintFn(paint), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.012,
      paintWeight: 2,
      maxTriangles: 2800,
      bump: (x, y, z) => {
        const alongRail = Math.abs(x) < 0.8 && (y > 0.78 || y < 0.22);
        if (alongRail) return 0.0014 * noise.fbm(x * 7, y * 36, z * 26, 2);
        return 0.0014 * noise.fbm(x * 26, y * 6, z * 26, 2);
      },
    });
  },
});
