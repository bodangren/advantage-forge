import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * meadow-ground — 2 x 2 m modular meadow tile (architecture/landscape-parts/meadow-ground).
 *
 * Role: sunny meadow ground cell that butts against the other 2 m hamlet tiles; seen whole in
 *   forest-quest_001.jpg, styled like the chibi-quest treatment (round, soft, cheerful).
 * Size: 2 x 0.05 x 2 m, bottom on y = 0, top at y = 0.05, square edges at x = ±1, z = ±1.
 *   No rig. Soft lumps on the top fade to zero at the edges so repeats stay seamless.
 * The one idea: a bright grass "cookie" with an earth-brown base peeking out under the rim,
 *   chunky rounded tufts ringing the edge, and tiny daisies tucked between them.
 * Shape language: round and soft (friendly tufts, lumps) on a square modular slab.
 * Palette (contract): grass #7ec850 dominant with #4a8a3f shade patches and pale lime flecks;
 *   earth rim #8a5a35 / #5f3d22; flowers as light accents #f4efe2 (white) and #f2c14e (yellow)
 *   with orange hearts #e8912e. Squint: mid-green mass, dark rim, light flower sparks.
 * Materials: grass slab (roughness 0.9), tufts (0.85), petals (0.55). No metal, no emissive.
 * Detail list: lumped slab with dirt rim (big), 12 clumps of plump teardrop tufts up to
 *   ~0.23 m tall (focal, medium), 5 daisies (small accent), painted variation + grass
 *   grain in bump (tertiary).
 * Rig/animation: none.
 */

const TOP = 0.05; // slab thickness, top surface height
const LUMP_AMP = 0.02; // max height of the soft lumps

// grass (contract palette)
const grassLight = rgb('#7ec850'); // dominant sunny green
const grassDark = rgb('#4a8a3f'); // shade patches
const grassSun = rgb('#a8d76c'); // pale sunlit flecks (matches grass-ground flecks)
// earth rim
const earth = rgb('#8a5a35');
const earthDeep = rgb('#5f3d22');
// flowers
const petalWhite = rgb('#f4efe2'); // soft white (no pure white)
const petalWhiteShade = rgb('#dcd2be');
const petalYellow = rgb('#f2c14e');
const petalYellowShade = rgb('#d9a13a');
const heartLit = rgb('#e8912e');
const heartDeep = rgb('#c96f22');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// ------------------------------------------------------------------ tiling noise
// Blend an fbm field across the 2 m tile so opposite painted edges match. Keeps the
// ground color and the lump heights seamless when tiles repeat.
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function tileNoise(x: number, z: number, frequency: number, octaves: number, seed = 0): number {
  const u = (x + 1) * 0.5;
  const v = (z + 1) * 0.5;
  const sample = (sx: number, sz: number) => noise.fbm(sx * frequency, 0, sz * frequency, octaves, seed);
  return lerp(
    lerp(sample(x, z), sample(x - 2, z), u),
    lerp(sample(x, z - 2), sample(x - 2, z - 2), u),
    v,
  );
}

// ------------------------------------------------------------------ lump field
// Gentle rounded lumps on the top only. The falloff keeps a flat margin at the rim so
// the square edges (x = ±1, z = ±1) stay exact for tiling. surfaceHeight is the same
// field the displacement uses, so tufts and flowers sit on the real surface.
const edgeFall = (x: number, z: number): number => {
  const e = Math.min(1 - Math.abs(x), 1 - Math.abs(z));
  return smooth(0.02, 0.22, e);
};

// The bilinear blend across the tile halves the fbm amplitude, so boost and clamp back
// into [-1, 1] to keep the lumps as chunky as the mock's.
const lumpField = (x: number, z: number): number => {
  const n = tileNoise(x, z, 2.2, 3, 3) * 1.7;
  return n < -1 ? -1 : n > 1 ? 1 : n;
};

const surfaceHeight = (x: number, z: number): number =>
  TOP + LUMP_AMP * lumpField(x, z) * edgeFall(x, z);

// ------------------------------------------------------------------ ground paint
// Green grass on top, earth-brown rim below a wavy boundary on the sides, like the mock's
// grass-over-dirt "cookie". Big sun/shade patches plus fine speckle, all tile-periodic.
function groundColorAt(x: number, y: number, z: number): Rgb {
  const rim = 0.025 + 0.006 * tileNoise(x, z, 3.1, 2, 7); // wavy grass/earth boundary
  const dirt = clamp01((rim - y) / 0.005); // 1 in the earth, 0 in the grass

  let c: Rgb;
  if (dirt > 0) {
    // Earth rim: warm brown, deepening toward the bottom, faint grain.
    const depth = clamp01((0.012 - y) / 0.014);
    c = mixRgb(earth, earthDeep, 0.35 + depth * 0.5);
    c = mixRgb(c, earthDeep, clamp01(tileNoise(x, z, 9, 2, 13)) * 0.25 * dirt);
    c = mixRgb(c, grassDark, (1 - dirt) * 0.7); // blend up into grass
  } else {
    const patch = tileNoise(x, z, 1.9, 3, 3); // big sun / shade patches
    const shade = clamp01((0.02 - patch) * 2.4);
    const sun = clamp01((patch - 0.05) * 2.2);
    const speck = tileNoise(x, z, 11, 2, 41);
    c = mixRgb(grassLight, grassDark, shade * 0.7);
    c = mixRgb(c, grassSun, sun * 0.45);
    c = mixRgb(c, grassSun, clamp01((speck - 0.14) * 2.2) * 0.22);
    // Slightly deeper green on the side faces so the slab reads as one mass.
    const side = clamp01((TOP - 0.006 - y) / 0.012) * (1 - clamp01((y - TOP + 0.004) / 0.004));
    c = mixRgb(c, grassDark, side * 0.35);
  }
  return c;
}

