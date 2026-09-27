import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Tall grass tuft — forest dressing (catalog `nature/plants/tall-grass`): about 0.6 m tall
 * and 0.5 m wide, standing on y = 0 and facing +Z. No rig, no clips.
 *
 * - Role: wild meadow clump beside bushes and ferns; reads as a fan of arching blades at
 *   the 128 px sprite size.
 * - One idea: ten chunky blades spray from one low base and bow over into a round fan,
 *   with four taller stems carrying pale wheat seed heads above the green.
 * - Shape language: round and soft (tapered tubes, domed base); the seed heads are the only
 *   crisp accent, so the plant stays friendly beside the hamlet set.
 * - Palette: sunny leaf green #7ec850 on the upper blades, mid green #4a9a4f, shaded
 *   green #4a8a3f at the base, deep #2f7a3f in the crown shadow, pale wheat #d9c98a heads
 *   with dark grain rows. Value plan: dark base, mid fan, light tips, pale heads on top.
 * - Materials: matte foliage — roughness 0.82 blades, 0.88 crown, 0.72 grain heads,
 *   metalness 0.
 * - Detail: (1) low dark crown, (2) ten arching blades in three height steps, (3) four
 *   seed stems, (4) four chevroned wheat heads. Focal point: the pale heads.
 * - Budget: detail values keep the raw mesh near the caps (about 2,400 triangles total),
 *   so reduction stays gentle, the build prints no warning, and blades never break up.
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};

const SUN = rgb('#7ec850'); // sunny leaf green, upper blades
const MID = rgb('#4a9a4f'); // mid green, blade bodies
const SHADE = rgb('#4a8a3f'); // shaded green, blade roots
const DEEP = rgb('#2f7a3f'); // deep green, crown shadow
const WHEAT = rgb('#d9c98a'); // pale wheat seed heads
const WHEAT_DARK = rgb('#a3915a'); // grain row shade
const WHEAT_LIGHT = rgb('#eee2b4'); // sunlit grain tips

/** Spine control point: x, y, z, radius. */
type Sp = [number, number, number, number];

/**
 * One normalized arch, reused by every blade: it leans out of the base at once, keeps
 * curving, and leaves the tip below the apex pointing outward and down. `b0` is the base
 * radius, `R` the tip radius of the fan, `ys` the height scale (apex = 0.8 * ys).
 */
const T_B: readonly [number, number] = [0.1, 0.05];
const T_P1: readonly [number, number] = [0.4, 0.45];
const T_P2: readonly [number, number] = [0.7, 0.97];
const T_P3: readonly [number, number] = [1.0, 0.78];

const archSpine = (
  b0: number,
  R: number,
  ys: number,
  droop: number,
  r0: number,
  r1: number,
): Sp[] => {
  const p: readonly (readonly [number, number])[] = [T_B, T_P1, T_P2, T_P3];
  const px = p.map((q) => b0 + (R - b0) * q[0]);
  const py = [T_B[1] * ys, T_P1[1] * ys, (T_P2[1] - droop * 0.3) * ys, (T_P3[1] - droop) * ys];
  const out: Sp[] = [];
  for (let i = 0; i <= 8; i++) {
    const s = i / 8;
    const u = 1 - s;
    const x =
      u * u * u * px[0]! + 3 * u * u * s * px[1]! + 3 * u * s * s * px[2]! + s * s * s * px[3]!;
    const y =
      u * u * u * py[0]! + 3 * u * u * s * py[1]! + 3 * u * s * s * py[2]! + s * s * s * py[3]!;
    const r = r1 + (r0 - r1) * (1 - s);
    out.push([x, y, 0, r]);
  }
  return out;
};

/** Upright seed stem spine: leans out a little and ends almost straight up. */
const stemSpine = (h: number, lean: number, r0: number): Sp[] => {
  const b: [number, number] = [0.03, 0.03];
  const p1: [number, number] = [lean * 0.2, h * 0.5];
  const p2: [number, number] = [lean * 0.5, h * 0.84];
  const p3: [number, number] = [lean, h];
  const out: Sp[] = [];
  for (let i = 0; i <= 8; i++) {
    const s = i / 8;
    const u = 1 - s;
    const x = u * u * u * b[0] + 3 * u * u * s * p1[0] + 3 * u * s * s * p2[0] + s * s * s * p3[0];
    const y = u * u * u * b[1] + 3 * u * u * s * p1[1] + 3 * u * s * s * p2[1] + s * s * s * p3[1];
    out.push([x, y, 0, r0 * (1 - 0.25 * s)]);
  }
  return out;
};

