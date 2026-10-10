import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Court wizard — Chibi Quest court NPC (catalog `npcs/court-and-faction/court-wizard`), about 1.1 m
 * to the tip of the hat, faces +Z. Target: docs/npc-mockups/court-wizard_001.jpg. Built on the humanoid kind.
 *
 * Role: a palace NPC who teaches magic and gives spell quests; seen at the wizard tower and the
 *   throne room in 3D and as a 128 px sprite. The wide hat, the white beard, the glowing crystal staff,
 *   and the blue orb must read.
 * One idea: a twinkly old wizard whose huge white beard and floppy star hat frame a delighted face.
 * Shape language: round and soft (hat, beard, bell robe), with the crystal as the one sharp form.
 * Palette (60/30/10): purple #5a3a8a (hat, robe, the cloth slot), shoes #4a2a6a; white #ece8e0 (hair,
 *   brows, beard); gold #e0b040 stars, belt, rings; wood #7a4a2c; the blue glow #6ac0f0 is the accent.
 * Value plan: the dark purple mass carries the light beard and face; gold stars are small sparkles;
 *   the two blue glows are the strongest accents at the sides.
 * Bodies: skin, nose, hat, hair, brows, beard, robe, cuffs, belt gold, shoes, staff, staff gold, crystal, orb.
 * Rig: the humanoid kind's skeleton and clips. Both arms keep a held pose in every clip: the right
 *   holds the staff out to the side, the left raises the orb. The robe skirt is rigid on the hips.
 */

const POSE_L = { elbow: [0.215, 0.34, 0.02], wrist: [0.285, 0.42, 0.07] } as const;
const POSE_R = { elbow: [0.23, 0.31, 0.03], wrist: [0.275, 0.29, 0.12] } as const;

