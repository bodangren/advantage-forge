import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Imp — Chibi Quest dungeon monster (catalog `monsters/small/imp`), a small flyer about 0.8 m to
 * the horn tips and 1.0 m across the wings, faces +Z. Target: docs/monster-mockups/imp_001.png
 * (cropped from docs/character-mockups/chibi-quest-enemies.png).
 *
 * Role: a fast, pesky dungeon enemy, seen in 3D and as a 128 px sprite; the horns, the grin, and
 *   the wings must read.
 * One idea: a big-headed little red devil with curved horns, a wicked fanged grin, and bat wings
 *   spread wide, reaching with its claws while its legs and arrow-tipped tail dangle.
 * Proportions: head center 0.52 (radius 0.15), eyes 0.51, horn tips 0.8, chest 0.33, the toes
 *   touch the ground in the rest pose; the idle and fly clips lift it into a hover.
 * Shape language: round (head, belly, eyes) with many sharp points (horns, ears, fangs, claws,
 *   wing fingers, tail tip): cute but dangerous.
 * Palette (60/30/10): red skin #d8503c (darker on the back); dark brown horns, claws, and wing
 *   bones #4a2e24; orange-red wing membranes #e0704a; amber eyes #e8a030 as the accent.
 * Value plan: the light amber eyes with dark pupils under dark brows, and the white fangs, are the
 *   strongest contrast (focal point); the dark horns frame the head.
 * Bodies: skin, eyes, horns, claws, teeth, wing-membranes, wing-bones.
 * Rig: hips, spine, chest, neck, head, wings, arms, legs with shins and feet, and a three-bone
 *   tail. Clips: idle (hover), fly (forward flight), attack (a diving claw swipe), hit (a jolt
 *   back in the hover), death (a tumble to the floor, on its back).
 */

const C = {
  skin: '#d8503c',
  skinDark: '#a83426',
  belly: '#e8785c',
  eyeWhite: '#fbf1e2',
  iris: '#e8a030',
  irisDark: '#a85a18',
  pupil: '#1a0e0a',
  brow: '#6a1e16',
  mouth: '#5a1410',
  tongue: '#e0605a',
  tooth: '#fbf6ee',
  horn: '#4a2e24',
  hornTip: '#6e4636',
  claw: '#2a1e1e',
  membrane: '#e0704a',
  membraneDark: '#b8482e',
  wingBone: '#5a2e22',
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const HEAD_C: V3 = [0, 0.52, 0.02];
const HEAD = [0.152, 0.142, 0.138] as const;
// Joints. The arms reach forward with the claws open; the legs dangle with the knees forward.
const SHOULDER: V3 = [0.072, 0.36, 0.0];
const ELBOW: V3 = [0.13, 0.31, 0.06];
const WRIST: V3 = [0.15, 0.3, 0.13];
const HIP: V3 = [0.05, 0.24, 0.0];
const KNEE: V3 = [0.075, 0.15, 0.05];
const ANKLE: V3 = [0.07, 0.07, -0.02];
const WING_ROOT: V3 = [0.055, 0.38, -0.07];
const TAIL: V3[] = [
  [0, 0.23, -0.07],
  [-0.06, 0.13, -0.19],
  [-0.15, 0.15, -0.28],
  [-0.2, 0.26, -0.3],
];

/** A clawed hand at the wrist `w`, fingers spread forward and curled down; `s` mirrors it. */
const clawHand = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  const finger = (dx: number) =>
    sdf.chain(
      [
        [...o(dx * 0.6, -0.004, 0.024), 0.011],
        [...o(dx, 0.0, 0.05), 0.0095],
        [...o(dx * 1.1, -0.014, 0.066), 0.0085],
      ],
      0.004,
    );
  return {
    hand: sdf.smoothUnion(0.01, sdf.ellipsoid([0.03, 0.022, 0.032]).at(...o(0, -0.004, 0.012)), finger(-0.022), finger(0), finger(0.022), sdf.cone(o(0.024, 0.0, 0.006), o(0.04, 0.004, 0.034), 0.011, 0.008)),
    claws: sdf.union(
      ...[-0.022, 0, 0.022].map((dx) => sdf.cone(o(dx * 1.1, -0.014, 0.066), o(dx * 1.15, -0.034, 0.078), 0.008, 0.002)),
      sdf.cone(o(0.04, 0.004, 0.034), o(0.05, -0.01, 0.05), 0.007, 0.002),
    ),
  };
};

