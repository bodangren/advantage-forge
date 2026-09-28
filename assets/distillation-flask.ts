import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * Design note — alchemy distillation flask (props/craft-and-trade/distillation-flask).
 *
 * Role: dungeon craft prop for the Sunken Vault; must read at 128 px.
 * Size: 0.5 m tall, stands on y = 0, centred on Y, faces +Z.
 * One idea: a round glass retort glowing green, held in a small iron tripod, with a
 *   long swan-curved neck that breaks the silhouette; a candle burns underneath.
 * Shape language: round dominant (glowing bulb, curved neck, ring stand), square
 *   secondary (three straight iron legs and feet).
 * Palette: glass pale green #d3e8bb (opacity 0.45); glow green #5ce02a on dark base
 *   #0e2a06; iron #4a4f55 / dark #363a3f / highlight #a8acb1; warm candle #e8ddc8;
 *   gold accent #d4a93a; flame #ff9a3c emissive on #4a1405.
 * Materials: iron (rough 0.5, metal 0.7), glass (rough 0.1, opacity 0.45), glowing
 *   liquid (emissive 1.8, dark base), wax (rough 0.6), flame (emissive 1.8), gold
 *   (metal 1). Value plan: dark iron low, mid glass, bright green focal centre.
 * Detail: primary = bulb + neck + tripod + candle; secondary = ring, brace, feet,
 *   lip, collar; tertiary = bubbles painted in the liquid. Focal point: glowing liquid.
 * Rig/animation: none (static prop).
 */

const IRON_MID = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const GLASS = '#d3e8bb';
const LIQUID_BASE = '#0e2a06';
const LIQUID_GLOW = '#5ce02a';
const WAX = '#e8ddc8';
const GOLD = '#d4a93a';
const FLAME = '#ff9a3c';

const RING_Y = 0.2; // height of the iron ring that holds the flask
const RING_R = 0.092;
const FEET_R = 0.138;
const BULB_Y = 0.265;
const BULB_R = 0.11;
const LIQUID_TOP = 0.272;

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

// Patches of pale fizz painted on the liquid surface (world coords, radius).
const BUBBLES: readonly [number, number, number, number][] = [
  [0.05, 0.23, 0.075, 0.016],
  [-0.055, 0.225, 0.07, 0.014],
  [0.02, 0.208, 0.088, 0.012],
  [-0.03, 0.245, 0.086, 0.013],
  [0.075, 0.243, 0.045, 0.011],
];

/** Three splayed iron legs at 30, 150 and 270 degrees, with chunky feet. */
const legAngles = [30, 150, 270];

