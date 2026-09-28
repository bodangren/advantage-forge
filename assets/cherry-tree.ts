import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';
import type { Sdf } from '../src/index.js';

/**
 * Cherry blossom tree — Chibi Quest nature prop (catalog `nature/trees/cherry-tree`):
 * about 3 m tall, standing on y = 0 and facing +Z, sibling of oak-tree.
 *
 * Role: hamlet decorative tree seen at sprite size; the pink cloud silhouette must read at 128 px.
 * One idea: a dark twisting trunk wrapped by a round lumpy cloud of pink blossom clumps,
 *   with a few fallen petals at its feet — spring counterpart to the oak's green dome.
 * Shape language: round and chunky (friendly) with the twisted forked trunk as the sturdy read.
 * Palette: blossom light #ffd3e2, blossom #f4a6c0, blossom deep #e07aa0, blossom shadow #b95e83,
 *          bark walnut #6b4226, bark warm #8a5a35, bark dark #3a2415.
 * Materials: bark trunk (roughness 0.9), blossom crown (roughness 0.75), fallen petals (roughness 0.8).
 * Detail list: twisting trunk, flared roots, three forked limbs (primary), eight blossom clumps
 *   with per-clump lighting and scalloped rims (primary), bark grooves and petal bump (tertiary).
 *   Focal point: the sunlit pink crown top.
 * Rig: none. Animation: none.
 */

const bark = rgb('#6b4226');
const barkWarm = rgb('#8a5a35');
const barkDark = rgb('#3a2415');
const blossomShadow = rgb('#b95e83');
const blossomDeep = rgb('#e07aa0');
const blossom = rgb('#f4a6c0');
const blossomLight = rgb('#ffd3e2');

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

// One dominant mass, seven satellites: round in plan, domed on top, open under the rim.
const clumps: readonly Clump[] = [
  { x: 0.0, y: 2.5, z: 0.0, r: 0.78 }, // central dome
  { x: -0.68, y: 2.26, z: 0.1, r: 0.55 }, // left shoulder
  { x: 0.7, y: 2.3, z: -0.06, r: 0.56 }, // right shoulder
  { x: 0.08, y: 2.1, z: 0.62, r: 0.5 }, // front skirt
  { x: -0.1, y: 2.13, z: -0.6, r: 0.5 }, // back skirt
  { x: 0.3, y: 2.95, z: 0.14, r: 0.4 }, // top-left lobe
  { x: -0.32, y: 2.9, z: -0.12, r: 0.39 }, // top-right lobe
  { x: 0.02, y: 2.2, z: -0.05, r: 0.5 }, // heart filler, keeps the crown one cloud
];

