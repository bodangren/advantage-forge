import { sdf } from '../src/index.js';
import { scaleAsset } from './parts/scale-asset.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Wolf — Chibi Quest wildlife (catalog `wildlife/land/wolf`), about 0.72 m to the ear tips, faces
 * +Z. Target: docs/wildlife-mockups/wolf_001.jpg (made with mmx from the dire wolf mockup).
 *
 * The dire wolf (`assets/dire-wolf.ts`; body, head, rig, and clips from `assets/parts/wolf-kind.ts`)
 * at 0.9 of its size, as a wild forest wolf: a wide cream lower face from cheek to cheek with a
 * broad closed smile instead of the toothy grin, soft grey brow ridges (not the heavy cream
 * brows), no cheek tufts or forelock, big dark eyes with large shines, a smooth cream
 * chest instead of the spiky ruff, a lighter grey coat with a darker saddle on the back, and a
 * bushy tail that curves up with a dark tip.
 * Role: ambient forest wildlife and a hunting-game animal; friendlier than the dire wolf monster.
 * Palette (60/30/10): grey coat #7e838a with a darker back #5a5e64; cream muzzle, cheeks, and
 *   chest #ece2c8; big dark brown eyes.
 */

export default scaleAsset(
  wolfAsset({
    name: 'wolf',
    description: 'Chibi wolf: a grey forest wolf with a big round head, a wide cream lower face with a broad closed smile, soft grey brows, pointed ears with brown insides, big dark eyes with large shines, a cream chest, a darker back, brown paws, and a bushy tail that curves up with a dark tip; quadruped rig.',
    reference: 'docs/wildlife-mockups/wolf_001.jpg',
    variants: {
      fur: { grey: '#7e838a', timber: '#7a6a58', black: '#3a3838', white: '#d8d8d4' },
      markings: { cream: '#ece2c8', tan: '#d4b48a', white: '#f6f4ee' },
      eyes: { brown: '#2a160c', amber: '#7a440c', ice: '#4a6a80' },
    },
    presets: {
      timber: { fur: 'timber', markings: 'tan', eyes: 'amber' },
      black: { fur: 'black', markings: 'cream', eyes: 'brown' },
      arctic: { fur: 'white', markings: 'white', eyes: 'ice' },
    },
    colors: { furLight: '#ddd6c6', furDark: '#5a5e64', earInner: '#7a5038', eyeRim: '#4a4e54' },
    // A big head with a long, tapered snout and a smooth cream lower face; dark eyes without
    // a black rim, so they do not read as a mask.
    headScale: 1.3,
    eyeScale: 1.15,
    pupilScale: 1.35,
    snout: 0.06,
    muzzleWidth: 0.9,
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
      // A darker saddle on the back, and brown paws.
      return fur
        .paintWhere(sdf.ellipsoid([0.09, 0.07, 0.2]).at(0, 0.43, -0.07), t.furDark, 0.04)
        .paintWhere(sdf.halfSpace([0, 1, 0], 0.06), tone('fur', '#8a5e40', 0.5), 0.015);
    },
    extra(k, w) {
      // A bushy tail that leaves the rump, sweeps back, and curves up, with a dark brown tuft of
      // three soft locks at the tip.
      const TIP: [number, number, number] = [0, 0.5, -0.56];
      const tuft = sdf.smoothUnion(
        0.01,
        ...[-0.022, 0, 0.022].map((dx, i) => sdf.cone([dx * 0.4, 0.47, -0.54], [dx, 0.57 - i * 0.008, -0.6 - Math.abs(dx)], 0.028, 0.006)),
      );
      const tail = sdf
        .smoothUnion(
          0.02,
          sdf.chain(
            [
              [0, 0.31, -0.28, 0.04],
              [0, 0.32, -0.38, 0.072],
              [0, 0.37, -0.47, 0.078],
              [0, 0.44, -0.53, 0.06],
              [TIP[0], TIP[1], TIP[2], 0.03],
            ],
            0.03,
          ),
          tuft,
        )
        .paintWhere(sdf.sphere(0.08).at(0, 0.54, -0.58), w.tone('fur', '#4a3426', 0.4), 0.025)
        .bone('tail');
      k.body('tail-fur', tail, { color: w.tint.fur, roughness: 0.85 });
      // Soft grey brow ridges over the eyes: a gentle arch, highest over the middle of the eye.
      const e = w.eye;
      const brow = sdf.chain(
        [
          [...w.on(w.head, e[0] - 0.035, e[1] + 0.054, e[2]), 0.01],
          [...w.on(w.head, e[0] + 0.004, e[1] + 0.07, e[2]), 0.014],
          [...w.on(w.head, e[0] + 0.042, e[1] + 0.058, e[2] - 0.02), 0.009],
        ],
        0.008,
      );
      k.body('brows', brow.mirror('x').bone('head'), { color: w.tone('fur', '#9aa0a8', 0.6), roughness: 0.8, detail: 0.003 });
      // Large white shines on the eyes, high on the outer side.
      const shine = sdf.ellipsoid([0.012, 0.014, 0.006]).at(e[0] + 0.016, e[1] + 0.018, e[2] + 0.001);
      k.body('eye-shine', shine.mirror('x').bone('head'), { color: '#ffffff', roughness: 0.1, detail: 0.002 });
    },
  }),
  0.9,
);
