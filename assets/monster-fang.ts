import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * items/crafting/monster-fang. Role: crafting pickup, 128 px sprite. Size 0.24 m tall, on y = 0.
 * One idea: a thick ivory tooth, gently curved, point up, with a pink gum stub.
 * Shape language: triangular curve over round base. Palette: ivory #f4ecd8, root #d8c8a0, gum #d87a8a.
 * Materials: tooth (rough 0.35), gum (rough 0.6).
 */
const IVORY = rgb('#f4ecd8');
const ROOT = rgb('#d8c8a0');
const GUM = rgb('#d87a8a');

export default defineAsset({
  name: 'monster-fang',
  reference: 'docs/item-mockups/monster-fang-mock.jpg',
  description: 'A thick curved ivory monster fang, point-up, on a pink gum stub. About 0.26 m.',
  detail: 0.004,
  texture: { size: 1024 },
  build(k) {
    const R = 0.48;
    const radii = [0.05, 0.038, 0.024, 0.012];
    const pts: [number, number, number, number][] = radii.map((r, i) => {
      const a = ((i / 3) * 30 * Math.PI) / 180;
      return [R * (1 - Math.cos(a)) - 0.03, 0.04 + R * Math.sin(a) * 0.95, 0, r];
    });
    const fang = sdf.chain(pts, 0.02).paintFn((x, y, z) => {
      const t = Math.max(0, Math.min(1, (0.1 - y) / 0.04));
      return mixRgb(IVORY, ROOT, t);
    });
    k.body('fang', fang, { color: IVORY, roughness: 0.35, detail: 0.004 });
    const gum = sdf
      .sphere(0.06)
      .at(-0.03, 0.03, 0)
      .intersect(sdf.box([0.3, 0.2, 0.3]).at(-0.03, 0.1, 0));
    k.body('gum', gum, { color: GUM, roughness: 0.6, detail: 0.004 });
  },
});