export default defineAsset({
  name: 'distillation-flask',
  description:
    'Alchemy distillation flask: a round see-through glass retort with glowing green liquid, a long curved neck, and a small iron tripod over a candle.',
  detail: 0.008,
  reference: 'docs/item-mockups/distillation-flask-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ iron tripod
    const ring = sdf.torus(RING_R, 0.012).at(0, RING_Y, 0);
    const brace = sdf.torus(0.122, 0.0055).at(0, 0.075, 0);
    const legs = legAngles.map((deg) => {
      const a = (deg * Math.PI) / 180;
      const top: [number, number, number] = [Math.cos(a) * 0.088, RING_Y - 0.008, Math.sin(a) * 0.088];
      const foot: [number, number, number] = [Math.cos(a) * 0.132, 0.017, Math.sin(a) * 0.132];
      const cap = sdf.capsule(top, foot, 0.0105);
      const pad = sdf.sphere(0.016).at(Math.cos(a) * FEET_R, 0.015, Math.sin(a) * FEET_R);
      return sdf.smoothUnion(0.008, cap, pad);
    });

    // Small dish under the candle, sitting on the ground between the legs.
    const dish = sdf.smoothUnion(
      0.006,
      sdf.cylinder(0.042, 0.01, 0.004).at(0, 0.012, 0),
      sdf.torus(0.04, 0.006).at(0, 0.017, 0),
    );

    const ironShape = sdf
      .union(ring, brace, dish, ...legs)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z) => {
        // Dark at the ground, mid up the legs, a cool highlight on the ring top.
        let c = mixRgb(IRON_DARK, IRON_MID, clamp01(y / 0.18));
        c = mixRgb(c, IRON_LIGHT, 0.3 * clamp01((y - 0.15) / 0.08));
        c = mixRgb(c, IRON_DARK, 0.35 * clamp01((0.03 - y) / 0.03));
        return c;
      });
    k.body('iron', ironShape, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      maxTriangles: 800,
    });

    // ------------------------------------------------------------------ candle + flame
    const candle = sdf
      .smoothUnion(0.005, sdf.cylinder(0.02, 0.072, 0.005).at(0, 0.05, 0), sdf.sphere(0.02).at(0, 0.014, 0))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z, base) => mixRgb(base, rgb(IRON_DARK), 0.4 * clamp01((0.03 - y) / 0.03)));
    k.body('candle', candle, {
      color: WAX,
      roughness: 0.6,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 220,
    });

    const flame = sdf
      .smoothUnion(
        0.006,
        sdf.sphere(0.014).at(0, 0.104, 0),
        sdf.cone([0, 0.1, 0], [0, 0.142, 0], 0.013, 0.001),
      )
      .paintFn((x, y, z, base) => mixRgb(rgb('#ffe1a0'), base, clamp01((y - 0.098) / 0.02)));
    k.body('flame', flame, {
      color: '#4a1405',
      roughness: 0.2,
      metalness: 0,
      emissive: FLAME,
      emissiveIntensity: 1.8,
      detail: 0.004,
      maxTriangles: 160,
    });

    // ------------------------------------------------------------------ glass flask
    // Long swan-curved neck rising from the bulb top and curling forward-left.
    const neck = sdf.chain(
      [
        [0.0, 0.34, 0.0, 0.025],
        [0.0, 0.375, 0.002, 0.022],
        [0.006, 0.412, 0.008, 0.02],
        [0.024, 0.443, 0.017, 0.018],
        [0.055, 0.464, 0.028, 0.017],
        [0.092, 0.471, 0.037, 0.016],
        [0.126, 0.463, 0.044, 0.016],
        [0.152, 0.44, 0.048, 0.017],
        [0.166, 0.412, 0.05, 0.018],
      ],
      0.01,
    );
    const flask = sdf
      .smoothUnion(0.022, sdf.sphere(BULB_R).at(0, BULB_Y, 0), neck)
      // Open the mouth at the end of the neck.
      .subtract(sdf.sphere(0.02).at(0.171, 0.406, 0.051));
    // Upper bulb and neck: a hollow translucent glass shell. Two glass faces over each pixel
    // keep the silhouette solid in the binary sprite pass (a single 0.45 face is dropped there).
    const glassShape = flask.intersect(sdf.halfSpace([0, -1, 0], -LIQUID_TOP)).shell(0.005);
    k.body('glass', glassShape, {
      color: GLASS,
      roughness: 0.1,
      metalness: 0,
      opacity: 0.45,
      detail: 0.004,
      maxTriangles: 4000,
    });

    // ------------------------------------------------------------------ glowing liquid
    // Lower half of the bulb, 2 mm inside the glass so the two surfaces never coincide.
    const liquid = sdf
      .sphere(BULB_R - 0.002)
      .at(0, BULB_Y, 0)
      .intersect(sdf.halfSpace([0, 1, 0], LIQUID_TOP))
      .paintFn((x, y, z, base) => {
        let c = base;
        // Lighter meniscus at the flat surface.
        c = mixRgb(c, rgb('#8ef04a'), 0.4 * clamp01((y - 0.24) / 0.03));
        // Pale fizz patches.
        for (const [bx, by, bz, br] of BUBBLES) {
          const d = Math.hypot(x - bx, y - by, z - bz);
          c = mixRgb(c, rgb('#d6f5a8'), 0.85 * clamp01(1 - d / br));
        }
        return c;
      });
    k.body('liquid', liquid, {
      color: LIQUID_BASE,
      roughness: 0.2,
      metalness: 0,
      emissive: LIQUID_GLOW,
      emissiveIntensity: 1.8,
      detail: 0.007,
      maxTriangles: 550,
    });

    // ------------------------------------------------------------------ gold accents
    // Slim gold collar where the neck leaves the bulb, and a lip at the mouth.
    const collar = sdf.torus(0.025, 0.006).at(0.004, 0.398, 0.006);
    const lip = sdf.torus(0.02, 0.0055).rotateZ(206).at(0.164, 0.415, 0.05);
    k.body('gold', sdf.union(collar, lip), {
      color: GOLD,
      roughness: 0.3,
      metalness: 1,
      detail: 0.005,
      maxTriangles: 130,
    });
  },
});
