import { HAND_FIT, defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Shortbow, 0.9 m, standing on the lower horn tip at y = 0. The stave curves
 * toward +Z. The taut string runs tip to tip on the -Z side.
 *
 * Role: ranged-weapon pickup and shop icon. It must read at 128 px.
 * Size: 0.9 m tall, centred on x = 0, grip centre near [0, 0.45, 0.20].
 * One idea: a deep D-curve of dark walnut, ended by fat cream horn caps that hook back toward the string (0.09 m long, 0.032 m thick).
 * Shape language: round limbs and nocks, one strong curve, a small grip cross.
 * Palette: walnut #4a3328 / #3a281f (dominant), leather #8a4a3a (mid),
 *   horn #f0e4c8 and string #b08a5a (light accents at the tips and the line).
 * Materials: wood (rough 0.82), horn (rough 0.42), leather (rough 0.66),
 *   string fibre (rough 0.78).
 * Detail: recurved limbs, hooked caps, full red-brown grip wrap between thick cream collars, big side knobs, thin taut tan string.
 * Rig: none. A static item.
 */

const WALNUT = rgb('#4a3328');
const WALNUT_DARK = rgb('#3a281f');
const WALNUT_LIGHT = rgb('#5a3f31');
const HORN = rgb('#f0e4c8');
const HORN_SHADE = rgb('#dcc8a0');
const LEATHER = '#8a4a3a';
const STRING = '#b08a5a';

const GRIP_Y = 0.45;
const GRIP_Z = 0.2;
const STRING_Z = -0.032;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default defineAsset({
  name: 'shortbow',
  description: 'Dark walnut shortbow with pale horn nocks, a leather grip wrap, and a taut string.',
  reference: 'docs/item-mockups/shortbow-mock.jpg',
  detail: 0.006,
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.45, 0.205], rotate: [0, -90, 0], twoHanded: true },

  build(k) {
    // ------------------------------------------------------------------ walnut limbs
    // A tapered rod bent into one smooth arc. bend() curves XY; the rotates
    // stand that arc on Y with the belly toward +Z.
    const half = 0.38;
    const rod = sdf.smoothUnion(
      0.03,
      sdf.cone([0, 0, 0], [-half, 0, 0], 0.03, 0.018),
      sdf.cone([0, 0, 0], [half, 0, 0], 0.03, 0.018),
    );
    const limbShape = rod.bend(1.36).rotateX(-90).rotateZ(90).rotateY(180).at(0, GRIP_Y, GRIP_Z);
    // The wood ends inside each horn sleeve (below), so no dark tip shows past a cap.
    const limbs = limbShape
      .intersect(sdf.halfSpace([0, 1, 0], 0.785))
      .intersect(sdf.halfSpace([0, -1, 0], -0.115))
      .paintFn((x, y, z) => {
        const belly = clamp01((0.16 - z) / 0.18);
        const grain = 0.5 + 0.5 * noise.fbm(x * 14, y * 3.2, z * 14, 3);
        const light = clamp01(0.78 - 0.58 * belly + 0.16 * (grain - 0.5));
        return mixRgb(WALNUT_DARK, mixRgb(WALNUT, WALNUT_LIGHT, grain * 0.4), light);
      });
    k.body('limbs', limbs, {
      color: '#4a3328',
      roughness: 0.6,
      metalness: 0,
      detail: 0.007,
      maxTriangles: 1500,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 18, y * 4, z * 18, 3),
    });

    // ------------------------------------------------------------------ pale horn nocks
    // A crescent: the cap swallows the wood tip, then curls past the string.
    // The lower crescent is the foot. A small flat keeps the bow on y = 0.
    const lowerHook = sdf.chain(
      [
        [0, 0.14, 0.078, 0.021],
        [0, 0.115, 0.062, 0.021],
        [0, 0.085, 0.040, 0.02],
        [0, 0.055, 0.012, 0.02],
        [0, 0.028, -0.018, 0.018],
        [0, 0.016, -0.042, 0.016],
      ],
      0.014,
    );
    const upperHook = sdf.chain(
      [
        [0, 0.765, 0.078, 0.021],
        [0, 0.790, 0.062, 0.021],
        [0, 0.820, 0.040, 0.02],
        [0, 0.850, 0.012, 0.02],
        [0, 0.877, -0.018, 0.018],
        [0, 0.889, -0.042, 0.016],
      ],
      0.014,
    );
    // A horn sleeve over each wood end: a thin shell of the limb that joins the cap.
    const sleeve = (y: number) => limbShape.round(0.005).intersect(sdf.box([0.2, 0.06, 0.4]).at(0, y, 0.05));
    const foot = lowerHook.smoothUnion(0.01, sleeve(0.13)).intersect(sdf.halfSpace([0, -1, 0], 0));

    // Horizontal oval, wide end outward: the side view shows the mockup's pale nub.
    const nub = sdf.ellipsoid([0.046, 0.027, 0.034]).at(0.052, GRIP_Y, GRIP_Z + 0.008);
    const collar = (y: number, z: number) => sdf.torus(0.031, 0.009).at(0, y, z);
    const horn = sdf
      .union(foot, upperHook.smoothUnion(0.01, sleeve(0.77)), collar(0.403, 0.2), collar(0.497, 0.2), nub.mirror('x', 0))
      .paintFn((_x, y) => mixRgb(HORN, HORN_SHADE, y < 0.14 || y > 0.76 ? 0.3 : 0.05));
    k.body('horn', horn, {
      color: '#f0e4c8',
      roughness: 0.42,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 2100,
      textureDensity: 1.3,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 28, y * 28, z * 28, 2),
    });

    // ------------------------------------------------------------------ leather grip wrap
    const wrap = sdf.capsule([0, 0.425, GRIP_Z], [0, 0.475, GRIP_Z], 0.031);
    // A leather band around each nub, the mockup's yoke over the pale oval.
    const yoke = sdf
      .torus(0.026, 0.007)
      .rotateZ(90)
      .scale([1, 0.92, 1.15])
      .at(0.04, GRIP_Y, GRIP_Z + 0.008)
      .mirror('x', 0);
    k.body('grip', sdf.smoothUnion(0.005, wrap, yoke), {
      color: LEATHER,
      roughness: 0.66,
      metalness: 0,
      detail: 0.0055,
      maxTriangles: 750,
      textureDensity: 1.3,
      bump: (x, y, z) => 0.001 * Math.abs(Math.sin(Math.atan2(z - GRIP_Z, x) * 2 + y * 120)),
    });

    // ------------------------------------------------------------------ taut string, -Z side
    // Ends sit in the horn crooks, just clear of the hook lip.
    const topSeat = sdf.surfacePoint(upperHook, [0, 0.865, STRING_Z], 0.001);
    const botSeat = sdf.surfacePoint(foot, [0, 0.04, STRING_Z], 0.001);
    k.body('string', sdf.capsule(botSeat, topSeat, 0.0055), {
      color: STRING,
      roughness: 0.78,
      metalness: 0,
      detail: 0.0035,
      maxTriangles: 160,
    });
  },
});
