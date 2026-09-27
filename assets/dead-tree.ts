import { defineAsset, mixRgb, noise, rgb, sdf, type Vec3 } from '../src/index.js';
import type { Sdf } from '../src/index.js';

/**
 * dead-tree — forest/trees/dead-tree: a bare dead standing snag for the Chibi Quest forest.
 *
 * Role: background mood accent that reads as a stark bare tree against the leafy border trees.
 *   Seen at sprite size (128 px), so the silhouette does the work.
 * Size: about 2.9 m tall, 1.8 m branch spread, standing on y = 0 and facing +Z.
 * One idea: a gnarled tapering trunk that forks again and again into five thick bare limbs, each
 *   chopped off by a slanted break that shows pale cut wood — the dead counterpart of the oaks.
 * Shape language: round and chunky (chibi, friendly) with a tapering, forking twist as the
 *   secondary read. Not spiky and not spooky: soft bevels everywhere.
 * Palette (forest contract): bark #8a5a35, dark bark #5f3d22, bark deep #3d2717,
 *   pale cut wood #c9a06a (+darker ring #a87d4b), moss #4a9a4f (+deep #2f7a3f, light #6fbf5e).
 *   Value plan: dark grooved trunk, mid brown limbs, bright pale broken tips (the focal accents).
 * Materials: dead wood (roughness 0.9, metalness 0) and one small moss patch (roughness 0.95).
 * Detail list: gnarled forking trunk (primary), five broken limbs (primary), flared roots
 *   (secondary), bark ridge/groove and gnarl (tertiary), pale tip breaks and one north-side moss
 *   patch (accents). Focal point: the pale broken tips.
 * Rig: none. Animation: none.
 */

const bark = rgb('#8a5a35');
const barkDark = rgb('#5f3d22');
const barkDeep = rgb('#3d2717');
const barkLight = rgb('#a4713f');
const cutWood = rgb('#c9a06a');
const cutRing = rgb('#a87d4b');
const mossMid = rgb('#4a9a4f');
const mossDeep = rgb('#2f7a3f');
const mossLight = rgb('#57a05b');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const norm = (u: Vec3): Vec3 => {
  const l = Math.hypot(u[0], u[1], u[2]) || 1;
  return [u[0] / l, u[1] / l, u[2] / l];
};

/** A limb as a chain of `[x, y, z, radius]` points plus the plane that chops its tip. */
interface Branch {
  readonly pts: readonly (readonly [number, number, number, number])[];
  /** Outward direction of the break cut (not necessarily unit). */
  readonly cutDir: Vec3;
}

// Progressive forks, not one hand: the trunk splits at ~1.5 m into the leader and the big left
// limb; the leader splits again at ~1.85 m into a right and a front limb; the left limb splits
// into a short back stub. Five thick tips at different heights give a big/medium/small rhythm.
const branches: readonly Branch[] = [
  {
    // Leader: near-upright with an S twist, the tallest tip.
    pts: [
      [0.0, 1.05, 0.0, 0.205],
      [0.05, 1.5, 0.02, 0.16],
      [-0.02, 1.9, -0.01, 0.135],
      [0.03, 2.35, 0.02, 0.11],
      [-0.01, 2.86, -0.01, 0.09],
    ],
    cutDir: [0.14, 1, 0.08],
  },
  {
    // Big left limb, low fork: sweeps out and up.
    pts: [
      [0.0, 1.5, 0.01, 0.17],
      [-0.42, 1.95, 0.14, 0.115],
      [-0.75, 2.4, 0.3, 0.092],
      [-0.86, 2.62, 0.34, 0.08],
    ],
    cutDir: [-0.5, 0.78, 0.34],
  },
  {
    // Short back stub off the left limb: the smallest tip, adds depth and variety.
    pts: [
      [-0.42, 1.95, 0.14, 0.115],
      [-0.6, 2.3, -0.16, 0.094],
      [-0.64, 2.5, -0.3, 0.078],
    ],
    cutDir: [-0.1, 0.8, -0.58],
  },
  {
    // Right limb from the upper fork.
    pts: [
      [0.0, 1.85, -0.01, 0.13],
      [0.46, 2.2, -0.16, 0.102],
      [0.74, 2.54, -0.24, 0.082],
    ],
    cutDir: [0.55, 0.75, -0.34],
  },
  {
    // Front limb from the upper fork, reaching toward the camera.
    pts: [
      [0.0, 1.8, 0.02, 0.125],
      [0.28, 2.15, 0.5, 0.098],
      [0.36, 2.42, 0.72, 0.078],
    ],
    cutDir: [0.24, 0.76, 0.6],
  },
];

