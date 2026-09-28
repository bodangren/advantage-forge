import { defineAsset, rgb, sdf } from '../src/index.js';

/**
 * Gold circlet (equipment/armor/circlet), matched to docs/item-mockups/circlet-mock.jpg.
 * Size: 0.2 m across, lying flat on y = 0, front toward +Z. One idea: a thin gold band with small
 * leaves along it and a raised setting at the front holding a blue gem. Palette: gold #d4a93a,
 * gem #2fb8d0.
 */

const R = 0.095;
const T = 0.0055;

export default defineAsset({
  name: 'circlet',
  description: 'A thin gold circlet with small leaves along the band and a blue gem in a raised setting at the front.',
  detail: 0.0018,
  reference: 'docs/item-mockups/circlet-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const band = sdf.torus(R, T).scale([1, 1.3, 1]).at(0, T * 1.3, 0);
    const leaves = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.2;
      if (Math.sin(a) > 0.9) continue; // leave room for the setting
      const x = Math.cos(a) * R;
      const z = Math.sin(a) * R;
      leaves.push(
        sdf
          .ellipsoid([0.013, 0.004, 0.006])
          .rotateY((-a * 180) / Math.PI + 90 + 30)
          .at(x + Math.cos(a) * 0.004, T * 2.1, z + Math.sin(a) * 0.004),
      );
    }
    const setting = sdf.smoothUnion(
      0.004,
      sdf.cylinder(0.02, 0.012, 0.004).rotateX(90).at(0, 0.02, R),
      sdf.cone([0, 0.03, R], [0, 0.046, R], 0.008, 0.002),
    );
    k.body('gold', sdf.smoothUnion(0.003, band, ...leaves).smoothUnion(0.005, setting), { color: '#d4a93a', roughness: 0.3, metalness: 1 });
    k.body('gem', sdf.ellipsoid([0.014, 0.014, 0.009]).at(0, 0.02, R + 0.006), { color: '#2fb8d0', roughness: 0.12, metalness: 0, flat: true });
  },
});
