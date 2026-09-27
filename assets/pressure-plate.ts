import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — dungeon pressure plate tile (props/world/pressure-plate).
 *
 * Role: interactive floor prop in the Sunken Vault dungeon; must read at 128 px
 *   as a chunky stone tile with a sunken trigger plate and a gold rune.
 * Size: 1.0 m x 0.08 m x 1.0 m stone slab on y = 0 (top at y = 0.08), front +Z;
 *   matches the spike-trap tile so the dungeon floor set lines up.
 * One idea: a heavy slab whose middle is cut away — a sunken iron trigger plate
 *   floating in a thin dark gap, carved with a bold gold rune, framed by four
 *   chunky corner pads like the concept mock.
 * Shape language: square dominant (slab, pads, plate), one angular accent (the
 *   arrow rune).
 * Palette (dungeon contract): cool gray stone #6f7680 / dark #4b525c / worn
 *   #8a8e96; iron #4a4f55 / shadow #363a3f / highlight #a8acb1; old gold
 *   #d4a93a as the single accent at the focal point.
 * Materials: stone body (roughness 0.9), iron plate body (roughness 0.6,
 *   metalness 0.6 — a touch satin so the wide top does not mirror the key
 *   light), gold rune body (roughness 0.3, metalness 1). Grit and wear
 *   live in paint and bump, never in displacement.
 * Detail: primary slab + sunken plate; secondary corner pads + dark gap;
 *   tertiary carved rune channel with gold inlay. Focal point: the gold rune.
 * Rig/animation: bones base + plate; a one-shot `press` clip sinks the plate
 *   flush into the gap and lets it spring back.
 */

const STONE = rgb('#6f7680');
const STONE_DARK = rgb('#4b525c');
const STONE_LIGHT = rgb('#8a8e96');
const STONE_DEEP = rgb('#3b4148');
const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const CHANNEL = rgb('#1e2227');
const GOLD = '#d4a93a';

const SIZE = 1.0;
const THICK = 0.08;
const POCKET_W = 0.52; // cut opening in the slab top
const PLATE_W = 0.48; // iron trigger plate
const PLATE_TOP = 0.066; // plate top sits 14 mm below the slab top
const PAD = 0.18; // corner pad footprint
const PAD_X = 0.365; // pad centre offset
const PAD_TOP = 0.094; // pads rise 14 mm proud of the slab top
const PRESS = 0.009; // how far the plate sinks when triggered

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number): number => {
  const s = clamp01((v - a) / (b - a));
  return s * s * (3 - 2 * s);
};

// Bold angular rune: an upward arrow (danger / press here), 0.30 m tall.
// Profile U = x, V becomes +Z (front) after the flat rotateX(90).
const runeProfile = profile.polygon([
  [0, 0.16],
  [0.115, 0.015],
  [0.053, 0.015],
  [0.053, -0.16],
  [-0.053, -0.16],
  [-0.053, 0.015],
  [-0.115, 0.015],
]);

