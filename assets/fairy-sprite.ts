import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import { impAsset } from './parts/imp-kind.js';

/**
 * Fairy sprite — Chibi Quest monster (catalog `monsters/fey-and-spirit/fairy-sprite`), a small
 * flying fey about 0.75 m tall, faces +Z. Target: docs/monster-mockups/fairy-sprite_001.jpg (made
 * with mmx from the imp mockup).
 *
 * The imp of `assets/parts/imp-kind.ts` (head, ears, body, rig, and the hover and fly clips) as a
 * shy forest sprite: mint green skin; no horns, crest, tail, claws, brows, or bat wings; closed
 * eyes with dark lashes, two small glowing dots above them, pink cheeks, and a small smile; a crown
 * of little leaves; a big leaf on the chest and a skirt of leaves at the hips; and two pairs of clear
 * dragonfly wings with green veins on the wing bones.
 * Role: a fey trickster of the woods (friend or foe); the clear wings, the big ears, and the leaf
 *   crown read at 128 px.
 * Palette (60/30/10): mint skin #a2c890 (darker on the back); leaf green #5e9a46; clear pale wings;
 *   glowing yellow dots #fff07a and pink cheeks as the accent.
 * Bodies added: leaves (crown, chest leaf, skirt), glow (the two dots), wings (on wing.L and wing.R).
 */

type V3 = [number, number, number];
const WING_ROOT: V3 = [0.055, 0.38, -0.07];

