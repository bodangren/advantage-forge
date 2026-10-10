import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Rebel — Chibi Quest court-and-faction NPC (catalog `npcs/court-and-faction/rebel`), about 1.0 m to the
 * top of the ponytail, faces +Z. Target: docs/npc-mockups/rebel_001.jpg. Built on the humanoid kind.
 *
 * Role: a forest camp NPC who gives scouting quests; seen in 3D and as a 128 px sprite. The red bandana,
 *   the raised red and gold flag, and the wooden slingshot must read.
 * One idea: a brave young scout with a high dark ponytail, a red bandana, and a flag held up high.
 * Shape language: round and soft (head, locks, pouches) with two long hard forms (the pole and the Y frame).
 * Palette (60/30/10): olive jacket #4a5a3a (cloth slot), brown trousers #6b4a2c, belt #5a3a24, boots #4a3424;
 *   red bandana and flag #b03a3a as the accent, gold #e0b040 on the flag, patches #6b4a2c and #8a7a5a.
 * Value plan: the dark hair and the red band frame the light face; the red flag is the focal point.
 * Bodies: skin, hair, bandana, jacket, trim, straps, belt, buckle, pouches, neckerchief, boots, boot-cuffs,
 *   pole, flag, flag-gold, sling, sling-band.
 * Rig: the humanoid kind's skeleton and clips. The right arm is posed up beside the head with the flag rigid
 *   on `knife.R`; the slingshot is rigid on `knife.L` in the hanging left fist.
 */

const C = {
  bandana: '#b03a3a',
  gold: '#e0b040',
  patchA: '#6b4a2c',
  patchB: '#8a7a5a',
  belt: '#5a3a24',
  pants: '#6b4a2c',
  boot: '#4a3424',
  pole: '#8a6a3a',
  band: '#4a3424',
  front: '#a89a6e',
};

