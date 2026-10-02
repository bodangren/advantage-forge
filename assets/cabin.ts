import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — log cabin (catalog `architecture/structure/cabin`).
 *
 * Role: a cozy hamlet home in the forest clearing; reads at 128 px. No rig, no clips.
 * Size: 3.0 m wide (X), 2.6 m deep (Z), 2.8 m to the roof apex; stands on y = 0,
 *   centred on the Y axis, gable end and door facing +Z; the ridge runs along Z.
 * One idea: a chunky stack of round horizontal logs with pale notched corner ends,
 *   capped by one big warm orange plank roof with a thick rake border, a stone
 *   chimney poking through one slope, and a plank door + shuttered window in the gable.
 * Shape language: round dominant (log tubes, soft bevels), square secondary (stone base,
 *   rectangular door). Big roof, small walls: the chibi hamlet proportion.
 * Palette (contract): bark #8a5a35 / #5f3d22 / deep #3d2717; cut wood #c9a06a (log ends,
 *   door frame, rake border); roof planks #b8713a / #d08a4a; stone #8a94a0 / #6a7480;
 *   ferns #2f7a3f / #4a9a4f; warm glass glow #ffbf6b; flue ember #ff9a3c.
 * Materials: log wood (0.85), roof planks (0.8), pale cut trim (0.85), stone (0.9),
 *   door/shutter planks (0.8), worn iron (0.55, metal 0.7), glass (0.2, faint emissive).
 * Detail list: (1) stacked log walls + stepped gable logs, (2) big plank roof + rake
 *   border + ridge board, (3) stone base + step + chimney + cap, (4) plank door + pale
 *   frame + iron straps + ring, (5) shuttered window with warm glass, (6) two ferns.
 *   Focal point: door + window in the gable.
 * Rig/animation: none (static building).
 */

const W = 3.0; // width along X (gable width)
const D = 2.6; // depth along Z (ridge direction)
const FRONT_Z = D / 2; // 1.3
const R = 0.14; // log radius

// Log course centre heights: five wall courses, three stepped gable courses.
const WALL_Y = [0.32, 0.62, 0.92, 1.22, 1.52];
const GABLE_Y = [1.8, 2.08, 2.36];
const COURSE_Y = [...WALL_Y, ...GABLE_Y];
// How far each course's log ends stick out past the corner / gable slope (+/- X).
const COURSE_END = [1.58, 1.58, 1.58, 1.58, 1.58, 1.11, 0.67, 0.28];
// Groove lines between courses (midpoints between touching course surfaces).
const GROOVE_Y = [0.47, 0.77, 1.07, 1.37, 1.67, 1.94, 2.22];

// Roof: outer top edge from eave (1.62 at |x| = 1.85) to apex (2.80).
const ROOF_HALF = 1.85;
const EAVE_TOP = 1.62;
const APEX_Y = 2.8;
const ROOF_RUN = ROOF_HALF;
const ROOF_RISE = APEX_Y - EAVE_TOP; // 1.18
const ROOF_SLOPE_LEN = Math.hypot(ROOF_RUN, ROOF_RISE);
const ROOF_SIN = ROOF_RISE / ROOF_SLOPE_LEN;
const ROOF_LEN = D + 0.6; // ridge length + gable overhangs: z +/- 1.6

const DOOR_X = -0.35;
const DOOR_W = 0.78;
const DOOR_BOT = 0.18;
const DOOR_H = 1.42;
const DOOR_CY = DOOR_BOT + DOOR_H / 2; // 0.89

const WIN_X = 0.85;
const WIN_CY = 1.25;
const WIN_SIZE = 0.56;

const CH_X = 1.5; // chimney centre, against the +X eave wall
const CH_Z = 0.31;

const C = {
  bark: rgb('#8a5a35'),
  barkDark: rgb('#5f3d22'),
  barkDeep: rgb('#3d2717'),
  barkLight: rgb('#a8763f'),
  cut: rgb('#c9a06a'),
  cutRing: rgb('#a87d4b'),
  cutDark: rgb('#8f6b3d'),
  roof: rgb('#b8713a'),
  roofLight: rgb('#d08a4a'),
  roofDark: rgb('#8a5a28'),
  roofDeep: rgb('#6b3d1a'),
  stone: rgb('#7b8186'),
  stoneDark: rgb('#5f6467'),
  mortar: rgb('#4a4f52'),
  iron: rgb('#3d4047'),
  void: rgb('#241812'),
  glow: rgb('#ffbf6b'),
  ember: rgb('#ff9a3c'),
  emberBase: rgb('#4a1405'),
  fernDark: rgb('#2f7a3f'),
  fernLight: rgb('#4a9a4f'),
};

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const sstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

