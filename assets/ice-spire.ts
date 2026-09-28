import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * Design note — ice-spire (catalog `nature/terrain/ice-spire`).
 *
 * Role: snow-scene terrain landmark; reads at 128 px as a pale-blue crystal cluster on snow.
 * Size: tallest tip at y = 2.0 m, cluster about 1.1 m wide, snow mound about 1.3 m wide and
 *   0.24 m tall; standing on y = 0, centred on the Y axis, facing +Z. No rig, no clips.
 * One idea: one dominant hexagonal spire (2 m) with a pyramid tip, ringed by eleven shorter
 *   crystals leaning outward, all growing from a lumpy white snow mound.
 * Shape language: triangular/spiky crystals dominant (cold, sharp), round snow mound secondary.
 * Palette: ice deep #2f6288 (roots), ice #4a89b5 / #86c6e6 (body), pale #d8eefb (tips,
 *   focal point); snow #eef4fa, lit #fafcff, shadow blue #cfe0f0 / #9dbde0.
 * Materials: ice (crystal, roughness 0.1, metalness 0, opacity 0.7, flat: true),
 *   snow (matte, roughness 0.85, sparkle in `bump`).
 * Detail list: twelve hex-prism crystals with pyramid tips (big), outward lean rhythm tall to
 *   small (medium), vertical value gradient with a dark contact root (small). Focal point:
 *   the tall centre spire's pale tip.
 */

const ICE_ROOT = rgb('#2f6288');
const ICE_DEEP = rgb('#4a89b5');
const ICE = rgb('#86c6e6');
const ICE_PALE = rgb('#d8eefb');
const SNOW = rgb('#eef4fa');
const SNOW_LIGHT = rgb('#fafcff');
const SNOW_SHADOW = rgb('#cfe0f0');
const SNOW_DEEP = rgb('#9dbde0');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

interface Spire {
  r: number; // hex radius
  shaft: number; // prism top height (local, base at 0)
  apex: number; // tip height (local)
  tiltX: number; // lean in degrees
  tiltZ: number;
  rot: number; // hex rotation in degrees
  apexOff: [number, number]; // apex x/z offset for a natural point
  at: [number, number]; // foot x/z in the mound
  sink: number; // base height, buried in the snow
}

/** One hexagonal ice spire: hex prism cut into a pyramid tip by six planes. */
function spire(s: Spire): Sdf {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const a = ((s.rot + i * 60) * Math.PI) / 180;
    pts.push([s.r * Math.cos(a), s.r * Math.sin(a)]);
  }
  // Hexagon in XY, extruded along Z, then stood up so the shaft runs 0..shaft along Y.
  const prism = sdf.extrude(profile.polygon(pts), s.shaft).rotateX(90).at(0, s.shaft / 2, 0);

  // Pyramid tip: the solid shared by six planes (each through the apex and one rim edge),
  // unioned onto the prism.
  const apex: Vec3 = [s.apexOff[0], s.apex, s.apexOff[1]];
  const rim: Vec3[] = pts.map(([x, z]) => [x, s.shaft, z] as Vec3);
  let tip: Sdf = sdf.halfSpace([0, -1, 0], -s.shaft);
  for (let i = 0; i < 6; i++) {
    const e1 = rim[i]!;
    const e2 = rim[(i + 1) % 6]!;
    let n = norm(cross(sub(e1, apex), sub(e2, apex)));
    if (dot(n, [0, s.shaft * 0.5, 0]) > dot(n, e1)) n = [-n[0], -n[1], -n[2]];
    tip = tip.intersect(sdf.halfSpace(n, dot(n, e1)));
  }
  // Finite bounds for the mesher: a box around the tip region.
  tip = tip.intersect(
    sdf.box([s.r * 3, s.apex - s.shaft + 0.03, s.r * 3]).at(0, (s.shaft + s.apex) / 2, 0),
  );
  return prism
    .union(tip)
    .rotate(s.tiltX, 0, s.tiltZ)
    .at(s.at[0], s.sink, s.at[1]);
}

