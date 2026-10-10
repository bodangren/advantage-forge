import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Royal guard — Chibi Quest court NPC (catalog `npcs/court-and-faction/royal-guard`), about 1.08 m to
 * the top of the helmet plume, faces +Z. Target: docs/npc-mockups/royal-guard_001.jpg. Built on the
 * humanoid kind.
 *
 * Role: a palace NPC (the gate and the throne room), seen in 3D and as a 128 px sprite; the silver
 *   helmet with the red plume, the mustache, and the tall halberd must read.
 * One idea: a proud little guard in a red and gold coat whose silver helmet, big plume, and tall
 *   halberd make a tall, straight silhouette.
 * Shape language: round (helmet dome, boots, fists) with straight, hard forms (the halberd, the belt).
 * Palette (60/30/10): coat red #b03a30; silver #c8ccd4 (helmet, halberd head); gold #e0b040 (buttons,
 *   cords, belt buckle, collar); trousers #f0ece4; boots #2a2428; pole #6b4a2c; hair, mustache #6b3e22.
 * Value plan: the light face under the dark-edged silver helmet is the focal point; the red coat is
 *   the large mass; white trousers over black boots; the red plume is the accent.
 * Bodies: skin, hair, mustache, nose, helmet, helmet-badge, plume, coat, collar, belt, buckle, gold,
 *   cuffs, bracers, boots, pole, halberd-head.
 * Rig: the humanoid kind's skeleton and clips. The right arm holds the pole (a `pose` for the right
 *   arm); the pole and the blade are rigid on `knife.R`.
 */

const C = {
  white: '#f0ece4',
  black: '#2a2428',
  gold: '#e0b040',
  silver: '#c8ccd4',
  plume: '#c03a30',
  pole: '#6b4a2c',
  mouth: '#8a2e2a',
};

type V3 = [number, number, number];

