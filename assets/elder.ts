import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Elder: Chibi Quest settlement NPC (catalog `npcs/settlement/elder`), about 1.0 m to the top of the
 * hood, faces +Z. Target: docs/npc-mockups/elder_001.jpg. Built on the humanoid kind.
 *
 * Role: the village elder who tells the story and gives quests; seen in 3D and as a 128 px sprite.
 *   The hood, the long white beard, the bushy brows, and the tall staff must read.
 * One idea: a small wise man swallowed by a big brown hood and a flowing white beard, leaning on a
 *   gnarled staff that is taller than he is.
 * Shape language: round and soft (hood, beard, robe), with the thin tall staff and its crook as the
 *   one long vertical that breaks the outline.
 * Palette (60/30/10): earth brown #7a5a3a robe and hood with #5a4028 folds; white #f0ece4 beard,
 *   brows, and hair; dark green #3e5a30 sash as the accent; staff #8a6a3a with #6b4a2a knots;
 *   sandals #6b4226.
 * Value plan: the white beard on the brown robe is the focal point; the pale face sits inside the
 *   dark hood opening.
 * Bodies: skin, nose, hood, cowl, robe, cuffs, sash, beard, brows, hair, sandals, staff.
 * Rig: the humanoid kind's skeleton and clips. The staff is rigid on `knife.L` (the left fist).
 */

const C = {
  white: '#f0ece4',
  fold: '#5a4028',
  sash: '#3e5a30',
  sandal: '#6b4226',
  staff: '#5a3d28',
  knot: '#3e2a1c',
  wrap: '#b89968',
  mouth: '#a4503f',
};

// The staff stands upright beside the left foot, through the left fist.
const STAFF = { top: 1.0, r: 0.021 };

