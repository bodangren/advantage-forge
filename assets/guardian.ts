import { addPart, defineAsset, mapTint, mixRgb, motion, profile, rgb, sdf } from '../src/index.js';
import { GUARDIAN_HELM_MOUNT, guardianHelm } from './parts/guardian-helm.js';
import { guardianHammer } from './parts/guardian-hammer.js';
import { guardianShield } from './parts/guardian-shield.js';

/**
 * Guardian: Chibi Quest hero (catalog `heroes/martial/guardian`), about 1.0 m to the top of the
 * helm crest, faces +Z. Target: docs/hero-mockups/guardian_001.jpg (the mockup has a beard; this
 * set has the young, round, beardless face). Built on the paladin (the knight's body, face, and
 * skeleton with knee bones), so the heroes read as a set.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite: the helm crest, the gold-edged plate, the
 * teal tower shield with its star, and the hammer must read.
 * One idea: a bulky young guardian in pale plate with gold edges, a round helm with a gold brow
 *   band and a center crest, a tall teal tower shield on the left arm, a square-headed hammer held
 *   low in the right hand, and a teal tabard and cape.
 * Shape language: round and heavy (big pauldrons, a big cuirass); square for the shield and hammer.
 * Palette (60/30/10): pale plate #e8e4dc with #b8b4ac shadow; teal #3a7a88 with #2a5a66 folds;
 *   gold #e0b040 accent. Skin #f2c7a4, hair #4a2e1c, belt #6b4226, hammer head #a8acb1.
 * Bodies: skin, hair, helm, cuirass, sleeves, pauldrons, gauntlets, belt, tassets, tabard-skirt,
 *   cape, leggings, greaves, boots, trim (all gold), hammer, hammer-gold, haft, shield, shield-face,
 *   shield-gold, shield-star.
 * Rig: the paladin's skeleton (the `plume` bone stays, unused); the hammer is rigid on the right
 *   hand, the shield rigid on the left forearm. Clips: idle, walk, run, attack (a hammer swing),
 *   attack2 (a shield slam), hit, death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#10202c',
  iris: '#6e4020',
  irisLow: '#9a6a3c',
  pupil: '#0d1114',
  lid: '#16100c',
  brow: '#3a2414',
  mouth: '#a4503f',
  hair: '#4a2e1c',
  hairDark: '#33200f',
  steel: '#e8e4dc',
  steelDark: '#b8b4ac',
  plate: '#f1eee6',
  plateShade: '#cfcac0',
  walnut: '#6b4226',
  grip: '#3f2a1a',
  gold: '#d4a93a',
  teal: '#3a7a88',
  tealDark: '#2a5a66',
  pearl: '#e8e4dc',
  hammer: '#7d858e',
  leather: '#6b4226',
  wood: '#4a2c1a',
  sole: '#5c5f66',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. Both forearms point forward: the right hand holds the hammer up beside the head, the left
// forearm carries the shield in front of the left side.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.202, 0.335, -0.005];
const WRIST_R: V3 = [-0.227, 0.3, 0.1];
const ELBOW_L: V3 = [0.187, 0.335, 0];
const WRIST_L: V3 = [0.212, 0.29, 0.085];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left sabaton (y = 0), measured on the SDF: heel and toe.
// The toe turns out 12 degrees, so the toe point sits outboard of the heel.
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
const rotY0 = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};

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

/** A ring of radius R around the axis from a to b, at the fraction t (a torus turned to the axis). */
const ringAlong = (a: V3, b: V3, t: number, R: number, r: number) => {
  const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const l = Math.hypot(...u);
  const s = Math.sign(u[1]) || 1;
  const n: V3 = [(s * u[0]) / l, (s * u[1]) / l, (s * u[2]) / l];
  const ax = Math.asin(n[2]) / rad;
  const bz = Math.atan2(-n[0], n[1]) / rad;
  const c = lerp(a, b, t);
  return sdf.torus(R, r).rotateX(ax).rotateZ(bz).at(...c);
};

// The tower shield sits on the left forearm: its center, and its turns (yaw about Y, tilt of the
// top forward, roll of the top outward). The point stands 0.02 m above the ground.
const SHIELD_C: V3 = [0.362, 0.398, 0.06];
const SHIELD_YAW = 29;
const SHIELD_TILT = 4;
const SHIELD_ROLL = -18;

