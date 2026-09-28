import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — mine elevator platform (architecture/structure/elevator-platform).
 *
 * Role: interactive structure in the Sunken Vault dungeon; the lift the player
 *   rides down. Must read at 128 px and from the side.
 * Size: 2 m wide frame, 3 m tall, stands on y = 0, front toward +Z.
 * One idea: a chunky plank lift hanging inside a four-post wooden gantry,
 *   with one rope over a big top pulley wheel and an iron crank winch.
 * Shape language: square dominant (posts, beams, planks), round secondary
 *   (pulley wheel, drum, rope curves).
 * Palette: honey-brown wood family #8a5a30 / #c99a5c / #3a2210 (dominant);
 *   worn iron #4a4f55 with #a8acb1 highlight (secondary); old gold #d4a93a
 *   pin accents; rope #9a8a6a; one warm lantern glow #ff9a3c as the accent.
 * Materials: wood (roughness 0.82), worn iron (roughness 0.5, metalness 0.7),
 *   gold (metalness 1), rope (roughness 0.9), emissive glass (glow).
 * Detail: primary = posts + top beams + plank deck; secondary = guard rails,
 *   pulley wheel, crank winch, ropes; tertiary = plank seams, grain in bump.
 * Focal point: the pulley wheel with rope over it, above the deck.
 * Rig/animation: none (static structure).
 */

const WOOD_MID = rgb('#8a5a30');
const WOOD_LIGHT = rgb('#c99a5c');
const WOOD_DARK = rgb('#3a2210');


const POST_X = 0.9;
const POST_Z = 0.4;
const DECK_TOP = 0.55;

// Vertical timber grain, slightly lighter where sun hits upper faces.
const timberPaint = (x: number, y: number, z: number) => {
  const grain = 0.5 + 0.5 * noise.fbm(x * 9, y * 1.6, z * 9, 2);
  const patch = 0.5 + 0.5 * noise.fbm(x * 3, y * 3, z * 3, 2);
  let c = mixRgb(WOOD_MID, WOOD_LIGHT, 0.04 + 0.12 * grain);
  c = mixRgb(c, WOOD_MID, 0.42 * patch);
  // Damp, dark feet like the barrel's shaded foot.
  const damp = Math.max(0, 1 - y / 0.5);
  return mixRgb(c, WOOD_DARK, 0.45 * damp * damp);
};

