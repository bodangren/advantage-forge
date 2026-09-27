import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — garden shed (architecture/structure/shed).
 *
 * Role: village garden shed, a background landmark that must read at 128 px.
 * Size: walls 1.8 m wide (X) by 1.5 m deep (Z); 2.0 m to the high roof. On y = 0, faces +Z.
 * One idea: a honey-oak plank box under one fat shingle slope, with a round door and a leaning rake.
 * Shape language: square sturdy walls, soft bevels, one sloping roof (the triangle).
 * Palette: honey oak #b5814a walls, pale cut wood #c9a06a roof, warm brown #8a5a35 door,
 *   dark walnut #6b4226 trim, iron #4a4f55 latch, leaf #5cb85c tufts. Accent: the iron latch.
 * Materials: wall wood, roof wood, door wood, walnut trim, pale wood, iron, glass, grass.
 * Detail: plank courses, lapped shingles, arched door + latch, tiny window, rake, grass tufts.
 * Rig: none.
 */

const W = 1.8;
const D = 1.5;
const FRONT = D / 2; // 0.75

// Wall crown: low at the front, high at the back. y = CROWN_0 - CROWN_K * z.
const CROWN_0 = 1.52;
const CROWN_K = 0.4;
const DOOR_X = -0.36;
const DOOR_HALF = 0.25;
const DOOR_BOT = 0.055;
const DOOR_SPRING = 0.66;

const WIN_X = 0.34;
const WIN_Y = 0.72;
const WIN_W = 0.2;
const WIN_H = 0.16;

const SLOPE_DEG = 24;
const SLOPE = (SLOPE_DEG * Math.PI) / 180;
const COS = Math.cos(SLOPE);
const SIN = Math.sin(SLOPE);
const ROOF_BACK_Z = -0.86;
const ROOF_BACK_YC = 1.9; // slab-center height at the back edge; front stays seated, peak near 2.0 m

const C = {
  oak: rgb('#b5814a'),
  brown: rgb('#8a5a35'),
  pale: rgb('#c9a06a'),
  walnut: rgb('#6b4226'),
  walnutDeep: rgb('#3a2418'),
  straw: rgb('#e0bb60'),
  iron: rgb('#4a4f55'),
  ironDark: rgb('#363a3f'),
  ironHi: rgb('#a8acb1'),
  leaf: rgb('#5cb85c'),
  leafDark: rgb('#3d7a3c'),
  glass: rgb('#2a2218'),
  glow: rgb('#e8a060'),
};

const sstep = (e0: number, e1: number, v: number): number => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** 1 at an integer boundary, 0 at the middle of a course. */
const grooveAt = (f: number) => Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 4);

/** Plane that keeps the wall below the sloping crown. Offset is along the unit normal. */
const crownCap = (() => {
  const len = Math.hypot(1, CROWN_K);
  return sdf.halfSpace([0, 1 / len, CROWN_K / len], CROWN_0 / len);
})();

/** Arched outline in XY: rectangle of half-width `halfW`, half-round top at `spring`. */
const archProfile = (halfW: number, bot: number, spring: number) => {
  const pts: [number, number][] = [
    [-halfW, bot],
    [halfW, bot],
  ];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI * i) / n;
    pts.push([halfW * Math.cos(a), spring + halfW * Math.sin(a)]);
  }
  return profile.polygon(pts);
};

/** Horizontal plank color: per-course tint, a dark joint, grain, a damp foot. */
const wallPaint = (x: number, y: number, z: number): Rgb => {
  const course = 0.26;
  const f = y / course - Math.floor(y / course);
  const board = noise.random(Math.floor(y / course), 4);
  const grain = 0.5 + 0.5 * noise.fbm(x * 6, y * 1.4, z * 6, 2);
  let c = mixRgb(C.oak, C.brown, 0.18 + 0.28 * board);
  c = mixRgb(c, C.pale, 0.05 * grain);
  c = mixRgb(c, C.walnut, 0.62 * grooveAt(f));
  c = mixRgb(c, C.walnut, 0.2 * (1 - sstep(0.02, 0.32, y)));
  const moss = (1 - sstep(0.02, 0.16, y)) * sstep(0.55, 0.78, 0.5 + 0.5 * noise.fbm(x * 7, z * 7, 2, 2));
  c = mixRgb(c, C.leafDark, 0.4 * moss);
  return c;
};