const CUT_INSET = 0.02; // how far the break plane sits inside the limb end

interface Cut {
  readonly n: Vec3;
  readonly off: number;
  readonly c: Vec3;
  readonly r: number;
}

const cuts: readonly Cut[] = branches.map((b) => {
  const n = norm(b.cutDir);
  const tip = b.pts[b.pts.length - 1]!;
  return {
    n,
    off: n[0] * tip[0] + n[1] * tip[1] + n[2] * tip[2] - CUT_INSET,
    c: [tip[0] - n[0] * CUT_INSET, tip[1] - n[1] * CUT_INSET, tip[2] - n[2] * CUT_INSET],
    r: tip[3] * 1.4,
  };
});

/** How strongly a point sits on a limb's pale break face (1 on the face, 0 on the bark). */
const cutWeight = (cut: Cut, x: number, y: number, z: number): number => {
  const plane = cut.n[0] * x + cut.n[1] * y + cut.n[2] * z - cut.off;
  const face = clamp01((0.024 - Math.abs(plane)) / 0.024);
  const d = Math.hypot(x - cut.c[0], y - cut.c[1], z - cut.c[2]);
  return face * clamp01((cut.r + 0.03 - d) / 0.035);
};

/** A soft halo of pale weathered wood on the bark just below a break, so the tip reads at 128 px. */
const wornWeight = (cut: Cut, x: number, y: number, z: number): number => {
  const plane = cut.n[0] * x + cut.n[1] * y + cut.n[2] * z - cut.off;
  const band = clamp01(1 - Math.abs(plane + 0.055) / 0.075);
  const d = Math.hypot(x - cut.c[0], y - cut.c[1], z - cut.c[2]);
  return band * clamp01((cut.r + 0.05 - d) / 0.06);
};

// The one moss patch lives low on the north (−Z) side of the trunk.
const mossC: Vec3 = [-0.01, 0.6, -0.2];
const mossW = (x: number, y: number, z: number): number => {
  const d = Math.hypot((x - mossC[0]) / 0.34, (y - mossC[1]) / 0.42, (z - mossC[2]) / 0.32);
  return clamp01((1 - d) / 0.45) * clamp01((-z - 0.06) / 0.14);
};

// Vertical bark ridges: the same function drives paint grooves and the normal-map bump.
const ridges = (x: number, y: number, z: number): number => noise.fbm(x * 16, y * 2.6, z * 16, 3, 41);
const gnarl = (x: number, y: number, z: number): number => noise.fbm(x * 7, y * 2.2, z * 7, 2, 31);

