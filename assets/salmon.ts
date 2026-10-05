import { sdf } from '../src/index.js';
import { fishAsset, sideArc, speckles } from './parts/fish-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Salmon — Chibi Quest wildlife (catalog `wildlife/water/salmon`), a plump river fish about 0.2 m tall
 * and 0.45 m long, faces +Z. Target: docs/wildlife-mockups/salmon_001.jpg (made with mmx).
 *
 * The fish of `assets/parts/fish-kind.ts` (body, eyes, fins, rig, and clips) at 0.65 of its size, as a
 * salmon: a long plump body with a grey back and pink sides and belly, small dark speckles on the
 * back, small glossy eyes, a long smile line along each side of the head with a gill curve behind it,
 * a pointed grey back fin, a forked grey tail, and grey side fins.
 * Role: a river fish and a fishing catch; the pink and grey body with the forked tail reads at 128 px.
 * Palette (60/30/10): pink sides #f2a6a0; a grey back and fins #868a96; dark speckles and a dark
 *   smile line.
 */
export default scaleAsset(
  fishAsset({
    name: 'salmon',
    description: 'Chibi salmon: a chubby river fish with a big head, a dark slate back and pink sides and belly, dark speckles on the back, large glossy eyes, a long smile line and a gill curve on each side of the head, a pointed grey back fin, a forked grey tail, and grey side fins; fish rig.',
    reference: 'docs/wildlife-mockups/salmon_001.jpg',
    variants: {
      body: { sage: '#808c86', slate: '#4e5664', grey: '#868a96', blue: '#6a7e98', green: '#7a8a6a' },
      belly: { pink: '#f2a6a0', silver: '#e4e6ea', red: '#e0705a' },
      fins: { lilac: '#8a8a9c', slate: '#5a6270', grey: '#7c808c', blue: '#5e7290', red: '#c05a4a' },
      eyes: { dark: '#1a1416', brown: '#4a2a18' },
    },
    presets: {
      silver: { body: 'blue', belly: 'silver', fins: 'blue', eyes: 'dark' },
      spawning: { body: 'green', belly: 'red', fins: 'red', eyes: 'brown' },
      slate: { body: 'slate', belly: 'pink', fins: 'slate', eyes: 'dark' },
    },
    spine: [
      [0.180, 0.27, 0.09],
      [0.190, 0.17, 0.165],
      [0.195, 0.04, 0.17],
      [0.185, -0.09, 0.13],
      [0.185, -0.19, 0.075],
      [0.205, -0.26, 0.035],
    ],
    width: 0.8,
    swimAmp: 1.7,
    // A short round snout in front of the head, with the mouth at its front.
    beak: { from: [0.17, 0.3], to: [0.162, 0.345], r: 0.07, width: 1.15 },
    belly: [0.245, 0],
    eye: { at: [0.2, 0.19], angle: 64, r: 0.046 },
    tail: 'fork',
    tailSize: 1.45,
    dorsal: 'sail',
    dorsalAt: [0.0, 1.1],
    pectoralAt: [0.1, 0.09],
    pectoralSize: 1.3,
    pelvic: true,
    paint(body, fish) {
      const dark = fish.tone('body', '#3a3a44', 0.5);
      const dots = speckles(0.045, 0.012, 0.5, 0.24);
      // The grey back comes down over the top of the snout: above a line from the middle of the snout
      // to above the eye; the lower snout and the mouth stay pink.
      const n = Math.hypot(1, 0.35);
      const hood = sdf.halfSpace([0, -1 / n, -0.35 / n], -0.315 / n).intersect(sdf.halfSpace([0, 0, -1], -0.2));
      return body
        .paintWhere(hood, fish.tint.body, 0.008)
        .paintFn((x, y, z, base) => (dots(x, y, z) ? [0.13, 0.13, 0.16] : base))
        // A long smile from the front of the snout back under the eye.
        .paintWhere(sideArc(0.3, 0.245, 0.1, 0.008, 222, 302), dark, 0.002)
        // Two gill lines in the pink behind the eye.
        .paintWhere(sideArc(0.17, 0.175, 0.085, 0.006, 145, 215), fish.tone('belly', '#c86a72', 1), 0.002)
        .paintWhere(sideArc(0.145, 0.175, 0.085, 0.006, 150, 210), fish.tone('belly', '#c86a72', 1), 0.002);
    },
  }),
  0.65,
);