export default impAsset({
  name: 'fairy-sprite',
  description: 'Chibi fairy sprite monster: a small mint green fey with big pointed ears, closed eyes with two glowing dots, pink cheeks, a small smile, a crown of little leaves, a leaf on its chest, a leaf skirt, and two pairs of clear dragonfly wings.',
  reference: 'docs/monster-mockups/fairy-sprite_001.jpg',
  variants: {
    skin: { mint: '#a2c890', blossom: '#f0b8c8', sky: '#a8c8f0' },
    wings: { clear: '#eef6e4', gold: '#f8ecc0', lilac: '#e8dcf6' },
    eyes: { yellow: '#fff07a', white: '#f4fbff', pink: '#ff9ad0' },
    leaves: { green: '#5e9a46', autumn: '#d0782a', violet: '#7a58a8' },
  },
  presets: {
    blossom: { skin: 'blossom', wings: 'gold', eyes: 'white', leaves: 'autumn' },
    frost: { skin: 'sky', wings: 'lilac', eyes: 'pink', leaves: 'violet' },
  },
  colors: { skinDark: '#80a870', belly: '#b4d4a2', brow: '#4a6e3a', mouth: '#4a3a30', vein: '#c8dcbc' },
  horns: [],
  ear: { tip: [0.24, 0.7, -0.04], r: 0.052 },
  crest: false,
  brows: false,
  mouth: 'smile',
  wings: false,
  tail: false,
  claws: false,
  paint(skin, imp) {
    const [ex, ey] = imp.eye;
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, imp.faceZ(Math.abs(x), y));
    // Closed eyes: skin over the eye, a dark lash line curved down, and pink cheeks.
    const cover = sdf.union(at(sdf.ellipsoid([0.056, 0.054, 0.07]), ex, ey), at(sdf.ellipsoid([0.056, 0.054, 0.07]), -ex, ey));
    const lash = sdf.extrude(profile.arc(0.036, 0.008, 205, 335), 0.3);
    const lashes = sdf.union(lash.at(ex, ey + 0.016, 0.1), lash.at(-ex, ey + 0.016, 0.1));
    const cheeks = sdf.union(at(sdf.ellipsoid([0.026, 0.016, 0.07]), 0.104, 0.468), at(sdf.ellipsoid([0.026, 0.016, 0.07]), -0.104, 0.468));
    return skin
      .paintWhere(cover, imp.tint.skin, 0.004)
      .paintWhere(lashes, '#2a3a24', 0.002)
      .paintWhere(cheeks, imp.tone('skin', '#e8a0a0', 0.5), 0.012);
  },
  extra(k, imp) {
    const [ex, ey] = imp.eye;
    const leaf = imp.tone('leaves', '#5e9a46', 1);
    const leafDark = imp.tone('leaves', '#467a34', 1);
    // Two small glowing dots above the closed eyes.
    const dot = (x: number) => sdf.sphere(0.014).at(x, ey + 0.03, imp.faceZ(Math.abs(x), ey + 0.03) - 0.004);
    k.body('glow', sdf.union(dot(ex - 0.004), dot(-ex + 0.004)).bone('head'), { color: k.tint('eyes'), emissive: k.tint('eyes'), emissiveIntensity: 1.6, roughness: 0.3, detail: 0.003 });

    // A crown of little leaves on the top of the head, tipped out.
    const top = sdf.raycast(imp.head, [0, 2, 0.03], [0, -1, 0])!;
    const ringOf = (n: number, reach: number, lift: number, size: number, turn: number) =>
      Array.from({ length: n }, (_, i) =>
        sdf
          .ellipsoid([size, size * 0.42, size * 0.62])
          .at(reach, 0, 0)
          .rotateZ(18 + (i % 2) * 14)
          .rotateY((i / n) * 360 + turn)
          .at(top[0], top[1] + lift, top[2] - 0.01),
      );
    const crown = sdf.smoothUnion(0.006, ...ringOf(9, 0.06, -0.02, 0.032, 0), ...ringOf(6, 0.03, 0.0, 0.028, 30), sdf.ellipsoid([0.024, 0.028, 0.02]).at(top[0], top[1] + 0.016, top[2] - 0.01));
    // A big leaf over the chest: a thin layer on the torso, cut to a leaf outline, with a vein.
    const outline = profile.polygon(
      [
        [0, 0.07],
        [0.042, 0.035],
        [0.054, -0.01],
        [0.032, -0.05],
        [0, -0.068],
        [-0.032, -0.05],
        [-0.054, -0.01],
        [-0.042, 0.035],
      ],
      { smooth: true, samples: 4 },
    );
    const vein = sdf.box([0.005, 0.13, 0.4]).at(0, 0.32, 0);
    const chestLeaf = imp.torso
      .round(0.006)
      .intersect(sdf.extrude(outline, 0.2).at(0, 0.315, 0.12))
      .paintWhere(vein, leafDark, 0.002);
    // A skirt of leaves around the hips, pointing down and out.
    const skirt = sdf.union(
      ...Array.from({ length: 9 }, (_, i) =>
        sdf
          .ellipsoid([0.028, 0.05, 0.009])
          .at(0, -0.04, 0)
          .rotateX(-24)
          .at(0, 0, 0.078)
          .rotateY((i / 9) * 360 + 20)
          .at(0, 0.255, 0.012),
      ),
    );
    k.body('leaves', sdf.union(crown.bone('head'), chestLeaf.bone('chest'), skirt.bone('spine')), { color: leaf, roughness: 0.6, detail: 0.003 });

    // Two pairs of clear dragonfly wings, in the bat wing frame (root at the origin, spread along +X,
    // flat in XY), so the imp's wing beats move them.
    const wingShape = (len: number, wide: number, tilt: number) =>
      sdf
        .extrude(
          profile.polygon(
            [
              [0, 0],
              [len * 0.3, wide * 0.55],
              [len * 0.75, wide * 0.5],
              [len, 0.0],
              [len * 0.7, -wide * 0.4],
              [len * 0.3, -wide * 0.35],
            ],
            { smooth: true, samples: 4 },
          ),
          0.006,
          0.002,
        )
        .rotateZ(tilt);
    const vColor = rgb(imp.tone('wings', '#8ab878', 1));
    const wings = sdf.union(wingShape(0.3, 0.11, 18), wingShape(0.22, 0.09, -22)).paintFn((x, y, _z, base) => {
      // Veins: lines fanning out from the root and two cross veins.
      const a = Math.atan2(y, x);
      const r = Math.hypot(x, y);
      const line = Math.abs(Math.sin(a * 18)) < 0.1 || Math.abs(Math.sin(r * 70)) < 0.06;
      return line ? mixRgb(base, vColor, 0.8) : base;
    });
    const posed = wings.rotateY(22).rotateZ(10).at(...WING_ROOT);
    k.body('wings', posed.bone('wing.L').mirror('x'), { color: imp.tint.membrane, roughness: 0.2, opacity: 0.55, detail: 0.003 });
  },
});