export default defineAsset({
  name: 'dead-tree',
  description:
    'Bare dead standing snag, 2.9 m tall: gnarled forking trunk with five broken limbs and pale cut tips.',
  detail: 0.02,
  reference: 'docs/forest-mockups/forest-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ trunk and roots
    const trunk = sdf.chain(
      [
        [0, -0.06, 0, 0.31],
        [0.03, 0.4, 0.02, 0.27],
        [-0.03, 0.8, 0.0, 0.24],
        [0.04, 1.12, -0.02, 0.215],
        [0.0, 1.5, 0.0, 0.19],
      ],
      0.1,
    );
    // Five short, thick root cones: a flared grasp on the ground, not spider legs.
    const roots = sdf.union(
      ...Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 + 0.6 + noise.random(i, 3, 1) * 0.3;
        const len = 0.42 + noise.random(i, 7, 2) * 0.1;
        const tipR = 0.1 + noise.random(i, 11, 3) * 0.03;
        return sdf.cone([0, 0.5, 0], [Math.cos(a) * len, 0.04, Math.sin(a) * len], 0.27, tipR);
      }),
    );
    const trunkShape = sdf.smoothUnion(0.1, trunk, roots).displace(0.012, gnarl);

    // ------------------------------------------------------------------ broken limbs
    // Each limb is built, gnarl-displaced, then chopped by its own slanted plane so the break
    // face stays flat while the bark around it stays lumpy.
    const limbs: Sdf[] = branches.map((b, i) => {
      const cut = cuts[i]!;
      return sdf
        .chain(b.pts, 0.06)
        .displace(0.012, gnarl)
        .intersect(sdf.halfSpace(cut.n, cut.off));
    });

    const wood = sdf
      .smoothUnion(0.05, trunkShape, ...limbs)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    k.body(
      'wood',
      wood.paintFn((x, y, z, base) => {
        const g = ridges(x, y, z);
        // Damp the base toward dark bark so the snag reads a value darker than the sunny oaks.
        let c = mixRgb(base, barkDark, 0.42);
        // Deep dark furrows, then bright weathered ridges on the sun side — a wide value spread.
        c = mixRgb(c, barkDeep, clamp01((-g - 0.005) * 3.2) * 0.85);
        const sun = clamp01(0.35 + 0.4 * (x * 0.5 + z * 0.7 + 0.35));
        c = mixRgb(c, mixRgb(barkLight, cutWood, 0.2), clamp01((g - 0.05) * 3) * (0.15 + 0.3 * sun));
        // A few dark gnarl swirls so the flat bark is not one value.
        const knot = clamp01(noise.fbm(x * 3.4, y * 3.4, z * 3.4, 3, 13) * 1.5 - 0.35);
        c = mixRgb(c, barkDeep, knot * 0.3);
        // Dead wood bleaches pale toward the sky.
        c = mixRgb(c, cutWood, clamp01((y - 1.1) / 1.6) * 0.22);
        // Vertical ambient gradient: shaded near the ground, catching light on the upper limbs.
        c = mixRgb(c, barkDeep, clamp01((0.85 - y) / 1.05) * 0.3);
        // Strong ground contact shading.
        c = mixRgb(c, barkDeep, clamp01((0.22 - y) / 0.28) * 0.45);
        // Bright pale break faces on every limb tip — the focal accents.
        for (const cut of cuts) {
          const worn = wornWeight(cut, x, y, z);
          if (worn > 0.003) c = mixRgb(c, mixRgb(barkLight, cutWood, 0.5), worn * 0.4);
          const w = cutWeight(cut, x, y, z);
          if (w <= 0.003) continue;
          const d = Math.hypot(x - cut.c[0], y - cut.c[1], z - cut.c[2]);
          const ring = clamp01((d - cut.r * 0.6) / (cut.r * 0.55));
          c = mixRgb(c, mixRgb(cutWood, cutRing, ring * 0.6), w * 0.98);
        }
        // One small moss patch on the north side, tinted by noise.
        const mw = mossW(x, y, z);
        if (mw > 0.003) {
          const v = noise.fbm(x * 9, y * 7, z * 9, 2, 23);
          c = mixRgb(c, mixRgb(mossDeep, mossMid, clamp01(0.4 + v * 0.9)), mw * 0.85);
        }
        return c;
      }),
      {
        color: '#8a5a35',
        roughness: 0.9,
        metalness: 0,
        detail: 0.028,
        maxError: 0.022,
        paintWeight: 2,
        bump: (x, y, z): number => 0.006 * ridges(x, y, z),
      },
    );

    // ------------------------------------------------------------------ moss patch
    // A chunky green cushion growing out of the north flank, matching the leafy set's clumps.
    const moss = sdf
      .ellipsoid([0.16, 0.24, 0.072])
      .at(mossC[0], mossC[1], mossC[2] - 0.01)
      .smoothUnion(0.05, sdf.ellipsoid([0.1, 0.13, 0.058]).at(0.14, 0.42, -0.14))
      .smoothUnion(0.05, sdf.ellipsoid([0.09, 0.12, 0.054]).at(-0.14, 0.8, -0.12))
      .displace(0.015, (x, y, z) => noise.fbm(x * 9, y * 9, z * 9, 2, 5))
      .paintFn((x, y, z) => {
        const v = noise.fbm(x * 10, y * 8, z * 10, 3, 23);
        let c = mixRgb(mossDeep, mossMid, clamp01(0.35 + v * 0.8));
        // A little sunlit lift on the lumps, dark in the creases near the bark.
        c = mixRgb(c, mossLight, clamp01(0.2 + v * 0.7) * clamp01((y - 0.4) / 0.6) * 0.3);
        c = mixRgb(c, mossDeep, clamp01((0.38 - y) / 0.24) * 0.5);
        return c;
      });

    k.body('moss', moss, {
      color: '#4a9a4f',
      roughness: 0.95,
      metalness: 0,
      detail: 0.02,
      maxTriangles: 460,
      paintWeight: 2,
      bump: (x, y, z): number => 0.0016 * noise.fbm(x * 42, y * 42, z * 42, 2, 9),
    });
  },
});
