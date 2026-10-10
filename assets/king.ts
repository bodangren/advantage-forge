import { noise, profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * King — Chibi Quest court NPC (catalog `npcs/court-and-faction/king`), about 1.05 m to the top of
 * the crown's finial, faces +Z. Target: docs/npc-mockups/king_001.jpg. Built on the humanoid kind.
 *
 * Role: the kind ruler who gives the main quests, seen in the throne room in 3D and as a 128 px
 *   sprite; the crown, the huge white beard, the ermine cape, and the two regalia must read.
 * One idea: a jolly old king who is mostly beard and cape: a big fluffy white beard under a gold
 *   crown, a round belly in red velvet, and a wide ermine cape that spreads behind him.
 * Shape language: round and soft (beard, belly, cape, orb), with the crown points as the hard accent.
 * Palette (60/30/10): red velvet #a82a30 and ermine white #f6f1ea; hair and beard #ece8e0; gold
 *   #e0b040 (crown, scepter, orb, buckle) with red #c83a3a and blue #3a6ab0 jewels; a dark belt.
 * Value plan: the white beard and cape frame the red robe; the gold crown and regalia are the accent.
 * Bodies: skin, ears, nose, hair, brows, mustache, beard, crown, cap, gems, robe, belt, buckle,
 *   cuffs, ermine, scepter, orb.
 * Rig: the humanoid kind's skeleton and clips; both arms keep a held pose (the left holds the orb
 *   out in front, the right holds the scepter upright). The cape is tagged to `cloak`; the lower
 *   beard rides the chest so that the head can bow in the rest clip.
 */

const C = {
  gold: '#e0b040',
  ruby: '#c83a3a',
  sapphire: '#3a6ab0',
  cap: '#5b8fd0',
  ermine: '#f6f1ea',
  spot: '#2a2428',
  belt: '#3e302c',
  cuff: '#f6f1ea',
  pants: '#efe6d4',
  shoe: '#a82a30',
};

// Both arms are held out: the left carries the orb, the right carries the scepter (left-side values).
const POSE_L = { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] } as const;
const POSE_R = { elbow: [0.18, 0.335, 0.04], wrist: [0.215, 0.33, 0.13] } as const;

