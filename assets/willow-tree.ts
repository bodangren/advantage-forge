import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';
import type { Sdf } from '../src/index.js';

/**
 * Weeping willow — Chibi Quest nature prop (catalog `nature/trees/willow-tree`):
 * 3.2 m tall, standing on y = 0, facing +Z.
 *
 * Role: forest-clearing tree. The silhouette must read at 128 px.
 * One idea: a thick bent trunk under a round crown whose leafy strands
 *   hang almost to the ground.
 * Shape language: round and chunky, with long vertical drapes as the break.
 * Palette: sunlit leaf #8fd14f, leaf #5cb85c, underside #3f9248, shadow #2f6b38,
 *   bark #8a5a35, groove #5f3d22, flare #c49a62.
 * Materials: bark trunk (roughness 0.88), foliage crown and strands (roughness 0.74).
 * Detail: bent trunk and flared roots, nine scalloped clumps, drooping leaf stacks.
 *   Focal point: the light hanging curtain.
 * Rig: none. Animation: none.
 */

const bark = rgb('#8a5a35');
const barkLight = rgb('#c49a62');
const barkDark = rgb('#5f3d22');
const moss = rgb('#4a9a4f');
const leafDark = rgb('#3f9248');
const leafShadow = rgb('#2f6b38');
const leaf = rgb('#5cb85c');
const leafLight = rgb('#8fd14f');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

interface Clump {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly r: number;
}

// One dominant mass, satellites pulled apart so each clump stays a separate lump.
const clumps: readonly Clump[] = [
  { x: 0.0, y: 2.42, z: 0.0, r: 0.58 },
  { x: -0.74, y: 2.24, z: 0.08, r: 0.46 },
  { x: 0.76, y: 2.28, z: -0.04, r: 0.44 },
  { x: 0.04, y: 2.18, z: 0.7, r: 0.4 },
  { x: -0.06, y: 2.22, z: -0.68, r: 0.38 },
  { x: 0.18, y: 2.86, z: 0.08, r: 0.39 },
  { x: -0.32, y: 2.8, z: -0.1, r: 0.32 },
  { x: 0.46, y: 2.52, z: 0.42, r: 0.34 },
  { x: -0.44, y: 2.5, z: -0.4, r: 0.32 },
];

/** One leaf clump: a squashed blob plus a low ring of three lobes. */
function clumpShape(c: Clump, i: number): Sdf {
  const main = sdf.ellipsoid([c.r * 1.08, c.r * 0.86, c.r * 1.04]).at(c.x, c.y, c.z);
  const lobes: Sdf[] = [];
  for (let j = 0; j < 3; j++) {
    const a = (j / 3) * Math.PI * 2 + noise.random(i, j, 1) * 1.4 + i * 0.8;
    const lr = c.r * (0.4 + 0.1 * noise.random(i, j, 7));
    lobes.push(
      sdf.ellipsoid([lr * 1.05, lr * 0.78, lr]).at(
        c.x + Math.cos(a) * c.r * 0.82,
        c.y - c.r * 0.32 + (noise.random(i, j, 13) - 0.5) * c.r * 0.16,
        c.z + Math.sin(a) * c.r * 0.82,
      ),
    );
  }
  return sdf.smoothUnion(0.04, main, ...lobes);
}

