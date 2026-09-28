import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * Design note — snowbank (catalog `nature/terrain/snowbank`).
 *
 * Role: background terrain prop for the Chibi Quest snow scene; read at 128 px beside the
 *   `snow-ground` tile. Size: 1.74 m long (x = -0.87 to 0.87), the drift 0.6 m tall with the
 *   twig tips just above it (0.65 m bounds), about 0.9 m deep; standing on y = 0, centred on
 *   the Y axis, facing +Z. No rig, no clips.
 * One idea: one soft drift that reads like a slow wave — a tall lumpy crest on the left rolling
 *   down to a low rounded tail on the right — with a few dark twigs breaking the outline.
 * Shape language: round and friendly (fat blended lobes, soft overhangs); the flat ground contact
 *   and the straight twigs are the small square/linear secondary read.
 * Palette (60/30/10, matched to snow-ground): snow #eef4fa dominant, lit crest #fafcff,
 *   shadow blue #cfe0f0 secondary, deep blue #9dbde0 in the deepest pockets, twig bark #7a4f2e
 *   with dark #4a2e18 and cut tip #c9a06a as the small accent.
 * Materials: one `snow` body (matte, roughness 0.85, sparkle + wind ripple in `bump`) and one
 *   `twigs` body (wood, roughness 0.9, grain in `bump`).
 * Detail list: primary = the lumpy drift mass with a crest and a tail; secondary = the front
 *   toe lobes, the back shoulder and the three small puffs; tertiary = sparkle bump, blue
 *   pocket paint and the broken twig tips. Focal point = the twigs against the bright crest.
 */

const SNOW = rgb('#eef4fa'); // snow body base, same as the snow-ground tile
const SNOW_LIGHT = rgb('#fafcff'); // sunlit crest, kept off pure white
const SHADOW = rgb('#cfe0f0'); // faint blue in the hollows, same as snow-ground
const SHADOW_DEEP = rgb('#9dbde0'); // deeper blue in the strongest pockets and at the ground
const BARK = rgb('#7a4f2e');
const BARK_DARK = rgb('#4a2e18');
const BARK_LIGHT = rgb('#a4713f');
const CUT = rgb('#c9a06a'); // pale broken wood at a twig tip

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};

// ------------------------------------------------------------------ drift blockout
// A big long base mass, a tall crest lobe on the left, a second top lump, a low sweeping tail
// on the right, a left shoulder lobe, three front toe lobes, a back shoulder, and two small
// puffs at the base. Sizes step from 0.58 down to 0.075 m so the mass has a big/medium/small
// rhythm instead of ten equal blobs.
const main = sdf.ellipsoid([0.54, 0.22, 0.33]).at(-0.06, 0.19, 0.0);
const crest = sdf.ellipsoid([0.3, 0.27, 0.28]).at(-0.28, 0.3, 0.02);
const crestTop = sdf.ellipsoid([0.15, 0.12, 0.15]).at(-0.22, 0.44, 0.03);
const topLump = sdf.ellipsoid([0.19, 0.16, 0.18]).at(0.0, 0.31, -0.05);
const topLump2 = sdf.ellipsoid([0.13, 0.11, 0.13]).at(-0.5, 0.33, -0.06);
const tail = sdf.ellipsoid([0.36, 0.16, 0.24]).at(0.5, 0.14, 0.0);
const tailLump = sdf.ellipsoid([0.15, 0.12, 0.15]).at(0.5, 0.23, 0.03);
const tailLump2 = sdf.ellipsoid([0.1, 0.08, 0.1]).at(0.7, 0.14, -0.07);
const leftLobe = sdf.ellipsoid([0.17, 0.12, 0.19]).at(-0.68, 0.12, 0.03);
const frontA = sdf.ellipsoid([0.24, 0.14, 0.19]).at(-0.36, 0.13, 0.28);
const frontB = sdf.ellipsoid([0.2, 0.12, 0.17]).at(0.02, 0.12, 0.31);
const frontC = sdf.ellipsoid([0.17, 0.1, 0.145]).at(0.36, 0.1, 0.25);
const backLobe = sdf.ellipsoid([0.32, 0.15, 0.18]).at(-0.02, 0.13, -0.25);
const puffA = sdf.ellipsoid([0.11, 0.095, 0.11]).at(0.75, 0.095, 0.12);
const puffB = sdf.ellipsoid([0.085, 0.075, 0.085]).at(-0.6, 0.075, 0.22);
const puffC = sdf.ellipsoid([0.075, 0.065, 0.075]).at(0.6, 0.065, -0.24);

