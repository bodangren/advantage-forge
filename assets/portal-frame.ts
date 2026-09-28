import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Portal frame, 2.4 m tall (catalog `architecture/structure/portal-frame`).
 *
 * Role: dungeon gate landmark in the Sunken Vault; must read at 128 px. No rig, no clips.
 * Size: 2.4 m tall (Y), 2.0 m wide (X), 1.0 m deep (Z); stands on y = 0, faces +Z, centred on Y.
 * One idea: a chunky empty stone gate — two fluted pillars under a rune-lit lintel with a gold
 *   keystone medallion — promising a way through. Reads as an open doorway, never a wall.
 * Shape language: square/boxy (sturdy, reliable) with a broad rounded arch feel from the
 *   overhanging lintel; soft bevels everywhere.
 * Palette (Sunken Vault): stone cool gray #6f7680 / dark #4b525c (dominant), iron #4a4f55 /
 *   #363a3f with highlight #a8acb1 (bands and studs), old gold #d4a93a (keystone medallion and
 *   knobs, accent), rune glow #ff9a3c emissive over dark base #4a1405 (focal point).
 * Materials: stone (0.9 roughness, worley cells + bump), worn iron (0.5 / 0.7), old gold
 *   (0.3 / 1), emissive runes (dark base + emissive 1.8).
 * Detail list: (1) two-step base, (2) plinth + fluted tapered shaft + carved capital per
 *   pillar, (3) rune-band lintel with keystone, (4) gold medallion and knobs, (5) iron bands
 *   and studs. Focal point: the glowing rune band and gold keystone.
 */

const STEP1: [number, number, number] = [2.0, 0.13, 1.0];
const STEP2: [number, number, number] = [1.7, 0.13, 0.85];
const PX = 0.7; // pillar centre along X
const SHAFT_BOT = 0.44;
const SHAFT_TOP = 1.84;
const CAP_Y = 1.94; // capital centre
const LINTEL_Y = 2.25; // lintel centre (2.10 to 2.40)
const LINTEL_FRONT = 0.25;

const C = {
  stone: rgb('#6f7680'),
  stoneDark: rgb('#4b525c'),
  mortar: rgb('#3d434c'),
  iron: rgb('#4a4f55'),
  ironDark: rgb('#363a3f'),
  ironHi: rgb('#a8acb1'),
  gold: rgb('#d4a93a'),
  goldDark: rgb('#8a6b1f'),
  runeBase: rgb('#4a1405'),
  runeGlow: rgb('#ff9a3c'),
};

const sstep = (e0: number, e1: number, v: number): number => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Cool laid-stone paint: mortar where worley cells touch, a tint per cell. */
const stonePaint =
  (base: Rgb, dark: Rgb, mortar: Rgb) =>
  (x: number, y: number, z: number) => {
    const { f1, f2, id } = noise.worley(x * 4.5, y * 3.2, z * 4.5, 4);
    const gap = sstep(0.04, 0.1, f2 - f1);
    const tint = noise.random(id, 7);
    let c = mixRgb(base, dark, 0.22 * tint);
    c = mixRgb(c, mortar, 0.6 * (1 - gap));
    // Value plan: damp dark base, pale worn tops so the stone does not read flat.
    c = mixRgb(c, dark, 0.4 * (1 - sstep(0.15, 0.5, y)));
    c = mixRgb(c, rgb('#8d97a5'), 0.28 * sstep(1.85, 2.4, y));
    return c;
  };

const stoneBump = (x: number, y: number, z: number) => {
  const { f1, f2 } = noise.worley(x * 4.5, y * 3.2, z * 4.5, 4);
  return -0.005 * (1 - sstep(0.04, 0.1, f2 - f1)) + 0.0015 * noise.fbm(x * 20, y * 20, z * 20, 2);
};

/** Shaft radius at height y (matches the tapered cone). */
const shaftR = (y: number) => 0.2 + (0.17 - 0.2) * ((y - SHAFT_BOT) / (SHAFT_TOP - SHAFT_BOT));

/** Vertical fluting paint for the pillar shafts. */
const flutePaint = (x: number, y: number, z: number, base: Rgb) => {
  const a = Math.atan2(z, x);
  const g = Math.pow(0.5 + 0.5 * Math.cos(a * 8), 3);
  return mixRgb(base, C.stoneDark, 0.4 * g + 0.08 * noise.fbm(x * 12, y * 3, z * 12, 2));
};

const fluteBump = (x: number, y: number, z: number) => {
  const a = Math.atan2(z, x);
  return -0.0035 * Math.pow(0.5 + 0.5 * Math.cos(a * 8), 3);
};

/** Carved spiral stencil (extruded so it crosses the capital's front face). */
const spiralStencil = (x: number) =>
  sdf
    .extrude(
      profile.polygon(
        Array.from({ length: 25 }, (_, i) => {
          const t = i / 24;
          const a = t * Math.PI * 3.2;
          const r = 0.016 + 0.065 * t;
          return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
        }),
      ),
      0.4,
    )
    .at(x, CAP_Y, 0.24);

/** One rune: union of thin rotated boxes. Local coords, centred on (0, 0). */
const rune = (strokes: [number, number, number, number][]) =>
  sdf.union(
    ...strokes.map(([x1, y1, x2, y2]) => {
      const len = Math.hypot(x2 - x1, y2 - y1);
      const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
      return sdf.box([len + 0.022, 0.024, 0.04], 0.01).rotateZ(ang).at((x1 + x2) / 2, (y1 + y2) / 2, 0);
    }),
  );

