import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Riverboat captain — Chibi Quest wilderness NPC (catalog `npcs/wilderness/riverboat-captain`), about
 * 1.0 m to the top of the captain cap, faces +Z. Target: docs/npc-mockups/riverboat-captain_001.jpg.
 * Built on the humanoid kind.
 *
 * Role: a river port NPC who runs the riverboat and gives travel and cargo quests, seen at the port
 *   and on the boat in 3D and as a 128 px sprite; the white beard, the navy cap with the gold anchor,
 *   and the brass spyglass held out must read.
 * One idea: a jolly round sea dog whose huge white beard and puffy navy cap frame a rosy laughing face,
 *   with a brass spyglass thrust out in one fist and the other fist on the hip.
 * Shape language: round and soft (belly, beard, cap crown), with the long spyglass as the one hard line.
 * Palette (60/30/10): navy #2a3450 (cap, coat) over a darker vest #1c2236, white #ece8e0 / #f6f1ea
 *   (hair, beard, collar, belt), trousers #4a4448, boots and visor #2a2428; accents gold #e0b040
 *   (badge, buttons, buckle) and brass #c8a040 (spyglass); skin #f2c7a4 with rosy cheeks.
 * Value plan: the white beard against the navy coat is the focal point; the gold buttons and the
 *   brass spyglass are the accents; dark boots and trousers anchor the body.
 * Bodies: skin (laugh, cheeks), hair, brows, beard, nose, cap, visor, badge, coat, vest, buttons, belt,
 *   collar, cuffs, trousers, boots, spyglass.
 * Rig: the humanoid kind's skeleton and clips; both arms keep a held pose; the spyglass is rigid on
 *   `knife.R`.
 */

