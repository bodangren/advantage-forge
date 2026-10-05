import { profile, sdf } from '../src/index.js';
import { lizardAsset } from './parts/lizard-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Badger — Chibi Quest wildlife (catalog `wildlife/forest/badger`), about 0.3 m tall at the ears and
 * 0.55 m from nose to tail, faces +Z. Target: docs/wildlife-mockups/badger_001.jpg (made with mmx).
 *
 * The long low body of the lizard kind (`assets/parts/lizard-kind.ts`: a trunk on four short thick
 * legs, a head with a snout of any length, rig, and clips) at 0.6 of its size, as a badger: a long
 * grey body low to the ground, a white throat and chest, black legs, a short tail, and a wedge of a
 * head with a long pointed snout and a round black nose. The face is white with a wide black
 * stripe from the side of the nose through each eye to the ear, and a white stripe up the middle
 * of the crown; the open brown eyes with a glint sit inside the black stripes; a small smile under
 * the nose; the small round ears are dark with white rims.
 * Role: a forest and burrow animal; the striped white face reads at 128 px.
 * Palette (60/30/10): grey fur #78766f; a white face, throat, and chest #f2f0ea; black stripes,
 *   ears, and legs #2a2826; a black nose; brown eyes with a white glint.
 */
export default scaleAsset(
  lizardAsset({
    name: 'badger',
    description: 'Chibi badger: a long low grey badger with a white throat and chest, black legs, a short tail, and a wedge-shaped head with a white face, a wide black stripe over each small brown eye, a round black nose, and small round dark ears with white rims; four-legged rig.',
    reference: 'docs/wildlife-mockups/badger_001.jpg',
    variants: {
      skin: { grey: '#78766f', silver: '#a4a29c', brown: '#6e5e4e' },
      belly: { white: '#f2f0ea', cream: '#ece0c8' },
      eyes: { brown: '#6a3a1a', dark: '#2a1a12', amber: '#8a5a1a' },
    },
    presets: {
      silver: { skin: 'silver', belly: 'white', eyes: 'dark' },
      honey: { skin: 'brown', belly: 'cream', eyes: 'amber' },
    },
    colors: { claw: '#3a3634', nostril: '#1a1416' },
    snout: 0.21,
    snoutWidth: 0.044,
    bulb: false,
    headOffset: [0, 0.03, 0.04],
    headScale: 1.6,
    eyes: 'side',
    eyeScale: 0.8,
    eyeAngle: 30,
    eyeSink: 0.62,
    pupils: true,
    jaw: false,
    teeth: 0,
    ridges: false,
    tail: 0,
    legScale: 1.1,
    legSpread: 0.3,
    drop: -0.02,
    paint(skin, liz) {
      const { HEAD_C } = liz.joints;
      const black = liz.tone('skin', '#2a2826', 0.3);
      const white = liz.tint.belly;
      // The white face: the front of the head, in front of the ears.
      const face = sdf.box([0.5, 0.4, 0.4]).at(0, HEAD_C[1], HEAD_C[2] + 0.18);
      // The black stripes: a wide band on each side from beside the nose, through the eye, to the
      // ear (a tube along the head surface; it paints where it crosses the surface). The white
      // stripe up the middle stays between them.
      const tip = sdf.raycast(liz.skull, [0, HEAD_C[1] - 0.015, 2], [0, 0, -1])!;
      const E = liz.eye!.center;
      const on = (x: number, y: number, z: number) => sdf.surfacePoint(liz.skull, [x, y, z]);
      const N = on(tip[0] + 0.028, tip[1] + 0.012, tip[2] - 0.035);
      const R = on(0.62, 0.7, -0.25);
      const M = on((N[0] + E[0]) / 2, (N[1] + E[1]) / 2 + 0.01, (N[2] + E[2]) / 2);
      const B = on((E[0] + R[0]) / 2, (E[1] + R[1]) / 2 + 0.01, (E[2] + R[2]) / 2);
      const band = sdf
        .chain(
          [
            [N[0], N[1], N[2], 0.02],
            [M[0], M[1], M[2], 0.034],
            [E[0], E[1] + 0.006, E[2], 0.048],
            [B[0], B[1], B[2], 0.05],
            [R[0], R[1], R[2], 0.042],
          ],
          0.02,
        )
        .mirror('x');
      // A small smile under the nose.
      const smile = sdf.extrude(profile.arc(0.026, 0.005, 225, 315), 0.12).at(0, tip[1] - 0.012, tip[2] - 0.02);
      // Black legs below the body (wide enough to cover the inner sides of the legs).
      const legs = sdf.box([0.22, 0.2, 0.72]).at(0.14, 0.06, -0.02).mirror('x');
      return skin.paintWhere(face, white, 0.03).paintWhere(band, black, 0.006).paintWhere(smile, black, 0.002).paintWhere(legs, black, 0.012);
    },
    extra(k, liz) {
      const { HEAD_C } = liz.joints;
      // The round black nose on the tip of the wedge, with a glint.
      const tip = sdf.raycast(liz.skull, [0, HEAD_C[1] - 0.015, 2], [0, 0, -1])!;
      const nose = sdf
        .ellipsoid([0.036, 0.028, 0.026])
        .at(tip[0], tip[1] + 0.006, tip[2] + 0.004)
        .paintWhere(sdf.sphere(0.008).at(tip[0] - 0.012, tip[1] + 0.024, tip[2] + 0.024), '#8a8282', 0.004);
      k.body('nose', nose.bone('head'), { color: '#1a1416', roughness: 0.2, detail: 0.003 });
      // Small round dark ears on the top sides of the head, with white rims.
      const root = sdf.surfacePoint(liz.skull, [0.62, 0.7, -0.25], -0.008);
      const pose = (s: sdf.Shape) => s.rotateY(22).rotateZ(-26).at(root[0], root[1] + 0.03, root[2]);
      k.body('ears', pose(sdf.ellipsoid([0.04, 0.042, 0.016])).mirror('x').bone('head'), { color: liz.tone('skin', '#2a2826', 0.3), roughness: 0.7, detail: 0.003 });
      const rim = pose(sdf.torus(0.04, 0.009).rotateX(90).scale([1, 1.05, 0.8]).at(0, 0, 0.004));
      k.body('ear-rims', rim.mirror('x').bone('head'), { color: liz.tint.belly, roughness: 0.7, detail: 0.003 });
      // A short grey tail that points back and a little down from the rump.
      const tail = sdf.chain([[0, 0.22, -0.2, 0.045], [0, 0.2, -0.3, 0.035], [0, 0.17, -0.37, 0.012]], 0.02);
      k.body('tail', tail.bone('tail1'), { color: liz.tint.skin, roughness: 0.6, detail: 0.004 });
    },
  }),
  0.6,
);
