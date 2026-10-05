import { sdf } from '../../src/index.js';
import type { AssetContext } from '../../src/index.js';
import type { BirdShape } from './bird-kind.js';

/**
 * Extras for the bird kinds (`assets/parts/bird-kind.ts`) that several birds share: glowing eyes
 * for the familiars, a ribbon collar under the head, a comb and a wattle for the hens and the
 * roosters, and ear tufts for the owls.
 */

type V3 = readonly [number, number, number];

/** A disc through the head along Z at the left eye (and its mirror), as the kind paints the eyes. */
const eyeDisc = (b: BirdShape, r: number, dx = 0, dy = 0) => {
  const e = b.eye.at;
  return sdf.cylinder(r, 1).rotateX(90).at(e[0] + dx, e[1] + dy, 0).mirror('x');
};

/**
 * Glowing eyes: a thin emissive shell over each painted iris. With `pupil` the painted pupil and
 * glint stay visible in the middle; without it the shell covers the pupil too, with a pale hot spot.
 * `hot` (without `pupil`) sets the hot spot's color and radius (a share of the iris radius) and a
 * darker rim color at the edge of the iris.
 */
export function glowEyes(k: AssetContext, b: BirdShape, color: string, intensity: number, pupil = false, lids?: number, hot?: { readonly color: string; readonly r: number; readonly rim: string }): void {
  const s = b.eye.scale;
  const e = b.eye.at;
  const front = sdf.halfSpace([0, 0, -1], -b.joints.HEAD_C[2]);
  const disc = eyeDisc(b, 0.031 * s);
  const glow = b.skull.round(0.0015).intersect(front);
  const shell = pupil
    ? glow.intersect(disc.subtract(eyeDisc(b, 0.019 * s, -0.003 * s, -0.002 * s)))
    : hot
      ? glow
          .intersect(disc)
          .paintWhere(disc.subtract(eyeDisc(b, 0.024 * s)), hot.rim, 0.004 * s)
          .paintWhere(sdf.sphere(0.031 * s * hot.r).at(e[0] - 0.002 * s, e[1] + 0.001 * s, e[2]).mirror('x'), hot.color, 0.008 * s)
      : glow.intersect(disc).paintWhere(sdf.sphere(0.012 * s).at(e[0] - 0.002 * s, e[1] - 0.001 * s, e[2]).mirror('x'), '#f4eaff', 0.006 * s);
  // With `lids` (as the kind's option), the shell stops at the lid edge so the lid shows over the eye.
  const lidCut = (() => {
    if (lids === undefined) return null;
    const r = 0.04 * s;
    const th = (16 * Math.PI) / 180;
    const offset = -(Math.cos(th) * (e[1] + lids * r) - Math.sin(th) * e[0]);
    return sdf.cylinder(r * 1.2, 1).rotateX(90).at(e[0], e[1], 0).intersect(sdf.halfSpace([Math.sin(th), -Math.cos(th), 0], offset)).mirror('x');
  })();
  k.body('eye-glow', lidCut ? shell.subtract(lidCut) : shell, { color, emissive: color, emissiveIntensity: intensity, roughness: 0.3, detail: 0.002, bone: 'head' });
}

/**
 * Glossy dome eyes: a ball set into the face at each painted eye (dark at the top, a warm color low
 * in the iris, and one white shine), and a heavy brow ridge over each eye in the head color that
 * falls toward the beak (a stern look). `r` is the ball radius as a share of the painted iris;
 * `ball: false` keeps the painted eyes and adds the brows only.
 */