export default humanoidAsset({
  name: 'royal-guard',
  description: 'A loyal, proud royal guard in a red and gold coat and a plumed silver helmet, holding a tall halberd upright.',
  reference: 'docs/npc-mockups/royal-guard_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#6b3e22', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { scarlet: '#b03a30', burgundy: '#7a2f3c', rust: '#a4532c', midnight: '#34426a' },
  },
  presets: {
    household: { skin: 'tan', hair: 'black', eyes: 'hazel', cloth: 'midnight' },
  },
  hair: false,
  undershirt: false,
  pants: C.white,
  shoes: false,
  lashes: false,
  // The right hand (x < 0) holds the pole out to the side and forward, forearm level; the left arm hangs.
  pose: {
    R: { elbow: [0.23, 0.33, 0.03] as const, wrist: [0.28, 0.3, 0.115] as const },
  },

  // A small, proud smile; the kind's brows stay (arched). The mustache is geometry.
  paintSkin(skin) {
    const mouth = sdf.extrude(profile.arc(0.055, 0.009, 236, 304), 0.3).at(0, 0.5 + 0.055, 0.1);
    return skin.paintWhere(mouth, C.mouth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const lerp = (a: readonly number[], b: readonly number[], t: number): V3 => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const skinColor = k.tint('skin');
    const coatColor = h.tint.shirt ?? '#b03a30';

    // ------------------------------------------------------------------ nose and mustache
    const noseZ = h.faceZ(0, 0.566);
    k.body('nose', sdf.sphere(0.027).at(0, 0.56, noseZ - 0.006).bone('head'), { color: skinColor, roughness: 0.55, detail: 0.004, textureDensity: 2 });
    const stache: Array<[number, number, number]> = [
      [0.012, 0.55, 0.017],
      [0.045, 0.541, 0.018],
      [0.08, 0.54, 0.016],
      [0.112, 0.552, 0.0135],
      [0.128, 0.57, 0.01],
    ];
    const zAt = (x: number, y: number) => h.faceZ(Math.min(x, 0.11), y) + 0.004;
    const half = sdf.chain(stache.map(([x, y, r]): [number, number, number, number] => [x, y, zAt(x, y), r]), 0.01);
    k.body('mustache', pair(half).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.003, textureDensity: 2 });

    // ------------------------------------------------------------------ the helmet: dome, visor, cheek guards, badge, plume
    const cap = sdf
      .ellipsoid([0.23, 0.237, 0.217])
      .at(0, 0.0, 0)
      .intersect(sdf.halfSpace([0, -1 / 1.0595, 0.35 / 1.0595], -0.005 / 1.0595))
      .smoothIntersect(0.01, sdf.box([0.6, 0.6, 0.6]).at(0, 0.3 + 0.06, 0));
    const visor = sdf.ellipsoid([0.17, 0.016, 0.08]).rotateX(-8).at(0, 0.067, 0.185);
    const guardShape = sdf.ellipsoid([0.013, 0.12, 0.075]).at(0.218, -0.065, 0.0);
    const guards = pair(guardShape);
    const crown = sdf.smoothUnion(0.012, cap, visor, guards);
    const helmetPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    k.body('helmet', helmetPose(crown).bone('head'), {
      color: C.silver,
      roughness: 0.3,
      metalness: 0.9,
      detail: 0.0045,
    });
    // Gold badge on the front of the dome with two small antler curls, and the plume socket on top.
    const badgeY = 0.15;
    const badgeZ = sdf.raycast(cap, [0, badgeY, 1], [0, 0, -1])?.[2] ?? 0.17;
    const antler = (s: 1 | -1) =>
      sdf.chain(
        [
          [s * 0.008, badgeY - 0.01, badgeZ + 0.004, 0.004],
          [s * 0.022, badgeY - 0.002, badgeZ + 0.002, 0.004],
          [s * 0.03, badgeY + 0.014, badgeZ - 0.002, 0.0035],
        ],
        0.004,
      );
    const badge = sdf.smoothUnion(0.004, sdf.ellipsoid([0.02, 0.024, 0.008]).rotateX(-25).at(0, badgeY - 0.01, badgeZ + 0.002), antler(1), antler(-1));
    const socket = sdf.cylinder(0.034, 0.03, 0.01).at(0, 0.232, -0.002);
    k.body('helmet-gold', helmetPose(sdf.union(badge, socket)).bone('head'), { color: C.gold, roughness: 0.4, metalness: 0.7, detail: 0.003 });
    // The plume: a tall, swept crest of red lobes.
    const plumeCol: Array<[number, number, number, number]> = [
      [0, 0.24, 0.0, 0.03],
      [0, 0.285, -0.008, 0.035],
      [0, 0.335, -0.016, 0.038],
      [0, 0.375, -0.028, 0.032],
      [0, 0.4, -0.04, 0.02],
    ];
    const plume = sdf.smoothUnion(
      0.014,
      sdf.chain(plumeCol, 0.02),
      ...plumeCol.slice(1, 4).flatMap(([, y, z, r]) => [
        sdf.sphere(r * 0.62).at(0.026, y - 0.01, z + 0.002),
        sdf.sphere(r * 0.62).at(-0.026, y - 0.01, z + 0.002),
      ]),
    );
    k.body('plume', helmetPose(plume).bone('head'), {
      color: C.plume,
      roughness: 0.85,
      detail: 0.004,
      bump: (x, y, z) => 0.003 * Math.sin(y * 150 + x * 40) * Math.cos(z * 90),
    });

    // ------------------------------------------------------------------ brown hair at the nape under the helmet, in locks
    const onHead = (azDeg: number, y: number, out: number): V3 => {
      const a = (azDeg * Math.PI) / 180;
      const e = Math.sqrt(Math.max(0, 1 - (y / 0.2) ** 2));
      return [(0.205 * e + out) * Math.sin(a), y, (0.19 * e + out) * Math.cos(a)];
    };
    const lock = (az: number, y0: number, len: number, r: number) =>
      sdf.chain(
        [
          [...onHead(az, y0, 0.008), r],
          [...onHead(az, y0 - len * 0.5, 0.014), r * 0.95],
          [...onHead(az, y0 - len, 0.012), r * 0.72],
        ],
        0.01,
      );
    const hairShell = sdf.ellipsoid([0.212, 0.206, 0.197]);
    const capBack = hairShell
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.0))
      .smoothIntersect(0.02, sdf.halfSpace([0, 1, 0], -0.04))
      .smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.03));
    const locks = sdf.union(...[-128, -144, -160, -180, 160, 144, 128, -112, 112].map((a, i) => lock(a, -0.05 - (i % 2) * 0.01, 0.07 + (i % 3) * 0.008, 0.02)));
    const hair = sdf.smoothUnion(0.015, capBack, locks);
    k.body('hair', helmetPose(hair).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ the red coat: torso, tails, long sleeves
    const coatTorso = h.torso.round(0.012);
    const tails = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.134, 0.3],
            [0.146, 0.26],
            [0.158, 0.22],
            [0.164, 0.19],
            [0.164, 0.178],
            [0, 0.178],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.12), j.ELBOW, 0.048, 0.044).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.85), 0.044, 0.04).bone('forearm.L'),
      ),
    );
    const trimLine = sdf.box([0.012, 0.4, 0.5]).at(0.062, 0.3, 0.2).mirror('x', 0);
    const coat = sdf
      .smoothUnion(0.01, h.weighted(sdf.smoothUnion(0.01, coatTorso, tails)), sleeve)
      .paintWhere(trimLine.intersect(sdf.halfSpace([0, 1, 0], 0.4)), C.gold, 0.002)
      .paintWhere(h.band(0.178, 0.19), C.gold, 0.002);
    k.body('coat', coat, { color: coatColor, roughness: 0.85, detail: 0.005 });
    k.body('collar', sdf.torus(0.07, 0.021).scale([1, 1, 0.92]).at(0, 0.437, -0.012).bone('chest'), { color: C.gold, roughness: 0.4, metalness: 0.6, detail: 0.004 });

    // The black belt with a gold buckle.
    const belt = h.torso.round(0.02).subtract(h.torso.round(0.008)).intersect(sdf.box([0.5, 0.032, 0.5]).at(0, 0.262, 0));
    k.body('belt', h.weighted(belt), { color: C.black, roughness: 0.6, detail: 0.004 });
    const beltZ = sdf.raycast(h.torso.round(0.02), [0, 0.262, 1], [0, 0, -1])?.[2] ?? 0.1;
    const buckle = sdf.box([0.05, 0.044, 0.012], 0.004).at(0, 0.262, beltZ + 0.004);
    const tongue = sdf.box([0.024, 0.02, 0.014], 0.003).at(0, 0.262, beltZ + 0.006);
    k.body('buckle', sdf.union(buckle.paintWhere(tongue, '#8a6a20', 0.001)).bone('chest'), { color: C.gold, roughness: 0.35, metalness: 0.75, detail: 0.003 });

    // Cuffs: a black band at each wrist with a gold plate on top.
    const cuff = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.8), lerp(j.ELBOW, j.WRIST, 1.0), 0.046, 0.046).round(0.003).bone('forearm.L'));
    k.body('cuffs', cuff, { color: C.black, roughness: 0.6, detail: 0.004 });
    const plate = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.84), lerp(j.ELBOW, j.WRIST, 0.96), 0.0485, 0.0485).round(0.002).bone('forearm.L'));
    k.body('bracers', plate, { color: C.gold, roughness: 0.4, metalness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ gold: shoulder cords (epaulettes with fringe) and buttons
    const epaulette = h.perArm(() =>
      sdf
        .smoothUnion(
          0.006,
          sdf.ellipsoid([0.062, 0.03, 0.056]).rotateZ(-24).at(0.14, 0.425, 0),
          ...[-0.04, -0.02, 0, 0.02, 0.04].map((dz) => sdf.capsule([0.178, 0.41, dz], [0.186, 0.392, dz], 0.006)),
        )
        .bone('upperarm.L'),
    );
    const coatZ = (y: number) => sdf.raycast(coatTorso, [0, y, 1], [0, 0, -1])?.[2] ?? 0.1;
    const buttons = sdf.union(...[0.22, 0.31, 0.355, 0.4].map((y) => sdf.sphere(0.0135).at(0, y, coatZ(y) + 0.004))).bone('chest');
    k.body('gold', sdf.union(epaulette, buttons), { color: C.gold, roughness: 0.4, metalness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ tall black boots
    const bootShape = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.058, 0.046, 0.104]).at(0, 0.044, 0.044),
        sdf.cylinder(0.054, 0.12, 0.014).at(0, 0.06, 0),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootShape.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.014)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf.union(bootShape, sole.paint('#1a1416')).rotateY(8).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('boots', pair(boot), { color: C.black, roughness: 0.4, detail: 0.005 });

    // ------------------------------------------------------------------ the halberd, in the right fist (x < 0), upright
    const g = h.arms.R.GRIP;
    const px = -g[0] + 0.035;
    const pz = g[2] - 0.03;
    const pole = sdf.capsule([px, 0.065, pz], [px, 0.93, pz], 0.0155);
    k.body('pole', pole, { color: C.pole, roughness: 0.65, detail: 0.004, bone: 'knife.R' });
    // The head: a socket collar, the axe blade swept outward (-x), a spike, and a back hook.
    const collar = sdf.cylinder(0.024, 0.07, 0.006).at(px, 0.935, pz);
    const rings = sdf.union(sdf.cylinder(0.027, 0.012, 0.004).at(px, 0.9, pz), sdf.cylinder(0.027, 0.012, 0.004).at(px, 0.97, pz));
    const bladeProfile = profile.polygon(
      [
        [-0.016, 0.9],
        [-0.045, 0.866],
        [-0.1, 0.85],
        [-0.13, 0.9],
        [-0.13, 0.95],
        [-0.105, 0.995],
        [-0.045, 0.975],
        [-0.016, 0.965],
      ],
      { smooth: true, samples: 6 },
    );
    const blade = sdf.extrude(bladeProfile, 0.022, 0.003).at(px, 0, pz);
    const spike = sdf.cone([px, 0.96, pz], [px, 1.13, pz], 0.02, 0.004).round(0.002);
    const hook = sdf.cone([px + 0.016, 0.93, pz], [px + 0.07, 0.915, pz], 0.014, 0.004).round(0.002);
    k.body('halberd-head', sdf.smoothUnion(0.006, collar, rings, blade, spike, hook), {
      color: C.silver,
      roughness: 0.3,
      metalness: 0.8,
      detail: 0.0035,
      bone: 'knife.R',
    });
  },
});