export default humanoidAsset({
  name: 'rebel',
  description: 'A hopeful young rebel scout with a red bandana and a patched green jacket, holding a rolled flag and a slingshot.',
  reference: 'docs/npc-mockups/rebel_001.jpg',
  variants: {
    skin: { bronze: '#c68a5e', fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { ink: '#2a1a14', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { olive: '#4a5a3a', umber: '#6b4a2c', slate: '#5a6270', plum: '#6a4a5a' },
  },
  presets: {
    dusk: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'umber' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: false,
  // The right arm raised beside the head (the viewer's left) with the flag; the left hand hangs.
  pose: { R: { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] } },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const clothDark = k.tint('cloth', { color: '#3a4630', follow: 1 });

    // ------------------------------------------------------------------ hair: a cap, a ponytail of locks, temple locks
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');
    const shell = sdf.ellipsoid([0.212, 0.207, 0.197]);
    const topCap = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.1));
    const backCap = shell.smoothIntersect(0.04, sdf.halfSpace([0, -1, 0], 0.03)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const napeLocks = sdf.union(
      ...[-62, -31, 0, 31, 62].map((a) => {
        const sa = Math.sin((a * Math.PI) / 180);
        const ca = Math.cos((a * Math.PI) / 180);
        return sdf.chain(
          [
            [0.17 * sa, 0.03, -0.158 * ca, 0.042],
            [0.172 * sa, -0.02, -0.158 * ca, 0.034],
            [0.165 * sa, -0.065, -0.15 * ca, 0.022],
          ],
          0.01,
        );
      }),
    );
    const lock = (pts: number[][]) => sdf.chain(pts.map((p) => [p[0]!, p[1]!, p[2]!, p[3]!] as [number, number, number, number]), 0.01);
    const baseP: [number, number, number, number] = [0, 0.2, -0.07, 0.045];
    const ponytail = sdf.smoothUnion(
      0.012,
      sdf.sphere(0.052).at(0, 0.2, -0.065),
      lock([baseP, [-0.02, 0.26, -0.08, 0.03], [-0.065, 0.3, -0.09, 0.028], [-0.115, 0.285, -0.075, 0.018]]),
      lock([baseP, [0.0, 0.265, -0.095, 0.03], [0.0, 0.315, -0.125, 0.026], [0.02, 0.305, -0.17, 0.016]]),
      lock([baseP, [0.03, 0.26, -0.085, 0.028], [0.07, 0.29, -0.095, 0.025], [0.115, 0.27, -0.085, 0.017]]),
      lock([baseP, [-0.01, 0.2, -0.15, 0.03], [-0.02, 0.14, -0.225, 0.026], [-0.03, 0.06, -0.24, 0.016]]),
      lock([baseP, [0.025, 0.21, -0.14, 0.028], [0.05, 0.15, -0.215, 0.024], [0.06, 0.07, -0.23, 0.015]]),
    );
    const temple = pair(
      sdf.smoothUnion(
        0.008,
        lock([[0.196, 0.07, 0.05, 0.018], [0.2, 0.0, 0.05, 0.016], [0.198, -0.055, 0.045, 0.011]]),
        lock([[0.185, 0.075, 0.075, 0.015], [0.192, 0.03, 0.08, 0.013], [0.188, -0.01, 0.075, 0.009]]),
      ),
    );
    const faceZ = h.faceZ(0, 0.742);
    const curl = lock([
      [-0.01, 0.075, faceZ + 0.004, 0.014],
      [0.02, 0.07, faceZ + 0.006, 0.013],
      [0.045, 0.058, faceZ + 0.0, 0.009],
    ]);
    const hair = headPose(sdf.smoothUnion(0.012, topCap, backCap, napeLocks, ponytail, temple, curl));
    k.body('hair', hair, { color: hairColor, roughness: 0.55, detail: 0.004 });

    // The hair tie on the ponytail.
    k.body('hair-tie', sdf.torus(0.044, 0.012).rotateX(-10).at(0, 0.225, -0.072).at(0, HEAD_Y, 0).bone('head'), { color: C.bandana, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ the red bandana: a band, a knot, short tails
    const bandShape = sdf
      .ellipsoid([0.217, 0.213, 0.201])
      .smoothIntersect(0.012, sdf.box([0.6, 0.058, 0.6]).at(0, 0.115, 0))
      .paintWhere(sdf.box([0.07, 0.006, 0.6]).rotateZ(-12).at(-0.1, 0.12, 0), C.gold, 0.002)
      .paintWhere(sdf.box([0.05, 0.005, 0.6]).rotateZ(-12).at(-0.115, 0.104, 0), C.gold, 0.002);
    const knot = sdf.sphere(0.034).at(0, 0.115, -0.2);
    const tail = pair(sdf.chain([[0.012, 0.1, -0.205, 0.017], [0.04, 0.045, -0.222, 0.016], [0.055, -0.005, -0.225, 0.011]], 0.01));
    const bandana = sdf.smoothUnion(0.012, bandShape, knot, tail).rotateX(4).at(0, HEAD_Y, 0).bone('head');
    k.body('bandana', bandana, { color: C.bandana, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ jacket: open front, rolled sleeves, patches
    const jacketCore = h
      .torso.round(0.009)
      .intersect(sdf.halfSpace([0, 1, 0], 0.5))
      .intersect(sdf.halfSpace([0, -1, 0], -0.168))
      .paintWhere(sdf.box([0.052, 0.3, 0.4]).at(0, 0.3, 0.2), C.front, 0.004) // the open front
      .paintWhere(sdf.box([0.02, 0.2, 0.4]).at(0.075, 0.35, 0.2).mirror('x'), C.patchA, 0.003) // the straps
      .paintWhere(sdf.box([0.052, 0.052, 0.4], 0.006).rotateZ(6).at(-0.082, 0.205, 0.2), C.patchA, 0.003) // patch 1
      .paintWhere(sdf.box([0.034, 0.034, 0.4], 0.004).rotateZ(6).at(-0.082, 0.205, 0.2), clothDark, 0.002);
    const sleeve = h.perArm((j) =>
      sdf
        .smoothUnion(
          0.012,
          sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L'),
          sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.55), 0.043, 0.042).bone('forearm.L'),
        )
        .paintWhere(sdf.box([0.05, 0.05, 0.05], 0.006).at(...lerp(SHOULDER, j.ELBOW, 0.6)), C.patchB, 0.003),
    );
    const jacket = sdf.smoothUnion(0.012, h.weighted(jacketCore), sleeve);
    k.body('jacket', jacket, { color: h.tint.shirt ?? '#4a5a3a', roughness: 0.88, detail: 0.005 });

    const collar = sdf.torus(0.064, 0.017).at(0, 0.445, -0.01).bone('chest');
    const cuff = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.48), lerp(j.ELBOW, j.WRIST, 0.68), 0.05, 0.05).round(0.003).bone('forearm.L'));
    k.body('trim', sdf.union(collar, cuff), { color: C.patchB, roughness: 0.9, detail: 0.004 });

    // The red neckerchief: a ring at the neck and a hanging triangle that follows the chest.
    const chestShell = h.torso.round(0.014).subtract(h.torso.round(-0.002));
    const bibShape = profile.polygon(
      [
        [-0.052, 0.462],
        [0.052, 0.462],
        [0.03, 0.4],
        [0.008, 0.352],
        [-0.008, 0.352],
        [-0.03, 0.4],
      ],
      { smooth: false },
    );
    const bib = chestShell.intersect(sdf.extrude(bibShape, 0.4).at(0, 0, 0.2));
    const scarf = sdf.smoothUnion(0.008, sdf.torus(0.056, 0.02).at(0, 0.464, -0.01), h.weighted(bib)).bone('chest');
    k.body('neckerchief', scarf, { color: C.bandana, roughness: 0.85, detail: 0.004 });

    // Belt, buckle, and pouches.
    const belt = h.weighted(h.torso.round(0.015).intersect(h.band(0.232, 0.258)));
    k.body('belt', belt, { color: C.belt, roughness: 0.75, detail: 0.004 });
    k.body('buckle', sdf.torus(0.019, 0.006).rotateX(90).at(0, 0.245, 0.117).bone('spine'), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.003 });
    const pouch = pair(
      sdf
        .smoothUnion(0.006, sdf.box([0.046, 0.062, 0.048], 0.012).at(0.125, 0.185, 0.07), sdf.box([0.05, 0.02, 0.052], 0.008).at(0.125, 0.22, 0.07))
        .bone('hips'),
    );
    k.body('pouches', pouch, { color: C.patchA, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ boots with rolled cuffs
    const bootBase = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.056, 0.042, 0.1]).at(0, 0.04, 0.04), sdf.sphere(0.05).at(0, 0.05, -0.005))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.013), '#2e2018', 0.002);
    const bootFoot = pair(bootBase.rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L'));
    const shaft = pair(sdf.cylinder(0.05, 0.075, 0.012).at(ANKLE[0], 0.085, 0.002).bone('shin.L'));
    k.body('boots', sdf.union(bootFoot, shaft), { color: C.boot, roughness: 0.7, detail: 0.005 });
    const bootCuff = pair(sdf.cylinder(0.058, 0.03, 0.01).at(ANKLE[0], 0.123, 0.002).bone('shin.L'));
    k.body('boot-cuffs', bootCuff, { color: C.patchB, roughness: 0.92, detail: 0.004, bump: (x, y, z) => 0.003 * Math.sin(x * 140 + z * 120) });
    void HIP;
    void KNEE;

    // ------------------------------------------------------------------ the rolled flag in the raised right fist
    const gR = h.arms.R.GRIP;
    const flagPose = (s: sdf.Shape) => s.rotateZ(8).at(-gR[0], gR[1], gR[2]);
    const pole = sdf.capsule([0, -0.08, 0], [0, 0.32, 0], 0.0145);
    k.body('pole', flagPose(pole), { color: C.pole, roughness: 0.75, bone: 'knife.R', detail: 0.004 });
    const roll = sdf
      .capsule([0, 0.15, 0], [0, 0.31, 0], 0.036)
      .paintWhere(sdf.box([0.01, 0.4, 0.4]).rotateZ(35).at(0, 0.23, 0), C.gold, 0.002)
      .paintWhere(sdf.box([0.01, 0.4, 0.4]).rotateZ(35).at(0.03, 0.23, 0), C.gold, 0.002);
    const tailFlag = sdf
      .extrude(
        profile.polygon(
          [
            [0.012, 0.165],
            [-0.05, 0.168],
            [-0.12, 0.12],
            [-0.17, 0.04],
            [-0.18, -0.03],
            [-0.14, 0.0],
            [-0.09, 0.05],
            [-0.04, 0.07],
            [0.012, 0.09],
          ],
          { smooth: true, samples: 6 },
        ),
        0.018,
      )
      .at(0, 0, -0.012)
      .paintWhere(sdf.box([0.008, 0.2, 0.2]).rotateZ(50).at(-0.1, 0.08, 0), C.gold, 0.002);
    k.body('flag', flagPose(sdf.smoothUnion(0.01, roll, tailFlag)), { color: C.bandana, roughness: 0.85, bone: 'knife.R', detail: 0.004 });
    const ferrule = sdf.cone([0, 0.3, 0], [0, 0.4, 0], 0.026, 0.0);
    const ringTop = sdf.cylinder(0.04, 0.022, 0.006).at(0, 0.31, 0);
    const ringMid = sdf.cylinder(0.04, 0.022, 0.006).at(0, 0.15, 0);
    const ringLow = sdf.cylinder(0.021, 0.02, 0.005).at(0, 0.07, 0);
    k.body('flag-gold', flagPose(sdf.union(ferrule, ringTop, ringMid, ringLow)), { color: C.gold, roughness: 0.35, metalness: 0.75, bone: 'knife.R', detail: 0.004 });

    // ------------------------------------------------------------------ the slingshot in the hanging left fist
    const gL = h.arms.L.GRIP;
    const slingPose = (s: sdf.Shape) => s.scale(1.25).rotateZ(-10).at(gL[0], gL[1], gL[2]);
    const frame = sdf.smoothUnion(
      0.012,
      sdf.capsule([0, -0.045, 0], [0, 0.035, 0], 0.0165),
      sdf.capsule([0, 0.03, 0], [-0.045, 0.108, 0], 0.0125),
      sdf.capsule([0, 0.03, 0], [0.045, 0.108, 0], 0.0125),
    );
    k.body('sling', slingPose(frame), { color: C.pole, roughness: 0.75, bone: 'knife.L', detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(y * 120 + z * 30) });
    const bandShapeSling = sdf.smoothUnion(
      0.008,
      sdf.chain([[-0.045, 0.108, 0.012, 0.0085], [-0.026, 0.083, 0.014, 0.0085], [0, 0.074, 0.015, 0.0085], [0.026, 0.083, 0.014, 0.0085], [0.045, 0.108, 0.012, 0.0085]], 0.008),
      sdf.ellipsoid([0.019, 0.012, 0.011]).at(0, 0.072, 0.017),
    );
    k.body('sling-band', slingPose(bandShapeSling), { color: C.band, roughness: 0.8, bone: 'knife.L', detail: 0.004 });
  },
});
