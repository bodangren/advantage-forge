import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — red cape on a gold clasp (equipment/armor/cape).
 *
 * Role: hero gear shown as an icon and on a 128 px sprite; it must read as
 *   "red cape" from the silhouette alone.
 * Size: cloth exactly 1.0 m from clasp to hem, flared hem on y = 0, the collar
 *   and clasp crest a little above 1.0 m. Centered on the Y axis, faces +Z.
 * One idea: a heroic crimson cape hanging open from a rolled collar and a gold
 *   clasp band, with soft vertical folds that end in points at the hem.
 * Shape language: round and soft (rolled collar, pleated bell, wavy hem); the
 *   gold diamond clasp is the single crisp accent.
 * Palette: cape red #c04434 dominant, deep red #8e2a20 for valleys, inside and
 *   the ground shadow, light red #da6248 on the fold ridges; gold #d4a93a is
 *   the 10% accent at the focal point.
 * Materials: cloth (roughness 0.85, weave in bump), gold (roughness 0.3,
 *   metalness 1).
 * Detail: primary bell + collar; secondary clasp band and diamond; tertiary
 *   pleats, wavy hem, weave. Focal point: the gold clasp at the throat.
 * Rig/animation: none (static display piece).
 */

const RED = rgb('#c44636');
const RED_DEEP = rgb('#8e2a20');
const RED_IN = rgb('#7a2119');
const RED_LIGHT = rgb('#dc654c');
const GOLD = '#d4a93a';

