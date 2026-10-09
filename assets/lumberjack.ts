import { mixRgb, noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Lumberjack — Chibi Quest settlement NPC (catalog `npcs/settlement/lumberjack`), about 1.0 m to the
 * top of the beanie, faces +Z. Target: docs/npc-mockups/lumberjack_001.jpg. Built on the humanoid
 * kind (worked example: assets/baker.ts).
 *
 * Role: a forest camp NPC who sells wood and clears paths; seen in 3D and as a 128 px sprite. The big
 *   brown beard, the red plaid shirt, the gray beanie, and the steel axe head on the shoulder must read.
 * One idea: a big, friendly bearded woodsman, fists on his hips, with an axe resting on his shoulder.
 * Shape language: round and soft (beard, beanie, arms, boots), with the flat axe blade as the one hard form.
 * Palette (60/30/10): shirt #b03a3a with darker checks (the cloth slot); trousers #3f5a7a; beanie #7a7880;
 *   hair and beard #6b3e22; suspenders #6b4226; belt #4a2c1c; boots #5a3a24; axe handle #9a6a3a,
 *   head #a8acb4 (metalness 0.8); skin #f2c7a4.
 * Value plan: the dark beard under the gray beanie frames the light face; the red plaid chest is the
 *   largest color mass; the blue trousers and brown boots ground it; the steel blade is the accent.
 * Bodies: skin (grin), nose, beard, beanie, hair, shirt, cuffs, suspenders, belt, buckle, pants, boots,
 *   axe handle, axe head.
 * Rig: the humanoid kind's skeleton and clips with both arms posed on the hips. The axe is rigid on `chest`.
 */

const C = {
  beanie: '#7a7880',
  beanieCuff: '#8c8a92',
  suspender: '#6b4226',
  belt: '#4a2c1c',
  buckle: '#a8acb4',
  pants: '#5f6670',
  boot: '#5a3a24',
  bootCuff: '#6e4830',
  sole: '#2e1c12',
  handle: '#9a6a3a',
  steel: '#a8acb4',
  steelEdge: '#d4d8de',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

// Broad, burly arms: the elbows stand out wide (x 0.27) and the fists rest on the hips.
const HIP_POSE = { elbow: [0.27, 0.31, -0.04], wrist: [0.2, 0.255, 0.05] } as const;

export default humanoidAsset({
  name: 'lumberjack',
  description: 'A big, friendly lumberjack in a gray beanie, a brown beard, and a red plaid shirt, with an axe on his shoulder.',
  reference: 'docs/npc-mockups/lumberjack_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#6b3e22', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { red: '#b03a3a', ochre: '#c08a30', moss: '#4e6a34', plum: '#7a3f5f' },
  },
  presets: {
    camp: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'moss' },
  },
  pose: { L: HIP_POSE, R: HIP_POSE },
  lashes: false,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,

  // A big smile: a wide crescent with round corners, one band of teeth at the top, and a tongue.
  // The kind's brows are painted over with skin; thick arched brows and wide eyes read as friendly.
  paintSkin(skin, h) {
    const y = 0.522;
    const grin = profile.polygon(
      [
        [-0.05, 0.014],
        [-0.028, 0.004],
        [0, 0.0],
        [0.028, 0.004],
        [0.05, 0.014],
        [0.042, -0.012],
        [0.022, -0.028],
        [0, -0.033],
        [-0.022, -0.028],
        [-0.042, -0.012],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.012))).intersect(sdf.box([0.06, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.024, 0.012, 0.08]), 0, y - 0.026);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.02, 55, 125), 0.3).at(0.1, 0.658, 0.1).mirror('x');
    const eye = (rx: number, ry: number, dy = 0) => h.onFace(sdf.ellipsoid([rx, ry, 0.07]), 0.105, 0.63 + dy).mirror('x');
    const shine = sdf.union(...[0.105, -0.105].map((x) => h.onFace(sdf.sphere(0.012), x + 0.017, 0.65)));
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.016, 236, 304), 0.3).at(0, 0.6, 0.1);
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(eye(0.056, 0.06), '#2a1a12', 0.002)
      .paintWhere(eye(0.052, 0.056), '#f6f1ea', 0.002)
      .paintWhere(eye(0.035, 0.045, -0.003), '#2e1a10', 0.002)
      .paintWhere(eye(0.031, 0.041, -0.004), h.tint.iris!, 0.002)
      .paintWhere(eye(0.02, 0.026, 0), '#141a18', 0.002)
      .paintWhere(shine, '#ffffff', 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth, 0.002)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');

    // ------------------------------------------------------------------ the beanie: a slouched cap and a folded cuff
    const hatPose = (s: sdf.Shape) => s.rotateX(-7).at(0, HEAD_Y, 0);
    const below = (y: number) => sdf.halfSpace([0, -1, 0], -y); // solid above y
    const cap = sdf
      .smoothUnion(0.04, sdf.ellipsoid([0.224, 0.24, 0.21]), sdf.sphere(0.07).at(0, 0.19, -0.08))
      .intersect(below(0.05));
    const cuffBand = sdf.ellipsoid([0.236, 0.27, 0.222]).smoothIntersect(0.012, sdf.box([0.6, 0.06, 0.6]).at(0, 0.08, 0));
    const beanie = hatPose(sdf.smoothUnion(0.012, cap, cuffBand))
      .bone('head')
      .paintWhere(hatPose(sdf.box([0.6, 0.064, 0.6]).at(0, 0.08, 0)), C.beanieCuff, 0.003);
    k.body('beanie', beanie, {
      color: C.beanie,
      roughness: 0.95,
      detail: 0.005,
      bump: (x, y, z) => 0.004 * Math.sin(Math.atan2(x, z) * 46) * (y > HEAD_Y + 0.09 ? 1 : 0.5),
    });

    // The hair under the beanie: a soft cap at the back that ends in rounded lock tips at the nape,
    // and short locks at the temples beside the face.
    const hairShell = sdf.ellipsoid([0.214, 0.208, 0.198]);
    const lockAt = (a: number, y0: number, y1: number, r: number) => {
      const sa = Math.sin((a * Math.PI) / 180);
      const ca = Math.cos((a * Math.PI) / 180);
      return sdf.chain(
        [
          [0.18 * sa, y0, -0.16 * ca, r + 0.006],
          [0.186 * sa, (y0 + y1) / 2, -0.17 * ca, r + 0.002],
          [0.178 * sa, y1, -0.164 * ca, r - 0.004],
        ],
        0.012,
      );
    };
    const tips = sdf.union(...[-81, -63, -45, -27, -9, 9, 27, 45, 63, 81].map((a, i) => lockAt(a, 0.0, -0.09 - 0.014 * (i % 2), 0.03)));
    const sideLocks = sdf.union(
      ...[0, 1].map((i) =>
        pair(
          sdf.chain(
            [
              [0.186, 0.06, 0.05 - 0.03 * i, 0.03],
              [0.19, 0.01, 0.045 - 0.03 * i, 0.026],
              [0.186, -0.04 - 0.01 * i, 0.03 - 0.03 * i, 0.019],
            ],
            0.01,
          ),
        ),
      ),
    );
    const back = hairShell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.06)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const temples = hairShell
      .smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], 0.02))
      .smoothIntersect(0.015, sdf.halfSpace([-1, 0, 0], -0.15).mirror('x'))
      .smoothIntersect(0.015, sdf.halfSpace([0, 0, 1], 0.11));
    const hairBack = hatPose(sdf.smoothUnion(0.015, back, tips, temples, sideLocks)).bone('head');
    k.body('hair', hairBack, { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ the beard and the nose
    // The lower face grown outward, cut below the nose, with a pocket for the smile, a hanging chin
    // tuft, and a thick mustache. Own body on the head bone.
    const jaw = h.head.round(0.012).smoothIntersect(0.02, sdf.halfSpace([0, 1, 0], 0.548));
    const beardLock = (a: number, y1: number, r: number) => {
      const sa = Math.sin((a * Math.PI) / 180);
      const ca = Math.cos((a * Math.PI) / 180);
      return sdf.chain(
        [
          [0.19 * sa, 0.55, 0.03 + 0.15 * ca, r - 0.004],
          [0.195 * sa, 0.52, 0.03 + 0.158 * ca, r + 0.004],
          [0.17 * sa, y1, 0.03 + 0.15 * ca, 0.012],
        ],
        0.012,
      );
    };
    const beardLocks = [-82, -64, -46, -30, 30, 46, 64, 82].map((a, i) => beardLock(a, 0.47 + 0.018 * (i % 2) - 0.012 * (1 - Math.abs(a) / 90), 0.028));
    const tuft = [-13, 0, 13].map((a, i) =>
      sdf.chain(
        [
          [0.17 * Math.sin((a * Math.PI) / 180), 0.49, 0.155 - (i === 1 ? 0 : 0.012), 0.026],
          [0.17 * Math.sin((a * Math.PI) / 180), 0.45, 0.15, 0.026],
          [0.14 * Math.sin((a * Math.PI) / 180), 0.415 + (i === 1 ? -0.012 : 0.008), 0.135, 0.02],
        ],
        0.014,
      ),
    );
    const mustache = pair(
      sdf.chain(
        [
          [0.008, 0.553, 0.205, 0.022],
          [0.04, 0.55, 0.198, 0.02],
          [0.072, 0.538, 0.178, 0.016],
        ],
        0.01,
      ),
    );
    const pocket = sdf.ellipsoid([0.066, 0.034, 0.12]).at(0, 0.518, 0.2);
    const beardShape = sdf.smoothUnion(0.012, jaw, mustache, ...beardLocks, ...tuft).smoothSubtract(0.008, pocket).bone('head');
    k.body('beard', beardShape, {
      color: hairColor,
      roughness: 0.8,
      detail: 0.005,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 70, y * 90, z * 70, 2),
    });
    const ear = pair(
      sdf
        .ellipsoid([0.032, 0.052, 0.038])
        .subtract(sdf.sphere(0.019).at(0.018, 0, 0.008))
        .rotateY(-12)
        .at(0.208, 0.612, -0.01),
    ).bone('head');
    k.body('ears', ear, { color: k.tint('skin'), roughness: 0.55, detail: 0.004 });
    const noseZ = h.faceZ(0, 0.585);
    const nose = sdf.ellipsoid([0.046, 0.043, 0.044]).at(0, 0.578, noseZ + 0.018).bone('head');
    k.body('nose', nose, { color: k.tint('skin', { color: '#ea9a86', follow: 0.5 }), roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the plaid shirt, sleeves rolled to the elbow
    // A broad chest and a round belly: the hero torso grown wider (as in the brewer's shirt).
    const wide = (sh: sdf.Shape) => sh.scale([1.22, 1, 1.18]);
    const wideTorso = wide(h.torso);
    const belly = sdf.ellipsoid([0.13, 0.08, 0.112]).at(0, 0.295, 0.008);
    // Short plaid sleeves that end above the elbow, with a rolled cuff band; the forearms are bare.
    const sleeves = h.perArm((j) => sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), lerp(SHOULDER, j.ELBOW, 0.62), 0.066, 0.061).bone('upperarm.L'));
    const shirtBody = sdf
      .smoothUnion(0.012, h.weighted(sdf.smoothUnion(0.04, wideTorso.round(0.01), belly).smoothIntersect(0.01, below(0.24))), sleeves)
      .paintFn((x, y, z, base) => {
        const arm = Math.abs(x) > 0.175; // on a sleeve the checks run along and around the arm
        const a = Math.floor(x / 0.042) & 1;
        const b = arm ? Math.floor(Math.atan2(z + 0.02, y - 0.36) / 0.68) & 1 : Math.floor(y / 0.042) & 1;
        return a && b ? mixRgb(base, [0, 0, 0], 0.8) : a || b ? mixRgb(base, [0, 0, 0], 0.4) : base;
      });
    k.body('shirt', shirtBody, { color: k.tint('cloth'), roughness: 0.88, detail: 0.005 });
    const collar = sdf.torus(0.066, 0.018).at(0, 0.452, -0.012).bone('chest');
    const rolls = h.perArm((j) =>
      sdf.cone(lerp(SHOULDER, j.ELBOW, 0.55), lerp(SHOULDER, j.ELBOW, 0.71), 0.07, 0.07).round(0.007).bone('upperarm.L'),
    );
    k.body('cuffs', sdf.union(collar, rolls), { color: k.tint('cloth', -0.25), roughness: 0.9, detail: 0.004 });

    // Strong bare arms: thick skin shapes over the kind arms, on the same bones, with big fists.
    const strongArms = h.perArm((j) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone(SHOULDER, j.ELBOW, 0.056, 0.052).bone('upperarm.L'),
        sdf.cone(j.ELBOW, j.WRIST, 0.054, 0.045).bone('forearm.L'),
        sdf.sphere(0.045).at(...lerp(j.WRIST, j.GRIP, 0.5)).bone('hand.L'),
      ),
    );
    k.body('arms', strongArms, { color: k.tint('skin'), roughness: 0.55, detail: 0.005 });

    // ------------------------------------------------------------------ suspenders, belt, and buckle
    const shell = wideTorso.round(0.017).subtract(wideTorso.round(0.006));
    const straps = pair(sdf.box([0.034, 0.215, 0.6]).at(0.092, 0.352, 0)).intersect(shell).bone('chest');
    k.body('suspenders', straps, { color: C.suspender, roughness: 0.7, detail: 0.004 });
    const belt = h.weighted(h.torso.scale([1.1, 1, 1.07]).round(0.016).intersect(h.band(0.236, 0.266)));
    k.body('belt', belt, { color: C.belt, roughness: 0.65, detail: 0.004 });
    const beltZ = sdf.raycast(h.torso.scale([1.1, 1, 1.07]).round(0.016), [0, 0.251, 1], [0, 0, -1])![2];
    const buckle = sdf
      .box([0.058, 0.04, 0.014], 0.006)
      .subtract(sdf.box([0.034, 0.02, 0.05], 0.004))
      .at(0, 0.251, beltZ + 0.003)
      .bone('spine');
    k.body('buckle', buckle, { color: C.buckle, roughness: 0.4, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ gray work trousers and heavy boots
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.06).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.11, 0.002], 0.058, 0.062).bone('shin.L'),
    );
    const waist = h.weighted(h.torso.round(0.006).intersect(sdf.halfSpace([0, 1, 0], 0.25)));
    const trousers = sdf
      .smoothUnion(0.02, sdf.ellipsoid([0.1, 0.045, 0.085]).at(0, 0.205, 0).bone('hips'), waist, pair(trouserLeg))
      .paintWhere(sdf.box([0.006, 0.2, 0.6]).at(0, 0.17, 0), '#3e444c', 0.002); // the fly seam
    k.body('pants', trousers, {
      color: C.pants,
      roughness: 0.88,
      detail: 0.005,
    });
    const boot = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.063, 0.052, 0.108]).at(0, 0.05, 0.045),
        sdf.cylinder(0.058, 0.1, 0.02).at(0, 0.08, -0.002),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootCuff = sdf.cylinder(0.066, 0.046, 0.016).at(0, 0.138, -0.002);
    const bootAll = sdf
      .smoothUnion(0.008, boot, bootCuff)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.02), C.sole)
      .paintWhere(sdf.box([0.4, 0.05, 0.4]).at(0, 0.138, 0), C.bootCuff, 0.004)
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(bootAll), { color: C.boot, roughness: 0.65, detail: 0.005 });

    // ------------------------------------------------------------------ the axe on the right shoulder
    // Local frame: the origin at the middle of the cutting edge, +X along the handle (0.62 m), the
    // blade in the XY plane. The head sits in front of the shoulder, the handle lies over the shoulder
    // and down behind the neck.
    const blade = sdf
      .extrude(
        profile.polygon([
          [0, 0.14],
          [0.018, 0.07],
          [0.018, -0.07],
          [0, -0.14],
          [0.12, -0.1],
          [0.22, -0.055],
          [0.22, 0.055],
          [0.12, 0.1],
        ]),
        0.034,
        0.004,
      )
      .round(0.002);
    const socket = sdf.box([0.07, 0.11, 0.062], 0.015).at(0.19, 0, 0);
    const headShape = sdf.smoothUnion(0.01, blade, socket).paintWhere(sdf.box([0.024, 0.4, 0.3]).at(0.004, 0, 0), C.steelEdge, 0.004);
    // The handle starts inside the socket (the head hides its end).
    const handleShape = sdf.capsule([0.19, 0, 0], [0.68, 0, 0], 0.0185).smoothUnion(0.01, sdf.sphere(0.026).at(0.68, 0, 0));
    const P0: [number, number, number] = [-0.52, 0.475, -0.05];
    const axePose = (s: sdf.Shape) => s.rotateZ(-1).rotateY(6).at(...P0);
    k.body('axe-handle', axePose(handleShape).bone('chest'), {
      color: C.handle,
      roughness: 0.75,
      detail: 0.004,
      bump: (x, y, z) => 0.002 * Math.sin(z * 120 + y * 30 + Math.sin(x * 22)),
    });
    k.body('axe-head', axePose(headShape).bone('chest'), { color: C.steel, roughness: 0.38, metalness: 0.8, detail: 0.004 });
  },
});
