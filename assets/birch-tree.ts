import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';
import type { Sdf } from '../src/index.js';

/**
 * Birch tree — Chibi Quest nature prop (catalog `nature/trees/birch-tree`): about 3.5 m tall,
 * standing on y = 0 and facing +Z, slim sibling of oak-tree and pine-tree.
 *
 * Role: forest-clearing tree seen at sprite size; the white trunk must read at 128 px.
 * One idea: a slim chalk-white trunk banded with black horizontal bark dashes, bending once
 *   or twice, carrying a small airy crown of three or four rounded lobed leaf clumps.
 * Shape language: round and soft (friendly) with a slender vertical secondary read.
 * Palette: birch white #f0ece0, bark mark #35302a, branch gray #6b625a, cut wood #c9a06a,
 *          leaf #5cb85c, sunlit leaf #8fd14f, dark underside #3f9248, deep shadow #2f6b38.
 * Materials: white bark trunk (roughness 0.85), dark branch wood (roughness 0.8),
 *            foliage crown (roughness 0.72), cut wood base (roughness 0.8).
 * Detail list: bent trunk with black dashes (primary), three thin limbs (secondary),
 *   four scalloped clumps with per-clump lighting (primary), leaf bump (tertiary).
 *   Focal point: the white trunk with black marks.
 * Rig: none. Animation: none.
 */

const birch = rgb('#f0ece0');
const birchShade = rgb('#d8d2c2');
const mark = rgb('#35302a');
const branch = rgb('#6b625a');
const cutWood = rgb('#c9a06a');
const cutWoodDark = rgb('#9a7448');
const leafDark = rgb('#3f9248');
const leafShadow = rgb('#2f6b38');
const leaf = rgb('#5cb85c');
const leafLight = rgb('#8fd14f');

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

// One dominant top mass and three satellites: airy, so the trunk shows between clumps.
const clumps: readonly Clump[] = [
  { x: 0.05, y: 3.14, z: -0.02, r: 0.6 }, // central dome
  { x: -0.66, y: 2.76, z: 0.14, r: 0.48 }, // left shoulder
  { x: 0.7, y: 2.82, z: -0.1, r: 0.5 }, // right shoulder
  { x: 0.02, y: 2.62, z: 0.44, r: 0.42 }, // front skirt
];

/**
 * One leaf clump: a squashed main blob with a low ring of three smaller lobes. The lobes
 * bulge past the rim and dip under it, so every clump scallops instead of reading as a ball.
 */