/** Local +x direction of a blade azimuth in world space (0 = +Z front, 90 = +X left). */
const dirOf = (az: number): [number, number] => {
  const a = (az - 90) * (Math.PI / 180);
  return [Math.cos(a), -Math.sin(a)];
};

/** Local point to world: x along the azimuth direction, z across it. */
const toWorld = (az: number, x: number, y: number, z: number): [number, number, number] => {
  const [dx, dz] = dirOf(az);
  return [x * dx + z * dz, y, -x * dz + z * dx];
};

/** Twelve arching blades: five tall, four medium, three short fillers at the rim.
 *  `d` is the droop: how far the tip falls below the apex, in height units. */
const BLADES: readonly { az: number; b0: number; R: number; ys: number; d: number }[] = [
  { az: 4, b0: 0.03, R: 0.26, ys: 0.66, d: 0.14 },
  { az: 66, b0: 0.04, R: 0.28, ys: 0.64, d: 0.2 },
  { az: 176, b0: 0.03, R: 0.27, ys: 0.67, d: 0.12 },
  { az: 244, b0: 0.04, R: 0.28, ys: 0.63, d: 0.22 },
  { az: 340, b0: 0.03, R: 0.26, ys: 0.65, d: 0.16 },
  { az: 34, b0: 0.07, R: 0.3, ys: 0.52, d: 0.18 },
  { az: 120, b0: 0.08, R: 0.29, ys: 0.53, d: 0.14 },
  { az: 190, b0: 0.08, R: 0.3, ys: 0.51, d: 0.2 },
  { az: 300, b0: 0.07, R: 0.29, ys: 0.52, d: 0.16 },
  { az: 152, b0: 0.1, R: 0.28, ys: 0.4, d: 0.22 },
  { az: 214, b0: 0.1, R: 0.27, ys: 0.39, d: 0.26 },
  { az: 0, b0: 0.09, R: 0.28, ys: 0.41, d: 0.2 },
];

/** Four seed stems: taller, straighter, spread between the blades. */
const STEMS: readonly { az: number; h: number; lean: number }[] = [
  { az: 24, h: 0.51, lean: 0.16 },
  { az: 96, h: 0.53, lean: 0.14 },
  { az: 196, h: 0.52, lean: 0.17 },
  { az: 288, h: 0.49, lean: 0.15 },
];

interface Head {
  readonly a: [number, number, number];
  readonly b: [number, number, number];
  readonly ra: number;
  readonly rb: number;
}

/** World-space wheat heads, built from the stem tips along the stem tangent. */
const HEADS: readonly Head[] = STEMS.map((s) => {
  const sp = stemSpine(s.h, s.lean, 0.016);
  const last = sp[sp.length - 1]!;
  const prev = sp[sp.length - 2]!;
  const tx = last[0] - prev[0];
  const ty = last[1] - prev[1];
  const tl = Math.hypot(tx, ty) || 1;
  const tip = toWorld(s.az, last[0], last[1], 0);
  const nx = tx / tl;
  const ny = ty / tl;
  const base: [number, number, number] = [
    tip[0] - nx * 0.025,
    tip[1] - ny * 0.025,
    tip[2],
  ];
  const top: [number, number, number] = [
    tip[0] + nx * 0.095,
    tip[1] + ny * 0.095,
    tip[2],
  ];
  return { a: base, b: top, ra: 0.02, rb: 0.008 };
});

/** One blade: tapered chain, softly flattened into a ribbon, posed by azimuth. */
const buildBlade = (b: { az: number; b0: number; R: number; ys: number; d: number }): Sdf =>
  sdf
    .chain(archSpine(b.b0, b.R, b.ys, b.d, 0.022, 0.008), 0.011)
    .scale([1, 1, 0.7])
    .rotateY(b.az - 90);

/** One seed stem, same construction, thinner. */
const buildStem = (s: { az: number; h: number; lean: number }): Sdf =>
  sdf
    .chain(stemSpine(s.h, s.lean, 0.016), 0.012)
    .scale([1, 1, 0.9])
    .rotateY(s.az - 90);

/**
 * Blade paint in world coordinates: dark roots, mid body, sunny upper third, a per-direction
 * tint so neighbouring blades differ, and soft noise mottling.
 */
