import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Prince — Chibi Quest court NPC (catalog `npcs/court-and-faction/prince`), about 1.0 m to the top
 * of the hair, faces +Z. Target: docs/npc-mockups/prince_001.jpg. Built on the humanoid kind.
 *
 * Role: a palace NPC who gives training quests, seen in the palace yard in 3D and as a 128 px sprite;
 *   the gold crown, the raised sword, the red cape, and the big grin must read.
 * One idea: a brave boy with a raised silver sword, a gold crown over fluffy blond curls, and a
 *   red cape that spreads behind a royal blue tunic.
 * Shape language: round and soft (curls, face, tunic), with the crown points and the blade as the
 *   hard accents.
 * Palette (60/30/10): royal blue #2f4a8a (tunic), red #a83a30 (cape), cream #f0ece4 (trousers,
 *   sleeves); gold #e0b040 (crown, trim, emblem, guard); brown #6b4226 (belt, boots, cuffs);
 *   hair #e0b858; steel #d0d4dc.
 * Value plan: the gold crown over the light face and the bright blade are the focal points; the
 *   blue tunic and the red cape frame the body.
 * Bodies: skin, hair, crown, gems, tunic, sleeves, cuffs, belt, buckle, emblem, cape, trousers,
 *   boots, blade, guard.
 * Rig: the humanoid kind's skeleton and clips; both arms keep a held pose (the right raises the
 *   sword beside the head, the left fist rests on the hip). The cape is tagged to `cloak`.
 */

const C = {
  pantsBeige: '#e8dcc2',
  gold: '#e0b040',
  goldLight: '#f0cc66',
  ruby: '#c83a3a',
  cape: '#a83a30',
  sleeve: '#f0ece4',
  belt: '#6b4226',
  pants: '#e8dcc2',
  boot: '#6b4226',
  bootTop: '#7d5232',
  steel: '#d0d4dc',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

// Left-side values (the kind mirrors R): the right hand is raised beside the head, the left fist is on the hip.
const POSE_L = { elbow: [0.2, 0.31, -0.03], wrist: [0.15, 0.25, 0.04] } as const;
const POSE_R = { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] } as const;

