import { HAND_FIT, defineAsset, noise, profile, sdf } from '../src/index.js';

/**
 * Glaive, 1.6 m tall, standing on its brass butt on y = 0, centered on the Y axis, facing +Z.
 * Role: hero polearm, icon and in-hand weapon; must read at 128 px.
 * The one idea: a chunky walnut pole under a huge steel crescent blade that curls back like a claw.
 * Shape language: one thick vertical rod broken by a big curved triangular blade.
 * Palette: walnut #8a5a35 (dominant), steel #c8ccd2 with darker spine #8e959e, brass #d4a93a accent,
 * dark leather wrap #5a3a20.
 * Materials: wood, leather wrap, brass, steel. No rig.
 */
export default defineAsset({
  name: 'glaive',
  description: 'A chunky 1.6 m glaive: walnut pole, leather wrap, brass collar and butt, big crescent steel blade.',
  detail: 0.005,
  reference: 'docs/item-mockups/glaive-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.5, 0], twoHanded: true },

  build(k) {
    const pole = sdf.capsule([0, 0.05, 0], [0, 1.15, 0], 0.032);
    k.body('pole', pole, {
      color: '#8a5a35',
      roughness: 0.82,
      detail: 0.006,
      paintFn: (x, y, z, base) => (noise.fbm(x * 30, y * 3, z * 30, 2) > 0.3 ? '#74472a' : base),
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 40, y * 3, z * 40, 2),
    });

    const rings = [];
    for (let y = 0.3; y <= 0.801; y += 0.09) rings.push(sdf.torus(0.036, 0.008).at(0, y, 0));
    k.body('wrap', sdf.union(...rings), { color: '#5a3a20', roughness: 0.9, detail: 0.006, maxError: 0.002 });

    const brass = sdf.union(
      sdf.sphere(0.055).at(0, 0.055, 0),
      sdf.torus(0.05, 0.025).at(0, 1.15, 0),
      sdf.cone([0, 1.15, 0], [0, 1.22, 0], 0.045, 0.03),
    );
    k.body('brass', brass, { color: '#d4a93a', metalness: 1, roughness: 0.35, detail: 0.006 });

    const outline = profile.polygon(
      [
        [-0.03, 1.2],
        [0.05, 1.22],
        [0.11, 1.33],
        [0.12, 1.44],
        [0.07, 1.54],
        [-0.03, 1.59],
        [-0.14, 1.57],
        [-0.22, 1.5],
        [-0.13, 1.5],
        [-0.05, 1.46],
        [-0.03, 1.38],
        [-0.04, 1.27],
      ],
      { smooth: true },
    );
    const blade = sdf
      .extrude(outline, 0.05, 0.008)
      .at(0, 0, 0)
      .smoothUnion(0.01, sdf.cone([0.03, 1.25, 0], [0.13, 1.31, 0], 0.03, 0.006));
    const spine = sdf.extrude(profile.polygon([[0.14,1.3],[0.15,1.45],[0.08,1.58],[0.06,1.5],[0.1,1.44],[0.09,1.32]]), 0.3);
    k.body('blade', blade.paintWhere(spine, '#8e959e', 0.02), {
      color: '#c8ccd2',
      metalness: 1,
      roughness: 0.3,
      detail: 0.005,
    } as any);
  },
});
