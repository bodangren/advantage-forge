import { defineAsset, profile, rgb, sdf, mixRgb, noise } from '../src/index.js';

/**
 * Crossbow bolt (equipment/ranged-weapons/bolt): 0.4 m long, lying on y = 0 along X, head toward +X.
 * One idea: a short thick shaft, a square pyramid steel head, and two stiff leather vanes set
 * diagonally so the bolt rests level. Palette: shaft #c08a50 / #8a5a32, steel #b8bec6, vanes #7a4a2a.
 * No mockup: the mmx image showed a crossbow, not a bolt.
 */

const Y = 0.017; // shaft axis height

export default defineAsset({
  name: 'bolt',
  description: 'A crossbow bolt lying flat: a short thick shaft, a square pyramid steel head, and two stiff leather vanes.',
  detail: 0.0018,
  texture: { size: 512 },

  build(k) {
    k.body(
      'shaft',
      sdf.cylinder(0.009, 0.33, 0.003).rotateZ(90).at(-0.02, Y, 0).paintFn((x, y, z) => mixRgb(rgb('#c08a50'), rgb('#8a5a32'), 0.2 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 8, y * 200, z * 200, 2)))),
      { color: '#c08a50', roughness: 0.65, metalness: 0 },
    );
    // Square pyramid head: a triangle profile in XY cut with the same triangle turned 90 degrees about X.
    const tri = sdf.extrude(profile.polygon([[0.14, -0.017], [0.2, 0], [0.14, 0.017]]), 0.034);
    const head = tri.intersect(tri.rotateX(90)).rotateX(45).at(0, Y, 0);
    const socket = sdf.cylinder(0.012, 0.03, 0.003).rotateZ(90).at(0.13, Y, 0);
    k.body('steel', sdf.smoothUnion(0.003, head, socket), { color: '#b8bec6', roughness: 0.3, metalness: 0.85, flat: true });
    const vane = sdf.extrude(profile.polygon([[-0.185, 0.0], [-0.12, 0.0], [-0.17, 0.022], [-0.19, 0.022]], { smooth: false }), 0.003, 0.001);
    const vanes = sdf.union(vane.rotateX(45), vane.rotateX(-45), vane.rotateX(135), vane.rotateX(-135)).at(0, Y, 0);
    k.body('vanes', vanes, { color: '#7a4a2a', roughness: 0.7, metalness: 0 });
  },
});
