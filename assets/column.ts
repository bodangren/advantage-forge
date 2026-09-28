import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — stone column (architecture/building-parts/column).
 *
 * Role: dungeon architecture piece for the Sunken Vault; must read at 128 px sprite.
 * Size: 2.2 m tall, 0.62 m wide at the base, stands on y = 0, faces +Z.
 * One idea: a chunky, softly beveled stone column — square base and capital gripping
 *   a round fluted shaft, with one bold crack splitting the capital.
 * Shape language: square dominant (base, capital — sturdy), round secondary
 *   (fluted shaft), small gold accent collars where shaft meets stone.
 * Palette: dungeon stone mid #6f7680 (dominant), light worn #9aa2ac, dark #4b525c
 *   (recesses, crack), crack shadow #33383f; accent old gold #d4a93a collars.
 * Materials: stone (roughness 0.9, metalness 0) for base/shaft/capital; worn gold
 *   (roughness 0.45, metalness 1) for collars. Flutes in `displace`, grain in `bump`.
 * Detail: primary base + shaft + capital; secondary gold collars + crack;
 *   tertiary stone grain and worn edges. Focal point: the cracked capital.
 * Rig/animation: none (static architecture).
 */

const STONE = rgb('#6f7680');
const STONE_LIGHT = rgb('#a3aab4');
const STONE_DARK = rgb('#434a53');
const STONE_DEEP = rgb('#272c34');
const CRACK = rgb('#1f232b');
const GOLD = rgb('#d4a93a');
const GOLD_DARK = rgb('#8f6f20');

const FLUTES = 12;
// 1 at the bottom of a flute valley, 0 at a ridge crest.
const fluteValley = (x: number, z: number) => {
  const a = Math.atan2(z, x);
  const u = ((a + Math.PI) / (Math.PI * 2)) * FLUTES;
  const f = u - Math.floor(u);
  return Math.pow(0.5 - 0.5 * Math.cos(Math.PI * 2 * f), 2);
};

// Jagged crack strip (centerline zigzags up in +Y), about 0.02 m wide, 0.2 m tall.
const CRACK_PROFILE = profile.polygon([
  [0.011, 0],
  [0.026, 0.05],
  [0.001, 0.1],
  [0.023, 0.15],
  [0.003, 0.2],
  [-0.011, 0.2],
  [-0.031, 0.15],
  [-0.007, 0.1],
  [-0.029, 0.05],
  [-0.011, 0],
]);

const stoneBump = (amp: number) => (x: number, y: number, z: number) =>
  amp * noise.fbm(x * 24, y * 24, z * 24, 2);

