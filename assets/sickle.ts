import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Sickle (equipment/melee-weapons/sickle), matched to docs/item-mockups/sickle-mock.jpg.
 * Size: 0.42 m long, lying flat on y = 0. One idea: a crescent steel blade that sweeps round to a
 * point, set in a curved wooden handle with an iron ferrule. Palette: steel #9aa0a8 / edge
 * #d3d8de, handle #b07a45 / grain #7a4f2a, ferrule #5a5f67.
 */

const STEEL = rgb('#9aa0a8');
const EDGE = rgb('#d3d8de');
const WOOD = rgb('#b07a45');
const GRAIN = rgb('#7a4f2a');
const Y = 0.016; // handle axis height
const C: [number, number] = [0.02, -0.1]; // blade arc center (x, z); the heel is at the handle (0, 0)

export default defineAsset({
  name: 'sickle',
  description: 'A sickle: a crescent steel blade with a bright inner edge, on a curved wooden handle with an iron ferrule.',
  detail: 0.0025,
  reference: 'docs/item-mockups/sickle-mock.jpg',
  texture: { size: 512 },

  build(k) {
    // Blade: an arc stroke laid flat, thick at the heel and tapering toward the tip.
    const arc = sdf
      .extrude(profile.arc(0.102, 0.036, -101, 119), 0.008, 0.002)
      .rotateX(-90)
      .at(C[0], Y, C[1]);
    const taper = sdf.cylinder(0.125, 0.1, 0).at(C[0] - 0.006, Y, C[1] + 0.029);
    const blade = arc.intersect(taper).paintFn((x, _y, z) => {
      const r = Math.hypot(x - C[0], z - C[1]);
      const n = 0.5 + 0.5 * noise.fbm(x * 40, 0, z * 40, 2);
      return mixRgb(mixRgb(STEEL, EDGE, 0.2 * n), EDGE, r < 0.09 ? 1 : 0);
    });
    k.body('blade', blade, { color: '#9aa0a8', roughness: 0.35, metalness: 0.85, textureDensity: 2 });

    const handle = sdf.chain(
      [
        [-0.02, Y, 0.0, 0.015],
        [-0.12, Y, 0.012, 0.016],
        [-0.22, Y, 0.03, 0.017],
        [-0.3, Y - 0.001, 0.05, 0.018],
      ],
      0.02,
    );
    k.body(
      'handle',
      handle.paintFn((x, y, z) => mixRgb(WOOD, GRAIN, 0.15 + 0.35 * (0.5 + 0.5 * noise.fbm(x * 8, y * 80, z * 80, 3)))),
      { color: '#b07a45', roughness: 0.7, metalness: 0 },
    );
    const ferrule = sdf.cylinder(0.019, 0.03, 0.004).rotateZ(90).at(-0.02, Y, 0.0);
    k.body('ferrule', ferrule, { color: '#5a5f67', roughness: 0.5, metalness: 0.7 });
  },
});
