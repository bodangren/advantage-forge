import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';
import type { Vec2 } from '../src/sdf/profile.js';

/**
 * Design note - cliff face (nature/terrain/cliff-face).
 * Role: background cliff outcrop. About 3.5 m wide, 3 m tall, 2.3 m deep, faceted all around like
 *   the mock (an old flat back at z = -0.5 read as a board, and no scene joins sections); on
 *   y = 0, front toward +Z.
 * One idea: one chunky faceted rock mass with a wide crown, a jutting ledge on the right, and a
 *   skirt of angular foot rocks; a soft grass mat with a round lip on the crown and the ledge.
 * Shape language: faceted square rock (flat-shaded planes, each block an ellipsoid cut by
 *   random planes) against soft round grass. One main block carries the mass, so the cliff reads
 *   as one rock and not as a stack of stones (version 3 did).
 * Palette: tan #cdbd98 and grey #8a9097 per facet, dark crevice #6b7178; grass #98bf5e on top,
 *   #6c9a44 on the sides.
 * Materials: rock (roughness 0.92, flat, grain bump), grass (0.9).
 * Grass method: the mats are pads extruded from the rock's own outline (sampled from the rock
 *   field at the pad height), with round edges; the drips and the small patches are thin shells
 *   of the rock, so all grass sits on the rock.
 */

type V3 = readonly [number, number, number];

const C = {
  grey: rgb('#8a9097'),
  tan: rgb('#cdbd98'),
  dark: rgb('#6b7178'),
  grass: rgb('#98bf5e'),
  grassDark: rgb('#6c9a44'),
};
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const R = (i: number, j: number): number => noise.random(i, j, 7.7);
const TOP = 2.98;

/**
 * One low-poly rock block: an ellipsoid cut by random planes near its surface, and flat on top.
 * `keep` sets how deep the cuts go (smaller = deeper facets); `tilt` tilts the flat top.
 */
function block(c: V3, r0: V3, seed: number, cuts = 14, keep = 0.62, tilt = 0.12): Sdf {
  // Deep cuts shrink the block, so the ellipsoid starts 12 percent larger.
  const r: V3 = [r0[0] * 1.12, r0[1] * 1.12, r0[2] * 1.12];
  let s: Sdf = sdf.ellipsoid([r[0], r[1], r[2]]).at(c[0], c[1], c[2]);
  for (let i = 0; i < cuts; i++) {
    const a = R(seed, i) * Math.PI * 2;
    const e = (R(seed, i + 40) - 0.3) * 1.3; // mostly sideways, some up-facing, few down-facing
    const n: V3 = [Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)];
    const support = Math.hypot(r[0] * n[0], r[1] * n[1], r[2] * n[2]);
    const offset = n[0] * c[0] + n[1] * c[1] + n[2] * c[2] + support * (keep + 0.1 * R(seed, i + 80));
    s = s.intersect(sdf.halfSpace([n[0], n[1], n[2]], offset));
  }
  // A flat top, tilted a few degrees, reads as a stratum.
  const tx = (R(seed, 99) - 0.5) * tilt;
  const tz = (R(seed, 98) - 0.5) * tilt;
  const len = Math.hypot(tx, 1, tz);
  const top = c[1] + r[1] * 0.72;
  return s.intersect(sdf.halfSpace([tx / len, 1 / len, tz / len], (tx * c[0] + top + tz * c[2]) / len));
}

interface Block {
  readonly c: V3;
  readonly r: V3;
  readonly cuts?: number;
  readonly keep?: number;
  readonly tilt?: number;
}

