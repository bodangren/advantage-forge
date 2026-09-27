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
 * Detail list: forked trunk and flared roots (primary), seven clump masses with per-clump
 *   lighting and scalloped rims (primary), bark grooves and leaf bump (tertiary).
 *   Focal point: the sunlit crown top.
 * Rig: none. Animation: none.
 */

const bark = rgb('#7d4a27');
const barkLight = rgb('#a9713c');
const barkDark = rgb('#3d2415');
const moss = rgb('#5b8a3c');
const leafDark = rgb('#3e7331');
const leafShadow = rgb('#2c5226');
const leaf = rgb('#6fae43');
const leafLight = rgb('#b2d95e');

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

// One dominant mass, six satellites: wide in X, domed on top, open under the rim so limbs show.
const clumps: readonly Clump[] = [
  { x: 0.0, y: 3.4, z: 0.0, r: 1.0 }, // central dome
  { x: -0.95, y: 3.0, z: 0.12, r: 0.72 }, // left shoulder
  { x: 0.95, y: 3.05, z: -0.08, r: 0.72 }, // right shoulder
  { x: 0.1, y: 2.8, z: 0.85, r: 0.68 }, // front skirt
  { x: -0.12, y: 2.85, z: -0.82, r: 0.66 }, // back skirt
  { x: 0.42, y: 3.95, z: 0.2, r: 0.58 }, // top-left lobe
  { x: -0.46, y: 3.9, z: -0.16, r: 0.55 }, // top-right lobe
];

/**
 * One leaf clump: a squashed main blob with a low ring of three smaller lobes. The lobes
 * bulge past the rim and dip under it, so every clump scallops instead of reading as a ball.
 */
function clumpShape(c: Clump, i: number): Sdf {
  const main = sdf.ellipsoid([c.r * 1.05, c.r * 0.9, c.r * 1.02]).at(c.x, c.y, c.z);
  const lobes: Sdf[] = [];
  for (let j = 0; j < 3; j++) {
    const a = (j / 3) * Math.PI * 2 + noise.random(i, j, 1) * 1.7 + i * 0.9;
    const lr = c.r * (0.4 + 0.12 * noise.random(i, j, 7));
    lobes.push(
      sdf.ellipsoid([lr, lr * 0.82, lr]).at(
        c.x + Math.cos(a) * c.r * 0.86,
        c.y - c.r * 0.36 + (noise.random(i, j, 13) - 0.5) * c.r * 0.22,
        c.z + Math.sin(a) * c.r * 0.86,
      ),
    );
  }
  return sdf.smoothUnion(0.07, main, ...lobes);
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
  description: 'Stylized chibi oak, 4.5 m tall: forked trunk, flared roots, seven-blob dome crown.',
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
      .smoothUnion(0.24, ...clumps.map(clumpShape))
      .displace(0.05, (x, y, z) => noise.fbm(x * 1.2, y * 1.2, z * 1.2, 2, 5))
      .paintFn((x, y, z) => {
        const c = nearestClump(x, y, z);
        // 0 under this clump, 1 at its top; a global gradient adds altitude light.
        const local = clamp01(((y - c.y) / c.r) * 0.6 + 0.45);
        const global = clamp01((y - 2.2) / 2.3);
        const patch = 0.5 + 0.5 * noise.fbm(x * 2.4, y * 2.4, z * 2.4, 2, 21);
        const wob = 0.08 * noise.fbm(x * 1.7, y * 1.7, z * 1.7, 2, 33);
        // Dark band over the lower part of every clump, with a wavy organic edge (pine family).
        const band = smoothstep(0.28, 0.78, local + wob);
        const base = mixRgb(leafDark, leaf, band * (0.86 + 0.14 * patch));
        const under = smoothstep(0.3, 0.0, local);
        const shaded = mixRgb(base, leafShadow, under * 0.85);
        const top = smoothstep(0.6, 0.95, local);
        const lift = top * (0.45 + 0.55 * global) * (0.55 + 0.45 * patch);
        const lit = mixRgb(shaded, leafLight, lift);
        // Gentle light and dark patches, so the big faces are not one flat color.
        const n = noise.fbm(x * 1.2, y * 1.2, z * 1.2, 2, 7);
        return n >= 0 ? mixRgb(lit, leafLight, n * 0.12) : mixRgb(lit, leafShadow, -n * 0.14);
      });
    k.body('crown', crown, {
      color: '#6fae43',
      roughness: 0.72,
      detail: 0.036,
      paintWeight: 3,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 14, y * 14, z * 14, 2, 3),
    });
  },
});