export function domeEyes(k: AssetContext, b: BirdShape, opts: { iris: string; low: string; r?: number; brow?: number; browColor?: string; ball?: boolean }): void {
  const s = b.eye.scale;
  const e = b.eye.at;
  const { HEAD_C } = b.joints;
  const R = 0.031 * s * (opts.r ?? 1.15);
  const n: V3 = [e[0] - HEAD_C[0], e[1] - HEAD_C[1], e[2] - HEAD_C[2]];
  const nl = Math.hypot(n[0], n[1], n[2]) || 1;
  const d: V3 = [n[0] / nl, n[1] / nl, n[2] / nl];
  const c: V3 = [e[0] - d[0] * R * 0.3, e[1] - d[1] * R * 0.3, e[2] - d[2] * R * 0.3];
  const out = (u: number, v: number): V3 => [c[0] + d[0] * R * 0.9 + u * R, c[1] + d[1] * R * 0.9 + v * R, c[2] + d[2] * R * 0.9];
  const ball = sdf
    .sphere(R)
    .at(...c)
    .paintWhere(sdf.sphere(R * 0.62).at(...out(-0.05, -0.62)), opts.low, R * 0.45)
    .paintWhere(sdf.sphere(R * 0.2).at(...out(0.3, 0.4)), '#ffffff', 0.002);
  if (opts.ball !== false) k.body('eye-domes', ball.mirror('x').bone('head'), { color: opts.iris, roughness: 0.08, detail: 0.002, textureDensity: 2 });
  if (opts.brow) {
    // The ridge: from low beside the beak, over the top of the eye, to the outer corner.
    const pts = [
      [-0.85, 0.55],
      [-0.2, 1.05],
      [0.55, 1.12],
      [1.05, 0.85],
    ].map(([u, v]) => {
      const p = sdf.surfacePoint(b.skull, [c[0] + u! * R, c[1] + v! * R, c[2] + d[2] * R], 0);
      return [p[0], p[1], p[2], R * opts.brow! * (0.5 + 0.18 * (1 - Math.abs(u! - 0.1)))] as [number, number, number, number];
    });
    k.body('brow-ridge', sdf.chain(pts, R * 0.3).mirror('x').bone('head'), { color: opts.browColor ?? b.tint.head, roughness: 0.85, detail: 0.003 });
  }
}

/** The height of a collar just under the head. */
export const collarY = (b: BirdShape) => b.joints.HEAD_C[1] - b.joints.HR * 0.92;

/** A ribbon collar round the neck just under the head, as a band of the trunk; tagged to the neck. */
export function collar(b: BirdShape, width = 0.024): sdf.Shape {
  const y = collarY(b);
  return b.trunk
    .round(0.008)
    .smoothIntersect(0.004, sdf.box([0.6, width, 0.6], 0.004).at(0, y, b.joints.HEAD_C[2]))
    .bone('neck');
}

/** The front point of the collar (for a charm). */
export function collarFront(b: BirdShape): V3 {
  const y = collarY(b);
  const hit = sdf.raycast(b.trunk.round(0.008), [0, y, 2], [0, 0, -1])!;
  return [hit[0], hit[1], hit[2]];
}

/** A comb of five round lobes in a fan on the crown and a wattle of two long drops under the beak (the rooster). */
export function combAndWattle(b: BirdShape, size = 1, thick = 0.62): sdf.Shape {
  const { HEAD_C, HR } = b.joints;
  // The comb: five round lobes in a fan on the crown, the middle ones the tallest, on a low base,
  // flat from side to side, so each lobe shows in the side outline.
  const root = b.topHit(0, HEAD_C[2]);
  const base = sdf.ellipsoid([0.02 * size, 0.03 * size, 0.07 * size]).at(0, root[1] + 0.005, root[2] - 0.005);
  const lobes = [-72, -36, 0, 36, 72].map((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const reach = (0.07 + (i === 2 ? 0.012 : i % 2 ? 0.006 : -0.006)) * size;
    const r = (i === 2 ? 0.025 : i % 2 ? 0.023 : 0.02) * size;
    return sdf.capsule([0, root[1] - 0.012, root[2] - 0.01], [0, root[1] - 0.012 + Math.cos(a) * reach, root[2] - 0.01 + Math.sin(a) * reach], r);
  });
  const comb = sdf.smoothUnion(0.006 * size, base, ...lobes).scale([thick, 1, 1]);
  // The wattle: two long lobes that hang down from under the beak, close together, a little apart
  // at the bottom.
  const chin = b.faceHit(0, HEAD_C[1] - HR * 0.42);
  const drop = (x: number) =>
    sdf
      .chain([[0, 0.012 * size, 0, 0.014 * size], [x * 0.5, -0.022 * size, 0.003, 0.02 * size], [x, -0.06 * size, 0.006, 0.018 * size]], 0.01)
      .scale([1, 1, 0.75])
      .at(0, chin[1] - 0.02 * size, chin[2] + 0.004);
  return sdf.union(comb, sdf.smoothUnion(0.006 * size, drop(0.022 * size), drop(-0.022 * size))).bone('head');
}