// One faceted main mass carries the cliff, so it reads as one rock and not as a stack of stones.
// A wide crown, side masses, the ledge, and a skirt of foot boulders sit on it.
const BLOCKS: readonly Block[] = [
  // Main mass, ground to crown; tall, so it is still wide at the top.
  { c: [0, 1.6, -0.05], r: [1.1, 1.9, 0.9], cuts: 26, keep: 0.6 },
  // Crown: a deep block, a little wider than the mass, with a level top for the grass mat.
  { c: [0.05, 2.5, 0], r: [1.15, 0.6, 0.92], cuts: 16, keep: 0.64, tilt: 0 },
  // Side masses.
  { c: [-0.75, 1.85, 0.15], r: [0.55, 0.62, 0.6] },
  { c: [0.7, 0.95, 0.3], r: [0.7, 0.68, 0.65] },
  { c: [-0.6, 0.85, 0.3], r: [0.72, 0.72, 0.65] },
  // The grass ledge on the right: a step that juts forward, level top near y 1.70.
  { c: [0.72, 1.3, 0.42], r: [0.8, 0.46, 0.62], cuts: 12, keep: 0.6, tilt: 0 },
  // Foot boulders, front and sides: few deep cuts, so they read as angular wedges.
  { c: [-1.2, 0.36, 0.25], r: [0.5, 0.44, 0.5], cuts: 9, keep: 0.55 },
  { c: [-0.4, 0.3, 0.8], r: [0.48, 0.38, 0.42], cuts: 9, keep: 0.55 },
  { c: [0.45, 0.32, 0.88], r: [0.45, 0.38, 0.4], cuts: 9, keep: 0.55 },
  { c: [1.25, 0.38, 0.3], r: [0.48, 0.44, 0.5], cuts: 9, keep: 0.55 },
  { c: [-1.05, 0.2, 0.95], r: [0.3, 0.24, 0.26], cuts: 8, keep: 0.55 },
  // Back: boulders and masses, so the back is faceted rock too.
  { c: [-1.1, 0.42, -0.5], r: [0.5, 0.45, 0.48], cuts: 9, keep: 0.55 },
  { c: [1.05, 0.42, -0.45], r: [0.5, 0.45, 0.48], cuts: 9, keep: 0.55 },
  { c: [0, 0.95, -0.55], r: [0.9, 0.85, 0.5] },
  { c: [0.25, 2.0, -0.5], r: [0.7, 0.7, 0.45] },
];

function rockShape(): Sdf {
  const blocks = BLOCKS.map((b, i) => block(b.c, b.r, i + 1, b.cuts, b.keep, b.tilt));
  return sdf
    .union(...blocks)
    .intersect(sdf.halfSpace([0, 1, 0], TOP))
    .intersect(sdf.halfSpace([0, -1, 0], 0));
}

const rockS = rockShape();
const E = 0.01;
const normalAt = (x: number, y: number, z: number): V3 => {
  const d = rockS.dist;
  const gx = d(x + E, y, z) - d(x - E, y, z);
  const gy = d(x, y + E, z) - d(x, y - E, z);
  const gz = d(x, y, z + E) - d(x, y, z - E);
  const l = Math.hypot(gx, gy, gz) || 1;
  return [gx / l, gy / l, gz / l];
};

// One color per facet: the facet normal picks tan or grey, so each plane reads as one patch.
const rockPaint = (x: number, y: number, z: number, _b: Rgb): Rgb => {
  const [nx, ny, nz] = normalAt(x, y, z);
  const h = noise.random(Math.round(nx * 3), Math.round(ny * 3), Math.round(nz * 3));
  // About half the facets are tan: the up-facing ones, and a random share of the others.
  const tan = h + 0.55 * ny + 0.1 * nz > 0.62;
  let c = mixRgb(C.grey, C.tan, tan ? 0.9 : 0.08);
  // Darker toward the ground and in the back corners.
  c = mixRgb(c, C.dark, clamp01((0.25 - y) * 1.2) * 0.5 + clamp01((-z - 0.35) * 3) * 0.4);
  return c;
};

/** The rock grown by `grow` and kept only where `region` is: grass that follows the rock. */
const skin = (grow: number, region: Sdf): Sdf =>
  rockS.round(grow).subtract(rockS.round(-0.03)).smoothIntersect(0.03, region);

/** A slab region between y0 and y1 whose lower face waves with low-frequency noise (lobes). */
const droop = (y0: number, y1: number, depth: number, seed: number): Sdf =>
  sdf
    .box([6, y1 - y0, 4])
    .at(0, (y0 + y1) / 2, 0)
    .displace(depth, (x, y, z) => (y < (y0 + y1) / 2 ? 0.5 + 0.5 * noise.fbm(x * 1.6 + seed, 0, z * 1.6, 2) : 0));

/**
 * The outline of the rock at height y, seen from above, as (x, z) points: a ray from (cx, cz)
 * per angle, stopped where it leaves the rock (or at maxR), then pushed out by `grow` plus a
 * random lobe. The grass pads use it, so a pad always matches the rock top under it.
 */
