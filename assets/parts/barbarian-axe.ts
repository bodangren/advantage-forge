import { noise, profile, sdf, type Part } from '../../src/index.js';

/**
 * Barbarian double-bladed axe (part of `assets/barbarian.ts`; standalone `assets/barbarian-axe.ts`).
 * Class: hand-held. Local frame: the right fist's grip at the origin, the haft along Y with the
 * head toward -Y (0.25 m below the grip), the blades along +-X. Bodies: axe, axe-iron, haft (bone
 * `hand.R`). Tint slots: none.
 */

const rad = Math.PI / 180;
const C = { steel: '#a8adb4', steelLight: '#d8dce0', iron: '#3a3c42', haft: '#4a2e1c', wrap: '#7a5234' };
const AXE_L = 0.25;
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const norm = (v: [number, number, number]): [number, number, number] => {
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
};

const bladeProfile = profile.polygon(
  [
    [0.02, 0.026], [0.05, 0.042], [0.08, 0.07], [0.104, 0.1], [0.118, 0.07], [0.126, 0.03], [0.128, 0],
    [0.126, -0.03], [0.118, -0.07], [0.104, -0.1], [0.08, -0.07], [0.05, -0.042], [0.02, -0.026],
  ],
  { smooth: true, samples: 4 },
);
const hexagon = profile.polygon([0, 60, 120, 180, 240, 300].map((a) => [0.044 * Math.cos((a + 30) * rad), 0.044 * Math.sin((a + 30) * rad)] as [number, number]));

export function barbarianAxe(): Part {
  const bevel = sdf.intersect(
    sdf.halfSpace(norm([0.07, 0, 1]), 0.0114 / Math.hypot(0.07, 1)),
    sdf.halfSpace(norm([0.07, 0, -1]), 0.0114 / Math.hypot(0.07, 1)),
  );
  const blades = hard(sdf.extrude(bladeProfile, 0.03, 0.002).intersect(bevel).scale([1.12, 1.12, 1]))
    .paintWhere(hard(sdf.box([0.03, 0.4, 0.2]).at(0.141, 0, 0)), C.steelLight, 0.006)
    .union(sdf.union(sdf.sphere(0.011).at(0, 0, 0.024), sdf.sphere(0.011).at(0, 0, -0.024)))
    .at(0, -AXE_L, 0);
  const socket = sdf.extrude(hexagon, 0.046, 0.006).at(0, -AXE_L, 0);
  const spike = sdf.cone([0, -AXE_L - 0.05, 0], [0, -AXE_L - 0.09, 0], 0.02, 0.004);
  const butt = sdf.smoothUnion(0.006, sdf.sphere(0.019).at(0, 0.097, 0), sdf.cylinder(0.018, 0.018, 0.004).at(0, 0.08, 0));
  const haftShape = sdf
    .cylinder(0.0145, 0.41, 0.004)
    .at(0, -0.115, 0)
    .union(sdf.cylinder(0.0168, 0.14, 0.004).at(0, 0.01, 0))
    .paintWhere(sdf.cylinder(0.03, 0.14).at(0, 0.01, 0), C.wrap);
  return {
    name: 'barbarian-axe',
    bodies: [
      { name: 'axe', shape: blades, options: { color: C.steel, roughness: 0.35, metalness: 0.85, detail: 0.003 }, bone: 'hand.R' },
      { name: 'axe-iron', shape: sdf.union(socket, spike, butt), options: { color: C.iron, roughness: 0.45, metalness: 0.8, detail: 0.004 }, bone: 'hand.R' },
      {
        name: 'haft',
        shape: haftShape,
        options: {
          color: C.haft,
          roughness: 0.7,
          detail: 0.004,
          bump: (x: number, y: number, z: number) => 0.001 * Math.abs(Math.sin(noise.noise3(x * 3, y * 3, z * 3) + (x + y) * 240)),
        },
        bone: 'hand.R',
      },
    ],
  };
}
