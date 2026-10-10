import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Banker — Chibi Quest settlement NPC (catalog `npcs/settlement/banker`), about 1.0 m to the top of
 * the hair, faces +Z. Target: docs/npc-mockups/banker_001.jpg. Built on the humanoid kind.
 *
 * Role: a town NPC who keeps the players' coins, seen at the bank in 3D and as a 128 px sprite; the
 *   round spectacles, the tall combed hair, the green waistcoat with the gold chain, and the ledger must read.
 * One idea: a neat, smiling banker with big thick black round spectacles, a black bow tie, and a green
 *   waistcoat, who hugs a fat brown ledger and holds a white quill.
 * Shape language: round and soft (spectacles, nose, hair, bow tie), with the ledger as the one hard form.
 * Palette (60/30/10): green #2f5a44 (waistcoat; the `cloth` slot) / white #f6f1ea (shirt) / gray #6a6870
 *   (trousers); black hair #231a17, bow tie and shoes #2a2428; gold #e0b040 (buttons, chain, ledger
 *   corners) and spectacles #c8a040 as the accent; ledger #7a4a2c with #e8dcc0 page edges.
 * Value plan: the black hair and the bright spectacles over the light face are the focal point; the dark
 *   waistcoat frames the white shirt and the bow tie; the gold chain is the accent.
 * Bodies: skin (big nose, thick brows, small smile), hair, spectacles, shirt, collar, waistcoat, bow tie,
 *   buttons, chain, trousers (kind), shoes (kind), quill, ledger, pages, corners.
 * Rig: the humanoid kind's skeleton and clips; the left arm is posed (the ledger at the chest) and keeps
 *   the pose in every clip. The ledger is rigid on `knife.L`, the quill on `knife.R`.
 */

const C = {
  hair: '#231a17',
  frame: '#1a1416',
  shirt: '#f6f1ea',
  seam: '#d8cfbe',
  tie: '#2a2428',
  gold: '#e0b040',
  trousers: '#6a6870',
  shoe: '#2a2428',
  ledger: '#7a4a2c',
  ledgerDark: '#5a3620',
  pages: '#e8dcc0',
  quill: '#f6f1ea',
  quillShade: '#d6cfc2',
  nib: '#2a2428',
  smile: '#8a4a3a',
};

