import { sdf } from '../src/index.js';
import { horseAsset } from './parts/horse-kind.js';

/**
 * Cow — Chibi Quest wildlife (catalog `wildlife/land/cow`), about 1.15 m to the horn tips and
 * 1.1 m from muzzle to tail, faces +Z. Target: docs/wildlife-mockups/cow_001.jpg (made with mmx).
 *
 * The horse of `assets/horse.ts` (body, head, rig, and clips from `assets/parts/horse-kind.ts`) as
 * a stocky dairy cow: a big head (1.2) on a short body with short legs, short cream horns, ears
 * held out to the sides with pink insides, a very wide pink muzzle with nostrils only (no smile
 * line), a white coat with black patches (one over each horn base, spots on the flanks and the
 * legs), a leather collar with a brass bell, a thin tail with a black tuft, and dark hooves; no
 * mane, halter, blaze, or socks. No udder (the game is rated G).
 * Role: a farm animal for village and hamlet scenes; the black patches, the bell, and the pink
 *   muzzle read at 128 px.
 * Palette (60/30/10): white coat #f4f0e8 with black patches #2a2624; a pink muzzle #f0a8a0; cream
 *   horns #e8d498; a brass bell #d0a040 as the accent.
 */

export default horseAsset({
  name: 'cow',
  description: 'Chibi cow: a big round head with glossy eyes, short cream horns, ears held out to the sides, a wide pink muzzle, a white coat with black patches, a leather collar with a brass bell, and a thin tufted tail; quadruped rig.',
  reference: 'docs/wildlife-mockups/cow_001.jpg',
  variants: {
    coat: { white: '#f4f0e8', brown: '#9a6038', red: '#b0583a', cream: '#e8d4b0' },
    patch: { black: '#2a2624', brown: '#6a3e26', white: '#f6f2ea' },
    mane: { black: '#2a2624', brown: '#5a3424', white: '#f0ece4' },
    eyes: { brown: '#2a1a12', dark: '#120c0a', hazel: '#6b4a22' },
  },
  presets: {
    brown: { coat: 'brown', patch: 'white', mane: 'brown', eyes: 'brown' },
    red: { coat: 'red', patch: 'white', mane: 'white', eyes: 'dark' },
    jersey: { coat: 'cream', patch: 'brown', mane: 'brown', eyes: 'hazel' },
  },
  colors: { muzzle: '#f0a8a0', coatDark: '#f0b0a8', brow: '#3a2a24', hoof: '#2a2220', nostril: '#9a4a48' },
  muzzleFollow: 0,
  halter: false,
  blaze: false,
  socks: false,
  mane: false,
  tail: 'tuft',
  earSpread: 84,
  earWidth: 1.6,
  ears: 1.2,
  earAt: [0.15, 0.97, 0.24],
  muzzleScale: 1.3,
  smile: false,
  headScale: 1.2,
  legLength: -0.07,
  bodyLength: -0.06,
  paint(coat, horse) {
    const patch = horse.tone('patch', '#2a2624');
    const spots = sdf.union(
      sdf.ellipsoid([0.16, 0.13, 0.14]).at(0.17, 0.58, -0.24),
      sdf.ellipsoid([0.1, 0.1, 0.11]).at(-0.18, 0.5, 0.08),
      sdf.ellipsoid([0.08, 0.07, 0.07]).at(-0.12, 0.66, -0.3),
      // The head patches: round patches over each horn base that reach down toward the brows.
      sdf.ellipsoid([0.095, 0.095, 0.12]).at(-0.12, 1.0, 0.35),
      sdf.ellipsoid([0.08, 0.075, 0.11]).at(0.13, 1.02, 0.33),
      // Spots on the legs: the right foreleg and the left hind leg.
      sdf.ellipsoid([0.06, 0.06, 0.06]).at(-0.15, 0.26, 0.21),
      sdf.ellipsoid([0.06, 0.07, 0.06]).at(0.15, 0.3, -0.27),
      sdf.ellipsoid([0.05, 0.05, 0.05]).at(0.14, 0.3, 0.14),
    );
    return coat.paintWhere(spots, patch, 0.008);
  },
  extra(k, horse) {
    const horn = sdf.chain([[0.08, 1.04, 0.24, 0.042], [0.15, 1.08, 0.235, 0.035], [0.2, 1.14, 0.23, 0.026], [0.205, 1.21, 0.22, 0.012]], 0.012);
    k.body('horns', horn.mirror('x'), { color: '#dcbc58', roughness: 0.45, detail: 0.003, bone: 'head' });
    // A white tuft on the forehead between the horns.
    const tuft = sdf.smoothUnion(0.012, sdf.ellipsoid([0.045, 0.028, 0.04]).rotateX(-25).at(0, 1.07, 0.27), sdf.ellipsoid([0.024, 0.02, 0.026]).at(0.01, 1.095, 0.3));
    k.body('tuft', tuft, { color: horse.tone('coat', '#f8f4ec', 0.5), roughness: 0.85, detail: 0.003, bone: 'head' });
    // The collar round the neck, square to it, and the bell under the throat.
    const collar = sdf.torus(0.163, 0.017).rotateX(26.6).at(0, 0.63, 0.11);
    k.body('collar', collar, { color: '#7a4a2a', roughness: 0.55, detail: 0.004, bone: 'neck' });
    const bell = sdf.smoothUnion(
      0.008,
      sdf.capsule([0, 0.565, 0.25], [0, 0.525, 0.29], 0.012),
      sdf.cone([0, 0.52, 0.295], [0, 0.44, 0.305], 0.024, 0.045),
      sdf.sphere(0.013).at(0, 0.43, 0.305),
    );
    k.body('bell', bell, { color: '#d0a040', roughness: 0.3, metalness: 0.8, detail: 0.003, bone: 'neck' });
  },
});
