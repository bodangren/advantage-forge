import { sdf } from '../src/index.js';
import { fishAsset, sideArc, speckles } from './parts/fish-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Trout — Chibi Quest wildlife (catalog `wildlife/water/trout`), a plump river fish about 0.2 m tall
 * and 0.45 m long, faces +Z. Target: docs/wildlife-mockups/trout_001.jpg (made with mmx).
 *
 * The fish of `assets/parts/fish-kind.ts` (body, eyes, fins, rig, and clips) at 0.65 of its size, as a
 * rainbow trout: an olive back with round black spots, a rosy band and pink cheeks along each side, a
 * pale cream belly, big glossy eyes with pale rims high on the head, a small round open mouth, and
 * olive fins (a round back fin, a fan tail, side fins, and belly fins).
 * Role: a river fish and a fishing catch; the spotted olive body with the rosy band reads at 128 px.
 * Palette (60/30/10): olive #9aa860 with black spots; a cream belly #f2ecd0; a rosy band #e89a9a;
 *   olive fins #a8b070.
 */
export default scaleAsset(
  fishAsset({
    name: 'trout',
    description: 'Chibi trout: a plump rainbow trout with an olive back and large round black spots, a rosy band with red spots and pink cheeks on each side, a pale cream belly, big glossy eyes that bulge from the top of the head, an open pout with a cream lower lip, and olive fins; fish rig.',
    reference: 'docs/wildlife-mockups/trout_001.jpg',
    variants: {
      body: { olive: '#8e9a58', brown: '#a08a5a', green: '#6a9a5a' },
      belly: { cream: '#f2ecd0', white: '#f0f0ea', gold: '#f0d890' },
      fins: { olive: '#a8b070', brown: '#a8906a', green: '#7aa86a' },
      eyes: { dark: '#1a1416', brown: '#4a2a18' },
    },
    presets: {
      brown: { body: 'brown', belly: 'gold', fins: 'brown', eyes: 'brown' },
      brook: { body: 'green', belly: 'white', fins: 'green', eyes: 'dark' },
    },
    spine: [
      [0.195, 0.25, 0.135],
      [0.19, 0.14, 0.168],
      [0.182, 0.02, 0.158],
      [0.172, -0.1, 0.118],
      [0.17, -0.21, 0.062],
      [0.178, -0.31, 0.026],
    ],
    width: 0.7,
    belly: [0.11, 0],
    eye: { at: [0.3, 0.235], angle: 30, r: 0.047, rim: '#e8e2c8' },
    swimAmp: 1.7,
    tail: 'fan',
    tailSize: 1.4,
    dorsalAt: [0.0, 1.05],
    pectoralAt: [0.1, 0.1],
    pectoralSize: 1.2,
    pelvic: true,
    paint(body, fish) {
      const dots = speckles(0.042, 0.019, 0.62, 0.17, 5);
      // Pink spots in dark rings: the same cells at two radii.
      const red = speckles(0.062, 0.02, 0.5, 0.11, 11);
      const ring = speckles(0.062, 0.029, 0.5, 0.11, 11);
      const band = fish.tone('belly', '#e89a9a', 0.4);
      // The rosy band along the side, a pink cheek, a gill curve, and a small round open mouth.
      const bandShape = sdf.box([1, 0.04, 0.4], 0.02).at(0, 0.15, -0.04);
      const cheek = sdf.sphere(0.068).scale([1, 0.85, 1]).at(0.1, 0.16, 0.175).mirror('x');
      const [, ny, nz] = fish.nose;
      const mouth = sdf.ellipsoid([0.04, 0.016, 0.06]).at(0, ny - 0.028, nz);
      return body
        .paintWhere(bandShape, band, 0.045)
        .paintWhere(cheek, fish.tone('belly', '#f0a0a8', 0.4), 0.025)
        // Large black spots on the back, pink spots in dark rings along the rosy band.
        .paintFn((x, y, z, base) => {
          if (dots(x, y, z) && z < 0.14 && y > 0.19) return [0.07, 0.07, 0.07];
          if (y < 0.19 && z < 0.1 && ring(x, y, z)) return red(x, y, z) ? [0.9, 0.4, 0.46] : [0.2, 0.16, 0.14];
          return base;
        })
        // The gill line: a curve behind the cheek.
        .paintWhere(sideArc(0.215, 0.175, 0.09, 0.007, 140, 220), fish.tone('belly', '#8a4a4a', 0.4), 0.002)
        .paintWhere(mouth, '#5a1a1a', 0.003);
    },
    extra(k, fish) {
      // Full lips round the open pout: a cream lower lip pushed out under the mouth, and an upper lip
      // in the body color over it.
      const [, ny, nz] = fish.nose;
      const lip = sdf.ellipsoid([0.042, 0.017, 0.026]).at(0, ny - 0.054, nz - 0.016);
      k.body('lip', lip.bone('head'), { color: fish.tone('belly', '#f4eedc', 0.5), roughness: 0.6, detail: 0.003 });
      const upper = sdf.ellipsoid([0.04, 0.015, 0.022]).at(0, ny - 0.01, nz - 0.016);
      k.body('upper-lip', upper.bone('head'), { color: fish.tint.body, roughness: 0.6, detail: 0.003 });
    },
  }),
  0.65,
);
