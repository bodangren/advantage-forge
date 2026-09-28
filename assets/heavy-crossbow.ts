import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Heavy crossbow (equipment/ranged-weapons/heavy-crossbow), matched to docs/item-mockups/heavy-crossbow-mock.jpg.
 * Size: 0.9 m long along X, 0.8 m wide, lying flat on y = 0, front toward +X. One idea: a thick
 * wooden stock with iron fittings, a wide curved steel bow with capped tips and a string, a
 * winding crank at the back, and a loaded bolt. Palette: stock #9a6a3a / #6e4424, steel #9aa0a8 /
 * #c9ccd0, iron #4f545a, string #e8e0c8, bolt fletching #c0302a.
 */

const WOOD = rgb('#9a6a3a');
const DARK = rgb('#6e4424');
const Y = 0.05; // stock center height

export default defineAsset({
  name: 'heavy-crossbow',
  description: 'A heavy crossbow lying flat: a thick wooden stock, a wide curved steel bow with a string, a winding crank, and a loaded bolt.',
  detail: 0.004,
  reference: 'docs/item-mockups/heavy-crossbow-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const stock = sdf.union(
      sdf.box([0.75, 0.07, 0.08], 0.02).at(-0.05, Y, 0),
      sdf.box([0.2, 0.1, 0.1], 0.03).rotateZ(-8).at(-0.38, Y - 0.005, 0),
    );
    k.body('stock', stock.paintFn((x, y, z) => mixRgb(WOOD, DARK, 0.15 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 6, y * 60, z * 60, 3)))), {
      color: '#9a6a3a',
      roughness: 0.65,
      metalness: 0,
    });
    // Bow: a wide arc across the front, laid flat, with capped tips.
    const bow = sdf.extrude(profile.arc(0.42, 0.035, -62, 62), 0.03, 0.008).rotateX(-90).at(0.0, Y, 0);
    const tips = [-1, 1].map((s) => {
      const a = (s * 62 * Math.PI) / 180;
      return sdf.cone([0.42 * Math.cos(a), Y, -0.42 * Math.sin(a)], [0.44 * Math.cos(a) - 0.02, Y, -0.46 * Math.sin(a)], 0.028, 0.008);
    });
    k.body('bow', sdf.union(bow, ...tips).paintFn((x) => (x > 0.395 ? rgb('#c9ccd0') : rgb('#9aa0a8'))), { color: '#9aa0a8', roughness: 0.35, metalness: 0.85 });
    const tipZ = 0.42 * Math.sin((62 * Math.PI) / 180);
    const tipX = 0.42 * Math.cos((62 * Math.PI) / 180);
    const string = sdf.union(sdf.capsule([tipX, Y + 0.02, tipZ], [-0.12, Y + 0.04, 0], 0.004), sdf.capsule([tipX, Y + 0.02, -tipZ], [-0.12, Y + 0.04, 0], 0.004));
    k.body('string', string, { color: '#e8e0c8', roughness: 0.7, metalness: 0 });
    const iron = sdf.union(
      sdf.box([0.08, 0.1, 0.1], 0.015).at(0.36, Y, 0),
      sdf.box([0.06, 0.05, 0.09], 0.012).at(-0.12, Y + 0.03, 0),
      sdf.cylinder(0.035, 0.18, 0.008).rotateX(90).at(-0.3, Y + 0.03, 0),
      ...[-1, 1].map((s) => sdf.capsule([-0.3, Y + 0.03, s * 0.09], [-0.36, Y + 0.03, s * 0.12], 0.01)),
      ...[-1, 1].map((s) => sdf.sphere(0.018).at(-0.36, Y + 0.03, s * 0.12)),
    );
    k.body('iron', iron, { color: '#4f545a', roughness: 0.5, metalness: 0.75 });
    const bolt = sdf.union(sdf.capsule([-0.1, Y + 0.05, 0], [0.4, Y + 0.05, 0], 0.008), sdf.cone([0.4, Y + 0.05, 0], [0.46, Y + 0.05, 0], 0.016, 0.001));
    k.body('bolt', bolt, { color: '#c9ccd0', roughness: 0.35, metalness: 0.7 });
    k.body('fletching', sdf.box([0.06, 0.03, 0.012], 0.004).at(-0.07, Y + 0.07, 0), { color: '#c0302a', roughness: 0.7, metalness: 0 });
  },
});