export default humanoidAsset({
  name: 'king',
  description: 'A jolly old king in a gold crown, a red velvet robe, and an ermine cape, with a scepter and a golden orb.',
  reference: 'docs/npc-mockups/king_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { white: '#ece8e0', silver: '#b8b4c4', blond: '#c4974a', auburn: '#8e3b1c', brown: '#5a301d', black: '#231a17', teal: '#2f6f6a' },
    eyes: { blue: '#2f6aa8', brown: '#6e4020', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { crimson: '#a82a30', plum: '#6a3a78', ocean: '#2f5f82', forest: '#2f5a42' },
  },
  presets: {
    royal: { skin: 'fair', hair: 'white', eyes: 'blue', cloth: 'crimson' },
    winter: { skin: 'light', hair: 'silver', eyes: 'brown', cloth: 'ocean' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: C.shoe,
  lashes: false,
  pose: { L: POSE_L, R: POSE_R },

  // Level brows are painted out and replaced by bushy white brows (a body); the cheeks stay rosy.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const cheeks = h.onFace(sdf.sphere(0.03), 0.15, 0.585).mirror('x');
    return skin.paintWhere(oldBrows, h.tint.skin!, 0.002).paintWhere(cheeks, h.tint.blush!, 0.012);
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    type P4 = [number, number, number, number];
    const hairColor = k.tint('hair');
    const skinColor = h.tint.skin ?? '#f2c7a4';
    const robeColor = h.tint.shirt ?? '#a82a30';
    const rad = Math.PI / 180;

    // ------------------------------------------------------------------ face: ears, nose, brows
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const ear = sdf
      .ellipsoid([0.038, 0.058, 0.04])
      .subtract(sdf.sphere(0.022).at(0.018, 0, 0.008))
      .rotateY(-12)
      .at(0.213, 0.62, -0.01)
      .bone('head');
    k.body('ears', pair(ear), { color: skinColor, roughness: 0.55, detail: 0.004 });
    const noseY = 0.59;
    const nose = sdf.ellipsoid([0.034, 0.031, 0.034]).at(0, noseY, h.faceZ(0, noseY) + 0.012).bone('head');
    k.body('nose', nose, { color: k.tint('skin', { color: '#eeab8a', follow: 1 }), roughness: 0.5, detail: 0.004 });

    const onFace = (x: number, y: number, dz: number, r: number): P4 => [x, y, h.faceZ(x, y) + dz, r];
    const brow = sdf.chain([onFace(0.05, 0.718, 0.01, 0.015), onFace(0.09, 0.738, 0.012, 0.019), onFace(0.13, 0.738, 0.01, 0.019), onFace(0.165, 0.712, 0.006, 0.015)], 0.01);
    const must = sdf.chain(
      [onFace(0.008, 0.535, 0.016, 0.029), onFace(0.058, 0.524, 0.018, 0.031), onFace(0.108, 0.53, 0.012, 0.029), onFace(0.15, 0.552, 0.0, 0.021)],
      0.012,
    );
    k.body('brows', pair(brow).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.004 });
    k.body('mustache', pair(must).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a small cap and back locks
    const hairCap = sdf
      .ellipsoid([0.212, 0.206, 0.197])
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0.03))
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.07))
      .smoothSubtract(0.03, pair(sdf.ellipsoid([0.05, 0.065, 0.05]).at(0.205, -0.055, -0.01)));
    const backLocks = [90, 112, 135, 157, 180, 202, 225, 247, 270].map((deg) => {
      const x = 0.185 * Math.sin(deg * rad);
      const z = 0.175 * Math.cos(deg * rad);
      return sdf.chain(
        [
          [x, 0.01, z, 0.035],
          [x * 1.02, -0.05, z * 1.02, 0.034],
          [x * 0.92, -0.115, z * 0.92, 0.024],
        ],
        0.012,
      );
    });
    k.body('hair', headPose(hairCap.smoothUnion(0.014, ...backLocks)).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ beard: fluffy locks, upper on the head, lower on the chest
    const lock = (pts: P4[]) => sdf.chain(pts, 0.012);
    const beardLocks = [
      lock([[0, 0.54, 0.15, 0.05], [0, 0.46, 0.168, 0.065], [0, 0.375, 0.168, 0.06], [0, 0.325, 0.158, 0.045]]),
      ...[1, -1].flatMap((s) => [
        lock([[s * 0.058, 0.54, 0.145, 0.048], [s * 0.065, 0.46, 0.162, 0.06], [s * 0.06, 0.38, 0.16, 0.054], [s * 0.045, 0.34, 0.15, 0.038]]),
        lock([[s * 0.115, 0.56, 0.115, 0.045], [s * 0.118, 0.48, 0.14, 0.055], [s * 0.1, 0.41, 0.146, 0.05], [s * 0.08, 0.37, 0.14, 0.034]]),
        lock([[s * 0.165, 0.6, 0.05, 0.04], [s * 0.165, 0.52, 0.075, 0.05], [s * 0.15, 0.46, 0.1, 0.048], [s * 0.13, 0.42, 0.112, 0.036]]),
        lock([[s * 0.03, 0.5, 0.17, 0.04], [s * 0.035, 0.43, 0.178, 0.045], [s * 0.03, 0.365, 0.172, 0.04]]),
        // the white hair at the temple, running down in front of the ear into the beard
        lock([onFace(0.18, 0.745, 0.008, 0.02), onFace(0.19, 0.67, 0.008, 0.022), onFace(0.184, 0.6, 0.012, 0.024), onFace(0.16, 0.54, 0.02, 0.03)].map((p): P4 => [s * p[0], p[1], p[2], p[3]])),
      ]),
    ];
    const beard = sdf.smoothUnion(0.012, ...beardLocks);
    const beardShape = sdf.union(
      beard.intersect(h.band(0.44, 0.8)).bone('head'),
      beard.intersect(h.band(0.2, 0.45)).bone('chest'),
    );
    k.body('beard', beardShape, {
      color: hairColor,
      roughness: 0.65,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 45, y * 25, z * 45, 2),
    });

    // ------------------------------------------------------------------ crown: a gold ring, six points, jewels, a blue cap
    const crownPose = (s: sdf.Shape) => s.rotateX(-6).at(0, HEAD_Y, 0);
    const ring = sdf
      .revolve(
        profile.polygon([
          [0.19, 0.088],
          [0.213, 0.088],
          [0.227, 0.172],
          [0.205, 0.172],
        ]),
      )
      .round(0.003)
      .scale([1, 1, 0.93]);
    const tipAngles = [0, 60, 120, 180, 240, 300];
    const polar = (deg: number, r: number, y: number): [number, number, number] => [r * Math.sin(deg * rad), y, 0.93 * r * Math.cos(deg * rad)];
    const points = tipAngles.map((a) => sdf.cone(polar(a, 0.218, 0.16), polar(a, 0.232, 0.232), 0.034, 0.009).round(0.002));
    const finial = sdf.smoothUnion(0.01, sdf.sphere(0.03).at(0, 0.248, -0.005), sdf.cylinder(0.014, 0.05, 0.004).at(0, 0.225, -0.005));
    k.body('crown', crownPose(sdf.smoothUnion(0.008, ring, ...points).union(finial)).bone('head'), {
      color: C.gold,
      roughness: 0.35,
      metalness: 0.8,
      detail: 0.005,
    });
    const domeShape = sdf.ellipsoid([0.212, 0.22, 0.196]).intersect(sdf.halfSpace([0, -1, 0], -0.085));
    k.body('cap', crownPose(domeShape).bone('head'), { color: C.cap, roughness: 0.85, detail: 0.005 });
    const balls = tipAngles.map((a) => {
      const p = polar(a, 0.232, 0.25);
      return sdf.sphere(0.021).at(p[0], p[1], p[2]).paint(C.ruby);
    });
    const jewelAt = (deg: number, r: number, color: string) => {
      const p = polar(deg, 0.222, 0.13);
      return sdf.ellipsoid([r, r * 1.1, r * 0.8]).rotateY(deg).at(p[0], p[1], p[2]).paint(color);
    };
    const gems = sdf.union(...balls, jewelAt(0, 0.021, C.sapphire), jewelAt(34, 0.016, C.ruby), jewelAt(-34, 0.016, C.ruby), jewelAt(72, 0.015, C.sapphire), jewelAt(-72, 0.015, C.sapphire));
    k.body('gems', crownPose(gems).bone('head'), { color: C.ruby, roughness: 0.15, detail: 0.005 });

    // ------------------------------------------------------------------ red robe: long skirt, round belly, wide sleeves, gold trim
    const belly = sdf.ellipsoid([0.142, 0.11, 0.118]).at(0, 0.265, 0.032);
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.135, 0.3],
            [0.15, 0.25],
            [0.172, 0.18],
            [0.192, 0.12],
            [0.195, 0.1],
            [0, 0.1],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.88]);
    const robeCore = sdf.smoothUnion(0.03, h.torso.round(0.008), belly, skirt).smoothIntersect(0.01, h.band(0.1, 0.455));
    const sleeveOf = (j: { ELBOW: readonly [number, number, number]; WRIST: readonly [number, number, number] }) => {
      const upper = sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.054, 0.05).bone('upperarm.L');
      const fore = sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.86), 0.05, 0.046).bone('forearm.L');
      return sdf.smoothUnion(0.015, upper, fore);
    };
    const cuffOf = (j: { ELBOW: readonly [number, number, number]; WRIST: readonly [number, number, number] }) =>
      sdf.cone(lerp(j.ELBOW, j.WRIST, 0.8), lerp(j.ELBOW, j.WRIST, 0.97), 0.05, 0.051).round(0.002).bone('forearm.L');
    const sleeves = h.perArm((j) => sleeveOf(j));
    const trap = (top: number, bottom: number) =>
      profile.polygon([
        [-top, 0.285],
        [top, 0.285],
        [bottom, 0.1],
        [-bottom, 0.1],
      ]);
    const stripe = sdf.extrude(trap(0.085, 0.125), 0.5).at(0, 0, 0.25).subtract(sdf.extrude(trap(0.068, 0.108), 0.6).at(0, 0, 0.25));
    const robe = sdf
      .union(h.weighted(robeCore), sleeves)
      .paintWhere(stripe, C.gold, 0.002)
      .paintWhere(h.band(0.09, 0.118), C.gold, 0.003);
    k.body('robe', robe, {
      color: robeColor,
      roughness: 0.8,
      detail: 0.005,
      bump: (x, y, z) => 0.002 * Math.sin(x * 70 + y * 50) * Math.cos(z * 60),
    });
    k.body('cuffs', h.perArm((j) => cuffOf(j)), { color: C.cuff, roughness: 0.9, detail: 0.004 });

    // The belt (dark leather) with a gold buckle at the front.
    const beltShape = robeCore.round(0.008).intersect(h.band(0.245, 0.285));
    k.body('belt', h.weighted(beltShape), { color: C.belt, roughness: 0.6, detail: 0.004 });
    const beltZ = sdf.raycast(beltShape, [0, 0.265, 1], [0, 0, -1])?.[2] ?? 0.14;
    const buckle = sdf
      .box([0.08, 0.064, 0.022], 0.006)
      .subtract(sdf.box([0.046, 0.036, 0.1]))
      .at(0, 0.265, beltZ + 0.004);
    k.body('buckle', buckle, { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.003, bone: 'spine' });

    // ------------------------------------------------------------------ ermine: a shoulder mantle and a wide back cape
    const frontCut = sdf.extrude(profile.polygon([[-0.055, 0.5], [0.055, 0.5], [0.115, 0.3], [-0.115, 0.3]]), 0.5).at(0, 0, 0.27);
    const mantle = h.torso
      .round(0.032)
      .smoothIntersect(0.012, h.band(0.325, 0.462))
      .smoothSubtract(0.015, frontCut);
    const capeOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.15, 0.46],
            [0.185, 0.4],
            [0.225, 0.3],
            [0.28, 0.2],
            [0.335, 0.1],
            [0.36, 0.04],
            [0, 0.04],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.9])
      .at(0, 0, -0.025);
    const cape = capeOuter.subtract(capeOuter.round(-0.032)).smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0.09));
    const ermine = sdf
      .smoothUnion(0.03, h.weighted(mantle), cape.bone('cloak'))
      .paintFn((x, y, z, base) => {
        const cell = 0.085;
        const u = Math.atan2(x, -(z + 0.025)) * 0.22;
        const i = Math.floor(u / cell);
        const j = Math.floor(y / cell);
        const cx = (i + 0.25 + 0.5 * noise.random(i, j, 1)) * cell;
        const cy = (j + 0.25 + 0.5 * noise.random(i, j, 2)) * cell;
        const d = Math.hypot(u - cx, y - cy);
        return noise.random(i, j, 3) > 0.4 && d < 0.017 ? rgb(C.spot) : base;
      });
    k.body('ermine', ermine, {
      color: C.ermine,
      roughness: 0.95,
      detail: 0.006,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // ------------------------------------------------------------------ scepter, held upright in the right fist
    const GR = h.arms.R.GRIP;
    const sc = (s: sdf.Shape) => s.rotateZ(12).at(-GR[0], GR[1], GR[2]);
    const shaft = sdf.cylinder(0.0135, 0.24, 0.004).at(0, 0.02, 0);
    const collarRing = (y: number) => sdf.torus(0.019, 0.007).at(0, y, 0);
    const knob = sdf.smoothUnion(0.008, sdf.sphere(0.034).at(0, 0.165, 0), collarRing(0.125), collarRing(0.205));
    const scepterGold = sdf.smoothUnion(0.006, shaft, knob, sdf.sphere(0.012).at(0, -0.105, 0));
    const scepterJewel = sdf.ellipsoid([0.02, 0.026, 0.02]).at(0, 0.232, 0).paint(C.ruby);
    k.body('scepter', sc(sdf.union(scepterGold, scepterJewel)), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.003, bone: 'knife.R' });

    // ------------------------------------------------------------------ the orb with a cross, held in the left hand
    const GL = h.arms.L.GRIP;
    const orbAt = (s: sdf.Shape) => s.at(GL[0], GL[1] + 0.058, GL[2] + 0.005);
    const orb = sdf.union(
      sdf.sphere(0.04),
      sdf.torus(0.04, 0.007).at(0, 0, 0),
      sdf.torus(0.03, 0.007).at(0, -0.03, 0),
      sdf.cylinder(0.016, 0.01, 0.003).at(0, 0.04, 0),
      sdf.box([0.01, 0.042, 0.01], 0.003).at(0, 0.066, 0),
      sdf.box([0.032, 0.01, 0.01], 0.003).at(0, 0.072, 0),
    );
    const orbGem = sdf.sphere(0.009).at(0, 0.0, 0.043).paint(C.ruby);
    k.body('orb', orbAt(sdf.union(orb, orbGem)), { color: C.gold, roughness: 0.3, metalness: 0.8, detail: 0.003, bone: 'knife.L' });
  },
});
