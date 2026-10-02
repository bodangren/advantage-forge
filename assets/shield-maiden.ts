import { addPart, defineAsset, mapTint, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';
import { shieldMaidenAxe } from './parts/shield-maiden-axe.js';
import { SHIELD_MAIDEN_HELM_MOUNT, shieldMaidenHelm } from './parts/shield-maiden-helm.js';
import { shieldMaidenShield } from './parts/shield-maiden-shield.js';

/**
 * Shield-maiden — Chibi Quest hero (catalog `heroes/martial/shield-maiden`), 1.05 m to the top of
 * the helm wings, faces +Z. Target: docs/hero-mockups/shield-maiden_001.jpg (one front view; side
 * and back are designed here). Built on the knight's body, face, and skeleton (the rogue's chibi).
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the winged helm, the blonde braids, the
 *   round blue spiral shield, and the axe must read; the face shows under the helm.
 * One idea: a young northern girl under a big winged steel helm, two fat blonde braids, a round
 *   blue shield and a low-held bearded axe.
 * Proportions: wing tops 1.05, helm crown 0.97, brow rim 0.74, eyes 0.63, chin 0.48, collar 0.46,
 *   belt 0.235, tunic hem 0.135, fur cuffs 0.1, knees 0.13.
 * Shape language: round and soft (face, braids, fur), sturdy discs (shield), sharp accents (wings,
 *   diamond plate, axe).
 * Palette (60/30/10): teal tunic #3f7a8a and blue shield #3a8ab8 (mid); steel #b8bcc4 and blonde
 *   #e8c850 (light); leather #6b4226 (dark). Skin #f2c7a4, fur #e0d4b0.
 * Bodies: skin, hair, helm, plate, wings, rivets, fur, tunic, corset, belt, straps, buckle,
 *   sleeves, bracers, hands, legs, boots, braids, axe, axe-haft, shield, shield-face, spiral.
 * Rig: the knight's skeleton; `braid.L`/`braid.R` (from the plume slot) and `cloak` (back hair);
 *   axe rigid on the right hand, shield rigid on the left forearm.
 *   Clips: idle, walk, run, attack (an overhead axe chop), attack2 (a shield bash), hit, death,
 *   victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#1c120c',
  iris: '#4a2c1a',
  irisLow: '#7a4a26',
  pupil: '#110d0b',
  lid: '#16100c',
  mouth: '#a4503f',
  hair: '#e8c850',
  hairDark: '#c89a20',
  steel: '#8a9099',
  steelDark: '#5a6068',
  rivet: '#d8dce0',
  fur: '#e0d4b0',
  tunic: '#3f7a8a',
  tunicDark: '#2a5a66',
  hem: '#c8e0e8',
  leather: '#6b4226',
  strap: '#4e2d1c',
  buckle: '#a8acb1',
  boot: '#5a3a24',
  sole: '#3a2818',
  shield: '#3a8ab8',
  spiral: '#c8e0e8',
  wood: '#8a5a35',
  haft: '#4a2e1c',
};

type V3 = readonly [number, number, number];
// The shield center: the fist grips behind the disc, so the disc sits 0.04 m ahead of the wrist along its normal.
const SHIELD_C: V3 = [0.26, 0.28, 0.124];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. Both forearms point forward: the right hand carries the axe low and out, the left
// forearm carries the shield in front of the left side.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.335, -0.005];
const WRIST_R: V3 = [-0.215, 0.3, 0.1];
const ELBOW_L: V3 = [0.175, 0.335, 0];
const WRIST_L: V3 = [0.2, 0.29, 0.085];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left boot (y = 0), measured on the SDF: heel and toe.
const HEEL: V3 = [0.096, 0, -0.008];
const TOE: V3 = [0.117, 0, 0.09];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Rotations for points, matching the shape methods (degrees, world axes).
const rad = Math.PI / 180;
const rotX = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
const rotZ = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** A fist hanging from the wrist at the origin: palm, a finger roll at the front, a thumb. */
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.04, 0.045, 0.046]).at(0.007 * s, -0.04, 0.004),
    sdf.capsule([-0.009 * s, -0.061, 0.031], [-0.005 * s, -0.04, 0.044], 0.018),
    sdf.cone([0.021 * s, -0.024, 0.026], [0.001 * s, -0.035, 0.05], 0.017, 0.0135),
  );
