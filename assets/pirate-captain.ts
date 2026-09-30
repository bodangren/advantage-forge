import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf, Sdf, THREE } from '../src/index.js';

/**
 * Pirate captain — Chibi Quest enemy (catalog `enemies/humanoid/pirate-captain`), about 1.0 m to the
 * top of the crown, faces +Z. Target: docs/enemy-mockups/pirate-captain_001.jpg.
 * Built on the bandit captain's rig (the rogue's skeleton with knee bones). Weapon hand is hand.R
 * (the cutlass, on the right of the character, x < 0), the free hand is hand.L.
 *
 * Role: the human boss of the pirate ships; the tricorn, the eye patch, the black beard and the
 *   red coat with gold buttons read at 128 px.
 * One idea: a swaggering sea rover under a wide black tricorn with a gold rim and a skull badge,
 *   an eye patch, a huge black beard with two beaded braids and a long open red coat.
 * Shape language: round and chunky (head, beard, coat, boots) with sharp accents (the three brim
 *   corners, the curved blade, the standing collar).
 * Palette (60/30/10): black #26221f (hat, beard, belt, boots), dark red #7a2a2a (coat, bandana),
 *   cream #ece4d0 (shirt, cuffs, skull), brown #6a4a30 (waistcoat, breeches), gold #d4a83a accents.
 * Value plan: the light face sits between the dark hat and the dark beard; gold buttons, the hat
 *   rim, the buckle and the beads are the small bright points; the cream cuffs mark the hands.
 * Bodies: skin, hat, hat-trim, skull, bandana, bandana-knot, patch, mustache, beard, shirt, vest,
 *   coat, cuffs, neckcloth, trousers, boots, leather, sash, pistol, pistol-wood, brass, cutlass,
 *   guard, hilt.
 * Rig: the bandit's; `knot` carries the small bandana knot; the cutlass is rigid on `cutlassbone`
 *   (child of hand.R). The clips are the bandit's, written for the weapon arm on the left and
 *   mirrored with motion.mirrorPose, so the cutlass arm is the right one.
 */

const C = {
  skin: '#f0c8a0',
  eyeWhite: '#f6f1ea',
  irisRim: '#1c120c',
  iris: '#2c1a10',
  pupil: '#0e0a08',
  blush: '#e9a284',
  mouth: '#5a2a22',
  beard: '#1c1a18',
  beardLit: '#2e2a28',
  mustache: '#242220',
  hat: '#26221f',
  hatLit: '#3a3531',
  bone: '#ece4d0',
  coat: '#7a2a2a',
  coatLit: '#9a3a38',
  coatDark: '#5a1e1e',
  bandana: '#7a2a26',
  bandanaDark: '#5a1e1e',
  trim: '#d4a83a',
  patch: '#1a1816',
  shirt: '#ece4d0',
  cloth: '#9a9a94',
  vest: '#6a4a30',
  vestDark: '#4a3220',
  belt: '#1c1a18',
  sash: '#4a3222',
  brass: '#c9a24a',
  gold: '#d4a83a',
  trousers: '#5a3a26',
  boot: '#1c1a18',
  bootTop: '#2e2a28',
  sole: '#0f0d0c',
  steel: '#a0a4aa',
  edge: '#d0d4d8',
  grip: '#2a2a2e',
  pistolWood: '#5a3a24',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const norm3 = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints of the bandit rig in the frame where the weapon arm is on the left (+X); the build mirrors them.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.18, 0.332, 0.012];
const WRIST_R: V3 = [-0.205, 0.238, 0.03];
const ELBOW_L: V3 = [0.19, 0.335, 0.02];
const WRIST_L: V3 = [0.218, 0.262, 0.07];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left boot (y = 0), measured on the SDF: heel and toe.
// The toe turns out 12 degrees, so the toe point sits outboard of the heel.
const SOLE_HEEL: V3 = [0.093, 0, -0.024];
const SOLE_TOE: V3 = [0.108, 0, 0.085];

