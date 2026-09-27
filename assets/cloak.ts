import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — travelling cloak on a peg stand (equipment/armor/cloak).
 *
 * Role: gear prop for the chibi heroes; must read as "cloak" at 128 px.
 * Size: stand 0.9 m tall with the dome base and post showing below the hem,
 *   cloak draped over the peg reaches ~0.97 m, stands on y = 0, faces +Z.
 * One idea: a heavy dark green wool bell draped over a wooden peg, hood slumped
 *   down the back, one small brass clasp shining at the throat.
 * Shape language: round dominant (bell, dome base, drooping hood), the flare of
 *   the hem is the silhouette-breaking feature.
 * Palette: wool green #41604a dominant, deep shadow green #2c4232, hood a touch
 *   darker #33503c; honey oak wood #b5814a with dark walnut shade #6b4226;
 *   brass clasp #d4a93a as the single bright accent.
 * Materials: wool cloth (roughness 0.9, metalness 0, weave in bump), wood
 *   (roughness 0.8, metalness 0, grain in bump), brass (roughness 0.3, metalness 1).
 * Detail: primary bell + dome-base stand + hood; secondary clasp and shoulder
 *   bunch; tertiary pleats, wavy hem, wool weave. Focal point: brass clasp.
 * Rig/animation: none (static prop).
 */

const WOOL = rgb('#3a5542');
const WOOL_DEEP = rgb('#27392c');
const WOOL_LIGHT = rgb('#4e7053');
const HOOD = rgb('#2e4736');
const OAK = rgb('#b5814a');
const WALNUT = rgb('#6b4226');
const BRASS = '#d4a93a';

export default defineAsset({
  name: 'cloak',
  description:
    'Dark green wool travelling cloak with a hood slumped down the back and a brass clasp, draped over a short wooden peg stand.',
  detail: 0.008,
  reference: 'docs/item-mockups/cloak-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- stand
    // Honey-oak peg stand: flat-bottomed dome base, slim post, rounded knob.
    const standProfile = profile.polygon(
      [
        [0, 0.004],
        [0.13, 0.004],
        [0.165, 0.022],
        [0.155, 0.05],
        [0.1, 0.075],
        [0.055, 0.09],
        [0.037, 0.13],
        [0.034, 0.6],
        [0.034, 0.88],
        [0.03, 0.915],
        [0.016, 0.93],
        [0, 0.935],
      ],
      { smooth: true, samples: 12 },
    );
    const standShape = sdf
      .revolve(standProfile)
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const standPaint = (x: number, y: number, z: number) => {
      let c = mixRgb(OAK, WALNUT, 0.28 * Math.min(1, Math.max(0, (0.16 - y) / 0.16)));
      c = mixRgb(c, rgb('#c9a06a'), 0.25 * Math.max(0, (y - 0.5) / 0.45));
      const grain = 0.5 + 0.5 * noise.fbm(x * 24, y * 5, z * 24, 2);
      c = mixRgb(c, WALNUT, 0.14 * grain);
      return c;
    };
    k.body('stand', standShape.paintFn(standPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 750,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 6, z * 30, 2),
    });

    // ------------------------------------------------------------- cloak
    // Wool bell draped over the peg: closed over the top, pleated, wavy hem.
    const cloakProfile = profile.polygon(
      [
        [0, 0.975],
        [0.1, 0.96],
        [0.16, 0.905],
        [0.175, 0.845],
        [0.185, 0.77],
        [0.215, 0.68],
        [0.265, 0.57],
        [0.325, 0.46],
        [0.385, 0.36],
        [0.42, 0.305],
        [0.405, 0.285],
        [0.3, 0.27],
        [0, 0.26],
      ],
      { smooth: true, samples: 14 },
    );
    const shoulders = sdf.ellipsoid([0.235, 0.115, 0.205]).at(0, 0.815, 0);
    let cloakShape = sdf
      .smoothUnion(0.05, sdf.revolve(cloakProfile), shoulders)
      // Pleats: seven vertical folds, strongest toward the hem; a slow 3-lobe
      // warp keeps the hem line wavy instead of circular.
      .displace(
        0.014,
        (x, y, z) => {
          const a = Math.atan2(z, x);
          const lower = Math.min(1, Math.max(0, (0.9 - y) / 0.65));
          const pleat = Math.sin(a * 7 + 0.6) * (0.3 + 0.7 * lower);
          const warp = Math.sin(a * 3 - 1.1) * 0.45 * lower;
          return (pleat + warp) * 0.75;
        },
        1.5,
      )
      // Soft wool irregularity so the silhouette is not machine-perfect.
      .displace(0.004, (x, y, z) => noise.fbm(x * 6, y * 6, z * 6, 3), 1.2);
    const cloakPaint = (x: number, y: number, z: number) => {
      let c = WOOL;
      // Damp shadow near the ground, sun-caught shoulders.
      c = mixRgb(c, WOOL_DEEP, 0.62 * Math.min(1, Math.max(0, (0.6 - y) / 0.42)));
      c = mixRgb(c, WOOL_LIGHT, 0.42 * Math.max(0, (y - 0.7) / 0.26));
      // Cloth patchiness.
      const patch = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2);
      c = mixRgb(c, WOOL_DEEP, 0.16 * patch);
      return c;
    };
    k.body('cloak', cloakShape.paintFn(cloakPaint), {
      color: '#41604a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.0075,
      paintWeight: 2,
      maxTriangles: 2100,
      bump: (x, y, z) =>
        0.0018 * noise.fbm(x * 40, y * 40, z * 40, 2) + 0.001 * noise.fbm(x * 90, y * 90, z * 90, 1),
    });

    // ------------------------------------------------------------- hood
    // The hood, slumped down the back from the neck to a soft tip.
    const hoodShape = sdf
      .chain(
        [
          [0, 0.81, -0.13, 0.1],
          [0, 0.7, -0.175, 0.115],
          [0, 0.57, -0.19, 0.092],
          [0, 0.47, -0.165, 0.045],
        ],
        0.05,
      )
      .displace(0.003, (x, y, z) => noise.fbm(x * 8, y * 8, z * 8, 2), 1.1);
    const hoodPaint = (x: number, y: number, z: number) => {
      let c = HOOD;
      c = mixRgb(c, WOOL_DEEP, 0.35 * Math.min(1, Math.max(0, (0.55 - y) / 0.4)));
      const patch = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
      return mixRgb(c, WOOL_DEEP, 0.15 * patch);
    };
    k.body('hood', hoodShape.paintFn(hoodPaint), {
      color: '#33503c',
      roughness: 0.9,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 600,
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // ------------------------------------------------------------- clasp
    // Round brass brooch at the throat, with a small hanging loop.
    const claspShape = sdf
      .smoothUnion(
        0.006,
        sdf.sphere(0.034).scale([1, 0.85, 0.55]).at(0, 0.855, 0.195),
        sdf.torus(0.05, 0.011).rotateX(90).at(0, 0.855, 0.2),
      )
      .smoothUnion(0.005, sdf.sphere(0.016).at(0, 0.81, 0.215));
    k.body('clasp', claspShape, {
      color: BRASS,
      roughness: 0.3,
      metalness: 1,
      detail: 0.0035,
      maxTriangles: 250,
    });
  },
});
