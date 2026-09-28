import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Magic portal (props/world/portal), matched to docs/item-mockups/portal-mock.jpg.
 * Size: 2.2 m tall, 2.1 m wide, on y = 0, facing +Z. One idea: a ring of carved stone blocks with a
 * keystone on a two-step base, filled with a glowing blue disc and a bright swirl.
 * Palette: stone #8a94a0 / #6a7480, seams #454c55, glow #2a70ff (disc) and #9ad8ff (swirl) on dark
 * bases (emissive bodies need a dark base color).
 */

const STONE = rgb('#8a94a0');
const STONE_DARK = rgb('#6a7480');
const SEAM = rgb('#454c55');
const CY = 1.25; // ring center height
const R = 0.82;

export default defineAsset({
  name: 'portal',
  description: 'A magic portal: a ring of carved stone blocks with a keystone on a two-step base, filled with a glowing blue swirl.',
  detail: 0.008,
  reference: 'docs/item-mockups/portal-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const ring = sdf.torus(R, 0.16).rotateX(90).scale([1, 1, 1.4]).at(0, CY, 0);
    const keystone = sdf.box([0.3, 0.34, 0.4], 0.04).at(0, CY + R + 0.04, 0);
    const base = sdf.union(sdf.box([2.1, 0.18, 0.9], 0.03).at(0, 0.09, 0), sdf.box([1.6, 0.18, 0.7], 0.03).at(0, 0.27, 0));
    const stone = sdf.union(ring, keystone, base).paintFn((x, y, z) => {
      const n = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 3);
      let c = mixRgb(STONE, STONE_DARK, 0.2 + 0.5 * n);
      const a = Math.atan2(y - CY, x) / (Math.PI / 7);
      const onRing = Math.abs(Math.hypot(x, y - CY) - R) < 0.2 && y > 0.36;
      if (onRing && Math.abs(a - Math.round(a)) < 0.04) c = SEAM;
      return c;
    });
    k.body('stone', stone, { color: '#8a94a0', roughness: 0.9, metalness: 0, bump: (x, y, z) => 0.003 * noise.fbm(x * 12, y * 12, z * 12, 2) });

    const disc = sdf.cylinder(R - 0.06, 0.04, 0.01).rotateX(90).at(0, CY, 0);
    k.body('glow', disc, { color: '#0a1a3a', roughness: 0.2, metalness: 0, emissive: '#2a70ff', emissiveIntensity: 1.3 });
    const arms = [];
    for (let arm = 0; arm < 3; arm++) {
      const pts: [number, number, number, number][] = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const a = arm * ((2 * Math.PI) / 3) + t * 3.2;
        const r = 0.06 + t * 0.62;
        pts.push([Math.cos(a) * r, CY + Math.sin(a) * r, 0.03, 0.028 - t * 0.016]);
      }
      arms.push(sdf.chain(pts, 0.02));
    }
    k.body('swirl', sdf.union(...arms, sdf.sphere(0.07).at(0, CY, 0.02)), {
      color: '#1a3a5a',
      roughness: 0.2,
      metalness: 0,
      emissive: '#9ad8ff',
      emissiveIntensity: 1.8,
      detail: 0.005,
    });
  },
});
