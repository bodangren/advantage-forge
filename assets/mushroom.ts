import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Mushroom cluster — Chibi Quest nature prop (catalog `nature/plants/mushroom`): about 0.4 m
 * wide, 0.22 m tall, stands on y = 0, faces +Z. No rig, no clips.
 *
 * - Role: forest-floor dressing beside ferns, bushes and the stump; must read at 128 px.
 * - One idea: five chunky mushrooms in a stair-step of sizes, all leaning out of one soft moss
 *   mound; the big spotted tan cap is the focal point.
 * - Shape language: round dominant — domed caps with curled rims, fat tapered stems, soft mound.
 * - Palette: caps tan #c9a06a and brown #8a5a35, cream stems #e8d9b8, moss #4a9a4f with sunny
 *   tops #7ec850 and dark crevices #2f7a3f. Value plan: light cap tops and stems over the
 *   mid-green mound; the darkest values sit under the cap rims.
 * - Materials: cap skin satin (roughness 0.55), stems matte 0.8, moss matte 0.9 with bump fuzz.
 * - Detail: (1) big spotted tan cap, (2) stair-step sizes and outward leans, (3) painted moss
 *   light and shade. Focal point: the big tan cap.
 * - Budget: per-body `detail` and `maxTriangles` keep the final build under 3,000 triangles.
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};

const C = {
  capTan: '#c9a06a',
  capTanLight: '#d3ab72',
  capTanDark: '#a8814d',
  capBrown: '#8a5a35',
  capBrownLight: '#a9713c',
  capBrownDark: '#66421f',
  gillTan: '#e8d9b8',
  gillBrown: '#c9a06a',
  spot: '#f0e4c8',
  stem: '#e8d9b8',
  stemShade: '#bda87f',
  stemLight: '#f4ead0',
  moss: '#4a9a4f',
  mossLight: '#7ec850',
  mossDark: '#2f7a3f',
};

/** Open Catmull-Rom through 2D points (endpoint-clamped), for hand-drawn silhouettes. */
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

interface Shroom {
  /** Base position on the moss, meters. */
  readonly x: number;
  readonly z: number;
  /** Outward lean in degrees. */
  readonly lean: number;
  /** Lean azimuth in degrees: 0 = +Z (front), 90 = +X. */
  readonly spin: number;
  /** Stem height: where the cap underside sits. */
  readonly h: number;
  readonly r0: number;
  readonly r1: number;
  /** Lateral bend of the stem tip in the local frame. */
  readonly bow: number;
  readonly capR: number;
  readonly capH: number;
  readonly tan: boolean;
  /** Cream spot stencils on the cap top. */
  readonly spots: readonly (readonly [number, number, number, number])[];
}

/**
 * Five mushrooms: one big focal cap at the back, two mediums in front, two small ones filling
 * the gaps. All lean away from the cluster center, so the silhouette fans out.
 */
const SHROOMS: readonly Shroom[] = [
  {
    x: -0.04, z: -0.045, lean: 7, spin: 155, h: 0.15,
    r0: 0.038, r1: 0.028, bow: 0.012, capR: 0.105, capH: 0.074, tan: true,
    spots: [
      [0.3, 0.96, 25, 0.012],
      [0.62, 0.84, 145, 0.011],
      [0.8, 0.66, 262, 0.01],
      [0.5, 0.9, 320, 0.009],
    ],
  },
  {
    x: 0.1, z: 0.05, lean: 16, spin: 52, h: 0.098,
    r0: 0.03, r1: 0.021, bow: 0.01, capR: 0.073, capH: 0.053, tan: false, spots: [],
  },
  {
    x: -0.105, z: 0.05, lean: 18, spin: -58, h: 0.074,
    r0: 0.028, r1: 0.02, bow: 0.009, capR: 0.064, capH: 0.048, tan: true,
    spots: [
      [0.45, 0.92, 40, 0.01],
      [0.75, 0.72, 225, 0.009],
    ],
  },
  {
    x: 0.055, z: -0.1, lean: 12, spin: -145, h: 0.062,
    r0: 0.023, r1: 0.017, bow: 0.007, capR: 0.054, capH: 0.04, tan: false, spots: [],
  },
  {
    x: -0.03, z: 0.105, lean: 10, spin: 18, h: 0.048,
    r0: 0.02, r1: 0.015, bow: 0.005, capR: 0.046, capH: 0.035, tan: true, spots: [],
  },
];

/** Cap silhouette: dome from the axis down to a rim that curls back under the cap. */
const capProfile = (R: number, H: number): [number, number][] =>
  crOpen(
    [
      [0, H],
      [0.3 * R, 0.96 * H],
      [0.58 * R, 0.86 * H],
      [0.8 * R, 0.66 * H],
      [0.94 * R, 0.42 * H],
      [1.0 * R, 0.18 * H],
      [0.96 * R, 0.06 * H],
      [0.86 * R, 0],
      [0.45 * R, 0],
      [0, 0],
    ],
    5,
  );

/** Local pose shared by a mushroom's stem and cap: lean about the base, then place. */
const pose = (m: Shroom, s: Sdf): Sdf => s.rotateX(m.lean).rotateY(m.spin).at(m.x, 0, m.z);

