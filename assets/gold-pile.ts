import { defineAsset, sdf, noise, rgb, mixRgb } from '../src/index.js';

/**
 * Gold pile (dungeon dressing): a low mound of chunky overlapping coins with
 * two upright goblets, one tipped goblet, and two teal gems poking out.
 * Role: small treasure dressing prop, reads at 128 px as a warm gold mound.
 * Size: ~0.5 m wide, ~0.25 m tall, stands on y = 0, faces +Z.
 * One idea: a heap of oversized coins spilling outward, crowned with goblets.
 * Shape language: round dominant (coins, cups, gems), soft bevels everywhere.
 * Palette: treasure gold #f4c542 dominant, deep gold #9c6d1c shadows,
 *   sparkle #ffe9a8 highlights, gem teal #3fae9a accent (60/30/10 warm).
 * Materials: gold (metalness 0.9, roughness 0.3); gems (flat, faint glow).
 * Rig/animation: none (static dressing).
 */

const GOLD = rgb('#f4c542');
const GOLD_DARK = rgb('#9c6d1c');
const SPARK = rgb('#ffe9a8');
const GEM = '#3fae9a';

/** Gold paint: dark crevices from low-frequency variation, bright sparkle speckle. */
const goldPaint = (x: number, y: number, z: number): readonly [number, number, number] => {
  const blotch = noise.fbm(x * 9, y * 9, z * 9, 2); // -1..1, coin-to-coin variation
  let c = mixRgb(GOLD_DARK, GOLD, 0.62 + 0.22 * blotch);
  const n = noise.noise3(x * 55, y * 55, z * 55); // -1..1 speckle
  if (n > 0.45) c = mixRgb(c, SPARK, Math.min(1, (n - 0.45) * 2.2));
  return c;
};

/** Chunky coin: short rounded-edge disc. */
const coin = (r: number, x: number, y: number, z: number, rx = 0, rz = 0) =>
  sdf.cylinder(r, 0.02, 0.007).rotate(rx, 0, rz).at(x, y, z);

/** Chunky solid goblet from plain primitives (foot, stem, bead, tapered cup).
 *  No torus, no smooth-union: keeps every edge crisp and the field clean.
 *  The dark disc on top fakes the cup opening. */
function goblet() {
  const foot = sdf.cylinder(0.036, 0.014, 0.005).at(0, 0.007, 0);
  const stem = sdf.cylinder(0.012, 0.07, 0.004).at(0, 0.05, 0);
  const bead = sdf.sphere(0.018).at(0, 0.062, 0);
  const cup = sdf
    .cone([0, 0.08, 0], [0, 0.155, 0], 0.024, 0.048)
    // Forge's cone has a spherical cap: flatten the top into a true cup mouth.
    .intersect(sdf.halfSpace([0, 1, 0], 0.155));
  const mouth = sdf.cylinder(0.03, 0.004, 0).at(0, 0.1555, 0);
  return sdf
    .union(foot, stem, bead, cup)
    .paintWhere(mouth, '#7a5312', 0.004);
}

export default defineAsset({
  name: 'gold-pile',
  description: 'Low mound of chunky gold coins with goblets and gems poking out.',
  detail: 0.009,
  reference: 'docs/dungeon-mockups/dungeon-quest_002.jpg',
  texture: { size: 1024 },
  build(k) {
    // Mound core clipped to sit flat on y = 0.
    const mound = sdf
      .ellipsoid([0.21, 0.095, 0.18])
      .at(0, 0.075, 0)
      .displace(0.01, (x, _y, z) => noise.fbm(x * 14, 0.5, z * 14, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // Chunky coins resting ON the mound surface (y follows the ellipsoid top),
    // tilted with its slope; crisp unions so each coin keeps a readable disc edge.
    // Mound top: 0.075 + 0.095 * sqrt(1 - (x/0.21)^2 - (z/0.18)^2); coins embed ~6 mm.
    const scatter: [number, number, number, number, number][] = [
      // x, z, y, tiltX, tiltZ
      [0, 0.02, 0.163, 8, 5],
      [-0.085, 0.045, 0.153, 12, -14],
      [0.085, 0.04, 0.154, -10, 12],
      [-0.04, -0.075, 0.153, -14, -6],
      [0.05, -0.065, 0.155, 10, 8],
      [-0.12, -0.05, 0.142, 18, -20],
      [0.13, -0.04, 0.141, -16, 18],
      [-0.055, 0.11, 0.14, 20, -8],
      [0.065, 0.11, 0.138, -18, 10],
      [0.01, -0.13, 0.135, -20, 4],
      [-0.16, 0.05, 0.118, 30, -12],
      [0.17, 0.045, 0.112, -28, 14],
      [-0.09, 0.14, 0.106, 24, -6],
      [0.1, 0.135, 0.106, -22, 8],
    ];
    const loose = scatter.map(([x, z, y, rx, rz], i) =>
      coin(0.038 + noise.random(i, 7) * 0.01, x, y, z, rx, rz),
    );
    const stack = [0, 1, 2].map((i) => coin(0.04, -0.15, 0.095 + i * 0.021, -0.1, 4, -3));
    // Spilled coins flat on the ground around the pile (widens footprint to ~0.5 m).
    const spill: [number, number, number][] = [
      [-0.23, 0.1, 12],
      [0.24, 0.08, -20],
      [-0.12, 0.21, 30],
      [0.13, -0.19, -14],
      [0.02, -0.23, 8],
    ];
    const spilled = spill.map(([x, z, r], i) => coin(0.036, x, 0.012, z, 0, r));

    // Goblets: tilted left, upright right, one tipped at the front.
    const g1 = goblet().rotate(16, 0, 12).at(-0.085, 0.1, 0.05);
    const g2 = goblet().rotate(-6, 0, -8).at(0.105, 0.105, -0.05);
    const g3 = goblet().rotate(0, 0, -78).at(0.02, 0.155, 0.15);

    const gold = sdf
      .union(mound, ...loose, ...stack, ...spilled, g1, g2, g3)
      .round(0.003)
      .paintFn(goldPaint);
    k.body('gold', gold, {
      color: '#f4c542',
      roughness: 0.3,
      metalness: 0.9,
      detail: 0.009,
      textureDensity: 1,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 50, y * 50, z * 50, 2),
      maxTriangles: 3200,
    });

    // Two faceted teal crystal bipyramids poking out of the top.
    const gemAt = (s: number, x: number, y: number, z: number) =>
      sdf
        .union(
          sdf.cone([0, -0.035 * s, 0], [0, 0.02 * s, 0], 0.004, 0.028 * s),
          sdf.cone([0, 0.02 * s, 0], [0, 0.055 * s, 0], 0.028 * s, 0.004),
        )
        .at(x, y, z);
    k.body('gems', sdf.union(gemAt(1, 0.04, 0.17, 0.03), gemAt(0.7, -0.05, 0.15, -0.04)), {
      color: GEM,
      roughness: 0.15,
      metalness: 0.1,
      flat: true,
      emissive: GEM,
      emissiveIntensity: 0.4,
      detail: 0.005,
      maxTriangles: 400,
    });
  },
});
