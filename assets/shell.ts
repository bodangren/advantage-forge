import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * Design note - scallop shell (catalog `items/crafting/shell`).
 * Role: crafting pickup icon. Size: 0.25 m wide, 0.14 m tall, stands on y = 0, faces +Z.
 * One idea: a chunky fan with bold radial ridges and a hinge knob.
 * Shape language: round with soft ridges. Palette: peach #f4d8c0, groove #e0a890.
 * Materials: one shell body (roughness 0.45). Focal point: the ridge fan.
 */
const PEACH = rgb('#f4d8c0');
const GROOVE = rgb('#e0a890');
const RIDGES = [-63, -45, -27, -9, 9, 27, 45, 63];
const R = 0.12;
const zAt = (s: number): number => 0.03 * Math.sqrt(Math.max(0, 1 - (s / R) ** 2));

export default defineAsset({
  name: 'shell',
  description: 'Upright scallop shell with eight radial ridges and a hinge knob.',
  reference: 'docs/item-mockups/shell-mock.jpg',
  detail: 0.004,
  texture: { size: 1024 },
  build(k) {
    let body = sdf
      .ellipsoid([R, R, 0.03])
      .intersect(sdf.box([0.4, 0.13, 0.2]).at(0, 0.065, 0));
    for (const a of RIDGES) {
      const r = (a * Math.PI) / 180;
      const p = (s: number): [number, number, number, number] => [
        Math.sin(r) * s,
        Math.cos(r) * s,
        zAt(s) + 0.002,
        0.017,
      ];
      body = body.smoothUnion(0.01, sdf.chain([p(0.03), p(0.07), p(0.105)], 0.012));
    }
    body = body.smoothUnion(0.012, sdf.sphere(0.028).scale([1.2, 0.8, 1]).at(0, 0.012, -0.005));
    const shape = body.paintFn((x, y, z, base) => {
      const ang = (Math.atan2(x, Math.max(y, 0.001)) * 180) / Math.PI;
      let d = 99;
      for (const a of RIDGES) d = Math.min(d, Math.abs(ang - a));
      const g = Math.min(1, Math.max(0, (d - 6) / 3)) * (z > 0.012 && Math.hypot(x, y) > 0.03 ? 1 : 0);
      return mixRgb(PEACH, GROOVE, g);
    });
    k.body('shell', shape, { color: PEACH, roughness: 0.45, metalness: 0, maxTriangles: 2800 });
  },
});
