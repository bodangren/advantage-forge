import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Prospector — Chibi Quest hills NPC (catalog `npcs/wilderness/prospector`), about 1.0 m to the top
 * of the hat, faces +Z, stands on y = 0. Target: docs/npc-mockups/prospector_001.jpg. Built on the
 * humanoid kind.
 *
 * Role: a hills NPC who pans rivers for gold and gives treasure quests; seen at the river camp and
 *   the mine entrance in 3D and as a 128 px sprite. The gold pan with nuggets is the focal point.
 * One idea: a cheerful old prospector, all beard and hat brim, who offers a pan of shiny nuggets.
 * Shape language: round and soft (beard locks, hat, boots), the round pan as the one metal form.
 * Palette (60/30/10): red shirt #a83a30, brown felt hat #7a5a3a and boots #5a3a24 (the mid mass),
 *   blue work trousers #3f5a7a, gray beard #a8a4a0; the gold nuggets #e0b040 are the accent.
 * Value plan: the gray beard is the lightest big mass, the dark brown hat and boots frame the red
 *   shirt, the gold in the bright pan stands against the dark shirt.
 * Bodies: skin, nose, ears, hat, hair, brows, mustache, beard, shirt, suspenders, belt, brass,
 *   trousers, boots, pick (head, handle), pan, nuggets.
 * Rig: the humanoid kind's skeleton and clips. The left fist holds the pan out (rigid on `knife.L`);
 *   the right fist is raised in a wave. Both arms keep their pose in every clip.
 */

const POSE_L = { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] } as const;
// The right fist (mirrored to x < 0): a cheerful wave out to the side at shoulder height.
const POSE_R = { elbow: [0.2, 0.33, 0.02], wrist: [0.262, 0.408, 0.05] } as const;

const C = {
  hat: '#7a5a3a',
  hatBand: '#4e3a26',
  gray: '#a8a4a0',
  suspender: '#6b4226',
  trousers: '#3f5a7a',
  patch: '#6a7a9a',
  boots: '#5a3a24',
  bootTop: '#6e4a30',
  sole: '#3a2418',
  belt: '#4a3020',
  brass: '#c8a040',
  pickHead: '#6a6870',
  pickHandle: '#8a6a3a',
  pan: '#8a8c94',
  gold: '#e0b040',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
  button: '#d8d2c4',
};

const MOUTH_Y = 0.522;

