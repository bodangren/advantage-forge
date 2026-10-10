import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Masked agent — Chibi Quest court-and-faction NPC (catalog `npcs/court-and-faction/masked-agent`),
 * about 1.0 m to the top of the hood, faces +Z. Target: docs/npc-mockups/masked-agent_001.jpg.
 * Built on the humanoid kind (the ranger guide's hood, cloak, and arm pose; the courier's letter).
 *
 * Role: a hidden NPC who passes secret tips and starts mystery quests (playful, never scary), seen in
 *   alleys and at the masked ball, in 3D and as a 128 px sprite; the white mask and the letter must read.
 * One idea: a friendly spy whose white half mask with gold edges and a sealed letter stand out of a deep
 *   purple hood and cloak over dark, fitted clothes.
 * Shape language: round and soft (hood, bob, boots), with the flat envelope as the one hard form.
 * Palette (60/30/10): cloak #4a2a6a; jacket #3a3c44, trousers, boots, gloves #231a20; mask #f6f1ea with
 *   #e0b040 edges; letter #f0e6cc with a #6a3a8a seal; silver buttons #c8ccd4.
 * Value plan: the white mask over the dark bob is the focal point; the purple hood frames it; the cream
 *   letter is the second accent.
 * Bodies: skin (gloved hands painted), hood, hair, mask, jacket, cuffs, buttons, cloak, boots, letter, seal.
 * Rig: the humanoid kind's skeleton and clips; the left arm holds the letter out (rigid on `knife.L`).
 */

const C = {
  hair: '#231a17',
  mask: '#f6f1ea',
  gold: '#e0b040',
  jacket: '#3a3c44',
  cuff: '#6a6c76',
  button: '#c8ccd4',
  dark: '#231a20',
  bootCuff: '#3a2e36',
  paper: '#f0e6cc',
  fold: '#cdbd94',
  seal: '#6a3a8a',
  glove: '#231a20',
  mouth: '#a4503f',
};

const POSE = {
  L: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] },
  // The free (right) hand: raised to the chin (left-side coordinates, the kind mirrors it).
  R: { elbow: [0.2, 0.37, 0.09], wrist: [0.15, 0.5, 0.19] },
} as const;

