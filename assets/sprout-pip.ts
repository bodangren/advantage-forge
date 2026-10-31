import { motion, noise, sdf } from '../src/index.js';
import { scaleAsset } from './parts/scale-asset.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Pip — the puppy of the Chibi Sprouts Pip-world stories, about 0.40 m to the top of the head,
 * faces +Z. Target: docs/sprout-mockups/pip.jpg (the cast sheet).
 *
 * The dog kind (`assets/dog.ts`: body, head, rig, and clips from `assets/parts/wolf-kind.ts`) at a
 * smaller size with a bigger head, as the series-bible puppy: golden-brown fur, a cream chest,
 * muzzle, and forehead stripe, floppy golden ears with darker tips, big dark-brown eyes, a happy
 * open smile with the tongue, cream paws, a fluffy tail with a cream tip curling up, and a red
 * collar with one small round gold tag under the chin (no bell).
 * Role: the hero Sprout's puppy; the stripe, the ears, and the collar read at 128 px.
 * Palette (60/30/10): fur #c8903c; cream #f4e4c4; ears #b07a34 with tips #8a5a2c; collar #d03a32
 *   with a gold tag #e8b43c as the accent.
 */

const S = 0.52; // 0.72 (the dog) x 0.40 / 0.55 m to the top of the head
const TAG_R = 0.0175 / S; // a 0.035 m medallion, in the kind's size

