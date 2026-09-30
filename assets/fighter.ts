import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Fighter — Chibi Quest hero (catalog `heroes/martial/fighter`), 1.0 m to the cap crown, faces +Z.
 * Target: docs/hero-mockups/fighter_001.jpg, with no beard (the set's young, round, beardless
 * face). Built on the knight's body, face, and skeleton, so the heroes read as a set.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the face, cap, mail, buckler, and
 *   sword must read.
 * One idea: a disciplined little fighter in a plain steel skull cap with a nasal bar, a shirt of
 *   mail under a blue shoulder cape, a round wooden buckler on the left arm, and an arming sword
 *   held level across the front.
 * Proportions: cap crown 0.96, brow band 0.74, eyes 0.63, chin 0.48, shoulders 0.44, belt 0.25,
 *   skirt hem 0.11, knees 0.12.
 * Shape language: round and sturdy (cap dome, buckler, fists), a few sharp accents (nasal bar,
 *   boss point, blade).
 * Palette (60/30/10): mail and steel greys, blue cloth #3f6a9a, brass #c9a24a accents. Skin
 *   #f2c7a4, hair #231a17, leather #6b4226, boots #3a2a20.
 * Value plan: the dark hair and steel cap frame the light face (focal point); the blue cape and
 *   skirt are the second masses; brass buckles, rim, and guard are the small accents.
 * Bodies: skin, cap (helmet ridges and nasal bar), cap-band, hair, mail, scarf, cape, brass-cuff, leather, brass, skirt, gloves, leggings,
 *   boots, sword, hilt, grip, buckler, buckler-brass.
 * Rig: the knight's chibi skeleton (knee bones, `cloak`, `plume` unused); sword rigid on the right
 *   hand, buckler rigid on the left forearm. Clips: idle, walk, run, attack (a diagonal slash),
 *   attack2 (a buckler bash), hit, death, victory.
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
  hair: '#231a17',
  mouth: '#a4503f',
  steel: '#bcc2cb',
  steelDark: '#8a9098',
  band: '#a9b0ba',
  mail: '#8a9098',
  mailRing: '#5a6068',
  blue: '#3f6a9a',
  blueDark: '#2a4a70',
  leather: '#6b4226',
  bracer: '#8a5a35',
  glove: '#3a2a20',
  brass: '#c9a24a',
  wood: '#8a5a35',
  woodGrain: '#6b4226',
  blade: '#c3c8cf',
  grip: '#3a2a20',
  boot: '#3a2a20',
  bootSole: '#231a14',
  leggings: '#4a3e34',
  bootCuff: '#b5652f',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. Both forearms point forward: the right hand carries the sword level across the front,