const bladePaint = (x: number, y: number, z: number): Rgb => {
  const az = Math.atan2(x, z);
  const alt = 0.5 + 0.5 * Math.sin(az * 2.7 + 0.7);
  let col = mixRgb(SHADE, MID, smoothstep(0.08, 0.42, y));
  col = mixRgb(col, SUN, smoothstep(0.3, 0.56, y));
  col = mixRgb(col, SUN, alt * 0.3 * smoothstep(0.2, 0.5, y));
  // the heart of the clump sits in shadow: darker near the axis and near the ground
  const radial = Math.hypot(x, z);
  const heart = (1 - smoothstep(0.05, 0.24, radial)) * (1 - smoothstep(0.12, 0.46, y));
  col = mixRgb(col, rgb('#1c4a24'), heart * 0.85);
  const v = 0.5 + 0.5 * noise.fbm(x * 9, y * 7, z * 9, 2);
  col = mixRgb(col, SHADE, (1 - v) * 0.4);
  return col;
};

/** Head paint: pale wheat with dark chevron grain rows and a sunlit top. */
const headPaint = (x: number, y: number, z: number): Rgb => {
  let bt = 0;
  let bw = 0;
  let br = 1;
  let bd = Infinity;
  for (const h of HEADS) {
    const ax = h.b[0] - h.a[0];
    const ay = h.b[1] - h.a[1];
    const az = h.b[2] - h.a[2];
    const len2 = ax * ax + ay * ay + az * az || 1e-6;
    let u = ((x - h.a[0]) * ax + (y - h.a[1]) * ay + (z - h.a[2]) * az) / len2;
    u = clamp01(u);
    const px = h.a[0] + ax * u;
    const py = h.a[1] + ay * u;
    const pz = h.a[2] + az * u;
    const d2 = (x - px) ** 2 + (y - py) ** 2 + (z - pz) ** 2;
    if (d2 < bd) {
      bd = d2;
      bt = u;
      br = Math.max(0.004, h.ra + (h.rb - h.ra) * u);
      bw = Math.sqrt(d2) / br;
    }
  }
  let col = mixRgb(WHEAT_DARK, WHEAT, smoothstep(0, 0.3, bt));
  col = mixRgb(col, WHEAT_LIGHT, smoothstep(0.6, 1, bt) * 0.7);
  // grain rows: chevrons that sweep toward the tip across the head
  let ph = bt * 7.5 - bw * 0.8;
  ph -= Math.floor(ph);
  const w = smoothstep(0, 0.14, ph) * (1 - smoothstep(0.5, 0.66, ph));
  col = mixRgb(col, WHEAT_DARK, w * 0.6 * smoothstep(0.05, 0.2, bt) * (1 - smoothstep(0.9, 1, bt)));
  return col;
};

export default defineAsset({
  name: 'tall-grass',
  description:
    'A 0.6 m tall grass tuft: twelve arching blades over a dark crown, four stems tipped with pale wheat seed heads.',
  detail: 0.016,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- crown
    // A low dark dome that hides every blade base, deepest at the ground line.
    const crown = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([0.06, 0.026, 0.06]).at(0, 0.013, 0),
        sdf.ellipsoid([0.046, 0.022, 0.046]).at(0.035, 0.012, 0.03),
        sdf.ellipsoid([0.042, 0.02, 0.042]).at(-0.035, 0.012, -0.03),
      )
      .displace(0.015, (x, y, z) => noise.fbm(x * 20, y * 20, z * 20, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z) => {
        const t = smoothstep(0, 0.06, y);
        const v = 0.5 + 0.5 * noise.fbm(x * 12, y * 12, z * 12, 2);
        let col = mixRgb(rgb('#1c4a24'), DEEP, t * (0.7 + 0.3 * v));
        col = mixRgb(col, SHADE, smoothstep(0.04, 0.09, y) * v * 0.45);
        return col;
      });
    k.body('crown', crown, {
      color: '#2f7a3f',
      roughness: 0.88,
      detail: 0.018,
      paintWeight: 2,
      maxTriangles: 320,
    });

    // ------------------------------------------------------------- blades
    // Twelve arching blades plus four seed stems in one green body.
    const blades = sdf.smoothUnion(
      0.011,
      ...BLADES.map(buildBlade),
      ...STEMS.map(buildStem),
    );
    k.body('blades', blades.paintFn(bladePaint), {
      color: '#4a9a4f',
      roughness: 0.82,
      detail: 0.012,
      paintWeight: 2,
      maxTriangles: 1580,
    });

    // ------------------------------------------------------------- heads
    const heads = sdf.smoothUnion(0.008, ...HEADS.map((h) => sdf.cone(h.a, h.b, h.ra, h.rb)));
    k.body('heads', heads.paintFn(headPaint), {
      color: '#d9c98a',
      roughness: 0.72,
      detail: 0.016,
      paintWeight: 2,
      maxTriangles: 640,
    });
  },
});
