import { defineAsset, mixRgb, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * Wildflower patch for a cozy chibi meadow: 0.7 m across, 0.5 m tall, on y = 0, facing +Z.
 *
 * - Role: meadow set dressing; one cheerful clump that reads at 128 px.
 * - One idea: a fan of round flower heads that sprays out of one low green mound.
 * - Shape language: round (heads, mound) dominant; pointed blades as the secondary.
 * - Palette: greens #8ab52c mound, #4d8f42 leaf, #2c5f33 stems; flowers red #e2503c,
 *   yellow #f0a83a / #f7d060, white #f5f0e2; centers orange #f2a63a (focal contrast).
 * - Materials: matte foliage (roughness 0.82), soft matte petals (0.7), no metal.
 * - Detail: painted mound dots, 12 blades, 7 stems, 4 buds, 7 flower heads. Focal point:
 *   the big white head in the front center.
 * - Rig: none.
 */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const C = {
  mound: '#8ab52c',
  moundShade: '#6e9a24',
  stem: '#2c5f33',
  leafDark: '#2f6b35',
  leafMid: '#45833c',
  leafLight: '#6faa41',
  bud: '#3f7a3a',
  red: '#e2503c',
  amber: '#f0a83a',
  pale: '#f7d060',
  white: '#f5f0e2',
  centerOrange: '#f2a63a',
  centerYellow: '#f6c33c',
  centerRed: '#d94a2e',
  centerCream: '#f7efdc',
};

interface Flower {
  /** Head center position, meters. */
  readonly p: readonly [number, number, number];
  /** Head outer radius, meters. */
  readonly r: number;
  /** Petal count. */
  readonly n: number;
  readonly petal: string;
  readonly center: string;
  /** Euler pose of the head: faces +Z, tilted with X, splayed with Y. */
  readonly rot: readonly [number, number, number];
}

const FLOWERS: readonly Flower[] = [
  { p: [-0.055, 0.435, -0.13], r: 0.055, n: 7, petal: C.pale, center: C.centerRed, rot: [-16, -6, 4] },
  { p: [-0.175, 0.375, -0.06], r: 0.065, n: 7, petal: C.amber, center: C.centerCream, rot: [-10, -16, -6] },
  { p: [-0.235, 0.255, 0.07], r: 0.062, n: 6, petal: C.red, center: C.centerYellow, rot: [6, -18, 8] },
  { p: [0.0, 0.3, 0.13], r: 0.078, n: 7, petal: C.white, center: C.centerOrange, rot: [2, 0, 0] },
  { p: [0.125, 0.395, -0.03], r: 0.072, n: 7, petal: C.red, center: C.centerYellow, rot: [-12, 14, -4] },
  { p: [0.26, 0.375, -0.1], r: 0.058, n: 6, petal: C.pale, center: C.centerCream, rot: [-8, 20, 6] },
  { p: [0.235, 0.265, 0.08], r: 0.06, n: 6, petal: C.amber, center: C.centerRed, rot: [6, 18, -8] },
];

/** A round head: a ring of flattened petal ellipsoids, a center dome, posed in world space. */
const head = (f: Flower): Sdf => {
  const ring = f.r * 0.52;
  const petals = Array.from({ length: f.n }, (_, i) => {
    const a = (i * 360) / f.n;
    const rad = (a * Math.PI) / 180;
    return sdf
      .ellipsoid([f.r * 0.45, f.r * 0.38, f.r * 0.19])
      .rotateZ(a)
      .at(Math.cos(rad) * ring, Math.sin(rad) * ring, 0);
  });
  const centerDome = sdf.ellipsoid([f.r * 0.32, f.r * 0.32, f.r * 0.2]).at(0, 0, f.r * 0.05);
  const disc = sdf.smoothUnion(f.r * 0.2, ...petals).smoothUnion(f.r * 0.12, centerDome);
  const pose = (s: Sdf): Sdf => s.rotate(f.rot[0], f.rot[1], f.rot[2]).at(f.p[0], f.p[1], f.p[2]);
  return pose(disc)
    .paint(f.petal)
    .paintWhere(
      pose(sdf.ellipsoid([f.r * 0.38, f.r * 0.38, f.r * 0.3]).intersect(sdf.halfSpace([0, 0, -1], f.r * 0.1))),
      f.center,
      0.0015,
    );
};

/** One tapered stem from inside the mound up to a head center, with a gentle outward bow. */
const stem = (f: Flower): Sdf => {
  const [hx, hy, hz] = f.p;
  const dir = hx >= 0 ? 1 : -1;
  const bx = hx * 0.28;
  const bz = hz * 0.3 - 0.02;
  return sdf.chain(
    [
      [bx, 0.05, bz, 0.008],
      [(bx + hx) / 2 - dir * 0.014, (0.05 + hy) / 2, (bz + hz) / 2, 0.0068],
      [hx, hy, hz, 0.006],
    ],
    0.03,
  );
};

interface Bud {
  /** Stem top where the bud sits. */
  readonly top: readonly [number, number, number];
  /** Stem base inside the mound. */
  readonly base: readonly [number, number, number];
  /** Outward lean in degrees. */
  readonly lean: number;
}

const BUDS: readonly Bud[] = [
  { top: [-0.11, 0.44, -0.005], base: [-0.05, 0.05, -0.02], lean: -14 },
  { top: [0.045, 0.43, -0.125], base: [0.02, 0.05, -0.05], lean: 8 },
  { top: [-0.24, 0.36, 0.03], base: [-0.1, 0.05, 0.01], lean: -20 },
  { top: [0.2, 0.44, -0.145], base: [0.09, 0.05, -0.05], lean: 16 },
];

const bud = (b: Bud): Sdf =>
  sdf
    .chain(
      [
        [0, 0, 0, 0.007],
        [0, 0.018, 0, 0.015],
        [0, 0.04, 0, 0.008],
      ],
      0.006,
    )
    .rotateZ(b.lean)
    .at(b.top[0], b.top[1], b.top[2]);

const budStem = (b: Bud): Sdf =>
  sdf.chain(
    [
      [b.base[0], b.base[1], b.base[2], 0.007],
      [(b.base[0] + b.top[0]) / 2, (b.base[1] + b.top[1]) / 2, (b.base[2] + b.top[2]) / 2, 0.0062],
      [b.top[0], b.top[1], b.top[2], 0.0058],
    ],
    0.02,
  );

interface Blade {
  readonly base: readonly [number, number, number];
  /** Blade height, meters. */
  readonly h: number;
  /** Blade base radius, meters. */
  readonly w: number;
  /** Outward lean in degrees. */
  readonly lean: number;
  /** Turn in degrees, so blades do not all face one way. */
  readonly spin: number;
}

/** A lance leaf: a flat tapered blade from the base up, leaned and turned. */
const leaf = (b: Blade): Sdf =>
  sdf
    .cone([0, 0, 0], [0, b.h, 0], b.w, Math.max(0.01, b.w * 0.3))
    .scale([1, 1, 0.35])
    .rotateZ(b.lean)
    .rotateY(b.spin)
    .at(b.base[0], b.base[1], b.base[2]);

const LEAVES_DARK: readonly Blade[] = [
  { base: [0.0, 0.05, -0.07], h: 0.3, w: 0.034, lean: 4, spin: 0 },
  { base: [-0.1, 0.05, -0.04], h: 0.27, w: 0.032, lean: -22, spin: 10 },
  { base: [0.11, 0.05, -0.05], h: 0.26, w: 0.032, lean: 24, spin: -10 },
  { base: [-0.17, 0.05, 0.02], h: 0.23, w: 0.03, lean: -34, spin: 16 },
  { base: [0.18, 0.05, 0.0], h: 0.24, w: 0.03, lean: 36, spin: -14 },
  { base: [0.0, 0.05, -0.13], h: 0.22, w: 0.03, lean: 6, spin: -8 },
  // front-center blades: dark, so the white head stays the focal point
  { base: [-0.06, 0.05, 0.11], h: 0.19, w: 0.03, lean: -12, spin: 30 },
  { base: [0.07, 0.05, 0.12], h: 0.18, w: 0.03, lean: 14, spin: -26 },
];

const LEAVES_MID: readonly Blade[] = [
  { base: [-0.23, 0.05, 0.06], h: 0.2, w: 0.032, lean: -44, spin: 22 },
  { base: [0.23, 0.05, 0.05], h: 0.2, w: 0.032, lean: 46, spin: -20 },
  { base: [-0.28, 0.03, -0.02], h: 0.15, w: 0.027, lean: -58, spin: 4 },
  { base: [0.28, 0.03, -0.04], h: 0.15, w: 0.027, lean: 60, spin: 10 },
  { base: [-0.16, 0.05, 0.14], h: 0.13, w: 0.026, lean: -50, spin: 34 },
  { base: [0.17, 0.05, 0.13], h: 0.13, w: 0.026, lean: 52, spin: -30 },
];

/** Sunlit tips: blades catch a little more light where they stand tallest. */
const leafShade =
  (light: string) => (x: number, y: number, z: number, base: ReturnType<typeof rgb>) =>
    mixRgb(base, rgb(light), clamp01((y - 0.06) / 0.22) * 0.25);

export default defineAsset({
  name: 'wildflowers',
  description: 'A cheerful clump of seven round wildflowers — red, yellow, and white — over lance leaves on a low green mound.',
  detail: 0.005,
  texture: { size: 1024 },
  reference: 'reference/wildflowers_001.jpg',

  build(k) {
    // --------------------------------------------------------------- mound
    // A flattened dome cut flat at y = 0, brighter on top, with tiny painted dots.
    let mound = sdf
      .ellipsoid([0.35, 0.1, 0.28])
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z) => mixRgb(rgb(C.moundShade), rgb(C.mound), clamp01(0.3 + y * 7)));
    const spots: readonly (readonly [number, number, string])[] = [
      [-0.2, 0.1, C.white],
      [-0.09, 0.17, C.centerYellow],
      [0.05, 0.16, C.red],
      [0.17, 0.1, C.centerYellow],
      [0.26, 0.02, C.white],
      [-0.28, 0.04, C.centerRed],
      [-0.02, 0.22, C.bud],
    ];
    for (const [x, z, color] of spots) {
      const y = 0.1 * Math.sqrt(Math.max(0, 1 - (x / 0.35) ** 2 - (z / 0.28) ** 2));
      mound = mound.paintWhere(sdf.sphere(0.011).at(x, y, z), color, 0.003);
    }
    k.body('mound', mound, { color: C.mound, roughness: 0.85, detail: 0.006, textureDensity: 1.5 });

    // --------------------------------------------------------------- greens
    k.body('stems', sdf.smoothUnion(0.01, ...FLOWERS.map(stem), ...BUDS.map(budStem)), {
      color: C.stem,
      roughness: 0.8,
      detail: 0.0045,
    });
    k.body('buds', sdf.union(...BUDS.map(bud)), { color: C.bud, roughness: 0.8, detail: 0.004 });
    k.body('leavesDark', sdf.smoothUnion(0.007, ...LEAVES_DARK.map(leaf)).paintFn(leafShade(C.leafMid)), {
      color: C.leafDark,
      roughness: 0.82,
      detail: 0.0035,
    });
    k.body('leaves', sdf.smoothUnion(0.007, ...LEAVES_MID.map(leaf)).paintFn(leafShade(C.leafLight)), {
      color: C.leafMid,
      roughness: 0.82,
      detail: 0.0035,
    });

    // --------------------------------------------------------------- flowers
    const byColor = (test: (f: Flower) => boolean) => sdf.union(...FLOWERS.filter(test).map(head));
    const isRed = (f: Flower) => f.petal === C.red;
    const isWhite = (f: Flower) => f.petal === C.white;

    k.body('flowersRed', byColor(isRed), { color: C.red, roughness: 0.7, detail: 0.004, textureDensity: 2 });
    k.body('flowersWhite', byColor(isWhite), { color: C.white, roughness: 0.7, detail: 0.004, textureDensity: 2 });
    k.body('flowersYellow', byColor((f) => !isRed(f) && !isWhite(f)), {
      color: C.amber,
      roughness: 0.7,
      detail: 0.004,
      textureDensity: 2,
    });
  },
});
