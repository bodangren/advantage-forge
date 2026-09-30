import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Farm scythe (equipment/melee-weapons/scythe), matched to docs/item-mockups/scythe-mock.jpg.
 * Size: 1.65 m tall, standing on the end of its snath. One idea: a gently curved wooden snath with
 * two hand grips and a long curved steel blade reaching back from the top to a point.
 * Palette: snath #c08a50 / grain #8a5a32, grips #7a4a2a, blade #4a4f55 / edge #d3d8de.
 */

const WOOD = rgb('#c08a50');
const GRAIN = rgb('#8a5a32');
const BLADE = rgb('#4a4f55');
const EDGE = rgb('#d3d8de');
const C: [number, number] = [-0.39, 1.72]; // blade arc center (x, y)

export default defineAsset({
  name: 'scythe',
  description: 'A farm scythe: a curved wooden snath with two hand grips and a long curved steel blade with a bright edge.',
  detail: 0.004,
  reference: 'docs/item-mockups/scythe-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const snath = sdf.chain(
      [[0.0, 0.02, 0, 0.042], [0.06, 0.45, 0, 0.04], [0.06, 0.95, 0, 0.038], [0.03, 1.35, 0, 0.036], [0.02, 1.62, 0, 0.034]],
      0.02,
    );
    k.body(
      'snath',
      snath.paintFn((x, y, z) => mixRgb(WOOD, GRAIN, 0.15 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 80, y * 6, z * 80, 3)))),
      { color: '#c08a50', roughness: 0.7, metalness: 0 },
    );
    const grips = sdf.union(
      sdf.capsule([0.06, 0.62, 0], [0.06, 0.64, 0.2], 0.026),
      sdf.capsule([0.045, 1.12, 0], [0.045, 1.14, 0.18], 0.026),
      sdf.cylinder(0.05, 0.08, 0.01).at(0.02, 1.6, 0),
    );
    k.body('grips', grips, { color: '#7a4a2a', roughness: 0.7, metalness: 0 });

    const arc = sdf.extrude(profile.arc(0.42, 0.14, -105, -12), 0.036, 0.005).at(C[0], C[1], 0);
    const taper = sdf.cylinder(0.48, 0.2, 0).rotateX(90).at(C[0] + 0.03, C[1] + 0.09, 0);
    const blade = arc
      .intersect(taper)
      .intersect(sdf.halfSpace([0, 0, 1], 0.016))
      .intersect(sdf.halfSpace([0, 0, -1], 0.016))
      .paintFn((x, y) => {
        const r = Math.hypot(x - C[0], y - C[1]);
        return r < 0.39 ? EDGE : mixRgb(BLADE, EDGE, 0.1);
      });
    k.body('blade', blade, { color: '#4a4f55', roughness: 0.35, metalness: 0.85 });
  },
});
