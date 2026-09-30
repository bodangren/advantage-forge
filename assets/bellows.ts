import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - hand bellows (props/craft-and-trade/bellows).
 *
 * Role: blacksmith-shop prop that feeds the forge; reads at 128 px as one
 *   stout leather pump lying on the stone floor.
 * Size: 0.40 m long (nozzle tip to handle ends), 0.20 m wide at the back,
 *   0.16 m tall at the back hinge, 0.05 m at the nozzle; y = 0, nozzle +Z.
 * One idea: a chunky teardrop wedge - two thick walnut paddles closed to a
 *   point at the brass nozzle and opened at the back hinge, with one puffy
 *   leather bag bulging out of the gap.
 * Shape language: round dominant (puffy leather), square secondary (boards,
 *   blocky handles).
 * Palette: leather #8a5a35, walnut #6b4226 / #54331d, brass #caa24a,
 *   iron #4a4f55, soot #2a2a2a.
 * Materials: leather 0.62, walnut 0.8 with grain bump, brass metal 1 / 0.3,
 *   iron metal 0.7 / 0.55.
 * Detail: primary = 2 boards + leather + nozzle; secondary = handles, iron
 *   straps; tertiary = waist seam, soot, rivets, grain bump.
 * Rig/animation: none - static prop.
 */

const LEATHER = rgb('#8a5a35');
const LEATHER_LIGHT = rgb('#b98a55');
const LEATHER_DARK = '#6e4527';
const WALNUT = rgb('#6b4226');
const WALNUT_DARK = rgb('#54331d');
const WALNUT_LIGHT = rgb('#8a6540');
const BRASS = '#caa24a';
const IRON = '#4a4f55';
const SOOT = rgb('#2a2a2a');

const T = 0.02; // board thickness
const TOP_Y = 0.10; // top board centre at z = 0
const TILT = (Math.atan(0.1 / 0.28) * 180) / Math.PI; // front 0.05, back 0.15
const TAN = Math.tan((TILT * Math.PI) / 180);
// centre height of the top board at z
const topY = (z: number) => TOP_Y - TAN * z;

// Plan (U = x half width, V = z): point at nozzle z 0.14, 0.20 wide at z -0.06.
const TEARDROP = profile.polygon(
  [
    [0.0, 0.14],
    [0.03, 0.12],
    [0.066, 0.06],
    [0.094, 0.0],
    [0.1, -0.06],
    [0.09, -0.108],
    [0.06, -0.135],
    [0.0, -0.14],
    [-0.06, -0.135],
    [-0.09, -0.108],
    [-0.1, -0.06],
    [-0.094, 0.0],
    [-0.066, 0.06],
    [-0.03, 0.12],
  ],
  { smooth: true },
);

const flatBoard = () => sdf.extrude(TEARDROP, T, 0.006).rotateX(90);
const bottomShape = () => flatBoard().at(0, 0.01, 0);
const topShape = () => flatBoard().rotateX(TILT).at(0, TOP_Y, 0);

const grain = (seed: number, dark: number) => (x: number, y: number, z: number) => {
  const tint = noise.random(seed, 3);
  const g = 0.5 + 0.5 * noise.fbm(x * 18, y * 30, z * 7, 2);
  const c = mixRgb(WALNUT, WALNUT_DARK, dark + 0.25 * tint + 0.15 * g);
  return mixRgb(c, WALNUT_LIGHT, 0.12 * g);
};
const walnutBump = (x: number, y: number, z: number) => 0.0012 * noise.fbm(x * 22, y * 34, z * 8, 2);

