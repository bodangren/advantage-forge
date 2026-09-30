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
 * Detail: bent trunk and flared roots, one scalloped dome of 24 small clumps (#a9d95a top to
 *   #3f9248 underside), 14 slim tapered fronds with leaf pairs. Focal point: the frond curtain.
 * Rig: none. Animation: none.
 */

const bark = rgb('#8a5a35');
const barkLight = rgb('#c49a62');
const barkDark = rgb('#5f3d22');
const moss = rgb('#4a9a4f');
const leafDark = rgb('#3f9248');
const leaf = rgb('#5cb85c');
const leafLight = rgb('#8fd14f');
const sunlit = rgb('#a9d95a');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Crown clumps: 24 small ellipsoids scattered over a dome (Fibonacci spiral, upper hemisphere). */
const CROWN_C = { x: 0, y: 2.3, z: 0, r: 1.1 };
function crownClumps(): Sdf[] {
  const out: Sdf[] = [];
  const n = 24;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const cy = 1 - t * 1.5; // 1 .. -0.5 : from the pole down past the rim
    const rad = Math.sqrt(1 - cy * cy);
    const a = i * 2.39996 + 0.4;
    const jit = 0.9 + 0.12 * noise.random(i, 2, 5);
    const R = CROWN_C.r * 0.82 * jit;
    out.push(
      sdf
        .ellipsoid([0.32, 0.22, 0.28])
        .rotateY(-(a * 180) / Math.PI)
        .at(Math.cos(a) * rad * R, CROWN_C.y + cy * R * 0.85, Math.sin(a) * rad * R),
    );
  }
  return out;
}

/** One frond: a tapered cone with three small leaf ellipsoids along it. */
function frondShape(i: number, n: number): Sdf {
  const a = (i / n) * Math.PI * 2 + 0.2;
  const ux = Math.cos(a);
  const uz = Math.sin(a);
  const len = 0.9 + 0.5 * noise.random(i, 4, 8);
  const r0 = 0.8;
  const top = 1.95;
  const lean = Math.tan((6 * Math.PI) / 180) * len;
  const p0: [number, number, number] = [ux * r0, top, uz * r0];
  const p1: [number, number, number] = [ux * (r0 + lean), top - len, uz * (r0 + lean)];
  const parts: Sdf[] = [sdf.cone(p0, p1, 0.06, 0.02)];
  const yaw = -(a * 180) / Math.PI;
  for (let j = 1; j <= 3; j++) {
    const t = j / 4;
    const rr = r0 + lean * t;
    const side = j % 2 === 0 ? 1 : -1;
    parts.push(
      sdf
        .ellipsoid([0.05, 0.09, 0.03])
        .rotateY(yaw)
        .at(ux * rr - uz * side * 0.03, top - len * t, uz * rr + ux * side * 0.03),
    );
  }
  return sdf.smoothUnion(0.015, ...parts);
}

export default defineAsset({
  name: 'willow-tree',
  description: 'Stylized weeping willow, 3.2 m tall: bent trunk, clumped crown, leafy strands to the ground.',
  detail: 0.03,
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
    const core = sdf.ellipsoid([0.85, 0.6, 0.85]).at(0, 2.3, 0);
    const dome = sdf
      .smoothUnion(0.06, core, ...crownClumps())
      .displace(0.03, (x, y, z) => noise.fbm(x * 3, y * 3, z * 3, 2, 11))
      .intersect(sdf.halfSpace([0, -1, 0], -1.75));
    const crownPaint = dome.paintFn((x, y) => {
      const t = clamp01((y - 1.75) / 1.0);
      const mid = mixRgb(leafDark, leaf, smoothstep(0.0, 0.35, t));
      return mixRgb(mid, sunlit, smoothstep(0.45, 0.95, t));
    });
    k.body('crown', crownPaint, {
      color: '#5cb85c',
      roughness: 0.74,
      detail: 0.045,
      maxTriangles: 4800,
      paintWeight: 3,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 12, y * 12, z * 12, 2, 3),
    });
    const nF = 14;
    const fronds = sdf
      .union(...Array.from({ length: nF }, (_, i) => frondShape(i, nF)))
      .paintFn((x, y) => mixRgb(leaf, leafLight, smoothstep(0.7, 1.85, y)));
    k.body('fronds', fronds, {
      color: '#8fd14f',
      roughness: 0.74,
      detail: 0.022,
      maxTriangles: 4200,
      paintWeight: 3,
    });
  },
});
