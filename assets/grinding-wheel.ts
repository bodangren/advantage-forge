import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — treadle grinding wheel (props/craft-and-trade/grinding-wheel).
 *
 * Role: blacksmith-shop tool prop; must read at 128 px as one stout stone
 *   wheel on a wooden frame.
 * Size: stone wheel 0.41 m diameter, 0.45 m overall tall, stands on y = 0,
 *   wheel face to +Z, treadle toward the operator at +Z. Wait — the wheel
 *   spins in the YZ plane (axle along X), treadle reaches +Z.
 * One idea: a fat warm-grey stone disc with a grooved rim, cradled between
 *   two chunky walnut posts, its lowest edge dipping into a water trough.
 * Shape language: round dominant (stone disc, rounded bevels everywhere),
 *   square secondary (chunky posts, skids, treadle board).
 * Palette: stone #8a8a82 (dominant), walnut #6b4226 (secondary), iron
 *   #4a4f55 (small), water #54626d (tiny accent). 60/30/10.
 * Materials: worn stone (roughness 0.9), walnut wood (roughness 0.8),
 *   worn iron (roughness 0.5, metalness 0.7), still water (roughness 0.15).
 * Detail: primary disc + posts + treadle; secondary axle, hub, crank,
 *   trough, skids; tertiary stone grain + rim groove, wood grain in bump.
 * Rig/animation: none (static prop).
 */

const STONE = rgb('#8a8a82');
const STONE_DARK = rgb('#6f6f68');
const STONE_LIGHT = rgb('#9c9c94');
const WOOD = rgb('#6b4226');
const WOOD_LIGHT = rgb('#8a5c36');
const WOOD_DARK = rgb('#4a2e18');
const IRON = '#4a4f55';
const WATER = '#46545e';

const AXLE_Y = 0.24;
const WHEEL_R = 0.205;

export default defineAsset({
  name: 'grinding-wheel',
  description:
    'Treadle grinding wheel: a grooved stone disc on a walnut frame with an iron axle, crank, treadle board, and a water trough the rim dips into.',
  detail: 0.016,
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- stone wheel
    // Fat disc, axis along X, with a circumferential groove carved at the rim.
    const disc = sdf.cylinder(WHEEL_R, 0.055, 0.01).rotateZ(90).at(0, AXLE_Y, 0);
    const groove = sdf.torus(0.196, 0.011).rotateZ(90).at(0, AXLE_Y, 0);
    const wheel = disc.subtract(groove);
    const stonePaint = (x: number, y: number, z: number) => {
      const dy = y - AXLE_Y;
      const r = Math.sqrt(dy * dy + z * z) / WHEEL_R;
      const rim = Math.min(1, Math.max(0, (r - 0.8) / 0.2)); // 0 face .. 1 rim
      const wear = 0.5 + 0.5 * noise.fbm(x * 7, y * 7, z * 7, 3);
      let c = mixRgb(STONE, STONE_DARK, 0.34 + 0.3 * rim * rim);
      c = mixRgb(c, STONE_LIGHT, 0.07 * wear * (1 - rim * 0.6));
      const crown = Math.min(1, Math.max(0, (y - 0.35) / 0.1)); // sun-lit top of the disc
      c = mixRgb(c, STONE_LIGHT, 0.22 * crown * crown);
      return c;
    };
    k.body('stone-wheel', wheel.paintFn(stonePaint), {
      color: '#8a8a82',
      roughness: 0.9,
      metalness: 0,
      detail: 0.012,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 34, y * 34, z * 34, 2),
      maxTriangles: 2200,
    });

    // ---------------------------------------------------------------- iron work
    // Axle through the posts, hub band on the wheel, crank arm at the left end.
    const axle = sdf.cylinder(0.015, 0.42).rotateZ(90).at(0, AXLE_Y, 0);
    const hub = sdf.cylinder(0.034, 0.07, 0.006).rotateZ(90).at(0, AXLE_Y, 0);
    const crank = sdf.box([0.02, 0.1, 0.03], 0.008).at(-0.185, AXLE_Y - 0.045, 0);
    k.body('iron-work', sdf.union(axle, hub, crank), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.01,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 450,
    });

    // ---------------------------------------------------------------- walnut frame
    // Two chunky posts on long skids, a back stretcher, the treadle board on
    // its fulcrum, the crank's wooden handle, and the water trough — one body.
    const post = sdf.box([0.07, 0.31, 0.1], 0.014).at(0.125, 0.155, 0);
    const skid = sdf.box([0.07, 0.05, 0.4], 0.012).at(0.125, 0.025, 0);
    const stretcher = sdf.box([0.24, 0.055, 0.055], 0.012).at(0, 0.05, -0.12);
    const treadle = sdf.box([0.13, 0.03, 0.3], 0.01).at(0, 0.055, 0.3);
    const fulcrum = sdf.box([0.1, 0.045, 0.05], 0.01).at(0, 0.0225, 0.17);
    const handle = sdf.cylinder(0.013, 0.06, 0.004).rotateZ(90).at(-0.215, 0.15, 0);
    // A hollow wooden tub (outer block minus an inner cavity, open at the top).
    const trough = sdf
      .box([0.17, 0.05, 0.17], 0.012)
      .at(0, 0.025, 0)
      .subtract(sdf.box([0.13, 0.06, 0.13], 0.006).at(0, 0.042, 0));
    const frame = sdf.union(
      post.mirror('x', 0),
      skid.mirror('x', 0),
      stretcher,
      treadle,
      fulcrum,
      handle,
      trough,
    );
    const woodPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 24, y * 5, z * 24, 2);
      const patch = 0.5 + 0.5 * noise.fbm(x * 6 + 9, y * 6, z * 6, 2);
      let c = mixRgb(WOOD, WOOD_LIGHT, 0.1 * grain + 0.14 * patch);
      c = mixRgb(c, WOOD_DARK, 0.45 * grain * grain * grain);
      const low = Math.max(0, 1 - y / 0.09);
      c = mixRgb(c, WOOD_DARK, 0.45 * low * low);
      const top = Math.min(1, Math.max(0, (y - 0.24) / 0.08)); // sun-lit post tops
      c = mixRgb(c, WOOD_LIGHT, 0.22 * top * top);
      return c;
    };
    k.body('frame', frame.paintFn(woodPaint), {
      color: '#6b4226',
      roughness: 0.8,
      metalness: 0,
      detail: 0.01,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 7, z * 30, 2),
      maxTriangles: 1600,
    });

    // ---------------------------------------------------------------- trough water
    // Still, dark sheet of water inside the tub, the wheel's edge just above it.
    k.body('water', sdf.box([0.12, 0.012, 0.12], 0.004).at(0, 0.028, 0), {
      color: WATER,
      roughness: 0.15,
      metalness: 0.1,
      detail: 0.006,
      maxTriangles: 60,
    });
  },
});
