import { noise, profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Lady - Chibi Quest court NPC (catalog `npcs/court-and-faction/lady`), about 1.0 m to the top of
 * the hair bun, faces +Z. Target: docs/npc-mockups/lady_001.jpg. Built on the humanoid kind.
 *
 * Role: the court gossip who gives social quests, seen at the palace ball and garden in 3D and as a
 *   128 px sprite; the high auburn bun with pearls, the wide sage gown, and the fan read.
 * One idea: an elegant lady in a wide sage overskirt that opens on a cream underskirt, one hand
 *   holding a half-open painted fan up beside her cheek.
 * Shape language: round and soft (bun, puffed sleeves, bell skirt), the fan wedge as the accent.
 * Palette (60/30/10): gown sage #6a8a6a and underskirt cream #ece0c8; hair #8e3b1c; pearls and
 *   lace #f6f1ea; fan #f0e6cc with pink #c86a8a flowers; shoes #4a6a4a.
 * Value plan: the dark auburn hair frames the face; the cream panel lights the dark gown.
 * Bodies: ears, earrings, hair, bun, pearls, gown, underskirt, collar, bow, cuffs, fan, sticks, purse.
 * Rig: the humanoid kind's skeleton and clips; the right fist holds the fan up (posed arm) and the
 *   left fist carries the purse (rigid on knife.L).
 */

const C = {
  pearl: '#f6f1ea',
  under: '#ece0c8',
  lace: '#f6f1ea',
  shoe: '#4a6a4a',
  fan: '#f0e6cc',
  fanPink: '#c86a8a',
  fanLeaf: '#5a7a4a',
  stick: '#8a6a3a',
  purse: '#7a9e82',
};

// The right fist is raised beside the cheek; the left arm hangs and keeps the clip motion.
const POSE_R = { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] } as const;

