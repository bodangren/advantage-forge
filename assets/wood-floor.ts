import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Modular plank floor tile for the Chibi Quest tavern (same family as the hamlet
 * ground tiles). Exactly 2 m square, 0.08 m thick, top at y = 0.08, clean square
 * edges so tiles butt seamlessly in every direction.
 *
 * The one idea: warm honey-oak planks running along X, each plank its own tone,
 * with dark seams, a few knots and soft wear — a floor that has carried years of boots.
 *
 * Seamless-tiling rules (no feature calls out the tile grid):
 * - Plank seams sit at fixed z bands, so they continue exactly across tile edges.
 * - Per-plank tone is constant along X, so tone flows over the x edges.
 * - Every slow field (grain, wear, tone wobble) uses noise that is exactly periodic
 *   over the 2 m tile, so opposite edges match.
 * - Knots sit well inside the tile, away from every edge. Nothing is keyed to the
 *   tile border itself.
 *
 * Palette: honey oak #b5814a dominant, warm brown #8a5a35 variation, pale cut wood
 * #c9a06a wear, dark #54331d seams. One matte body (roughness 0.85); all fine grain
 * lives in `bump`. No rig, no animation.
 */

const PLANKS = 7; // 6 to 8 planks across the 2 m
const PW = 2 / PLANKS; // plank width along z (~0.286 m)
const HALF = PW / 2;

const honeyOak = rgb('#b5814a'); // dominant plank tone
const warmBrown = rgb('#8a5a35'); // darker plank variation
const deepBrown = rgb('#6e421f'); // darkest, oldest boards
const paleWood = rgb('#c9a06a'); // worn, pale cut wood
const seamDark = rgb('#54331d'); // seams and joints

/**
 * Per-plank tone, hand-set so neighbours always differ clearly (a dark board, a pale
 * worn one, mids between). Value = how far the plank mixes toward warm brown.
 * The rows at the tile's z edges (first and last) stay mid-tone so neighbouring
 * tiles never show a repeated dark|pale line at the seam.
 */
const PLANK_MIX = [0.6, 0.05, 0.95, 0.15, 0.8, 0.3, 0.55];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Plank row 0..PLANKS-1 for a z. Rows sit at the same absolute z in every tile. */
function plankIndex(z: number): number {
  const i = Math.floor((z + 1) / PW);
  return i < 0 ? 0 : i > PLANKS - 1 ? PLANKS - 1 : i;
}

/** Distance in meters to the nearer plank seam: 0 at a seam, HALF at the plank center. */
function seamDist(z: number): number {
  const local = (z + 1) / PW - plankIndex(z);
  return Math.min(local, 1 - local) * PW;
}

/** Stable per-plank tone mix (0 = honey oak, 1 = warm brown). */
function plankTone(i: number): number {
  return PLANK_MIX[((i % PLANKS) + PLANKS) % PLANKS]!;
}

/**
 * Value noise that is exactly periodic over the 2 m tile in both x and z, so opposite
 * tile edges match. cx/cz = lattice cells per 2 m. Returns [-1, 1].
 */
function pnoise(x: number, z: number, cx: number, cz: number, seed: number): number {
  const gx = ((x + 1) / 2) * cx;
  const gz = ((z + 1) / 2) * cz;
  const ix = Math.floor(gx);
  const iz = Math.floor(gz);
  const fx = gx - ix;
  const fz = gz - iz;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const w = (i: number, j: number) =>
    noise.random(((i % cx) + cx) % cx, seed, ((j % cz) + cz) % cz);
  return (
    lerp(lerp(w(ix, iz), w(ix + 1, iz), sx), lerp(w(ix, iz + 1), w(ix + 1, iz + 1), sx), sz) * 2 - 1
  );
}

/** Two-octave version of the tile-periodic noise, still exactly periodic. */
function pfbm(x: number, z: number, cx: number, cz: number, seed: number): number {
  return 0.667 * pnoise(x, z, cx, cz, seed) + 0.333 * pnoise(x, z, cx * 2, cz * 2, seed + 101);
}

/**
 * Knots: [x, z, radius across (z), radius along (x)]. Centers sit on plank rows,
 * at least 0.22 m from the x edges and 0.14 m from the z edges.
 */
const KNOTS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0.48, -0.571, 0.042, 0.028],
  [-0.62, 0.0, 0.034, 0.022],
  [0.16, 0.857, 0.036, 0.025],
  [-0.38, -0.286, 0.03, 0.02],
];

/** Normalized elliptical distance to a knot: < 1 inside it. */
function knotDist(x: number, z: number): number {
  let d = Infinity;
  for (const [kx, kz, krx, krz] of KNOTS) {
    const dx = (x - kx) / krx;
    const dz = (z - kz) / krz;
    d = Math.min(d, Math.sqrt(dx * dx + dz * dz));
  }
  return d;
}