export default scaleAsset(
  wolfAsset({
    name: 'sprout-pip',
    description: 'Pip the puppy of Chibi Sprouts: a golden-brown puppy with a big round head, a cream stripe up the forehead, cream muzzle, chest, and paws, floppy ears with darker tips, big dark eyes, a happy open smile with the tongue, a fluffy tail with a cream tip, and a red collar with a small round gold tag; quadruped rig.',
    reference: 'docs/sprout-mockups/pip.jpg',
    // The rest pose stands (for the walk); the `sit` clip holds the sitting pose (week 1 shows Pip sitting up).
    sit: true,
    // Week 1 "a nest and a nut": Pip sniffs a nut on the ground. Other dog kinds do not get this clip.
    sniff: true,
    headScale: 1.12,
    cheekCream: false,
    muzzleWidth: 0.62,
    legLength: 0.07,
    variants: {
      fur: { golden: '#d4803a', tan: '#d89a52', black: '#3a3432', white: '#f2ece2', grey: '#9a9894' },
      markings: { cream: '#f4e4c4', white: '#fff6ec', tan: '#d8a46a' },
      eyes: { 'dark brown': '#7a4418', brown: '#5a3418', amber: '#7a440c', blue: '#3a5a7a' },
      ears: { golden: '#d4803a', brown: '#6a3e24', black: '#2a2422', tan: '#c88a4a' },
    },
    presets: {
      pip: { fur: 'golden', markings: 'cream', eyes: 'dark brown', ears: 'golden' },
      black: { fur: 'black', markings: 'tan', eyes: 'brown', ears: 'black' },
      white: { fur: 'white', markings: 'white', eyes: 'blue', ears: 'tan' },
      grey: { fur: 'grey', markings: 'white', eyes: 'amber', ears: 'black' },
    },
    colors: { furLight: '#e09a50', furDark: '#d4803a', eyeRim: '#3a2010', nose: '#141012' },
    eyeScale: 1.3,
    pupilScale: 1.35,
    snout: 0.03,
    cheekTufts: false,
    brows: false,
    forelock: false,
    smile: true,
    smileArc: [240, 300],
    fangs: false,
    teeth: false,
    ruff: 'smooth',
    ears: false,
    claws: false,
    tail: false,
    paint(fur, t) {
      // Cream paws, a cream bib down the chest, and the cream stripe up the forehead.
      const bib = sdf.union(
        sdf.ellipsoid([0.1, 0.2, 0.09]).at(0, 0.27, 0.2),
        sdf.ellipsoid([0.035, 0.15, 0.2]).at(0, 0.13, 0.1),
      );
      // The stripe stops at the top of the head (z of the crown and nearer).
      const stripe = sdf.ellipsoid([0.05, 0.2, 0.3]).at(0, 0.7, 0.2).intersect(sdf.halfSpace([0, 0, -1], -0.14));
      // Cream cheeks around the muzzle, with a pink blush on the outer side.
      const cheeks = sdf.ellipsoid([0.07, 0.05, 0.085]).rotateZ(25).at(0.115, 0.435, 0.25).mirror('x', 0);
      const blush = sdf.ellipsoid([0.033, 0.024, 0.05]).rotateZ(20).at(0.14, 0.455, 0.25).mirror('x', 0);
      return fur
        .paintWhere(cheeks, t.markings, 0.02)
        .paintWhere(blush, '#f2a08c', 0.02)
        .paintWhere(sdf.halfSpace([0, 1, 0], 0.05), t.markings, 0.012)
        .paintWhere(bib, t.markings, 0.025)
        .paintWhere(stripe, t.markings, 0.012);
    },
    // The open smile's tongue has a bone of its own (on the jaw), so the `sniff` clip can pull it in.
    bones: { 'tongue-bone': { parent: 'jaw', at: [0, 0.36, 0.28] } },
    pose(clip, p) {
      // Sniff: the mouth points down and the pink tongue would show under the belly from behind, so
      // the tongue slides back into the mouth and shrinks.
      if (clip === 'sniff') return { 'tongue-bone': { move: [0, 0.004, -0.03], scale: [0.4, 0.3, 0.4] } };
      // Sit: a wag of the tail and a tilt of the head, so the held pose moves.
      if (clip !== 'sit') return {};
      return {
        tail: { rotate: [14, 48 * motion.wave(p, 3), 10 * motion.wave(p, 3, 0.25)] },
        head: { rotate: [13.6, 9 * motion.wave(p, 1, 0.25), 8 * motion.wave(p)] },
      };
    },
    extra(k, w) {
      const ears = k.tint('ears');
      const tips = w.tone('ears', '#7a4a22', 0.3);
      // Wide, soft flaps: a rolled fold on the top of the head, then a flap that hangs and swings
      // outward, with the darker color on the lower third.
      const flap = sdf
        .smoothUnion(
          0.03,
          sdf.ellipsoid([0.032, 0.14, 0.095]).at(0, -0.075, 0),
          sdf.ellipsoid([0.05, 0.045, 0.105]).rotateZ(-8).at(-0.006, 0.03, 0.002),
        )
        .round(0.006)
        .rotateZ(18)
        .rotateX(-6)
        .at(0.178, 0.575, 0.15);
      const ear = flap.paintWhere(sdf.halfSpace([0, 1, 0], 0.5), tips, 0.035);
      k.body('ears', ear.mirror('x', 0), {
        color: ears,
        roughness: 0.85,
        detail: 0.004,
        bone: 'head',
        bump: (x: number, y: number, z: number) => 0.0008 * noise.fbm(x * 60, y * 25, z * 60, 2),
      });
      // Three fur tufts on the crown, leaning back.
      const tuftAt = (x: number, z: number, dx: number, len: number) => {
        const t = sdf.raycast(w.head, [x, 2, z], [0, -1, 0]);
        const [tx, ty, tz] = t ?? [x, 0.67, z];
        return sdf.cone([tx, ty - 0.015, tz], [tx + dx, ty + len, tz - 0.035], 0.026, 0.004).scale([1, 1, 0.7]);
      };
      const tufts = sdf.smoothUnion(0.01, tuftAt(0, 0.08, 0, 0.05), tuftAt(0.055, 0.07, 0.025, 0.042), tuftAt(-0.055, 0.07, -0.025, 0.042));
      k.body('tufts', tufts.bone('head'), { color: w.tint.fur, roughness: 0.85, detail: 0.003 });
      // Short brown brows above the big eyes.
      const e = w.eye;
      const browAt = (x: number, y: number): [number, number, number] => {
        const h = w.faceHit(x, y);
        return [h[0], h[1], h[2] - 0.004];
      };
      const brow = sdf.chain([[...browAt(e[0] + 0.03, e[1] + 0.07), 0.009], [...browAt(e[0], e[1] + 0.085), 0.01], [...browAt(e[0] - 0.035, e[1] + 0.075), 0.008]], 0.008).mirror('x', 0);
      k.body('brows', brow.bone('head'), { color: '#7a4020', roughness: 0.85, detail: 0.003 });
      // One open smile: the dark opening hangs from the smile arc, and the tongue fills its lower half.
      const mh = w.faceHit(0, 0.38);
      const OZ = mh[2] - 0.012;
      const grinCut = sdf.cylinder(0.16, 0.6).rotateX(90).at(0, 0.55, OZ);
      const openFull = sdf.ellipsoid([0.058, 0.05, 0.026]).at(mh[0], 0.384, OZ);
      const opening = openFull.subtract(grinCut);
      k.body('mouth-open', opening.bone('jaw'), { color: '#3a1a1e', roughness: 0.5, detail: 0.003 });
      const tongue = sdf.ellipsoid([0.04, 0.026, 0.027]).at(mh[0], 0.358, OZ + 0.002).intersect(opening.round(0.002));
      k.body('tongue-in', tongue.bone('tongue-bone'), { color: '#ec7a88', roughness: 0.4, detail: 0.003 });
      // Flat catch-lights: a thin white skin on the eye (upper outer side), not a sphere.
      const shine = w.head.round(0.0015).intersect(sdf.sphere(0.0165).at(e[0] + 0.017, e[1] + 0.021, e[2]).mirror('x'));
      k.body('eye-shine', shine.bone('head'), { color: '#ffffff', roughness: 0.2, detail: 0.002 });
      // A red collar: a band over the neck and the chest bib, lower in front.
      const neckline = sdf.smoothUnion(
        0.04,
        sdf.smoothUnion(0.07, sdf.ellipsoid([0.15, 0.15, 0.16]).at(0, 0.29, 0.03), sdf.ellipsoid([0.12, 0.12, 0.09]).at(0, 0.37, 0.08)),
        sdf.ellipsoid([0.115, 0.12, 0.075]).at(0, 0.31, 0.15),
      );
      const collar = neckline.round(0.014).smoothSubtract(0.004, neckline.round(-0.008)).smoothIntersect(0.006, sdf.box([0.6, 0.036, 0.6], 0.01).rotateX(29).at(0, 0.35, 0.075));
      k.body('collar', collar, { color: '#d03a32', roughness: 0.55, detail: 0.003, bone: 'neck' });
      // One small round gold tag on a ring at the front of the collar, under the chin (no bell).
      const front = sdf.raycast(collar, [0, 0.3, 2], [0, 0, -1]);
      const bz = (front?.[2] ?? 0.24) + 0.006;
      const ringY = 0.318;
      const tag = sdf.smoothUnion(
        0.002,
        sdf.cylinder(TAG_R, 0.012, 0.003).rotateX(90).at(0, ringY - TAG_R - 0.008, bz),
        sdf.torus(0.007, 0.0025).rotateY(90).at(0, ringY - 0.004, bz),
      );
      k.body('tag', tag, { color: '#f6c840', roughness: 0.3, metalness: 0.5, detail: 0.0025, bone: 'neck' });
      // The tail curls up and over the back: fat in the middle, a fur tuft at the end, a cream tip.
      const TIP: [number, number, number] = [0.01, 0.62, -0.22];
      const tailCore = sdf.chain(
        [[0, 0.31, -0.28, 0.04], [0, 0.38, -0.35, 0.056], [0, 0.47, -0.37, 0.066], [0, 0.56, -0.32, 0.066], [TIP[0], TIP[1], TIP[2], 0.05]],
        0.03,
      );
      const tail = sdf
        .smoothUnion(0.02, tailCore, sdf.ellipsoid([0.04, 0.07, 0.04]).rotateX(-25).at(TIP[0], TIP[1] + 0.045, TIP[2] - 0.01))
        .displace(0.004, (x, y, z) => noise.fbm(x * 45, y * 45, z * 45, 2))
        .paintWhere(sdf.sphere(0.075).at(TIP[0], TIP[1] + 0.03, TIP[2]), w.tint.markings, 0.015)
        .bone('tail');
      k.body('tail-fur', tail, { color: w.tint.fur, roughness: 0.85, detail: 0.004, bump: (x: number, y: number, z: number) => 0.0008 * noise.fbm(x * 60, y * 25, z * 60, 2) });
    },
  }),
  S,
);
