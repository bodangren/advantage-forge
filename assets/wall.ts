import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * dungeon/structure/wall — straight modular dungeon wall segment (batch style anchor for stone).
 *
 * Role: 2 m modular wall run for the Chibi Quest dungeon; the reference every other stone asset
 *   matches. It must read at 128 px and, above all, from the top-down tile camera.
 * Size: 2.0 m long (X), 1.2 m tall (Y), 0.4 m thick (Z). Centered on the origin, faces +Z,
 *   stands on y = 0, flat ends at x = ±1.0 so segments tile on a 2 m grid.
 * One idea: two courses of oversized rounded pillow blocks in a half-bond, split by deep slate
 *   grout, with pale worn tops you read from above.
 * Shape language: square/blocky mass (sturdy, safe) plus very round bevels (friendly, chunky).
 * Palette: grout deep slate #2a3547 (dark), block faces mid blue-gray #4a5d75 (mid), worn tops
 *   pale #7a8ba0 / #93a2b6 (light), moss accent teal-green #3fae9a. Value plan: light tops,
 *   mid faces, dark joints. No baked brightness — this piece carries no light source.
 * Materials: blocks (stone, roughness 0.9), grout (stone, roughness 0.97), moss tufts (0.98).
 * Detail list: big pillow blocks + half-bond rhythm (big), chunky bevels + grout grooves
 *   (medium), per-block tint, worn paint, painted moss and a few moss tufts (small).
 * Rig/animation: none.
 */

const SLATE = rgb('#222c3d'); // deep slate shadow / grout
const SLATE_WET = rgb('#33445e'); // damp slate highlight
const BLOCK = rgb('#4a5d75'); // mid blue-gray block face
const BLOCK_TEAL = rgb('#3f6577'); // cooler, damper block tint
const PALE = rgb('#7a8ba0'); // pale worn top
const PALE_HI = rgb('#a6b6c9'); // sun-bleached top highlight
const MOSS = rgb('#3fae9a'); // teal-green moss accent (contract colour)
const MOSS_MID = rgb('#4d9f70'); // moss body, greener than the accent
const MOSS_DARK = rgb('#274f3f'); // moss shade

const LEN = 2.0; // length along X
const H = 1.2; // total height
const THICK = 0.4; // depth along Z
const ROUND = 0.05; // block bevel radius
const GAP = 0.06; // grout width
const HALF = GAP / 2;
const INSET = 0.045; // grout recess behind the block faces

// Course cell boundaries: bottom course is full blocks, top course is half-bonded (offset 1/3).
const ROW_A = [-1, -1 / 3, 1 / 3, 1];
const ROW_B = [-1, -2 / 3, 0, 2 / 3, 1];

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Which course a height belongs to (0 = bottom, 1 = top). */
const courseOf = (y: number): number => (y >= 0.6 ? 1 : 0);

/** Stable index of the block a point lies in, per course. Used for per-block tint. */
function blockIndex(x: number, course: number): number {
  const bounds = course === 0 ? ROW_A : ROW_B;
  for (let i = 0; i < bounds.length - 1; i++) if (x < bounds[i + 1]!) return i;
  return bounds.length - 2;
}

/** One course of rounded pillow blocks, shrunk by half a grout gap and jittered a little. */
function blocksForRow(bounds: number[], yc: number, h: number, seed: number): Sdf[] {
  const out: Sdf[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    // Shrink only internal edges; the two outer ends stay flush so a wall run reads
    // as continuous stone instead of a dark core slab.
    const lo = bounds[i]! + (i > 0 ? HALF : 0);
    const hi = bounds[i + 1]! - (i + 1 < bounds.length - 1 ? HALF : 0);
    // Keep the two outer ends flush for tiling: no x-jitter on the first/last block.
    const outer = i === 0 || i === bounds.length - 2;
    const jx = outer ? 0 : (noise.random(i, seed, 1) - 0.5) * 0.014;
    const jy = (noise.random(i, seed, 2) - 0.5) * 0.01;
    const jz = (noise.random(i, seed, 3) - 0.5) * 0.01;
    out.push(sdf.box([hi - lo, h, THICK], ROUND).at((lo + hi) / 2 + jx, yc + jy, jz));
  }
  return out;
}

