import { sdf } from '../src/index.js';
import { scaleAsset } from './parts/scale-asset.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Dog — Chibi Quest wildlife (catalog `wildlife/land/dog`), about 0.55 m to the top of the head,
 * faces +Z. Target: docs/wildlife-mockups/dog_001.jpg (made with mmx).
 *
 * The dire wolf (`assets/dire-wolf.ts`; body, head, rig, and clips from `assets/parts/wolf-kind.ts`)
 * at 0.72 of its size, as a friendly village dog: floppy dark ears (the kind's pointed ears are
 * off), cream brows, a white muzzle and smooth chest, a happy smile with the tongue out, big dark
 * eyes, white paws, a red collar with a gold tag, and a tail that curls up over the back with a
 * white tip; no cheek tufts, forelock, or claws.
 * Role: the hero's companion and a village pet; the floppy ears, the collar, and the tongue read
 *   at 128 px.
 * Palette (60/30/10): tan coat #d08a4a; white #fff6ec (muzzle, chest, paws, brows, tail tip);
 *   dark brown ears #6a3e24; a red collar #c83a32 with a gold tag as the accent.
 */

export default scaleAsset(
  wolfAsset({
    name: 'dog',
    description: 'Chibi dog: a tan village dog with a big round head, floppy dark ears, big dark eyes, a white muzzle and chest, a happy smile with the tongue out, a red collar with a gold tag, white paws, and a curled tail; quadruped rig.',
    reference: 'docs/wildlife-mockups/dog_001.jpg',
    variants: {
      fur: { tan: '#d08a4a', black: '#3a3432', white: '#f2ece2', grey: '#9a9894' },
      markings: { white: '#fff6ec', cream: '#f2dcb4', tan: '#d8a46a' },
      eyes: { brown: '#3a2010', amber: '#7a440c', blue: '#3a5a7a' },
      ears: { brown: '#6a3e24', black: '#2a2422', tan: '#c88a4a' },
    },
    presets: {
      black: { fur: 'black', markings: 'tan', eyes: 'brown', ears: 'black' },
      white: { fur: 'white', markings: 'white', eyes: 'blue', ears: 'tan' },
      grey: { fur: 'grey', markings: 'white', eyes: 'amber', ears: 'black' },
    },
    colors: { furLight: '#e8b884', furDark: '#fff6ec', eyeRim: '#1a100a', nose: '#1a1214' },
    eyeScale: 1.3,
    cheekTufts: false,
    brows: false,
    forelock: false,
    smile: true,
    ruff: 'smooth',
    ears: false,
    claws: false,
    tail: false,
    extra(k, w) {
      const ears = k.tint('ears');
      // Floppy ears: flat ovals that hang from the top sides of the head, tipped out.
      const ear = sdf.ellipsoid([0.075, 0.125, 0.032]).rotateZ(38).rotateY(-10).at(0.215, 0.56, 0.15);
      k.body('ears', ear.mirror('x'), { color: ears, roughness: 0.85, detail: 0.004, bone: 'head' });
      // The tongue out of the smile, on the jaw.
      const tongue = sdf.ellipsoid([0.026, 0.036, 0.012]).rotateX(-15).at(0.012, 0.36, 0.372);
      k.body('tongue-out', tongue.paintWhere(sdf.box([0.003, 0.06, 0.1]).at(0.012, 0.35, 0.39), '#c84a5a', 0.002), { color: '#ec7a88', roughness: 0.4, detail: 0.003, bone: 'jaw' });
      // Round cream brow marks above the eyes.
      const bh = w.faceHit(w.eye[0] + 0.012, w.eye[1] + 0.068);
      const brow = sdf.ellipsoid([0.03, 0.016, 0.014]).rotateZ(-12).at(bh[0], bh[1], bh[2] - 0.004);
      k.body('brow-marks', brow.mirror('x'), { color: w.tint.markings, roughness: 0.8, detail: 0.003, bone: 'head' });
      // A red collar: a band over the neck and the chest bib, lower in front, with a gold tag.
      // The kind's chest and neck masses (without the head), and the chest bib.
      const neckline = sdf.smoothUnion(
        0.04,
        sdf.smoothUnion(0.07, sdf.ellipsoid([0.15, 0.15, 0.16]).at(0, 0.29, 0.03), sdf.ellipsoid([0.12, 0.12, 0.09]).at(0, 0.37, 0.08)),
        sdf.ellipsoid([0.115, 0.12, 0.075]).at(0, 0.31, 0.15),
      );
      const collar = neckline.round(0.014).smoothSubtract(0.004, neckline.round(-0.008)).smoothIntersect(0.006, sdf.box([0.6, 0.036, 0.6], 0.01).rotateX(29).at(0, 0.35, 0.075));
      k.body('collar', collar, { color: '#c83a32', roughness: 0.55, detail: 0.003, bone: 'neck' });
      const front = sdf.raycast(collar, [0, 0.27, 2], [0, 0, -1]);
      const tag = sdf.cylinder(0.022, 0.008, 0.003).rotateX(80).at(0, 0.255, (front?.[2] ?? 0.22) + 0.004);
      k.body('tag', tag, { color: '#e0b040', roughness: 0.3, metalness: 0.85, detail: 0.003, bone: 'neck' });
      // The tail curls up over the back, with a white tip.
      const TIP: [number, number, number] = [0, 0.5, -0.27];
      const tail = sdf
        .chain([[0, 0.31, -0.28, 0.035], [0, 0.39, -0.34, 0.042], [0, 0.47, -0.33, 0.04], [TIP[0], TIP[1], TIP[2], 0.025]], 0.02)
        .paintWhere(sdf.sphere(0.04).at(...TIP), w.tint.markings, 0.01)
        .bone('tail');
      k.body('tail-fur', tail, { color: w.tint.fur, roughness: 0.85 });
    },
  }),
  0.72,
);
