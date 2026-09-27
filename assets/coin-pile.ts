import { defineAsset, sdf, noise, rgb, mixRgb } from '../src/index.js';

/**
 * Coin pile (props/world/coin-pile).
 *
 * Role: dungeon/treasure dressing prop and pickup cluster. Reads at 128 px as a
 *   warm old-gold mound with two red sparks, so most of its detail is silhouette
 *   and value, not fine engraving.
 * Size: 0.7 m across (X), about 0.3 m tall, centered on Y, stands on y = 0, faces +Z.
 * One idea: a soft mound built from many overlapping chunky coins, a few coins
 *   standing on edge around the rim, and a small crown of coins at the summit.
 * Shape language: round dominant (coins, gems), soft bevels everywhere.
 * Palette: old gold #d4a93a dominant, shadow #7a5410 / #5a3d0a, sparkle #f0d78a;
 *   ruby red gem #e0402a accent (60/30/10 warm).
 * Materials: gold (metalness 1, roughness 0.3); gem (roughness 0.1, flat, faint glow).
 * Rig/animation: none (static dressing).
 */

const GOLD = rgb('#d4a93a');
const GOLD_DARK = rgb('#7a5410');
const GOLD_DEEP = rgb('#5a3d0a');
const SPARK = rgb('#f0d78a');
const GEM_BASE = '#5a1410';
const GEM_GLOW = '#e0402a';

// Heap envelope: a half-ellipsoid on the ground. Coins tile its shell.
const RX = 0.29;
const RY = 0.175;
const RZ = 0.19;
const COIN_T = 0.03; // chunky coin thickness

/** Surface height of the heap envelope at (x, z); 0 outside the footprint. */
const topY = (x: number, z: number): number => {
  const q = 1 - (x / RX) ** 2 - (z / RZ) ** 2;
  return q <= 0 ? 0 : RY * Math.sqrt(q);
};

/**
 * Chunky coin: a thick rounded disc with a stepped inner face and a central boss,
 * so each face reads as a stamped coin. The steps are bold enough to survive the
 * triangle reduction to the 5k budget.
 */
const disc = (r: number): sdf.Shape =>
  sdf.union(
    sdf.cylinder(r, COIN_T, 0.005),
    sdf.cylinder(r * 0.7, COIN_T * 1.5, 0.004).at(0, COIN_T * 0.25, 0),
    sdf.cylinder(r * 0.22, COIN_T * 1.9, 0.003).at(0, COIN_T * 0.45, 0),
  );

/**
 * A coin seated on the heap shell at azimuth `theta`, polar angle `phi`
 * (0 = summit, PI/2 = the widest ring), with a little jitter so the pile reads as
 * stacked coins instead of one smooth skin.
 */
const shellCoin = (r: number, theta: number, phi: number, jitter: number): sdf.Shape => {
  const sp = Math.sin(phi);
  const x = RX * sp * Math.cos(theta);
  const z = RZ * sp * Math.sin(theta);
  const y = RY * Math.cos(phi);
  const nx = x / (RX * RX);
  const ny = y / (RY * RY);
  const nz = z / (RZ * RZ);
  const nl = Math.hypot(nx, ny, nz) || 1;
  const off = COIN_T / 2 - 0.009;
  const deg = (phi * 180) / Math.PI;
  return disc(r)
    .rotate(deg * Math.sin(theta) + jitter, 0, -deg * Math.cos(theta) - jitter * 0.6)
    .at(x + (nx / nl) * off, y + (ny / nl) * off, z + (nz / nl) * off);
};

/** A coin standing on edge at (x, y, z). axis 'z' faces front, 'x' faces sideways. */
const uprightCoin = (r: number, x: number, y: number, z: number, yaw: number, axis: 'x' | 'z'): sdf.Shape => {
  const spun = axis === 'z' ? disc(r).rotateX(90) : disc(r).rotateZ(90);
  return spun.rotateY(yaw).at(x, y, z);
};

/** Faceted red gem: a compact bipyramid, flat-shaded. */
const gemAt = (s: number, x: number, y: number, z: number): sdf.Shape =>
  sdf
    .union(
      sdf.cone([0, -0.026 * s, 0], [0, 0.006 * s, 0], 0.003, 0.026 * s),
      sdf.cone([0, 0.006 * s, 0], [0, 0.032 * s, 0], 0.026 * s, 0.003),
    )
    .at(x, y, z);