/** Soft wear mask in [0, 1]: pale patches that hug the seam shoulders and scuffs. */
function wearAt(x: number, z: number, i: number): number {
  const sd = seamDist(z);
  const weary = 0.35 + 0.65 * noise.random(i, 43, 7); // some planks take more abuse
  const along = 0.5 + 0.5 * pnoise(x, i * 0.37, 26, 2, 91); // wear comes and goes along X
  const edge = Math.max(0, 1 - sd / 0.03);
  const scuff = clamp01((pfbm(x, z, 3, 3, 55) - 0.1) * 1.8);
  return clamp01(edge * along * 0.85 * weary + scuff * 0.7 * weary);
}

/** Painted side of the slab: darkened cut wood, per-plank tone, joints, ground grime. */
function sideColor(z: number, y: number): readonly [number, number, number] {
  // Clamp the tone so the darkened cut wood never extrapolates past the seam color.
  let c = mixRgb(honeyOak, warmBrown, Math.min(0.7, plankTone(plankIndex(z))));
  c = mixRgb(c, seamDark, 0.42);
  const joint = Math.max(0, 1 - seamDist(z) / 0.01); // end-grain joints on the x sides
  c = mixRgb(c, seamDark, joint * 0.5);
  c = mixRgb(c, seamDark, clamp01((0.05 - y) / 0.05) * 0.35); // darker toward the ground
  return c;
}

/** Top color: per-plank tone, grain streaks, wear, knots, and dark seams. */
function woodColorAt(x: number, y: number, z: number): readonly [number, number, number] {
  const i = plankIndex(z);
  const sd = seamDist(z);
  const tone = plankTone(i);
  let c = mixRgb(honeyOak, warmBrown, tone);
  // The darkest boards sink further, toward old saturated oak.
  if (tone > 0.8) c = mixRgb(c, deepBrown, (tone - 0.8) / 0.2 * 0.7);
  // The palest boards catch a sun-bleached hint.
  if (tone < 0.2) c = mixRgb(c, paleWood, 0.3);

  // Big soft tone wobble along the plank (tile-periodic, so it flows over the edges).
  const wob = pfbm(x, z + i * 0.53, 3, 2, 31);
  c = mixRgb(c, warmBrown, clamp01(wob * 0.5) * 0.2);

  // Grain streaks running along X, phase-shifted per plank so rows never repeat.
  const grain = pfbm(x, z + i * 0.37, 4, 48, 7);
  if (grain > 0) c = mixRgb(c, warmBrown, grain * 0.3);
  else c = mixRgb(c, paleWood, -grain * 0.14);

  // Soft wear: pale patches and worn seam shoulders.
  c = mixRgb(c, paleWood, wearAt(x, z, i) * 0.55);

  // Knots: dark center, warm ring, fading into the plank.
  const kd = knotDist(x, z);
  if (kd < 1) {
    c = mixRgb(c, warmBrown, 0.5 * clamp01((1 - kd) * 2.2));
    c = mixRgb(c, seamDark, 0.8 * clamp01(1 - kd / 0.5));
  }

  // Dark seam: hard core with a soft shoulder.
  const core = Math.max(0, 1 - sd / 0.016);
  c = mixRgb(c, seamDark, core * 0.95);
  const shoulder = Math.max(0, 1 - sd / 0.034);
  c = mixRgb(c, seamDark, shoulder * shoulder * 0.4);

  // Blend to the darker cut-wood sides at the top edge.
  const topness = clamp01((y - 0.072) / 0.006);
  if (topness < 1) c = mixRgb(sideColor(z, y), c, topness);
  return c;
}

/** All fine relief in `bump`: seam grooves, plank crowns, grain, wear, knot dimples. */
function woodBump(x: number, y: number, z: number): number {
  const i = plankIndex(z);
  const sd = seamDist(z);
  // Seam groove with a rounded shoulder.
  const g = Math.max(0, 1 - sd / 0.024);
  let b = -0.003 * g * g;
  // Plank crown: softly rounded across the width, the chibi softness.
  const t = sd / HALF;
  b += 0.0014 * t * t;
  // Grain relief shares the paint's noise so dark streaks line up with grooves.
  b += 0.0008 * pfbm(x, z + i * 0.37, 4, 48, 7);
  // Worn areas sit slightly lower.
  b -= 0.0006 * wearAt(x, z, i);
  // Knots: shallow dimple.
  const kd = knotDist(x, z);
  if (kd < 1) b -= 0.0013 * (1 - kd * kd);
  return b;
}

export default defineAsset({
  name: 'wood-floor',
  description: 'Modular 2 m honey-oak plank floor tile, 0.08 m thick, with dark seams and soft wear.',
  detail: 0.008,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // Tile body: 2 x 0.08 x 2 m. Bottom at y = 0, top at y = 0.08. Outer edges stay
    // square so adjacent cells meet without a shaded gap (same as the hamlet tiles).
    const slab = sdf.box([2, 0.08, 2]).at(0, 0.04, 0);

    k.body('planks', slab.paintFn(woodColorAt), {
      color: '#b5814a',
      roughness: 0.85,
      metalness: 0,
      bump: woodBump,
      paintWeight: 2, // keep the paint gradients through triangle reduction
      textureDensity: 2, // the top face carries all the detail; give it texels
    });
  },
});
