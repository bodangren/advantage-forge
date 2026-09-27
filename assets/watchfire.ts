import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * Design note — camp watchfire (props/world/watchfire).
 *
 * Role: forest-clearing landmark. It must read at 128 px as the warm focal point.
 * Size: 1.0 m wide. Flames rise 0.8 m. It stands on y = 0 and faces +Z.
 * One idea: a tall tepee of split logs in a stone ring, with a fat flame column
 * and a clay pot hung over the coals.
 * Shape language: triangular dominant (tepee, tongues, tripod). Round secondary
 * (stones, pot, log ends).
 * Palette: stone #8a94a0, bark #6b4226 / #8a5a35, cut wood #e4c48a, clay #c17a4a,
 * iron #3a424c. Flame emissive #ff6a12. Core emissive #ffb030. Dark glow bases.
 * Materials: stone, wood, iron, clay, embers, flames, flame core.
 * Detail: ring and tepee first, pot and tripod second, flames as the focal point.
 * Rig: none.
 */

const STONE = rgb('#8a94a0');
const STONE_DARK = rgb('#5c6672');
const STONE_DEEP = rgb('#3e4650');
const STONE_LIGHT = rgb('#c5ced8');
const MOSS = rgb('#3f9248');
const MOSS_DARK = rgb('#2f7a3f');

const BARK = rgb('#8a5a35');
const BARK_DARK = rgb('#5f3d22');
const BARK_DEEP = rgb('#3a2416');
const BARK_LIGHT = rgb('#a4713f');
const CUT = rgb('#d4b07a');
const CUT_LIGHT = rgb('#f0dcb0');
const CUT_RING = rgb('#a87d4b');
const CHAR = rgb('#24160e');

const IRON = rgb('#3a424c');
const IRON_LIGHT = rgb('#7a8494');
const RUST = rgb('#7a4a2c');
const SOOT = rgb('#1c2128');
const FIRE_LIT = rgb('#c46a32');

const CLAY = rgb('#c17a4a');
const CLAY_DARK = rgb('#7a4630');
const CLAY_LIGHT = rgb('#e4b888');
const CLAY_SOOT = rgb('#4a2a1c');

const FLAME = '#ff6a12';
const CORE = '#ffb030';
const EMBER = '#ff6a12';
const BASE_DARK = '#4a1405';
const CORE_DARK = '#3a1206';

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale3 = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const norm = (a: Vec3): Vec3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

// ------------------------------------------------------------------ stones
// Eight flattened cobbles form a 1.0 m ring. Front stones sit lower so the
// coal bed shows. One loose pebble breaks the circle.

type StoneDef = { deg: number; rad: number; rx: number; ry: number; rz: number; tilt: number };

const STONES: StoneDef[] = [
  { deg: 16, rad: 0.345, rx: 0.145, ry: 0.05, rz: 0.11, tilt: 3 },
  { deg: 58, rad: 0.34, rx: 0.135, ry: 0.038, rz: 0.1, tilt: -2 },
  { deg: 108, rad: 0.338, rx: 0.138, ry: 0.036, rz: 0.102, tilt: 2 },
  { deg: 156, rad: 0.35, rx: 0.148, ry: 0.052, rz: 0.112, tilt: -4 },
  { deg: 204, rad: 0.342, rx: 0.132, ry: 0.048, rz: 0.1, tilt: 3 },
  { deg: 250, rad: 0.355, rx: 0.15, ry: 0.054, rz: 0.108, tilt: -3 },
  { deg: 294, rad: 0.348, rx: 0.14, ry: 0.05, rz: 0.105, tilt: 4 },
  { deg: 340, rad: 0.346, rx: 0.142, ry: 0.051, rz: 0.11, tilt: -2 },
];

const stoneShape = (s: StoneDef): Sdf => {
  const a = (s.deg * Math.PI) / 180;
  return sdf
    .ellipsoid([s.rx, s.ry, s.rz])
    .rotateY(-s.deg + (noise.random(s.deg, 2, 1) - 0.5) * 16)
    .rotateZ(s.tilt)
    .at(Math.cos(a) * s.rad, s.ry * 0.72, Math.sin(a) * s.rad);
};