/** Gold paint: dark crevices, warm mid body, bright sparkle on worn highlights. */
const goldPaint = (x: number, y: number, z: number): readonly [number, number, number] => {
  const blotch = noise.fbm(x * 7, y * 7, z * 7, 2); // coin-to-coin variation
  let c = mixRgb(GOLD_DARK, GOLD, 0.76 + 0.22 * blotch);
  const value = Math.min(1, Math.max(0, y / 0.22)); // low coins darker, summit brighter
  c = mixRgb(GOLD_DEEP, c, 0.6 + 0.4 * value);
  const n = noise.noise3(x * 60, y * 60, z * 60); // -1..1 speckle
  if (n > 0.45) c = mixRgb(c, SPARK, Math.min(1, (n - 0.45) * 2.6));
  return c;
};

export default defineAsset({
  name: 'coin-pile',
  description: 'Heap of chunky old-gold coins with coins on edge and two small red gems.',
  detail: 0.008,
  reference: 'docs/item-mockups/coin-pile-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ heap core
    const core = sdf
      .ellipsoid([RX - 0.02, RY - 0.015, RZ - 0.02])
      .displace(0.012, (x, _y, z) => noise.fbm(x * 10, 0.5, z * 10, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // ------------------------------------------------------------------ coin shell
    // A phyllotaxis spiral tiles coins from the summit down the flanks.
    const N = 24;
    const shell: sdf.Shape[] = [];
    for (let i = 0; i < N; i++) {
      const phi = 1.38 * Math.sqrt((i + 0.4) / N);
      const theta = i * 2.399963 + noise.random(i, 3) * 1.2;
      const r = 0.055 + noise.random(i, 11) * 0.018;
      const jitter = (noise.random(i, 71) - 0.5) * 16;
      shell.push(shellCoin(r, theta, phi, jitter));
    }

    // Spilled coins lying flat around the base widen the footprint to 0.7 m.
    const spillSpecs: [number, number, number, number][] = [
      [-0.27, 0.1, 20, 0.058],
      [0.28, 0.07, -16, 0.056],
      [-0.1, -0.21, 28, 0.058],
      [0.12, -0.21, -24, 0.056],
      [-0.29, -0.05, 14, 0.055],
    ];
    const spill = spillSpecs.map(([x, z, tilt, r]) =>
      disc(r).rotate(0, 0, tilt).at(x, COIN_T / 2 - 0.001, z),
    );

    // Summit crown: a small ring of upright coins, the focal point that reads from
    // the front (we see their round faces, not a thin stack edge).
    const summit = topY(0, 0);
    const crown = [0, 1, 2, 3].map((i) => {
      const a = (i / 4) * Math.PI * 2 + 0.5;
      const r = 0.065;
      const cx = Math.cos(a) * 0.045;
      const cz = Math.sin(a) * 0.03;
      const yaw = 90 - (a * 180) / Math.PI;
      return uprightCoin(r, cx, summit - 0.01 + r, cz, yaw, 'z');
    });

    // Coins standing on edge break the silhouette at the rim.
    const standing = [
      uprightCoin(0.058, 0.285, 0.052, 0.06, 14, 'z'),
      uprightCoin(0.055, -0.285, 0.05, -0.04, -24, 'z'),
      uprightCoin(0.057, 0.18, 0.052, 0.19, 40, 'x'),
    ];

    // Clip the heap flat on y = 0 so no coin edge dips below the floor.
    const gold = sdf
      .union(core, ...shell, ...spill, ...crown, ...standing)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(goldPaint);

    k.body('gold', gold, {
      color: GOLD,
      roughness: 0.3,
      metalness: 1,
      detail: 0.008,
      textureDensity: 1,
      bump: (x, y, z) => 0.0009 * noise.fbm(x * 55, y * 55, z * 55, 2),
      maxTriangles: 4600,
    });

    // ------------------------------------------------------------------ two red gems
    // Seated on the coin surface at the front, poking out of the heap like the mock.
    const g1 = gemAt(0.9, 0.15, topY(0.15, 0.12) + 0.045, 0.12);
    const g2 = gemAt(0.78, -0.19, topY(-0.19, 0.05) + 0.042, 0.05).rotate(18, 25, -10);
    k.body('gems', sdf.union(g1, g2), {
      color: GEM_BASE,
      roughness: 0.1,
      metalness: 0.05,
      flat: true,
      emissive: GEM_GLOW,
      emissiveIntensity: 0.8,
      detail: 0.005,
      maxTriangles: 300,
    });
  },
});
