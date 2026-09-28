import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note
 * Role: hamlet interior stair flight to a loft; a background architecture piece that must
 *   read at 128 px as "wooden stairs with a rail".
 * Size: 1.0 m wide (X), 2.0 m run (Z), 1.5 m rise. Bottom step front at z = +1.0, top step
 *   at z = -1.0, standing on y = 0, facing +Z. Railing on +X (the climber's left).
 * One idea: six chunky honey-oak planks climbing two stout sloped stringers, with one fat
 *   handrail that sweeps down and curls into the ball-topped newel at the bottom.
 * Shape language: square stacked blocks (sturdy) with soft bevels and round ball finials
 *   (friendly chibi).
 * Palette (60/30/10): honey oak #b5814a dominant, pale cut wood #c9a06a on the tread tops,
 *   warm brown #8a5a35 on the frame, dark walnut #6b4226 grooves and pegs.
 * Materials: painted step wood (roughness 0.8), stained frame wood (roughness 0.8). No metal.
 * Detail list: primary = six rounded plank steps + two sloped stringers; secondary = newel
 *   posts with ball finials, mid post, curled handrail; tertiary = grain bump, walnut pegs.
 * Focal point: the curled handrail and ball finials.
 * Rig / animation: none (static architecture).
 */

// ------------------------------------------------------------------ dimensions
const W = 1.0; // overall width across X
const RISE = 1.5;
const RUN = 2.0;
const NSTEP = 6;
const STEP_RISE = RISE / NSTEP; // 0.25
const STEP_RUN = RUN / NSTEP; // 0.3333
const Z_FRONT = RUN / 2; // 1.0
const PLANK_W = 0.84; // step plank width (between stringers)
const PLANK_T = 0.09; // step plank thickness
const SLOPE_DEG = (Math.atan2(RISE, RUN) * 180) / Math.PI; // 36.87

// ------------------------------------------------------------------ palette
const OAK = rgb('#b5814a'); // honey oak
const OAK_DARK = rgb('#8a5a35'); // warm brown
const PALE = rgb('#c9a06a'); // pale cut wood
const WALNUT = rgb('#6b4226'); // dark walnut
const WALNUT_DEEP = rgb('#4e2f18');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'stairs-wood',
  description:
    'Chunky wooden staircase: six honey-oak plank steps on two sloped stringers, with a single curled handrail and ball-topped newel posts on one side.',
  detail: 0.01,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/stairs-wood-mock.jpg',

  build(k) {
    // ------------------------------------------------------------------ steps
    // Solid stepped boxes (each runs to the ground) so the flight reads stacked and
    // chunky like the mock; each step is painted on its own band.
    const stepBoxes: sdf.Shape[] = [];
    for (let i = 0; i < NSTEP; i++) {
      const topY = (i + 1) * STEP_RISE;
      const zBack = -Z_FRONT + (NSTEP - 1 - i) * STEP_RUN;
      const zc = zBack + STEP_RUN / 2 + 0.008; // tiny front overhang
      const tint = noise.random(i, 3);
      const step = sdf
        .box([PLANK_W, topY, STEP_RUN + 0.024], 0.02)
        .at(0, topY / 2, zc)
        .paintFn((x, y, z, base): Rgb => {
          let c = mixRgb(base, OAK_DARK, 0.1 + 0.18 * tint);
          // Grain along the plank.
          const grain = 0.5 + 0.5 * noise.fbm(x * 24, y * 3, z * 3, 2);
          c = mixRgb(c, OAK_DARK, 0.16 * grain);
          // Dark walnut shade at the plank ends.
          c = mixRgb(c, WALNUT, 0.35 * smoothstep(0.34, 0.42, Math.abs(x)));
          // Pale cut wood on the tread top (kept subtle: honey oak stays dominant).
          const t = topY - y;
          const wear = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
          c = mixRgb(c, PALE, (0.22 + 0.2 * wear) * smoothstep(0.04, 0.012, t));
          // Shadow groove just under each nosing.
          c = mixRgb(c, WALNUT_DEEP, 0.55 * smoothstep(0.13, 0.09, t) * smoothstep(0.06, 0.09, t));
          return c;
        });
      stepBoxes.push(step);
    }
    // A small fillet melts the razor creases between steps, so the flight reads as one
    // chunky carved piece (and reduces cleanly).
    const steps = sdf.smoothUnion(0.012, ...stepBoxes);
    k.body('steps', steps, {
      color: OAK,
      roughness: 0.8,
      metalness: 0,
      detail: 0.011,
      maxError: 0.005,
      maxTriangles: 1600,
      textureDensity: 2,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 26, y * 3, z * 3, 2),
    });

    // ------------------------------------------------------------------ frame (stringers, posts, rail, pegs)
    const frameParts: sdf.Shape[] = [];

    // Two slim sloped stringers under the step ends, proud of the plank sides.
    const stringer = sdf
      .box([0.1, 0.17, 2.56], 0.03)
      .rotateX(SLOPE_DEG)
      .at(0.45, 0.82, 0)
      .mirror('x', 0);
    frameParts.push(stringer);

    // Newel posts and balls (+X side only).
    const RAIL_X = 0.45; // post centre line
    frameParts.push(
      // bottom newel, standing on the ground in front of the first step
      sdf.box([0.13, 0.8, 0.13], 0.03).at(RAIL_X, 0.4, 1.0),
      sdf.sphere(0.085).at(RAIL_X, 0.9, 1.0),
      // mid post on the third step
      sdf.box([0.1, 0.97, 0.1], 0.025).at(RAIL_X, 1.235, 0),
      // top newel on the top step
      sdf.box([0.13, 0.875, 0.13], 0.03).at(RAIL_X, 1.9375, -0.9),
      sdf.sphere(0.095).at(RAIL_X, 2.46, -0.9),
    );

    // Handrail: one fat chain, parallel to the slope, curling down at the nose.
    const rail = sdf.chain(
      [
        [RAIL_X + 0.05, 2.33, -1.0, 0.055],
        [RAIL_X + 0.05, 2.32, -0.75, 0.055],
        [RAIL_X + 0.05, 2.135, -0.5, 0.055],
        [RAIL_X + 0.05, 1.95, -0.25, 0.055],
        [RAIL_X + 0.05, 1.7625, 0.0, 0.055],
        [RAIL_X + 0.05, 1.575, 0.25, 0.055],
        [RAIL_X + 0.05, 1.3875, 0.5, 0.055],
        [RAIL_X + 0.05, 1.25, 0.66, 0.055],
        [RAIL_X + 0.05, 1.12, 0.8, 0.055],
        [RAIL_X + 0.05, 1.0, 0.92, 0.055],
        [RAIL_X + 0.05, 0.94, 1.0, 0.055],
      ],
      0.05,
    );
    frameParts.push(rail);

    const frame = sdf.union(...frameParts).paintFn((x, y, z, base): Rgb => {
      // Stained warm brown; grain runs along each part.
      const grain = 0.5 + 0.5 * noise.fbm(x * 5, y * 18, z * 5, 2);
      return mixRgb(base, WALNUT, 0.2 + 0.22 * grain);
    });
    k.body('frame', frame, {
      color: OAK_DARK,
      roughness: 0.8,
      metalness: 0,
      detail: 0.011,
      maxError: 0.005,
      maxTriangles: 1600,
      textureDensity: 1.5,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 5, y * 20, z * 5, 2),
    });

    // Walnut peg dots on the two newels (toy-joinery story, as in the mock).
    const pegs = sdf.union(
      sdf.sphere(0.022).at(RAIL_X, 0.5, 1.072),
      sdf.sphere(0.022).at(RAIL_X, 1.8, -0.828),
    );
    k.body('pegs', pegs, { color: WALNUT, roughness: 0.7, metalness: 0, detail: 0.006, maxError: 0.003 });
  },
});
