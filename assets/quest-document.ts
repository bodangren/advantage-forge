import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Quest document (quest item): parchment 0.2 x 0.28 m, 0.015 thick, propped at 70 degrees on a
 * dark wedge, bottom edge curled. One idea: a red diagonal ribbon and a gold stamp on a written sheet.
 * Palette: parchment #ecd7a4, ink #6b4a2a, ribbon #c0302a, gold #d4a93a, wedge #4a2e18.
 */
const PAPER = rgb('#ecd7a4');
const INK = rgb('#6b4a2a');
const RED = rgb('#c0302a');
const T = 0.015;
const HX = 0.1;
const HZ = 0.14;
const LIFT = 0.137;
const pose = (s: ReturnType<typeof sdf.box>) => s.rotateX(70).at(0, LIFT, 0);
const LINES = [0.15, 0.13, 0.15, 0.1, 0.15, 0.07];

export default defineAsset({
  name: 'quest-document',
  description: 'A parchment quest sheet propped on a wedge with text lines, a red ribbon corner and a gold stamp.',
  detail: 0.004,
  reference: 'docs/item-mockups/quest-document-mock.jpg',
  texture: { size: 1024 },
  build(k) {
    const sheet = sdf.box([HX * 2, T, HZ * 2], 0.005).at(0, T / 2, 0);
    const curl = sdf.cylinder(0.013, HX * 2 - 0.006, 0.005).rotateZ(90).at(0, 0.013, HZ - 0.004);
    const paper = sheet.smoothUnion(0.012, curl).paintFn((x, y, z) => {
      let c = mixRgb(PAPER, rgb('#d8bc80'), 0.3 * (0.5 + 0.5 * noise.fbm(x * 22, y * 22, z * 22, 2)));
      const edge = Math.min(HX - Math.abs(x), HZ - Math.abs(z));
      c = mixRgb(c, rgb('#b08850'), 1 - Math.min(1, Math.max(0, (edge - 0.004) / 0.012)));
      if (y > T - 0.004 && z < HZ - 0.03) {
        LINES.forEach((len, i) => {
          const lz = -0.085 + i * 0.03;
          if (Math.abs(z - lz) < 0.0055 && x > -0.075 && x < -0.075 + len + (i === 5 ? 0 : 0)) c = INK;
        });
        const d = x - z;
        if (d > 0.17 && d < 0.215) c = RED;
      }
      return c;
    });
    k.body('paper', pose(paper), { color: '#ecd7a4', roughness: 0.85, metalness: 0, textureDensity: 3, paintWeight: 2, detail: 0.004 });

    const stamp = sdf.cylinder(0.026, 0.008, 0.003).at(0.04, T + 0.003, 0.1).paintFn((x, y, z) => {
      const r = Math.hypot(x - 0.04, z - 0.1);
      return y > T + 0.005 && (Math.abs(r - 0.016) < 0.0022 || r < 0.005) ? rgb('#a67c1c') : rgb('#d4a93a');
    });
    k.body('stamp', pose(stamp), { color: '#d4a93a', roughness: 0.35, metalness: 1, textureDensity: 2, detail: 0.0035 });

    k.body('wedge', sdf.box([0.14, 0.085, 0.11], 0.012).at(0, 0.0425, -0.04), { color: '#4a2e18', roughness: 0.75, metalness: 0, detail: 0.005 });
  },
});