/** Two feather tufts on the top corners of the head, leaning out and back (owls). */
export function earTufts(b: BirdShape, length: number, radius: number): sdf.Shape {
  const { HEAD_C, HR } = b.joints;
  const root = b.topHit(HR * 0.55, HEAD_C[2] + HR * 0.1);
  return sdf
    .chain(
      [
        [root[0], root[1] - 0.015, root[2], radius],
        [root[0] + length * 0.25, root[1] + length * 0.6, root[2] - length * 0.1, radius * 0.7],
        [root[0] + length * 0.35, root[1] + length, root[2] - length * 0.25, radius * 0.2],
      ],
      0.01,
    )
    .mirror('x')
    .bone('head');
}

/** A small tuft of curved feathers on the crown, leaning back (crows, sparrows). */
export function crownTuft(b: BirdShape, length: number, radius: number): sdf.Shape {
  const { HEAD_C } = b.joints;
  const feathers = (
    [
      [0, 0.02, 1, 0],
      [0.018, 0, 0.8, 14],
      [-0.018, 0, 0.8, -14],
    ] as const
  ).map(([x, z, l, tilt]) => {
    const root = b.topHit(x, HEAD_C[2] + z);
    const len = length * l;
    return sdf
      .chain(
        [
          [0, -0.01, 0, radius],
          [0, len * 0.6, -len * 0.15, radius * 0.75],
          [0, len, -len * 0.45, radius * 0.3],
        ],
        0.006,
      )
      .rotateZ(-tilt)
      .at(root[0], root[1], root[2]);
  });
  return sdf.smoothUnion(0.006, ...feathers).bone('head');
}

/** The kind's fan of five tail feathers, for a kind with `tail: false` that colors its own tail. */
export function fanTail(b: BirdShape, length = 1): sdf.Shape {
  const at = b.joints.TAIL_AT;
  return sdf
    .smoothUnion(
      0.01,
      ...[-44, -22, 0, 22, 44].map((a) =>
        sdf
          .ellipsoid([0.04, 0.012, 0.1 * length])
          .at(0, 0, -0.09 * length)
          .rotateX(-18)
          .rotateY(a)
          .at(at[0], at[1], at[2]),
      ),
    )
    .bone('tail');
}

/** Small round spots on the front of the trunk (a speckled chest), between two heights. */
export function bellySpots(b: BirdShape, rows: number, perRow: number, radius: number, yRange: readonly [number, number], stretch = 1.3): sdf.Shape {
  const spots: sdf.Shape[] = [];
  const { B } = b.joints;
  for (let i = 0; i < rows; i++) {
    const y = yRange[0] + ((yRange[1] - yRange[0]) * (i + 0.5)) / rows;
    const n = perRow - (i % 2);
    for (let j = 0; j < n; j++) {
      const x = (j - (n - 1) / 2) * B[0] * 0.32;
      const hit = sdf.raycast(b.trunk, [x, y, 2], [0, 0, -1]);
      if (!hit) continue;
      const nn = sdf.normalAt(b.trunk, hit);
      spots.push(
        sdf
          .ellipsoid([radius, radius * stretch, radius])
          .at(hit[0] - nn[0] * radius * 0.6, hit[1] - nn[1] * radius * 0.6, hit[2] - nn[2] * radius * 0.6)
          .bone(y > b.joints.BODY_C[1] ? 'spine' : 'hips'),
      );
    }
  }
  return sdf.union(...spots);
}
