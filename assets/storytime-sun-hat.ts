import { defineAsset, mixRgb, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 child's sun hat, a small check-row picture prop.
 * Role: a child's sun hat that a five-year-old reads as "hat" at 1500 px and in line art.
 * Size: about 0.34 m across the brim and 0.122 m tall, resting on y = 0 and facing +Z.
 * One idea: the picture-book hat. A round crown with straight sides, a soft flat top with a small
 *   dent, a wide soft brim that turns down at the edge, and a red ribbon with a bow on +X.
 * Shape language: a rounded cylinder crown, a thin wavy brim, a thick soft ribbon band.
 * Palette: straw #f2c75c, straw dark #d9a53c, ribbon #e03a3a.
 * Materials: matte straw with a soft ring paint, matte cloth ribbon.
 * Detail: the bow sits on the +X side (the side that the three-quarter and side views show).
 * Rig/animation: none. No text, number, logo, face, flower, or woven holes.
 */

const STRAW = rgb('#f2c75c');
const STRAW_LIGHT = rgb('#f8dc88');
const STRAW_DARK = rgb('#d9a53c');
const RIBBON = rgb('#e03a3a');
const RIBBON_LIGHT = rgb('#f0605a');

const R_BRIM = 0.172;
const R_CROWN = 0.082;
const CROWN_BASE = 0.014;
const CROWN_TOP = 0.122;

// The brim: a thin disc that rises toward the crown and turns down at the edge.
const brimProfile = [
  [0, 0.028],
  [0.07, 0.029],
  [0.105, 0.030],
  [0.135, 0.024],
  [0.158, 0.0135],
  [0.17, 0.0075],
  [0.1725, 0.0035],
  [0.166, 0.0005],
  [0.152, 0.004],
  [0.13, 0.011],
  [0.105, 0.017],
  [0.07, 0.019],
  [0, 0.019],
] as [number, number][];

export default defineAsset({
  name: 'storytime-sun-hat',
  description: "A child's sun hat: round straw crown with a dent, wide soft brim, and a red ribbon with a bow.",
  detail: 0.0013,
  texture: { size: 1024 },

  build(k) {
    const brim = sdf
      .revolve(profile.polygon(brimProfile, { smooth: true }))
      .displace(0.0035, (x, _y, z) => {
        const r = Math.hypot(x, z);
        const edge = Math.min(1, Math.max(0, (r - 0.1) / 0.07));
        return Math.sin(Math.atan2(z, x) * 5) * edge;
      });

    const crown = sdf.cylinder(R_CROWN, CROWN_TOP - CROWN_BASE, 0.022).at(0, (CROWN_TOP + CROWN_BASE) / 2, 0);
    const dent = sdf.ellipsoid([0.04, 0.014, 0.04]).at(0, CROWN_TOP + 0.007, 0);

    const hat = crown
      .smoothUnion(0.012, brim)
      .smoothSubtract(0.01, dent)
      .paintFn((x, y, z, base) => {
        const r = Math.hypot(x, z);
        // Soft braid rings: slightly darker lines around the brim and the crown top.
        const ring = 0.5 + 0.5 * Math.sin(r * 230);
        let c = mixRgb(base, STRAW_DARK, ring * 0.22);
        // A lighter top, a darker underside.
        c = mixRgb(c, STRAW_LIGHT, Math.min(0.3, Math.max(0, (y - 0.03) * 3.2)));
        if (y < 0.012 && r > 0.1) c = mixRgb(c, STRAW_DARK, 0.35);
        return c;
      });
    k.body('hat', hat, { color: STRAW, roughness: 0.75, detail: 0.0013, maxTriangles: 30000 });

    // The ribbon: a thick soft band around the base of the crown.
    const band = sdf
      .cylinder(R_CROWN + 0.005, 0.03, 0.009)
      .subtract(sdf.cylinder(R_CROWN - 0.01, 0.2))
      .at(0, 0.048, 0)
      .paintFn((_x, y, _z, base) => mixRgb(base, RIBBON_LIGHT, Math.min(0.3, Math.max(0, (y - 0.05) * 6))));
    k.body('ribbon', band, { color: RIBBON, roughness: 0.6, detail: 0.0011, maxTriangles: 8000 });

    // The bow on +X: a knot, two loops that point sideways (±Z), and two tails on the brim.
    const bx = R_CROWN + 0.012;
    const by = 0.049;
    const knot = sdf.ellipsoid([0.011, 0.016, 0.013]).at(bx + 0.003, by, 0);
    const loopA = sdf.ellipsoid([0.008, 0.022, 0.032]).rotateX(-22).at(bx + 0.004, by + 0.003, 0.036);
    const loopB = sdf.ellipsoid([0.008, 0.022, 0.032]).rotateX(22).at(bx + 0.004, by + 0.003, -0.036);
    const tailA = sdf.cone([bx + 0.004, by - 0.008, 0.006], [bx + 0.03, 0.036, 0.024], 0.005, 0.0105);
    const tailB = sdf.cone([bx + 0.004, by - 0.008, -0.006], [bx + 0.03, 0.036, -0.024], 0.005, 0.0105);
    const bow = knot.smoothUnion(0.006, loopA, loopB, tailA, tailB);
    k.body('bow', bow, { color: RIBBON, roughness: 0.6, detail: 0.0011, maxTriangles: 10000 });
  },
});
