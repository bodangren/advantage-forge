import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Blue mushroom — Chibi Quest nature prop (catalog `nature/plants/blue-mushroom`).
 *
 * - Role: glowing forest-floor dressing; must read at 128 px. Static prop, no rig, no clips.
 * - Size: 0.35 m tall, about 0.55 m wide, stands on y = 0, centred on the Y axis, faces +Z.
 * - One idea: three fat glowing blue toadstools huddled so their domed caps overlap into one
 *   glowing umbrella; the big central cap is the tallest and widest.
 * - Shape language: round dominant (domed caps, fat stems); soft bevels only, no spikes.
 * - Palette: cap blue #3f8ae0 (dominant), dark rim #2a63ad, lit cyan apex #77c8ff, spot #e6f4ff;
 *   stems cream #e8d9b8 with shade #c2a880. Value plan: light caps and stems over the dark
 *   ground line; the darkest values sit under the cap rims. Accent: the cyan glow.
 * - Materials: cap satin (roughness 0.5), stems matte 0.78, glow emissive (base dark #123043,
 *   emissive #6ad0ff at 1.2). The glow is emissive, never bright plain paint.
 * - Detail: (1) three domed caps, (2) fat stems, (3) pale spots, (4) glowing gill discs under
 *   every cap. Focal point: the big spotted cap and its glow.
 * - Budget: per-body `detail` and `maxTriangles` keep the final build under 3,000 triangles.
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};

const C = {
  capBlue: '#3f8ae0',
  capBlueLight: '#77c8ff',
  capBlueDark: '#2a63ad',
  capBlueCyan: '#4fb6e8',
  spot: '#e6f4ff',
  stem: '#e8d9b8',
  stemLight: '#f4ead0',
  stemShade: '#c2a880',
  glowBase: '#123043',
  glowEmit: '#6ad0ff',
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
  /** Base position on the ground, meters. */
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
  /** Pale spot stencils on the cap top: [radial fraction, height fraction, azimuth, radius]. */
  readonly spots: readonly (readonly [number, number, number, number])[];
}

/**
 * Three mushrooms: one big focal cap high at the back, a chunky medium leaning out to the left,
 * and a smaller one leaning to the right; the three caps overlap into one umbrella.
 */
const SHROOMS: readonly Shroom[] = [
  {
    x: 0.0, z: -0.045, lean: 4, spin: 172, h: 0.23,
    r0: 0.066, r1: 0.055, bow: 0.008, capR: 0.142, capH: 0.12,
    spots: [
      [0.26, 0.95, 18, 0.019],
      [0.52, 0.86, 120, 0.017],
      [0.76, 0.64, 245, 0.015],
      [0.42, 0.9, 312, 0.015],
      [0.64, 0.76, 62, 0.013],
    ],
  },
  {
    x: -0.118, z: 0.03, lean: 20, spin: -62, h: 0.155,
    r0: 0.053, r1: 0.046, bow: 0.012, capR: 0.112, capH: 0.095,
    spots: [
      [0.28, 0.93, 38, 0.016],
      [0.58, 0.79, 200, 0.014],
      [0.8, 0.5, 300, 0.011],
    ],
  },
  {
    x: 0.11, z: 0.045, lean: 22, spin: 58, h: 0.135,
    r0: 0.05, r1: 0.043, bow: 0.012, capR: 0.104, capH: 0.088,
    spots: [
      [0.26, 0.93, 92, 0.015],
      [0.56, 0.8, 210, 0.013],
      [0.78, 0.54, 322, 0.011],
    ],
  },
];

/** Cap silhouette: a wide rounded dome with a rim that curls back under the cap. */
const capProfile = (R: number, H: number): [number, number][] =>
  crOpen(
    [
      [0, H],
      [0.12 * R, 0.995 * H],
      [0.3 * R, 0.975 * H],
      [0.5 * R, 0.93 * H],
      [0.68 * R, 0.86 * H],
      [0.83 * R, 0.75 * H],
      [0.93 * R, 0.6 * H],
      [0.99 * R, 0.42 * H],
      [1.0 * R, 0.26 * H],
      [0.98 * R, 0.12 * H],
      [0.93 * R, 0.0 * H],
      [0.8 * R, -0.03 * H],
      [0.5 * R, -0.04 * H],
      [0, -0.04 * H],
    ],
    4,
  );