/**
 * One blossom clump: a squashed main blob with a low ring of three smaller lobes. The lobes
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
  return sdf.smoothUnion(0.06, main, ...lobes);
}

/** Nearest clump to a point, used so every blob lights itself: deep rim, bright top. */
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
  name: 'cherry-tree',
  description: 'Stylized chibi cherry blossom tree, 3 m tall: twisting trunk, flared roots, eight-blob pink blossom crown, fallen petals.',
  detail: 0.018,
  reference: 'docs/item-mockups/cherry-tree-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ bark
    // Thick twisting trunk that stops at the fork; three heavy limbs spread from it.
    const trunk = sdf.chain(
      [
        [0, -0.05, 0, 0.38],
        [0.08, 0.35, 0.05, 0.32],
        [-0.06, 0.8, 0.07, 0.26],
        [0.07, 1.2, 0.0, 0.21],
        [0.0, 1.45, -0.02, 0.18],
      ],
      0.09,
    );
    const limbs = sdf.union(
      sdf.chain(
        [
          [0.0, 1.3, 0, 0.18],
          [-0.34, 1.68, 0.08, 0.13],
          [-0.66, 2.05, 0.12, 0.08],
        ],
        0.08,
      ),
      sdf.chain(
        [
          [0.0, 1.3, 0, 0.18],
          [0.38, 1.66, -0.05, 0.13],
          [0.7, 2.02, -0.1, 0.08],
        ],
        0.08,
      ),
      sdf.chain(
        [
          [0.0, 1.3, 0, 0.18],
          [-0.02, 1.72, -0.3, 0.12],
          [-0.08, 2.08, -0.52, 0.07],
        ],
        0.08,
      ),
    );
    const roots = sdf.union(
      ...Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 + 0.7;
        const len = 0.42 + noise.random(i, 5, 2) * 0.12;
        return sdf.cone([0, 0.4, 0], [Math.cos(a) * len, 0.03, Math.sin(a) * len], 0.26, 0.09);
      }),
    );
    const ridges = (x: number, y: number, z: number): number => noise.fbm(x * 10, y * 3, z * 10, 3, 41);
    const wood = sdf
      .smoothUnion(0.08, trunk, limbs, roots)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .displace(0.008, (x, y, z) => noise.fbm(x * 6, y * 2, z * 6, 2, 31))
      .paintFn((x, y, z) => {
        const groove = Math.max(0, -ridges(x, y, z));
        const base = mixRgb(bark, barkDark, 0.35 + 0.6 * Math.min(1, groove * 1.5));
        const flare = clamp01(1 - y / 0.4) * (0.4 + 0.45 * noise.fbm(x * 4, y * 4, z * 4, 2, 9));
        return mixRgb(base, barkWarm, flare * 0.35);
      });
    k.body('trunk', wood, {
      color: '#6b4226',
      roughness: 0.9,
      detail: 0.048,
      paintWeight: 2,
      bump: (x, y, z) => 0.005 * ridges(x, y, z),
    });

    // ------------------------------------------------------------------ crown
    const crown = sdf
      .smoothUnion(0.2, ...clumps.map(clumpShape))
      .displace(0.04, (x, y, z) => noise.fbm(x * 1.4, y * 1.4, z * 1.4, 2, 5))
      .paintFn((x, y, z) => {
        const c = nearestClump(x, y, z);
        // 0 under this clump, 1 at its top; a global gradient adds altitude light.
        const local = clamp01(((y - c.y) / c.r) * 0.6 + 0.45);
        const global = clamp01((y - 1.7) / 1.7);
        const patch = 0.5 + 0.5 * noise.fbm(x * 2.6, y * 2.6, z * 2.6, 2, 21);
        const wob = 0.08 * noise.fbm(x * 1.8, y * 1.8, z * 1.8, 2, 33);
        // Deep color over the lower part of every clump, with a wavy organic edge.
        const band = smoothstep(0.2, 0.8, local + wob);
        const base = mixRgb(blossomDeep, blossom, band * (0.86 + 0.14 * patch));
        const under = smoothstep(0.3, 0.0, local);
        const shaded = mixRgb(base, blossomShadow, under * 0.55);
        const top = smoothstep(0.6, 0.95, local);
        const lift = top * (0.45 + 0.55 * global) * (0.55 + 0.45 * patch);
        const lit = mixRgb(shaded, blossomLight, lift);
        // Gentle light and deep patches, so the big faces are not one flat color.
        const n = noise.fbm(x * 1.3, y * 1.3, z * 1.3, 2, 7);
        return n >= 0 ? mixRgb(lit, blossomLight, n * 0.12) : mixRgb(lit, blossomDeep, -n * 0.14);
      });
    k.body('crown', crown, {
      color: '#f4a6c0',
      roughness: 0.75,
      detail: 0.038,
      paintWeight: 3,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 15, y * 15, z * 15, 2, 3),
    });

    // ------------------------------------------------------------------ fallen petals
    // A few small flattened blossom pads resting on the ground around the roots.
    const petals: Sdf[] = [];
    for (let i = 0; i < 7; i++) {
      const a = noise.random(i, 3, 11) * Math.PI * 2;
      const d = 0.5 + noise.random(i, 7, 5) * 0.55;
      const px = Math.cos(a) * d;
      const pz = Math.sin(a) * d;
      const pr = 0.05 + noise.random(i, 9, 8) * 0.045;
      petals.push(
        sdf
          .ellipsoid([pr, pr * 0.35, pr * 0.9])
          .rotateY(noise.random(i, 2, 4) * 180)
          .at(px, pr * 0.3, pz),
      );
    }
    const petalShape = sdf
      .union(...petals)
      .paintFn((x, y, z) => {
        const tint = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2, 19);
        return mixRgb(blossomDeep, blossomLight, 0.35 + 0.5 * tint);
      });
    k.body('petals', petalShape, {
      color: '#f4a6c0',
      roughness: 0.8,
      detail: 0.02,
      paintWeight: 2,
    });
  },
});
