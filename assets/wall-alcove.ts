import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * architecture/dungeon/wall-alcove — round-2 reroll.
 *
 * Role: modular dungeon masonry with a single arched niche; a background structure read at
 *   128 px and from the top-down tile camera. Dressing assets slot into the empty niche later.
 * Size: 2.0 m long (X), 1.2 m tall (Y), 0.4 m thick (Z). Centered on the origin, faces +Z,
 *   stands on y = 0, flat ends at x = +/-1.0 so it tiles on the same 2 m grid as `wall`.
 * One idea: THE canon wall (two fat courses of deep-pillowed blocks over a recessed navy joint
 *   bed) with one arched niche cut clean through the +Z face, jambed by whole blocks.
 * Shape language: square dominant (sturdy masonry), round secondary (pillow bevels, arch).
 * Palette: joint/interior #2a3547 (dark), block face #4a5d75 (mid), worn top #7a8ba0 (light),
 *   moss accent #3fae9a at the base only.
 * Materials: stone (roughness 0.9, metalness 0, fbm grain in `bump`), moss (roughness 0.9).
 * Detail list: exactly 2 courses x canon blocks (big), deep pillow bevels (big), recessed navy
 *   joints + slate niche interior (medium), worn lighter tops, moss clumps at the base (accent).
 * Rig/animation: none.
 */

const C = {
  joint: rgb('#2a3547'), // deep slate: joints and niche interior
  block: rgb('#4a5d75'), // mid blue-gray block face
  blockDark: rgb('#35465a'),
  worn: rgb('#7a8ba0'), // pale worn top
  moss: rgb('#3fae9a'),
  mossDark: rgb('#2d7f73'),
};

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

// -------------------------------------------------------------------- masonry canon
const LEN = 2.0; // length along X
const H = 1.2; // total height = 2 courses x 0.60 m
const THICK = 0.4; // depth along Z
const GAP = 0.03; // joint width, recessed
const BEVEL = 0.05; // deep rounded pillow bevel
const BULGE = 0.012; // how far the slightly convex block face bows out
const JOINT_DEPTH = 0.035; // joint bed recess behind the block faces
const BASE_MOSS_H = 0.22; // moss stays in the bottom 0.22 m

const BLOCK_H = 0.59; // block extent height; the rest is the horizontal joint
const JOINT_H = 0.02; // horizontal joint gap
const BLOCK_D = THICK - 2 * BULGE; // block depth before the pillow; the pillow reaches 0.4

const CY0 = BLOCK_H / 2; // bottom course center
const CY1 = BLOCK_H + JOINT_H + BLOCK_H / 2; // top course center

interface Span {
  readonly c: number;
  readonly len: number;
}

// Bottom course: three full blocks. Top course: half-bond with half blocks at the run ends.
const BOT_L = (LEN - 2 * GAP) / 3;
const BOTTOM: Span[] = [];
for (let i = 0; i < 3; i++) {
  BOTTOM.push({ c: -LEN / 2 + i * (BOT_L + GAP) + BOT_L / 2, len: BOT_L });
}
const TOP_HALF = (LEN - 2 * BOT_L - 3 * GAP) / 2;
const TOP: Span[] = [
  { c: -LEN / 2 + TOP_HALF / 2, len: TOP_HALF },
  { c: -LEN / 2 + TOP_HALF + GAP + BOT_L / 2, len: BOT_L },
  { c: LEN / 2 - TOP_HALF - GAP - BOT_L / 2, len: BOT_L },
  { c: LEN / 2 - TOP_HALF / 2, len: TOP_HALF },
];

// -------------------------------------------------------------------- arched niche
const NW = 0.5; // opening width
const NH = 0.7; // opening height (floor to arch crown)
const ND = 0.25; // cut depth into the +Z face
const R = NW / 2; // arch radius
const NY0 = 0.26; // floor height
const SPRING = NY0 + (NH - R); // spring line of the arch
const FRONT = THICK / 2; // front face at z = +0.2

/** Opening outline in XY: square jambs, a chunky segmented arch top (radial segments). */
const SEG = 5;
const outline: [number, number][] = [[-R, NY0]];
for (let i = 0; i <= SEG; i++) {
  const a = Math.PI * (1 - i / SEG);
  outline.push([R * Math.cos(a), SPRING + R * Math.sin(a)]);
}
outline.push([R, NY0]);
const nicheProfile = profile.polygon(outline, { smooth: false });
/** Cutting prism: front at z = FRONT + 0.01, back at z = FRONT - ND. */
const NICHE_D = ND + 0.01;
const nicheCut = sdf.extrude(nicheProfile, NICHE_D, 0.008).at(0, 0, FRONT + 0.01 - NICHE_D / 2);
/** Stencil for the slate interior; slightly inflated so the cut faces fall inside it. */
const nichePaint = nicheCut.round(0.006);

