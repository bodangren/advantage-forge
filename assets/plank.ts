import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Vec3 } from '../src/index.js';

/**
 * Design note — plank stack (catalog `items/crafting/plank`): three pale sawn boards, 0.5 x 0.04 x 0.16 each, stacked with offsets, no bark; dark knots, painted grain.
 *
 * Role: a placeable forest-floor prop; reads at 128 px and sits beside the hamlet set.
 * Size: 1.2 m long along X, 0.3 m thick (radius 0.15), stands on y = 0, faces +Z.
 * One idea: a stubby chunky log cut square at both ends — a rough warm-brown bark tube
 *   framed by two pale, ringed cut faces, with a small green moss patch on the sunny top.
 * Shape language: round dominant (tube, soft bevels, gentle lumps), a few triangular
 *   branch knobs break the pure cylinder silhouette.
 * Palette (contract): bark #8a5a35, dark bark #5f3d22, deep #3d2717, sunlit #a8763f,
 *   crown #c99a58; pale cut wood #d2ab72, ring #a87d4b, heart #c9a06a;
 *   moss #4a8a3f / #356b2f / #6fae4a.
 * Value plan: mid bark body, dark ground shadow, bright pale cut faces (focal), small
 *   green moss accent on top.
 * Materials: bark + cut wood (one wood body, roughness 0.82, metalness 0, groove and
 *   grain relief baked in `bump`), moss (roughness 0.9).
 * Detail list: tube + end cuts (primary), branch knobs (secondary), moss patch (accent),
 *   bark furrows + growth rings in `bump` (tertiary). Focal point: the pale cut face.
 * Rig/animation: none (static prop).
 */

const PALE = rgb('#dcb078');
const GRAIN = rgb('#b08a50');
const KNOT = rgb('#5a3a1e');
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

// Boards: [x offset, z offset, yaw deg, knot x positions]
const BOARDS: { dx: number; dz: number; yaw: number; knots: [number, number][] }[] = [
  { dx: 0, dz: 0, yaw: 0, knots: [[-0.12, -0.03], [0.14, 0.04]] },
  { dx: 0.03, dz: 0.012, yaw: 4, knots: [[0.08, -0.04], [-0.15, 0.03]] },
  { dx: -0.025, dz: -0.01, yaw: -3, knots: [[-0.05, 0.045], [0.16, -0.03]] },
];
const T = 0.04;

const boardShape = (i: number) => {
  const b = BOARDS[i];
  return sdf
    .box([0.5, T, 0.16], 0.008)
    .rotateY(b.yaw)
    .at(b.dx, T / 2 + T * i, b.dz);
};

const paintBoard = (i: number) => (x: number, y: number, z: number, base: Rgb): Rgb => {
  const b = BOARDS[i];
  const lx = x - b.dx;
  const lz = z - b.dz;
  let c = mixRgb(PALE, base, 0);
  const w = noise.fbm(lx * 3, 0, lz * 4, 2, 5) * 0.012;
  const line = Math.pow(0.5 + 0.5 * Math.cos((lz + w) * 120 + i * 2), 6);
  c = mixRgb(c, GRAIN, line * 0.75);
  for (const [kx, kz] of b.knots) {
    const d = Math.hypot((lx - kx) * 0.8, lz - kz);
    c = mixRgb(c, GRAIN, clamp01((0.036 - d) / 0.012) * 0.8);
    c = mixRgb(c, KNOT, clamp01((0.02 - d) / 0.008));
  }
  return c;
};

export default defineAsset({
  name: 'plank',
  description: 'Stack of three pale sawn boards with painted grain lines and two dark knots each.',
  reference: 'docs/item-mockups/plank-mock.jpg',
  detail: 0.005,
  texture: { size: 1024 },

  build(k) {
    for (let i = 0; i < 3; i++) {
      k.body(`board-${i}`, boardShape(i).paintFn(paintBoard(i)), {
        color: '#dcb078',
        roughness: 0.8,
        metalness: 0,
        detail: 0.004,
        maxTriangles: 1250,
        textureDensity: 2,
        bump: (x, y, z) => 0.0012 * noise.fbm(x * 8, y * 60, z * 60, 2, 3),
      });
    }
  },
});
