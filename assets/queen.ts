import { noise, profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Queen — Chibi Quest court NPC (catalog `npcs/court-and-faction/queen`), about 1.07 m to the top of
 * the crown's jewels, faces +Z. Target: docs/npc-mockups/queen_001.jpg. Built on the humanoid kind.
 *
 * Role: the gracious ruler who gives the main quests, seen in the throne room and the garden in 3D
 *   and as a 128 px sprite; the tall crown, the long wavy hair, the ermine cape, and the scepter read.
 * One idea: a kind queen under a tall gold crown: dark waves of hair, a white spotted cape that
 *   falls to the floor on both sides of a purple bell gown, and a star scepter at her side.
 * Shape language: round and soft (hair, cape, gown bell), with the crown points and the star as the
 *   hard accents.
 * Palette (60/30/10): gown purple #5a3a8a and ermine #f6f1ea; hair #4a2a18; gold #e0b040 (crown,
 *   necklace, hem, scepter) with purple jewels #7a3aa0.
 * Value plan: the dark hair frames the face; the white cape frames the gown; the gold is the accent.
 * Bodies: skin, ears, hair, crown, gems, gown, cuffs, necklace, ermine, scepter.
 * Rig: the humanoid kind's skeleton and clips; the left fist rests at the waist and the right fist
 *   holds the scepter (both arms keep a held pose). The cape is tagged to `cloak`; the lower hair
 *   rides the chest so that the head can bow in the rest clip.
 */

const C = {
  gold: '#e0b040',
  jewel: '#7a3aa0',
  ermine: '#f6f1ea',
  spot: '#2a2428',
  cuff: '#c9a0dc',
  pants: '#4a3a5e',
  shoe: '#5a3a32',
};

// The left fist rests at the waist; the right hand holds the scepter forward at her side.
const POSE_L = { elbow: [0.15, 0.3, 0.03], wrist: [0.07, 0.31, 0.13] } as const;
const POSE_R = { elbow: [0.22, 0.325, 0.06], wrist: [0.275, 0.285, 0.18] } as const;

