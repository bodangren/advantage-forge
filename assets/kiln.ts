import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Pottery kiln (props/craft-and-trade/kiln), matched to docs/item-mockups/kiln-mock.jpg.
 * Size: 1.5 m wide, 1.55 m tall with its chimney, on y = 0, opening toward +Z. One idea: a round
 * beehive dome of rounded clay bricks with an arched opening that glows orange, a small chimney on
 * top, and two finished pots beside it. Palette: bricks #c9774a / #a85a35, mortar #7a5234,
 * glow #ff7a1a on a dark base #4a1405, pots #d9774a.
 */

const BRICK = rgb('#c9774a');
const BRICK_DARK = rgb('#a85a35');
const MORTAR = rgb('#7a5234');

const brickEdge = (x: number, y: number, z: number) => {
  const row = Math.floor(y / 0.12);
  const a = Math.atan2(z, x) / (2 * Math.PI) * 26 + (row % 2) * 0.5;
  const du = Math.abs(a - Math.round(a));
  const dv = Math.abs(y / 0.12 - Math.round(y / 0.12));
  return Math.min(du * 3, dv);
};

export default defineAsset({
  name: 'kiln',
  description: 'A round beehive clay kiln of rounded bricks with a glowing arched opening, a small chimney, and two pots beside it.',
  detail: 0.008,
  reference: 'docs/item-mockups/kiln-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const dome = sdf.revolve(profile.polygon([[0, 0], [0.62, 0], [0.64, 0.35], [0.55, 0.85], [0.35, 1.18], [0.12, 1.3], [0, 1.31]], { smooth: true }));
    const arch = sdf.union(sdf.box([0.44, 0.4, 0.6]).at(0, 0.2, 0.6), sdf.cylinder(0.22, 0.6, 0).rotateX(90).at(0, 0.4, 0.6));
    const inside = sdf.revolve(profile.polygon([[0, 0.02], [0.5, 0.02], [0.52, 0.35], [0.44, 0.8], [0, 1.1]], { smooth: true }));
    const chimney = sdf.cylinder(0.11, 0.3, 0.02).at(0, 1.38, 0).subtract(sdf.cylinder(0.06, 0.4, 0).at(0, 1.45, 0));
    const shell = sdf
      .smoothUnion(0.04, dome, chimney)
      .subtract(inside)
      .smoothSubtract(0.02, arch)
      .paintFn((x, y, z) => {
        const e = brickEdge(x, y, z);
        const n = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2);
        return e < 0.05 ? MORTAR : mixRgb(BRICK, BRICK_DARK, 0.2 + 0.4 * n);
      });
    k.body('kiln', shell, {
      color: '#c9774a',
      roughness: 0.85,
      metalness: 0,
      bump: (x, y, z) => -0.006 * Math.max(0, 1 - brickEdge(x, y, z) / 0.08),
    });
    // The glowing fire inside, seen through the opening.
    k.body('fire', inside.round(-0.02).intersect(sdf.box([0.6, 0.5, 0.6]).at(0, 0.25, 0.2)), {
      color: '#4a1405',
      roughness: 0.5,
      metalness: 0,
      emissive: '#ff7a1a',
      emissiveIntensity: 1.8,
    });
    const pot = (x: number, z: number, s: number) =>
      sdf
        .revolve(profile.polygon([[0, 0], [0.09 * s, 0], [0.13 * s, 0.1 * s], [0.1 * s, 0.2 * s], [0.07 * s, 0.24 * s], [0.08 * s, 0.26 * s], [0, 0.26 * s]], { smooth: true }))
        .subtract(sdf.cylinder(0.055 * s, 0.2 * s, 0).at(0, 0.25 * s, 0))
        .at(x, 0, z);
    k.body('pots', sdf.union(pot(0.72, 0.35, 1), pot(0.62, 0.62, 0.8)), { color: '#d9774a', roughness: 0.75, metalness: 0 });
  },
});
