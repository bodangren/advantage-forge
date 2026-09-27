import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — wooden tavern chair (props/furniture/chair).
 *
 * Role: seat furniture for a cozy tavern. It reads at 128 px as background furniture.
 * Size: 0.42 x 0.40 m seat at 0.35 m, back crown at 0.72 m. It stands on y = 0 and faces +Z.
 * One idea: two bold slabs — a thick honey seat and a tall leaning back on chunky legs.
 * Shape language: square dominant (sturdy planks, straight legs), round secondary
 *   (soft bevels on every edge, filleted stretcher joints).
 * Palette: honey oak #b5814a on seat and back, warm brown #8a5a35 on legs and stretchers,
 *   pale cut wood #c9a06a on worn edges. Dark seams stay inside the wood family.
 * Materials: wood, roughness 0.82, metalness 0. Grain and board seams go in `bump`.
 * Detail: primary seat slab and back plank; secondary four legs with side and back
 *   stretchers; tertiary board seams, grain, and a pale worn rim. Focal point: the seat rim.
 * Rig/animation: none. The chair is a static prop.
 */

// ---------------------------------------------------------------- palette
const OAK = rgb('#b5814a'); // honey oak: seat and back
const FRAME = rgb('#8a5a35'); // warm brown: legs and stretchers
const FRAME_DARK = rgb('#5b3a21'); // shaded wood, floor contact
const FRAME_LIGHT = rgb('#a56e42'); // lit grain on the frame
const PALE = rgb('#c9a06a'); // pale cut wood: worn edges
const LIGHT = rgb('#cf9a5f'); // grain highlight on the slabs
const SEAM = rgb('#4e3120'); // dark board seams

// ---------------------------------------------------------------- seat slab
const SEAT_W = 0.42;
const SEAT_D = 0.4;
const SEAT_T = 0.06;
const SEAT_TOP = 0.35;
const SEAT_R = 0.02; // soft bevel
const HX = SEAT_W / 2;
const HY = SEAT_T / 2;
const HZ = SEAT_D / 2;
const BOARD = SEAT_W / 3; // three boards run front to back

// ---------------------------------------------------------------- back plank
const BACK_HW = 0.19; // half width before round()
const BACK_T = 0.03; // thickness before round()
const ROUND = 0.01; // bevel on every edge of the plank
const SIDE_TOP = 0.35; // height where the top curve starts
const CROWN = 0.054; // rise of the top curve at the middle
const BACK_Y = 0.31; // plank pivot, buried in the seat
const BACK_Z = -0.165; // plank sits at the rear of the seat
const BACK_LEAN = -8; // degrees; the top tips toward -Z

// ---------------------------------------------------------------- frame
const LEG_S = 0.062; // leg cross-section
const LEG_R = 0.016;
const LEG_X = 0.172;
const LEG_Z = 0.152;
const LEG_TOP = 0.315; // buried 25 mm inside the seat
const STRETCH_S = 0.047;
const STRETCH_R = 0.013;
const SIDE_Y = 0.145; // side stretchers
const BACK_STRETCH_Y = 0.19; // back stretcher sits higher

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
/**
 * Pale worn edge: 1 on a rounded edge, 0 on an open face. A point sits on an edge when the
 * second smallest distance to the three face planes is short.
 */
const edgeWear = (a: number, b: number, c: number) => {
  const s = [a, b, c].sort((p, q) => p - q);
  return 1 - smoothstep(0.01, 0.026, s[1]!);
};

// Top edge of the back plank after round(): a gentle dome from shoulder to shoulder.
const backTop = (x: number) => {
  const xa = Math.min(Math.abs(x), BACK_HW);
  return SIDE_TOP + ROUND + CROWN * (1 - (xa / BACK_HW) ** 2);
};
const BACK_HW_F = BACK_HW + ROUND;
const BACK_HZ_F = BACK_T / 2 + ROUND;

/** Seat paint in the slab's own frame: three boards, grain, seams, pale worn rim. */
const seatPaint = (x: number, y: number, z: number) => {
  const u = (x + HX) / BOARD;
  const idx = Math.floor(u);
  const f = u - idx;
  const seamD = Math.min(f, 1 - f) * BOARD;
  const board = noise.random(idx + 1, 5, 11);
  const grain = 0.5 + 0.5 * noise.fbm(x * 34, y * 6, z * 7, 3);
  const patch = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
  // Honey oak holds the value of the slab: boards and grain only breathe on it.
  let c = mixRgb(OAK, LIGHT, 0.03 + 0.1 * board);
  c = mixRgb(c, FRAME_DARK, 0.2 * patch);
  c = mixRgb(c, LIGHT, 0.07 * grain);
  c = mixRgb(c, SEAM, 0.75 * (1 - smoothstep(0.002, 0.006, seamD)));
  return mixRgb(c, PALE, 0.85 * edgeWear(HX - Math.abs(x), HY - Math.abs(y), HZ - Math.abs(z)));
};