function rockOutline(cx: number, cz: number, y: number, maxR: number, n: number, grow: number, lobe: number, seed: number): Vec2[] {
  const pts: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    let r = 0;
    while (r < maxR && rockS.dist(cx + dx * r, y, cz + dz * r) < 0) r += 0.01;
    const w = grow + lobe * (R(seed, i) - 0.5);
    pts.push([cx + dx * (r + w), cz + dz * (r + w)]);
  }
  return pts;
}

/** A soft grass pad: the outline extruded upward with round edges, from y0 to y1. */
const pad = (outline: Vec2[], y0: number, y1: number, radius: number): Sdf =>
  sdf
    .extrude(profile.polygon(outline, { smooth: true, samples: 4 }), y1 - y0, radius)
    .rotateX(90) // profile (u, v) -> world (x, z); the extrusion depth -> world y
    .at(0, (y0 + y1) / 2, 0);

function grass(): Sdf {
  // Top mat: a soft pad with a round lip over the crown edge, and lobes that hang down the sides.
  const capPad = pad(rockOutline(0.05, 0, TOP - 0.1, 1.8, 32, 0.06, 0.08, 3), TOP - 0.12, TOP + 0.08, 0.07);
  const capDrips = skin(0.06, droop(TOP - 0.34, TOP + 0.05, 0.24, 3));
  // Ledge mat on the jutting block (level top near y 1.70); its back end hides in the main mass.
  const ledgePad = pad(rockOutline(0.8, 0.5, 1.62, 0.85, 24, 0.05, 0.06, 11), 1.62, 1.78, 0.06);
  // Small grass patches on the front facets: triangles pushed through a thin skin of the rock.
  const wedge = (x: number, y: number, size: number, turn: number, z: number): Sdf =>
    skin(
      0.035,
      sdf
        .extrude(
          profile.polygon(
            [
              [-0.13 * size, -0.08 * size],
              [0.13 * size, -0.06 * size],
              [0.0, 0.16 * size],
            ],
            { smooth: false },
          ),
          1.2,
          0.02,
        )
        .rotateZ(turn)
        .at(x, y, z),
    );
  return sdf.union(
    capPad.smoothUnion(0.05, capDrips),
    ledgePad,
    wedge(-0.4, 2.15, 1.6, 12, 0.9),
    wedge(0.2, 1.05, 1.5, -8, 0.9),
    wedge(-0.95, 1.2, 1.4, 20, 0.9),
    wedge(1.05, 0.55, 1.4, -15, 0.9),
    wedge(0.4, 1.4, 1.5, 10, -0.9),
    wedge(-0.6, 0.7, 1.3, -18, -0.9),
  );
}

const grassPaint = (x: number, y: number, z: number, _b: Rgb): Rgb => {
  const n = 0.5 + 0.5 * noise.fbm(x * 2.5, y * 2.5, z * 2.5, 3, 6);
  const up = clamp01((normalAt(x, y, z)[1] + 0.2) * 1.2);
  return mixRgb(C.grassDark, C.grass, clamp01(0.25 + 0.6 * up + 0.3 * (n - 0.5)));
};

export default defineAsset({
  name: 'cliff-face',
  description:
    'A 3 m cliff outcrop: one chunky faceted tan and grey rock mass with a wide crown and a skirt of angular foot rocks, a soft grass mat on top, a grass ledge, and small grass patches.',
  detail: 0.02,
  reference: 'bench/overnight/refs/p1-forest/cliff-face-mock.jpg',
  texture: { size: 1024 },
  build(k) {
    k.body('rock', rockS.paintFn(rockPaint), {
      color: C.grey,
      roughness: 0.92,
      metalness: 0,
      detail: 0.03,
      flat: true,
      maxError: 0.006,
      maxTriangles: 6500,
      textureDensity: 2,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 14, y * 14, z * 14, 3, 41),
    });
    k.body('grass', grass().paintFn(grassPaint), {
      color: C.grass,
      roughness: 0.9,
      metalness: 0,
      detail: 0.025,
      maxError: 0.006,
      maxTriangles: 3500,
      paintWeight: 2,
    });
  },
});