export default defineAsset({
  name: 'cape',
  description:
    'Heroic crimson cape hanging open from a rolled collar and a gold clasp band with a diamond, in soft vertical folds that end in points at the flared hem.',
  detail: 0.008,
  reference: 'docs/item-mockups/cape-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- cloth
    // A bell of cloth open at the top and the bottom, squashed a little in Z.
    // The profile runs down the outside and back up the inside, so the wall has
    // real thickness and the inside can be painted as deep shadow.
    const clothProfile = profile.polygon(
      [
        [0.15, 1.0], // outer top rim, hidden under the collar
        [0.168, 0.955],
        [0.2, 0.895],
        [0.215, 0.78],
        [0.238, 0.62],
        [0.272, 0.43],
        [0.315, 0.22],
        [0.352, 0.06],
        [0.368, 0.01],
        [0.35, 0.0], // hem, outer bottom
        [0.318, 0.0], // hem, inner bottom
        [0.3, 0.05],
        [0.26, 0.23],
        [0.226, 0.43],
        [0.194, 0.63],
        [0.174, 0.79],
        [0.156, 0.9],
        [0.136, 0.965],
        [0.128, 0.995], // inner top rim
        [0, 1.02], // the top closes over, hidden under the collar
      ],
      { smooth: true, samples: 12 },
    );
    // Six pleats that grow from the shoulders to the hem, plus a slow warp so
    // the hem line is not machine-perfect. `lower` fades the folds in at the
    // collar where the clasp gathers the cloth.
    const foldFn = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const lower = Math.min(1, Math.max(0, (0.9 - y) / 0.65));
      const pleat = Math.sin(a * 6 + 0.9) * (0.25 + 0.75 * lower);
      const warp = Math.sin(a * 3 - 0.7) * 0.4 * lower;
      return (pleat + warp) * 0.8;
    };
    // The front opening: a trapezoid narrow at the throat, wide at the hem.
    const frontGap = sdf
      .extrude(
        profile.polygon([
          [-0.035, 1.02],
          [0.035, 1.02],
          [0.17, -0.01],
          [-0.17, -0.01],
        ]),
        0.5,
      )
      .at(0, 0, 0.12);
    // The wavy hem: keep cloth above a scalloped plane. Where a fold ridge
    // meets the plane the hem reaches y = 0 (a point); between ridges it rises.
    const hemCut = sdf.halfSpace([0, -1, 0], 0).displace(
      0.07,
      (x, y, z) => {
        const a = Math.atan2(z, x);
        const t = 0.5 - 0.5 * Math.sin(a * 6 + 0.9);
        return t * t;
      },
      1.3,
    );
    const clothShape = sdf
      .revolve(clothProfile)
      .scale([1, 1, 0.82])
      .displace(0.017, foldFn, 1.5)
      .displace(0.003, (x, y, z) => noise.fbm(x * 6, y * 6, z * 6, 3), 1.2)
      .smoothSubtract(0.012, frontGap)
      .smoothIntersect(0.006, hemCut);
    // The cavity stencil: mid-wall cone; inner-wall surface points sit inside
    // it and get the deep inside color.
    const cavity = sdf.revolve(
      profile.polygon(
        [
          [0, 1.02],
          [0.142, 0.93],
          [0.185, 0.78],
          [0.21, 0.62],
          [0.243, 0.43],
          [0.28, 0.22],
          [0.31, 0.04],
          [0, 0.0],
        ],
        { smooth: true, samples: 10 },
      ),
    );
    const clothPaint = (x: number, y: number, z: number) => {
      let c = RED;
      // Sun-caught shoulders, damp shadow near the ground.
      c = mixRgb(c, RED_LIGHT, 0.3 * Math.max(0, (y - 0.72) / 0.24));
      c = mixRgb(c, RED_DEEP, 0.42 * Math.min(1, Math.max(0, (0.42 - y) / 0.4)));
      // Fold valleys dark, ridges light, so the pleats read as value stripes.
      const f = foldFn(x, y, z);
      if (f > 0) c = mixRgb(c, RED_LIGHT, 0.38 * f);
      else c = mixRgb(c, RED_DEEP, 0.38 * -f);
      // Cloth patchiness.
      const patch = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2);
      return mixRgb(c, RED_DEEP, 0.12 * patch);
    };
    k.body(
      'cloth',
      clothShape.paintFn(clothPaint).paintWhere(cavity, RED_IN, 0.025),
      {
        color: '#c44636',
        roughness: 0.85,
        metalness: 0,
        detail: 0.0075,
        paintWeight: 2,
        maxTriangles: 2400,
        bump: (x, y, z) =>
          0.0016 * noise.fbm(x * 60, y * 60, z * 60, 2) + 0.0008 * noise.fbm(x * 130, y * 130, z * 130, 1),
      },
    );

    // ------------------------------------------------------------- collar
    // The rolled collar the cape hangs from: a fat red ring sitting over the
    // top rim, its hole showing the dark inside.
    const collarShape = sdf
      .torus(0.13, 0.05)
      .scale([1, 0.85, 0.82])
      .at(0, 1.005, 0)
      .displace(0.002, (x, y, z) => noise.fbm(x * 8, y * 8, z * 8, 2), 1.1);
    const collarPaint = (x: number, y: number, z: number) => {
      let c = mixRgb(RED, RED_LIGHT, 0.25);
      const patch = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
      return mixRgb(c, RED_DEEP, 0.1 * patch);
    };
    k.body('collar', collarShape.paintFn(collarPaint), {
      color: '#c8493a',
      roughness: 0.85,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 550,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 60, y * 60, z * 60, 2),
    });

    // ------------------------------------------------------------- clasp
    // Gold band around the collar and a diamond at the throat (focal point).
    const band = sdf.torus(0.155, 0.02).scale([1, 1, 0.85]).at(0, 0.978, 0);
    const diamond = sdf
      .extrude(
        profile.polygon([
          [0, 0.066],
          [0.045, 0.01],
          [0.025, -0.06],
          [0, -0.076],
          [-0.025, -0.06],
          [-0.045, 0.01],
        ]),
        0.024,
        0.005,
      )
      .at(0, 0.978, 0.146);
    k.body('clasp', sdf.union(band, diamond), {
      color: GOLD,
      roughness: 0.3,
      metalness: 1,
      detail: 0.003,
      maxTriangles: 400,
    });
  },
});
