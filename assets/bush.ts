import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Bush — Chibi Quest nature prop (catalog `nature/plants/bush`): 0.9 m wide, 0.7 m tall, on y = 0.
 *
 * Role: cozy-hamlet dressing; the silhouette must read at the 128 px sprite size. No rig, no clips.
 * One idea: a mound of shingled clover leaves — every leaf a chunky three-lobe lump whose tip
 *   droops over the edge, so the outline scallops instead of reading as a smooth blob.
 * Shape language: round and friendly; the notched clover lobes give the only crisp accents.
 * Palette: gap dark #2e6b3c (recessed core), lower green #3f8442 to #56a854 (skirt rings),
 *   bright lime #8ede4f (sunlit top clumps), accent light #b6ef7e (three tiny sprigs).
 * Materials: foliage — matte, roughness 0.7 to 0.85, metalness 0.
 * Detail list: (1) lumpy mound core, (2) five rings of three-lobe leaves, (3) height gradient
 *   paint with noise patches, (4) three tiny light sprigs. Focal point: the bright top clump.
 */

const DEG = Math.PI / 180;

type V3 = [number, number, number];

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return l < 1e-9 ? [0, 1, 0] : [a[0] / l, a[1] / l, a[2] / l];
};
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const gapDark = rgb('#2e6b3c'); // shadow between leaves
const leafShade = rgb('#2f6b3a'); // deep skirt green
const leafDark = rgb('#3f8442'); // lower ring shade
const leafMid = rgb('#56a854'); // main green
const leafLime = rgb('#8ede4f'); // sunlit top clumps
const leafLight = rgb('#b6ef7e'); // tiny sprig accents

// Leaves ride this ellipsoid; the core sits just under it so gaps read as shadow.
const CY = 0.32;
const RX = 0.4;
const RY = 0.34;
const RZ = 0.38;

/** One three-lobe clover leaf: a flat plate with a notched rim, tip toward +Y, face +Z. */
const leafShape = (s: number): Sdf =>
  sdf.smoothUnion(
    0.015 * s,
    sdf.ellipsoid([0.088 * s, 0.08 * s, 0.03 * s]).at(0, 0.075 * s, 0),
    sdf.ellipsoid([0.075 * s, 0.072 * s, 0.03 * s]).at(-0.068 * s, -0.028 * s, 0),
    sdf.ellipsoid([0.075 * s, 0.072 * s, 0.03 * s]).at(0.068 * s, -0.028 * s, 0),
  );

interface LeafPlacement {
  /** Azimuth in degrees (0 = front, +Z; +90 = asset left, +X). */
  az: number;
  /** Elevation above the mound center, in degrees. */
  el: number;
  /** Leaf scale. */
  s: number;
  /** How far the tip lifts off the surface (0.2 to 0.45). */
  lift: number;
  /** World-down bias of the tip, so high rings drape instead of shelving outward. */
  droop: number;
  /** In-plane spin in degrees, so rings do not look machined. */
  roll: number;
  /** Push along the surface normal, in meters. */
  push: number;
}

/** Orient a leaf onto the mound: tip runs down the meridian, lifted so it droops proud. */
const placeLeaf = (leaf: Sdf, o: LeafPlacement): Sdf => {
  const a = o.az * DEG;
  const e = o.el * DEG;
  const ce = Math.cos(e);
  const se = Math.sin(e);
  const sa = Math.sin(a);
  const ca = Math.cos(a);
  const d: V3 = [ce * sa, se, ce * ca];
  const n = unit([d[0] / RX, d[1] / RY, d[2] / RZ]);
  let p = add([d[0] * RX, CY + d[1] * RY, d[2] * RZ], mul(n, o.push));
  const dE: V3 = [-se * sa * RX, ce * RY, -se * ca * RZ]; // meridian tangent, uphill
  const down = unit([-dE[0], -dE[1], -dE[2]]);
  const y0 = unit(add(add(down, mul(n, o.lift)), [0, -o.droop, 0]));
  const z = unit(sub(n, mul(y0, dot(n, y0))));
  const x0 = cross(y0, z);
  const r = o.roll * DEG;
  const cr = Math.cos(r);
  const sr = Math.sin(r);
  const x = add(mul(x0, cr), mul(y0, sr));
  const y = add(mul(y0, cr), mul(x0, -sr));
  const tipY = p[1] + y[1] * 0.15 * o.s;
  if (tipY < 0.03) p = [p[0], p[1] + (0.03 - tipY), p[2]]; // keep tips off the floor
  return leaf.transform([...x, 0, ...y, 0, ...z, 0, ...p, 1]);
};

interface Ring {
  el: number;
  n: number;
  off: number;
  s0: number;
  s1: number;
  lift: number;
  droop: number;
  seed: number;
}

// Denser at the bottom (a full skirt to the ground), tighter toward the crown.
const rings: readonly Ring[] = [
  { el: -32, n: 13, off: 0, s0: 1.15, s1: 1.42, lift: 0.24, droop: 0.08, seed: 1 },
  { el: -4, n: 12, off: 14, s0: 1.15, s1: 1.38, lift: 0.24, droop: 0.18, seed: 2 },
  { el: 22, n: 10, off: 5, s0: 1.08, s1: 1.38, lift: 0.26, droop: 0.35, seed: 3 },
  { el: 46, n: 9, off: 20, s0: 1.02, s1: 1.26, lift: 0.28, droop: 0.5, seed: 4 },
  { el: 66, n: 6, off: 12, s0: 0.9, s1: 1.1, lift: 0.3, droop: 0.55, seed: 5 },
  { el: 87, n: 3, off: 40, s0: 0.8, s1: 0.9, lift: 0.3, droop: 0.3, seed: 6 },
];

