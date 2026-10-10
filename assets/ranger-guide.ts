import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Ranger guide — Chibi Quest wilderness NPC (catalog `npcs/wilderness/ranger-guide`), about 0.95 m to
 * the top of the hood, faces +Z. Target: docs/npc-mockups/ranger-guide_001.jpg. Built on the humanoid kind.
 *
 * Role: a forest trail NPC (the ranger station) who guides and gives scouting quests; seen in 3D and
 *   as a 128 px sprite; the hood, the bright smile, the brass compass, and the staff must read.
 * One idea: a confident girl scout in a deep green hood and cloak, holding a brass compass out
 *   to you, with a braid, a staff, and a longbow on her back.
 * Shape language: round and soft (hood, braid, boots), a long straight staff and a slim bow as the hard lines.
 * Palette (60/30/10): cloak #2f4a3a, vest and boots browns #6b4226 / #5a3a24, shirt #f0e6cc;
 *   accent brass #c8a040 (compass, buckles); light brown hair #a8784a.
 * Value plan: the dark hood frames the light face and the light hair; the cream shirt separates
 *   the dark cloak from the brown vest; the bright brass compass is the focal point.
 * Bodies: skin, hood, cloak, hair, braid, shirt, vest, straps, brass, trousers, boots, quiver, bow, staff, compass.
 * Rig: the humanoid kind's skeleton and clips. The left arm holds the compass out in every clip and
 *   the right arm holds the staff out to the side; staff, compass, quiver, and bow are rigid on bones.
 */

const C = {
  hair: '#4a2a1a',
  braid: '#8a5a34',
  cloak: '#2f4a3a',
  vest: '#6b4226',
  strap: '#5a3a24',
  shirt: '#f0e6cc',
  cuff: '#d9c9a2',
  quiver: '#7a4a2c',
  fletch: '#f6f1ea',
  bow: '#8a6a3a',
  pants: '#6b4a2c',
  boot: '#5a3a24',
  bootCuff: '#7a5230',
  sole: '#3a2418',
  brass: '#c8a040',
  face: '#f0ece4',
  staff: '#8a6a3a',
  stone: '#b9b2a2',
  needle: '#a8372a',
  mouth: '#8a2e2a',
};

// The left arm (viewer's right) holds the compass out; the right arm holds the staff a little out
// to the side, clear of the hood.
const POSE = {
  L: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] },
  R: { elbow: [0.19, 0.33, 0.03], wrist: [0.245, 0.25, 0.055] },
} as const;

