import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Stained glass window (architecture/building-parts/stained-glass-window), matched to
 * docs/item-mockups/stained-glass-window-mock.jpg. Size: 1.1 m wide, 1.9 m tall, 0.25 m deep,
 * on y = 0, facing +Z. One idea: a pointed-arch stone frame of chunky blocks holding see-through
 * colored glass panes in red, blue, gold, and green, set in dark lead lines.
 * Palette: stone #c9b89a / #9a8a70, seams #6f6252, glass red #c83a3a, blue #3a6ac8, gold #e0b030,
 * green #3a9a4a, lead #2a2a30.
 */

const STONE = rgb('#c9b89a');
const STONE_DARK = rgb('#9a8a70');
const GLASS = ['#c83a3a', '#3a6ac8', '#e0b030', '#3a9a4a'].map((c) => rgb(c));
const LEAD = rgb('#2a2a30');

/** A pointed (gothic) arch outline of half width w, spring height h, apex height t. */
const arch = (w: number, h: number, t: number) => {
  const pts: [number, number][] = [[-w, 0], [w, 0], [w, h]];
  for (let i = 1; i < 8; i++) {
    const u = i / 8;
    pts.push([w * (1 - u) * (1 - 0.3 * u), h + (t - h) * Math.sin((u * Math.PI) / 2)]);
  }
  pts.push([0, t]);
  for (let i = 7; i >= 1; i--) {
    const u = i / 8;
    pts.push([-w * (1 - u) * (1 - 0.3 * u), h + (t - h) * Math.sin((u * Math.PI) / 2)]);
  }
  pts.push([-w, h]);
  return profile.polygon(pts);
};

export default defineAsset({
  name: 'stained-glass-window',
  description: 'A pointed-arch stone window frame holding see-through stained glass panes in red, blue, gold, and green with lead lines.',
  detail: 0.006,
  reference: 'docs/item-mockups/stained-glass-window-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const outer = sdf.extrude(arch(0.55, 1.2, 1.9), 0.25, 0.03);
    const opening = sdf.extrude(arch(0.36, 1.15, 1.66), 0.4).at(0, 0.14, 0);
    const frame = outer.subtract(opening);
    k.body(
      'frame',
      frame.paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2);
        const row = Math.abs(y / 0.24 - Math.round(y / 0.24));
        return row < 0.04 ? rgb('#6f6252') : mixRgb(STONE, STONE_DARK, 0.2 + 0.4 * n);
      }),
      { color: '#c9b89a', roughness: 0.85, metalness: 0, bump: (x, y, z) => 0.002 * noise.fbm(x * 15, y * 15, z * 15, 2) },
    );
    const glass = sdf.extrude(arch(0.37, 1.15, 1.67), 0.02).at(0, 0.14, 0);
    k.body(
      'glass',
      glass.paintFn((x, y) => {
        const u = x / 0.37;
        const v = (y - 0.14) / 1.5;
        const lead = Math.abs(u) < 0.03 || Math.abs(Math.sin(v * Math.PI * 4)) < 0.06 || Math.abs(Math.abs(u) - Math.abs(Math.sin(v * 6))) < 0.03;
        if (lead) return LEAD;
        const cell = (Math.floor(v * 4) * 2 + (u > 0 ? 1 : 0) + Math.floor(Math.abs(u) * 2)) % 4;
        return GLASS[cell]!;
      }),
      { color: '#3a6ac8', roughness: 0.1, metalness: 0, opacity: 0.6, textureDensity: 2 },
    );
  },
});
