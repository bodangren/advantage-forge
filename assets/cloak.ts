import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — travelling cloak on a peg stand (equipment/armor/cloak).
 *
 * Role: gear prop for the chibi heroes; must read as "cloak" at 128 px.
 * Size: on display about 1.3 m tall with the raised hood; the stand is inside the bell (the hem
 *   at y 0.11 is set by the worn shoe clearance); stands on y = 0, faces +Z.
 * One idea: a heavy dark green wool bell closed at the throat by a brass brooch; on display the
 *   hood is up with a peak that leans back (hoodUp, display only); worn it is folded down as a cowl.
 * Shape language: round dominant (bell, cowl, peaked hood), the flare of the hem is the
 *   silhouette-breaking feature.
 * Palette: wool green #41604a dominant, deep shadow green #2c4232, hood a touch
 *   darker #33503c; honey oak wood #b5814a with dark walnut shade #6b4226;
 *   brass clasp #d4a93a as the single bright accent.
 * Materials: wool cloth (roughness 0.9, metalness 0, weave in bump), wood
 *   (roughness 0.8, metalness 0, grain in bump), brass (roughness 0.3, metalness 1).
 * Detail: primary bell + hood; secondary brooch, cowl, and a painted front parting line from the
 *   brooch to the hem; tertiary pleats, wavy hem, wool weave. Focal point: the brass brooch, on
 *   the chest below the chin so the worn head does not hide it.
 * Fit (avatar back slot, fitScale 2): the bell is a solid revolve of the avatar body at 2x (neck at y 0.85),
 *   widened to r 0.69 at the hem so it encloses hips, legs, and hanging hands with clearance; hem at y 0.11,
 *   depth squashed to 0.72. The cowl and the brooch ride on the outer surface.
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
  equip: { slot: 'back', fitScale: 2, origin: [0, 0.85, 0], displayOnly: ['stand', 'hoodUp'] },

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
        [0, 0.985],
        [0.1, 0.97],
        [0.19, 0.935],
        [0.24, 0.87],
        [0.28, 0.8],
        [0.4, 0.72],
        [0.47, 0.6],
        [0.53, 0.45],
        [0.6, 0.3],
        [0.66, 0.24],
        [0.69, 0.15],
        [0.68, 0.115],
        [0, 0.11],
      ],
      { smooth: true, samples: 14 },
    );
    const shoulders = sdf.ellipsoid([0.27, 0.12, 0.26]).at(0, 0.82, 0.03);
    let cloakShape = sdf
      .smoothUnion(0.05, sdf.revolve(cloakProfile).scale([1, 1, 0.72]), shoulders)
      // Pleats: seven vertical folds, strongest toward the hem; a slow 3-lobe
      // warp keeps the hem line wavy instead of circular.
      .displace(
        0.02,
        (x, y, z) => {
          const a = Math.atan2(z, x);
          const lower = Math.min(1, Math.max(0, (0.9 - y) / 0.65));
          const pleat = Math.sin(a * 8 + 0.6) * (0.25 + 0.75 * lower);
          const warp = Math.sin(a * 3 - 1.1) * 0.45 * lower;
          return (pleat + warp * 0.8) * (0.75 + 0.5 * lower);
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
      // The front opening: a dark parting line from the brooch to the hem, with a lit edge on the
      // overlapping (left) side, so the bell reads as a cloak closed at the throat.
      if (z > 0 && y < 0.79) {
        const fade = Math.min(1, (0.79 - y) / 0.05);
        const line = Math.max(0, 1 - Math.abs(x) / 0.009);
        const lip = Math.max(0, 1 - Math.abs(x - 0.016) / 0.008);
        c = mixRgb(c, rgb('#16221a'), 0.85 * line * fade);
        c = mixRgb(c, WOOL_LIGHT, 0.5 * lip * fade);
      }
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
    const ring = sdf.torus(0.19, 0.05).scale([1, 1, 0.85]).at(0, 0.89, -0.02);
    const backRoll = sdf.chain(
      [
        [0.14, 0.88, -0.1, 0.05],
        [0.08, 0.8, -0.2, 0.055],
        [0, 0.7, -0.23, 0.05],
        [0, 0.64, -0.22, 0.02],
      ],
      0.04,
    );
    const hoodShape = sdf
      .smoothUnion(0.03, ring, backRoll, backRoll.mirror('x', 0))
      .subtract(sdf.box([0.5, 0.3, 0.2]).at(0, 0.9, 0.3))
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

    // ------------------------------------------------------------- hood up (display)
    const hoodUpShape = sdf
      .chain(
        [
          [0, 0.92, -0.02, 0.25],
          [0, 1.0, -0.04, 0.2],
          [0, 1.1, -0.08, 0.13],
          [0, 1.2, -0.15, 0.06],
          [0, 1.27, -0.23, 0.02],
        ],
        0.06,
      )
      .scale([1, 1, 0.9])
      .displace(0.004, (x, y, z) => noise.fbm(x * 6, y * 6, z * 6, 3), 1.2);
    k.body('hoodUp', hoodUpShape.paintFn(hoodPaint), {
      color: '#33503c',
      roughness: 0.9,
      metalness: 0,
      detail: 0.007,
      maxTriangles: 900,
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // ------------------------------------------------------------- clasp
    // Round brass brooch on the chest below the chin (worn about 1.5 cm below the neck opening, so
    // the head does not hide it), on the outer surface of the shoulder dome, with a hanging drop.
    const BROOCH: [number, number, number] = [0, 0.8, 0.29];
    const claspShape = sdf
      .smoothUnion(
        0.006,
        sdf.sphere(0.04).scale([1, 0.85, 0.5]).at(...BROOCH),
        sdf.torus(0.058, 0.013).rotateX(90).at(...BROOCH),
      )
      .smoothUnion(0.005, sdf.sphere(0.018).at(BROOCH[0], BROOCH[1] - 0.055, BROOCH[2] + 0.012));
    k.body('clasp', claspShape, {
      color: BRASS,
      roughness: 0.3,
      metalness: 1,
      detail: 0.0035,
      maxTriangles: 250,
    });
  },
});
