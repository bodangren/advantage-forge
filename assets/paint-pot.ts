import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — ceramic paint pot with four paint colours (Chibi Sprouts props).
 *
 * Role: a paint-corner prop that stands on the floor; must read at 128 px.
 * Size: 0.083 m tall, 0.067 m across the belly; the ear reaches 0.039 m from the axis.
 *   It stands on y = 0, is centred on the Y axis, and faces +Z.
 * One idea: a small cream ceramic pot with a brown foot ring, a jug ear on its left, and wet
 *   paint that runs over the rim and down the outside in three drips, so the colour of the set
 *   reads from every view. The paint surface sits just below the rim; the drips and lips carry
 *   the colour, because the camera sits near rim height and cannot see into the cup.
 * Shape language: round (a soft ceramic cup) with one small ear and three soft paint runs.
 * Palette: cream #efe6d2 (body), warm brown #8a5a35 (foot ring), ceramic shade #d8ccb2, and
 *   the paint slot: red #c0503c, blue #3f6fa8, yellow #e0b23c, green #4f8f5a. Value plan: the
 *   body is the light mass, the painted rim and drips are the saturated focal point.
 * Materials: matte ceramic (0.85, 0), wet paint (0.3, 0).
 * Detail list: primary the paint drips and lips; secondary the cup, the rim, the foot ring, the
 *   ear; tertiary the ceramic speckle. The paint is the focal point.
 * Rig/animation: none (static prop).
 */

const CREAM = rgb('#efe6d2');
const CREAM_SHADE = rgb('#d8ccb2');
const CREAM_DARK = rgb('#c3b7a0');
const FOOT = rgb('#8a5a35');

const CUP_HEIGHT = 0.94;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * The wall cross-section, from the base centre up the outside, over the rim, and back
 * down the inside to the floor. A dense point list keeps the revolve smooth: a smooth
 * spline through these corners overshoots and breaks the rim.
 */
const CUP_PROFILE: [number, number][] = (
  [
    // The base, from the centre out to the foot.
    [0.0, 0.0],
    [0.015, 0.0],
    [0.0242, 0.0],
    [0.0272, 0.001],
    [0.0288, 0.0034],
    // The outside wall, slightly flared.
    [0.0296, 0.0068],
    [0.0304, 0.011],
    [0.0311, 0.016],
    [0.0317, 0.022],
    [0.0321, 0.029],
    [0.0325, 0.037],
    [0.0328, 0.045],
    [0.033, 0.053],
    [0.0332, 0.061],
    [0.0333, 0.069],
    [0.0334, 0.076],
    [0.0334, 0.0795],
    // The rim, round over the top.
    [0.0336, 0.0812],
    [0.0333, 0.0828],
    [0.0324, 0.0841],
    [0.0308, 0.0847],
    [0.0288, 0.0849],
    // The inner lip.
    [0.0272, 0.0845],
    [0.0262, 0.0833],
    [0.0259, 0.081],
    // The inside wall, down to the floor.
    [0.0258, 0.076],
    [0.0256, 0.069],
    [0.0254, 0.061],
    [0.0251, 0.053],
    [0.0248, 0.045],
    [0.0244, 0.037],
    [0.0239, 0.029],
    [0.0233, 0.022],
    [0.0225, 0.016],
    [0.0214, 0.0115],
    // The floor, dished a little.
    [0.0195, 0.0096],
    [0.015, 0.0088],
    [0.009, 0.0085],
    [0.004, 0.0084],
    [0.0, 0.0084],
  ] as [number, number][]
).map(([u, v]) => [u, v * CUP_HEIGHT]);

const EAR_Y = 0.046 * CUP_HEIGHT;
/** The top of the rim, where the paint lips and drips start. */
const RIM_TOP = 0.0849 * CUP_HEIGHT;
/** The paint sits 3 mm below the rim top; the camera cannot see into the cup. */
const PAINT_SURFACE_Y = RIM_TOP - 0.003;

/** Cream ceramic with a soft shade and a few small darker flecks. */
const potPaint = (x: number, y: number, z: number) => {
  const n = 0.5 + 0.5 * noise.fbm(x * 90, y * 90, z * 90, 2);
  let c = mixRgb(CREAM_SHADE, CREAM, 0.55 + 0.4 * n);
  // A speckled glaze: a few small darker flecks.
  const fleck = 0.5 + 0.5 * noise.fbm(x * 260, y * 260, z * 260, 1);
  c = mixRgb(c, CREAM_DARK, 0.25 * clamp01((fleck - 0.72) / 0.2));
  return c;
};

