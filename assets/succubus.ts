import { profile, sdf } from '../src/index.js';
import { impAsset } from './parts/imp-kind.js';

/**
 * Succubus — Chibi Quest monster (catalog `monsters/abyssal-and-cosmic/succubus`), a friendly
 * little demon girl about 0.85 m to the horn tips, faces +Z. Target:
 * docs/monster-mockups/succubus_001.jpg (made with mmx from the imp mockup).
 *
 * Owner rule (2026-10-04): every asset is rated G, with no sexual suggestion. This one is a pretty
 * little demon in a normal dress.
 *
 * The imp of `assets/parts/imp-kind.ts` (head, ears, body, bat wings, arrow tail, rig, and clips)
 * as a friendly demon girl: pale skin; long lavender hair with a side-swept fringe; two curved
 * mauve horns that rise up and out; a calm face with dark eyes, thin lids, arched brows, pink
 * cheeks, and a small smile; a lilac dress with short puffed sleeves, a white collar, a white hem,
 * and a skirt to the knees; small violet bat wings; no claws.
 * Role: a caster of the abyss family; the hair, the horns, and the lilac dress read at 128 px.
 * Palette (60/30/10): pale skin #f2d8cc; lavender hair, a lilac dress, and violet wings (all follow
 *   the wings slot); mauve horns; a white collar and hem, and pink cheeks as the accent.
 * Bodies added: hair (rigid on the head), dress (bodice, skirt, and sleeves), collar.
 */

type V3 = [number, number, number];