const distTo = (v: number, list: number[]): number => Math.min(...list.map((b) => Math.abs(v - b)));

/** Index of the course whose centre is nearest to y. */
const courseAt = (y: number): number => {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < COURSE_Y.length; i++) {
    const d = Math.abs(y - (COURSE_Y[i] ?? 0));
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
};

// ---------------------------------------------------------------- log paint

const logPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  // Course grooves are the strongest "stacked log" signal.
  const groove = clamp01(1 - distTo(y, GROOVE_Y) / 0.032);
  const ci = courseAt(y);
  // Slow per-course value shift: each log reads a little lighter toward its top.
  const lift = clamp01((y - (COURSE_Y[ci] ?? 0)) / 0.28);

  // Bark: slow horizontal-ish furrows plus gentle plates (low frequency keeps the
  // vertex-color mesh light so reduction can do its job).
  const g = noise.fbm(x * 1.1, y * 2.4, z * 1.1, 2, 7);
  let c = mixRgb(base, C.barkDark, clamp01(-g * 1.6) * 0.75);
  c = mixRgb(c, C.barkLight, clamp01((g - 0.15) * 1.6) * 0.35 + lift * 0.14);
  // Shaded base where the walls meet the stone footing.
  c = mixRgb(c, C.barkDeep, clamp01((0.34 - y) / 0.18) * 0.55);
  c = mixRgb(c, C.barkDeep, groove * 0.95);

  // Pale cut end discs on the +/- X end faces, per course end position.
  const endX = COURSE_END[ci] ?? 0;
  const faceW = clamp01((Math.abs(x) - (endX - 0.06)) / 0.045);
  if (faceW > 0.002) {
    const zc = z > 0 ? FRONT_Z - R : -(FRONT_Z - R);
    const d = Math.hypot(y - (COURSE_Y[ci] ?? 0), z - zc);
    const disc = clamp01((R - 0.02 - d) / 0.03);
    const w = faceW * disc;
    if (w > 0.002) {
      const warp = noise.fbm(x * 3, y * 18, z * 18, 2, 31) * 0.012;
      const ring = Math.pow(0.5 + 0.5 * Math.cos((d + warp) * 40), 3);
      let f = mixRgb(C.cut, C.cutRing, ring * 0.5);
      f = mixRgb(f, C.cutRing, clamp01((0.03 - d) / 0.03) * 0.4);
      f = mixRgb(f, C.barkDark, clamp01((d - 0.115) / 0.03) * 0.65);
      c = mixRgb(c, f, w);
    }
  }
  return c;
};

const logBump = (x: number, y: number, z: number): number => {
  const groove = clamp01(1 - distTo(y, GROOVE_Y) / 0.04);
  const g = noise.fbm(x * 2.2, y * 5.5, z * 2.2, 3, 7);
  return -0.0075 * groove + 0.004 * g + 0.0012 * noise.noise3(x * 40, y * 40, z * 40);
};

// ---------------------------------------------------------------- stone paint

/** Stone paint: slow continuous tint plus soot above the roofline and damp at the ground.
 *  Block mortar lives in the bump map only, so the mesh stays seam-free and reduces well. */
const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const tint = 0.5 + 0.5 * noise.fbm(x * 2.6, y * 2.6, z * 2.6, 2, 17);
  let c = mixRgb(base, C.stoneDark, 0.42 * tint);
  c = mixRgb(c, C.void, clamp01((y - 2.45) / 0.25) * 0.3);
  c = mixRgb(c, C.mortar, clamp01((0.3 - y) / 0.3) * 0.25);
  return c;
};

const stoneBump = (x: number, y: number, z: number): number => {
  const { f1, f2 } = noise.worley(x * 2.6, y * 1.8, z * 2.6, 4);
  return -0.006 * (1 - sstep(0.05, 0.14, f2 - f1)) + 0.002 * noise.fbm(x * 20, y * 20, z * 20, 2);
};

// ---------------------------------------------------------------- plank paint

