import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * world/props/magic-crystal — five angular purple crystal spires on a small rock base.
 *
 * Role: dungeon landmark / interactable for the Sunken Vault; the visual hook in the room,
 *   readable at 128 px as five glowing purple spires on a dark stone foot.
 * Size: tallest tip at y ≈ 0.9 m, cluster about 0.5 m wide, stands on y = 0, faces +Z.
 * The one idea: five glowing magic crystals thrust up from a dark rock base, the tallest
 *   spire straight and central, the four companions leaning outward, each brightening from
 *   a deep purple root to a pale violet tip. A handful of small shards lie around the foot.
 * Shape language: triangular/spiky dominant (magical/dangerous), chunky stone foot secondary.
 * Palette: deep violet root #1a0c3a, mid purple body #7a4ae0, near-white tip #dcc6ff,
 *   emissive glow #b58aff at 1.5; rock cool gray #6f7680 / dark #4b525c.
 *   Value plan: dark rock base, dark crystal roots (so the glow reads), mid violet bodies,
 *   palest tips (focal point).
 * Materials: crystal (roughness 0.1, flat: true, emissive #b58aff, emissiveIntensity 1.5,
 *   dark base color #1a0c3a), stone (roughness 0.9, grain bump).
 * Detail list: five hex-prism spires with pyramid tips (big), outward lean rhythm tall to
 *   small (medium), vertical value gradient + violet glow paint (small), small shards on
 *   the rock (medium). Focal point: the tall centre spire's pale tip.
 * Rig/animation: none.
 */

const VIOLET_DEEP = rgb('#1a0c3a');
const VIOLET = rgb('#7a4ae0');
const VIOLET_PALE = rgb('#dcc6ff');
const GLOW = rgb('#b58aff');
const STONE = rgb('#6f7680');
const STONE_DARK = rgb('#4b525c');
const STONE_PALE = rgb('#a8acb1');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
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
  at: [number, number]; // foot x/z on the rock
  sink: number; // how deep the foot sits
}

