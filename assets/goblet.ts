import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Pewter wine goblet (props/food/goblet): a tabletop prop for the tavern that reads at 128 px.
 * Size: 0.16 m tall, cup 0.09 m wide, foot 0.088 m wide, on y = 0, faces +Z.
 * One idea: a wide pewter cup on a thin stem with a round knop and a fluted bell foot, filled with
 * dark red wine. Shape language: round cup and knop, flat wide foot for a sturdy read.
 * Palette: pewter #9aa3ad, dark pewter #6d757e (foot, inner wall), rim highlight #c2c9d1,
 * wine #7a1c22. Materials: pewter (roughness 0.4, metalness 0.8), wine (roughness 0.2).
 */

const PEWTER = rgb('#9aa3ad');
const PEWTER_DARK = rgb('#6d757e');
const PEWTER_LIGHT = rgb('#c2c9d1');
const WINE = rgb('#7a1c22');
const WINE_DEEP = rgb('#4a1114');

const H = 0.16;
const RIM_Y = 0.155; // top of the cup wall
const WINE_Y = 0.149; // wine surface

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

export default defineAsset({
  name: 'goblet',
  description: 'Pewter goblet with a wide cup, a rolled rim, a knop stem, a fluted bell foot, and dark red wine.',
  detail: 0.0035,
  reference: 'docs/item-mockups/goblet-mock.jpg',
  texture: { size: 512 },

  build(k) {
    // Foot: a flat disc with a low bell that narrows into the stem.
    const foot = sdf.smoothUnion(
      0.006,
      sdf.cylinder(0.044, 0.009, 0.004).at(0, 0.0045, 0),
      sdf.cone([0, 0.006, 0], [0, 0.03, 0], 0.034, 0.008),
    );
    const stem = sdf.capsule([0, 0.02, 0], [0, 0.085, 0], 0.0068);
    const knop = sdf.ellipsoid([0.0145, 0.0105, 0.0145]).at(0, 0.054, 0);
    // Cup: one revolved wall profile (radius, height), outer side up, rolled rim, inner side down.
    const cupWall = sdf.revolve(
      profile.polygon(
        [
          [0, 0.072],
          [0.018, 0.075],
          [0.032, 0.086],
          [0.039, 0.104],
          [0.042, 0.128],
          [0.0443, 0.15],
          [0.0447, 0.1555],
          [0.0415, 0.159],
          [0.0378, 0.1558],
          [0.0372, 0.15],
          [0.0352, 0.128],
          [0.0322, 0.108],
          [0.0245, 0.094],
          [0.012, 0.0875],
          [0, 0.0865],
        ],
        { smooth: true },
      ),
    );
    const cupJoin = sdf.cone([0, 0.066, 0], [0, 0.08, 0], 0.0075, 0.017);
    const outer = sdf
      .smoothUnion(0.005, foot, stem, knop, cupJoin)
      .smoothUnion(0.004, cupWall)
      .intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([0.2, 0.4, 0.2]).at(0, 0.1, 0)));

    // The inside of the cup, for the dark wall paint and the wine.
    const cavity = sdf.revolve(
      profile.polygon(
        [
          [0, 0.0862],
          [0.012, 0.0872],
          [0.0247, 0.0937],
          [0.0325, 0.1078],
          [0.0355, 0.128],
          [0.0375, 0.15],
          [0.038, 0.17],
          [0, 0.17],
        ],
        { smooth: false },
      ),
    );

    const pewterFn = (x: number, y: number, _z: number) => {
      const t = clamp(y / H);
      const c = mixRgb(PEWTER_DARK, PEWTER, 0.35 + 0.65 * t);
      return mixRgb(c, PEWTER_LIGHT, 0.1 * (0.5 + 0.5 * noise.noise3(x * 40, y * 40, 0)));
    };
    // Foot flutes and faint metal grain, in the normal map only.
    const pewterBump = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const flute = Math.pow(0.5 + 0.5 * Math.cos(a * 12), 4);
      const onFoot = clamp((0.03 - y) / 0.02) * clamp((y - 0.008) / 0.004);
      return -0.0014 * flute * onFoot + 0.0005 * noise.fbm(x * 60, y * 60, z * 60, 2);
    };

    const pewter = outer
      .paintFn(pewterFn)
      .paintWhere(sdf.box([0.3, 0.01, 0.3]).at(0, RIM_Y, 0), PEWTER_LIGHT, 0.003)
      .paintWhere(knop.round(0.002), PEWTER_LIGHT, 0.003)
      .paintWhere(cavity.round(0.0012).intersect(sdf.halfSpace([0, 1, 0], RIM_Y - 0.003).intersect(sdf.box([0.2, 0.4, 0.2]).at(0, 0.1, 0))), PEWTER_DARK, 0.004);
    k.body('pewter', pewter, {
      color: '#9aa3ad',
      roughness: 0.4,
      metalness: 0.8,
      detail: 0.0025,
      maxTriangles: 8000,
      bump: pewterBump,
    });

    // Wine fills the cup to just under the rim; it grows into the wall so no gap shows.
    const wine = cavity
      .round(0.0012)
      .intersect(sdf.halfSpace([0, 1, 0], WINE_Y).intersect(sdf.box([0.12, 0.2, 0.12]).at(0, 0.1, 0)))
      .paintFn((x, y, z) => {
        const swirl = 0.5 + 0.5 * noise.noise3(x * 55, y * 30, z * 55);
        return mixRgb(WINE_DEEP, WINE, 0.55 + 0.35 * swirl);
      });
    k.body('wine', wine, { color: '#7a1c22', roughness: 0.2, metalness: 0, detail: 0.0035, maxTriangles: 500 });
  },
});
