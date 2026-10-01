import { mixRgb, noise, profile, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Spear warden spear (part of `assets/spear-warden.ts`; standalone `assets/spear-warden-spear.ts`).
 * A 1.3 m dark shaft, a bronze leaf head on a socket, a red tassel, and a bronze butt cap.
 * Class: hand-held. Local frame: the origin is the butt, the shaft along +Y, the blade flat toward +Z.
 * The host tilts it (`spearPose`). Bodies: spear, spear-bronze, spear-tassel (bone `hand.R`).
 */
const C = { bronze: '#c99a30', bronzeDark: '#86601f', red: '#b83a3a', shaft: '#4a2e1c' };
type V3 = readonly [number, number, number];
const rad = Math.PI / 180;

export function spearWardenSpear(): Part {
  const SP_TOP = 1.5;
  const shaftLen = 1.3;
  const shaft = sdf.capsule([0, 0, 0], [0, shaftLen, 0], 0.014).paintFn((x, y, z, base) => (y > 0.22 && y < 0.36 ? mixRgb(base, rgb('#2e1c10'), 0.6) : base));
  const HEAD_LEN = 0.27;
  const leaf = profile.polygon(
    (
      [
        [-0.014, 0.0],
        [0.014, 0.0],
        [0.032, 0.035],
        [0.05, 0.09],
        [0.037, 0.16],
        [0.015, 0.23],
        [0, 0.27],
        [-0.015, 0.23],
        [-0.037, 0.16],
        [-0.05, 0.09],
        [-0.032, 0.035],
      ] as [number, number][]
    ).map(([x, y]) => [x, y] as [number, number]),
    { smooth: true, samples: 4 },
  );
  const bladeAt = (s: sdf.Shape) => s.at(0, SP_TOP - HEAD_LEN, 0);
  const blade = bladeAt(
    sdf.smoothUnion(0.006, sdf.extrude(leaf, 0.01, 0.004), sdf.capsule([0, 0.0, 0], [0, HEAD_LEN - 0.02, 0], 0.0085)),
  ).paintWhere(bladeAt(sdf.extrude(leaf, 0.3).subtract(sdf.extrude(profile.offsetProfile(leaf, -0.008), 0.3))), C.bronzeDark, 0.0015);
  const socket = sdf.union(
    sdf.cone([0, SP_TOP - HEAD_LEN - 0.03, 0], [0, SP_TOP - HEAD_LEN + 0.02, 0], 0.016, 0.024),
    sdf.cylinder(0.0245, 0.022, 0.006).at(0, SP_TOP - HEAD_LEN - 0.04, 0),
    sdf.torus(0.02, 0.006).at(0, SP_TOP - HEAD_LEN - 0.065, 0),
  );
  const buttCap = sdf.cone([0, -0.004, 0], [0, 0.05, 0], 0.012, 0.0205).smoothUnion(0.006, sdf.torus(0.019, 0.0055).at(0, 0.05, 0));
  const tassel = sdf.union(
    ...[0, 1, 2, 3, 4, 5].map((i) => {
      const a = (i * 60 + 15) * rad;
      const top: V3 = [0.013 * Math.cos(a), SP_TOP - HEAD_LEN - 0.05, 0.013 * Math.sin(a)];
      const tip: V3 = [0.03 * Math.cos(a), SP_TOP - HEAD_LEN - 0.125, 0.03 * Math.sin(a)];
      return sdf.cone(top, tip, 0.0105, 0.0035);
    }),
  );
  return {
    name: 'spear-warden-spear',
    bodies: [
      {
        name: 'spear',
        shape: shaft,
        options: { color: C.shaft, roughness: 0.75, detail: 0.004, bump: (x, y, z) => 0.0007 * noise.noise3(x * 80, y * 10, z * 80) },
        bone: 'hand.R',
      },
      { name: 'spear-bronze', shape: sdf.union(blade, socket, buttCap), options: { color: C.bronze, roughness: 0.45, metalness: 0.7, detail: 0.003 }, bone: 'hand.R' },
      { name: 'spear-tassel', shape: tassel, options: { color: C.red, roughness: 0.75, detail: 0.003 }, bone: 'hand.R' },
    ],
  };
}