/** Vertical plank paint: grooves along x, per-board tint, grain. */
const doorPlankPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const pw = 0.155;
  const f = x / pw - Math.floor(x / pw);
  const g = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 4);
  const board = noise.random(Math.floor(x / pw) + 40, 3);
  const grain = 0.5 + 0.5 * noise.fbm(x * 24, y * 5, z * 24, 2, 11);
  let c = mixRgb(base, C.barkDark, 0.12 + 0.25 * board);
  c = mixRgb(c, C.barkDark, 0.12 * grain);
  c = mixRgb(c, C.barkDeep, 0.65 * g);
  c = mixRgb(c, C.barkDeep, clamp01((DOOR_BOT + 0.06 - y) / 0.12) * 0.3);
  return c;
};

const doorPlankBump = (x: number, y: number, z: number): number => {
  const pw = 0.155;
  const f = x / pw - Math.floor(x / pw);
  return -0.004 * Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 4) + 0.0015 * noise.fbm(x * 24, y * 5, z * 24, 2, 11);
};

/** Shutter plank paint: vertical boards, slightly blander than the door. */
const shutterPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const pw = 0.1;
  const f = x / pw - Math.floor(x / pw);
  const g = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 4);
  const board = noise.random(Math.floor(x / pw) + 90, 5);
  let c = mixRgb(base, C.barkDark, 0.15 + 0.28 * board);
  c = mixRgb(c, C.barkDeep, 0.6 * g);
  return c;
};

// ---------------------------------------------------------------- roof paint

const PLANK_W = 0.3; // plank width along the ridge (Z)
const PLANK_L = 1.5; // plank length down the slope

const roofPaint = (x: number, y: number, z: number): Rgb => {
  // The rake (gable overhang face) shows the cut plank ends.
  const rake = clamp01((Math.abs(z) - (ROOF_LEN / 2 - 0.09)) / 0.05);
  const pz = z / PLANK_W;
  const pzf = pz - Math.floor(pz);
  if (rake > 0.002) {
    // Pale cut wood with a dark seam at each plank boundary.
    const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * pzf), 8);
    const tint = noise.random(Math.floor(pz) + 200, 9);
    let c = mixRgb(C.cut, C.cutRing, 0.2 + 0.35 * tint);
    c = mixRgb(c, C.roofDeep, 0.7 * seam);
    c = mixRgb(c, C.cutDark, clamp01((y - (APEX_Y - 0.06)) / 0.06) * 0.4);
    return c;
  }

  // Sloped faces: long planks running from eave up to the ridge.
  const s = (APEX_Y - y) / ROOF_SIN / PLANK_L; // down-slope coordinate in plank lengths
  const row = Math.floor(s);
  const sf = s - row;
  const off = (Math.floor(pz) % 2) * 0.5;
  const joint = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * (sf + off)), 24);
  const seamZ = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * pzf), 8);
  const tint = noise.random(Math.floor(pz) + 200, 9);
  const grain = 0.5 + 0.5 * noise.fbm(z * 3.0, s * 2.2, 0, 2, 23);
  let c = mixRgb(C.roof, C.roofLight, 0.22 + 0.22 * tint);
  c = mixRgb(c, C.roofLight, 0.25 * grain);
  c = mixRgb(c, C.roofDark, 0.62 * seamZ);
  c = mixRgb(c, C.roofDeep, 0.5 * joint);
  // Eave edge slightly shadowed.
  c = mixRgb(c, C.roofDeep, clamp01((s * PLANK_L - (ROOF_SLOPE_LEN - 0.12)) / 0.12) * 0.35);
  return c;
};

const roofBump = (x: number, y: number, z: number): number => {
  const s = (APEX_Y - y) / ROOF_SIN / PLANK_L;
  const sf = s - Math.floor(s);
  const off = (Math.floor(z / PLANK_W) % 2) * 0.5;
  const joint = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * (sf + off)), 24);
  const pzf = z / PLANK_W - Math.floor(z / PLANK_W);
  const seamZ = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * pzf), 8);
  return -0.0045 * seamZ - 0.0022 * joint + 0.0015 * noise.fbm(z * 6, s * 4, 0, 2, 29);
};

// ---------------------------------------------------------------- greenery

/** A small fern rosette, about 0.34 m tall, centred on the origin. */
const fernShape = (seed: number) => {
  const blades = [];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + noise.random(i, seed) * 0.6;
    const reach = 0.13 + 0.06 * noise.random(i, seed + 1);
    const h = 0.24 + 0.09 * noise.random(i, seed + 2);
    blades.push(
      sdf.cone([0, 0.02, 0], [Math.cos(a) * reach, h, Math.sin(a) * reach], 0.026, 0.004),
    );
  }
  blades.push(sdf.cone([0, 0.02, 0], [0, 0.34, 0.02], 0.02, 0.003));
  return sdf.union(...blades).scale([1, 1, 0.55]);
};

const fernPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const v = 0.5 + 0.5 * noise.fbm(x * 10, y * 10, z * 10, 2, 61);
  let c = mixRgb(base, C.fernDark, clamp01((0.3 - y) / 0.3) * 0.5);
  c = mixRgb(c, C.fernLight, clamp01(y / 0.34) * 0.55 + 0.2 * v);
  return c;
};

export default defineAsset({
  name: 'cabin',
  description:
    'Chibi log cabin with stacked round logs and pale notched corner ends, a big warm orange plank roof with a cut-wood rake border, a stone chimney with a glowing flue, a plank door, a shuttered window with warm glass, and two ferns at the base.',
  detail: 0.012,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/cabin-mock.jpg',

  build(k) {
    // ---------------------------------------------------------------- stone base + chimney
    const foundation = sdf.box([W + 0.26, 0.18, D + 0.26], 0.04).at(0, 0.09, 0);
    const step = sdf.box([1.1, 0.1, 0.42], 0.035).at(DOOR_X, 0.05, FRONT_Z + 0.28);
    const chimney = sdf.box([0.44, 1.62, 0.44], 0.035).at(CH_X, 1.71, CH_Z);
    const cap = sdf.box([0.6, 0.1, 0.6], 0.03).at(CH_X, 2.55, CH_Z);
    k.body('stone', sdf.union(foundation, step, chimney, cap).paintFn(stonePaint), {
      color: C.stone,
      roughness: 0.9,
      detail: 0.018,
      maxError: 0.01,
      maxTriangles: 1600,
      bump: stoneBump,
    });

    // ---------------------------------------------------------------- log walls + gables
    // All four walls are grooved painted prisms: course grooves, bark furrows, and the pale
    // log-end discs are painted (with bump relief), which reads as stacked logs at game
    // size for a fraction of the mesh real tubes would cost.
    const pentagon = profile.polygon([
      [-W / 2 - 0.08, 0.18],
      [W / 2 + 0.08, 0.18],
      [W / 2 + 0.08, 1.66],
      [0, 2.5],
      [-W / 2 - 0.08, 1.66],
    ]);
    const wallSlab = (x: number) => sdf.box([0.24, 1.48, D - 0.2], 0.045).at(x, 0.92, 0);
    const logs = sdf.union(
      sdf.extrude(pentagon, 0.28, 0.03).at(0, 0, FRONT_Z - R),
      sdf.extrude(pentagon, 0.28, 0.03).at(0, 0, -(FRONT_Z - R)),
      wallSlab(-(W / 2 - R)),
      wallSlab(W / 2 - R),
    );

    k.body('logs', logs.paintFn(logPaint), {
      color: C.bark,
      roughness: 0.85,
      detail: 0.034,
      maxError: 0.014,
      textureDensity: 2,
      bump: logBump,
    });

    // ---------------------------------------------------------------- roof
    const roofProfile = profile.polygon([
      [-ROOF_HALF, EAVE_TOP],
      [0, APEX_Y],
      [ROOF_HALF, EAVE_TOP],
      [ROOF_HALF, EAVE_TOP - 0.14],
      [0, APEX_Y - 0.14],
      [-ROOF_HALF, EAVE_TOP - 0.14],
    ]);
    const roof = sdf.extrude(roofProfile, ROOF_LEN, 0.02);
    k.body('roof', roof.paintFn(roofPaint), {
      color: C.roof,
      roughness: 0.8,
      detail: 0.03,
      maxError: 0.012,
      textureDensity: 2,
      bump: roofBump,
    });

    // ---------------------------------------------------------------- pale cut-wood trim
    const doorFrame = sdf.union(
      sdf.box([0.09, 1.6, 0.1], 0.02).at(DOOR_X - DOOR_W / 2 - 0.07, DOOR_BOT + 0.8, FRONT_Z + 0.11),
      sdf.box([0.09, 1.6, 0.1], 0.02).at(DOOR_X + DOOR_W / 2 + 0.07, DOOR_BOT + 0.8, FRONT_Z + 0.11),
      sdf.box([1.12, 0.11, 0.11], 0.02).at(DOOR_X, DOOR_BOT + DOOR_H + 0.1, FRONT_Z + 0.11),
    );
    const winFrame = sdf
      .extrude(profile.rect([WIN_SIZE + 0.18, WIN_SIZE + 0.18], 0.025), 0.1, 0.015)
      .subtract(sdf.extrude(profile.rect([WIN_SIZE, WIN_SIZE], 0.01), 0.4))
      .at(WIN_X, WIN_CY, FRONT_Z + 0.1);
    const mullions = sdf.union(
      sdf.box([WIN_SIZE, 0.045, 0.05], 0.012).at(WIN_X, WIN_CY, FRONT_Z + 0.14),
      sdf.box([0.045, WIN_SIZE, 0.05], 0.012).at(WIN_X, WIN_CY, FRONT_Z + 0.14),
    );
    const ridgeBoard = sdf.box([0.16, 0.1, ROOF_LEN + 0.04], 0.02).at(0, APEX_Y - 0.05, 0);
    k.body(
      'trim',
      sdf
        .union(doorFrame, winFrame, mullions, ridgeBoard)
        .paintFn((x, y, z, base) => mixRgb(base, C.cutDark, 0.3 * (0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2, 71)))),
      {
        color: C.cut,
        roughness: 0.85,
        detail: 0.018,
        maxError: 0.006,
        maxTriangles: 1300,
        textureDensity: 2,
        bump: (x, y, z) => 0.0018 * noise.fbm(x * 22, y * 6, z * 22, 2, 13),
      },
    );

    // ---------------------------------------------------------------- door + shutters
    const door = sdf
      .extrude(profile.rect([DOOR_W, DOOR_H], 0.02), 0.1, 0.012)
      .at(DOOR_X, DOOR_CY, FRONT_Z + 0.09);
    k.body('door', door.paintFn(doorPlankPaint), {
      color: C.bark,
      roughness: 0.8,
      detail: 0.012,
      maxError: 0.004,
      maxTriangles: 900,
      textureDensity: 2,
      bump: doorPlankBump,
    });

    const shutter = sdf
      .union(
        sdf.box([0.3, WIN_SIZE + 0.08, 0.045], 0.015).at(WIN_X - WIN_SIZE / 2 - 0.2, WIN_CY, FRONT_Z + 0.09),
        sdf.box([0.3, WIN_SIZE + 0.08, 0.045], 0.015).at(WIN_X + WIN_SIZE / 2 + 0.2, WIN_CY, FRONT_Z + 0.09),
      )
      .paintFn(shutterPaint);
    k.body('shutters', shutter, {
      color: C.barkDark,
      roughness: 0.8,
      detail: 0.014,
      maxError: 0.005,
      maxTriangles: 700,
      bump: doorPlankBump,
    });

    // ---------------------------------------------------------------- iron fittings
    const iron = sdf.union(
      sdf.box([0.34, 0.055, 0.025], 0.01).at(DOOR_X, 0.52, FRONT_Z + 0.15),
      sdf.box([0.34, 0.055, 0.025], 0.01).at(DOOR_X, 1.24, FRONT_Z + 0.15),
      sdf.ellipsoid([0.035, 0.035, 0.018]).at(DOOR_X + 0.26, 0.88, FRONT_Z + 0.15),
      sdf.torus(0.05, 0.013).rotateX(90).at(DOOR_X + 0.26, 0.83, FRONT_Z + 0.16),
    );
    k.body('iron', iron, { color: C.iron, roughness: 0.55, metalness: 0.7, detail: 0.008, maxError: 0.003, maxTriangles: 500 });

    // ---------------------------------------------------------------- window glass (warm from inside)
    const glass = sdf.extrude(profile.rect([WIN_SIZE - 0.02, WIN_SIZE - 0.02], 0.01), 0.06).at(WIN_X, WIN_CY, FRONT_Z + 0.08);
    k.body('glass', glass, {
      color: C.void,
      roughness: 0.2,
      emissive: C.glow,
      emissiveIntensity: 0.35,
      detail: 0.02,
      maxTriangles: 120,
    });

    // ---------------------------------------------------------------- flue glow
    const flue = sdf.cylinder(0.07, 0.03, 0.0).at(CH_X, 2.615, CH_Z);
    k.body('flue-glow', flue, {
      color: C.emberBase,
      roughness: 0.6,
      emissive: C.ember,
      emissiveIntensity: 2.2,
      detail: 0.01,
    });

    // ---------------------------------------------------------------- ferns
    const ferns = sdf
      .union(fernShape(1).at(-1.24, 0, 1.26), fernShape(2).scale(0.8).at(1.3, 0, 1.32))
      .paintFn(fernPaint);
    k.body('ferns', ferns, {
      color: C.fernLight,
      roughness: 0.8,
      detail: 0.016,
      maxError: 0.005,
    });
  },
});