// Ten spires: one dominant centre reaching y = 2.0, the rest packed tightly around it and
// stepping down (1.75, 1.5, 1.38, 1.25, 1.12, 0.95, 0.78, 0.75, 0.62) so the cluster reads
// as one dense fan of chunky crystals. Wide prisms and tips in the top third keep them chunky.
const SPIRES: Spire[] = [
  // Tallest centre spire: near-vertical, fat hex prism with the tip in the top third.
  { r: 0.28, shaft: 1.5, apex: 2.0, tiltX: 2, tiltZ: -1, rot: 6, apexOff: [0.012, 0.0], at: [0.0, 0.0], sink: 0.05 },
  // Tall back-centre companion filling behind the leader.
  { r: 0.21, shaft: 1.25, apex: 1.75, tiltX: 8, tiltZ: -3, rot: 24, apexOff: [0.008, -0.01], at: [0.03, -0.16], sink: 0.045 },
  // Left-front companion leaning out.
  { r: 0.2, shaft: 1.05, apex: 1.5, tiltX: -6, tiltZ: 12, rot: 30, apexOff: [-0.014, 0.008], at: [-0.28, 0.14], sink: 0.04 },
  // Right companion leaning out.
  { r: 0.19, shaft: 0.95, apex: 1.38, tiltX: 4, tiltZ: -15, rot: 52, apexOff: [0.01, -0.008], at: [0.28, -0.04], sink: 0.04 },
  // Left-mid companion wedging into the centre.
  { r: 0.15, shaft: 0.85, apex: 1.25, tiltX: -3, tiltZ: 7, rot: 10, apexOff: [0.0, -0.006], at: [-0.22, 0.02], sink: 0.04 },
  // Back-left spike leaning away.
  { r: 0.16, shaft: 0.78, apex: 1.12, tiltX: 15, tiltZ: 3, rot: 20, apexOff: [0.0, -0.012], at: [-0.12, -0.26], sink: 0.04 },
  // Front bud leaning forward.
  { r: 0.145, shaft: 0.62, apex: 0.95, tiltX: -14, tiltZ: -5, rot: 44, apexOff: [0.008, 0.008], at: [0.14, 0.27], sink: 0.04 },
  // Right-back small spire.
  { r: 0.12, shaft: 0.5, apex: 0.78, tiltX: 10, tiltZ: -8, rot: 34, apexOff: [0.0, 0.0], at: [0.2, -0.28], sink: 0.035 },
  // Left small spire.
  { r: 0.12, shaft: 0.48, apex: 0.75, tiltX: 9, tiltZ: -9, rot: 14, apexOff: [0.0, 0.0], at: [-0.33, -0.08], sink: 0.035 },
  // Right-front small spire.
  { r: 0.105, shaft: 0.4, apex: 0.62, tiltX: -8, tiltZ: 11, rot: 38, apexOff: [0.005, 0.005], at: [0.33, 0.18], sink: 0.035 },
  // Two tiny front buds, so the front base rows up like the mock.
  { r: 0.085, shaft: 0.3, apex: 0.5, tiltX: -16, tiltZ: -3, rot: 16, apexOff: [0.0, 0.004], at: [0.0, 0.34], sink: 0.03 },
  { r: 0.075, shaft: 0.25, apex: 0.42, tiltX: -12, tiltZ: 7, rot: 40, apexOff: [0.003, 0.0], at: [-0.14, 0.3], sink: 0.03 },
];

const crystals: Sdf = sdf.union(...SPIRES.map(spire));