export default humanoidAsset({
  name: 'prospector',
  description: 'A cheerful old prospector with a bushy gray beard and a floppy hat, holding out a gold pan with shiny nuggets.',
  reference: 'docs/npc-mockups/prospector_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e' },
    hair: { gray: '#a8a4a0', brown: '#5a301d', black: '#231a17', auburn: '#8e3b1c' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
    cloth: { madder: '#a83a30', ochre: '#b5833a', forest: '#4f6a40', indigo: '#4a5a7a' },
  },
  presets: {
    river: { skin: 'tan', hair: 'brown', eyes: 'hazel', cloth: 'ochre' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  pose: { L: POSE_L, R: POSE_R },

  // A delighted grin under the mustache: a wide crescent with round corners and one tooth band.
  // The kind's dark brows are painted out with skin; the bushy gray brows are their own body.
  paintSkin(skin, h) {
    const y = MOUTH_Y;
    const grin = profile.polygon(
      [
        [-0.05, 0.012],
        [-0.028, 0.004],
        [0, 0.002],
        [0.028, 0.004],
        [0.05, 0.012],
        [0.052, -0.004],
        [0.04, -0.02],
        [0.02, -0.032],
        [0, -0.036],
        [-0.02, -0.032],
        [-0.04, -0.02],
        [-0.052, -0.004],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.012))).intersect(sdf.box([0.07, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.024, 0.012, 0.08]), 0, y - 0.03);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, KNEE, ANKLE, HIP, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const pairHard = (s: sdf.Shape) => s.mirror('x', 0);
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const fz = (x: number, y: number): number => {
      try {
        return h.faceZ(Math.abs(x), y);
      } catch {
        return 0.07;
      }
    };
    const hairColor = k.tint('hair');
    const skinColor = h.tint.skin!;

    // ------------------------------------------------------------------ face: nose and big ears
    const nose = sdf.smoothUnion(0.01, sdf.ellipsoid([0.036, 0.032, 0.034]).at(0, 0.574, fz(0, 0.574) + 0.012)).bone('head');
    k.body('nose', nose, { color: skinColor, roughness: 0.55, detail: 0.004 });
    const ear = sdf
      .ellipsoid([0.042, 0.066, 0.046])
      .subtract(sdf.sphere(0.022).at(0.017, 0, 0.008))
      .rotateY(-14)
      .at(0.208, 0.612, -0.008)
      .bone('head');
    k.body('ears', pair(ear), { color: skinColor, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ hat: floppy brown felt with a dent
    const hatPose = (s: sdf.Shape) => s.rotateX(-14).rotateZ(3).at(0, HEAD_Y, 0);
    const crown = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.09, 0.295],
            [0.16, 0.282],
            [0.2, 0.255],
            [0.212, 0.18],
            [0.218, 0.075],
            [0, 0.075],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.92]);
    const brim = sdf
      .revolve(
        profile.polygon([
          [0.15, 0.1],
          [0.24, 0.097],
          [0.3, 0.075],
          [0.345, 0.05],
          [0.356, 0.034],
          [0.345, 0.024],
          [0.3, 0.046],
          [0.24, 0.066],
          [0.15, 0.07],
        ]),
      )
      .round(0.005)
      .scale([1, 1, 0.96]);
    const dent = sdf.ellipsoid([0.045, 0.05, 0.2]).at(0, 0.32, 0.0);
    const hatShape = sdf
      .smoothUnion(0.02, crown, brim)
      .smoothSubtract(0.03, dent)
      .paintWhere(sdf.box([1, 0.034, 1]).at(0, 0.105, 0).intersect(sdf.cylinder(0.228, 0.04).at(0, 0.105, 0)), C.hatBand, 0.003);
    k.body('hat', hatPose(hatShape).bone('head'), {
      color: C.hat,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 70 + z * 50) * Math.cos(y * 60),
    });

    // ------------------------------------------------------------------ gray hair under the hat: temples, nape, forehead tuft
    const lockR = (a: number): sdf.Shape => {
      const r = (a * Math.PI) / 180;
      const sx = Math.sin(r);
      const cz = Math.cos(r);
      return sdf.chain(
        [
          [0.2 * sx, 0.0, -0.17 * cz, 0.034],
          [0.205 * sx, -0.045, -0.172 * cz, 0.03],
          [0.2 * sx * 0.96, -0.09, -0.168 * cz, 0.02],
        ],
        0.012,
      );
    };
    const napeLocks = sdf.union(...[-80, -60, -40, -20, 0, 20, 40, 60, 80].map(lockR));
    const hairShell = sdf.ellipsoid([0.212, 0.207, 0.198]);
    const back = hairShell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.06)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const templeLock = (dz: number) =>
      sdf.chain(
        [
          [0.178, 0.055, 0.03 + dz, 0.032],
          [0.186, -0.005, 0.045 + dz, 0.03],
          [0.18, -0.06, 0.035 + dz, 0.02],
        ],
        0.012,
      );
    const temples = pair(sdf.smoothUnion(0.012, templeLock(0.0), templeLock(0.04), templeLock(-0.04)));
    const curl = (x0: number, s: number) =>
      sdf.chain(
        [
          [x0, 0.06, 0.176, 0.022],
          [x0 + 0.012 * s, 0.085, 0.192, 0.019],
          [x0 + 0.03 * s, 0.092, 0.204, 0.015],
          [x0 + 0.036 * s, 0.072, 0.202, 0.011],
        ],
        0.01,
      );
    const tuft = sdf.smoothUnion(0.012, sdf.ellipsoid([0.07, 0.03, 0.03]).at(0.0, 0.066, 0.168), curl(-0.045, -1), curl(0.0, 1), curl(0.05, 1));
    const hair = sdf.smoothUnion(0.015, back, napeLocks, temples, tuft).at(0, HEAD_Y, 0).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.65, detail: 0.005 });

    // ------------------------------------------------------------------ bushy brows
    const browLock = sdf.chain(
      [
        [0.04, 0.696, fz(0.04, 0.696) + 0.002, 0.013],
        [0.075, 0.711, fz(0.075, 0.711) + 0.004, 0.017],
        [0.115, 0.714, fz(0.115, 0.714) + 0.003, 0.017],
        [0.152, 0.696, fz(0.152, 0.696) + 0.002, 0.012],
      ],
      0.01,
    );
    k.body('brows', pair(browLock).bone('head'), { color: hairColor, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ mustache and beard (their own bodies on the head bone)
    const must = sdf.chain(
      [
        [0.004, 0.562, fz(0, 0.562) + 0.008, 0.021],
        [0.04, 0.557, fz(0.04, 0.557) + 0.01, 0.024],
        [0.085, 0.55, fz(0.085, 0.55) + 0.01, 0.023],
        [0.125, 0.548, fz(0.12, 0.548) + 0.0, 0.019],
        [0.148, 0.562, fz(0.12, 0.56) - 0.015, 0.013],
      ],
      0.012,
    );
    const must2 = sdf.chain(
      [
        [0.01, 0.548, fz(0, 0.548) + 0.012, 0.016],
        [0.05, 0.541, fz(0.05, 0.541) + 0.012, 0.017],
        [0.1, 0.534, fz(0.1, 0.534) + 0.006, 0.014],
      ],
      0.01,
    );
    k.body('mustache', pair(sdf.smoothUnion(0.012, must, must2)).bone('head'), { color: hairColor, roughness: 0.65, detail: 0.004 });

    // Eleven locks per side in two layers: shorter outer locks along the jaw, longer ones in front.
    const lockSpecs: [number, number, number, number, number][] = [
      // x0, y0 (start), x1 (end x), y1 (end y), radius
      [0.15, 0.57, 0.15, 0.46, 0.028],
      [0.14, 0.545, 0.135, 0.435, 0.029],
      [0.125, 0.525, 0.115, 0.41, 0.029],
      [0.108, 0.508, 0.095, 0.395, 0.028],
      [0.09, 0.495, 0.078, 0.38, 0.027],
      [0.072, 0.488, 0.062, 0.37, 0.026],
      [0.054, 0.486, 0.046, 0.36, 0.025],
      [0.036, 0.484, 0.032, 0.352, 0.025],
      [0.02, 0.484, 0.018, 0.345, 0.024],
      [0.008, 0.484, 0.006, 0.34, 0.022],
      [0.115, 0.52, 0.12, 0.465, 0.02],
    ];
    const beardLock = ([x0, y0, x1, y1, r]: [number, number, number, number, number]) => {
      const z0 = Math.max(0.05, fz(x0, y0) - 0.012);
      const zEnd = Math.max(0.045, 0.118 * Math.sqrt(Math.max(0, 1 - (x1 / 0.2) ** 2)));
      const mid: [number, number, number, number] = [(x0 + x1) / 2 + 0.004, (y0 + y1) / 2, (z0 + zEnd) / 2 + 0.012, r * 1.12];
      return sdf.chain([[x0, y0, z0, r * 1.05], mid, [x1, y1, zEnd, r * 0.55]], 0.014);
    };
    const beard = pair(sdf.smoothUnion(0.014, ...lockSpecs.map(beardLock)));
    k.body('beard', beard.bone('head'), { color: hairColor, roughness: 0.7, detail: 0.005, bump: (x, y, z) => 0.005 * Math.sin(x * 230 + z * 60) * Math.cos(y * 25) });

    // ------------------------------------------------------------------ red shirt, long sleeves, collar
    const sleeve = (j: { ELBOW: readonly [number, number, number]; WRIST: readonly [number, number, number] }) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.97), 0.043, 0.04).bone('forearm.L'),
        sdf.cone(lerp(j.ELBOW, j.WRIST, 0.72), lerp(j.ELBOW, j.WRIST, 1.0), 0.0455, 0.047).round(0.002).bone('forearm.L'),
      );
    const torsoUp = h.torso.intersect(h.band(0.24, 0.5));
    const shirt = sdf
      .smoothUnion(0.012, h.weighted(torsoUp), h.perArm(sleeve))
      .paintWhere(sdf.box([0.012, 0.2, 1]).at(0, 0.36, 0.2), '#8c2e26', 0.003); // the placket
    k.body('shirt', shirt, { color: h.tint.shirt ?? '#a83a30', roughness: 0.85 });
    const collar = sdf.torus(0.064, 0.018).at(0, 0.455, -0.012).bone('chest');
    k.body('collar', collar, { color: h.tint.shirt ?? '#a83a30', roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ suspenders, belt, brass
    const strapShell = h.torso.round(0.012);
    const strapOne = strapShell
      .intersect(sdf.box([0.034, 0.215, 0.5]).at(0.078, 0.3475, 0.25))
      .intersect(sdf.halfSpace([0, 1, 0], 0.455));
    k.body('suspenders', h.weighted(pairHard(strapOne)), { color: C.suspender, roughness: 0.75, detail: 0.004 });
    const belt = h.torso.round(0.014).intersect(h.band(0.246, 0.282));
    k.body('belt', h.weighted(belt), { color: C.belt, roughness: 0.7, detail: 0.004 });
    const buckle = sdf
      .box([0.07, 0.04, 0.02], 0.006)
      .subtract(sdf.box([0.046, 0.022, 0.05], 0.004))
      .at(0, 0.264, 0.114)
      .bone('spine');
    const buttons = sdf.union(
      ...[0.078, -0.078].map((x) => sdf.sphere(0.013).at(x, 0.292, 0.096).bone('spine')),
      sdf.sphere(0.01).at(0, 0.375, 0.1).bone('chest'),
      sdf.sphere(0.01).at(0, 0.33, 0.1).bone('chest'),
    );
    k.body('brass', sdf.union(buckle, buttons), { color: C.brass, roughness: 0.4, metalness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ patched blue trousers
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.105, 0.002], 0.048, 0.047).bone('shin.L'),
    );
    const waist = h.weighted(h.torso.round(0.007).intersect(h.band(0.152, 0.27)));
    const rightPatch = sdf.box([0.045, 0.052, 0.3]).at(-(KNEE[0] + 0.005), 0.15, 0.15);
    const pants = sdf
      .smoothUnion(0.03, waist, pair(trouserLeg))
      .paintWhere(rightPatch, C.patch, 0.003);
    k.body('trousers', pants, { color: C.trousers, roughness: 0.85, bump: (x, y, z) => 0.0015 * Math.sin(x * 120) * Math.cos(y * 120 + z * 40) });

    // ------------------------------------------------------------------ scuffed brown boots
    const shaft = sdf.cylinder(0.054, 0.116, 0.014).at(0, 0.058, 0);
    const bootFoot = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([0.06, 0.05, 0.105]).at(0, 0.047, 0.043),
        sdf.cylinder(0.052, 0.07, 0.015).at(0, 0.04, 0),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf
      .union(
        shaft.intersect(sdf.halfSpace([0, -1, 0], -0.07)).bone('shin.L'),
        sdf.union(shaft.intersect(sdf.halfSpace([0, 1, 0], 0.07)), bootFoot).bone('foot.L'),
      )
      .paintWhere(sdf.box([1, 0.026, 1]).at(0, 0.103, 0), C.bootTop, 0.003)
      .paintWhere(sole.subtract(bootFoot.round(-0.002)), C.sole, 0.002)
      .rotateY(12)
      .at(ANKLE[0], 0, 0);
    k.body('boots', pair(boot), {
      color: C.boots,
      roughness: 0.7,
      detail: 0.004,
      bump: (x, y, z) => 0.0025 * noiseBump(x * 90, y * 90, z * 90),
    });

    // ------------------------------------------------------------------ the pick on the belt (right hip, x < 0)
    const handle = sdf.capsule([0, 0.275, 0], [0, 0.125, 0], 0.014).at(-0.168, 0, 0.01).bone('hips');
    const pickHead = sdf
      .union(
        sdf.cone([-0.168, 0.28, 0.1], [-0.168, 0.28, 0.0], 0.006, 0.02),
        sdf.cone([-0.168, 0.28, -0.1], [-0.168, 0.28, 0.0], 0.006, 0.02),
      )
      .smoothUnion(0.01, sdf.sphere(0.022).at(-0.168, 0.28, 0.01))
      .bone('hips');
    k.body('pickHandle', handle, { color: C.pickHandle, roughness: 0.8, detail: 0.003 });
    k.body('pickHead', pickHead, { color: C.pickHead, roughness: 0.45, metalness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ the gold pan and its nuggets (rigid on knife.L)
    const g = h.arms.L.GRIP;
    const panAt = (s: sdf.Shape) => s.at(g[0] + 0.0, g[1] + 0.035, g[2] + 0.045);
    const pan = panAt(
      sdf
        .revolve(
          profile.polygon([
            [0, 0],
            [0.05, 0],
            [0.088, 0.012],
            [0.106, 0.035],
            [0.113, 0.055],
            [0.099, 0.055],
            [0.092, 0.04],
            [0.074, 0.026],
            [0.04, 0.018],
            [0, 0.018],
          ]),
        )
        .round(0.003),
    );
    k.body('pan', pan, { color: C.pan, roughness: 0.4, metalness: 0.6, detail: 0.004, bone: 'knife.L' });
    const nuggetSpecs: [number, number, number, number, number, number][] = [
      // x, z, y, rx, ry, rz (offsets from the pan center and its floor)
      [0.0, 0.0, 0.03, 0.017, 0.013, 0.015],
      [0.04, 0.01, 0.03, 0.016, 0.012, 0.014],
      [-0.04, 0.012, 0.03, 0.015, 0.012, 0.016],
      [0.01, 0.044, 0.03, 0.016, 0.013, 0.014],
      [0.012, -0.042, 0.03, 0.015, 0.012, 0.015],
      [-0.03, -0.03, 0.032, 0.014, 0.012, 0.014],
      [0.034, 0.038, 0.034, 0.014, 0.012, 0.013],
      [0.025, -0.02, 0.05, 0.016, 0.013, 0.014],
      [-0.02, 0.018, 0.052, 0.015, 0.013, 0.015],
      [0.01, 0.0, 0.065, 0.014, 0.012, 0.013],
      [-0.034, 0.005, 0.046, 0.013, 0.011, 0.013],
    ];
    const nuggets = panAt(
      sdf.union(...nuggetSpecs.map(([x, z, y, rx, ry, rz], i) => sdf.ellipsoid([rx, ry, rz]).rotateY(i * 37).at(x, y, z))),
    );
    k.body('nuggets', nuggets, { color: C.gold, roughness: 0.3, metalness: 0.8, detail: 0.003, bone: 'knife.L' });
  },
});

// A cheap deterministic scuff pattern for the boot bump.
function noiseBump(x: number, y: number, z: number): number {
  return Math.sin(x * 1.7 + y * 2.3) * Math.cos(z * 1.3 + x * 0.7) * 0.6 + Math.sin(y * 5.1 + z * 4.3) * 0.4;
}