export default humanoidAsset({
  name: 'prince',
  description: 'A brave, cheerful young prince with a gold crown, a blue tunic, and a red cape, holding up a short sword.',
  reference: 'docs/npc-mockups/prince_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: {
      amber: '#e0a43c',
      gold: '#e0b858',
      brown: '#5a301d',
      black: '#231a17',
      blond: '#c4974a',
      auburn: '#8e3b1c',
      silver: '#b8b4c4',
      teal: '#2f6f6a',
    },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { royal: '#2f4a8a', plum: '#6a3a78', teal: '#2a6a72', forest: '#2f5a42' },
  },
  presets: {
    royal: { skin: 'fair', hair: 'amber', eyes: 'brown', cloth: 'royal' },
    plum: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'plum' },
  },
  hair: false,
  undershirt: false,
  pants: C.pantsBeige,
  shoes: false,
  lashes: false,
  pose: { L: POSE_L, R: POSE_R },

  // A gentle closed smile: one curved stroke with round ends and soft pink cheeks from the kind.
  paintSkin(skin, h) {
    const y = 0.536;
    const smile = sdf.extrude(profile.arc(0.11, 0.0105, 244, 296), 0.3).at(0, 0.11, 0);
    const mouth = h.onFace(smile, 0, y);
    return skin.paintWhere(mouth, C.mouth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const rad = Math.PI / 180;
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    type P4 = [number, number, number, number];
    const hairColor = k.tint('hair');
    const tunicColor = h.tint.shirt ?? '#2f4a8a';
    const goldMetal = { color: C.gold, roughness: 0.35, metalness: 0.8 } as const;

    // ------------------------------------------------------------------ ears
    const skinColor = h.tint.skin ?? '#f2c7a4';
    const ear = sdf
      .ellipsoid([0.036, 0.055, 0.038])
      .rotateY(-12)
      .at(0.212, 0.62, -0.01)
      .bone('head');
    k.body('ears', pair(ear), { color: skinColor, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a small cap, a curly fringe, side locks, back locks, a fluffy top
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const hairCap = sdf
      .ellipsoid([0.212, 0.206, 0.197])
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0.03))
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.07))
      .smoothSubtract(0.03, pair(sdf.ellipsoid([0.05, 0.065, 0.05]).at(0.205, -0.055, -0.01)));
    const backLocks = [95, 118, 141, 164, 188, 212, 235, 258, 281].map((deg) => {
      const x = 0.185 * Math.sin(deg * rad);
      const z = 0.175 * Math.cos(deg * rad);
      return sdf.chain(
        [
          [x, 0.02, z, 0.036],
          [x * 1.04, -0.04, z * 1.04, 0.036],
          [x * 0.95, -0.095, z * 0.95, 0.027],
        ],
        0.012,
      );
    });
    // The top: round lumps that rise between the crown points.
    const lumps = [0, 40, 80, 120, 160, 200, 240, 280, 320].map((deg) =>
      sdf.sphere(0.05).at(0.125 * Math.sin(deg * rad), 0.15, 0.115 * Math.cos(deg * rad)),
    );
    const topTuft = sdf.smoothUnion(0.03, sdf.ellipsoid([0.15, 0.1, 0.14]).at(0, 0.12, 0), sdf.sphere(0.065).at(0, 0.19, 0.01), ...lumps);
    const hairTop = headPose(sdf.smoothUnion(0.014, hairCap, topTuft, ...backLocks)).bone('head');
    k.body('hair', hairTop, { color: hairColor, roughness: 0.6, detail: 0.005 });

    // The face z at (x, y); beyond the face edge the ray misses, so a lock follows the side of the head.
    const surfZ = (x: number, y: number): number => {
      for (let xx = Math.abs(x); xx > 0; xx -= 0.01) {
        const z = sdf.raycast(h.head, [xx, y, 1], [0, 0, -1])?.[2];
        if (z !== undefined) return z - Math.max(0, Math.abs(x) - xx) * 0.5;
      }
      return h.faceZ(0, y);
    };
    const onFace = (x: number, y: number, dz: number, r: number): P4 => [x, y, surfZ(x, y) + dz, r];
    const fringe = [1, -1].flatMap((s) => {
      const side = (pts: P4[]) => sdf.chain(pts.map((p): P4 => [s * p[0], p[1], p[2], p[3]]), 0.01);
      return [
        side([onFace(0.0, 0.775, 0.005, 0.026), onFace(0.07, 0.768, 0.012, 0.027), onFace(0.125, 0.745, 0.012, 0.025), onFace(0.17, 0.705, 0.01, 0.022)]),
        side([onFace(0.03, 0.756, 0.018, 0.02), onFace(0.09, 0.742, 0.022, 0.021), onFace(0.14, 0.716, 0.016, 0.02), onFace(0.18, 0.676, 0.012, 0.02)]),
        // the side lock, in front of the ear, ending in a curl
        side([onFace(0.185, 0.73, 0.004, 0.024), onFace(0.195, 0.675, 0.004, 0.022), onFace(0.195, 0.64, -0.004, 0.018)]),
      ];
    });
    k.body('fringe', sdf.smoothUnion(0.012, ...fringe).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.004 });

    // Curls: small rings along the fringe and in front of each ear.
    const curlAt = (x: number, y: number, dz: number, yaw: number) => {
      const p = onFace(x, y, dz, 0);
      return sdf.torus(0.021, 0.012).rotateX(90).rotateY(yaw).at(p[0], p[1], p[2]);
    };
    const curls = pair(
      sdf.union(
        curlAt(0.035, 0.754, 0.03, 0),
        curlAt(0.095, 0.742, 0.032, 15),
        curlAt(0.15, 0.712, 0.026, 40),
        curlAt(0.195, 0.69, 0.014, 70),
        curlAt(0.205, 0.652, 0.006, 80),
      ),
    );
    k.body('curls', curls.bone('head'), { color: hairColor, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ crown: a gold ring, five points, a ruby diamond
    const crownPose = (s: sdf.Shape) => s.scale(0.9).rotateX(-10).at(0, HEAD_Y + 0.03, -0.01);
    const ring = sdf
      .revolve(
        profile.polygon([
          [0.184, 0.095],
          [0.206, 0.095],
          [0.217, 0.168],
          [0.196, 0.168],
        ]),
      )
      .round(0.003)
      .scale([1, 1, 0.94]);
    const tipAngles = [0, 72, 144, 216, 288];
    const polar = (deg: number, r: number, y: number): [number, number, number] => [r * Math.sin(deg * rad), y, 0.94 * r * Math.cos(deg * rad)];
    const tri = (h2: number) => sdf.extrude(profile.polygon([[-0.062, -0.012], [0.062, -0.012], [0.014, h2], [-0.014, h2]]), 0.024, 0.004);
    const points = tipAngles.map((a, i) => {
      const p = polar(a, 0.207, 0.15);
      return tri(i === 0 ? 0.105 : 0.085).rotateY(a).at(p[0], p[1], p[2]);
    });
    k.body('crown', crownPose(sdf.smoothUnion(0.008, ring, ...points)).bone('head'), { ...goldMetal, detail: 0.005 });
    const gemPos = polar(0, 0.215, 0.135);
    const gem = sdf
      .box([0.034, 0.034, 0.02], 0.005)
      .rotateZ(45)
      .scale([0.8, 1.15, 1])
      .at(gemPos[0], gemPos[1], gemPos[2] + 0.004)
      .paint(C.ruby);
    k.body('gems', crownPose(gem).bone('head'), { color: C.ruby, roughness: 0.15, detail: 0.004 });

    // ------------------------------------------------------------------ the tunic: royal blue to mid-thigh, gold trim and emblem
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.135, 0.3],
            [0.15, 0.26],
            [0.162, 0.21],
            [0.172, 0.17],
            [0.174, 0.168],
            [0, 0.168],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.86])
      .round(0.004);
    const tunicCore = sdf.smoothUnion(0.03, h.torso.round(0.008), skirt).smoothIntersect(0.01, h.band(0.168, 0.455));
    // the blue shoulder caps (the white sleeves start below them)
    const shoulderCap = h.perArm((j) => sdf.sphere(0.055).at(...lerp(SHOULDER, j.ELBOW, 0.12)).bone('upperarm.L'));
    const yoke = sdf.extrude(profile.arc(0.086, 0.01, 212, 328), 0.5).at(0, 0.468, 0.2);
    const tunic = sdf
      .union(h.weighted(tunicCore), shoulderCap)
      .paintWhere(h.band(0.168, 0.182), C.gold, 0.002)
      .paintWhere(sdf.box([0.014, 0.15, 0.5]).at(0.058, 0.226, 0.25).mirror('x'), C.gold, 0.002)
      .paintWhere(yoke, C.gold, 0.002);
    k.body('tunic', tunic, {
      color: tunicColor,
      roughness: 0.8,
      detail: 0.005,
      bump: (x, y, z) => 0.0015 * Math.sin(x * 80 + y * 60) * Math.cos(z * 70),
    });

    // The sleeves: white, with brown cuffs and a gold seam at the blue shoulder cap.
    const sleeveOf = (j: { ELBOW: readonly [number, number, number]; WRIST: readonly [number, number, number] }) => {
      const upper = sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.044).bone('upperarm.L');
      const fore = sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.6), 0.044, 0.043).bone('forearm.L');
      return sdf.smoothUnion(0.015, upper, fore);
    };
    k.body('sleeves', h.perArm((j) => sleeveOf(j)), { color: C.sleeve, roughness: 0.9, detail: 0.005 });
    const cuffOf = (j: { ELBOW: readonly [number, number, number]; WRIST: readonly [number, number, number] }) =>
      sdf.cone(lerp(j.ELBOW, j.WRIST, 0.5), lerp(j.ELBOW, j.WRIST, 0.98), 0.047, 0.047).round(0.003).bone('forearm.L');
    k.body('cuffs', h.perArm((j) => cuffOf(j)), { color: C.belt, roughness: 0.7, detail: 0.004 });

    // The belt with a gold buckle, and two gold buttons on the chest.
    const beltShape = tunicCore.round(0.007).intersect(h.band(0.236, 0.276));
    k.body('belt', h.weighted(beltShape), { color: C.belt, roughness: 0.6, detail: 0.004 });
    const beltZ = sdf.raycast(beltShape, [0, 0.256, 1], [0, 0, -1])?.[2] ?? 0.14;
    const buckle = sdf
      .box([0.07, 0.058, 0.02], 0.006)
      .subtract(sdf.box([0.04, 0.032, 0.1]))
      .at(0, 0.256, beltZ + 0.004);
    k.body('buckle', buckle, { ...goldMetal, detail: 0.003, bone: 'spine' });

    const torsoFront = tunicCore.round(0.007);
    const chestZ = (x: number, y: number) => sdf.raycast(torsoFront, [x, y, 1], [0, 0, -1])?.[2] ?? 0.12;
    const buttonAt = (x: number, y: number) => sdf.cylinder(0.014, 0.012, 0.004).rotateX(90).at(x, y, chestZ(x, y) + 0.001);
    // The lion emblem: a gold disc with a mane of lobes, a lighter face, and two small eyes.
    const ey = 0.385;
    const ez = chestZ(0, ey);
    const mane = sdf.smoothUnion(
      0.008,
      sdf.ellipsoid([0.034, 0.034, 0.012]),
      ...[0, 45, 90, 135, 180, 225, 270, 315].map((a) => sdf.sphere(0.012).at(0.036 * Math.sin(a * rad), 0.036 * Math.cos(a * rad), 0)),
    );
    const lionFace = sdf.ellipsoid([0.02, 0.022, 0.012]).at(0, -0.002, 0.007).paint(C.goldLight);
    const lionEyes = pair(sdf.sphere(0.004).at(0.008, 0.005, 0.017)).paint('#6b4226');
    const emblem = sdf.union(mane, lionFace, lionEyes).at(0, ey, ez + 0.002);
    k.body('emblem', sdf.union(emblem, buttonAt(0.07, 0.335), buttonAt(-0.07, 0.335)), { ...goldMetal, detail: 0.003, bone: 'chest' });

    // ------------------------------------------------------------------ the red cape: a collar and a back panel to the calf
    const frontCut = sdf.extrude(profile.polygon([[-0.05, 0.5], [0.05, 0.5], [0.11, 0.3], [-0.11, 0.3]]), 0.5).at(0, 0, 0.27);
    const mantle = h.torso
      .round(0.026)
      .smoothIntersect(0.012, h.band(0.4, 0.462))
      .smoothSubtract(0.015, frontCut);
    const capeOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.15, 0.46],
            [0.19, 0.4],
            [0.235, 0.3],
            [0.265, 0.21],
            [0.3, 0.14],
            [0.31, 0.09],
            [0, 0.09],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.9])
      .at(0, 0, -0.025);
    const cape = capeOuter.subtract(capeOuter.round(-0.026)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.045));
    const capeAll = sdf.smoothUnion(0.03, h.weighted(mantle), cape.bone('cloak'));
    k.body('cape', capeAll, {
      color: C.cape,
      roughness: 0.9,
      detail: 0.006,
      bump: (x, y, z) => 0.004 * Math.sin(x * 55 + z * 30) * Math.cos(y * 40),
    });

    // ------------------------------------------------------------------ white trousers and tall brown boots
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.052).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.05, 0.002], 0.05, 0.048).bone('shin.L'),
    );
    k.body('trousers', sdf.smoothUnion(0.03, sdf.ellipsoid([0.12, 0.054, 0.09]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), {
      color: C.pantsBeige,
      roughness: 0.85,
      detail: 0.005,
    });
    const bootShaft = sdf.cone([ANKLE[0], 0.012, 0.0], [ANKLE[0], 0.07, 0.002], 0.056, 0.06).round(0.004).bone('shin.L');
    const bootCuff = sdf.cylinder(0.065, 0.026, 0.01).at(ANKLE[0], 0.06, 0.002).bone('shin.L');
    const bootFoot = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.058, 0.044, 0.105]).at(0, 0.042, 0.042), sdf.sphere(0.052).at(0, 0.05, -0.005))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(sdf.smoothUnion(0.012, bootShaft, bootFoot)), { color: C.boot, roughness: 0.55, detail: 0.005 });
    k.body('bootcuffs', pair(bootCuff), { color: C.bootTop, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the sword, raised in the right fist
    const GR = h.arms.R.GRIP;
    const sw = (s: sdf.Shape) => s.rotateZ(12).at(-(GR[0] - 0.006), GR[1] - 0.015, GR[2]);
    const grip = sdf.cylinder(0.0155, 0.1, 0.004).at(0, 0.008, 0);
    const pommel = sdf.sphere(0.022).at(0, -0.05, 0);
    const guard = sdf.box([0.082, 0.022, 0.03], 0.007).at(0, 0.066, 0);
    const guardTips = pair(sdf.sphere(0.016).at(0.041, 0.066, 0));
    const hilt = sdf.smoothUnion(0.006, grip, pommel, guard, guardTips);
    k.body('guard', sw(hilt), { ...goldMetal, detail: 0.003, bone: 'knife.R' });
    // A flat blade, 0.27 m long, 0.04 m wide, 0.014 m thick, with a pointed tip and a center ridge.
    const bladeProfile = profile.polygon([
      [-0.026, 0.07],
      [0.026, 0.07],
      [0.026, 0.3],
      [0, 0.345],
      [-0.026, 0.3],
    ]);
    const blade = sdf
      .extrude(bladeProfile, 0.014, 0.003)
      .smoothUnion(0.004, sdf.box([0.012, 0.27, 0.019], 0.004).at(0, 0.205, 0));
    k.body('blade', sw(blade), { color: C.steel, roughness: 0.3, metalness: 0.9, detail: 0.003, bone: 'knife.R' });
  },
});
