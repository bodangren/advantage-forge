import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Giant mushroom tree — catalog nature/trees/giant-mushroom-tree.
 *
 * Role: forest landmark. The silhouette must read at 128 px.
 * Size: 3.2 m tall. It stands on y = 0, faces +Z, and is centered on the Y axis.
 * One idea: a huge pointed red cap with cream spots sits on a thick pale bulb stem.
 * Shape language: round forms and soft bevels. The pointed cap is the only sharp accent.
 * Palette: cap #e25848, rim #9e2e28, stem #f0d0ae, spots #f6e6c4, gills #f4e4c6, vine #3f9248.
 * Materials: stem flesh, cap, gill skirt, spots, vine, moss, sprout stems, sprout caps.
 * Detail: bulb stem, three gill rings, pointed cap, spots, three small mushrooms, one vine.
 * Focal point: the spotted red cap. Rig: none.
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};

const C = {
  cap: '#e25848',
  capLight: '#f08070',
  capDark: '#a33a32',
  capUnder: '#7f2a24',
  spot: '#f6e6c4',
  spotShade: '#e4cba0',
  gill: '#f4e4c6',
  gillShade: '#d8bc94',
  stem: '#f0d0ae',
  stemLight: '#f8e6cc',
  stemShade: '#c9a67c',
  vine: '#2f7a3f',
  vineMid: '#3f9248',
  leaf: '#4a9a4f',
  leafLight: '#7ec850',
  moss: '#4a9a4f',
  mossDark: '#2f7a3f',
  mossLight: '#7ec850',
};

/** Open Catmull-Rom through 2D points, for a lathe silhouette that stays on the axis. */
const crOpen = (pts: readonly (readonly [number, number])[], samples: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    for (let s = 0; s < samples; s++) {
      const t = s / samples;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  const last = pts[pts.length - 1]!;
  out.push([last[0], last[1]]);
  return out;
};

const DEG = Math.PI / 180;

/** Cap underside sits here. The tip lands near 3.2 m after the forward tilt. */
const CAP_Y = 1.96;
const CAP_TILT = 4;
const CAP_R = 1.02;
const CAP_H = 1.26;

/** Pointed toadstool cap: rounded tip, full shoulder, thick brim, shallow underside. */
const capProfile = (R: number, H: number): [number, number][] =>
  crOpen(
    [
      [0, H],
      [0.1 * R, 0.96 * H],
      [0.24 * R, 0.84 * H],
      [0.42 * R, 0.66 * H],
      [0.6 * R, 0.46 * H],
      [0.76 * R, 0.28 * H],
      [0.9 * R, 0.14 * H],
      [0.98 * R, 0.06 * H],
      [1.0 * R, 0.02 * H],
      [0.96 * R, -0.02 * H],
      [0.84 * R, -0.055 * H],
      [0.58 * R, -0.04 * H],
      [0.24 * R, -0.016 * H],
      [0, -0.008 * H],
    ],
    4,
  );

const revolveCap = (R: number, H: number): Sdf =>
  sdf.revolve(profile.polygon(capProfile(R, H), { smooth: false }));

/** Bulb stem: short neck, early swell, wide low belly, flat foot on y = 0. */
const stemProfile = (): [number, number][] =>
  crOpen(
    [
      [0, 2.18],
      [0.32, 2.14],
      [0.36, 1.96],
      [0.38, 1.76],
      [0.42, 1.54],
      [0.54, 1.24],
      [0.68, 0.88],
      [0.76, 0.5],
      [0.7, 0.22],
      [0.5, 0.06],
      [0.32, 0.0],
      [0, 0.0],
    ],
    5,
  );

const capPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const t = clamp01(y / CAP_H);
  let c = mixRgb(rgb(C.capDark), base, 0.28 + 0.72 * smoothstep(0.05, 0.7, t));
  c = mixRgb(c, rgb(C.capLight), smoothstep(0.62, 1, t) * 0.5);
  const r = Math.hypot(x, z) / CAP_R;
  c = mixRgb(c, rgb(C.capDark), smoothstep(0.72, 1.02, r) * 0.38);
  c = mixRgb(c, rgb(C.capUnder), smoothstep(0.05, -0.02, y) * 0.85);
  const mott = clamp01(-noise.fbm(x * 2.2, y * 2.2, z * 2.2, 2, 4));
  c = mixRgb(c, rgb(C.capDark), mott * 0.14);
  return c;
};

const stemPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const t = clamp01(y / 2.1);
  let c = mixRgb(rgb(C.stemShade), base, smoothstep(0, 0.28, t));
  c = mixRgb(c, rgb(C.stemLight), smoothstep(0.35, 0.85, t) * 0.4);
  const streak = noise.fbm(x * 5, y * 1.4, z * 5, 2, 9);
  c = mixRgb(c, rgb('#e0bc90'), clamp01(-streak) * 0.22);
  c = mixRgb(c, rgb(C.stemLight), clamp01(streak) * 0.12 * t);
  // Moss stain on the shaded base, stronger toward -Z.
  const moss = smoothstep(0.42, 0.02, y) * (0.35 + 0.65 * smoothstep(0.15, -0.45, z));
  const mossN = 0.5 + 0.5 * noise.fbm(x * 3.5, y * 3.5, z * 3.5, 2, 17);
  c = mixRgb(c, rgb(C.mossDark), moss * mossN * 0.55);
  const rad = Math.hypot(x, z);
  const collar = smoothstep(0.1, 0.0, Math.abs(y - 1.72)) * smoothstep(0.38, 0.5, rad);
  c = mixRgb(c, rgb(C.gill), collar * 0.7);
  const band = smoothstep(0.05, 0.0, Math.abs(y - 1.48)) * smoothstep(0.4, 0.48, rad);
  c = mixRgb(c, rgb(C.stemLight), band * 0.45);
  return c;
};

/** Pose shared by the cap, the gill skirt, and the spots: tip leans toward +Z. */
const capPose = (s: Sdf): Sdf => s.rotateX(CAP_TILT).at(0, CAP_Y, 0);

interface SpotSpec {
  /** Azimuth in degrees. 0 is +Z, positive turns toward +X. */
  readonly az: number;
  /** 0 at the brim, 1 at the tip. */
  readonly hf: number;
  readonly r: number;
}

const SPOTS: readonly SpotSpec[] = [
  { az: 6, hf: 0.84, r: 0.15 },
  { az: -32, hf: 0.7, r: 0.11 },
  { az: 34, hf: 0.58, r: 0.09 },
  { az: -6, hf: 0.4, r: 0.12 },
  { az: 98, hf: 0.62, r: 0.16 },
  { az: -108, hf: 0.5, r: 0.13 },
  { az: 155, hf: 0.46, r: 0.1 },
  { az: -158, hf: 0.72, r: 0.09 },
  { az: 52, hf: 0.24, r: 0.08 },
  { az: -48, hf: 0.2, r: 0.075 },
  { az: 200, hf: 0.3, r: 0.07 },
];

/** Raised cream spot. The ray hits the posed cap so the disc sits on the slope. */
const spotOf = (cap: Sdf, spec: SpotSpec): Sdf | null => {
  const az = spec.az * DEG;
  const y = CAP_Y + spec.hf * CAP_H * 0.92;
  const guessR = CAP_R * (1 - spec.hf) + 0.35;
  const ox = Math.sin(az) * guessR;
  const oz = Math.cos(az) * guessR;
  const hit = sdf.raycast(cap, [ox, y + 0.15, oz], [-Math.sin(az), -0.25, -Math.cos(az)]);
  if (!hit) return null;
  const n = sdf.normalAt(cap, hit);
  const sink = spec.r * 0.18;
  const cx = hit[0] + n[0] * (spec.r * 0.28 - sink);
  const cy = hit[1] + n[1] * (spec.r * 0.28 - sink);
  const cz = hit[2] + n[2] * (spec.r * 0.28 - sink);
  // Flatten along Y, then tip the disc so its thin axis follows the surface.
  const yaw = (Math.atan2(n[0], n[2]) * 180) / Math.PI;
  const pitch = (Math.atan2(Math.hypot(n[0], n[2]), n[1]) * 180) / Math.PI;
  return sdf
    .ellipsoid([spec.r * 1.15, spec.r * 0.42, spec.r * 0.95])
    .rotateX(pitch)
    .rotateY(yaw)
    .at(cx, cy, cz);
};

