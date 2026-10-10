import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Soldier — Chibi Quest court NPC (catalog `npcs/court-and-faction/soldier`), about 1.0 m to the top
 * of the helmet, faces +Z. Target: docs/npc-mockups/soldier_001.jpg. Built on the humanoid kind.
 *
 * Role: a castle NPC (the wall and the barracks), seen in 3D and as a 128 px sprite; the pointed steel
 *   helmet, the blue tabard with the white tower, the upright spear, and the round shield must read.
 * One idea: a cheerful young soldier whose tall spear and big round shield make a wide, upright
 *   silhouette under a steel cap.
 * Shape language: round (helmet, shield, boots, fists) with one straight, hard form (the spear).
 * Palette (60/30/10): tabard blue #2f4a8a; steel #a8acb4 (helmet, rim, spear tip); mail #8a8c94;
 *   cream #f0ece4 (tower, shield boss, hem); leather #5a3a24 (belt, boots); trousers #6b4a2c; hair #7a4a2c.
 * Value plan: the light face under the silver helmet is the focal point; the blue tabard is the large
 *   mass; brown leather frames it; the cream tower and boss are the accent.
 * Bodies: skin, helmet, hair, braid, mail, tabard, belt, buckle, bracers, boots, spear, spear-head,
 *   shield, shield-rim, shield-boss.
 * Rig: the humanoid kind's skeleton and clips. Both arms keep a held pose; the spear is rigid on
 *   `knife.R` and the shield on `knife.L`.
 */

const C = {
  steel: '#a8acb4',
  mail: '#8a8c94',
  cream: '#f0ece4',
  leather: '#5a3a24',
  pants: '#6b4a2c',
  spear: '#8a6a3a',
  tip: '#c8ccd4',
  braidTie: '#c89a40',
  mouth: '#8a2e2a',
};

type V3 = [number, number, number];

