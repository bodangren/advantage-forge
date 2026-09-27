import { defineAsset, mixRgb, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * Reeds — stream-bank reed cluster (catalog `nature/plants/reeds`): about 0.8 m tall,
 * 0.5 m wide, standing on y = 0 and facing +Z. No rig, no clips.
 *
 * - Role: water-edge dressing beside river banks; a vertical accent that reads at 128 px.
 * - One idea: ten chunky tapered blades fan out of one low mud mound, with three brown
 *   cattail sausages on thin stalks poking above the blade tips.
 * - Shape language: round and soft (flattened taper blades, sausage heads, domed mound);
 *   the upright cattails break the silhouette.
 * - Palette: blades deep green #2f7a3f with lighter tips #4a9a4f and sunny #7ec850 ridge;
 *   shaded base #22572e; cattail heads warm brown #8a5a35 over dark #5f3d22; stalks shaded
 *   green #4a8a3f; mound warm tan dirt #c8a86b with darker wet mud #8a6a45.
 *   Value plan: dark mound and blade bases, mid blades, light tips; brown heads focal accent.
 * - Materials: matte foliage (roughness 0.8), soft matte cattail (0.75), rough mud (0.95).
 * - Detail: (1) lumpy mud mound, (2) ten fanned blades, (3) three stalk + cattail heads,
 *   (4) painted tip gradient. Focal point: the brown cattail heads above the green fan.
 * - Budget: coarse detail values plus per-body maxTriangles keep the final under 2,500.
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const BLADE_DEEP = rgb('#2f7a3f');
const BLADE_TIP = rgb('#4a9a4f');
const BLADE_SUN = rgb('#7ec850');
const BLADE_SHADE = rgb('#22572e');
const HEAD_MID = rgb('#8a5a35');
const HEAD_DARK = rgb('#5f3d22');
const MUD = rgb('#c8a86b');
const MUD_DARK = rgb('#8a6a45');

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

/** Ten blades: tall heart, mid ring, short outer fill — big/medium/small rhythm. */
const BLADES: readonly Blade[] = [
  { base: [0.0, 0.04, -0.02], h: 0.72, w: 0.034, lean: 2, spin: 8 },
  { base: [-0.05, 0.04, 0.0], h: 0.67, w: 0.032, lean: -10, spin: -12 },
  { base: [0.05, 0.04, 0.0], h: 0.65, w: 0.032, lean: 11, spin: 14 },
  { base: [0.0, 0.04, 0.05], h: 0.61, w: 0.03, lean: 6, spin: 30 },
  { base: [-0.02, 0.04, -0.07], h: 0.59, w: 0.03, lean: -6, spin: -20 },
  { base: [-0.1, 0.03, 0.03], h: 0.52, w: 0.028, lean: -22, spin: 10 },
  { base: [0.1, 0.03, 0.02], h: 0.51, w: 0.028, lean: 24, spin: -14 },
  { base: [0.03, 0.03, 0.1], h: 0.46, w: 0.027, lean: 18, spin: 40 },
  { base: [-0.08, 0.03, -0.08], h: 0.44, w: 0.027, lean: -20, spin: -34 },
  { base: [0.12, 0.02, -0.06], h: 0.37, w: 0.025, lean: 32, spin: -8 },
];

/** A reed blade: flat tapered cone from the base up, leaned and turned. */
const blade = (b: Blade): Sdf =>
  sdf
    .cone([0, 0, 0], [0, b.h, 0], b.w, Math.max(0.008, b.w * 0.28))
    .scale([1, 1, 0.45])
    .rotateZ(b.lean)
    .rotateY(b.spin)
    .at(b.base[0], b.base[1], b.base[2]);

interface Cattail {
  /** Stalk base inside the mound. */
  readonly base: readonly [number, number, number];
  /** Stalk top where the head sits. */
  readonly top: readonly [number, number, number];
  /** Head length, meters. */
  readonly len: number;
  /** Head radius, meters. */
  readonly r: number;
}

const CATTAILS: readonly Cattail[] = [
  { base: [-0.06, 0.03, -0.03], top: [-0.09, 0.55, -0.05], len: 0.17, r: 0.032 },
  { base: [0.05, 0.03, -0.01], top: [0.08, 0.6, -0.02], len: 0.18, r: 0.034 },
  { base: [0.0, 0.03, 0.05], top: [0.01, 0.49, 0.08], len: 0.15, r: 0.03 },
];

/** Thin stalk with a gentle outward bow from base to head. */
const stalk = (c: Cattail): Sdf =>
  sdf.chain(
    [
      [c.base[0], c.base[1], c.base[2], 0.009],
      [(c.base[0] + c.top[0]) / 2, (c.base[1] + c.top[1]) / 2, (c.base[2] + c.top[2]) / 2, 0.008],
      [c.top[0], c.top[1], c.top[2], 0.007],
    ],
    0.02,
  );

/** Brown sausage head: rounded capsule plus a tiny spike poking out of the top. */
const head = (c: Cattail): Sdf => {
  const [tx, ty, tz] = c.top;
  const sausage = sdf.capsule([tx, ty - 0.01, tz], [tx, ty + c.len, tz], c.r);
  const spike = sdf.cone([tx, ty + c.len - 0.01, tz], [tx, ty + c.len + 0.05, tz], 0.008, 0.002);
  return sdf.smoothUnion(0.008, sausage, spike);
};

export default defineAsset({
  name: 'reeds',
  description: 'A stream-bank reed cluster: ten fanned deep-green blades and three brown cattail heads rising from a low mud mound.',
  detail: 0.006,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ mound
    // A low lumpy mud dome, cut flat at y = 0; darker wet mud low, warm tan on top.
    const mound = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([0.22, 0.08, 0.18]).at(0, 0.025, 0),
        sdf.ellipsoid([0.13, 0.055, 0.11]).at(-0.09, 0.02, 0.04),
        sdf.ellipsoid([0.12, 0.05, 0.1]).at(0.09, 0.02, -0.04),
      )
      .displace(0.012, (x, y, z) => noise.fbm(x * 9, y * 9, z * 9, 2))
      .intersect(sdf.halfSpace([0, -1, 0], -0.005))
      .at(0, 0.005, 0)
      .paintFn((x, y, z) => {
        const v = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
        const col = mixRgb(MUD_DARK, MUD, clamp01(0.15 + y * 5 + (v - 0.5) * 0.4));
        return mixRgb(col, HEAD_DARK, (1 - clamp01(y * 8)) * 0.4);
      });
    k.body('mound', mound, {
      color: '#c8a86b',
      roughness: 0.95,
      detail: 0.01,
      maxTriangles: 350,
      paintWeight: 2,
    });

    // ------------------------------------------------------------------ blades
    // Fanned tapered blades: dark shaded base, deep mid, light sunlit tips.
    const blades = sdf
      .smoothUnion(0.012, ...BLADES.map(blade))
      .paintFn((x, y, z) => {
        const t = clamp01((y - 0.04) / 0.62);
        const v = 0.5 + 0.5 * noise.fbm(x * 7, y * 7, z * 7, 2);
        let col = mixRgb(BLADE_DEEP, BLADE_TIP, clamp01(t * 1.1 - 0.1 + (v - 0.5) * 0.25));
        col = mixRgb(col, BLADE_SHADE, (1 - clamp01(t * 4)) * 0.7);
        col = mixRgb(col, BLADE_SUN, clamp01((t - 0.55) * 2.2) * 0.45);
        return col;
      });
    k.body('blades', blades, {
      color: '#2f7a3f',
      roughness: 0.8,
      detail: 0.007,
      maxTriangles: 1200,
      paintWeight: 2,
    });

    // ------------------------------------------------------------------ stalks
    k.body('stalks', sdf.smoothUnion(0.008, ...CATTAILS.map(stalk)), {
      color: '#4a8a3f',
      roughness: 0.8,
      detail: 0.005,
      maxTriangles: 250,
    });

    // ------------------------------------------------------------------ heads
    // Warm brown sausages, darker at the bottom where they meet the stalk.
    const heads = sdf
      .smoothUnion(0.01, ...CATTAILS.map(head))
      .paintFn((x, y, z) => {
        const v = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2);
        const t = clamp01((y - 0.44) / 0.33);
        return mixRgb(mixRgb(HEAD_DARK, HEAD_MID, clamp01(0.35 + t * 0.9)), HEAD_MID, v * 0.25);
      });
    k.body('heads', heads, {
      color: '#8a5a35',
      roughness: 0.75,
      detail: 0.006,
      maxTriangles: 500,
      paintWeight: 2,
    });
  },
});
