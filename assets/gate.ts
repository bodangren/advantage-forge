import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — rusted iron portcullis (dungeon/structure/gate).
 *
 * Role: dungeon structure piece that sits in a doorway; must read at 128 px.
 * Size: ~1.2 m wide, ~1.6 m tall including the lift ring. Stands on y = 0, faces +Z.
 * One idea: a heavy rusted iron grid — seven chunky square bars ending in spear points,
 *   clamped by two flat cross braces, with a big forged lift ring on top.
 * Shape language: square dominant (forged bars, flat braces) with a triangular
 *   secondary (the pointed lower tips break the bottom edge of the silhouette).
 * Palette: dense cool iron #232731 / #46515f / worn tops #6a7380 (dominant), rust brown
 *   #5a3419 / #c47a40 (warm secondary), a little teal patina #3fae9a at the damp foot
 *   (small accent).
 * Materials: one worn iron body, metalness 0.8, roughness 0.5. Rust pitting lives in `bump`.
 * Detail: primary bars + tips + braces + ring; secondary keeper bracket; tertiary rust
 *   blotches and patina paint. Focal point: the lift ring against the dark bars.
 * Rig/animation: none (static structure).
 */

const W = 1.2; // overall width across the bars
const TOP = 1.34; // top of the bar shafts and the top brace
const SHOULDER = 0.26; // where the spear points start
const BARS = 7;
const BAR_W = 0.078;
const BAR_D = 0.062;
const BAR_R = 0.016; // rounded edge on every bar
const SPAN = 0.56; // centre of the outermost bar
const BRACE_D = 0.1;

const IRON_DARK = rgb('#232731');
const IRON_MID = rgb('#46515f');
const IRON_LIGHT = rgb('#6a7380');
const RUST_DARK = rgb('#5a3419');
const RUST_LIGHT = rgb('#c47a40');
const PATINA = rgb('#3fae9a');

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Rust and wear: cool iron base, warm blotches low, a little teal patina at the foot. */
const rustPaint = (x: number, y: number, z: number) => {
  const n1 = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 3);
  let c = mixRgb(IRON_DARK, IRON_MID, 0.3 + 0.7 * n1);
  c = mixRgb(c, IRON_LIGHT, 0.3 * clamp01((n1 - 0.55) * 2.5));

  const n2 = 0.5 + 0.5 * noise.fbm(x * 3.1 + 13, y * 3.4 + 4, z * 3.1 - 9, 4);
  const patch = clamp01((n2 - 0.42) * 1.7);
  const low = clamp01((1.05 - y) / 0.9);
  const rustAmt = clamp01(patch * (0.3 + 0.75 * low));
  const rustCol = mixRgb(
    RUST_DARK,
    RUST_LIGHT,
    0.45 + 0.55 * (0.5 + 0.5 * noise.fbm(x * 13, y * 13, z * 13, 2)),
  );
  c = mixRgb(c, rustCol, 0.82 * rustAmt);

  const n3 = 0.5 + 0.5 * noise.fbm(x * 2.6 - 6, y * 2.9 + 11, z * 2.6, 3);
  const patina = clamp01((n3 - 0.6) * 2.2) * clamp01((0.55 - y) / 0.5);
  c = mixRgb(c, PATINA, 0.3 * patina * (1 - rustAmt * 0.5));

  // Dry, lighter tops; a dark contact grime at the very bottom.
  c = mixRgb(c, IRON_LIGHT, 0.22 * clamp01((y - 0.55) / 0.85));
  return mixRgb(c, IRON_DARK, 0.42 * clamp01((0.09 - y) / 0.09));
};

/** One chunky bar with a rounded spear point; `tipY` is the apex before rounding. */
function barPiece(x: number, tipY: number) {
  const shaftH = TOP - SHOULDER;
  const shaft = sdf.box([BAR_W, shaftH, BAR_D], BAR_R).at(x, (TOP + SHOULDER) / 2, 0);
  const tip = sdf
    .extrude(
      profile.polygon([
        [-0.03, SHOULDER + 0.04],
        [0.03, SHOULDER + 0.04],
        [0, tipY],
      ]),
      BAR_D - 0.02,
    )
    .round(0.012)
    .at(x, 0, 0);
  return sdf.union(shaft, tip);
}

export default defineAsset({
  name: 'gate',
  description:
    'Rusted iron portcullis with seven spear-tipped bars, two cross braces, and a lift ring.',
  detail: 0.007,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ bars + points
    const bars: ReturnType<typeof sdf.box>[] = [];
    for (let i = 0; i < BARS; i++) {
      const x = -SPAN + (i / (BARS - 1)) * SPAN * 2;
      bars.push(barPiece(x, 0.012));
    }

    // ------------------------------------------------------------------ cross braces
    const topBrace = sdf.box([W + 0.01, 0.11, BRACE_D], 0.02).at(0, TOP - 0.058, 0);
    const lowBrace = sdf.box([W + 0.01, 0.09, BRACE_D], 0.02).at(0, 0.46, 0);

    // ------------------------------------------------------------------ forged lift ring
    const ring = sdf.torus(0.105, 0.022).rotateX(90).at(0, TOP + 0.1, 0);
    const keeper = sdf.box([0.086, 0.075, 0.078], 0.02).at(0, TOP - 0.005, 0);

    const iron = sdf.union(...bars, topBrace, lowBrace, ring, keeper);

    k.body('iron', iron.paintFn(rustPaint), {
      color: '#3d4754',
      roughness: 0.5,
      metalness: 0.8,
      detail: 0.007,
      paintWeight: 2,
      maxTriangles: 5400,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 34, y * 34, z * 34, 3),
    });
  },
});