/** A clawed foot at the ankle `a`, toes pointing down and back; `s` mirrors it. */
const clawFoot = (a: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [a[0] + dx * s, a[1] + dy, a[2] + dz];
  return {
    foot: sdf.smoothUnion(
      0.01,
      sdf.ellipsoid([0.032, 0.03, 0.04]).at(...o(0, -0.02, 0.012)),
      ...[-0.018, 0, 0.018].map((dx) => sdf.capsule(o(dx, -0.03, 0.03), o(dx * 1.2, -0.05, 0.044), 0.011)),
    ),
    claws: sdf.union(...[-0.018, 0, 0.018].map((dx) => sdf.cone(o(dx * 1.2, -0.05, 0.044), o(dx * 1.25, -0.07, 0.046), 0.009, 0.002))),
  };
};

export default defineAsset({
  name: 'imp',
  description: 'Chibi imp dungeon monster: a big-headed little red devil with curved horns, a fanged grin, amber eyes, bat wings, claws, and an arrow-tipped tail.',
  detail: 0.004,
  reference: 'docs/monster-mockups/imp_001.png',

  build(k) {
    k.skeleton({
      hips: { at: [0, 0.25, -0.01] },
      spine: { parent: 'hips', at: [0, 0.3, 0] },
      chest: { parent: 'spine', at: [0, 0.35, 0] },
      neck: { parent: 'chest', at: [0, 0.39, 0] },
      head: { parent: 'neck', at: [0, 0.42, 0.01] },
      'wing.L': { parent: 'chest', at: WING_ROOT, tail: [0.45, 0.56, -0.16] },
      'wing.R': { parent: 'chest', at: mx(WING_ROOT), tail: [-0.45, 0.56, -0.16] },
      tail1: { parent: 'hips', at: TAIL[0]! },
      tail2: { parent: 'tail1', at: TAIL[1]! },
      tail3: { parent: 'tail2', at: TAIL[2]!, tail: TAIL[3]! },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
      'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE) },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head
    const head = sdf.smoothUnion(
      0.04,
      sdf.ellipsoid(HEAD).at(...HEAD_C),
      pair(sdf.sphere(0.07).at(0.07, 0.46, 0.08)), // cheeks
      sdf.ellipsoid([0.09, 0.05, 0.07]).at(0, 0.43, 0.07), // jaw
      sdf.ellipsoid([0.11, 0.028, 0.05]).at(0, 0.565, 0.1), // a heavy brow ridge
    );
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.02, 0.016, 0.016]).at(0, 0.49, faceZ(0, 0.49) - 0.003);
    // Pointed ears swept out and back.
    const ears = pair(
      sdf
        .cone([0.12, 0.52, 0.0], [0.24, 0.56, -0.05], 0.038, 0.004)
        .smoothSubtract(0.004, sdf.cone([0.13, 0.52, 0.018], [0.22, 0.55, -0.03], 0.022, 0.002)),
    );
    // A little crest of spiky hair on the forehead.
    const crestAt = sdf.raycast(head, [0, 2, 0.06], [0, -1, 0])!;
    const crest = sdf.union(
      ...[
        [0, 0.05, 0.03],
        [-0.03, 0.035, 0.0],
        [0.03, 0.035, 0.0],
      ].map(([dx, h, dz]) => sdf.cone([crestAt[0] + dx!, crestAt[1] - 0.02, crestAt[2] + dz!], [crestAt[0] + dx! * 1.3, crestAt[1] + h!, crestAt[2] + dz! + 0.03], 0.024, 0.004)),
    );

    // ------------------------------------------------------------------ body, arms, legs, tail
    const torso = sdf.smoothUnion(
      0.04,
      sdf.ellipsoid([0.095, 0.075, 0.072]).at(0, 0.34, 0.0).bone('chest'),
      sdf.ellipsoid([0.085, 0.07, 0.075]).at(0, 0.27, 0.015).bone('spine'),
      sdf.capsule([0, 0.36, 0], [0, 0.44, 0.01], 0.04).bone('neck'),
    );
    const armAt = (s: 1 | -1) => {
      const side = s > 0 ? 'L' : 'R';
      const sh = s > 0 ? SHOULDER : mx(SHOULDER);
      const el = s > 0 ? ELBOW : mx(ELBOW);
      const wr = s > 0 ? WRIST : mx(WRIST);
      const { hand } = clawHand(wr, s);
      return sdf.smoothUnion(
        0.015,
        sdf.cone(sh, el, 0.036, 0.031).bone(`upperarm.${side}`),
        sdf.cone(el, wr, 0.031, 0.027).bone(`forearm.${side}`),
        hand.bone(`hand.${side}`),
      );
    };
    const legAt = (s: 1 | -1) => {
      const side = s > 0 ? 'L' : 'R';
      const h = s > 0 ? HIP : mx(HIP);
      const kn = s > 0 ? KNEE : mx(KNEE);
      const an = s > 0 ? ANKLE : mx(ANKLE);
      const { foot } = clawFoot(an, s);
      return sdf.smoothUnion(
        0.015,
        sdf.cone(h, kn, 0.048, 0.036).bone(`leg.${side}`),
        sdf.cone(kn, an, 0.036, 0.027).bone(`shin.${side}`),
        foot.bone(`foot.${side}`),
      );
    };
    const tailShape = sdf.smoothUnion(
      0.012,
      sdf.chain([[...TAIL[0]!, 0.022], [...TAIL[1]!, 0.016]], 0.01).bone('tail1'),
      sdf.chain([[...TAIL[1]!, 0.016], [...TAIL[2]!, 0.012]], 0.01).bone('tail2'),
      sdf.chain([[...TAIL[2]!, 0.012], [...TAIL[3]!, 0.01]], 0.01).bone('tail3'),
    );
    // The arrow tip: a flat heart-shaped spade at the end of the tail.
    const tip = TAIL[3]!;
    const spade = sdf
      .extrude(
        profile.polygon(
          [
            [0, 0.07],
            [0.036, 0.018],
            [0.02, 0.0],
            [0.006, 0.01],
            [0, -0.006],
            [-0.006, 0.01],
            [-0.02, 0.0],
            [-0.036, 0.018],
          ],
          { smooth: true, samples: 3 },
        ),
        0.016,
        0.006,
      )
      .rotateZ(30)
      .rotateY(40)
      .at(tip[0] - 0.01, tip[1] - 0.005, tip[2])
      .bone('tail3');

    // ------------------------------------------------------------------ face paint
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const EYE: V3 = [0.064, 0.512, 0];
    const eyeWhite = pair(at(sdf.ellipsoid([0.049, 0.047, 0.06]), EYE[0], EYE[1]));
    const iris = pair(at(sdf.ellipsoid([0.038, 0.04, 0.06]), EYE[0] - 0.004, EYE[1] - 0.004));
    const irisDark = iris.intersect(sdf.halfSpace([0, -1, 0], -(EYE[1] + 0.01)));
    const pupil = pair(at(sdf.ellipsoid([0.019, 0.026, 0.06]), EYE[0] - 0.007, EYE[1] - 0.005));
    const shine = pair(at(sdf.sphere(0.009), EYE[0] + 0.006, EYE[1] + 0.014));
    // An angry lid: the top of each eye is cut on a slant, lower toward the nose.
    const lid = pair(
      sdf
        .extrude(
          profile.polygon([
            [EYE[0] - 0.05, EYE[1] + 0.012],
            [EYE[0] + 0.05, EYE[1] + 0.04],
            [EYE[0] + 0.05, EYE[1] + 0.08],
            [EYE[0] - 0.05, EYE[1] + 0.08],
          ]),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    const brows = pair(
      sdf
        .extrude(
          profile.polygon(
            [
              [0.12, 0.574],
              [0.085, 0.582],
              [0.05, 0.566],
              [0.022, 0.542],
              [0.028, 0.53],
              [0.055, 0.548],
              [0.088, 0.562],
              [0.118, 0.562],
            ],
            { smooth: true, samples: 3 },
          ),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    // A wide, wicked grin, open, with a tongue.
    const MOUTH_Y = 0.448;
    const mouth = sdf
      .extrude(
        profile.polygon(
          [
            [-0.06, 0.012],
            [0.06, 0.012],
            [0.045, -0.012],
            [0.02, -0.026],
            [0, -0.03],
            [-0.02, -0.026],
            [-0.045, -0.012],
          ],
          { smooth: true, samples: 4 },
        ),
        0.3,
      )
      .at(0, MOUTH_Y, 0.1);
    const tongue = mouth.round(-0.005).intersect(sdf.sphere(0.024).at(0, MOUTH_Y - 0.028, 0.2).elongate(0.01, 0, 0.2));
    const skin = sdf
      .smoothUnion(0.03, head.bone('head'), torso)
      .smoothUnion(0.01, nose.bone('head'), ears.bone('head'), crest.bone('head'))
      .union(armAt(1), armAt(-1), legAt(1), legAt(-1))
      .smoothUnion(0.012, tailShape)
      .union(spade)
      .paintWhere(sdf.halfSpace([0, 0, 1], -0.06).intersect(sdf.sphere(0.4).at(0, 0.3, -0.1)), C.skinDark, 0.06) // a darker back
      .paintWhere(sdf.ellipsoid([0.06, 0.07, 0.1]).at(0, 0.3, 0.06), C.belly, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(iris, C.iris)
      .paintWhere(irisDark, C.irisDark, 0.008)
      .paintWhere(pupil, C.pupil)
      .paintWhere(shine, '#ffffff')
      .paintWhere(lid.intersect(eyeWhite.round(0.004)), C.skinDark, 0.002)
      .paintWhere(brows, C.brow, 0.002)
      .paintWhere(mouth, C.mouth, 0.002)
      .paintWhere(tongue, C.tongue, 0.004);
    k.body('skin', skin, {
      color: C.skin,
      roughness: 0.5,
      textureDensity: 2,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 100, y * 100, z * 100, 2),
    });

    // ------------------------------------------------------------------ teeth: a row of small fangs
    const grinTop = MOUTH_Y + 0.012;
    const teeth = sdf.union(
      ...[-0.042, -0.014, 0.014, 0.042].map((x, i) => {
        const z = faceZ(Math.abs(x), grinTop) - 0.004;
        const long = i === 0 || i === 3;
        return sdf.cone([x, grinTop + 0.004, z], [x * 0.95, grinTop - (long ? 0.03 : 0.018), z + 0.004], long ? 0.011 : 0.009, 0.002);
      }),
    );
    k.body('teeth', teeth.bone('head'), { color: C.tooth, roughness: 0.3, detail: 0.003 });

    // ------------------------------------------------------------------ horns: big, curved, ringed
    const horn = sdf
      .chain(
        [
          [0.07, 0.61, 0.0, 0.034],
          [0.125, 0.665, -0.025, 0.03],
          [0.145, 0.735, -0.01, 0.022],
          [0.125, 0.79, 0.025, 0.012],
          [0.095, 0.81, 0.045, 0.004],
        ],
        0.012,
      )
      .paintFn((_x, y, _z, base) => (Math.sin(y * 260) > 0.6 && y < 0.74 ? [base[0] * 1.25, base[1] * 1.25, base[2] * 1.25] : base));
    k.body('horns', pair(horn).bone('head'), { color: C.horn, roughness: 0.45 });
    const claws = sdf.union(
      clawHand(WRIST, 1).claws.bone('hand.L'),
      clawHand(mx(WRIST), -1).claws.bone('hand.R'),
      clawFoot(ANKLE, 1).claws.bone('foot.L'),
      clawFoot(mx(ANKLE), -1).claws.bone('foot.R'),
    );
    k.body('claws', claws, { color: C.claw, roughness: 0.35, detail: 0.003 });

    // ------------------------------------------------------------------ bat wings
    // Local frame: the root at the origin, the wing spread along +X, the membrane in the XY plane.
    // The arm bone arches up and out to a high knuckle; four long fingers fan down from it.
    const KNUCKLE: V3 = [0.2, 0.22, 0];
    const fingerTips: V3[] = [
      [0.42, 0.2, 0],
      [0.45, 0.04, 0],
      [0.35, -0.11, 0],
      [0.19, -0.13, 0],
    ];
    // The membrane scallops between the finger tips.
    const wingOutline = profile.polygon(
      [
        [0.0, 0.05],
        [0.1, 0.17],
        [KNUCKLE[0], KNUCKLE[1]],
        [0.32, 0.23],
        [fingerTips[0]![0], fingerTips[0]![1]],
        [0.37, 0.11],
        [fingerTips[1]![0], fingerTips[1]![1]],
        [0.34, -0.0],
        [fingerTips[2]![0], fingerTips[2]![1]],
        [0.24, -0.05],
        [fingerTips[3]![0], fingerTips[3]![1]],
        [0.1, -0.05],
        [0.0, -0.02],
      ],
      { smooth: false },
    );
    const membrane = sdf
      .extrude(wingOutline, 0.012, 0.004)
      .paintFn((x, y, _z, base) => {
        // Darker veins fanning from the knuckle.
        const a = Math.atan2(y - KNUCKLE[1], x - KNUCKLE[0]);
        return Math.abs(Math.sin(a * 6)) < 0.12 ? [base[0] * 0.8, base[1] * 0.75, base[2] * 0.75] : base;
      });
    const wingBones = sdf.union(
      sdf.chain([[0, 0.04, 0, 0.02], [0.1, 0.17, 0, 0.017], [KNUCKLE[0], KNUCKLE[1], 0, 0.015]], 0.008),
      sdf.sphere(0.018).at(...KNUCKLE),
      ...fingerTips.map((t) => sdf.chain([[KNUCKLE[0], KNUCKLE[1], 0, 0.011], [t[0], t[1], 0, 0.004]], 0.004)),
      sdf.cone([KNUCKLE[0], KNUCKLE[1], 0], [KNUCKLE[0] - 0.01, KNUCKLE[1] + 0.05, 0], 0.012, 0.003), // the thumb claw
    );
    const wingPose = (s: sdf.Shape) => s.scale(1.2).rotateY(22).rotateZ(10).at(...WING_ROOT);
    k.body('wing-membranes', pair(wingPose(membrane).bone('wing.L')), { color: C.membrane, roughness: 0.6 });
    k.body('wing-bones', pair(wingPose(wingBones).bone('wing.L')), { color: C.wingBone, roughness: 0.5 });

    // ------------------------------------------------------------------ animation
    const { wave } = motion;
    const hover = (p: number, beats: number, lift: number, bob: number) => ({
      move: [0, lift + bob * wave(p, beats, 0.25), 0] as const,
    });

    // Idle: hovering in place, the wings beating, the tail and legs trailing.
    k.animation('idle', {
      duration: 0.8,
      pose: (_t, p) => {
        const beat = wave(p, 2);
        return {
          hips: { ...hover(p, 2, 0.18, 0.025), rotate: [4, 0, 0] },
          head: { rotate: [2 * wave(p, 1, 0.3), 6 * wave(p, 1, 0.1), 0] },
          'wing.L': { rotate: [0, 4 * wave(p, 2, 0.25), 8 + 40 * beat] },
          'wing.R': { rotate: [0, -4 * wave(p, 2, 0.25), -8 - 40 * beat] },
          tail1: { rotate: [8 * wave(p, 1, 0.2), 10 * wave(p, 1, 0.1), 0] },
          tail2: { rotate: [10 * wave(p, 1, 0.35), 12 * wave(p, 1, 0.25), 0] },
          tail3: { rotate: [12 * wave(p, 1, 0.5), 14 * wave(p, 1, 0.4), 0] },
          'leg.L': { rotate: [8 + 6 * wave(p, 2, 0.4), 0, 0] },
          'leg.R': { rotate: [8 + 6 * wave(p, 2, 0.45), 0, 0] },
          'upperarm.L': { rotate: [-4 * wave(p, 2, 0.3), 0, 0] },
          'upperarm.R': { rotate: [-4 * wave(p, 2, 0.35), 0, 0] },
        };
      },
    });

    // Fly: leaning into forward flight, bigger and faster wing beats, the legs swept back.
    k.animation('fly', {
      duration: 0.5,
      pose: (_t, p) => {
        const beat = wave(p);
        return {
          hips: { ...hover(p, 1, 0.22, 0.03), rotate: [26, 0, 3 * wave(p, 1, 0.1)] },
          head: { rotate: [-20, 0, 0] },
          'wing.L': { rotate: [0, 8 * wave(p, 1, 0.25), 6 + 50 * beat] },
          'wing.R': { rotate: [0, -8 * wave(p, 1, 0.25), -6 - 50 * beat] },
          tail1: { rotate: [18 + 6 * wave(p, 1, 0.3), 0, 0] },
          tail2: { rotate: [8 + 10 * wave(p, 1, 0.45), 8 * wave(p, 1, 0.4), 0] },
          tail3: { rotate: [10 * wave(p, 1, 0.6), 12 * wave(p, 1, 0.55), 0] },
          'leg.L': { rotate: [34, 0, 0] },
          'leg.R': { rotate: [30, 0, 0] },
          'shin.L': { rotate: [20, 0, 0] },
          'shin.R': { rotate: [24, 0, 0] },
          'upperarm.L': { rotate: [-10, 0, 0] },
          'upperarm.R': { rotate: [-10, 0, 0] },
        };
      },
    });

    // Attack: rear up with the claws raised, then dive forward and rake down, and recover.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        const rear = ease(0, 0.35, p) * (1 - ease(0.35, 0.45, p));
        const dive = ease(0.35, 0.47, p) * (1 - ease(0.6, 1, p));
        const beat = wave(p, 3);
        return {
          hips: { move: [0, 0.18 + 0.06 * rear - 0.04 * dive, -0.03 * rear + 0.1 * dive], rotate: [4 - 20 * rear + 40 * dive, 0, 0] },
          head: { rotate: [-10 * rear - 10 * dive, 0, 0] },
          'wing.L': { rotate: [0, 0, 8 + 30 * beat + 20 * rear] },
          'wing.R': { rotate: [0, 0, -8 - 30 * beat - 20 * rear] },
          'upperarm.L': { rotate: [-70 * rear + 30 * dive, 0, -10 * rear] },
          'upperarm.R': { rotate: [-70 * rear + 30 * dive, 0, 10 * rear] },
          'forearm.L': { rotate: [-30 * rear + 40 * dive, 0, 0] },
          'forearm.R': { rotate: [-30 * rear + 40 * dive, 0, 0] },
          tail1: { rotate: [10 * rear + 20 * dive, 0, 0] },
          tail3: { rotate: [-20 * rear + 20 * dive, 0, 0] },
          'leg.L': { rotate: [8 - 20 * rear + 30 * dive, 0, 0] },
          'leg.R': { rotate: [8 - 20 * rear + 30 * dive, 0, 0] },
        };
      },
    });

    // Hit: a jolt back in the hover with a yelp pose; the head snaps back, the wings fold in for a
    // moment, the arms fly out, and the tail whips; then the hover and the wing beat come back. The
    // last frame is the first idle frame.
    const { keys } = motion;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.38, 0.75], [1, 0]]);
        const free = 1 - h;
        const beat = wave(p) * free;
        const whip = (d: number, a: number) => a * keys(p, [[0, 0], [0.1 + d, 1], [0.3 + d, -0.6], [0.56 + d, 0.2], [1, 0]]);
        return {
          hips: { move: [0, 0.18 + 0.025 * wave(p, 1, 0.25) + 0.02 * h, -0.07 * h], rotate: [4 - 20 * h, 0, 6 * h] },
          chest: { rotate: [-8 * h, 0, 0] },
          head: { rotate: [2 * wave(p, 1, 0.3) - 24 * h, 6 * wave(p, 1, 0.1) * free, -8 * h] },
          'wing.L': { rotate: [0, 4 * wave(p, 1, 0.25) * free + 40 * h, (8 + 40 * beat) * free - 30 * h] },
          'wing.R': { rotate: [0, -4 * wave(p, 1, 0.25) * free - 40 * h, -(8 + 40 * beat) * free + 30 * h] },
          tail1: { rotate: [8 * wave(p, 1, 0.2) + 20 * h, 10 * wave(p, 1, 0.1) + whip(0, 30), 0] },
          tail2: { rotate: [10 * wave(p, 1, 0.35) + 10 * h, 12 * wave(p, 1, 0.25) + whip(0.06, -40), 0] },
          tail3: { rotate: [12 * wave(p, 1, 0.5), 14 * wave(p, 1, 0.4) + whip(0.12, 50), 0] },
          'leg.L': { rotate: [8 + 6 * wave(p, 1, 0.4) - 18 * h, 0, 8 * h] },
          'leg.R': { rotate: [8 + 6 * wave(p, 1, 0.45) - 14 * h, 0, -8 * h] },
          'shin.L': { rotate: [30 * h, 0, 0] },
          'shin.R': { rotate: [26 * h, 0, 0] },
          'upperarm.L': { rotate: [-4 * wave(p, 1, 0.3) + 20 * h, 0, 70 * h] },
          'upperarm.R': { rotate: [-4 * wave(p, 1, 0.35) + 20 * h, 0, -70 * h] },
          'forearm.L': { rotate: [30 * h, 0, 30 * h] },
          'forearm.R': { rotate: [30 * h, 0, -30 * h] },
        };
      },
    });

    // Death: a jolt in the hover, the wings stop and crumple, it tumbles back and drops, lands with a
    // small bounce, and lies on its back: the wings limp on the floor, the arms flopped out to the
    // sides, the knees up, the head turned to one side, and the tail laid out with its tip curled.
    const HOVER0 = 0.205; // hips move y in the first idle frame
    const LIE = -0.16; // hips move y when it lies on its back (the build lifts it if it sinks)
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const f = Math.min(1, Math.max(0, (p - 0.12) / 0.34));
        const y =
          p < 0.12
            ? keys(p, [[0, HOVER0], [0.09, HOVER0 + 0.03], [0.12, HOVER0 + 0.03]])
            : p < 0.46
              ? HOVER0 + 0.03 + (LIE - HOVER0 - 0.03) * f * f // accelerates like a drop
              : keys(p, [[0.46, LIE], [0.56, LIE + 0.05], [0.66, LIE], [0.74, LIE + 0.01], [0.82, LIE]]);
        return {
          hips: {
            move: [0, y, keys(p, [[0, 0], [0.08, -0.06], [0.46, 0.06], [1, 0.08]])],
            rotate: [
              keys(p, [[0, 4], [0.08, -18], [0.16, -10], [0.46, -100], [0.56, -84], [0.66, -93], [1, -90]]),
              keys(p, [[0, 0], [0.46, 14], [1, 20]]),
              keys(p, [[0, 0], [0.1, 8], [0.3, -24], [0.46, 6], [0.6, -3], [0.75, 0]]),
            ],
          },
          chest: { rotate: [keys(p, [[0, 0], [0.08, -10], [0.3, 4], [0.5, 0]]), 0, 0] },
          head: {
            rotate: [
              keys(p, [[0, 1.9], [0.08, -30], [0.3, 6], [0.46, -12], [0.58, 22], [0.7, 12], [1, 15]]),
              keys(p, [[0, 3.5], [0.3, -10], [0.5, 10], [0.7, 32], [1, 30]]),
              keys(p, [[0, 0], [0.08, -10], [0.3, 8], [0.5, 0]]),
            ],
          },
          ...(['L', 'R'] as const).reduce((acc, side) => {
            const s = side === 'L' ? 1 : -1;
            acc[`wing.${side}`] = {
              rotate: [
                0,
                s * keys(p, [[0, 4], [0.08, 30], [0.3, 40], [0.46, 20], [0.56, -16], [0.66, -6], [1, -10]]),
                s * keys(p, [[0, 8], [0.08, 50], [0.2, 20], [0.3, 60], [0.46, 40], [0.56, -34], [0.66, -20], [1, -28]]),
              ],
            };
            acc[`upperarm.${side}`] = {
              rotate: [
                keys(p, [[0, 2.4], [0.08, 10], [0.3, -25], [0.46, 0], [0.58, 60], [0.7, 45], [1, 50]]),
                0,
                s * keys(p, [[0, 0], [0.08, 70], [0.3, 65], [0.46, 45], [0.58, 55], [1, 50]]),
              ],
            };
            acc[`forearm.${side}`] = { rotate: [keys(p, [[0, 0], [0.08, 30], [0.3, 10], [0.5, 40], [0.62, 75], [1, 70]]), 0, s * keys(p, [[0, 0], [0.08, 30], [0.3, 20], [0.5, 0]])] };
            return acc;
          }, {} as Record<string, { rotate: [number, number, number] }>),
          'leg.L': { rotate: [keys(p, [[0, 11.5], [0.08, -20], [0.3, 10], [0.46, -10], [0.58, -45], [0.7, -32], [1, -38]]), 0, keys(p, [[0, 0], [0.5, 12], [1, 14]])] },
          'leg.R': { rotate: [keys(p, [[0, 9.9], [0.08, -16], [0.3, 14], [0.46, -6], [0.6, -38], [0.72, -26], [1, -30]]), 0, keys(p, [[0, 0], [0.5, -10], [1, -12]])] },
          'shin.L': { rotate: [keys(p, [[0, 0], [0.08, 30], [0.3, 10], [0.5, 40], [0.6, 80], [1, 72]]), 0, 0] },
          'shin.R': { rotate: [keys(p, [[0, 0], [0.08, 26], [0.3, 14], [0.5, 36], [0.62, 70], [1, 64]]), 0, 0] },
          tail1: {
            rotate: [
              keys(p, [[0, 7.6], [0.08, 30], [0.3, 20], [0.46, -20], [0.6, -50], [1, -45]]),
              keys(p, [[0, 5.9], [0.08, 25], [0.2, -20], [0.34, 15], [0.5, 0]]),
              keys(p, [[0, 0], [0.4, 0], [0.62, -40], [1, -35]]),
            ],
          },
          tail2: {
            rotate: [
              keys(p, [[0, 8.1], [0.1, 25], [0.3, 10], [0.46, -30], [0.62, -62], [1, -57]]),
              keys(p, [[0, 12], [0.12, -30], [0.24, 25], [0.38, -15], [0.55, 0]]),
              0,
            ],
          },
          tail3: {
            rotate: [
              keys(p, [[0, 0], [0.12, 20], [0.3, -10], [0.46, 40], [0.66, 118], [0.8, 104], [1, 110]]),
              keys(p, [[0, 8.2], [0.16, 40], [0.28, -35], [0.42, 20], [0.6, 0]]),
              0,
            ],
          },
        };
      },
    });
  },
});
