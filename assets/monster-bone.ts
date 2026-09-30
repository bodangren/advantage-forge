import { defineAsset, mixRgb, rgb, sdf, noise } from '../src/index.js';

/**
 * items/crafting/monster-bone. Role: crafting pickup, 128 px sprite. Size ~0.3 m, propped on a dirt clump.
 * One idea: a chunky cartoon bone with big double-lobed knobs, leaning up at an angle.
 * Shape language: round, soft. Palette: bone #f0e2c4, crease #c8b898, dirt #4a3a2c.
 * Materials: bone (rough 0.6), dirt (rough 0.95).
 */
const BONE = rgb('#f0e2c4');
const CREASE = rgb('#c8b898');
const DIRT = rgb('#4a3a2c');

export default defineAsset({
  name: 'monster-bone',
  reference: 'docs/item-mockups/monster-bone-mock.jpg',
  description: 'A chunky cartoon monster bone leaning on a dirt clump. About 0.3 m.',
  detail: 0.004,
  texture: { size: 1024 },
  build(k) {
    const H = 0.14;
    const knob = (y: number) =>
      sdf.union(sdf.sphere(0.048).at(-0.036, y, 0), sdf.sphere(0.048).at(0.036, y, 0));
    const local = sdf
      .smoothUnion(0.02, sdf.capsule([0, -H, 0], [0, H, 0], 0.032), knob(H + 0.01), knob(-H - 0.01))
      .paintFn((x, y, z) => {
        const d = Math.abs(Math.abs(y) - H);
        const c = Math.max(0, 1 - d / 0.02) * 0.9 + Math.max(0, -z - 0.03) * 4;
        const t = Math.min(1, c) * (0.75 + 0.25 * noise.noise3(x * 40, y * 40, z * 40));
        return mixRgb(BONE, CREASE, t);
      });
    // lower knob is 0.5*(0.14+0.01)+... rotate 55 deg from vertical; lowest point ~ y = 0.02
    const bone = local.rotateZ(-55).at(0, 0.17, 0);
    k.body('bone', bone, { color: BONE, roughness: 0.6, detail: 0.004, bump: (x, y, z) => 0.0008 * noise.noise3(x * 70, y * 70, z * 70) });
    const dirt = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([0.09, 0.045, 0.075]).at(-0.13, 0.015, 0),
        sdf.sphere(0.04).at(-0.07, 0.02, 0.05),
        sdf.sphere(0.035).at(-0.18, 0.02, -0.04),
      )
      .displace(0.004, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2));
    k.body('dirt', dirt, { color: DIRT, roughness: 0.95, detail: 0.005 });
  },
});
