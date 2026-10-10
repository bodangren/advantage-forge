import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Watch captain — Chibi Quest settlement NPC (catalog `npcs/settlement/watch-captain`), about 1.0 m to
 * the top of the plume, faces +Z. Target: docs/npc-mockups/watch-captain_001.jpg. Built on the humanoid kind.
 *
 * Role: the town guard who leads the night watch and gives patrol quests, seen at the gate in 3D and
 *   as a 128 px sprite; the red plume on the steel helmet, the glowing lantern, and the gold tower
 *   on the blue tabard must read.
 * One idea: a proud, friendly guard whose wide steel helmet with a red plume sits over a big bright
 *   face, with a glowing brass lantern held out in front.
 * Shape language: round and sturdy (domed helmet, round shoulder plates), a squarer lantern and tabard.
 * Palette (60/30/10): tabard blue #2a3a6a, mail and steel greys #8a8c94 / #a8acb4, leather and trousers
 *   browns #5a3a24 / #6b4a2c, black boots #2a2428; accents: red plume #c03a30, gold #e0b040, lantern
 *   glow #ffc060; skin #5e3b28, hair #231a17.
 * Value plan: the light steel helmet over the dark face, the warm lantern glow, and the gold emblem
 *   are the focal points; the dark tabard and boots anchor the body.
 * Bodies: skin (smile, brows), hair, helmet, plume, mail, tabard, emblem, steel, belt, gold, scabbard,
 *   trousers, boots, lantern, baton.
 * Rig: the humanoid kind's skeleton and clips; the right arm holds a pose with the lantern rigid on
 *   `knife.R`; the baton is rigid on `knife.L`.
 */