/** One hexagonal crystal spire: hex prism cut into a pyramid tip by six planes. */
function spire(s: Spire): Sdf {
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

// Five spires: tallest central, four companions leaning outward.
// Heights were sized so the tallest tip reaches y ≈ 0.9 (rock foot tops around y ≈ 0.13).
// Hex radius kept fat enough that the prism midsection reads, not just a blade.
const SPIRES: Spire[] = [
  // Tallest centre spire: near-vertical, tip at 0.9 m, hex prism dominates the body.
  { r: 0.15, shaft: 0.7, apex: 0.9, tiltX: 2, tiltZ: -1, rot: 4, apexOff: [0.008, 0.0], at: [0.0, 0.0], sink: 0.02 },
  // Left-front companion leaning out.
  { r: 0.11, shaft: 0.45, apex: 0.6, tiltX: -4, tiltZ: 11, rot: 30, apexOff: [-0.006, 0.004], at: [-0.21, 0.04], sink: 0.02 },
  // Right companion leaning out.
  { r: 0.105, shaft: 0.4, apex: 0.55, tiltX: 3, tiltZ: -13, rot: 52, apexOff: [0.004, -0.004], at: [0.21, -0.04], sink: 0.02 },
  // Back spike leaning away.
  { r: 0.09, shaft: 0.32, apex: 0.46, tiltX: 13, tiltZ: 3, rot: 20, apexOff: [0.0, -0.006], at: [-0.05, -0.19], sink: 0.02 },
  // Small front bud leaning forward.
  { r: 0.072, shaft: 0.25, apex: 0.38, tiltX: -13, tiltZ: -5, rot: 44, apexOff: [0.004, 0.004], at: [0.13, 0.18], sink: 0.02 },
];

// Small shards lying around the base for texture — kept short so they stay readable.
const SHARDS: Spire[] = [
  { r: 0.026, shaft: 0.04, apex: 0.11, tiltX: 6, tiltZ: 22, rot: 14, apexOff: [0, 0], at: [-0.31, 0.24], sink: 0.01 },
  { r: 0.022, shaft: 0.035, apex: 0.1, tiltX: -8, tiltZ: -18, rot: 44, apexOff: [0, 0], at: [0.32, 0.22], sink: 0.01 },
  { r: 0.02, shaft: 0.03, apex: 0.09, tiltX: 4, tiltZ: 30, rot: 22, apexOff: [0, 0], at: [0.28, -0.26], sink: 0.01 },
  { r: 0.024, shaft: 0.035, apex: 0.1, tiltX: -5, tiltZ: -25, rot: 60, apexOff: [0, 0], at: [-0.31, -0.22], sink: 0.01 },
];

export default defineAsset({
  name: 'magic-crystal',
  description:
    'Cluster of five glowing purple crystal spires with small shards on a dark stone base; tallest 0.9 m.',
  detail: 0.008,
  reference: 'docs/item-mockups/magic-crystal-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ crystals
    const crystals = sdf.union(...SPIRES.map(spire), ...SHARDS.map(spire));

    const crystalPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      // Strong three-stop gradient against a dark base color so the value range is wide.
      const t = clamp01(y / 0.9);
      // Start from very dark at the root, ramp to mid violet across the body.
      let c = mixRgb(VIOLET_DEEP, VIOLET, smoothstep(0.05, 0.65, t));
      // Bright pale tip in the upper third (focal point).
      c = mixRgb(c, VIOLET_PALE, smoothstep(0.55, 1.0, t) * 0.9);
      // Slight per-face variation so the facets read as separate planes.
      const face = noise.fbm(x * 40 + 7, y * 6, z * 40, 2, 3);
      c = mixRgb(c, VIOLET_DEEP, clamp01(-face) * 0.35);
      // Soft inner core bands — adds depth to the glow.
      const band = 0.5 + 0.5 * noise.fbm(x * 8, y * 4, z * 8, 2, 17);
      c = mixRgb(c, VIOLET_PALE, clamp01(band - 0.6) * 0.28);
      // Dark contact shading near the base of each spire (where it meets the rock).
      const proximity = clamp01(1 - y / 0.18);
      c = mixRgb(c, VIOLET_DEEP, proximity * 0.55);
      return c;
    };
    k.body('crystal', crystals.paintFn(crystalPaint), {
      color: VIOLET_DEEP,
      roughness: 0.1,
      metalness: 0,
      emissive: GLOW,
      emissiveIntensity: 1.5,
      flat: true,
      detail: 0.01,
      maxTriangles: 2200,
      paintWeight: 3,
    });

    // ------------------------------------------------------------------ rock base
    // A chunky low stone foot the spires rise from: one dominant lump with two side
    // shoulders, all flat-bottomed and softly faceted.
    const footMass = sdf
      .ellipsoid([0.27, 0.13, 0.22])
      .at(0, 0.085, 0)
      .smoothUnion(0.04, sdf.ellipsoid([0.15, 0.085, 0.13]).at(0.2, 0.055, 0.08))
      .smoothUnion(0.04, sdf.ellipsoid([0.14, 0.075, 0.12]).at(-0.2, 0.05, -0.06))
      .smoothUnion(0.03, sdf.ellipsoid([0.12, 0.065, 0.1]).at(0.05, 0.05, -0.2))
      .smoothUnion(0.03, sdf.ellipsoid([0.12, 0.07, 0.1]).at(-0.07, 0.055, 0.21))
      .displace(0.008, (x, y, z) => noise.fbm(x * 8, y * 8, z * 8, 3, 4));

    const foot = footMass
      .smoothIntersect(0.015, sdf.halfSpace([0, 1, 0], 0.135))
      .smoothIntersect(0.02, sdf.halfSpace(norm([0.8, 0.5, 0.35]), 0.17))
      .smoothIntersect(0.02, sdf.halfSpace(norm([-0.75, 0.55, -0.3]), 0.16))
      .round(0.008)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const footPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const t = clamp01(y / 0.15);
      let c = mixRgb(STONE_DARK, base, clamp01(0.32 + t * 0.68));
      c = mixRgb(c, STONE_PALE, clamp01((t - 0.6) / 0.4) * 0.45);
      const patch = noise.fbm(x * 6, y * 6, z * 6, 3, 2);
      c = mixRgb(c, STONE_DARK, clamp01(-patch) * 0.35);
      // Soft violet glow spilling from the crystals onto the stone near their roots.
      const d = Math.hypot(x, z);
      const glow = clamp01(1 - d / 0.28) * clamp01((y - 0.01) / 0.1);
      c = mixRgb(c, VIOLET, glow * 0.45);
      return c;
    };
    k.body('rock', foot.paintFn(footPaint), {
      color: STONE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.012,
      maxTriangles: 1400,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 30, y * 30, z * 30, 3, 7),
    });
  },
});