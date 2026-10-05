import { profile, sdf } from '../src/index.js';
import { fishAsset } from './parts/fish-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Dolphin — Chibi Quest wildlife (catalog `wildlife/water/dolphin`), a small friendly dolphin about
 * 0.35 m tall and 0.55 m long, faces +Z. Target: docs/wildlife-mockups/dolphin_001.jpg (made with mmx).
 *
 * The fish of `assets/parts/fish-kind.ts` (body, eyes, fins, rig, and clips) at 0.75 of its size, as a
 * dolphin pup: a big round head ball on a round body with a soft crease between them, a wide beak
 * with a smile along its bottom, glossy black eyes with one shine, a white front on the round body,
 * a curved yellow back fin behind the head, two big flippers, and a fluke that curls up behind.
 * Role: a sea animal for the coast and the water games; the round head with the wide beak reads at
 *   128 px.
 * Palette (60/30/10): grey #949aa4; a white front #eef0f2; a yellow back fin #ecd85a and black eyes
 *   with one shine as the accent; a dark smile.
 */
export default scaleAsset(
  fishAsset({
    name: 'dolphin',
    description: 'Chibi dolphin: a small grey dolphin pup with a big round head on a round body, a wide beak with a smile, glossy black eyes, a white front, a curved yellow back fin, two big flippers, and a fluke that curls up; fish rig.',
    reference: 'docs/wildlife-mockups/dolphin_001.jpg',
    variants: {
      body: { grey: '#949aa4', blue: '#6a8aa8', pink: '#e0a8b8' },
      belly: { white: '#eef0f2', cream: '#f2ecd8' },
      fins: { grey: '#7e8690', blue: '#5e7e9c', pink: '#d498ac' },
      eyes: { dark: '#1a1416', blue: '#1a3050' },
    },
    presets: {
      ocean: { body: 'blue', belly: 'white', fins: 'blue', eyes: 'blue' },
      river: { body: 'pink', belly: 'cream', fins: 'pink', eyes: 'dark' },
    },
    colors: { eyeWhite: '#141012' },
    // A big round head over a round body (a soft crease between them), and the tail curling up.
    spine: [
      [0.43, 0.06, 0.18],
      [0.16, 0.0, 0.155],
      [0.12, -0.13, 0.1],
      [0.14, -0.23, 0.058],
      [0.2, -0.29, 0.032],
    ],
    rootSection: 1,
    headBall: true,
    width: 0.98,
    blend: 0.04,
    beak: { from: [0.36, 0.14], to: [0.35, 0.25], r: 0.056, width: 1.45 },
    belly: [0.005, 0],
    eye: { at: [0.44, 0.06], angle: 38, r: 0.032, glints: 1 },
    tail: 'fluke',
    tailSize: 1.3,
    tailTilt: 48,
    dorsal: false,
    pectoral: 'flipper',
    pectoralAt: [0.16, 0.06],
    pectoralSize: 1.35,
    paint(body, fish) {
      const dark = fish.tone('body', '#2a2e36', 0.4);
      // The pale belly on the front of the round body only (not on the head), and a wide smile along
      // the bottom of the beak, curving up at the corners: a stroke seen from the front, pushed back
      // along Z onto the beak.
      const front = sdf.ellipsoid([0.12, 0.17, 0.2]).at(0, 0.13, 0.1);
      const smile = sdf.extrude(profile.arc(0.12, 0.012, 232, 308), 0.3).at(0, 0.328 + 0.12, 0.3);
      return body.paintWhere(front, fish.tint.belly, 0.012).paintWhere(smile, dark, 0.002);
    },
    extra(k) {
      // The yellow back fin: a curved blade that sweeps back from the top of the body.
      const fin = sdf
        .extrude(profile.polygon([[0.05, 0], [0.02, 0.05], [-0.04, 0.1], [-0.075, 0.105], [-0.04, 0.06], [-0.05, 0]], { smooth: true }), 0.024, 0.009)
        .rotateY(-90)
        .scale(1.4)
        .at(0, 0.2, -0.13);
      k.body('back-fin', fin.bone('body'), { color: '#ecd85a', roughness: 0.25, detail: 0.003 });
    },
  }),
  0.75,
);