export default defineAsset({
  name: 'portal-frame',
  description:
    'Empty 2.4 m stone gate frame: fluted pillars on a two-step base, carved capitals, and a rune-lit lintel with a gold keystone medallion. No door.',
  detail: 0.03,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/portal-frame-mock.jpg',

  build(k) {
    // ---------------------------------------------------------------- two-step base
    const steps = sdf.union(
      sdf.box(STEP1, 0.06).at(0, STEP1[1] / 2, 0),
      sdf.box(STEP2, 0.06).at(0, STEP1[1] + STEP2[1] / 2, 0),
    );
    k.body('steps', steps.paintFn(stonePaint(C.stone, C.stoneDark, C.mortar)), {
      color: C.stone,
      roughness: 0.9,
      detail: 0.15,
      bump: stoneBump,
    });

    // ---------------------------------------------------------------- pillar plinths
    const plinth = sdf
      .box([0.52, 0.18, 0.56], 0.05)
      .at(PX, 0.35, 0)
      .mirror('x', 0)
      .paintFn(stonePaint(C.stone, C.stoneDark, C.mortar));
    k.body('plinths', plinth, {
      color: C.stone,
      roughness: 0.9,
      detail: 0.1,
      bump: stoneBump,
    });

    // ---------------------------------------------------------------- fluted shafts
    const shaft = sdf
      .cone([PX, SHAFT_BOT, 0], [PX, SHAFT_TOP, 0], 0.2, 0.17)
      .mirror('x', 0)
      .paintFn((x, y, z, base) => flutePaint(x, y, z, base));
    k.body('shafts', shaft, {
      color: C.stone,
      roughness: 0.9,
      detail: 0.05,
      bump: fluteBump,
    });

    // ---------------------------------------------------------------- capitals with carved spirals
    const capital = sdf
      .box([0.54, 0.28, 0.56], 0.05)
      .at(PX, 1.97, 0)
      .mirror('x', 0)
      .paintFn(stonePaint(C.stone, C.stoneDark, C.mortar))
      .paintWhere(spiralStencil(PX), C.stoneDark, 0.012)
      .paintWhere(spiralStencil(-PX), C.stoneDark, 0.012);
    k.body('capitals', capital, {
      color: C.stone,
      roughness: 0.9,
      detail: 0.09,
      textureDensity: 2,
      bump: stoneBump,
    });

    // ---------------------------------------------------------------- lintel and keystone
    const lintel = sdf.box([2.0, 0.32, 0.5], 0.055).at(0, 2.24, 0);
    k.body('lintel', lintel.paintFn(stonePaint(C.stone, C.stoneDark, C.mortar)), {
      color: C.stone,
      roughness: 0.9,
      detail: 0.14,
      bump: stoneBump,
    });

    const keystone = sdf.box([0.34, 0.36, 0.58], 0.05).at(0, 2.22, 0.02);
    k.body('keystone', keystone.paintFn(stonePaint(C.stone, C.stoneDark, C.mortar)), {
      color: C.stone,
      roughness: 0.9,
      detail: 0.11,
      textureDensity: 2,
      bump: stoneBump,
    });

    // ---------------------------------------------------------------- glowing rune band
    const runeRow = sdf.union(
      rune([
        [0, -0.08, 0, 0.08],
        [0, 0.08, 0.07, -0.02],
      ]).at(-0.55, LINTEL_Y, LINTEL_FRONT),
      rune([
        [-0.05, -0.08, -0.05, 0.08],
        [-0.05, 0.04, 0.06, 0.08],
        [0.06, 0.08, 0.06, -0.04],
      ]).at(-0.28, LINTEL_Y, LINTEL_FRONT),
      rune([
        [0, -0.08, 0, 0.08],
        [-0.06, 0.02, 0.06, 0.02],
        [0.06, 0.02, 0, 0.08],
      ]).at(0.28, LINTEL_Y, LINTEL_FRONT),
      rune([
        [-0.06, -0.08, -0.06, 0.08],
        [-0.06, -0.08, 0.06, 0.08],
        [0.06, -0.08, -0.06, 0.02],
      ]).at(0.55, LINTEL_Y, LINTEL_FRONT),
    );
    k.body('runes', runeRow, {
      color: C.runeBase,
      roughness: 0.2,
      emissive: C.runeGlow,
      emissiveIntensity: 1.8,
      detail: 0.02,
    });

    // ---------------------------------------------------------------- gold: keystone medallion and knobs
    const gold = sdf.union(
      sdf
        .torus(0.075, 0.02)
        .rotateX(90)
        .at(0, 2.25, 0.32)
        .union(sdf.sphere(0.045).at(0, 2.25, 0.32)),
      sdf.sphere(0.055).at(-0.88, 2.4, 0.16),
      sdf.sphere(0.055).at(0.88, 2.4, 0.16),
    );
    k.body('gold', gold.paintFn((x, y, z, base) => mixRgb(base, C.goldDark, 0.25 * (0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2)))), {
      color: C.gold,
      roughness: 0.3,
      metalness: 1,
      detail: 0.025,
    });

    // ---------------------------------------------------------------- iron: shaft bands and plinth studs
    const band = (y: number) => sdf.cylinder(shaftR(y) + 0.008, 0.07).at(PX, y, 0).mirror('x', 0);
    const iron = sdf.union(
      band(0.55),
      band(1.73),
      sdf.sphere(0.028).at(PX, 0.35, 0.26).mirror('x', 0),
    );
    k.body('iron', iron.paintFn((x, y, z, base) => mixRgb(base, C.ironDark, 0.3 * (0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2)))), {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.03,
    });
  },
});
