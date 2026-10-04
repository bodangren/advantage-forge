import { noise, sdf } from '../src/index.js';
import { antlerShape, deerAsset } from './parts/deer-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Elk — Chibi Quest wildlife (catalog `wildlife/land/elk`), about 1.15 m to the top of the head
 * (1.5 m to the antler tips), faces +Z. Target: docs/wildlife-mockups/elk_001.jpg (made with mmx
 * from the deer mockup).
 *
 * The deer of `assets/deer.ts` (body, head, rig, and clips from `assets/parts/deer-kind.ts`) at
 * 1.3 of its size, as an elk: wide dark antlers whose beams sweep out and back with four tines a
 * side, a shaggy dark brown ruff under the neck, a light tan coat with a pale rump, and no fawn
 * spots, bib, or eye patches.
 * Role: big forest and mountain wildlife; the wide antlers and the dark ruff read at 128 px.
 * Palette (60/30/10): tan coat #c8955a; dark brown ruff #5a3a24 and antlers #4e3424; a pale rump
 *   #ead8b0; black eyes, nose, and hooves.
 */

const ANTLER = antlerShape(
  [
    [0.05, 0.835, 0.12, 0.034],
    [0.11, 0.92, 0.085, 0.031],
    [0.17, 1.0, 0.04, 0.028],
    [0.22, 1.08, 0.0, 0.025],
    [0.25, 1.16, 0.0, 0.02],
  ],
  [
    [[0.08, 0.875, 0.1], [0.08, 0.91, 0.2], 0.016],
    [[0.13, 0.95, 0.07], [0.14, 1.04, 0.13], 0.016],
    [[0.18, 1.02, 0.03], [0.19, 1.12, 0.08], 0.015],
    [[0.22, 1.08, 0.0], [0.19, 1.17, 0.03], 0.014],
  ],
);

export default scaleAsset(
  deerAsset({
    name: 'elk',
    description: 'Chibi elk: a big round head with glossy eyes, wide dark antlers that sweep back, a shaggy dark brown ruff under the neck, a light tan coat with a pale rump, and dark hooves; quadruped rig.',
    reference: 'docs/wildlife-mockups/elk_001.jpg',
    variants: {
      fur: { tan: '#c8955a', brown: '#9a6a40', grey: '#a8987e' },
      eyes: { dark: '#2a1a12', brown: '#5a3418' },
      ruff: { dark: '#5a3a24', black: '#33241a', red: '#7a4426' },
    },
    presets: {
      brown: { fur: 'brown', eyes: 'brown', ruff: 'black' },
      grey: { fur: 'grey', eyes: 'dark', ruff: 'dark' },
    },
    colors: { earInner: '#ecc8a0', antler: '#4e3424' },
    mask: false,
    spots: false,
    bib: false,
    antlers: false,
    headProbes: ANTLER.tips,
    paint(fur, deer) {
      return fur.paintWhere(sdf.ellipsoid([0.12, 0.12, 0.07]).at(0, 0.41, -0.29), deer.tone('fur', '#ead8b0', 0.3), 0.02);
    },
    extra(k) {
      k.body('antlers', ANTLER.shape.mirror('x'), { color: '#4e3424', roughness: 0.7, bone: 'head', detail: 0.004 });
      // The ruff: a shaggy collar under the head, hanging in points over the chest.
      const points = [-0.07, -0.035, 0, 0.035, 0.07].map((x, i) =>
        sdf.cone([x * 0.9, 0.47, 0.17], [x * 1.1, 0.36 - (i % 2) * 0.025, 0.19], 0.035, 0.008),
      );
      const ruff = sdf
        .smoothUnion(0.02, sdf.ellipsoid([0.105, 0.09, 0.085]).at(0, 0.5, 0.15), ...points)
        .displace(0.006, (x, y, z) => noise.fbm(x * 50, y * 20, z * 50, 2));
      k.body('ruff', ruff, { color: k.tint('ruff'), roughness: 0.9, detail: 0.004, bone: 'neck' });
    },
  }),
  1.3,
);