export default humanoidAsset({
  name: 'soldier',
  description: 'A cheerful young soldier in a steel helmet and a blue tabard over chain mail, holding a spear and a round shield.',
  reference: 'docs/npc-mockups/soldier_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { chestnut: '#7a4a2c', brown: '#5a301d', black: '#231a17', blond: '#c4974a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { navy: '#2f4a8a', burgundy: '#8a3040', moss: '#4f6a3a', ochre: '#b07a2c' },
  },
  presets: {
    veteran: { skin: 'tan', hair: 'black', eyes: 'hazel', cloth: 'burgundy' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: false,
  // Left (x > 0): the shield held out in front at chest height. Right (x < 0): the fist out at the
  // side at chest height, so the upright spear clears the helmet.
  pose: {
    L: { elbow: [0.17, 0.335, 0.05] as const, wrist: [0.2, 0.33, 0.15] as const },
    R: { elbow: [0.245, 0.335, 0.03] as const, wrist: [0.3, 0.35, 0.115] as const },
  },

  // A small, closed, friendly smile.
  paintSkin(skin) {
    const mouth = sdf.extrude(profile.arc(0.05, 0.009, 238, 302), 0.3).at(0, 0.5 + 0.052, 0.1);
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
    const clothColor = h.tint.shirt ?? '#2f4a8a';
    const atHead = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);

    // ------------------------------------------------------------------ the helmet: a steel cap with a pointed crown
    const crown = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.08],
            [0.224, 0.08],
            [0.226, 0.1],
            [0.214, 0.14],
            [0.19, 0.185],
            [0.145, 0.232],
            [0.085, 0.275],
            [0.03, 0.302],
            [0, 0.306],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.94]);
    const rim = sdf.torus(0.222, 0.0125).scale([1, 1, 0.94]).at(0, 0.088, 0);
    const helmet = atHead(sdf.smoothUnion(0.012, crown, rim)).bone('head');
    k.body('helmet', helmet, { color: C.steel, roughness: 0.4, metalness: 0.8, detail: 0.0045, bump: (x, y, z) => 0.0015 * Math.sin(x * 120 + z * 90) * Math.cos(y * 110) });

    // ------------------------------------------------------------------ hair: fringe and temple locks, a nape cap, a braid
    const onHead = (azDeg: number, y: number, out: number): V3 => {
      const a = (azDeg * Math.PI) / 180;
      const e = Math.sqrt(Math.max(0, 1 - (y / 0.2) ** 2));
      return [(0.205 * e + out) * Math.sin(a), y, (0.19 * e + out) * Math.cos(a)];
    };
    const lockPath = (s: 1 | -1, pts: Array<[number, number, number]>) =>
      sdf.chain(
        pts.map(([az, y, r]): [number, number, number, number] => {
          const p = onHead(s * az, y, r * 0.55);
          return [p[0], p[1], p[2], r];
        }),
        0.008,
      );
    const fringeSpecs: Array<Array<[number, number, number]>> = [
      [[6, 0.098, 0.02], [24, 0.088, 0.02], [46, 0.066, 0.018]],
      [[10, 0.1, 0.021], [34, 0.084, 0.02], [58, 0.05, 0.018]],
      [[14, 0.102, 0.02], [44, 0.082, 0.02], [70, 0.03, 0.019]],
      [[22, 0.102, 0.019], [56, 0.078, 0.019], [78, 0.0, 0.019], [82, -0.05, 0.016]],
      [[34, 0.104, 0.018], [66, 0.08, 0.018], [84, 0.02, 0.018], [88, -0.06, 0.015]],
      [[48, 0.1, 0.02], [74, 0.07, 0.02], [86, 0.0, 0.019], [92, -0.075, 0.014]],
    ];
    const fringe = sdf.union(...fringeSpecs.flatMap((pts) => [lockPath(1, pts), lockPath(-1, pts)]));
    const hairShell = sdf.ellipsoid([0.211, 0.205, 0.196]);
    const nape = hairShell
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.075))
      .smoothIntersect(0.02, sdf.halfSpace([0, 1, 0], 0.08))
      .smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const tips = sdf.union(
      ...[-80, -58, -36, -14, 14, 36, 58, 80].map((a) => sdf.sphere(0.024).at(0.185 * Math.sin((a * Math.PI) / 180), -0.082, -0.172 * Math.cos((a * Math.PI) / 180))),
    );
    const hair = atHead(sdf.smoothUnion(0.014, fringe, nape, tips)).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.004 });

    // The braid: a chain of lobes down the back, with a gold tie at the end.
    const braidPts: Array<[number, number, number, number]> = [
      [0.02, 0.62, -0.17, 0.03],
      [0.03, 0.57, -0.178, 0.03],
      [0.036, 0.52, -0.172, 0.028],
      [0.04, 0.47, -0.162, 0.026],
      [0.043, 0.425, -0.154, 0.024],
      [0.044, 0.385, -0.148, 0.02],
    ];
    const lobes = braidPts.slice(0, 5).map(([x, y, z, r], i) => sdf.ellipsoid([r * 1.05, r * 0.95, r]).at(x + (i % 2 === 0 ? 0.006 : -0.006), y - 0.012, z));
    const braid = sdf.smoothUnion(0.012, sdf.chain(braidPts, 0.012), ...lobes).bone('chest');
    k.body('braid', braid, { color: hairColor, roughness: 0.6, detail: 0.004 });
    k.body('braid-tie', sdf.torus(0.019, 0.007).rotateX(80).at(0.044, 0.372, -0.148).bone('chest'), { color: C.braidTie, roughness: 0.5, detail: 0.003 });

    // ------------------------------------------------------------------ chain mail: shirt, sleeves, neck ring
    const mailBump = (x: number, y: number, z: number) => 0.0022 * Math.sin((x + z) * 230) * Math.sin(y * 240 + x * 60);
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.12), j.ELBOW, 0.047, 0.043).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.55), 0.043, 0.041).bone('forearm.L'),
      ),
    );
    const neckRing = sdf.torus(0.06, 0.021).scale([1, 1, 0.92]).at(0, 0.452, -0.012).bone('chest');
    const mail = sdf.smoothUnion(0.012, h.weighted(h.torso.round(0.008)), sleeve, neckRing);
    k.body('mail', mail, { color: C.mail, roughness: 0.5, metalness: 0.6, detail: 0.005, bump: mailBump });

    // ------------------------------------------------------------------ the blue tabard with the white tower
    const tabardTop = h.torso
      .round(0.016)
      .smoothIntersect(0.008, sdf.box([0.25, 0.14, 0.6]).at(0, 0.37, 0));
    const skirtProfile = (r: number) =>
      profile.polygon(
        [
          [0, 0.3],
          [0.15 + r, 0.3],
          [0.155 + r, 0.26],
          [0.163 + r, 0.21],
          [0.172 + r, 0.178],
          [0.17 + r, 0.17],
          [0, 0.17],
        ],
        { smooth: true, samples: 6 },
      );
    const skirt = sdf.revolve(skirtProfile(0)).scale([1, 1, 0.8]);
    const tower = profile.polygon([
      [-0.034, 0.3],
      [0.034, 0.3],
      [0.034, 0.372],
      [0.021, 0.372],
      [0.021, 0.356],
      [0.011, 0.356],
      [0.011, 0.372],
      [-0.011, 0.372],
      [-0.011, 0.356],
      [-0.021, 0.356],
      [-0.021, 0.372],
      [-0.034, 0.372],
    ]);
    const tabard = sdf
      .smoothUnion(0.01, h.weighted(tabardTop), h.weighted(skirt))
      .paintWhere(sdf.extrude(tower, 0.3), C.cream, 0.002)
      .paintWhere(h.band(0.17, 0.192), C.cream, 0.002);
    k.body('tabard', tabard, { color: clothColor, roughness: 0.85, detail: 0.005 });

    // The brown belt with a steel buckle, and two short straps on the skirt.
    const beltShape = h.torso.round(0.034).intersect(sdf.box([0.6, 0.034, 0.6]).at(0, 0.259, 0));
    const strapShape = skirt
      .round(0.004)
      .intersect(sdf.box([0.024, 0.09, 0.4]).at(0.065, 0.222, 0.2))
      .mirror('x', 0);
    k.body('belt', h.weighted(sdf.union(beltShape, strapShape)), { color: C.leather, roughness: 0.6, detail: 0.004 });
    const beltZ = sdf.raycast(h.torso.round(0.034), [0, 0.259, 1], [0, 0, -1])?.[2] ?? 0.12;
    const buckle = sdf.ellipsoid([0.032, 0.026, 0.01]).at(0, 0.259, beltZ + 0.003);
    k.body('buckle', buckle.bone('chest'), { color: C.steel, roughness: 0.35, metalness: 0.8, detail: 0.003 });

    // Steel bracers on the forearms.
    const bracer = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.5), lerp(j.ELBOW, j.WRIST, 1.0), 0.0475, 0.047).round(0.003).bone('forearm.L'));
    k.body('bracers', bracer, { color: C.steel, roughness: 0.4, metalness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ tall brown boots with a strap
    const bootShape = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.058, 0.046, 0.104]).at(0, 0.044, 0.044), sdf.sphere(0.052).at(0, 0.055, -0.004))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    const shaft = sdf.cylinder(0.054, 0.125, 0.012).at(ANKLE[0], 0.0625, 0.0).bone('shin.L');
    const cuffBand = sdf.cylinder(0.059, 0.03, 0.01).at(ANKLE[0], 0.108, 0.0).bone('shin.L');
    k.body('boots', pair(sdf.smoothUnion(0.02, bootShape, shaft, cuffBand)), { color: C.leather, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ the spear, upright in the right fist (x < 0)
    const gR = h.arms.R.GRIP;
    const sx = -gR[0] + 0.04;
    const sz = gR[2];
    const shaftShape = sdf.capsule([sx, 0.062, sz], [sx, 0.99, sz], 0.0155);
    k.body('spear', shaftShape, { color: C.spear, roughness: 0.65, detail: 0.004, bone: 'knife.R' });
    const leaf = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.0],
            [0.026, 0.012],
            [0.04, 0.03],
            [0.036, 0.05],
            [0.02, 0.078],
            [0, 0.1],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.5])
      .at(sx, 0.995, sz);
    const socket = sdf.cone([sx, 0.96, sz], [sx, 1.0, sz], 0.024, 0.02).round(0.002);
    const ring = sdf.cylinder(0.025, 0.012, 0.004).at(sx, 0.96, sz);
    k.body('spear-head', sdf.smoothUnion(0.008, leaf, socket, ring), { color: C.tip, roughness: 0.3, metalness: 0.8, detail: 0.0035, bone: 'knife.R' });

    // ------------------------------------------------------------------ the round shield on the left forearm (x > 0)
    const gL = h.arms.L.GRIP;
    const shieldAt = (s: sdf.Shape) => s.rotateY(14).at(gL[0] + 0.03, gL[1] + 0.02, gL[2] + 0.05);
    const disc = sdf.cylinder(0.13, 0.03, 0.008).rotateX(90);
    const ringPaint = sdf.cylinder(0.104, 0.4).subtract(sdf.cylinder(0.088, 0.5)).rotateX(90);
    const face = disc.paintWhere(ringPaint, C.cream, 0.002);
    k.body('shield', shieldAt(face).bone('knife.L'), { color: clothColor, roughness: 0.75, detail: 0.004 });
    const shieldRim = sdf.torus(0.13, 0.0165).rotateX(90);
    k.body('shield-rim', shieldAt(shieldRim).bone('knife.L'), { color: C.steel, roughness: 0.35, metalness: 0.8, detail: 0.004 });
    const boss = sdf.ellipsoid([0.04, 0.04, 0.022]).at(0, 0, 0.018);
    k.body('shield-boss', shieldAt(boss).bone('knife.L'), { color: C.cream, roughness: 0.5, detail: 0.004 });
  },
});
