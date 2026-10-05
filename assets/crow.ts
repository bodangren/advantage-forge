import { birdAsset } from './parts/bird-kind.js';
import { crownTuft, domeEyes } from './parts/bird-extras.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Crow — Chibi Quest wildlife (catalog `wildlife/birds/crow`), a small round black bird about 0.36 m
 * tall, faces +Z. Target: docs/wildlife-mockups/crow_001.jpg (made with mmx).
 *
 * The bird of `assets/parts/bird-kind.ts` (egg body, head, beak, legs, wings, rig, and clips) at 0.42
 * of its size, as a crow: a round blue-black body and a big head, a small crown tuft, a short straight
 * dark beak, dark eyes in dark grey rims, short folded wings, a short fan tail, and dark grey feet.
 * Role: ambient life on fields, roofs, and graveyards; the black round shape with the beak reads at
 *   128 px.
 * Palette (60/30/10): blue-black #2e3240 body and head; darker wings #242734; dark grey beak and
 *   feet; dark grey eye rims and white glints keep the eyes visible on the black.
 */
export default scaleAsset(
  birdAsset({
    name: 'crow',
    description: 'Chibi crow: a small squat slate crow with a big head, a stern brow, a heavy dark beak that points down, big dark glossy eyes, feather relief, folded wings, a short fan tail, and short dark legs; bird rig with wings.',
    reference: 'docs/wildlife-mockups/crow_001.jpg',
    variants: {
      body: { slate: '#2e3c44', grey: '#5a5c64', white: '#e8e6e2' },
      head: { slate: '#2e3c44', grey: '#6a6c74', white: '#eceae6' },
      wings: { slate: '#26343c', black: '#242734', white: '#dcdad6' },
      eyes: { dark: '#1e1612', amber: '#a86a1a', blue: '#3a5a8a' },
    },
    presets: {
      hooded: { body: 'grey', head: 'slate', wings: 'black', eyes: 'dark' },
      albino: { body: 'white', head: 'white', wings: 'white', eyes: 'blue' },
    },
    colors: { belly: '#34444c', flight: '#1e2a30', scale: '#3e3e46', scaleDark: '#2e2e36', talon: '#18181c', eyeRim: '#2a2c36', mouth: '#2a2c32', pupil: '#0c0c10' },
    body: [0.22, 0.18, 0.2],
    head: 0.15,
    beak: 'short',
    beakScale: 1.6,
    beakWidth: 1.3,
    beakDroop: 30,
    beakColors: ['#26282e', '#26282e'],
    mouth: false,
    brows: false,
    eyeStyle: 'bead',
    eyeScale: 1.45,
    talons: false,
    // Big sculpted feather clumps on the chest and the wings; the head stays calm.
    featherBump: 0.008,
    featherCell: 1.6,
    featherOn: { head: false },
    walkBob: 0.6,
    wingRest: -118,
    wingTurn: 55,
    wingOut: 0.085,
    wingScale: 0.68,
    legLength: 0.2,
    wingStyle: 'paddle',
    neckScale: 1.8,
    extra(k, b) {
      k.body('tuft', crownTuft(b, 0.06, 0.014), { color: b.tint.head, roughness: 0.85, detail: 0.003 });
      // Large glossy dark eyes, amber low in the iris, under a heavy stern brow.
      domeEyes(k, b, { iris: b.tone('eyes', '#141010'), low: b.tone('eyes', '#2e1a0e', 0.6), r: 1.3, brow: 1.1 });
    },
  }),
  0.42,
);
