import { profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Gardener — Chibi Quest settlement NPC (catalog `npcs/settlement/gardener`), about 1.0 m to the top
 * of the straw hat, faces +Z. Target: docs/npc-mockups/gardener_001.jpg. Built on the humanoid kind.
 *
 * Role: a village and castle garden NPC, seen in 3D and as a 128 px sprite; the wide hat, the white
 *   beard, the green overalls, and the watering can must read.
 * One idea: a friendly old man under a huge straw hat, with a white beard that fills his chest, and a
 *   green watering can that hangs low in his hand.
 * Shape language: round and soft (hat, beard, can), with the overalls bib as the one boxy form.
 * Palette (60/30/10): dark green #3f5e44 (overalls), straw #d8b870 (hat), white #f0ece4 (beard, hair);
 *   yellow #e0c050 checks #c8a040 (shirt); brown #5a3a24 (boots); can green #3f6a4a (the accent).
 * Value plan: the white beard under the straw hat is the focal point; the dark overalls frame the yellow
 *   shirt; the green can balances the hat on the other side.
 * Bodies: skin (brows), hat, band, hair, beard, shirt, overalls, pocket, trowel, boots, can, rose.
 * Rig: the humanoid kind's skeleton and clips. The can is rigid on `knife.L` (the left grip).
 */

const C = {
  straw: '#cba46a',
  band: '#34502f',
  hair: '#f0ece4',
  shirt: '#e0c050',
  check: '#c8a040',
  plaid: '#7a5a28',
  nose: '#e48a62',
  teeth: '#fbf6ee',
  tongue: '#d8706a',
  pocket: '#4a6a4a',
  trowel: '#a8acb4',
  handle: '#8a5a35',
  boot: '#5a3a24',
  sole: '#3a2416',
  can: '#3f6a4a',
  rose: '#2f4f3a',
  mouth: '#8a2e2a',
};

export default humanoidAsset({
  name: 'gardener',
  description: 'A friendly old gardener in a wide straw hat and green overalls, holding a watering can.',
  reference: 'docs/npc-mockups/gardener_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { white: '#f0ece4', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { forest: '#46583a', clay: '#7a5236', denim: '#46607a', plum: '#6a4a68' },
  },
  presets: {
    sunny: { skin: 'tan', hair: 'silver', eyes: 'green', cloth: 'denim' },
  },
  hair: false,
  lashes: false,
  pose: { L: { elbow: [0.185, 0.33, 0.03], wrist: [0.205, 0.258, 0.065] } },
  undershirt: false,
  pants: false,
  shoes: false,

  // The kind's brows are painted over with skin, and a wide open grin with one white tooth band is
  // painted under the mustache; the cheeks are red.
  paintSkin(skin, h) {
    const y = 0.522;
    const grin = profile.polygon(
      [
        [-0.052, 0.014],
        [-0.028, 0.004],
        [0, 0.0],
        [0.028, 0.004],
        [0.052, 0.014],
        [0.042, -0.012],
        [0.022, -0.028],
        [0, -0.033],
        [-0.022, -0.028],
        [-0.042, -0.012],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.004))).intersect(sdf.box([0.06, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.024, 0.012, 0.08]), 0, y - 0.026);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const cheeks = h.onFace(sdf.sphere(0.05), 0.145, 0.562).mirror('x');
    const ears = sdf.sphere(0.048).at(0.203, 0.61, -0.01).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(ears, h.tint.blush!, 0.02)
      .paintWhere(cheeks, h.tint.blush!, 0.03)
      .paintWhere(mouth, C.mouth, 0.002)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const GRIP = h.arms.L.GRIP;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const cloth = h.tint.shirt ?? '#46583a';

    // ------------------------------------------------------------------ straw hat: a dome and a wide brim
    const hatPose = (s: sdf.Shape) => s.rotateX(-6).at(0, HEAD_Y + 0.02, 0);
    const crownRound = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.31],
            [0.09, 0.305],
            [0.16, 0.28],
            [0.205, 0.225],
            [0.222, 0.15],
            [0.228, 0.08],
            [0, 0.08],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.94]);
    // The pinched crown: a groove along the top and a dent at each front side.
    const crown = crownRound.smoothSubtract(
      0.03,
      sdf.capsule([0, 0.335, -0.14], [0, 0.322, 0.1], 0.036),
      sdf.sphere(0.05).at(0.1, 0.285, 0.15),
      sdf.sphere(0.05).at(-0.1, 0.285, 0.15),
    );
    const brim = sdf
      .revolve(
        profile.polygon(
          [
            [0.16, 0.098],
            [0.27, 0.095],
            [0.35, 0.086],
            [0.408, 0.07],
            [0.412, 0.09],
            [0.352, 0.106],
            [0.27, 0.117],
            [0.16, 0.12],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.97]);
    const hat = hatPose(sdf.smoothUnion(0.012, crown, brim)).bone('head');
    k.body('hat', hat, {
      color: C.straw,
      roughness: 0.92,
      detail: 0.005,
      bump: (x, y, z) => 0.0018 * Math.sin((x + z) * 90 + y * 40) * Math.sin(z * 70),
    });
    const bandShape = hatPose(crownRound.round(0.005).intersect(sdf.box([1, 0.034, 1]).at(0, 0.13, 0))).bone('head');
    k.body('band', bandShape, { color: C.band, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ white hair at the temples and the nape
    const hairShell = sdf.ellipsoid([0.214, 0.208, 0.198]);
    const tips = sdf.union(
      ...[-70, -45, -22, 0, 22, 45, 70].map((a) => sdf.sphere(0.025).at(0.18 * Math.sin((a * Math.PI) / 180), -0.068, -0.167 * Math.cos((a * Math.PI) / 180))),
    );
    const back = hairShell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.06)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const temples = hairShell
      .smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], 0.05))
      .smoothIntersect(0.015, sdf.halfSpace([-1, 0, 0], -0.15).mirror('x'))
      .smoothIntersect(0.015, sdf.halfSpace([0, 0, 1], 0.11));
    const hairBack = hatPose(sdf.smoothUnion(0.015, back, tips, temples)).bone('head');
    k.body('hair', hairBack, { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ beard and mustache (own body)
    const beardMass = sdf.smoothUnion(
      0.04,
      sdf.ellipsoid([0.158, 0.096, 0.135]).at(0, 0.465, 0.04),
      sdf.ellipsoid([0.125, 0.07, 0.11]).at(0, 0.425, 0.07),
    );
    const mouthCut = sdf.box([0.13, 0.1, 0.5], 0.02).at(0, 0.488 + 0.05, 0.2);
    const beardBack = sdf.halfSpace([0, 0, 1], 0.28).intersect(sdf.box([0.5, 0.5, 0.5]).at(0, 0.45, 0.2));
    const sideburn = pair(
      sdf.chain(
        [
          [0.185, 0.62, 0.0, 0.02],
          [0.18, 0.56, 0.015, 0.024],
          [0.15, 0.51, 0.04, 0.03],
        ],
        0.02,
      ),
    );
    const mz = (x: number, y: number, r: number): [number, number, number, number] => [x, y, h.faceZ(x, y) + 0.012, r];
    const mustache = pair(sdf.chain([mz(0.004, 0.55, 0.022), mz(0.04, 0.543, 0.022), mz(0.075, 0.55, 0.02), mz(0.095, 0.566, 0.016), mz(0.097, 0.58, 0.011)], 0.012));
    const beard = sdf.smoothUnion(0.012, beardMass.smoothSubtract(0.012, mouthCut).intersect(beardBack), sideburn, mustache).bone('head');
    k.body('beard', beard, { color: hairColor, roughness: 0.65, detail: 0.005, bump: (x, y, z) => 0.0025 * Math.sin(x * 160 + Math.sin(y * 50)) });

    // The big round red nose.
    const noseTint = k.tint('skin', { color: C.nose, follow: 0.7 });
    const noseZ = h.faceZ(0, 0.58);
    const noseShape = sdf.smoothUnion(0.02, sdf.ellipsoid([0.047, 0.047, 0.05]).at(0, 0.585, noseZ + 0.024), sdf.ellipsoid([0.036, 0.03, 0.036]).at(0, 0.56, noseZ + 0.03));
    k.body('nose', noseShape.bone('head'), { color: noseTint, roughness: 0.5, detail: 0.004 });

    // Bushy white brows: a chain on each side, over the eyes.
    const brow = (x: number, y: number, r: number): [number, number, number, number] => [x, y, h.faceZ(x, y) + 0.005, r];
    const browBody = pair(sdf.chain([brow(0.045, 0.71, 0.013), brow(0.09, 0.72, 0.017), brow(0.135, 0.708, 0.015), brow(0.162, 0.686, 0.011)], 0.012)).bone('head');
    k.body('brows', browBody, { color: hairColor, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ yellow checked shirt, rolled sleeves
    const sleeve = h.perArm(({ ELBOW: E, WRIST: W }) =>
      sdf.smoothUnion(
        0.012,
        sdf.cone(lerp(SHOULDER, E, -0.1), E, 0.047, 0.045).bone('upperarm.L'),
        sdf.cone(E, lerp(E, W, 0.4), 0.045, 0.047).bone('forearm.L'),
        sdf.cone(lerp(E, W, 0.3), lerp(E, W, 0.58), 0.052, 0.052).round(0.004).bone('forearm.L'),
      ),
    );
    const fr = (v: number) => v - Math.floor(v);
    const plaid = (x: number, y: number, z: number) => {
      const u = fr((x + z * 0.6) * 20);
      const v = fr(y * 20);
      if (Math.abs(u - 0.5) < 0.03 || Math.abs(v - 0.5) < 0.03) return rgb(C.plaid);
      return u < 0.22 || v < 0.22 ? rgb(C.check) : null;
    };
    const shirt = sdf
      .smoothUnion(0.012, h.weighted(h.torso).intersect(sdf.halfSpace([0, -1, 0], -0.186)), sleeve)
      .paintFn((x, y, z, base) => plaid(Math.abs(x), y, z) ?? base);
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.88, detail: 0.005 });

    // ------------------------------------------------------------------ overalls: bib, straps, legs
    const shell = h.torso.round(0.013).subtract(h.torso.round(-0.003));
    const lowerShell = shell.intersect(sdf.halfSpace([0, 1, 0], 0.31)).intersect(sdf.halfSpace([0, -1, 0], -0.15));
    const bib = shell.intersect(sdf.box([0.17, 0.15, 0.4], 0.012).at(0, 0.34, 0.2));
    const strap = shell
      .intersect(sdf.box([0.034, 0.2, 0.6], 0.004).at(0.075, 0.39, 0))
      .intersect(sdf.halfSpace([0, 1, 0], 0.465));
    const leg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.06).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.115, 0.002], 0.058, 0.055).bone('shin.L'),
    );
    const hipsMass = sdf.ellipsoid([0.118, 0.05, 0.088]).at(0, 0.2, 0).bone('hips');
    const overalls = sdf.smoothUnion(
      0.01,
      h.weighted(lowerShell),
      h.weighted(bib),
      pair(h.weighted(strap)),
      sdf.smoothUnion(0.03, hipsMass, pair(leg)),
    );
    k.body('overalls', overalls, { color: cloth, roughness: 0.88, detail: 0.005 });

    // The two strap buttons, the patch pocket, and the trowel in it.
    const zFront = (y: number, x = 0) => sdf.raycast(h.torso.round(0.013), [x, y, 1], [0, 0, -1])![2];
    const pz = zFront(0.325) + 0.001;
    const pocket = sdf.box([0.08, 0.06, 0.016], 0.006).at(0, 0.325, pz).bone('chest');
    k.body('pocket', pocket, { color: C.pocket, roughness: 0.9, detail: 0.004 });
    const buttonAt = (x: number) => sdf.cylinder(0.011, 0.01, 0.003).rotateX(90).at(x, 0.382, zFront(0.382, x) + 0.002).bone('chest');
    k.body('buttons', pair(buttonAt(0.075)), { color: C.trowel, roughness: 0.35, metalness: 0.7, detail: 0.004 });
    // The trowel hangs flat at the right hip, blade down, from a loop on the overalls.
    const trowelLocal = (s: sdf.Shape) => s.scale(1.5).rotateZ(-3).at(-0.118, 0.235, zFront(0.235, -0.118) + 0.006).bone('spine');
    const blade = sdf
      .smoothUnion(0.004, sdf.ellipsoid([0.018, 0.04, 0.007]).at(0, -0.02, 0), sdf.capsule([0, 0.01, 0], [0, 0.03, 0], 0.007))
      .intersect(sdf.box([0.1, 0.1, 0.1]).at(0, 0, 0));
    k.body('trowel', trowelLocal(blade), { color: C.trowel, roughness: 0.4, metalness: 0.7, detail: 0.003 });
    const grip = sdf.capsule([0, 0.03, 0], [0, 0.075, 0], 0.011);
    k.body('trowel-handle', trowelLocal(grip), { color: C.handle, roughness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ brown boots
    const boot = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.058, 0.044, 0.1]).at(0, 0.04, 0.04),
        sdf.cylinder(0.05, 0.1, 0.015).at(0, 0.07, -0.005),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ the watering can (left hand)
    // Local frame: the origin at the grip center, +Z along the held item (forward, 20 degrees up).
    const inHand = (s: sdf.Shape) => s.rotateX(-20).at(GRIP[0], GRIP[1], GRIP[2]);
    const bar = sdf.capsule([0, 0, -0.04], [0, 0, 0.04], 0.016);
    const post = (z: number) => sdf.capsule([0, 0, z], [0, -0.032, z * 0.95], 0.014);
    // The tank, the lid ring, and the spout turn 40 degrees about the grip's vertical axis: the spout
    // points forward and out to the side while the handle stays in the fist.
    const tank = sdf.cylinder(0.052, 0.1, 0.02).scale([1, 1, 1.1]).at(0, -0.115, 0);
    const lidRim = sdf.torus(0.03, 0.007).at(0, -0.066, 0);
    const spout = sdf.cone([0, -0.14, 0.04], [0, -0.075, 0.142], 0.02, 0.014);
    const rose = sdf.cone([0, -0.077, 0.14], [0, -0.058, 0.186], 0.016, 0.031).round(0.003);
    const turn = (s: sdf.Shape) => s.rotateY(40).at(0, 0.04, 0);
    const can = sdf.smoothUnion(0.012, bar, post(-0.04), post(0.04), turn(sdf.smoothUnion(0.012, tank, lidRim, spout))).scale(1.15);
    k.body('can', inHand(can).bone('knife.L'), { color: C.can, roughness: 0.45, metalness: 0.5, detail: 0.004 });
    k.body('rose', inHand(turn(rose).scale(1.15)).bone('knife.L'), { color: C.rose, roughness: 0.5, metalness: 0.4, detail: 0.004 });
  },
});
