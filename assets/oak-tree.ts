import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import type { Sdf } from '../src/index.js';

/**
 * Oak tree — Chibi Quest nature prop (catalog `nature/trees/oak-tree`): about 4.5 m tall,
 * standing on y = 0 and facing +Z, sibling of pine-tree and bush.
 *
 * Role: hamlet landmark tree seen at sprite size; the silhouette must read at 128 px.
 * One idea: a wide domed crown of seven overlapping leaf blobs perched on a thick Y-forked
 *   trunk — the broad counterpart to the pine's stacked cones.
 * Shape language: round and chunky (friendly) with the forked trunk as the sturdy secondary read.
 * Palette: fresh green #6fae43, sunlit top #b2d95e, dark underside #3e7331, shadow #2c5226,
 *          bark #7d4a27, root flare #a9713c — the pine family, unchanged.
 * Materials: bark trunk (roughness 0.9), foliage crown (roughness 0.72).
 * Detail list: forked trunk and flared roots (primary), 17 clusters lit by height and distance
 *   from center (#3a6e26 dark inner, #6fae3c outer, light top) with six scallop lobes per rim, two open gaps (side, back) (primary), bark grooves and leaf bump (tertiary).
 *   Focal point: the sunlit crown top.
 * Rig: none. Animation: none.
 */

const bark = rgb('#7d4a27');
const barkLight = rgb('#a9713c');
const barkDark = rgb('#3d2415');
const moss = rgb('#5b8a3c');
const leafDark = rgb('#2f5f22');
const leafShadow = rgb('#26501b');
const leaf = rgb('#5f9e34');
const leafLight = rgb('#7cb848');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

interface Clump {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly r: number;
}

// 17 ellipsoid clusters in a broad dome; the underside stays open so three limbs show as they
// enter the crown.
const clumps: readonly Clump[] = [
  { x: 0.0, y: 3.5, z: 0.0, r: 0.85 },
  { x: -0.85, y: 3.1, z: 0.1, r: 0.78 },
  { x: 0.88, y: 3.1, z: -0.05, r: 0.78 },
  { x: 0.05, y: 2.95, z: 0.85, r: 0.65 },
  { x: -0.1, y: 2.95, z: -0.85, r: 0.65 },
  { x: 0.45, y: 3.95, z: 0.2, r: 0.6 },
  { x: -0.45, y: 3.85, z: -0.2, r: 0.6 },
  { x: -0.6, y: 3.3, z: 0.75, r: 0.55 },
  { x: 0.7, y: 3.3, z: 0.7, r: 0.55 },
  { x: 0.65, y: 3.3, z: -0.75, r: 0.55 },
  { x: -1.15, y: 2.85, z: 0.0, r: 0.5 },
  { x: 0.0, y: 4.0, z: -0.5, r: 0.5 },
  { x: 0.0, y: 3.9, z: 0.6, r: 0.5 },
  { x: 0.85, y: 3.85, z: -0.3, r: 0.5 },
  { x: -0.85, y: 3.8, z: 0.2, r: 0.5 },
];

/**
 * One leaf clump: a squashed main blob with a low ring of three smaller lobes. The lobes
 * bulge past the rim and dip under it, so every clump scallops instead of reading as a ball.
 */
function clumpShape(c: Clump, i: number): Sdf {
  const main = sdf.ellipsoid([c.r * 1.05, c.r * 0.9, c.r * 1.02]).at(c.x, c.y, c.z);
  const lobes: Sdf[] = [];
  for (let j = 0; j < 6; j++) {
    const a = (j / 6) * Math.PI * 2 + noise.random(i, j, 1) * 0.8 + i * 0.9;
    const lr = 0.12 + 0.06 * noise.random(i, j, 7);
    const up = (noise.random(i, j, 13) - 0.3) * c.r * 0.7;
    const rim = Math.sqrt(Math.max(0.05, 1 - (up / c.r) ** 2)) * c.r * 0.88;
    lobes.push(sdf.sphere(lr).at(c.x + Math.cos(a) * rim, c.y + up, c.z + Math.sin(a) * rim));
  }
  return sdf.smoothUnion(0.05, main, ...lobes);
}

