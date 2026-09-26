import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Giant rat — Chibi Quest dungeon monster, a hunched biped about 0.78 m to the tips of its head
 * spikes and 0.8 m from nose to tail tip, faces +Z. Target: docs/monster-mockups/giant-rat_001.jpg
 * (made with mmx; one three-quarter view).
 *
 * Role: a common, fast dungeon pest, seen in 3D and as a 128 px sprite; the ears, the bulging red
 *   eyes, the pink nose, and the toothy grin must read.
 * One idea: a fat, hunched sewer rat standing on its hind legs, all belly and head, with huge
 *   round ears, bulging angry eyes over a pink nose, and a jagged yellow grin, claws raised.
 * Proportions: head center 0.52 (half-width 0.18), eyes 0.56, the ears reach 0.72, the belly
 *   center 0.23 (half-width 0.17); short legs and long pink hind feet; a long tail on the ground.
 * Shape language: round masses (belly, head, ears, eyes) with many sharp points for menace
 *   (head spikes, back tufts, claws, teeth).
 * Palette (60/30/10): gray fur #6b6566 (darker back); cream muzzle #e3c890 and tan belly #d6b78a;
 *   pink skin #e08a86 (ears, hands, feet, tail); red eyes #c8201c and a red neckerchief #b8342c
 *   as the accents.
 * Value plan: the white eyes with red irises and the pink nose on the cream muzzle are the
 *   strongest contrast (focal point); the light belly is the second mass; the dark back frames it.
 * Bodies: fur, pink, eyes, teeth, spikes, claws, whiskers, neckerchief, bandage.
 * Rig: hips, spine, chest, neck, head, arms, legs with shins and feet, and a three-bone tail.
 *   Clips: idle (breathing, sniffing), walk (a waddle), run (a low scurry), attack (lunge, bite,
 *   and claw rake), hit (a squeal, arms up), death (a stagger, then a flop onto the back).
 */

const C = {
  fur: '#6b6566',
  furDark: '#4c4749',
  muzzle: '#e3c890',
  belly: '#d6b78a',
  pink: '#e08a86',
  pinkDark: '#b86a68',
  earInner: '#e8928a',
  nose: '#e06e70',
  mouth: '#3a1e1c',
  eyeWhite: '#fbf4ea',
  iris: '#c8201c',
  pupil: '#140c0c',
  brow: '#4c4749',
  tooth: '#eedcaa',
  spike: '#e8dcbc',
  claw: '#f4e2d4',
  whisker: '#2a2224',
  scarf: '#b8342c',
  scarfDark: '#842420',
  bandage: '#e2d6b8',
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const HEAD_C: V3 = [0, 0.52, 0.06];
// Joints. The arms are held forward with the claws raised; the legs are short under the belly.
const SHOULDER: V3 = [0.13, 0.37, 0.04];
const ELBOW: V3 = [0.185, 0.3, 0.09];
const WRIST: V3 = [0.172, 0.285, 0.18];
const HIP: V3 = [0.085, 0.15, 0.0];
const KNEE: V3 = [0.11, 0.09, 0.05];
const ANKLE: V3 = [0.115, 0.045, -0.025];
// The tail lies on the ground behind and curls to the rat's right.
const TAIL: [number, number, number, number][] = [
  [0, 0.13, -0.15, 0.036],
  [0.015, 0.05, -0.27, 0.028],
  [-0.03, 0.026, -0.4, 0.022],
  [-0.14, 0.022, -0.49, 0.018],
  [-0.27, 0.02, -0.48, 0.014],
  [-0.36, 0.018, -0.4, 0.01],
];
const T_BONES: V3[] = [
  [TAIL[0]![0], TAIL[0]![1], TAIL[0]![2]],
  [TAIL[2]![0], TAIL[2]![1], TAIL[2]![2]],
  [TAIL[3]![0], TAIL[3]![1], TAIL[3]![2]],
  [TAIL[5]![0], TAIL[5]![1], TAIL[5]![2]],
];

/** The distance along the tail's center line to the point nearest to (x, y, z). */
const tailArc = (() => {
  const seg = TAIL.slice(0, -1).map((a, i) => {
    const b = TAIL[i + 1]!;
    const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    return { a, d, len: Math.hypot(d[0], d[1], d[2]) };
  });
  return (x: number, y: number, z: number) => {
    let best = Infinity;
    let arc = 0;
    let start = 0;
    for (const s of seg) {
      const t = Math.min(1, Math.max(0, ((x - s.a[0]) * s.d[0] + (y - s.a[1]) * s.d[1] + (z - s.a[2]) * s.d[2]) / (s.len * s.len)));
      const q = Math.hypot(s.a[0] + s.d[0] * t - x, s.a[1] + s.d[1] * t - y, s.a[2] + s.d[2] * t - z);
      if (q < best) {
        best = q;
        arc = start + t * s.len;
      }
      start += s.len;
    }
    return arc;
  };
})();

/** A big clawed hand at the wrist `w`: long fingers spread forward and curled down; `s` mirrors it. */
const ratHand = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  const finger = (dx: number, l: number) =>
    sdf.chain(
      [
        [...o(dx * 0.6, -0.004, 0.03), 0.0125],
        [...o(dx, 0.002, 0.06 * l), 0.011],
        [...o(dx * 1.1, -0.018, 0.082 * l), 0.0095],
      ],
      0.004,
    );
  const tips = [
    [-0.026, 0.92],
    [0, 1],
    [0.026, 0.95],
  ] as const;
  return {
    hand: sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.036, 0.026, 0.038]).at(...o(0, -0.004, 0.014)),
      ...tips.map(([dx, l]) => finger(dx, l)),
      sdf.cone(o(0.03, 0.0, 0.008), o(0.05, 0.004, 0.04), 0.013, 0.009), // thumb
    ),
    claws: sdf.union(
      ...tips.map(([dx, l]) => sdf.cone(o(dx * 1.1, -0.018, 0.082 * l), o(dx * 1.15, -0.044, 0.094 * l), 0.009, 0.002)),
      sdf.cone(o(0.05, 0.004, 0.04), o(0.062, -0.014, 0.058), 0.008, 0.002),
    ),
  };
};