const C = {
  steel: '#969aa2',
  mail: '#74767e',
  plume: '#c03a30',
  gold: '#e0b040',
  belt: '#5a3a24',
  scabbard: '#4a3424',
  hilt: '#c8a040',
  pants: '#6b4a2c',
  boot: '#2a2428',
  bootFold: '#3c3438',
  brass: '#b08a40',
  glow: '#ffc060',
  baton: '#7a4a2c',
  cap: '#c8a040',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'watch-captain',
  description: 'A proud, friendly watch captain in a blue tabard and a plumed steel helmet, holding up a glowing lantern and a short baton.',
  reference: 'docs/npc-mockups/watch-captain_001.jpg',
  variants: {
    skin: { brown: '#8a5a3e', tan: '#d49a72', deep: '#5e3b28', light: '#e8b48e', fair: '#f2c7a4' },
    hair: { black: '#231a17', brown: '#5a301d', auburn: '#8e3b1c', silver: '#b8b4c4', blond: '#c4974a' },
    eyes: { hazel: '#8a6a2a', brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', violet: '#6a4a9a' },
    cloth: { navy: '#2a3a6a', teal: '#1f5a64', wine: '#6a2a3a', slate: '#3e4252' },
  },
  presets: {
    dusk: { skin: 'deep', hair: 'brown', eyes: 'green', cloth: 'wine' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: false,
  // The lantern arm: the elbow bent, the fist held out in front at chest height (left-side values; mirrored to the right).
  pose: { R: { elbow: [0.25, 0.37, 0.05] as const, wrist: [0.285, 0.505, 0.1] as const } },

  // A confident closed smile with level, strong brows. The kind's smile and brows are painted over first.
  paintSkin(skin, h) {
    const y = 0.536;
    const grin = profile.polygon(
      [
        [-0.05, 0.014],
        [-0.026, 0.004],
        [0, 0.0],
        [0.026, 0.004],
        [0.05, 0.014],
        [0.046, 0.006],
        [0.022, -0.008],
        [0, -0.012],
        [-0.022, -0.008],
        [-0.046, 0.006],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.016, 238, 302), 0.3).at(0, 0.6, 0.1);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.075, 0.018, 58, 122), 0.3).at(0.1, 0.652, 0.1).mirror('x');
    return skin
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');

    // ------------------------------------------------------------------ helmet: a steel dome, an open face, cheek flaps, a plume
    // Built at the head's origin. The lower edge is a tilted plane: high over the brow, low at the nape.
    const helmetPose = (s: sdf.Shape) => s.rotateX(-4).at(0, HEAD_Y, 0);
    const slope = 0.35;
    const norm = Math.hypot(1, slope);
    // Keeps the region above the edge plane y - slope * z = a.
    const above = (a: number) => sdf.halfSpace([0, -1 / norm, slope / norm], -a / norm);
    const below = (a: number) => sdf.halfSpace([0, 1 / norm, -slope / norm], a / norm);
    const EDGE = 0.035;
    const dome = sdf.ellipsoid([0.238, 0.2, 0.226]).at(0, 0.04, -0.005);
    const ridge = sdf.ellipsoid([0.015, 0.208, 0.24]).at(0, 0.04, -0.005);
    const rim = dome.round(0.008).intersect(above(EDGE - 0.002)).intersect(below(EDGE + 0.024));
    const brimRing = sdf
      .ellipsoid([0.26, 0.2, 0.25])
      .at(0, 0.04, -0.005)
      .intersect(above(EDGE - 0.004))
      .intersect(below(EDGE + 0.014))
      .round(0.006);
    const crown = sdf.smoothUnion(0.012, dome, ridge).intersect(above(EDGE)).smoothUnion(0.006, rim).smoothUnion(0.008, brimRing);
    // The cheek flaps: short plates that hang beside the cheeks, flared out a little at the bottom.
    const flap = pair(
      sdf
        .box([0.02, 0.16, 0.09], 0.008)
        .rotateZ(7)
        .rotateY(-6)
        .at(0.214, -0.005, 0.07),
    );
    const flapTop = pair(sdf.box([0.05, 0.034, 0.1], 0.01).at(0.225, 0.062, 0.07));
    // The plume: a thick crest that rises from the ridge and curls back, with two fronds that hang down.
    const crest = sdf.chain(
      [
        [0, 0.225, 0.01, 0.024],
        [0, 0.272, -0.02, 0.036],
        [0, 0.3, -0.075, 0.036],
        [0, 0.292, -0.135, 0.03],
        [0, 0.24, -0.185, 0.016],
      ],
      0.02,
    );
    const frondL = sdf.chain(
      [
        [-0.01, 0.245, -0.03, 0.026],
        [-0.06, 0.29, -0.05, 0.026],
        [-0.12, 0.27, -0.07, 0.022],
        [-0.17, 0.2, -0.085, 0.018],
        [-0.19, 0.12, -0.075, 0.012],
      ],
      0.02,
    );
    const frondR = sdf.chain(
      [
        [0.01, 0.245, -0.04, 0.022],
        [0.055, 0.28, -0.08, 0.02],
        [0.1, 0.26, -0.12, 0.016],
        [0.12, 0.2, -0.15, 0.011],
      ],
      0.02,
    );
    const socket = sdf.ellipsoid([0.03, 0.025, 0.07]).at(0, 0.228, -0.01);
    const plume = helmetPose(sdf.smoothUnion(0.015, crest, frondL, frondR, socket)).bone('head');
    k.body('plume', plume, { color: C.plume, roughness: 0.8, detail: 0.005, bump: (x, y, z) => 0.0018 * Math.sin(y * 120 + z * 60 + x * 50) });
    const helmet = helmetPose(sdf.smoothUnion(0.01, crown, flap, flapTop)).bone('head');
    k.body('helmet', helmet, { color: C.steel, roughness: 0.4, metalness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ hair: short black locks under the helmet
    // A cap that hugs the skull with a face window; a ragged fringe of separate locks over the forehead;
    // short locks at the temples; a row of rounded tips at the nape.
    const skull = sdf.ellipsoid([0.214, 0.208, 0.2]).at(0, HEAD_Y + 0.004, -0.006);
    const window = sdf.ellipsoid([0.17, 0.15, 0.22]).at(0, 0.6, 0.2);
    const topCap = skull.smoothSubtract(0.02, window).smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], -0.645));
    const backCap = skull.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.585)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.06));
    const napeTips = sdf.union(
      ...[-70, -50, -30, -10, 10, 30, 50, 70].map((a) =>
        sdf.sphere(0.026).at(0.185 * Math.sin((a * Math.PI) / 180), 0.598, -0.006 - 0.17 * Math.cos((a * Math.PI) / 180)),
      ),
    );
    const fz = (x: number, y: number) => h.faceZ(Math.min(Math.abs(x), 0.19), y);
    const fringe = sdf.union(
      ...Array.from({ length: 10 }, (_, i) => {
        const x0 = -0.135 + i * 0.03;
        const sway = 0.012 * Math.sin(i * 2.3);
        const tip = 0.742 + 0.014 * Math.sin(i * 1.9 + 0.5);
        return sdf.chain(
          [
            [x0, 0.8, fz(x0, 0.8) + 0.002, 0.02],
            [x0 + sway * 0.5, 0.774, fz(x0, 0.774) + 0.006, 0.019],
            [x0 + sway + 0.006, tip, fz(x0, tip) + 0.008, 0.011],
          ],
          0.012,
        );
      }),
    );
    const temple = sdf.union(
      ...[-1, 1].flatMap((sx) =>
        [0.0, 0.03].map((dz, i) =>
          sdf.chain(
            [
              [sx * 0.187, 0.7, 0.03 + dz, 0.02],
              [sx * 0.196, 0.66, 0.025 + dz, 0.017],
              [sx * 0.2, 0.618 - 0.012 * i, 0.03 + dz, 0.009],
            ],
            0.01,
          ),
        ),
      ),
    );
    // Long locks: from the nape ring down the back to the shoulders, and a short pair beside each ear.
    const longLocks = sdf.union(
      ...Array.from({ length: 11 }, (_, i) => {
        const a = ((-75 + i * 15) * Math.PI) / 180;
        const side = Math.abs(Math.sin(a));
        const r0 = 0.17;
        const r1 = 0.15 - 0.02 * side;
        const tipY = 0.455 + 0.05 * side + 0.012 * Math.sin(i * 2.1);
        const p = (r: number, y: number, rad: number): [number, number, number] => [r * Math.sin(a) * (1 + 0.1 * side), y, -0.006 - r * Math.cos(a)];
        return sdf.chain([[...p(r0, 0.6, 0.03)], [...p(r0 - 0.005, 0.54, 0.028)], [...p(r1, 0.495, 0.024)], [...p(r1, tipY, 0.015)]].map((q, j) => [q[0], q[1], q[2], [0.034, 0.03, 0.026, 0.016][j]!] as [number, number, number, number]), 0.012);
      }),
    );
    const hair = sdf.smoothUnion(0.014, topCap, backCap, napeTips, fringe, temple, longLocks).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.004, bump: (x, y, z) => 0.0015 * noise.fbm(x * 90, y * 90, z * 90, 2) });

    // ------------------------------------------------------------------ chain mail: a shirt with sleeves to the elbows and a short skirt
    const mailSleeve = h.perArm((j) => sdf.cone(lerp(SHOULDER, j.ELBOW, -0.15), lerp(j.ELBOW, j.WRIST, 0.12), 0.05, 0.046).bone('upperarm.L'));
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.215],
            [0.137, 0.215],
            [0.141, 0.205],
            [0.146, 0.195],
            [0.152, 0.183],
            [0.157, 0.17],
            [0, 0.17],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const mail = sdf.smoothUnion(0.015, h.weighted(h.torso.round(0.003)), mailSleeve, h.weighted(skirt));
    const rings = (x: number, y: number, z: number) => {
      const u = (x + z) * 230;
      const v = y * 230 + (Math.floor(u / Math.PI) % 2) * 1.6;
      return 0.0032 * Math.cos(u) * Math.cos(v);
    };
    k.body('mail', mail, { color: C.mail, roughness: 0.62, metalness: 0.6, detail: 0.005, bump: rings });

    // ------------------------------------------------------------------ the tabard: a front and a back panel over the mail
    const HEM = 0.182;
    const tabardShell = h.torso.round(0.016).subtract(h.torso.round(0.002));
    const panel = sdf.box([0.2, 0.43 - HEM, 0.6], 0.008).at(0, (0.43 + HEM) / 2, 0);
    const tabardShape = tabardShell.intersect(panel);
    k.body('tabard', h.weighted(tabardShape), { color: h.tint.shirt ?? '#2a3a6a', roughness: 0.85, detail: 0.004 });

    // The gold tower emblem on the chest (a stepped tower with three merlons and a door).
    const towerZ = sdf.raycast(tabardShape, [0, 0.33, 1], [0, 0, -1])?.[2] ?? 0.15;
    const tower = profile.polygon(
      [
        [-0.03, 0],
        [0.03, 0],
        [0.026, 0.06],
        [0.036, 0.06],
        [0.036, 0.08],
        [0.02, 0.08],
        [0.02, 0.068],
        [0.007, 0.068],
        [0.007, 0.08],
        [-0.007, 0.08],
        [-0.007, 0.068],
        [-0.02, 0.068],
        [-0.02, 0.08],
        [-0.036, 0.08],
        [-0.036, 0.06],
        [-0.026, 0.06],
      ],
      { smooth: false },
    );
    const door = sdf.extrude(profile.arc(0.011, 0.014, 0, 180), 0.3).at(0, 0.0, 0.1);
    const doorBox = sdf.box([0.022, 0.03, 0.3]).at(0, 0.014, 0);
    const emblemShape = sdf
      .extrude(tower, 0.016, 0.004)
      .at(0, 0.29, towerZ + 0.003)
      .paintWhere(sdf.union(doorBox.at(0, 0.29, 0), door.at(0, 0.29 + 0.026, 0)), '#6a4a14', 0.002)
      .bone('chest');
    k.body('emblem', emblemShape, { color: C.gold, roughness: 0.4, metalness: 0.5, detail: 0.003 });

    // ------------------------------------------------------------------ steel: shoulder plates, a gorget, and long cuffs
    const pauldron = pair(sdf.ellipsoid([0.056, 0.032, 0.054]).rotateZ(-22).at(0.148, 0.405, 0).bone('chest'));
    const gorget = sdf.torus(0.074, 0.017).scale([1, 1, 0.84]).at(0, 0.442, -0.005).bone('chest');
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.16), lerp(j.ELBOW, j.WRIST, 0.84), 0.048, 0.044).round(0.003).bone('forearm.L'));
    k.body('steel', sdf.union(pauldron, gorget, cuffs), { color: C.steel, roughness: 0.4, metalness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ belt, buckle, and the short sword on the left hip
    const belt = h.torso.round(0.024).subtract(h.torso.round(0.008)).smoothUnion(0.01, skirt.round(0.01).subtract(skirt.round(-0.004)).intersect(h.band(0.2, 0.236))).intersect(h.band(0.2, 0.236));
    k.body('belt', h.weighted(belt), { color: C.belt, roughness: 0.7, detail: 0.004 });
    const beltZ = sdf.raycast(h.torso.round(0.024), [0, 0.218, 1], [0, 0, -1])?.[2] ?? 0.14;
    const buckle = sdf.box([0.062, 0.042, 0.014], 0.006).subtract(sdf.box([0.036, 0.02, 0.05])).at(0, 0.218, beltZ + 0.002);
    const prong = sdf.box([0.01, 0.026, 0.012], 0.003).at(0, 0.218, beltZ + 0.004);
    // The hilt stands above the belt behind the left fist, the scabbard hangs down and back.
    const hiltGrip = sdf.capsule([0.147, 0.222, -0.045], [0.142, 0.285, -0.025], 0.014);
    const guard = sdf.box([0.07, 0.014, 0.018], 0.005).rotateY(-12).at(0.147, 0.222, -0.045);
    const pommel = sdf.sphere(0.019).at(0.14, 0.292, -0.022);
    k.body('gold', sdf.union(buckle, prong, hiltGrip, guard, pommel).bone('hips'), { color: C.hilt, roughness: 0.4, metalness: 0.6, detail: 0.003 });
    const scabbard = sdf
      .smoothUnion(0.005, sdf.cone([0.152, 0.215, -0.048], [0.168, 0.068, -0.15], 0.024, 0.016), sdf.sphere(0.017).at(0.168, 0.066, -0.15), sdf.torus(0.022, 0.008).rotateX(70).at(0.155, 0.19, -0.06))
      .bone('hips');
    k.body('scabbard', scabbard, { color: C.scabbard, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ tall black boots with folded cuffs
    const bootShape = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.058, 0.046, 0.104]).at(0, 0.044, 0.044),
        sdf.cylinder(0.054, 0.12, 0.014).at(0, 0.055, 0),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootShape.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.014)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf.union(bootShape, sole.paint('#1a1416')).rotateY(8).at(ANKLE[0], 0, 0).bone('foot.L');
    const fold = sdf.cylinder(0.063, 0.034, 0.014).at(0, 0.098, 0).rotateY(8).at(ANKLE[0], 0, 0).bone('shin.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6, detail: 0.005 });
    k.body('boot-folds', pair(fold), { color: C.bootFold, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ the brass lantern in the right fist
    // Held by its ring: the ring in the fist, a cap, a glowing glass box in a brass frame, a base.
    const gR = h.arms.R.GRIP;
    const lanternPose = (s: sdf.Shape) => s.scale(1.3).at(-gR[0], gR[1], gR[2]);
    const ring = sdf.torus(0.018, 0.0075).rotateX(90).at(0, -0.028, 0);
    const capTop = sdf.box([0.04, 0.014, 0.04], 0.005).at(0, -0.062, 0);
    const capPlate = sdf.box([0.082, 0.014, 0.082], 0.005).at(0, -0.074, 0);
    const basePlate = sdf.box([0.082, 0.014, 0.082], 0.005).at(0, -0.134, 0);
    const posts = sdf.union(
      ...[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => sdf.box([0.014, 0.056, 0.014], 0.003).at(sx! * 0.031, -0.104, sz! * 0.031)),
    );
    const lantern = sdf.smoothUnion(0.004, ring, capTop, capPlate, basePlate, posts);
    k.body('lantern', lanternPose(lantern), { color: C.brass, roughness: 0.4, metalness: 0.7, bone: 'knife.R', detail: 0.003 });
    const glass = sdf.box([0.07, 0.06, 0.07], 0.008).at(0, -0.104, 0);
    k.body('lantern-glow', lanternPose(glass), { color: '#ffb030', emissive: '#ffa820', emissiveIntensity: 1.0, roughness: 0.7, bone: 'knife.R', detail: 0.003 });

    // ------------------------------------------------------------------ the baton in the left fist
    // Held low in front of the hip, the ball end down and forward; brass caps at both ends.
    const gL = h.arms.L.GRIP;
    const dirL = [0.5, -0.45, 0.55];
    const dl = Math.hypot(...dirL);
    const dn = dirL.map((v) => v / dl) as [number, number, number];
    const at = (t: number): [number, number, number] => [gL[0] + dn[0] * t, gL[1] + dn[1] * t, gL[2] + dn[2] * t];
    const batonShaft = sdf.capsule(at(-0.035), at(0.17), 0.0155);
    const batonCapTop = sdf.sphere(0.02).at(...at(-0.04));
    const batonBall = sdf.sphere(0.03).at(...at(0.19));
    const batonBand = sdf.cone(at(0.12), at(0.14), 0.02, 0.02).round(0.002);
    k.body('baton', batonShaft, { color: C.baton, roughness: 0.75, bone: 'knife.L', detail: 0.004, bump: (x, y, z) => 0.0015 * Math.sin(x * 120 + y * 80 + z * 60) });
    k.body('baton-caps', sdf.union(batonCapTop, batonBall, batonBand), { color: C.cap, roughness: 0.35, metalness: 0.7, bone: 'knife.L', detail: 0.003 });
  },
});
