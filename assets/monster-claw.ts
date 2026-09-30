import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * items/crafting/monster-claw. Role: crafting pickup, 128 px sprite. Size 0.25 m tall, on y = 0.
 * One idea: a thick curved talon, point up, on a dark knuckle. Shape language: spiky curve, round base.
 * Palette: horn #3a3236, sheen #6a5a60, tip #d8d0c0. Materials: horn (rough 0.4), knuckle (rough 0.8).
 */
const HORN = rgb('#3a3236');
const ROOT = rgb('#2a2226');
const MID = rgb('#6a4a4a');
const TIP = rgb('#efe6d2');
const KNUCKLE = rgb('#2a2428');

export default defineAsset({
  name: 'monster-claw',
  description: 'A thick curved dark monster claw standing point-up on a knuckle base. About 0.25 m.',
  detail: 0.004,
  texture: { size: 1024 },
  build(k) {
    const R = 0.277;
    const radii = [0.045, 0.034, 0.022, 0.012];
    const pts: [number, number, number, number][] = radii.map((r, i) => {
      const a = ((i / 3) * 60 * Math.PI) / 180;
      return [R * (1 - Math.cos(a)) - 0.07, 0.03 + R * Math.sin(a) * 0.95, 0, r];
    });
    const claw = sdf
      .chain(pts, 0.02)
      .paintFn((x, y) => {
        const t = Math.max(0, Math.min(1, (y - 0.03) / 0.24));
        const ss = (a: number, b: number, v: number) => {
          const u = Math.max(0, Math.min(1, (v - a) / (b - a)));
          return u * u * (3 - 2 * u);
        };
        const mid = mixRgb(ROOT, MID, ss(0, 0.55, t));
        return mixRgb(mid, TIP, ss(0.6, 0.95, t));
      });
    k.body('claw', claw, { color: HORN, roughness: 0.3, detail: 0.004 });
    const knuckle = sdf
      .sphere(0.058)
      .at(-0.07, 0.03, 0)
      .intersect(sdf.box([0.3, 0.2, 0.3]).at(-0.07, 0.1, 0));
    k.body('knuckle', knuckle, { color: KNUCKLE, roughness: 0.8, detail: 0.004, bump: (x, y, z) => 0.0008 * noise.noise3(x * 70, y * 70, z * 70) });
  },
});
