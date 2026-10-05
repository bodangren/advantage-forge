import { motion, sdf } from '../src/index.js';
import { deerAsset } from './parts/deer-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Hare — Chibi Quest wildlife (catalog `wildlife/forest/hare`), a slim orange hare about 0.6 m tall
 * to the ear tips, faces +Z. Target: docs/wildlife-mockups/hare_001.jpg (made with mmx).
 *
 * The deer of `assets/parts/deer-kind.ts` (big head, slim body, long thin legs, rig, and clips) at 0.55
 * of its size, as a hare: a bright orange coat with a cream face, chest, and belly, very big ears that
 * flare out to the sides with large black tips, big glossy brown eyes, small black feet, and a small
 * dark tail. No antlers and no spots.
 * Role: a fast field animal for the hunting and nature games; the flared black-tipped ears and the
 *   long thin legs read at 128 px.
 * Palette (60/30/10): orange #d9782e coat; cream #f4e4c4 face, chest, and belly; black ear tips and
 *   feet; brown eyes with white glints.
 */
export default scaleAsset(
  deerAsset({
    name: 'hare',
    description: 'Chibi hare: a slim bright orange hare with a cream face, chest, and belly, very big ears that flare out with large black tips, big glossy brown eyes, long thin legs with small black feet, and a small dark tail; quadruped rig.',
    reference: 'docs/wildlife-mockups/hare_001.jpg',
    variants: {
      fur: { tan: '#c98450', orange: '#d9782e', brown: '#a87a4a', grey: '#8a8078', snow: '#eeece8' },
      eyes: { amber: '#a8641c', brown: '#5a3218', dark: '#2a1a12' },
    },
    presets: {
      orange: { fur: 'orange', eyes: 'brown' },
      brown: { fur: 'brown', eyes: 'amber' },
      grey: { fur: 'grey', eyes: 'brown' },
      snow: { fur: 'snow', eyes: 'dark' },
    },
    colors: { cream: '#f4e4c4', bib: '#f6ead0', earInner: '#f6c890', hoof: '#1e1a1a' },
    spots: false,
    antlers: false,
    tail: 'puff',
    paws: true,
    pawSize: 0.95,
    eyeScale: 1.5,
    slim: 0.78,
    // The hare paints its own face (a cream lower face, dark eye rims) and a narrow chest patch.
    mask: false,
    bib: false,
    nose: false,
    earScale: 2.0,
    earWidth: 0.52,
    earTilt: -34,
    earTurn: 8,
    paint(fur, deer) {
      const black = deer.tone('fur', '#2a2220', 0.15);
      const cream = '#f4e4c4';
      // The large black ear tips with a sharp edge, and the small round dark tail puff.
      const tips = sdf.box([2, 1, 1]).at(0, 1.03 + 0.5, 0.1);
      const tail = sdf.sphere(0.06).at(0, 0.44, -0.3);
      // The cream lower face from under the eyes to the chin, a narrow cream chest, and a dark rim
      // round each eye (the eye covers the middle).
      const lowerFace = sdf.ellipsoid([0.16, 0.085, 0.16]).at(0, 0.6, 0.255);
      const chest = sdf.ellipsoid([0.058, 0.14, 0.1]).at(0, 0.43, 0.16);
      const eL = deer.faceHit(0.086, 0.7);
      const rim = sdf.ellipsoid([0.047, 0.057, 0.04]).rotateY(14).at(eL[0], eL[1], eL[2]).mirror('x');
      // Big haunches over the long hind legs.
      const haunch = sdf.ellipsoid([0.06, 0.1, 0.11]).rotateX(-15).at(0.075, 0.31, -0.19).bone('bleg.L').mirror('x');
      return fur
        .smoothUnion(0.03, haunch)
        .paintWhere(tips, black, 0.004)
        .paintWhere(tail, deer.tone('fur', '#5a3a2a', 0.4), 0.01)
        .paintWhere(lowerFace, cream, 0.01)
        .paintWhere(chest, cream, 0.01)
        .paintWhere(rim, deer.tone('fur', '#3a2418', 0.2), 0.003);
    },
    extra(k, deer) {
      // A longer, more pointed muzzle in front of the head's muzzle, with a small black nose at its
      // tip and a short closed mouth line.
      const muzzle = sdf.ellipsoid([0.06, 0.05, 0.062]).at(0, 0.608, 0.33);
      k.body('muzzle', muzzle.bone('head'), { color: '#f4e4c4', roughness: 0.85, detail: 0.004 });
      k.body('snout-nose', sdf.ellipsoid([0.026, 0.019, 0.02]).at(0, 0.632, 0.385).bone('head'), { color: '#1a1414', roughness: 0.25, detail: 0.003 });
      k.body('mouth-line', sdf.capsule([0, 0.615, 0.386], [0, 0.595, 0.383], 0.0028).bone('head'), { color: '#3a2420', roughness: 0.6, detail: 0.002 });
      void deer;
    },
    // The run is a bound: in the air the body stretches, the long hind legs push back, and the
    // front legs reach forward; on landing the front paws touch down and the hind legs swing
    // forward past them.
    pose(clip, p) {
      if (clip !== 'run') return {};
      const a = motion.wave(p);
      const air = Math.max(0, a);
      const land = Math.max(0, -a);
      const front = { rotate: [-50 * air + 30 * land, 0, 0] as const };
      const frontShin = { rotate: [20 * air + 10 * land, 0, 0] as const };
      const hind = { rotate: [55 * air - 45 * land, 0, 0] as const };
      const hindShin = { rotate: [-15 * air + 30 * land, 0, 0] as const };
      return {
        hips: { move: [0, 0.09 * air, 0] as const, rotate: [0, 0, 0] as const },
        spine: { rotate: [-8 * a, 0, 0] as const },
        neck: { rotate: [6 * a, 0, 0] as const },
        tail: { rotate: [10 * a, 0, 0] as const },
        'fleg.L': front,
        'fleg.R': front,
        'fshin.L': frontShin,
        'fshin.R': frontShin,
        'bleg.L': hind,
        'bleg.R': hind,
        'bshin.L': hindShin,
        'bshin.R': hindShin,
      };
    },
  }),
  0.55,
);
