import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Coral cluster (nature/terrain/coral): 0.8 m wide, 0.6 m tall, on y = 0. One idea: branching pink
 * coral, a round orange brain coral, and a purple fan coral on a sandy rock. Palette: rock #b8a78a,
 * pink #f07a9a, orange #f0903a / groove #c86a1e, purple #8a5ac8.
 */

export default defineAsset({
  name: 'coral',
  description: 'A coral cluster: branching pink coral, a round orange brain coral, and a purple fan coral on a sandy rock.',
  detail: 0.005,
  texture: { size: 1024 },

  build(k) {
    const rock = sdf
      .ellipsoid([0.4, 0.14, 0.32])
      .at(0, 0.02, 0)
      .displace(0.02, (x, y, z) => noise.fbm(x * 5, y * 5, z * 5, 3))
      .intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([2, 1, 2]).at(0, 0.3, 0)));
    k.body('rock', rock.paintFn((x, y, z) => mixRgb(rgb('#b8a78a'), rgb('#8f7f66'), 0.2 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 12, y * 12, z * 12, 2)))), {
      color: '#b8a78a',
      roughness: 0.9,
      metalness: 0,
    });

    // Branching coral: a trunk that forks twice.
    const branch = (pts: [number, number, number][], r: number) => sdf.chain(pts.map(([x, y, z], i) => [x, y, z, r * (1 - i * 0.18)] as [number, number, number, number]), 0.015);
    const base: [number, number, number] = [-0.15, 0.1, 0.02];
    const pink = sdf.union(
      branch([base, [-0.17, 0.25, 0.03], [-0.25, 0.4, 0.05], [-0.28, 0.52, 0.04]], 0.03),
      branch([[-0.17, 0.25, 0.03], [-0.1, 0.38, 0.0], [-0.06, 0.5, -0.02]], 0.024),
      branch([[-0.25, 0.4, 0.05], [-0.33, 0.47, 0.1], [-0.36, 0.55, 0.12]], 0.018),
      branch([[-0.1, 0.38, 0.0], [-0.14, 0.47, -0.06], [-0.15, 0.56, -0.08]], 0.016),
    );
    k.body('pink', pink, { color: '#f07a9a', roughness: 0.7, metalness: 0 });

    const brain = sdf
      .sphere(0.13)
      .at(0.14, 0.15, 0.06)
      .displace(0.008, (x, y, z) => Math.abs(Math.sin(x * 60 + Math.sin(z * 50) * 1.5 + y * 20)) - 0.5);
    k.body(
      'brain',
      brain.paintFn((x, y, z) => mixRgb(rgb('#f0903a'), rgb('#c86a1e'), Math.abs(Math.sin(x * 60 + Math.sin(z * 50) * 1.5 + y * 20)) < 0.3 ? 0.8 : 0.1)),
      { color: '#f0903a', roughness: 0.7, metalness: 0 },
    );

    const fanShape = profile.polygon([[0, 0], [-0.16, 0.2], [-0.1, 0.32], [0, 0.36], [0.1, 0.32], [0.16, 0.2]], { smooth: true });
    const fan = sdf
      .extrude(fanShape, 0.012, 0.004)
      .subtract(sdf.union(...Array.from({ length: 9 }, (_, i) => sdf.sphere(0.022).at(-0.08 + (i % 3) * 0.08, 0.12 + Math.floor(i / 3) * 0.07, 0))))
      .rotateY(35)
      .at(0.05, 0.12, -0.15);
    k.body('fan', fan, { color: '#8a5ac8', roughness: 0.7, metalness: 0 });
  },
});
