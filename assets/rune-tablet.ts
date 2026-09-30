import { defineAsset, noise, profile, sdf } from '../src/index.js';

/**
 * Rune tablet (quest item): chunky cool-grey stone slab 0.2 x 0.28 x 0.05 m propped at 70 degrees on a
 * dark wedge, one broken corner. One idea: four raised glowing cyan runes on the face.
 * Palette: stone #7d8a99, rune #40e0ff (emissive 0.5), wedge #4a2e18.
 */
const T = 0.05;
const LIFT = 0.14;
const pose = (s: ReturnType<typeof sdf.box>) => s.rotateX(70).at(0, LIFT, 0);
const g = (s: ReturnType<typeof sdf.box>, x: number, z: number, rot = 0) => s.rotateZ(rot).rotateX(90).at(x, T - 0.006, z);
const bar = (w: number, h: number) => sdf.extrude(profile.rect([w, h], 0.004), 0.024);

export default defineAsset({
  name: 'rune-tablet',
  description: 'A grey stone tablet propped on a wedge with a broken corner and four glowing cyan runes.',
  detail: 0.004,
  reference: 'docs/item-mockups/rune-tablet-mock.jpg',
  texture: { size: 1024 },
  build(k) {
    const slab = sdf
      .box([0.2, T, 0.28], 0.02)
      .at(0, T / 2, 0)
      .subtract(sdf.box([0.075, 0.2, 0.075]).rotateY(45).at(0.1, T / 2, -0.14))
      ;
    k.body('stone', pose(slab), {
      color: '#5f6874',
      roughness: 0.9,
      metalness: 0,
      detail: 0.005,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 60, y * 60, z * 60, 2),
    });

    const r1 = sdf.union(g(bar(0.03, 0.085), -0.06, -0.065), g(bar(0.07, 0.03), -0.045, -0.038));
    const r2 = sdf.union(g(bar(0.07, 0.028), 0.04, -0.09), g(bar(0.07, 0.028), 0.04, -0.03), g(bar(0.03, 0.09), 0.04, -0.06, 32));
    const r3 = g(sdf.extrude(profile.arc(0.03, 0.03, 20, 340), 0.024), -0.045, 0.075);
    const r4 = sdf.union(g(bar(0.08, 0.03), 0.045, 0.045), g(bar(0.03, 0.08), 0.045, 0.075));
    k.body('runes', pose(sdf.union(r1, r2, r3, r4)), {
      color: '#7ff5ff',
      roughness: 0.3,
      metalness: 0,
      emissive: '#7ff5ff',
      emissiveIntensity: 0.6,
      detail: 0.0045,
    });

    k.body('chunk', sdf.box([0.065, 0.03, 0.05], 0.012).rotateY(30).at(0.135, 0.015, 0.03), { color: '#5f6874', roughness: 0.9, metalness: 0, detail: 0.005 });

    k.body('wedge', sdf.box([0.15, 0.09, 0.12], 0.012).at(0, 0.045, -0.05), { color: '#4a2e18', roughness: 0.75, metalness: 0, detail: 0.005 });
  },
});