// Each leaf gets its own base tone, so neighbours separate even at one value band.
const buildRing = (ring: Ring, tints: readonly [Rgb, Rgb]): Sdf[] => {
  const out: Sdf[] = [];
  for (let i = 0; i < ring.n; i++) {
    const s = ring.s0 + (ring.s1 - ring.s0) * noise.random(i, ring.seed + 20);
    const j = noise.random(i, ring.seed + 50);
    const amount = Math.abs(j * 2 - 1) * 0.5;
    const tint = j < 0.5 ? tints[0] : tints[1];
    const leaf = leafShape(s).paintFn((_x, _y, _z, base) => mixRgb(base, tint, amount));
    out.push(
      placeLeaf(leaf, {
        az: (i * 360) / ring.n + ring.off + (noise.random(i, ring.seed) - 0.5) * 14,
        el: ring.el + (noise.random(i, ring.seed + 10) - 0.5) * 16,
        s,
        lift: ring.lift * (0.7 + 0.7 * noise.random(i, ring.seed + 40)),
        droop: ring.droop * (0.7 + 0.7 * noise.random(i, ring.seed + 60)),
        roll: (noise.random(i, ring.seed + 30) - 0.5) * 62,
        push: 0,
      }),
    );
  }
  return out;
};

export default defineAsset({
  name: 'bush',
  description: 'Rounded clover-leaf bush in two greens for a cozy chibi hamlet.',
  detail: 0.008,
  reference: 'reference/bush_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ mound
    // The core hides behind the leaves and shows only in the gaps, dark like a shadow.
    const mound = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid([RX, RY, RZ]).at(0, CY, 0),
        sdf.ellipsoid([0.34, 0.16, 0.32]).at(0, 0.12, 0),
      )
      .displace(0.02, (x, y, z) => noise.fbm(x * 5, y * 5, z * 5, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z) => {
        const t = clamp01((y - 0.02) / 0.5);
        const v = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
        return mixRgb(gapDark, leafDark, clamp01(t * 0.5 + v * 0.3));
      });
    k.body('mound', mound, { color: '#2e6b3c', roughness: 0.85, detail: 0.014, paintWeight: 2 });

    // ------------------------------------------------------------------ leaves
    const lowerTint: readonly [Rgb, Rgb] = [rgb('#31703d'), rgb('#66b45a')];
    const upperTint: readonly [Rgb, Rgb] = [rgb('#3f8f4b'), rgb('#a6ea5f')];
    const lower: Sdf[] = [];
    const upper: Sdf[] = [];
    rings.forEach((ring, ri) => {
      const tint = ri < 2 ? lowerTint : upperTint;
      for (const leaf of buildRing(ring, tint)) (ri < 2 ? lower : upper).push(leaf);
    });

    // World height gradient over the per-leaf tone: dark skirt, mid band, no wash-out.
    const lowerBody = sdf
      .union(...lower)
      .paintFn((x, y, z, base) => {
        const t = clamp01(y / 0.36);
        const v = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
        const target = mixRgb(leafShade, leafMid, clamp01(t + (v - 0.5) * 0.3));
        return mixRgb(base, target, 0.7);
      });
    k.body('leavesLower', lowerBody, {
      color: '#4a9a4e',
      roughness: 0.78,
      detail: 0.012,
      paintWeight: 2,
    });

    const upperBody = sdf
      .union(...upper)
      .paintFn((x, y, z, base) => {
        const t = clamp01((y - 0.42) / 0.26);
        const v = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
        const target = mixRgb(leafMid, leafLime, clamp01(t + (v - 0.5) * 0.2));
        return mixRgb(base, target, 0.6);
      });
    k.body('leavesUpper', upperBody, {
      color: '#8ede4f',
      roughness: 0.72,
      detail: 0.012,
      paintWeight: 2,
    });

    // ------------------------------------------------------------------ sprigs
    // Three tiny light leaves: two poke past the silhouette, one sits on the front face.
    const sprigSpec = [
      { az: 94, el: 28, s: 0.46, lift: 0.5, droop: 0.1, push: 0.03, seed: 71 },
      { az: -86, el: 12, s: 0.4, lift: 0.55, droop: 0.1, push: 0.03, seed: 72 },
      { az: 28, el: 44, s: 0.4, lift: 0.4, droop: 0.4, push: 0.02, seed: 73 },
    ];
    const sprigs = sdf.union(
      ...sprigSpec.map((sp) =>
        placeLeaf(leafShape(sp.s), {
          az: sp.az,
          el: sp.el,
          s: sp.s,
          lift: sp.lift,
          droop: sp.droop,
          roll: (noise.random(sp.seed, 3) - 0.5) * 50,
          push: sp.push,
        }),
      ),
    );
    k.body('sprigs', sprigs, {
      color: '#b6ef7e',
      roughness: 0.7,
      detail: 0.005,
      paintWeight: 2,
    });
  },
});
