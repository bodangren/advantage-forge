import { sdf } from '../src/index.js';
import { antlerShape, deerAsset } from './parts/deer-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Stag — Chibi Quest wildlife (catalog `wildlife/land/stag`), about 1.0 m to the top of the head
 * (1.45 m to the antler tips), faces +Z. Target: docs/wildlife-mockups/stag_001.jpg (made with mmx
 * from the deer mockup).
 *
 * The deer of `assets/deer.ts` (body, head, rig, and clips from `assets/parts/deer-kind.ts`) at
 * 1.15 of its size, as a grown stag: large branching dark antlers (a curved beam with four tines a
 * side), a warm red-brown coat with a white chest bib, a cream lower face, a white tail, and no
 * fawn spots or eye patches.
 * Role: proud forest wildlife and a hunting target; the antlers make the silhouette at 128 px.
 * Palette (60/30/10): red-brown coat #c86a36; white bib #faf2e2 and cream face #f3e2b8; dark brown
 *   antlers #5c3b28; black eyes, nose, and hooves.
 */

const ANTLER = antlerShape(
  [
    [0.05, 0.835, 0.125, 0.036],
    [0.1, 0.94, 0.11, 0.032],
    [0.15, 1.05, 0.095, 0.03],
    [0.175, 1.15, 0.1, 0.027],
    [0.165, 1.24, 0.12, 0.022],
  ],
  [
    [[0.075, 0.89, 0.12], [0.07, 0.94, 0.215], 0.017],
    [[0.12, 0.99, 0.105], [0.1, 1.08, 0.17], 0.017],
    [[0.155, 1.07, 0.095], [0.225, 1.155, 0.13], 0.016],
    [[0.172, 1.17, 0.103], [0.125, 1.255, 0.11], 0.016],
  ],
);

export default scaleAsset(
  deerAsset({
    name: 'stag',
    description: 'Chibi stag: a big round head with glossy eyes, large branching dark antlers, a red-brown coat with a white chest bib, a cream lower face, slim legs, and a white tail; quadruped rig.',
    reference: 'docs/wildlife-mockups/stag_001.jpg',
    variants: {
      fur: { red: '#c86a36', brown: '#8e5a36', grey: '#8c7a66', gold: '#c99050' },
      eyes: { dark: '#2a1a12', brown: '#5a3418', hazel: '#6e5a2c' },
    },
    presets: {
      brown: { fur: 'brown', eyes: 'brown' },
      winter: { fur: 'grey', eyes: 'dark' },
      gold: { fur: 'gold', eyes: 'hazel' },
    },
    mask: false,
    spots: false,
    antlers: false,
    earScale: 0.88,
    colors: { earInner: '#f0c4a4' },
    headProbes: ANTLER.tips,
    paint(fur, deer) {
      const cream = deer.tone('fur', '#f3e2b8', 0.2);
      return fur.paintWhere(sdf.ellipsoid([0.13, 0.065, 0.15]).at(0, 0.585, 0.255), cream, 0.01);
    },
    extra(k) {
      k.body('antlers', ANTLER.shape.mirror('x'), { color: '#5c3b28', roughness: 0.7, bone: 'head', detail: 0.004 });
    },
  }),
  1.15,
);