const pebble = sdf.ellipsoid([0.042, 0.026, 0.036]).rotateY(24).at(0.47, 0.018, 0.14);

const stonePaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const n = noise.fbm(x * 5, y * 6, z * 5, 3, 4);
  const ang = Math.atan2(z, x);
  const slot = Math.round(((ang + Math.PI) / (Math.PI * 2)) * 8);
  const tone = noise.random(slot, 5, 2);
  let c = mixRgb(STONE_DARK, STONE, 0.28 + 0.55 * tone);
  c = mixRgb(c, STONE_LIGHT, clamp01((y - 0.04) / 0.035) * (0.2 + 0.4 * clamp01(0.3 + n)));
  c = mixRgb(c, STONE_DEEP, clamp01((0.022 - y) / 0.022) * 0.7);
  c = mixRgb(c, STONE_DARK, clamp01(n) * 0.18);
  const d = Math.hypot(x, z);
  const inner = clamp01((0.32 - d) / 0.1) * clamp01((y - 0.008) / 0.05);
  c = mixRgb(c, FIRE_LIT, 0.42 * inner * inner);
  const moss = clamp01((0.08 - Math.hypot(x - 0.01, y - 0.07, z + 0.39)) / 0.03);
  const top = clamp01((y - 0.045) / 0.025);
  if (moss * top > 0.01) {
    const mv = noise.fbm(x * 16, y * 16, z * 16, 2, 9);
    c = mixRgb(c, mixRgb(MOSS_DARK, MOSS, 0.35 + 0.65 * clamp01(mv)), moss * top);
  }
  return c;
};

// ------------------------------------------------------------------ logs
// Five split logs lean in above the coals. Outer ends show pale cut wood.
// A wide front gap holds the pot. Inner tips are charred.

type LogDef = {
  deg: number;
  baseR: number;
  baseY: number;
  tip: Vec3;
  r0: number;
  r1: number;
  seed: number;
};

const LOGS: LogDef[] = [
  { deg: 36, baseR: 0.38, baseY: 0.078, tip: [0.02, 0.5, 0.028], r0: 0.058, r1: 0.032, seed: 1 },
  { deg: 144, baseR: 0.39, baseY: 0.076, tip: [-0.018, 0.48, 0.022], r0: 0.054, r1: 0.03, seed: 2 },
  { deg: 202, baseR: 0.37, baseY: 0.08, tip: [0.028, 0.54, -0.016], r0: 0.056, r1: 0.032, seed: 3 },
  { deg: 258, baseR: 0.39, baseY: 0.082, tip: [-0.01, 0.58, -0.02], r0: 0.052, r1: 0.034, seed: 4 },
  { deg: 316, baseR: 0.38, baseY: 0.078, tip: [0.014, 0.5, 0.01], r0: 0.057, r1: 0.03, seed: 5 },
];

type LogFrame = LogDef & {
  base: Vec3;
  axis: Vec3;
  length: number;
  splitN: Vec3;
  splitOff: number;
  outN: Vec3;
};

const frames: LogFrame[] = LOGS.map((log) => {
  const a = (log.deg * Math.PI) / 180;
  const base: Vec3 = [Math.cos(a) * log.baseR, log.baseY, Math.sin(a) * log.baseR];
  const axis = norm(sub(log.tip, base));
  const length = len(sub(log.tip, base));
  const outward = norm([base[0], 0, base[2]]);
  const side = norm(cross(axis, [0, 1, 0]));
  const flip = log.seed % 2 === 0 ? 1 : -1;
  // Face direction, then strip the log-axis part so the cut runs along the log.
  let face = add(scale3(outward, 0.65), [0, 0.75, 0]);
  face = sub(face, scale3(axis, dot(face, axis)));
  const splitN = norm(add(face, scale3(side, 0.2 * flip)));
  const mid = scale3(add(base, log.tip), 0.5);
  // Shallow cap: a pale stripe on a still-round log, not a flat plank.
  const splitOff = dot(splitN, mid) + log.r0 * 0.5;
  const outN = norm(sub(base, log.tip));
  return { ...log, base, axis, length, splitN, splitOff, outN };
});

