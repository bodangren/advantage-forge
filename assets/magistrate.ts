import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Magistrate — Chibi Quest settlement NPC (catalog `npcs/settlement/magistrate`), about 1.0 m to the
 * top of the wig, faces +Z. Target: docs/npc-mockups/magistrate_001.jpg. Built on the humanoid kind.
 *
 * Role: the town judge NPC who settles disputes in quests, seen at the town hall court in 3D and as a
 *   128 px sprite; the big white curled wig, the round spectacles, the black robe, and the gavel and
 *   law book must read.
 * One idea: a fair, serious little judge under a huge white wig of rolled curls, in a black robe over a
 *   red sash, with a wooden gavel in one hand and a thick brown law book in the other.
 * Shape language: round and soft (wig rolls, spectacles, nose), with the book as the one hard form.
 * Palette (60/30/10): black #2a2830 (robe, #3a3840 folds) / white #f0ece4 (wig, #d8d0c4 shadows, collar
 *   #f6f1ea); red #a03a3a (sash and vest; the `cloth` slot) as the accent; gold #c8a040 spectacles;
 *   gavel #8a5a35; book #6b4226 with #e0b040 lettering.
 * Value plan: the white wig over the light face is the focal point; the black robe frames the white
 *   collar tabs and the red sash.
 * Bodies: skin (big nose, thick brows, small smile), wig, spectacles, robe, vest, sash, collar, tabs,
 *   cuffs, gavel, book, pages, lettering.
 * Rig: the humanoid kind's skeleton and clips; the left arm is posed (the book at the chest) and keeps
 *   the pose in every clip. The gavel is rigid on `knife.R`, the book on `knife.L`. The robe skirt is
 *   rigid on the hips and ends at the ankle.
 */

const C = {
  wigShade: '#d8d0c4',
  robe: '#2a2830',
  fold: '#3a3840',
  collar: '#f6f1ea',
  tabShade: '#d8d0c4',
  frame: '#1e1a1c',
  shoe: '#2a2428',
  pants: '#2a2830',
  under: '#3a2428',
  gavel: '#8a5a35',
  gavelDark: '#6e4426',
  book: '#5a3620',
  bookDark: '#4e2e1a',
  pages: '#e8dcc0',
  gold: '#e0b040',
  smile: '#6e2e26',
  brow: '#c4621e',
  nose: '#e8806e', // the mockup's round red nose
};

