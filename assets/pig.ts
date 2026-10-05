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
      eyes: { dark: '#24140e', brown: '#6a3a1a', blue: '#3a5a8a' },
    },
    presets: {
      cream: { fur: 'spotted', skin: 'pink', eyes: 'brown' },
      black: { fur: 'black', skin: 'grey', eyes: 'brown' },
      ginger: { fur: 'ginger', skin: 'rose', eyes: 'blue' },
    },
    colors: { furDark: '#e08e92', belly: '#f8c0bc', earInner: '#f08490', black: '#7a6a6c' },
    // No horns, tusks, or claws: the unused ivory color follows the skin slot.
    ivorySlot: 'skin',
    horns: false,
    tuskScale: 0,
    mane: false,
    headScale: 1.3,
    eyeInset: 0.012,
    // The kind's stub stays inside the rump; the long curly tail is in `extra`.
    tail: 'stub',
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
        sdf.ellipsoid([0.2, 0.2, 0.15]).at(0, 0.32, 0.0).bone('spine'),
        sdf.ellipsoid([0.19, 0.19, 0.12]).at(0, 0.31, -0.1).bone('hips'),
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
        .ellipsoid([0.066, 0.09, 0.018])
        .at(0, 0.078, 0)
        .bend(6)
        .paintWhere(sdf.ellipsoid([0.045, 0.068, 0.028]).at(0, 0.074, 0.014), boar.tint.earInner, 0.01)
        .rotateX(34)
        .rotateZ(-46)
        .at(root[0], root[1], root[2]);
      k.body('ears', flap.mirror('x').bone('head'), { color: boar.tint.fur, roughness: 0.8, detail: 0.004 });
      // A big round highlight on each dark eye (upper outer side), and a short dark brow line
      // above each eye.
      const e = boar.eye.center;
      const er = boar.eye.r;
      const shine = sdf.sphere(er * 0.3).at(e[0] + er * 0.3, e[1] + er * 0.42, e[2] + er * 0.82).mirror('x');
      k.body('eye-shine', shine.bone('head'), { color: '#ffffff', roughness: 0.1, detail: 0.002 });
      const bh = boar.faceHit(e[0] + 0.01, e[1] + er + 0.035);
      const brow = sdf.capsule([bh[0] - 0.03, bh[1] - 0.004, bh[2] - 0.006], [bh[0] + 0.03, bh[1] + 0.006, bh[2] - 0.012], 0.006).mirror('x');
      k.body('brows', brow.bone('head'), { color: '#6a3a3a', roughness: 0.7, detail: 0.002 });
      // A long curly tail: up from the rump, then one full loop and a little hook.
      const loop = Array.from({ length: 13 }, (_, i): [number, number, number, number] => {
        const a = Math.PI * 1.1 + (i / 12) * Math.PI * 2.3;
        return [0.012 + 0.003 * i, 0.39 + 0.045 * Math.sin(a), -0.37 + 0.045 * Math.cos(a) - 0.004 * i, 0.017 - 0.0007 * i];
      });
      const curl = sdf.chain([[0, 0.33, -0.27, 0.022], [0, 0.36, -0.31, 0.019], ...loop], 0.008);
      k.body('tail-curl', curl.bone('tail'), { color: boar.tint.fur, roughness: 0.8, detail: 0.003 });
    },
  }),
  0.75,
);
