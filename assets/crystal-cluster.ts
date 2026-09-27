import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * dungeon/dressing/crystal-cluster — a cluster of five teal crystal spikes on a rock base.
 *
 * Role: small dungeon dressing prop; angular accent against the rounded stone kit. Must read
 *   at 128 px as a teal Spike silhouette on a dark rock foot.
 * Size: tallest tip at y = 0.45, rock foot about 0.38 wide, stands on y = 0, faces +Z.
 * The one idea: five hexagonal quartz spikes leaning outward from a slate foot, glowing
 *   soft teal in the dark.
 * Shape language: triangular/spiky dominant (dangerous, magical), chunky square foot secondary.
 * Palette: crystal deep teal #1f6a5e (dark base), teal #3fae9a (mid, emissive), pale tip
 *   #a8dccf (light); rock mid blue-gray #4a5d75, grout slate #2a3547, worn top #7a8ba0.
 *   Value plan: dark rock foot, glowing mid-teal spikes, palest at the tips (focal point).
 * Materials: crystal (roughness 0.1, flat: true, emissive #3fae9a at 0.4),
 *   rock (stone, roughness 0.9, grain bump).
 * Detail list: five hex-prism spikes with pyramid tips (big), outward lean rhythm tall to
 *   small (medium), vertical value gradient + teal glow painted on the rock (small).
 * Rig/animation: none.
 */

const TEAL_DEEP = rgb('#1e5a50');
const TEAL = rgb('#3fae9a');
const TEAL_PALE = rgb('#a8dccf');
const ROCK = rgb('#4a5d75');
const SLATE = rgb('#2a3547');
const PALE = rgb('#7a8ba0');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

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

interface Spike {
  r: number; // hex radius
  shaft: number; // prism top height (local, base at 0)
  apex: number; // tip height (local)
  tiltX: number; // lean in degrees
  tiltZ: number;
  rot: number; // hex rotation in degrees
  apexOff: [number, number]; // apex x/z offset for a natural point
  at: [number, number]; // foot x/z on the rock
  sink: number; // how deep the foot sits
}

/** One hexagonal quartz spike: hex prism cut into a pyramid tip by six planes. */
function spike(s: Spike): Sdf {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const a = ((s.rot + i * 60) * Math.PI) / 180;
    pts.push([s.r * Math.cos(a), s.r * Math.sin(a)]);
  }
  // Hexagon in XY, extruded along Z, then stood up so the shaft runs 0..shaft along Y.
  const prism = sdf.extrude(profile.polygon(pts), s.shaft).rotateX(90).at(0, s.shaft / 2, 0);

  // Pyramid tip: the solid shared by six planes (each through the apex and one rim
  // edge) above the shaft top, unioned onto the prism.
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

const SPIKES: Spike[] = [
  // Tallest spike: near-vertical, tip at 0.45.
  { r: 0.055, shaft: 0.32, apex: 0.45, tiltX: 3, tiltZ: -3, rot: 8, apexOff: [0.006, 0.0], at: [0.0, 0.0], sink: 0.02 },
  // Left-front companion leaning out.
  { r: 0.044, shaft: 0.23, apex: 0.33, tiltX: -6, tiltZ: 8, rot: 30, apexOff: [-0.005, 0.004], at: [-0.1, 0.03], sink: 0.02 },
  // Right companion leaning out.
  { r: 0.04, shaft: 0.19, apex: 0.28, tiltX: 3, tiltZ: -9, rot: 52, apexOff: [0.004, -0.004], at: [0.1, -0.02], sink: 0.02 },
  // Back spike leaning away.
  { r: 0.036, shaft: 0.17, apex: 0.25, tiltX: 9, tiltZ: 2, rot: 20, apexOff: [0.0, -0.005], at: [-0.02, -0.1], sink: 0.02 },
  // Small front bud leaning forward.
  { r: 0.03, shaft: 0.13, apex: 0.21, tiltX: -10, tiltZ: -4, rot: 44, apexOff: [0.003, 0.003], at: [0.06, 0.1], sink: 0.02 },
];

export default defineAsset({
  name: 'crystal-cluster',
  description:
    'Cluster of five teal crystal spikes on a slate rock base, tallest tip 0.45 m; faceted flat-shaded glow.',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ crystals
    const gems = sdf.union(...SPIKES.map(spike));
    const gemPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      // Dark root fading to pale tips; slight per-face variation from angular noise.
      const t = clamp01(y / 0.45);
      let c = mixRgb(TEAL_DEEP, base, clamp01(0.15 + t * 1.1));
      c = mixRgb(c, TEAL_PALE, clamp01((t - 0.55) / 0.45) * 0.75);
      const face = noise.fbm(x * 40 + 7, y * 6, z * 40, 2, 3);
      c = mixRgb(c, TEAL_DEEP, clamp01(-face) * 0.25);
      return c;
    };
    k.body('crystal', gems.paintFn(gemPaint), {
      color: TEAL,
      roughness: 0.1,
      metalness: 0,
      emissive: '#3fae9a',
      emissiveIntensity: 0.4,
      flat: true,
      detail: 0.01,
      maxTriangles: 1800,
      paintWeight: 2,
    });

    // ------------------------------------------------------------------ rock base
    // Chunky slate foot the spikes grow out of, in the wall-kit stone language:
    // faceted planar cuts with soft edges, dark crevices, pale worn top.
    const footMass = sdf
      .ellipsoid([0.17, 0.085, 0.15])
      .at(0, 0.05, 0)
      .smoothUnion(0.03, sdf.ellipsoid([0.1, 0.055, 0.09]).at(0.11, 0.032, 0.05))
      .smoothUnion(0.03, sdf.ellipsoid([0.09, 0.05, 0.08]).at(-0.11, 0.028, -0.04))
      .displace(0.007, (x, y, z) => noise.fbm(x * 9, y * 9, z * 9, 3, 4));
    const foot = footMass
      .smoothIntersect(0.015, sdf.halfSpace([0, 1, 0], 0.105))
      .smoothIntersect(0.02, sdf.halfSpace(norm([0.8, 0.5, 0.35]), 0.13))
      .smoothIntersect(0.02, sdf.halfSpace(norm([-0.75, 0.55, -0.3]), 0.125))
      .round(0.008)
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const footPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const t = clamp01(y / 0.12);
      let c = mixRgb(SLATE, base, clamp01(0.3 + t * 0.7));
      c = mixRgb(c, PALE, clamp01((t - 0.6) / 0.4) * 0.5);
      const patch = noise.fbm(x * 6, y * 6, z * 6, 3, 2);
      c = mixRgb(c, SLATE, clamp01(-patch) * 0.35);
      // Soft teal glow spilling from the crystals onto the stone.
      const d = Math.hypot(x, z);
      const glow = clamp01(1 - d / 0.22) * clamp01((y - 0.02) / 0.08);
      c = mixRgb(c, TEAL, glow * 0.35);
      return c;
    };
    k.body('rock', foot.paintFn(footPaint), {
      color: ROCK,
      roughness: 0.9,
      metalness: 0,
      detail: 0.012,
      maxTriangles: 1200,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 30, y * 30, z * 30, 3, 7),
    });
  },
});