const splitLog = (f: LogFrame): Sdf => {
  const endOff = dot(f.outN, f.base) + 0.01;
  return sdf
    .cone(f.base, f.tip, f.r0, f.r1)
    .intersect(sdf.halfSpace(f.splitN, f.splitOff))
    .intersect(sdf.halfSpace(f.outN, endOff))
    .round(0.006);
};

const logPaint =
  (f: LogFrame) =>
  (x: number, y: number, z: number, _base: Rgb): Rgb => {
    const p: Vec3 = [x, y, z];
    const rel = sub(p, f.base);
    const along = dot(rel, f.axis);
    const radial = len(sub(rel, scale3(f.axis, along)));
    const tone = noise.random(f.seed, 3, 7);
    let c = mixRgb(BARK_DARK, BARK, 0.35 + 0.5 * tone);
    const g = noise.fbm(x * 6, y * 3.5, z * 6, 2, f.seed * 11);
    c = mixRgb(c, BARK_DEEP, clamp01((-g - 0.02) * 2.2) * 0.6);
    c = mixRgb(c, BARK_LIGHT, clamp01((g - 0.15) * 2) * 0.28);
    c = mixRgb(c, BARK_DEEP, clamp01((0.07 - y) / 0.07) * 0.3);

    const plane = dot(f.splitN, p) - f.splitOff;
    const onSplit = clamp01((0.01 - Math.abs(plane)) / 0.008);
    let face = mixRgb(CUT, CUT_LIGHT, 0.55 + 0.35 * clamp01((y - 0.1) / 0.3));
    const grain = Math.pow(0.5 + 0.5 * Math.sin(along * 46 + f.seed), 10);
    face = mixRgb(face, CUT_RING, grain * 0.55);
    c = mixRgb(c, face, onSplit * 0.94);

    const onEnd = clamp01((0.018 - along) / 0.012);
    const endFace = onEnd * clamp01((f.r0 * 0.8 - radial) / 0.014);
    if (endFace > 0.02) {
      const ring = Math.pow(0.5 + 0.5 * Math.cos(radial * 88), 6);
      let fc = mixRgb(CUT_LIGHT, CUT, 0.25);
      fc = mixRgb(fc, CUT_RING, ring * 0.8);
      fc = mixRgb(fc, CUT_RING, clamp01((0.014 - radial) / 0.014) * 0.5);
      c = mixRgb(c, fc, endFace);
    }
    c = mixRgb(c, BARK_DEEP, onEnd * clamp01((radial - f.r0 * 0.55) / 0.025) * 0.75);

    const toTip = f.length - along;
    const charW = clamp01((0.18 - toTip) / 0.14);
    c = mixRgb(c, CHAR, charW * 0.92);
    const heat = clamp01((0.2 - Math.hypot(x, z)) / 0.16) * clamp01((y - 0.1) / 0.18);
    c = mixRgb(c, FIRE_LIT, heat * 0.22 * (1 - charW));
    return c;
  };

// ------------------------------------------------------------------ flames
// Chubby cartoon tongues. The tallest rises 0.8 m (y = 0.10 to y = 0.90).
// A wide heart fills the tepee. Yellow cores sit proud of each tongue.

type Tongue = Array<[number, number, number, number]>;

const TONGUES: Tongue[] = [
  [
    [0.0, 0.16, 0.01, 0.085],
    [0.02, 0.38, 0.0, 0.062],
    [-0.012, 0.58, 0.012, 0.038],
    [0.01, 0.76, -0.006, 0.022],
    [0.0, 0.9, 0.0, 0.013],
  ],
  [
    [-0.03, 0.15, 0.03, 0.07],
    [-0.1, 0.32, 0.02, 0.05],
    [-0.13, 0.48, 0.015, 0.03],
    [-0.08, 0.64, 0.01, 0.015],
  ],
  [
    [0.04, 0.15, 0.02, 0.072],
    [0.11, 0.32, 0.0, 0.048],
    [0.12, 0.48, 0.018, 0.028],
    [0.07, 0.64, 0.008, 0.014],
  ],
  [
    [-0.01, 0.15, -0.04, 0.062],
    [-0.03, 0.32, -0.09, 0.04],
    [0.01, 0.48, -0.08, 0.022],
    [0.0, 0.6, -0.05, 0.012],
  ],
  [
    [0.02, 0.14, 0.08, 0.05],
    [0.04, 0.28, 0.11, 0.03],
    [0.01, 0.42, 0.09, 0.015],
  ],
];

