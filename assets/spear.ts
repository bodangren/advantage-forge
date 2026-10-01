import { HAND_FIT, defineAsset, noise, profile, sdf } from '../src/index.js';

// Design note — spear (equipment/weapons/spear).
//
// Role: equipment weapon / pickup icon; must read at 128 px.
// Size: 1.7 m tall, stands on its bone butt at y = 0, faces +Z.
// One idea: a chunky gnarled pale shaft crowned by a big leaf-shaped steel head.
// Shape language: leaf point and curved prongs (dominant), round shaft and knob.
// Palette: pale wood #e0b878, wrap #b8905a, bone #e8dcc0, steel #c8ccd2 with
//   ridge #8e959e.
// Materials: wood (rough 0.8), bone (rough 0.7), steel (metal 1, rough 0.3).
// Detail: fbm-gnarled shaft, eight tilted wrap rings, bone butt, bone socket
//   with two horn prongs, extruded leaf blade with a painted ridge.
// Rig/animation: none.

const BONE = '#e8dcc0';

export default defineAsset({
  name: 'spear',
  description: 'Chunky pale-wood spear with a spiral wrap, bone socket and prongs, and a leaf steel head.',
  detail: 0.005,
  reference: 'docs/item-mockups/spear-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.6, 0] },

  build(k) {
    const shaft = sdf
      .capsule([0, 0.08, 0], [0, 1.35, 0], 0.035)
      .displace(0.006, (x, y, z) => noise.fbm(x * 30, y * 8, z * 30, 3))
      .paint('#e0b878');
    const rings: sdf.Shape[] = [];
    for (let i = 0; i < 8; i++) {
      rings.push(sdf.torus(0.04, 0.012).rotateZ(20).rotateY(i * 40).at(0, 0.3 + i * (0.9 / 7), 0));
    }
    const wrap = sdf.union(...rings).paint('#b8905a');
    k.body('wood', sdf.union(shaft, wrap), {
      color: '#e0b878',
      roughness: 0.8,
      detail: 0.005,
      maxTriangles: 1700,
    });

    const butt = sdf.ellipsoid([0.06, 0.08, 0.06]).at(0, 0.06, 0);
    const socket = sdf.cone([0, 1.35, 0], [0, 1.45, 0], 0.045, 0.03);
    const prong = (s: number) =>
      sdf.chain(
        [
          [s * 0.035, 1.37, 0, 0.015],
          [s * 0.07, 1.41, 0, 0.015],
          [s * 0.09, 1.46, 0, 0.013],
          [s * 0.085, 1.5, 0, 0.008],
        ],
        0.01,
      );
    k.body('bone', sdf.smoothUnion(0.01, butt, socket, prong(1), prong(-1)), {
      color: BONE,
      roughness: 0.7,
      detail: 0.005,
      maxTriangles: 1200,
    });

    const outline = profile.polygon(
      [
        [0, 0],
        [0.04, 0.02],
        [0.07, 0.08],
        [0.05, 0.16],
        [0.02, 0.22],
        [0, 0.26],
        [-0.02, 0.22],
        [-0.05, 0.16],
        [-0.07, 0.08],
        [-0.04, 0.02],
      ],
      { smooth: true },
    );
    const blade = sdf
      .extrude(outline, 0.03, 0.006)
      .at(0, 1.44, 0)
      .paintWhere(sdf.box([0.018, 0.22, 0.3]).at(0, 1.56, 0), '#8e959e', 0.008);
    k.body('blade', blade, {
      color: '#c8ccd2',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 1200,
    });
  },
});