function nearestClump(x: number, y: number, z: number): Clump {
  let best = clumps[0]!;
  let bestD = Infinity;
  for (const c of clumps) {
    const d = (x - c.x) ** 2 + (y - c.y) ** 2 + (z - c.z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

interface Drape {
  /** Radians. 0 is +X. pi/2 is +Z (front). */
  readonly angle: number;
  readonly reach: number;
  readonly top: number;
  readonly tip: number;
  readonly wide: number;
  readonly thick: number;
  readonly sway: number;
  readonly leaves: number;
}

// Paired curtains. They share one radius so the leaves stack and stay joined.
const drapes: readonly Drape[] = [
  { angle: 0.18, reach: 0.78, top: 2.02, tip: 0.4, wide: 0.15, thick: 0.1, sway: 0.02, leaves: 4 },
  { angle: 0.5, reach: 0.7, top: 1.92, tip: 0.62, wide: 0.13, thick: 0.09, sway: -0.02, leaves: 3 },
  { angle: 1.25, reach: 0.72, top: 1.88, tip: 0.85, wide: 0.12, thick: 0.088, sway: 0.02, leaves: 3 },
  { angle: 2.15, reach: 0.8, top: 2.04, tip: 0.36, wide: 0.155, thick: 0.1, sway: 0.02, leaves: 4 },
  { angle: 2.48, reach: 0.7, top: 1.9, tip: 0.58, wide: 0.13, thick: 0.09, sway: -0.02, leaves: 3 },
  { angle: 3.45, reach: 0.76, top: 2.0, tip: 0.42, wide: 0.145, thick: 0.096, sway: 0.02, leaves: 4 },
  { angle: 3.82, reach: 0.68, top: 1.88, tip: 0.7, wide: 0.12, thick: 0.086, sway: -0.02, leaves: 3 },
  { angle: 4.7, reach: 0.78, top: 2.02, tip: 0.38, wide: 0.15, thick: 0.1, sway: 0.02, leaves: 4 },
  { angle: 5.08, reach: 0.68, top: 1.9, tip: 0.64, wide: 0.125, thick: 0.09, sway: -0.02, leaves: 3 },
];

/**
 * One curtain. Leaves share a vertical axis and overlap, so the strand cannot split.
 * The top leaf reaches into the crown.
 */
function drapeShape(s: Drape, i: number): Sdf {
  const ux = Math.cos(s.angle);
  const uz = Math.sin(s.angle);
  const lx = -uz;
  const lz = ux;
  const yaw = (s.angle * 180) / Math.PI;
  const n = s.leaves;
  const yTop = s.top;
  const yBot = Math.max(s.tip, 0.38);
  const spacing = (yTop - yBot) / Math.max(1, n - 1);
  const ry = spacing * 0.62;
  const leaves: Sdf[] = [];
  for (let j = 0; j < n; j++) {
    const t = n === 1 ? 0 : j / (n - 1);
    const shrink = 1 - t * 0.12;
    const y = yTop + (yBot - yTop) * t;
    const zig = (j % 2 === 0 ? 1 : -1) * 0.02 * noise.random(i, j, 3);
    const x = ux * s.reach + lx * zig;
    const z = uz * s.reach + lz * zig;
    leaves.push(
      sdf
        .ellipsoid([s.thick * shrink, ry, s.wide * shrink])
        .rotateY(-yaw)
        .at(x, y, z),
    );
  }
  return sdf.smoothUnion(0.022, ...leaves);
}

export default defineAsset({
  name: 'willow-tree',
  description: 'Stylized weeping willow, 3.2 m tall: bent trunk, clumped crown, leafy strands to the ground.',
  detail: 0.02,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/willow-tree-mock.jpg',

  build(k) {
    // ------------------------------------------------------------------ bark
    // Thick trunk that leans out, then returns under the crown.
    const trunk = sdf.chain(
      [
        [0.0, -0.02, 0.0, 0.32],
        [0.06, 0.36, 0.04, 0.26],
        [0.2, 0.78, 0.12, 0.2],
        [0.1, 1.18, 0.05, 0.16],
        [0.02, 1.55, 0.01, 0.13],
        [0.0, 1.98, 0.0, 0.1],
      ],
      0.09,
    );
    const roots = sdf.union(
      ...Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
        const len = 0.44 + noise.random(i, 5, 2) * 0.12;
        return sdf.cone([0.02, 0.4, 0.02], [Math.cos(a) * len, 0.025, Math.sin(a) * len], 0.24, 0.085);
      }),
    );
    const ridges = (x: number, y: number, z: number): number => noise.fbm(x * 9, y * 2.4, z * 9, 3, 41);
    const wood = sdf
      .smoothUnion(0.09, trunk, roots)
      .displace(0.008, (x, y, z) => noise.fbm(x * 5, y * 1.8, z * 5, 2, 31))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z) => {
        const groove = Math.max(0, -ridges(x, y, z));
        const base = mixRgb(bark, barkDark, Math.min(1, groove * 1.6));
        const flare = clamp01(1 - y / 0.7) * (0.4 + 0.4 * noise.fbm(x * 3, y * 3, z * 3, 2, 9));
        const lit = mixRgb(base, barkLight, flare * 0.75);
        const damp = clamp01(-z * 1.3) * clamp01(1 - y / 0.65) * (0.35 + 0.4 * noise.fbm(x * 5, y * 5, z * 5, 2, 17));
        return mixRgb(lit, moss, damp * 0.5);
      });
    k.body('trunk', wood, {
      color: '#8a5a35',
      roughness: 0.88,
      detail: 0.042,
      paintWeight: 2,
      bump: (x, y, z) => 0.005 * ridges(x, y, z),
    });

    // ------------------------------------------------------------------ foliage
    const crown = sdf.smoothUnion(0.085, ...clumps.map(clumpShape));
    // Dark leafy mass under the dome, so strands grow out of foliage, not a bare neck.
    const shade = sdf.smoothUnion(
      0.08,
      sdf.ellipsoid([0.82, 0.4, 0.74]).at(0.0, 2.02, 0.0),
      sdf.ellipsoid([0.36, 0.26, 0.32]).at(-0.3, 1.8, -0.14),
      sdf.ellipsoid([0.34, 0.24, 0.3]).at(0.32, 1.82, 0.16),
    );
    const curtain = sdf.smoothUnion(0.05, ...drapes.map(drapeShape));
    const foliage = sdf
      .smoothUnion(0.08, crown, shade, curtain)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z) => {
        const c = nearestClump(x, y, z);
        const local = clamp01(((y - c.y) / c.r) * 0.6 + 0.45);
        const global = clamp01((y - 1.75) / 1.45);
        const patch = 0.5 + 0.5 * noise.fbm(x * 2.2, y * 2.2, z * 2.2, 2, 21);
        const wob = 0.08 * noise.fbm(x * 1.6, y * 1.6, z * 1.6, 2, 33);
        const band = smoothstep(0.26, 0.76, local + wob);
        const base = mixRgb(leafDark, leaf, band * (0.84 + 0.16 * patch));
        const under = smoothstep(0.42, 0.02, local);
        const shaded = mixRgb(base, leafShadow, under * 0.92);
        const top = smoothstep(0.55, 0.92, local);
        const lift = top * (0.45 + 0.55 * global) * (0.45 + 0.55 * patch);
        const lit = mixRgb(shaded, leafLight, Math.min(1, lift * 1.15));
        // Outer strands lighten toward the tip. The inner mass stays dark.
        const radial = Math.hypot(x, z);
        const hang = smoothstep(2.05, 1.6, y) * smoothstep(0.42, 0.68, radial);
        const tip = clamp01((1.55 - y) / 1.3);
        const seg = 0.5 + 0.5 * Math.sin(y * 15 + radial * 4);
        let drape = mixRgb(leaf, leafLight, 0.4 + seg * 0.5 + tip * 0.1);
        drape = mixRgb(drape, leafDark, (1 - seg) * 0.2);
        const n = noise.fbm(x * 1.3, y * 1.3, z * 1.3, 2, 7);
        const crowned = n >= 0 ? mixRgb(lit, leafLight, n * 0.1) : mixRgb(lit, leafShadow, -n * 0.14);
        return mixRgb(crowned, drape, hang);
      });
    k.body('foliage', foliage, {
      color: '#5cb85c',
      roughness: 0.74,
      detail: 0.044,
      paintWeight: 3,
      maxError: 0.0075,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 12, y * 12, z * 12, 2, 3),
    });
  },
});
