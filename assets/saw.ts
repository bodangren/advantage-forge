import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — carpenter hand saw (props/craft-and-trade/saw), reworked.
 *
 * Role: workshop hand saw; must read at 128 px as a wide steel blade with big
 *   zigzag teeth and a tall chunky closed oak grip.
 * Size: 0.6 m long (blade tip x -0.44 to grip end x 0.16), lying flat on y = 0,
 *   blade toward -X, handle toward +X, teeth on +Z. Grip top at y 0.06.
 * One idea: a thick (14 mm) wide blade with 12 large triangular teeth, and a
 *   grip that stands well above the blade for the side silhouette.
 * Shape language: square dominant, triangular secondary (teeth, cut tip).
 * Palette: steel #c8ccd2 with #8e959e back band; leather-wood plate #8a5a35;
 *   pale oak grip #c8955a; iron rivets #4a4f55.
 * Materials: steel, plate, grip, rivets (one body each).
 * Detail: primary blade + grip; secondary teeth, plate, rivets; tertiary oak
 *   grain bump, dark back band.
 * Rig/animation: none.
 */

const STEEL = rgb('#c8ccd2');
const STEEL_DEEP = rgb('#8e959e');

const TIP_X = -0.44;
const W_HANDLE = 0.16;
const W_TIP = 0.11;
const TEETH = 12;
const TOOTH_H = 0.022;
const T = 0.014;

// Profile X = world X, profile Y = world Z. Counter-clockwise loop.
const halfW = (x: number) => (W_TIP + ((W_HANDLE - W_TIP) * (x - TIP_X)) / -TIP_X) / 2;
const pts: [number, number][] = [];
pts.push([0, -halfW(0)]);
pts.push([TIP_X + 0.055, -halfW(TIP_X)]);
pts.push([TIP_X, -halfW(TIP_X) + 0.055]); // 45 degree corner cut
const x0 = TIP_X;
const pitch = -TIP_X / TEETH;
pts.push([x0, halfW(x0)]);
for (let i = 0; i < TEETH; i++) {
  const xa = x0 + i * pitch;
  const xb = xa + pitch;
  pts.push([xa + pitch / 2, halfW(xa + pitch / 2) + TOOTH_H]);
  pts.push([xb, halfW(xb)]);
}
pts.reverse();
const blade = sdf
  .extrude(profile.polygon(pts), T, 0.003)
  .rotateX(90)
  .at(0, T / 2, 0);

const bladePaint = (_x: number, _y: number, z: number, base: any) =>
  z < -halfW(-0.2) + 0.03 ? mixRgb(STEEL, STEEL_DEEP, 0.9) : STEEL;

const plate = sdf.box([0.16, 0.018, 0.12], 0.006).at(0.03, 0.009, 0).subtract(sdf.box([0.07, 0.1, 0.09], 0.02).at(0.09, 0.035, 0));
const grip = sdf
  .box([0.14, 0.05, 0.16], 0.02)
  .subtract(sdf.box([0.07, 0.1, 0.09], 0.02))
  .at(0.09, 0.035, 0);
const dome = (x: number, z: number) =>
  sdf.sphere(0.008).at(x, 0.018, z).intersect(sdf.box([0.05, 0.05, 0.05]).at(x, 0.03, z));
const rivets = dome(-0.02, -0.04).union(dome(-0.02, 0)).union(dome(-0.02, 0.04));

export default defineAsset({
  name: 'saw',
  description:
    'Carpenter hand saw, 0.6 m: a wide thick steel blade with 12 big triangular teeth, a brown plate with three rivets and a chunky closed pale oak grip.',
  detail: 0.004,
  reference: 'docs/item-mockups/saw-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    k.body('steel', blade.paintFn(bladePaint), {
      color: '#c8ccd2',
      roughness: 0.3,
      metalness: 1,
      maxTriangles: 1800,
    });
    k.body('plate', plate.paint(rgb('#8a5a35')), { color: '#8a5a35', roughness: 0.8, maxTriangles: 400 });
    k.body('grip', grip.paint(rgb('#c8955a')), {
      color: '#c8955a',
      roughness: 0.8,
      bump: (x, y, z) => 0.001 * (noise.fbm(x * 24, y * 5, z * 24, 2) - 0.5),
      maxTriangles: 1200,
    });
    k.body('rivets', rivets.paint(rgb('#4a4f55')), { color: '#4a4f55', roughness: 0.5, metalness: 0.7, detail: 0.003, maxTriangles: 200 });
  },
});
