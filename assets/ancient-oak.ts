import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import type { Sdf } from '../src/index.js';

/**
 * Ancient oak — Chibi Quest forest landmark (catalog `forest/structure/ancient-oak`): about 5.4 m
 * tall with a 5 m canopy spread, standing on y = 0 and facing +Z. Sibling of oak-tree, pine-tree,
 * bush; it must read as THE old tree of the forest, clearly grander than a common oak (which is
 * 4.5 m tall with a 3.4 m crown — the ancient one dwarfs it).
 *
 * Role: forest landmark seen at sprite size, so the silhouette must read at 128 px.
 * One idea: a massive trunk (1.9 m wide at the base) rising from a star of six tall buttress-root
 *   fins (out to 1.5 m), under a broad, layered crown of eleven chunky rounded leaf clumps. The
 *   buttresses and the clumped crown are the defining traits; both are exaggerated.
 * Shape language: round and friendly with a sturdy, spreading base as the secondary read.
 * Palette (forest contract): canopy leaf #5cb85c, deep #3f9248, sunlit #9ed95c; bark #8a5a35,
 *   dark bark #5f3d22, pale cut wood #c9a06a; moss #4a9a4f. Value plan: dark undersides, mid
 *   canopy, bright sunlit tops; the warm buttress flare carries the small accent.
 * Materials: bark (roughness 0.9), foliage (roughness 0.72). No rig, no clips.
 */

const bark = rgb('#8a5a35');
const barkDark = rgb('#5f3d22');
const cutWood = rgb('#c9a06a');
const moss = rgb('#4a9a4f');
const mossDeep = rgb('#2f7a3f');

const leafDeep = rgb('#3f9248');
const leaf = rgb('#5cb85c');
const leafLight = rgb('#9ed95c');
const leafShadow = rgb('#245c2e');

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

// One dominant central mass and ten satellites: broad in X/Z, layered in height, uneven so the
// silhouette breaks instead of reading as one dome. Total spread ~5 m in X, ~4.7 m in Z.
const clumps: readonly Clump[] = [
  { x: 0.0, y: 3.7, z: 0.05, r: 1.5 }, // central dome
  { x: -1.42, y: 3.2, z: 0.16, r: 1.08 }, // left shoulder
  { x: 1.38, y: 3.38, z: -0.19, r: 1.1 }, // right shoulder
  { x: 0.22, y: 2.9, z: 1.34, r: 0.97 }, // front skirt
  { x: -0.27, y: 3.06, z: -1.31, r: 0.94 }, // back skirt
  { x: 0.7, y: 4.62, z: 0.35, r: 0.8 }, // top-left lobe
  { x: -0.84, y: 4.58, z: -0.22, r: 0.78 }, // top-right lobe
  { x: -1.1, y: 3.85, z: 1.07, r: 0.8 }, // front-left mid
  { x: 1.1, y: 3.75, z: -1.02, r: 0.78 }, // back-right mid
  { x: -0.62, y: 3.3, z: 0.6, r: 0.85 }, // front-left filler
  { x: 0.66, y: 3.24, z: -0.55, r: 0.85 }, // back-right filler
];

/**
 * One leaf clump: a squashed main blob with a low ring of three smaller lobes. The lobes bulge
 * past the rim and dip under it, so each clump scallops instead of reading as a bare ball.
 */
function clumpShape(c: Clump, i: number): Sdf {
  const main = sdf.ellipsoid([c.r * 1.05, c.r * 0.92, c.r * 1.02]).at(c.x, c.y, c.z);
  const lobes: Sdf[] = [];
  for (let j = 0; j < 3; j++) {
    const a = (j / 3) * Math.PI * 2 + noise.random(i, j, 1) * 1.7 + i * 0.9;
    const lr = c.r * (0.42 + 0.12 * noise.random(i, j, 7));
    lobes.push(
      sdf.ellipsoid([lr, lr * 0.8, lr]).at(
        c.x + Math.cos(a) * c.r * 0.88,
        c.y - c.r * 0.34 + (noise.random(i, j, 13) - 0.5) * c.r * 0.24,
        c.z + Math.sin(a) * c.r * 0.88,
      ),
    );
  }
  return sdf.smoothUnion(0.07, main, ...lobes);
}

/** Nearest clump to a point, so every blob lights itself: dark rim, bright top. */
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

/**
 * One buttress-root fin: a smooth gusset plate reaching from high on the trunk out to the ground,
 * extruded thin tangentially so it reads as a broad triangular fin. Built along +X, then swung to
 * its azimuth. rotateY takes degrees.
 */
function buttress(i: number): Sdf {
  const a = (i / 6) * 360 + 30 + (noise.random(i, 3, 1) - 0.5) * 12;
  const len = 1.6 + noise.random(i, 7, 2) * 0.18;
  const high = 2.5 + noise.random(i, 11, 3) * 0.3;
  const pts: [number, number][] = [
    [0.1, high],
    [len * 0.34, high * 0.62],
    [len * 0.72, high * 0.28],
    [len, 0.08],
    [len * 0.9, -0.22],
    [len * 0.3, -0.22],
    [0.1, -0.22],
  ];
  const fin = sdf.extrude(profile.polygon(pts, { smooth: true, samples: 6 }), 0.3, 0.1);
  // A low, broad knuckle where the fin meets the ground, so the tip does not look cut off.
  const foot = sdf.ellipsoid([0.3, 0.16, 0.16]).at(len * 0.9, 0.08, 0);
  return sdf.smoothUnion(0.05, fin, foot).rotateY(-a);
}