// Grass grain on the top only (the sides stay smooth for tiling).
const groundBump = (x: number, y: number, z: number): number =>
  0.0035 * tileNoise(x, z, 15, 2, 23) * edgeFall(x, z) * smooth(0.01, 0.03, y);

// ------------------------------------------------------------------ tufts
// Plump teardrop blades — oriented ellipsoids, like the mock's gumdrop tufts. One tall
// blade plus one smaller companion per clump. Bases are buried 0.03 m so the lumps never
// uncover them.
interface Blade {
  readonly base: readonly [number, number, number];
  readonly tip: readonly [number, number, number];
  readonly r: number;
}

const clump = (cx: number, cz: number, scale: number, seed: number): Blade[] => {
  const out: Blade[] = [];
  const baseY = surfaceHeight(cx, cz) - 0.03;
  for (let i = 0; i < 2; i++) {
    const center = i === 0;
    const leanDeg = center ? 2 + noise.random(i, seed, 1) * 5 : 14 + noise.random(i, seed, 2) * 16;
    const h =
      (center ? 0.14 + noise.random(i, seed, 3) * 0.06 : 0.08 + noise.random(i, seed, 4) * 0.04) *
      scale;
    const a = (i * 130 + seed * 47) * (Math.PI / 180);
    const lean = (leanDeg * Math.PI) / 180;
    const tip: [number, number, number] = [
      cx + Math.sin(lean) * h * Math.cos(a),
      baseY + Math.cos(lean) * h,
      cz + Math.sin(lean) * h * Math.sin(a),
    ];
    out.push({ base: [cx, baseY, cz], tip, r: (center ? 0.046 : 0.034) * scale });
  }
  return out;
};

// [x, z, scale] — four big corner clumps, four smaller hugging the edges, four inside.
const CLUMPS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.86, -0.84, 1.05],
  [0.84, 0.88, 1.05],
  [-0.88, 0.82, 0.95],
  [0.9, -0.86, 0.9],
  [0.05, 0.92, 0.8],
  [-0.92, -0.06, 0.85],
  [0.93, 0.08, 0.75],
  [-0.06, -0.93, 0.8],
  [-0.28, 0.26, 0.9],
  [0.36, -0.3, 0.85],
  [0.18, 0.44, 0.7],
  [-0.5, -0.45, 0.8],
];

const BLADES: Blade[] = CLUMPS.flatMap(([x, z, s], i) => clump(x, z, s, i * 13 + 3));

// One blade: an ellipsoid stretched along the base-to-tip axis, so every tuft ends in
// the mock's soft gumdrop round while the buried base tapers in.
const bladeShape = (b: Blade): Sdf => {
  const dx = b.tip[0] - b.base[0];
  const dy = b.tip[1] - b.base[1];
  const dz = b.tip[2] - b.base[2];
  const len = Math.hypot(dx, dy, dz);
  const az = Math.atan2(dz, dx); // lean direction in the XZ plane
  const leanDeg = (Math.acos(Math.min(1, Math.max(-1, dy / len))) * 180) / Math.PI;
  return sdf
    .ellipsoid([b.r, len * 0.54, b.r])
    .rotateZ(-leanDeg) // tilt +Y toward +X by the lean angle
    .rotateY((-az * 180) / Math.PI) // carry the tilt around to the lean direction
    .at(
      (b.base[0] + b.tip[0]) / 2,
      (b.base[1] + b.tip[1]) / 2,
      (b.base[2] + b.tip[2]) / 2,
    );
};

// Darker where a blade sinks into the grass, otherwise lighter than the ground like the
// mock's sunlit tufts.
function tuftColorAt(x: number, y: number, z: number): Rgb {
  const n = 0.5 + 0.5 * noise.fbm(x * 24, y * 24, z * 24, 2, 9);
  let c = mixRgb(grassDark, grassLight, clamp01((y - 0.02) / 0.14) * (0.7 + n * 0.3));
  c = mixRgb(c, grassSun, clamp01((y - 0.12) / 0.07) * (0.35 + n * 0.3));
  c = mixRgb(c, grassDark, clamp01((surfaceHeight(x, z) - 0.004 - y) / 0.02) * 0.5);
  return c;
}

