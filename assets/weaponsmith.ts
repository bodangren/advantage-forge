import * as THREE from 'three';
import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Weaponsmith — Chibi Quest settlement NPC (catalog `npcs/settlement/weaponsmith`), about 1.0 m to the
 * top of the hair, faces +Z. Target: docs/npc-mockups/weaponsmith_001.jpg. Built on the humanoid kind.
 *
 * Role: the weapon shop NPC (sells and upgrades weapons), seen in 3D and as a 128 px sprite; the red
 *   spikes, the heavy brown apron, the big gloves, and the steel sword must read small.
 * One idea: a sturdy young smith with a fan of spiky red hair, whose bulky leather apron and gloves
 *   frame the one bright steel sword in his fist.
 * Shape language: square and sturdy (apron, gloves, boots) with a triangular accent (hair spikes, blade).
 * Palette (60/30/10): leather browns #6b4226 (apron), #5a3a24 (gloves), #3a2a20 (boots); gray shirt
 *   #8a8a90 and dark trousers #3a3438; accents red hair #a8401c, steel #c8ccd4, silver rivets #c4c8d0.
 * Value plan: the bright blade and the red hair are the lightest and most saturated; the apron is
 *   the dark mass; the gray sleeves separate the apron from the gloves.
 * Bodies: skin (soot, thick brows), hair, shirt, cloth trim, apron, belt, silver, gloves, trousers,
 *   boots, tongs (silver), ears, sword (steel blade, silver guard, grip).
 * Rig: the humanoid kind's skeleton and clips; the sword is rigid on `knife.R`, the tongs on `hips`.
 */

const C = {
  hair: '#a8401c',
  apron: '#6b4226',
  apronEdge: '#4e2e18',
  belt: '#4a2c1a',
  silver: '#c4c8d0',
  glove: '#5a3a24',
  pants: '#3a3438',
  boot: '#3a2a20',
  soot: '#4a4448',
  steel: '#c8ccd4',
  fuller: '#9aa0aa',
  guard: '#b4b8c2',
  grip: '#5a3a24',
};