/** Local pose shared by a mushroom's stem and cap: lean about the base, then place. */
const pose = (m: Shroom, s: Sdf): Sdf => s.rotateX(m.lean).rotateY(m.spin).at(m.x, 0, m.z);

/** Cap paint in the local frame: shaded rim, lit cyan apex, soft blue mottling. */
const capPaint = (m: Shroom) => (x: number, y: number, z: number, base: Rgb): Rgb => {
  const t = clamp01(y / m.capH);
  let c = mixRgb(base, rgb(C.capBlueDark), (1 - t) * 0.42);
  // A cyan lift near the glowing underside, so the cap looks backlit by its own gills.
  c = mixRgb(c, rgb(C.capBlueCyan), smoothstep(0.35, 0.0, t) * 0.35);
  c = mixRgb(c, rgb(C.capBlueLight), smoothstep(0.45, 1, t) * 0.42);
  c = mixRgb(c, rgb(C.capBlueDark), clamp01(-noise.fbm(x * 16, y * 16, z * 16, 2)) * 0.16);
  return c;
};

/** Stem paint in the local frame: shaded foot, pale streaks higher up. */
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

/** Oval pale spot stencil riding the cap dome, long axis along the azimuth tangent. */
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

/** One cap: revolved dome with a curled rim, pale underside and light spots, then posed. */
const capOf = (m: Shroom): Sdf => {
  const R = m.capR;
  const H = m.capH;
  let cap = sdf.revolve(profile.polygon(capProfile(R, H), { smooth: false }));
  cap = cap.paintFn(capPaint(m));
  // Pale underside: the flat foot of the revolve catches studio light as gills.
  cap = cap.paintWhere(sdf.box([3 * R, 0.06, 3 * R]).at(0, -0.0295, 0), C.spot, 0.0015);
  for (const [rf, hf, az, sr] of m.spots) {
    cap = cap.paintWhere(spotStencil(m, rf, hf, az, sr), C.spot, 0.0018);
  }
  return pose(m, cap.at(m.bow, m.h, 0));
};

/**
 * Glowing gills: a flattened disc tucked just under the cap rim, around the stem. Its dark base
 * color plus the emissive cyan makes a soft glow under the cap instead of washed-out paint.
 */
const glowOf = (m: Shroom): Sdf =>
  pose(
    m,
    sdf
      .ellipsoid([m.capR * 0.72, m.capH * 0.22, m.capR * 0.72])
      .at(m.bow, m.h - m.capH * 0.1, 0),
  );

export default defineAsset({
  name: 'blue-mushroom',
  description:
    'Cluster of three glowing blue mushrooms with light spots and cream stems, on a cyan under-cap glow.',
  detail: 0.008,
  reference: 'docs/item-mockups/blue-mushroom-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- stems
    const stems = sdf
      .union(...SHROOMS.map(stemOf))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('stems', stems, {
      color: C.stem,
      roughness: 0.78,
      detail: 0.012,
      textureDensity: 1.5,
      paintWeight: 2,
      maxTriangles: 320,
    });

    // ---------------------------------------------------------------- caps
    const caps = sdf.union(...SHROOMS.map(capOf));
    k.body('caps', caps, {
      color: C.capBlue,
      roughness: 0.5,
      detail: 0.008,
      textureDensity: 2,
      maxTriangles: 2350,
    });

    // ---------------------------------------------------------------- glow
    // One emissive body for all three gill discs; dark base, cyan emissive.
    const glow = sdf.union(...SHROOMS.map(glowOf));
    k.body('glow', glow, {
      color: C.glowBase,
      roughness: 0.25,
      emissive: C.glowEmit,
      emissiveIntensity: 1.2,
      detail: 0.012,
      maxTriangles: 240,
    });
  },
});