const C = {
  white: '#ece8e0',
  gold: '#e0b040',
  wood: '#7a4a2c',
  glow: '#6ac0f0',
  shoe: '#4a2a6a',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'court-wizard',
  description: 'A twinkly old court wizard in a purple star robe and a tall pointed hat, holding a crystal staff and a glowing orb.',
  reference: 'docs/npc-mockups/court-wizard_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { white: '#ece8e0', silver: '#b8b4c4', grey: '#8a8a94', cream: '#d8c8a0', ginger: '#b8652e' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { violet: '#5a3a8a', plum: '#7a3a6a', midnight: '#3a3a6a', teal: '#2f5f6a' },
  },
  presets: {
    moonlit: { skin: 'light', hair: 'silver', eyes: 'violet', cloth: 'midnight' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  pose: { L: POSE_L, R: POSE_R },

  // A delighted open smile under the mustache; the kind's brows are painted over with skin (the
  // wizard has bushy white brows as their own body).
  paintSkin(skin, h) {
    const y = 0.533;
    const grin = profile.polygon(
      [
        [-0.046, 0.012],
        [-0.024, 0.003],
        [0, 0.0],
        [0.024, 0.003],
        [0.046, 0.012],
        [0.038, -0.01],
        [0.019, -0.026],
        [0, -0.031],
        [-0.019, -0.026],
        [-0.038, -0.01],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.009))).intersect(sdf.box([0.055, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.022, 0.012, 0.08]), 0, y - 0.026);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const robeColor = h.tint.shirt!;
    const starPts = (r: number): [number, number][] => {
      const pts: [number, number][] = [];
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 === 0 ? r : r * 0.45;
        pts.push([rr * Math.sin((i * Math.PI) / 5), rr * Math.cos((i * Math.PI) / 5)]);
      }
      return pts;
    };
    const star = (r: number, x: number, y: number, rot = 0) => sdf.extrude(profile.polygon(starPts(r)), 1.0).rotateZ(rot).at(x, y, 0);
    const moon = (r: number, x: number, y: number) => sdf.extrude(profile.arc(r, r * 0.4, 205, 335), 1.0).at(x, y, 0);

    // ------------------------------------------------------------------ robe: torso, long bell skirt, wide sleeves
    const bell = (r0: number, r1: number, r2: number, r3: number) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.3],
              [r0, 0.3],
              [r1, 0.24],
              [r2, 0.16],
              [r3, 0.095],
              [0, 0.095],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.88]);
    const skirt = bell(0.138, 0.158, 0.198, 0.232).bone('hips');
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.054, 0.062).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.9), 0.062, 0.088).bone('forearm.L'),
      ),
    );
    const robeStars = sdf.union(
      star(0.026, 0.085, 0.37),
      star(0.022, -0.1, 0.33, 15),
      star(0.024, 0.0, 0.17, 8),
      star(0.02, 0.13, 0.2, -10),
      star(0.02, -0.14, 0.17, 20),
      moon(0.036, 0.1, 0.14),
      moon(0.036, -0.1, 0.14),
      moon(0.03, 0.0, 0.115),
    );
    const robeBody = sdf
      .smoothUnion(0.02, h.weighted(h.torso.round(0.014)), skirt)
      .smoothUnion(0.012, sleeves)
      .paintWhere(robeStars.intersect(sdf.halfSpace([0, 1, 0], 0.46)), C.gold, 0.0015);
    k.body('robe', robeBody, {
      color: robeColor,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * Math.sin(Math.atan2(x, z) * 9 + y * 6) * Math.min(1, Math.max(0, (0.28 - y) * 8)),
    });

    // Gold-edged sleeve openings.
    const cuffs = h.perArm((j) =>
      sdf
        .cone(lerp(j.ELBOW, j.WRIST, 0.8), lerp(j.ELBOW, j.WRIST, 0.9), 0.08, 0.086)
        .subtract(sdf.cone(lerp(j.ELBOW, j.WRIST, 0.7), lerp(j.ELBOW, j.WRIST, 1.1), 0.072, 0.08))
        .bone('forearm.L'),
    );
    k.body('cuffs', cuffs, { color: C.gold, roughness: 0.4, metalness: 0.5, detail: 0.004 });

    // ------------------------------------------------------------------ rope belt, ring, and tassel ball
    const rope = sdf.torus(0.153, 0.012).scale([1, 1, 0.97]).at(0, 0.258, 0).bone('spine');
    const beltZ = sdf.raycast(rope, [0, 0.258, 1], [0, 0, -1])?.[2] ?? 0.14;
    const ring = sdf.torus(0.028, 0.008).rotateX(90).at(0, 0.21, beltZ + 0.012).bone('spine');
    const ball = sdf.sphere(0.02).at(0, 0.158, beltZ + 0.016).bone('hips');
    k.body('belt', sdf.union(rope, ring, ball), { color: C.gold, roughness: 0.4, metalness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ hat: wide brim, tall crown bent back
    const hatPose = (s: sdf.Shape) => s.rotateX(-8).at(0, HEAD_Y, 0);
    const crown = sdf.chain(
      [
        [0, 0.09, 0.0, 0.2],
        [0, 0.165, -0.005, 0.17],
        [0, 0.24, -0.025, 0.13],
        [0, 0.305, -0.07, 0.095],
        [0, 0.355, -0.13, 0.065],
        [0, 0.378, -0.2, 0.042],
        [0, 0.362, -0.26, 0.026],
      ],
      0.05,
    );
    const brim = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.085],
            [0.2, 0.09],
            [0.27, 0.105],
            [0.3, 0.125],
            [0.31, 0.14],
            [0.298, 0.142],
            [0.27, 0.126],
            [0.2, 0.112],
            [0, 0.115],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.97]);
    const hatLocal = sdf.smoothUnion(0.03, crown, brim);
    const hatStars = sdf.union(
      star(0.03, 0.07, 0.215, 12),
      star(0.026, -0.08, 0.27, -10),
      star(0.022, 0.03, 0.33, 6),
      sdf.box([0.06, 0.02, 1], 0.008).at(-0.07, 0.3, 0),
      star(0.02, -0.06, 0.2, 0),
    );
    const hat = hatPose(hatLocal).paintWhere(hatPose(hatStars), C.gold, 0.0015).bone('head');
    k.body('hat', hat, { color: robeColor, roughness: 0.85, detail: 0.005, bump: (x, y, z) => 0.002 * Math.sin(x * 70 + y * 40) * Math.cos(z * 55) });

    // ------------------------------------------------------------------ white hair at the temples and the nape
    const hairShell = sdf.ellipsoid([0.214, 0.208, 0.198]);
    const tips = sdf.union(
      ...[-70, -45, -22, 0, 22, 45, 70].map((a) => sdf.sphere(0.026).at(0.18 * Math.sin((a * Math.PI) / 180), -0.068, -0.167 * Math.cos((a * Math.PI) / 180))),
    );
    const back = hairShell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.06)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const temples = hairShell
      .smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], 0.03))
      .smoothIntersect(0.015, sdf.halfSpace([-1, 0, 0], -0.15).mirror('x'))
      .smoothIntersect(0.015, sdf.halfSpace([0, 0, 1], 0.12));
    const tuft = (s: number) =>
      sdf.chain(
        [
          [0.17 * s, 0.045, 0.085, 0.03],
          [0.19 * s, 0.0, 0.085, 0.028],
          [0.19 * s, -0.04, 0.085, 0.022],
          [0.175 * s, -0.07, 0.09, 0.016],
        ],
        0.01,
      );
    const hairBack = hatPose(sdf.smoothUnion(0.015, back, tips, temples, tuft(1), tuft(-1))).bone('head');
    k.body('hair', hairBack, { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ bushy white brows, a round nose
    const brow = (s: number) => {
      const pts: [number, number, number][] = [
        [0.035, 0.694, 0],
        [0.07, 0.712, 0],
        [0.11, 0.718, 0],
        [0.148, 0.71, 0],
        [0.168, 0.692, 0],
      ];
      return sdf.smoothUnion(
        0.01,
        sdf.chain(
          pts.map(([x, y], i) => [x * s, y, h.faceZ(x, y) + 0.008, [0.018, 0.021, 0.021, 0.018, 0.012][i]!] as [number, number, number, number]),
          0.01,
        ),
        sdf.chain(
          [
            [0.14 * s, 0.703, h.faceZ(0.14, 0.703) + 0.004, 0.012],
            [0.172 * s, 0.7, h.faceZ(0.17, 0.7) - 0.005, 0.01],
          ],
          0.008,
        ),
      );
    };
    k.body('brows', sdf.smoothUnion(0.01, brow(1), brow(-1)).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.004 });
    const noseZ = h.faceZ(0, 0.59) + 0.024;
    k.body('nose', sdf.ellipsoid([0.034, 0.032, 0.036]).at(0, 0.59, noseZ).bone('head'), { color: h.tint.skin!, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ beard: a jaw mass, a mustache, and long locks
    const jaw = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([0.165, 0.1, 0.085]).at(0, 0.515, 0.085),
        sdf.ellipsoid([0.13, 0.12, 0.07]).at(0, 0.45, 0.13),
      )
      .subtract(sdf.box([0.11, 0.06, 0.3], 0.02).at(0, 0.53, 0.25));
    const lockSpec: [number, number, number][] = [
      // [x at the chin, x at the tip, tip y]
      [-0.12, -0.125, 0.37],
      [-0.09, -0.098, 0.33],
      [-0.055, -0.07, 0.3],
      [-0.02, -0.03, 0.285],
      [0.02, 0.03, 0.28],
      [0.055, 0.07, 0.3],
      [0.09, 0.098, 0.33],
      [0.12, 0.125, 0.37],
    ];
    const locks = sdf.smoothUnion(
      0.02,
      ...lockSpec.map(([x0, x1, ty]) =>
        sdf.chain(
          [
            [x0, 0.5, 0.13, 0.045],
            [(x0 + x1) / 2, (0.5 + ty) / 2 + 0.03, 0.18, 0.04],
            [x1 * 0.95, ty + 0.05, 0.185, 0.027],
            [x1, ty, 0.178, 0.012],
          ],
          0.015,
        ),
      ),
      sdf.ellipsoid([0.12, 0.09, 0.05]).at(0, 0.43, 0.15),
    );
    const stache = (s: number) =>
      sdf.chain(
        [
          [0.008 * s, 0.568, h.faceZ(0, 0.568) + 0.022, 0.024],
          [0.05 * s, 0.566, h.faceZ(0.05, 0.566) + 0.02, 0.024],
          [0.09 * s, 0.563, h.faceZ(0.09, 0.563) + 0.012, 0.021],
          [0.12 * s, 0.574, h.faceZ(0.12, 0.574) + 0.004, 0.013],
        ],
        0.012,
      );
    const sideburn = (s: number) =>
      sdf.chain(
        [
          [0.17 * s, 0.63, 0.06, 0.03],
          [0.168 * s, 0.57, 0.08, 0.04],
          [0.16 * s, 0.52, 0.09, 0.05],
        ],
        0.02,
      );
    const beardFull = sdf.smoothUnion(0.02, jaw, locks, stache(1), stache(-1), sideburn(1), sideburn(-1));
    const beard = beardFull.smoothSubtract(0.01, sdf.ellipsoid([0.058, 0.027, 0.2]).at(0, 0.519, 0.34));
    k.body('beard', beard.bone('head'), {
      color: hairColor,
      roughness: 0.65,
      detail: 0.005,
      bump: (x, y) => 0.003 * Math.sin(x * 160 + Math.sin(y * 30) * 1.5),
    });

    // ------------------------------------------------------------------ curled purple shoes with a gold strap
    const shoe = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.056, 0.04, 0.095]).at(0, 0.04, 0.035),
        sdf.sphere(0.05).at(0, 0.05, -0.005),
        sdf.chain(
          [
            [0, 0.045, 0.1, 0.04],
            [0, 0.06, 0.15, 0.032],
            [0, 0.085, 0.18, 0.025],
            [0, 0.102, 0.172, 0.02],
          ],
          0.015,
        ),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: k.tint('cloth', { color: C.shoe, follow: 1 }), roughness: 0.6 });

    // ------------------------------------------------------------------ the crystal staff (right hand, upright, leaning out)
    const GR = h.arms.R.GRIP;
    const gx = -GR[0];
    const gy = GR[1];
    const gz = GR[2];
    const lean = (s: sdf.Shape) => s.at(-gx, -gy, -gz).rotateZ(5).at(gx, gy, gz);
    const shaft = lean(
      sdf.smoothUnion(
        0.01,
        sdf.cone([gx, 0.075, gz], [gx, 0.93, gz], 0.017, 0.0185),
        sdf.sphere(0.021).at(gx, 0.079, gz),
        sdf.sphere(0.026).at(gx, gy + 0.05, gz),
      ),
    );
    k.body('staff', shaft, { color: C.wood, roughness: 0.75, detail: 0.004, bone: 'knife.R', bump: (x, y, z) => 0.002 * Math.sin(y * 70 + x * 25) * Math.cos(z * 40) });
    const rings = [0.115, gy - 0.07, gy + 0.09, 0.92].map((ry) => sdf.cylinder(0.022, 0.014, 0.004).at(gx, ry, gz));
    const cup = sdf.cone([gx, 0.92, gz], [gx, 0.985, gz], 0.024, 0.045).round(0.004);
    k.body('staff-gold', lean(sdf.union(...rings, cup)), { color: C.gold, roughness: 0.4, metalness: 0.6, detail: 0.003, bone: 'knife.R' });
    const crystal = lean(
      sdf.smoothUnion(
        0.012,
        sdf.sphere(0.042).scale([1, 1.2, 1]).at(gx, 1.01, gz),
        sdf.cone([gx, 1.01, gz], [gx, 1.13, gz], 0.042, 0.003),
      ),
    );
    k.body('crystal', crystal, { color: C.glow, emissive: C.glow, emissiveIntensity: 0.7, roughness: 0.15, flat: true, detail: 0.003, bone: 'knife.R' });

    // ------------------------------------------------------------------ the glowing orb (left hand, raised)
    const GL = h.arms.L.GRIP;
    const orb = sdf.sphere(0.042).at(GL[0], GL[1] + 0.05, GL[2] + 0.01);
    k.body('orb', orb, { color: C.glow, emissive: C.glow, emissiveIntensity: 0.7, roughness: 0.15, detail: 0.003, bone: 'knife.L' });
  },
});