export default defineAsset({
  name: 'ancient-oak',
  description: 'Ancient oak, 5.4 m tall: six buttress-root fins around a 1.9 m trunk, eleven-clump 5 m crown.',
  detail: 0.02,
  reference: 'docs/forest-mockups/forest-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ bark
    // Massive, gently leaning trunk (~1.2 m wide) that forks at about 2.2 m.
    const trunk = sdf.chain(
      [
        [0, -0.05, 0, 0.95],
        [0.03, 0.5, 0.01, 0.92],
        [0.06, 1.1, 0.02, 0.88],
        [0.07, 1.7, 0.0, 0.82],
        [0.05, 2.2, 0.0, 0.75],
      ],
      0.14,
    );
    // Five limbs spread from the fork and vanish into the crown, showing between the clumps.
    const limbs = sdf.union(
      sdf.chain(
        [
          [0.05, 2.1, 0, 0.52],
          [-0.5, 2.9, 0.16, 0.22],
          [-0.95, 3.6, 0.24, 0.14],
        ],
        0.12,
      ),
      sdf.chain(
        [
          [0.05, 2.1, 0, 0.52],
          [0.56, 2.85, -0.11, 0.22],
          [1.05, 3.5, -0.19, 0.14],
        ],
        0.12,
      ),
      sdf.chain(
        [
          [0.05, 2.1, 0, 0.52],
          [-0.03, 3.0, -0.58, 0.2],
          [-0.16, 3.7, -0.95, 0.13],
        ],
        0.12,
      ),
      sdf.chain(
        [
          [0.05, 2.1, 0, 0.52],
          [0.08, 2.9, 0.62, 0.2],
          [0.16, 3.5, 0.98, 0.13],
        ],
        0.12,
      ),
      sdf.chain(
        [
          [0.05, 2.1, 0, 0.52],
          [0.12, 3.2, 0.05, 0.2],
          [0.05, 4.1, 0.02, 0.12],
        ],
        0.12,
      ),
    );
    const roots = sdf.union(...Array.from({ length: 6 }, (_, i) => buttress(i)));

    const ridges = (x: number, y: number, z: number): number => noise.fbm(x * 9, y * 2.2, z * 9, 3, 41);
    const wood = sdf
      .smoothUnion(0.04, trunk, limbs, roots)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .displace(0.012, (x, y, z) => noise.fbm(x * 6, y * 2, z * 6, 2, 31))
      .paintFn((x, y, z) => {
        const groove = Math.max(0, -ridges(x, y, z));
        const base = mixRgb(bark, barkDark, Math.min(1, groove * 1.7));
        // Warm lit flare over the buttresses and lower trunk, strongest facing up and out.
        const radial = Math.hypot(x, z);
        const up = clamp01((y - 0.05) / 1.0);
        const flare = clamp01(1 - y / 1.4) * clamp01(radial / 1.4);
        const lit = mixRgb(base, mixRgb(bark, cutWood, 0.35), flare * (0.4 + 0.5 * up) * 0.5);
        // A little moss on the shaded back side, low on the trunk and roots.
        const damp =
          clamp01(-z * 1.4) *
          clamp01(1 - y / 1.0) *
          (0.3 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2, 17));
        return mixRgb(lit, mixRgb(moss, mossDeep, groove), damp * 0.6);
      });
    k.body('trunk', wood, {
      color: '#8a5a35',
      roughness: 0.9,
      detail: 0.03,
      maxTriangles: 5200,
      paintWeight: 2,
      bump: (x, y, z) => 0.006 * ridges(x, y, z),
    });

    // ------------------------------------------------------------------ crown
    const crown = sdf
      .smoothUnion(0.16, ...clumps.map(clumpShape))
      .displace(0.05, (x, y, z) => noise.fbm(x * 1.5, y * 1.5, z * 1.5, 2, 5))
      .paintFn((x, y, z) => {
        const c = nearestClump(x, y, z);
        // 0 under this clump, 1 at its top; a global gradient adds altitude light.
        const local = clamp01(((y - c.y) / c.r) * 0.62 + 0.42);
        const global = clamp01((y - 2.3) / 3.0);
        const patch = 0.5 + 0.5 * noise.fbm(x * 2.4, y * 2.4, z * 2.4, 2, 21);
        const wob = 0.1 * noise.fbm(x * 1.7, y * 1.7, z * 1.7, 2, 33);
        // Dark band over the lower part of every clump, with a wavy organic edge.
        const band = smoothstep(0.34, 0.82, local + wob);
        const base = mixRgb(leafDeep, leaf, band * (0.86 + 0.14 * patch));
        const under = smoothstep(0.36, 0.0, local);
        const shaded = mixRgb(base, leafShadow, under * 0.95);
        const top = smoothstep(0.66, 0.98, local);
        const lift = top * (0.4 + 0.55 * global) * (0.5 + 0.5 * patch);
        const lit = mixRgb(shaded, leafLight, lift);
        // Gentle light and dark patches, so the big faces are not one flat color.
        const n = noise.fbm(x * 1.2, y * 1.2, z * 1.2, 2, 7);
        return n >= 0 ? mixRgb(lit, leafLight, n * 0.12) : mixRgb(lit, leafShadow, -n * 0.16);
      });
    k.body('crown', crown, {
      color: '#5cb85c',
      roughness: 0.72,
      detail: 0.036,
      maxTriangles: 7000,
      paintWeight: 3,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 14, y * 14, z * 14, 2, 3),
    });
  },
});
