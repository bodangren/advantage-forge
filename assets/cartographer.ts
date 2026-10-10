import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Cartographer — Chibi Quest wilderness NPC (catalog `npcs/wilderness/cartographer`), about 1.0 m to
 * the top of the hair, faces +Z. Target: docs/npc-mockups/cartographer_001.jpg. Built on the humanoid kind.
 *
 * Role: a map-maker NPC (sells maps, sends the player out to explore), seen in 3D and as a 128 px
 *   sprite; the raised brass dividers, the bundle of rolled maps, and the white beard must read.
 * One idea: a kind old map-maker, all white beard and round spectacles, who holds up brass dividers.
 * Shape language: round and soft (beard, hair locks, face), with the thin angular dividers as the
 *   one sharp form.
 * Palette (60/30/10): dark green #2f4a3a coat; brown #6b4a2c waistcoat, #4a3424 shoes; gray #6a6870
 *   trousers; white #e8e4dc hair and beard; brass #c8a040 (spectacles, buttons, dividers) as the accent.
 * Value plan: the white beard and hair against the dark green coat are the focal contrast; the brass
 *   dividers beside the head and the cream maps are the light accents.
 * Bodies: skin (smile), nose, brows, beard, hair, pencil, glasses, shirt, waistcoat, belt, coat, cuffs,
 *   brass, dividers, maps, string, pants, shoes.
 * Rig: the humanoid kind's skeleton and clips with a one-arm pose on each arm (the right arm raised,
 *   the left arm out at the chest); the dividers are rigid on `knife.R`, the maps on `knife.L`.
 */

// The arm poses (left-side values; the kind mirrors the right arm).
const POSE_R = { elbow: [0.25, 0.45, 0.02] as const, wrist: [0.33, 0.58, 0.04] as const };
const POSE_L = { elbow: [0.17, 0.335, 0.05] as const, wrist: [0.2, 0.33, 0.15] as const };