export default defineAsset({
  name: 'wall-alcove',
  description:
    'Dungeon wall segment with an arched niche: two 0.60 m courses of deep-beveled canon blocks over recessed navy joints, slate niche interior, pale worn tops, base moss; 2 m, tiles on a 2 m grid.',
  detail: 0.016,
  texture: { size: 1024 },
  reference: 'docs/dungeon-mockups/masonry-canon.png',

  build(k) {
    // ------------------------------------------------------------------ joint bed
    // Recessed navy core, 0.035 m behind the block faces, so the joints read as deep dark
    // navy lines and the blocks look set into mortar. Carved a touch wider than the blocks so
    // it never leaves a stray surface inside the niche.
    const coreH = H - JOINT_DEPTH;
    const core = sdf
      .box([LEN - 0.02, coreH, THICK - 2 * JOINT_DEPTH], 0.008)
      .at(0, coreH / 2, 0)
      .subtract(nicheCut.round(0.012));

    // ------------------------------------------------------------------ blocks
    // A block is a rounded box with a shallow dome over each broad face, so the face reads as
    // slightly convex (a pillow) while its footprint stays exactly 0.4 m.
    const pillow = (len: number): Sdf =>
      sdf
        .box([len, BLOCK_H, BLOCK_D], BEVEL)
        .smoothUnion(
          0.035,
          sdf.ellipsoid([len / 2, BLOCK_H / 2 - 0.045, BLOCK_D / 2 + BULGE]),
        );
    const blocks: Sdf[] = [];
    for (const b of BOTTOM) blocks.push(pillow(b.len).at(b.c, CY0, 0));
    for (const b of TOP) blocks.push(pillow(b.len).at(b.c, CY1, 0));

    const blockShape = sdf
      .union(...blocks)
      // sink the base a hair so the ground-facing bevel is cut flat
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .subtract(nicheCut)
      .paint(C.block)
      .paintFn((x, y, z, base) => {
        // Gentle per-region value drift, then a darker grime line at the very base, then a
        // faint teal moss haze from the ground.
        const drift = noise.fbm(x * 3.2, y * 3.2, z * 3.2, 3);
        let c = mixRgb(base, C.blockDark, clamp01(0.1 + 0.2 * drift));
        const dirt =
          clamp01((0.14 - y) / 0.14) * (0.35 + 0.25 * (noise.fbm(x * 6, y * 6, z * 6, 2) * 0.5 + 0.5));
        c = mixRgb(c, C.blockDark, clamp01(dirt * 0.6));
        const h = clamp01((BASE_MOSS_H - y) / BASE_MOSS_H);
        const m = noise.fbm(x * 4.5, y * 5, z * 4.5, 3) * 0.5 + 0.5;
        return mixRgb(c, C.moss, h * clamp01((m - 0.58) / 0.42) * 0.35);
      })
      // Worn, lighter tops on the upper course.
      .paintWhere(sdf.halfSpace([0, -1, 0], -(H - 0.045)), C.worn, 0.02)
      // The niche interior is deep slate and stays empty for dressing assets.
      .paintWhere(nichePaint, C.joint, 0.0);

    // ------------------------------------------------------------------ moss clumps
    // Small, flat teal clumps hugging the base only — never a blob on the top.
    const clumps: Sdf[] = [];
    const clump = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): void => {
      clumps.push(sdf.ellipsoid([sx, sy, sz]).at(cx, cy, cz));
    };
    let seed = 0;
    const rnd = (): number => noise.random(seed++, 4, 9);
    for (const z of [FRONT, -FRONT]) {
      for (const x of [-0.82, -0.44, -0.04, 0.4, 0.78]) {
        const s = 0.7 + 0.6 * rnd();
        clump(x, 0.035 * s + 0.008, z, 0.075 * s, 0.038 * s, 0.036);
        clump(x + 0.06, 0.028 * s + 0.006, z, 0.045 * s, 0.028 * s, 0.03);
      }
    }
    const mossShape = sdf
      .union(...clumps)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paint(C.moss)
      .paintFn((x, y, _z, base) => mixRgb(base, C.mossDark, clamp01(0.5 - y * 3.2)));

    // ------------------------------------------------------------------ bodies
    k.body('joint-bed', core, {
      color: C.joint,
      roughness: 0.92,
      metalness: 0,
      detail: 0.02,
      maxError: 0.01,
      maxTriangles: 1200,
    });
    k.body('blocks', blockShape, {
      color: C.block,
      roughness: 0.9,
      metalness: 0,
      detail: 0.013,
      maxError: 0.0022,
      maxTriangles: 6000,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 13, y * 13, z * 13, 3),
    });
    k.body('moss', mossShape, {
      color: C.moss,
      roughness: 0.9,
      metalness: 0,
      detail: 0.02,
      maxError: 0.007,
      maxTriangles: 500,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 24, y * 24, z * 24, 2),
    });
  },
});
