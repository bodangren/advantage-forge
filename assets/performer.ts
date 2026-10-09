import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Performer — Chibi Quest settlement NPC (catalog `npcs/settlement/performer`), about 1.0 m to the
 * tip of the jester cap, faces +Z. Target: docs/npc-mockups/performer_001.jpg. Built on the humanoid kind.
 *
 * Role: a fair and festival NPC who juggles for the crowd; seen in 3D and as a 128 px sprite. The
 *   two-pointed bell cap, the diamond tunic, the white ruff, and the three balls must read.
 * One idea: a cheerful juggler whose red and blue horned cap and harlequin tunic sit on a bright
 *   smile, with both hands out and three colorful balls in an arc.
 * Shape language: round and soft (face, balls, ruff lobes), with the pointed cap horns and the
 *   curled shoe toes as the spiky secondary forms.
 * Palette (60/30/10): red #b03a3a and blue #3a5a9a (cap, tunic, sleeves), yellow #e0b040 (diamonds,
 *   bells), white ruff #f6f1ea, red tights #a83a3a, green shoes #3f6a44; the balls are the accents.
 * Value plan: the white ruff and face are the lightest point; the dark blue sleeves frame the tunic.
 * Bodies: skin, hair, hat, band, bells, ruff, tunic, sleeves, cuffs, tights, shoes, three balls, trail.
 * Rig: the humanoid kind's skeleton and clips; both arms hold a posed rest pose in every clip. The
 *   balls are rigid on the fist bones `knife.R` and `knife.L`.
 */

const C = {
  blue: '#3a5a9a',
  red: '#b03a3a',
  gold: '#e0b040',
  band: '#c9a86a',
  ruff: '#f6f1ea',
  tights: '#a83a3a',
  shoe: '#3f6a44',
  shoeSole: '#2a4a30',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
  ballR: '#e0c030',
  ballTop: '#e0503a',
  ballL: '#3a8ad8',
  spot: '#f6f1ea',
  trail: '#f3e3a0',
};

// Both arms held wide out to the sides, fists raised (left-side coordinates; the kind mirrors the right).
const ARM = { elbow: [0.215, 0.385, 0.02], wrist: [0.3, 0.425, 0.065] } as const;
const BALL_R = 0.037;