export default defineAsset({
  name: 'ice-spire',
  description:
    'Ice spire cluster 2 m tall: twelve pale-blue translucent faceted crystals, tallest central, on a lumpy snow mound.',
  detail: 0.01,
  reference: 'docs/item-mockups/ice-spire-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ ice
    const icePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      // Smooth vertical value gradient: deep blue roots brightening to pale tips. Flat shading
      // supplies the per-facet variation, so no high-frequency paint noise (it blocks reduction).
      const t = clamp01(y / 2.0);
      let c = mixRgb(ICE_DEEP, ICE, smoothstep(0.0, 0.5, t));
      c = mixRgb(c, ICE_PALE, smoothstep(0.45, 1.0, t) * 0.85);
      // Dark contact root where a spire meets the snow (adds value contrast at the base).
      c = mixRgb(c, ICE_ROOT, clamp01((0.13 - y) / 0.13) * 0.6);
      return c;
    };
    k.body('ice', crystals.paintFn(icePaint), {
      color: ICE,
      roughness: 0.1,
      metalness: 0,
      opacity: 0.7,
      flat: true,
      detail: 0.011,
      maxError: 0.005,
      maxTriangles: 2400,
      paintWeight: 2,
    });

    // ------------------------------------------------------------------ snow mound
    // One wide lumpy drift: a low main mass with a front toe, a back shoulder and side lobes.
    const snow = sdf
      .ellipsoid([0.52, 0.16, 0.42])
      .at(0, 0.11, 0)
      .smoothUnion(0.05, sdf.ellipsoid([0.31, 0.13, 0.27]).at(0.31, 0.09, 0.16))
      .smoothUnion(0.05, sdf.ellipsoid([0.29, 0.12, 0.25]).at(-0.31, 0.085, -0.14))
      .smoothUnion(0.04, sdf.ellipsoid([0.27, 0.12, 0.23]).at(-0.06, 0.09, 0.31))
      .smoothUnion(0.04, sdf.ellipsoid([0.25, 0.11, 0.21]).at(0.05, 0.085, -0.33))
      .smoothUnion(0.03, sdf.ellipsoid([0.17, 0.1, 0.16]).at(0.47, 0.08, -0.17))
      .displace(0.032, (x: number, y: number, z: number) => noise.fbm(x * 2.0, y * 2.0, z * 2.0, 3, 4))
      .displace(0.011, (x: number, y: number, z: number) => noise.fbm(x * 7, y * 7, z * 7, 2, 9));
    const ground = sdf.halfSpace([0, -1, 0], 0);
    const snowShape: Sdf = snow.intersect(ground).round(0.012).intersect(ground);

    const snowPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const h = clamp01(y / 0.22);
      let c = mixRgb(mixRgb(SNOW, SNOW_SHADOW, 0.45), SNOW_LIGHT, smoothstep(0.1, 0.9, h));
      const n = sdf.normalAt(snowShape, [x, y, z]);
      c = mixRgb(c, SNOW_DEEP, clamp01(-n[1]) * 0.8);
      c = mixRgb(c, SNOW_SHADOW, clamp01(1 - n[1]) * 0.3);
      const hollow = clamp01(-noise.fbm(x * 4.5, y * 3.5, z * 4.5, 3, 21));
      c = mixRgb(c, SNOW_SHADOW, hollow * 0.4);
      // Contact shade where the drift meets the ground.
      c = mixRgb(c, SNOW_DEEP, clamp01((0.06 - y) / 0.06) * 0.7);
      // Sparse sparkle flecks, kept small.
      const sp = noise.fbm(x * 70, y * 70, z * 70, 2, 71);
      c = mixRgb(c, SNOW_LIGHT, clamp01((sp - 0.62) * 2.6) * 0.4);
      return mixRgb(base, c, 1);
    };
    k.body('snow', snowShape.paintFn(snowPaint), {
      color: SNOW,
      roughness: 0.85,
      metalness: 0,
      detail: 0.016,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 1500,
      bump: (x: number, y: number, z: number) =>
        0.0028 * noise.fbm(x * 26, y * 26, z * 26, 3, 13) +
        0.0012 * noise.fbm(x * 88, y * 88, z * 88, 2, 17),
    });
  },
});
