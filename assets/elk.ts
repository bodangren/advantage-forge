import { noise, profile, sdf } from '../src/index.js';
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

// Short wide thick antlers: each beam sweeps out to the side more than up, with a brow tine forward
// and two tines that rise from the beam.
const ANTLER = antlerShape(
  [
    [0.05, 0.83, 0.12, 0.046],
    [0.13, 0.895, 0.1, 0.043],
    [0.21, 0.955, 0.08, 0.039],
    [0.28, 1.015, 0.07, 0.034],
    [0.33, 1.07, 0.07, 0.028],
  ],
  [
    [[0.08, 0.855, 0.118], [0.07, 0.89, 0.2], 0.026],
    [[0.17, 0.925, 0.09], [0.165, 1.03, 0.11], 0.025],
    [[0.26, 0.995, 0.074], [0.275, 1.09, 0.085], 0.023],
  ],
);

export default scaleAsset(
  deerAsset({
    name: 'elk',
    description: 'Chibi elk: a big round head with white eyes and brown irises, a long heavy muzzle with a big black nose and a wide smile, short wide thick dark antlers, a shaggy dark brown ruff under the neck, a light tan coat with a pale rump, and dark hooves; quadruped rig.',
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
    slim: 1.2,
    smile: false,
    eyeStyle: 'white',
    eyeScale: 1.3,
    legThick: 1.25,
    headProbes: ANTLER.tips,
    paint(fur, deer) {
      // A pale rump.
      return fur.paintWhere(sdf.ellipsoid([0.12, 0.12, 0.07]).at(0, 0.41, -0.29), deer.tone('fur', '#ead8b0', 0.3), 0.02);
    },
    extra(k, deer) {
      // A long heavy muzzle that points forward from the face, a little lighter than the coat, with a
      // wide smile under the nose.
      const snout = sdf.smoothUnion(0.03, sdf.ellipsoid([0.088, 0.072, 0.1]).at(0, 0.612, 0.315), sdf.ellipsoid([0.078, 0.064, 0.07]).at(0, 0.6, 0.385));
      const tipAt = sdf.raycast(snout, [0, 0.6, 2], [0, 0, -1])!;
      const grin = sdf.extrude(profile.arc(0.085, 0.01, 222, 318), 0.3).at(0, tipAt[1] + 0.05, tipAt[2]);
      k.body('snout', snout.paintWhere(grin, '#4a2a1e', 0.002).bone('head'), { color: deer.tone('fur', '#d4a46c', 0.8), roughness: 0.75, detail: 0.004, textureDensity: 1.5 });
      // A large black ball nose on the tip of the muzzle, with a glint.
      const n = sdf.raycast(snout, [0, 0.635, 2], [0, 0, -1])!;
      const nose = sdf.sphere(0.04).at(n[0], n[1] + 0.004, n[2] + 0.004).paintWhere(sdf.sphere(0.01).at(n[0] - 0.013, n[1] + 0.024, n[2] + 0.03), '#8a8282', 0.004);
      k.body('ball-nose', nose.bone('head'), { color: '#1a1416', roughness: 0.2, detail: 0.003 });
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