export default defineAsset({
  name: 'guardian',
  description: 'Chibi guardian hero in pale gold-edged plate, a crested helm, a teal tower shield with a star, a teal cape, and a war hammer.',
  detail: 0.006,
  reference: 'docs/hero-mockups/guardian_001.jpg',
  // Color slots for individual guardians (the first option is the default look). The clothing slot
  // is the tabard, the cape, and the shield face. The plate, the gold, and the leather keep their colors.
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { brown: C.hair, black: '#231a17', blond: '#c4974a' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { teal: C.teal, crimson: '#9a2c34', royal: '#2f58b8' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'brown', skin: 'fair', clothing: 'teal' },
    crimson: { eyes: 'blue', hair: 'black', skin: 'tan', clothing: 'crimson' },
    royal: { eyes: 'green', hair: 'blond', skin: 'brown', clothing: 'royal' },
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
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cloth: k.tint('clothing'),
      clothDark: k.tint('clothing', { color: C.tealDark, follow: 1 }),
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
    const ears = pair(
      sdf
        .ellipsoid([0.024, 0.036, 0.031])
        .subtract(sdf.sphere(0.017).at(0.016, 0, 0.006))
        .rotateY(-12)
        .at(0.2, 0.6, -0.01)
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
    // Straight, thick brows, a little lower at the inner ends: brave, not angry.
    const brows = pair(sdf.extrude(profile.arc(0.16, 0.019, 70, 106), 0.3).at(0.1, 0.698 - 0.16, 0.1).rotateZ(-3));
    const smile = sdf.extrude(profile.arc(0.07, 0.011, 243, 297), 0.3).at(0, 0.528 + 0.07, 0.1);
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
      .paintWhere(smile, T.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ helm and hair
    // `hp` puts a strand point on the skull (a point in that direction from the head center) and
    // lifts the strand's center off it by part of its radius, so the locks lie on the head.
    const hp = (x: number, y: number, z: number, r: number, lift = 0.2): [number, number, number, number] => {
      const s = sdf.surfacePoint(head, [x * 3, HEAD_Y + (y - HEAD_Y) * 3, z * 3], r * lift);
      return [s[0], s[1], s[2], r];
    };
    // Below the brow band the hair shows at the temples, above the ears, and at the nape: a cap
    // under the band with a face opening, and 14 locks with jittered directions.
    const faceMask = sdf.ellipsoid([0.25, 0.165, 0.24]).at(0, 0.612, 0.15);
    const capBase = sdf
      .ellipsoid([HEAD[0] + 0.014, HEAD[1] + 0.016, HEAD[2] + 0.014])
      .at(0, HEAD_Y + 0.008, -0.012)
      .smoothSubtract(0.015, faceMask)
      .intersect(sdf.halfSpace([0, -1, 0], -0.54))
      .intersect(sdf.halfSpace([0, 1, 0], 0.735));
    const fringeC = sdf.chain([hp(0.0, 0.735, 0.15, 0.022), hp(0.005, 0.712, 0.19, 0.011)], 0.012);
    const fringeS = pair(sdf.chain([hp(0.075, 0.735, 0.14, 0.02), hp(0.085, 0.708, 0.18, 0.01)], 0.012));
    const temple = pair(sdf.chain([hp(0.17, 0.73, 0.06, 0.026), hp(0.198, 0.665, 0.07, 0.018), hp(0.2, 0.6, 0.075, 0.008)], 0.012));
    const overEar = pair(sdf.chain([hp(0.19, 0.72, -0.04, 0.03), hp(0.213, 0.66, -0.045, 0.022), hp(0.205, 0.585, -0.03, 0.01)], 0.012));
    const behindEar = pair(sdf.chain([hp(0.16, 0.71, -0.13, 0.03), hp(0.19, 0.62, -0.125, 0.024), hp(0.16, 0.55, -0.11, 0.012)], 0.012));
    const nape = sdf.chain([hp(0.0, 0.7, -0.19, 0.04), hp(0.005, 0.6, -0.2, 0.035), hp(0.0, 0.52, -0.16, 0.016)], 0.012);
    const napeS = pair(sdf.chain([hp(0.085, 0.7, -0.17, 0.034), hp(0.1, 0.6, -0.18, 0.03), hp(0.08, 0.52, -0.15, 0.014)], 0.012));
    const hair = sdf
      .smoothUnion(0.012, capBase, fringeC, fringeS, temple, overEar, behindEar, nape, napeS)
      .bone('head')
      .paintFn((x, y, z, base) => {
        const w = Math.sin(x * 60 + y * 42 + Math.sin(z * 30) * 2);
        return w > 0.3 ? mixRgb(base, rgb(T.hairDark), Math.min(0.85, (w - 0.3) * 1.5)) : base;
      });
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004 });

    // The helm: a round dome over the crown, a gold brow band around the head at y 0.735, and a
    // gold center crest over the top from the band to the back. Open at the face.
    addPart(k, guardianHelm(), { pose: (s) => s.at(...GUARDIAN_HELM_MOUNT) });

    // ------------------------------------------------------------------ torso: a big cuirass
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
    // A molded breastplate with a soft center ridge, 0.02 bigger all round than the paladin's.
    const ridge = sdf.capsule([0, 0.43, 0.105], [0, 0.29, 0.112], 0.014).scale([0.8, 1, 1]);
    const cuirass = torso
      .round(0.034)
      .smoothUnion(0.02, ridge)
      .intersect(sdf.halfSpace([0, -1, 0], -0.248))
      .intersect(sdf.halfSpace([0, 1, 0], 0.47));
    const cuirassPaint = cuirass.paintFn((x, y, z, base) =>
      mixRgb(base, rgb(C.steelDark), Math.min(0.7, Math.max(0, (0.34 - y) * 5) + Math.max(0, -z - 0.05) * 3)),
    );
    k.body('cuirass', cuirassPaint, { color: C.steel, roughness: 0.5, metalness: 0.6, bone: 'chest' });

    // Sleeves on the upper arms, under the pauldrons; rings in the normal map.
    const rings = (x: number, y: number, z: number) => {
      const u = Math.atan2(z, x) * 30;
      const v = y * 190 + (Math.floor(u / Math.PI) % 2) * Math.PI * 0.5;
      return 0.0012 * Math.abs(Math.sin(u)) * Math.abs(Math.sin(v));
    };
    const sleeve = (s: V3, e: V3, tag: string) => sdf.cone(s, lerp(s, e, 1.12), 0.05, 0.046).bone(tag);
    k.body('sleeves', sdf.union(sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R')), {
      color: C.steelDark,
      roughness: 0.6,
      metalness: 0.4,
      bump: rings,
    });

    // ------------------------------------------------------------------ pauldrons (two stacked plates each)
    // An upper cap and a lower cap 0.03 m lower and 0.01 m further out, each cut flat underneath,
    // white with a soft shadow on the underside and a gold rim at the lower edge.
    const capPlate = (r: V3, cutY: number, dx: number, dy: number) =>
      sdf
        .ellipsoid(r)
        .intersect(sdf.halfSpace([0, -1, 0], -cutY))
        .round(0.003)
        .paintWhere(sdf.halfSpace([0, 1, 0], cutY + 0.014), C.plateShade, 0.008)
        .at(dx, dy, 0);
    // The plates are 1.3x the brief's sizes: the brief's caps vanished behind the sleeve and the shield.
    const PS = 1.3;
    const PAULD_UP = { r: [0.075 * PS, 0.045 * PS, 0.07 * PS] as V3, cut: -0.01 * PS, dx: 0, dy: 0 };
    const PAULD_LO = { r: [0.065 * PS, 0.035 * PS, 0.06 * PS] as V3, cut: -0.01 * PS, dx: 0.01 * PS, dy: -0.03 * PS };
    const plateOf = (q: typeof PAULD_UP) => capPlate(q.r, q.cut, q.dx, q.dy);
    const pauldronPose = (s: sdf.Shape) => s.rotateZ(-24).at(0.16, 0.44, 0);
    const pauldronLocal = sdf.union(plateOf(PAULD_UP), plateOf(PAULD_LO));
    const pauldrons = pair(pauldronPose(pauldronLocal).bone('upperarm.L'));
    k.body('pauldrons', pauldrons, { color: C.plate, roughness: 0.5, metalness: 0.15, detail: 0.006 });
    // The gold rim: a thin shell of each plate, kept in a band 0.012 m tall at the lower edge.
    const rimOf = (q: typeof PAULD_UP) => {
      const flat = sdf.ellipsoid(q.r).intersect(sdf.halfSpace([0, -1, 0], -q.cut)).at(q.dx, q.dy, 0);
      return flat
        .round(0.006)
        .subtract(flat.round(-0.003))
        .intersect(sdf.box([0.4, 0.012, 0.4]).at(0, q.cut + q.dy, 0));
    };
    const pauldronTrim = pair(pauldronPose(sdf.union(rimOf(PAULD_UP), rimOf(PAULD_LO))).bone('upperarm.L'));
    k.body('pauldron-gold', pauldronTrim, { color: C.gold, roughness: 0.35, metalness: 1, detail: 0.0055 });

    // ------------------------------------------------------------------ gauntlets: vambraces and fists
    const vambrace = (e: V3, w: V3) => sdf.cone(lerp(e, w, 0.15), lerp(e, w, 1.02), 0.041, 0.047).round(0.003);
    const fistR = handPose(HAND_R, WRIST_R)(fistLocal(-1));
    const fistL = handPose(HAND_L, WRIST_L)(fistLocal(1));
    const gauntlets = sdf.union(
      sdf.smoothUnion(0.012, vambrace(ELBOW_L, WRIST_L).bone('forearm.L'), fistL.bone('hand.L')),
      sdf.smoothUnion(0.012, vambrace(ELBOW_R, WRIST_R).bone('forearm.R'), fistR.bone('hand.R')),
    );
    k.body('gauntlets', gauntlets, { color: C.steel, roughness: 0.5, metalness: 0.6 });
    const cuffs = sdf.union(
      ringAlong(ELBOW_L, WRIST_L, 0.9, 0.0485, 0.0065).bone('forearm.L'),
      ringAlong(ELBOW_L, WRIST_L, 0.28, 0.0435, 0.005).bone('forearm.L'),
      ringAlong(ELBOW_R, WRIST_R, 0.9, 0.0485, 0.0065).bone('forearm.R'),
      ringAlong(ELBOW_R, WRIST_R, 0.28, 0.0435, 0.005).bone('forearm.R'),
    );

    // ------------------------------------------------------------------ belt, tasset plates, tabard
    const beltY = 0.252;
    const belt = cuirass.round(0.008).smoothIntersect(0.005, sdf.box([0.5, 0.046, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), { color: C.leather, roughness: 0.65 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    // A gold diamond buckle, 0.03 m tall.
    const buckleOuter = profile.polygon([
      [0, 0.015],
      [0.02, 0],
      [0, -0.015],
      [-0.02, 0],
    ]);
    const buckle = sdf.extrude(buckleOuter, 0.014, 0.004).at(0, beltY, beltZ + 0.002);

    // The tasset skirt: 6 plates (3 per side) around the hips below the belt, each with a gold hem.
    const skirtSolid = sdf
      .revolve(
        profile.polygon([
          [0, 0.25],
          [0.168, 0.25],
          [0.185, 0.11],
          [0, 0.11],
        ]),
      )
      .scale([1, 1, 0.82])
      .round(0.006);
    const plateAt = (a: number) => skirtSolid.intersect(sdf.box([0.086, 0.2, 0.3], 0.012).at(0, 0.18, 0.15).rotateY(a));
    const PLATES = [35, 70, 105];
    const platesL = sdf.union(...PLATES.map(plateAt)).bone('leg.L');
    k.body('tassets', hard(platesL), { color: C.steel, roughness: 0.5, metalness: 0.6 });
    const hemBand = sdf.box([0.6, 0.017, 0.6]).at(0, 0.1185, 0);
    const plateHem = hard(sdf.union(...PLATES.map((a) => plateAt(a).round(0.004).intersect(hemBand))).bone('leg.L'));

    // The teal tabard: two flaps below the belt (one per leg) that meet in the middle with a V hem,
    // and a gold edge down the outer side and along the hem.
    const FLAP = profile.polygon([
      [0.002, 0.262],
      [0.085, 0.262],
      [0.09, 0.11],
      [0.003, 0.07],
    ]);
    // The same outline carried past the middle and the top, so the edge band skips those sides.
    const FLAP_OUT = profile.polygon([
      [-0.05, 0.3],
      [0.085, 0.3],
      [0.09, 0.11],
      [0.003, 0.07],
      [-0.05, 0.038],
    ]);
    const flapPose = (s: sdf.Shape) => s.rotateX(-3).at(0, 0, 0.16);
    const flapL = flapPose(sdf.extrude(FLAP, 0.014, 0.005)).paintWhere(sdf.halfSpace([0, 1, 0], 0.1), T.clothDark, 0.04);
    k.body('tabard-skirt', pair(flapL.bone('leg.L')), { color: T.cloth, roughness: 0.8 });
    const flapEdge = pair(
      flapPose(sdf.extrude(FLAP, 0.018, 0.005).subtract(sdf.extrude(profile.offsetProfile(FLAP_OUT, -0.011), 0.1))).bone('leg.L'),
    );

    // ------------------------------------------------------------------ cape
    // A cone of cloth behind, open at the top and the hem; the folds bend both walls alike. The
    // cape falls from the shoulders to y 0.2; its inside is darker.
    const folds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(z, x) * 6) * Math.min(1, Math.max(0, (0.4 - y) / 0.2));
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
        .displace(0.012, folds);
    const capeInner = capeCone(0.195, 0.25, 0.47, 0.15).at(0, 0, -0.03);
    const cape = capeCone(0.217, 0.272, 0.45, 0.2)
      .at(0, 0, -0.03)
      .subtract(capeInner)
      .intersect(sdf.halfSpace([0, 0, 1], -0.02))
      .paintWhere(capeInner.round(0.005), T.clothDark, 0.004);
    k.body('cape', cape.bone('cloak'), { color: T.cloth, roughness: 0.8 });

    // ------------------------------------------------------------------ legs: leggings, greaves, boots
    const leggings = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.112, 0.05, 0.084]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.095, 0.1, 0.004], 0.046).bone('leg.L')),
    );
    k.body('leggings', leggings, { color: C.steelDark, roughness: 0.7, metalness: 0.2 });
    const knee = sdf.ellipsoid([0.055, 0.032, 0.05]).at(0.095, 0.11, 0.022).bone('leg.L');
    const greave = sdf.cone([0.096, 0.098, 0.006], [0.098, 0.06, 0.004], 0.049, 0.052).bone('leg.L');
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
    const sabaton = sabatonFoot
      .smoothSubtract(0.003, toeLines.intersect(sdf.halfSpace([0, 0, -1], -0.04)))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.012), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('greaves', pair(sdf.smoothUnion(0.01, greave, knee)), { color: C.steel, roughness: 0.5, metalness: 0.6 });
    k.body('boots', pair(sabaton), { color: C.steelDark, roughness: 0.5, metalness: 0.5 });
    const legRings = pair(
      sdf.union(
        sdf.torus(0.0505, 0.0055).at(0.0975, 0.083, 0.005).bone('leg.L'),
        sdf.ellipsoid([0.03, 0.026, 0.012]).at(0.095, 0.11, 0.068).bone('leg.L'),
        sdf.torus(0.0545, 0.005).at(ANKLE[0], 0.078, 0).bone('foot.L'),
      ),
    );

    // ------------------------------------------------------------------ gold edges and emblem
    // The raised chest plate: 0.008 m proud of the breastplate below it, with the arm holes cut
    // out. Its gold rim runs 0.008 m wide along the collar, the arm holes, and the bottom edge.
    const PLATE_Y0 = 0.276;
    const PLATE_Y1 = 0.452;
    const armHole = (r: number) => hard(sdf.cylinder(r, 0.16).rotateZ(90).at(0.15, 0.385, 0));
    const plateBand = sdf.box([0.6, PLATE_Y1 - PLATE_Y0, 0.6]).at(0, (PLATE_Y0 + PLATE_Y1) / 2, 0);
    const chestPlate = cuirass.round(0.008).intersect(plateBand).subtract(armHole(0.058));
    const chestPaint = chestPlate.paintFn((x, y, z, base) =>
      mixRgb(base, rgb(C.plateShade), Math.min(0.7, Math.max(0, (0.34 - y) * 5) + Math.max(0, -z - 0.05) * 3)),
    );
    k.body('breastplate', chestPaint.bone('chest'), { color: C.plate, roughness: 0.5, metalness: 0.15, detail: 0.006 });
    const rimEdges = sdf.union(
      sdf.box([0.6, 0.008, 0.6]).at(0, PLATE_Y1 - 0.004, 0),
      sdf.box([0.6, 0.008, 0.6]).at(0, PLATE_Y0 + 0.004, 0),
      armHole(0.066),
    );
    const chestRim = cuirass.round(0.011).intersect(plateBand).subtract(armHole(0.058)).intersect(rimEdges);
    // The sun emblem on the chest center: a disc with eight short rays.
    const SUN_Y = 0.372;
    const sunZ = sdf.raycast(chestPlate, [0, SUN_Y, 1], [0, 0, -1])![2];
    const sunDisc = sdf.cylinder(0.022, 0.012, 0.004).rotateX(90).at(0, SUN_Y, sunZ);
    const sunRays = sdf.union(
      ...Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 + 22.5) * rad;
        const from: V3 = [0.02 * Math.sin(a), SUN_Y + 0.02 * Math.cos(a), sunZ - 0.001];
        const to: V3 = [0.036 * Math.sin(a), SUN_Y + 0.036 * Math.cos(a), sunZ - 0.002];
        return sdf.cone(from, to, 0.0065, 0.0015);
      }),
    );
    k.body('cuirass-gold', sdf.union(chestRim, sunDisc, sunRays).bone('chest'), { color: C.gold, roughness: 0.35, metalness: 1, detail: 0.0055 });

    k.body(
      'trim',
      sdf.union(
        buckle.bone('spine'),
        cuffs,
        legRings,
        plateHem,
        flapEdge,
      ),
      { color: C.gold, roughness: 0.35, metalness: 1 },
    );

    // ------------------------------------------------------------------ war hammer in the right hand
    // Local frame: the grip center at the origin, the haft along +Y (the head up). The head's axis
    // lies across the haft, turned 45 degrees between +X and +Z, so both faces show from the front.
    // A short heavy block: the head sits just above the fist, the haft ends a little below it.
    const GRIP = handPoint(HAND_R, WRIST_R, [-0.007, -0.04, 0.004]);
    // The haft points forward and 20 degrees out, so the head hangs low in front of the right hip.
    const HAMMER_TILT = { x: 80, z: 20 };
    const HEAD_TURN = 45; // the head's turn about the haft (see parts/guardian-hammer.ts)
    const hammerPose = (s: sdf.Shape) => s.rotateX(HAMMER_TILT.x).rotateZ(HAMMER_TILT.z).at(...GRIP);
    addPart(k, guardianHammer(), { pose: hammerPose });

    // ------------------------------------------------------------------ tower shield on the left forearm
    // Local frame: the face toward +Z, the point down, 0.6 m tall. A pale back plate, a raised gold
    // rim around a teal field, and a raised pale star. The shield turns out at the left side, the top
    // leans out (clear of the cheek), and the point stands 0.02 m above the ground.
    const shieldPose = (s: sdf.Shape) => s.scale(1.15).rotateZ(SHIELD_ROLL).rotateX(SHIELD_TILT).rotateY(SHIELD_YAW).at(...SHIELD_C);
    addPart(k, guardianShield(mapTint(k, { cloth: 'clothing' })), { pose: shieldPose });

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

    // The shield arm stays in front of the body; the hammer arm swings a little.
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
          // The wrist turns back against the arm's swing, so the hammer stays upright beside the
          // head instead of tipping back into the hair.
          'hand.R': { rotate: [armSwing * (0.6 * s + 0.2 * Math.max(0, s)), 0, 6] as const },
        };
      },
    });
    // A paladin in armor walks heavier: short steps, a low swing, long stances.
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.62, 0.005, 28, 3, 6, [4, 0]));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.42, 0.025, 50, 12, 22));


    // attack: an overhead hammer strike, solved by targets (as the knight's slash). The wrist
    // follows keys in the chest's rest frame (reach); the haft follows its own keys; edgeUp keeps
    // the head's axis in the swing plane, so a face leads. The arm is short and the head is big, so
    // the wind-up rises on the right side, out beside the head, with the hammer tipped back over
    // the right shoulder; then the haft comes up straight beside the head, over and forward, and
    // the head strikes down in front at knee height. The chest leans back in the wind-up and drives
    // forward in the strike, the left foot steps, the hips drop, and the shield stays up in front.
    const { keys, reach, orient, edgeUp } = motion;
    const norm = (a: V3): V3 => {
      const l = Math.hypot(a[0], a[1], a[2]);
      return [a[0] / l, a[1] / l, a[2] / l];
    };
    const HAM_DIR = rotZ(rotX([0, 1, 0], HAMMER_TILT.x), HAMMER_TILT.z); // the haft toward the head, at rest
    // Across the haft and across the head's axis, at rest: the solver keeps it normal to the swing.
    const HAM_SIDE = rotZ(rotX(norm(rotY0([1, 0, 0], HEAD_TURN)), HAMMER_TILT.x), HAMMER_TILT.z);
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
    const hammerKeys = [
      [0, HAM_DIR],
      [0.16, norm([-0.45, 0.85, -0.25])], // the head rises and tips back
      [0.32, norm([-0.3, 0.45, -0.85])], // wound up: the head back over the right shoulder
      [0.42, norm([-0.3, 0.42, -0.86])], // the hold at the top
      [0.5, norm([-0.32, 0.93, 0.12])], // straight up beside the head
      [0.56, norm([-0.2, 0.35, 0.92])], // over and forward
      [0.62, norm([-0.1, -0.22, 0.97])], // the strike: down in front, at knee height
      [0.74, norm([-0.1, -0.24, 0.965])], // the follow-through holds
      [0.88, norm([-0.3, 0.5, 0.8])], // back up through the front
      [1, HAM_DIR],
    ] as const;
    const hammerAt = (p: number) => keys(p, hammerKeys, 'spline');
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
            [0.32, [-0.292, 0.47, -0.03]],
            [0.42, [-0.295, 0.474, -0.036]],
            [0.5, [-0.28, 0.47, 0.07]],
            [0.56, [-0.2, 0.42, 0.155]],
            [0.62, [-0.195, 0.35, 0.165]],
            [0.74, [-0.195, 0.352, 0.162]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = norm(hammerAt(p));
        // The elbow points out and back in the wind-up, then out, down, and forward through the
        // strike, so the forearm stays in front of the breastplate.
        const pole = keys(p, [
          [0, POLE_REST],
          [0.16, [-0.6, 0.2, -0.2]],
          [0.44, [-0.6, 0.25, -0.15]],
          [0.54, [-0.7, 0.05, 0.4]],
          [0.78, [-0.7, 0.05, 0.4]],
          [1, POLE_REST],
        ] as const);
        const arm = reach(ARM_R, wrist, pole);
        const hand = orient([arm.upper, arm.lower], { dir: HAM_DIR, up: HAM_SIDE }, { dir, up: edgeUp(hammerAt, p, HAM_SIDE) });
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
    // cape flattens under him (scale). The hammer arm falls out to the right with the hammer flat on
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
    const SHIELD_N = rotY(rotX(rotZ([0, 0, 1], SHIELD_ROLL), SHIELD_TILT), SHIELD_YAW); // the shield face's normal at rest
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
      wristL: [0.265, 0.235, 0.05] as V3,
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

        // The hammer arm flies out in the blow and falls to the ground on the right; the hammer
        // turns flat and points out to the side.
        const wristR = keys(p, [[0, WRIST_R], [0.1, [-0.27, 0.34, 0.08]], [0.36, [-0.28, 0.37, 0.03]], [0.74, D.wristR]] as const);
        const poleR = keys(p, [[0, POLE_REST], [0.2, [-0.6, 0.3, -0.1]], [0.74, [-0.6, 0.4, -0.35]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const blade = norm(keys(p, [[0, HAM_DIR], [0.1, norm([-0.75, 0.45, 0.48])], [0.4, norm([-0.85, 0.05, 0.45])], [0.74, D.bladeR]] as const));
        const flatUp = norm(keys(p, [[0, HAM_SIDE], [0.4, HAM_SIDE], [0.74, [0, 0, 1]]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: HAM_DIR, up: HAM_SIDE }, { dir: blade, up: flatUp });

        // The shield arm flies out, then falls to his left side; the forearm turns the shield face up.
        const wristL = keys(p, [[0, WRIST_L], [0.1, [0.31, 0.3, 0.06]], [0.36, [0.3, 0.31, 0.03]], [0.76, D.wristL]] as const);
        const poleL = keys(p, [[0, POLE_REST_L], [0.03, [0.6, 0.3, -0.1]], [0.2, [0.6, 0.3, -0.1]], [0.76, D.poleL]] as const);
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
    const shieldLocal = (p: V3): V3 => rotZ(rotX(rotY(p, -SHIELD_YAW), -SHIELD_TILT), -SHIELD_ROLL);
    const shieldTurn = (p: V3, yaw: number, tilt: number, roll: number): V3 => rotY(rotX(rotZ(p, roll), tilt), yaw);
    const ELBOW_IN_SHIELD = shieldLocal(sub(ELBOW_L, SHIELD_C));
    const WRIST_IN_SHIELD = shieldLocal(sub(WRIST_L, SHIELD_C));
    const UPPER_L = norm(sub(ELBOW_L, SHOULDER));
    const UPPER_LEN = Math.hypot(...sub(ELBOW_L, SHOULDER));
    const shieldArm = (u: V3, yaw: number, tilt: number, roll = SHIELD_ROLL) => {
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
    // forward at chest height, the top tipped forward so the rim stays clear of the head. The hammer
    // stays ready at the right side. The plume and the cape lag and whip at the stop.
    const BASH = {
      braceU: [0.8, -0.7, -0.38] as V3, // the elbow draws back and out
      braceYaw: 36, // with the body's turn of -26, the face points nearly forward
      braceTilt: 8,
      driveU: [0.5, -0.1, 1] as V3, // the upper arm points forward, a little out (the forearm clears the cuirass)
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
        const yaw = SHIELD_YAW + (BASH.braceYaw - SHIELD_YAW) * brace + (BASH.driveYaw - SHIELD_YAW) * drive;
        const tilt = SHIELD_TILT + (BASH.braceTilt - SHIELD_TILT) * brace + (BASH.driveTilt - SHIELD_TILT) * drive;
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
          plume: { rotate: curl(14 * lag, 0, 3 * lag) },
          cloak: { rotate: [-10 * lag, 0, 0] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: [-6 * ready, 0, -12 * ready] },
          'forearm.R': { rotate: [-10 * ready, 0, 0] },
          // The hammer tips out, clear of the hair while the head turns.
          'hand.R': { rotate: [16 * ready, 0, 14 * ready] },
          'leg.L': { rotate: [aL, 0, 0] },
          'leg.R': { rotate: [aR, 0, 0] },
          'foot.L': { rotate: [-aL, 0, 0] },
          'foot.R': { rotate: [-aR, 0, 0] },
        };
      },
    });

    // victory: the hammer goes out to the right and up, high beside the head (the haft leans out,
    // clear of the hair); the shield comes up at his left side;
    // the chest opens and tilts a little to the left. Then a proud nod, and he holds the pose with
    // the chin up. The top curl and the cape sway.
    const WIN = {
      wrist: [-0.34, 0.43, 0.04] as V3,
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
            [0.26, [-0.338, 0.435, 0.042]],
            [0.32, [-0.34, 0.437, 0.04]],
            [0.42, WIN.wrist],
          ] as const,
          'spline',
        );
        const poleR = keys(p, [[0, POLE_REST], [0.12, [-0.6, 0.1, -0.1]], [0.3, [-0.6, 0.15, -0.25]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const blade = norm(
          keys(p, [[0, HAM_DIR], [0.12, norm([-0.85, 0.2, 0.48])], [0.26, norm([-0.26, 0.95, 0.14])], [0.32, norm([-0.18, 0.98, 0.1])], [0.42, WIN.blade]] as const, 'spline'),
        );
        const flatUp = norm(keys(p, [[0, HAM_SIDE], [0.12, [0.5, 0.3, 0.8]], [0.26, [0.95, 0.25, 0.1]]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: HAM_DIR, up: HAM_SIDE }, { dir: blade, up: flatUp });

        const armL = shieldArm(blend(UPPER_L, [[WIN.shieldU, shield]]), SHIELD_YAW + (WIN.shieldYaw - SHIELD_YAW) * shield, SHIELD_TILT + (WIN.shieldTilt - SHIELD_TILT) * shield);
        const stance = 4 * r;
        return {
          hips: { move: [0, -legDrop(LEG, stance), 0], rotate: [0, 0, 0] },
          spine: { rotate: [-4 * r, 0, -3 * r] },
          chest: { rotate: [-2 * r, 0, -6 * r] },
          // The head leans with the chest, away from the hammer.
          neck: { rotate: [3 * nod, 0, 0] },
          head: { rotate: [-6 * look + 10 * nod - 5 * pride, -10 * look, 0] },
          plume: { rotate: curl(12 * lag, 0, 6 * sway) },
          cloak: { rotate: [8 * sway, 0, 4 * lag] },
          // The right shoulder lifts a little (a shrug), so the hammer goes higher.
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