/**
 * Pale gill skirt in cap-local space. It hangs below the brim so the fringe
 * shows from the front, and it stays inside the cap radius so it does not poke out.
 */
const gillSkirt = (): Sdf => {
  // A smooth ring under the brim, plus a front lip that hangs low enough to show from the front.
  // Nothing extends past the cap radius, so the skirt does not become spokes.
  const ring = sdf.torus(0.62, 0.052).at(0, -0.09, 0);
  const lip = sdf.ellipsoid([0.62, 0.04, 0.28]).at(0, -0.15, 0.48);
  const ridges: Sdf[] = [];
  for (let i = 0; i < 8; i++) {
    const az = (i / 8) * Math.PI * 2 + 0.2;
    ridges.push(
      sdf.capsule(
        [Math.sin(az) * 0.42, -0.08, Math.cos(az) * 0.42],
        [Math.sin(az) * 0.7, -0.12, Math.cos(az) * 0.7],
        0.022,
      ),
    );
  }
  return sdf.smoothUnion(0.016, ring, lip, ...ridges).paintFn((x, _y, z, base) => {
    const ang = Math.atan2(x, z);
    const stripe = 0.5 + 0.5 * Math.cos(ang * 8);
    const rad = Math.hypot(x, z);
    let c = mixRgb(rgb(C.gillShade), base, 0.25 + 0.75 * stripe);
    c = mixRgb(c, rgb(C.stemShade), smoothstep(0.55, 0.85, rad) * 0.3);
    return c;
  });
};

interface Baby {
  /** Azimuth in degrees. 0 is +Z, positive turns toward +X. */
  readonly az: number;
  readonly foot: number;
  readonly h: number;
  readonly r0: number;
  readonly r1: number;
  readonly capR: number;
  readonly capH: number;
  readonly lean: number;
}

const BABIES: readonly Baby[] = [
  { az: -38, foot: 0.72, h: 0.54, r0: 0.064, r1: 0.048, capR: 0.18, capH: 0.145, lean: 20 },
  { az: 112, foot: 0.66, h: 0.36, r0: 0.048, r1: 0.036, capR: 0.125, capH: 0.105, lean: 24 },
  { az: 196, foot: 0.6, h: 0.26, r0: 0.038, r1: 0.028, capR: 0.09, capH: 0.075, lean: 16 },
];

/** Lean away from the trunk, then plant the foot. */
const babyPose = (b: Baby, s: Sdf): Sdf => {
  const az = b.az * DEG;
  return s.rotate(b.lean, b.az, 0).at(Math.sin(az) * b.foot, 0, Math.cos(az) * b.foot);
};

const babyStem = (b: Baby): Sdf =>
  babyPose(
    b,
    sdf.chain(
      [
        [0, b.r0 * 0.7, 0, b.r0],
        [0, b.h * 0.45, 0, b.r0 * 0.92],
        [0.01, b.h * 0.78, 0, b.r1 * 1.05],
        [0.016, b.h, 0, b.r1],
      ],
      0.02,
    ),
  );

const babyCap = (b: Baby): Sdf => {
  let cap = revolveCap(b.capR, b.capH).paintFn((x, y, z, base) => {
    const t = clamp01(y / b.capH);
    let c = mixRgb(rgb(C.capDark), base, 0.3 + 0.7 * t);
    c = mixRgb(c, rgb(C.capLight), smoothstep(0.65, 1, t) * 0.35);
    return c;
  });
  // Two cream spots so the babies read as the same species.
  cap = cap.paintWhere(sdf.sphere(b.capR * 0.22).at(b.capR * 0.28, b.capH * 0.72, b.capR * 0.12), C.spot, 0.004);
  cap = cap.paintWhere(sdf.sphere(b.capR * 0.14).at(-b.capR * 0.35, b.capH * 0.5, -b.capR * 0.1), C.spot, 0.003);
  return babyPose(b, cap.at(0.016, b.h, 0));
};

