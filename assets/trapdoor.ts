import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * architecture/building-parts/trapdoor
 *
 * Role: closed floor hatch for the Sunken Vault. It must read at 128 px.
 * Size: 1.0 m x 1.0 m, about 0.12 m thick. It stands on y = 0. Front faces +Z.
 * One idea: warm oak planks in a proud iron frame, with two strap hinges and a gold ring pull.
 * Shape language: square boards and frame, round ring, rivets, and hinge barrels.
 * Palette: oak #c47a42 / #8a5428 / #e2b07a, iron #4a4f55 / #363a3f / #a8acb1,
 *   old gold #d4a93a. Moss #4d6b3a sits in one corner.
 * Materials: wood (roughness 0.82), iron (roughness 0.5, metalness 0.7), gold (roughness 0.3, metalness 1).
 * Detail: plank slab and iron frame (big), X brace and strap hinges (medium), ring pull (focal).
 * Rig: none. The hatch stays closed.
 */

const WOOD = rgb('#c47a42');
const WOOD_MID = rgb('#a86538');
const WOOD_DARK = rgb('#6e4224');
const WOOD_PALE = rgb('#e2b07a');
const MOSS = rgb('#4d6b3a');

const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#8e939a');

const GOLD = rgb('#d4a93a');
const GOLD_DARK = rgb('#8f6b1f');
const GOLD_LIGHT = rgb('#f0d078');

const PLANK_N = 4;
const PLANK_W = 0.185;
const PLANK_GAP = 0.02;
const PLANK_STEP = PLANK_W + PLANK_GAP;
const HINGE_Z = [-0.24, 0.24] as const;
const YAW = -34;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

const plankIndex = (x: number): number => Math.floor((x + (PLANK_N * PLANK_STEP) / 2) / PLANK_STEP);

const plankTint = (x: number): Rgb => {
  const i = plankIndex(x);
  const tint = noise.random(i + 3, 6, 2);
  let c = mixRgb(WOOD, WOOD_MID, 0.08 + 0.45 * tint);
  if (i === 0) c = mixRgb(c, WOOD_DARK, 0.35);
  if (i === 1) c = mixRgb(c, WOOD_PALE, 0.28);
  if (i === 2) c = mixRgb(c, WOOD_PALE, 0.5);
  return c;
};

const capPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  let c = plankTint(x);
  const grain = noise.fbm(x * 4, y * 6, z * 18, 3, 4);
  c = mixRgb(c, WOOD_DARK, clamp01(-grain) * 0.28);
  c = mixRgb(c, WOOD_PALE, clamp01(grain) * 0.14);
  const wear = smoothstep(0.18, 0.04, Math.hypot(x, z - 0.02));
  c = mixRgb(c, WOOD_DARK, wear * 0.2);
  const moss = smoothstep(0.22, 0.04, Math.hypot(x + 0.32, z + 0.32));
  c = mixRgb(c, MOSS, moss * 0.55);
  return c;
};

const ironPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const n = noise.fbm(x * 32, y * 32, z * 32, 2, 9);
  let c = mixRgb(IRON, IRON_DARK, clamp01(-n) * 0.35);
  c = mixRgb(c, IRON_HI, clamp01(n - 0.35) * 0.3);
  return c;
};

const goldPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const n = noise.fbm(x * 28, y * 28, z * 28, 2, 3);
  let c = mixRgb(GOLD, GOLD_DARK, clamp01(-n) * 0.36);
  c = mixRgb(c, GOLD_LIGHT, clamp01(n) * 0.16);
  return c;
};

