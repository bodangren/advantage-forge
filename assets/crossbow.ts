import { HAND_FIT, defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — crossbow (equipment/ranged-weapons/crossbow).
 *
 * Role: a ranged-weapon pickup. It must read at 128 px.
 * Size: the wooden stock is 0.6 m along Z. The steel prod is 0.5 m along X.
 *   The weapon lies on y = 0, centred on X, and faces +Z.
 * One idea: a cocked crossbow with a wide swept prod and a loaded bolt.
 * Shape language: a round tiller, square cheeks, and one sharp bolt tip.
 * Palette: honey oak #b5814a, warm brown #8a5a35, pale wood #c9a06a,
 *   walnut #6b4226, iron #4a4f55 / #363a3f / #a8acb1, steel #c8ccd2,
 *   leather #5c3a22, gold #d4a93a. The bolt head is the accent.
 * Materials: wood, worn iron, polished steel, leather, gold.
 * Detail: tiller, pale cheeks, swept prod, taut string, nut, trigger, bolt.
 *   The lock and the bolt head are the focal point.
 * Rig: none. A static item.
 */

const HONEY = rgb('#b5814a');
const WARM = rgb('#8a5a35');
const PALE = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const STEEL = rgb('#c8ccd2');
const STEEL_DEEP = rgb('#8e959e');
const GOLD = rgb('#d4a93a');
const GOLD_DEEP = rgb('#a67c22');

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Stock runs from z = -0.32 to z = 0.28 (0.60 m). Prod tips sit at x = ±0.25.
const TILLER_Y = 0.042;
const TILLER_R = 0.024;
const BOLT_Y = 0.072;
const BOW_Z = 0.236;

const woodPaint = (x: number, y: number, z: number) => {
  const grain = 0.5 + 0.5 * noise.fbm(x * 16, y * 12, z * 28, 3);
  const streak = 0.5 + 0.5 * noise.fbm(x * 48, y * 8, z * 4, 2);
  const bolt = y > 0.06 && Math.abs(x) < 0.01 && z > 0.0 && z < 0.34;
  if (bolt) return mixRgb(WARM, PALE, 0.2 + 0.55 * streak);
  const pale = z > 0.15 || z < -0.24;
  if (pale) return mixRgb(HONEY, PALE, 0.78 + 0.16 * grain);
  return mixRgb(WARM, HONEY, 0.32 + 0.5 * grain);
};

const ironPaint = (x: number, y: number, z: number) => {
  const n = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 18, 2);
  const up = clamp01((y - 0.03) / 0.06);
  const base = mixRgb(IRON_DEEP, IRON, 0.35 + 0.5 * n);
  return mixRgb(base, IRON_LIGHT, up * 0.3);
};

const steelPaint = (x: number, y: number, z: number) => {
  const n = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 22, 2);
  const tip = clamp01((Math.abs(x) - 0.2) / 0.06) + clamp01((z - 0.3) / 0.08);
  return mixRgb(STEEL_DEEP, STEEL, clamp01(0.32 + 0.4 * n + tip * 0.28));
};