const wallBump = (x: number, y: number, z: number) => {
  const f = y / 0.26 - Math.floor(y / 0.26);
  return -0.004 * grooveAt(f) + 0.0016 * noise.fbm(x * 16, y * 3, z * 16, 2);
};

/** Distance down the roof slope from the back edge, in meters. */
const downSlope = (y: number, z: number) => (z - ROOF_BACK_Z) * COS + (ROOF_BACK_YC - y) * SIN;

const shinglePaint = (x: number, y: number, z: number): Rgb => {
  const s = downSlope(y, z);
  const rowH = 0.2;
  const colW = 0.3;
  const row = Math.floor(s / rowH);
  const f = s / rowH - row;
  const u = x / colW + (row % 2) * 0.5;
  const g = u - Math.floor(u);
  const seam = Math.max(grooveAt(f), grooveAt(g) * 0.85);
  const tint = noise.random(row * 5 + Math.floor(u) + 2, 9);
  let c = mixRgb(C.pale, C.straw, 0.28);
  c = mixRgb(c, C.oak, 0.16 + 0.28 * tint);
  c = mixRgb(c, C.straw, 0.1 * (1 - f));
  c = mixRgb(c, C.brown, 0.45 * seam);
  return c;
};

const shingleBump = (x: number, y: number, z: number) => {
  const s = downSlope(y, z);
  const rowH = 0.2;
  const f = s / rowH - Math.floor(s / rowH);
  const ramp = f < 0.84 ? f / 0.84 : (1 - f) / 0.16;
  const row = Math.floor(s / rowH);
  const u = x / 0.3 + (row % 2) * 0.5;
  const g = u - Math.floor(u);
  const col = g < 0.07 || g > 0.93 ? -0.0035 : 0;
  return 0.009 * ramp + col;
};

/** A point on the roof slab center line, `t` meters down the slope from the back edge. */
const onSlope = (t: number, lift = 0): [number, number] => [
  ROOF_BACK_YC - t * SIN + lift * COS,
  ROOF_BACK_Z + t * COS + lift * SIN,
];

/** A grass tuft, flat on y = 0, centred on the origin before `.at`. */
const tuft = (scale: number, seed: number) => {
  const lumps = [sdf.ellipsoid([0.13 * scale, 0.07 * scale, 0.11 * scale]).at(0, 0.05 * scale, 0)];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + seed;
    lumps.push(
      sdf
        .ellipsoid([0.07 * scale, 0.1 * scale, 0.055 * scale])
        .at(Math.cos(a) * 0.09 * scale, 0.07 * scale, Math.sin(a) * 0.08 * scale),
    );
  }
  return sdf.smoothUnion(0.028 * scale, ...lumps).intersect(sdf.halfSpace([0, -1, 0], 0));
};

const grassPaint = (x: number, y: number, z: number): Rgb => {
  const tip = sstep(0.02, 0.14, y);
  const patch = 0.5 + 0.5 * noise.fbm(x * 5, y * 4, z * 5, 2);
  let c = mixRgb(C.leafDark, C.leaf, 0.35 + 0.5 * patch);
  c = mixRgb(c, C.straw, 0.28 * tip * patch);
  return c;
};

