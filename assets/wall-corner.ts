import { defineAsset, mixRgb, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * architecture/dungeon/wall-corner — round-2 reroll.
 *
 * Role: modular dungeon masonry. A two-run L-corner that tiles with straight wall pieces;
 *   seen at 128 px as a chunky blue-gray stone corner.
 * Size: each run 2.0 m long, 0.4 m thick, 1.20 m tall (2 courses). Stands on y = 0, centered
 *   on the Y axis, the L opening toward -X/-Z, the outer corner at (+1, +1).
 * One idea: THE canon wall — two fat courses of deep-pillowed blocks laid over a recessed
 *   navy joint bed, with bright teal moss only at the base.
 * Shape language: square dominant (sturdy masonry), round secondary (pillow bevels).
 * Palette: joint bed #2a3547 (dark), block face #4a5d75 (mid), worn top #7a8ba0 (light),
 *   moss accent #3fae9a at the base only.
 * Materials: stone (roughness 0.9, metalness 0, fbm grain in `bump`), moss (roughness 0.9).
 * Detail list: two courses x canon blocks (big), rounded pillow bevels (big), recessed navy
 *   joints (medium), worn lighter tops (medium), moss clumps + haze at the base (accent).
 */

const C = {
  joint: rgb('#2a3547'),
  block: rgb('#4a5d75'),
  blockDark: rgb('#35465a'),
  worn: rgb('#7a8ba0'),
  moss: rgb('#3fae9a'),
  mossDark: rgb('#2d7f73'),
};

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

// -------------------------------------------------------------------- masonry canon
const RUN = 2.0; // outer length of each run
const THICK = 0.4; // footprint thickness (block faces to block faces)
const WALL_H = 1.2; // 2 courses x 0.60 m
const BLOCK_H = 0.59; // block extent height; the rest is the horizontal joint
const JOINT_H = 0.02; // horizontal joint gap
const GAP = 0.03; // vertical joint gap between blocks
const BEVEL = 0.075; // deep rounded pillow bevel
const JOINT_DEPTH = 0.035; // joint bed recess
const BULGE = 0.014; // how far the slightly convex block face bows out
const BLOCK_D = THICK - 2 * BULGE; // block depth before the pillow; the pillow reaches 0.4

const BLOCK_L = (RUN - 2 * GAP) / 3; // 0.6533 — 3 full blocks fill a run
const BLOCK_HALF = (RUN - 2 * BLOCK_L - 3 * GAP) / 2; // 0.3167 — half blocks end the top course
const BASE_MOSS_H = 0.22; // moss stays in the bottom 0.22 m

const CY0 = BLOCK_H / 2; // bottom course center
const CY1 = BLOCK_H + JOINT_H + BLOCK_H / 2; // top course center
const FACE = 0.8; // thickness center of the X leg (z) and the Z leg (x)
const CORNER = 0.8; // center of the corner quoin block

interface Span {
  readonly len: number;
  readonly c: number;
}

const BOTTOM: readonly Span[] = [
  { len: BLOCK_L, c: -RUN / 2 + BLOCK_L / 2 },
  { len: BLOCK_L, c: 0 },
  { len: BLOCK_L, c: RUN / 2 - BLOCK_L / 2 },
];
const TOP: readonly Span[] = [
  { len: BLOCK_HALF, c: -RUN / 2 + BLOCK_HALF / 2 },
  { len: BLOCK_L, c: -RUN / 2 + BLOCK_HALF + GAP + BLOCK_L / 2 },
  { len: BLOCK_L, c: RUN / 2 - BLOCK_HALF - GAP - BLOCK_L / 2 },
  { len: BLOCK_HALF, c: RUN / 2 - BLOCK_HALF / 2 },
];

export default defineAsset({
  name: 'wall-corner',
  description:
    'Dungeon wall corner: two 2 m runs at a right angle, 2 courses of deep-beveled canon blocks on a 0.4 m footprint with recessed navy joints and base moss.',
  detail: 0.016,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ joint bed
    // Recessed navy core: sits 0.03 m behind the block faces on every side, so the joints
    // read as deep dark navy lines and the blocks look set into mortar.
    const coreT = THICK - 2 * JOINT_DEPTH;
    const coreH = WALL_H - JOINT_DEPTH;
    const core = sdf
      .box([RUN - 2 * JOINT_DEPTH, coreH, coreT], 0.008)
      .at(0, coreH / 2, FACE)
      .union(sdf.box([coreT, coreH, RUN - 2 * JOINT_DEPTH], 0.008).at(FACE, coreH / 2, 0));

    // ------------------------------------------------------------------ blocks
    // Both runs share one block layout. Each course lays full blocks across the run and, on
    // the top course, half blocks at the run ends; a square quoin fills the inner corner.
    const blocks: Sdf[] = [];
    // A block is a rounded box with a shallow dome over each broad face, so the face reads as
    // slightly convex (a pillow) while its footprint stays exactly 0.4 m.
    const pillow = (size: readonly [number, number, number], grow: readonly [number, number, number]): Sdf =>
      sdf.box(size, BEVEL).smoothUnion(
        0.035,
        sdf.ellipsoid([
          size[0] / 2 + grow[0],
          size[1] / 2 - 0.045,
          size[2] / 2 + grow[2],
        ]),
      );
    const rows: readonly (readonly [number, readonly Span[]])[] = [
      [CY0, BOTTOM],
      [CY1, TOP],
    ];
    for (const [cy, row] of rows) {
      for (const b of row) {
        blocks.push(pillow([b.len, BLOCK_H, BLOCK_D], [0, 0, BULGE]).at(b.c, cy, FACE)); // X leg
        blocks.push(pillow([BLOCK_D, BLOCK_H, b.len], [BULGE, 0, 0]).at(FACE, cy, b.c)); // Z leg
      }
      blocks.push(sdf.box([THICK, BLOCK_H, THICK], BEVEL).at(CORNER, cy, CORNER)); // quoin
    }

    const blockShape = sdf
      .union(...blocks)
      .paint(C.block)
      .paintFn((x, y, z, base) => {
        // Gentle per-region value drift, then a darker grime line at the very base, then a
        // faint teal moss haze from the ground.
        const drift = noise.fbm(x * 3.2, y * 3.2, z * 3.2, 3);
        let c = mixRgb(base, C.blockDark, clamp01(0.08 + 0.16 * drift));
        const dirt = clamp01((0.14 - y) / 0.14) * (0.35 + 0.25 * (noise.fbm(x * 6, y * 6, z * 6, 2) * 0.5 + 0.5));
        c = mixRgb(c, C.blockDark, clamp01(dirt));
        const h = clamp01((BASE_MOSS_H - y) / BASE_MOSS_H);
        const m = noise.fbm(x * 4.5, y * 5, z * 4.5, 3) * 0.5 + 0.5;
        const haze = h * clamp01((m - 0.55) / 0.45) * 0.38;
        return mixRgb(c, C.moss, haze);
      })
      // Worn, lighter tops on the upper course.
      .paintWhere(sdf.halfSpace([0, -1, 0], -(WALL_H - 0.045)), C.worn, 0.02);

    // ------------------------------------------------------------------ moss clumps
    // Small, flat teal clumps hugging the base only — never a blob on the top.
    const clumps: Sdf[] = [];
    const clump = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): void => {
      clumps.push(sdf.ellipsoid([sx, sy, sz]).at(cx, cy, cz));
    };
    let seed = 0;
    const rnd = (): number => noise.random(seed++, 7, 3);
    // Faces along the X leg: the clump protrudes in z; a smaller lobe sits to one side.
    for (const [fi, fz] of [1.0, 0.6].entries()) {
      const xs = fi === 0 ? [-0.86, -0.42, -0.02, 0.37, 0.74] : [-0.72, -0.18, 0.33];
      for (const x of xs) {
        const s = 0.75 + 0.5 * rnd();
        clump(x, 0.035 * s + 0.01, fz, 0.075 * s, 0.04 * s, 0.038);
        clump(x + 0.055, 0.03 * s + 0.008, fz, 0.045 * s, 0.03 * s, 0.032);
      }
    }
    // Faces along the Z leg: the clump protrudes in x.
    for (const [fi, fx] of [1.0, 0.6].entries()) {
      const zs = fi === 0 ? [-0.82, -0.4, 0.0, 0.38, 0.72] : [-0.7, -0.16, 0.34];
      for (const z of zs) {
        const s = 0.75 + 0.5 * rnd();
        clump(fx, 0.035 * s + 0.01, z, 0.038, 0.04 * s, 0.075 * s);
        clump(fx, 0.03 * s + 0.008, z + 0.055, 0.032, 0.03 * s, 0.045 * s);
      }
    }
    const mossShape = sdf
      .union(...clumps)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paint(C.moss)
      .paintFn((x, y, z, base) => mixRgb(base, C.mossDark, clamp01(0.5 - y * 3.2)));

    // ------------------------------------------------------------------ bodies
    k.body('joint-bed', core, {
      color: C.joint,
      roughness: 0.92,
      metalness: 0,
      detail: 0.02,
      maxError: 0.01,
    });
    k.body('blocks', blockShape, {
      color: C.block,
      roughness: 0.9,
      metalness: 0,
      detail: 0.018,
      maxError: 0.006,
      bump: (x, y, z) => 0.0035 * noise.fbm(x * 13, y * 13, z * 13, 3),
    });
    k.body('moss', mossShape, {
      color: C.moss,
      roughness: 0.9,
      metalness: 0,
      detail: 0.018,
      maxError: 0.007,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 24, y * 24, z * 24, 2),
    });
  },
});
