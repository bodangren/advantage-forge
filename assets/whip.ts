import { HAND_FIT, defineAsset, noise, sdf, mixRgb, rgb } from '../src/index.js';

/**
 * Whip (equipment/melee-weapons/whip), about 0.42 m wide, lying flat on y = 0.
 * Role: pickup / equipment icon, seen small in the hand or on the ground.
 * One idea: a neat spiral coil of leather thong beside a stubby braided handle,
 * with the thin tip trailing out of the coil — reads as "coiled whip" instantly.
 * Shape language: round and chunky (soft tube loops), the handle a straight
 * secondary axis. Palette: warm leather #8a5a35 / #5c3a22 dominant, dark walnut
 * knob, one gold collar accent where the thong meets the handle.
 * Materials: leather handle (braid bump), walnut knob, gold collar, leather thong.
 * No rig: a static ground prop.
 */

const LEATHER = rgb('#8a5a35');
const LEATHER_DARK = rgb('#5c3a22');
const WALNUT = rgb('#4a2e1a');
const GOLD = rgb('#d4a93a');

// The thong tube rides this high; its radius sets ground contact.
const THONG_Y = 0.0135;

export default defineAsset({
  name: 'whip',
  description:
    'A coiled leather whip lying on the ground: braided handle with a walnut knob and a gold collar, long leather thong looped in a flat spiral with the tip trailing out.',
  detail: 0.004,
  reference: 'docs/item-mockups/whip-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0.215, 0.021, 0], rotate: [0, 90, 90] },

  build(k) {
    // ---------------------------------------------------------------- thong
    // Flat spiral coil (start at +X, next to the handle), then a trailing tip.
    const pts: [number, number, number, number][] = [[0.134, 0.019, 0.002, 0.0145]];
    const TURNS = 2.1;
    const STEPS = 72;
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const a = t * TURNS * Math.PI * 2;
      const r = 0.115 - 0.077 * t;
      const rad = 0.0135 - 0.007 * t;
      pts.push([Math.cos(a) * r, THONG_Y, Math.sin(a) * r, rad]);
    }
    // Tip trails out of the coil toward -X, tapering to a thin point.
    const tail: [number, number, number, number][] = [
      [-0.005, 0.011, 0.075, 0.0062],
      [-0.075, 0.0095, 0.095, 0.0048],
      [-0.15, 0.007, 0.06, 0.0035],
      [-0.2, 0.005, -0.005, 0.0026],
    ];
    pts.push(...tail);
    const thong = sdf.chain(pts, 0.008).paintFn((x, y, z) => {
      const t = 0.5 + 0.5 * noise.fbm(x * 26, y * 26, z * 26, 2);
      return mixRgb(LEATHER, LEATHER_DARK, t * 0.55);
    });
    k.body('thong', thong, {
      color: '#8a5a35',
      roughness: 0.6,
      detail: 0.0035,
      maxTriangles: 1800,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 140, y * 140, z * 140, 2), // leather grain
    });

    // ---------------------------------------------------------------- handle
    // Stubby grip along +X, braided leather over a walnut core.
    const HANDLE_Y = 0.021;
    const braid = (x: number, y: number, z: number) =>
      Math.abs(Math.sin(Math.atan2(z, y - HANDLE_Y) + x * 55));
    const handle = sdf
      .cylinder(0.021, 0.17, 0.007)
      .rotateZ(90)
      .at(0.215, HANDLE_Y, 0)
      .paintFn((x, y, z) => mixRgb(LEATHER_DARK, LEATHER, braid(x, y, z) ** 1.5 * 0.75));
    k.body('handle', handle, {
      color: '#5c3a22',
      roughness: 0.62,
      detail: 0.0035,
      maxTriangles: 600,
      bump: (x, y, z) => 0.0024 * braid(x, y, z),
    });

    // ---------------------------------------------------------------- knob and collar
    const knob = sdf.ellipsoid([0.034, 0.03, 0.03]).at(0.315, 0.028, 0);
    k.body('knob', knob, {
      color: '#4a2e1a',
      roughness: 0.7,
      detail: 0.004,
      maxTriangles: 300,
    });

    const collar = sdf.cylinder(0.023, 0.012, 0.003).rotateZ(90).at(0.138, 0.022, 0);
    k.body('collar', collar, {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.003,
      maxTriangles: 250,
    });
  },
});