export default defineAsset({
  name: 'shed',
  description:
    'Small garden shed: honey-oak plank walls, a single-slope shingle roof, a plank door with an iron latch, a tiny window, and a rake leaning by the door.',
  detail: 0.016,
  reference: 'docs/item-mockups/shed-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- walls
    const bands = [];
    const bandYs = [0.18, 0.46, 0.74, 1.02, 1.3, 1.56, 1.8];
    for (const y of bandYs) {
      bands.push(sdf.box([1.68, 0.16, 0.07], 0.022).at(0, y, FRONT + 0.01));
      bands.push(sdf.box([1.68, 0.16, 0.07], 0.022).at(0, y, -FRONT - 0.01));
      bands.push(sdf.box([0.07, 0.16, 1.38], 0.022).at(W / 2 + 0.01, y, 0));
      bands.push(sdf.box([0.07, 0.16, 1.38], 0.022).at(-W / 2 - 0.01, y, 0));
    }
    const doorHole = sdf
      .extrude(archProfile(DOOR_HALF + 0.045, 0.02, DOOR_SPRING), 0.5, 0.008)
      .at(DOOR_X, 0, FRONT + 0.02);
    const winHole = sdf.box([WIN_W + 0.06, WIN_H + 0.06, 0.46], 0.015).at(WIN_X, WIN_Y, FRONT + 0.02);
    const wallMass = sdf
      .box([W, 2.0, D], 0.04)
      .at(0, 1.0, 0)
      .union(...bands)
      .intersect(crownCap)
      .subtract(doorHole, winHole)
      .paintFn(wallPaint)
      .paintWhere(
        sdf.extrude(archProfile(DOOR_HALF + 0.04, 0.01, DOOR_SPRING), 0.28).at(DOOR_X, 0, 0.6),
        C.walnutDeep,
      )
      .paintWhere(sdf.box([WIN_W + 0.04, WIN_H + 0.04, 0.28]).at(WIN_X, WIN_Y, 0.6), C.walnutDeep);

    k.body('walls', wallMass, {
      color: C.oak,
      roughness: 0.84,
      detail: 0.022,
      maxError: 0.012,
      bump: wallBump,
    });

    // ---------------------------------------------------------------- roof
    // One slab seats on the walls. Three rows of pillows sit on it and lap downhill.
    // One solid slope. Overlapping courses opened a crack once the mesh was reduced.
    // Shingle rows live in paint and bump, which stay sharp on the atlas.
    const [roofY, roofZ] = onSlope(0.95, 0.02);
    const [ridgeY, ridgeZ] = onSlope(0.12, 0.06);
    const roof = sdf
      .smoothUnion(
        0.02,
        sdf.box([2.02, 0.3, 1.88], 0.04).rotateX(SLOPE_DEG).at(0, roofY, roofZ),
        sdf.box([2.06, 0.12, 0.22], 0.048).rotateX(SLOPE_DEG).at(0, ridgeY, ridgeZ),
      )
      .paintFn(shinglePaint);

    k.body('roof', roof, {
      color: C.pale,
      roughness: 0.82,
      detail: 0.028,
      maxError: 0.01,
      textureDensity: 1.4,
      bump: shingleBump,
    });

    // ---------------------------------------------------------------- trim (walnut posts, sill, door frame)
    const post = (x: number, z: number, h: number) => sdf.box([0.12, h, 0.12], 0.026).at(x, h / 2, z);
    const posts = sdf.union(
      post(-0.86, 0.71, 1.16),
      post(0.86, 0.71, 1.16),
      post(-0.86, -0.71, 1.74),
      post(0.86, -0.71, 1.74),
    );
    const sill = sdf.box([2.02, 0.08, 1.72], 0.022).at(0, 0.04, 0);
    const doorFrame = sdf
      .extrude(archProfile(DOOR_HALF + 0.1, 0.0, DOOR_SPRING), 0.1, 0.016)
      .subtract(sdf.extrude(archProfile(DOOR_HALF + 0.03, -0.02, DOOR_SPRING), 0.4))
      .at(DOOR_X, 0, FRONT + 0.03);

    k.body('trim', sdf.union(posts, sill, doorFrame), {
      color: C.walnut,
      roughness: 0.82,
      detail: 0.014,
      maxError: 0.005,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 14, y * 4, z * 14, 2),
    });

    // ---------------------------------------------------------------- door
    const doorPaint = (x: number, y: number, z: number): Rgb => {
      const f = (x - DOOR_X) / 0.085 - Math.floor((x - DOOR_X) / 0.085);
      const board = noise.random(Math.floor((x - DOOR_X) / 0.085), 2);
      const grain = 0.5 + 0.5 * noise.fbm(x * 4, y * 14, 1, 2);
      let c = mixRgb(C.brown, C.walnut, 0.15 + 0.3 * board);
      c = mixRgb(c, C.pale, 0.08 * grain);
      c = mixRgb(c, C.walnutDeep, 0.55 * grooveAt(f));
      return c;
    };
    const door = sdf
      .extrude(archProfile(DOOR_HALF, DOOR_BOT, DOOR_SPRING), 0.07, 0.012)
      .at(DOOR_X, 0, FRONT + 0.045)
      .paintFn(doorPaint);

    k.body('door', door, {
      color: C.brown,
      roughness: 0.8,
      detail: 0.012,
      maxError: 0.004,
      textureDensity: 1.6,
      bump: (x, y) => -0.003 * grooveAt((x - DOOR_X) / 0.085 - Math.floor((x - DOOR_X) / 0.085)) + 0.001 * noise.fbm(x * 8, y * 18, 0, 2),
    });

    // ---------------------------------------------------------------- pale wood (window frame, threshold)
    const windowFrame = sdf
      .box([WIN_W + 0.12, WIN_H + 0.12, 0.06], 0.016)
      .subtract(sdf.box([WIN_W, WIN_H, 0.12]))
      .at(WIN_X, WIN_Y, FRONT + 0.035);
    const mullions = sdf.union(
      sdf.box([WIN_W + 0.02, 0.022, 0.025], 0.006).at(WIN_X, WIN_Y, FRONT + 0.055),
      sdf.box([0.022, WIN_H + 0.02, 0.025], 0.006).at(WIN_X, WIN_Y, FRONT + 0.055),
    );
    const threshold = sdf.box([0.64, 0.055, 0.12], 0.014).at(DOOR_X, 0.028, FRONT + 0.09);

    k.body('pale-wood', sdf.union(windowFrame, mullions, threshold), {
      color: C.pale,
      roughness: 0.8,
      detail: 0.012,
      maxError: 0.004,
      textureDensity: 1.5,
    });

    // ---------------------------------------------------------------- glass
    k.body('glass', sdf.box([WIN_W - 0.02, WIN_H - 0.02, 0.018], 0.004).at(WIN_X, WIN_Y, FRONT - 0.01), {
      color: C.glass,
      roughness: 0.15,
      metalness: 0.05,
      emissive: C.glow,
      emissiveIntensity: 0.45,
      detail: 0.012,
      maxError: 0.004,
    });

    // ---------------------------------------------------------------- iron (hinges, latch, rake head)
    const hinge = (y: number) =>
      sdf.box([0.4, 0.05, 0.03], 0.012).at(DOOR_X - 0.1, y, FRONT + 0.085);
    const latch = sdf.union(
      sdf.box([0.2, 0.055, 0.032], 0.012).at(DOOR_X + DOOR_HALF + 0.02, 0.55, FRONT + 0.092),
      sdf.box([0.05, 0.1, 0.032], 0.012).at(DOOR_X + DOOR_HALF + 0.1, 0.55, FRONT + 0.078),
      sdf.box([0.042, 0.042, 0.045], 0.012).at(DOOR_X + DOOR_HALF - 0.04, 0.55, FRONT + 0.105),
    );
    const headX = 0.7;
    const headY = 1.02;
    const headZ = 0.82;
    const tines = [];
    for (let i = 0; i < 5; i++) {
      const x = headX - 0.12 + i * 0.06;
      tines.push(sdf.capsule([x, headY - 0.01, headZ + 0.01], [x, headY - 0.1, headZ + 0.13], 0.014));
    }
    const rakeHead = sdf.union(
      sdf.box([0.32, 0.048, 0.046], 0.014).at(headX, headY, headZ),
      ...tines,
    );
    const iron = sdf
      .union(hinge(0.34), hinge(0.74), latch, rakeHead)
      .paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 11, y * 11, z * 11, 2);
        let c = mixRgb(C.iron, C.ironDark, 0.4 * n);
        c = mixRgb(c, C.ironHi, 0.22 * (1 - n));
        return c;
      });

    k.body('iron', iron, {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.013,
      maxError: 0.007,
    });

    // ---------------------------------------------------------------- rake handle
    const handleR = 0.032;
    k.body(
      'rake-handle',
      sdf.capsule([0.78, handleR, 1.08], [0.66, headY - 0.02, headZ - 0.01], handleR).paintFn((x, y, z) => {
        const grain = 0.5 + 0.5 * noise.fbm(x * 3, y * 18, z * 3, 2);
        return mixRgb(C.pale, C.brown, 0.18 + 0.2 * grain);
      }),
      {
        color: C.pale,
        roughness: 0.78,
        detail: 0.014,
        maxError: 0.005,
      },
    );

    // ---------------------------------------------------------------- grass
    const grass = sdf
      .union(
        tuft(1.15, 0.4).at(-0.82, 0, 1.0),
        tuft(0.9, 1.2).at(-0.15, 0, 1.06),
        tuft(0.85, 1.7).at(0.22, 0, 1.0),
        tuft(1.0, 2.4).at(1.06, 0, 0.42),
        tuft(0.75, 3.1).at(-1.04, 0, -0.1),
        tuft(0.7, 4.2).at(0.5, 0, -0.98),
      )
      .paintFn(grassPaint);

    k.body('grass', grass, {
      color: C.leaf,
      roughness: 0.88,
      detail: 0.022,
      maxError: 0.012,
    });
  },
});