// the left forearm carries the buckler at the left side.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.335, -0.005];
const WRIST_R: V3 = [-0.215, 0.3, 0.1];
const ELBOW_L: V3 = [0.175, 0.335, 0];
const WRIST_L: V3 = [0.2, 0.29, 0.085];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left boot (y = 0), measured on the SDF: heel and toe.
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
  name: 'fighter',
  description: 'Chibi fighter hero with a steel skull cap and nasal bar, mail shirt, blue cape, wooden buckler, and arming sword.',
  detail: 0.006,
  reference: 'docs/hero-mockups/fighter_001.jpg',
  // Color slots for individual fighters (the first option is the default look). Skin, eye, and
  // hair options match the hero set. The clothing slot is the cape, collar, and skirt cloth.
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { black: C.hair, brown: '#4a2e1c', blond: '#c4974a' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { blue: C.blue, red: '#c93a32', green: '#2e7a3c' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'black', skin: 'fair', clothing: 'blue' },
    red: { eyes: 'blue', hair: 'brown', skin: 'tan', clothing: 'red' },
    green: { eyes: 'green', hair: 'blond', skin: 'brown', clothing: 'green' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      skin: k.tint('skin'),
      cloth: k.tint('clothing'),
      clothDark: k.tint('clothing', { color: C.blueDark, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    const PLUME_AT: V3 = [0, 0.985, -0.012];
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      plume: { parent: 'head', at: PLUME_AT, tail: [-0.1, 1.15, -0.06] },
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
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    // Round human ears, low on the sides of the head.
    const EAR = [0.198, 0.635, -0.006] as const;
    const earShape = sdf.ellipsoid([0.021, 0.046, 0.034]).at(...EAR).rotateZ(-6);
    const ears = pair(earShape).bone('head');

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
    // Straight, thick brows, a little lower at the inner ends: calm and steady.
    const brows = pair(sdf.extrude(profile.arc(0.16, 0.024, 70, 106), 0.3).at(0.1, 0.712 - 0.16, 0.1).rotateZ(-3));
    const smile = sdf.extrude(profile.arc(0.07, 0.011, 243, 297), 0.3).at(0, 0.528 + 0.07, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.135, 0.56));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose)
      .smoothUnion(0.014, ears)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.hair)
      .paintWhere(smile, C.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair mass and open steel helmet
    // The helmet is open: a thick dark hair dome shows above and below a wide steel brow band. Steel
    // is the band, a Y of three ridges over the crown, and the nasal bar down to the nose tip.
    const BROW_Y = 0.75; // the middle of the brow band
    const hairDome = sdf.ellipsoid([0.232, 0.212, 0.215]).at(0, 0.722, -0.03);
    const earCut = sdf.ellipsoid([0.032, 0.056, 0.046]).at(...EAR).round(0.004);
    const hairCap = hairDome
      .smoothSubtract(0.012, sdf.ellipsoid([0.24, 0.155, 0.23]).at(0, 0.61, 0.14))
      .intersect(sdf.halfSpace([0, -1, 0.4], -0.6));
    // Pointed locks fall from under the brow band onto the forehead.
    const lock = (x: number, len: number, lean: number, r: number) => {
      const top = sdf.surfacePoint(head, [x, BROW_Y + 0.01, 0.4], 0.004);
      return sdf.cone(top, [top[0] + lean, top[1] - len, top[2] + 0.014], r, 0.004);
    };
    const locks = sdf.union(
      lock(-0.13, 0.026, -0.01, 0.022),
      lock(-0.075, 0.02, -0.006, 0.022),
      lock(-0.02, 0.024, 0.008, 0.023),
      lock(0.04, 0.02, 0.01, 0.022),
      lock(0.1, 0.022, 0.012, 0.022),
      lock(0.152, 0.03, 0.01, 0.02),
    );
    // Thick side locks hang beside each ear (two a side), and one lock hangs at the nape.
    const sideLock = (z: number, len: number, r: number) =>
      sdf.cone([0.204, 0.72, z], [0.212, 0.72 - len, z - 0.004], r, 0.009);
    const sideLocks = pair(sdf.union(sideLock(0.062, 0.1, 0.03), sideLock(-0.07, 0.12, 0.035)));
    const napeLock = sdf.cone([0, 0.66, -0.2], [0, 0.55, -0.2], 0.055, 0.02);
    const hair = sdf.smoothUnion(0.012, hairCap, locks, sideLocks, napeLock).subtract(earCut);
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // The brow band: a steel ring 0.022 m tall around the hair, just outside the dome.
    const band = hairDome
      .round(0.011)
      .subtract(hairDome.round(-0.011))
      .smoothIntersect(0.004, sdf.box([0.8, 0.022, 0.8], 0.006).at(0, BROW_Y, 0));
    k.body('cap-band', band, { color: C.band, roughness: 0.35, metalness: 0.8, detail: 0.004, bone: 'head' });

    // The Y: three thin ridges meet at the crown and run down to the band (front, back left, back right).
    const ridgeShell = hairDome.round(0.017).subtract(hairDome.round(-0.006));
    const ridgeArm = (deg: number) => sdf.box([0.032, 0.5, 0.5], 0.012).at(0, 0.9, 0.25).rotateY(deg).at(0, 0, -0.03);
    const ridges = ridgeShell
      .smoothIntersect(0.004, sdf.union(ridgeArm(0), ridgeArm(120), ridgeArm(-120)))
      .intersect(sdf.halfSpace([0, -1, 0], -(BROW_Y - 0.006)));
    const crownTop = sdf.raycast(hairDome.round(0.017), [0, 1.3, -0.03], [0, -1, 0])![1];
    const crownBoss = sdf.sphere(0.024).scale([1, 0.55, 1]).at(0, crownTop - 0.004, -0.03);
    // The nasal bar: 0.012 m wide, from the band down the nose bridge to the nose tip.
    const zTip = faceZ(0, 0.566) + 0.011;
    const nasal = sdf.chain(
      [
        [0, 0.758, 0.19, 0.006],
        [0, 0.72, faceZ(0, 0.72) + 0.009, 0.006],
        [0, 0.68, faceZ(0, 0.68) + 0.008, 0.006],
        [0, 0.64, faceZ(0, 0.64) + 0.008, 0.006],
        [0, 0.6, faceZ(0, 0.6) + 0.009, 0.006],
        [0, 0.572, zTip, 0.0065],
      ],
      0.01,
    );
    const helmSteel = sdf.smoothUnion(0.006, ridges, crownBoss, nasal);
    k.body('cap', helmSteel, { color: C.steel, roughness: 0.35, metalness: 0.8, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ torso: mail shirt
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
    // Rings: a bump in the normal map and a two-tone paint (the light ring, the dark gap).
    const ringPhase = (x: number, y: number, z: number) => {
      const u = Math.atan2(z, x) * 30;
      const v = y * 190 + (Math.floor(u / Math.PI) % 2) * Math.PI * 0.5;
      return Math.abs(Math.sin(u)) * Math.abs(Math.sin(v));
    };
    const rings = (x: number, y: number, z: number) => 0.0012 * ringPhase(x, y, z);
    const shirtTop = torso.round(0.012).intersect(sdf.halfSpace([0, -1, 0], -0.248)).intersect(sdf.halfSpace([0, 1, 0], 0.47));
    const shirtSkirt = torso.round(0.012).smoothIntersect(0.006, sdf.box([0.5, 0.098, 0.5], 0.01).at(0, 0.213, 0));
    const sleeve = (s: V3, e: V3, tag: string) => sdf.cone(s, lerp(s, e, 1.12), 0.046, 0.043).bone(tag);
    const mailShape = sdf
      .union(shirtTop.bone('chest'), shirtSkirt.bone('hips'), sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'))
      .paintFn((x, y, z, base) => (ringPhase(x, y, z) < 0.35 ? rgb(C.mailRing) : base));
    k.body('mail', mailShape, { color: C.mail, roughness: 0.6, metalness: 0.6, bump: rings });

    // ------------------------------------------------------------------ leather strap, belt, brass buckles
    // The chest strap runs from the right shoulder (the character's right, -X) down across the
    // chest to the belt on the left.
    const strapBand = sdf
      .extrude(
        profile.polygon([
          [-0.15, 0.5],
          [-0.088, 0.5],
          [0.078, 0.238],
          [0.02, 0.238],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const strap = torso
      .round(0.018)
      .subtract(torso.round(0.004))
      .intersect(strapBand)
      .intersect(sdf.halfSpace([0, 1, 0], 0.46));
    const beltY = 0.252;
    const belt = torso.round(0.018).smoothIntersect(0.005, sdf.box([0.5, 0.048, 0.5], 0.006).at(0, beltY, 0));
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const strapStudAt = sdf.surfacePoint(strap, [-0.082, 0.446, 0.3], 0);
    k.body('leather', sdf.union(strap.bone('chest'), belt.bone('spine')), { color: C.leather, roughness: 0.65, detail: 0.005 });
    const beltPlate = sdf
      .extrude(
        profile.polygon([
          [-0.03, 0.03],
          [0.03, 0.03],
          [0.03, -0.03],
          [-0.03, -0.03],
        ]),
        0.014,
        0.006,
      )
      .subtract(sdf.box([0.034, 0.02, 0.05], 0.004).at(0, 0, 0.01))
      .union(sdf.box([0.012, 0.03, 0.014], 0.003).at(0, 0, 0.003))
      .at(0, beltY, beltZ + 0.001);
    const strapBuckle = sdf
      .union(sdf.cylinder(0.019, 0.012, 0.005), sdf.cylinder(0.009, 0.02, 0.004).at(0, 0.006, 0))
      .rotateX(90)
      .at(strapStudAt[0], strapStudAt[1], strapStudAt[2] + 0.002);
    k.body('brass', sdf.union(beltPlate.bone('spine'), strapBuckle.bone('chest')), {
      color: C.brass,
      roughness: 0.3,
      metalness: 0.9,
      detail: 0.0035,
    });

    // ------------------------------------------------------------------ blue cloth: scarf, short cape, skirt
    // A short scarf: a ring at the neck and one tail hanging over the left chest, so the mail,
    // the strap, and the buckle plate stay clear.
    const scarfRing = sdf.torus(0.096, 0.033).scale([1, 1, 0.92]).at(0, 0.438, -0.006);
    const tail = torso
      .round(0.016)
      .subtract(torso.round(0.003))
      .intersect(
        sdf
          .extrude(
            profile.polygon([
              [0.03, 0.46],
              [0.095, 0.452],
              [0.102, 0.34],
              [0.07, 0.31],
              [0.038, 0.335],
            ]),
            0.4,
            0.004,
          )
          .at(0, 0, 0.2),
      );
    const scarfShape = sdf
      .smoothUnion(0.01, scarfRing, tail)
      .paintFn((x, y, z, base) => (y < 0.345 && z > 0 ? rgb(T.clothDark) : base));
    k.body('scarf', scarfShape, { color: T.cloth, roughness: 0.85, bone: 'chest' });

    // A short cape behind, ending under the shoulder blades; the folds bend both walls alike.
    const folds = (x: number, y: number, z: number) => Math.sin(Math.atan2(z, x) * 6) * Math.min(1, Math.max(0, (0.42 - y) / 0.1));
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
        .scale([1, 1, 0.8])
        .displace(0.009, folds);
    const cape = capeCone(0.16, 0.235, 0.46, 0.32)
      .subtract(capeCone(0.14, 0.215, 0.48, 0.3))
      .at(0, 0, -0.02)
      .intersect(sdf.halfSpace([0, 0, 1], -0.02))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.35), T.clothDark);
    k.body('cape', cape.bone('cloak'), { color: T.cloth, roughness: 0.85 });

    // ------------------------------------------------------------------ bracers and gloves
    const bracer = (e: V3, w: V3, tag: string) => sdf.cone(lerp(e, w, 0.12), lerp(e, w, 1.02), 0.041, 0.047).round(0.003).bone(tag).paint(C.bracer);
    const fistR = handPose(HAND_R, WRIST_R)(fistLocal(-1));
    const fistL = handPose(HAND_L, WRIST_L)(fistLocal(1));
    k.body('leather-arm', sdf.union(bracer(ELBOW_L, WRIST_L, 'forearm.L'), bracer(ELBOW_R, WRIST_R, 'forearm.R')), {
      color: C.bracer,
      roughness: 0.65,
      detail: 0.005,
    });
    const cuffRing = (e: V3, w: V3, tag: string) => sdf.cone(lerp(e, w, 0.76), lerp(e, w, 0.96), 0.0505, 0.0535).round(0.004).bone(tag);
    k.body('brass-cuff', sdf.union(cuffRing(ELBOW_L, WRIST_L, 'forearm.L'), cuffRing(ELBOW_R, WRIST_R, 'forearm.R')), {
      color: C.brass,
      roughness: 0.3,
      metalness: 0.9,
      detail: 0.0035,
    });
    k.body('gloves', sdf.union(fistL.bone('hand.L'), fistR.bone('hand.R')), { color: C.glove, roughness: 0.7, detail: 0.005 });

    // ------------------------------------------------------------------ legs: leggings and boots
    const leggings = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.112, 0.05, 0.084]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.095, 0.1, 0.004], 0.046).bone('leg.L')),
    );
    k.body('leggings', leggings, { color: C.leggings, roughness: 0.85 });
    const shaft = sdf.cone([0.096, 0.13, 0.006], [0.098, 0.06, 0.004], 0.05, 0.053).round(0.003).bone('shin.L');
    const cuff = sdf.cone([0.096, 0.112, 0.006], [0.096, 0.138, 0.006], 0.054, 0.06).round(0.004).bone('shin.L').paint(C.bootCuff);
    const bootFoot = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.052, 0.06, 0.02).at(0, 0.05, 0),
        sdf.ellipsoid([0.058, 0.05, 0.102]).at(0, 0.045, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.012), C.bootSole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(sdf.smoothUnion(0.01, sdf.union(shaft, cuff), bootFoot)), {
      color: C.boot,
      roughness: 0.75,
      detail: 0.005,
    });

    // ------------------------------------------------------------------ arming sword in the right hand
    // Local frame: the grip center at the origin, the blade toward -Y, the flat facing +Z.
    const BLADE_W = 0.05;
    const BLADE_T = 0.014;
    const R = ((BLADE_W / 2) ** 2 + (BLADE_T / 2) ** 2) / BLADE_T;
    const lens = sdf.intersect(
      sdf.cylinder(R, 1).at(0, 0, R - BLADE_T / 2),
      sdf.cylinder(R, 1).at(0, 0, -(R - BLADE_T / 2)),
    );
    // A blade 0.30 m long with a clear fuller (a groove on both flats, painted darker).
    const fuller = sdf.union(
      sdf.box([0.014, 0.21, 0.008], 0.004).at(0, -0.18, BLADE_T / 2),
      sdf.box([0.014, 0.21, 0.008], 0.004).at(0, -0.18, -BLADE_T / 2),
    );
    const bladeLocal = sdf
      .extrude(
        profile.polygon([
          [-BLADE_W / 2, -0.07],
          [BLADE_W / 2, -0.07],
          [BLADE_W / 2, -0.315],
          [0, -0.37],
          [-BLADE_W / 2, -0.315],
        ]),
        0.2,
      )
      .intersect(lens)
      .subtract(fuller)
      .paintWhere(sdf.box([0.017, 0.24, 0.3]).at(0, -0.18, 0), '#8c939d', 0.002);
    const guardLocal = sdf
      .box([0.13, 0.024, 0.03], 0.01)
      .union(hard(sdf.sphere(0.0155).at(0.065, 0, 0)))
      .at(0, -0.064, 0);
    const pommelLocal = sdf.smoothUnion(0.008, sdf.sphere(0.02).at(0, 0.05, 0), sdf.cone([0, 0.03, 0], [0, 0.045, 0], 0.013, 0.016));
    const gripLocal = sdf.cylinder(0.0135, 0.11, 0.004).at(0, -0.014, 0);
    const GRIP = handPoint(HAND_R, WRIST_R, [-0.007, -0.04, 0.004]);
    // The sword rests low across the front, the tip forward, down, and toward his left, clear of the skirt panel.
    const SWORD = { x: -34, z: 72 };
    const swordPose = (s: sdf.Shape) => s.rotateX(SWORD.x).rotateZ(SWORD.z).at(...GRIP);
    k.body('sword', swordPose(bladeLocal), { color: C.blade, roughness: 0.3, metalness: 0.9, detail: 0.0035, bone: 'hand.R' });
    k.body('hilt', swordPose(sdf.union(guardLocal, pommelLocal)), {
      color: C.brass,
      roughness: 0.3,
      metalness: 0.9,
      detail: 0.004,
      bone: 'hand.R',
    });
    k.body('grip', swordPose(gripLocal), {
      color: C.grip,
      roughness: 0.75,
      detail: 0.004,
      bone: 'hand.R',
      bump: (x, y, z) => 0.0012 * Math.abs(Math.sin(noise.noise3(x * 3, y * 3, z * 3) + (x + y) * 260)),
    });

    // ------------------------------------------------------------------ buckler on the left forearm
    // Local frame: the face toward +Z. A round wooden disc with a brass rim, a pointed brass
    // boss, and three studs. It sits low on the forearm so the top edge keeps clear of the cheek.
    const shieldPose = (s: sdf.Shape) => s.rotateZ(-4).rotateX(4).rotateY(38).at(0.236, 0.28, 0.092);
    const LZ = 0.06; // the disc stands this far in front of the arm's frame, so the fist stays behind it
    const front = (s: sdf.Shape) => s.at(0, 0, LZ);
    const BR = 0.13;
    const disc = sdf.cylinder(BR - 0.004, 0.026, 0.008).rotateX(90);
    const handle = sdf.capsule([-0.035, 0.0, -0.022], [0.035, 0.0, -0.022], 0.012);
    const plank = (x: number, y: number) => Math.sin(x * 62 + noise.noise3(x * 5, y * 1.2, 0) * 1.6);
    const wood = sdf.union(disc, handle).paintFn((x, y, z, base) => (plank(x, y) > 0.55 ? rgb(C.woodGrain) : base));
    k.body('buckler', shieldPose(front(wood)), {
      color: C.wood,
      roughness: 0.75,
      detail: 0.005,
      bone: 'forearm.L',
      bump: (x, y, z) => 0.0008 * plank(x, y),
    });
    const rim = sdf.torus(BR - 0.011, 0.014).rotateX(90);
    const boss = sdf
      .smoothUnion(0.01, sdf.cone([0, 0, 0.008], [0, 0, 0.088], 0.056, 0.004), sdf.cylinder(0.06, 0.016, 0.006).rotateX(90).at(0, 0, 0.016))
      .round(0.002);
    const stud = (deg: number) => sdf.sphere(0.013).scale([1, 1, 0.7]).at(Math.sin(deg * rad) * 0.098, Math.cos(deg * rad) * 0.098, 0.016);
    k.body('buckler-brass', shieldPose(front(sdf.union(rim, boss, stud(0), stud(120), stud(240)))), {
      color: C.brass,
      roughness: 0.3,
      metalness: 0.9,
      detail: 0.004,
      bone: 'forearm.L',
    });

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
        plume: { rotate: [3 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
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
          plume: { rotate: [flow * 0.5 + 5 * wave(p, 2, 0.2), 0, 4 * wave(p, 2, 0.1)] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.15 * s + shield[0], 0, 3] as const },
          'forearm.L': { rotate: [shield[1], 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, -6] as const },
          'forearm.R': { rotate: [-armSwing * 0.2 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    // A fighter in mail walks steadily: short steps, a low swing, long stances.
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.62, 0.005, 28, 3, 6, [4, 0]));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.42, 0.025, 50, 12, 22));

    // A diagonal slash, solved by targets (as the animated armor's attack). The wrist follows keys
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
    const BLADE_DIR = rotZ(rotX([0, -1, 0], SWORD.x), SWORD.z); // the blade (local -Y) at rest, as swordPose
    const FLAT = rotZ(rotX([0, 0, 1], SWORD.x), SWORD.z); // the flat's normal (local +Z) at rest
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
      [0.28, norm([-0.75, 0.55, -0.37])], // up and back over the right shoulder, out beside the helm
      [0.38, norm([-0.72, 0.58, -0.38])], // the hold at the top
      [0.44, norm([-0.6, 0.6, 0.5])], // over the shoulder: forward on the right, up and out
      [0.48, norm([-0.25, 0.15, 0.95])], // level, pointing forward, under the helm's rim
      [0.53, norm([0.55, -0.25, 0.8])], // across the front to the left
      [0.6, norm([0.8, -0.32, 0.5])], // low left
      [0.7, norm([0.78, -0.34, 0.5])], // the follow-through holds
      [0.86, norm([-0.3, -0.35, 0.89])], // back through the front, the tip clear of the floor
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
            [0.28, [-0.29, 0.44, -0.035]],
            [0.38, [-0.292, 0.442, -0.04]],
            [0.44, [-0.29, 0.425, 0.06]],
            [0.48, [-0.2, 0.415, 0.15]],
            [0.53, [-0.15, 0.36, 0.175]],
            [0.6, [-0.15, 0.3, 0.163]],
            [0.7, [-0.15, 0.302, 0.162]],
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
          plume: { rotate: [6 * wind - 14 * cut, 0, -4 * wind + 6 * cut] },
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
          plume: { rotate: [16 * lag, 0, 5 * lag] },
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
      wristR: [-0.27, 0.35, -0.1] as V3,
      bladeR: norm([-0.52, -0.85, -0.14]),
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
          plume: { rotate: [18 * lag - 22 * toes, 0, 6 * lag] },
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
          plume: { rotate: [14 * lag, 0, 3 * lag] },
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
      wrist: [-0.305, 0.44, 0.04] as V3,
      blade: norm([-0.32, 0.94, 0.1]),
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
            [0.12, [-0.29, 0.37, 0.08]],
            [0.26, [-0.303, 0.442, 0.042]],
            [0.32, [-0.305, 0.444, 0.04]],
            [0.42, WIN.wrist],
          ] as const,
          'spline',
        );
        const poleR = keys(p, [[0, POLE_REST], [0.12, [-0.6, 0.1, -0.1]], [0.3, [-0.6, 0.15, -0.25]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const blade = norm(
          keys(p, [[0, BLADE_DIR], [0.12, norm([-0.85, 0.2, 0.48])], [0.26, norm([-0.4, 0.9, 0.14])], [0.32, norm([-0.36, 0.93, 0.1])], [0.42, WIN.blade]] as const, 'spline'),
        );
        const flatUp = norm(keys(p, [[0, FLAT], [0.12, [0, 1, 0.2]], [0.26, [-1, 0.25, 0.15]]] as const));
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
          plume: { rotate: [12 * lag, 0, 6 * sway] },
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