export default humanoidAsset({
  name: 'ranger-guide',
  description: 'A confident young ranger guide in a green hooded cloak with a longbow on her back, holding up a brass compass and a walking staff.',
  reference: 'docs/npc-mockups/ranger-guide_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { darkbrown: '#4a2a1a', lightbrown: '#a8784a', brown: '#5a301d', black: '#231a17', auburn: '#8e3b1c', blond: '#c4974a', silver: '#b8b4c4' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { forest: '#2f4a3a', olive: '#4f5530', umber: '#5a4430', dusk: '#3f4a5c' },
  },
  presets: {
    scout: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'umber' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: false,
  pose: { L: POSE.L, R: POSE.R },

  // A closed, confident smile: a bold crescent with a dimple dot at each corner (no teeth).
  paintSkin(skin, h) {
    const smile = h.onFace(sdf.extrude(profile.arc(0.06, 0.011, 230, 310), 0.3), 0, 0.592);
    const dimples = [-1, 1].map((sx) => h.onFace(sdf.extrude(profile.circle(0.007), 0.3), sx * 0.039, 0.5475));
    return skin.paintWhere(sdf.union(smile, ...dimples), C.mouth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const rad = Math.PI / 180;
    const cloakColor = h.tint.shirt ?? C.cloak;
    const hairColor = k.tint('hair', { color: C.hair, follow: 1 });

    // ------------------------------------------------------------------ hood (on the head bone)
    // A shell around the head, open at the front for the face, with a drooping point at the back.
    const hoodOuter = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.238, 0.25, 0.25]).at(0, HEAD_Y + 0.01, -0.02),
      sdf.chain(
        [
          [0, HEAD_Y + 0.21, -0.1, 0.05],
          [0, HEAD_Y + 0.17, -0.2, 0.06],
          [0, HEAD_Y + 0.12, -0.285, 0.05],
          [0, HEAD_Y + 0.07, -0.34, 0.022],
          [0, HEAD_Y + 0.0, -0.25, 0.085],
          [0, HEAD_Y - 0.09, -0.22, 0.08],
          [0, HEAD_Y - 0.17, -0.18, 0.075],
        ],
        0.04,
      ),
    );
    const faceOpening = sdf.ellipsoid([0.185, 0.2, 0.42]).at(0, HEAD_Y - 0.02, 0.17);
    const hood = sdf
      .smoothSubtract(0.02, hoodOuter.subtract(h.head.round(0.014)), faceOpening)
      .round(0.006)
      .bone('head');
    k.body('hood', hood, { color: cloakColor, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.002 * Math.sin(x * 70 + y * 40) * Math.cos(z * 60) });

    // ------------------------------------------------------------------ hair: a snug cap and swept locks
    // Locks follow the skull from the crown over the forehead to the temples (azimuth from the front).
    const skull = (az: number, el: number, grow: number): [number, number, number] => {
      const a = az * rad;
      const e = el * rad;
      return [(0.205 + grow) * Math.cos(e) * Math.sin(a), HEAD_Y + (0.2 + grow) * Math.sin(e), (0.19 + grow) * Math.cos(e) * Math.cos(a)];
    };
    const lock = (az0: number, el0: number, el1: number, spread: number, r0: number) => {
      const pts: [number, number, number, number][] = [];
      for (let i = 0; i <= 3; i++) {
        const t = i / 3;
        const [x, y, z] = skull(az0 * (0.3 + spread * t * 0.7), el0 + (el1 - el0) * t, 0.012 + 0.004 * Math.sin(t * Math.PI));
        pts.push([x, y, z, r0 * (1 - 0.45 * t)]);
      }
      return sdf.chain(pts, 0.012);
    };
    const frontLocks = [-68, -51, -34, -17, 0, 17, 34, 51, 68].map((az, i) => lock(az, 80, 24 + 3 * Math.abs(i - 4), 1.15, 0.026));
    const templeLocks = [-84, 84].flatMap((az) => [lock(az, 56, 6, 1, 0.026), lock(az * 0.93, 40, -12, 1, 0.022)]);
    const cap = sdf
      .ellipsoid([0.21, 0.205, 0.195])
      .at(0, HEAD_Y + 0.003, -0.004)
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -(HEAD_Y + 0.07)).smoothUnion(0.05, sdf.halfSpace([0, 0, 1], -0.03)));
    const hairBack = sdf.smoothUnion(0.012, cap, ...frontLocks, ...templeLocks).bone('head');
    k.body('hair', hairBack, { color: hairColor, roughness: 0.6, detail: 0.005 });

    const braidColor = k.tint('hair', { color: C.braid, follow: 1 });
    // The braid over the right shoulder (x < 0): four lobes from the temple, down the front of the shoulder.
    const braidPts: [number, number, number, number][] = [
      [-0.155, 0.56, 0.035, 0.034],
      [-0.135, 0.5, 0.075, 0.036],
      [-0.115, 0.435, 0.105, 0.036],
      [-0.1, 0.375, 0.125, 0.034],
      [-0.09, 0.32, 0.13, 0.03],
    ];
    const lobes = braidPts.map(([x, y, z, r], i) =>
      sdf.ellipsoid([r * 1.05, r * 1.05, r * 0.95]).rotateZ(i % 2 ? 20 : -20).at(x, y, z),
    );
    const braid = sdf
      .smoothUnion(0.012, ...lobes)
      .smoothUnion(0.02, sdf.sphere(0.02).at(-0.085, 0.285, 0.13))
      .bone('chest');
    k.body('braid', braid, { color: braidColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ cream shirt: tunic and sleeves
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.048, 0.044).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.88), 0.044, 0.041).bone('forearm.L'),
      ),
    );
    const tunic = h.torso.round(0.004).intersect(sdf.halfSpace([0, -1, 0], -0.152));
    k.body('shirt', sdf.smoothUnion(0.012, h.weighted(tunic), sleeves), { color: C.shirt, roughness: 0.88 });

    const cuffs = h.perArm((j) =>
      sdf
        .cone(lerp(j.ELBOW, j.WRIST, 0.7), lerp(j.ELBOW, j.WRIST, 0.99), 0.046, 0.047)
        .round(0.002)
        .bone('forearm.L'),
    );
    const collar = sdf.torus(0.058, 0.016).at(0, 0.452, -0.012).bone('chest');
    k.body('cuffs', sdf.union(cuffs, collar), { color: C.cuff, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ leather vest, belt, and baldric
    const vestShell = h.torso.round(0.014).subtract(h.torso.round(-0.002));
    const vestCut = sdf.union(
      h.band(0.27, 0.43),
      // a shoulder strap on each side (front and back) joins the body to the chest panel
      sdf.box([0.05, 0.2, 0.6]).at(0.07, 0.43, 0).mirror('x'),
    );
    const vestOpening = sdf.box([0.05, 0.2, 0.2], 0.01).rotateZ(0).at(0, 0.4, 0.15);
    const vest = h.weighted(vestShell.intersect(vestCut).subtract(vestOpening));
    k.body('vest', vest, { color: C.vest, roughness: 0.75, detail: 0.004 });

    const belt = h.weighted(h.torso.round(0.017).subtract(h.torso.round(0.002)).intersect(h.band(0.238, 0.268)));
    const baldric = h.weighted(
      h.torso
        .round(0.017)
        .subtract(h.torso.round(0.002))
        .intersect(sdf.box([0.036, 0.62, 0.6]).rotateZ(52).at(0, 0.35, 0)),
    );
    k.body('straps', sdf.union(belt, baldric), { color: C.strap, roughness: 0.7, detail: 0.004 });
    const buckle = sdf.box([0.034, 0.026, 0.012], 0.004).at(0, 0.253, 0.1 + 0.02).bone('spine');
    const buckleHole = sdf.box([0.018, 0.012, 0.03]).at(0, 0.253, 0.12);
    const clasp = sdf.torus(0.012, 0.004).rotateX(90).at(0.0, 0.4, 0.098).bone('chest');
    k.body('brass', sdf.union(buckle.subtract(buckleHole), clasp), { color: C.brass, roughness: 0.35, metalness: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ cloak: a back drape and a shoulder mantle
    // The inner profile reaches below the hem, so the cut opens the bottom (no thin coincident disc).
    const cloakProfile = (grow: number, bottom = 0.15) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.48],
              [0.09 + grow, 0.47],
              [0.15 + grow, 0.43],
              [0.175 + grow, 0.37],
              [0.19 + grow, 0.28],
              [0.21 + grow, 0.19],
              [0.215 + grow, 0.15],
              [0.215 + grow, bottom],
              [0, bottom],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.9]);
    const cloakShell = cloakProfile(0.012).subtract(cloakProfile(-0.002, 0.1)).intersect(sdf.halfSpace([0, -1, 0], -0.15));
    // Back and sides below the shoulders; the mantle over the shoulders, open at the front.
    const drape = h.weighted(cloakShell.intersect(sdf.halfSpace([0, 0, 1], 0.02)));
    const mantle = cloakShell
      .intersect(sdf.halfSpace([0, -1, 0], -0.345))
      .subtract(sdf.box([0.1, 0.2, 0.2], 0.02).at(0, 0.37, 0.17));
    const cloak = sdf.smoothUnion(0.015, drape, mantle.bone('chest'));
    k.body('cape', cloak, { color: cloakColor, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.002 * Math.sin(x * 60 + z * 50) * Math.cos(y * 45) });

    // ------------------------------------------------------------------ trousers are the kind's; tall boots with a folded cuff
    const bootLeg = sdf.smoothUnion(
      0.012,
      sdf.cone([ANKLE[0], 0.128, 0.0], [ANKLE[0], 0.07, 0.002], 0.052, 0.049).bone('shin.L'),
      sdf
        .smoothUnion(
          0.03,
          sdf.cylinder(0.052, 0.07, 0.018).at(0, 0.06, 0),
          sdf.ellipsoid([0.058, 0.05, 0.1]).at(0, 0.046, 0.046),
        )
        .intersect(sdf.halfSpace([0, -1, 0], 0))
        .rotateY(10)
        .at(ANKLE[0], 0, 0)
        .bone('foot.L'),
    );
    const sole = sdf
      .smoothUnion(0.03, sdf.cylinder(0.052, 0.07, 0.018).at(0, 0.06, 0), sdf.ellipsoid([0.058, 0.05, 0.1]).at(0, 0.046, 0.046))
      .round(0.004)
      .intersect(sdf.halfSpace([0, 1, 0], 0.014))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L')
      .paint(C.sole);
    k.body('boots', pair(sdf.union(bootLeg, sole)), { color: C.boot, roughness: 0.65 });
    const bootCuff = sdf
      .cylinder(0.058, 0.026, 0.01)
      .at(ANKLE[0], 0.116, 0.0)
      .subtract(sdf.cylinder(0.044, 0.04).at(ANKLE[0], 0.116, 0.0))
      .bone('shin.L');
    k.body('bootCuffs', pair(bootCuff), { color: C.bootCuff, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ quiver and longbow on the back (chest bone)
    const quiverBody = sdf
      .cone([0, -0.13, 0], [0, 0.13, 0], 0.03, 0.036)
      .round(0.004)
      .subtract(sdf.cylinder(0.026, 0.08).at(0, 0.13, 0))
      .rotateZ(-14)
      .at(0.085, 0.36, -0.2);
    const shafts = [0.012, -0.004, 0.026].map((dx, i) => {
      const base = [0.085 + dx * 1.0, 0.44 + 0.01 * i, -0.2 + (i - 1) * 0.012] as const;
      return sdf.capsule([base[0] - 0.02, base[1] - 0.06, base[2]], [base[0] + 0.03 + 0.004 * i, base[1] + 0.12, base[2]], 0.005);
    });
    const feathers = [0.012, -0.004, 0.026].map((dx, i) => {
      const base = [0.085 + dx, 0.44 + 0.01 * i, -0.2 + (i - 1) * 0.012] as const;
      return sdf.box([0.026, 0.05, 0.008], 0.003).rotateZ(-14).at(base[0] + 0.024 + 0.003 * i, base[1] + 0.1, base[2]);
    });
    k.body('quiver', sdf.union(quiverBody, sdf.box([0.07, 0.014, 0.014], 0.005).rotateZ(-14).at(0.085, 0.3, -0.17)).bone('chest'), {
      color: C.quiver,
      roughness: 0.7,
      detail: 0.004,
    });
    k.body('arrows', sdf.union(...shafts).bone('chest'), { color: C.bow, roughness: 0.7, detail: 0.003 });
    k.body('fletching', sdf.union(...feathers).bone('chest'), { color: C.fletch, roughness: 0.8, detail: 0.003 });

    // The bow: a curved stave running up and out to the right (x < 0), above the shoulder, clear of the head.
    const bowPts: [number, number, number, number][] = [
      [-0.27, 0.6, -0.205, 0.014],
      [-0.2, 0.5, -0.225, 0.017],
      [-0.1, 0.34, -0.25, 0.02],
      [-0.0, 0.2, -0.26, 0.02],
      [0.06, 0.1, -0.26, 0.016],
      [0.12, 0.04, -0.25, 0.013],
    ];
    k.body('bow', sdf.chain(bowPts, 0.01).bone('chest'), { color: C.bow, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ the walking staff (right hand, knife.R)
    // Upright, 0.9 m long, its foot 0.03 m above the ground; it leans out 3 degrees so that it clears the hood.
    const gr = h.arms.R.GRIP;
    const staffX = -gr[0];
    const stave = sdf.cone([0, 0.07, 0], [0, 0.97, 0], 0.019, 0.017);
    const knob = sdf.box([0.07, 0.03, 0.05], 0.01).at(0, 0.84, 0);
    const wrap = sdf.cylinder(0.024, 0.07, 0.006).at(0, gr[1] - 0.005, 0);
    const foot = sdf.cone([0, 0.07, 0], [0, 0.11, 0], 0.019, 0.022);
    const staffWood = sdf
      .smoothUnion(0.008, stave, knob)
      .smoothUnion(0.004, foot)
      .rotateZ(3)
      .at(staffX, 0, gr[2])
      .bone('knife.R');
    k.body('staff', staffWood, { color: C.staff, roughness: 0.75, detail: 0.004 });
    const tip = sdf
      .smoothUnion(
        0.01,
        sdf.cone([0, 0.96, 0], [0, 1.04, 0], 0.024, 0.006),
        sdf.box([0.05, 0.03, 0.02], 0.006).at(0, 0.96, 0),
      )
      .rotateZ(3)
      .at(staffX, 0, gr[2])
      .bone('knife.R');
    const grip = sdf.union(wrap).rotateZ(3).at(staffX, 0, gr[2]).bone('knife.R');
    k.body('staffTip', tip, { color: C.stone, roughness: 0.8, detail: 0.004 });
    k.body('staffWrap', grip, { color: C.strap, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ the brass compass (left hand, knife.L)
    // A round case 0.07 m across and 0.025 m thick, face up, with a glass-cream face and a needle.
    const gl = h.arms.L.GRIP;
    const cy = gl[1] + 0.04;
    // Tilted toward the viewer (about the fist) so that the face reads from the front.
    const place = (shape: sdf.Shape) => shape.rotateX(50).at(gl[0], cy, gl[2]).bone('knife.L');
    const compassBody = place(
      sdf
        .cylinder(0.045, 0.03, 0.007)
        .subtract(sdf.cylinder(0.038, 0.04).at(0, 0.01, 0))
        .smoothUnion(0.004, sdf.torus(0.013, 0.005).rotateX(90).at(0, 0.0, -0.052)),
    );
    k.body('compass', compassBody, { color: C.brass, roughness: 0.3, metalness: 0.9, detail: 0.0025 });
    const faceDisk = sdf.cylinder(0.038, 0.014, 0.002).at(0, -0.003, 0);
    const needleShape = sdf.extrude(
      profile.polygon([
        [-0.007, 0],
        [0, 0.032],
        [0.007, 0],
        [0, -0.032],
      ]),
      0.006,
    );
    const needle = needleShape.rotateX(90).rotateY(35).at(0, 0.0045, 0);
    const ticks = [0, 90, 180, 270].map((a) => sdf.box([0.006, 0.02, 0.008]).at(0, 0.0, -0.032).rotateY(a));
    const dial = place(
      faceDisk
        .paintWhere(sdf.union(...ticks).at(0, 0.004, 0), C.brass, 0.001)
        .paintWhere(needle.intersect(sdf.cylinder(0.038, 0.05)), C.needle, 0.001),
    );
    k.body('compassFace', dial, { color: C.face, roughness: 0.4, detail: 0.0025 });
  },
});
