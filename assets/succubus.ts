import { profile, sdf } from '../src/index.js';
import { impAsset } from './parts/imp-kind.js';

/**
 * Succubus — Chibi Quest monster (catalog `monsters/abyssal-and-cosmic/succubus`), a charming
 * little demon girl about 0.85 m to the horn tips, faces +Z. Target:
 * docs/monster-mockups/succubus_001.jpg (made with mmx from the imp mockup).
 *
 * The imp of `assets/parts/imp-kind.ts` (head, ears, body, bat wings, arrow tail, rig, and clips) as
 * a demon charmer: lilac skin; long dark violet hair with a side-swept fringe; two curved dark horns
 * that rise up and back; a calm face with arched brows, dark lashes, pink cheeks, a small smile, and
 * glowing pink hearts in dark eyes; a dark slip dress; dark violet bat wings; no claws.
 * Role: a charming caster of the abyss family; the hair, the horns, and the glowing heart eyes read
 *   at 128 px. The mockup sits on the ground; the asset hovers like the imp.
 * Palette (60/30/10): lilac skin #b898d0 (darker back); dark violet hair, wings, and dress; dark
 *   horns; glowing pink heart eyes #ff4a9a and pink cheeks as the accent.
 * Bodies added: hair (rigid on the head), dress (on the torso), hearts (glowing, on the head).
 */

type V3 = [number, number, number];

export default impAsset({
  name: 'succubus',
  description: 'Chibi succubus monster: a lilac demon girl with long dark violet hair, two curved dark horns, glowing pink heart eyes, arched brows, pink cheeks, a small smile, a dark slip dress, dark violet bat wings, and an arrow-tipped tail.',
  reference: 'docs/monster-mockups/succubus_001.jpg',
  variants: {
    skin: { lilac: '#b898d0', rose: '#e0a0b0', ash: '#a8a4b4' },
    wings: { violet: '#4a2a5e', black: '#262028', wine: '#5e2236' },
    eyes: { pink: '#ff4a9a', red: '#ff3a3a', gold: '#ffc83a' },
    horns: { dark: '#2a1a2c', bone: '#c8b8a8', crimson: '#7a1e2a' },
  },
  presets: {
    rose: { skin: 'rose', wings: 'wine', eyes: 'red', horns: 'crimson' },
    ash: { skin: 'ash', wings: 'black', eyes: 'gold', horns: 'bone' },
  },
  colors: { skinDark: '#9478b0', belly: '#c8ace0', brow: '#3a2048', mouth: '#7a3a5a', vein: '#3a2048', wingBone: '#2a1a30' },
  crest: false,
  brows: false,
  mouth: 'smile',
  claws: false,
  hornRings: false,
  wingScale: 0.8,
  horns: [
    [
      [0.068, 0.6, 0.0, 0.03],
      [0.1, 0.665, -0.02, 0.025],
      [0.11, 0.735, -0.05, 0.017],
      [0.09, 0.785, -0.09, 0.006],
    ],
  ],
  paint(skin, imp) {
    const [ex, ey] = imp.eye;
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, imp.faceZ(Math.abs(x), y));
    const both = (s: (x: number) => sdf.Shape) => sdf.union(s(ex), s(-ex));
    // Dark irises (the hearts glow on them), dark lashes over the eyes, arched brows, pink cheeks.
    const iris = both((x) => at(sdf.ellipsoid([0.038, 0.041, 0.07]), x - Math.sign(x) * 0.004, ey - 0.004));
    const shine = both((x) => at(sdf.sphere(0.008), x + 0.012, ey + 0.016));
    const lash = (x: number) => sdf.extrude(profile.arc(0.05, 0.011, 18, 162), 0.3).at(x, ey - 0.006, 0.1);
    const brow = (x: number) => sdf.extrude(profile.arc(0.06, 0.008, 45, 135), 0.3).at(x + Math.sign(x) * 0.004, ey + 0.012, 0.1);
    const cheeks = both((x) => at(sdf.ellipsoid([0.026, 0.016, 0.07]), x * 1.55, 0.466));
    return skin
      .paintWhere(iris, '#3a1030', 0.003)
      .paintWhere(shine, '#ffffff', 0.002)
      .paintWhere(both(lash), '#2a1426', 0.002)
      .paintWhere(both(brow), imp.tint.brow, 0.002)
      .paintWhere(cheeks, imp.tone('skin', '#f0a0c0', 0.5), 0.012);
  },
  extra(k, imp) {
    const [ex, ey] = imp.eye;
    const head = imp.head;
    // Glowing hearts in the eyes: a thin layer on the face, cut to a heart outline.
    const heart = profile.polygon(
      [
        [0, -0.019],
        [0.019, 0.002],
        [0.017, 0.014],
        [0.008, 0.017],
        [0, 0.009],
        [-0.008, 0.017],
        [-0.017, 0.014],
        [-0.019, 0.002],
      ],
      { smooth: true, samples: 3 },
    );
    const hearts = sdf.union(...[ex, -ex].map((x) => sdf.extrude(heart, 0.1).at(x - Math.sign(x) * 0.004, ey - 0.006, imp.faceZ(Math.abs(x), ey))));
    const glow = head.round(0.0015).intersect(hearts).intersect(sdf.halfSpace([0, 0, -1], -0.05));
    k.body('hearts', glow.bone('head'), { color: k.tint('eyes'), emissive: k.tint('eyes'), emissiveIntensity: 1.3, roughness: 0.3, detail: 0.002 });

    // Long hair: a cap over the skull, a mass down the back of the head, a side-swept fringe, and two
    // long locks in front of the shoulders. The face stays clear.
    const hairColor = imp.tone('wings', '#4a2a5e', 1);
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

    // A dark slip dress: a thin layer on the torso from the chest to the hips.
    const dress = imp.torso.round(0.007).intersect(sdf.box([0.4, 0.2, 0.4]).at(0, 0.3, 0));
    k.body('dress', dress.bone('spine'), { color: '#2a1a30', roughness: 0.6, detail: 0.004 });
  },
});
