import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/*
 * Design note - items/quest-and-treasure/key-iron (Chibi Quest quest key), reworked upright.
 *
 * Role: quest pickup and door key, a 128 px icon standing in the world.
 * Size: about 0.33 m tall with the small ring, 0.12 m wide base; stands on y = 0 in a flat
 *   grey stone base, bow facing +Z at the top, bit at the bottom pointing +X.
 * One idea: a rusty key with a big ring bow and a small second ring hung through it.
 * Shape language: round dominant (rings, shaft), square secondary (bit teeth, base).
 * Palette: dark brown iron #5e3f2c, recess #3a281c, rust patches #8a5230, brass tip #c8a070, base stone #6b6e72.
 * Materials: iron (metalness 0.6, roughness 0.55, pit bump) and stone base.
 * Detail: bow + shaft + bit (big); two collars, small ring (medium); rust paint (small).
 * Rig/animation: none.
 */

const RUST = '#5e3f2c';
const RUST_DARK = '#3a281c';
const RUST_EDGE = '#8a5230';
const STONE = '#6b6e72';
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const BOW_Y = 0.23;

export default defineAsset({
  name: 'key-iron',
  description:
    'Rusty iron quest key standing upright on a stone base: double-ring bow, collared shaft, two-tooth bit.',
  detail: 0.004,
  reference: 'docs/item-mockups/key-iron-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const bow = sdf.torus(0.05, 0.014).rotateX(90).at(0, BOW_Y, 0);
    const small = sdf.torus(0.027, 0.01).rotateZ(90).at(0, BOW_Y + 0.05, 0);
    const shaft = sdf.cylinder(0.016, 0.155, 0.004).at(0, 0.1225, 0);
    const collar = (y: number): sdf.Shape => sdf.cylinder(0.023, 0.014, 0.005).at(0, y, 0);
    const bitBase = sdf.box([0.05, 0.045, 0.024], 0.004).at(0.041, 0.0725, 0);
    const notch = sdf.box([0.02, 0.014, 0.04]).at(0.062, 0.0725, 0);
    const bit = sdf.subtract(bitBase, notch);
    const paint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const p = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 3, 5);
      let c = mixRgb(base, rgb(RUST_DARK), clamp01(0.4 - p) * 1.6);
      c = mixRgb(c, rgb(RUST_EDGE), clamp01((p - 0.6) * 6) * 0.85);
      return c;
    };
    const key = sdf
      .union(bow, small, shaft, collar(0.2), collar(0.178), bit)
      .round(0.001)
      .paintFn(paint)
      ;
    k.body('key', key, {
      color: RUST, roughness: 0.55, metalness: 0.6, detail: 0.004, textureDensity: 2,
      paintWeight: 2, maxTriangles: 4000,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 70, y * 70, z * 70, 3, 7),
    });
    const tip = sdf.capsule([0, 0.046, 0], [0, 0.046, 0], 0.0165).elongate(0, 0.0, 0).union(sdf.cylinder(0.0165, 0.03, 0.002).at(0, 0.048, 0));
    k.body('tip', tip.intersect(sdf.box([0.1, 0.06, 0.1]).at(0, 0.06, 0)), {
      color: '#c8a070', roughness: 0.4, metalness: 0.7, detail: 0.004, maxTriangles: 800,
    });
    const base = sdf.box([0.12, 0.03, 0.08], 0.006).at(0, 0.015, 0);
    k.body('base', base, {
      color: STONE, roughness: 0.9, metalness: 0, detail: 0.005, maxTriangles: 800,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 60, y * 60, z * 60, 3, 3),
    });
  },
});
