import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Merchant — Chibi Quest settlement NPC (catalog `npcs/settlement/merchant`), about 1.0 m to the top
 * of the cap, faces +Z. Target: docs/npc-mockups/merchant_001.jpg. Built on the humanoid kind.
 *
 * Role: a market NPC who sells goods, seen at the stalls in 3D and as a 128 px sprite; the soft
 *   burgundy cap, the big black beard, the orange sash, and the coin purse must read.
 * One idea: a plump, beaming trader whose black beard and orange sash sit on a teal coat, with a fat
 *   leather purse of gold held out in his left hand.
 * Shape language: round and soft (cap, belly, beard, puffy sleeves, purse), the flared coat hem as the
 *   one wide form.
 * Palette (60/30/10): coat teal #2f7a7a with gold #e0b040 trim; sash #e08a3a; cap #7a2e3a; cream
 *   #f0e6d0 (shirt, sleeves); hair and beard #231a17; boots and trousers #5a3a24; purse #8a5a35.
 * Value plan: the dark beard against the light face and cream shirt is the focal point; the orange
 *   sash and the gold coins are the accents.
 * Bodies: skin (open smile, thick brows), cap, hair, beard, mustache, coat, shirt, sleeves, sash,
 *   pants, boots, trims, purse, cord, coins.
 * Rig: the humanoid kind's skeleton and clips. The purse is rigid on `knife.L` (the left grip).
 */