/** Back paint in the plank's own frame: vertical grain and the same pale worn rim. */
const backPaint = (x: number, y: number, z: number) => {
  const grain = 0.5 + 0.5 * noise.fbm(x * 28, y * 5, z * 28, 3);
  const patch = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
  let c = mixRgb(OAK, LIGHT, 0.03 + 0.09 * patch);
  c = mixRgb(c, FRAME_DARK, 0.2 * (1 - grain));
  const wear = edgeWear(BACK_HW_F - Math.abs(x), Math.min(y, backTop(x) - y), BACK_HZ_F - Math.abs(z));
  return mixRgb(c, PALE, 0.85 * wear);
};

/** Frame paint in world space: grain, shaded floor contact, scuffed pale feet. */
const framePaint = (x: number, y: number, z: number) => {
  const grain = 0.5 + 0.5 * noise.fbm(x * 24, y * 5, z * 24, 3);
  let c = mixRgb(FRAME, FRAME_LIGHT, 0.05 + 0.11 * grain);
  c = mixRgb(c, FRAME_DARK, 0.35 * (1 - smoothstep(0.004, 0.07, y)));
  return mixRgb(c, PALE, 0.3 * (1 - smoothstep(0.002, 0.014, y)));
};

export default defineAsset({
  name: 'chair',
  description:
    'Chunky wooden tavern chair: thick honey seat slab, tall leaning plank back, four legs with side and back stretchers.',
  detail: 0.007,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ seat
    // One thick plank, soft bevel on every edge, standing 0.35 m off the floor.
    const seat = sdf
      .box([SEAT_W, SEAT_T, SEAT_D], SEAT_R)
      .paintFn(seatPaint)
      .at(0, SEAT_TOP - HY, 0);
    k.body('seat', seat, {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.006,
      textureDensity: 1.5,
      paintWeight: 2,
      maxTriangles: 1400,
      bump: (x, y, z) => {
        const u = (x + HX) / BOARD;
        const f = u - Math.floor(u);
        const groove = 1 - smoothstep(0.002, 0.008, Math.min(f, 1 - f) * BOARD);
        return -0.0015 * groove + 0.001 * noise.fbm(x * 34, y * 6, z * 7, 3);
      },
    });

    // ------------------------------------------------------------------ back
    // Extruded plank with a gently domed top, beveled, then leaned back 8 degrees.
    const xs = [-BACK_HW, -0.17, -0.14, -0.105, -0.07, -0.035, 0, 0.035, 0.07, 0.105, 0.14, 0.17, BACK_HW];
    const pts: [number, number][] = [
      [-BACK_HW, 0],
      [-BACK_HW, 0.18],
      [-BACK_HW, 0.3],
      ...xs.map((x): [number, number] => [x, SIDE_TOP + CROWN * (1 - (x / BACK_HW) ** 2)]),
      [BACK_HW, 0.3],
      [BACK_HW, 0.18],
      [BACK_HW, 0],
      [0.09, 0],
      [0, 0],
      [-0.09, 0],
    ];
    const back = sdf
      .extrude(profile.polygon(pts, { smooth: true, samples: 5 }), BACK_T)
      .round(ROUND)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(backPaint)
      .rotateX(BACK_LEAN)
      .at(0, BACK_Y, BACK_Z);
    k.body('back', back, {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.006,
      textureDensity: 1.5,
      paintWeight: 2,
      maxTriangles: 1400,
      bump: (x, y, z) => 0.0011 * noise.fbm(x * 26, y * 5, z * 26, 2),
    });

    // ------------------------------------------------------------------ frame
    // Four chunky legs joined by two side stretchers and one higher back stretcher.
    const legs = sdf
      .box([LEG_S, LEG_TOP, LEG_S], LEG_R)
      .at(LEG_X, LEG_TOP / 2, LEG_Z)
      .mirror('x', 0)
      .mirror('z', 0);
    const sides = sdf
      .box([STRETCH_S, STRETCH_S, LEG_Z * 2], STRETCH_R)
      .at(LEG_X, SIDE_Y, 0)
      .mirror('x', 0);
    const backRail = sdf.box([LEG_X * 2, STRETCH_S, STRETCH_S], STRETCH_R).at(0, BACK_STRETCH_Y, -LEG_Z);
    const frame = sdf.smoothUnion(0.012, legs, sides, backRail).paintFn(framePaint);
    k.body('frame', frame, {
      color: '#8a5a35',
      roughness: 0.84,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 2000,
      bump: (x, y, z) => 0.0009 * noise.fbm(x * 22, y * 5, z * 22, 2),
    });
  },
});