/** Nearest clump to a point, used so every blob lights itself: dark rim, bright top. */
function nearestClump(x: number, y: number, z: number): Clump {
  let best = clumps[0]!;
  let bestD = Infinity;
  for (const c of clumps) {
    const d = (x - c.x) ** 2 + (y - c.y) ** 2 + (z - c.z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

export default defineAsset({
  name: 'oak-tree',
  description: 'Stylized chibi oak, 4.5 m tall: forked trunk, flared roots, 17-cluster dome crown.',
  detail: 0.02,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ bark
    // Thick tapering trunk that stops at the fork; three heavy limbs spread from it.
    const trunk = sdf.chain(
      [
        [0, -0.05, 0, 0.46],
        [0.03, 0.4, 0.02, 0.37],
        [0.05, 0.9, 0.03, 0.31],
        [0.04, 1.4, 0.0, 0.28],
        [0.03, 1.7, 0.0, 0.26],
      ],
      0.12,
    );
    const limbs = sdf.union(
      sdf.chain(
        [
          [0.03, 1.5, 0, 0.27],
          [-0.42, 2.0, 0.1, 0.19],
          [-0.9, 2.5, 0.16, 0.14],
        ],
        0.1,
      ),
      sdf.chain(
        [
          [0.03, 1.5, 0, 0.27],
          [0.48, 1.95, -0.06, 0.19],
          [0.95, 2.45, -0.12, 0.14],
        ],
        0.1,
      ),
      sdf.chain(
        [
          [0.03, 1.5, 0, 0.27],
          [-0.02, 2.1, -0.42, 0.18],
          [-0.14, 2.6, -0.7, 0.13],
        ],
        0.1,
      ),
    );
    const roots = sdf.union(
      ...Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 + 0.7;
        const len = 0.62 + noise.random(i, 5, 2) * 0.16;
        return sdf.cone([0, 0.6, 0], [Math.cos(a) * len, 0.04, Math.sin(a) * len], 0.4, 0.13);
      }),
    );
    const ridges = (x: number, y: number, z: number): number => noise.fbm(x * 8, y * 2.5, z * 8, 3, 41);
    const wood = sdf
      .smoothUnion(0.1, trunk, limbs, roots)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .displace(0.01, (x, y, z) => noise.fbm(x * 6, y * 2, z * 6, 2, 31))
      .paintFn((x, y, z) => {
        const groove = Math.max(0, -ridges(x, y, z));
        const base = mixRgb(bark, barkDark, Math.min(1, groove * 1.7));
        const flare = clamp01(1 - y / 0.8) * (0.4 + 0.45 * noise.fbm(x * 3, y * 3, z * 3, 2, 9));
        const lit = mixRgb(base, barkLight, flare * 0.8);
        // A little moss on the shaded back side, low on the trunk.
        const damp = clamp01(-z * 1.4) * clamp01(1 - y / 0.7) * (0.35 + 0.4 * noise.fbm(x * 5, y * 5, z * 5, 2, 17));
        return mixRgb(lit, moss, damp * 0.55);
      });
    k.body('trunk', wood, {
      color: '#7d4a27',
      roughness: 0.9,
      detail: 0.045,
      paintWeight: 2,
      bump: (x, y, z) => 0.005 * ridges(x, y, z),
    });

    // ------------------------------------------------------------------ crown
    const crown = sdf
      .smoothUnion(0.08, ...clumps.map(clumpShape))
      .displace(0.01, (x, y, z) => noise.fbm(x * 9, y * 9, z * 9, 2, 5))
      .paintFn((x, y, z) => {
        const c = nearestClump(x, y, z);
        const up = clamp01(((y - c.y) / c.r) * 0.5 + 0.5);
        const height = clamp01((y - 2.6) / 1.8);
        const outer = clamp01(Math.hypot(c.x, c.z) / 1.0);
        const patch = 0.5 + 0.5 * noise.fbm(x * 2.4, y * 2.4, z * 2.4, 2, 21);
        const light = clamp01(0.6 * up * up + 0.35 * height + 0.15 * outer + 0.1 * (patch - 0.5) - 0.12);
        let col = mixRgb(leafDark, leaf, smoothstep(0.25, 0.65, light));
        col = mixRgb(col, leafShadow, smoothstep(0.2, 0.0, light) * 0.5);
        const isTop = c.y > 3.8;
        return isTop ? mixRgb(col, leafLight, smoothstep(0.45, 0.8, light)) : col;
      });
    k.body('crown', crown, {
      color: '#6fae43',
      roughness: 0.72,
      detail: 0.036,
      paintWeight: 3,
      bump: (x, y, z) => 0.02 * noise.fbm(x * 22, y * 22, z * 22, 3, 3),
    });
  },
});