export default defineAsset({
  name: 'pressure-plate',
  description:
    'A 1.0 m square dungeon stone slab 0.08 m thick with a sunken iron trigger plate in a thin dark gap, chunky corner pads, and a gold arrow rune carved at the centre.',
  detail: 0.006,
  reference: 'docs/item-mockups/pressure-plate-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- stone slab
    // Beveled slab matching the spike-trap tile, plus four chunky corner pads
    // that echo the concept mock. The middle is cut away for the sunken plate.
    const slab = sdf.box([SIZE, THICK, SIZE], 0.02).at(0, THICK / 2, 0);
    const pads = [-1, 1].flatMap((sx) =>
      [-1, 1].map((sz) => sdf.box([PAD, 0.026, PAD], 0.006).at(sx * PAD_X, 0.081, sz * PAD_X)),
    );
    const pocket = sdf
      .extrude(profile.rect([POCKET_W, POCKET_W], 0.05), 0.056)
      .rotateX(90)
      .at(0, 0.086, 0); // spans 0.058..0.114: gap floor at 0.058
    const stoneShape = sdf.smoothUnion(0.008, slab, ...pads).subtract(pocket);

    // ------------------------------------------------------- iron trigger plate
    // Rounded-square plate dropped into the pocket: top 14 mm below the slab
    // top, skirt embedded in the slab so nothing floats. The rune is carved
    // 6 mm into its face; the gold inlay body fills the carve, 2 mm proud.
    const plate = sdf
      .extrude(profile.rect([PLATE_W, PLATE_W], 0.045), 0.022, 0.003)
      .rotateX(90)
      .at(0, 0.058, 0); // spans 0.050..0.066
    const carve = sdf
      .extrude(runeProfile, 0.04)
      .rotateX(90)
      .round(0.004)
      .at(0, 0.084, 0); // spans 0.060..0.108: groove floor 6 mm deep
    const plateShape = plate.subtract(carve);

    const gold = sdf
      .extrude(runeProfile, 0.016, 0.0015)
      .rotateX(90)
      .at(0, 0.0625, 0); // spans 0.057..0.068: 2 mm proud of the plate top

    // ------------------------------------------------------------- stone paint
    // Cool gray stone with tonal drift and mottling, pale bevels that catch
    // the key light, a heavy grounded foot. The pocket gets a near-black
    // worn gap (floor, walls, and a thin spill line on the top surface).
    const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const patch = noise.fbm(x * 2.4 + 1.3, 0, z * 2.4, 2);
      let c = mixRgb(STONE_DARK, STONE_LIGHT, clamp01(0.5 + 0.35 * patch));
      c = mixRgb(c, base, 0.5);
      const mot = noise.fbm(x * 8, y * 6, z * 8, 2);
      c = mixRgb(c, mot > 0 ? STONE_LIGHT : STONE_DARK, Math.abs(mot) * 0.16);
      // Pale worn top face and pad tops (strong light accent for the value plan).
      const topness = smoothstep(0.068, THICK, y);
      c = mixRgb(c, STONE_LIGHT, topness * 0.22);
      c = mixRgb(c, STONE_LIGHT, smoothstep(0.086, PAD_TOP, y) * 0.2);
      // Ground shadow so the slab reads heavy.
      c = mixRgb(c, STONE_DEEP, smoothstep(0.045, 0, y) * 0.6);
      // Wear darkening just outside the pocket rim.
      const rr = Math.max(Math.abs(x), Math.abs(z)) - (POCKET_W / 2 - 0.05);
      const rim = smoothstep(0.05, 0.0, rr) * smoothstep(THICK - 0.03, THICK, y);
      c = mixRgb(c, STONE_DARK, rim * 0.3);
      return c;
    };
    const stoneBump = (x: number, y: number, z: number): number =>
      0.0018 * noise.fbm(x * 28, y * 22, z * 28, 2);

    k.body('stone', stoneShape.paintFn(stonePaint).paintWhere(pocket.round(0.006), CHANNEL, 0.004), {
      color: STONE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      textureDensity: 1.5,
      maxError: 0.002,
      maxTriangles: 1500,
      bone: 'base',
      bump: stoneBump,
    });

    // ------------------------------------------------------------- iron paint
    // Worn cast iron: brighter stepped-on top face and bevels, darker skirt
    // toward the gap shadow, fine speckle. The carved channel goes near-black
    // so the gold inlay reads at sprite size.
    const ironPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const vert = noise.fbm(x * 26, y * 10, z * 26, 2);
      let c = mixRgb(IRON_DARK, base, clamp01(0.35 + 0.25 * vert));
      c = mixRgb(c, IRON_LIGHT, clamp01(vert - 0.35) * 0.12);
      // Slightly worn top face where boots have polished it; the plate stays a
      // dark pool so the gold rune carries the contrast.
      c = mixRgb(c, IRON_LIGHT, smoothstep(PLATE_TOP - 0.004, PLATE_TOP, y) * 0.1);
      // Darker skirt down in the gap shadow.
      c = mixRgb(c, IRON_DARK, smoothstep(0.058, 0.05, y) * 0.45);
      const sp = noise.fbm(x * 60, y * 60, z * 60, 2);
      c = mixRgb(c, IRON_LIGHT, clamp01(sp) * 0.05);
      c = mixRgb(c, IRON_DARK, clamp01(-sp) * 0.15);
      return c;
    };
    const ironBump = (x: number, y: number, z: number): number =>
      0.0008 * noise.fbm(x * 48, y * 36, z * 48, 2);

    k.body(
      'plate-iron',
      plateShape.paintFn(ironPaint).paintWhere(carve.round(0.001), CHANNEL, 0.0015),
      {
        color: IRON,
        roughness: 0.6,
        metalness: 0.6,
        detail: 0.003,
        paintWeight: 1.5,
        textureDensity: 2,
        maxError: 0.001,
        maxTriangles: 1000,
        bone: 'plate',
        bump: ironBump,
      },
    );

    // ------------------------------------------------------------- gold rune
    // Old gold inlay, the single accent of the tile.
    k.body('rune-gold', gold, {
      color: GOLD,
      roughness: 0.3,
      metalness: 1,
      detail: 0.002,
      textureDensity: 2,
      maxError: 0.0005,
      maxTriangles: 500,
      bone: 'plate',
    });

    // ------------------------------------------------------------------ rig
    k.skeleton({
      base: { at: [0, 0.04, 0] },
      plate: { parent: 'base', at: [0, 0.06, 0] },
    });

    // One-shot press: the plate sinks flush into the dark gap, holds a beat,
    // then springs back.
    const env = (t: number): number =>
      smoothstep(0, 0.26, t) * (1 - smoothstep(0.58, 0.86, t));
    k.animation('press', {
      duration: 1.0,
      loop: false,
      pose: (t) => ({ plate: { move: [0, -PRESS * env(t), 0] } }),
    });
  },
});