export default humanoidAsset({
  name: 'elder',
  description: 'A wise old village elder in a brown hood and robe with a long white beard, leaning on a tall knotted staff.',
  reference: 'docs/npc-mockups/elder_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { white: '#f0ece4', silver: '#b8b4c4', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { earth: '#7a5a3a', ash: '#85806f', plum: '#6e4a5a', dusk: '#4e5a70' },
  },
  presets: {
    village: { skin: 'fair', hair: 'white', eyes: 'brown', cloth: 'earth' },
    hermit: { skin: 'tan', hair: 'silver', eyes: 'blue', cloth: 'dusk' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  // The left arm holds the staff at chest height (as in the mockup); it keeps this pose in every clip.
  pose: { L: { elbow: [0.235, 0.295, 0.05], wrist: [0.275, 0.335, 0.14] } },

  // Painted over the kind's face: the default brows are covered with skin, and the mouth is hidden
  // by the mustache, so only the eyes and blush stay.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.04, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    return skin.paintWhere(oldBrows, h.tint.skin!, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const cloth = h.tint.shirt!;
    const fold = k.tint('cloth', { color: C.fold, follow: 1 });
    const white = k.tint('hair');
    const skinTint = h.tint.skin!;
    const fz = h.faceZ;

    // ------------------------------------------------------------------ hood: a big soft shell, open at the front
    const hoodPose = (s: sdf.Shape) => s.rotateX(-6).at(0, HEAD_Y, 0);
    // A hollow hood: a rounded outer shell with a soft bunch at the back of the top, minus a cavity that
    // clears the head, the ears, and the temple hair by 0.02 m or more.
    const outer = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid([0.29, 0.275, 0.275]).at(0, 0.02, -0.03),
      sdf.sphere(0.08).at(0, 0.2, -0.13), // the soft bunch of cloth at the back of the top
    );
    const cavity = sdf.ellipsoid([0.26, 0.25, 0.245]).at(0, 0.015, -0.02);
    // The opening: an elliptic tunnel along Z, so the whole face shows and the hood rim frames it.
    const tunnel = sdf.cylinder(1, 1).rotateX(90).scale([0.18, 0.2, 1]).at(0, -0.03, 0.5);
    // The back edge hangs lower than the front (a soft drape).
    const drape = sdf.ellipsoid([0.2, 0.09, 0.14]).at(0, -0.17, -0.08);
    const hoodShape = outer
      .intersect(sdf.halfSpace([0, -1, 0], 0.16))
      .smoothUnion(0.03, drape)
      .displace(0.006, (x, y, z) => noise.fbm(x * 9 + 3, y * 7, z * 9, 2))
      .smoothSubtract(0.015, tunnel)
      .subtract(cavity)
      .intersect(sdf.halfSpace([0, -1, 0], 0.26));
    const hood = hoodPose(hoodShape).bone('head');
    k.body('hood', hood, { color: cloth, roughness: 0.92, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(x * 55 + z * 30) * Math.cos(y * 45 + x * 20) });
    const clipToCavity = (s: sdf.Shape) => s.intersect(hoodPose(cavity.round(-0.012)));
    // Brows are clipped to the inside of the hood opening, so nothing shows on the cloth.
    const clipToHood = (s: sdf.Shape) => s.intersect(hoodPose(tunnel.round(-0.012)));

    // The cowl: the hood's fall over the shoulders.
    const cowl = sdf
      .smoothUnion(0.03, sdf.ellipsoid([0.17, 0.065, 0.15]).at(0, 0.455, -0.012), sdf.ellipsoid([0.15, 0.05, 0.12]).at(0, 0.425, 0.02))
      .bone('chest');
    k.body('cowl', cowl, { color: cloth, roughness: 0.92, detail: 0.005 });

    // ------------------------------------------------------------------ robe: torso, wide sleeves, a flared skirt
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.12), j.ELBOW, 0.06, 0.066).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.78), 0.066, 0.064).bone('forearm.L'),
      ),
    );
    // The rolled cuffs (darker folds), painted on the robe.
    const cuff = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.62), lerp(j.ELBOW, j.WRIST, 0.82), 0.07, 0.072).round(0.006).bone('forearm.L'));
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.138, 0.3],
            [0.15, 0.26],
            [0.17, 0.2],
            [0.195, 0.14],
            [0.208, 0.108],
            [0.2, 0.098],
            [0, 0.098],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.92]);
    const robe = sdf
      .smoothUnion(0.014, h.weighted(h.torso.round(0.014)), sleeve, h.weighted(skirt))
      .paintWhere(h.band(0.098, 0.122), fold, 0.004)
      .paintWhere(h.band(0.15, 0.158), fold, 0.003);
    k.body('robe', robe, { color: cloth, roughness: 0.92, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(y * 70 + Math.atan2(x, z) * 9) });

    // A thick green rope belt at the waist with a knot at the front and two short hanging ends.
    const rope = h.weighted(skirt.round(0.016).intersect(h.band(0.246, 0.278)));
    const knotAt = [0.045, 0.262, 0.158] as const;
    const knot = sdf.smoothUnion(
      0.012,
      sdf.sphere(0.03).at(...knotAt),
      sdf.sphere(0.022).at(knotAt[0] - 0.03, 0.268, knotAt[2] - 0.004),
      sdf.sphere(0.022).at(knotAt[0] + 0.028, 0.256, knotAt[2] - 0.004),
    );
    const end = (dx: number, dz: number) =>
      sdf.chain(
        [
          [knotAt[0] + dx, 0.255, knotAt[2] + 0.005, 0.016],
          [knotAt[0] + dx * 1.6, 0.2, knotAt[2] + 0.02 + dz, 0.015],
          [knotAt[0] + dx * 2.0, 0.15, knotAt[2] + 0.04 + dz, 0.013],
        ],
        0.01,
      );
    const sash = sdf.smoothUnion(0.01, rope, knot.bone('spine'), end(0.006, 0).bone('hips'), end(0.03, 0.01).bone('hips'));
    k.body('sash', sash, { color: C.sash, roughness: 0.85, detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(Math.atan2(x, z) * 60 + y * 90) });

    // ------------------------------------------------------------------ nose, brows, mustache, beard, hair
    const noseZ = fz(0, 0.57);
    const nose = sdf.smoothUnion(0.015, sdf.ellipsoid([0.056, 0.05, 0.054]).at(0, 0.572, noseZ + 0.018), sdf.ellipsoid([0.034, 0.034, 0.032]).at(0, 0.6, noseZ + 0.004)).bone('head');
    k.body('nose', nose, { color: k.tint('skin'), roughness: 0.5, detail: 0.004 });

    // Kind, slightly worried brows: the inner ends high, the arch over the eye, the outer ends curled down.
    const brow = (s: number) =>
      sdf.chain(
        [
          [0.032 * s, 0.752, fz(0.032, 0.752) + 0.006, 0.019],
          [0.075 * s, 0.762, fz(0.075, 0.762) + 0.006, 0.022],
          [0.118 * s, 0.742, fz(0.118, 0.742) + 0.006, 0.02],
          [0.148 * s, 0.708, fz(0.148, 0.708) + 0.006, 0.016],
          [0.15 * s, 0.68, fz(0.15, 0.68) + 0.006, 0.012],
        ],
        0.014,
      );
    k.body('brows', clipToHood(sdf.smoothUnion(0.01, brow(1), brow(-1))).bone('head'), { color: white, roughness: 0.7, detail: 0.004 });

    // The mustache: a separate thick white pair of curls under the big nose, ends swept up.
    const mus = (s: number) =>
      sdf.chain(
        [
          [0.006 * s, 0.528, fz(0.006, 0.528) + 0.022, 0.026],
          [0.05 * s, 0.522, fz(0.05, 0.522) + 0.026, 0.03],
          [0.092 * s, 0.508, fz(0.092, 0.508) + 0.02, 0.03],
          [0.128 * s, 0.524, fz(0.128, 0.524) + 0.008, 0.02],
          [0.136 * s, 0.545, fz(0.136, 0.545) + 0.002, 0.014],
        ],
        0.014,
      );
    k.body('mustache', sdf.smoothUnion(0.012, mus(1), mus(-1)).bone('head'), {
      color: white,
      roughness: 0.75,
      detail: 0.004,
      bump: (x, y, z) => 0.002 * Math.sin(x * 120 + y * 40 + z * 20),
    });

    // The beard: jaw wings and many long wavy locks that end above the belt.
    const jaw = (s: number) =>
      sdf.chain(
        [
          [0.15 * s, 0.6, 0.05, 0.026],
          [0.145 * s, 0.54, 0.09, 0.036],
          [0.1 * s, 0.48, 0.12, 0.04],
          [0.05 * s, 0.45, 0.14, 0.04],
        ],
        0.02,
      );
    // A lock waves from side to side as it falls; `zOff` pushes alternate locks forward.
    const lock = (x0: number, x1: number, tip: number, r: number, zOff: number, wave: number) =>
      sdf.chain(
        [
          [x0, 0.5, 0.125 + zOff, r * 0.8],
          [x0 + (x1 - x0) * 0.35 + wave * 1.7, 0.43, 0.14 + zOff, r],
          [x0 + (x1 - x0) * 0.65 - wave * 1.7, 0.39 - (0.39 - tip - 0.045) * 0.3, 0.145 + zOff, r * 0.85],
          [x1 + wave * 1.2, tip - 0.045, 0.14 + zOff, r * 0.5],
          [x1 * 1.04 - wave, tip - 0.08, 0.138 + zOff, r * 0.2],
        ],
        0.012,
      );
    const beard = sdf.smoothUnion(
      0.01,
      pair(jaw(1)),
      sdf.ellipsoid([0.085, 0.06, 0.05]).at(0, 0.46, 0.105),
      lock(0, 0.005, 0.36, 0.05, 0.012, 0.01),
      lock(0.045, 0.07, 0.385, 0.042, 0.0, -0.012),
      lock(-0.045, -0.07, 0.385, 0.042, 0.0, 0.012),
      lock(0.09, 0.115, 0.42, 0.034, -0.006, 0.01),
      lock(-0.09, -0.115, 0.42, 0.034, -0.006, -0.01),
      lock(0.022, 0.032, 0.34, 0.04, 0.024, -0.01),
      lock(-0.022, -0.032, 0.34, 0.04, 0.024, 0.01),
      lock(0.13, 0.14, 0.47, 0.03, -0.014, 0),
      lock(-0.13, -0.14, 0.47, 0.03, -0.014, 0),
    ).displace(0.003, (x, y, z) => Math.sin(x * 90 + y * 25) * Math.cos(z * 60 + y * 30));
    k.body('beard', beard.bone('head'), { color: white, roughness: 0.75, detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(x * 140 + y * 8 + z * 30) });

    // Hair locks at the temples, inside the hood.
    const temple = (s: number) =>
      sdf.chain(
        [
          [0.15 * s, 0.72, 0.06, 0.022],
          [0.165 * s, 0.66, 0.055, 0.026],
          [0.16 * s, 0.6, 0.045, 0.02],
        ],
        0.01,
      );
    k.body('hair', clipToCavity(sdf.smoothUnion(0.01, temple(1), temple(-1))).bone('head'), { color: white, roughness: 0.7, detail: 0.005 });

    // ------------------------------------------------------------------ sandals: a sole and three straps
    const sandal = sdf
      .smoothUnion(
        0.006,
        sdf.box([0.1, 0.022, 0.215], 0.01).at(0, 0.011, 0.035),
        sdf.torus(0.04, 0.009).rotateX(90).at(0, 0.026, 0.0),
        sdf.torus(0.04, 0.009).rotateX(90).at(0, 0.026, 0.055),
        sdf.torus(0.034, 0.009).rotateX(90).at(0, 0.022, 0.105),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0.5))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('sandals', pair(sandal), { color: C.sandal, roughness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ the staff: knotted, with a crook
    const { top, r } = STAFF;
    const [sx, , sz] = h.arms.L.GRIP;
    const shaft = sdf.chain(
      [
        [sx - 0.004, 0.045 + r, sz, r],
        [sx + 0.01, 0.2, sz + 0.006, r * 1.1],
        [sx - 0.01, 0.45, sz - 0.006, r],
        [sx + 0.01, 0.7, sz + 0.005, r * 1.1],
        [sx, top - 0.07, sz, r],
      ],
      0.02,
    );
    const crook = sdf.chain(
      [
        [sx, top - 0.07, sz, r],
        [sx + 0.012, top - 0.025, sz, r * 0.95],
        [sx + 0.05, top, sz, r * 0.9],
        [sx + 0.092, top - 0.02, sz, r * 0.85],
        [sx + 0.1, top - 0.065, sz, r * 0.8],
      ],
      0.02,
    );
    const lumps = [
      [0.3, 0.034],
      [0.5, 0.03],
      [0.65, 0.034],
    ] as const;
    const bumps = sdf.union(...lumps.map(([y, rr]) => sdf.ellipsoid([rr, rr * 1.3, rr]).at(sx + (y > 0.4 ? 0.004 : -0.004), y, sz)));
    // A tan wrap of cord under the crook.
    const wraps = sdf.union(...[0.83, 0.86, 0.89].map((y) => sdf.torus(0.026, 0.012).at(sx, y, sz)));
    const staff = sdf
      .smoothUnion(0.018, shaft, crook, bumps)
      .union(wraps)
      .paintWhere(bumps, C.knot, 0.01)
      .paintWhere(wraps, C.wrap, 0.004)
      // The twisted, gnarled grain: a spiral ridge around the shaft.
      .displace(0.004, (x, y, z) => Math.sin(y * 55 + Math.atan2(z - sz, x - sx) * 2) + 0.5 * noise.fbm(x * 30, y * 20, z * 30, 2));
    k.body('staff', staff, { color: C.staff, roughness: 0.8, detail: 0.004, bone: 'knife.L' });
    void skinTint;
    void HEAD_Y;
  },
});
