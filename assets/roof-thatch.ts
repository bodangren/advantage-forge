import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note - thatched roof section (architecture/building-parts/roof-thatch), reworked.
 *
 * Role: modular village building part, 2 m wide; sits on wall tops or stands alone in the kit.
 * Size: 2.0 m along X, 1.4 m down the slope at ~46 degrees; the eave hangs on y ~ 0 at +Z,
 *   the ridge roll crests at ~1.3 m at -Z.
 * One idea: shaggy straw - four courses of twelve fat bundles each, overlapping down the
 *   slope, the lowest course drooping over the eave, under a plump pale ridge roll.
 * Shape language: round dominant (fat bundles, plump roll), square secondary (backing slab).
 * Palette: straw #e0b85a top, #b8903c valleys, #8a6a2a drooping ends, roll #efd48a, rope brown.
 * Materials: straw (roughness 0.9), ridge-roll (0.85), lashing rope (0.75).
 * Detail: primary bundles; secondary droop, roll, lashings; tertiary striations by displace
 *   along the slope (0.015 m) and bump. Focal point: the ridge roll.
 * Rig/animation: none (static building part).
 */

const W = 2.0;
const SLOPE = 1.4;
const RISE = 1.0;
const PITCH_DEG = (Math.asin(RISE / SLOPE) * 180) / Math.PI;
const S = RISE / SLOPE;
const CO = Math.sqrt(1 - S * S);
const LIFT = (SLOPE / 2) * S + 0.05 * CO + 0.07; // droop ends hang near y = 0

const N_COURSES = 4;
const N_CAPS = 12;
const R = 0.11;
const COURSE_STEP = 0.283;
const courseZ = (n: number) => 0.42 - n * COURSE_STEP; // n = 0 is the eave course
const courseY = (n: number) => 0.03 + n * 0.05;
const SPACING = W / N_CAPS;

const place = <T extends { rotateX(d: number): T; at(x: number, y: number, z: number): T }>(s: T) =>
  s.rotateX(PITCH_DEG).at(0, LIFT, 0);
const toLocal = (x: number, y: number, z: number) => {
  const yy = y - LIFT;
  return { x, y: yy * CO + z * S, z: -yy * S + z * CO };
};
const worldPt = (y: number, z: number): [number, number] => [y * CO - z * S + LIFT, y * S + z * CO];

const C = {
  straw: rgb('#e0b85a'),
  valley: rgb('#b8903c'),
  end: rgb('#8a6a2a'),
  roll: rgb('#efd48a'),
  rollDark: rgb('#c9a860'),
  rope: rgb('#8a5a35'),
};
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const sstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mod = (v: number, m: number) => ((v % m) + m) % m;

const strawPaint = (wx: number, wy: number, wz: number): Rgb => {
  const p = toLocal(wx, wy, wz);
  const n = Math.max(0, Math.min(N_COURSES - 1, Math.round((0.42 - p.z) / COURSE_STEP)));
  const v = Math.abs(mod(p.x + W / 2, SPACING) - SPACING / 2) / (SPACING / 2); // 1 in valleys
  const frontEdge = (p.z - (courseZ(n) + 0.12)) / 0.15; // > 0 near the course end
  const strand = noise.fbm(p.x * 30, p.y * 30, p.z * 6, 2, 3);
  let c = mixRgb(C.straw, C.valley, 0.12 + 0.12 * clamp01(0.5 - strand));
  c = mixRgb(c, C.valley, 0.85 * sstep(0.6, 0.95, v));
  c = mixRgb(c, C.valley, 0.5 * clamp01(frontEdge));
  if (n === 0) c = mixRgb(c, C.end, 0.9 * sstep(0.45, 0.68, p.z));
  else c = mixRgb(c, C.end, 0.35 * clamp01(frontEdge));
  return c;
};

const strawBump = (x: number, y: number, z: number) => 0.003 * noise.fbm(x * 40, y * 40, z * 10, 2, 5);

export default defineAsset({
  name: 'roof-thatch',
  description:
    'Thatched roof section: four courses of fat straw bundles, the eave course drooping shaggy, under a plump pale ridge roll with rope lashings.',
  reference: 'docs/item-mockups/roof-thatch-mock.jpg',
  detail: 0.016,
  texture: { size: 1024 },

  build(k) {
    let straw = sdf.box([W, 0.1, 1.4], 0.02).at(0, -0.05, 0);
    const courses = [];
    for (let n = 0; n < N_COURSES; n++) {
      const caps = [];
      for (let i = 0; i < N_CAPS; i++) {
        const t = (b: number) => 2 + 3 * noise.random(i + 3, n * 7 + b);
        const half = 0.275 - R;
        const off = (noise.random(i + 9, n * 7 + 5) - 0.5) * 0.1;
        caps.push(
          sdf
            .capsule([0, 0, -half], [0, 0, half], R)
            .rotate(t(1) * (i % 2 ? 1 : -1), t(2) * 0.4, t(3) * (i % 3 ? 1 : -1))
            .at(-W / 2 + SPACING / 2 + i * SPACING, 0, off),
        );
      }
      let row = sdf.smoothUnion(0.035, ...caps);
      row = row.rotateX(n === 0 ? 12 : 0).at(0, courseY(n) + 0.02, courseZ(n));
      courses.push(row);
    }
    straw = sdf.smoothUnion(0.012, straw, ...courses);
    straw = straw.displace(0.015, (x, y, z) => noise.fbm(x * 8, y * 8, z * 30, 2));
    k.body('straw', place(straw).paintFn(strawPaint), {
      color: C.straw,
      roughness: 0.9,
      metalness: 0,
      detail: 0.017,
      maxError: 0.004,
      maxTriangles: 9500,
      bump: strawBump,
    });

    // ridge roll straddling the crest
    const [ry, rz] = worldPt(0.1, -0.68);
    const at = (s: ReturnType<typeof sdf.box>) => s.at(0, ry, rz);
    k.body('ridge-roll', at(sdf.box([2.1, 0.22, 0.5], 0.1)).paintFn((x, y, z) =>
      mixRgb(C.roll, C.rollDark, 0.35 * clamp01(0.5 - noise.fbm(x * 22, y * 16, z * 16, 2, 41))),
    ), {
      color: C.roll,
      roughness: 0.85,
      metalness: 0,
      detail: 0.03,
      maxTriangles: 1500,
      bump: strawBump,
    });

    const ring = (x: number) =>
      sdf.subtract(
        sdf.box([0.05, 0.27, 0.55], 0.02),
        sdf.box([0.3, 0.226, 0.506], 0.09),
      ).at(x, ry, rz);
    k.body('lashing', sdf.union(ring(-0.62), ring(0.62)), {
      color: C.rope,
      roughness: 0.75,
      metalness: 0,
      detail: 0.009,
      maxTriangles: 800,
    });
  },
});