export default humanoidAsset({
  name: 'masked-agent',
  description: 'A friendly masked agent in a deep purple hooded cloak and a white half mask, holding out a sealed secret letter.',
  reference: 'docs/npc-mockups/masked-agent_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { plum: '#4a2a6a', wine: '#6a2a46', indigo: '#32306a', teal: '#2a4a58' },
  },
  presets: {
    ember: { skin: 'tan', hair: 'brown', eyes: 'hazel', cloth: 'wine' },
  },
  hair: false,
  undershirt: false,
  pants: C.dark,
  shoes: false,
  pose: { L: POSE.L, R: POSE.R },

  // A sly, friendly smile: the kind's crescent plus a dimple dot at the viewer's right corner.
  paintSkin(skin, h) {
    const dimple = h.onFace(sdf.extrude(profile.circle(0.007), 0.3), 0.066, 0.575);
    const smirk = h.onFace(sdf.extrude(profile.arc(0.03, 0.01, 235, 300), 0.3), 0.038, 0.585);
    // Black gloves: both fists and wrists.
    const hand = (s: { WRIST: readonly number[]; GRIP: readonly number[] }, sx: number) => [
      sdf.sphere(0.066).at(sx * s.GRIP[0]!, s.GRIP[1]!, s.GRIP[2]!),
      sdf.sphere(0.042).at(sx * s.WRIST[0]!, s.WRIST[1]!, s.WRIST[2]!),
    ];
    const gloves = sdf.union(...hand(h.arms.L, 1), ...hand(h.arms.R, -1));
    return skin.paintWhere(sdf.union(dimple, smirk), h.tint.mouth ?? C.mouth, 0.002).paintWhere(gloves, C.glove, 0.004);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const rad = Math.PI / 180;
    const cloakColor = h.tint.shirt ?? '#4a2a6a';
    const hairColor = k.tint('hair', { color: C.hair, follow: 1 });
    const bump = (x: number, y: number, z: number) => 0.002 * Math.sin(x * 60 + z * 50) * Math.cos(y * 45);

    // ------------------------------------------------------------------ hood (on the head bone)
    const hoodOuter = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.26, 0.25, 0.255]).at(0, HEAD_Y + 0.02, -0.02),
      sdf.chain(
        [
          [0, HEAD_Y + 0.2, -0.06, 0.07],
          [0, HEAD_Y + 0.25, -0.12, 0.08],
          [0, HEAD_Y + 0.25, -0.2, 0.06],
          [0, HEAD_Y + 0.23, -0.27, 0.04],
          [0, HEAD_Y + 0.2, -0.1, 0.05],
          [0, HEAD_Y + 0.17, -0.2, 0.06],
          [0, HEAD_Y + 0.1, -0.285, 0.05],
          [0, HEAD_Y + 0.05, -0.34, 0.024],
          [0, HEAD_Y + 0.0, -0.25, 0.085],
          [0, HEAD_Y - 0.09, -0.22, 0.08],
          [0, HEAD_Y - 0.17, -0.18, 0.075],
        ],
        0.04,
      ),
    );
    const faceOpening = sdf.ellipsoid([0.215, 0.2, 0.42]).at(0, HEAD_Y - 0.03, 0.17);
    const hood = sdf.smoothSubtract(0.02, hoodOuter.subtract(h.head.round(0.014)), faceOpening).round(0.006).bone('head');
    k.body('hood', hood, { color: cloakColor, roughness: 0.9, detail: 0.006, bump });

    // ------------------------------------------------------------------ hair: a sleek bob with a straight fringe
    const skull = (az: number, el: number, grow: number): [number, number, number] => {
      const a = az * rad;
      const e = el * rad;
      return [(0.205 + grow) * Math.cos(e) * Math.sin(a), HEAD_Y + (0.2 + grow) * Math.sin(e), (0.19 + grow) * Math.cos(e) * Math.cos(a)];
    };
    const lock = (az: number, el0: number, el1: number, r0: number, grow = 0.012) => {
      const pts: [number, number, number, number][] = [];
      for (let i = 0; i <= 4; i++) {
        const t = i / 4;
        const [x, y, z] = skull(az, el0 + (el1 - el0) * t, grow + 0.004 * Math.sin(t * Math.PI));
        pts.push([x, y, z, r0 * (1 - 0.3 * t)]);
      }
      return sdf.chain(pts, 0.012);
    };
    const fringe = [-78, -64, -50, -36, -22, -8, 8, 22, 36, 50, 64, 78].map((az) => lock(az, 80, 16 + 0.12 * Math.abs(az), 0.028));
    const sideLocks = [-1, 1].flatMap((s) => [
      lock(s * 86, 70, -38, 0.03),
      lock(s * 100, 60, -44, 0.03),
      lock(s * 114, 50, -42, 0.03),
    ]);
    const cap = sdf.ellipsoid([0.21, 0.205, 0.195]).at(0, HEAD_Y + 0.003, -0.004).smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -(HEAD_Y + 0.07)).smoothUnion(0.05, sdf.halfSpace([0, 0, 1], -0.03)));
    // The back of the bob: a rounded sheet to chin height, behind the ears.
    const backBob = sdf
      .ellipsoid([0.218, 0.2, 0.2])
      .at(0, HEAD_Y - 0.06, -0.01)
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], -0.01))
      .smoothIntersect(0.02, sdf.halfSpace([0, 1, 0], HEAD_Y + 0.02))
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -(HEAD_Y - 0.15)));
    const hair = sdf.smoothUnion(0.012, cap, backBob, ...fringe, ...sideLocks).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.55, detail: 0.006 });

    // ------------------------------------------------------------------ the half mask (own body on the head bone)
    const outline = profile.polygon(
      [
        [-0.2, 0.715],
        [-0.14, 0.765],
        [-0.065, 0.745],
        [0, 0.725],
        [0.065, 0.745],
        [0.14, 0.765],
        [0.2, 0.715],
        [0.205, 0.62],
        [0.18, 0.555],
        [0.115, 0.535],
        [0.06, 0.55],
        [0.03, 0.572],
        [0, 0.578],
        [-0.03, 0.572],
        [-0.06, 0.55],
        [-0.115, 0.535],
        [-0.18, 0.555],
        [-0.205, 0.62],
      ],
      { smooth: true, samples: 6 },
    );
    const region = sdf.extrude(outline, 0.8).intersect(sdf.halfSpace([0, 0, -1], -0.02));
    // Hard mirror (k = 0): a blended mirror bridges the two eye holes and opens the middle of the mask.
    const hard = (x: sdf.Shape) => x.mirror('x', 0);
    const holes = hard(sdf.ellipsoid([0.05, 0.047, 0.4]).at(h.joints.EYE[0], h.joints.EYE[1] + 0.001, 0.1));
    const rings = hard(sdf.ellipsoid([0.059, 0.056, 0.4]).at(h.joints.EYE[0], h.joints.EYE[1] + 0.001, 0.1)).subtract(holes);
    const edge = sdf.extrude(outline, 0.8).subtract(sdf.extrude(profile.offsetProfile(outline, -0.007), 0.8));
    const bridgeZ = sdf.raycast(h.head, [0, 0.6, 1], [0, 0, -1])?.[2] ?? 0.19;
    const bridge = sdf.ellipsoid([0.03, 0.036, 0.024]).at(0, 0.592, bridgeZ + 0.004);
    const mask = sdf
      .smoothUnion(0.01, h.head.round(0.016).subtract(h.head.round(-0.004)), bridge)
      .intersect(region)
      .subtract(holes)
      .paintWhere(sdf.union(rings, edge), C.gold, 0.0015)
      .bone('head');
    k.body('mask', mask, { color: C.mask, roughness: 0.45, detail: 0.004 });

    // ------------------------------------------------------------------ fitted jacket, sleeves, collar
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.048, 0.044).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.86), 0.044, 0.041).bone('forearm.L'),
      ),
    );
    const body = h.torso.round(0.012).intersect(sdf.halfSpace([0, -1, 0], -0.17));
    k.body('jacket', sdf.smoothUnion(0.012, h.weighted(body), sleeves), { color: C.jacket, roughness: 0.8, detail: 0.004 });

    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.7), lerp(j.ELBOW, j.WRIST, 0.99), 0.046, 0.047).round(0.002).bone('forearm.L'));
    const collar = sdf.torus(0.062, 0.018).at(0, 0.452, -0.012).bone('chest');
    k.body('cuffs', sdf.union(cuffs, collar), { color: C.cuff, roughness: 0.85, detail: 0.004 });

    // Two columns of silver buttons on the chest, placed on the torso surface.
    const btn = (x: number, y: number) => {
      const z = sdf.raycast(h.torso, [x, y, 1], [0, 0, -1])![2];
      return sdf.sphere(0.0125).at(x, y, z + 0.006);
    };
    const buttons = sdf.union(...[0.405, 0.335, 0.265].flatMap((y) => [btn(0.045, y), btn(-0.045, y)])).bone('chest');
    k.body('buttons', buttons, { color: C.button, roughness: 0.3, metalness: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ cloak: a back drape and a shoulder mantle
    const cloakProfile = (grow: number, bottom = 0.05) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.48],
              [0.09 + grow, 0.47],
              [0.15 + grow, 0.43],
              [0.18 + grow, 0.37],
              [0.2 + grow, 0.28],
              [0.225 + grow, 0.19],
              [0.235 + grow, 0.14],
              [0.25 + grow, 0.1],
              [0.265 + grow, 0.06],
              [0.265 + grow, bottom],
              [0, bottom],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.9]);
    const cloakShell = cloakProfile(0.014).subtract(cloakProfile(-0.01, 0.01)).intersect(sdf.halfSpace([0, -1, 0], -0.06));
    // Back folds that deepen toward the hem, and a thicker hem rim.
    const folds = (x: number, y: number, z: number) => {
      const depth = Math.min(1, Math.max(0, (0.4 - y) / 0.25));
      return Math.sin(Math.atan2(x, -z) * 8) * depth;
    };
    const hem = cloakProfile(0.024)
      .subtract(cloakProfile(-0.01, 0.01))
      .intersect(sdf.halfSpace([0, -1, 0], -0.06))
      .intersect(sdf.halfSpace([0, 1, 0], 0.09));
    const drape = h.weighted(cloakShell.union(hem).intersect(sdf.halfSpace([0, 0, 1], 0.0)).displace(0.007, folds));
    const mantle = cloakShell.intersect(sdf.halfSpace([0, -1, 0], -0.345)).subtract(sdf.box([0.1, 0.2, 0.2], 0.02).at(0, 0.37, 0.17));
    k.body('cape', sdf.smoothUnion(0.015, drape, mantle.bone('chest')), { color: cloakColor, roughness: 0.9, detail: 0.006, bump });

    // ------------------------------------------------------------------ soft black boots with a folded cuff
    const bootBase = sdf.smoothUnion(0.03, sdf.cylinder(0.052, 0.07, 0.018).at(0, 0.06, 0), sdf.ellipsoid([0.058, 0.05, 0.1]).at(0, 0.046, 0.046));
    const bootLeg = sdf.smoothUnion(
      0.012,
      sdf.cone([ANKLE[0], 0.128, 0.0], [ANKLE[0], 0.07, 0.002], 0.052, 0.049).bone('shin.L'),
      bootBase.intersect(sdf.halfSpace([0, -1, 0], 0)).rotateY(10).at(ANKLE[0], 0, 0).bone('foot.L'),
    );
    const sole = bootBase
      .round(0.004)
      .intersect(sdf.halfSpace([0, 1, 0], 0.014))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L')
      .paint('#120c10');
    k.body('boots', pair(sdf.union(bootLeg, sole)), { color: C.dark, roughness: 0.6 });
    const bootCuff = sdf.cylinder(0.058, 0.026, 0.01).at(ANKLE[0], 0.116, 0.0).subtract(sdf.cylinder(0.044, 0.04).at(ANKLE[0], 0.116, 0.0)).bone('shin.L');
    k.body('bootCuffs', pair(bootCuff), { color: C.bootCuff, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ the sealed letter (left hand, knife.L)
    const gl = h.arms.L.GRIP;
    const W = 0.14;
    const H2 = 0.1;
    const inHand = (s: sdf.Shape) => s.rotateZ(-14).rotateX(-6).rotateY(-18).at(gl[0] + 0.035, gl[1] + 0.06, gl[2] + 0.03);
    const border = sdf.box([W + 0.1, H2 + 0.1, 0.3]).subtract(sdf.box([W - 0.012, H2 - 0.012, 0.3]));
    const flapOuter = profile.polygon([[-W / 2 + 0.004, H2 / 2 - 0.002], [W / 2 - 0.004, H2 / 2 - 0.002], [0, -0.004]]);
    const flapInner = profile.polygon([[-W / 2 + 0.014, H2 / 2 - 0.008], [W / 2 - 0.014, H2 / 2 - 0.008], [0, 0.007]]);
    const flapLine = sdf.extrude(flapOuter, 0.3).subtract(sdf.extrude(flapInner, 0.3)).intersect(sdf.box([1, 1, 0.2]).at(0, 0, 0.1));
    const letter = sdf
      .box([W, H2, 0.016], 0.004)
      .paintWhere(border, C.gold, 0.0015)
      .paintWhere(flapLine, C.fold, 0.0015);
    k.body('letter', inHand(letter).bone('knife.L'), { color: C.paper, roughness: 0.8, detail: 0.003 });
    const lobes = [0, 72, 144, 216, 288].map((a) => sdf.sphere(0.011).at(0.014 * Math.cos(a * rad), 0.014 * Math.sin(a * rad), 0));
    const sealShape = sdf.smoothUnion(0.006, sdf.cylinder(0.015, 0.012, 0.003).rotateX(90), ...lobes).at(0, 0.0, 0.015);
    k.body('seal', inHand(sealShape).bone('knife.L'), { color: C.seal, roughness: 0.4, detail: 0.003 });
  },
});