export default defineAsset({
  name: 'column',
  description:
    'Chunky dungeon stone column: square base block, round fluted shaft, square cracked capital, worn gold collars.',
  detail: 0.008,
  reference: 'docs/item-mockups/column-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- base + plinth
    const baseBox = sdf.box([0.62, 0.26, 0.62], 0.03).at(0, 0.13, 0);
    const plinth = sdf.box([0.48, 0.09, 0.48], 0.025).at(0, 0.305, 0);
    const baseShape = baseBox.smoothUnion(0.02, plinth);
    const basePaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 4 + 3, y * 4, z * 4, 3);
      const speck = 0.5 + 0.5 * noise.fbm(x * 32, y * 32, z * 32, 2);
      let c = mixRgb(STONE, STONE_DARK, 0.55 * patch);
      c = mixRgb(c, STONE_LIGHT, 0.08 * speck);
      // Worn edges: near the surface of either box, lighten in noise patches.
      const eBase = Math.max(Math.abs(x) / 0.31, Math.abs(z) / 0.31, Math.abs(y - 0.13) / 0.13);
      const ePlinth = Math.max(
        Math.abs(x) / 0.24,
        Math.abs(z) / 0.24,
        Math.abs(y - 0.305) / 0.045,
      );
      const e = Math.max(eBase, ePlinth);
      const wear =
        Math.min(1, Math.max(0, (e - 0.66) / 0.3)) *
        (0.45 + 0.55 * (0.5 + 0.5 * noise.fbm(x * 14 + 9, y * 14, z * 14, 2)));
      c = mixRgb(c, STONE_LIGHT, 0.5 * wear);
      // Ground shadow: damp dark near the floor.
      const shade = Math.min(1, Math.max(0, 1 - y / 0.5));
      return mixRgb(c, STONE_DEEP, 0.55 * shade * shade);
    };
    k.body('base', baseShape.paintFn(basePaint), {
      color: '#6f7680',
      roughness: 0.9,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      bump: stoneBump(0.0022),
      maxTriangles: 1300,
    });

    // ------------------------------------------------------------- fluted shaft
    const shaftProfile = profile.polygon(
      [
        [0, 0.352],
        [0.165, 0.352],
        [0.19, 0.42],
        [0.191, 0.6],
        [0.183, 1.0],
        [0.173, 1.45],
        [0.176, 1.72],
        [0.19, 1.85],
        [0.198, 1.87],
        [0, 1.87],
      ],
      { smooth: true, samples: 14 },
    );
    // Chunky flutes carved into the surface; grain stays in `bump`.
    const shaftShape = sdf
      .revolve(shaftProfile)
      .displace(-0.0095, (x, _y, z) => fluteValley(x, z));
    const shaftPaint = (x: number, y: number, z: number) => {
      const g = fluteValley(x, z);
      const patch = 0.5 + 0.5 * noise.fbm(x * 4 + 5, y * 4, z * 4, 3);
      let c = mixRgb(STONE, STONE_DARK, 0.44 * patch);
      c = mixRgb(c, STONE_DARK, 0.65 * g); // flute valleys catch shadow
      const t = Math.min(1, Math.max(0, (y - 0.35) / 1.5));
      c = mixRgb(c, STONE_LIGHT, 0.13 * t * t); // lighter toward the capital
      c = mixRgb(c, STONE_DEEP, 0.42 * Math.max(0, 1 - t * 2.2)); // damp base
      return c;
    };
    // Contact shadows: under the top collar and under the capital overhang.
    const shaftShadows = sdf.union(
      sdf.box([0.5, 0.07, 0.5]).at(0, 1.82, 0),
      sdf.box([0.5, 0.08, 0.5]).at(0, 0.39, 0),
    );
    k.body('shaft', shaftShape.paintFn(shaftPaint).paintWhere(shaftShadows, STONE_DEEP, 0.012), {
      color: '#6f7680',
      roughness: 0.9,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      bump: stoneBump(0.0016),
      maxTriangles: 2200,
    });

    // ------------------------------------------------------------- gold collars
    const collarShape = sdf.union(
      sdf.cylinder(0.212, 0.055, 0.012).at(0, 0.4, 0),
      sdf.cylinder(0.208, 0.055, 0.012).at(0, 1.8, 0),
    );
    const collarPaint = (x: number, y: number, z: number) => {
      const e = Math.max(Math.hypot(x, z) / 0.212, Math.abs(y % 0.55 > 0.28 ? y - 1.8 : y - 0.4) / 0.028);
      const wear = Math.min(1, Math.max(0, (e - 0.55) / 0.45));
      const s = 0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2);
      return mixRgb(GOLD, GOLD_DARK, 0.55 * Math.min(1, wear * (0.5 + s)));
    };
    k.body('collars', collarShape.paintFn(collarPaint), {
      color: '#d4a93a',
      roughness: 0.45,
      metalness: 1,
      detail: 0.006,
      maxTriangles: 700,
    });

    // ------------------------------------------------------------- capital
    const abacus = sdf.box([0.6, 0.2, 0.6], 0.03).at(0, 2.1, 0);
    const echinus = sdf.box([0.5, 0.13, 0.5], 0.035).at(0, 1.935, 0);
    // One bold crack: down the front face of the abacus, branching over its top.
    const crackFront = sdf.extrude(CRACK_PROFILE, 0.5).at(-0.1, 2.0, 0.08);
    const crackTop = sdf.extrude(CRACK_PROFILE, 0.5).rotateX(90).at(-0.1, 2.16, 0.1);
    const crackStencils = sdf.union(crackFront, crackTop);
    const capitalShape = abacus
      .smoothUnion(0.02, echinus)
      .subtract(crackStencils);
    const capitalPaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 4 + 11, y * 4, z * 4, 3);
      const speck = 0.5 + 0.5 * noise.fbm(x * 32, y * 32, z * 32, 2);
      let c = mixRgb(STONE, STONE_DARK, 0.52 * patch);
      c = mixRgb(c, STONE_LIGHT, 0.08 * speck);
      const eAba = Math.max(Math.abs(x) / 0.3, Math.abs(z) / 0.3, Math.abs(y - 2.1) / 0.1);
      const eEch = Math.max(
        Math.abs(x) / 0.25,
        Math.abs(z) / 0.25,
        Math.abs(y - 1.935) / 0.065,
      );
      const e = Math.max(eAba, eEch);
      const wear =
        Math.min(1, Math.max(0, (e - 0.66) / 0.3)) *
        (0.45 + 0.55 * (0.5 + 0.5 * noise.fbm(x * 14 + 2, y * 14, z * 14, 2)));
      c = mixRgb(c, STONE_LIGHT, 0.5 * wear);
      c = mixRgb(c, STONE_LIGHT, 0.12 * Math.max(0, (y - 1.95) / 0.25)); // sunlit top
      return c;
    };
    k.body(
      'capital',
      capitalShape
        .paintFn(capitalPaint)
        .paintWhere(sdf.box([0.62, 0.03, 0.62]).at(0, 1.985, 0), STONE_DARK, 0.018)
        .paintWhere(crackStencils, CRACK, 0.006),
      {
        color: '#6f7680',
        roughness: 0.9,
        metalness: 0,
        detail: 0.008,
        paintWeight: 2,
        bump: stoneBump(0.0022),
        maxTriangles: 1500,
      },
    );
  },
});