export default humanoidAsset({
  name: 'performer',
  description: 'A cheerful juggler in a harlequin tunic, a bell-tipped jester cap, and curled green shoes, juggling three balls.',
  reference: 'docs/npc-mockups/performer_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#6b3e22', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { red: '#b03a3a', saffron: '#c8902a', plum: '#7a3f68', teal: '#2f6a6a' },
  },
  presets: {
    festival: { skin: 'tan', hair: 'black', eyes: 'green', cloth: 'plum' },
  },
  hair: false,
  lashes: false,
  undershirt: false,
  pants: false,
  shoes: false,
  pose: { L: ARM, R: ARM },

  // A closed smile with thin arched brows (painted over the defaults).
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.014, 55, 125), 0.3).at(0.1, 0.665, 0.1).mirror('x');
    const crescent = profile.polygon(
      [
        [-0.054, 0.014],
        [-0.028, 0.002],
        [0, -0.002],
        [0.028, 0.002],
        [0.054, 0.014],
        [0.044, -0.004],
        [0.022, -0.016],
        [0, -0.02],
        [-0.022, -0.016],
        [-0.044, -0.004],
      ],
      { smooth: true, samples: 6 },
    );
    const smile = h.onFace(sdf.extrude(crescent, 0.3), 0, 0.545);
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(smile, '#8a2e2a', 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];

    // ------------------------------------------------------------------ cap: red and blue horns, a tan band, gold bells
    // Local frame: the head center at the origin, tilted back a little. The red horn (x < 0, the
    // viewer's left) droops out to the side; the blue horn (x > 0) rises and curls over.
    const hatPose = (s: sdf.Shape) => s.rotateX(-5).at(0, HEAD_Y, 0);
    const crown = sdf.ellipsoid([0.218, 0.2, 0.2]).intersect(sdf.halfSpace([0, -1, 0], -0.1));
    const hornB = sdf.chain(
      [
        [0.05, 0.17, 0, 0.1],
        [0.1, 0.235, 0, 0.07],
        [0.17, 0.275, 0, 0.048],
        [0.235, 0.265, 0, 0.032],
        [0.275, 0.225, 0, 0.02],
      ],
      0.03,
    );
    const hornR = sdf.chain(
      [
        [-0.05, 0.17, 0, 0.1],
        [-0.11, 0.235, 0, 0.07],
        [-0.18, 0.245, 0, 0.048],
        [-0.235, 0.205, 0, 0.032],
        [-0.262, 0.15, 0, 0.02],
      ],
      0.03,
    );
    const cap = hatPose(
      sdf
        .smoothUnion(0.03, crown, hornB, hornR)
        .paintWhere(sdf.halfSpace([-1, 0, 0], 0).intersect(sdf.box([1, 1, 1]).at(0, 0.3, 0)), C.blue, 0.004),
    ).bone('head');
    k.body('hat', cap, { color: C.red, roughness: 0.8, detail: 0.005 });
    const band = hatPose(sdf.torus(0.19, 0.02).scale([1, 1, 0.91]).at(0, 0.1, 0)).bone('head');
    k.body('band', band, { color: C.band, roughness: 0.85, detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(x * 90 + z * 70) });
    const bell = (x: number, y: number) =>
      sdf
        .sphere(0.03)
        .subtract(sdf.box([0.1, 0.004, 0.1]).at(0, -0.012, 0))
        .at(x, y, 0);
    const bells = hatPose(sdf.union(bell(0.292, 0.205), bell(-0.278, 0.128))).bone('head');
    k.body('bells', bells, { color: C.gold, roughness: 0.3, metalness: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ hair: a small cap and separate locks
    const hairColor = k.tint('hair');
    const shell = sdf.ellipsoid([0.212, 0.207, 0.197]).at(0, HEAD_Y, 0);
    const back = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.6)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], 0.0));
    const temples = shell
      .smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], -0.64))
      .smoothIntersect(0.015, sdf.halfSpace([-1, 0, 0], -0.15).mirror('x'))
      .smoothIntersect(0.015, sdf.halfSpace([0, 0, 1], 0.1));
    const top = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.76)).smoothIntersect(0.02, sdf.halfSpace([0, 0, -1], 0.17));
    const nape = sdf.union(
      ...[-80, -56, -32, -10, 10, 32, 56, 80].map((a, i) => {
        const r = (a * Math.PI) / 180;
        const sx = Math.sin(r);
        const cz = Math.cos(r);
        const drop = 0.56 - (i % 2) * 0.025;
        return sdf.chain(
          [
            [0.17 * sx, 0.66, -0.15 * cz, 0.036],
            [0.172 * sx, 0.6, -0.152 * cz, 0.03],
            [0.17 * sx, drop, -0.15 * cz, 0.009],
          ],
          0.012,
        );
      }),
    );
    // Fringe locks across the forehead under the band, all swept toward the character's left (x > 0), with pointed tips.
    const lock = (x: number, len: number) => {
      const zAt = (px: number, py: number) => h.faceZ(Math.min(Math.abs(px), 0.17), py) + 0.004;
      const p0: [number, number, number] = [x, 0.772, zAt(x, 0.772) - 0.004];
      const p1: [number, number, number] = [x + 0.018, 0.772 - len * 0.5, zAt(x + 0.018, 0.772 - len * 0.5) + 0.004];
      const p2: [number, number, number] = [x + 0.05, 0.772 - len, zAt(x + 0.05, 0.772 - len) + 0.008];
      return sdf.chain([[...p0, 0.03], [...p1, 0.026], [...p2, 0.008]], 0.012);
    };
    const fringe = sdf.smoothUnion(
      0.012,
      lock(-0.15, 0.06),
      lock(-0.1, 0.075),
      lock(-0.05, 0.09),
      lock(0.0, 0.1),
      lock(0.05, 0.095),
      lock(0.1, 0.08),
      lock(0.15, 0.06),
    );
    const sideburn = pair(
      sdf.chain(
        [
          [0.175, 0.7, 0.04, 0.026],
          [0.18, 0.66, 0.045, 0.02],
          [0.178, 0.628, 0.05, 0.011],
        ],
        0.01,
      ),
    );
    const hair = sdf.smoothUnion(0.015, back, temples, top, nape, fringe, sideburn).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ tunic: harlequin diamonds, long blue sleeves
    const A = 0.058; // half-diagonal of a diamond
    const diamond = profile.polygon([[0, A], [A, 0], [0, -A], [-A, 0]]);
    const diamonds = (kind: number) => {
      const cells: sdf.Shape[] = [];
      for (let n = 2; n <= 9; n++)
        for (let m = -4; m <= 4; m++) {
          if ((m + n) % 2 !== 0) continue;
          const idx = n % 3;
          if (idx === kind) cells.push(sdf.extrude(diamond, 0.7).scale(0.97).at(m * A, n * A, 0).intersect(sdf.box([0.215, 1, 1]).at(0, n * A, 0)));
        }
      return sdf.union(...cells);
    };
    const hem = sdf.halfSpace([0, 1, 0], 0.252);
    const tunicTorso = h.torso.round(0.006).intersect(sdf.halfSpace([0, -1, 0], -0.215));
    const tunic = h
      .weighted(tunicTorso)
      .paintWhere(diamonds(1), C.blue, 0.002)
      .paintWhere(diamonds(2), C.gold, 0.002)
      .paintWhere(hem.intersect(sdf.halfSpace([0, -1, 0], -0.1)), C.blue, 0.003);
    k.body('tunic', tunic, { color: h.tint.shirt ?? C.red, roughness: 0.85, detail: 0.005, textureDensity: 1.5 });

    const sleeves = h.perArm((j) => {
      const upper = sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L');
      const fore = sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.78), 0.043, 0.041).bone('forearm.L');
      return sdf.smoothUnion(0.015, upper, fore);
    });
    k.body('sleeves', sleeves, { color: C.blue, roughness: 0.85 });
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.7), lerp(j.ELBOW, j.WRIST, 1.0), 0.046, 0.047).round(0.003).bone('forearm.L'));
    k.body('cuffs', cuffs, { color: C.ruff, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ ruff: a scalloped white collar under the chin
    const lobes = (n: number, R: number, y: number, r: number, phase: number) =>
      sdf.union(
        ...Array.from({ length: n }, (_, i) => {
          const a = ((i + phase) / n) * Math.PI * 2;
          return sdf.sphere(r).at(R * Math.sin(a), y, R * Math.cos(a));
        }),
      );
    const ruff = sdf
      .smoothUnion(0.012, sdf.torus(0.078, 0.022), lobes(16, 0.098, 0, 0.024, 0), lobes(16, 0.084, 0.014, 0.02, 0.5))
      .scale([1, 1, 0.88])
      .at(0, 0.445, -0.008)
      .bone('chest');
    k.body('ruff', ruff, { color: C.ruff, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ red tights and curled green shoes
    const leg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.1, 0.002], 0.048, 0.044).bone('shin.L'),
    );
    const trunks = h.weighted(h.torso.round(0.002).intersect(h.band(0.15, 0.235)));
    k.body('tights', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(leg), trunks), {
      color: C.tights,
      roughness: 0.8,
    });
    const shoe = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.052, 0.04, 0.09]).at(0, 0.04, 0.035),
        sdf.sphere(0.05).at(0, 0.05, -0.005),
        sdf.chain(
          [
            [0, 0.04, 0.09, 0.036],
            [0, 0.05, 0.14, 0.03],
            [0, 0.075, 0.178, 0.024],
            [0, 0.11, 0.19, 0.018],
          ],
          0.02,
        ),
        sdf.cylinder(0.056, 0.034, 0.012).at(0, 0.104, 0.002),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.014).intersect(sdf.box([1, 1, 1]).at(0, 0, 0)), C.shoeSole, 0.003)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.6, detail: 0.004 });
    const toeBell = pair(sdf.sphere(0.014).at(0, 0.125, 0.192).rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L'));
    k.body('toebells', toeBell, { color: C.gold, roughness: 0.3, metalness: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ the three balls
    // The right fist (x < 0) holds one ball; two more float in an arc beside the head (rigid on the chest bone).
    const gR = h.arms.R.GRIP;
    const handR: [number, number, number] = [-gR[0], gR[1] + 0.035, gR[2] + 0.005];
    const spots = (c: readonly [number, number, number], r: number) =>
      sdf.union(
        sdf.sphere(0.013).at(c[0] + r, c[1] + 0.006, c[2] + 0.004),
        sdf.sphere(0.013).at(c[0] - 0.004, c[1] + r, c[2] + 0.008),
        sdf.sphere(0.013).at(c[0] - 0.01, c[1] - 0.012, c[2] + r),
        sdf.sphere(0.013).at(c[0] - r, c[1] - 0.004, c[2] - 0.004),
        sdf.sphere(0.013).at(c[0] + 0.008, c[1] - r, c[2] - 0.004),
      );
    const ball = (c: readonly [number, number, number], bone: string) =>
      sdf.sphere(BALL_R).at(...c).paintWhere(spots(c, BALL_R), C.spot, 0.002).bone(bone);
    k.body('ball_hand_r', ball(handR, 'knife.R'), { color: C.ballR, roughness: 0.5, detail: 0.004 });
    k.body('ball_air_r', ball([-0.33, 0.7, 0.02], 'chest'), { color: C.ballTop, roughness: 0.5, detail: 0.004 });
    k.body('ball_air_l', ball([0.33, 0.72, 0.02], 'chest'), { color: C.ballL, roughness: 0.5, detail: 0.004 });
  },
});
