import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — pewter wine goblet (props/food/goblet).
 *
 * Role: tabletop drinking prop for the cozy chibi tavern; reads at 128 px sprite.
 * Size: 0.16 m tall, bowl 0.083 m wide at the collar, foot 0.089 m wide, on y = 0, faces +Z.
 * One idea: a chunky pewter goblet with a fat rounded collar band at the rim and a wide
 *   bell foot, brimming with dark red wine — the wine is the focal point.
 * Shape language: round dominant (bowl, knop, domed foot, rounded collar), square
 *   secondary (the flat foot disc gives a sturdy read).
 * Palette: pewter #9aa3ad (dominant, mid value), pewter dark #6d757e (inner cup,
 *   shaded foot), collar highlight #c2c9d1, wine #6e1a1e (accent, darkest value).
 * Materials: pewter (roughness 0.4, metalness 0.8); wine (roughness 0.28, metalness 0).
 * Detail: primary bowl + stem + foot; secondary collar band + knop; tertiary foot
 *   flutes and metal grain in `bump`. Focal point: dark wine inside the bright cup.
 * Rig/animation: none (static prop).
 */

const PEWTER = rgb('#9aa3ad');
const PEWTER_DARK = rgb('#6d757e');
const PEWTER_LIGHT = rgb('#c2c9d1');
const WINE = rgb('#6e1a1e');
const WINE_DEEP = rgb('#4a1114');

const H = 0.16; // total height
const COLLAR_Y = 0.146; // centre of the raised collar band

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

export default defineAsset({
  name: 'goblet',
  description:
    'Pewter goblet with a round bowl, a raised collar band, a knop stem, a wide bell foot, and dark red wine.',
  detail: 0.0035,
  reference: 'docs/item-mockups/goblet-mock.jpg',
  texture: { size: 512 },

  build(k) {
    // ------------------------------------------------------------ pewter: outer solid
    // Clean primitives, soft-blended: wide foot, thin stem with a round knop, a
    // flaring bowl, and a rounded cylinder as the raised collar band.
    const foot = sdf.smoothUnion(
      0.006,
      sdf.cylinder(0.0445, 0.014, 0.006).at(0, 0.007, 0),
      sdf.cone([0, 0.011, 0], [0, 0.03, 0], 0.041, 0.012),
    );
    const stem = sdf.cylinder(0.0075, 0.055, 0.003).at(0, 0.052, 0);
    const knop = sdf.sphere(0.0155).at(0, 0.05, 0);
    const bowl = sdf.smoothUnion(
      0.007,
      sdf.sphere(0.027).at(0, 0.086, 0),
      sdf.cone([0, 0.09, 0], [0, 0.128, 0], 0.0275, 0.032),
    );
    // The raised collar band: a chunky rounded cylinder at the rim, wider than the bowl.
    const collar = sdf.cylinder(0.04, 0.028, 0.008).at(0, COLLAR_Y, 0);
    const pewterSolid = sdf
      .smoothUnion(0.006, foot, stem, knop, bowl, collar)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // Hollow cavity, cut straight down through the collar to open the cup, so the rim
    // reads as a clean lip with no knife edge.
    const cavity = sdf.smoothUnion(
      0.006,
      sdf.sphere(0.02).at(0, 0.088, 0),
      sdf.cone([0, 0.088, 0], [0, 0.2, 0], 0.02, 0.0285),
    );

    // Soft pewter shading: darker toward the foot, lighter toward the rim, light grain.
    const pewterFn = (x: number, y: number, _z: number) => {
      const t = clamp(y / H);
      let c = mixRgb(PEWTER_DARK, PEWTER, 0.3 + 0.7 * t);
      c = mixRgb(c, PEWTER_LIGHT, 0.08 * (0.5 + 0.5 * noise.noise3(x * 40, y * 40, 0)));
      return c;
    };
    // Foot flutes and faint metal grain, in the normal map only.
    const pewterBump = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const flute = Math.pow(0.5 + 0.5 * Math.cos(a * 12), 4);
      const foot = clamp(1 - y / 0.03);
      return -0.0012 * flute * foot + 0.0006 * noise.fbm(x * 60, y * 60, z * 60, 2);
    };

    const pewter = pewterSolid
      .smoothSubtract(0.004, cavity)
      .paintFn(pewterFn)
      // Raised collar band sits proud and catches a highlight.
      .paintWhere(sdf.box([0.3, 0.021, 0.3]).at(0, COLLAR_Y, 0), PEWTER_LIGHT, 0.004)
      // Dark groove where the collar meets the bowl.
      .paintWhere(sdf.box([0.3, 0.002, 0.3]).at(0, 0.1315, 0), PEWTER_DARK, 0.0015)
      // Inner cup wall reads darker.
      .paintWhere(cavity.round(0.0005), PEWTER_DARK, 0.006);
    k.body('pewter', pewter, {
      color: '#9aa3ad',
      roughness: 0.4,
      metalness: 0.8,
      detail: 0.0035,
      maxTriangles: 2400,
      bump: pewterBump,
    });

    // ------------------------------------------------------------ wine inside
    // Wine fills the cavity to just under the collar, with a softly domed meniscus.
    const wineSurface = 0.147;
    const wine = sdf
      .smoothUnion(
        0.006,
        cavity.intersect(sdf.halfSpace([0, 1, 0], wineSurface)),
        sdf.ellipsoid([0.02, 0.006, 0.02]).at(0, wineSurface - 0.002, 0),
      )
      .round(-0.0012)
      .paintFn((x, y, z) => {
        const d = clamp((y - (wineSurface - 0.02)) / 0.03);
        const swirl = 0.5 + 0.5 * noise.noise3(x * 55, y * 30, z * 55);
        return mixRgb(WINE_DEEP, WINE, 0.35 * d + 0.3 * swirl);
      });
    // A few overflow beads clinging to the outside of the bowl, below the collar.
    const drips = sdf.union(
      ...[
        [-22, 0.019],
        [18, 0.014],
        [66, 0.017],
        [-120, 0.012],
      ].map(([deg, len]) => {
        const a = (deg * Math.PI) / 180;
        const r = 0.03;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        const top = 0.132;
        return sdf
          .capsule([x, top, z], [x, top - len, z], 0.0032)
          .smoothUnion(0.002, sdf.sphere(0.0038).at(x, top - len, z));
      }),
    );
    k.body('wine', sdf.smoothUnion(0.004, wine, drips), {
      color: '#6e1a1e',
      roughness: 0.28,
      metalness: 0,
      detail: 0.0035,
      maxTriangles: 450,
    });
  },
});