const C = {
  coat: '#2f4a3a',
  coatDark: '#233a2d',
  shirt: '#f0e6cc',
  vest: '#6b4a2c',
  vestButton: '#3a2818',
  brass: '#c8a040',
  pants: '#6a6870',
  shoe: '#4a3424',
  map: '#c9a468',
  mapShade: '#a88450',
  mapInside: '#8a6a3c',
  string: '#8a6a4a',
  belt: '#4e3422',
  pencil: '#d8a838',
  pencilTip: '#3a2c24',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

type V3 = readonly [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export default humanoidAsset({
  name: 'cartographer',
  description: 'A careful, kind old cartographer in a dark green coat and round spectacles, holding up brass dividers and a bundle of rolled maps.',
  reference: 'docs/npc-mockups/cartographer_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { white: '#e8e4dc', gray: '#a4a4aa', brown: '#5a301d', auburn: '#8e3b1c', black: '#231a17' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { forest: '#2f4a3a', plum: '#5a3a52', navy: '#2f3f5a', rust: '#7a4630' },
  },
  presets: {
    default: { skin: 'fair', hair: 'white', eyes: 'brown', cloth: 'forest' },
    sunny: { skin: 'tan', hair: 'gray', eyes: 'hazel', cloth: 'plum' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: C.shoe,
  lashes: false,
  pose: { L: POSE_L, R: POSE_R },

  // A calm warm smile (round corners, one tooth band) between the mustache and the beard; the
  // kind's straight brows are painted over with skin (the brows are separate bushy bodies).
  paintSkin(skin, h) {
    const y = 0.525;
    const grin = profile.polygon(
      [
        [-0.04, 0.011],
        [-0.02, 0.003],
        [0, 0.001],
        [0.02, 0.003],
        [0.04, 0.011],
        [0.032, -0.008],
        [0.016, -0.02],
        [0, -0.023],
        [-0.016, -0.02],
        [-0.032, -0.008],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.008))).intersect(sdf.box([0.046, 0.1, 1]).at(0, y, 0));
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y, EYE } = h.joints;
    const D = Math.PI / 180;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const coatColor = h.tint.shirt!;
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const fz = (x: number, y: number) => h.faceZ(Math.min(Math.abs(x), 0.15), y);

    // ------------------------------------------------------------------ the bigger nose (skin tint)
    const noseY = 0.562;
    const nose = sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.05, 0.047, 0.05]).at(0, noseY + 0.004, fz(0, noseY) + 0.016),
      pair(sdf.sphere(0.028).at(0.026, noseY - 0.012, fz(0, noseY) + 0.004)),
    );
    k.body('nose', nose.bone('head'), { color: h.tint.skin!, roughness: 0.55, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ spectacles: round brass rings
    const ring = (x: number) => {
      const e = 0.01;
      const dzdx = (h.faceZ(x + e, EYE[1]) - h.faceZ(x - e, EYE[1])) / (2 * e);
      const dzdy = (h.faceZ(x, EYE[1] + e) - h.faceZ(x, EYE[1] - e)) / (2 * e);
      return sdf
        .torus(0.064, 0.0085)
        .rotateX(90)
        .rotateX(Math.atan(dzdy) / D)
        .rotateY(Math.atan2(-dzdx, 1) / D)
        .at(x, EYE[1] + 0.002, h.faceZ(x, EYE[1]) + 0.01);
    };
    const zB = h.faceZ(0.04, 0.64) + 0.012;
    const bridge = sdf.capsule([-0.046, 0.646, zB], [0.046, 0.646, zB], 0.0085);
    const xo = EYE[0] + 0.062;
    const temple = sdf.capsule([xo, 0.636, h.faceZ(xo, 0.636) + 0.006], [0.204, 0.636, 0.0], 0.0085);
    const glasses = sdf.union(ring(EYE[0]), ring(-EYE[0]), bridge, pair(temple)).bone('head');
    k.body('glasses', glasses, { color: '#1e1b1c', roughness: 0.4, metalness: 0.1, detail: 0.003 });

    // ------------------------------------------------------------------ bushy white brows
    const brow = (s: 1 | -1) => {
      const y = 0.72;
      const z = (x: number) => fz(x, y) - 0.012;
      const p = (x: number, dy: number, r: number): [number, number, number, number] => [s * x, y + dy, z(x), r];
      return sdf.chain([p(0.155, -0.012, 0.014), p(0.125, 0.004, 0.02), p(0.09, 0.016, 0.022), p(0.055, 0.012, 0.018), p(0.035, 0.002, 0.012)], 0.012);
    };
    k.body('brows', sdf.union(brow(1), brow(-1)).bone('head'), { color: hairColor, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ the beard and the mustache
    // The beard follows the jaw: a shell of the head below the lip line, a rounded bib at the chin, and
    // a ring of soft lobes along the edge. A gap at the mouth shows the smile.
    const jawRound = h.head.round(0.016);
    const lower = jawRound
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.49))
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, -1], -0.0))
      .smoothIntersect(0.02, sdf.halfSpace([0, 1, 0], 0.565));
    const sideburn = pair(
      sdf.chain(
        [
          [0.175, 0.64, 0.06, 0.02],
          [0.185, 0.6, 0.05, 0.026],
          [0.18, 0.56, 0.07, 0.03],
          [0.15, 0.51, 0.1, 0.032],
        ],
        0.015,
      ),
    );
    const bib = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.1, 0.075, 0.07]).at(0, 0.472, 0.1),
      sdf.ellipsoid([0.07, 0.07, 0.05]).at(0, 0.44, 0.095),
      sdf.sphere(0.05).at(0.075, 0.485, 0.11),
      sdf.sphere(0.05).at(-0.075, 0.485, 0.11),
      sdf.ellipsoid([0.05, 0.06, 0.04]).at(0, 0.42, 0.098),
    );
    const mouthGap = sdf.ellipsoid([0.056, 0.03, 0.1]).at(0, 0.527, 0.2);
    const beardCore = sdf.smoothUnion(0.02, lower, bib, sideburn).smoothSubtract(0.008, mouthGap);
    const lobes = sdf.union(
      ...[
        [-0.12, 0.49, 0.1, 0.03],
        [0.12, 0.49, 0.1, 0.03],
        [-0.075, 0.455, 0.14, 0.032],
        [0.075, 0.455, 0.14, 0.032],
        [0, 0.43, 0.14, 0.035],
        [-0.04, 0.395, 0.12, 0.03],
        [0.04, 0.395, 0.12, 0.03],
        [0, 0.38, 0.115, 0.027],
      ].map(([x, y, z, r]) => sdf.sphere(r!).at(x!, y!, z!)),
    );
    const beardAll = sdf.smoothUnion(0.02, beardCore, lobes).smoothSubtract(0.008, mouthGap);
    // The mustache: two thick curled lobes that sweep out from under the nose.
    const stache = (s: 1 | -1) => {
      const y = 0.553;
      const z = (x: number) => fz(x, y) + 0.004;
      return sdf.chain(
        [
          [s * 0.006, y, z(0.006), 0.014],
          [s * 0.03, y - 0.002, z(0.03), 0.02],
          [s * 0.062, y + 0.002, z(0.062) - 0.004, 0.019],
          [s * 0.086, y + 0.012, z(0.086) - 0.012, 0.012],
        ],
        0.012,
      );
    };
    const beard = sdf.smoothUnion(0.014, beardAll, stache(1), stache(-1)).smoothSubtract(0.006, sdf.ellipsoid([0.05, 0.024, 0.1]).at(0, 0.522, 0.2));
    k.body('beard', beard.bone('head'), {
      color: hairColor,
      roughness: 0.7,
      detail: 0.005,
      bump: (x, y, z) => 0.0035 * Math.sin(x * 70 + y * 90) * Math.cos(z * 80 + y * 30),
    });

    // ------------------------------------------------------------------ hair: a small cap and white locks
    // A bald crown with a topknot of locks, thick locks over each ear, and a row of locks at the nape.
    const hairShell = sdf.ellipsoid([0.211, 0.205, 0.197]);
    const sideCap = pair(
      hairShell
        .smoothIntersect(0.02, sdf.halfSpace([-1, 0, 0], -0.12))
        .smoothIntersect(0.02, sdf.halfSpace([0, 1, 0], 0.03))
        .smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0.04)),
    );
    const backCap = hairShell.smoothIntersect(0.02, sdf.halfSpace([0, 1, 0], 0.0)).smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.08)).smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], -0.035));
    const lockAt = (pts: number[][], r0 = 1): sdf.Shape =>
      sdf.chain(
        pts.map(([x, y, z, r]) => [x!, y!, z!, r! * r0] as [number, number, number, number]),
        0.012,
      );
    // Thick locks over each ear (front, middle, back), swept back and curling up at the ends.
    const earLocks = (s: 1 | -1) => [
      lockAt([[s * 0.176, 0.085, 0.07, 0.03], [s * 0.2, 0.05, 0.05, 0.034], [s * 0.206, 0.0, 0.03, 0.034], [s * 0.2, -0.03, 0.045, 0.028]]),
      lockAt([[s * 0.19, 0.06, 0.0, 0.034], [s * 0.21, 0.0, -0.02, 0.036], [s * 0.2, -0.04, -0.03, 0.03], [s * 0.185, -0.06, -0.01, 0.024]]),
      lockAt([[s * 0.17, 0.075, -0.08, 0.034], [s * 0.19, 0.02, -0.09, 0.034], [s * 0.17, -0.04, -0.12, 0.03], [s * 0.15, -0.065, -0.12, 0.022]]),
    ];
    // The nape: a row of swept locks.
    const napeLocks = [-0.14, -0.085, -0.03, 0.025, 0.08, 0.135].map((x, i) => {
      const len = [0.05, 0.035, 0.045, 0.03, 0.05, 0.04][i]!;
      const sw = [0.02, -0.015, 0.012, -0.02, 0.015, -0.01][i]!;
      return lockAt([
        [x, 0.045, -0.165, 0.036],
        [x * 0.97 + sw * 0.5, 0.0, -0.178, 0.034],
        [x * 0.93 + sw, -len * 0.5, -0.17, 0.028],
        [x * 0.9 + sw * 1.4, -len, -0.155, 0.018],
      ]);
    });
    // The crown: a soft cap that hugs the skull behind a receding hairline, swept back into the crest.
    const crownCap = hairShell
      .scale(1.012)
      .smoothIntersect(0.025, sdf.halfSpace([0, -0.87, 0.5], -0.05))
      .smoothIntersect(0.025, sdf.halfSpace([0, 1, 0], 0.25));
    const sweepLock = (x: number, z: number, ang: number, len: number) =>
      lockAt([
        [x, 0.165, z, 0.034],
        [x * 1.05 - ang * 0.3 * len, 0.195, z - 0.03 * len, 0.034],
        [x * 1.1 - ang * 0.7 * len, 0.2 - 0.02 * len, z - 0.075 * len, 0.03],
        [x * 1.15 - ang * len, 0.18 - 0.05 * len, z - 0.12 * len, 0.02],
      ]);
    const sweepLocks = [
      sweepLock(-0.1, 0.06, -0.06, 1),
      sweepLock(0.1, 0.06, 0.06, 1),
      sweepLock(-0.05, 0.03, -0.03, 1.2),
      sweepLock(0.05, 0.03, 0.03, 1.2),
      sweepLock(-0.13, -0.02, -0.07, 0.9),
      sweepLock(0.13, -0.02, 0.07, 0.9),
      sweepLock(0.0, 0.0, 0.0, 1.3),
    ];
    // The topknot: four swept locks that rise from the crown and curl forward.
    const topLock = (x: number, lean: number, h0: number) =>
      lockAt([
        [x, 0.178, -0.04, 0.03],
        [x * 1.4 + lean * 0.3, 0.205 + h0, -0.05, 0.034],
        [x * 1.7 + lean, 0.228 + h0, -0.01, 0.028],
        [x * 1.5 + lean * 1.6, 0.232 + h0, 0.04, 0.015],
      ]);
    const topLocks = [topLock(-0.04, -0.015, 0.0), topLock(0.0, 0.0, 0.018), topLock(0.04, 0.015, 0.004)];
    const tuftBase = sdf.sphere(0.05).at(0, 0.13, -0.04);
    const hairShape = headPose(
      sdf.smoothUnion(0.03, sideCap, backCap, ...earLocks(1), ...earLocks(-1), ...napeLocks, tuftBase, ...topLocks.map((l) => l.at(0, -0.055, 0))),
    ).bone('head');
    k.body('hair', hairShape, {
      color: hairColor,
      roughness: 0.65,
      detail: 0.005,
      bump: (x, y, z) => 0.0015 * Math.sin(y * 90 + x * 20) * Math.cos(z * 20),
    });

    // The pencil behind the right ear (x < 0), lying forward along the head and tilted up.
    const pBack: V3 = [-0.212, 0.655, -0.075];
    const pFront: V3 = [-0.222, 0.71, 0.03];
    const pencil = sdf.smoothUnion(0.004, sdf.capsule(pBack, pFront, 0.0105), sdf.cone(pFront, add(pFront, norm(sub(pFront, pBack)), 0.03), 0.0105, 0.0035));
    k.body('pencil', pencil.bone('head'), { color: C.pencil, roughness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ shirt, waistcoat, belt
    const shirt = sdf.union(h.weighted(h.torso.round(0.003)), sdf.torus(0.066, 0.018).scale([1, 1, 0.95]).at(0, 0.452, -0.012).bone('chest'));
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.85, detail: 0.004 });

    const vestShape = h.weighted(h.torso.round(0.009).intersect(sdf.halfSpace([0, -1, 0], -0.17)).intersect(sdf.halfSpace([0, 1, 0], 0.425)));
    const vestButtons = sdf.union(
      ...[0.205, 0.25, 0.3, 0.35, 0.395].map((y) => {
        const z = sdf.raycast(vestShape, [0, y, 1], [0, 0, -1])?.[2] ?? 0.1;
        return sdf.ellipsoid([0.011, 0.011, 0.006]).at(0, y, z + 0.0015);
      }),
    );
    k.body('waistcoat', vestShape.paintWhere(vestButtons, C.vestButton, 0.0015), { color: C.vest, roughness: 0.85, detail: 0.004 });

    const belt = h.weighted(h.torso.round(0.012).intersect(h.band(0.236, 0.266)));
    const buckle = sdf.box([0.05, 0.034, 0.016], 0.006).at(0, 0.251, sdf.raycast(h.torso.round(0.012), [0, 0.251, 1], [0, 0, -1])?.[2] ?? 0.1).bone('spine');
    k.body('belt', sdf.union(belt, buckle), { color: C.belt, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ coat: sleeves, an open front, a skirt to the thigh
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.018,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.12), j.ELBOW, 0.057, 0.05).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.78), 0.05, 0.046).bone('forearm.L'),
      ),
    );
    const cuff = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.7), lerp(j.ELBOW, j.WRIST, 1.0), 0.048, 0.044).round(0.002).bone('forearm.L'));
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.14, 0.3],
            [0.152, 0.26],
            [0.166, 0.21],
            [0.18, 0.17],
            [0.184, 0.14],
            [0, 0.14],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.84]);
    const opening = sdf
      .extrude(
        profile.polygon([
          [-0.052, 0.47],
          [0.052, 0.47],
          [0.04, 0.3],
          [0.032, 0.13],
          [-0.032, 0.13],
          [-0.04, 0.3],
        ]),
        0.4,
        0.004,
      )
      .at(0, 0, 0.2);
    const coatBody = sdf.smoothUnion(0.014, h.weighted(h.torso.round(0.02)), sleeve, h.weighted(skirt)).smoothSubtract(0.01, opening);
    const hem = h.band(0.14, 0.16);
    const coat = coatBody.paintWhere(hem, k.tint('cloth', { color: C.coatDark, follow: 1 }), 0.004);
    k.body('coat', coat, { color: coatColor, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.0025 * Math.sin(y * 80 + Math.atan2(x, z) * 10) });
    k.body('cuffs', cuff, { color: C.shirt, roughness: 0.9, detail: 0.004 });

    // The coat collar: a soft darker ring behind the neck, with a stand at the back.
    const collar = sdf.torus(0.07, 0.02).scale([1, 1, 0.95]).at(0, 0.45, -0.014).intersect(sdf.halfSpace([0, 0, -1], 0.01)).bone('chest');
    k.body('collar', collar, { color: C.vest, roughness: 0.85, detail: 0.004 });

    // Brass buttons on the coat front edges.
    const buttons = sdf.union(
      ...[0.31, 0.22].flatMap((y) =>
        [0.07, -0.07].map((x) => {
          const z = sdf.raycast(coatBody, [x, y, 1], [0, 0, -1])?.[2] ?? 0.1;
          return sdf.sphere(0.013).at(x, y, z + 0.003);
        }),
      ),
    );
    k.body('brass', buttons.bone('spine'), { color: C.brass, roughness: 0.35, metalness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ dividers in the right fist (x < 0)
    // Pointing along the forearm (up), a short handle, a round hinge, and two legs with needle points.
    const gR = h.arms.R.GRIP;
    const gripR: V3 = [-gR[0] + 0.02, gR[1] - 0.004, gR[2] - 0.008];
    const jR = h.arms.R;
    const axisR = norm(add(norm(sub([-jR.WRIST[0], jR.WRIST[1], jR.WRIST[2]], [-jR.ELBOW[0], jR.ELBOW[1], jR.ELBOW[2]])), [0.15, 1.1, 0.0]));
    const sideR = norm(cross(axisR, [0, 0, 1]));
    const hinge = add(gripR, axisR, 0.07);
    const leg = (s: 1 | -1) => {
      const a = 15 * D;
      const dir = norm(add([axisR[0] * Math.cos(a), axisR[1] * Math.cos(a), axisR[2] * Math.cos(a)], sideR, s * Math.sin(a)));
      const end = add(hinge, dir, 0.14);
      return sdf.smoothUnion(0.004, sdf.cone(hinge, add(hinge, dir, 0.1), 0.0115, 0.009), sdf.cone(add(hinge, dir, 0.09), end, 0.009, 0.0025));
    };
    const handle = sdf.cone(add(gripR, axisR, -0.05), hinge, 0.017, 0.013);
    const dividers = sdf.smoothUnion(0.006, handle, sdf.sphere(0.022).at(...hinge), leg(1), leg(-1));
    k.body('dividers', dividers, { color: C.brass, roughness: 0.3, metalness: 0.8, bone: 'knife.R', detail: 0.003 });

    // ------------------------------------------------------------------ the rolled maps in the left fist (x > 0)
    const gL = h.arms.L.GRIP;
    const aim = norm([-0.3, 1, 0.12]);
    const bundleAt = (s: sdf.Shape) => s.rotateX(Math.atan2(aim[2], aim[1]) / D).rotateZ(Math.atan2(-aim[0], aim[1]) / D).at(gL[0], gL[1], gL[2]);
    const rollR = 0.0215;
    const rollLen = 0.24;
    const roll = (x: number, z: number, sh: number) =>
      sdf
        .cylinder(rollR, rollLen, 0.008)
        .subtract(sdf.cylinder(rollR * 0.55, 0.06, 0.004).at(0, rollLen / 2 - 0.02, 0))
        .at(x, sh, z);
    const mapsLocal = sdf.union(roll(-0.02, 0.012, 0.0), roll(0.022, 0.012, 0.006), roll(0.0, -0.025, -0.006));
    const mapsPainted = bundleAt(mapsLocal)
      .paintWhere(bundleAt(sdf.cylinder(0.07, 0.03, 0).at(0, rollLen / 2 - 0.012, 0)), C.mapShade, 0.006)
      .paintWhere(bundleAt(sdf.cylinder(0.07, 0.03, 0).at(0, -rollLen / 2 + 0.012, 0)), C.mapShade, 0.006);
    k.body('maps', mapsPainted, { color: C.map, roughness: 0.9, bone: 'knife.L', detail: 0.003, bump: (x, y, z) => 0.002 * Math.sin(x * 120 + z * 60) });
    const stringLocal = sdf.union(sdf.torus(0.04, 0.0065).at(0, 0.03, 0.0), sdf.torus(0.04, 0.0065).at(0, 0.045, 0.0));
    k.body('string', bundleAt(stringLocal), { color: C.string, roughness: 0.9, bone: 'knife.L', detail: 0.003 });
  },
});