export default humanoidAsset({
  name: 'weaponsmith',
  description: 'A sturdy weaponsmith with spiky red hair and soot on his cheeks, in a heavy leather apron, holding up a new sword.',
  reference: 'docs/npc-mockups/weaponsmith_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { red: '#a8401c', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { gray: '#8a8a90', slate: '#5f6a7a', olive: '#7a7a56', ochre: '#a08a60' },
  },
  presets: {
    forge: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'slate' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: false,
  lashes: false,
  // The right fist holds the sword upright at the waist, out to the side and a little forward; the left arm hangs and swings.
  pose: { R: { elbow: [0.205, 0.305, 0.035], wrist: [0.26, 0.32, 0.14] } },

  // The kind's brows are painted over with skin (a thick hair-colored brow is built in `extra`), soot smudges on both cheeks (the
  // left one bigger), and the kind's smile.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.034, 55, 125), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const smudge = sdf.union(
      h.onFace(sdf.ellipsoid([0.036, 0.012, 0.07]).rotateZ(-14), 0.135, 0.528),
      h.onFace(sdf.ellipsoid([0.022, 0.009, 0.07]).rotateZ(16), 0.15, 0.505),
    );
    const smudgeR = sdf.union(
      h.onFace(sdf.ellipsoid([0.026, 0.009, 0.07]).rotateZ(14), -0.135, 0.53),
    );
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(smudge, C.soot, 0.004)
      .paintWhere(smudgeR, C.soot, 0.004);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const trimColor = k.tint('cloth', { color: '#6c6c72', follow: 1 });

    // ------------------------------------------------------------------ hair: a soft cap and a fan of spikes
    const skullTop = (x: number, z: number) => HEAD_Y + 0.2 * Math.sqrt(Math.max(0.05, 1 - (x / 0.205) ** 2 - (z / 0.19) ** 2));
    const faceMask = sdf.ellipsoid([0.17, 0.155, 0.2]).at(0, 0.6, 0.2);
    const cap = sdf
      .ellipsoid([0.217, 0.213, 0.202])
      .at(0, HEAD_Y + 0.006, -0.008)
      .smoothSubtract(0.02, faceMask)
      .smoothIntersect(0.025, sdf.halfSpace([0, -1, 0], -0.605));
    // Flame-like tufts of varied size: [x, z, length, back sweep, side sweep, thickness]. Each rises
    // from the skull and bends up and back to a fine tip.
    const tufts: [number, number, number, number, number, number][] = [
      [0.01, 0.12, 0.15, 0.1, 0.02, 1.1],
      [0.08, 0.1, 0.1, 0.07, 0.04, 0.85],
      [-0.085, 0.1, 0.085, 0.06, -0.035, 0.8],
      [-0.03, 0.04, 0.16, 0.13, -0.03, 1.1],
      [0.055, 0.03, 0.12, 0.09, 0.05, 0.95],
      [-0.12, 0.02, 0.1, 0.07, -0.07, 0.9],
      [0.125, 0.0, 0.11, 0.06, 0.08, 0.9],
      [0.0, -0.06, 0.12, 0.08, 0.0, 1.0],
      [-0.07, -0.1, 0.085, 0.05, -0.04, 0.75],
      [0.08, -0.1, 0.075, 0.05, 0.04, 0.75],
      [-0.17, 0.04, 0.06, 0.04, -0.06, 0.65],
      [0.17, 0.04, 0.065, 0.04, 0.06, 0.65],
    ];
    const spikes = sdf.union(
      ...tufts.map(([x, z, len, back, side, w]) => {
        const y = skullTop(x, z) - 0.025;
        return sdf.chain(
          [
            [x, y, z, 0.048 * w],
            [x + side * 0.3, y + len * 0.5, z - back * 0.15, 0.037 * w],
            [x + side * 0.7, y + len * 0.85, z - back * 0.55, 0.021 * w],
            [x + side, y + len, z - back, 0.006],
          ],
          0.02,
        );
      }),
    );
    // Locks at the sides and the back: [base, tip] pairs that sweep out and back from the skull.
    const locks: [[number, number, number], [number, number, number], number][] = [
      [[0.185, 0.78, 0.0], [0.212, 0.845, -0.06], 1.0],
      [[0.19, 0.71, -0.05], [0.212, 0.68, -0.14], 0.85],
      [[0.0, 0.79, -0.18], [0.0, 0.75, -0.31], 1.1],
      [[0.09, 0.78, -0.16], [0.115, 0.73, -0.28], 0.95],
      [[0.14, 0.75, -0.12], [0.18, 0.7, -0.22], 0.8],
    ];
    const lockShapes = sdf.union(
      ...locks.flatMap(([a, b, w]) =>
        [1, -1].map((m) => {
          const at = (p: [number, number, number], t: number): [number, number, number] => [
            m * (a[0] + (p[0] - a[0]) * t),
            a[1] + (p[1] - a[1]) * t + 0.012 * Math.sin(t * Math.PI),
            a[2] + (p[2] - a[2]) * t,
          ];
          const p1 = at(b, 0.45);
          const p2 = at(b, 0.8);
          const p3 = at(b, 1);
          return sdf.chain(
            [
              [m * a[0], a[1], a[2], 0.042 * w],
              [p1[0], p1[1], p1[2], 0.032 * w],
              [p2[0], p2[1], p2[2], 0.018 * w],
              [p3[0], p3[1], p3[2], 0.006],
            ],
            0.02,
          );
        }),
      ),
    );
    const hair = sdf.smoothUnion(0.02, cap, spikes, lockShapes).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.004 });

    // Big ears over the kind's small ones (the mockup's ears stick out).
    const bigEar = sdf
      .ellipsoid([0.032, 0.064, 0.046])
      .subtract(sdf.sphere(0.024).at(0.022, 0, 0.01))
      .rotateY(-16)
      .rotateZ(-6)
      .at(0.212, 0.618, -0.012);
    k.body('ears', sdf.union(bigEar, bigEar.mirror('x', 0)).bone('head'), { color: h.tint.skin ?? '#f2c7a4', roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ shirt: sleeves to the rolled elbow
    const sleeves = h.perArm((j) => sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), lerp(j.ELBOW, j.WRIST, 0.04), 0.049, 0.046).bone('upperarm.L'));
    const shirt = sdf.smoothUnion(0.012, h.weighted(h.torso), sleeves);
    k.body('shirt', shirt, { color: h.tint.shirt ?? '#8a8a90', roughness: 0.85 });
    const collar = sdf.torus(0.058, 0.019).at(0, 0.452, -0.01).bone('chest');
    const rolls = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, -0.04), lerp(j.ELBOW, j.WRIST, 0.2), 0.054, 0.05).round(0.006).bone('forearm.L'));
    k.body('trim', sdf.union(collar, rolls), { color: trimColor, roughness: 0.9, detail: 0.004 });

    // The thick eyebrows (inner end low, outer end up), a thin shell on the face in the hair color.
    const browShell = h.head.round(0.005).subtract(h.head.round(-0.006)).intersect(
      sdf
        .extrude(
          profile.polygon(
            [
              [0.04, 0.706],
              [0.08, 0.728],
              [0.125, 0.745],
              [0.168, 0.73],
              [0.17, 0.704],
              [0.125, 0.713],
              [0.08, 0.694],
              [0.042, 0.676],
            ],
            { smooth: true, samples: 5 },
          ),
          0.3,
        )
        .at(0, 0, 0.1)
        .mirror('x', 0),
    );
    k.body('brows', browShell, { color: hairColor, roughness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ leather apron: bib, straps, skirt
    const shell = h.torso.round(0.015).subtract(h.torso.round(-0.002));
    const front = (x: number, y0: number, y1: number) => sdf.box([2 * x, y1 - y0, 0.5], 0.012).at(0, (y0 + y1) / 2, 0.25);
    const bib = shell.intersect(front(0.092, 0.25, 0.43));
    const strap = shell
      .intersect(sdf.box([0.04, 0.5, 0.7]).at(0.07, 0.39, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.33))
      .intersect(sdf.halfSpace([0, 1, 0], 0.52));
    const skirtProfile = (r0: number, r1: number, r2: number, yb: number) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.3],
              [r0, 0.3],
              [r0 + 0.004, 0.25],
              [r1, 0.2],
              [r2, yb + 0.02],
              [r2 - 0.004, yb],
              [0, yb],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.8]);
    const skirtShell = skirtProfile(0.134, 0.146, 0.158, 0.14).subtract(skirtProfile(0.118, 0.13, 0.142, 0.13));
    // The outline of the front panel: a flat top, nearly straight sides, a blunt point at the bottom.
    const panelOutline = profile.polygon(
      [
        [-0.134, 0.3],
        [0.134, 0.3],
        [0.146, 0.215],
        [0.138, 0.172],
        [0.07, 0.152],
        [0, 0.145],
        [-0.07, 0.152],
        [-0.138, 0.172],
        [-0.146, 0.215],
      ],
      { smooth: false },
    );
    const skirt = skirtShell.intersect(sdf.extrude(panelOutline, 0.6, 0.006)).intersect(sdf.halfSpace([0, 0, -1], -0.0));
    const apronBody = sdf
      .smoothUnion(0.008, h.weighted(bib), pair(strap.bone('chest')), h.weighted(skirt))
      .paintWhere(h.band(0.142, 0.153), C.apronEdge, 0.002);
    k.body('apron', apronBody, { color: C.apron, roughness: 0.82, bump: (x, y, z) => 0.0018 * Math.sin(x * 70 + Math.sin(y * 45)) * Math.cos(z * 55) });

    // The belt: a wrapped band at the waist with a knot flap and a silver buckle.
    const belt = h.torso.round(0.03).intersect(h.band(0.236, 0.272));
    const wrap = h.torso.round(0.036).intersect(sdf.box([0.5, 0.03, 0.5]).at(0, 0.226, 0)).intersect(h.band(0.21, 0.3));
    k.body('belt', sdf.smoothUnion(0.006, h.weighted(belt), h.weighted(wrap)), { color: C.belt, roughness: 0.75 });

    // Silver rivets at the corners of the bib and the skirt, and the belt buckle.
    const apronZ = (x: number, y: number) => sdf.raycast(apronBody, [x, y, 0.5], [0, 0, -1])?.[2] ?? 0.1;
    const rivet = (x: number, y: number, bone: string) => sdf.sphere(0.011).at(x, y, apronZ(x, y) + 0.001).bone(bone);
    const rivets = sdf.union(
      rivet(0.072, 0.405, 'chest'),
      rivet(-0.072, 0.405, 'chest'),
      rivet(0.078, 0.31, 'chest'),
      rivet(-0.078, 0.31, 'chest'),
      rivet(0.12, 0.22, 'hips'),
      rivet(-0.12, 0.22, 'hips'),
      rivet(0.095, 0.172, 'hips'),
      rivet(-0.095, 0.172, 'hips'),
      rivet(0, 0.158, 'hips'),
    );
    const beltZ = sdf.raycast(belt, [0, 0.254, 0.5], [0, 0, -1])?.[2] ?? 0.16;
    const buckle = sdf
      .box([0.052, 0.042, 0.014], 0.006)
      .subtract(sdf.box([0.032, 0.022, 0.05]))
      .at(0, 0.254, beltZ + 0.003)
      .bone('spine');
    const prong = sdf.box([0.01, 0.03, 0.01], 0.003).at(0, 0.254, beltZ + 0.004).bone('spine');
    k.body('silver', sdf.union(rivets, buckle, prong), { color: C.silver, roughness: 0.3, metalness: 0.9, detail: 0.003 });

    // ------------------------------------------------------------------ thick gloves over the fists
    // The fist turns with the forearm of its arm (the kind's rule: the hanging forearm to the posed one).
    const ELBOW0: [number, number, number] = [0.18, 0.332, 0.012];
    const WRIST0: [number, number, number] = [0.205, 0.238, 0.03];
    const v3 = (p: readonly number[]) => new THREE.Vector3(p[0], p[1], p[2]);
    const handTurn = (j: { ELBOW: readonly number[]; WRIST: readonly number[] }) =>
      new THREE.Quaternion().setFromUnitVectors(v3(WRIST0).sub(v3(ELBOW0)).normalize(), v3(j.WRIST).sub(v3(j.ELBOW)).normalize());
    const toHand = (j: { ELBOW: readonly number[]; WRIST: readonly number[] }, s: sdf.Shape) => {
      const turn = handTurn(j);
      const e = new THREE.Euler().setFromQuaternion(turn, 'ZYX');
      const d = 180 / Math.PI;
      return s
        .at(-WRIST0[0], -WRIST0[1], -WRIST0[2])
        .rotateX(e.x * d)
        .rotateY(e.y * d)
        .rotateZ(e.z * d)
        .at(j.WRIST[0]!, j.WRIST[1]!, j.WRIST[2]!);
    };
    const gloves = h.perArm((j) => {
      const fistC: [number, number, number] = [0.212, 0.2, 0.034];
      const glove = toHand(
        j,
        sdf.smoothUnion(
          0.02,
          sdf.ellipsoid([0.05, 0.054, 0.056]).at(...fistC),
          sdf.capsule([0.194, 0.178, 0.064], [0.2, 0.202, 0.08], 0.026),
          sdf.cone([0.228, 0.222, 0.056], [0.205, 0.206, 0.086], 0.024, 0.02),
        ),
      ).bone('hand.L');
      const cuff = sdf
        .smoothUnion(
          0.01,
          sdf.cone(lerp(j.ELBOW, j.WRIST, 0.66), lerp(j.ELBOW, j.WRIST, 1.06), 0.054, 0.056).round(0.004),
          sdf.sphere(0.056).at(...lerp(j.ELBOW, j.WRIST, 0.7)),
        )
        .bone('forearm.L');
      return sdf.smoothUnion(0.014, glove, cuff);
    });
    k.body('gloves', gloves, { color: C.glove, roughness: 0.75, detail: 0.004, bump: (x, y, z) => 0.0015 * Math.sin(x * 90 + y * 70 + z * 60) });

    // ------------------------------------------------------------------ heavy boots with rolled tops
    const boot = sdf
      .smoothUnion(
        0.026,
        sdf.cylinder(0.054, 0.1, 0.02).at(0, 0.06, 0).bone('shin.L'),
        sdf.ellipsoid([0.066, 0.052, 0.108]).at(0, 0.05, 0.045).bone('foot.L'),
        sdf.sphere(0.06).at(0, 0.058, 0.0).bone('foot.L'),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootCuff = sdf.cylinder(0.064, 0.032, 0.014).at(0, 0.112, 0.002).bone('shin.L');
    const sole = sdf.ellipsoid([0.07, 0.02, 0.115]).at(0, 0.008, 0.045).intersect(sdf.halfSpace([0, -1, 0], 0)).bone('foot.L');
    const bootShape = sdf.smoothUnion(0.01, boot, bootCuff).union(sole.paint('#2a1c14')).rotateY(10).at(ANKLE[0], 0, 0);
    k.body('boots', pair(bootShape), { color: C.boot, roughness: 0.7, detail: 0.005 });

    // ------------------------------------------------------------------ silver tongs on the left hip
    // Two crossed arms hang from a leather loop on the belt: handles up, pivot rivet, jaws down.
    const tongPose = (s: sdf.Shape) => s.at(0.1, 0, 0.112).bone('hips');
    const arm = (m: number) =>
      sdf.chain(
        [
          [m * 0.022, 0.285, 0, 0.011],
          [m * 0.006, 0.215, 0, 0.0105],
          [-m * 0.008, 0.15, 0, 0.0095],
          [-m * 0.006, 0.095, 0, 0.012],
        ],
        0.01,
      );
    const tongs = sdf.union(arm(1), arm(-1), sdf.sphere(0.0155).at(0, 0.205, 0.004));
    k.body('tongs', tongPose(tongs), { color: C.silver, roughness: 0.3, metalness: 0.9, detail: 0.003 });
    const loop = sdf.box([0.05, 0.05, 0.016], 0.006).at(0, 0.262, 0).subtract(sdf.box([0.02, 0.026, 0.05]).at(0, 0.262, 0));
    k.body('tong-loop', tongPose(loop), { color: C.belt, roughness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ the longsword in the right fist
    // Built along +Z with the flat facing out (+X), then stood up (the broad face toward the viewer): the point up,
    // leaning a little outward, held at the waist and clear of the head.
    // The grip passes through the middle of the glove (the fist center, turned with the forearm).
    const jr = h.arms.R;
    const fv = v3([0.212, 0.2, 0.034]).sub(v3(WRIST0)).applyQuaternion(handTurn(jr));
    const G: [number, number, number] = [jr.WRIST[0] + fv.x, jr.WRIST[1] + fv.y, jr.WRIST[2] + fv.z];
    const swordPose = (s: sdf.Shape) => s.rotateX(-88).rotateY(90).rotateZ(7).at(-G[0], G[1], G[2]);
    const bladeOutline = profile.polygon(
      [
        [0.07, -0.0225],
        [0.6, -0.0225],
        [0.7, 0],
        [0.6, 0.0225],
        [0.07, 0.0225],
      ],
      { smooth: false },
    );
    // A flat blade 0.045 wide and 0.012 thick, with a shallow groove (the fuller) on both faces.
    const fuller = sdf.union(sdf.box([0.006, 0.01, 0.46], 0.002).at(0.0065, 0, 0.34), sdf.box([0.006, 0.01, 0.46], 0.002).at(-0.0065, 0, 0.34));
    const blade = sdf
      .extrude(bladeOutline, 0.012, 0.004)
      .rotateY(-90)
      .smoothSubtract(0.002, fuller)
      .paintWhere(sdf.box([1, 0.012, 0.5]).at(0, 0, 0.34), C.fuller, 0.003);
    // A heavy crossguard with round ends, a leather grip, and a round pommel.
    const guard = sdf.union(sdf.box([0.034, 0.17, 0.03], 0.01).at(0, 0, 0.062), sdf.sphere(0.024).at(0, 0.088, 0.062), sdf.sphere(0.024).at(0, -0.088, 0.062));
    const pommel = sdf.sphere(0.03).at(0, 0, -0.058);
    const grip = sdf.cylinder(0.02, 0.12, 0.006).rotateX(90).at(0, 0, 0.0);
    k.body('sword-blade', swordPose(blade), { color: C.steel, roughness: 0.25, metalness: 0.85, bone: 'knife.R', detail: 0.0025 });
    k.body('sword-guard', swordPose(sdf.union(guard, pommel)), { color: C.guard, roughness: 0.3, metalness: 0.85, bone: 'knife.R', detail: 0.003 });
    k.body('sword-grip', swordPose(grip), { color: C.grip, roughness: 0.8, bone: 'knife.R', detail: 0.004 });
    void HIP;
    void KNEE;
  },
});