export default impAsset({
  name: 'succubus',
  description: 'Chibi succubus monster: a friendly little demon girl with long lavender hair, two curved mauve horns, dark eyes, pink cheeks, a small smile, a lilac dress with short puffed sleeves and a white collar, small violet bat wings, and an arrow-tipped tail.',
  reference: 'docs/monster-mockups/succubus_001.jpg',
  variants: {
    skin: { pale: '#f2d8cc', lilac: '#c8b0dc', rose: '#eab4b8' },
    wings: { violet: '#6a4a8e', plum: '#5e2a4e', slate: '#4a4a62' },
    eyes: { brown: '#4a2a20', violet: '#7a4ab0', green: '#3a8a50' },
    horns: { mauve: '#6a5a7a', dark: '#2a1a2c', bone: '#c8b8a8' },
  },
  presets: {
    lilac: { skin: 'lilac', wings: 'plum', eyes: 'violet', horns: 'dark' },
    rose: { skin: 'rose', wings: 'slate', eyes: 'green', horns: 'bone' },
  },
  colors: { skinDark: '#dcbcb4', belly: '#f6e0d6', brow: '#5a3a6a', mouth: '#8a4a5a', vein: '#4a2a6a', wingBone: '#3a2a4a', irisDark: '#2a160e' },
  crest: false,
  brows: false,
  mouth: 'smile',
  claws: false,
  hornRings: false,
  wingScale: 0.8,
  horns: [
    [
      [0.07, 0.6, 0.0, 0.034],
      [0.13, 0.66, -0.01, 0.03],
      [0.16, 0.73, 0.0, 0.022],
      [0.14, 0.78, 0.03, 0.008],
    ],
  ],
  paint(skin, imp) {
    const [ex, ey] = imp.eye;
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, imp.faceZ(Math.abs(x), y));
    const both = (s: (x: number) => sdf.Shape) => sdf.union(s(ex), s(-ex));
    // The imp's round eyes stay; a thin dark lid line over each eye, arched brows, pink cheeks.
    const lid = (x: number) => sdf.extrude(profile.arc(0.05, 0.007, 22, 158), 0.3).at(x, ey - 0.004, 0.1);
    const brow = (x: number) => sdf.extrude(profile.arc(0.06, 0.008, 45, 135), 0.3).at(x + Math.sign(x) * 0.004, ey + 0.012, 0.1);
    const cheeks = both((x) => at(sdf.ellipsoid([0.026, 0.016, 0.07]), x * 1.55, 0.466));
    return skin
      .paintWhere(both(lid), '#2a1426', 0.002)
      .paintWhere(both(brow), imp.tint.brow, 0.002)
      .paintWhere(cheeks, imp.tone('skin', '#f0a0c0', 0.5), 0.012);
  },
  extra(k, imp) {
    const head = imp.head;
    // Long hair: a cap over the skull, a mass down the back of the head, a side-swept fringe, and two
    // long locks in front of the shoulders. The face stays clear.
    const hairColor = imp.tone('wings', '#9a82c4', 1);
    const cap = head.round(0.024).intersect(sdf.halfSpace([0, -1, 0], -0.47));
    const back = sdf.ellipsoid([0.17, 0.15, 0.11]).at(0, 0.49, -0.05);
    const lock = (s: 1 | -1) =>
      sdf.chain(
        [
          [0.13 * s, 0.62, 0.02, 0.05],
          [0.165 * s, 0.5, 0.02, 0.045],
          [0.17 * s, 0.4, 0.0, 0.034],
          [0.155 * s, 0.33, -0.01, 0.018],
        ],
        0.02,
      );
    const backLocks = [-0.09, 0, 0.09].map((x) =>
      sdf.chain(
        [
          [x, 0.56, -0.1, 0.05],
          [x * 1.2, 0.46, -0.125, 0.042],
          [x * 1.3, 0.385, -0.115, 0.024],
        ],
        0.02,
      ),
    );
    const fringe = sdf.union(
      ...(
        [
          [-0.1, 0.07],
          [-0.03, 0.06],
          [0.04, 0.05],
        ] as const
      ).map(([x, drop]) => {
        const p: V3 = [x, 0.6, imp.faceZ(Math.abs(x), 0.6)];
        return sdf.chain(
          [
            [x - 0.02, 0.67, p[2] - 0.03, 0.03],
            [x + 0.02, 0.62, p[2] - 0.004, 0.024],
            [x + 0.05, 0.62 - drop * 0.5, p[2] - 0.004, 0.012],
          ],
          0.012,
        );
      }),
    );
    const faceClear = sdf.ellipsoid([0.125, 0.092, 0.2]).at(0, 0.5, 0.17);
    const hair = sdf
      .smoothUnion(0.03, cap, back, lock(1), lock(-1), ...backLocks)
      .smoothUnion(0.01, fringe)
      .subtract(faceClear)
      .displace(0.003, (x, y, z) => Math.sin(Math.atan2(x, z) * 16 + y * 20));
    k.body('hair', hair.bone('head'), { color: hairColor, roughness: 0.55, detail: 0.004 });

    // A lilac dress: a bodice over the torso, a skirt that flares to the knees with a lighter hem,
    // and short puffed sleeves; a round white collar at the neck.
    const dressColor = imp.tone('wings', '#a888cc', 1);
    const bodice = imp.torso.round(0.008).intersect(sdf.box([0.4, 0.2, 0.4]).at(0, 0.31, 0));
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.29],
            [0.09, 0.29],
            [0.1, 0.25],
            [0.12, 0.19],
            [0.134, 0.15],
            [0, 0.15],
          ],
          { smooth: true, samples: 4 },
        ),
      )
      .scale([1, 1, 0.92])
      .at(0, 0, 0.012);
    const { SHOULDER, ELBOW } = imp.joints;
    const puff = sdf.ellipsoid([0.042, 0.036, 0.042]).at(SHOULDER[0] + (ELBOW[0] - SHOULDER[0]) * 0.3, SHOULDER[1] + (ELBOW[1] - SHOULDER[1]) * 0.3, SHOULDER[2] + (ELBOW[2] - SHOULDER[2]) * 0.3);
    const dress = sdf
      .union(bodice.bone('chest'), skirt.bone('hips'), puff.bone('upperarm.L').mirror('x'))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.168), imp.tone('wings', '#f2eaf4', 1), 0.004);
    k.body('dress', dress, { color: dressColor, roughness: 0.7, detail: 0.004 });
    const collar = sdf.torus(0.074, 0.02).scale([1, 0.55, 1]).at(0, 0.372, 0.018);
    k.body('collar', collar.bone('chest'), { color: '#f6f2ec', roughness: 0.7, detail: 0.003 });
  },
});
