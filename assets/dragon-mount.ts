import { profile, sdf } from '../src/index.js';
import { backSaddle } from './parts/horse-tack.js';
import { lizardAsset } from './parts/lizard-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Dragon mount — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/dragon-mount`), a young
 * friendly dragon to ride, about 1.1 m tall to the horn tips, faces +Z. Target:
 * docs/wildlife-mockups/dragon-mount_001.jpg (made with mmx).
 *
 * The lizard of `assets/parts/lizard-kind.ts` (trunk, legs, head on a jaw bone, tail on three bones,
 * rig, and clips) at 1.35 of its size, as a dragon mount: the chest held high on sturdy legs, a big
 * round head with a short wide snout, big glossy eyes, and a happy smile, two big curved yellow
 * horns with two small ones between them and yellow ear fins, a cream chest and belly with tan
 * plate lines, yellow spikes down the back and the tail, small folded wings with yellow membranes,
 * and a small riding saddle on a red blanket (`backSaddle` in `assets/parts/horse-tack.ts`).
 * Role: a hero's mount for the rider and sky games; the horns, the wings, and the saddle read at
 *   128 px.
 * Palette (60/30/10): green-teal scales #6aaa86; a cream belly #f2e2b0 with tan lines; yellow
 *   horns, fins, spikes, and wing membranes #f0c050; brown leather and a red blanket as the accent.
 */
export default scaleAsset(
  lizardAsset({
    name: 'dragon-mount',
    description: 'Chibi dragon mount: a young friendly green-teal dragon on four sturdy legs with its chest held high, a big round head with a short wide snout, big glossy eyes, and a happy smile, two big curved yellow horns and two small ones, yellow ear fins, a cream chest with plate lines, yellow spikes down the back and the tail, small folded wings with yellow membranes, and a brown riding saddle on a red blanket; lizard rig.',
    reference: 'docs/wildlife-mockups/dragon-mount_001.jpg',
    variants: {
      skin: { green: '#6aaa86', blue: '#5a88c0', red: '#c8604a', purple: '#8a6ab0' },
      belly: { cream: '#f2e2b0', pale: '#f0ece0', gold: '#f0d080' },
      eyes: { brown: '#5a2e14', dark: '#1e1a18', gold: '#a8781a' },
      blanket: { red: '#b8443a', blue: '#3a6ab0', green: '#4a8a4a', purple: '#7a4aa0' },
    },
    presets: {
      sky: { skin: 'blue', belly: 'pale', eyes: 'dark', blanket: 'red' },
      ember: { skin: 'red', belly: 'gold', eyes: 'gold', blanket: 'blue' },
      dusk: { skin: 'purple', belly: 'cream', eyes: 'brown', blanket: 'green' },
    },
    drop: -0.05,
    chestLift: 0.12,
    headOffset: [0, 0.27, 0.05],
    headScale: 1.5,
    snout: 0.1,
    snoutWidth: 0.085,
    bulb: false,
    eyes: 'side',
    eyeScale: 0.95,
    eyeAngle: 38,
    eyeSink: 0.5,
    pupils: true,
    jaw: false,
    teeth: 0,
    ridgeShade: '#f0c050',
    ridgeSize: 1.2,
    legSpread: 0.5,
    legScale: 1.45,
    bellyChest: 1.7,
    tail: 0.95,
    paint(skin, liz) {
      // Tan plate lines across the cream chest, and a wide smile across the front of the snout.
      const lines = sdf.union(...[0.24, 0.3, 0.36, 0.42, 0.48].map((y) => sdf.box([0.16, 0.008, 0.6], 0.003).at(0, y, 0.25)));
      const { HEAD_C } = liz.joints;
      const tip = sdf.raycast(liz.skull, [0, HEAD_C[1] - 0.07, 3], [0, 0, -1])!;
      const smile = sdf.extrude(profile.arc(0.11, 0.009, 236, 304), 0.16).at(0, tip[1] + 0.085, tip[2] - 0.03);
      return skin.paintWhere(lines, liz.tone('belly', '#d2b474', 0.6), 0.003).paintWhere(smile, '#3a2a22', 0.002);
    },
    extra(k, liz) {
      const { HEAD_C } = liz.joints;
      const yellow = liz.tone('belly', '#f0c050', 0.3);
      const top = (x: number, z: number) => sdf.raycast(liz.skull, [x, 3, z], [0, -1, 0])!;
      // Two big horns that rise from the top of the head, curve out, and sweep back, and two
      // small horns between them.
      const r0 = top(0.075, HEAD_C[2] - 0.02);
      const horn = sdf.chain(
        [
          [r0[0], r0[1] - 0.015, r0[2], 0.042],
          [r0[0] + 0.06, r0[1] + 0.05, r0[2] - 0.01, 0.033],
          [r0[0] + 0.1, r0[1] + 0.105, r0[2] - 0.035, 0.022],
          [r0[0] + 0.095, r0[1] + 0.155, r0[2] - 0.075, 0.009],
        ],
        0.012,
      );
      const r1 = top(0.03, HEAD_C[2] - 0.05);
      const small = sdf.cone([r1[0], r1[1] - 0.01, r1[2]], [r1[0] + 0.008, r1[1] + 0.05, r1[2] - 0.025], 0.018, 0.006);
      // Ear fins: a small yellow fan on each side of the head behind the eyes.
      const side = sdf.raycast(liz.skull, [3, HEAD_C[1] + 0.02, HEAD_C[2] - 0.05], [-1, 0, 0])!;
      const fin = sdf
        .extrude(profile.polygon([[0, -0.025], [0.06, -0.015], [0.085, 0.01], [0.055, 0.02], [0.07, 0.04], [0.02, 0.03]], { smooth: true }), 0.012, 0.004)
        .rotateY(-70)
        .at(side[0] - 0.01, side[1], side[2]);
      k.body('horns', sdf.union(horn, small, fin).mirror('x').bone('head'), { color: yellow, roughness: 0.5, detail: 0.003 });
      // Small folded wings on the shoulders: a dark arm along the top edge and a yellow scalloped
      // membrane under it, folded back along the side and leaning out a little (built in XY with
      // the wing along +X, then turned so +X points back).
      const back = sdf.raycast(liz.trunk, [0.09, 3, 0.04], [0, -1, 0])!;
      const wingPose = (s: sdf.Shape) => s.rotateY(90).rotateZ(-18).at(back[0] + 0.02, back[1] - 0.02, back[2]);
      const membrane = sdf.extrude(
        profile.polygon([[0, 0], [0.05, 0.14], [0.14, 0.2], [0.13, 0.13], [0.2, 0.1], [0.14, 0.05], [0.17, 0.0], [0.08, -0.02]], { smooth: true }),
        0.01,
        0.004,
      );
      const arm = sdf.chain([[0, 0, 0, 0.016], [0.05, 0.14, 0, 0.013], [0.14, 0.2, 0, 0.009]], 0.006);
      k.body('wing-membranes', wingPose(membrane).mirror('x').bone('spine'), { color: yellow, roughness: 0.55, detail: 0.003 });
      k.body('wing-arms', wingPose(arm).mirror('x').bone('spine'), { color: liz.tone('skin', '#4a8a66', 0.8), roughness: 0.6, detail: 0.003 });
      backSaddle(k, liz, { blanket: k.tint('blanket'), trim: '#e0b040', leather: '#6a3c22', metal: '#c8a040', z: -0.08 });
    },
  }),
  1.35,
);