/** A long rat hind foot from the heel at the ankle `a` forward to four spread toes; `s` mirrors it. */
const ratFoot = (a: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [a[0] + dx * s, a[1] + dy, a[2] + dz];
  const toes = [-0.03, -0.01, 0.01, 0.03].map((dx, i) => {
    const l = i === 0 ? 0.85 : 1 - Math.abs(i - 1.5) * 0.06;
    return { root: o(dx * 0.8, -0.03, 0.09), tip: o(dx * 1.25, -0.036, 0.09 + 0.05 * l) };
  });
  return {
    foot: sdf
      .smoothUnion(
        0.018,
        sdf.ellipsoid([0.034, 0.03, 0.036]).at(...o(0, -0.012, 0.0)), // heel
        sdf.ellipsoid([0.046, 0.022, 0.07]).at(...o(0, -0.024, 0.06)), // the long sole
        ...toes.map((t) => sdf.capsule(t.root, t.tip, 0.012)),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0)),
    claws: sdf.union(...toes.map((t) => sdf.cone([t.tip[0], t.tip[1] + 0.002, t.tip[2]], [t.tip[0] * 1.03, 0.003, t.tip[2] + 0.026], 0.0085, 0.002))),
  };
};

export default defineAsset({
  name: 'giant-rat',
  description: 'Chibi giant rat dungeon monster: a fat, hunched rat on its hind legs with huge round ears, bulging red eyes, a pink nose, a jagged yellow grin, head spikes, a red neckerchief, and a long bandaged tail.',
  detail: 0.005,
  reference: 'docs/monster-mockups/giant-rat_001.jpg',

  build(k) {
    k.skeleton({
      hips: { at: [0, 0.16, -0.02] },
      spine: { parent: 'hips', at: [0, 0.26, 0.0] },
      chest: { parent: 'spine', at: [0, 0.36, 0.01] },
      neck: { parent: 'chest', at: [0, 0.42, 0.03] },
      head: { parent: 'neck', at: [0, 0.46, 0.05] },
      tail1: { parent: 'hips', at: T_BONES[0]! },
      tail2: { parent: 'tail1', at: T_BONES[1]! },
      tail3: { parent: 'tail2', at: T_BONES[2]!, tail: T_BONES[3]! },
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
    const skull = sdf.ellipsoid([0.18, 0.15, 0.16]).at(...HEAD_C);
    const SNOUT: V3 = [0, 0.48, 0.19];
    const head = sdf.smoothUnion(
      0.05,
      skull,
      pair(sdf.sphere(0.08).at(0.09, 0.47, 0.13)), // full cheeks
      sdf.ellipsoid([0.09, 0.07, 0.09]).at(...SNOUT), // the snout, forward
      sdf.ellipsoid([0.1, 0.05, 0.08]).at(0, 0.42, 0.13), // chin
    );
    const faceHit = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])!;
    const faceZ = (x: number, y: number) => faceHit(x, y)[2];

    // Big round ears: a thick disc, cupped toward the front, pink inside.
    const earDisc = sdf.extrude(profile.circle(0.092), 0.026, 0.011);
    const earCup = sdf.extrude(profile.circle(0.07), 0.03, 0.012).at(0.004, -0.006, 0.02);
    const earLocal = earDisc.smoothSubtract(0.01, earCup);
    const earPose = (s: sdf.Shape) => s.rotateY(28).rotateZ(-24).at(0.2, 0.655, 0.0);
    const ears = pair(earPose(earLocal));
    const earPaint = pair(earPose(earCup.round(0.004)));

    // Eye positions on the face; the bulging eyeballs are a separate body.
    const EYE_X = 0.082;
    const EYE_Y = 0.565;
    const eyeC: V3 = [EYE_X, EYE_Y, faceZ(EYE_X, EYE_Y) - 0.02];
    const EYE_R = 0.043;

    // ------------------------------------------------------------------ body, arms, legs, tail
    const body = sdf.smoothUnion(
      0.07,
      sdf.ellipsoid([0.17, 0.17, 0.16]).at(0, 0.23, 0.02).bone('spine'), // the fat belly
      sdf.ellipsoid([0.14, 0.12, 0.13]).at(0, 0.37, 0.0).bone('chest'),
      sdf.ellipsoid([0.15, 0.1, 0.13]).at(0, 0.16, -0.03).bone('hips'),
    );
    const armAt = (s: 1 | -1) => {
      const side = s > 0 ? 'L' : 'R';
      const sh = s > 0 ? SHOULDER : mx(SHOULDER);
      const el = s > 0 ? ELBOW : mx(ELBOW);
      const wr = s > 0 ? WRIST : mx(WRIST);
      return {
        upper: sdf.cone(sh, el, 0.045, 0.038).bone(`upperarm.${side}`),
        lower: sdf.smoothUnion(0.012, sdf.cone(el, wr, 0.036, 0.031).bone(`forearm.${side}`), ratHand(wr, s).hand.bone(`hand.${side}`)),
      };
    };
    const legAt = (s: 1 | -1) => {
      const side = s > 0 ? 'L' : 'R';
      const h = s > 0 ? HIP : mx(HIP);
      const kn = s > 0 ? KNEE : mx(KNEE);
      const an = s > 0 ? ANKLE : mx(ANKLE);
      return {
        thigh: sdf.smoothUnion(0.02, sdf.ellipsoid([0.06, 0.07, 0.075]).at(h[0] + 0.01 * s, 0.12, 0.02), sdf.cone(h, kn, 0.05, 0.04)).bone(`leg.${side}`),
        lower: sdf.smoothUnion(0.015, sdf.cone(kn, an, 0.03, 0.025).bone(`shin.${side}`), ratFoot(an, s).foot.bone(`foot.${side}`)),
      };
    };
    const armL = armAt(1);
    const armR = armAt(-1);
    const legL = legAt(1);
    const legR = legAt(-1);
    const tailBones = ['tail1', 'tail1', 'tail2', 'tail3', 'tail3'];
    const tailShape = sdf.smoothUnion(
      0.01,
      ...TAIL.slice(0, -1).map((a, i) => sdf.chain([a, TAIL[i + 1]!], 0.006).bone(tailBones[i]!)),
    );

    // Gray fur tufts down the back and the sides, pointing back and out, below the neckerchief.
    const backTufts = sdf.union(
      ...[
        [0.0, 0.385, 0.08],
        [0.0, 0.3, 0.08],
        [0.0, 0.215, 0.068],
        [0.075, 0.36, 0.07],
        [0.085, 0.275, 0.07],
        [0.085, 0.19, 0.06],
        [0.07, 0.12, 0.05],
        [-0.075, 0.36, 0.07],
        [-0.085, 0.275, 0.07],
        [-0.085, 0.19, 0.06],
        [-0.07, 0.12, 0.05],
      ].map(([x, y, len]) => {
        const p = sdf.raycast(body, [x!, y!, -1], [0, 0, 1])!;
        const out = Math.sign(x!) * 0.5;
        return sdf.cone([p[0], p[1] + 0.02, p[2] + 0.03], [p[0] + out * len!, p[1] - len! * 0.35, p[2] - len!], 0.04, 0.004);
      }),
    );

    // ------------------------------------------------------------------ fur (head, body, upper arms, thighs)
    const eyeSocket = pair(sdf.sphere(EYE_R + 0.004).at(...eyeC));
    const fur = sdf
      .smoothUnion(0.05, head.bone('head'), body)
      .smoothUnion(0.03, armL.upper, armR.upper, legL.thigh, legR.thigh)
      .smoothUnion(0.02, backTufts.bone('chest'))
      .smoothUnion(0.012, ears.bone('head'))
      .smoothSubtract(0.01, eyeSocket.bone('head'))
      // Cream muzzle: the snout, cheeks, and chin below the eyes.
      .paintWhere(
        sdf.smoothUnion(0.03, sdf.ellipsoid([0.1, 0.08, 0.2]).at(0, 0.465, 0.2), pair(sdf.sphere(0.085).at(0.1, 0.47, 0.16))),
        C.muzzle,
        0.02,
      )
      .paintWhere(sdf.ellipsoid([0.13, 0.15, 0.2]).at(0, 0.215, 0.13), C.belly, 0.025)
      .paintWhere(sdf.halfSpace([0, 0, 1], -0.07).intersect(sdf.sphere(0.5).at(0, 0.3, -0.2)), C.furDark, 0.06) // a darker back
      .paintWhere(earPaint, C.earInner, 0.008);
    k.body('fur', fur, {
      color: C.fur,
      roughness: 0.85,
      textureDensity: 2,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 70, y * 22, z * 70, 2),
    });

    // ------------------------------------------------------------------ pink skin: nose, forearms and hands, feet, tail
    const noseAt = faceHit(0, 0.5);
    const nose = sdf.ellipsoid([0.046, 0.036, 0.038]).at(noseAt[0], noseAt[1] + 0.004, noseAt[2] - 0.004);
    const pink = sdf
      .union(
        sdf.union(armL.lower, armR.lower),
        sdf.union(legL.lower, legR.lower),
        tailShape
          .paintFn((x, y, z, base) => (Math.sin(tailArc(x, y, z) * 170) > 0.55 ? [base[0] * 0.86, base[1] * 0.82, base[2] * 0.82] : base)),
      )
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.006), C.pinkDark, 0.01);
    k.body('pink', pink, {
      color: C.pink,
      roughness: 0.5,
      bump: (x, y, z) => (y < 0.14 && z < -0.12 ? 0.0012 * Math.max(0, Math.sin(tailArc(x, y, z) * 170)) : 0),
    });
    k.body('nose', nose.paintWhere(pair(sdf.ellipsoid([0.01, 0.007, 0.02]).at(0.018, noseAt[1] - 0.008, noseAt[2])), C.pinkDark, 0.004).bone('head'), {
      color: C.nose,
      roughness: 0.3,
    });

    // ------------------------------------------------------------------ eyes: bulging white eyeballs with red irises, under angry brows
    const eyeDir = (x: number): V3 => {
      // Each eye looks forward and a little in.
      const d: V3 = [-Math.sign(x) * 0.12, -0.05, 1];
      const l = Math.hypot(...d);
      return [d[0] / l, d[1] / l, d[2] / l];
    };
    const onEye = (x: number, r: number, dx = 0, dy = 0): V3 => {
      const c: V3 = x > 0 ? eyeC : mx(eyeC);
      const d = eyeDir(x);
      return [c[0] + d[0] * EYE_R + dx, c[1] + d[1] * EYE_R + dy, c[2] + d[2] * EYE_R - r * 0.4];
    };
    const eyeballs = sdf
      .union(sdf.sphere(EYE_R).at(...eyeC), sdf.sphere(EYE_R).at(...mx(eyeC)))
      .paintWhere(sdf.union(...[1, -1].map((x) => sdf.sphere(0.027).at(...onEye(x, 0.027)))), C.iris, 0.002)
      .paintWhere(sdf.union(...[1, -1].map((x) => sdf.sphere(0.013).at(...onEye(x, 0.013)))), C.pupil, 0.002)
      .paintWhere(sdf.union(...[1, -1].map((x) => sdf.sphere(0.007).at(...onEye(x, 0.007, 0.01, 0.012)))), '#ffffff', 0.002);
    k.body('eyes', eyeballs.bone('head'), { color: C.eyeWhite, roughness: 0.2, textureDensity: 2, detail: 0.0035 });
    // Heavy fur brows over the eyes, low at the inside: an angry glare.
    const brows = pair(
      sdf.chain(
        [
          [eyeC[0] + 0.05, eyeC[1] + 0.036, eyeC[2] - 0.004, 0.02],
          [eyeC[0] + 0.005, eyeC[1] + 0.026, eyeC[2] + 0.03, 0.02],
          [eyeC[0] - 0.042, eyeC[1] + 0.0, eyeC[2] + 0.032, 0.017],
        ],
        0.01,
      ),
    );
    k.body('brows', brows.bone('head'), { color: C.brow, roughness: 0.85, bump: (x, y, z) => 0.001 * noise.fbm(x * 90, y * 40, z * 90, 2) });

    // ------------------------------------------------------------------ mouth and teeth: a wide jagged grin
    const GRIN_R = 0.13;
    const GRIN_Y = 0.425;
    const grin = sdf.extrude(profile.arc(GRIN_R, 0.02, 232, 308), 0.4).at(0, GRIN_Y + GRIN_R, 0.2);
    const mouthPatch = head
      .round(0.002)
      .subtract(head.round(-0.01))
      .intersect(grin)
      .intersect(sdf.halfSpace([0, 0, -1], -0.1));
    k.body('mouth', mouthPatch.bone('head'), { color: C.mouth, roughness: 0.6 });
    const teeth = sdf.union(
      // Two big buck teeth in the middle, and smaller jagged teeth along the grin.
      ...[-0.013, 0.013].map((x) => {
        const y = GRIN_Y + GRIN_R - Math.sqrt(GRIN_R * GRIN_R - x * x) + 0.012;
        return sdf.box([0.022, 0.034, 0.012], 0.005).at(x, y - 0.01, faceZ(Math.abs(x), y) + 0.002);
      }),
      ...[-0.07, -0.046, 0.046, 0.07].map((x) => {
        const y = GRIN_Y + GRIN_R - Math.sqrt(GRIN_R * GRIN_R - x * x) + 0.01;
        const z = faceZ(Math.abs(x), y) - 0.002;
        return sdf.cone([x, y + 0.004, z], [x * 0.97, y - 0.024, z + 0.004], 0.011, 0.002);
      }),
    );
    k.body('teeth', teeth.bone('head'), { color: C.tooth, roughness: 0.35, detail: 0.003 });

    // ------------------------------------------------------------------ pale spikes on the crown
    const spikes = sdf.union(
      ...[
        [0.0, 0.11, 0.095, 0.0],
        [0.035, 0.07, 0.085, 0.3],
        [-0.035, 0.07, 0.085, -0.3],
        [0.06, 0.02, 0.07, 0.55],
        [-0.06, 0.02, 0.07, -0.55],
        [0.0, 0.02, 0.08, 0.0],
        [0.0, -0.06, 0.065, 0.0],
      ].map(([x, z, len, out]) => {
        const p = sdf.raycast(skull, [x!, 2, HEAD_C[2] + z!], [0, -1, 0])!;
        return sdf.cone([p[0], p[1] - 0.02, p[2]], [p[0] + out! * len!, p[1] + len!, p[2] - len! * 0.45], 0.022, 0.003);
      }),
    );
    k.body('spikes', spikes.bone('head'), { color: C.spike, roughness: 0.5 });

    // ------------------------------------------------------------------ claws
    const claws = sdf.union(
      ratHand(WRIST, 1).claws.bone('hand.L'),
      ratHand(mx(WRIST), -1).claws.bone('hand.R'),
      ratFoot(ANKLE, 1).claws.bone('foot.L'),
      ratFoot(mx(ANKLE), -1).claws.bone('foot.R'),
    );
    k.body('claws', claws, { color: C.claw, roughness: 0.35, detail: 0.003 });

    // ------------------------------------------------------------------ whiskers: three each side, long and thin
    const whiskers = pair(
      sdf.union(
        ...[
          [0.012, 0.02, 0.03],
          [0.0, 0.0, 0.0],
          [-0.012, -0.024, -0.03],
        ].map(([dy, tipDy, tipDz]) => {
          const root = faceHit(0.05, 0.49 + dy!);
          return sdf.cone([root[0] - 0.008, root[1], root[2] - 0.01], [root[0] + 0.19, root[1] + 0.03 + tipDy!, root[2] - 0.05 + tipDz!], 0.0036, 0.0018);
        }),
      ),
    );
    k.body('whiskers', whiskers.bone('head'), { color: C.whisker, roughness: 0.5, detail: 0.0022 });

    // ------------------------------------------------------------------ red neckerchief: a band and a triangle over the chest
    const neckBand = sdf
      .smoothUnion(0.05, head, body)
      .round(0.012)
      .smoothIntersect(0.006, sdf.box([0.6, 0.036, 0.6], 0.008).rotateX(20).at(0, 0.392, 0));
    const skin = sdf.smoothUnion(0.05, head, body);
    const kerchief = skin
      .round(0.012)
      .subtract(skin.round(-0.004))
      .intersect(
        sdf
          .extrude(
            profile.polygon([
              [-0.1, 0.345],
              [0.1, 0.345],
              [0.022, 0.262],
              [0.0, 0.254],
              [-0.03, 0.272],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      );
    const scarf = sdf
      .smoothUnion(0.01, neckBand, kerchief)
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(z, x) * 11 + y * 70) > 0.8 ? [base[0] * 0.82, base[1] * 0.82, base[2] * 0.82] : base));
    k.body('neckerchief', scarf.bone('chest'), { color: C.scarf, roughness: 0.85 });

    // ------------------------------------------------------------------ a dirty bandage wrapped near the tail tip
    const wrapAt = (i: number) => {
      const a = TAIL[4]!;
      const b = TAIL[3]!;
      const p = lerp([a[0], a[1], a[2]], [b[0], b[1], b[2]], 0.25 + i * 0.2);
      const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const yaw = (Math.atan2(d[0], d[2]) * 180) / Math.PI;
      return sdf.torus(0.016, 0.0065).rotateX(90 + (i - 1) * 12).rotateY(yaw).at(...p);
    };
    k.body('bandage', sdf.union(wrapAt(0), wrapAt(1), wrapAt(2)).bone('tail3'), { color: C.bandage, roughness: 0.9 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, orient } = motion;
    const LEG = 0.11;

    // Idle: slow breathing, a sniffing nose, twitching ears (on the head), and a sweeping tail.
    k.animation('idle', {
      duration: 2.0,
      pose: (_t, p) => ({
        spine: { rotate: [2 * wave(p), 0, 0], scale: [1 + 0.012 * bump(p), 1, 1 + 0.012 * bump(p)] },
        head: { rotate: [3 * wave(p, 4) * bump(p, 1, 0.5), 8 * wave(p, 1, 0.2), 3 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [-4 * bump(p, 2), 0, 0] },
        'upperarm.R': { rotate: [-4 * bump(p, 2, 0.25), 0, 0] },
        'forearm.L': { rotate: [-8 * bump(p, 2), 0, 0] },
        'forearm.R': { rotate: [-8 * bump(p, 2, 0.25), 0, 0] },
        tail1: { rotate: [0, 6 * wave(p, 1, 0.1), 0] },
        tail2: { rotate: [0, 10 * wave(p, 1, 0.25), 0] },
        tail3: { rotate: [0, 14 * wave(p, 1, 0.4), 0] },
      }),
    });

    // Walk: a waddle on short legs, the body rocking side to side; the claws stay raised.
    // Run: a low, fast scurry, leaning forward.
    const stride = (duration: number, swing: number, lean: number, rock: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        return {
          hips: { move: [0, -legDrop(LEG, swing * s) + hop * bump(p, 2, 0.25), 0] as const, rotate: [lean * 0.4, 6 * s, rock * s] as const },
          spine: { rotate: [lean * 0.6, 0, -rock * 0.6 * s] as const },
          head: { rotate: [-lean + 3 * wave(p, 2, 0.3), -4 * s, -rock * 0.4 * s] as const },
          'leg.L': { rotate: [-swing * s, 0, 0] as const },
          'leg.R': { rotate: [swing * s, 0, 0] as const },
          'foot.L': { rotate: [swing * 0.8 * s + 14 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-swing * 0.8 * s + 14 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [8 * s - lean * 0.5, 0, 0] as const },
          'upperarm.R': { rotate: [-8 * s - lean * 0.5, 0, 0] as const },
          'forearm.L': { rotate: [-6 * bump(p, 2), 0, 0] as const },
          'forearm.R': { rotate: [-6 * bump(p, 2, 0.25), 0, 0] as const },
          tail1: { rotate: [0, 10 * wave(p, 1, 0.15), 0] as const },
          tail2: { rotate: [0, 14 * wave(p, 1, 0.3), 0] as const },
          tail3: { rotate: [0, 18 * wave(p, 1, 0.45), 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.7, 30, 4, 6, 0));
    k.animation('run', stride(0.4, 42, 22, 4, 0.025));

    // Attack: crouch back, lunge forward with a snapping bite, rake both claws down, recover.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0, 0.3, p) * (1 - ease(0.3, 0.42, p));
        const hit = ease(0.3, 0.44, p) * (1 - ease(0.6, 1, p));
        const rake = ease(0.4, 0.52, p) * (1 - ease(0.6, 0.95, p));
        return {
          hips: { move: [0, -0.015 * wind - legDrop(LEG, 20 * hit), -0.03 * wind + 0.06 * hit], rotate: [-8 * wind + 18 * hit, 0, 0] },
          spine: { rotate: [-6 * wind + 10 * hit, 0, 0] },
          head: { rotate: [-10 * wind - 6 * hit + 10 * rake, 0, 0] },
          // The claws rise up and out beside the head (not in front of the face), then rake down.
          'upperarm.L': { rotate: [-50 * wind + 30 * rake, 0, 30 * wind] },
          'upperarm.R': { rotate: [-50 * wind + 30 * rake, 0, -30 * wind] },
          'forearm.L': { rotate: [-12 * wind + 30 * rake, 0, 0] },
          'forearm.R': { rotate: [-12 * wind + 30 * rake, 0, 0] },
          'leg.L': { rotate: [10 * wind - 20 * hit, 0, 0] },
          'leg.R': { rotate: [10 * wind + 20 * hit, 0, 0] },
          'foot.L': { rotate: [-10 * wind + 20 * hit, 0, 0] },
          'foot.R': { rotate: [-10 * wind - 10 * hit, 0, 0] },
          tail1: { rotate: [-8 * wind, 12 * hit, 0] },
          tail2: { rotate: [0, 16 * hit, 0] },
          tail3: { rotate: [0, 20 * hit, 0] },
        };
      },
    });

    type R3 = [number, number, number];
    const kf = (p: number, list: readonly (readonly [number, number])[]) => motion.keys(p, list);
    const DEG = Math.PI / 180;
    // Arms up: the wrists go up and out beside the head (clear of the cheeks and the whiskers), the
    // elbows out and down. The pole keeps the rest elbow in the bend plane, so t = 0 is the rest pose.
    const ARM = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const ARM_R = { root: mx(SHOULDER), mid: mx(ELBOW), end: mx(WRIST) };
    const WRIST_UP: V3 = [0.25, 0.49, 0.1];
    const POLE: V3 = [0.29, 0.22, 0.03];
    const armsUp = (t: number) => ({
      L: motion.reach(ARM, lerp(WRIST, WRIST_UP, t), POLE),
      R: motion.reach(ARM_R, lerp(mx(WRIST), mx(WRIST_UP), t), mx(POLE)),
    });

    // Hit: a squeal. The head jerks back, the chest and the belly flinch back, the arms fly up
    // with the claws open, and the tail whips; then a quick return.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = kf(p, [[0, 0], [0.15, 1], [0.35, 0.75], [0.75, 0.12], [1, 0]]);
        const wt = kf(p, [[0, 0], [0.12, 1], [0.3, -0.8], [0.5, 0.45], [0.72, -0.15], [1, 0]]);
        const up = armsUp(h);
        return {
          hips: { move: [0, 0.006 * h, -0.025 * h], rotate: [-6 * h, 0, 0] },
          spine: { rotate: [-7 * h, 0, 0], scale: [1 - 0.03 * h, 1 + 0.02 * h, 1 - 0.04 * h] },
          chest: { rotate: [-9 * h, 0, 0] },
          neck: { rotate: [-4 * h, 0, 0] },
          head: { rotate: [-10 * h, 0, 7 * h] },
          // The arms fly up and out beside the head (not in front of the face).
          'upperarm.L': { rotate: up.L.upper },
          'upperarm.R': { rotate: up.R.upper },
          'forearm.L': { rotate: up.L.lower },
          'forearm.R': { rotate: up.R.lower },
          'hand.L': { rotate: [-25 * h, 0, 0] },
          'hand.R': { rotate: [-25 * h, 0, 0] },
          'leg.L': { rotate: [6 * h, 0, 0] },
          'leg.R': { rotate: [6 * h, 0, 0] },
          tail1: { rotate: [14 * h, 22 * wt, 0] },
          tail2: { rotate: [4 * h, -30 * wt, 0] },
          tail3: { rotate: [0, 40 * wt, 0] },
        };
      },
    });

    // Death: the blow knocks it back, it staggers and wobbles, then it tips over backward and flops
    // onto its back with the legs and arms in the air. The tail sweeps around its right side and
    // goes limp on the ground. The tail directions are set in world space (orient), so the tail
    // stays on the floor while the body turns over.
    const TAIL_DIR: R3[] = [0, 1, 2].map((i) => {
      const a = T_BONES[i]!;
      const b = T_BONES[i + 1]!;
      return [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    });
    const TAIL_YAW = TAIL_DIR.map((d) => Math.atan2(d[0], d[2]) / DEG); // top-view angle, 0 = +Z
    const TAIL_SLOPE = TAIL_DIR.map((d) => d[1] / Math.hypot(d[0], d[1], d[2]));
    const LIE_YAW = [-20, -55, -95]; // lying: toward the feet, curling to the rat's right
    const LIE_SLOPE = [-0.03, 0, 0];
    const UP: R3 = [0, 1, 0];
    const tailDir = (yaw: number, y: number): R3 => {
      const h = Math.sqrt(1 - Math.min(0.95, y * y));
      return [Math.sin(yaw * DEG) * h, y, Math.cos(yaw * DEG) * h];
    };
    const mix = (a: number, b: number, t: number) => a + (b - a) * t;
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const r = kf(p, [[0, 0], [0.07, 1], [0.2, 0.55], [0.32, 0.25], [0.42, 0]]); // the recoil
        const sag = kf(p, [[0.1, 0], [0.24, 1], [0.34, 0.7], [0.42, 0]]); // the knees give way
        const wob = kf(p, [[0.08, 0], [0.17, 1], [0.27, -0.8], [0.36, 0.35], [0.42, 0]]);
        const wt = kf(p, [[0, 0], [0.06, 1], [0.15, -0.8], [0.25, 0.5], [0.35, -0.2], [0.44, 0]]);
        const u = Math.min(1, Math.max(0, (p - 0.34) / 0.28)); // the fall speeds up to the impact at 0.62
        const tilt = 90 * u * u;
        const bounce = kf(p, [[0.62, 0], [0.67, 1], [0.75, 0]]);
        const lie = kf(p, [[0.36, 0], [0.62, 1]]); // the limbs go up
        const flail = kf(p, [[0.62, 0], [0.68, 1], [0.75, -0.6], [0.81, 0.3], [0.87, 0]]);
        const sweep = kf(p, [[0.38, 0], [0.72, 1]]);
        const flop = kf(p, [[0.6, 0], [0.66, 1], [0.76, 0]]);
        const L = (a: number, b: number) => mix(a, b, lie);
        const up = armsUp(Math.min(1, r + 0.4 * sag));

        const hipsR: R3 = [-8 * r + 5 * sag - tilt + 5 * bounce, 0, 6 * wob];
        const down = Math.sin(tilt * DEG);
        const tail = (i: number, parents: R3[], whip: number, lift: number) =>
          orient(
            parents,
            { dir: TAIL_DIR[i]!, up: UP },
            {
              dir: tailDir(mix(TAIL_YAW[i]!, LIE_YAW[i]!, sweep) + whip, mix(TAIL_SLOPE[i]!, LIE_SLOPE[i]!, down) + lift),
              up: UP,
            },
          ) as R3;
        const t1 = tail(0, [hipsR], 25 * wt, 0.06 * r);
        const t2 = tail(1, [hipsR, t1], -35 * wt, 0.3 * flop);
        const t3 = tail(2, [hipsR, t1, t2], 45 * wt, 0.4 * flop);
        return {
          hips: { move: [0, -0.01 * sag - 0.02 * lie + 0.02 * bounce, -0.03 * r - 0.05 * sweep], rotate: hipsR },
          spine: { rotate: [-6 * r + 4 * sag, 0, -4 * wob], scale: [1 - 0.03 * r, 1 + 0.02 * r, 1 - 0.04 * r] },
          chest: { rotate: [-10 * r + 5 * sag, 0, -5 * wob] },
          neck: { rotate: [-4 * r - 15 * lie, 0, 0] },
          head: { rotate: [-10 * r + 8 * sag - 18 * lie - 8 * bounce, 25 * lie, 8 * wob + 6 * r] },
          // The arms fly up and out beside the head at the blow, flail, and end raised with the claws curled.
          'upperarm.L': { rotate: [L(up.L.upper[0], -35) - 15 * flail, L(up.L.upper[1], 0), L(up.L.upper[2] + 6 * wob, 25) + 10 * flail] },
          'upperarm.R': { rotate: [L(up.R.upper[0], -35) + 12 * flail, L(up.R.upper[1], 0), L(up.R.upper[2] + 6 * wob, -25) - 10 * flail] },
          'forearm.L': { rotate: [L(up.L.lower[0], 5) - 15 * flail, L(up.L.lower[1], 0), L(up.L.lower[2], 0)] },
          'forearm.R': { rotate: [L(up.R.lower[0], 5) + 15 * flail, L(up.R.lower[1], 0), L(up.R.lower[2], 0)] },
          'hand.L': { rotate: [L(-25 * r, 25), 0, 0] },
          'hand.R': { rotate: [L(-25 * r, 25), 0, 0] },
          // The legs buckle, then swing up into the air with the soles up, and kick once.
          'leg.L': { rotate: [L(8 * r - 12 * sag, -50) - 12 * flail, 0, L(0, 15)] },
          'leg.R': { rotate: [L(8 * r - 12 * sag, -50) + 10 * flail, 0, L(0, -15)] },
          'shin.L': { rotate: [L(20 * sag, -40) + 12 * flail, 0, 0] },
          'shin.R': { rotate: [L(20 * sag, -40) - 10 * flail, 0, 0] },
          'foot.L': { rotate: [L(-8 * sag, 45), 0, 0] },
          'foot.R': { rotate: [L(-8 * sag, 45), 0, 0] },
          tail1: { rotate: t1 },
          tail2: { rotate: t2 },
          tail3: { rotate: t3 },
        };
      },
    });
  },
});