export default defineAsset({
  name: 'bellows',
  description:
    'Stout hand bellows: two walnut paddles around a puffy leather bag, brass nozzle, chunky handles, iron hinge straps.',
  detail: 0.005,
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ leather
    const gapMid = 0.5 * (0.02 + topY(-0.05) - T / 2);
    const puff = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.12, 0.06, 0.115]).at(0, -0.02, 0),
        sdf.ellipsoid([0.105, 0.055, 0.105]).at(0, 0.03, 0.0),
      )
      .rotateX(TILT * 0.8)
      .at(0, gapMid + 0.005, -0.05);
    const nrm = Math.hypot(1, TAN);
    const capped = puff
      .intersect(sdf.halfSpace([0, 1 / nrm, TAN / nrm], TOP_Y / nrm))
      .intersect(sdf.halfSpace([0, -1, 0], -0.01));
    const cut = sdf.union(bottomShape().round(0.001), topShape().round(0.001));
    const seamRing = sdf
      .torus(0.113, 0.005)
      .scale([1.06, 1, 0.98])
      .rotateX(TILT * 0.8)
      .at(0, gapMid + 0.002, -0.05);
    const leather = sdf.subtract(capped, cut);
    k.body(
      'leather',
      leather.paintFn((x, y, z) => {
        const patch = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2);
        return mixRgb(LEATHER, LEATHER_LIGHT, 0.08 + 0.3 * patch);
      }),
      {
        color: '#8a5a35',
        roughness: 0.62,
        metalness: 0,
        detail: 0.005,
        paintWeight: 2,
        bump: (x, y, z) => 0.0014 * noise.fbm(x * 34, y * 34, z * 34, 3),
        maxTriangles: 1400,
      },
    );
    k.body('seam', seamRing.subtract(cut), {
      color: LEATHER_DARK,
      roughness: 0.62,
      metalness: 0,
      detail: 0.003,
      maxTriangles: 250,
    });

    // ------------------------------------------------------------ boards
    const bottomHandle = sdf.box([0.05, 0.03, 0.09], 0.01).at(0, 0.015, -0.165);
    const topHandle = sdf
      .box([0.05, 0.03, 0.09], 0.01)
      .rotateX(TILT)
      .at(0, topY(-0.165), -0.165);
    k.body('bottom-board', bottomShape().paintFn(grain(4, 0.5)), {
      color: '#6b4226',
      roughness: 0.8,
      metalness: 0,
      detail: 0.005,
      paintWeight: 2,
      bump: walnutBump,
      maxTriangles: 800,
    });
    k.body('top-board', topShape().paintFn(grain(9, 0.3)), {
      color: '#6b4226',
      roughness: 0.8,
      metalness: 0,
      detail: 0.005,
      paintWeight: 2,
      bump: walnutBump,
      maxTriangles: 800,
    });
    k.body('handles', sdf.union(bottomHandle, topHandle), {
      color: '#54331d',
      roughness: 0.8,
      metalness: 0,
      detail: 0.005,
      bump: walnutBump,
      maxTriangles: 500,
    });

    // ------------------------------------------------------------ nozzle
    const soot = sdf.sphere(0.03).at(0, 0.037, 0.19);
    const nozzle = sdf.cone([0, 0.037, 0.12], [0, 0.037, 0.19], 0.018, 0.01);
    const ring = sdf.torus(0.018, 0.004).rotateX(90).at(0, 0.037, 0.121);
    k.body('nozzle', sdf.smoothUnion(0.004, nozzle, ring).paintWhere(soot, SOOT, 0.01), {
      color: BRASS,
      roughness: 0.3,
      metalness: 1,
      detail: 0.0035,
      maxTriangles: 600,
    });

    // ------------------------------------------------------------ straps
    const bandZ = -0.095;
    const bottomBand = (x: number) => sdf.box([0.03, 0.006, 0.08], 0.002).at(x, 0.022, bandZ);
    const topBand = (x: number) =>
      sdf.box([0.03, 0.006, 0.08], 0.002).rotateX(TILT).at(x, topY(bandZ) + T / 2, bandZ);
    k.body(
      'straps',
      sdf.union(bottomBand(0.065), bottomBand(-0.065), topBand(0.065), topBand(-0.065)),
      { color: IRON, roughness: 0.55, metalness: 0.7, detail: 0.003, maxTriangles: 300 },
    );
    const rivet = (x: number, z: number, top: boolean) =>
      top
        ? sdf.sphere(0.006).at(0, 0, 0).at(x, topY(z) + T / 2 + 0.004, z)
        : sdf.sphere(0.006).at(x, 0.025, z);
    k.body(
      'rivets',
      sdf.union(rivet(0.065, -0.08, false), rivet(-0.065, -0.08, false), rivet(0.065, -0.08, true), rivet(-0.065, -0.08, true)),
      { color: IRON, roughness: 0.55, metalness: 0.7, detail: 0.003, maxTriangles: 150 },
    );
  },
});