const C = {
  cap: '#7a2e3a',
  capBand: '#5e2230',
  cream: '#f0e6d0',
  scarfFold: '#d8c8a8',
  lapel: '#2c3f66',
  gold: '#e0b040',
  sash: '#e08a3a',
  sashFold: '#c06a28',
  boot: '#5a3a24',
  pants: '#6b4430',
  purse: '#8a5a35',
  mouth: '#7a2a28',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'merchant',
  description: 'A plump, smiling market merchant in a long teal coat and a wide orange sash, holding up a fat coin purse.',
  reference: 'docs/npc-mockups/merchant_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { sage: '#4d7a66', teal: '#2f7a7a', plum: '#6a3a62', ochre: '#9a6a2a' },
  },
  presets: {
    dune: { skin: 'tan', hair: 'brown', eyes: 'hazel', cloth: 'ochre' },
  },
  hair: false,
  lashes: false,
  // The left arm is held out in front at chest height with the coin pouch; the right arm keeps the clips.
  pose: { L: { elbow: [0.18, 0.37, 0.07], wrist: [0.215, 0.405, 0.19] } },
  undershirt: false,
  pants: false,
  shoes: false,

  // A wide, happy open mouth under the mustache, and thick arched brows over the kind's thin ones.
  paintSkin(skin, h) {
    const y = 0.522;
    const grin = profile.polygon(
      [
        [-0.056, 0.016],
        [-0.028, 0.008],
        [0, 0.006],
        [0.028, 0.008],
        [0.056, 0.016],
        [0.046, -0.016],
        [0.024, -0.036],
        [0, -0.042],
        [-0.024, -0.036],
        [-0.046, -0.016],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const tongue = h.onFace(sdf.ellipsoid([0.026, 0.013, 0.08]), 0, y - 0.03);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.008))).intersect(sdf.box([0.08, 0.1, 1]).at(0, y, 0));
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(mouth, C.mouth)
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

    // ------------------------------------------------------------------ cap: a soft, round beret
    const capPose = (s: sdf.Shape) => s.rotateZ(17).rotateX(-6).at(-0.015, HEAD_Y + 0.022, 0);
    const bandShape = sdf.cylinder(0.198, 0.055, 0.02).at(0, 0.075, 0).scale([1, 1, 0.97]);
    const crown = sdf.smoothUnion(
      0.04,
      sdf.ellipsoid([0.255, 0.075, 0.23]).at(0.0, 0.15, 0),
      sdf.ellipsoid([0.19, 0.06, 0.17]).at(-0.05, 0.178, -0.01),
    );
    const nub = sdf.sphere(0.016).at(0.0, 0.232, -0.01);
    const cap = capPose(sdf.smoothUnion(0.03, crown, bandShape, nub)).bone('head');
    k.body('cap', cap, {
      color: C.cap,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * Math.sin(x * 70 + z * 50) * Math.cos(y * 60),
    });

    // ------------------------------------------------------------------ hair: temples, nape, and a curl
    const skull = sdf.ellipsoid([0.216, 0.21, 0.2]);
    // A full cap under the hat (the hat covers the overlap), the back down to the nape, and a short
    // sideburn at each temple that joins the beard.
    const top = skull.smoothIntersect(0.03, sdf.halfSpace([0, -1, 0], -0.078));
    const back = sdf
      .ellipsoid([0.216, 0.16, 0.205])
      .at(0, -0.01, -0.008)
      .smoothIntersect(0.05, sdf.halfSpace([0, 0, 1], 0.02));
    const burn = pair(sdf.cone([0.188, 0.08, 0.09], [0.194, -0.1, 0.07], 0.034, 0.026));
    const curl = sdf.smoothUnion(
      0.012,
      sdf.sphere(0.026).at(-0.02, 0.07, 0.172),
      sdf.sphere(0.028).at(0.016, 0.075, 0.172),
      sdf.sphere(0.02).at(0, 0.098, 0.162),
    );
    const hair = sdf.smoothUnion(0.03, top, back, burn, curl).at(0, HEAD_Y, 0).bone('head'); // not tilted with the cap
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ beard and mustache (own bodies)
    const beardBlob = sdf.smoothUnion(
      0.04,
      sdf.ellipsoid([0.17, 0.095, 0.135]).at(0, 0.485, 0.07),
      sdf.ellipsoid([0.13, 0.06, 0.1]).at(0, 0.46, 0.1),
    );
    const cheekFur = pair(sdf.ellipsoid([0.05, 0.08, 0.1]).rotateZ(-8).at(0.17, 0.51, 0.05));
    const mouthCut = sdf.box([0.2, 0.07, 0.4]).at(0, 0.522, 0.2);
    mouthCut.round(0);
    const beard = sdf
      .smoothUnion(0.03, beardBlob, cheekFur)
      .subtract(mouthCut)
      .subtract(h.head.round(-0.012))
      .bone('head');
    // The beard is solid round the jaw: add it back under the face by blending with the head's chin.
    const beardFull = sdf.smoothUnion(0.02, beard, sdf.ellipsoid([0.13, 0.04, 0.09]).at(0, 0.5, 0.06).subtract(mouthCut).bone('head'));
    k.body('beard', beardFull, {
      color: hairColor,
      roughness: 0.65,
      detail: 0.005,
      bump: (x, y) => 0.004 * Math.sin(x * 170) * (y < 0.5 ? 1 : 0.4),
    });

    const mz = (x: number, y: number) => h.faceZ(x, y) + 0.008;
    const stache = pair(
      sdf.chain(
        [
          [0.004, 0.545, mz(0.004, 0.545), 0.018],
          [0.04, 0.54, mz(0.04, 0.54), 0.02],
          [0.082, 0.526, mz(0.082, 0.526) - 0.006, 0.016],
          [0.1, 0.542, mz(0.1, 0.542) - 0.012, 0.013],
        ],
        0.01,
      ).bone('head'),
    );
    k.body('mustache', stache, { color: hairColor, roughness: 0.65, detail: 0.004 });
    const browPair = pair(
      sdf.chain(
        [
          [0.05, 0.714, mz(0.05, 0.714) - 0.004, 0.012],
          [0.1, 0.716, mz(0.1, 0.716) - 0.01, 0.016],
          [0.15, 0.69, mz(0.15, 0.69) - 0.03, 0.012],
        ],
        0.01,
      ).bone('head'),
    );
    k.body('brows', browPair, { color: hairColor, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ cream shirt, scarf, and puffy sleeves
    const belly = sdf.smoothUnion(0.05, h.torso, sdf.ellipsoid([0.16, 0.115, 0.135]).at(0, 0.235, 0.03));
    const shirt = h.weighted(belly.round(0.004));
    // The scarf: a thick roll at the neck and a bunched drape that shows below the beard.
    const scarf = sdf
      .smoothUnion(
        0.025,
        sdf.torus(0.072, 0.034).scale([1, 1, 0.9]).at(0, 0.452, 0.012),
        sdf.ellipsoid([0.1, 0.055, 0.065]).at(0, 0.375, 0.088),
        sdf.ellipsoid([0.05, 0.05, 0.04]).rotateZ(25).at(0.055, 0.395, 0.1),
      )
      .paintWhere(sdf.ellipsoid([0.012, 0.06, 0.1]).rotateZ(-18).at(-0.03, 0.375, 0.1), C.scarfFold, 0.01)
      .paintWhere(sdf.ellipsoid([0.012, 0.05, 0.1]).rotateZ(20).at(0.03, 0.375, 0.1), C.scarfFold, 0.01)
      .bone('chest');
    const sleeves = h.perArm((j) => {
      const puffUpper = sdf.cone(lerp(SHOULDER, j.ELBOW, 0.7), lerp(j.ELBOW, j.WRIST, 0.1), 0.055, 0.062).bone('forearm.L');
      const puffFore = sdf.smoothUnion(0.03, puffUpper, sdf.cone(lerp(j.ELBOW, j.WRIST, 0.05), lerp(j.ELBOW, j.WRIST, 0.82), 0.062, 0.058).bone('forearm.L'));
      const cuff = sdf.cone(lerp(j.ELBOW, j.WRIST, 0.78), lerp(j.ELBOW, j.WRIST, 1.0), 0.05, 0.045).round(0.003).bone('forearm.L');
      return sdf.smoothUnion(0.012, puffFore, cuff);
    });
    k.body('shirt', sdf.smoothUnion(0.012, shirt, scarf, sleeves), { color: C.cream, roughness: 0.9, detail: 0.005 });

    // ------------------------------------------------------------------ coat: long, open at the front, flared hem, gold trim
    // The bell starts below the sash and ends just above the knee, wide enough for the legs to swing inside.
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.23],
            [0.15, 0.23],
            [0.164, 0.21],
            [0.18, 0.195],
            [0.198, 0.18],
            [0.206, 0.168],
            [0, 0.168],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.95])
      .round(0.008);
    const coatCore = sdf.smoothUnion(0.03, belly.round(0.017), skirt);
    const vOpen = profile.polygon([
      [-0.075, 0.5],
      [0.075, 0.5],
      [0.05, 0.3],
      [0.046, 0.1],
      [-0.046, 0.1],
      [-0.05, 0.3],
    ]);
    const cutter = sdf.extrude(vOpen, 0.4).at(0, 0, 0.24);
    const trimZone = sdf.extrude(profile.offsetProfile(vOpen, 0.022), 0.6).at(0, 0, 0.3);
    const coatSleeves = h.perArm((j) => sdf.cone(SHOULDER, lerp(SHOULDER, j.ELBOW, 0.8), 0.066, 0.064).bone('upperarm.L'));
    const coat = sdf
      .smoothSubtract(0.008, h.weighted(coatCore), cutter)
      .paintWhere(trimZone, C.gold, 0.003)
      .paintWhere(h.band(0.1, 0.184), C.gold, 0.003);
    k.body('coat', sdf.smoothUnion(0.014, coat, coatSleeves), { color: h.tint.shirt!, roughness: 0.85, detail: 0.005 });

    // The lapels: dark blue folds along the V of the coat.
    const lapel = pair(
      sdf
        .cone([0.082, 0.468, 0.065], [0.05, 0.325, 0.105], 0.04, 0.03)
        .round(0.004)
        .bone('chest'),
    );
    k.body('lapel', lapel, { color: C.lapel, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ the wide orange sash and its knot
    const sashShell = belly
      .round(0.036)
      .subtract(belly.round(0.008))
      .smoothIntersect(0.012, sdf.box([0.7, 0.087, 0.7], 0.02).at(0, 0.2435, 0));
    const sash = sdf
      .smoothUnion(
        0.012,
        h.weighted(sashShell),
        sdf.ellipsoid([0.06, 0.05, 0.04]).rotateZ(-20).at(-0.09, 0.245, 0.185).bone('spine'),
        sdf.capsule([-0.095, 0.24, 0.195], [-0.13, 0.15, 0.19], 0.027).bone('spine'),
        sdf.capsule([-0.08, 0.24, 0.2], [-0.06, 0.148, 0.21], 0.024).bone('spine'),
      )
      .paintWhere(h.band(0.2, 0.213), C.sashFold, 0.004)
      .paintWhere(h.band(0.274, 0.287), C.sashFold, 0.004);
    k.body('sash', sash, { color: C.sash, roughness: 0.8, detail: 0.005 });

    // ------------------------------------------------------------------ trousers and boots
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.1, 0.002], 0.048, 0.046).bone('shin.L'),
    );
    k.body('pants', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), {
      color: C.pants,
      roughness: 0.85,
    });
    const boot = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.058, 0.044, 0.105]).at(0, 0.042, 0.042),
        sdf.sphere(0.052).at(0, 0.055, -0.005),
        sdf.cylinder(0.053, 0.05, 0.015).at(0, 0.098, 0.002),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.65, detail: 0.004 });
    const strap = sdf.torus(0.055, 0.009).at(ANKLE[0], 0.098, 0.002).bone('shin.L');
    const buckle = sdf.box([0.024, 0.026, 0.012], 0.004).at(ANKLE[0] + 0.0, 0.098, 0.057).bone('shin.L');
    k.body('boot-trim', pair(sdf.union(strap.paint(C.boot), buckle.paint(C.gold))), { color: C.gold, roughness: 0.5, metalness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ the cloth coin pouch, held out in the left fist
    // Built in its own frame (the mouth up), tilted forward, and hung from the posed grip so the fist
    // closes on its gathered neck.
    const G = h.arms.L.GRIP;
    const purseAt = (s: sdf.Shape) => s.scale(1.25).rotateX(32).at(G[0] + 0.004, G[1] - 0.048, G[2] + 0.008);
    const sack = sdf
      .smoothUnion(
        0.035,
        sdf.ellipsoid([0.06, 0.05, 0.056]).at(0, 0, 0),
        sdf.cone([0, 0.025, 0], [0, 0.072, 0], 0.04, 0.034),
        sdf.ellipsoid([0.024, 0.018, 0.02]).at(0.03, -0.012, 0.035), // a soft fold on the side
      )
      .smoothUnion(0.014, sdf.torus(0.036, 0.013).at(0, 0.074, 0))
      .subtract(sdf.sphere(0.03).at(0, 0.086, 0));
    k.body('purse', purseAt(sack).bone('knife.L'), {
      color: C.purse,
      roughness: 0.95,
      detail: 0.004,
      bump: (x, y, z) => 0.003 * Math.sin(Math.atan2(x, z) * 9) * (y > 0 ? 1 : 0.4) + 0.0015 * Math.sin(y * 120),
    });
    const bow = sdf.union(
      sdf.torus(0.037, 0.0075).at(0, 0.05, 0),
      sdf.ellipsoid([0.02, 0.009, 0.012]).rotateZ(35).at(0.03, 0.05, 0.03),
      sdf.ellipsoid([0.02, 0.009, 0.012]).rotateZ(-35).at(0.05, 0.036, 0.035),
      sdf.capsule([0.036, 0.047, 0.032], [0.05, 0.01, 0.04], 0.0065),
      sdf.capsule([0.032, 0.047, 0.036], [0.026, 0.008, 0.052], 0.0065),
    );
    const coin = (x: number, y: number, z: number, tilt: number, roll: number) =>
      sdf.cylinder(0.025, 0.01, 0.003).rotateX(tilt).rotateZ(roll).at(x, y, z);
    const coins = sdf.union(coin(0, 0.074, 0.004, 8, 0), coin(-0.012, 0.082, -0.006, -22, 18), coin(0.014, 0.083, 0.012, 28, -14));
    k.body('purse-gold', purseAt(sdf.union(bow, coins)).bone('knife.L'), {
      color: C.gold,
      roughness: 0.35,
      metalness: 0.8,
      detail: 0.004,
    });
  },
});