// Each hand swings forward along its forearm, then turns about the forward axis.
const HAND_R = { pitch: -70, roll: -30 };
const HAND_L = { pitch: -62, roll: 26 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const handPoint = (h: { pitch: number; roll: number }, w: V3, p: V3) => add(rotZ(rotX(p, h.pitch), h.roll), w);

export default defineAsset({
  name: 'shield-maiden',
  description: 'Chibi shield-maiden hero with a winged steel helm, blonde braids, fur collar, blue spiral shield, and axe.',
  detail: 0.006,
  reference: 'docs/hero-mockups/shield-maiden_001.jpg',
  // Color slots for individual maidens (the first option is the default look). Eyes and skin share
  // the set's family. The clothing slot is the tunic and the shield face.
  variants: {
    eyes: { blue: '#2f6aa8', green: '#3d7a35', brown: '#6e4020' },
    hair: { blonde: C.hair, red: '#a8501f', brown: '#4a2e1c' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { teal: C.tunic, crimson: '#8a2a3a', forest: '#2e6a3c' },
  },
  presets: {
    default: { eyes: 'blue', hair: 'blonde', skin: 'fair', clothing: 'teal' },
    crimson: { eyes: 'green', hair: 'red', skin: 'tan', clothing: 'crimson' },
    forest: { eyes: 'brown', hair: 'brown', skin: 'brown', clothing: 'forest' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      skin: k.tint('skin'),
      cloth: k.tint('clothing'),
      clothDark: k.tint('clothing', { color: C.tunicDark, follow: 1 }),
      shield: k.tint('clothing', { color: C.shield, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      'braid.L': { parent: 'chest', at: [0.2, 0.56, 0.02], tail: [0.14, 0.3, 0.11] },
      'braid.R': { parent: 'chest', at: [-0.2, 0.56, 0.02], tail: [-0.14, 0.3, 0.11] },
      cloak: { parent: 'head', at: [0, 0.6, -0.14], tail: [0, 0.4, -0.16] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
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
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)), // round cheeks
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.02, 0.016, 0.015]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    // Small round human ears.
    const ears = pair(
      sdf
        .smoothUnion(0.008, sdf.ellipsoid([0.02, 0.034, 0.027]), sdf.ellipsoid([0.014, 0.022, 0.018]).at(0.008, -0.004, 0.004))
        .rotateZ(-8)
        .at(0.2, 0.607, -0.004),
    ).bone('head');

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.038, 0.045, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.022));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.03, 0.07]), EYE[0], EYE[1] + 0.001));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.013), x + 0.016, EYE[1] + 0.02),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    // Soft, thin brows in the darker hair tone, arched a little.
    const brows = pair(sdf.extrude(profile.arc(0.16, 0.017, 70, 106), 0.3).at(0.1, 0.71 - 0.16, 0.1).rotateZ(-2));
    const smile = sdf.extrude(profile.arc(0.06, 0.013, 243, 297), 0.3).at(0, 0.53 + 0.06, 0.1);
    const blush = pair(at(sdf.sphere(0.036), 0.135, 0.56));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose)
      .smoothUnion(0.01, ears)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.hairDark)
      .paintWhere(smile, C.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ helm: an open dome
    const helmPose = (s: sdf.Shape) => s.at(...SHIELD_MAIDEN_HELM_MOUNT);
    const helmPart = shieldMaidenHelm();
    addPart(k, helmPart, { pose: helmPose });
    const helmInner = helmPose(helmPart.regions!.inside!);

    // ------------------------------------------------------------------ hair
    // Under the helm and around the skull: a cap with a face window, and 16 locks laid over the
    // whole skull (top, sides, nape) in jittered directions, blended into the cap.
    const SKC: V3 = [0, HEAD_Y + 0.006, -0.012];
    const SKA: V3 = [HEAD[0] + 0.016, HEAD[1] + 0.018, HEAD[2] + 0.016];
    const skull = sdf.ellipsoid(SKA).at(...SKC);
    const skullPt = (th: number, ph: number, s: number): [number, number, number] => [
      SKA[0] * s * Math.sin(th) * Math.sin(ph),
      SKC[1] + SKA[1] * s * Math.cos(th),
      SKC[2] + SKA[2] * s * Math.sin(th) * Math.cos(ph),
    ];
    const windowCut = sdf
      .extrude(
        profile.polygon(
          [
            [-0.152, 0.738],
            [0.152, 0.738],
            [0.168, 0.7],
            [0.172, 0.6],
            [0.15, 0.5],
            [-0.15, 0.5],
            [-0.172, 0.6],
            [-0.168, 0.7],
          ],
          { smooth: true, samples: 4 },
        ),
        0.4,
        0.006,
      )
      .at(0, 0, 0.2);
    const earKeep = hard(sdf.sphere(0.05).at(0.205, 0.607, 0));
    const cap = skull.subtract(windowCut).intersect(sdf.halfSpace([0, -1, 0], -0.5));
    const NLOCK = 16;
    const lockAt = (i: number) => {
      const jit = (n: number) => noise.random(i, n, 7) - 0.5;
      const ph = ((i + 0.5 * jit(1)) / NLOCK) * Math.PI * 2;
      const back = Math.abs(Math.cos(ph)) < 0.55 ? 1 : Math.cos(ph) < 0 ? 1 : 0;
      const th0 = 0.22 + 0.15 * (jit(2) + 0.5);
      const th1 = (back ? 1.95 : 1.15) + 0.22 * jit(3);
      const pts: [number, number, number, number][] = [];
      for (let j = 0; j <= 4; j++) {
        const t = j / 4;
        const th = th0 + (th1 - th0) * t;
        const p = ph + 0.18 * jit(4) * Math.sin(t * 3.2 + i) + 0.1 * jit(5) * t;
        const q = skullPt(th, p, 1.012 + 0.018 * Math.sin(t * 3 + i));
        pts.push([q[0], q[1], q[2], 0.036 - 0.012 * t]);
      }
      return sdf.chain(pts, 0.01);
    };
    const skullLocks = sdf.smoothUnion(0.012, ...Array.from({ length: NLOCK }, (_, i) => lockAt(i)));
    // Side locks frame the face, in front of the ears, and end in the braids.
    const sideLock = (n: number) => {
      const lift = 0.012 + 0.006 * n;
      const spots: [number, number, number, number][] = [
        [0.24, 0.735 - 0.006 * n, 0.14, 0.024],
        [0.3, 0.665, 0.07 - 0.012 * n, 0.024],
        [0.3, 0.6, 0.05 - 0.01 * n, 0.022],
        [0.27, 0.535, 0.04 - 0.008 * n, 0.019],
      ];
      const pts = spots.map(([x, y, z, r]) => {
        const p = sdf.surfacePoint(head, [x, y, z], lift + (n === 1 ? 0.008 : 0));
        return [p[0], p[1], p[2], r] as [number, number, number, number];
      });
      return sdf.chain(pts, 0.008);
    };
    const sideLocks = pair(sdf.smoothUnion(0.012, sideLock(0), sideLock(1), sideLock(2)));
    // Five wavy locks under the brow: the fringe.
    const fringeLock = (x: number, dx: number, len: number, r: number) => {
      const z0 = faceZ(Math.abs(x), 0.742);
      const z1 = faceZ(Math.abs(x + dx * 0.5), 0.742 - len * 0.5);
      const z2 = faceZ(Math.abs(x + dx), 0.742 - len);
      return sdf.chain(
        [
          [x, 0.75, z0 + 0.004, r],
          [x + dx * 0.55, 0.742 - len * 0.5, z1 + 0.012, r * 0.85],
          [x + dx * 0.7 * 0.9 + 0.006 * Math.sign(dx), 0.742 - len * 0.8, z2 + 0.012, r * 0.55],
          [x + dx, 0.742 - len, z2 + 0.01, r * 0.22],
        ],
        0.006,
      );
    };
    const fringe = sdf.smoothUnion(
      0.01,
      fringeLock(-0.135, -0.04, 0.075, 0.026),
      fringeLock(-0.07, -0.02, 0.05, 0.024),
      fringeLock(-0.005, -0.012, 0.04, 0.024),
      fringeLock(0.06, 0.025, 0.046, 0.024),
      fringeLock(0.125, 0.045, 0.075, 0.026),
    );
    const hairBase = sdf.smoothUnion(0.012, cap, skullLocks.subtract(windowCut).intersect(sdf.halfSpace([0, -1, 0], -0.5)))
    // Above the rim the hair stays inside the helm; below the rim it is free.
    const underRim = sdf.halfSpace([0, 0.947, -0.322], 0.634);
    const hairFit = hairBase.intersect(helmInner.round(-0.004).union(underRim));
    const hair = sdf
      .smoothUnion(0.012, hairFit.subtract(earKeep), sideLocks.subtract(earKeep), fringe)
      .paintFn((x, y, z, base) => {
        const groove = Math.sin(Math.atan2(x, z + 0.012) * 24 + y * 30 + noise.noise3(x * 12, y * 12, z * 12) * 3);
        const under = y < 0.62 ? 0.35 : y < 0.7 ? 0.15 : 0;
        const g = groove > 0.55 ? 0.55 : under;
        return g > 0 ? mixRgb(base, rgb(T.hairDark), g) : base;
      });
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.0075, bone: 'head' });

    // Back hair: a fall of locks behind the neck (the `cloak` bone), between the braids.
    const backLock = (x: number, top: number, bottom: number, sway: number, r: number) =>
      sdf.chain(
        [
          [x * 0.6, top, -0.155, r],
          [x * 0.85 + sway * 0.3, (top + bottom) * 0.5 + 0.05, -0.172, r * 1.02],
          [x + sway * 0.7, (top + bottom) * 0.5 - 0.03, -0.176, r * 0.9],
          [x * 1.1 + sway, bottom, -0.172, r * 0.4],
        ],
        0.01,
      );
    const backHair = sdf
      .smoothUnion(
        0.014,
        backLock(-0.112, 0.62, 0.42, -0.03, 0.03),
        backLock(-0.08, 0.62, 0.39, -0.015, 0.032),
        backLock(-0.045, 0.62, 0.36, 0.01, 0.034),
        backLock(-0.012, 0.62, 0.34, -0.012, 0.035),
        backLock(0.022, 0.62, 0.35, 0.014, 0.034),
        backLock(0.055, 0.62, 0.37, -0.008, 0.033),
        backLock(0.086, 0.62, 0.4, 0.022, 0.032),
        backLock(0.114, 0.62, 0.42, 0.034, 0.03),
      )
      .paintFn((x, y, z, base) =>
        Math.sin(x * 130 + y * 25) > 0.6 || y < 0.5 ? mixRgb(base, rgb(T.hairDark), 0.5) : base,
      );
    k.body('back-hair', backHair.bone('cloak'), { color: T.hair, roughness: 0.6, detail: 0.005 });

    // Braids: the chain of alternating offset spheres over the shoulders, down to the waist.
    const BRAID: [number, number, number][] = [
      [0.208, 0.545, 0.03],
      [0.2, 0.5, 0.06],
      [0.172, 0.462, 0.09],
      [0.135, 0.425, 0.114],
      [0.108, 0.388, 0.124],
      [0.094, 0.35, 0.126],
      [0.09, 0.315, 0.124],
      [0.088, 0.285, 0.12],
      [0.088, 0.262, 0.115],
    ];
    const braidPts = (n: number): [number, number, number][] => {
      const out: [number, number, number][] = [];
      for (let i = 0; i <= n; i++) {
        const u = (i / n) * (BRAID.length - 1);
        const a = Math.min(BRAID.length - 2, Math.floor(u));
        const f = u - a;
        out.push([...lerp(BRAID[a]!, BRAID[a + 1]!, f)] as [number, number, number]);
      }
      return out;
    };
    const bp = braidPts(16);
    const braidCore = sdf.chain(
      bp.map((p, i) => [p[0], p[1], p[2], 0.026 - 0.009 * (i / 16)] as [number, number, number, number]),
      0.01,
    );
    // Six soft spheres, alternately offset, over a smooth core: the braid.
    const braidLobes = sdf.smoothUnion(
      0.012,
      ...[1, 4, 7, 10, 13, 16].map((n, i) => {
        const p = bp[n]!;
        const side = i % 2 === 0 ? 1 : -1;
        return sdf.sphere(0.024 - 0.006 * (i / 5)).at(p[0] + side * 0.008, p[1], p[2] + side * 0.003);
      }),
    );
    const braidL = sdf
      .smoothUnion(0.012, braidCore, braidLobes)
      .paintFn((x, y, z, base) => (y < 0.27 ? rgb(C.strap) : Math.sin(y * 150 + x * 40) > 0.4 ? mixRgb(base, rgb(T.hairDark), 0.7) : base))
      .bone('braid.L');
    k.body('braids', hard(braidL), { color: T.hair, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ tunic, corset, belt
    const tunicTorso = sdf
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
            [0.142, 0.2],
            [0.158, 0.165],
            [0.166, 0.14],
            [0.158, 0.132],
            [0, 0.132],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const hemBand = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      // A pale knotwork stroke along the hem: a wave with a second, crossing wave.
      const yc = 0.146 + 0.006 * Math.sin(a * 16);
      const yc2 = 0.146 - 0.006 * Math.sin(a * 16);
      return Math.abs(y - yc) < 0.0032 || Math.abs(y - yc2) < 0.0028;
    };
    const tunic = sdf
      .union(
        tunicTorso.intersect(sdf.halfSpace([0, -1, 0], -0.2)).bone('chest'),
        tunicTorso.intersect(sdf.halfSpace([0, 1, 0], 0.215)).bone('hips'),
      )
      .paintFn((x, y, z, base) => {
        if (y < 0.16 && hemBand(x, y, z)) return rgb(C.hem);
        if (Math.sin(Math.atan2(z, x) * 9 + noise.noise3(x * 6, y * 6, z * 6)) > 0.6 && y < 0.24) return rgb(T.clothDark);
        return base;
      });
    k.body('tunic', tunic, { color: T.cloth, roughness: 0.85, textureDensity: 1.5, detail: 0.005 });

    const corset = tunicTorso.round(0.008).smoothIntersect(0.006, sdf.box([0.6, 0.11, 0.6], 0.012).at(0, 0.283, 0));
    k.body('corset', corset.bone('spine'), { color: C.leather, roughness: 0.65, detail: 0.005 });
    const beltY = 0.228;
    const belt = tunicTorso.round(0.014).smoothIntersect(0.005, sdf.box([0.6, 0.04, 0.6], 0.008).at(0, beltY, 0));
    // The cross strap runs from the right shoulder to the left hip; two small hip straps hang from the belt.
    const strap = tunicTorso
      .round(0.013)
      .intersect(sdf.box([0.6, 0.032, 0.6], 0.008).rotateZ(-45).at(0, 0.35, 0))
      .intersect(sdf.halfSpace([0, 1, 0], 0.452))
      .intersect(sdf.halfSpace([0, -1, 0], -0.22));
    const hipTab = sdf.box([0.034, 0.07, 0.012], 0.005).rotateZ(6);
    const tabs = pair(hipTab.at(0.098, 0.19, sdf.raycast(tunicTorso, [0.098, 0.19, 1], [0, 0, -1])![2] + 0.004).bone('hips'));
    // One leather pouch on the left hip, with a brass button.
    const POUCH: V3 = [0.135, 0.178, sdf.raycast(tunicTorso, [0.135, 0.178, 1], [0, 0, -1])![2] + 0.014];
    const pouch = sdf.box([0.05, 0.05, 0.03], 0.01).at(...POUCH).rotateZ(4).bone('hips');
    k.body('pouch', pouch, { color: C.leather, roughness: 0.7, detail: 0.004 });
    k.body('brass', sdf.sphere(0.0085).at(POUCH[0] + 0.001, POUCH[1] + 0.012, POUCH[2] + 0.013).bone('hips'), {
      color: '#c8a040',
      roughness: 0.35,
      metalness: 0.8,
      detail: 0.003,
    });
    k.body('belt', belt.bone('spine'), { color: C.leather, roughness: 0.65, detail: 0.005 });
    k.body('straps', sdf.union(strap.bone('chest'), tabs), { color: C.strap, roughness: 0.7, detail: 0.004 });

    // Steel: the disc where the strap crosses the chest, the belt buckle, two side studs.
    const chestZ = (x: number, y: number) => sdf.raycast(strap.union(tunicTorso), [x, y, 1], [0, 0, -1])![2];
    const disc = sdf.ellipsoid([0.026, 0.026, 0.014]).at(-0.05, 0.4, chestZ(-0.05, 0.4) + 0.003).bone('chest');
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.torus(0.019, 0.0055).rotateX(90).at(0, beltY, beltZ + 0.003),
        sdf.box([0.006, 0.03, 0.008], 0.002).at(0, beltY, beltZ + 0.003),
        hard(sdf.sphere(0.008).at(0.066, beltY, sdf.raycast(belt, [0.066, beltY, 1], [0, 0, -1])![2] + 0.002)),
      )
      .bone('spine');
    k.body('buckle', sdf.union(disc, buckle), { color: C.buckle, roughness: 0.45, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ fur collar
    const collar = sdf
      .union(
        sdf.torus(0.108, 0.045).scale([1, 1, 0.92]).at(0, 0.463, -0.004),
        pair(sdf.ellipsoid([0.062, 0.04, 0.056]).at(0.09, 0.455, 0.052)),
        // Eight overlapping puffs around the neck line.
        ...Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2 + 0.2;
          return sdf.sphere(0.03).at(0.112 * Math.sin(a), 0.475, -0.004 + 0.103 * Math.cos(a));
        }),
      )
      .displace(0.0035, (x, y, z) => noise.fbm(x * 16, y * 16, z * 16, 2))
      .bone('chest');
    const cuffL = sdf
      .union(
        sdf.cylinder(0.06, 0.05, 0.016).at(0.097, 0.1, 0.004),
        // Six puffs around the cuff.
        ...Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return sdf.sphere(0.03).at(0.097 + 0.055 * Math.sin(a), 0.116, 0.004 + 0.055 * Math.cos(a));
        }),
      )
      .displace(0.003, (x, y, z) => noise.fbm(x * 16, y * 16, z * 16, 2))
      .bone('shin.L');
    const cuff = pair(cuffL);
    const furBump = (x: number, y: number, z: number) => 0.0035 * Math.abs(noise.fbm(x * 110, y * 110, z * 110, 2));
    k.body('fur', sdf.union(collar, cuff), { color: C.fur, roughness: 1, bump: furBump, detail: 0.0065 });

    // ------------------------------------------------------------------ arms: sleeves, bracers, hands
    const sleeve = (s: V3, e: V3, tag: string) => sdf.cone(s, lerp(s, e, 1.12), 0.046, 0.043).bone(tag);
    const forearmSleeve = (e: V3, w: V3, tag: string) => sdf.cone(e, lerp(e, w, 1.0), 0.043, 0.038).bone(tag);
    k.body(
      'sleeves',
      sdf.union(
        sleeve(SHOULDER, ELBOW_L, 'upperarm.L'),
        sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'),
        forearmSleeve(ELBOW_L, WRIST_L, 'forearm.L'),
        forearmSleeve(ELBOW_R, WRIST_R, 'forearm.R'),
      ),
      { color: T.cloth, roughness: 0.85, detail: 0.005 },
    );
    const bracer = (e: V3, w: V3, tag: string) =>
      sdf
        .union(
          sdf.cone(lerp(e, w, 0.42), lerp(e, w, 1.0), 0.0455, 0.041).round(0.003),
          sdf.torus(0.046, 0.006).rotateX(-90).rotateX(0).at(...lerp(e, w, 0.55)),
        )
        .bone(tag);
    k.body('bracers', sdf.union(bracer(ELBOW_L, WRIST_L, 'forearm.L'), bracer(ELBOW_R, WRIST_R, 'forearm.R')), {
      color: C.leather,
      roughness: 0.65,
      detail: 0.004,
    });
    const fistR = handPose(HAND_R, WRIST_R)(fistLocal(-1));
    const fistL = handPose(HAND_L, WRIST_L)(fistLocal(1));
    k.body('hands', sdf.union(fistL.bone('hand.L'), fistR.bone('hand.R')), { color: T.skin, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ legs and fur-cuffed boots
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.112, 0.05, 0.084]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.095, 0.1, 0.004], 0.046).bone('leg.L')),
    );
    k.body('legs', legs, { color: T.skin, roughness: 0.55, detail: 0.005 });
    const bootFoot = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.052, 0.07, 0.02).at(0, 0.05, 0),
        sdf.ellipsoid([0.058, 0.05, 0.102]).at(0, 0.045, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = bootFoot
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.012), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.7, detail: 0.005 });

    // ------------------------------------------------------------------ axe in the right hand
    // Local frame: the grip center at the origin, the haft toward -Y, the blade edge toward +X, the flat facing +Z.
    // A bearded head: 0.078 wide, 0.12 tall; the curved cutting edge drops below the haft in a beard.
    const GRIP = handPoint(HAND_R, WRIST_R, [-0.007, -0.04, 0.004]);
    const AXE_TILT = 16; // the haft leans back a little, so a swing of the arm never dips the head
    const axePose = (s: sdf.Shape) => s.rotateX(AXE_TILT).rotateZ(-44).at(...GRIP);
    addPart(k, shieldMaidenAxe(), { pose: axePose });

    // ------------------------------------------------------------------ round shield on the left forearm
    // Local frame: the face toward +Z. A steel rim, a blue face with a raised pale spiral, a wooden back.
    const shieldPose = (s: sdf.Shape) => s.rotateZ(-4).rotateX(4).rotateY(38).at(...SHIELD_C);
    addPart(k, shieldMaidenShield(mapTint(k, { shield: 'clothing' })), { pose: shieldPose });
    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 1.5 * wave(p, 1, 0.1)] },
        'braid.L': { rotate: [0.5 * (3 * wave(p, 1, 0.4)), 0, 4 * wave(p, 1, 0.3)] },
          'braid.R': { rotate: [0.5 * (3 * wave(p, 1, 0.4)), 0, -(4 * wave(p, 1, 0.3))] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -2 * bump(p)] },
        'forearm.R': { rotate: [-4 * bump(p), 0, 0] },
      }),
    });

    // The shield arm stays in front of the body; the sword arm swings a little.
    // shield: the [upper arm, forearm] X offsets that keep the shield's top edge clear of the cheek.
    // The legs come from motion.gait: planted stance sabatons, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `footLift` the swing height, `duty` the share of the
    // cycle a foot is down (a run has a flight between steps), `bob` the hips bob. The gait phase
    // runs a quarter cycle behind the clip, so the left heel strikes at p = 0.25, when the right
    // arm is most forward. The hips' sway goes to gait, so the planted feet do not slide.
    const stride = (
      duration: number,
      step: number,
      footLift: number,
      duty: number,
      bob: number,
      armSwing: number,
      lean: number,
      flow: number,
      shield: readonly [number, number] = [0, 0],
    ) => ({
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
          heel: HEEL,
          toe: TOE,
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, 0] as const },
          'braid.L': { rotate: [0.5 * (flow * 0.5 + 5 * wave(p, 2, 0.2)), 0, 4 * wave(p, 2, 0.1)] as const },
          'braid.R': { rotate: [0.5 * (flow * 0.5 + 5 * wave(p, 2, 0.2)), 0, -(4 * wave(p, 2, 0.1))] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.15 * s + shield[0], 0, 3] as const },
          'forearm.L': { rotate: [shield[1], 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, -6] as const },
          'forearm.R': { rotate: [-armSwing * 0.2 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    // A short, sturdy stride.
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.62, 0.005, 28, 3, 6, [4, 0]));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.42, 0.025, 50, 12, 22));

    // An overhead axe chop, solved by targets. The wrist follows keys
    // in the chest's rest frame (reach); the blade follows its own keys; edgeUp turns the flat so
    // the edge leads. The arm is short and the helm is big, so the wind-up rises on the right side,
    // out beside the helm; the blade comes over the right shoulder, forward under the helm's rim,
    // and sweeps down across the front to the low left. The hips and chest turn, the left foot
    // steps, the hips drop, and the shield rises in front of the left side.
    const { keys, reach, orient, edgeUp } = motion;
    const norm = (a: V3): V3 => {
      const l = Math.hypot(a[0], a[1], a[2]);
      return [a[0] / l, a[1] / l, a[2] / l];
    };
    const BLADE_DIR = rotZ(rotX([0, -1, 0], 16), -44); // the haft (local -Y) at rest, as axePose
    const FLAT = rotZ(rotX([0, 0, 1], 16), -44); // the flat's normal (local +Z) at rest
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    // The rest elbow's bend direction, so the solved arm starts and ends on the rest pose.
    const POLE_REST = (() => {
      const s = mx(SHOULDER);
      const t = norm([WRIST_R[0] - s[0], WRIST_R[1] - s[1], WRIST_R[2] - s[2]]);
      const e: V3 = [ELBOW_R[0] - s[0], ELBOW_R[1] - s[1], ELBOW_R[2] - s[2]];
      const d = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
      const side = norm([e[0] - d * t[0], e[1] - d * t[1], e[2] - d * t[2]]);
      return add(s, [side[0] * 0.6, side[1] * 0.6, side[2] * 0.6]);
    })();
    const bladeKeys = [
      [0, BLADE_DIR],
      [0.14, norm([-0.92, 0.12, 0.3])], // out to the right, level
      [0.28, norm([-0.8, 0.5, -0.33])], // up and back, out beside the helm
      [0.38, norm([-0.78, 0.56, -0.3])], // the hold at the top
      [0.44, norm([-0.55, 0.8, 0.2])], // over the top, well outboard of the wing
      [0.5, norm([-0.2, 0.55, 0.81])], // the head comes over, forward
      [0.56, norm([-0.02, -0.3, 0.95])], // the strike: the head forward and down
      [0.63, norm([0.03, -0.55, 0.83])], // through the cut
      [0.72, norm([0.03, -0.55, 0.83])], // the follow-through holds
      [0.86, norm([-0.3, -0.62, 0.72])], // back toward the rest
      [1, BLADE_DIR],
    ] as const;
    const bladeAt = (p: number) => keys(p, bladeKeys, 'spline');
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.14, [-0.265, 0.38, 0.06]],
            [0.28, [-0.31, 0.432, -0.035]],
            [0.38, [-0.312, 0.436, -0.04]],
            [0.44, [-0.29, 0.44, 0.065]],
            [0.48, [-0.19, 0.43, 0.155]],
            [0.53, [-0.14, 0.36, 0.19]],
            [0.6, [-0.13, 0.27, 0.19]],
            [0.7, [-0.13, 0.272, 0.19]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = norm(bladeAt(p));
        // The elbow points out and back in the wind-up, then out, down, and forward through the
        // cut, so the forearm stays in front of the breastplate.
        const pole = keys(p, [
          [0, POLE_REST],
          [0.14, [-0.6, 0.2, -0.2]],
          [0.4, [-0.6, 0.25, -0.15]],
          [0.48, [-0.5, 0.05, 0.4]],
          [0.75, [-0.5, 0.05, 0.4]],
          [1, POLE_REST],
        ] as const);
        const arm = reach(ARM_R, wrist, pole);
        const hand = orient([arm.upper, arm.lower], { dir: BLADE_DIR, up: FLAT }, { dir, up: edgeUp(bladeAt, p, FLAT) });
        const wind = ease(0, 0.3, p) * (1 - ease(0.4, 0.5, p));
        const cut = ease(0.42, 0.56, p) * (1 - ease(0.72, 1, p));
        const step = 24 * cut;
        const guard = ease(0, 0.2, p) * (1 - ease(0.75, 1, p));
        return {
          hips: { move: [0, -legDrop(LEG, step) - 0.004 * wind, 0.025 * cut - 0.01 * wind], rotate: [0, -10 * wind + 16 * cut, 0] },
          spine: { rotate: [-4 * wind + 7 * cut, 0, 0] },
          chest: { rotate: [-3 * wind + 4 * cut, -16 * wind + 20 * cut, 0] },
          // The head turns with the chest: the shield's top edge sits close under the left cheek.
          head: { rotate: [-2 * wind - 2 * cut, 3 * wind - 3 * cut, 0] },
          'braid.L': { rotate: [0.5 * (6 * wind - 14 * cut), 0, -4 * wind + 6 * cut] },
          'braid.R': { rotate: [0.5 * (6 * wind - 14 * cut), 0, -(-4 * wind + 6 * cut)] },
          cloak: { rotate: [-3 * wind + 10 * cut, 0, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          // The shield stays up in front of the left side and comes a little forward, clear of the cheek.
          'upperarm.L': { rotate: [-30 * guard, 0, 0] },
          'forearm.L': { rotate: [35 * guard, 0, 0] },
          'leg.L': { rotate: [-step, 0, 0] },
          'leg.R': { rotate: [step, 0, 0] },
          'foot.L': { rotate: [step, 0, 0] },
          'foot.R': { rotate: [-step, 0, 0] },
        };
      },
    });

    // hit: a blow from the front. The head and the chest snap back, the right foot steps back and
    // returns, the shield jolts down and out and comes back up; the plume and the cape lag.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
        const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
        const lift = bump(Math.min(1, Math.max(0, (p - 0.04) / 0.2))) + bump(Math.min(1, Math.max(0, (p - 0.58) / 0.32)));
        const jolt = keys(p, [[0, 0], [0.1, 1], [0.3, 0.15], [0.5, -0.2], [0.78, 0]] as const, 'spline');
        const lag = keys(p, [[0, 0], [0.12, 0.3], [0.26, 1], [0.48, -0.45], [0.72, 0.15], [1, 0]] as const, 'spline');
        const back = 0.03 * step;
        const plant = Math.asin(back / LEG) / rad; // the left foot stays planted as the hips move back
        return {
          hips: { move: [0, -legDrop(LEG, plant), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-5 * h, 0, 0] },
          head: { rotate: [-12 * h, -6 * h, 3 * h] },
          'braid.L': { rotate: [0.5 * (16 * lag), 0, 5 * lag] },
          'braid.R': { rotate: [0.5 * (16 * lag), 0, -(5 * lag)] },
          cloak: { rotate: [9 * lag, 0, 0] },
          'upperarm.R': { rotate: [8 * h, 0, -10 * h] },
          'forearm.R': { rotate: [-12 * h, 0, 0] },
          'upperarm.L': { rotate: [10 * jolt, 0, 10 * jolt] },
          'forearm.L': { rotate: [22 * jolt, 0, 0] },
          'leg.L': { rotate: [-plant, 0, 0] },
          'leg.R': { rotate: [plant + 8 * lift, 0, 0] },
          'foot.L': { rotate: [plant, 0, 0] },
          'foot.R': { rotate: [-plant - 8 * lift, 0, 0] },
        };
      },
    });

    // death: the blow snaps him back, he staggers a step, then topples onto his back. The big helm
    // and the cape hold the body up, so the hips stay high, the neck bends a little forward, and the
    // cape flattens under him (scale). The sword arm falls out to the right with the blade flat on
    // the ground; the shield arm falls to the left side and the shield lies face up over it.
    const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const rotY = (p: V3, d: number): V3 => {
      const c = Math.cos(d * rad);
      const s = Math.sin(d * rad);
      return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
    };
    const poleOf = (root: V3, mid: V3, end: V3) => {
      const t = norm(sub(end, root));
      const e = sub(mid, root);
      const d = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
      const side = norm([e[0] - d * t[0], e[1] - d * t[1], e[2] - d * t[2]]);
      return add(root, [side[0] * 0.6, side[1] * 0.6, side[2] * 0.6]);
    };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const POLE_REST_L = poleOf(SHOULDER, ELBOW_L, WRIST_L);
    const SHIELD_N = rotY(rotX(rotZ([0, 0, 1], -4), 4), 38); // the shield face's normal at rest
    const FOREARM_L = norm(sub(WRIST_L, ELBOW_L));
    const D = {
      tilt: 86, // the hips' final tilt back (90 = flat)
      drop: 0.045, // how far the hips come down
      back: 0.15, // how far the hips land behind the start
      neck: 9, // the neck and the head bend forward, so the helm clears the ground
      head: 12,
      cape: 8, // the cape swings toward the legs and flattens under him
      capeFlat: 0.4,
      leg: 34, // the legs lie back down to the ground
      wristR: [-0.3, 0.34, 0.0] as V3,
      bladeR: norm([-0.52, -0.85, -0.14]),
      wristL: [0.27, 0.235, 0.04] as V3,
      poleL: [0.6, 0.3, -0.2] as V3,
      shieldN: norm([0.25, -0.1, 0.96]),
    };
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.2, 0.4], [0.3, 0]] as const);
        const stag = keys(p, [[0.04, 0], [0.22, 1]] as const);
        const f = keys(p, [[0.26, 0], [0.68, 1]] as const);
        const g = f * f; // the fall starts slowly and ends fast
        const stand = 1 - g;
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.14)));
        const flat = keys(p, [[0.28, 0], [0.56, 1]] as const);
        // The cape bunches up and swings toward the legs as it meets the ground, then spreads.
        const crumple = keys(p, [[0.3, 0], [0.48, 1], [0.7, 1], [0.9, 0]] as const);
        const lag = keys(p, [[0, 0], [0.1, 0.8], [0.3, -0.3], [0.5, 0.6], [0.7, -1], [0.82, -0.6], [1, -0.7]] as const, 'spline');

        // The sword arm flies out in the blow and falls to the ground on the right; the blade
        // turns flat and points out toward the feet.
        const wristR = keys(p, [[0, WRIST_R], [0.1, [-0.27, 0.34, 0.08]], [0.36, [-0.28, 0.37, 0.03]], [0.74, D.wristR]] as const);
        const poleR = keys(p, [[0, POLE_REST], [0.2, [-0.6, 0.3, -0.1]], [0.74, [-0.6, 0.4, -0.35]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const blade = norm(keys(p, [[0, BLADE_DIR], [0.1, norm([-0.75, -0.45, 0.48])], [0.4, norm([-0.75, -0.55, 0.36])], [0.74, D.bladeR]] as const));
        const flatUp = norm(keys(p, [[0, FLAT], [0.4, FLAT], [0.74, [0, 0, 1]]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: BLADE_DIR, up: FLAT }, { dir: blade, up: flatUp });

        // The shield arm flies out, then falls to his left side; the forearm turns the shield face up.
        const wristL = keys(p, [[0, WRIST_L], [0.1, [0.28, 0.3, 0.06]], [0.36, [0.27, 0.31, 0.03]], [0.76, D.wristL]] as const);
        const poleL = keys(p, [[0, POLE_REST_L], [0.2, [0.6, 0.3, -0.1]], [0.76, D.poleL]] as const);
        const armL = reach(ARM_L, wristL, poleL);
        const elbowL = motion.follow([SHOULDER], [armL.upper], ELBOW_L);
        const faceUp = norm(keys(p, [[0, SHIELD_N], [0.36, norm([0.9, 0, 0.44])], [0.76, D.shieldN]] as const));
        const forearmL = orient([armL.upper], { dir: FOREARM_L, up: SHIELD_N }, { dir: norm(sub(wristL, elbowL)), up: faceUp });

        const plant = Math.asin((0.03 * stag * stand) / LEG) / rad;
        // The soles stay flat on the ground while the legs trail the fall, then the toes turn up.
        const legL = -plant + D.leg * g * g;
        const sole = D.tilt * g - D.leg * g * g;
        const toes = keys(p, [[0.56, 0], [0.76, 1]] as const);
        return {
          hips: {
            move: [0, -legDrop(LEG, plant) * stand - D.drop * g + 0.014 * Math.sin(Math.PI * f) + 0.012 * land, -0.03 * stag - D.back * g],
            rotate: [-4 * hitB - 4 * stag * stand - D.tilt * g, 0, 0],
          },
          spine: { rotate: [-6 * hitB + 5 * stag * stand, 0, 0] },
          chest: { rotate: [-8 * hitB + 4 * stag * stand, 5 * hitB, 3 * stag * stand] },
          neck: { rotate: [-5 * hitB + D.neck * g, 0, 0] },
          head: { rotate: [-12 * hitB + D.head * g, 22 * g, 0] },
          'braid.L': { rotate: [0.5 * (18 * lag - 22 * toes), 0, 6 * lag] },
          'braid.R': { rotate: [0.5 * (18 * lag - 22 * toes), 0, -(6 * lag)] },
          cloak: {
            rotate: [8 * hitB - D.cape * flat - 12 * crumple, 0, 0],
            scale: [1 + 0.1 * flat, 1 - 0.15 * crumple, 1 - (1 - D.capeFlat) * flat],
          },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: forearmL },
          // The right foot steps back in the stagger; the legs trail the fall and lie back down.
          'leg.L': { rotate: [legL, 0, 6 * g] },
          'leg.R': { rotate: [plant + 10 * stag * stand + (D.leg + 2) * g * g, 0, -6 * g] },
          'foot.L': { rotate: [plant + sole * (1 - toes) + 16 * toes, 0, 0] },
          'foot.R': { rotate: [-plant - 10 * stag * stand + sole * (1 - toes) + 16 * toes, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ shield arm by the shield's frame
    // The shield is rigid on the forearm, so the shield's pose sets the forearm: give the upper arm's
    // direction (chest rest frame) and the shield's turn (yaw about Y, tilt of the top forward, roll,
    // as in shieldPose). The elbow, the wrist, and the shield center follow; reach and orient solve
    // the arm. The rest values (upper arm at rest, 38, 4, -4) give the rest pose.
    const shieldLocal = (p: V3): V3 => rotZ(rotX(rotY(p, -38), -4), 4);
    const shieldTurn = (p: V3, yaw: number, tilt: number, roll: number): V3 => rotY(rotX(rotZ(p, roll), tilt), yaw);
    const ELBOW_IN_SHIELD = shieldLocal(sub(ELBOW_L, SHIELD_C));
    const WRIST_IN_SHIELD = shieldLocal(sub(WRIST_L, SHIELD_C));
    const UPPER_L = norm(sub(ELBOW_L, SHOULDER));
    const UPPER_LEN = Math.hypot(...sub(ELBOW_L, SHOULDER));
    const shieldArm = (u: V3, yaw: number, tilt: number, roll = -4) => {
      const d = norm(u);
      const elbow = add(SHOULDER, [d[0] * UPPER_LEN, d[1] * UPPER_LEN, d[2] * UPPER_LEN]);
      const center = sub(elbow, shieldTurn(ELBOW_IN_SHIELD, yaw, tilt, roll));
      const wrist = add(center, shieldTurn(WRIST_IN_SHIELD, yaw, tilt, roll));
      const arm = reach(ARM_L, wrist, elbow);
      const lower = orient([arm.upper], { dir: FOREARM_L, up: SHIELD_N }, { dir: norm(sub(wrist, elbow)), up: shieldTurn([0, 0, 1], yaw, tilt, roll) });
      return { upper: arm.upper, lower };
    };
    const blend = (a: V3, parts: readonly (readonly [V3, number])[]): V3 =>
      parts.reduce<V3>((acc, [v, w]) => add(acc, [(v[0] - a[0]) * w, (v[1] - a[1]) * w, (v[2] - a[2]) * w]), a);

    // attack2: a shield bash. Brace: the hips turn and the chest turns the left shoulder forward,
    // the weight goes back, the elbow draws back and the shield face turns to the front. Drive: the
    // left foot steps forward, the hips drop and move forward, and the shield punches straight
    // forward at chest height, the top tipped forward so the rim stays clear of the helm. The sword
    // stays ready at the right side. The plume and the cape lag and whip at the stop.
    const BASH = {
      braceU: [0.6, -0.7, -0.38] as V3, // the elbow draws back and out
      braceYaw: 36, // with the body's turn of -26, the face points nearly forward
      braceTilt: 8,
      driveU: [0.3, -0.1, 1] as V3, // the upper arm points forward, a little out (the forearm clears the cuirass)
      driveYaw: 14, // with the body's turn of -14, the face points straight forward
      driveTilt: 9,
      step: 26, // the lunge: the left foot lands 2 * LEG * sin(step) ahead
    };
    k.animation('attack2', {
      duration: 0.75,
      loop: false,
      pose: (_t, p) => {
        const brace = ease(0, 0.28, p) * (1 - ease(0.3, 0.44, p));
        const drive = ease(0.3, 0.46, p) * (1 - ease(0.62, 1, p));
        const ready = ease(0, 0.2, p) * (1 - ease(0.62, 1, p));
        const lead = ease(0.34, 0.48, p) * (1 - ease(0.64, 0.96, p)); // the left foot lags the hips a little, so it lifts
        const lag = keys(p, [[0, 0], [0.26, 0.35], [0.4, -0.2], [0.48, -1], [0.58, 0.85], [0.7, -0.35], [0.84, 0.15], [1, 0]] as const, 'spline');

        const u = blend(UPPER_L, [[BASH.braceU, brace], [BASH.driveU, drive]]);
        const yaw = 38 + (BASH.braceYaw - 38) * brace + (BASH.driveYaw - 38) * drive;
        const tilt = 4 + (BASH.braceTilt - 4) * brace + (BASH.driveTilt - 4) * drive;
        const armL = shieldArm(u, yaw, tilt);

        // The right foot stays planted; the left foot lands ahead.
        const reachZ = LEG * Math.sin(BASH.step * rad);
        const hipsZ = -0.015 * brace + reachZ * drive;
        const footL = 2 * reachZ * lead;
        const aR = Math.asin(hipsZ / LEG) / rad;
        const aL = -Math.asin((footL - hipsZ) / LEG) / rad;
        return {
          hips: { move: [0, -Math.max(legDrop(LEG, aL), legDrop(LEG, aR)), hipsZ], rotate: [0, -8 * brace - 4 * drive, 0] },
          spine: { rotate: [3 * brace + 8 * drive, 0, 0] },
          chest: { rotate: [2 * brace + 4 * drive, -18 * brace - 10 * drive, 0] },
          // The head keeps looking forward and lifts the chin a little behind the shield.
          neck: { rotate: [-3 * drive, 7 * brace + 4 * drive, 0] },
          head: { rotate: [2 * brace - 7 * drive, 14 * brace + 8 * drive, 0] },
          'braid.L': { rotate: [0.5 * (14 * lag), 0, 3 * lag] },
          'braid.R': { rotate: [0.5 * (14 * lag), 0, -(3 * lag)] },
          cloak: { rotate: [-10 * lag, 0, 0] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: [-6 * ready, 0, -6 * ready] },
          'forearm.R': { rotate: [-10 * ready, 0, 0] },
          'leg.L': { rotate: [aL, 0, 0] },
          'leg.R': { rotate: [aR, 0, 0] },
          'foot.L': { rotate: [-aL, 0, 0] },
          'foot.R': { rotate: [-aR, 0, 0] },
        };
      },
    });

    // victory: the sword goes out to the right and up, high beside the helm (the blade leans out,
    // clear of the helm and the plume, the flat to the front); the shield comes up at his left side;
    // the chest opens and tilts a little to the left. Then a proud nod, and he holds the pose with
    // the chin up. The plume and the cape sway.
    const WIN = {
      wrist: [-0.33, 0.42, 0.04] as V3,
      blade: norm([-0.5, 0.85, 0.1]),
      shieldU: [0.85, 0.25, 0.35] as V3, // the upper arm out and a little up: the shield rises about 7 cm
      shieldYaw: 48,
      shieldTilt: 0,
    };
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const r = ease(0, 0.3, p);
        const shield = ease(0.06, 0.34, p);
        const nod = keys(p, [[0.42, 0], [0.54, 1], [0.68, -0.4], [0.8, 0]] as const);
        const pride = ease(0.6, 0.8, p);
        const look = r * (1 - ease(0.42, 0.6, p));
        const lag = keys(p, [[0, 0], [0.14, -0.6], [0.3, 0.7], [0.42, -0.3], [0.56, -0.8], [0.7, 0.9], [0.84, -0.35], [1, 0.1]] as const, 'spline');
        const sway = keys(p, [[0, 0], [0.18, -0.5], [0.34, 0.6], [0.5, -0.3], [0.66, 0.45], [0.82, -0.15], [1, 0.05]] as const, 'spline');

        const wristR = keys(
          p,
          [
            [0, WRIST_R],
            [0.12, [-0.27, 0.37, 0.1]],
            [0.26, [-0.328, 0.424, 0.042]],
            [0.32, [-0.33, 0.428, 0.04]],
            [0.42, WIN.wrist],
          ] as const,
          'spline',
        );
        const poleR = keys(p, [[0, POLE_REST], [0.12, [-0.6, 0.1, -0.1]], [0.3, [-0.6, 0.15, -0.25]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const blade = norm(
          keys(p, [[0, BLADE_DIR], [0.12, norm([-0.85, 0.2, 0.48])], [0.26, norm([-0.5, 0.85, 0.14])], [0.32, norm([-0.5, 0.85, 0.1])], [0.42, WIN.blade]] as const, 'spline'),
        );
        const flatUp = norm(keys(p, [[0, FLAT], [0.12, [0, 1, 0.2]], [0.26, [0.1, 0.2, 1]]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: BLADE_DIR, up: FLAT }, { dir: blade, up: flatUp });

        const armL = shieldArm(blend(UPPER_L, [[WIN.shieldU, shield]]), 38 + (WIN.shieldYaw - 38) * shield, 4 + (WIN.shieldTilt - 4) * shield);
        const stance = 4 * r;
        return {
          hips: { move: [0, -legDrop(LEG, stance), 0], rotate: [0, 0, 0] },
          spine: { rotate: [-4 * r, 0, -3 * r] },
          chest: { rotate: [-2 * r, 0, -6 * r] },
          // The head leans with the chest, away from the sword; the right ear disc stays clear of the hilt.
          neck: { rotate: [3 * nod, 0, 0] },
          head: { rotate: [-6 * look + 10 * nod - 5 * pride, -10 * look, 0] },
          'braid.L': { rotate: [0.5 * (12 * lag), 0, 6 * sway] },
          'braid.R': { rotate: [0.5 * (12 * lag), 0, -(6 * sway)] },
          cloak: { rotate: [8 * sway, 0, 4 * lag] },
          // The right shoulder lifts a little (a shrug), so the sword goes higher.
          'upperarm.R': { rotate: armR.upper, move: [0, 0.015 * r, 0] },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'leg.L': { rotate: [0, 0, stance] },
          'leg.R': { rotate: [0, 0, -stance] },
          'foot.L': { rotate: [0, 0, -stance] },
          'foot.R': { rotate: [0, 0, stance] },
        };
      },
    });
  },
});
