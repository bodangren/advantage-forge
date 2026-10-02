import { defineAsset, rgb, mixRgb, sdf } from '../src/index.js';

/**
 * Modular volcanic ash ground tile: 2 m square, 0.3 m slab, top at y = 0.
 * Role: floor tile for a volcanic map. One idea: dark charcoal ash with lighter basalt patches
 * and a few ember flecks. Palette: base #2c2a2e, patch #403c42, ember #e0561a, pebble #1e1c20.
 * Materials: one matte ash body, one pebble body. All patterns are periodic (period 2 m)
 * so the tile chains with no seams.
 */
const SLAB = 0.3;
const TAU = Math.PI; // sin(PI * n * x) has period 2/n, so integer n wraps across 2 m

/** Periodic field in [-1, 1] that wraps every 2 m in x and z. */
function field(x: number, z: number, s: number): number {
  let v = 0;
  for (let i = 1; i <= 3; i++) {
    const a = i * 2 + (s % 3);
    const b = i * 2 + 1 + ((s + 1) % 2);
    v += Math.sin(TAU * a * x + s * 1.7 + i) * Math.sin(TAU * b * z + s * 2.3 + i * 2) / i;
  }
  return v / 1.8;
}

const EMBERS: Array<[number, number]> = [
  [-0.6, -0.5], [0.4, 0.62], [-0.2, 0.15], [0.7, -0.3], [-0.8, 0.6], [0.1, -0.8],
];
const PEBBLES: Array<[number, number, number]> = [
  [-0.45, 0.4, 0.03], [0.55, -0.6, 0.025], [0.25, 0.2, 0.02], [-0.7, -0.75, 0.022], [0.8, 0.7, 0.026],
];

export default defineAsset({
  name: 'ash-ground',
  description: 'Modular 2 m volcanic ash ground tile, 0.3 m slab, top at y = 0, wrapping pattern.',
  detail: 0.012,
  build(k) {
    const base = rgb('#2c2a2e');
    const light = rgb('#403c42');
    const ember = rgb('#e0561a');
    const slab = sdf.box([2, SLAB, 2]).at(0, -SLAB / 2, 0);
    const color = (x: number, y: number, z: number) => {
      if (y < -0.02) return mixRgb(base, rgb('#1e1c20'), Math.min(1, -y / SLAB));
      const p = Math.max(0, Math.min(1, 0.5 + field(x, z, 1) * 1.2));
      let c = mixRgb(base, light, p * 0.9);
      for (const [ex, ez] of EMBERS) {
        const d = Math.hypot(x - ex, z - ez);
        if (d < 0.025) c = mixRgb(c, ember, 1 - d / 0.025);
      }
      return c;
    };
    const bump = (x: number, y: number, z: number) =>
      y < -0.01 ? 0 : 0.6 * field(x, z, 2) + 0.5 * field(x * 3, z * 3, 4) + 0.3 * field(x * 7, z * 7, 5);
    k.body('ash', slab.paintFn(color), { color: '#2c2a2e', roughness: 0.95, metalness: 0, bump, detail: 0.006, maxTriangles: 12000 });
    const pebbles = sdf
      .union(...PEBBLES.map(([px, pz, r]) => sdf.sphere(r).scale([1, 0.6, 1]).at(px, r * 0.3, pz)))
      .paint(rgb('#1e1c20'));
    k.body('pebbles', pebbles, { color: '#1e1c20', roughness: 0.9, metalness: 0 });
  },
});