export default defineAsset({
  name: 'wall',
  description:
    'Dungeon wall segment: two courses of chunky rounded blue-gray stone blocks in half-bond, deep slate grout, pale worn tops, moss at the base; 2 m, tiles on a 2 m grid.',
  detail: 0.02,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ blocks
    // Bottom course: sits 3 cm into the ground so the beveled base can be cut flat.
    // Top course: half-bonded, its top flush at 1.2 m for the pale worn top.
    const blockSet = sdf
      .union(
        ...blocksForRow(ROW_A, 0.27, 0.6, 11),
        ...blocksForRow(ROW_B, 0.915, 0.57, 23),
      )
      .displace(0.008, (x, y, z) => noise.fbm(x * 2.4, y * 2.4, z * 2.4, 3, 5))
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const blockPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const course = courseOf(y);
      // A tint per block so the courses are not one flat value. Some blocks lean
      // damper/cooler, some lean dark and shadowed.
      const t1 = noise.random(blockIndex(x, course), course, 7);
      const t2 = noise.random(blockIndex(x, course), course, 31);
      let c = mixRgb(base, SLATE, 0.1 + 0.34 * t1);
      c = mixRgb(c, BLOCK_TEAL, 0.3 * t2);
      // Broad damp blotches, darker low on the wall.
      const patch = noise.fbm(x * 3.1, y * 3.1, z * 3.1, 3, 4);
      c = mixRgb(c, SLATE, clamp01(-patch) * 0.26);
      c = mixRgb(c, PALE, clamp01(patch) * 0.12);
      // Pale worn top: a bright top surface and a short fade down the block sides.
      const wear = smoothstep(0.13, 0.0, H - y);
      c = mixRgb(c, PALE, wear * 0.8);
      c = mixRgb(c, PALE_HI, wear * wear * 0.3);
      // Pits and dry patches break up the pale top so it is not a flat white cap.
      const topNoise = noise.fbm(x * 8, y * 8, z * 8, 3, 15);
      c = mixRgb(c, SLATE, clamp01(-topNoise) * wear * 0.18);
      // Ground contact shadow, then moss creeping up from the base.
      c = mixRgb(c, SLATE, smoothstep(0.18, 0.0, y) * 0.36);
      const m = noise.fbm(x * 3.0 + 20, y * 3.0, z * 3.0 + 20, 3, 9);
      const mossAmt = clamp01((m - 0.06) * 2.6) * smoothstep(0.32, 0.04, y);
      c = mixRgb(c, MOSS_MID, mossAmt * 0.55);
      c = mixRgb(c, MOSS, mossAmt * 0.3);
      c = mixRgb(c, MOSS_DARK, mossAmt * 0.25);
      return c;
    };

    k.body('blocks', blockSet.paintFn(blockPaint), {
      color: BLOCK,
      roughness: 0.9,
      metalness: 0,
      detail: 0.015,
      maxError: 0.005,
      maxTriangles: 6000,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0024 * noise.fbm(x * 26, y * 26, z * 26, 3, 11) +
        0.0008 * noise.noise3(x * 82, y * 82, z * 82, 5),
    });

    // ------------------------------------------------------------------ grout core
    // Recessed slate box that shows in every joint as a deep shadow. Flush at the ends.
    const grout = sdf
      .box([LEN, H - INSET, THICK - INSET * 2], 0.04)
      .at(0, (H - INSET) / 2, 0);
    const groutPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const n = noise.fbm(x * 5, y * 5, z * 5, 3, 3);
      let c = mixRgb(base, SLATE, clamp01(-n) * 0.2);
      c = mixRgb(c, SLATE_WET, clamp01(n) * 0.3);
      const m = noise.fbm(x * 2.5 + 5, y * 2.5, z * 2.5 + 5, 2, 2);
      c = mixRgb(c, MOSS_DARK, clamp01((m - 0.15) * 2) * smoothstep(0.35, 0.05, y) * 0.6);
      return c;
    };
    k.body('grout', grout.paintFn(groutPaint), {
      color: SLATE,
      roughness: 0.97,
      metalness: 0,
      detail: 0.03,
      maxError: 0.01,
      maxTriangles: 1400,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 30, y * 30, z * 30, 3, 7),
    });

    // ------------------------------------------------------------------ moss tufts
    // Flat, low patches that hug the base of the wall, plus painted moss on the stone.
    const clump = (cx: number, cy: number, cz: number, s: number, seed: number): Sdf =>
      sdf
        .ellipsoid([0.11 * s, 0.045 * s, 0.03 * s])
        .at(cx, cy, cz)
        .displace(0.02 * s, (x, y, z) => noise.fbm(x * 22, y * 22, z * 22, 3, seed));
    const mossGeo = sdf
      .union(
        clump(-0.66, 0.055, 0.188, 1.1, 3),
        clump(-0.34, 0.045, 0.192, 0.75, 8),
        clump(0.02, 0.05, 0.19, 0.9, 4),
        clump(0.4, 0.04, 0.192, 0.7, 9),
        clump(0.72, 0.06, 0.188, 0.85, 5),
        clump(-0.5, 0.05, -0.188, 0.8, 6),
        clump(0.24, 0.055, -0.19, 0.85, 10),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const mossPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
      const n = noise.fbm(x * 18, y * 18, z * 18, 3, 6);
      let c = mixRgb(MOSS_DARK, MOSS_MID, clamp01(0.4 + 0.6 * noise.fbm(x * 14, y * 14, z * 14, 3, 2)));
      c = mixRgb(c, MOSS, clamp01(0.5 + n * 0.5) * 0.35);
      c = mixRgb(c, MOSS_DARK, clamp01(-n) * 0.5);
      return c;
    };
    k.body('moss', mossGeo.paintFn(mossPaint), {
      color: MOSS_MID,
      roughness: 0.98,
      metalness: 0,
      detail: 0.007,
      maxError: 0.003,
      maxTriangles: 700,
      bump: (x, y, z) => 0.0035 * noise.fbm(x * 60, y * 60, z * 60, 3, 3),
    });
  },
});