/** Cap paint in the local frame: shaded rim, lit apex, soft mottling. */
const capPaint = (m: Shroom) => (x: number, y: number, z: number, base: Rgb): Rgb => {
  const t = clamp01(y / m.capH);
  const light = rgb(m.tan ? C.capTanLight : C.capBrownLight);
  const dark = rgb(m.tan ? C.capTanDark : C.capBrownDark);
  let c = mixRgb(base, dark, (1 - t) * 0.38);
  c = mixRgb(c, light, smoothstep(0.55, 1, t) * 0.25);
  c = mixRgb(c, dark, clamp01(-noise.fbm(x * 18, y * 18, z * 18, 2)) * 0.18);
  return c;
};

/** Stem paint in the local frame: moss shadow at the base, pale streaks higher up. */
const stemPaint = (m: Shroom) => (x: number, y: number, z: number, base: Rgb): Rgb => {
  const t = clamp01(y / Math.max(0.03, m.h));
  let c = mixRgb(rgb(C.stemShade), base, smoothstep(0, 0.3, t));
  const streak = noise.fbm(x * 34, y * 5, z * 34, 2);
  c = mixRgb(c, rgb(C.stemLight), clamp01(streak) * 0.35 * smoothstep(0.15, 0.7, t));
  return c;
};

/** One stem: a fat tapered chain with a slight bow, painted before the pose. */
const stemOf = (m: Shroom): Sdf =>
  pose(
    m,
    sdf
      .chain(
        [
          [0, m.r0 * 0.8, 0, m.r0],
          [0, m.r0 * 1.7, 0, m.r0 * 0.94],
          [m.bow * 0.4, m.h * 0.6, 0, m.r1 * 1.08],
          [m.bow, m.h - 0.004, 0, m.r1],
        ],
        0.02,
      )
      .paintFn(stemPaint(m)),
  );

/** One cap: revolved dome with a curled rim, gill underside and cream spots, then posed. */
const capOf = (m: Shroom): Sdf => {
  const R = m.capR;
  const H = m.capH;
  // The spline already rounds the rim curl, so no inflation: a 3 mm fillet would sit under
  // one mesh cell and shred the triangle reduction.
  let cap = sdf.revolve(profile.polygon(capProfile(R, H), { smooth: false }));
  // Local paint first: value plan (dark rim, lit apex), then gills, then spots.
  cap = cap.paintFn(capPaint(m));
  cap = cap.paintWhere(
    sdf.box([3 * R, 0.06, 3 * R]).at(0, -0.0295, 0),
    m.tan ? C.gillTan : C.gillBrown,
    0.0015,
  );
  for (const [rf, hf, azDeg, sr] of m.spots) {
    const az = (azDeg * Math.PI) / 180;
    const cx = (rf * R - 0.045 * R) * Math.cos(az);
    const cz = (rf * R - 0.045 * R) * Math.sin(az);
    const cy = hf * H - 0.012 * H;
    cap = cap.paintWhere(sdf.sphere(sr).at(cx, cy, cz), C.spot, 0.0018);
  }
  return pose(m, cap.at(m.bow, m.h, 0));
};

/** Moss paint: wide dark-to-mid mottling, sunny peaks, shaded ground line. */
const mossPaint = (x: number, y: number, z: number): Rgb => {
  const n = 0.5 + 0.5 * noise.fbm(x * 12, y * 12, z * 12, 3);
  const sun = clamp01((y - 0.015) / 0.05);
  let c = mixRgb(rgb('#2c6f38'), rgb(C.moss), 0.15 + 0.75 * n);
  c = mixRgb(c, rgb(C.mossLight), sun * (0.25 + 0.45 * n));
  c = mixRgb(c, rgb('#245c30'), clamp01(1 - y / 0.03) * 0.5);
  return c;
};

export default defineAsset({
  name: 'mushroom',
  description:
    'Chunky forest mushroom cluster: five tan and brown capped mushrooms with cream stems rising from a soft moss mound.',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- moss mound
    // Five overlapping flattened domes give the patch an organic outline without noise.
    const moss = sdf
      .smoothUnion(
        0.022,
        sdf.ellipsoid([0.17, 0.065, 0.15]),
        sdf.ellipsoid([0.09, 0.052, 0.085]).at(0.09, 0, 0.08),
        sdf.ellipsoid([0.085, 0.055, 0.09]).at(-0.1, 0, 0.03),
        sdf.ellipsoid([0.085, 0.045, 0.075]).at(0.03, 0, -0.1),
        sdf.ellipsoid([0.06, 0.034, 0.055]).at(-0.065, 0, 0.1),
      )
      .displace(0.007, (x, y, z) => noise.fbm(x * 9, y * 9, z * 9, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(mossPaint);
    k.body('moss', moss, {
      color: C.moss,
      roughness: 0.9,
      detail: 0.01,
      textureDensity: 1.5,
      paintWeight: 2,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 640,
    });

    // ---------------------------------------------------------------- stems
    const stems = sdf
      .union(...SHROOMS.map(stemOf))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('stems', stems, {
      color: C.stem,
      roughness: 0.8,
      detail: 0.009,
      textureDensity: 1.5,
      paintWeight: 2,
      maxTriangles: 480,
    });

    // ---------------------------------------------------------------- caps
    const byKind = (tan: boolean) => sdf.union(...SHROOMS.filter((m) => m.tan === tan).map(capOf));
    k.body('caps-tan', byKind(true), {
      color: C.capTan,
      roughness: 0.55,
      detail: 0.011,
      textureDensity: 2,
      maxTriangles: 1140,
    });
    k.body('caps-brown', byKind(false), {
      color: C.capBrown,
      roughness: 0.55,
      detail: 0.011,
      textureDensity: 2,
      maxTriangles: 640,
    });
  },
});