function clumpShape(c: Clump, i: number): Sdf {
  const main = sdf.ellipsoid([c.r * 1.05, c.r * 0.88, c.r * 1.02]).at(c.x, c.y, c.z);
  const lobes: Sdf[] = [];
  for (let j = 0; j < 3; j++) {
    const a = (j / 3) * Math.PI * 2 + noise.random(i, j, 1) * 1.7 + i * 0.9;
    const lr = c.r * (0.38 + 0.12 * noise.random(i, j, 7));
    lobes.push(
      sdf.ellipsoid([lr, lr * 0.8, lr]).at(
        c.x + Math.cos(a) * c.r * 0.86,
        c.y - c.r * 0.34 + (noise.random(i, j, 13) - 0.5) * c.r * 0.22,
        c.z + Math.sin(a) * c.r * 0.86,
      ),
    );
  }
  return sdf.smoothUnion(0.06, main, ...lobes);
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
  name: 'birch-tree',
  description: 'Stylized chibi birch, 3.5 m tall: slim white trunk with black bark dashes, airy four-clump crown.',
  detail: 0.02,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/birch-tree-mock.jpg',

  build(k) {
    // ------------------------------------------------------------------ white trunk
    // Slim chain with two gentle bends: leans +X low, drifts -X high.
    const trunk = sdf.chain(
      [
        [0, -0.05, 0, 0.15],
        [0.02, 0.45, 0.01, 0.11],
        [0.09, 1.05, 0.03, 0.09],
        [0.05, 1.6, 0.02, 0.078],
        [-0.05, 2.1, 0.0, 0.065],
        [-0.11, 2.42, 0.0, 0.055],
      ],
      0.08,
    );
    const roots = sdf.union(
      ...Array.from({ length: 4 }, (_, i) => {
        const a = (i / 4) * Math.PI * 2 + 0.5;
        const len = 0.3 + noise.random(i, 5, 2) * 0.08;
        return sdf.cone([0, 0.28, 0], [Math.cos(a) * len, 0.02, Math.sin(a) * len], 0.2, 0.06);
      }),
    );
    // Birch bark: soft horizontal striation in the white, plus sparse black dashes.
    // The dash field varies fast along Y (horizontal marks) and wraps around the trunk.
    const dash = (x: number, y: number, z: number): number =>
      noise.fbm(x * 2.4 + z * 1.3, y * 8.5, z * 2.4 - x * 1.1, 3, 21);
    const wood = sdf
      .smoothUnion(0.07, trunk, roots)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z) => {
        const rr = Math.hypot(x, z) + 1e-6;
        // Black dashes: threshold the horizontal field, break it up angularly so marks
        // are short strokes, and grow the marks toward the base like the reference.
        const d = dash(x, y, z) + 0.22 * (1 - clamp01(y / 1.6));
        const stroke = noise.fbm(x * 7, y * 3, z * 7, 2, 33);
        const m = smoothstep(0.3, 0.48, d * 0.62 + stroke * 0.38 + 0.18);
        // Fine gray banding in the white between the dashes.
        const ring = 0.5 + 0.5 * noise.fbm(x * 3, y * 18, z * 3, 2, 47);
        let base = mixRgb(birchShade, birch, ring * 0.7);
        // Slightly darker toward the shaded back and near the ground.
        base = mixRgb(base, birchShade, clamp01(-z * 0.5) * 0.35 + clamp01(1 - y / 0.5) * 0.15);
        return mixRgb(base, mark, m);
      });
    k.body('trunk', wood, {
      color: '#f0ece0',
      roughness: 0.85,
      detail: 0.032,
      paintWeight: 2,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 6, y * 16, z * 6, 2, 11),
    });

    // ------------------------------------------------------------------ dark limbs
    // Three thin gray branches reaching from the trunk top into the clumps.
    const limbs = sdf.union(
      sdf.chain(
        [
          [-0.08, 2.2, 0, 0.055],
          [-0.38, 2.5, 0.1, 0.038],
          [-0.6, 2.74, 0.16, 0.026],
        ],
        0.05,
      ),
      sdf.chain(
        [
          [-0.08, 2.25, 0, 0.055],
          [0.32, 2.56, -0.06, 0.038],
          [0.62, 2.8, -0.12, 0.026],
        ],
        0.05,
      ),
      sdf.chain(
        [
          [-0.09, 2.3, 0, 0.05],
          [-0.02, 2.5, 0.26, 0.034],
          [0.03, 2.62, 0.5, 0.024],
        ],
        0.05,
      ),
    )
      .paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2, 8);
        return mixRgb(branch, rgb('#4c443e'), n * 0.5);
      });
    k.body('limbs', limbs, {
      color: '#6b625a',
      roughness: 0.8,
      detail: 0.02,
    });

    // ------------------------------------------------------------------ cut wood base
    // Small flared disk at the ground, like the wooden foot in the mockup.
    const base = sdf
      .cylinder(0.2, 0.07, 0.025)
      .at(0, 0.035, 0)
      .paintFn((x, _y, z) => {
        const r = Math.hypot(x, z);
        const growth = 0.5 + 0.5 * noise.fbm(Math.cos(r * 40) * 2, r * 60, Math.sin(r * 40) * 2, 2, 5);
        return mixRgb(cutWood, cutWoodDark, clamp01(r / 0.2) * 0.5 + growth * 0.18);
      });
    k.body('base', base, {
      color: '#c9a06a',
      roughness: 0.8,
      detail: 0.02,
    });

    // ------------------------------------------------------------------ crown
    const crown = sdf
      .smoothUnion(0.16, ...clumps.map(clumpShape))
      .displace(0.04, (x, y, z) => noise.fbm(x * 1.3, y * 1.3, z * 1.3, 2, 5))
      .paintFn((x, y, z) => {
        const c = nearestClump(x, y, z);
        // 0 under this clump, 1 at its top; a global gradient adds altitude light.
        const local = clamp01(((y - c.y) / c.r) * 0.6 + 0.45);
        const global = clamp01((y - 2.3) / 1.6);
        const patch = 0.5 + 0.5 * noise.fbm(x * 2.4, y * 2.4, z * 2.4, 2, 21);
        const wob = 0.08 * noise.fbm(x * 1.7, y * 1.7, z * 1.7, 2, 33);
        // Dark band over the lower part of every clump, with a wavy organic edge.
        const band = smoothstep(0.28, 0.78, local + wob);
        const baseCol = mixRgb(leafDark, leaf, band * (0.86 + 0.14 * patch));
        const under = smoothstep(0.3, 0.0, local);
        const shaded = mixRgb(baseCol, leafShadow, under * 0.85);
        const top = smoothstep(0.6, 0.95, local);
        const lift = top * (0.45 + 0.55 * global) * (0.55 + 0.45 * patch);
        const lit = mixRgb(shaded, leafLight, lift);
        // Gentle light and dark patches, so the big faces are not one flat color.
        const n = noise.fbm(x * 1.2, y * 1.2, z * 1.2, 2, 7);
        return n >= 0 ? mixRgb(lit, leafLight, n * 0.12) : mixRgb(lit, leafShadow, -n * 0.14);
      });
    k.body('crown', crown, {
      color: '#5cb85c',
      roughness: 0.72,
      detail: 0.045,
      paintWeight: 3,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 14, y * 14, z * 14, 2, 3),
    });
  },
});
