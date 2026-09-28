import { defineAsset, noise, sdf } from '../src/index.js';

/**
 * Spyglass, 0.4 m long, lying flat on y = 0, axis along Z, lens (front) toward +Z.
 * Role: hero gear pickup / tool icon, must read at 128 px.
 * One idea: three chunky telescoping brass tubes, each step ringed by a fat gold collar,
 * with a warm leather grip and a glass lens that catches the light.
 * Shape language: round and chunky (cylinders + soft collars), friendly chibi prop.
 * Palette: brass #c9973f dominant, gold #d4a93a collars (accent), leather #8a5a35
 * secondary, glass #7fd0f0 focal point.
 * Materials: brass (metal 1, rough 0.32), leather (rough 0.7), glass (rough 0.1, slight
 * emissive on a dark base).
 */

const Y = 0.034; // tube axis height = main tube radius, so it rests on y = 0

// Brass tube along Z centred at z.
const tube = (r: number, len: number, z: number, edge = 0.004) =>
  sdf.cylinder(r, len, edge).rotateX(90).at(0, Y, z);

export default defineAsset({
  name: 'spyglass',
  description: 'Brass spyglass with three telescoping tubes, leather grip, and glass lens.',
  detail: 0.01,
  reference: 'docs/item-mockups/spyglass-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- brass tubes
    // Eyepiece tube (back, smallest), middle tube, main tube (front, fattest).
    const eyepiece = tube(0.021, 0.12, -0.13);
    const middle = tube(0.027, 0.13, -0.015);
    const main = tube(0.034, 0.15, 0.125);

    // Collars ring each step; the front rim is the fattest ring.
    const collar = (r: number, z: number, w = 0.018) =>
      sdf.cylinder(r, w, 0.005).rotateX(90).at(0, Y, z);
    const collars = sdf.union(
      collar(0.0245, -0.185), // back of eyepiece
      collar(0.0245, -0.075), // eyepiece -> middle
      collar(0.0305, 0.045), // middle -> main
      collar(0.0375, 0.195, 0.02), // front rim
    );

    // Rounded end knob at the very back, like the mockup.
    const knob = sdf
      .smoothUnion(
        0.006,
        sdf.cylinder(0.017, 0.014, 0.005).rotateX(90).at(0, Y, -0.198),
        sdf.sphere(0.012).at(0, Y, -0.204),
      );

    const brass = sdf
      .union(eyepiece, middle, main, collars, knob)
      .paintWhere(
        // Collars and rim read as brighter gold against the brass tubes.
        sdf.union(
          collar(0.0255, -0.185, 0.024),
          collar(0.0255, -0.075, 0.024),
          collar(0.0315, 0.045, 0.024),
          collar(0.0385, 0.195, 0.028),
        ),
        '#d4a93a',
        0.004,
      );
    k.body('brass', brass, {
      color: '#cfa252',
      roughness: 0.32,
      metalness: 1,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 300, y * 300, z * 40, 2), // fine brushed brass
    });

    // ---------------------------------------------------------------- leather grip
    const grip = tube(0.0228, 0.075, -0.13);
    k.body('leather', grip, {
      color: '#8a5a35',
      roughness: 0.7,
      // Leather strap wound in a spiral, like the sword grip.
      bump: (x, y, z) =>
        0.0015 * Math.abs(Math.sin(Math.atan2(y - Y, x) + z * 170)) +
        0.0006 * noise.fbm(x * 200, y * 200, z * 60, 2),
    });

    // ---------------------------------------------------------------- glass lens
    // Slightly domed disc that pokes out of the front rim (tube caps at z = 0.2).
    const lens = sdf.ellipsoid([0.03, 0.03, 0.009]).at(0, Y, 0.203);
    k.body('lens', lens, {
      color: '#1c3540', // dark base so the emissive glow reads
      roughness: 0.1,
      metalness: 0,
      opacity: 0.9,
      emissive: '#7fd0f0',
      emissiveIntensity: 0.5,
    });
  },
});
