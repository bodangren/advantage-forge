import { sdf } from '../src/index.js';
import { fishAsset } from './parts/fish-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Fish — Chibi Quest wildlife (catalog `wildlife/water/fish`), a small round fish about 0.25 m tall and
 * 0.3 m long, faces +Z. Target: docs/wildlife-mockups/fish_001.jpg (made with mmx).
 *
 * The fish of `assets/parts/fish-kind.ts` (body, eyes, fins, rig, and clips) at 0.6 of its size, as a
 * round toy fish: a ball-shaped sky-blue body with a yellow belly, big glossy eyes with pale rims at the
 * front of the head, an open happy mouth with a red tongue, and round yellow fins (a fan tail, a back
 * fin, and two side fins).
 * Role: ambient life in ponds and rivers and a fishing catch; the round blue and yellow shape reads at
 *   128 px.
 * Palette (60/30/10): sky blue #6ec0e0; a yellow belly and fins #f4d03a; dark eyes with pale rims; a
 *   red mouth.
 */
export default scaleAsset(
  fishAsset({
    name: 'fish',
    description: 'Chibi fish: a small round sky-blue fish with a yellow belly, big glossy eyes with pale rims, an open happy mouth with a red tongue, and round yellow fins (a fan tail, a back fin, and two side fins); fish rig.',
    reference: 'docs/wildlife-mockups/fish_001.jpg',
    variants: {
      body: { blue: '#6ec0e0', orange: '#f0884a', pink: '#f09ab8', green: '#7ac85a' },
      belly: { yellow: '#f4d84a', white: '#f4f0e4', cream: '#f2e2b0' },
      fins: { yellow: '#f4d03a', orange: '#f0a03a', white: '#eef0f0', blue: '#4a90d0' },
      eyes: { dark: '#1a1416', blue: '#1a3a6a' },
    },
    presets: {
      goldfish: { body: 'orange', belly: 'cream', fins: 'orange', eyes: 'dark' },
      reef: { body: 'pink', belly: 'white', fins: 'blue', eyes: 'blue' },
      pond: { body: 'green', belly: 'yellow', fins: 'yellow', eyes: 'dark' },
    },
    spine: [
      [0.2, 0.15, 0.13],
      [0.21, 0.06, 0.19],
      [0.2, -0.06, 0.17],
      [0.19, -0.16, 0.08],
      [0.19, -0.21, 0.04],
    ],
    width: 0.82,
    blend: 0.06,
    belly: [0.14, 0],
    eye: { at: [0.25, 0.1], angle: 58, r: 0.06, rim: '#f2d84a' },
    tail: 'fan',
    tailSize: 1.1,
    dorsalAt: [-0.03, 1.1],
    pectoralAt: [0.12, 0.0],
    pectoralSize: 1.1,
    paint(body, fish) {
      // An open happy mouth low on the front of the head: a dark half oval with a red tongue.
      const [, ny, nz] = fish.nose;
      const mouth = sdf.ellipsoid([0.045, 0.034, 0.1]).at(0, ny - 0.035, nz).intersect(sdf.halfSpace([0, 1, 0], ny - 0.035));
      const tongue = sdf.ellipsoid([0.03, 0.018, 0.12]).at(0, ny - 0.066, nz);
      return body.paintWhere(mouth, '#5a1a1a', 0.003).paintWhere(tongue.intersect(mouth.round(0.002)), '#e0505a', 0.003);
    },
  }),
  0.6,
);