export default defineAsset({
  name: 'trapdoor',
  description:
    'A closed 1 m wooden trapdoor lying flat: oak planks in a proud iron frame, ' +
    'a pale X brace, two strap hinges, and an old-gold ring pull.',
  detail: 0.012,
  reference: 'docs/item-mockups/trapdoor-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ wood
    // Dark bed shows in the seams. Four raised caps are the planks.
    const bed = sdf.box([0.98, 0.078, 0.98], 0.016).at(0, 0.039, 0);
    k.body('wood-bed', bed, {
      color: '#8a5428',
      roughness: 0.86,
      detail: 0.028,
      maxError: 0.005,
      maxTriangles: 140,
    });

    const caps = Array.from({ length: PLANK_N }, (_, i) => {
      const x = -((PLANK_N - 1) * PLANK_STEP) / 2 + i * PLANK_STEP;
      return sdf.box([PLANK_W, 0.022, 0.76], 0.007).at(x, 0.082, 0);
    });
    k.body('wood-planks', sdf.union(...caps).paintFn(capPaint), {
      color: WOOD,
      roughness: 0.82,
      detail: 0.014,
      maxError: 0.003,
      maxTriangles: 420,
      textureDensity: 1.6,
      paintWeight: 2,
      bump: (x, y, z) => 0.0011 * noise.fbm(x * 6, y * 4, z * 20, 3, 5),
    });

    const bar = sdf.box([0.44, 0.024, 0.062], 0.008);
    k.body('brace', sdf.union(bar.rotateY(40), bar.rotateY(-40)).at(0, 0.102, 0), {
      color: WOOD_PALE,
      roughness: 0.8,
      detail: 0.009,
      maxError: 0.002,
      maxTriangles: 240,
      bump: (x, y, z) => 0.0007 * noise.fbm(x * 10, y * 6, z * 10, 2, 8),
    });

    // ------------------------------------------------------------------ iron frame
    const railX = sdf.box([1, 0.046, 0.112], 0.012);
    const railZ = sdf.box([0.112, 0.046, 0.776], 0.012);
    // The +X rail is split so each strap can cross the frame and meet its barrel.
    const sideBit = (z0: number, z1: number) =>
      sdf.box([0.112, 0.046, z1 - z0], 0.01).at(0.444, 0.1, (z0 + z1) / 2);
    const frame = sdf.smoothUnion(
      0.008,
      railX.at(0, 0.1, 0.444),
      railX.at(0, 0.1, -0.444),
      railZ.at(-0.444, 0.1, 0),
      sideBit(-0.388, -0.31),
      sideBit(-0.17, 0.17),
      sideBit(0.31, 0.388),
    );
    k.body('iron-frame', frame.paintFn(ironPaint), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.016,
      maxError: 0.0035,
      maxTriangles: 520,
      bump: (x, y, z) => 0.00035 * noise.fbm(x * 36, y * 36, z * 36, 2, 11),
    });

    // ------------------------------------------------------------------ hinges on +X (the side view looks here)
    // Flat straps cross the frame gaps and end inside the barrels.
    const straps = HINGE_Z.map((z) => sdf.box([0.42, 0.028, 0.09], 0.008).at(0.24, 0.104, z));
    const barrels = HINGE_Z.map((z) =>
      sdf.cylinder(0.032, 0.12, 0.008).rotateX(90).at(0.45, 0.132, z),
    );
    k.body('hinge-straps', sdf.union(...straps).paintFn(ironPaint), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.009,
      maxError: 0.002,
      maxTriangles: 240,
    });
    k.body('hinge-barrels', sdf.union(...barrels).paintFn(ironPaint), {
      color: IRON_DARK,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      maxError: 0.0012,
      maxTriangles: 340,
    });

    const rivets = sdf.union(
      ...HINGE_Z.flatMap((z) => [
        sdf.sphere(0.015).at(0.32, 0.126, z),
        sdf.sphere(0.015).at(0.14, 0.126, z),
      ]),
      sdf
        .sphere(0.017)
        .at(0.43, 0.136, 0.43)
        .mirror('x', 0)
        .mirror('z', 0),
    );
    k.body('rivets', rivets.paintFn(ironPaint), {
      color: IRON_HI,
      roughness: 0.45,
      metalness: 0.75,
      detail: 0.007,
      maxError: 0.0014,
      maxTriangles: 320,
    });

    // Foot and saddle under the ring. Yaw matches the ring so the saddle crosses it.
    const mount = sdf
      .union(
        sdf.box([0.16, 0.016, 0.11], 0.006).at(0, 0.11, 0),
        sdf.box([0.11, 0.016, 0.032], 0.005).at(0, 0.122, 0),
      )
      .rotateY(YAW)
      .at(0, 0, 0.02);
    k.body('ring-mount', mount.paintFn(ironPaint), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.008,
      maxError: 0.0018,
      maxTriangles: 180,
    });

    // ------------------------------------------------------------------ gold ring
    const axleY = 0.158;
    const ringR = 0.082;
    const gold = sdf
      .union(
        sdf.cylinder(0.013, 0.09, 0.004).rotateX(90).at(0, axleY, 0),
        sdf.cylinder(0.026, 0.052, 0.006).rotateX(90).at(0, axleY, 0),
        sdf.torus(ringR, 0.018).rotateX(90).at(0, axleY + ringR, 0),
      )
      .rotateY(YAW)
      .at(0, 0, 0.02);
    k.body('gold-ring', gold.paintFn(goldPaint), {
      color: GOLD,
      roughness: 0.3,
      metalness: 1,
      detail: 0.0055,
      maxError: 0.0013,
      maxTriangles: 380,
    });
  },
});
