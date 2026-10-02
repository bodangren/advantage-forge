import { addPart, defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';
import { captainShield } from './parts/captain-shield.js';
import { captainSword } from './parts/captain-sword.js';

/**
 * Captain — Chibi Quest hero (catalog `heroes/support/captain`), about 1.0 m to the top of the
 * hair, faces +Z. Target: docs/hero-mockups/captain_001.jpg. Built on the paladin (the knight's
 * body, face, and chibi skeleton with knee bones), so the heroes read as a set.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite; the hair, the face, the red scarf and
 *   skirt, the gold crest, the sword, and the round shield must read.
 * One idea: a young, confident guard captain: short blond hair swept up in wavy locks, steel plate
 *   with gold lion-crest and rivets, a red scarf, a red tasset skirt with a gold beaded hem, and a
 *   red half-cape; a longsword low in the right hand and a round shield on the left forearm.
 * Proportions: hair top 0.97, eyes 0.63, chin 0.48, shoulders 0.44, belt 0.25, skirt hem 0.15,
 *   knees 0.12; the sword leans out low beside the right hip.
 * Palette (60/30/10): steel #bcc2cb (light) and red #c93a32 (mid), gold #e0b040 accent. Skin
 *   #f2c7a4, hair #d8b048, mail #737a84, belt #6b4226, boots #4a4f55.
 * Bodies: skin, hands, hair, cuirass, rims, mail, pauldrons, bracers, belt, scarf, skirt, ribbon,
 *   cape, leggings, greaves, boots, trim, sword-blade, sword-guard, sword-grip, shield,
 *   shield-face, shield-gold.
 * Rig: the paladin's skeleton; `plume` sways the top of the hair, `cloak` the cape. The sword is
 *   rigid on the right hand, the shield rigid on the left forearm. Clips: idle, walk, run, attack
 *   (a sword slash), attack2 (a rally: the sword high and a step forward), hit, death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#10202c',
  iris: '#5a7a35',
  irisLow: '#88a85a',
  pupil: '#0d1114',
  lid: '#16100c',
  brow: '#a88030',
  mouth: '#a4503f',
  hair: '#d8b048',
  hairDark: '#a88030',
  steel: '#7d8590',
  steelDark: '#8a9098',
  bracer: '#4f565f',
  goldRim: '#d9b24c',
  shieldSteel: '#5a616b',
  gold: '#e0b040',
  red: '#c93a32',
  redDark: '#8a2420',
  cape: '#b83a30',
  mail: '#737a84',
  leather: '#6b4226',
  leggings: '#4a4e57',
  boot: '#6b4226',
  sole: '#2e2a28',
  blade: '#c3c8cf',
  guard: '#a8acb1',
  grip: '#3a2a20',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. Both forearms point forward: the right hand holds the sword low at the hip, the left
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

/** The lion crest: a small shield outline with a crowned top, `h` tall, centered at the origin. */
const crestProfile = (h: number) => {
  const s = h / 0.066;
  const pts: [number, number][] = [
    [-0.03, 0.033],
    [-0.016, 0.024],
    [0, 0.037],
    [0.016, 0.024],
    [0.03, 0.033],
    [0.034, 0.004],
    [0.024, -0.018],
    [0, -0.033],
    [-0.024, -0.018],
    [-0.034, 0.004],
  ];
  return profile.polygon(pts.map(([x, y]) => [x * s, y * s] as [number, number]));
};

export default defineAsset({
  name: 'captain',
  description: 'Chibi guard captain hero with swept blond hair, steel plate with gold, a red scarf, skirt, and half-cape, a longsword, and a round shield.',
  detail: 0.006,
  reference: 'docs/hero-mockups/captain_001.jpg',
  // Color slots for individual captains (the first option is the default look). The clothing slot
  // is the scarf, the skirt, and the cape; the steel, the gold, and the leather keep their colors.
  variants: {
    eyes: { green: C.iris, brown: '#6e4020', blue: '#2f6aa8' },
    hair: { blond: C.hair, brown: '#4a2e1c', black: '#231a17' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { red: C.red, blue: '#2f58b8', green: '#2e7a3c' },
  },
  presets: {
    default: { eyes: 'green', hair: 'blond', skin: 'fair', clothing: 'red' },
    blue: { eyes: 'blue', hair: 'brown', skin: 'tan', clothing: 'blue' },
    green: { eyes: 'brown', hair: 'black', skin: 'brown', clothing: 'green' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 1 }),
      cloth: k.tint('clothing'),
      clothDark: k.tint('clothing', { color: C.redDark, follow: 1 }),
      cape: k.tint('clothing', { color: C.cape, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    const PLUME_AT: V3 = [0.02, 0.87, 0.05]; // the root of the top curl of the hair
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      plume: { parent: 'head', at: PLUME_AT, tail: [-0.02, 0.95, 0] },
      cloak: { parent: 'chest', at: [0, 0.41, -0.13] },
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
    // Small round human ears, a little cupped.
    const ears = pair(
      sdf
        .ellipsoid([0.026, 0.04, 0.03])
        .subtract(sdf.sphere(0.015).at(0.016, 0, 0.006))
        .rotateY(-12)
        .at(0.2, 0.61, -0.01)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.022));
    const pupil = pair(at(sdf.ellipsoid([0.028, 0.032, 0.07]), EYE[0], EYE[1] + 0.001));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    // Straight, thick brows, a little lower at the inner ends: calm and sure.
    const brows = pair(sdf.extrude(profile.arc(0.16, 0.022, 70, 106), 0.3).at(0.1, 0.712 - 0.16, 0.1).rotateZ(-3));
    const smile = sdf.extrude(profile.arc(0.065, 0.011, 245, 295), 0.3).at(0, 0.528 + 0.065, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.135, 0.56));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(smile, C.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair: short wavy locks swept up
    // `hp` puts a strand point on the skull (a point in that direction from the head center) and
    // lifts the strand's center off it by part of its radius, so the locks lie on the head.
    const hp = (x: number, y: number, z: number, r: number, lift = 0.2): [number, number, number, number] => {
      const s = sdf.surfacePoint(head, [x * 3, HEAD_Y + (y - HEAD_Y) * 3, z * 3], r * lift);
      return [s[0], s[1], s[2], r];
    };
    const faceMask = sdf.ellipsoid([0.25, 0.15, 0.24]).at(0, 0.612, 0.15);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.02, HEAD[1] + 0.02, HEAD[2] + 0.02])
      .at(0, HEAD_Y + 0.012, -0.012)
      .smoothSubtract(0.015, faceMask)
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.56));
    // Side-parted hair hugging the skull: ten wavy locks (r 0.025) sweep from the part back and down
    // over the ears to the nape, where the tips turn up; one big curl loops over the right brow and a
    // short fringe lock sweeps the other way. The top stays low (hair top about 0.95).
    const lock = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.02);
    const tipUp = (p: [number, number, number, number], dx: number, dy: number, dz: number, r: number): [number, number, number, number] => [p[0] + dx, p[1] + dy, p[2] + dz, r];
    const locksA = pair(
      lock([hp(0.04, 0.9, 0.04, 0.026, 1.0), hp(0.12, 0.86, 0.0, 0.026, 1.1), hp(0.19, 0.78, -0.04, 0.025, 1.0), hp(0.2, 0.69, -0.09, 0.022, 1.0), hp(0.17, 0.61, -0.15, 0.018, 1.0), tipUp(hp(0.12, 0.585, -0.19, 0.014, 1.0), -0.01, 0.028, -0.012, 0.008)]),
    );
    const locksB = pair(
      lock([hp(0.03, 0.91, -0.04, 0.026, 1.0), hp(0.1, 0.88, -0.1, 0.026, 1.1), hp(0.15, 0.8, -0.15, 0.025, 1.0), hp(0.135, 0.7, -0.19, 0.022, 1.0), hp(0.095, 0.61, -0.2, 0.018, 1.0), tipUp(hp(0.06, 0.585, -0.19, 0.014, 1.0), -0.012, 0.03, -0.01, 0.008)]),
    );
    const locksC = pair(
      lock([hp(0.06, 0.88, 0.09, 0.025, 1.0), hp(0.14, 0.84, 0.08, 0.025, 1.1), hp(0.19, 0.76, 0.05, 0.022, 1.0), hp(0.205, 0.69, 0.03, 0.016, 1.0), hp(0.205, 0.65, 0.03, 0.008, 1.0)]),
    );
    const locksD = pair(
      lock([hp(0.05, 0.86, -0.15, 0.026, 1.0), hp(0.065, 0.76, -0.19, 0.025, 1.1), hp(0.045, 0.66, -0.2, 0.02, 1.0), hp(0.02, 0.6, -0.18, 0.015, 1.0), tipUp(hp(0.0, 0.58, -0.17, 0.012, 1.0), 0.0, 0.03, -0.012, 0.008)]),
    );
    // The big forehead curl: from the part over the right brow, then the tip loops back up.
    const curl1 = lock([
      hp(-0.02, 0.9, 0.07, 0.03, 0.9),
      hp(-0.07, 0.865, 0.15, 0.03, 1.2),
      hp(-0.115, 0.805, 0.17, 0.029, 1.3),
      hp(-0.138, 0.76, 0.15, 0.027, 1.3),
      hp(-0.12, 0.728, 0.145, 0.024, 1.3),
      hp(-0.085, 0.74, 0.15, 0.016, 1.5),
    ]);
    const fringe = lock([hp(0.04, 0.9, 0.07, 0.026, 0.5), hp(0.11, 0.85, 0.14, 0.024, 0.6), hp(0.17, 0.79, 0.12, 0.02, 0.6), hp(0.19, 0.75, 0.09, 0.01, 0.6)]);
    // A low tuft on the crown, leaning back; it sways on the `plume` bone.
    const quiff = sdf
      .chain(
        [
          [0.04, 0.905, 0.05, 0.03],
          [0.0, 0.925, 0.03, 0.028],
          [-0.03, 0.925, -0.01, 0.018],
        ],
        0.02,
      )
      .bone('plume');
    const hair = sdf
      .smoothUnion(0.02, sdf.smoothUnion(0.007, cap, locksA, locksB, locksC, locksD, curl1, fringe).bone('head'), quiff)
      .paintFn((x, y, z, base) => {
        const w = Math.sin(x * 55 + y * 38 + Math.sin(z * 30) * 2);
        return w > 0.2 ? mixRgb(base, rgb(T.hairDark), Math.min(0.9, (w - 0.2) * 1.8)) : base;
      });
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.0057 });

    // ------------------------------------------------------------------ torso: the steel breastplate
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
            [0.138, 0.2],
            [0.14, 0.165],
            [0.132, 0.152],
            [0, 0.152],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    // A molded breastplate with a soft center ridge, ending in a small flare at the waist.
    const ridge = sdf.capsule([0, 0.43, 0.105], [0, 0.29, 0.112], 0.014).scale([0.8, 1, 1]);
    const cuirass = torso
      .round(0.014)
      .smoothUnion(0.02, ridge)
      .intersect(sdf.halfSpace([0, -1, 0], -0.248))
      .intersect(sdf.halfSpace([0, 1, 0], 0.47));
    k.body('cuirass', cuirass, { color: C.steel, roughness: 0.4, metalness: 0.85, bone: 'chest' });

    // Mail sleeves on the upper arms, rings in the normal map.
    const rings = (x: number, y: number, z: number) => {
      const u = Math.atan2(z, x) * 30;
      const v = y * 190 + (Math.floor(u / Math.PI) % 2) * Math.PI * 0.5;
      return 0.0012 * Math.abs(Math.sin(u)) * Math.abs(Math.sin(v));
    };
    const sleeve = (s: V3, e: V3, tag: string) => sdf.cone(lerp(s, e, 0.6), lerp(s, e, 1.12), 0.0475, 0.0455).bone(tag);
    k.body('mail', sdf.union(sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R')), {
      color: C.mail,
      roughness: 0.55,
      metalness: 0.7,
      bump: rings,
    });
    // Red cloth sleeves under the pauldrons, down to the mail and the bracers.
    const clothSleeve = (s: V3, e: V3, tag: string) => sdf.cone(s, lerp(s, e, 0.68), 0.05, 0.047).bone(tag);
    k.body('sleeves', sdf.union(clothSleeve(SHOULDER, ELBOW_L, 'upperarm.L'), clothSleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R')), {
      color: T.cloth,
      roughness: 0.8,
    });

    // ------------------------------------------------------------------ pauldrons (two lames each)
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.1 * s, 0.066 * s, 0.096 * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.016 * s))
        .round(0.003);
    const pauldronPose = (s: sdf.Shape) => s.rotateZ(-26).at(0.158, 0.432, 0);
    const pauldronLocal = sdf.union(lame(1), lame(1.14).at(0, -0.034, 0));
    const pauldrons = pair(pauldronPose(pauldronLocal).bone('upperarm.L'));
    k.body('pauldrons', pauldrons, { color: C.steel, roughness: 0.4, metalness: 0.85 });
    // Gold trim along the lower edge of each lame.
    const edge = (s: number, y: number) =>
      lame(s)
        .round(0.003)
        .smoothIntersect(0.004, sdf.box([0.4, 0.014, 0.4]).at(0, -0.009 * s, 0))
        .at(0, y, 0);
    const pauldronTrim = pair(pauldronPose(sdf.union(edge(1, 0), edge(1.14, -0.034))).bone('upperarm.L'));
    // Raised dark rims: a band around the top lame and one on the lower lame.
    const pauldronRim = pair(
      pauldronPose(
        sdf.union(
          lame(1).round(0.004).intersect(sdf.box([0.4, 0.009, 0.4]).at(0, 0.03, 0)),
          lame(1.14).round(0.004).intersect(sdf.box([0.4, 0.009, 0.4]).at(0, -0.034 + 0.034, 0)).subtract(lame(1).round(0.004)),
        ),
      ).bone('upperarm.L'),
    );

    // ------------------------------------------------------------------ bracers and hands
    const vambrace = (e: V3, w: V3) => sdf.cone(lerp(e, w, 0.15), lerp(e, w, 1.02), 0.041, 0.047).round(0.003);
    const bracerRings = (e: V3, w: V3) =>
      sdf.union(
        sdf.cone(lerp(e, w, 0.15), lerp(e, w, 0.24), 0.046, 0.0465).round(0.003),
        sdf.cone(lerp(e, w, 0.92), lerp(e, w, 1.02), 0.051, 0.052).round(0.003),
      );
    const fistR = handPose(HAND_R, WRIST_R)(fistLocal(-1));
    const fistL = handPose(HAND_L, WRIST_L)(fistLocal(1));
    k.body('hands', sdf.union(fistL.bone('hand.L'), fistR.bone('hand.R')), { color: T.skin, roughness: 0.55 });
    k.body(
      'bracers',
      sdf.union(
        vambrace(ELBOW_L, WRIST_L).bone('forearm.L'),
        vambrace(ELBOW_R, WRIST_R).bone('forearm.R'),
      ),
      { color: C.bracer, roughness: 0.4, metalness: 0.85 },
    );
    const bracerRims = sdf.union(bracerRings(ELBOW_L, WRIST_L).bone('forearm.L'), bracerRings(ELBOW_R, WRIST_R).bone('forearm.R'));

    // ------------------------------------------------------------------ belt, buckle, medal
    const beltY = 0.252;
    const belt = cuirass.round(0.013).smoothIntersect(0.005, sdf.box([0.5, 0.046, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), { color: C.leather, roughness: 0.65 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    // A gold spearhead buckle: an extruded rhombus, stretched along the belt's height.
    const SPEAR = profile.polygon([
      [0, 0.032],
      [0.022, 0.002],
      [0, -0.03],
      [-0.022, 0.002],
    ]);
    const buckle = sdf.extrude(SPEAR, 0.014, 0.004).at(0, beltY, beltZ + 0.004);
    const beltPlate = sdf.extrude(profile.rect([0.07, 0.042], 0.01), 0.012, 0.004).at(0, beltY, beltZ + 0.0);

    // The skirt (tasset): a flared thin shell from the belt down to y 0.15, with folds.
    const SKIRT_R = [0.128, 0.142, 0.18, 0.168] as const; // inner and outer radius at the belt, then at the hem
    const skirtBase = sdf
      .revolve(
        profile.polygon([
          [SKIRT_R[0], 0.245],
          [SKIRT_R[1], 0.245],
          [SKIRT_R[2], 0.15],
          [SKIRT_R[3], 0.15],
        ]),
      )
      .scale([1, 1, 0.85]);
    const folds = (x: number, y: number, z: number) => Math.sin(Math.atan2(z, x) * 9) * Math.min(1, Math.max(0, (0.25 - y) / 0.1));
    const skirtShape = skirtBase.displace(0.006, folds);
    const skirt = skirtShape
      .round(0.002)
      .paintFn((x, y, z, base) => {
        const f = Math.sin(Math.atan2(z, x) * 9);
        return f < -0.3 ? mixRgb(base, rgb(T.clothDark), Math.min(0.8, (-0.3 - f) * 1.6)) : base;
      });
    k.body('skirt', skirt.bone('hips'), { color: T.cloth, roughness: 0.8, detail: 0.005 });
    // A gold scalloped hem: a thin band and a row of beads hung below it across the front.
    const hemBand = skirtShape.round(0.003).intersect(sdf.box([0.6, 0.012, 0.6]).at(0, 0.156, 0));
    const beads = sdf.union(
      ...Array.from({ length: 15 }, (_, i) => {
        const a = (-84 + i * 12) * rad;
        const R = 0.176;
        return sdf.ellipsoid([0.0085, 0.011, 0.0085]).at(R * Math.sin(a), 0.146, R * 0.85 * Math.cos(a));
      }),
    );
    // Four steel tassets (0.07 x 0.09 x 0.012) over the skirt, each with a gold rim; the red shows
    // between them and at the hem. They follow the skirt's flare and face outward.
    const tassetAt = (deg: number) => {
      const R = 0.163;
      const a = deg * rad;
      const pose = (s: sdf.Shape) => s.rotateX(-22).rotateY(deg).at(R * Math.sin(a), 0.208, R * 0.85 * Math.cos(a)).bone('hips');
      const plate = pose(sdf.box([0.07, 0.09, 0.012], 0.004));
      const rim = pose(sdf.box([0.078, 0.098, 0.016], 0.004).subtract(sdf.box([0.062, 0.082, 0.1])));
      return { plate, rim };
    };
    const tassets = [-58, -18, 18, 58].map(tassetAt);
    k.body('tassets', sdf.union(...tassets.map((t) => t.plate)), { color: C.steel, roughness: 0.4, metalness: 0.85, detail: 0.005 });
    const tassetRims = sdf.union(...tassets.map((t) => t.rim));
    // The medal: a gold disc on a short red ribbon, hanging from the belt at the left hip.
    const medalX = 0.088;
    const skirtZ = (y: number) => sdf.raycast(skirtShape, [medalX, y, 1], [0, 0, -1])![2];
    const ribbon = sdf.box([0.014, 0.05, 0.006], 0.002).rotateX(-14).at(medalX, 0.212, skirtZ(0.212) + 0.004);
    const medal = sdf.cylinder(0.02, 0.008, 0.003).rotateX(90).rotateX(-14).at(medalX, 0.172, skirtZ(0.172) + 0.008);
    k.body('ribbon', ribbon.bone('hips'), { color: T.cloth, roughness: 0.8 });

    // ------------------------------------------------------------------ scarf and cape
    const scarfRing = sdf.torus(0.1, 0.04).scale([1, 1, 0.9]).at(0, 0.45, -0.005);
    const tailAt = sdf.surfacePoint(cuirass, [0.05, 0.43, 0.3], 0.004);
    const scarfTail = sdf
      .box([0.05, 0.085, 0.014], 0.006)
      .rotateX(-14)
      .rotateZ(-6)
      .at(tailAt[0], 0.415, tailAt[2] + 0.004);
    const scarf = sdf
      .smoothUnion(0.012, scarfRing, scarfTail)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.43), T.clothDark, 0.012)
      .paintWhere(sdf.box([0.06, 0.1, 0.1]).at(0.05, 0.43, 0.1), T.clothDark, 0.015);
    k.body('scarf', scarf.bone('chest'), { color: T.cloth, roughness: 0.8 });

    // A cone of cloth behind, open at the top and the hem; the folds bend both walls alike. The
    // half-cape falls to the knees and flares out past the arms; its inside is darker.
    const capeFolds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(z, x) * 6) * Math.min(1, Math.max(0, (0.4 - y) / 0.26));
    const capeCone = (r0: number, r1: number, y0: number, y1: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0, y0],
            [r0, y0],
            [r1, y1],
            [0, y1],
          ]),
        )
        .scale([1, 1, 0.85])
        .displace(0.012, capeFolds);
    const capeInner = capeCone(0.18, 0.34, 0.46, 0.11).at(0, 0, -0.025);
    const cape = capeCone(0.2, 0.36, 0.44, 0.12)
      .at(0, 0, -0.025)
      .subtract(capeInner)
      .intersect(sdf.halfSpace([0, 0, 1], -0.02))
      .paintWhere(capeInner.round(0.005), T.clothDark, 0.004);
    k.body('cape', cape.bone('cloak'), { color: T.cape, roughness: 0.8 });

    // ------------------------------------------------------------------ legs: leggings, greaves, boots
    const leggings = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.112, 0.05, 0.084]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.095, 0.1, 0.004], 0.046).bone('leg.L')),
    );
    k.body('leggings', leggings, { color: C.leggings, roughness: 0.85 });
    const knee = sdf.ellipsoid([0.055, 0.032, 0.05]).at(0.095, 0.11, 0.022).bone('leg.L');
    const greave = sdf.cone([0.094, 0.14, 0.006], [0.098, 0.058, 0.004], 0.05, 0.052).round(0.002).bone('leg.L');
    const sabatonFoot = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.052, 0.06, 0.02).at(0, 0.05, 0),
        sdf.ellipsoid([0.058, 0.05, 0.102]).at(0, 0.045, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    // Two lames across the toe, and a dark sole.
    const toeLines = sdf.union(
      sdf.box([0.2, 0.006, 0.2]).rotateX(-30).at(0, 0.075, 0.06),
      sdf.box([0.2, 0.006, 0.2]).rotateX(-40).at(0, 0.058, 0.1),
    );
    const bootPose = (s: sdf.Shape) => s.rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    const boot = bootPose(
      sabatonFoot
        .smoothSubtract(0.003, toeLines.intersect(sdf.halfSpace([0, 0, -1], -0.04)))
        .paintWhere(sdf.halfSpace([0, 1, 0], 0.012), C.sole),
    );
    // Steel toe caps: the boot's front grown by 4 mm, above the sole.
    const toeCap = bootPose(
      sabatonFoot
        .round(0.004)
        .intersect(sdf.ellipsoid([0.08, 0.07, 0.045]).at(0, 0.04, 0.14))
        .intersect(sdf.halfSpace([0, -1, 0], -0.016)),
    );
    k.body('greaves', pair(sdf.smoothUnion(0.01, greave, knee)), { color: C.steel, roughness: 0.4, metalness: 0.85 });
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.65, detail: 0.008 });
    k.body('toecaps', pair(toeCap), { color: C.steel, roughness: 0.4, metalness: 0.85, detail: 0.006 });
    const greaveRims = pair(
      sdf
        .union(
          sdf.cone([0.098, 0.068, 0.004], [0.098, 0.06, 0.004], 0.0545, 0.0545).round(0.002),
          sdf.cone([0.094, 0.14, 0.006], [0.095, 0.13, 0.006], 0.0535, 0.0535).round(0.002),
        )
        .bone('leg.L'),
    );

    // ------------------------------------------------------------------ raised dark rims on the plates
    // A rim is the plate's own shape grown by 4 mm and cut to a thin band, so the edge of each plate
    // stands proud and reads as a plate edge.
    const chestRim = sdf.union(
      cuirass.round(0.004).intersect(sdf.box([0.5, 0.009, 0.5]).at(0, 0.296, 0)),
      cuirass.round(0.004).intersect(sdf.box([0.5, 0.008, 0.5]).at(0, 0.458, 0)),
      pair(cuirass.round(0.004).intersect(sdf.box([0.009, 0.16, 0.5]).at(0.13, 0.36, 0))),
    );
    k.body(
      'rims',
      sdf.union(chestRim.bone('chest'), pauldronRim, bracerRims, greaveRims),
      { color: C.goldRim, roughness: 0.35, metalness: 0.8, detail: 0.0085 },
    );

    // ------------------------------------------------------------------ gold trims on the body
    const CREST_Y = 0.355;
    const layer = (out: number, inn: number) => cuirass.round(out).subtract(cuirass.round(inn));
    const chestCrest = sdf.union(
      layer(0.012, 0).intersect(sdf.extrude(crestProfile(0.066), 0.3).at(0, CREST_Y, 0.2)),
      layer(0.018, 0).intersect(sdf.extrude(profile.circle(0.017), 0.3, 0.004).at(0, CREST_Y + 0.004, 0.2)),
    );
    const lionDisc = sdf.extrude(profile.circle(0.011), 0.3).at(0, CREST_Y + 0.004, 0.2);
    const rivetAt = (x: number, y: number) => sdf.surfacePoint(cuirass, [x, y, 0.3], 0.001);
    const rivets = sdf.union(
      ...[
        [0.078, 0.428],
        [-0.078, 0.428],
        [0.092, 0.318],
        [-0.092, 0.318],
      ].map(([x = 0, y = 0]) => sdf.sphere(0.0105).at(...rivetAt(x, y))),
    );
    const kneeGold = pair(sdf.ellipsoid([0.028, 0.024, 0.012]).at(0.095, 0.11, 0.068).bone('leg.L'));
    k.body(
      'trim',
      sdf.union(buckle.bone('spine'), beltPlate.bone('spine'), medal.bone('hips'), pauldronTrim, kneeGold, chestCrest.paintWhere(lionDisc, '#a8781f', 0.004).bone('chest'), rivets.bone('chest'), hemBand.bone('hips'), beads.bone('hips'), tassetRims),
      { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.0062 },
    );

    // ------------------------------------------------------------------ longsword and round shield
    // Parts: assets/parts/captain-sword.ts (grip center at the origin, blade up) and
    // assets/parts/captain-shield.ts (disc center on the back plane, face toward +Z).
    const GRIP = handPoint(HAND_R, WRIST_R, [-0.007, -0.04, 0.004]);
    // The blade leans out to the right and a little forward: held low beside the hip.
    const SWORD_TILT = { x: 12, z: 34 };
    const swordPose = (s: sdf.Shape) => s.rotateX(SWORD_TILT.x).rotateZ(SWORD_TILT.z).at(...GRIP);
    addPart(k, captainSword(), { pose: swordPose });
    // It sits low on the forearm, so the top edge keeps clear of the cheek.
    const shieldPose = (s: sdf.Shape) => s.rotateZ(-4).rotateX(4).rotateY(38).at(0.236, 0.28, 0.092);
    addPart(k, captainShield(), { pose: shieldPose });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;
    // The top curl of the hair sways less than the knight's plume did.
    const curl = (x: number, y: number, z: number) => [0.35 * x, 0.35 * y, 0.35 * z] as const;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 1.5 * wave(p, 1, 0.1)] },
        plume: { rotate: curl(3 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)) },
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
          plume: { rotate: curl(flow * 0.5 + 5 * wave(p, 2, 0.2), 0, 4 * wave(p, 2, 0.1)) },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.15 * s + shield[0], 0, 3] as const },
          'forearm.L': { rotate: [shield[1], 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, -6] as const },
          'forearm.R': { rotate: [-armSwing * 0.2 * Math.max(0, s), 0, 0] as const },
          // The wrist turns back against the arm's swing, so the sword stays low and out from the
          // hip instead of swinging across the body.
          'hand.R': { rotate: [armSwing * (0.6 * s + 0.2 * Math.max(0, s)), 0, 6] as const },
        };
      },
    });
    // A paladin in armor walks heavier: short steps, a low swing, long stances.
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.62, 0.005, 28, 3, 6, [4, 0]));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.42, 0.025, 50, 12, 22));


    // attack: a sword slash, solved by targets (as the knight's slash). The wrist
    // follows keys in the chest's rest frame (reach); the haft follows its own keys; edgeUp keeps
    // the head's axis in the swing plane, so a face leads. The arm is short and the head is big, so
    // the wind-up rises on the right side, out beside the head, with the sword tipped back over
    // the right shoulder; then the haft comes up straight beside the head, over and forward, and
    // the head strikes down in front at knee height. The chest leans back in the wind-up and drives
    // forward in the strike, the left foot steps, the hips drop, and the shield stays up in front.
    const { keys, reach, orient, edgeUp } = motion;
    const norm = (a: V3): V3 => {
      const l = Math.hypot(a[0], a[1], a[2]);
      return [a[0] / l, a[1] / l, a[2] / l];
    };
    const SWORD_DIR = rotZ(rotX([0, 1, 0], SWORD_TILT.x), SWORD_TILT.z); // the blade toward the tip, at rest
    // Across the blade, normal to its flat, at rest: the solver keeps it normal to the swing, so the edge leads.
    const SWORD_SIDE = rotZ(rotX([0, 0, 1], SWORD_TILT.x), SWORD_TILT.z);
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
    const swordKeys = [
      [0, SWORD_DIR],
      [0.16, norm([-0.45, 0.85, -0.25])], // the blade rises and tips back
      [0.32, norm([-0.5, 0.8, -0.32])], // wound up: the blade up and back over the right shoulder
      [0.42, norm([-0.5, 0.8, -0.34])], // the hold at the top
      [0.52, norm([-0.3, 0.75, 0.55])], // the cut begins: over and forward
      [0.62, norm([0.25, -0.05, 0.96])], // the slash: across the front at waist height
      [0.74, norm([0.5, -0.45, 0.72])], // the follow-through holds, low to the left
      [0.88, norm([-0.2, 0.3, 0.9])], // back up through the front
      [1, SWORD_DIR],
    ] as const;
    const swordAt = (p: number) => keys(p, swordKeys, 'spline');
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.16, [-0.26, 0.39, 0.06]],
            [0.32, [-0.272, 0.46, -0.03]],
            [0.42, [-0.275, 0.464, -0.036]],
            [0.52, [-0.23, 0.42, 0.1]],
            [0.62, [-0.17, 0.35, 0.17]],
            [0.74, [-0.15, 0.34, 0.17]],
            [0.88, [-0.18, 0.34, 0.12]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = norm(swordAt(p));
        // The elbow points out and back in the wind-up, then out, down, and forward through the
        // strike, so the forearm stays in front of the breastplate.
        const pole = keys(p, [
          [0, POLE_REST],
          [0.16, [-0.6, 0.2, -0.2]],
          [0.44, [-0.6, 0.25, -0.15]],
          [0.54, [-0.5, 0.05, 0.4]],
          [0.78, [-0.5, 0.05, 0.4]],
          [1, POLE_REST],
        ] as const);
        const arm = reach(ARM_R, wrist, pole);
        const hand = orient([arm.upper, arm.lower], { dir: SWORD_DIR, up: SWORD_SIDE }, { dir, up: edgeUp(swordAt, p, SWORD_SIDE) });
        const wind = ease(0, 0.32, p) * (1 - ease(0.44, 0.54, p));
        const strike = ease(0.46, 0.62, p) * (1 - ease(0.76, 1, p));
        const step = 22 * strike;
        const guard = ease(0, 0.2, p) * (1 - ease(0.78, 1, p));
        return {
          hips: { move: [0, -legDrop(LEG, step) - 0.006 * wind, 0.025 * strike - 0.012 * wind], rotate: [0, -8 * wind + 10 * strike, 0] },
          spine: { rotate: [-6 * wind + 5 * strike, 0, 0] },
          chest: { rotate: [-4 * wind + 3 * strike, -12 * wind + 12 * strike, 0] },
          head: { rotate: [-4 * wind - 2 * strike, 4 * wind - 4 * strike, 0] },
          plume: { rotate: curl(8 * wind - 16 * strike, 0, -4 * wind + 6 * strike) },
          cloak: { rotate: [-4 * wind + 12 * strike, 0, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          // The shield stays up in front of the left side and comes a little forward.
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
          plume: { rotate: curl(16 * lag, 0, 5 * lag) },
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

    // death: the blow snaps him back, he staggers a step, then topples onto his back. The big head
    // and the cape hold the body up, so the hips stay high, the neck bends a little forward, and the
    // cape flattens under him (scale). The sword arm falls out to the right with the sword flat on
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
      wristR: [-0.27, 0.35, -0.075] as V3,
      bladeR: norm([-0.86, -0.46, 0.15]),
      wristL: [0.19, 0.235, 0.05] as V3,
      poleL: [0.5, 0.3, -0.3] as V3,
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

        // The sword arm flies out in the blow and falls to the ground on the right; the sword
        // turns flat and points out to the side.
        const wristR = keys(p, [[0, WRIST_R], [0.1, [-0.27, 0.34, 0.08]], [0.36, [-0.28, 0.37, 0.03]], [0.74, D.wristR]] as const);
        const poleR = keys(p, [[0, POLE_REST], [0.2, [-0.6, 0.3, -0.1]], [0.74, [-0.6, 0.4, -0.35]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const blade = norm(keys(p, [[0, SWORD_DIR], [0.1, norm([-0.75, 0.45, 0.48])], [0.4, norm([-0.85, 0.05, 0.45])], [0.74, D.bladeR]] as const));
        const flatUp = norm(keys(p, [[0, SWORD_SIDE], [0.4, SWORD_SIDE], [0.74, [0, 0, 1]]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: SWORD_DIR, up: SWORD_SIDE }, { dir: blade, up: flatUp });

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
          plume: { rotate: curl(18 * lag - 22 * toes, 0, 6 * lag) },
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
    const SHIELD_C: V3 = [0.236, 0.28, 0.092];
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

    // attack2: a rally. The sword rises to the right and high beside the head, the captain steps
    // forward with the left foot and the shield comes forward, then he settles. The hair and the
    // cape lag and whip at the stop.
    const BASH = {
      driveU: [0.3, -0.1, 1] as V3, // the shield arm points forward, a little out
      driveYaw: 14, // with the body's turn, the face points straight forward
      driveTilt: 9,
      step: 26, // the lunge: the left foot lands 2 * LEG * sin(step) ahead
    };
    const RALLY = {
      wrist: [-0.305, 0.42, 0.06] as V3,
      blade: norm([-0.22, 0.97, 0.1]),
    };
    k.animation('attack2', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        const up = ease(0, 0.32, p) * (1 - ease(0.72, 1, p));
        const lunge = ease(0.22, 0.46, p) * (1 - ease(0.66, 1, p));
        const lead = ease(0.28, 0.46, p) * (1 - ease(0.62, 0.94, p)); // the left foot lags the hips a little, so it lifts
        const lag = keys(p, [[0, 0], [0.26, 0.35], [0.4, -0.2], [0.48, -1], [0.58, 0.85], [0.7, -0.35], [0.84, 0.15], [1, 0]] as const, 'spline');

        const wristR = keys(
          p,
          [
            [0, WRIST_R],
            [0.12, [-0.27, 0.37, 0.1]],
            [0.3, RALLY.wrist],
            [0.66, RALLY.wrist],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const poleR = keys(p, [[0, POLE_REST], [0.12, [-0.6, 0.1, -0.1]], [0.3, [-0.6, 0.15, -0.25]], [0.66, [-0.6, 0.15, -0.25]], [1, POLE_REST]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const blade = norm(
          keys(p, [[0, SWORD_DIR], [0.12, norm([-0.85, 0.2, 0.48])], [0.3, RALLY.blade], [0.66, RALLY.blade], [1, SWORD_DIR]] as const, 'spline'),
        );
        const flatUp = norm(keys(p, [[0, SWORD_SIDE], [0.12, [0.5, 0.3, 0.8]], [0.3, [0.95, 0.25, 0.1]], [0.66, [0.95, 0.25, 0.1]], [1, SWORD_SIDE]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: SWORD_DIR, up: SWORD_SIDE }, { dir: blade, up: flatUp });

        // The shield comes forward in front of the left side.
        const u = blend(UPPER_L, [[BASH.driveU, lunge]]);
        const armL = shieldArm(u, 38 + (BASH.driveYaw - 38) * lunge, 4 + (BASH.driveTilt - 4) * lunge);

        // The right foot stays planted; the left foot lands ahead.
        const reachZ = LEG * Math.sin(BASH.step * rad);
        const hipsZ = reachZ * lunge;
        const footL = 2 * reachZ * lead;
        const aR = Math.asin(hipsZ / LEG) / rad;
        const aL = -Math.asin((footL - hipsZ) / LEG) / rad;
        return {
          hips: { move: [0, -Math.max(legDrop(LEG, aL), legDrop(LEG, aR)), hipsZ], rotate: [0, -4 * lunge, 0] },
          spine: { rotate: [-3 * up + 6 * lunge, 0, -3 * up] },
          chest: { rotate: [-2 * up + 3 * lunge, -6 * lunge, -5 * up] },
          neck: { rotate: [-2 * lunge, 0, 0] },
          head: { rotate: [-5 * up, -8 * up, 0] },
          plume: { rotate: curl(14 * lag, 0, 4 * lag) },
          cloak: { rotate: [-10 * lag, 0, 0] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper, move: [0, 0.015 * up, 0] },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: hand },
          'leg.L': { rotate: [aL, 0, 0] },
          'leg.R': { rotate: [aR, 0, 0] },
          'foot.L': { rotate: [-aL, 0, 0] },
          'foot.R': { rotate: [-aR, 0, 0] },
        };
      },
    });

    // victory: the sword goes out to the right and up, high beside the head (the haft leans out,
    // clear of the hair); the shield comes up at his left side;
    // the chest opens and tilts a little to the left. Then a proud nod, and he holds the pose with
    // the chin up. The top curl and the cape sway.
    const WIN = {
      wrist: [-0.305, 0.42, 0.06] as V3,
      blade: norm([-0.22, 0.97, 0.1]),
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
            [0.26, [-0.303, 0.424, 0.058]],
            [0.32, [-0.305, 0.422, 0.06]],
            [0.42, WIN.wrist],
          ] as const,
          'spline',
        );
        const poleR = keys(p, [[0, POLE_REST], [0.12, [-0.6, 0.1, -0.1]], [0.3, [-0.6, 0.15, -0.25]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const blade = norm(
          keys(p, [[0, SWORD_DIR], [0.12, norm([-0.85, 0.2, 0.48])], [0.26, norm([-0.26, 0.95, 0.14])], [0.32, norm([-0.18, 0.98, 0.1])], [0.42, WIN.blade]] as const, 'spline'),
        );
        const flatUp = norm(keys(p, [[0, SWORD_SIDE], [0.12, [0.5, 0.3, 0.8]], [0.26, [0.95, 0.25, 0.1]]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: SWORD_DIR, up: SWORD_SIDE }, { dir: blade, up: flatUp });

        const armL = shieldArm(blend(UPPER_L, [[WIN.shieldU, shield]]), 38 + (WIN.shieldYaw - 38) * shield, 4 + (WIN.shieldTilt - 4) * shield);
        const stance = 4 * r;
        return {
          hips: { move: [0, -legDrop(LEG, stance), 0], rotate: [0, 0, 0] },
          spine: { rotate: [-4 * r, 0, -3 * r] },
          chest: { rotate: [-2 * r, 0, -6 * r] },
          // The head leans with the chest, away from the sword.
          neck: { rotate: [3 * nod, 0, 0] },
          head: { rotate: [-6 * look + 10 * nod - 5 * pride, -10 * look, 0] },
          plume: { rotate: curl(12 * lag, 0, 6 * sway) },
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