const C = {
  white: '#f6f1ea',
  visor: '#2a2428',
  gold: '#e0b040',
  brass: '#c8a040',
  leather: '#2a2428',
  pants: '#4a4448',
  boot: '#2a2428',
  bootFold: '#3c3438',
  vest: '#17171d',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

// The laugh: corners up at +0.014, the bottom at -0.044 (relative to MOUTH_Y). The beard has a slot of
// the same shape, a little larger.
const MOUTH_Y = 0.54;
const GRIN = profile.polygon(
  [
    [-0.095, 0.014],
    [-0.05, 0.003],
    [0, 0],
    [0.05, 0.003],
    [0.095, 0.014],
    [0.08, -0.014],
    [0.045, -0.036],
    [0, -0.044],
    [-0.045, -0.036],
    [-0.08, -0.014],
  ],
  { smooth: true, samples: 6 },
);

export default humanoidAsset({
  name: 'riverboat-captain',
  description: 'A jolly, round riverboat captain with a big white beard and a navy cap, holding out a brass spyglass with one fist on his hip.',
  reference: 'docs/npc-mockups/riverboat-captain_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e' },
    hair: { white: '#ece8e0', silver: '#b8b4c4', brown: '#5a301d', black: '#231a17' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
    cloth: { navy: '#2a3450', teal: '#1f4a58', wine: '#5a2a38', moss: '#34503a' },
  },
  presets: {
    dusk: { skin: 'tan', hair: 'silver', eyes: 'green', cloth: 'wine' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: false,
  lashes: false,
  // Right fist out in front at chest height (the spyglass); left fist on the hip with the elbow out.
  pose: {
    R: { elbow: [0.19, 0.355, 0.04] as const, wrist: [0.24, 0.365, 0.14] as const },
    L: { elbow: [0.29, 0.33, -0.05] as const, wrist: [0.235, 0.255, 0.05] as const },
  },

  // A wide happy laugh (review 3: the old flat slot read as an angry rectangle): a crescent whose
  // corners turn up under the mustache, a white tooth band at the top, and a tongue.
  // The kind's smile and brows are painted over with skin (the beard and the white brows are bodies).
  paintSkin(skin, h) {
    const y = MOUTH_Y;
    const mouth = h.onFace(sdf.extrude(GRIN, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.014))).intersect(sdf.box([0.15, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.04, 0.014, 0.08]), 0, y - 0.034);
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.016, 238, 302), 0.3).at(0, 0.6, 0.1);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const rosy = h.onFace(sdf.sphere(0.04), 0.135, 0.545).mirror('x');
    return skin
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(rosy, h.tint.blush!, 0.02)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const pairHard = (s: sdf.Shape) => s.mirror('x', 0);
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const navy = h.tint.shirt ?? '#2a3450';
    const fz = (x: number, y: number) => h.faceZ(Math.min(Math.abs(x), 0.19), y);

    // ------------------------------------------------------------------ the captain cap
    // Built at the head's origin: a puffy navy crown wider than the head, a dark band, a short visor.
    const capPose = (s: sdf.Shape) => s.rotateX(-4).at(0, HEAD_Y, 0);
    const crown = sdf
      .smoothUnion(
        0.04,
        // Review 3: a lower, flatter crown (it was tall and puffy).
        sdf.ellipsoid([0.236, 0.13, 0.226]).at(0, 0.14, -0.005),
        sdf.ellipsoid([0.258, 0.05, 0.246]).at(0, 0.19, -0.01),
        sdf.ellipsoid([0.2, 0.04, 0.19]).at(0, 0.232, -0.01),
      )
      .intersect(sdf.halfSpace([0, -1, 0], -0.088));
    k.body('cap', capPose(crown).bone('head'), { color: navy, roughness: 0.8, detail: 0.005 });
    const bandOuter = sdf.ellipsoid([0.226, 0.175, 0.216]).at(0, 0.155, -0.005);
    const band = bandOuter.intersect(sdf.halfSpace([0, -1, 0], -0.07)).intersect(sdf.halfSpace([0, 1, 0], 0.122));
    // A clear glossy visor that reaches forward and tips down a little.
    const visor = sdf
      .ellipsoid([0.17, 0.014, 0.1])
      .rotateX(10)
      .at(0, 0.086, 0.195)
      .intersect(sdf.halfSpace([0, 0, -1], -0.07));
    k.body('visor', capPose(sdf.smoothUnion(0.012, band, visor)).bone('head'), { color: C.visor, roughness: 0.25, detail: 0.004 });

    // The gold anchor badge on the front of the crown, leaning with the slope.
    const slopeZ = (y: number) => sdf.raycast(crown, [0, y, 1], [0, 0, -1])?.[2] ?? 0.2;
    const by = 0.19;
    const lean = (Math.atan2(slopeZ(by - 0.03) - slopeZ(by + 0.03), 0.06) * 180) / Math.PI;
    const anchor = sdf
      .smoothUnion(
        0.003,
        sdf.torus(0.0105, 0.0048).rotateX(90).at(0, 0.034, 0),
        sdf.box([0.01, 0.062, 0.01], 0.003).at(0, 0.004, 0),
        sdf.box([0.04, 0.009, 0.01], 0.003).at(0, 0.02, 0),
        sdf.extrude(profile.arc(0.024, 0.009, 195, 345), 0.01).at(0, 0.004, 0),
      )
      .rotateX(-lean)
      .at(0, by, slopeZ(by) + 0.003);
    k.body('badge', capPose(anchor).bone('head'), { color: C.gold, roughness: 0.35, metalness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ white hair under the cap
    // A cap that hugs the skull at the back and the sides, a row of rounded nape tips, and locks at the temples.
    const skull = sdf.ellipsoid([0.214, 0.208, 0.2]).at(0, HEAD_Y + 0.004, -0.006);
    const backCap = skull
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.585))
      .smoothIntersect(0.02, sdf.halfSpace([0, 1, 0], 0.76))
      .smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.03));
    const napeTips = sdf.union(
      ...[-75, -56, -37, -19, 0, 19, 37, 56, 75].map((a) =>
        sdf.sphere(0.027).at(0.186 * Math.sin((a * Math.PI) / 180), 0.6 + 0.004 * Math.cos(a * 0.1), -0.006 - 0.17 * Math.cos((a * Math.PI) / 180)),
      ),
    );
    const temple = sdf.union(
      ...[-1, 1].flatMap((sx) =>
        [0, 1, 2].map((i) =>
          sdf.chain(
            [
              [sx * 0.186, 0.74, -0.02 + 0.03 * i, 0.024],
              [sx * 0.196, 0.68, -0.015 + 0.025 * i, 0.021],
              [sx * 0.2, 0.625 - 0.012 * i, -0.01 + 0.02 * i, 0.012],
            ],
            0.01,
          ),
        ),
      ),
    );
    k.body('hair', sdf.smoothUnion(0.014, backCap, napeTips, temple).bone('head'), {
      color: hairColor,
      roughness: 0.6,
      detail: 0.004,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });

    // ------------------------------------------------------------------ bushy white brows and a big round nose
    const brow = (x0: number, s: number) =>
      sdf.chain(
        [
          // Review 3: the inner ends rise and the outer ends fall, so the brows arch up (a happy look).
          [x0, 0.735, fz(x0, 0.735) + 0.008, 0.0105],
          [x0 + 0.04 * s, 0.743, fz(x0 + 0.04 * s, 0.743) + 0.009, 0.0125],
          [x0 + 0.08 * s, 0.738, fz(x0 + 0.08 * s, 0.738) + 0.006, 0.011],
          [x0 + 0.112 * s, 0.716, fz(x0 + 0.112 * s, 0.716) + 0.0, 0.0075],
        ],
        0.01,
      );
    k.body('brows', pairHard(brow(0.035, 1)).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.003 });
    const noseZ = fz(0, 0.585);
    // Review 3: a skin-pink nose with a soft red tint (the red ball read as a clown nose), a little
    // longer than wide, with two small nostril wings.
    const nose = sdf
      .smoothUnion(
        0.014,
        sdf.ellipsoid([0.04, 0.046, 0.04]).at(0, 0.592, noseZ + 0.01),
        sdf.sphere(0.018).at(0.025, 0.574, noseZ + 0.016),
        sdf.sphere(0.018).at(-0.025, 0.574, noseZ + 0.016),
      )
      .bone('head');
    const noseTint = k.tint('skin', { color: '#e8988a', follow: 0.6 });
    k.body('nose', nose, { color: noseTint, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the beard: a chin mass, side whiskers, a mustache, and locks
    const chinMass = sdf
      .ellipsoid([0.15, 0.09, 0.14])
      .at(0, 0.484, 0.05)
      .smoothIntersect(0.014, sdf.halfSpace([0, 1, 0], 0.494));
    const whiskers = pair(
      sdf.chain(
        [
          [0.187, 0.665, 0.05, 0.02],
          [0.192, 0.615, 0.06, 0.028],
          [0.178, 0.555, 0.08, 0.036],
          [0.135, 0.505, 0.11, 0.038],
          [0.085, 0.48, 0.13, 0.036],
        ],
        0.03,
      ),
    );
    const mustache = pair(
      sdf.chain(
        [
          // Review 3: full and round, with the ends curled up over the cheeks.
          [0.004, 0.572, fz(0.004, 0.572) + 0.018, 0.02],
          [0.045, 0.568, fz(0.045, 0.568) + 0.022, 0.024],
          [0.095, 0.575, fz(0.095, 0.575) + 0.016, 0.02],
          [0.132, 0.596, fz(0.132, 0.596) + 0.01, 0.014],
          [0.146, 0.622, fz(0.146, 0.622) + 0.006, 0.01],
        ],
        0.02,
      ),
    );
    const locks = sdf.union(
      ...[-0.115, -0.077, -0.038, 0, 0.038, 0.077, 0.115].map((x, i) => {
        const tip = 0.402 + 0.012 * Math.abs(Math.sin(i * 2.1 + 0.4)) - 0.012 * (1 - Math.abs(x) / 0.115);
        return sdf.chain(
          [
            [x, 0.485, 0.152 - Math.abs(x) * 0.25, 0.034],
            [x * 0.95, 0.44, 0.162 - Math.abs(x) * 0.3, 0.03],
            [x * 0.8, tip, 0.15 - Math.abs(x) * 0.3, 0.015],
          ],
          0.02,
        );
      }),
    );
    // The mouth slot: a clear opening between the mustache and the chin mass.
    const slot = sdf.extrude(profile.offsetProfile(GRIN, 0.006), 0.4).at(0, MOUTH_Y, 0.25);
    const beard = sdf.smoothUnion(0.02, chinMass, whiskers, mustache, locks).smoothSubtract(0.006, slot);
    k.body('beard', beard.bone('head'), {
      color: hairColor,
      roughness: 0.65,
      detail: 0.004,
      textureDensity: 1.5,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 70, y * 40, z * 70, 2),
    });

    // ------------------------------------------------------------------ the belly: the torso with a round front
    const belly = sdf.ellipsoid([0.19, 0.14, 0.17]).at(0, 0.26, 0.07);
    const body = h.torso.smoothUnion(0.05, belly);

    // The vest: a darker navy under the open coat, with two rows of gold buttons.
    const vestColor = k.tint('cloth', { color: C.vest, follow: 1 });
    const vestShape = body.round(0.004).intersect(h.band(0.232, 0.5));
    k.body('vest', h.weighted(vestShape), { color: vestColor, roughness: 0.8, detail: 0.005 });
    const buttons = sdf.union(
      ...[-1, 1].flatMap((sx) =>
        [0.375, 0.33, 0.285].map((y) => {
          const z = sdf.raycast(vestShape, [sx * 0.045, y, 1], [0, 0, -1])?.[2] ?? 0.14;
          return sdf.ellipsoid([0.012, 0.012, 0.008]).at(sx * 0.045, y, z + 0.002);
        }),
      ),
    );
    k.body('belly-pants', h.weighted(body.round(0.006).intersect(h.band(0.1, 0.236))), { color: C.pants, roughness: 0.85, detail: 0.005 });
    k.body('buttons', buttons.bone('chest'), { color: C.gold, roughness: 0.35, metalness: 0.6, detail: 0.003 });

    // The white belt and the gold buckle.
    const beltShape = body.round(0.01).intersect(h.band(0.232, 0.26));
    k.body('belt', h.weighted(beltShape), { color: C.white, roughness: 0.75, detail: 0.004 });
    const beltZ = sdf.raycast(body.round(0.01), [0, 0.246, 1], [0, 0, -1])?.[2] ?? 0.15;
    const buckle = sdf.box([0.06, 0.04, 0.014], 0.006).subtract(sdf.box([0.034, 0.018, 0.05])).at(0, 0.246, beltZ + 0.002);
    k.body('buckle', buckle.bone('hips'), { color: C.gold, roughness: 0.35, metalness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ the navy coat: open in front, to the thigh, long sleeves
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.26],
            [0.15, 0.26],
            [0.17, 0.2],
            [0.19, 0.15],
            [0.205, 0.12],
            [0, 0.12],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1.08, 1, 0.95]);
    const skirtInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.27],
            [0.136, 0.27],
            [0.156, 0.2],
            [0.176, 0.15],
            [0.191, 0.1],
            [0, 0.1],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1.08, 1, 0.93]);
    const skirt = skirtOuter.subtract(skirtInner);
    const bodyShell = body.round(0.022).subtract(body.round(0.008)).intersect(sdf.halfSpace([0, -1, 0], -0.2));
    const opening = sdf.box([0.19, 1, 0.5], 0.02).at(0, 0.3, 0.25);
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.15), j.ELBOW, 0.052, 0.05).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.9), 0.05, 0.048).bone('forearm.L'),
      ),
    );
    const coat = sdf.smoothUnion(0.01, h.weighted(bodyShell), h.weighted(skirt)).smoothSubtract(0.008, opening).intersect(sdf.halfSpace([0, -1, 0], -0.135));
    const coatAll = sdf.smoothUnion(0.012, coat, sleeve);
    k.body('coat', coatAll, { color: navy, roughness: 0.8, detail: 0.005 });

    // Big turned-up cuffs with a thin white edge, and the white shirt collar.
    const cuff = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.66), lerp(j.ELBOW, j.WRIST, 0.9), 0.059, 0.056).round(0.004).bone('forearm.L'));
    k.body('cuffs', cuff, { color: navy, roughness: 0.85, detail: 0.004 });
    const cuffEdge = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.88), lerp(j.ELBOW, j.WRIST, 0.95), 0.052, 0.051).round(0.002).bone('forearm.L'));
    const collar = sdf.torus(0.062, 0.017).at(0, 0.452, -0.012).bone('chest');
    k.body('white', sdf.union(cuffEdge, collar), { color: C.white, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ trousers and tall black boots with folded cuffs
    const bootShape = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.058, 0.046, 0.104]).at(0, 0.044, 0.044), sdf.cylinder(0.054, 0.12, 0.014).at(0, 0.055, 0))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootShape.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.014)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf.union(bootShape, sole.paint('#1a1416')).rotateY(8).at(ANKLE[0], 0, 0).bone('foot.L');
    const fold = sdf.cylinder(0.063, 0.034, 0.014).at(0, 0.098, 0).rotateY(8).at(ANKLE[0], 0, 0).bone('shin.L');
    k.body('boots', pairHard(boot), { color: C.boot, roughness: 0.6, detail: 0.005 });
    k.body('boot-folds', pairHard(fold), { color: C.bootFold, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ the brass spyglass in the right fist
    // Held by its leather wrap, pointing out to the right, up, and a little forward (the mockup).
    const gR = h.arms.R.GRIP;
    const G: [number, number, number] = [-gR[0], gR[1], gR[2]];
    const dv = [-0.62, 0.5, 0.6];
    const dl = Math.hypot(...dv);
    const d = dv.map((v) => v / dl) as [number, number, number];
    const at = (t: number): [number, number, number] => [G[0] + d[0] * t, G[1] + d[1] * t, G[2] + d[2] * t];
    const eyeCap = sdf.cone(at(-0.1), at(-0.07), 0.024, 0.021).round(0.003);
    const eyepiece = sdf.cone(at(-0.07), at(-0.035), 0.021, 0.021).round(0.002);
    const bandMid = sdf.cone(at(0.08), at(0.098), 0.0265, 0.0265).round(0.003);
    const bandNear = sdf.cone(at(-0.038), at(-0.02), 0.0255, 0.0255).round(0.003);
    const outer = sdf.cone(at(0.098), at(0.16), 0.024, 0.024).round(0.002);
    const bell = sdf.cone(at(0.16), at(0.185), 0.024, 0.03).round(0.002);
    const lip = sdf.cone(at(0.182), at(0.195), 0.03, 0.03).round(0.003);
    const hole = sdf.cone(at(0.17), at(0.21), 0.0215, 0.0215);
    const brass = sdf.smoothUnion(0.003, eyeCap, eyepiece, bandMid, bandNear, outer, bell, lip).smoothSubtract(0.002, hole);
    k.body('spyglass', brass, { color: C.brass, roughness: 0.35, metalness: 0.8, bone: 'knife.R', detail: 0.003 });
    const wrap = sdf.cone(at(-0.02), at(0.08), 0.0255, 0.0255).round(0.003);
    k.body('spyglass-wrap', wrap, { color: C.leather, roughness: 0.7, bone: 'knife.R', detail: 0.003, bump: (x, y, z) => 0.0012 * Math.sin((x * d[0] + y * d[1] + z * d[2]) * 420) });
    const lens = sdf.cone(at(0.168), at(0.176), 0.0215, 0.0215);
    k.body('spyglass-lens', lens, { color: '#14181c', roughness: 0.2, bone: 'knife.R', detail: 0.003 });
  },
});
