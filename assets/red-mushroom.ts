import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Red mushroom — Chibi Quest nature prop (catalog `nature/plants/red-mushroom`).
 *
 * - Role: forest-floor dressing beside ferns, bushes and the stump; must read at 128 px.
 * - Size: 0.3 m tall, about 0.47 m wide, stands on y = 0, faces +Z, centred on the Y axis.
 * - One idea: three chunky red toadstools huddled so their caps overlap into one broad
 *   umbrella, dotted with fat white spots; a tiny fourth cap peeks out at the front.
 * - Shape language: round dominant (domed caps, fat stems, soft moss pad); soft bevels only.
 * - Palette: cap red #d9443a (dominant), dark #a72e27 (rim shade), light #e8604f (lit apex);
 *   spot off-white #f2eadb (accent); stems cream #e8d9b8 with shade #c0a878; moss #4a9a4f
 *   with sunny tops #7ec850 and dark crevices #2f7a3f. Value plan: light caps and stems over
 *   a mid-green pad; the darkest values sit under the cap rims.
 * - Materials: cap satin (roughness 0.5), stems matte 0.78, moss matte 0.9 with bump fuzz.
 * - Detail: (1) three domed caps, (2) fat stems, (3) white spots, (4) small moss pad,
 *   (5) tiny front mushroom. Focal point: the big spotted cap.
 * - Budget: per-body `detail` and `maxTriangles` keep the build under 3,000 triangles.
 * - Rig/animation: none (static prop).
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};

const C = {
  capRed: '#d9443a',
  capRedLight: '#e8604f',
  capRedDark: '#a72e27',
  spot: '#f2eadb',
  gill: '#efe0c8',
  stem: '#e8d9b8',
  stemLight: '#f4ead0',
  stemShade: '#c0a878',
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
  /** White spot stencils on the cap top: [radial fraction, height fraction, azimuth, radius]. */
  readonly spots: readonly (readonly [number, number, number, number])[];
}

/**
 * Four mushrooms: one big focal cap low at the back, two chunky mediums leaning out to the
 * sides, and a tiny cap peeking from the front. The three big caps overlap into one umbrella.
 */
const SHROOMS: readonly Shroom[] = [
  {
    x: -0.01, z: -0.05, lean: 6, spin: 178, h: 0.165,
    r0: 0.06, r1: 0.05, bow: 0.012, capR: 0.128, capH: 0.13,
    spots: [
      [0.26, 0.95, 20, 0.021],
      [0.52, 0.88, 128, 0.019],
      [0.76, 0.66, 250, 0.017],
      [0.42, 0.92, 305, 0.016],
      [0.64, 0.78, 65, 0.015],
    ],
  },
  {
    x: -0.085, z: 0.03, lean: 22, spin: -60, h: 0.125,
    r0: 0.05, r1: 0.041, bow: 0.012, capR: 0.107, capH: 0.11,
    spots: [
      [0.3, 0.94, 40, 0.017],
      [0.62, 0.8, 205, 0.015],
      [0.82, 0.54, 300, 0.013],
    ],
  },
  {
    x: 0.08, z: 0.02, lean: 20, spin: 58, h: 0.13,
    r0: 0.052, r1: 0.042, bow: 0.012, capR: 0.11, capH: 0.115,
    spots: [
      [0.27, 0.94, 95, 0.018],
      [0.56, 0.86, 210, 0.016],
      [0.78, 0.63, 320, 0.014],
      [0.46, 0.91, 10, 0.014],
    ],
  },
  {
    x: 0.0, z: 0.1, lean: 6, spin: 8, h: 0.052,
    r0: 0.022, r1: 0.017, bow: 0.004, capR: 0.046, capH: 0.048,
    spots: [
      [0.38, 0.9, 60, 0.01],
      [0.7, 0.72, 230, 0.009],
    ],
  },
];

/** Cap silhouette: a rounded dome with a rim that curls back under the cap. */
const capProfile = (R: number, H: number): [number, number][] =>
  crOpen(
    [
      [0, H],
      [0.18 * R, 0.995 * H],
      [0.38 * R, 0.965 * H],
      [0.58 * R, 0.9 * H],
      [0.76 * R, 0.79 * H],
      [0.9 * R, 0.62 * H],
      [0.98 * R, 0.42 * H],
      [1.0 * R, 0.24 * H],
      [0.99 * R, 0.1 * H],
      [0.93 * R, 0.0 * H],
      [0.62 * R, -0.02 * H],
      [0, -0.02 * H],
    ],
    5,
  );

/** Local pose shared by a mushroom's stem and cap: lean about the base, then place. */
const pose = (m: Shroom, s: Sdf): Sdf => s.rotateX(m.lean).rotateY(m.spin).at(m.x, 0, m.z);