// Distinct but softly blended lobes (small k keeps each lump reading); the base puffs blend
// tighter so they look like separate snowballs resting against the drift.
let snow = sdf
  .smoothUnion(
    0.05,
    main,
    crest,
    crestTop,
    topLump,
    topLump2,
    tail,
    tailLump,
    tailLump2,
    leftLobe,
    frontA,
    frontB,
    frontC,
    backLobe,
  )
  .smoothUnion(0.03, puffA, puffB, puffC);

// Lumpy irregularity: coarse wind-drift lumps plus a finer 1 cm grain. Keep the field shallow
// so the drift keeps soft overhangs instead of turning noisy.
snow = snow
  .displace(0.035, (x, y, z) => noise.fbm(x * 1.7, y * 1.7, z * 1.7, 3, 4))
  .displace(0.012, (x, y, z) => noise.fbm(x * 6, y * 6, z * 6, 2, 9));

// Flat ground contact with a 12 mm rounded bevel around the base perimeter.
const ground = sdf.halfSpace([0, -1, 0], 0);
snow = snow.intersect(ground).round(0.012).intersect(ground);
const snowShape: Sdf = snow;

// ------------------------------------------------------------------ paint
/**
 * Snow: a bright wind-polished crest and blue shadows in the hollows. The lighting is
 * camera-relative, so the blue comes from the surface facing (downward and steep faces sit in
 * ambient shadow), the height (the base is coolest) and noise pockets. Solid shade only.
 */
const snowPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const h = clamp01(y / 0.55);
  let c = mixRgb(mixRgb(SNOW, SHADOW, 0.45), SNOW_LIGHT, smoothstep(0.1, 0.9, h));
  // Geometric ambient shadow: downward-facing surfaces and steep flanks read blue.
  const n = sdf.normalAt(snowShape, [x, y, z]);
  const down = clamp01(-n[1]);
  c = mixRgb(c, SHADOW_DEEP, down * 0.85);
  c = mixRgb(c, SHADOW, clamp01(1 - n[1]) * 0.32);
  // Broad hollows read faintly blue.
  const hollow = clamp01(-noise.fbm(x * 4.0, y * 3.0, z * 4.0, 3, 21));
  c = mixRgb(c, SHADOW, hollow * 0.4);
  // Contact shadow where the drift meets the ground.
  c = mixRgb(c, SHADOW_DEEP, clamp01((0.09 - y) / 0.09) * 0.7);
  // Wind polish: soft bright streaks along the drift, stronger on the crest.
  const wind = clamp01(noise.fbm(x * 9, y * 2.5, z * 9, 2, 51));
  c = mixRgb(c, SNOW_LIGHT, wind * 0.22 * h);
  // Sparse sparkle flecks, kept small.
  const sp = noise.fbm(x * 70, y * 70, z * 70, 2, 71);
  c = mixRgb(c, SNOW_LIGHT, clamp01((sp - 0.62) * 2.6) * 0.4);
  return mixRgb(base, c, 1);
};