export default humanoidAsset({
  name: 'queen',
  description: 'A gracious queen in a tall gold crown, a purple gown, and a spotted ermine cape, holding a star scepter.',
  reference: 'docs/npc-mockups/queen_001.jpg',
  variants: {
    skin: { caramel: '#b8764c', tan: '#d49a72', fair: '#f2c7a4', light: '#e8b48e', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { chestnut: '#4a2a18', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { violet: '#5a3a8a', burgundy: '#8a2a48', teal: '#2a6a6a', midnight: '#2e3a6a' },
  },
  presets: {
    royal: { skin: 'caramel', hair: 'chestnut', eyes: 'brown', cloth: 'violet' },
    garden: { skin: 'fair', hair: 'auburn', eyes: 'green', cloth: 'teal' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: C.shoe,
  pose: { L: POSE_L, R: POSE_R },

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
    const skinColor = h.tint.skin ?? '#d49a72';
    const gownColor = h.tint.shirt ?? '#5a3a8a';
    const rad = Math.PI / 180;
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);

    // ------------------------------------------------------------------ larger ears (skin tint)
    const ear = sdf
      .ellipsoid([0.036, 0.054, 0.038])
      .subtract(sdf.sphere(0.021).at(0.017, 0, 0.008))
      .rotateY(-12)
      .at(0.212, 0.615, -0.012)
      .bone('head');
    k.body('ears', pair(ear), { color: skinColor, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a small cap, a fringe sweep, and locks
    const onFace = (x: number, y: number, dz: number, r: number): P4 => [x, y, h.faceZ(x, y) + dz, r];
    const hairCap = sdf
      .ellipsoid([0.217, 0.212, 0.2])
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0.14))
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.03))
      .smoothSubtract(0.025, sdf.ellipsoid([0.165, 0.2, 0.13]).at(0, -0.035, 0.115));
    // The fringe: a thick wave across the forehead from the parting (viewer's left) to the right temple.
    const fringe = sdf.chain(
      [
        onFace(-0.17, 0.73, 0.012, 0.03),
        onFace(-0.14, 0.795, 0.02, 0.036),
        onFace(-0.07, 0.835, 0.026, 0.04),
        onFace(0.03, 0.84, 0.03, 0.04),
        onFace(0.11, 0.815, 0.028, 0.037),
        onFace(0.17, 0.765, 0.02, 0.033),
        onFace(0.192, 0.69, 0.0, 0.03),
      ],
      0.014,
    );
    const lock = (pts: P4[]) => sdf.chain(pts, 0.014);
    // Waves: each lock zigzags a little in x as it falls.
    const wave = (x0: number, z0: number, amp: number, ph: number, yTop: number, yBot: number, r: number): P4[] => {
      const n = 5;
      return Array.from({ length: n }, (_, i): P4 => {
        const t = i / (n - 1);
        const y = yTop + (yBot - yTop) * t;
        const sway = amp * Math.sin(t * 5 + ph);
        return [x0 + sway, y, z0 - 0.012 * t, r * (1 - 0.25 * t)];
      });
    };
    const backAngles = [95, 115, 135, 155, 175, 195, 215, 235, 255, 275];
    const backLocks = backAngles.map((deg, i) => {
      const x = 0.19 * Math.sin(deg * rad);
      const z = 0.18 * Math.cos(deg * rad);
      return lock(wave(x, z, 0.012, i * 1.3, 0.69, 0.35 - 0.012 * (i % 3), 0.05));
    });
    const sideLocks = [1, -1].flatMap((s) => [
      lock(wave(s * 0.205, -0.05, 0.014, s * 0.8, 0.74, 0.4, 0.038).map((p): P4 => [p[0], p[1], p[2], p[3]])),
      lock(wave(s * 0.225, -0.075, 0.012, s * 1.4 + 2, 0.62, 0.35, 0.04)),
    ]);
    // A long curl on the viewer's right that falls behind the arm.
    const curl = lock([
      [0.225, 0.52, -0.06, 0.036],
      [0.235, 0.44, -0.07, 0.036],
      [0.25, 0.375, -0.075, 0.034],
      [0.275, 0.335, -0.07, 0.03],
      [0.29, 0.31, -0.06, 0.024],
    ]);
    const backMass = sdf.ellipsoid([0.2, 0.2, 0.1]).at(0, 0.53, -0.115).smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], -0.06));
    const hairShape = sdf.smoothUnion(0.02, headPose(hairCap), fringe, curl, backMass, ...backLocks, ...sideLocks);
    k.body(
      'hair',
      sdf.union(
        hairShape.intersect(h.band(0.5, 0.95)).bone('head'),
        hairShape.intersect(h.band(0.2, 0.5)).bone('chest'),
      ),
      {
        color: hairColor,
        roughness: 0.55,
        detail: 0.005,
        bump: (x, y, z) => 0.002 * noise.fbm(x * 40, y * 20, z * 40, 2),
      },
    );

    // ------------------------------------------------------------------ crown: a gold ring, eight points, purple jewels
    const crownPose = (s: sdf.Shape) => s.scale(0.8).rotateX(-5).at(0, HEAD_Y + 0.032, 0);
    const ring = sdf
      .revolve(
        profile.polygon([
          [0.148, 0.145],
          [0.168, 0.145],
          [0.222, 0.235],
          [0.202, 0.235],
        ]),
      )
      .round(0.003)
      .scale([1, 1, 0.93]);
    const tipAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    const polar = (deg: number, r: number, y: number): [number, number, number] => [r * Math.sin(deg * rad), y, 0.93 * r * Math.cos(deg * rad)];
    const points = tipAngles.map((a) => {
      const tall = a === 0 ? 0.3 : a === 45 || a === 315 ? 0.3 : 0.29;
      return sdf.cone(polar(a, 0.205, 0.215), polar(a, 0.222, tall), 0.052, 0.01);
    });
    k.body('crown', crownPose(sdf.smoothUnion(0.008, ring, ...points)).bone('head'), {
      color: C.gold,
      roughness: 0.35,
      metalness: 0.8,
      detail: 0.005,
    });
    const jewelAt = (deg: number, r: number, y: number) => {
      const p = polar(deg, 0.168 + (y - 0.145) * 0.62 + 0.004, y);
      return sdf.ellipsoid([r, r * 1.1, r * 0.8]).rotateY(deg).at(p[0], p[1], p[2]);
    };
    const gems = sdf.union(jewelAt(0, 0.05, 0.23), jewelAt(40, 0.022, 0.185), jewelAt(-40, 0.022, 0.185), jewelAt(78, 0.017, 0.185), jewelAt(-78, 0.017, 0.185));
    k.body('gems', crownPose(gems).bone('head'), { color: C.jewel, roughness: 0.15, detail: 0.004 });

    // ------------------------------------------------------------------ gown: bodice, bell skirt, slim sleeves, gold hem
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.13, 0.3],
            [0.142, 0.25],
            [0.17, 0.18],
            [0.205, 0.1],
            [0.23, 0.04],
            [0, 0.04],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.98]);
    const scoop = sdf.ellipsoid([0.085, 0.07, 0.1]).at(0, 0.468, 0.145);
    const gownCore = sdf
      .smoothUnion(0.03, h.torso.round(0.008), skirt)
      .smoothIntersect(0.01, h.band(0.04, 0.455))
      .smoothSubtract(0.012, scoop);
    const sleeveOf = (j: { ELBOW: readonly [number, number, number]; WRIST: readonly [number, number, number] }) => {
      const upper = sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.052, 0.046).bone('upperarm.L');
      const fore = sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.86), 0.046, 0.042).bone('forearm.L');
      return sdf.smoothUnion(0.015, upper, fore);
    };
    const cuffOf = (j: { ELBOW: readonly [number, number, number]; WRIST: readonly [number, number, number] }) =>
      sdf.cone(lerp(j.ELBOW, j.WRIST, 0.78), lerp(j.ELBOW, j.WRIST, 0.97), 0.046, 0.047).round(0.002).bone('forearm.L');
    const sleeves = h.perArm((j) => sleeveOf(j));
    const neckTrim = scoop.round(0.012);
    const gown = sdf
      .union(h.weighted(gownCore), sleeves)
      .paintWhere(neckTrim, C.gold, 0.002)
      .paintFn((x, y, z, base) => {
        // Gold scrolls at the hem: short arcs in a band, with a gap between them.
        if (y > 0.05 && y < 0.098 && z > -0.02) {
          const a = Math.atan2(x, z) / rad;
          const cell = ((a % 24) + 24) % 24;
          if (cell > 3 && cell < 21) return rgb(C.gold);
        }
        return base;
      });
    k.body('gown', gown, {
      color: gownColor,
      roughness: 0.8,
      detail: 0.005,
      bump: (x, y, z) => 0.0035 * Math.sin(Math.atan2(x, z) * 14) * (y < 0.3 ? 1 : 0.2),
    });
    k.body('cuffs', h.perArm((j) => cuffOf(j)), { color: C.cuff, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ necklace: a gold ring with a pendant
    const chainRing = sdf.torus(0.066, 0.0085).scale([1, 1, 1]).rotateX(28).at(0, 0.455, 0.0);
    const frontZ = sdf.raycast(h.torso, [0, 0.4, 1], [0, 0, -1])?.[2] ?? 0.09;
    const pendant = sdf.smoothUnion(0.004, sdf.sphere(0.017).at(0, 0.385, frontZ + 0.006), sdf.sphere(0.011).at(0, 0.412, frontZ + 0.002));
    k.body('necklace', sdf.union(chainRing, pendant), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.003, bone: 'chest' });

    // ------------------------------------------------------------------ ermine: a shoulder mantle and a cape to the floor
    const frontCut = sdf.extrude(profile.polygon([[-0.06, 0.5], [0.06, 0.5], [0.12, 0.3], [-0.12, 0.3]]), 0.5).at(0, 0, 0.27);
    const mantle = h.torso
      .round(0.032)
      .smoothIntersect(0.012, h.band(0.325, 0.462))
      .smoothSubtract(0.015, frontCut);
    const capeOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.155, 0.46],
            [0.2, 0.4],
            [0.265, 0.3],
            [0.29, 0.2],
            [0.305, 0.1],
            [0.31, 0.03],
            [0, 0.03],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.9])
      .at(0, 0, -0.025);
    const cape = capeOuter.subtract(capeOuter.round(-0.03)).smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0.1));
    const ermine = sdf
      .smoothUnion(0.03, h.weighted(mantle), cape.bone('cloak'))
      .paintFn((x, y, z, base) => {
        const cell = 0.085;
        const u = Math.atan2(x, -(z + 0.025)) * 0.22;
        const i = Math.floor(u / cell);
        const j = Math.floor(y / cell);
        const cx = (i + 0.25 + 0.5 * noise.random(i, j, 1)) * cell;
        const cy = (j + 0.25 + 0.5 * noise.random(i, j, 2)) * cell;
        const d = Math.hypot(u - cx, y - cy);
        return noise.random(i, j, 3) > 0.4 && d < 0.019 ? rgb(C.spot) : base;
      });
    k.body('ermine', ermine, {
      color: C.ermine,
      roughness: 0.95,
      detail: 0.006,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // ------------------------------------------------------------------ scepter, held upright in the right fist
    const GR = h.arms.R.GRIP;
    const sc = (s: sdf.Shape) => s.at(-GR[0], GR[1], GR[2]);
    const shaft = sdf.cylinder(0.0155, 0.4, 0.004).at(0, 0.04, 0);
    const collarRing = (y: number) => sdf.torus(0.02, 0.008).at(0, y, 0);
    const bulb = sdf.smoothUnion(0.008, sdf.sphere(0.03).at(0, 0.2, 0), collarRing(0.15), collarRing(0.245));
    const topPoints = Array.from({ length: 5 }, (_, i) => {
      const a = i * 72 * rad;
      const x = 0.03 * Math.sin(a);
      const z = 0.03 * Math.cos(a);
      return sdf.smoothUnion(
        0.004,
        sdf.cone([x * 0.8, 0.3, z * 0.8], [x, 0.352, z], 0.014, 0.006),
        sdf.sphere(0.011).at(x, 0.358, z),
      );
    });
    const topCup = sdf.cone([0, 0.27, 0], [0, 0.318, 0], 0.018, 0.036).round(0.002);
    const star = sdf.smoothUnion(0.006, topCup, sdf.sphere(0.022).at(0, 0.33, 0), ...topPoints);
    const foot = sdf.sphere(0.014).at(0, -0.165, 0);
    k.body('scepter', sc(sdf.smoothUnion(0.006, shaft, bulb, star, foot)), {
      color: C.gold,
      roughness: 0.35,
      metalness: 0.8,
      detail: 0.003,
      bone: 'knife.R',
    });
  },
});
