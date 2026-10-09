import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Fisher — Chibi Quest settlement NPC (catalog `npcs/settlement/fisher`), about 1.0 m to the top of
 * the sou'wester hat, faces +Z. Target: docs/npc-mockups/fisher_001.jpg. Built on the humanoid kind.
 *
 * Role: a harbor and river NPC who sells fish, seen in 3D and as a 128 px sprite; the wide yellow
 *   hat, the yellow coat, the silver fish, and the upright rod must read.
 * One idea: a cheerful fisher in head-to-knee bright yellow rain gear, a fish in one hand and a rod
 *   in the other.
 * Shape language: round and soft (hat, coat, boots), with the thin rod as the one long straight form.
 * Palette (60/30/10): yellow #e0b030 (hat, coat) with #b08a20 seams; navy #2a3a5a collar; dark green
 *   #2f4a3a boots; accents: silver fish #a8b0b8, red float #b03a3a, brown toggles #6b4226 and rod #9a6a3a.
 * Value plan: the yellow hat and coat are the light mass; the black hair, navy collar, and green
 *   boots frame it dark; the silver fish is the focal accent.
 * Bodies: skin, hat, hair, coat, seams, sweater, toggles, trousers, boots, fish, rod, line, float.
 * Rig: the humanoid kind's skeleton and clips; both arms keep a held pose (the right with the fish,
 *   the left with the rod); the fish is rigid on `knife.R` and the rod is rigid on `knife.L`.
 */

const C = {
  seam: '#b08a20',
  hair: '#231a17',
  toggle: '#c4c8ce',
  collar: '#2a3a5a',
  pants: '#3a4660',
  boot: '#2f4a3a',
  sole: '#5a3a24',
  rod: '#5a3a22',
  reel: '#8a8f96',
  line: '#e8e2cc',
  float: '#b03a3a',
  floatWhite: '#f2eee4',
  fish: '#a8b0b8',
  fishBack: '#6a7a8a',
  fishEye: '#1a1a1a',
};