// ------------------------------------------------------------------ twigs
// A few thin sticks poking out of the drift. Each base is found by dropping a ray onto the
// finished snow shape, then sunk 5 cm inside, so no twig floats or leaves a visible root.
interface Twig {
  readonly x: number; // probe x for the base
  readonly z: number; // probe z for the base
  readonly tip: Vec3; // absolute tip position
  readonly bow: Vec3; // sideways offset of the middle joint, for a slight bend
  readonly r0: number;
  readonly r1: number;
}
const TWIGS: readonly Twig[] = [
  { x: -0.46, z: -0.02, tip: [-0.62, 0.64, 0.05], bow: [0.02, 0, 0.01], r0: 0.02, r1: 0.01 },
  { x: -0.15, z: 0.06, tip: [-0.05, 0.62, 0.17], bow: [0.0, 0, -0.02], r0: 0.017, r1: 0.009 },
  { x: 0.12, z: -0.13, tip: [0.24, 0.47, -0.33], bow: [0.0, 0, 0.025], r0: 0.015, r1: 0.008 },
  { x: 0.45, z: 0.13, tip: [0.57, 0.38, 0.3], bow: [-0.02, 0, 0.0], r0: 0.014, r1: 0.008 },
];

const twigOf = (t: Twig): Sdf => {
  const hit = sdf.raycast(snow, [t.x, 1.4, t.z], [0, -1, 0]);
  const by = (hit ? hit[1] : 0.2) - 0.05; // start 5 cm inside the drift
  const base: Vec3 = [t.x, by, t.z];
  const mid: Vec3 = [
    (base[0] + t.tip[0]) / 2 + t.bow[0],
    (base[1] + t.tip[1]) / 2 + t.bow[1],
    (base[2] + t.tip[2]) / 2 + t.bow[2],
  ];
  const rm = (t.r0 + t.r1) / 2;
  return sdf.chain(
    [
      [base[0], base[1], base[2], t.r0],
      [mid[0], mid[1], mid[2], rm],
      [t.tip[0], t.tip[1], t.tip[2], t.r1],
    ],
    0.008,
  );
};

const twigs = sdf.union(...TWIGS.map(twigOf));

const distToTip = (x: number, y: number, z: number): number => {
  let m = Infinity;
  for (const t of TWIGS) m = Math.min(m, Math.hypot(x - t.tip[0], y - t.tip[1], z - t.tip[2]));
  return m;
};

const twigPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  // Vertical grain ridges along the stick, same recipe as the stump's bark.
  const g = noise.fbm(x * 20, y * 3.5, z * 20, 3, 41);
  let c = mixRgb(base, BARK_DARK, 0.25 + 0.3 * clamp01(-g));
  c = mixRgb(c, BARK_LIGHT, clamp01(g) * 0.35);
  c = mixRgb(c, BARK_DARK, clamp01((0.09 - y) / 0.09) * 0.5);
  // A pale broken-wood tip on each twig.
  const tipT = clamp01((0.055 - distToTip(x, y, z)) / 0.055);
  return mixRgb(c, CUT, tipT * 0.75);
};

export default defineAsset({
  name: 'snowbank',
  description:
    'Soft lumpy snowbank 1.8 m long and 0.6 m tall: a white drift with blue shadows, a low tail and a few twigs poking out.',
  detail: 0.016,
  reference: 'docs/item-mockups/snowbank-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    k.body('snow', snow.paintFn(snowPaint), {
      color: SNOW,
      roughness: 0.85,
      metalness: 0,
      detail: 0.016,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 3300,
      // Fine sparkle and a faint wind ripple, in the normal map only.
      bump: (x, y, z) =>
        0.0028 * noise.fbm(x * 26, y * 26, z * 26, 3, 13) +
        0.0012 * noise.fbm(x * 88, y * 88, z * 88, 2, 17),
    });

    k.body('twigs', twigs.paintFn(twigPaint), {
      color: BARK,
      roughness: 0.9,
      metalness: 0,
      detail: 0.005,
      textureDensity: 2,
      maxTriangles: 400,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 40, y * 9, z * 40, 2, 23),
    });
  },
});
