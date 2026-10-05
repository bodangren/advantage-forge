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

// Wide thick antlers: each main beam sweeps out to the side and up, with a brow tine forward and
// four tines that rise from the beam.
const ANTLER = antlerShape(
  [
    [0.055, 0.83, 0.125, 0.044],
    [0.13, 0.9, 0.11, 0.04],
    [0.21, 0.97, 0.095, 0.036],
    [0.27, 1.06, 0.085, 0.032],
    [0.3, 1.16, 0.09, 0.027],
    [0.3, 1.24, 0.1, 0.021],
  ],
  [
    [[0.08, 0.85, 0.12], [0.06, 0.91, 0.215], 0.022],
    [[0.13, 0.9, 0.11], [0.12, 1.03, 0.14], 0.022],
    [[0.2, 0.96, 0.097], [0.19, 1.1, 0.115], 0.021],
    [[0.26, 1.04, 0.087], [0.36, 1.12, 0.07], 0.02],
    [[0.29, 1.13, 0.088], [0.23, 1.22, 0.1], 0.019],
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
    eyeScale: 1.4,
    legThick: 1.3,
    colors: { earInner: '#f0c4a4' },
    headProbes: ANTLER.tips,
    paint(fur, deer) {
      const cream = deer.tone('fur', '#f3e2b8', 0.2);
      // A cream lower face, and a cream spot on each flank behind the shoulder.
      const spot = sdf.ellipsoid([0.2, 0.05, 0.045]).rotateX(-20).at(0, 0.43, -0.04);
      return fur.paintWhere(sdf.ellipsoid([0.13, 0.065, 0.15]).at(0, 0.585, 0.255), cream, 0.01).paintWhere(spot, cream, 0.008);
    },
    extra(k) {
      k.body('antlers', ANTLER.shape.mirror('x'), { color: '#5c3b28', roughness: 0.7, bone: 'head', detail: 0.004 });
    },
  }),
  1.15,
);
