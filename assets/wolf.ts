import { sdf } from '../src/index.js';
import { scaleAsset } from './parts/scale-asset.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Wolf — Chibi Quest wildlife (catalog `wildlife/land/wolf`), about 0.72 m to the ear tips, faces
 * +Z. Target: docs/wildlife-mockups/wolf_001.jpg (made with mmx from the dire wolf mockup).
 *
 * The dire wolf (`assets/dire-wolf.ts`; body, head, rig, and clips from `assets/parts/wolf-kind.ts`)
 * at 0.9 of its size, as a wild forest wolf: a wide cream lower face from cheek to cheek with a
 * broad closed smile instead of the toothy grin, no brows, cheek tufts, or forelock, big dark
 * eyes with large shines, a clear cream bib instead of the spiky ruff, a smooth light blue-grey
 * coat (`furBump: 0`) with a darker saddle on the back, longer legs, and a bushy tail that hangs
 * low with a dark tip.
 * Role: ambient forest wildlife and a hunting-game animal; friendlier than the dire wolf monster.
 * Palette (60/30/10): blue-grey coat #86909c with a darker back #6e7680; cream muzzle, cheeks, and
 *   chest #ece2c8; big dark brown eyes.
 */

export default scaleAsset(
  wolfAsset({
    name: 'wolf',
    description: 'Chibi wolf: a grey forest wolf with a big round head, a wide cream lower face with a broad closed smile, pointed ears with brown insides, big dark eyes with large shines, a cream bib, a smooth blue-grey coat with a darker back, long legs, brown paws, and a bushy tail that hangs low with a dark tip; quadruped rig.',
    reference: 'docs/wildlife-mockups/wolf_001.jpg',
    variants: {
      fur: { grey: '#86909c', charcoal: '#7e838a', timber: '#7a6a58', black: '#3a3838', white: '#d8d8d4' },
      markings: { cream: '#ece2c8', tan: '#d4b48a', white: '#f6f4ee' },
      eyes: { brown: '#2a160c', amber: '#7a440c', ice: '#4a6a80' },
    },
    presets: {
      timber: { fur: 'timber', markings: 'tan', eyes: 'amber' },
      black: { fur: 'black', markings: 'cream', eyes: 'brown' },
      arctic: { fur: 'white', markings: 'white', eyes: 'ice' },
    },
    colors: { furLight: '#ddd6c6', furDark: '#6e7680', earInner: '#7a5038', eyeRim: '#f4f0e8' },
    // A big head with a long, tapered snout and a smooth cream lower face; dark eyes without
    // a black rim, so they do not read as a mask.
    headScale: 1.3,
    eyeScale: 1.3,
    pupilScale: 1.35,
    snout: 0.06,
    muzzleWidth: 1.1,
    legLength: 0.07,
    furBump: 0,
    noseScale: 0.7,
    fangs: false,
    smileArc: [238, 302],
    claws: false,
    tail: false,
    brows: false,
    forelock: false,
    smile: true,
    cheekTufts: false,
    ruff: 'smooth',
    paint(fur, t, tone) {
      // A darker saddle on the back, a clear cream bib from the throat down the chest, and brown
      // paws.
      return fur
        .paintWhere(sdf.ellipsoid([0.09, 0.07, 0.2]).at(0, 0.43, -0.07), t.furDark, 0.04)
        .paintWhere(sdf.ellipsoid([0.085, 0.13, 0.09]).at(0, 0.25, 0.17), t.markings, 0.012)
        .paintWhere(sdf.halfSpace([0, 1, 0], 0.06), tone('fur', '#8a5e40', 0.5), 0.015);
    },
    extra(k, w) {
      // A bushy tail that leaves the rump and hangs low behind, the tip lifted a little, with a dark
      // brown tuft of three soft locks at the end.
      const TIP: [number, number, number] = [0, 0.2, -0.6];
      const tuft = sdf.smoothUnion(
        0.01,
        ...[-0.022, 0, 0.022].map((dx, i) => sdf.cone([dx * 0.4, 0.2, -0.57], [dx, 0.215 - i * 0.008, -0.65 - Math.abs(dx)], 0.028, 0.006)),
      );
      const tail = sdf
        .smoothUnion(
          0.02,
          sdf.chain(
            [
              [0, 0.31, -0.28, 0.04],
              [0, 0.28, -0.37, 0.066],
              [0, 0.23, -0.46, 0.072],
              [0, 0.2, -0.54, 0.056],
              [TIP[0], TIP[1], TIP[2], 0.03],
            ],
            0.03,
          ),
          tuft,
        )
        .paintWhere(sdf.sphere(0.075).at(0, 0.205, -0.63), w.tone('fur', '#4a3426', 0.4), 0.025)
        .bone('tail');
      k.body('tail-fur', tail, { color: w.tint.fur, roughness: 0.85 });
      const e = w.eye;
      // Large white shines on the eyes, high on the outer side.
      const shine = sdf.ellipsoid([0.012, 0.014, 0.006]).at(e[0] + 0.016, e[1] + 0.018, e[2] + 0.001);
      k.body('eye-shine', shine.mirror('x').bone('head'), { color: '#ffffff', roughness: 0.1, detail: 0.002 });
    },
  }),
  0.9,
);