/** A fist hanging from the wrist `w`; `s` mirrors it for the right hand. Its grip hole runs along Z. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.038, 0.043, 0.044]).at(...o(0.007, -0.038, 0.004)),
    sdf.capsule(o(-0.009, -0.058, 0.03), o(-0.005, -0.038, 0.042), 0.017),
    sdf.cone(o(0.02, -0.023, 0.025), o(0.001, -0.033, 0.048), 0.016, 0.013),
  );
};

// The tricorn's brim (from the highwayman): a thin sheet whose height follows three folds. Points
// droop at +-60 degrees (over the ears) and at the back; the flaps between them fold up (the front
// one lower, so the crown shows a dip between two humps). `a` is 1 on a flap and 0 on a point.
const HAT_BASE = 0.775;
const smooth01 = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
const bumpAt = (th: number, c: number, w: number) => {
  let d = Math.abs(th - c) % (2 * Math.PI);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return Math.exp(-((d / w) * (d / w)));
};
const flap = (th: number) => Math.max(bumpAt(th, 0.5, 0.75), bumpAt(th, -0.5, 0.75), 0.6 * bumpAt(th, Math.PI, 0.7));
const brimAt = (x: number, z: number) => {
  const r = Math.hypot(x, z);
  const th = Math.atan2(x, z);
  const a = flap(th);
  const s = smooth01((r - 0.14) / 0.18);
  return { r, th, a, y: HAT_BASE + s * (-0.05 + 0.24 * a), edge: 0.27 + 0.04 * (1 - a) };
};
const HAT_BOX = { min: [-0.4, 0.62, -0.4], max: [0.4, 1.05, 0.4] } as const;
const brimSheet = new Sdf(
  (x, y, z) => {
    const b = brimAt(x, z);
    return Math.max((Math.abs(y - b.y) - 0.01) / 2.6, b.r - b.edge);
  },
  { min: [...HAT_BOX.min], max: [...HAT_BOX.max] },
);
// The gold rim: the outer 0.012 m of the brim sheet, a little thicker than the sheet.
const trimSheet = new Sdf(
  (x, y, z) => {
    const b = brimAt(x, z);
    return Math.max((Math.abs(y - b.y) - 0.026) / 2.6, b.r - b.edge - 0.006, b.edge - 0.007 - b.r, 0.75 - b.a);
  },
  { min: [...HAT_BOX.min], max: [...HAT_BOX.max] },
);

export default defineAsset({
  name: 'pirate-captain',
  description: 'Chibi pirate captain enemy: a black tricorn with a gold rim and a skull badge, a red bandana, an eye patch, a big black beard with beaded braids, a long open red coat with gold buttons and cream cuffs, a flintlock pistol and a cutlass.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/pirate-captain_001.jpg',
  variants: {
    coat: { red: C.coat, blue: '#22305a', black: '#201e22' },
    bandana: { red: C.bandana, black: '#24201c', gold: '#c8a030' },
    trim: { gold: C.trim, silver: '#c0c4c8', none: '#26221f' },
  },
  presets: {
    pirate: { coat: 'red', bandana: 'red', trim: 'gold' },
    navy: { coat: 'blue', bandana: 'black', trim: 'silver' },
    ghost: { coat: 'black', bandana: 'gold', trim: 'none' },
  },

  build(k) {
    const T = {
      coat: k.tint('coat'),
      coatLit: k.tint('coat', { color: C.coatLit, follow: 1 }),
      coatDark: k.tint('coat', { color: C.coatDark, follow: 1 }),
      band: k.tint('bandana'),
      bandDark: k.tint('bandana', { color: C.bandanaDark, follow: 1 }),
      trim: k.tint('trim'),
    };
    const CUT_TILT = 14;
    const CUT_YAW = 12;
    const GRIP: V3 = [WRIST_L[0] + 0.007, WRIST_L[1] - 0.045, WRIST_L[2] + 0.02];
    const KNOT: V3 = [-0.175, 0.72, -0.05];
    // The final joints: the cutlass arm is the right arm (x < 0), the free arm the left arm.
    const EL_L = mx(ELBOW_R);
    const WR_L = mx(WRIST_R);
    const EL_R = mx(ELBOW_L);
    const WR_R = mx(WRIST_L);
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      knot: { parent: 'head', at: KNOT, tail: [-0.27, 0.66, -0.05] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: EL_L },
      'hand.L': { parent: 'forearm.L', at: WR_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: EL_R },
      'hand.R': { parent: 'forearm.R', at: WR_R },
      cutlassbone: { parent: 'hand.R', at: mx(GRIP) },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and face
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const NOSE_Y = 0.588;
    const nose = sdf.ellipsoid([0.034, 0.03, 0.03]).at(0, NOSE_Y, faceZ(0, NOSE_Y) - 0.002).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.048, 0.034])
        .subtract(sdf.sphere(0.019).at(0.018, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.61, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, EL_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(EL_L, WR_L, 0.036, 0.032).bone('forearm.L'),
      fistAt(WR_L, 1).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), EL_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(EL_R, WR_R, 0.036, 0.032).bone('forearm.R'),
      fistAt(WR_R, -1).bone('hand.R'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.028, 0.027, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.024, 0.025, 0.07]), EYE[0], EYE[1] - 0.002));
    const iris = pair(at(sdf.ellipsoid([0.02, 0.0215, 0.07]), EYE[0], EYE[1] - 0.003));
    const pupil = pair(at(sdf.ellipsoid([0.0145, 0.016, 0.07]), EYE[0], EYE[1] - 0.002));
    const shine = sdf.union(...[EYE[0], -EYE[0]].map((x) => at(sdf.sphere(0.005), x + 0.007, EYE[1] + 0.007)));
    // Thick black brows: the one over the patch is level and heavy, the other is raised in an arch.
    const browAt = (sgn: number, pts: readonly [number, number][]) =>
      sdf.extrude(profile.polygon(pts.map(([x, y]) => [x * sgn, y] as [number, number]), { smooth: true, samples: 4 }), 0.3).at(0, 0, 0.1);
    const brows = sdf.union(
      browAt(-1, [
        [0.17, 0.708],
        [0.125, 0.716],
        [0.078, 0.704],
        [0.045, 0.684],
        [0.049, 0.668],
        [0.082, 0.684],
        [0.125, 0.696],
        [0.167, 0.692],
      ]),
      browAt(1, [
        [0.168, 0.724],
        [0.13, 0.744],
        [0.09, 0.742],
        [0.055, 0.716],
        [0.058, 0.7],
        [0.09, 0.714],
        [0.13, 0.724],
        [0.164, 0.71],
      ]),
    );
    // A half-lid over the small eye: the upper half of the eye ring in a slightly darker skin tone.
    const lids = pair(at(sdf.ellipsoid([0.031, 0.03, 0.07]), EYE[0], EYE[1])).intersect(sdf.halfSpace([0, -1, 0], -(EYE[1] + 0.004)));
    const MOUTH_Y = 0.522;
    const mouth = sdf.extrude(profile.arc(0.12, 0.009, 256, 284), 0.5).at(0, MOUTH_Y + 0.12, 0.15);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(pair(sdf.ellipsoid([0.05, 0.04, 0.05]).at(0.08, 0.562, faceZ(0.08, 0.562))), C.blush, 0.02)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(pupil, C.pupil)
      .paintWhere(shine, '#ffffff')
      .paintWhere(lids, '#dcae86', 0.002)
      .paintWhere(sdf.ellipsoid([0.036, 0.032, 0.036]).at(0, NOSE_Y, faceZ(0, NOSE_Y)), C.blush, 0.012)
      .paintWhere(sdf.sphere(0.0075).at(0.088, 0.582, faceZ(0.088, 0.582)), C.beard, 0.001)
      .paintWhere(brows, C.beard)
      .paintWhere(mouth, C.mouth, 0.002);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ tricorn, bandana, eyepatch
    // The highwayman's construction: a low round crown on a thin brim sheet whose height follows three
    // folds (see brimAt). The gold rim is a separate thin band along the brim edge.
    const crown = sdf.cylinder(0.19, 0.12, 0.06).scale([1.02, 1, 0.96]).at(0, 0.842, -0.005);
    const hat = sdf.smoothUnion(0.02, crown, brimSheet.round(0.005)).paintWhere(sdf.halfSpace([0, -1, 0], -0.9), C.hatLit, 0.008);
    k.body('hat', hat, { color: C.hat, roughness: 0.6, detail: 0.005, bone: 'head', bump: (x, y, z) => 0.0004 * noise.noise3(x * 90, y * 90, z * 90) });
    k.body('hat-trim', trimSheet, { color: T.trim, roughness: 0.35, metalness: 0.8, bone: 'head', detail: 0.004 });
    // The skull badge on the raised flap at the character's left (x > 0), lying on the brim surface,
    // facing forward and outward along the surface normal.
    const BTH = 0.5;
    const BR = 0.245;
    const bx = BR * Math.sin(BTH);
    const bz = BR * Math.cos(BTH);
    const by = brimAt(bx, bz).y;
    const gx = (brimAt(bx + 0.004, bz).y - brimAt(bx - 0.004, bz).y) / 0.008;
    const gz = (brimAt(bx, bz + 0.004).y - brimAt(bx, bz - 0.004).y) / 0.008;
    const bn = norm3([gx, -1, gz]); // the underside of the flap, which faces forward and outward
    const bPitch = (Math.asin(bn[1]) * 180) / Math.PI;
    const bYaw = (Math.atan2(bn[0], bn[2]) * 180) / Math.PI;
    const skullLocal = sdf
      .union(sdf.extrude(profile.circle(0.023), 0.02, 0.006), sdf.extrude(profile.rect([0.028, 0.022], 0.008), 0.02, 0.006).at(0, -0.023, 0))
      .subtract(
        sdf.union(
          sdf.extrude(profile.circle(0.0062), 0.2).at(-0.0088, -0.002, 0),
          sdf.extrude(profile.circle(0.0062), 0.2).at(0.0088, -0.002, 0),
          sdf.extrude(profile.polygon([[0, -0.008], [0.0042, -0.016], [-0.0042, -0.016]]), 0.2),
        ),
      );
    const skull = skullLocal.scale(1.4).rotateX(-bPitch).rotateY(bYaw).at(bx + bn[0] * 0.03, by + bn[1] * 0.03, bz + bn[2] * 0.03);
    k.body('skull', skull, { color: C.bone, roughness: 0.7, bone: 'head', detail: 0.003 });
    // The bandana band under the brim, and a small knot at the back on the knot bone.
    const band = head
      .round(0.014)
      .subtract(head)
      .intersect(sdf.box([0.6, 0.115, 0.6]).at(0, 0.8025, 0));
    k.body('bandana', band.bone('head'), { color: T.band, roughness: 0.85, detail: 0.004 });
    const bandKnot = sdf.ellipsoid([0.03, 0.028, 0.024]).at(-0.165, 0.765, -0.075);
    k.body('bandana-knot', bandKnot.bone('knot'), { color: T.bandDark, roughness: 0.85, detail: 0.004 });
    // The eyepatch over the eye at x < 0, with a strap up over the brow and one toward the ear.
    const stroke = (a: [number, number], b: [number, number], w: number) => {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l = Math.hypot(dx, dy);
      const nx = (-dy / l) * w;
      const ny = (dx / l) * w;
      return profile.polygon([
        [a[0] + nx, a[1] + ny],
        [b[0] + nx, b[1] + ny],
        [b[0] - nx, b[1] - ny],
        [a[0] - nx, a[1] - ny],
      ]);
    };
    const strapSlab = sdf
      .union(sdf.extrude(stroke([-0.105, 0.636], [0.16, 0.742], 0.01), 0.5), sdf.extrude(stroke([-0.105, 0.62], [-0.22, 0.66], 0.01), 0.5))
      .intersect(sdf.box([1, 1, 0.5]).at(0, 0.7, 0.25));
    const strap = head.round(0.011).subtract(head).intersect(strapSlab);
    const patchDisc = at(sdf.ellipsoid([0.066, 0.058, 0.038]).rotateZ(-14), -EYE[0], EYE[1] + 0.002);
    k.body('patch', sdf.smoothUnion(0.01, patchDisc, strap).bone('head'), { color: C.patch, roughness: 0.5, detail: 0.004 });

    // ------------------------------------------------------------------ beard and mustache
    // A wide rounded bib under the chin with two cheek lobes at the jaw corners; the mouth and the
    // upper cheeks stay bare skin. The mustache is its own body in front of the beard, lighter, with
    // an upward-lit top so it separates from the beard.
    const beardRegion = sdf.extrude(
      profile.polygon([
        [-0.3, 0.572],
        [-0.19, 0.56],
        [-0.13, 0.546],
        [-0.07, 0.532],
        [0.07, 0.532],
        [0.13, 0.546],
        [0.19, 0.56],
        [0.3, 0.572],
        [0.3, 0.3],
        [-0.3, 0.3],
      ]),
      0.6,
    );
    const beardShell = head.round(0.03).subtract(head).intersect(beardRegion).smoothIntersect(0.03, sdf.ellipsoid([0.225, 0.2, 0.16]).at(0, 0.5, 0.09));
    const bib = sdf.ellipsoid([0.16, 0.115, 0.08]).at(0, MOUTH_Y - 0.03, 0.064);
    const cheekLobes = pair(sdf.sphere(0.064).at(0.11, 0.5, 0.045));
    const mouthCut = sdf.ellipsoid([0.05, 0.028, 0.08]).at(0, MOUTH_Y + 0.004, faceZ(0, MOUTH_Y) + 0.03);
    const beard = sdf.smoothUnion(0.02, beardShell, bib, cheekLobes).subtract(mouthCut);
    // Two thick curled mustache lobes from the nose center out to x +-0.09, the tips curling up.
    const mustache = pair(
      sdf.chain(
        (
          [
            [0.006, 0.561, 0.02],
            [0.04, 0.55, 0.02],
            [0.075, 0.549, 0.018],
            [0.098, 0.562, 0.015],
            [0.108, 0.586, 0.012],
          ] as const
        ).map(([x, y, r]) => [x, y, faceZ(x, y) + 0.024, r] as [number, number, number, number]),
        0.012,
      ),
    );
    const bdDark = rgb(C.beard);
    const mDark = rgb(C.mustache);
    const topLit = rgb(C.beardLit);
    const strands = (x: number, y: number, z: number) => 0.003 * Math.sin(x * 210 + y * 30 + noise.noise3(x * 25, y * 25, z * 25) * 4) + 0.0008 * noise.fbm(x * 90, y * 90, z * 90, 2);
    // Base color plus a top light on every upward-facing part (measured from the shape's own normal).
    const hairPaint = (shape: sdf.Shape, base: ReturnType<typeof rgb>, streakAmount: number) =>
      shape.paintFn((x, y, z) => {
        const n = sdf.normalAt(shape, [x, y, z]);
        const up = Math.max(0, n[1] - 0.15) / 0.85;
        const streak = 0.5 + 0.5 * Math.sin(x * 260 + y * 40 + noise.noise3(x * 30, y * 30, z * 30) * 4);
        const t = Math.min(1, up * 1.3 + streak * streakAmount);
        return mixRgb(base, topLit, t);
      });
    k.body('mustache', hairPaint(mustache, mDark, 0.12).bone('head'), { color: C.mustache, roughness: 0.6, detail: 0.004, bump: strands });
    const hairRegion = sdf.box([0.7, 0.34, 0.3]).rotateX(25).at(0, 0.72, -0.13);
    const hair = head.round(0.012).subtract(head).intersect(hairRegion);
    k.body('hair', hairPaint(hair, bdDark, 0.1).bone('head'), { color: C.beard, roughness: 0.7, detail: 0.005, bump: strands });
    k.body('beard', hairPaint(beard, bdDark, 0.1).bone('head'), { color: C.beard, roughness: 0.7, detail: 0.005, bump: strands });

    // ------------------------------------------------------------------ shirt, vest, coat, neckerchief
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.124, 0.29],
            [0.13, 0.25],
            [0.138, 0.21],
            [0.14, 0.196],
            [0.13, 0.186],
            [0, 0.186],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    k.body('shirt', torso.bone('spine'), { color: C.shirt, roughness: 0.85 });
    const vest = torso
      .round(0.012)
      .subtract(torso.round(0.001))
      .intersect(sdf.halfSpace([0, 1, 0], 0.44))
      .intersect(sdf.halfSpace([0, -1, 0], -0.215))
      .smoothSubtract(
        0.006,
        sdf
          .extrude(
            profile.polygon([
              [-0.03, 0.46],
              [0.03, 0.46],
              [0, 0.4],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      )
      .subtract(pair(sdf.ellipsoid([0.06, 0.07, 0.07]).at(0.13, 0.38, 0)))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.235), C.vestDark, 0.004);
    k.body('vest', vest.bone('chest'), { color: C.vest, roughness: 0.6 });

    // The coat: a long heavy coat, a shell around the torso from the collar (y 0.5) to the hem
    // (y 0.09), flared (r 0.19 at the hip to 0.24 at the hem), open in front with a back slit.
    const hw = (y: number) => 0.05 + (0.5 - y) * 0.07; // the coat's half opening at height y (see wedge)
    const wedge = sdf
      .extrude(
        profile.polygon([
          [-hw(0.5), 0.5],
          [hw(0.5), 0.5],
          [hw(0.08), 0.08],
          [-hw(0.08), 0.08],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const coatChestFull = torso.round(0.026).subtract(torso.round(0.008)).intersect(sdf.halfSpace([0, -1, 0], -0.19));
    const coatChest = coatChestFull.smoothSubtract(0.008, wedge).bone('spine');
    // The skirt runs from the waist to just above the boot tops (hem y 0.14), open in front and split at the back.
    const skirtOuter = sdf.revolve(
      profile.polygon(
        [
          [0, 0.34],
          [0.16, 0.34],
          [0.178, 0.28],
          [0.19, 0.22],
          [0.213, 0.18],
          [0.232, 0.14],
          [0, 0.14],
        ],
        { smooth: true, samples: 4 },
      ),
    );
    const skirtInner = sdf.revolve(
      profile.polygon([
        [0, 0.37],
        [0.14, 0.37],
        [0.16, 0.28],
        [0.172, 0.22],
        [0.194, 0.17],
        [0.212, 0.1],
        [0, 0.1],
      ]),
    );
    const skirt = skirtOuter
      .subtract(skirtInner)
      .scale([1, 1, 0.84])
      .smoothSubtract(0.008, wedge)
      .subtract(sdf.box([0.04, 0.34, 0.3]).at(0, 0.15, -0.15));
    const skirtL = skirt.intersect(sdf.box([0.5, 0.5, 0.6]).at(0.25, 0.2, 0)).bone('leg.L');
    const skirtR = skirt.intersect(sdf.box([0.5, 0.5, 0.6]).at(-0.25, 0.2, 0)).bone('leg.R');
    // Straight sleeves (r 0.05 to 0.045) ending in a wide cream cuff ring at the wrist.
    const sleeve = (s: V3, e: V3, w: V3, tag: string) => {
      const start: V3 = [s[0] * 0.85, 0.405, 0];
      const cuffAt = lerp(e, w, 0.8);
      const d = norm3([w[0] - e[0], w[1] - e[1], w[2] - e[2]]);
      const cuff = sdf
        .cylinder(0.057, 0.056, 0.015)
        .subtract(sdf.cylinder(0.04, 0.3))
        .rotateX((Math.asin(d[2]) * 180) / Math.PI)
        .rotateZ((Math.atan2(-d[0], d[1]) * 180) / Math.PI)
        .at(...cuffAt)
        .bone(tag.replace('upperarm', 'forearm'));
      const upper = sdf.cone(start, e, 0.05, 0.048);
      const lower = sdf.cone(e, lerp(e, w, 0.9), 0.048, 0.045);
      return { coat: sdf.smoothUnion(0.01, upper.bone(tag), lower.bone(tag.replace('upperarm', 'forearm'))), cuff };
    };
    // The standing collar: two tall rounded boxes behind and beside the neck, in the dark red.
    const collarBox = (sgn: number) => sdf.box([0.1, 0.14, 0.034], 0.013).rotateZ(sgn * 12).rotateY(-sgn * 30).at(sgn * 0.11, 0.525, -0.03).paint(T.coatDark);
    const standing = sdf.union(collarBox(1), collarBox(-1)).bone('chest');
    // Two folded lapels on the chest opening, the lower ends turned 25 degrees outward.
    const lapel = (sgn: number) => {
      const x = sgn * (hw(0.42) + 0.045);
      const z = sdf.raycast(coatChestFull, [x, 0.42, 1], [0, 0, -1])![2];
      return sdf.box([0.07, 0.12, 0.022], 0.009).rotateZ(sgn * 25).rotateY(sgn * 28).at(x, 0.42, z + 0.006).paint(T.coatLit);
    };
    const lapels = sdf.union(lapel(1), lapel(-1)).bone('chest');
    const sleeveL = sleeve(SHOULDER, EL_L, WR_L, 'upperarm.L');
    const sleeveR = sleeve(mx(SHOULDER), EL_R, WR_R, 'upperarm.R');
    const coat = sdf.smoothUnion(0.01, coatChest, skirtL, skirtR, standing, lapels, sleeveL.coat, sleeveR.coat);
    k.body('coat', coat.paintWhere(wedge.round(0.016), T.coatLit, 0.006).paintWhere(sdf.halfSpace([0, 1, 0], 0.16), T.coatLit, 0.01), { color: T.coat, roughness: 0.6, detail: 0.007, bump: (x, y, z) => 0.0006 * noise.fbm(x * 70, y * 70, z * 70, 2) });
    k.body('cuffs', sdf.union(sleeveL.cuff, sleeveR.cuff), { color: C.bone, roughness: 0.85, detail: 0.005 });
    // The grey neck cloth: a flat rounded box hanging from the collar over the shirt.
    const clothZ = sdf.raycast(torso, [0, 0.335, 1], [0, 0, -1])![2];
    const neckcloth = sdf.box([0.07, 0.085, 0.018], 0.008).rotateX(-6).at(0, 0.335, clothZ + 0.004);
    k.body('neckcloth', neckcloth.bone('spine'), { color: C.cloth, roughness: 0.85, detail: 0.005 });
    // Two plaited braids hanging from the beard bottom at x = +-0.05: a zigzag chain of small spheres
    // each, 0.1 m long, with a gold bead at the tip. They lie on the shirt and the neck cloth.
    const braidP = (s: number, i: number): [number, number, number, number] => {
      const t = i / 6;
      const y = 0.41 - 0.1 * t;
      const z = sdf.raycast(torso, [0, y, 1], [0, 0, -1])![2] + 0.014;
      return [s * (0.052 + (i % 2 ? 0.005 : -0.005)), y, z, 0.0105 * (1 - 0.1 * t)];
    };
    const braids = sdf.union(...[1, -1].map((s) => sdf.chain([0, 1, 2, 3, 4, 5, 6].map((i) => braidP(s, i)), 0.005)));
    k.body('braids', hairPaint(braids, bdDark, 0.1).bone('spine'), { color: C.beard, roughness: 0.7, detail: 0.004, bump: strands });

    // ------------------------------------------------------------------ trousers, boots
    const trousers = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.055, 0.088]).at(0, 0.205, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.11, 0.004], 0.05).bone('leg.L')),
    );
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.85 });
    // Tall boots: the shoe follows the foot bone, the shaft and the folded top the shin bone.
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.052, 0.09, 0.02).at(0, 0.055, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootShaft = sdf.smoothUnion(
      0.012,
      sdf.cone([0, 0.05, 0], [0, 0.112, 0], 0.058, 0.062),
      sdf.cylinder(0.072, 0.036, 0.014).at(0, 0.118, 0),
    );
    const boot = sdf
      .smoothUnion(0.02, bootFoot.bone('foot.L'), bootShaft.bone('shin.L'))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole, 0.004)
      .paintWhere(sdf.halfSpace([0, -1, 0], -0.102), C.bootTop, 0.004)
      .rotateY(12)
      .at(ANKLE[0], 0, 0);
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.55, detail: 0.007 });

    // ------------------------------------------------------------------ belt, sash, pistol, brass
    const beltY = 0.24;
    const belt = torso.round(0.02).smoothIntersect(0.006, sdf.box([0.5, 0.058, 0.5], 0.006).at(0, beltY, 0));
    k.body('leather', belt.bone('spine'), { color: C.belt, roughness: 0.6 });
    // The diagonal strap across the chest, from the upper right shoulder to the left hip.
    const sashSlab = sdf.extrude(stroke([-0.1, 0.45], [0.09, 0.23], 0.019), 0.5).intersect(sdf.box([1, 1, 0.5]).at(0, 0.3, 0.25));
    const sash = torso.round(0.021).subtract(torso.round(0.004)).intersect(sashSlab);
    k.body('sash', sash.bone('spine'), { color: C.sash, roughness: 0.65, detail: 0.005 });
    // The flintlock pistol tucked in the belt on the left hip: a brass butt cap and a curved wooden
    // grip above the belt, a holster below it and the dark barrel end below that.
    const PX = 0.11;
    const zHi = sdf.raycast(coat, [PX, 0.29, 1], [0, 0, -1])![2];
    const zLo = sdf.raycast(coat, [PX, 0.15, 1], [0, 0, -1])![2];
    const PTILT = (Math.atan2(zLo - zHi, 0.14) * 180) / Math.PI;
    const pistolAt = (s: sdf.Shape) => s.rotateX(-PTILT).rotateZ(-4).at(PX, 0.21, (zHi + zLo) / 2 + 0.016);
    const pistolWood = sdf.union(
      sdf.chain(
        [
          [0, 0.075, -0.006, 0.014],
          [0, 0.055, 0.004, 0.017],
          [0, 0.035, 0.006, 0.018],
        ],
        0.01,
      ),
      sdf.box([0.048, 0.07, 0.036], 0.014).at(0, -0.005, 0),
    );
    k.body('pistol-wood', pistolAt(pistolWood), { color: C.pistolWood, roughness: 0.65, bone: 'spine', detail: 0.004 });
    k.body('pistol', pistolAt(sdf.cylinder(0.011, 0.05, 0.004).at(0, -0.055, 0.004)), { color: '#2a2a2e', roughness: 0.4, metalness: 0.6, bone: 'spine', detail: 0.004 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.09, 0.062, 0.014], 0.007).subtract(sdf.box([0.056, 0.036, 0.05], 0.005)), sdf.box([0.008, 0.038, 0.012], 0.003).at(0.005, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    // Gold buttons in two columns down the coat edges, the butt cap of the pistol, and the braid beads.
    const buttons = sdf.union(
      ...[0.43, 0.375, 0.32, 0.265].flatMap((y) =>
        [1, -1].map((s) => {
          const x = s * (hw(y) + 0.026);
          const z = sdf.raycast(coat, [x, y, 1], [0, 0, -1])![2];
          return sdf.sphere(0.0125).at(x, y, z + 0.002);
        }),
      ),
    );
    const cap = pistolAt(sdf.sphere(0.021).at(0, 0.09, -0.004));
    const beads = sdf.union(...[1, -1].map((s) => { const b = braidP(s, 6); return sdf.sphere(0.0125).at(b[0], b[1] - 0.012, b[2]); }));
    k.body('brass', sdf.union(buckle, buttons, cap, beads), { color: C.brass, roughness: 0.35, metalness: 0.8, detail: 0.004, bone: 'spine' });

    // ------------------------------------------------------------------ the cutlass (right hand)
    // Local frame: the grip at the origin, the blade forward along +X with a curved edge below;
    // built for the left hand of the bandit, then mirrored to the right hand.
    // A stubby hook: 0.32 m long from the guard, 0.07 m wide at the belly, the last third curling
    // strongly up (the centerline turns from 8 to about 85 degrees).
    const bladePts = (n: number) => {
      const top: [number, number][] = [];
      const bottom: [number, number][] = [];
      let cx = 0.03;
      let cy = 0;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const h = Math.max(0, (t - 0.6) / 0.4);
        const ang = ((8 + 80 * h * h) * Math.PI) / 180;
        if (i > 0) {
          cx += (0.32 / n) * Math.cos(ang);
          cy += (0.32 / n) * Math.sin(ang);
        }
        const w = (0.022 + 0.048 * Math.sin(Math.PI * Math.min(1, t * 0.8 + 0.14))) * (t > 0.8 ? Math.max(0.1, (1 - t) / 0.2) : 1);
        top.push([cx - Math.sin(ang) * w * 0.55, cy + Math.cos(ang) * w * 0.55]);
        bottom.push([cx + Math.sin(ang) * w * 0.45, cy - Math.cos(ang) * w * 0.45]);
      }
      return [...top, ...bottom.reverse()];
    };
    const bladeLocal = sdf.extrude(profile.polygon(bladePts(24)), 0.016, 0.005);
    const bladeEdge = bladeLocal.subtract(bladeLocal.at(0, 0.012, 0));
    const guardLocal = sdf.union(
      sdf.sphere(0.052).shell(0.012).intersect(sdf.halfSpace([-1, 0, 0], -0.02)).at(0.025, 0, 0), // cup guard
      sdf.sphere(0.018).at(-0.066, 0, 0), // pommel
    );
    const gripLocal = sdf.capsule([-0.06, 0, 0], [0.04, 0, 0], 0.014);
    const cutlassPose = (s: sdf.Shape) => {
      const posed = s.rotateY(-90).rotateX(CUT_TILT).rotateY(CUT_YAW).at(...GRIP);
      return posed.mirror('x', 0).intersect(sdf.halfSpace([1, 0, 0], 0));
    };
    k.body('cutlass', cutlassPose(bladeLocal.paintWhere(bladeEdge, C.edge, 0.002)), { color: C.steel, roughness: 0.4, metalness: 0.8, detail: 0.004, bone: 'cutlassbone' });
    k.body('guard', cutlassPose(guardLocal), { color: C.brass, roughness: 0.35, metalness: 0.8, detail: 0.004, bone: 'cutlassbone' });
    k.body('hilt', cutlassPose(gripLocal), { color: C.grip, roughness: 0.7, detail: 0.004, bone: 'cutlassbone' });


    // ------------------------------------------------------------------ animation
    // The clips are the bandit's, written for a cutlass arm on the left; mirrorPose moves them to
    // the right arm, so `upperarm.L` below drives the right arm, and `.R` the left arm.
    type AnimSpec = Parameters<typeof k.animation>[1];
    const anim = (name: string, spec: AnimSpec) => k.animation(name, { ...spec, pose: (t, p) => motion.mirrorPose(spec.pose(t, p)) });
    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    anim('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // Shifty: the head glances from side to side.
        head: { rotate: [0, 12 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        knot: { rotate: [4 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-4 * bump(p), 0, 0] },
      }),
    });

    // The legs come from motion.gait: planted stance boots, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `footLift` the swing height, `duty` the share of the
    // cycle a foot is down (a run has a flight between steps), `bob` the hips bob. The gait phase
    // runs a quarter cycle behind the clip, so the left heel strikes at p = 0.25, when the left arm
    // (the cutlass arm) is back. The hips' sway goes to gait, so the planted feet do not slide.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 10,
          heel: SOLE_HEEL,
          toe: SOLE_TOE,
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          // The sack and the mask tails swing a little after the steps.
          knot: { rotate: [lean * 1.5 + 6 * wave(p, 2, 0.2), 0, 6 * wave(p, 2, 0.1)] as const },
          'upperarm.L': { rotate: [armSwing * 0.3 * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * 0.4 * s, 0, -6] as const },
          'forearm.R': { rotate: [-armSwing * 0.3, 0, 0] as const },
        };
      },
    });
    // A sneaky thief: short, light steps with a low swing; the run is quick with a flight phase.
    anim('walk', stride(0.9, 0.1, 0.025, 0.6, 0.006, 26, 3));
    anim('run', stride(0.56, 0.15, 0.045, 0.4, 0.03, 46, 12));

    // Attack: a strong left-handed diagonal slash with the cutlass, solved by targets (the mirror of
    // the animated armor's cut). The wrist follows its keys (reach); the blade follows its own keys
    // (orient). The keys are in the chest's frame: the hips and the chest turn the whole arm.
    // Wind-up: the chest turns to the left, the weight goes back onto the left foot, and the cutlass
    // rises high over the left shoulder with the tip back behind the head, for a short hold.
    // Cut (about 0.12 s): the blade comes up over the shoulder and down across the front, from high
    // left to low right (high right to low left in the front view), as the right foot steps in and
    // the chest unwinds. Follow-through: the blade runs on past the right hip and slows, then
    // recovers to rest. edgeUp turns the flat so the curved edge leads the cut; the back of the
    // blade leads the lift and the recovery.
    const { keys, reach, orient, edgeUp } = motion;
    const norm = (a: V3): V3 => {
      const l = Math.hypot(a[0], a[1], a[2]);
      return [a[0] / l, a[1] / l, a[2] / l];
    };
    // The cutlass's rest frame, from the turns in cutlassPose: the blade runs along local +X, and
    // the flat's normal is the extrude axis, local +Z.
    const cutlassTurn = (v: V3): V3 => {
      const w = new THREE.Vector3(...v)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(-90))
        .applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(CUT_TILT))
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(CUT_YAW));
      return [w.x, w.y, w.z];
    };
    const BLADE_DIR = cutlassTurn([1, 0, 0]); // out to the left, forward, a little down
    const FLAT = cutlassTurn([0, 0, 1]); // forward and to the right
    // The flat's normal through the cut (up and to the right). edgeUp keeps its sign on this side,
    // so the edge leads the whole cut and never flips when the blade points straight forward.
    const CUT_FLAT = norm([-0.6, 0.75, 0]);
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const bladeKeys = [
      [0, BLADE_DIR],
      [0.12, norm([0.75, 0.62, 0.22])], // out to the left and rising
      [0.24, norm([0.3, 0.75, -0.6])], // up and back over the left shoulder
      [0.3, norm([0.28, 0.72, -0.64])], // the top: the tip back behind the head
      [0.39, norm([0.24, 0.7, -0.67])], // the hold, cocked a little further
      [0.44, norm([0.45, 0.88, 0.1])], // up over the shoulder
      [0.48, norm([0.58, 0.52, 0.62])], // high on the left, pointing forward and up
      [0.51, norm([-0.08, -0.1, 0.99])], // forward, below the chin, cutting down and across
      [0.54, norm([-0.6, -0.3, 0.7])], // low right, the end of the fast cut
      [0.62, norm([-0.7, -0.3, 0.55])], // on past the right hip, slowing
      [0.72, norm([-0.7, -0.3, 0.55])],
      [0.86, norm([0.35, 0.02, 0.94])], // the recovery lifts the tip forward, clear of the ground
      [1, BLADE_DIR],
    ] as const;
    const bladeAt = (p: number) => keys(p, bladeKeys, 'spline');
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    anim('attack', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_L],
            [0.12, [0.25, 0.36, 0.04]], // out to the left, rising
            [0.24, [0.245, 0.47, -0.045]],
            [0.3, [0.25, 0.48, -0.06]], // the top, high over the left shoulder
            [0.39, [0.25, 0.485, -0.065]], // the hold
            [0.44, [0.265, 0.475, 0.0]], // up over the shoulder
            [0.48, [0.26, 0.45, 0.06]], // high on the left, in front
            [0.51, [0.185, 0.385, 0.15]],
            [0.54, [0.12, 0.335, 0.165]], // low right, the end of the fast cut
            [0.62, [0.11, 0.32, 0.16]], // the follow-through slows
            [0.72, [0.115, 0.32, 0.16]],
            [0.86, [0.2, 0.3, 0.13]], // out and forward, so the pommel stays off the vest
            [1, WRIST_L],
          ] as const,
          'spline',
        );
        const dir = norm(bladeAt(p));
        // The flat turns from its rest side to the cut side in the lift, and back to rest at the
        // end, so the first and the last frame are the rest pose.
        const lead = ease(0.14, 0.3, p) * (1 - ease(0.74, 0.94, p));
        const cutUp = edgeUp(bladeAt, p, CUT_FLAT);
        const up = norm([FLAT[0] + (cutUp[0] - FLAT[0]) * lead, FLAT[1] + (cutUp[1] - FLAT[1]) * lead, FLAT[2] + (cutUp[2] - FLAT[2]) * lead]);
        // The elbow points out and down (its rest side), out, up, and back in the wind-up, then out
        // and forward through the cut, so the forearm stays clear of the head and the vest.
        const POLE_REST: V3 = [SHOULDER[0] + 4 * (ELBOW_L[0] - SHOULDER[0]), SHOULDER[1] + 4 * (ELBOW_L[1] - SHOULDER[1]), SHOULDER[2] + 4 * (ELBOW_L[2] - SHOULDER[2])];
        const pole = keys(p, [[0, POLE_REST], [0.24, [0.6, 0.35, -0.2]], [0.42, [0.6, 0.35, -0.15]], [0.5, [0.5, 0.05, 0.5]], [0.74, [0.45, -0.05, 0.5]], [1, POLE_REST]] as const);
        const arm = reach(ARM_L, wrist, pole);
        const hand = orient([arm.upper, arm.lower], { dir: BLADE_DIR, up: FLAT }, { dir, up });
        const wind = ease(0, 0.28, p) * (1 - ease(0.4, 0.5, p));
        const cut = ease(0.41, 0.54, p) * (1 - ease(0.72, 1, p));
        // The sack and the mask tails lag behind the turn of the body.
        const swing = ease(0.46, 0.64, p) * (1 - ease(0.74, 1, p));
        return {
          // Wind-up: the hips shift back and onto the left (back) foot. Cut: they drive forward.
          hips: { move: [0.012 * wind - 0.01 * cut, -legDrop(LEG, 16 * cut) - 0.006 * wind, 0.035 * cut - 0.012 * wind], rotate: [0, 8 * wind - 18 * cut, 0] },
          spine: { rotate: [-5 * wind + 10 * cut, -6 * cut, 0] },
          chest: { rotate: [-5 * wind + 5 * cut, 14 * wind - 16 * cut, 0] },
          head: { rotate: [-2 * wind + 4 * cut, -8 * wind + 16 * cut, 0] },
          knot: { rotate: [-6 * wind + 14 * swing, 0, 6 * wind - 10 * swing] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
          // The empty right arm reaches forward and out for balance, then pulls back to the sack.
          'upperarm.R': { rotate: [-18 * wind + 8 * cut, 0, -12 * wind] },
          'forearm.R': { rotate: [-14 * wind, 0, 0] },
          // The right (front) foot is light in the wind-up and steps in on the cut; the left leg
          // takes the weight, then pushes back.
          'leg.R': { rotate: [-6 * wind - 22 * cut, 0, 0] },
          'leg.L': { rotate: [-3 * wind + 12 * cut, 0, 0] },
          'foot.R': { rotate: [6 * wind + 16 * cut, 0, 0] },
          'foot.L': { rotate: [3 * wind - 8 * cut, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    // The head and the chest snap back and the hips give way: the left foot stays planted and the
    // right foot steps back, then all returns quickly. The cutlass stays in the hand. The sack and
    // the mask tails swing late.
    const { quat, follow, euler } = motion;
    const DEG = Math.PI / 180;
    const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    const SHIN = 0.125; // hip joint to ankle joint, in the Y-Z plane
    const HEEL = 0.06; // the back of the boot, behind the ankle's ground point
    /** The leg angle (degrees) that keeps a foot on its rest spot when the hips move `back` meters. */
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    anim('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.85], [0.8, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const flop = keys(p, [[0.08, 0], [0.3, 1], [0.5, -0.45], [0.68, 0.15], [0.85, 0]] as const);
        const back = 0.028 * h;
        const lean = plant(back);
        return {
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, 3 * h] },
          neck: { rotate: [-6 * h, 0, 0] },
          head: { rotate: [-16 * h, -6 * h, -5 * h] },
          knot: { rotate: [-16 * flop, 0, 8 * flop] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
          // The cutlass arm is flung out and up a little; the empty arm by the sack follows.
          'upperarm.L': { rotate: [-8 * h, 0, 14 * h] },
          'forearm.L': { rotate: [-10 * h, 0, 0] },
          'upperarm.R': { rotate: [-6 * h, 0, -8 * h] },
          'forearm.R': { rotate: [-6 * h, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    // The blow snaps the chest back, the bandit slumps forward and wobbles, then tips back over his
    // heels as one piece and lands on his back. The chin tucks and the head rolls toward the
    // cutlass, so the back of the skull and the vest rest on the ground. The arms are solved by
    // targets in the chest's rest frame and lie out on the ground. The hand opens in the fall and
    // the cutlass bone carries the cutlass to lie flat beside the left hand. The sack slides off
    // the right shoulder and lands beside him, a moment after the body.
    const LIE = 86; // the hips' final tilt back, degrees
    const LIE_Y = 0.13; // the hips' height when the bandit lies on his back
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.26, 0], [0, 0.33, 0]]; // hips, spine, chest pivots
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const HAND_CHAIN: readonly V3[] = [...TRUNK, SHOULDER, ELBOW_L, WRIST_L];
    const DROP_AT: V3 = [0.4, 0.028, -0.36]; // the grip on the ground, the point toward the feet
    const DROP_TURN = quat(orient([], { dir: BLADE_DIR, up: FLAT }, { dir: norm([0.35, -0.05, 1]), up: [0, 1, 0] }));
    anim('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = clamp01((p - 0.36) / 0.24); // the fall speeds up to the impact
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 5 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const loose = keys(p, [[0.44, 0], [0.6, 1]] as const);
        const slide = keys(p, [[0.4, 0], [0.64, 1.08], [0.72, 0.97], [0.8, 1]] as const);
        // The stagger: the hips give way backward over planted feet.
        const back = 0.022 * hitB;
        const lean = plant(back);
        // The fall: a rigid tip over the back of the heels, until the hips reach their lying height.
        const a = tilt * DEG;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * clamp01((tilt - 70) / 16); // the legs come down once the hips hold
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        // The wrists: flung back by the blow, slumped, flung out in the fall, then out on the ground.
        const standR = add(add(add(WRIST_R, [-0.05, 0.02, -0.05], hitB), [0, -0.07, -0.03], sag), [-0.07, 0, 0.04], fly);
        const armR = reach(ARM_R, lerp(standR, [-0.215, 0.26, -0.07], land), lerp(ELBOW_R, [-0.3, 0.3, -0.05], land));
        const standL = add(add(add(WRIST_L, [0.05, 0.04, 0.02], hitB), [0, -0.02, 0.03], sag), [0.07, 0.06, 0.04], fly);
        const armL = reach(ARM_L, lerp(standL, [0.27, 0.34, -0.07], land), lerp(ELBOW_L, [0.35, 0.36, -0.1], land));
        // The cutlass: attached to the posed hand until the hand opens, then it drops to the ground.
        const handQ = quat(hipsR).multiply(quat(spineR)).multiply(quat(chestR)).multiply(quat(armL.upper)).multiply(quat(armL.lower));
        const held = add(follow(HAND_CHAIN, [hipsR, spineR, chestR, armL.upper, armL.lower, [0, 0, 0]], GRIP), hipsMove);
        const drop = keys(p, [[0.44, add(DROP_AT, [0, 0.12, 0])], [0.6, DROP_AT], [0.65, add(DROP_AT, [0, 0.02, 0])], [0.7, DROP_AT]] as const);
        const inv = handQ.clone().invert();
        const d = new THREE.Vector3(...add(lerp(held, drop, loose), held, -1)).applyQuaternion(inv);
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag + 8 * land, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 10 * land, -8 * hitB + 30 * land, 8 * wob] },
          // The mask tails swing out and lie on the ground beside the head.
          knot: { rotate: [-12 * hitB + 10 * fly, 0, 10 * wob - 90 * land] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          cutlassbone: { move: [d.x, d.y, d.z], rotate: euler(inv.clone().multiply(handQ.clone().slerp(DROP_TURN, loose))) },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ taunt: beckon, toss, point
    // Played when the bandit first sees the player. He leans back with the head cocked and beckons
    // twice with the free right hand, the palm up: "come here". Then he tosses the cutlass up out
    // to his left; it turns one full flip (about 0.3 m up, 0.35 s) and drops back into his hand,
    // while his head tilts away from it and watches it. He points the blade straight at the player
    // at chest height for a beat (a short thrust: "you!"), and returns to rest.
    // The hand targets are in world space. Each frame converts them into the chest's rest frame
    // and blends them from the arm's rest; reach solves the arm, and orient turns the hand. In the
    // air the cutlass bone undoes the posed hand and carries the cutlass on its own path: up and a
    // little out, the tip up and back first. The flip turns fast after the throw and slows into
    // the catch, so the blade points down only near the top, above the hand that drops out of its
    // way.
    const chestFrame = (rots: readonly V3[], move: V3) => {
      const q = quat(rots[0]!).multiply(quat(rots[1]!)).multiply(quat(rots[2]!));
      const inv = q.clone().invert();
      const at = follow(TRUNK, rots, TRUNK[2]!);
      const c = TRUNK[2]!;
      return {
        q,
        inv,
        point: (w: V3): V3 => {
          const v = new THREE.Vector3(w[0] - at[0] - move[0], w[1] - at[1] - move[1], w[2] - at[2] - move[2]).applyQuaternion(inv);
          return [v.x + c[0], v.y + c[1], v.z + c[2]];
        },
      };
    };
    const turnV = (q: THREE.Quaternion, v: V3): V3 => {
      const w = new THREE.Vector3(...v).applyQuaternion(q);
      return [w.x, w.y, w.z];
    };
    const mix2 = (a: V3, ca: number, b: V3, cb: number): V3 => [a[0] * ca + b[0] * cb, a[1] * ca + b[1] * cb, a[2] * ca + b[2] * cb];
    const Q_ID = new THREE.Quaternion();
    // The right hand's rest frame: the wrist to the fist center, and the palm (the curled fingers)
    // forward.
    const AXIS_R = norm([-0.007, -0.038, 0.004]);
    const PALM_R: V3 = [0, 0, 1];
    const BECKON_AT: V3 = [-0.225, 0.31, 0.11]; // the right wrist out and forward, the forearm level
    const BECKON_F = norm([-0.5, 0.2, 1]); // the hand points forward and out, a little up
    const BECKON_U = norm(add([0, 1, 0], BECKON_F, -BECKON_F[1])); // the palm up
    const POLE_REST_R: V3 = add(mx(SHOULDER), add(ELBOW_R, mx(SHOULDER), -1), 4);
    const POLE_BECKON: V3 = [-0.4, 0.2, -0.06]; // the elbow down and out
    // The left hand: the cutlass straight ahead, the flat upright, the curved edge down.
    const Q_FWD = quat(orient([], { dir: BLADE_DIR, up: FLAT }, { dir: [0, 0, 1], up: [-1, 0, 0] }));
    const GRIP_OFF: V3 = add(GRIP, WRIST_L, -1);
    const TOSS_AT: V3 = [0.265, 0.325, 0.075]; // the grip out to the left and a little forward
    const RELEASE: V3 = add(TOSS_AT, [0, 0.02, 0.005]); // the flick lets go a little higher
    const POINT_AT: V3 = [0.15, 0.345, 0.17]; // the grip before the chest, the blade at the player
    const POLE_REST_L: V3 = add(SHOULDER, add(ELBOW_L, SHOULDER, -1), 4);
    const POLE_TOSS: V3 = [0.45, 0.2, -0.05];
    const POLE_AIM: V3 = [0.42, 0.15, 0.02];
    const FLY0 = 0.455; // the throw
    const FLY1 = FLY0 + 0.35 / 1.5; // the catch, 0.35 s later
    const FLIP_AXIS = new THREE.Vector3(-1, 0, 0); // the tip goes up and back first
    anim('taunt', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const beck = keys(p, [[0, 0], [0.08, 1], [0.35, 1], [0.44, 0]] as const);
        const curl = keys(p, [[0.08, 0], [0.15, 1], [0.22, 0], [0.29, 1], [0.36, 0]] as const);
        const cock = keys(p, [[0, 0], [0.08, 1], [0.36, 1], [0.45, 0]] as const);
        const ready = keys(p, [[0.33, 0], [0.41, 1], [0.9, 1], [1, 0]] as const);
        const look = keys(p, [[0.38, 0], [0.45, 1], [0.66, 1], [0.74, 0]] as const);
        const aim = keys(p, [[0.7, 0], [0.79, 1], [0.9, 1], [1, 0]] as const);
        // He leans back for the beckon; the chest turns the left shoulder forward for the point.
        const hipsR: V3 = [0, 0, 0];
        const spineR: V3 = [-4 * cock + 2 * aim, 0, 0];
        const chestR: V3 = [-4 * cock, 6 * cock - 12 * aim, 0];
        const frame = chestFrame([hipsR, spineR, chestR], [0, 0, 0]);
        // The right hand: forward with the palm up; it curls up toward him twice.
        const c = (6 + 14 * curl) * DEG;
        const beckonQ = quat(
          orient([], { dir: AXIS_R, up: PALM_R }, { dir: mix2(BECKON_F, Math.cos(c), BECKON_U, Math.sin(c)), up: mix2(BECKON_F, -Math.sin(c), BECKON_U, Math.cos(c)) }),
        );
        const turnR = Q_ID.clone().slerp(frame.inv.clone().multiply(beckonQ), beck);
        const wristR = lerp(WRIST_R, frame.point(add(BECKON_AT, [0, 0.012, -0.015], curl)), beck);
        const armR = reach(ARM_R, wristR, lerp(POLE_REST_R, frame.point(POLE_BECKON), beck));
        const handR = orient([armR.upper, armR.lower], { dir: AXIS_R, up: PALM_R }, { dir: turnV(turnR, AXIS_R), up: turnV(turnR, PALM_R) });
        // The left hand: the cutlass forward out to the left, the wind-up dip and the flick, the
        // drop out of the way, the catch and its give, then the point with a short thrust.
        const gripW = keys(p, [
          [0.41, TOSS_AT],
          [0.435, add(TOSS_AT, [0, -0.04, -0.01])],
          [FLY0, RELEASE],
          [0.565, add(TOSS_AT, [-0.03, -0.08, -0.01])],
          [FLY1, TOSS_AT],
          [FLY1 + 0.022, add(TOSS_AT, [0, -0.03, 0])],
          [0.74, TOSS_AT],
          [0.8, add(POINT_AT, [0, 0, 0.025])],
          [0.84, POINT_AT],
        ] as const);
        const turnL = Q_ID.clone().slerp(frame.inv.clone().multiply(Q_FWD), ready);
        const wristL = add(lerp(GRIP, frame.point(gripW), ready), turnV(turnL, GRIP_OFF), -1);
        const poleL = lerp(POLE_REST_L, frame.point(keys(p, [[0.74, POLE_TOSS], [0.8, POLE_AIM]] as const)), ready);
        const armL = reach(ARM_L, wristL, poleL);
        const handL = orient([armL.upper, armL.lower], { dir: BLADE_DIR, up: FLAT }, { dir: turnV(turnL, BLADE_DIR), up: turnV(turnL, FLAT) });
        // The flight: the grip rises about 0.3 m and a little out, and comes back into the hand.
        let cutMove: V3 = [0, 0, 0];
        let cutRot: V3 = [0, 0, 0];
        if (p > FLY0 && p < FLY1) {
          const u = (p - FLY0) / (FLY1 - FLY0);
          const at = add(lerp(RELEASE, TOSS_AT, u), [0.05, 0.3, 0], 4 * u * (1 - u));
          const flip = 2 * Math.PI * (0.25 * u + 0.75 * (1 - (1 - u) * (1 - u)));
          const handQ = frame.q.clone().multiply(quat(armL.upper)).multiply(quat(armL.lower)).multiply(quat(handL));
          const held = follow(HAND_CHAIN, [hipsR, spineR, chestR, armL.upper, armL.lower, handL], GRIP);
          const inv = handQ.clone().invert();
          const d = new THREE.Vector3(...add(at, held, -1)).applyQuaternion(inv);
          cutMove = [d.x, d.y, d.z];
          cutRot = euler(inv.multiply(new THREE.Quaternion().setFromAxisAngle(FLIP_AXIS, flip)).multiply(Q_FWD));
        }
        return {
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-3 * cock + 3 * aim, 0, 3 * cock + 4 * look] },
          // Cocky: the chin up and the head cocked to his right; then it tilts further away from
          // the flying cutlass and turns to watch it; for the point it faces the player.
          head: { rotate: [-6 * cock - 4 * look + 5 * aim, 8 * look + 10 * aim, 9 * cock + 12 * look] },
          knot: { rotate: [6 * cock + 6 * look, 0, -6 * look] },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: handL },
          cutlassbone: { move: cutMove, rotate: cutRot },
        };
      },
    });
  },
});