// ------------------------------------------------------------------ flowers
// Tiny five-petal daisies lying in the grass: white and yellow, domed orange heart.
// Petals are plump chunky ellipsoids — thick enough to mesh coarse (2+ cells) and close
// to the mock's toy-like petals.
// [x, z, size, kind] — kind 0 = white, 1 = yellow. Five daisies, like the mock.
const FLOWERS: ReadonlyArray<readonly [number, number, number, 0 | 1]> = [
  [-0.5, 0.52, 1.0, 0],
  [0.58, 0.22, 0.9, 0],
  [-0.14, -0.64, 1.0, 0],
  [0.14, 0.62, 0.9, 1],
  [-0.64, -0.16, 0.85, 1],
];

function flowerHead(i: number): Sdf {
  const [fx, fz, size] = FLOWERS[i]!;
  const R = 0.078 * size; // petal tip radius
  const rot = noise.random(i, 33, 7) * 72; // random petal phase
  const y0 = surfaceHeight(fx, fz) + 0.008; // lifted so the head sits on the grass
  const petals: Sdf[] = [];
  for (let p = 0; p < 5; p++) {
    const a = ((p * 72 + rot) * Math.PI) / 180;
    const d = R * 0.58; // petal center distance
    petals.push(
      sdf
        .ellipsoid([R * 0.48, 0.012, R * 0.24])
        .rotateY((-a * 180) / Math.PI)
        .at(fx + Math.cos(a) * d, y0, fz + Math.sin(a) * d),
    );
  }
  const heart = sdf.sphere(0.019 * size).at(fx, y0, fz);
  return sdf.union(...petals, heart);
}

function flowerColorAt(x: number, y: number, z: number): Rgb {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < FLOWERS.length; i++) {
    const d = Math.hypot(x - FLOWERS[i]![0], z - FLOWERS[i]![1]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  const [, , size, kind] = FLOWERS[best]!;
  const heartR = 0.022 * size;
  if (bestD < heartR) return mixRgb(heartLit, heartDeep, clamp01(bestD / heartR));
  const petal = kind === 0 ? petalWhite : petalYellow;
  const shade = kind === 0 ? petalWhiteShade : petalYellowShade;
  const n = 0.5 + 0.5 * noise.fbm(x * 55, y * 55, z * 55, 2, 5);
  let c = mixRgb(petal, shade, (1 - n) * 0.35);
  // Slightly darker where the head sinks into the grass.
  c = mixRgb(c, grassDark, clamp01((surfaceHeight(x, z) + 0.006 - y) / 0.01) * 0.45);
  return c;
}

// ------------------------------------------------------------------ asset
export default defineAsset({
  name: 'meadow-ground',
  description:
    'A 2 m square modular meadow tile: bright grass over an earth rim, soft lumps, chunky grass tufts and tiny white and yellow daisies.',
  detail: 0.02,
  reference: 'docs/item-mockups/meadow-ground-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Slab: 2 x 0.05 x 2 m with soft lumps on top, trimmed back to the exact square
    // footprint so the edges at x = ±1, z = ±1 stay flush for tiling.
    const slab = sdf
      .box([2, TOP, 2])
      .at(0, TOP / 2, 0)
      .displace(LUMP_AMP, (x, y, z) => lumpField(x, z) * edgeFall(x, z) * smooth(0.012, 0.03, y))
      .intersect(sdf.box([2, TOP, 2]).at(0, TOP / 2, 0));

    k.body('ground', slab.paintFn(groundColorAt), {
      color: '#7ec850',
      roughness: 0.9,
      metalness: 0,
      detail: 0.02,
      maxTriangles: 2200,
      // Tight error budget: the soft lumps are 1-2 cm of real form, so the simplifier
      // must not flatten the top into a plate (its error check is skipped when
      // maxTriangles is set).
      maxError: 0.0015,
      textureDensity: 2,
      bump: groundBump,
    });

    // Chunky tufts ringing the edge and scattered inside — the focal dressing.
    const tufts = sdf.smoothUnion(0.01, ...BLADES.map(bladeShape));
    k.body('tufts', tufts.paintFn(tuftColorAt), {
      color: '#4a8a3f',
      roughness: 0.85,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 2200,
      maxError: 0.003,
      paintWeight: 2,
    });

    // Tiny daisies tucked between the tufts. No hard triangle cap: the coarse cell size
    // keeps the count low and a gentle maxError reduces what it safely can.
    const flowers = sdf.union(...FLOWERS.map((_, i) => flowerHead(i)));
    k.body('flowers', flowers.paintFn(flowerColorAt), {
      color: '#f4efe2',
      roughness: 0.55,
      metalness: 0,
      detail: 0.01,
      maxError: 0.003,
      textureDensity: 2,
    });
  },
});