export default humanoidAsset({
  name: 'magistrate',
  description: 'A fair, serious town magistrate in a tall white curled wig and a black robe over a red sash, holding a wooden gavel and a law book.',
  reference: 'docs/npc-mockups/magistrate_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { white: '#f0ece4', silver: '#b8b4c4', brown: '#5a301d', auburn: '#8e3b1c' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { crimson: '#a03a3a', plum: '#6a3a5a', indigo: '#3c4a78', pine: '#2f5a44' },
  },
  presets: {
    default: { skin: 'fair', hair: 'white', eyes: 'brown', cloth: 'crimson' },
    assize: { skin: 'tan', hair: 'silver', eyes: 'hazel', cloth: 'indigo' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: C.shoe,
  lashes: false,
  // The left hand holds the law book out in front at chest height; the right arm keeps the clip motion.
  pose: { L: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] } },

  // A bigger nose in the skin tint, thicker arched brows, and a calm small smile with round corners.
  paintSkin(skin, h) {
    const noseZ = h.faceZ(0, 0.566) + 0.012;
    const nose = sdf.ellipsoid([0.04, 0.036, 0.042]).at(0, 0.57, noseZ + 0.006).bone('head');
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.016, 236, 304), 0.3).at(0, 0.6, 0.1);
    const brows = sdf.extrude(profile.arc(0.08, 0.034, 62, 114), 0.3).at(0.098, 0.665, 0.1).mirror('x');
    const smile = sdf.extrude(profile.arc(0.058, 0.016, 230, 310), 0.3).at(0, 0.495 + 0.058, 0.1);
    return skin
      .smoothUnion(0.01, nose)
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(nose.round(0.003), C.nose, 0.006)
      .paintWhere(brows, C.brow, 0.003)
      .paintWhere(smile, C.smile, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y } = h.joints;
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
    const cloth = h.tint.shirt!;

    // ------------------------------------------------------------------ the white wavy hair (a wig)
    // Local frame: the head center at the origin. A small cap hugs the skull; the visible hair is made
    // of separate swept locks (chain lobes): a fringe that rises from the forehead, waves across the
    // top, locks over the temples (the ears stay free), and a short roll at the nape.
    const wigPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const cap = sdf.ellipsoid([0.216, 0.208, 0.2]).at(0, 0.012, -0.008);
    const faceMask = sdf.ellipsoid([0.19, 0.17, 0.24]).at(0, -0.03, 0.2).smoothUnion(0.03, sdf.ellipsoid([0.3, 0.16, 0.2]).at(0, -0.18, 0.1));
    const lock = (r0: number, ...pts: [number, number, number][]) =>
      sdf.chain(pts.map((p, i) => [p[0], p[1], p[2], r0 * (1 - 0.12 * i)] as [number, number, number, number]), 0.012);
    const locks: sdf.Shape[] = [];
    // Soft rolled waves that sit close to the head: each lock follows the cap surface along an arc of
    // (azimuth from +Z, elevation) pairs, bulging a little outward.
    const R3 = [0.216, 0.208, 0.2] as const;
    const onCap = (az: number, el: number, out = 1.1): [number, number, number] => {
      const a = (az * Math.PI) / 180;
      const e = (el * Math.PI) / 180;
      return [R3[0] * out * Math.cos(e) * Math.sin(a), 0.012 + R3[1] * out * Math.sin(e), -0.008 + R3[2] * out * Math.cos(e) * Math.cos(a)];
    };
    const wave = (r0: number, ...arc: [number, number][]) =>
      lock(r0, ...arc.map(([az, el]) => onCap(az, el)));
    // The fringe: five rolls from the hairline over the forehead, each leaning toward its side.
    for (const az of [-62, -32, 0, 32, 62]) {
      const lean = Math.sign(az) * 12;
      locks.push(wave(0.046, [az, 40], [az + lean * 0.5, 58], [az + lean, 74]));
    }
    // The crown: four rolls that run back over the top, a ridge of waves.
    for (const az of [-48, -16, 16, 48]) {
      locks.push(wave(0.052, [az, 66], [az * 0.7, 80], [az * 0.3 + 180 * 0, 89]));
    }
    // The sides: two rolls per side over the temple, short, with the ear free.
    for (const sx of [1, -1]) {
      locks.push(wave(0.05, [sx * 78, 52], [sx * 84, 32], [sx * 88, 10]));
      locks.push(wave(0.05, [sx * 112, 50], [sx * 108, 30], [sx * 104, 6]));
    }
    // The back: three short, full rolls that end above the nape (long rolls read as hanging locks).
    for (const az of [140, 180, 220]) {
      locks.push(wave(0.062, [az, 62], [az, 42], [az, 24]));
    }
    const wigShape = wigPose(
      sdf
        .smoothUnion(0.01, cap.smoothSubtract(0.02, faceMask), ...locks)
        .smoothIntersect(0.01, sdf.ellipsoid([0.34, 0.33, 0.3]).at(0, 0.06, -0.02)),
    ).bone('head');
    const wigColor = k.tint('hair');
    k.body('wig', wigShape, {
      color: wigColor,
      roughness: 0.75,
      detail: 0.005,
      bump: (x, y, z) => 0.004 * Math.sin(x * 90 + y * 40) * Math.cos(z * 80 + y * 30),
    });

    // ------------------------------------------------------------------ thick round black spectacles
    const ex = h.joints.EYE[0];
    const ey = h.joints.EYE[1];
    const ez = h.faceZ(ex, ey);
    const rim = (s: number) =>
      sdf
        .torus(0.058, 0.0165)
        .rotateX(90)
        .rotateY(-s * 16)
        .at(s * ex, ey - 0.002, ez + 0.02);
    const bridge = sdf.capsule([-0.04, ey + 0.006, ez + 0.026], [0.04, ey + 0.006, ez + 0.026], 0.012);
    // The temple arms run just above the skin along the side of the head to the ear.
    const sideX = (y: number, z: number) => sdf.raycast(h.head, [1, y, z], [-1, 0, 0])?.[0] ?? 0.2;
    const armPts: [number, number, number][] = [ez - 0.02, ez - 0.06, ez - 0.1, ez - 0.14].map((z, i) => [sideX(ey + 0.01, z) + 0.01, ey + 0.012 - i * 0.002, z]);
    const armStart: [number, number, number] = [ex + 0.056, ey + 0.004, ez - 0.002];
    const arm = (s: number) => {
      const pts = [armStart, ...armPts];
      const segs = pts.slice(1).map((q, i) => sdf.capsule([s * pts[i]![0], pts[i]![1], pts[i]![2]], [s * q[0], q[1], q[2]], 0.0095));
      return sdf.union(...segs);
    };
    const glasses = sdf.smoothUnion(0.006, rim(1), rim(-1), bridge).union(arm(1), arm(-1)).bone('head');
    k.body('spectacles', glasses, { color: C.frame, roughness: 0.35, metalness: 0.1, detail: 0.003 });

    // ------------------------------------------------------------------ black robe: torso, long skirt, wide sleeves
    const bell = (r0: number, r1: number, r2: number, r3: number, yEnd: number) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.3],
              [r0, 0.3],
              [r1, 0.24],
              [r2, 0.15],
              [r3, yEnd],
              [0, yEnd],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.88]);
    const skirt = bell(0.138, 0.155, 0.186, 0.212, 0.078).bone('hips');
    const robeOuter = sdf.smoothUnion(0.02, h.torso.round(0.014), bell(0.138, 0.155, 0.186, 0.212, 0.078));
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.052, 0.056).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.88), 0.056, 0.066).bone('forearm.L'),
      ),
    );
    // The front opening: narrow at the collar, wider at the hem, so the vest shows.
    const opening = sdf
      .extrude(
        profile.polygon([
          [-0.045, 0.47],
          [0.045, 0.47],
          [0.085, 0.07],
          [-0.085, 0.07],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const robeBody = sdf
      .smoothUnion(0.02, h.weighted(h.torso.round(0.014)), skirt)
      .smoothUnion(0.012, sleeves)
      .smoothSubtract(0.008, opening)
      .paintFn((x, y, z, base) => {
        const a = Math.atan2(x, z);
        const f = Math.max(0, Math.sin(a * 7 + Math.sin(y * 9) * 0.6) - 0.3) * Math.min(1, Math.max(0, (0.3 - y) / 0.1)) * 0.9;
        const fold = [0x3a / 255, 0x38 / 255, 0x40 / 255] as const;
        return [base[0] + (fold[0] - base[0]) * f, base[1] + (fold[1] - base[1]) * f, base[2] + (fold[2] - base[2]) * f] as const;
      });
    k.body('robe', robeBody, {
      color: C.robe,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * Math.sin(Math.atan2(x, z) * 9 + y * 6) * Math.min(1, Math.max(0, (0.28 - y) * 8)),
    });

    // The red waistcoat under the open robe (the torso down to the hip) and a dark under-skirt that fills
    // the opening below it.
    const vest = h.weighted(h.torso.round(0.006));
    k.body('vest', vest, { color: cloth, roughness: 0.85, detail: 0.005 });
    const under = bell(0.126, 0.136, 0.15, 0.158, 0.1).intersect(sdf.halfSpace([0, 1, 0], 0.2)).bone('hips');
    k.body('underskirt', under, { color: C.under, roughness: 0.9, detail: 0.005 });

    // ------------------------------------------------------------------ red collar, ruffled white cravat, cuffs
    // A large hood collar round the neck, open at the front so the cravat shows; it ends below the chin.
    const redCollar = sdf
      .torus(0.093, 0.04)
      .scale([1, 0.85, 0.95])
      .at(0, 0.442, -0.016)
      .smoothSubtract(0.01, sdf.box([0.09, 0.2, 0.2]).at(0, 0.43, 0.14))
      .bone('chest');
    // Each cuff is a flat-ended ring cut from a cone with two planes square to the forearm axis, so the
    // skin fist shows beyond it.
    const cuffs = h.perArm((j) => {
      const d = [j.WRIST[0] - j.ELBOW[0], j.WRIST[1] - j.ELBOW[1], j.WRIST[2] - j.ELBOW[2]];
      const len = Math.hypot(d[0]!, d[1]!, d[2]!);
      const n: [number, number, number] = [d[0]! / len, d[1]! / len, d[2]! / len];
      const at = (t: number) => lerp(j.ELBOW, j.WRIST, t);
      const dot = (p: readonly number[]) => n[0] * p[0]! + n[1] * p[1]! + n[2] * p[2]!;
      return sdf
        .cone(at(0.6), at(1.1), 0.07, 0.07)
        .intersect(sdf.halfSpace(n, dot(at(0.9))))
        .intersect(sdf.halfSpace([-n[0], -n[1], -n[2]], -dot(at(0.8))))
        .round(0.002)
        .bone('forearm.L');
    });
    k.body('collar', redCollar, { color: cloth, roughness: 0.85, detail: 0.004 });
    k.body('cuffs', cuffs, { color: C.collar, roughness: 0.9, detail: 0.004 });

    // The cravat: rows of ruffles that fall from the neck, wide at the top and narrow at the bottom.
    const chestZ = surf(h.torso.round(0.014), 0, 0.41) ?? 0.09;
    const ruffles: sdf.Shape[] = [];
    [
      { y: 0.435, n: 3, w: 0.034, rx: 0.03 },
      { y: 0.408, n: 3, w: 0.03, rx: 0.028 },
      { y: 0.382, n: 2, w: 0.026, rx: 0.026 },
      { y: 0.358, n: 2, w: 0.02, rx: 0.022 },
    ].forEach((row, ri) => {
      for (let i = 0; i < row.n; i++) {
        const x = (i - (row.n - 1) / 2) * row.w * (row.n === 3 ? 1.0 : 1.0);
        ruffles.push(sdf.ellipsoid([row.rx, 0.02, 0.02]).rotateZ((i % 2 ? -1 : 1) * 8).at(x, row.y + (i % 2) * 0.004, chestZ + 0.01 + (ri % 2) * 0.004));
      }
    });
    const cravat = sdf.smoothUnion(0.008, ...ruffles).bone('chest');
    k.body('cravat', cravat, { color: C.collar, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ the gavel, right hand (x < 0)
    const gr = h.arms.R.GRIP;
    const GR = [-gr[0], gr[1], gr[2]] as const;
    // Along +Z from the origin: the handle through the fist (0.22 m), the head at the front end
    // (0.09 m long, 0.05 m across, its axis along X).
    const handle = sdf.capsule([0, 0, -0.08], [0, 0, 0.14], 0.0125);
    const head = sdf
      .cylinder(0.03, 0.1, 0.012)
      .rotateZ(90)
      .at(0, 0, 0.13)
      .smoothUnion(0.006, sdf.cylinder(0.03, 0.012, 0.004).rotateZ(90).at(0.04, 0, 0.13), sdf.cylinder(0.03, 0.012, 0.004).rotateZ(90).at(-0.04, 0, 0.13));
    const gavel = sdf
      .smoothUnion(0.008, handle, head)
      .paintWhere(sdf.box([0.5, 0.2, 0.012]).at(0, 0, 0.13).subtract(sdf.box([0.082, 0.2, 0.02]).at(0, 0, 0.13)), C.gavelDark, 0.002)
      .rotateX(-55)
      .at(GR[0], GR[1], GR[2]);
    k.body('gavel', gavel, { color: C.gavel, roughness: 0.65, detail: 0.003, bone: 'knife.R' });

    // ------------------------------------------------------------------ the law book, left hand (x > 0)
    const G = h.arms.L.GRIP;
    const W = 0.16;
    const H = 0.22;
    const T = 0.06;
    const boardT = 0.01;
    const frontBoard = sdf.box([W, H, boardT], 0.004).at(0, 0, T / 2 - boardT / 2);
    const backBoard = sdf.box([W, H, boardT], 0.004).at(0, 0, -T / 2 + boardT / 2);
    const spine = sdf.box([0.018, H, T], 0.007).at(-W / 2 + 0.009, 0, 0);
    const cover = sdf
      .smoothUnion(0.003, frontBoard, backBoard, spine);
    const pages = sdf.box([W - 0.016, H - 0.014, T - 0.014], 0.003).at(0.003, 0, 0);
    const bookAt = (s: sdf.Shape) => s.rotateY(-32).rotateZ(-12).at(G[0] + 0.02, G[1] + 0.02, G[2] + 0.04);
    k.body('book', bookAt(cover), { color: C.book, roughness: 0.75, detail: 0.004, bone: 'knife.L' });
    k.body('pages', bookAt(pages), { color: C.pages, roughness: 0.9, detail: 0.004, bone: 'knife.L' });
  },
});