export default humanoidAsset({
  name: 'banker',
  description: 'A neat, smiling town banker with round gold spectacles and a dark green waistcoat, holding a big ledger and a white quill.',
  reference: 'docs/npc-mockups/banker_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', silver: '#b8b4c4', auburn: '#8e3b1c', blond: '#c4974a', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { pine: '#1e4636', navy: '#2f4468', plum: '#5e3358', slate: '#4a5a6a' },
  },
  presets: {
    default: { skin: 'fair', hair: 'black', eyes: 'brown', cloth: 'pine' },
    festive: { skin: 'tan', hair: 'brown', eyes: 'hazel', cloth: 'plum' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: C.shoe,
  lashes: false,
  // The left hand holds the ledger out in front at chest height; the right arm keeps the clip motion.
  pose: { L: { elbow: [0.16, 0.33, 0.04], wrist: [0.185, 0.315, 0.125] } },

  // Thick dark brows, a rounder nose in the skin color, and a small closed smile with round corners.
  paintSkin(skin, h) {
    const noseZ = h.faceZ(0, 0.566) + 0.012;
    const nose = sdf.ellipsoid([0.053, 0.047, 0.054]).at(0, 0.567, noseZ + 0.012).bone('head');
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.016, 236, 304), 0.3).at(0, 0.6, 0.1);
    const brows = sdf.extrude(profile.arc(0.08, 0.036, 60, 114), 0.3).at(0.098, 0.652, 0.1).mirror('x');
    const smile = sdf.extrude(profile.arc(0.052, 0.011, 235, 305), 0.3).at(0, 0.512 + 0.052, 0.1);
    return skin
      .smoothUnion(0.01, nose)
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(brows, C.hair, 0.003)
      .paintWhere(smile, C.smile, 0.002);
  },

  extra(k, h) {
    const { SHOULDER } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const surf = (shape: sdf.Shape, x: number, y: number): number | null => {
      const hit = sdf.raycast(shape, [x, y, 1], [0, 0, -1]);
      return hit ? hit[2] : null;
    };
    const hairColor = k.tint('hair');
    const cloth = h.tint.shirt!;

    // ------------------------------------------------------------------ combed hair with a tall swept quiff
    const faceMask = sdf.ellipsoid([0.25, 0.16, 0.23]).rotateZ(8).at(0.01, 0.6, 0.14);
    const cap = sdf
      .ellipsoid([0.218, 0.213, 0.2])
      .at(0, 0.685, -0.01)
      .smoothSubtract(0.015, faceMask);
    // Separate glossy locks combed from the hairline up and back (a pompadour), each a chain.
    const top = (x: number) => 0.685 + 0.213 * Math.sqrt(Math.max(0, 1 - (x / 0.218) ** 2));
    const lock = (i: number) => {
      const x = i * 0.04;
      const lift = 0.014 - 0.002 * Math.abs(i);
      const r = 0.03 - 0.002 * Math.abs(i);
      return sdf.chain(
        [
          [x * 1.15, 0.785 - 0.008 * Math.abs(i), 0.135, r],
          [x * 0.95, top(x) - 0.01 + lift, 0.07, r + 0.006],
          [x * 0.8, top(x) - 0.012 + lift * 0.4, -0.02, r + 0.004],
          [x * 0.7, top(x) - 0.06, -0.12, r - 0.002],
          [x * 0.65, top(x) - 0.12, -0.17, r - 0.006],
        ],
        0.016,
      );
    };
    const locks = [-3, -2, -1, 0, 1, 2, 3].map(lock);
    // The tall front wave: a curled lock that stands up from the hairline and falls back.
    const wave = sdf.chain(
      [
        [0.03, 0.8, 0.13, 0.03],
        [0.0, 0.88, 0.12, 0.034],
        [-0.03, 0.935, 0.08, 0.03],
        [-0.07, 0.945, 0.01, 0.026],
      ],
      0.014,
    );
    const sideburns = pair(sdf.cone([0.19, 0.72, 0.07], [0.2, 0.64, 0.06], 0.026, 0.012));
    const hairShape = sdf
      .smoothUnion(0.014, cap, ...locks, wave, sideburns)
      .smoothIntersect(0.01, sdf.ellipsoid([0.3, 0.3, 0.3]).at(0, 0.8, -0.02));
    k.body('hair', hairShape.bone('head'), { color: hairColor, roughness: 0.35, detail: 0.004 });

    // ------------------------------------------------------------------ round spectacles
    const ex = h.joints.EYE[0];
    const ey = h.joints.EYE[1];
    const RIM_R = 0.058; // the lens ring radius
    const rr = 0.0115; // the rim tube radius
    const gap = 0.008; // the clear gap between the rim tube and the skin
    const onFace = (x: number, y: number): [number, number, number] => [x, y, h.faceZ(Math.abs(x), y) + gap + rr];
    // Each rim is a ring of capsules whose centers follow the face surface, so it never cuts into the skin.
    const rim = (sx: number) => {
      const pts = Array.from({ length: 28 }, (_, i) => {
        const a = (2 * Math.PI * i) / 28;
        return onFace(sx * ex + RIM_R * Math.cos(a), ey - 0.002 + RIM_R * Math.sin(a));
      });
      return sdf.union(...pts.map((p, i) => sdf.capsule(p, pts[(i + 1) % pts.length]!, rr)));
    };
    const bridgeA = onFace(-(ex - RIM_R), ey + 0.004);
    const bridgeB = onFace(0, ey + 0.016);
    const bridgeC = onFace(ex - RIM_R, ey + 0.004);
    const bridge = sdf.union(sdf.capsule(bridgeA, bridgeB, 0.0095), sdf.capsule(bridgeB, bridgeC, 0.0095));
    // The temple arm leaves the outer rim, then follows the side of the head, a clear gap off the skin, to the ear.
    const armPts: [number, number, number][] = [onFace(ex + RIM_R, ey + 0.004)];
    for (let i = 1; i <= 7; i++) {
      const z = armPts[0]![2] - (i * (armPts[0]![2] + 0.005)) / 7;
      const hit = sdf.raycast(h.head, [1, ey + 0.004, z], [-1, 0, 0]);
      if (hit) armPts.push([hit[0] + gap + 0.0085, ey + 0.004, z]);
    }
    const arm = (sx: number) =>
      sdf.union(...armPts.slice(0, -1).map((p, i) => sdf.capsule([sx * p[0], p[1], p[2]], [sx * armPts[i + 1]![0], armPts[i + 1]![1], armPts[i + 1]![2]], 0.0085)));
    const glasses = sdf.union(rim(1), rim(-1), bridge, arm(1), arm(-1)).bone('head');
    k.body('spectacles', glasses, { color: C.frame, roughness: 0.35, metalness: 0.1, detail: 0.003 });

    // ------------------------------------------------------------------ white shirt: long sleeves and cuffs
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.9), 0.043, 0.04).bone('forearm.L'),
      ),
    );
    k.body('shirt', sdf.smoothUnion(0.012, h.weighted(h.torso), sleeves), { color: C.shirt, roughness: 0.85 });
    const cuffs = h.perArm((j) =>
      sdf.cone(lerp(j.ELBOW, j.WRIST, 0.74), lerp(j.ELBOW, j.WRIST, 1.0), 0.046, 0.047).round(0.002).bone('forearm.L'),
    );
    const collar = sdf.torus(0.062, 0.018).scale([1, 1, 0.9]).at(0, 0.452, -0.012).bone('chest');
    k.body('collar', sdf.union(cuffs, collar), { color: C.shirt, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ gray trousers (longer legs, a wide waist under the vest)
    const { HIP, KNEE, ANKLE } = h.joints;
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.052).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.075, 0.002], 0.049, 0.046).bone('shin.L'),
    );
    k.body('pants', sdf.smoothUnion(0.02, h.weighted(h.torso.round(0.012).intersect(sdf.halfSpace([0, 1, 0], 0.24)).intersect(sdf.halfSpace([0, -1, 0], -0.13))), pair(trouserLeg)), {
      color: C.trousers,
      roughness: 0.85,
    });

    // ------------------------------------------------------------------ waistcoat with a V opening
    const vest = h.torso.round(0.009);
    const vOpen = sdf
      .extrude(
        profile.polygon([
          [0, 0.345],
          [0.078, 0.5],
          [-0.078, 0.5],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const waist = vest
      .intersect(sdf.halfSpace([0, 1, 0], 0.425))
      .intersect(sdf.halfSpace([0, -1, 0], -0.215))
      .smoothSubtract(0.008, vOpen);
    const vestBody = h
      .weighted(waist)
      .paintWhere(sdf.box([0.07, 0.05, 0.4]).at(0.065, 0.26, 0.2).union(sdf.box([0.07, 0.05, 0.4]).at(-0.065, 0.26, 0.2)).intersect(sdf.box([1, 0.006, 1]).at(0, 0.285, 0)), k.tint('cloth', -0.25), 0.003);
    k.body('waistcoat', vestBody, { color: cloth, roughness: 0.9, detail: 0.005 });

    // The black bow tie at the collar: two puffed wings and a knot.
    const chestZ = surf(h.torso.round(0.006), 0, 0.43) ?? 0.08;
    const tieZ = chestZ + 0.012;
    const tie = sdf
      .smoothUnion(
        0.01,
        sdf.ellipsoid([0.036, 0.026, 0.02]).rotateZ(-14).at(0.04, 0.435, tieZ),
        sdf.ellipsoid([0.036, 0.026, 0.02]).rotateZ(14).at(-0.04, 0.435, tieZ),
        sdf.sphere(0.016).at(0, 0.435, tieZ + 0.003),
      )
      .bone('chest');
    k.body('bowtie', tie, { color: C.tie, roughness: 0.6, detail: 0.004 });

    // Gold buttons down the closed part of the waistcoat, on its surface.
    const buttons = sdf.union(
      ...[0.31, 0.25].map((y) => {
        const z = surf(waist, 0, y);
        return z === null ? sdf.sphere(0.0001).at(0, 5, 0) : sdf.sphere(0.013).at(0, y, z - 0.002);
      }),
    ).bone('chest');
    k.body('buttons', buttons, { color: C.gold, roughness: 0.3, metalness: 0.9, detail: 0.004 });

    // The watch chain: a swag of gold links from a button hole to a pocket watch on the viewer's right.
    const front = sdf.union(waist, h.torso.round(0.003));
    const links: sdf.Shape[] = [];
    for (let i = -11; i <= 11; i++) {
      const u = i / 11;
      const x = 0.012 + 0.075 * u;
      const y = 0.352 + 0.052 * u * u;
      const z = surf(front, x, y);
      if (z !== null) links.push(sdf.sphere(0.0095).at(x, y, z + 0.003));
    }
    const wz = surf(waist, 0.088, 0.352) ?? 0.1;
    const watch = sdf
      .union(sdf.cylinder(0.026, 0.01, 0.004), sdf.torus(0.02, 0.0045).at(0, 0.007, 0))
      .rotateX(90)
      .at(0.088, 0.35, wz + 0.006);
    k.body('chain', sdf.union(...links, watch).bone('chest'), { color: C.gold, roughness: 0.3, metalness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ the quill, right hand (x < 0)
    const gr = h.arms.R.GRIP;
    const GR = [-gr[0], gr[1], gr[2]] as const;
    // Along +Z from the origin: the dark nib at the back, the shaft through the fist, a long flat vane in front.
    const shaft = sdf.capsule([0, 0, -0.045], [0, 0, 0.15], 0.0085);
    const nib = sdf.cone([0, 0, -0.075], [0, 0, -0.035], 0.003, 0.0085).paint(C.nib);
    const vane = sdf
      .smoothUnion(
        0.008,
        sdf.ellipsoid([0.03, 0.008, 0.09]).at(-0.006, 0, 0.065).rotateY(-6),
        sdf.ellipsoid([0.03, 0.008, 0.085]).at(-0.03, 0, 0.055).rotateY(5),
      )
      .paintWhere(sdf.box([0.5, 1, 0.1]).at(0, 0, 0.17), C.quillShade, 0.02);
    const quill = sdf
      .union(sdf.smoothUnion(0.004, shaft, vane), nib)
      .at(0, 0, 0.03)
      .rotateX(-48)
      .at(GR[0], GR[1], GR[2]);
    k.body('quill', quill, { color: C.quill, roughness: 0.7, detail: 0.003, bone: 'knife.R' });

    // ------------------------------------------------------------------ the ledger, left hand (x > 0)
    const G = h.arms.L.GRIP;
    const W = 0.2;
    const H = 0.26;
    const T = 0.05;
    const boardT = 0.009;
    const frontBoard = sdf.box([W, H, boardT], 0.004).at(0, 0, T / 2 - boardT / 2);
    const backBoard = sdf.box([W, H, boardT], 0.004).at(0, 0, -T / 2 + boardT / 2);
    const spine = sdf.box([0.018, H, T], 0.006).at(W / 2 - 0.009, 0, 0);
    const cover = sdf.smoothUnion(0.003, frontBoard, backBoard, spine).paintWhere(sdf.box([0.16, 0.21, 0.2]).at(0.0, 0, 0), C.ledger, 0.003);
    const pages = sdf.box([W - 0.01, H - 0.014, T - 0.012], 0.003).at(-0.002, 0, 0);
    const corner = (sx: number, sy: number) => sdf.box([0.034, 0.034, T + 0.006], 0.004).at(sx * (W / 2 - 0.008), sy * (H / 2 - 0.008), 0);
    const corners = sdf.union(corner(1, 1), corner(1, -1), corner(-1, 1), corner(-1, -1)).intersect(sdf.box([W + 0.004, H + 0.004, T + 0.01]));
    const clasp = sdf.box([0.012, 0.05, 0.004], 0.002).at(-W / 2 + 0.0, 0, T / 2);
    const ledgerAt = (s: sdf.Shape) => s.rotateY(30).rotateZ(8).at(G[0] + 0.01, G[1] + 0.05, G[2] + 0.025);
    k.body('ledger', ledgerAt(cover), { color: C.ledgerDark, roughness: 0.75, detail: 0.004, bone: 'knife.L' });
    k.body('pages', ledgerAt(pages), { color: C.pages, roughness: 0.9, detail: 0.004, bone: 'knife.L' });
    k.body('corners', ledgerAt(sdf.union(corners, clasp)), { color: C.gold, roughness: 0.3, metalness: 0.9, detail: 0.004, bone: 'knife.L' });
  },
});