type V3 = readonly [number, number, number];
const lerp = (a: V3, b: V3, t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export default humanoidAsset({
  name: 'fisher',
  description: "A cheerful fisher in a yellow sou'wester and a yellow raincoat, holding a silver fish and a fishing rod.",
  reference: 'docs/npc-mockups/fisher_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { yellow: '#e0b030', amber: '#d28a2a', straw: '#d8c470', rust: '#b8683a' },
  },
  presets: {
    stormy: { skin: 'tan', hair: 'brown', eyes: 'green', cloth: 'amber' },
  },
  hair: false,
  lashes: false,
  undershirt: false,
  pants: C.pants,
  shoes: false,
  // Left-side values; the kind mirrors the right arm. The right fist holds the fish out in front at
  // chest height; the left fist holds the rod beside the head.
  pose: {
    R: { elbow: [0.16, 0.3, 0.03], wrist: [0.2, 0.335, 0.135] },
    L: { elbow: [0.2, 0.31, 0.03], wrist: [0.275, 0.34, 0.09] },
  },

  // A friendly face: the stern default brows and the small smile are painted out, then level arched
  // brows and a wide smile with round corners are painted in.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.024, 234, 306), 0.3).at(0, 0.6, 0.1);
    const brows = sdf.extrude(profile.arc(0.12, 0.016, 62, 118), 0.3).at(0.105, 0.604, 0.1).mirror('x');
    const smile = sdf.extrude(profile.arc(0.075, 0.012, 232, 308), 0.3).at(0, 0.605, 0.1);
    const corners = sdf.union(h.onFace(sdf.sphere(0.0095), 0.046, 0.547), h.onFace(sdf.sphere(0.0095), -0.046, 0.547));
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(smile, h.tint.mouth!, 0.002)
      .paintWhere(corners, h.tint.mouth!, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE, KNEE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const cloth = h.tint.shirt ?? '#e0b030';
    const seam = k.tint('cloth', { color: C.seam, follow: 1 });
    const hairColor = k.tint('hair');

    // ------------------------------------------------------------------ the sou'wester: a crown and a wide brim, longer at the back
    const hatPose = (s: sdf.Shape) => s.rotateX(-8).at(0, HEAD_Y, 0);
    const crown = sdf
      .ellipsoid([0.228, 0.15, 0.22])
      .at(0, 0.11, -0.005)
      .intersect(sdf.halfSpace([0, -1, 0], -0.095))
      .paintWhere(sdf.box([1, 0.034, 1]).at(0, 0.116, 0), seam, 0.004);
    const brimOutline = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.03],
            [0.2, 0.03],
            [0.29, 0.016],
            [0.345, -0.012],
            [0.352, -0.034],
            [0.336, -0.04],
            [0.29, -0.026],
            [0.2, -0.008],
            [0, -0.008],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([0.96, 1, 0.9])
      .at(0, 0.095, -0.05);
    const tail = sdf
      .ellipsoid([0.2, 0.024, 0.15])
      .rotateX(-14)
      .at(0, 0.069, -0.3);
    const brim = sdf.smoothUnion(0.03, brimOutline, tail);
    const hat = hatPose(sdf.smoothUnion(0.012, crown, brim)).bone('head');
    k.body('hat', hat, { color: cloth, roughness: 0.45, detail: 0.005, textureDensity: 1.5 });

    // ------------------------------------------------------------------ hair under the hat: a back cap, side locks, and a wavy fringe
    const shell = sdf.ellipsoid([0.226, 0.212, 0.205]);
    const tips = sdf.union(
      ...[-70, -45, -22, 0, 22, 45, 70].map((a) =>
        sdf.sphere(0.03).at(0.168 * Math.sin((a * Math.PI) / 180), -0.128, -0.15 * Math.cos((a * Math.PI) / 180)),
      ),
    );
    const back = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.12)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const temples = shell
      .smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], 0.045))
      .smoothIntersect(0.015, sdf.halfSpace([-1, 0, 0], -0.125).mirror('x', 0))
      .smoothIntersect(0.015, sdf.halfSpace([0, 0, 1], 0.12));
    const faceZ = (x: number, y: number) => 0.19 * Math.sqrt(Math.max(0.05, 1 - (y / 0.2) ** 2 - (x / 0.205) ** 2)) + 0.012;
    const tuft = (x: number, y: number, w: number, rz: number) =>
      sdf.ellipsoid([w, 0.028, 0.034]).rotateZ(rz).at(x, y, faceZ(x, y) - 0.012);
    // A soft front mass above the brows, with three messy tufts that dip toward them.
    const frontMass = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.078)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], 0.3));
    const sideLock = (s: 1 | -1) =>
      sdf.chain(
        [
          [0.165 * s, 0.1, faceZ(0.165, 0.1) - 0.03, 0.034],
          [0.178 * s, 0.04, faceZ(0.178, 0.04) - 0.03, 0.03],
          [0.19 * s, -0.01, faceZ(0.19, -0.01) - 0.03, 0.024],
        ],
        0.012,
      );
    const fringe = sdf.smoothUnion(
      0.03,
      frontMass,
      tuft(-0.085, 0.098, 0.06, 14),
      tuft(-0.005, 0.1, 0.05, -8),
      tuft(0.07, 0.097, 0.058, 12),
      tuft(0.125, 0.092, 0.045, -16),
      sideLock(1),
      sideLock(-1),
    );
    const hair = hatPose(sdf.smoothUnion(0.015, back, tips, temples, fringe)).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ the raincoat: torso, short flared skirt, V neckline, sleeves
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.136, 0.3],
            [0.148, 0.24],
            [0.166, 0.17],
            [0.168, 0.15],
            [0, 0.15],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.8]);
    const coatBody = sdf.smoothUnion(0.02, h.torso.round(0.014), skirt.round(0.01));
    const vee = sdf
      .extrude(
        profile.polygon([
          [-0.075, 0.52],
          [0.075, 0.52],
          [0.012, 0.37],
          [-0.012, 0.37],
        ]),
        0.3,
      )
      .at(0, 0, 0.2);
    const front = sdf.box([0.006, 0.34, 0.4]).at(0, 0.25, 0.2);
    const pocketAt = (x: number) => sdf.box([0.07, 0.034, 0.4], 0.008).rotateZ(-6 * Math.sign(x)).at(x, 0.215, 0.2);
    const flaps = sdf.union(pocketAt(0.07), pocketAt(-0.07));
    const sleeveOf = (j: { ELBOW: V3; WRIST: V3 }) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.049, 0.045).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.9), 0.045, 0.043).bone('forearm.L'),
      );
    const coat = sdf
      .smoothUnion(0.012, h.weighted(coatBody.subtract(vee)), h.perArm(sleeveOf))
      .paintWhere(front.intersect(sdf.halfSpace([0, 1, 0], 0.38)), seam, 0.0015)
      .paintWhere(flaps.intersect(coatBody.round(0.004).subtract(coatBody.round(-0.006))), seam, 0.002)
      .paintWhere(h.band(0.138, 0.158), seam, 0.003);
    k.body('coat', coat, { color: cloth, roughness: 0.45, detail: 0.005, textureDensity: 1.5 });

    // The cuffs and the lapel flaps in the seam color.
    const cuffOf = (j: { ELBOW: V3; WRIST: V3 }) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.74), lerp(j.ELBOW, j.WRIST, 1.0), 0.0475, 0.0475).round(0.002).bone('forearm.L');
    const lapel = (s: 1 | -1) =>
      sdf
        .box([0.07, 0.07, 0.014], 0.005)
        .rotateZ(-38 * s)
        .rotateY(-26 * s)
        .at(0.074 * s, 0.425, 0.0)
        .at(0, 0, 0);
    const lapelAt = (s: 1 | -1) => {
      const z = sdf.raycast(coatBody, [0.07 * s, 0.415, 1], [0, 0, -1])?.[2] ?? 0.1;
      return lapel(s).at(0, 0, z - 0.005).bone('chest');
    };
    k.body('seams', sdf.union(h.perArm(cuffOf), lapelAt(1), lapelAt(-1)), { color: seam, roughness: 0.5, detail: 0.004 });

    // ------------------------------------------------------------------ navy sweater: a rolled neck and a V of chest
    const ribs = (x: number, _y: number, z: number) => 0.003 * Math.sin(Math.atan2(x, z + 0.012) * 46);
    const neckRoll = sdf
      .smoothUnion(
        0.012,
        sdf.torus(0.1, 0.052).scale([1, 1, 1.02]).at(0, 0.426, -0.005),
        sdf.torus(0.104, 0.036).scale([1, 1, 1.0]).at(0, 0.382, -0.005),
      )
      .bone('chest');
    const chest = h.weighted(h.torso.round(0.009)).intersect(vee.round(0.004)).intersect(sdf.halfSpace([0, -1, 0], -0.37));
    k.body('sweater', sdf.smoothUnion(0.012, neckRoll, chest), {
      color: C.collar,
      roughness: 0.9,
      detail: 0.004,
      textureDensity: 1.5,
      bump: ribs,
    });

    // ------------------------------------------------------------------ toggles
    const toggleAt = (x: number, y: number) => {
      const z = sdf.raycast(coatBody, [x, y, 1], [0, 0, -1])?.[2] ?? 0.1;
      return sdf.ellipsoid([0.021, 0.021, 0.011]).at(x, y, z + 0.003).bone('spine');
    };
    k.body('buttons', sdf.union(toggleAt(0.065, 0.335), toggleAt(-0.065, 0.335), toggleAt(0.075, 0.275), toggleAt(-0.075, 0.275)), {
      color: C.toggle,
      roughness: 0.3,
      metalness: 0.8,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ tall boots
    const boot = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.058, 0.044, 0.105]).at(0, 0.042, 0.04),
        sdf.cone([0, 0.05, 0.0], [0, KNEE[1] - 0.004, 0], 0.056, 0.057).bone('shin.L'),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintWhere(sdf.box([1, 0.02, 1]).at(0, 0.008, 0), C.sole, 0.003)
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.4, detail: 0.005 });

    // ------------------------------------------------------------------ the fish, held by the tail in the right fist
    const gR = h.arms.R.GRIP;
    const g: V3 = [-gR[0], gR[1], gR[2]];
    const fishBody = sdf
      .extrude(
        profile.polygon(
          [
            [0, 0.125],
            [0.02, 0.112],
            [0.034, 0.075],
            [0.035, 0.03],
            [0.026, -0.015],
            [0.013, -0.045],
            [0, -0.055],
            [-0.013, -0.045],
            [-0.026, -0.015],
            [-0.035, 0.03],
            [-0.034, 0.075],
            [-0.02, 0.112],
          ],
          { smooth: true, samples: 6 },
        ),
        0.034,
        0.008,
      )
      .scale([1, 1, 1]);
    const fishTail = sdf
      .extrude(
        profile.polygon([
          [0, -0.04],
          [0.045, -0.085],
          [0.012, -0.07],
          [0, -0.077],
          [-0.012, -0.07],
          [-0.045, -0.085],
        ]),
        0.016,
        0.003,
      )
      .at(0, -0.01, 0);
    const eye = sdf.sphere(0.011).at(0.008, 0.098, 0.02);
    const fishShape = sdf
      .smoothUnion(0.01, fishBody, fishTail)
      .paintWhere(sdf.halfSpace([1, 0, 0], -0.014), C.fishBack, 0.01)
      .paintWhere(eye, C.fishEye, 0.002)
      .scale(1.3)
      .at(g[0], g[1] - 0.012, g[2] + 0.005)
      .bone('knife.R');
    k.body('fish', fishShape, { color: C.fish, roughness: 0.3, metalness: 0.4, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ the rod, upright in the left fist, with a reel, a line, and a float
    const gL = h.arms.L.GRIP;
    const tip: V3 = [gL[0] + 0.1, gL[1] + 0.58, gL[2] - 0.005];
    const butt: V3 = [gL[0] - 0.006, gL[1] - 0.09, gL[2] + 0.001];
    const rod = sdf
      .smoothUnion(
        0.01,
        sdf.cone(butt, [gL[0] + 0.004, gL[1] + 0.16, gL[2]], 0.018, 0.017),
        sdf.cone([gL[0] + 0.004, gL[1] + 0.16, gL[2]], tip, 0.017, 0.0095),
        sdf.sphere(0.021).at(butt[0], butt[1], butt[2]),
        sdf.sphere(0.014).at(tip[0], tip[1], tip[2]),
      )
      .paintWhere(sdf.box([1, 0.07, 1]).at(0, gL[1] + 0.16, 0), '#3e2614', 0.008)
      .paintWhere(sdf.sphere(0.022).at(tip[0], tip[1], tip[2]), '#f4f0e6', 0.004)
      .bone('knife.L');
    k.body('rod', rod, { color: C.rod, roughness: 0.65, detail: 0.004 });
    const reel = sdf
      .smoothUnion(0.006, sdf.cylinder(0.03, 0.024, 0.008).rotateZ(90).at(gL[0] + 0.008, gL[1] + 0.12, gL[2] + 0.034))
      .bone('knife.L');
    k.body('reel', reel, { color: C.reel, roughness: 0.35, metalness: 0.7, detail: 0.004 });
    const floatAt: V3 = [tip[0] + 0.075, tip[1] - 0.12, tip[2] + 0.02];
    const line = sdf
      .chain(
        [
          [tip[0], tip[1] + 0.01, tip[2], 0.0045],
          [tip[0] + 0.03, tip[1] + 0.02, tip[2] + 0.005, 0.0045],
          [tip[0] + 0.065, tip[1] - 0.03, tip[2] + 0.012, 0.0045],
          [floatAt[0], floatAt[1] + 0.02, floatAt[2], 0.0045],
        ],
        0.01,
      )
      .bone('knife.L');
    k.body('line', line, { color: C.line, roughness: 0.5, detail: 0.0028 });
    const bob = sdf
      .ellipsoid([0.02, 0.028, 0.02])
      .at(floatAt[0], floatAt[1], floatAt[2])
      .paintWhere(sdf.halfSpace([0, -1, 0], -(floatAt[1] - 0.002)), C.floatWhite, 0.004)
      .bone('knife.L');
    k.body('float', bob, { color: C.float, roughness: 0.4, detail: 0.004 });
  },
});