export default defineAsset({
  name: 'crossbow',
  description: 'Cocked honey-oak crossbow with a steel prod, a taut string, and a loaded bolt.',
  reference: 'docs/item-mockups/crossbow-mock.jpg',
  detail: 0.006,
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, frame: 'body', origin: [0, 0.05, -0.07], twoHanded: true },

  build(k) {
    // ------------------------------------------------------------------ wood stock
    // The tiller sits clear of the ground. The butt and the cheeks are the feet.
    const tiller = sdf.cylinder(TILLER_R, 0.48, 0.005).rotateX(90).at(0, TILLER_Y, -0.03);
    const cheeks = sdf.box([0.152, 0.096, 0.104], 0.014).at(0, 0.048, 0.232);
    const butt = sdf.box([0.074, 0.06, 0.062], 0.012).at(0, 0.03, -0.289);
    const groove = sdf.box([0.018, 0.018, 0.3], 0.003).at(0, 0.07, 0.02);
    const mouth = sdf.cylinder(0.014, 0.14, 0.002).rotateX(90).at(0, BOLT_Y, 0.232);
    const ground = sdf.halfSpace([0, -1, 0], 0);
    const stock = sdf
      .smoothUnion(0.012, tiller, cheeks, butt)
      .smoothSubtract(0.005, groove, mouth)
      .intersect(ground);

    const shaft = sdf.capsule([0, BOLT_Y, 0.014], [0, BOLT_Y, 0.3], 0.0074);
    k.body('wood', stock.union(shaft).paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.0065,
      maxTriangles: 1600,
      bump: (x, y, z) => 0.0011 * noise.fbm(x * 14, y * 10, z * 26, 3),
    });

    // ------------------------------------------------------------------ swept steel prod
    // A circular arc in XZ. Tips sit behind the cheeks so the cocked bow reads.
    const prod = sdf.chain(
      [
        [-0.22, 0.05, 0.133, 0.01],
        [-0.18, 0.046, 0.172, 0.012],
        [-0.13, 0.042, 0.204, 0.0135],
        [-0.07, 0.038, 0.228, 0.015],
        [0, 0.036, BOW_Z, 0.016],
        [0.07, 0.038, 0.228, 0.015],
        [0.13, 0.042, 0.204, 0.0135],
        [0.18, 0.046, 0.172, 0.012],
        [0.22, 0.05, 0.133, 0.01],
      ],
      0.018,
    );
    // Flat spearhead. It continues the limb and brings the prod out to 0.5 m.
    const nock = sdf
      .smoothUnion(0.004, sdf.cone([0, 0, 0], [0.056, 0, 0], 0.014, 0.006), sdf.sphere(0.011).at(0.002, 0, 0))
      .scale([1, 0.72, 0.88])
      .rotateY(34)
      .at(0.202, 0.048, 0.15);
    const nocks = nock.mirror('x', 0);
    k.body('prod', prod.paintFn(ironPaint), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0048,
      maxTriangles: 1400,
      bump: (x, y, z) => 0.00035 * noise.fbm(x * 22, y * 22, z * 22, 2),
    });

    // ------------------------------------------------------------------ nut, trigger, bow bridle
    const nut = sdf
      .box([0.05, 0.036, 0.04], 0.012)
      .at(0, 0.08, -0.016)
      .smoothSubtract(0.004, sdf.box([0.022, 0.016, 0.02], 0.002).at(0, 0.086, 0.0));
    // Wide pad so the lever breaks the side silhouette, not only the shadow.
    const trigger = sdf.smoothUnion(
      0.008,
      sdf.capsule([0, 0.028, -0.01], [0, 0.016, -0.05], 0.009),
      sdf.ellipsoid([0.044, 0.014, 0.018]).at(0, 0.016, -0.058),
    );
    const bridle = sdf.box([0.12, 0.012, 0.022], 0.004).at(0, 0.1, 0.218);
    k.body('iron', sdf.union(nut, trigger, bridle).paintFn(ironPaint), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0045,
      maxTriangles: 950,
    });

    // ------------------------------------------------------------------ bolt head and limb tips
    const head = sdf.smoothUnion(
      0.005,
      sdf.cone([0, BOLT_Y, 0.298], [0, BOLT_Y, 0.362], 0.016, 0.005),
      sdf.sphere(0.012).at(0, BOLT_Y, 0.3),
    );
    k.body('steel', sdf.union(head, nocks).paintFn(steelPaint), {
      color: '#c8ccd2',
      roughness: 0.32,
      metalness: 1,
      detail: 0.0038,
      maxTriangles: 650,
    });

    // ------------------------------------------------------------------ taut string, nock to nut
    const catchPt = sdf.surfacePoint(nut, [0, BOLT_Y, 0.012], -0.001);
    const leftSeat = sdf.surfacePoint(nocks, [-0.225, 0.05, 0.12], -0.001);
    const rightSeat = sdf.surfacePoint(nocks, [0.225, 0.05, 0.12], -0.001);
    const string = sdf.union(
      sdf.capsule(leftSeat, catchPt, 0.0052),
      sdf.capsule(rightSeat, catchPt, 0.0052),
    );
    k.body('string', string, {
      color: '#a8acb1',
      roughness: 0.55,
      metalness: 0.35,
      detail: 0.003,
      maxTriangles: 260,
    });

    // ------------------------------------------------------------------ leather grip and fletching
    const wrap = sdf
      .cylinder(0.031, 0.086, 0.004)
      .rotateX(90)
      .at(0, TILLER_Y, -0.155)
      .intersect(ground);
    const vane = sdf.box([0.006, 0.012, 0.022], 0.002);
    const vanes = sdf.union(
      vane.at(0, 0.088, 0.042),
      vane.rotateZ(22).at(0.006, 0.084, 0.044),
      vane.rotateZ(-22).at(-0.006, 0.084, 0.044),
    );
    k.body('leather', sdf.union(wrap, vanes).paintFn((x, y, z) => (y > 0.068 && z > 0.01 ? rgb('#8a5a35') : rgb('#5c3a22'))), {
      color: '#5c3a22',
      roughness: 0.68,
      metalness: 0,
      detail: 0.0045,
      maxTriangles: 420,
      bump: (x, y, z) => 0.001 * Math.abs(Math.sin(Math.atan2(y - TILLER_Y, x) * 2 + z * 90)),
    });

    // ------------------------------------------------------------------ gold lock cap and cheek pins
    const cap = sdf.box([0.028, 0.008, 0.022], 0.003).at(0, 0.1, -0.016);
    const pin = sdf.sphere(0.0065).at(0.02, 0.05, 0.286);
    const gold = sdf
      .union(cap, pin.mirror('x', 0))
      .paintFn((_x, y) => mixRgb(GOLD_DEEP, GOLD, clamp01((y - 0.04) / 0.06)));
    k.body('gold', gold, {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.0035,
      maxTriangles: 200,
    });
  },
});