export default humanoidAsset({
  name: 'lady',
  description: 'A friendly court lady in a sage gown with a lace collar and a high bun, holding up a painted fan.',
  reference: 'docs/npc-mockups/lady_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { auburn: '#8e3b1c', brown: '#5a301d', black: '#231a17', blond: '#c4974a', silver: '#b8b4c4' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { sage: '#6a8a6a', rose: '#b8707e', lavender: '#8a7aa8', teal: '#3f7f80' },
  },
  presets: {
    ball: { skin: 'fair', hair: 'auburn', eyes: 'brown', cloth: 'sage' },
    garden: { skin: 'light', hair: 'blond', eyes: 'green', cloth: 'rose' },
  },
  hair: false,
  undershirt: false,
  pants: C.under,
  shoes: C.shoe,
  pose: { R: POSE_R },

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
    const gownColor = h.tint.shirt ?? '#6a8a6a';
    const rad = Math.PI / 180;
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);

    // ------------------------------------------------------------------ ears and pearl earrings
    const ear = sdf
      .ellipsoid([0.034, 0.05, 0.036])
      .subtract(sdf.sphere(0.02).at(0.016, 0, 0.008))
      .rotateY(-12)
      .at(0.212, 0.615, -0.012)
      .bone('head');
    k.body('ears', pair(ear), { color: skinColor, roughness: 0.55, detail: 0.004 });
    const earring = sdf.smoothUnion(
      0.004,
      sdf.sphere(0.013).at(0.216, 0.562, -0.01),
      sdf.capsule([0.216, 0.56, -0.01], [0.216, 0.54, -0.01], 0.0045),
      sdf.sphere(0.0105).at(0.216, 0.528, -0.01),
    );
    k.body('earrings', pair(earring.bone('head')), { color: C.pearl, roughness: 0.25, metalness: 0.1, detail: 0.003 });

    // ------------------------------------------------------------------ hair: a cap, a fringe, temple curls, and a bun
    const onFace = (x: number, y: number, dz: number, r: number): P4 => [x, y, h.faceZ(x, y) + dz, r];
    const lock = (pts: P4[], kk = 0.012) => sdf.chain(pts, kk);
    const hairCap = sdf
      .ellipsoid([0.217, 0.212, 0.2])
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0.14))
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.07))
      .smoothSubtract(0.025, sdf.ellipsoid([0.165, 0.19, 0.13]).at(0, -0.075, 0.115))
      .smoothSubtract(0.02, sdf.ellipsoid([0.07, 0.075, 0.07]).at(0.215, -0.05, 0.0).mirror('x', 0));
    const fringeA = lock([
      onFace(0.03, 0.835, 0.024, 0.036),
      onFace(-0.04, 0.83, 0.026, 0.038),
      onFace(-0.11, 0.805, 0.026, 0.036),
      onFace(-0.165, 0.755, 0.02, 0.034),
      onFace(-0.19, 0.7, 0.008, 0.03),
    ], 0.014);
    const fringeB = lock([
      onFace(0.0, 0.84, 0.026, 0.036),
      onFace(0.07, 0.825, 0.026, 0.036),
      onFace(0.13, 0.795, 0.024, 0.034),
      onFace(0.172, 0.745, 0.016, 0.032),
      onFace(0.19, 0.7, 0.008, 0.03),
    ], 0.014);
    const fringeC = lock([
      onFace(-0.03, 0.8, 0.034, 0.024),
      onFace(-0.1, 0.78, 0.032, 0.026),
      onFace(-0.15, 0.735, 0.022, 0.024),
    ]);
    const fringeD = lock([
      onFace(0.05, 0.8, 0.034, 0.024),
      onFace(0.11, 0.775, 0.03, 0.024),
      onFace(0.155, 0.725, 0.02, 0.022),
    ]);
    // Soft curls in front of each ear.
    const templeCurl = (s: number) =>
      lock([
        [s * 0.205, 0.7, 0.03, 0.026],
        [s * 0.212, 0.65, 0.03, 0.026],
        [s * 0.218, 0.6, 0.032, 0.024],
        [s * 0.215, 0.565, 0.04, 0.02],
      ]);
    // Back locks rise from the nape into the bun.
    const backAngles = [100, 120, 140, 160, 180, 200, 220, 240, 260];
    const backLocks = backAngles.map((deg, i) => {
      const x = 0.2 * Math.sin(deg * rad);
      const z = 0.19 * Math.cos(deg * rad);
      return lock(
        [
          [x * 0.97, 0.66, z * 0.97, 0.03],
          [x * 0.96 + 0.004 * (i % 2 ? 1 : -1), 0.74, z * 0.96, 0.032],
          [x * 0.75, 0.82, z * 0.8 - 0.01, 0.036],
          [x * 0.35, 0.87, z * 0.45 - 0.03, 0.04],
        ],
        0.014,
      );
    });
    const hairShape = sdf.smoothUnion(
      0.02,
      headPose(hairCap),
      fringeA,
      fringeB,
      fringeC,
      fringeD,
      templeCurl(1),
      templeCurl(-1),
      ...backLocks,
    );
    k.body('hair', hairShape.bone('head'), {
      color: hairColor,
      roughness: 0.55,
      detail: 0.005,
      bump: (x, y, z) => 0.0025 * noise.fbm(x * 45, y * 22, z * 45, 2),
    });

    // The bun: a round mass with wrapped ridges.
    const BUN: [number, number, number] = [0, 0.915, -0.05];
    const ridge = (a0: number, y0: number, tilt: number): sdf.Shape => {
      const pts: P4[] = Array.from({ length: 6 }, (_, i): P4 => {
        const t = i / 5;
        const a = (a0 + t * 150) * rad;
        const r = 0.084;
        return [BUN[0] + r * Math.sin(a), BUN[1] + y0 + tilt * (t - 0.5), BUN[2] + r * Math.cos(a), 0.027];
      });
      return sdf.chain(pts, 0.01);
    };
    const bunCore = sdf.ellipsoid([0.1, 0.086, 0.092]).at(...BUN);
    const bun = sdf.smoothUnion(
      0.012,
      bunCore,
      ridge(-20, 0.015, 0.05),
      ridge(70, -0.01, -0.04),
      ridge(160, 0.012, 0.05),
      ridge(250, -0.012, -0.04),
      ridge(20, 0.04, -0.03),
      sdf.sphere(0.034).at(BUN[0], BUN[1] + 0.05, BUN[2] + 0.005),
    );
    k.body('bun', bun.bone('head'), {
      color: hairColor,
      roughness: 0.5,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 55, y * 30, z * 55, 2),
    });

    // The pearl band: a ring of pearls over the crown, from temple to temple.
    const alpha = 22 * rad;
    const pearlPts = Array.from({ length: 13 }, (_, i) => {
      const th = (-72 + (i * 144) / 12) * rad;
      const d: [number, number, number] = [Math.sin(th), Math.cos(th) * Math.cos(alpha), Math.cos(th) * Math.sin(alpha)];
      const R = [0.234, 0.232, 0.224] as const;
      const n = 1 / Math.hypot(d[0] / R[0], d[1] / R[1], d[2] / R[2]);
      const big = i === 6 ? 1.15 : 1;
      return sdf.sphere(0.0165 * big).at(d[0] * n, HEAD_Y + 0.0 + d[1] * n, d[2] * n);
    });
    k.body('pearls', sdf.union(...pearlPts).bone('head'), { color: C.pearl, roughness: 0.25, metalness: 0.1, detail: 0.003 });

    // ------------------------------------------------------------------ gown: bodice, puffed sleeves, bow
    const scoop = sdf.ellipsoid([0.08, 0.06, 0.1]).at(0, 0.472, 0.14);
    const bodice = h.torso
      .round(0.016)
      .smoothIntersect(0.01, h.band(0.24, 0.452))
      .smoothSubtract(0.012, scoop);
    const sleeveOf = (j: { ELBOW: readonly [number, number, number]; WRIST: readonly [number, number, number] }) => {
      const puff = sdf.ellipsoid([0.068, 0.062, 0.066]).at(...lerp(SHOULDER, j.ELBOW, 0.3)).bone('upperarm.L');
      const upper = sdf.cone(lerp(SHOULDER, j.ELBOW, 0.0), lerp(SHOULDER, j.ELBOW, 0.78), 0.056, 0.05).bone('upperarm.L');
      return sdf.smoothUnion(0.02, puff, upper);
    };
    const cuffOf = (j: { ELBOW: readonly [number, number, number]; WRIST: readonly [number, number, number] }) =>
      sdf.cone(lerp(SHOULDER, j.ELBOW, 0.74), lerp(SHOULDER, j.ELBOW, 0.9), 0.052, 0.048).round(0.002).bone('upperarm.L');
    const frontZ = sdf.raycast(h.torso, [0, 0.4, 1], [0, 0, -1])?.[2] ?? 0.09;
    const bow = sdf.smoothUnion(
      0.006,
      sdf.ellipsoid([0.034, 0.02, 0.014]).rotateZ(14).at(0.035, 0.42, frontZ + 0.012),
      sdf.ellipsoid([0.034, 0.02, 0.014]).rotateZ(-14).at(-0.035, 0.42, frontZ + 0.012),
      sdf.sphere(0.017).at(0, 0.42, frontZ + 0.016),
      sdf.ellipsoid([0.012, 0.03, 0.01]).rotateZ(8).at(0.012, 0.37, frontZ + 0.01),
      sdf.ellipsoid([0.012, 0.03, 0.01]).rotateZ(-8).at(-0.012, 0.37, frontZ + 0.01),
    );
    const top = sdf.union(h.weighted(bodice), h.perArm((j) => sleeveOf(j)), h.weighted(bow));
    k.body('gown', top, { color: gownColor, roughness: 0.8, detail: 0.005 });
    k.body('cuffs', h.perArm((j) => cuffOf(j)), { color: C.lace, roughness: 0.85, detail: 0.004 });

    // The overskirt: a round bell shell (one smooth revolve with a rolled hem and a full back) with
    // the front open on the cream underskirt. The lower hem rides the cloak bone for a small sway.
    const bellBase = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.31],
            [0.12, 0.31],
            [0.14, 0.27],
            [0.17, 0.21],
            [0.21, 0.15],
            [0.245, 0.098],
            [0.262, 0.068],
            [0.252, 0.042],
            [0.2, 0.03],
            [0, 0.03],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1.12, 1, 1.08]);
    const bell = bellBase.smoothUnion(0.05, sdf.ellipsoid([0.15, 0.11, 0.11]).at(0, 0.16, -0.13));
    const frontCut = sdf.extrude(profile.polygon([[-0.045, 0.34], [0.045, 0.34], [0.3, 0.0], [-0.3, 0.0]]), 0.6).at(0, 0, 0.3);
    const overskirt = bell
      .subtract(bell.round(-0.022))
      .smoothIntersect(0.01, sdf.halfSpace([0, 1, 0], 0.325))
      .smoothSubtract(0.014, frontCut);
    const overBump = (x: number, y: number, z: number) => 0.003 * Math.sin(Math.atan2(x, z) * 12) * (y < 0.3 ? 1 : 0.2);
    const HEM_Y = 0.15;
    k.body(
      'overskirt',
      sdf.union(
        h.weighted(overskirt).intersect(h.band(HEM_Y - 0.01, 0.34)),
        overskirt.intersect(h.band(0.03, HEM_Y)).bone('cloak'),
      ),
      { color: gownColor, roughness: 0.8, detail: 0.005, bump: overBump },
    );
    const underCore = bell.round(-0.012);
    const lacePanel = sdf.extrude(profile.polygon([[-0.06, 0.29], [0.06, 0.29], [0.012, 0.14], [-0.012, 0.14]]), 0.6).at(0, 0, 0.3);
    const underskirt = underCore.smoothIntersect(0.01, h.band(0.04, 0.3)).paintWhere(lacePanel, C.lace, 0.004);
    const underHem = underCore.smoothIntersect(0.01, h.band(0.04, HEM_Y)).bone('cloak');
    k.body(
      'underskirt',
      sdf.union(h.weighted(underskirt).intersect(h.band(HEM_Y - 0.01, 0.3)), underHem.paintWhere(lacePanel, C.lace, 0.004)),
      {
        color: C.under,
        roughness: 0.85,
        detail: 0.005,
        bump: (x, y, z) => 0.0025 * Math.sin(x * 140) * (z > 0 ? 1 : 0.3),
      },
    );
    // Lace beads on the underskirt front: scalloped rows that narrow to a point.
    const beadRows: [number, number][] = [[0.285, 4], [0.255, 3], [0.225, 3], [0.195, 2], [0.165, 1], [0.14, 0]];
    const beadPts: sdf.Shape[] = [];
    for (const [y, n] of beadRows) {
      for (let i = -n; i <= n; i += 1) {
        const x = i * 0.0125 * (n > 0 ? 1 : 1);
        const hit = sdf.raycast(underskirt, [x, y, 1], [0, 0, -1]);
        if (!hit) continue;
        beadPts.push(sdf.sphere(0.0068).at(x, y, hit[2] + 0.001));
      }
    }
    k.body('laceBeads', sdf.union(...beadPts), { color: C.pearl, roughness: 0.3, detail: 0.003, bone: 'hips' });

    // The lace collar: a cream ring over the shoulders, and a pearl necklace.
    const collar = h.torso
      .round(0.026)
      .smoothIntersect(0.012, h.band(0.43, 0.482))
      .smoothSubtract(0.014, sdf.ellipsoid([0.075, 0.07, 0.12]).at(0, 0.452, 0.16));
    k.body('collar', h.weighted(collar), {
      color: C.lace,
      roughness: 0.9,
      detail: 0.004,
      bump: (x, y, z) => 0.0025 * Math.sin(Math.atan2(x, z) * 40),
    });
    // Pearls rest on whatever surface is below each ring point: the collar top or the bare neck.
    const necklaceBase = sdf.union(collar, h.torso);
    const neckBeads: sdf.Shape[] = [];
    for (let i = 0; i < 19; i += 1) {
      const a = (-85 + (i * 170) / 18) * rad;
      const x = 0.078 * Math.sin(a);
      const z = 0.07 * Math.cos(a) + 0.004;
      const hit = sdf.raycast(necklaceBase, [x, 0.62, z], [0, -1, 0]);
      if (!hit) continue;
      neckBeads.push(sdf.sphere(0.0095).at(x, hit[1] + 0.003, z));
    }
    const brooch = sdf.sphere(0.012).at(0, 0.385, frontZ + 0.016);
    k.body('necklace', sdf.union(...neckBeads, brooch), { color: C.pearl, roughness: 0.25, metalness: 0.1, detail: 0.003, bone: 'chest' });

    // ------------------------------------------------------------------ fan, half open, in the right fist
    const GR = h.arms.R.GRIP;
    const PIV: [number, number, number] = [-GR[0] + 0.0, GR[1] + 0.03, GR[2]];
    const R0 = 0.19;
    const FS = R0 / 0.112;
    const a0 = -6;
    const a1 = 90;
    const dir = (phi: number, r: number): [number, number] => [PIV[0] - r * Math.sin(phi * rad), PIV[1] + r * Math.cos(phi * rad)];
    const arcPts: [number, number][] = Array.from({ length: 15 }, (_, i) => {
      const phi = a0 + ((a1 - a0) * i) / 14;
      const r = R0 + (i % 2 === 0 ? 0.0 : -0.004);
      const p = dir(phi, r);
      return [p[0] - PIV[0], p[1] - PIV[1]];
    });
    const blade2d = profile.polygon([[0, 0], ...arcPts], { smooth: false });
    const blade = sdf
      .extrude(blade2d, 0.012, 0.002)
      .subtract(sdf.cylinder(0.03, 0.1).rotateX(90))
      .at(PIV[0], PIV[1], PIV[2]);
    const flowerDefs: [number, number, number][] = [
      [0.06, 5, 0.011],
      [0.082, 22, 0.01],
      [0.056, 38, 0.011],
      [0.083, 52, 0.01],
      [0.058, 68, 0.011],
      [0.082, 80, 0.009],
      [0.078, 2, 0.008],
    ];
    const fanPainted = blade.paintFn((x, y, z, base) => {
      const dx = PIV[0] - x;
      const dy = y - PIV[1];
      const phi = Math.atan2(dx, dy) / rad;
      const r = Math.hypot(dx, dy);
      for (const [fr, fp, fs] of flowerDefs) {
        const p = dir(fp, fr * FS);
        if (Math.hypot(x - p[0], y - p[1]) < fs * FS) return rgb(C.fanPink);
        const q = dir(fp + 7, (fr - 0.012) * FS);
        if (Math.hypot(x - q[0], y - q[1]) < fs * FS * 0.55) return rgb(C.fanLeaf);
      }
      const rib = ((phi - a0) % 10) + 10;
      if (r > 0.04 && Math.abs((rib % 10) - 5) > 4.3) return rgb('#d9c9a0');
      return base;
    });
    k.body('fan', fanPainted, {
      color: C.fan,
      roughness: 0.8,
      detail: 0.0035,
      bump: (x, y) => 0.0015 * Math.sin((Math.atan2(PIV[0] - x, y - PIV[1]) / rad) * 0.628 * 2 * (Math.PI / 1) * 0.5),
      bone: 'knife.R',
    });
    const stick = (phi: number, len: number, r0: number, r1: number) =>
      sdf.cone([...dir(phi, 0), PIV[2]], [...dir(phi, len), PIV[2]], r0, r1);
    const ribs = [a0 + 3, 12, 28, 45, 62, 78, a1 - 3].map((phi, i) => stick(phi, i === 0 || i === 6 ? R0 + 0.004 : 0.05, i === 0 || i === 6 ? 0.008 : 0.005, i === 0 || i === 6 ? 0.006 : 0.004));
    const handle = sdf.cone(
      [PIV[0], PIV[1], PIV[2]],
      [PIV[0] + 0.012, PIV[1] - 0.075, PIV[2]],
      0.011,
      0.014,
    );
    const pin = sdf.sphere(0.013).at(...PIV);
    k.body('fanSticks', sdf.smoothUnion(0.004, handle, pin, ...ribs), { color: C.stick, roughness: 0.6, detail: 0.0035, bone: 'knife.R' });

    // ------------------------------------------------------------------ beaded purse, hanging from the left fist
    const GL = h.arms.L.GRIP;
    const pAt = (s: sdf.Shape) => s.scale(1.1).at(GL[0] + 0.03, GL[1] + 0.02, GL[2] + 0.02);
    const pBody = sdf.box([0.07, 0.056, 0.032], 0.012).at(0, -0.075, 0.0);
    const flap = sdf.box([0.072, 0.03, 0.036], 0.012).at(0, -0.056, 0.0);
    const cord = sdf.smoothUnion(
      0.004,
      sdf.capsule([-0.018, -0.052, 0], [-0.004, -0.015, 0], 0.0055),
      sdf.capsule([0.018, -0.052, 0], [0.004, -0.015, 0], 0.0055),
    );
    const clasp = sdf.sphere(0.01).at(0, -0.06, 0.02);
    const purse = pAt(sdf.smoothUnion(0.006, pBody, flap)).paintFn((x, y, z, base) => {
      const u = x - GL[0];
      const v = y - GL[1];
      if (Math.abs(u) < 0.04 && v < -0.045 && v > -0.108) {
        const cu = Math.round(u / 0.0125) * 0.0125;
        const cv = Math.round((v + 0.075) / 0.0125) * 0.0125 - 0.075;
        if (Math.hypot(u - cu, v - cv) < 0.0042 && Math.abs(u) < 0.032) return rgb(C.pearl);
      }
      return base;
    });
    k.body('purse', sdf.smoothUnion(0.004, purse, pAt(cord)), { color: C.purse, roughness: 0.6, detail: 0.003, bone: 'knife.L' });
    k.body('clasp', pAt(clasp), { color: C.pearl, roughness: 0.3, detail: 0.003, bone: 'knife.L' });
  },
});
