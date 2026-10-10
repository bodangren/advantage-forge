import { mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Ruin keeper — Chibi Quest wilderness NPC (catalog `npcs/wilderness/ruin-keeper`), about 1.0 m to the
 * top of the hair bun, faces +Z. Target: docs/npc-mockups/ruin-keeper_001.jpg. Built on the humanoid
 * kind (assets/parts/humanoid-kind.ts), dressed in `extra`.
 *
 * Role: a ruins NPC who guards old ruins, opens sealed doors, and tells their history; kind, never
 *   scary. Seen in 3D and as a 128 px sprite: the gray hood, the big iron key ring, the glowing lantern.
 * One idea: a small round-faced keeper in a mossy gray hood and cape, one fist raised with a big iron
 *   ring of old keys and the other hand holding a glowing lantern.
 * Shape language: round and soft (hood, face, curls, pouches), the ring and the lantern the hard forms.
 * Palette (60/30/10): cloak #6a6870 with moss trim #3f5a44; dress #6b4a2c; belt and cuffs #5a3a24;
 *   boots #4a3424; hair #a8a4a0; iron #5a5a60 and #4a4448; the lantern glow #ffc060 is the accent.
 * Value plan: the mid-gray hood frames the light face; the warm brown dress sits under the cool cape;
 *   the orange glow and the dark iron ring are the two focal spots.
 * Bodies: skin, hood, cape, hair, bun, glasses, dress, belt, pouches, cuffs, warmers, boots, clasp,
 *   key ring, keys, lantern frame, lantern glow.
 * Rig: the humanoid kind's skeleton and clips. The right arm is raised (`pose`) and the ring is rigid on
 *   `knife.R`; the left arm keeps the clip motion and the lantern is rigid on `knife.L`.
 */

const C = {
  trim: '#3f5a44',
  dress: '#6b4a2c',
  belt: '#5a3a24',
  cuff: '#7a4a2c',
  pouch: '#6a4428',
  boot: '#4a3424',
  warmer: '#8f866f',
  hair: '#a8a4a0',
  glasses: '#4a3a2a',
  iron: '#5a5a60',
  frame: '#4a4448',
  glow: '#ffc060',
};

type V3 = readonly [number, number, number];

export default humanoidAsset({
  name: 'ruin-keeper',
  description: 'A kind old ruin keeper in a mossy gray hood and cape, holding up a big ring of iron keys and a glowing lantern.',
  reference: 'docs/npc-mockups/ruin-keeper_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e' },
    hair: { gray: '#a8a4a0', silver: '#b8b4c4', brown: '#5a301d', auburn: '#8e3b1c' },
    eyes: { green: '#3d7a35', brown: '#6e4020', blue: '#2f6aa8', hazel: '#8a6a2a' },
    cloth: { mossgray: '#6a7068', slate: '#6a6870', lichen: '#5f6a5a', umber: '#6a5a50' },
  },
  presets: {
    keeper: { skin: 'light', hair: 'gray', eyes: 'green', cloth: 'mossgray' },
    warden: { skin: 'tan', hair: 'brown', eyes: 'brown', cloth: 'umber' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  pose: {
    R: { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] },
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y, HIP, KNEE, ANKLE } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const weave = (x: number, y: number, z: number) => 0.0022 * Math.sin(x * 90 + y * 40) * Math.sin(z * 80 - y * 30);
    const strands = (x: number, y: number, z: number) => 0.003 * Math.sin(x * 160 + y * 120 + Math.sin(z * 60 + x * 30) * 2);
    const hairColor = k.tint('hair');
    const cloakTint = h.tint.shirt!;
    const trimTint = k.tint('cloth', { color: C.trim, follow: 0.4 });
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');

    // ------------------------------------------------------------------ the hood: a shell around the head, open at the face
    const folds = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z + 0.06) * 5 + y * 12) * (0.6 + 0.4 * Math.sin(y * 25 + x * 12));
    const hoodOuter = sdf.ellipsoid([0.254, 0.248, 0.252]).displace(0.013, folds).at(0, 0.025, -0.04);
    const hoodInner = sdf.ellipsoid([0.212, 0.206, 0.198]).at(0, 0, 0);
    const shellHood = hoodOuter.subtract(hoodInner);
    const opening = sdf.ellipsoid([0.158, 0.205, 0.25]).at(0, -0.075, 0.22);
    // A soft peak sweeps up and back, and its tip flops over toward the back.
    const peak = sdf.chain(
      [
        [0, 0.14, -0.1, 0.1],
        [0, 0.25, -0.18, 0.06],
        [0, 0.31, -0.265, 0.03],
        [0, 0.28, -0.32, 0.018],
      ],
      0.05,
    );
    const hoodAll = sdf.smoothUnion(0.04, shellHood, peak).smoothSubtract(0.02, opening);
    const lining = opening.round(0.042).subtract(opening).union(hoodInner.round(0.006));
    const hoodCut = hoodAll.intersect(sdf.halfSpace([0, -1, 0], 0.17)).paintWhere(lining, trimTint, 0.006);
    const hoodSoft = (x: number, y: number, z: number) => 0.0012 * Math.sin(x * 60 + y * 30) * Math.sin(z * 50 - y * 20);
    k.body('hood', headPose(hoodCut), { color: cloakTint, roughness: 0.92, detail: 0.006, bump: hoodSoft });

    // ------------------------------------------------------------------ the cape: a short open cloak with a cowl
    const capeProfile = (d: number) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.5],
              [0.09 + d, 0.49],
              [0.125 + d, 0.455],
              [0.15 + d, 0.41],
              [0.166 + d, 0.35],
              [0.182 + d, 0.28],
              [0.2 + d, 0.2],
              [0.218 + d, 0.14],
              [0, 0.13],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.86]);
    const hemCut = sdf.box([0.8, 0.4, 0.8]).at(0, 0.34, 0);
    const capeShell = capeProfile(0).subtract(capeProfile(-0.014)).intersect(hemCut).intersect(sdf.halfSpace([0, 1, 0], 0.47));
    const frontOpen = sdf.box([0.15, 0.36, 0.3], 0.03).at(0, 0.26, 0.19);
    const holes = h.perArm((j) => sdf.cone(lerp(SHOULDER, j.ELBOW, -0.15), lerp(j.ELBOW, j.WRIST, 0.5), 0.066, 0.06));
    const roll = sdf.torus(0.1, 0.034).scale([1, 1, 0.95]).at(0, 0.462, -0.016);
    const moss = sdf.union(
      ...Array.from({ length: 11 }, (_, i) => {
        const a = (i / 11) * Math.PI * 2 + noise.random(i, 1, 2) * 0.4;
        const y = 0.15 + noise.random(i, 3, 4) * 0.07;
        const r = 0.19 + (0.2 - y) * 0.1;
        return sdf.ellipsoid([0.05, 0.035, 0.05]).at(r * Math.sin(a), y, 0.86 * r * Math.cos(a));
      }),
    );
    const cape = sdf
      .smoothUnion(0.02, capeShell.smoothSubtract(0.02, frontOpen).subtract(holes), roll)
      .paintWhere(moss, trimTint, 0.03)
      .paintWhere(frontOpen.round(0.02).subtract(frontOpen), trimTint, 0.004)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.172), trimTint, 0.004);
    k.body('cape', h.weighted(cape), { color: cloakTint, roughness: 0.92, detail: 0.005, bump: weave });

    // The hood falls onto the shoulders as its own layer: a short cowl with folds and a green hem.
    const cowlProfile = (d: number) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.53],
              [0.1 + d, 0.52],
              [0.16 + d, 0.495],
              [0.205 + d, 0.455],
              [0.235 + d, 0.41],
              [0.248 + d, 0.37],
              [0, 0.36],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.9]);
    const cowlFolds = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z) * 9 + y * 5);
    const cowlOpen = sdf.box([0.16, 0.3, 0.3], 0.03).at(0, 0.4, 0.22);
    const cowlShell = cowlProfile(0)
      .displace(0.006, cowlFolds)
      .subtract(cowlProfile(-0.015))
      .intersect(sdf.halfSpace([0, 1, 0], 0.5))
      .intersect(sdf.halfSpace([0, -1, 0], -0.375))
      .smoothSubtract(0.02, cowlOpen)
      .subtract(holes);
    const cowl = cowlShell
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.392), trimTint, 0.004)
      .paintWhere(cowlOpen.round(0.02).subtract(cowlOpen), trimTint, 0.004);
    k.body('cowl', h.weighted(cowl), { color: cloakTint, roughness: 0.94, detail: 0.005, bump: weave });

    // ------------------------------------------------------------------ gray hair: fringe curls and temple locks under the hood
    const skull = (a: number, e: number, lift: number): [number, number, number] => {
      const ar = (a * Math.PI) / 180;
      const er = (e * Math.PI) / 180;
      return [(0.205 + lift) * Math.sin(ar) * Math.cos(er), (0.2 + lift) * Math.sin(er), (0.19 + lift) * Math.cos(ar) * Math.cos(er)];
    };
    const lock = (a0: number, e0: number, a1: number, e1: number, r: number) => {
      const p0 = skull(a0, e0, 0.004);
      const p1 = skull((a0 + a1) / 2, (e0 + e1) / 2 + 3, 0.016);
      const p2 = skull(a1, e1, 0.01);
      return sdf.chain(
        [
          [p0[0], p0[1], p0[2], r],
          [p1[0], p1[1], p1[2], r * 1.05],
          [p2[0], p2[1], p2[2], r * 0.7],
        ],
        0.01,
      );
    };
    // A fringe that sweeps to the viewer's right (the keeper's left) in soft curls, then temple locks.
    const fringe = [
      lock(-70, 14, -52, 24, 0.026),
      lock(-52, 22, -32, 32, 0.027),
      lock(-32, 28, -12, 36, 0.027),
      lock(-12, 33, 8, 34, 0.027),
      lock(8, 34, 28, 30, 0.027),
      lock(28, 31, 48, 24, 0.027),
      lock(48, 25, 66, 16, 0.026),
      lock(-78, 6, -82, -22, 0.026),
      lock(78, 6, 82, -22, 0.026),
      lock(-92, 8, -96, -14, 0.026),
      lock(92, 8, 96, -14, 0.026),
    ];
    const cap = sdf
      .ellipsoid([0.214, 0.208, 0.198])
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0.26], -0.02))
      .smoothIntersect(0.02, sdf.halfSpace([0, 1, 0], 0.17));
    const hairShade = (x: number, y: number, z: number, base: ReturnType<typeof rgb>) =>
      mixRgb(base, rgb('#6a6660'), 0.25 * (0.5 + 0.5 * Math.sin(x * 130 + y * 90 + Math.sin(z * 50) * 2.5)));
    k.body('hair', headPose(sdf.smoothUnion(0.014, cap, ...fringe).intersect(hoodInner.round(0.003).union(opening)).paintFn(hairShade)), { color: hairColor, roughness: 0.7, detail: 0.005, bump: strands });

    // ------------------------------------------------------------------ dress with long sleeves, a belt, and pouches
    const dressProfile = (d: number) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.5],
              [0.07 + d, 0.485],
              [0.108 + d, 0.455],
              [0.128 + d, 0.4],
              [0.134 + d, 0.34],
              [0.134 + d, 0.29],
              [0.146 + d, 0.24],
              [0.158 + d, 0.19],
              [0.164 + d, 0.15],
              [0, 0.14],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.82]);
    const dressCut = sdf.box([0.7, 0.4, 0.7]).at(0, 0.15 + 0.2, 0);
    const dressShell = dressProfile(0).subtract(dressProfile(-0.014)).intersect(dressCut).intersect(sdf.halfSpace([0, 1, 0], 0.462)).round(0.002);
    const sleeve = (j: { ELBOW: V3; WRIST: V3 }) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.86), 0.043, 0.042).bone('forearm.L'),
      );
    const dress = sdf.smoothUnion(0.012, h.weighted(dressShell), h.perArm(sleeve)).paintWhere(h.band(0.236, 0.262), C.belt, 0.002);
    k.body('dress', dress, { color: C.dress, roughness: 0.88, detail: 0.005, bump: weave });

    // Leather cuffs at the wrists.
    const cuff = (j: { ELBOW: V3; WRIST: V3 }) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.72), lerp(j.ELBOW, j.WRIST, 1.0), 0.048, 0.049).round(0.002).bone('forearm.L');
    k.body('cuffs', h.perArm(cuff), { color: C.cuff, roughness: 0.7, detail: 0.004 });

    // Two big belt pouches with moss flaps and a small iron buckle.
    const pouchAt = (s: 1 | -1) =>
      sdf
        .box([0.072, 0.085, 0.05], 0.016)
        .rotateZ(-6 * s)
        .at(0.098 * s, 0.205, 0.09)
        .paintWhere(sdf.halfSpace([0, -1, 0], -0.215), C.trim, 0.006);
    k.body('pouches', sdf.union(pouchAt(1), pouchAt(-1)).bone('hips'), { color: C.pouch, roughness: 0.75, detail: 0.004, bump: weave });
    k.body('buckle', sdf.box([0.034, 0.03, 0.014], 0.006).at(0, 0.249, 0.098).bone('spine'), { color: C.iron, roughness: 0.4, metalness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ knit leg warmers and boots
    const warmer = sdf.cylinder(0.052, 0.062, 0.016).at(ANKLE[0], 0.098, 0.002).bone('shin.L');
    k.body('warmers', pair(warmer), { color: C.warmer, roughness: 0.95, detail: 0.004, bump: (x, y) => 0.003 * Math.sin(x * 160) * 0 + 0.0035 * Math.sin(y * 260) });
    const shoeFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(0.05, 0.07, 0.018).at(0, 0.055, 0), sdf.ellipsoid([0.056, 0.05, 0.098]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = shoeFoot.rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.65 });

    // ------------------------------------------------------------------ the iron clasp at the throat
    const clasp = sdf.smoothUnion(
      0.006,
      sdf.sphere(0.017).at(0, 0.44, 0.092),
      sdf.sphere(0.013).at(0.034, 0.446, 0.084),
      sdf.sphere(0.013).at(-0.034, 0.446, 0.084),
      sdf.capsule([0.034, 0.446, 0.084], [-0.034, 0.446, 0.084], 0.007),
    );
    k.body('clasp', clasp.bone('chest'), { color: C.iron, roughness: 0.4, metalness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ the key ring (right hand, x < 0)
    const gr = h.arms.R.GRIP;
    const G: [number, number, number] = [-gr[0], gr[1], gr[2]];
    const RC: [number, number, number] = [G[0] - 0.05, G[1] + 0.06, G[2] + 0.005];
    const R = 0.07;
    const link = () => sdf.torus(0.016, 0.0065).scale([1.5, 1, 1]);
    const keyRing = sdf.union(
      ...Array.from({ length: 12 }, (_, i) => {
        const a = ((i * 30 + 15) * Math.PI) / 180;
        return link()
          .rotateX(i % 2 === 0 ? 0 : 90)
          .rotateZ(i * 30 + 15 + 90)
          .at(RC[0] + R * Math.cos(a), RC[1] + R * Math.sin(a), RC[2]);
      }),
    );
    k.body('key-ring', keyRing, { color: C.iron, roughness: 0.4, metalness: 0.6, detail: 0.003, bone: 'knife.R' });

    // Five large old keys hang apart from the lower arc of the ring, each with a round bow, a shaft, and a toothed bit.
    const oneKey = (len: number) => {
      const bow = sdf.torus(0.017, 0.0075).rotateX(90).at(0, -0.017, 0);
      const shaft = sdf.capsule([0, -0.03, 0], [0, -len, 0], 0.0085);
      const bit = sdf.smoothUnion(
        0.003,
        sdf.box([0.03, 0.014, 0.012], 0.002).at(0.013, -len + 0.007, 0),
        sdf.box([0.022, 0.012, 0.012], 0.002).at(0.009, -len + 0.024, 0),
      );
      return sdf.smoothUnion(0.004, bow, shaft, bit);
    };
    const keys = sdf.union(
      ...[-60, -30, 0, 30, 60].map((a, i) => {
        const ar = ((270 + a * 1.1) * Math.PI) / 180;
        const px = RC[0] + R * Math.cos(ar);
        const py = RC[1] + R * Math.sin(ar);
        return oneKey(i % 2 === 0 ? 0.1 : 0.088)
          .rotateY(i % 2 === 0 ? 12 : -12)
          .rotateZ(a * 0.35)
          .at(px, py - 0.004, RC[2]);
      }),
    );
    k.body('keys', keys, { color: C.iron, roughness: 0.45, metalness: 0.6, detail: 0.003, bone: 'knife.R' });

    // ------------------------------------------------------------------ the lantern (left hand, x > 0)
    const gl = h.arms.L.GRIP;
    const handle = sdf.torus(0.02, 0.0065).rotateX(90).at(gl[0], gl[1] - 0.016, gl[2]);
    const top = gl[1] - 0.032;
    const lanternFrame = sdf.smoothUnion(
      0.006,
      sdf.cone([gl[0], top, gl[2]], [gl[0], top - 0.03, gl[2]], 0.01, 0.042),
      sdf.cylinder(0.044, 0.022, 0.008).at(gl[0], top - 0.035, gl[2]),
      sdf.cylinder(0.046, 0.024, 0.009).at(gl[0], top - 0.12, gl[2]),
      handle,
    );
    const bars = sdf.union(
      ...[45, 135, 225, 315].map((a) => sdf.capsule([gl[0] + 0.036 * Math.cos((a * Math.PI) / 180), top - 0.04, gl[2] + 0.036 * Math.sin((a * Math.PI) / 180)], [gl[0] + 0.036 * Math.cos((a * Math.PI) / 180), top - 0.115, gl[2] + 0.036 * Math.sin((a * Math.PI) / 180)], 0.006)),
    );
    k.body('lantern-bars', bars, { color: C.frame, roughness: 0.5, metalness: 0.5, detail: 0.004, bone: 'knife.L' });
    k.body('lantern', lanternFrame, { color: C.frame, roughness: 0.5, metalness: 0.5, detail: 0.004, maxTriangles: 6000, bone: 'knife.L' });
    k.body('glow', sdf.smoothUnion(0.01, sdf.cylinder(0.034, 0.074, 0.02).at(gl[0], top - 0.078, gl[2])), {
      color: C.glow,
      emissive: C.glow,
      emissiveIntensity: 0.6,
      roughness: 0.4,
      detail: 0.004,
      bone: 'knife.L',
    });
    void HIP;
    void KNEE;
  },
});
