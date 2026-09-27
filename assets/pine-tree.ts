import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import type { Sdf } from '../src/index.js';

/**
 * Stylized pine for a cozy chibi forest edge, about 5 m tall, standing on y = 0 and facing +Z.
 *
 * Role: environment prop seen from far away, so the silhouette must read at 128 px.
 * One idea: three puffy cone tiers stacked like cushions, each rim scalloped and drooping,
 * so the outline says "friendly pine" before any detail shows.
 * Shape language: round and soft (friendly) with the triangular stack as the secondary read.
 * Palette: fresh green #6fae43, sunlit top #a3cc55, dark underside #35612c, bark #7d4a27,
 *          root flare #a9713c. Value plan: dark undersides, mid walls, bright tops.
 * Materials: bark trunk (roughness 0.9), foliage (roughness 0.72).
 * Detail list: three tiers and their scalloped rims (primary), flared roots and bark grooves
 *              (secondary), bark grain and soft leaf bump (tertiary). Focal point: the top tier.
 * Rig: none. Animation: none.
 */

const bark = rgb('#7d4a27');
const barkLight = rgb('#a9713c');
const barkDark = rgb('#3d2415');
const leafDark = rgb('#3e7331');
const leafShadow = rgb('#2c5226');
const leaf = rgb('#6fae43');
const leafLight = rgb('#b2d95e');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Tier wall: a full, rounded superellipse from the rim up to the apex. `s` runs 0 (rim) to 1. */
const wallR = (R: number, s: number, q: number): number =>
  R * Math.pow(Math.max(0, 1 - Math.pow(s, q)), 1 / q);

interface Tier {
  /** Height of the rim plane, in world meters. */
  readonly rimY: number;
  /** Rim radius. */
  readonly r: number;
  /** Wall height from the rim to the apex. */
  readonly h: number;
  /** Wall fullness: 1 = straight cone, 2 = barrel with a vertical lower wall. */
  readonly q: number;
  /** How far the rim lip hangs below the rim plane. */
  readonly droop: number;
  readonly lobes: number;
  readonly seed: number;
  readonly cx: number;
  readonly cz: number;
  /** Small X/Z tilt in degrees, so no tier is machine-flat. */
  readonly tilt: readonly [number, number];
  /** Angular phase of the scallops, so tiers never line up. */
  readonly phase: number;
}

// Gentle taper and deep nesting, matched to the concept: full lower tiers, a conical crown.
const tiers: readonly Tier[] = [
  { rimY: 1.7, r: 1.33, h: 1.45, q: 2.0, droop: 0.16, lobes: 12, seed: 3, cx: 0.03, cz: -0.04, tilt: [3, -2], phase: 0.2 },
  { rimY: 2.85, r: 1.27, h: 1.3, q: 1.9, droop: 0.15, lobes: 11, seed: 17, cx: -0.08, cz: 0.05, tilt: [-3, 2.5], phase: 0.55 },
  { rimY: 3.72, r: 1.0, h: 1.3, q: 1.4, droop: 0.13, lobes: 9, seed: 29, cx: 0.06, cz: -0.05, tilt: [4, -2], phase: 0.95 },
];

/**
 * One tier: a solid of revolution (puffy wall, drooping lip, shallow underside dome) plus a
 * ring of soft lobes that bulge past the wall and dip below the lip. The ring makes the
 * scalloped rim that gives the tree its readable edge at sprite size.
 */
function tierShape(t: Tier): Sdf {
  const R = t.r;
  const H = t.h;
  const D = t.droop;
  const pts: [number, number][] = [[0, H]];
  for (const s of [0.94, 0.86, 0.75, 0.6, 0.45, 0.3, 0.15, 0])
    pts.push([wallR(R, s, t.q), H * s]);
  // Drooping lip: down and under, then back up into the underside dome.
  pts.push([R * 0.985, -D * 0.5], [R * 0.9, -D], [R * 0.7, -D * 0.7], [R * 0.44, -D * 0.15]);
  pts.push([R * 0.18, H * 0.07], [0, H * 0.16]);
  // Pins on the axis keep the closed spline on the axis instead of bulging a hollow core.
  pts.push([0, H * 0.45], [0, H * 0.7], [0, H * 0.88]);
  const core = sdf.revolve(profile.polygon(pts, { smooth: true, samples: 6 }));

  const lobes: Sdf[] = [];
  for (let i = 0; i < t.lobes; i++) {
    const a = (i / t.lobes) * Math.PI * 2 + t.phase;
    // Wide, squat lobes: a wave along the rim, not a ring of balls.
    const lr = R * (0.26 + 0.04 * noise.random(i, t.seed, 3));
    const rr = R * (0.86 + 0.03 * noise.random(i, t.seed, 7));
    const squat = 0.7;
    const ly = squat * lr - D + (noise.random(i, t.seed, 11) - 0.5) * 0.05;
    lobes.push(sdf.ellipsoid([lr, squat * lr, lr]).at(Math.cos(a) * rr, ly, Math.sin(a) * rr));
  }
  return sdf.smoothUnion(0.08, core, ...lobes).rotateX(t.tilt[0]).rotateZ(t.tilt[1]).at(t.cx, t.rimY, t.cz);
}