const heart = sdf.ellipsoid([0.1, 0.08, 0.085]).at(0.0, 0.2, 0.015);

const flameBody = sdf.smoothUnion(
  0.028,
  heart,
  ...TONGUES.map((t) => sdf.chain(t, 0.022)),
  sdf.sphere(0.018).at(0.04, 0.78, 0.02),
  sdf.sphere(0.014).at(-0.08, 0.58, 0.03),
);

const corePoint = (x: number, y: number, z: number, r: number): [number, number, number, number] => {
  const l = Math.hypot(x, z) || 1;
  const lift = 0.42 * r + 0.012;
  return [x + (x / l) * lift, y + lift * 0.45, z + (z / l) * lift, Math.max(0.01, r * 0.6)];
};

const coreHeart = sdf.ellipsoid([0.055, 0.05, 0.05]).at(0.0, 0.22, 0.03);
const coreBody = sdf.smoothUnion(
  0.016,
  coreHeart,
  ...TONGUES.map((t) => sdf.chain(t.map((p) => corePoint(p[0], p[1], p[2], p[3])), 0.014)),
  sdf.sphere(0.016).at(0.0, 0.915, 0.014),
);

// ------------------------------------------------------------------ iron + pot
// Feet stand on the stone ring. The clay pot hangs over the front of the coals.

const APEX: Vec3 = [0.0, 0.96, 0.02];
const POT: Vec3 = [0.12, 0.32, 0.28];

const FEET: Vec3[] = [16, 164, 255].map((deg) => {
  const a = (deg * Math.PI) / 180;
  const rad = deg === 255 ? 0.36 : 0.38;
  return [Math.cos(a) * rad, 0.07, Math.sin(a) * rad];
});

const potOuter = sdf.revolve(
  profile.polygon(
    [
      [0.0, 0.0],
      [0.038, 0.0],
      [0.062, 0.012],
      [0.092, 0.04],
      [0.098, 0.078],
      [0.082, 0.108],
      [0.064, 0.118],
      [0.0, 0.122],
    ],
    { smooth: true, samples: 6 },
  ),
);
const potCavity = sdf.revolve(
  profile.polygon(
    [
      [0.0, 0.07],
      [0.04, 0.072],
      [0.058, 0.088],
      [0.06, 0.112],
      [0.04, 0.14],
      [0.0, 0.142],
    ],
    { smooth: true, samples: 5 },
  ),
);

const ironPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  let c = mixRgb(IRON, IRON_LIGHT, clamp01((y - 0.5) / 0.45) * 0.5);
  const rust = noise.fbm(x * 11, y * 6, z * 11, 2, 6);
  c = mixRgb(c, RUST, clamp01((rust - 0.05) * 2) * 0.38);
  c = mixRgb(c, SOOT, clamp01((0.18 - y) / 0.14) * 0.3);
  const heat = clamp01((0.28 - Math.hypot(x, y - 0.2, z)) / 0.28);
  c = mixRgb(c, FIRE_LIT, heat * heat * 0.28);
  return c;
};

const clayPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const dx = x - POT[0];
  const dy = y - POT[1];
  const dz = z - POT[2];
  const n = noise.fbm(x * 9, y * 9, z * 9, 2, 12);
  let c = mixRgb(CLAY_DARK, CLAY, 0.4 + 0.45 * clamp01(0.5 + n));
  c = mixRgb(c, CLAY_LIGHT, clamp01((dy - 0.06) / 0.04) * 0.55);
  c = mixRgb(c, CLAY_SOOT, clamp01((0.04 - dy) / 0.04) * 0.75);
  c = mixRgb(c, FIRE_LIT, clamp01((0.03 - dy) / 0.035) * clamp01((0.08 - Math.hypot(dx, dz)) / 0.05) * 0.45);
  return c;
};

