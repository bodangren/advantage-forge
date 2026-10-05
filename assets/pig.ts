import { sdf } from '../src/index.js';
import { boarAsset } from './parts/boar-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Pig — Chibi Quest wildlife (catalog `wildlife/farm/pig`), about 0.55 m tall at the ears and 0.68 m
 * from snout to tail, faces +Z. Target: docs/wildlife-mockups/pig_001.jpg (made with mmx).
 *
 * The boar of `assets/parts/boar-kind.ts` (body, head, rig, and clips) at 0.75 of its size, as a
 * farm pig: smooth pink skin, a pink snout disc, big glossy brown eyes, rosy cheeks, an open smile
 * with a pink tongue, large floppy ears that fold forward, a curly tail, and round grey split
 * hooves; no horns, tusks, mane, brows, or teeth.
 * Role: a farm and village animal; the round pink body, the snout, and the curly tail read at
 *   128 px.
 * Palette (60/30/10): pink skin #f2a8a8 (a little darker on the legs, lighter on the belly); a
 *   deeper pink snout #e88486; grey hooves; brown eyes with a white glint as the accent.
 */
export default scaleAsset(
  boarAsset({
    name: 'pig',
    description: 'Chibi pig: a round pink farm pig with big glossy brown eyes, rosy cheeks, an open smile with a pink tongue, a pink snout disc, large floppy ears, a curly tail, and round grey hooves; quadruped rig.',
    reference: 'docs/wildlife-mockups/pig_001.jpg',
    variants: {
      fur: { pink: '#f2a8a8', spotted: '#f0c8b8', black: '#4a4044', ginger: '#d8905a' },
      skin: { pink: '#e88486', rose: '#d86a74', grey: '#8a7a7a' },
      eyes: { brown: '#6a3a1a', dark: '#2a1a12', blue: '#3a5a8a' },
    },
    presets: {
      cream: { fur: 'spotted', skin: 'pink', eyes: 'dark' },
      black: { fur: 'black', skin: 'grey', eyes: 'brown' },
      ginger: { fur: 'ginger', skin: 'rose', eyes: 'blue' },
    },
    colors: { furDark: '#e08e92', belly: '#f8c0bc', earInner: '#e0787e', black: '#7a6a6c' },
    // No horns, tusks, or claws: the unused ivory color follows the skin slot.
    ivorySlot: 'skin',
    horns: false,
    tuskScale: 0,
    mane: false,
    tail: 'curl',
    ears: false,
    hoofStyle: 'round',
    eyeScale: 1.35,
    eyeGlow: 0,
    brows: false,
    lids: false,
    teeth: false,
    paint(fur, boar) {
      // Rosy cheeks beside the snout, under the eyes.
      const cheek = boar.faceHit(0.15, 0.4);
      const blush = boar.tone('skin', '#f08a8a', 0.5);
      // An open smile under the snout: a dark half disc with a pink tongue at its bottom.
      const front = sdf.halfSpace([0, 0, -1], -0.25);
      const MY = 0.3;
      const mouth = sdf.cylinder(0.055, 1).rotateX(90).scale([1.35, 1, 1]).at(0, MY, 0).intersect(sdf.halfSpace([0, 1, 0], MY)).intersect(front);
      const tongue = sdf.cylinder(0.03, 1).rotateX(90).scale([1.2, 1, 1]).at(0, MY - 0.045, 0).intersect(mouth);
      // A round barrel of a body: a fuller, taller belly and back between the legs, so the pig
      // reads as round and compact from the side.
      const barrel = sdf.smoothUnion(
        0.06,
        sdf.ellipsoid([0.2, 0.2, 0.17]).at(0, 0.32, 0.0).bone('spine'),
        sdf.ellipsoid([0.19, 0.19, 0.15]).at(0, 0.31, -0.13).bone('hips'),
      );
      return fur
        .smoothUnion(0.05, barrel)
        .paintWhere(sdf.sphere(0.04).at(cheek[0], cheek[1], cheek[2]).mirror('x'), blush, 0.03)
        .paintWhere(mouth, '#5a2228', 0.003)
        .paintWhere(tongue, '#e86a7a', 0.003);
    },
    extra(k, boar) {
      // Large floppy ears: broad flaps from the top corners of the head that fold forward and
      // down over the brow, darker pink inside.
      const root = sdf.surfacePoint(boar.headBase, [0.45, 0.88, 0.05], -0.025);
      const flap = sdf
        .ellipsoid([0.08, 0.11, 0.02])
        .at(0, 0.095, 0)
        .bend(5)
        .paintWhere(sdf.ellipsoid([0.055, 0.085, 0.03]).at(0, 0.09, 0.016), boar.tint.earInner, 0.012)
        .rotateX(48)
        .rotateZ(-42)
        .at(root[0], root[1], root[2]);
      k.body('ears', flap.mirror('x').bone('head'), { color: boar.tint.fur, roughness: 0.8, detail: 0.004 });
    },
  }),
  0.75,
);
