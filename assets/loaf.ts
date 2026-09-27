import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Round crusty loaf (props/food/loaf): a tabletop prop for the tavern feast, read at 128 px.
 * Size: 0.23 m wide, 0.16 m tall, on y = 0. One idea: a high golden boule with three raised,
 * darker baked slash ridges across the crown. Palette: crust #e0a452, light crown #f2c878,
 * baked underside #9a5a26, slash ridges #b5582c. Material: matte bread (roughness 0.8).
 */

const CRUST = rgb('#e0a452');
const CROWN = rgb('#f2c878');
const UNDER = rgb('#9a5a26');
const RIDGE = rgb('#b5582c');
const RIDGE_DARK = rgb('#8e3f1e');

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

export default defineAsset({
  name: 'loaf',
  description: 'A round golden bread loaf with three raised, darker baked slash ridges across the top.',
  detail: 0.005,
  reference: 'docs/item-mockups/loaf-mock.jpg',
  texture: { size: 512 },

  build(k) {
    // The boule: a high dome with a flat, slightly tucked base and a lumpy surface.
    const boule = sdf
      .smoothUnion(
        0.05,
        sdf.ellipsoid([0.115, 0.085, 0.11]).at(0, 0.078, 0),
        sdf.cylinder(0.085, 0.02, 0.01).at(0, 0.01, 0),
      )
      .displace(0.003, (x, y, z) => noise.fbm(x * 14, y * 11, z * 14, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([0.4, 0.4, 0.4]).at(0, 0.15, 0)));

    k.body(
      'loaf',
      boule.paintFn((x, y, z) => {
        const t = clamp(y / 0.165);
        let c = mixRgb(UNDER, CRUST, clamp((t - 0.05) / 0.3));
        c = mixRgb(c, CROWN, clamp((t - 0.6) / 0.4) * 0.6);
        const n = 0.5 + 0.5 * noise.fbm(x * 40, y * 40, z * 40, 2);
        return mixRgb(c, UNDER, clamp((n - 0.62) * 2) * 0.35);
      }),
      {
        color: '#e0a452',
        roughness: 0.8,
        metalness: 0,
        textureDensity: 2,
        paintWeight: 2,
        bump: (x, y, z) => 0.0012 * noise.fbm(x * 45, y * 45, z * 45, 2),
        maxTriangles: 2600,
      },
    );

    // Slash ridges: a thin shell of the loaf cut by three parallel diagonal strips on the crown.
    const strips = sdf.union(
      ...[-0.058, 0, 0.058].map((off, i) =>
        sdf
          .box([0.16 - Math.abs(off) * 0.9, 0.3, 0.026], 0.012)
          .at(0, 0.2, off)
          .rotateY(-32 + i * 2),
      ),
    );
    const ridges = boule
      .round(0.008)
      .smoothIntersect(0.004, strips)
      .smoothIntersect(0.01, sdf.box([0.4, 0.2, 0.4]).at(0, 0.19, 0))
      .paintFn((x, y, z) => mixRgb(RIDGE_DARK, RIDGE, 0.6 + 0.4 * noise.noise3(x * 60, y * 60, z * 60)));
    k.body('ridges', ridges, {
      color: '#b5582c',
      roughness: 0.6,
      metalness: 0,
      textureDensity: 2,
      detail: 0.004,
      maxTriangles: 1800,
    });
  },
});