/** Hanging vine on the front-left brim. Leaves lie along the cord, not across it. */
const vineShape = (): Sdf => {
  const cord = sdf
    .chain(
      [
        [0.16, 2.08, 0.62, 0.04],
        [0.36, 1.78, 0.98, 0.036],
        [0.54, 1.36, 1.12, 0.032],
        [0.64, 0.96, 1.02, 0.028],
        [0.5, 0.6, 0.8, 0.024],
        [0.32, 0.34, 0.58, 0.02],
      ],
      0.02,
    )
    .paintFn((x, y, z, base) => {
      const t = clamp01((y - 0.3) / 1.8);
      const n = 0.5 + 0.5 * noise.fbm(x * 6, y * 3, z * 6, 2, 21);
      return mixRgb(rgb(C.vine), mixRgb(base, rgb(C.vineMid), n), 0.35 + 0.45 * t);
    });
  /** A broad leaf. Long axis is local Y, so it hangs; roll tips it off the cord. */
  const leafAt = (x: number, y: number, z: number, yaw: number, roll: number, len: number): Sdf =>
    sdf
      .ellipsoid([len * 0.48, len * 0.7, len * 0.1])
      .rotateZ(roll)
      .rotateY(yaw)
      .at(x, y, z)
      .paint(len > 0.15 ? C.leafLight : C.leaf);
  const leaves = sdf.union(
    leafAt(0.48, 1.72, 1.1, 18, 42, 0.2),
    leafAt(0.26, 1.64, 0.86, -36, -28, 0.16),
    leafAt(0.7, 1.28, 1.22, 40, 30, 0.18),
    leafAt(0.4, 1.2, 0.98, -22, -38, 0.15),
    leafAt(0.78, 0.94, 1.1, 55, 24, 0.16),
    leafAt(0.46, 0.86, 0.88, -12, -30, 0.14),
    leafAt(0.6, 0.58, 0.9, 16, 36, 0.13),
    leafAt(0.34, 0.44, 0.64, -26, -16, 0.12),
    leafAt(0.58, 1.5, 1.16, 8, 18, 0.14),
  );
  return sdf.union(cord, leaves);
};

const mossShape = (): Sdf =>
  sdf
    .smoothUnion(
      0.03,
      sdf.ellipsoid([0.4, 0.055, 0.36]),
      sdf.ellipsoid([0.28, 0.042, 0.24]).at(0.55, 0.012, 0.32),
      sdf.ellipsoid([0.24, 0.038, 0.22]).at(-0.48, 0.01, 0.16),
      sdf.ellipsoid([0.2, 0.034, 0.18]).at(0.06, 0.008, -0.46),
      sdf.ellipsoid([0.18, 0.03, 0.16]).at(0.4, 0.008, -0.22),
    )
    .intersect(sdf.halfSpace([0, -1, 0], 0))
    .paintFn((x, y, z) => {
      const n = 0.5 + 0.5 * noise.fbm(x * 4, y * 6, z * 4, 2, 6);
      const sun = clamp01((y - 0.01) / 0.04);
      let c = mixRgb(rgb(C.mossDark), rgb(C.moss), 0.25 + 0.6 * n);
      c = mixRgb(c, rgb(C.mossLight), sun * (0.2 + 0.4 * n));
      return c;
    });

