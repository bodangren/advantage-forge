import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — snow ground tile (catalog `architecture/landscape-parts/snow-ground`).
 *
 * Role: modular 2 m ground tile for the Chibi Quest snow scene, read from above and at 128 px.
 * Size: exactly 2 x 2 m in XZ, a 0.3 m slab: flat top plane at y = 0, bottom at y = -0.3.
 * Sides: a thick snow lip (0.07 m, wavy edge) over frozen dark soil #4a3a30 with pale ice specks #cfe0ea.
 * Edges at x = +/-1 and z = +/-1 stay square and level, so tiles join with no step or gap.
 * One idea: a soft white snow blanket with gentle rounded drifts, sitting on a pale blue packed
 *   ice base; a trail of footprints crosses it.
 * Shape language: round and friendly (soft drifts, rounded prints) over a square tile.
 * Palette (60/30/10): snow white #eef4fa dominant, ice blue #b6cde5 secondary,
 *   shadow blue #cfe0f0 accent in the drift hollows and footprints.
 * Materials: one `snow` body (matte, roughness 0.85, fine sparkle in `bump`), one `ice` body
 *   (packed and faintly glossy, roughness 0.7).
 * Detail list: primary = drift mounds + flat cap; secondary = painted footprint trail;
 *   tertiary = sparkle bump. Focal point = the footprints.
 * Rig/animation: none (static ground).
 */

const TILE = 2; // grid size in meters
const SLAB = 0.3; // slab depth: top at y = 0, bottom at y = -0.3
const EDGE = 0.001; // 1 mm overlap so neighbours never show a gap
const TOP = 0;

const C = {
  snow: rgb('#eef4fa'), // snow body base
  snowLight: rgb('#fafcff'), // sunlit crest, kept off pure white
  shadow: rgb('#cfe0f0'), // faint blue in drifts and footprints
  ice: rgb('#b6cde5'), // packed ice side
  iceDark: rgb('#94b0ce'),
  iceTop: rgb('#cfe0f0'),
};

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, t: number) => {
  const s = clamp01((t - a) / (b - a));
  return s * s * (3 - 2 * s);
};

/** Repeat noise across the 2 m tile so opposite painted edges match for seamless tiling. */
function tileNoise(x: number, z: number, frequency: number, octaves: number): number {
  const u = (x + 1) * 0.5;
  const v = (z + 1) * 0.5;
  const sample = (sx: number, sz: number) => noise.fbm(sx * frequency, 0, sz * frequency, octaves);
  return lerp(
    lerp(sample(x, z), sample(x - 2, z), u),
    lerp(sample(x, z - 2), sample(x - 2, z - 2), u),
    v,
  );
}

// ------------------------------------------------------------------ drift blockout
// Flat cap (top at y = 0.06) plus four low rounded mounds, blended soft: gentle drifts that
// stay well inside the tile so the outer edge keeps the exact flat tiling height.
const cap = sdf.box([TILE + 2 * EDGE, SLAB + 2 * EDGE, TILE + 2 * EDGE]).at(0, -SLAB / 2, 0);
const drifts = sdf.union(
  sdf.ellipsoid([0.4, 0.12, 0.38]).at(-0.08, TOP - 0.06, -0.12),
  sdf.ellipsoid([0.3, 0.09, 0.28]).at(0.5, TOP - 0.055, 0.46),
  sdf.ellipsoid([0.28, 0.08, 0.3]).at(-0.55, TOP - 0.05, 0.44),
  sdf.ellipsoid([0.2, 0.06, 0.2]).at(0.36, TOP - 0.045, -0.5),
);
let snowShape = cap.smoothUnion(0.06, drifts);
// Trim to the exact tile box last, so drifts can never cross x = +/-1 or z = +/-1.
snowShape = snowShape.intersect(sdf.box([TILE + 2 * EDGE, 0.7, TILE + 2 * EDGE]).at(0, 0.0495, 0));

