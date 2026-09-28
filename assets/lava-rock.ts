import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Lava rock (nature/terrain/lava-rock), matched to docs/item-mockups/lava-rock-mock.jpg.
 * Size: 0.9 m wide, 0.6 m tall, on y = 0. One idea: a dark cracked basalt boulder with glowing
 * orange lava in its cracks and a few small pebbles. Palette: basalt #2e2e34 / #45454d, lava glow
 * #ff6a12 on a dark base #4a1405 (emissive bodies need a dark base color).
 */

export default defineAsset({
  name: 'lava-rock',
  description: 'A dark cracked basalt boulder with glowing orange lava in its cracks.',
  detail: 0.008,
  reference: 'docs/item-mockups/lava-rock-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const rock = sdf
      .ellipsoid([0.45, 0.32, 0.38])
      .at(0, 0.24, 0)
      .displace(0.04, (x, y, z) => noise.fbm(x * 3.5, y * 3.5, z * 3.5, 3))
      .intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([2, 2, 2]).at(0, 0.5, 0)));
    // Cracks: wandering chains over the surface, from the top down the sides.
    const cracks = [];
    for (let c = 0; c < 5; c++) {
      const a0 = c * 1.26 + 0.3;
      const pts: [number, number, number, number][] = [];
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        const a = a0 + Math.sin(t * 5 + c) * 0.35;
        const el = 1.2 - t * 1.1; // from near the top down toward the ground
        const r = 0.44;
        pts.push([Math.cos(a) * Math.cos(el) * r, 0.24 + Math.sin(el) * 0.33, Math.sin(a) * Math.cos(el) * r * 0.86, 0.03 - t * 0.012]);
      }
      cracks.push(sdf.chain(pts, 0.01));
    }
    const crackSet = sdf.union(...cracks);
    k.body(
      'basalt',
      rock.smoothSubtract(0.01, crackSet).paintFn((x, y, z) => mixRgb(rgb('#2e2e34'), rgb('#45454d'), 0.3 * (0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2)))),
      { color: '#2e2e34', roughness: 0.75, metalness: 0, flat: true },
    );
    k.body('lava', rock.round(-0.012).intersect(crackSet.round(0.004)), {
      color: '#4a1405',
      roughness: 0.3,
      metalness: 0,
      emissive: '#ff6a12',
      emissiveIntensity: 1.8,
      detail: 0.006,
    });
    const pebbles = sdf.union(sdf.sphere(0.04).at(0.5, 0.03, 0.2), sdf.sphere(0.03).at(-0.45, 0.02, 0.28), sdf.sphere(0.025).at(0.38, 0.02, -0.34));
    k.body('pebbles', pebbles.scale([1, 0.7, 1]), { color: '#3a3a40', roughness: 0.8, metalness: 0, flat: true });
  },
});