export default defineAsset({
  name: 'giant-mushroom-tree',
  description:
    'Giant mushroom tree, 3.2 m tall: thick pale stem with gill rings, huge spotted red cap, small mushrooms, and a hanging vine.',
  detail: 0.02,
  reference: 'docs/item-mockups/giant-mushroom-tree-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- stem
    const stemCore = sdf
      .revolve(profile.polygon(stemProfile(), { smooth: false }))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const nodeGuesses: readonly (readonly [number, number, number])[] = [
      [0.15, 0.52, 0.85],
      [0.85, 0.68, 0.1],
      [-0.25, 0.38, -0.8],
    ];
    const nodes = nodeGuesses.map(([x, y, z]) => {
      const p = sdf.surfacePoint(stemCore, [x, y, z], 0.015);
      return sdf.sphere(0.055).at(p[0], p[1], p[2]);
    });
    const stem = stemCore
      .smoothUnion(0.035, sdf.torus(0.48, 0.078).at(0, 1.72, 0))
      .smoothUnion(0.018, sdf.torus(0.47, 0.046).at(0, 1.48, 0), ...nodes)
      .paintFn(stemPaint);
    k.body('stem', stem, {
      color: C.stem,
      roughness: 0.74,
      detail: 0.022,
      maxError: 0.009,
      textureDensity: 1.2,
      paintWeight: 1.5,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 7, y * 2.2, z * 7, 2, 3),
      maxTriangles: 2800,
    });

    // ---------------------------------------------------------------- cap
    const capLocal = revolveCap(CAP_R, CAP_H)
      .displace(0.018, (x, y, z) => noise.fbm(x * 1.4, y * 1.1, z * 1.4, 2, 8), 1.4)
      .paintFn(capPaint);
    let cap = capPose(capLocal);
    // Cream discs on the cap so the spots still read if a raised disc sinks in.
    for (const spec of SPOTS) {
      const az = spec.az * DEG;
      const y = CAP_Y + spec.hf * CAP_H * 0.92;
      const guessR = CAP_R * (1 - spec.hf) + 0.35;
      const hit = sdf.raycast(
        cap,
        [Math.sin(az) * guessR, y + 0.15, Math.cos(az) * guessR],
        [-Math.sin(az), -0.25, -Math.cos(az)],
      );
      if (hit) cap = cap.paintWhere(sdf.sphere(spec.r * 0.72).at(hit[0], hit[1], hit[2]), C.spot, 0.012);
    }
    k.body('cap', cap, {
      color: C.cap,
      roughness: 0.48,
      detail: 0.015,
      maxError: 0.0045,
      textureDensity: 2,
      paintWeight: 1.5,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 5, y * 4, z * 5, 2, 11),
      maxTriangles: 2600,
    });

    // ---------------------------------------------------------------- gills
    k.body('gills', capPose(gillSkirt()), {
      color: C.gill,
      roughness: 0.58,
      detail: 0.016,
      maxError: 0.005,
      textureDensity: 1.6,
      paintWeight: 2,
      bump: (x, y, z) => 0.0035 * Math.cos(Math.atan2(x, z) * 10),
      maxTriangles: 1100,
    });

    // ---------------------------------------------------------------- spots
    const spots = SPOTS.map((spec) => spotOf(cap, spec)).filter((s): s is Sdf => s !== null);
    if (spots.length > 0) {
      k.body('spots', sdf.union(...spots), {
        color: C.spot,
        roughness: 0.42,
        detail: 0.014,
        maxError: 0.004,
        textureDensity: 1.8,
        maxTriangles: 1100,
      });
    }

    // ---------------------------------------------------------------- sprouts
    k.body('sprout-stems', sdf.union(...BABIES.map(babyStem)).intersect(sdf.halfSpace([0, -1, 0], 0)), {
      color: C.stem,
      roughness: 0.74,
      detail: 0.009,
      maxError: 0.0025,
      maxTriangles: 420,
    });
    k.body('sprout-caps', sdf.union(...BABIES.map(babyCap)), {
      color: C.cap,
      roughness: 0.5,
      detail: 0.008,
      maxError: 0.0022,
      textureDensity: 1.6,
      maxTriangles: 700,
    });

    // ---------------------------------------------------------------- vine
    k.body('vine', vineShape(), {
      color: C.vineMid,
      roughness: 0.84,
      detail: 0.011,
      maxError: 0.003,
      textureDensity: 1.4,
      paintWeight: 1.5,
      maxTriangles: 900,
    });

    // ---------------------------------------------------------------- moss
    k.body('moss', mossShape(), {
      color: C.moss,
      roughness: 0.92,
      detail: 0.024,
      maxError: 0.008,
      paintWeight: 1.5,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 14, y * 10, z * 14, 2, 5),
      maxTriangles: 360,
    });
  },
});