export default defineAsset({
  name: 'watchfire',
  description:
    'Camp watchfire: a ring of rounded stones, a tepee of split logs, tall flames, glowing embers, and a cooking tripod with a small pot.',
  detail: 0.01,
  reference: 'docs/item-mockups/watchfire-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    k.body('stones', sdf.smoothUnion(0.02, ...STONES.map(stoneShape), pebble).paintFn(stonePaint), {
      color: '#8a94a0',
      roughness: 0.92,
      metalness: 0,
      detail: 0.02,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 20, y * 18, z * 20, 3, 2),
      maxError: 0.008,
      maxTriangles: 1400,
    });

    k.body('logs', sdf.union(...frames.map((f) => splitLog(f).paintFn(logPaint(f)))), {
      color: '#6b4226',
      roughness: 0.84,
      metalness: 0,
      detail: 0.016,
      paintWeight: 1,
      bump: (x, y, z) => 0.0026 * noise.fbm(x * 14, y * 7, z * 14, 3, 3),
      maxError: 0.007,
      maxTriangles: 1500,
    });

    const legs = FEET.map((foot) =>
      sdf.smoothUnion(
        0.014,
        sdf.cone(foot, APEX, 0.03, 0.016),
        sdf.sphere(0.034).scale([1.2, 0.55, 1.15]).at(foot[0], foot[1] - 0.006, foot[2]),
      ),
    );
    const knot = sdf.sphere(0.038).at(APEX[0], APEX[1], APEX[2]);
    const bailPeak: Vec3 = [POT[0], POT[1] + 0.2, POT[2] - 0.02];
    const hook = sdf.capsule(APEX, bailPeak, 0.014);
    const bail = sdf.chain(
      [
        [POT[0] - 0.078, POT[1] + 0.112, POT[2], 0.014],
        [bailPeak[0], bailPeak[1], bailPeak[2], 0.013],
        [POT[0] + 0.078, POT[1] + 0.112, POT[2], 0.014],
      ],
      0.01,
    );
    k.body('iron', sdf.smoothUnion(0.01, ...legs, knot, hook, bail).paintFn(ironPaint), {
      color: '#3a424c',
      roughness: 0.5,
      metalness: 0.78,
      detail: 0.008,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 36, y * 36, z * 36, 2, 8),
      maxTriangles: 720,
    });

    const pot = potOuter.subtract(potCavity).at(POT[0], POT[1], POT[2]);
    const rim = sdf.torus(0.074, 0.018).at(POT[0], POT[1] + 0.112, POT[2]);
    k.body('pot', sdf.smoothUnion(0.01, pot, rim).paintFn(clayPaint), {
      color: '#c17a4a',
      roughness: 0.78,
      metalness: 0,
      detail: 0.007,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 28, y * 18, z * 28, 2, 14),
      maxTriangles: 360,
    });

    const embers = sdf.union(
      sdf.ellipsoid([0.15, 0.03, 0.13]).at(0, 0.038, 0.01),
      sdf.sphere(0.042).at(0.05, 0.055, 0.04),
      sdf.sphere(0.036).at(-0.05, 0.05, 0.035),
      sdf.sphere(0.034).at(0.02, 0.052, -0.05),
      sdf.sphere(0.03).at(-0.03, 0.048, -0.04),
      sdf.sphere(0.028).at(0.08, 0.046, -0.01),
    );
    k.body('embers', embers, {
      color: BASE_DARK,
      roughness: 0.85,
      metalness: 0,
      emissive: EMBER,
      emissiveIntensity: 1.6,
      detail: 0.01,
      maxTriangles: 260,
    });

    k.body('flames', flameBody, {
      color: BASE_DARK,
      roughness: 0.3,
      metalness: 0,
      emissive: FLAME,
      emissiveIntensity: 1.8,
      detail: 0.009,
      maxTriangles: 920,
    });

    k.body('core', coreBody, {
      color: CORE_DARK,
      roughness: 0.24,
      metalness: 0,
      emissive: CORE,
      emissiveIntensity: 2.1,
      detail: 0.008,
      maxTriangles: 480,
    });
  },
});