/**
 * One paint run: it starts inside the cup, rises over the rim as a thin lip, turns over the
 * outer edge, and hangs down the wall to a rounded end. Lengths are measured from the rim
 * top. The chain radius grows from the lip (0.0026) to the run (0.006): a 0.0108 m wide band
 * that stands 0.003 m proud of the 0.0313 m wall.
 */
const paintRun = (angleDeg: number, length: number) => {
  const a = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dz = Math.cos(a);
  const at = (r: number, y: number, radius: number): [number, number, number, number] => [
    dx * r,
    y,
    dz * r,
    radius,
  ];
  // A thin film of paint spread on the rim top: 11 mm wide, 9 mm deep, 3 mm thick at the crest.
  const lip = sdf
    .ellipsoid([0.0055, 0.0016, 0.0045])
    .rotateY(angleDeg)
    .at(dx * 0.0295, RIM_TOP + 0.0012, dz * 0.0295);
  const run = sdf.chain(
    [
      at(0.0262, PAINT_SURFACE_Y - 0.0006, 0.0016), // a tongue inside the cup, joined to the pool
      at(0.0281, RIM_TOP + 0.0004, 0.0022), // up over the inner rim
      at(0.0294, RIM_TOP + 0.0002, 0.0026), // under the lip, on the rim top
      at(0.0306, RIM_TOP - 0.0018, 0.0036), // over the outer rim edge
      at(0.0287, RIM_TOP - 0.0072, 0.0056), // onto the wall
      at(0.0285, RIM_TOP - length * 0.55, 0.006),
      at(0.0283, RIM_TOP - length * 0.9, 0.0056),
      at(0.0282, RIM_TOP - length, 0.0044), // the rounded end
    ],
    0.004,
  );
  return sdf.smoothUnion(0.002, lip, run);
};

export default defineAsset({
  name: 'paint-pot',
  description:
    'A small cream ceramic paint pot, 0.083 m tall, with a brown foot ring, a jug ear, and wet paint over the rim in three drips down the wall, in red, blue, yellow, or green.',
  detail: 0.0035,
  texture: { size: 512 },

  variants: {
    paint: { red: '#c0503c', blue: '#3f6fa8', yellow: '#e0b23c', green: '#4f8f5a' },
  },
  presets: {
    red: { paint: 'red' },
    blue: { paint: 'blue' },
    yellow: { paint: 'yellow' },
    green: { paint: 'green' },
  },

  build(k) {
    // The cup: a flared wall with a round rim, hollowed from the top.
    const cup = sdf.revolve(profile.polygon(CUP_PROFILE));
    // A small jug ear on the left (+X), cut where it enters the wall.
    const ear = sdf
      .torus(0.0065, 0.0026)
      .rotateX(90)
      .at(0.03, EAR_Y, 0)
      .intersect(sdf.halfSpace([-1, 0, 0], -0.0305));
    const pot = sdf.smoothUnion(0.002, cup, ear).paintFn(potPaint);
    k.body('pot', pot, {
      color: '#efe6d2',
      roughness: 0.85,
      metalness: 0,
      detail: 0.0035,
      textureDensity: 2,
      bump: (x, y, z) => 0.00018 * noise.fbm(x * 150, y * 150, z * 150, 2),
    });

    // One thin brown foot ring at the base: a bead 0.006 m tall, 1.2 mm proud of the flare.
    k.body('foot', sdf.torus(0.0252, 0.003).at(0, 0.003, 0), {
      color: FOOT,
      roughness: 0.7,
      metalness: 0,
      detail: 0.0035,
    });

    // The paint: one body. A flat surface 3 mm below the rim, a lip over the rim, and three
    // runs down the outside wall at the front, 50 degrees toward +X, and 200 degrees.
    const pool = sdf.cylinder(0.0252, 0.017, 0.001).at(0, PAINT_SURFACE_Y - 0.0085, 0);
    const paint = sdf.smoothUnion(
      0.002,
      pool,
      paintRun(0, 0.04),
      paintRun(50, 0.028),
      paintRun(200, 0.034),
    );
    k.body('paint', paint, {
      color: k.tint('paint'),
      roughness: 0.3,
      metalness: 0,
      detail: 0.0028,
    });
  },
});