/** Cap paint in the local frame: shaded rim, lit apex, soft red mottling. */
const capPaint = (m: Shroom) => (x: number, y: number, z: number, base: Rgb): Rgb => {
  const t = clamp01(y / m.capH);
  let c = mixRgb(base, rgb(C.capRedDark), (1 - t) * 0.42);
  c = mixRgb(c, rgb(C.capRedLight), smoothstep(0.5, 1, t) * 0.3);
  c = mixRgb(c, rgb(C.capRedDark), clamp01(-noise.fbm(x * 16, y * 16, z * 16, 2)) * 0.16);
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
          [0, m.r0 * 0.72, 0, m.r0],
          [0, m.r0 * 1.5, 0, m.r0 * 1.0],
          [m.bow * 0.4, m.h * 0.62, 0, m.r1 * 1.06],
          [m.bow, m.h - 0.004, 0, m.r1],
        ],
        0.02,
      )
      .paintFn(stemPaint(m)),
  );

/** Oval white spot stencil riding the cap dome, long axis along the azimuth tangent. */
const spotStencil = (m: Shroom, rf: number, hf: number, azDeg: number, sr: number): Sdf => {
  const az = (azDeg * Math.PI) / 180;
  const R = m.capR;
  const H = m.capH;
  const cx = (rf * R - 0.03 * R) * Math.cos(az);
  const cz = (rf * R - 0.03 * R) * Math.sin(az);
  const cy = hf * H - 0.01 * H;
  return sdf
    .ellipsoid([sr * 1.35, sr, sr])
    .rotateY(-(azDeg + 90))
    .at(cx, cy, cz);
};

/** One cap: revolved dome with a curled rim, pale underside and white spots, then posed. */
const capOf = (m: Shroom): Sdf => {
  const R = m.capR;
  const H = m.capH;
  let cap = sdf.revolve(profile.polygon(capProfile(R, H), { smooth: false }));
  cap = cap.paintFn(capPaint(m));
  // Pale underside: the flat foot of the revolve catches studio light as gills.
  cap = cap.paintWhere(sdf.box([3 * R, 0.06, 3 * R]).at(0, -0.0295, 0), C.gill, 0.0015);
  for (const [rf, hf, az, sr] of m.spots) {
    cap = cap.paintWhere(spotStencil(m, rf, hf, az, sr), C.spot, 0.0018);
  }
  return pose(m, cap.at(m.bow, m.h, 0));
};

/** Moss paint: wide dark-to-mid mottling, sunny peaks, shaded ground line. */
const mossPaint = (x: number, y: number, z: number): Rgb => {
  const n = 0.5 + 0.5 * noise.fbm(x * 12, y * 12, z * 12, 3);
  const sun = clamp01((y - 0.012) / 0.04);
  let c = mixRgb(rgb('#2c6f38'), rgb(C.moss), 0.15 + 0.75 * n);
  c = mixRgb(c, rgb(C.mossLight), sun * (0.25 + 0.45 * n));
  c = mixRgb(c, rgb('#245c30'), clamp01(1 - y / 0.03) * 0.5);
  return c;
};

export default defineAsset({
  name: 'red-mushroom',
  description:
    'Cluster of three chunky red toadstools with white spots and cream stems, on a small mossy base.',
  detail: 0.008,
  reference: 'docs/item-mockups/red-mushroom-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- moss base
    // Small overlapping flattened domes give the patch an organic outline without noise.
    const moss = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.12, 0.04, 0.11]),
        sdf.ellipsoid([0.075, 0.032, 0.07]).at(0.07, 0, 0.05),
        sdf.ellipsoid([0.07, 0.03, 0.075]).at(-0.075, 0, 0.02),
        sdf.ellipsoid([0.06, 0.028, 0.06]).at(0.0, 0, -0.08),
      )
      .displace(0.006, (x, y, z) => noise.fbm(x * 10, y * 10, z * 10, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(mossPaint);
    k.body('moss', moss, {
      color: C.moss,
      roughness: 0.9,
      detail: 0.012,
      textureDensity: 1.5,
      paintWeight: 2,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 380,
    });

    // ---------------------------------------------------------------- stems
    const stems = sdf
      .union(...SHROOMS.map(stemOf))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('stems', stems, {
      color: C.stem,
      roughness: 0.78,
      detail: 0.011,
      textureDensity: 1.5,
      paintWeight: 2,
      maxTriangles: 380,
    });

    // ---------------------------------------------------------------- caps
    const caps = sdf.union(...SHROOMS.map(capOf));
    k.body('caps', caps, {
      color: C.capRed,
      roughness: 0.5,
      detail: 0.009,
      textureDensity: 2,
      maxTriangles: 1750,
    });
  },
});
