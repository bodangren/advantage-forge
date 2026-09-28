import { defineAsset, rgb, sdf } from '../src/index.js';

/**
 * Gold bead necklace (equipment/accessories/necklace), matched to docs/item-mockups/necklace-mock.jpg.
 * Size: 0.25 m across, lying flat on y = 0. One idea: a loose loop of round gold beads with three
 * faceted red gems at the front, the middle one larger. Palette: gold #d4a93a, gems #c0302a.
 */

export default defineAsset({
  name: 'necklace',
  description: 'A gold bead necklace lying in a loose loop, with three faceted red gems at the front.',
  detail: 0.0025,
  reference: 'docs/item-mockups/necklace-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const beads = [];
    const N = 30;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + Math.PI / 2;
      if (Math.abs(Math.sin(a) - 1) < 0.02 || (Math.sin(a) > 0.94 && i % 2 === 1)) continue; // gap for the gems
      const r = 0.0115;
      beads.push(sdf.sphere(r).at(Math.cos(a) * 0.112, r, Math.sin(a) * 0.1 - 0.005 * Math.cos(a * 2)));
    }
    k.body('gold', sdf.union(...beads), { color: '#d4a93a', roughness: 0.3, metalness: 1 });
    const gem = (x: number, z: number, s: number) => sdf.ellipsoid([s, s * 0.75, s * 1.15]).at(x, s * 0.75, z);
    k.body('gems', sdf.union(gem(0, 0.108, 0.022), gem(-0.035, 0.1, 0.014), gem(0.035, 0.1, 0.014)), {
      color: '#c0302a',
      roughness: 0.18,
      metalness: 0,
      flat: true,
      detail: 0.004,
    });
  },
});
