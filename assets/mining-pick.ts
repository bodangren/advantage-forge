import { defineAsset, noise, profile, sdf } from '../src/index.js';

// Design note — hammer-pick (equipment/tools/mining-pick).
//
// Role: hero tool / pickup icon; reads at 128 px as an upright silhouette.
// Size: 0.8 m tall (0.785 built), stands on its pommel on y = 0, head runs along X, faces +Z.
// One idea: a chunky steel hammer-pick head (flat face on -X, curved spike on +X)
//   on a fat rounded wooden grip with a cream wrapped band.
// Shape language: round grip (secondary), blocky head and pointed spike (dominant).
// Palette: wood #c8763a / #a85a28, cream wrap #e8d9a8, steel #a8acb1 / #6c737a /
//   #dde1e6, brass collar #d4a93a.
// Materials: wood, wrap, steel (metal 0.85, rough 0.4), brass.
// Detail: pommel, neck, grip, five wrap rings, bulb, head block, hammer face,
//   three-segment spike, brass collar, dark square hole outline.
// Rig/animation: none.

const HEAD_Y = 0.74;

export default defineAsset({
  name: 'mining-pick',
  description: 'Upright hammer-pick with a steel head and a wrapped wooden grip (equipment/tools/mining-pick).',
  detail: 0.005,
  reference: 'docs/item-mockups/mining-pick-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const handle = sdf
      .smoothUnion(
        0.03,
        sdf.sphere(0.055).at(0, 0.055, 0),
        sdf.capsule([0, 0.05, 0], [0, 0.14, 0], 0.03),
        sdf.ellipsoid([0.05, 0.13, 0.05]).at(0, 0.22, 0),
        sdf.capsule([0, 0.3, 0], [0, 0.61, 0], 0.036),
        sdf.ellipsoid([0.055, 0.09, 0.055]).at(0, 0.5, 0),
      )
      .paintWhere(sdf.box([0.3, 0.16, 0.3]).at(0, 0.11, 0), '#a85a28', 0.04);
    k.body('wood', handle, {
      color: '#c8763a',
      roughness: 0.8,
      detail: 0.006,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 50, y * 10, z * 50, 2),
    });

    const rings: sdf.Shape[] = [];
    for (let i = 0; i < 5; i++) rings.push(sdf.torus(0.045, 0.012).at(0, 0.32 + i * 0.025, 0));
    k.body('wrap', sdf.union(...rings), { color: "#e8d9a8", roughness: 0.85, detail: 0.006, maxTriangles: 1200 });

    const block = sdf.box([0.16, 0.09, 0.09], 0.02).at(0, HEAD_Y, 0);
    const face = sdf.box([0.07, 0.11, 0.11], 0.02).at(-0.1, HEAD_Y, 0);
    const spike = sdf.chain(
      [
        [0.08, HEAD_Y, 0, 0.04],
        [0.17, HEAD_Y - 0.03, 0, 0.026],
        [0.24, HEAD_Y - 0.09, 0, 0.014],
        [0.28, HEAD_Y - 0.16, 0, 0.005],
      ],
      0.01,
    );
    const hole = sdf.box([0.04, 0.04, 0.3], 0.004).at(0.0, HEAD_Y, 0);
    const holeRim = sdf.box([0.05, 0.05, 0.3]).at(0, HEAD_Y, 0);
    const head = sdf
      .smoothUnion(0.012, block, face, spike, sdf.capsule([0, 0.6, 0], [0, HEAD_Y, 0], 0.024))
      .paintWhere(sdf.subtract(holeRim, hole), '#3a3f45', 0.004)
      .paintWhere(sdf.box([0.01, 0.2, 0.2]).at(-0.135, HEAD_Y, 0), '#dde1e6', 0.01)
      .paintWhere(sdf.box([0.2, 0.03, 0.3]).at(0.04, HEAD_Y - 0.045, 0), '#6c737a', 0.02);
    k.body('head', head, {
      color: '#a8acb1',
      roughness: 0.4,
      metalness: 0.85,
      detail: 0.005,
    });

    k.body('collar', sdf.torus(0.034, 0.011).at(0, 0.61, 0), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.005,
    });
  },
});