export default defineAsset({
  name: 'elevator-platform',
  description:
    'Chunky mine elevator: plank lift deck with guard rails in a four-post wooden gantry, rope over an iron pulley wheel, and an iron crank winch with a hanging lantern.',
  detail: 0.01,
  reference: 'docs/item-mockups/elevator-platform-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- wood frame
    // Four corner posts + two top beams + side braces + deck supports.
    const post = (x: number, z: number) =>
      sdf.box([0.13, 2.9, 0.13], 0.02).at(x, 1.45, z);
    const beam = (z: number) => sdf.box([1.98, 0.15, 0.13], 0.02).at(0, 2.86, z);
    const brace = sdf
      .box([0.08, 1.24, 0.08], 0.015)
      .rotateX(-36)
      .at(POST_X, 2.0, 0)
      .mirror('x', 0);
    const support = (z: number) =>
      sdf.box([1.86, 0.09, 0.1], 0.015).at(0, 0.44, z);
    // Pulley cheek plate rising from the front top beam.
    const cheek = sdf.box([0.18, 0.3, 0.06], 0.015).at(0, 2.93, 0.38);
    const frame = sdf.union(
      post(-POST_X, -POST_Z),
      post(POST_X, -POST_Z),
      post(-POST_X, POST_Z),
      post(POST_X, POST_Z),
      beam(-POST_Z),
      beam(POST_Z),
      brace,
      support(-0.3),
      support(0.3),
      cheek,
    );
    k.body('frame', frame.paintFn(timberPaint), {
      color: '#8a5a30',
      roughness: 0.82,
      metalness: 0,
      detail: 0.016,
      maxTriangles: 2000,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 24, y * 4, z * 24, 2),
    });

    // ------------------------------------------------------------- plank deck
    // Planks run along X; seams across Z, per-plank tint, dark gaps.
    const deckShape = sdf.box([1.72, 0.09, 0.98], 0.015).at(0, DECK_TOP - 0.045, 0);
    const deckPaint = (x: number, y: number, z: number) => {
      const u = (z + 0.49) / 0.163;
      const idx = Math.floor(u);
      const f = u - idx;
      const edge = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 6);
      const tint = noise.random(idx, 5, 2);
      const grain = 0.5 + 0.5 * noise.fbm(x * 22, 0, z * 4, 2);
      let c = mixRgb(WOOD_MID, WOOD_LIGHT, 0.2 + 0.32 * tint);
      c = mixRgb(c, WOOD_DARK, 0.62 * edge);
      c = mixRgb(c, WOOD_LIGHT, 0.1 * grain);
      return c;
    };
    k.body('deck', deckShape.paintFn(deckPaint), {
      color: '#8a5a30',
      roughness: 0.82,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 900,
      bump: (x, y, z) => {
        const u = (z + 0.49) / 0.163;
        const f = u - Math.floor(u);
        const edge = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 6);
        return -0.0022 * edge + 0.0014 * noise.fbm(x * 26, y * 6, z * 26, 2);
      },
    });

    // ------------------------------------------------------------- guard rails
    // Two planks high on the front and both sides; open at the back.
    const railBar = (w: number, d: number, x: number, y: number, z: number) =>
      sdf.box([w, 0.07, d], 0.018).at(x, y, z);
    const rails = sdf.union(
      railBar(1.7, 0.05, 0, 0.8, 0.46),
      railBar(1.7, 0.05, 0, 1.0, 0.46),
      railBar(0.05, 0.9, -0.84, 0.8, 0),
      railBar(0.05, 0.9, 0.84, 0.8, 0),
      railBar(0.05, 0.9, -0.84, 1.0, 0),
      railBar(0.05, 0.9, 0.84, 1.0, 0),
      railBar(0.06, 0.06, -0.84, 0.78, 0.46),
      railBar(0.06, 0.06, 0.84, 0.78, 0.46),
    );
    k.body('rails', rails.paintFn(timberPaint), {
      color: '#8a5a30',
      roughness: 0.82,
      metalness: 0,
      detail: 0.013,
      maxTriangles: 720,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 24, y * 4, z * 24, 2),
    });

    // ------------------------------------------------------------- pulley wheel
    // Iron rim + hub + axle, mounted on the cheek plate above the front beam.
    const wheelC = [0, 2.9, 0.54] as const;
    const rim = sdf.torus(0.22, 0.05).rotateX(90).at(...wheelC);
    const axle = sdf.cylinder(0.026, 0.3, 0.008).rotateX(90).at(0, 2.9, 0.47);
    k.body('pulley', sdf.union(rim, axle), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.007,
      maxTriangles: 700,
    });
    // Old gold hub fills the rim center: the focal accent.
    const hub = sdf.cylinder(0.07, 0.15, 0.012).rotateX(90).at(...wheelC);
    k.body('hub', hub, {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.005,
      maxTriangles: 250,
    });

    // ------------------------------------------------------------- rope
    // One rope over the wheel, down to the deck's front corners.
    const rope = sdf.chain(
      [
        [-0.8, 0.62, 0.4, 0.026],
        [-0.45, 1.55, 0.46, 0.026],
        [-0.12, 2.45, 0.52, 0.027],
        [0, 2.9, 0.6, 0.029],
        [0.12, 2.45, 0.52, 0.027],
        [0.45, 1.55, 0.46, 0.026],
        [0.8, 0.62, 0.4, 0.026],
      ],
      0.02,
    );
    k.body('rope', rope, {
      color: '#9a8a6a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.009,
      maxTriangles: 600,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 30, z * 30, 2),
    });

    // ------------------------------------------------------------- crank winch
    // Drum + axle on the right front post, arm, and a wooden grip.
    const drum = sdf.cylinder(0.085, 0.14, 0.012).rotateZ(90).at(1.0, 1.15, POST_Z);
    const crankAxle = sdf.cylinder(0.028, 0.34, 0.008).rotateZ(90).at(1.2, 1.15, POST_Z);
    const arm = sdf.cone([1.37, 1.15, POST_Z], [1.37, 0.96, 0.57], 0.032, 0.032);
    k.body('crank', sdf.union(drum, crankAxle, arm), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      maxTriangles: 600,
    });
    const grip = sdf
      .smoothUnion(
        0.01,
        sdf.cylinder(0.04, 0.2, 0.012).rotateZ(90).at(1.47, 0.96, 0.57),
        sdf.sphere(0.036).at(1.57, 0.96, 0.57),
      )
      .paint(rgb('#d4a93a'));
    k.body('grip', grip, {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 250,
    });

    // ------------------------------------------------------------- lantern
    // A small warm lantern hangs off the front top beam.
    const hook = sdf.chain(
      [
        [-0.55, 2.82, POST_Z, 0.014],
        [-0.55, 2.62, POST_Z, 0.014],
      ],
      0.008,
    );
    const caps = sdf.union(
      sdf.cylinder(0.055, 0.025, 0.008).at(-0.55, 2.6, POST_Z),
      sdf.cylinder(0.055, 0.025, 0.008).at(-0.55, 2.44, POST_Z),
    );
    k.body('lantern-iron', sdf.union(hook, caps), {
      color: '#363a3f',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      maxTriangles: 300,
    });
    const glow = sdf.cylinder(0.042, 0.1, 0.01).at(-0.55, 2.52, POST_Z);
    k.body('lantern-glow', glow, {
      color: '#4a1405',
      roughness: 0.2,
      metalness: 0,
      emissive: '#ff9a3c',
      emissiveIntensity: 1.8,
      detail: 0.01,
      maxTriangles: 200,
    });
  },
});