// ------------------------------------------------------------------ footprint trail
// A walking trail wanders front (+Z) to back (-Z). Each print is painted as a soft blue
// oval, so it reads from above without punching holes through the thin snow cap.
const PRINTS: ReadonlyArray<readonly [number, number, number]> = [
  [0.08, 0.74, 9],
  [0.26, 0.46, -7],
  [0.1, 0.18, 11],
  [0.28, -0.1, -6],
  [0.12, -0.36, 8],
  [0.3, -0.62, -9],
];
/** Soft oval coverage of each footfall, painted as a faint blue shadow after the drifts. */
const printMask = (x: number, z: number) => {
  let m = 0;
  for (const [px, pz, deg] of PRINTS) {
    const r = (deg * Math.PI) / 180;
    const dx = x - px;
    const dz = z - pz;
    const u = (dx * Math.cos(r) - dz * Math.sin(r)) / 0.09;
    const v = (dx * Math.sin(r) + dz * Math.cos(r)) / 0.16;
    const d2 = u * u + v * v;
    if (d2 < 1) m = Math.max(m, 1 - d2);
  }
  return m;
};

// ------------------------------------------------------------------ paint
/** Snow: white with sunlit crests and a faint blue wash in the hollows and at the tile sides. */
const soil = rgb('#4a3a30');
const soilDark = rgb('#32261f');
const iceSpeck = rgb('#cfe0ea');

/** Side: a thick snow lip with a wavy edge over frozen soil with ice specks. */
const sideColor = (x: number, y: number, z: number) => {
  const along = Math.abs(x) > Math.abs(z) ? z : x;
  const drip = 0.07 + 0.012 * Math.sin(along * Math.PI * 3 + 0.7) + 0.008 * Math.sin(along * Math.PI * 8 + 2.1);
  if (y > -drip) return mixRgb(snowColor(x, 0, z), C.snow, 0.5);
  let c = mixRgb(soil, soilDark, clamp01(-y / SLAB) * 0.7);
  const n = noise.fbm(along * 12, y * 12, 3.7, 2);
  if (n > 0.3) c = mixRgb(c, iceSpeck, clamp01((n - 0.3) * 5) * 0.75);
  return c;
};

function snowColor(x: number, y: number, z: number) {
  if (y < -0.01) return sideColor(x, y, z);
  const crest = smoothstep(TOP - 0.005, TOP + 0.055, y);
  // Flat snow shade sits a touch toward blue; drift crests are the bright white.
  const low = mixRgb(C.snow, C.shadow, 0.38);
  let col = mixRgb(low, C.snowLight, clamp01(crest));
  const patch = tileNoise(x, z, 3.2, 2);
  col = mixRgb(col, C.shadow, 0.2 * clamp01(patch) * (1 - crest));
  // Footfalls read as a faint blue shadow, stronger than the drift hollows.
  col = mixRgb(col, mixRgb(C.shadow, C.ice, 0.35), 0.95 * printMask(x, z));
  const edge = Math.max(Math.abs(x), Math.abs(z)) > 0.985;
  if (edge) col = mixRgb(col, C.shadow, 0.45);
  const speck = tileNoise(x, z, 24, 2);
  if (speck > 0.45) col = mixRgb(col, C.snowLight, 0.5);
  return col;
}

export default defineAsset({
  name: 'snow-ground',
  description:
    'Modular 2 m snow ground tile: soft white drifts with a trail of footprints; a 0.3 m slab with the top at y = 0, a snow lip over frozen dark soil on the sides.',
  detail: 0.015,
  reference: 'docs/item-mockups/snow-ground-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- snow blanket
    const snowBody = snowShape.paintFn(snowColor);
    k.body('snow', snowBody, {
      color: C.snow,
      roughness: 0.85,
      detail: 0.018,
      textureDensity: 2,
      paintWeight: 1,
      // Fine sparkle in the normal map only; the silhouette stays smooth.
      bump: (x, y, z) => (y > -0.01 ? 0.0025 * tileNoise(x, z, 30, 3) : 0),
    });
  },
});