/** Which tier owns the surface at this point: the one with the widest wall at that height. */
function tierAt(x: number, y: number): Tier {
  let best = tiers[0]!;
  let bestR = -Infinity;
  for (const t of tiers) {
    const s = (y - t.rimY) / t.h;
    if (s < -0.25 || s > 1.1) continue;
    const rr = wallR(t.r, clamp01(s), t.q);
    if (rr > bestR) {
      bestR = rr;
      best = t;
    }
  }
  return best;
}

export default defineAsset({
  name: 'pine-tree',
  description: 'Stylized chibi pine, 5 m tall: flared root trunk and three scalloped foliage tiers.',
  detail: 0.02,
  reference: 'reference/pine-tree_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ bark
    const trunk = sdf.chain(
      [
        [0, -0.04, 0, 0.5],
        [0.03, 0.35, 0.02, 0.42],
        [0.05, 0.8, 0.03, 0.36],
        [0.04, 1.4, 0.0, 0.33],
        [0.02, 2.4, 0.0, 0.29],
      ],
      0.12,
    );
    const roots = sdf.union(
      ...Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 + 0.6;
        const len = 0.58 + noise.random(i, 5) * 0.14;
        return sdf.cone([0, 0.55, 0], [Math.cos(a) * len, 0.04, Math.sin(a) * len], 0.34, 0.12);
      }),
    );
    const ridges = (x: number, y: number, z: number): number => noise.fbm(x * 16, y * 2.5, z * 16, 3, 41);
    const wood = sdf
      .smoothUnion(0.1, trunk, roots)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .displace(0.014, ridges)
      .paintFn((x, y, z) => {
        const groove = Math.max(0, -ridges(x, y, z));
        const base = mixRgb(bark, barkDark, Math.min(1, groove * 1.7));
        const flare = clamp01(1 - y / 0.8) * (0.4 + 0.45 * noise.fbm(x * 3, y * 3, z * 3, 2, 9));
        return mixRgb(base, barkLight, flare * 0.8);
      });
    k.body('trunk', wood, {
      color: '#7d4a27',
      roughness: 0.9,
      detail: 0.016,
      paintWeight: 2,
      bump: (x, y, z) => 0.006 * noise.fbm(x * 26, y * 3, z * 26, 3),
    });

    // ------------------------------------------------------------------ foliage
    const foliage = sdf
      .smoothUnion(0.05, ...tiers.map(tierShape))
      .displace(0.035, (x, y, z) => noise.fbm(x * 0.9, y * 0.9, z * 0.9, 2, 5))
      .paintFn((x, y, z) => {
        const t0 = tierAt(x, y);
        const s = (y - t0.rimY) / t0.h; // 0 at the rim, 1 at the apex, negative under the lip
        const patch = 0.5 + 0.5 * noise.fbm(x * 2.4, y * 2.4, z * 2.4, 2, 21);
        // Dark band over the lower quarter of each tier, with a wavy organic edge.
        const wob = 0.09 * noise.fbm(x * 1.7, y * 1.7, z * 1.7, 2, 33);
        const band = smoothstep(0.14, 0.48, s + 0.1 + wob);
        const g = clamp01((y - 1.6) / 3.4);
        const base = mixRgb(leafDark, leaf, band * (0.88 + 0.12 * patch));
        // Deepest shade on the drooping lip, so every tier keeps a crisp dark underside.
        const under = smoothstep(0.12, -0.06, s);
        const shaded = mixRgb(base, leafShadow, under * 0.75);
        const top = smoothstep(0.45, 0.95, s);
        const lift = top * (0.4 + 0.6 * g) * (0.55 + 0.45 * patch);
        const c = mixRgb(shaded, leafLight, lift);
        // Gentle light and dark patches, so the big faces are not one flat color.
        const n = noise.fbm(x * 1.2, y * 1.2, z * 1.2, 2, 7);
        return n >= 0 ? mixRgb(c, leafLight, n * 0.12) : mixRgb(c, leafShadow, -n * 0.14);
      });
    k.body('foliage', foliage, {
      color: '#6fae43',
      roughness: 0.72,
      detail: 0.02,
      paintWeight: 3,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 14, y * 14, z * 14, 2, 3),
    });
  },
});
