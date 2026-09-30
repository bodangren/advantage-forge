import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Sealed letter (quest item): cream envelope 0.24 x 0.16 m propped at 70 degrees on a dark wedge.
 * One idea: a big raised red wax seal with a crest on the flap point. Palette: cream #f2e3c2,
 * flap #e0cfa8, wax #a4221b, wedge #4a2e18. Materials: paper, wax, ribbon, wedge.
 */
const CREAM = rgb('#f2e3c2');
const FLAP = rgb('#e0cfa8');
const EDGE = rgb('#c9b58a');
const WAX_DARK = rgb('#7a1712');
const T = 0.02;
const HX = 0.12;
const HZ = 0.08;
const LIFT = 0.078;
const pose = (s: ReturnType<typeof sdf.box>) => s.rotateX(70).at(0, LIFT, 0);
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

export default defineAsset({
  name: 'letter-sealed',
  description: 'A cream envelope propped on a wedge with a red ribbon and a big crested wax seal.',
  detail: 0.004,
  reference: 'docs/item-mockups/letter-sealed-mock.jpg',
  texture: { size: 1024 },
  build(k) {
    const env = sdf.box([HX * 2, T, HZ * 2], 0.007).at(0, T / 2, 0).paintFn((x, y, z) => {
      let c = mixRgb(CREAM, EDGE, 0.15 * (0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2)));
      if (y > T - 0.004) {
        const inFlap = (z + HZ) / 0.09 < 1 - Math.abs(x) / HX && z < 0.01;
        if (inFlap) c = FLAP;
        const edge = Math.abs(Math.abs(x) - (HX - 0.008)) < 0.0015 && z > -HZ + 0.01;
        if (edge && !inFlap) c = EDGE;
      }
      return c;
    });
    k.body('paper', pose(env), { color: '#f2e3c2', roughness: 0.85, metalness: 0, textureDensity: 3, paintWeight: 2, detail: 0.004 });

    const rib = sdf.box([0.022, T + 0.006, HZ * 2 + 0.004], 0.006).at(0, T / 2, 0);
    k.body('ribbon', pose(rib), { color: '#c0302a', roughness: 0.6, metalness: 0, detail: 0.004 });

    const seal = sdf.cylinder(0.032, 0.014, 0.005).at(0, T + 0.006, 0.0).paintFn((x, y, z) => {
      const r = Math.hypot(x, z - 0.0);
      let c = rgb('#a4221b');
      if (y > T + 0.008) {
        // crest: ring and a diamond
        if (Math.abs(r - 0.021) < 0.0022) c = WAX_DARK;
        if (Math.abs(x) + Math.abs(z) < 0.013) c = WAX_DARK;
        if (Math.abs(x) + Math.abs(z) < 0.005) c = rgb('#c8382e');
      }
      return c;
    });
    k.body('wax', pose(seal), { color: '#a4221b', roughness: 0.4, metalness: 0, textureDensity: 2, detail: 0.0035 });

    k.body('wedge', sdf.box([0.16, 0.075, 0.1], 0.01).at(0, 0.0375, -0.035), { color: '#4a2e18', roughness: 0.75, metalness: 0, detail: 0.005 });
    void clamp;
  },
});
