import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Knight — Chibi Quest hero (catalog `heroes/martial/knight`), 1.0 m to the helm crown, plume
 * above that, faces +Z. Target: docs/hero-mockups/knight_001.jpg (one front view; side and back
 * are designed here). Built on the rogue's body, face, and skeleton, so the heroes read as a set.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the face, helm, and shield must read.
 * One idea: a big round steel helm with a gold brow and a red plume frames a brave little face;
 *   a big heater shield with a red heart covers the left side, a short sword points out low right.
 * Proportions (from the mockup): plume top 1.12, helm crown 0.97, brow band 0.74, eyes 0.63,
 *   chin 0.48, shoulders 0.44 (pauldrons), belt 0.25, tabard hem 0.1, knees 0.12.
 * Shape language: round and sturdy (helm dome, pauldrons, knee cops, fists), with sharp accents
 *   for the fighter (plume feathers, crest plate, sword, shield point).
 * Palette (60/30/10): satin steel #bcc2cb (light); red cloth #c93a32 (mid); gold #e0b040
 *   accent. Skin #f2c7a4, hair #231c18, mail #737a84, leather #6a432c, leggings #3a3f48.
 * Value plan: the dark hair and the helm's shadowed inside frame the light face (focal point);
 *   the red shield face and scarf are the second masses; gold trims are the small accents.
 * Bodies: skin, hair, helm, helm-gold, feathers, scarf, cape, cuirass, pauldrons, trim, mail,
 *   gauntlets, belt, tabard, tassets, leggings, greaves, sword, hilt, grip, shield, shield-face,
 *   shield-gold.
 * Rig: the rogue's chibi skeleton plus `cloak` (cape) and `plume`; sword rigid on the right hand,
 *   shield rigid on the left forearm. Clips: idle, walk, run, attack (a diagonal slash).
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
  brow: '#231c18',
  mouth: '#a4503f',
  hair: '#231c18',
  steel: '#bcc2cb',
  steelDark: '#8e959f',
  gold: '#e0b040',
  red: '#c93a32',
  redDark: '#8f2621',
  enamel: '#c8352c',
  heart: '#ec5a44',
  plume: '#e03a44',
  plumeDark: '#a8202c',
  mail: '#737a84',
  leather: '#6a432c',
  leggings: '#3a3f48',
  sole: '#3a3f48',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. Both forearms point forward: the right hand carries the sword low and out, the left
// forearm carries the shield in front of the left side.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.335, -0.005];
const WRIST_R: V3 = [-0.215, 0.3, 0.1];
const ELBOW_L: V3 = [0.175, 0.335, 0];
const WRIST_L: V3 = [0.2, 0.29, 0.085];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
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

const heater = profile.polygon(
  [
    [-0.12, 0.2],
    [-0.126, 0.12],
    [-0.12, 0.03],
    [-0.098, -0.07],
    [-0.06, -0.155],
    [0, -0.24],
    [0.06, -0.155],
    [0.098, -0.07],
    [0.12, 0.03],
    [0.126, 0.12],
    [0.12, 0.2],
    [0.04, 0.214],
    [-0.04, 0.214],
  ],
  { smooth: true, samples: 4 },
);

const heart = profile.polygon(
  [
    [0, -0.075],
    [0.03, -0.034],
    [0.066, 0.008],
    [0.069, 0.045],
    [0.038, 0.079],
    [0.009, 0.053],
    [0, 0.036],
    [-0.009, 0.053],
    [-0.038, 0.079],
    [-0.069, 0.045],
    [-0.066, 0.008],
    [-0.03, -0.034],
  ],
  { smooth: true, samples: 5 },
);

export default defineAsset({
  name: 'knight',
  description: 'Chibi knight hero with a round plumed helm, red scarf and cape, sword, and heart shield.',
  detail: 0.005,
  reference: 'docs/hero-mockups/knight_001.jpg',

  build(k) {
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
      'foot.L': { parent: 'leg.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'foot.R': { parent: 'leg.R', at: mx(ANKLE) },
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
    const brows = pair(sdf.extrude(profile.arc(0.16, 0.024, 70, 106), 0.3).at(0.1, 0.712 - 0.16, 0.1).rotateZ(-3));
    const smile = sdf.extrude(profile.arc(0.07, 0.011, 243, 297), 0.3).at(0, 0.528 + 0.07, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.135, 0.56));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, C.brow)
      .paintWhere(smile, C.mouth);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ helm
    const helmOuter = sdf.ellipsoid([0.246, 0.275, 0.246]).at(0, 0.69, -0.012);
    const helmInner = sdf.ellipsoid([0.226, 0.255, 0.226]).at(0, 0.69, -0.012);
    const shellOf2 = (s: sdf.Shape) => s.round(0.011).subtract(s.round(-0.01));
    // The face opening: straight across under the brow band, down between the cheek guards,
    // which close in toward the chin.
    const BROW_Y = 0.745;
    const opening = sdf
      .extrude(
        profile.polygon(
          [
            [-0.168, BROW_Y],
            [0.168, BROW_Y],
            [0.176, 0.68],
            [0.162, 0.6],
            [0.13, 0.53],
            [0.11, 0.4],
            [-0.11, 0.4],
            [-0.13, 0.53],
            [-0.162, 0.6],
            [-0.176, 0.68],
          ],
          { smooth: true, samples: 6 },
        ),
        0.5,
        0.01,
      )
      .at(0, 0, 0.27);
    // A notch behind each cheek guard separates it from the neck guard.
    const notch = hard(sdf.capsule([0.25, 0.46, -0.045], [0.25, 0.575, -0.045], 0.016));
    // A low comb over the crown, from the crest plate back to the nape.
    const comb = shellOf2(helmOuter)
      .smoothIntersect(0.006, sdf.box([0.024, 0.5, 0.7], 0.01).at(0, 0.9, -0.1))
      .smoothIntersect(0.01, sdf.halfSpace([0, 0, 1], 0.12));
    const helm = helmOuter
      .smoothUnion(0.008, comb)
      .subtract(helmInner)
      .smoothSubtract(0.006, opening, notch)
      .intersect(sdf.halfSpace([0, -1, 0], -0.49))
      .paintWhere(helmInner.round(0.005), C.steelDark, 0.01);
    k.body('helm', helm, { color: C.steel, roughness: 0.4, metalness: 0.8, bone: 'head' });

    // Gold: the brow band all around, the crest plate over the brow, ear discs, and the finial.
    const shellOf = (s: sdf.Shape, out: number, inn: number) => s.round(out).subtract(s.round(-inn));
    // Smooth intersections: hard cuts leave crumpled side walls that metal highlights exaggerate.
    const band = shellOf(helmOuter, 0.008, 0.016)
      .smoothIntersect(0.006, sdf.box([0.8, 0.044, 0.8], 0.01).at(0, BROW_Y + 0.02, 0))
      .smoothSubtract(0.004, opening);
    const crest = shellOf(helmOuter, 0.014, 0.016).smoothIntersect(
      0.005,
      sdf
        .extrude(
          profile.polygon([
            [0, BROW_Y - 0.03],
            [0.058, BROW_Y + 0.02],
            [0.05, BROW_Y + 0.12],
            [-0.05, BROW_Y + 0.12],
            [-0.058, BROW_Y + 0.02],
          ]),
          0.4,
          0.006,
        )
        .at(0, 0, 0.3),
    );
    const earAt = sdf.surfacePoint(helmOuter, [0.3, 0.64, 0.01], 0.004);
    const earDisc = hard(
      sdf
        .cylinder(0.044, 0.02, 0.008)
        .union(sdf.sphere(0.014).at(0, 0.012, 0))
        .rotateZ(-90)
        .at(...earAt),
    );
    const crownAt = sdf.surfacePoint(helmOuter, [0, 1.1, -0.012], 0);
    const finial = sdf
      .union(sdf.cylinder(0.034, 0.03, 0.008).at(0, 0.01, 0), sdf.cylinder(0.024, 0.02, 0.006).at(0, 0.03, 0))
      .at(...crownAt);
    k.body('helm-gold', sdf.union(band, crest, earDisc, finial), {
      color: C.gold,
      roughness: 0.3,
      metalness: 0.9,
      detail: 0.0035,
      bone: 'head',
    });

    // Plume: a tuft of feathers rises out of the finial and falls over toward the right (-X)
    // and back; the tips droop. Strands blend into one soft mass; darker streaks read as barbs.
    const feather = (dx: number, dz: number, h: number, r: number) =>
      sdf.chain(
        [
          [PLUME_AT[0], PLUME_AT[1], PLUME_AT[2], r * 0.7],
          [PLUME_AT[0] + dx * 0.15, PLUME_AT[1] + h * 0.55, PLUME_AT[2] + dz * 0.2, r],
          [PLUME_AT[0] + dx * 0.5, PLUME_AT[1] + h * 0.95, PLUME_AT[2] + dz * 0.6, r * 0.85],
          [PLUME_AT[0] + dx * 0.85, PLUME_AT[1] + h * 0.85, PLUME_AT[2] + dz * 0.9, r * 0.5],
          [PLUME_AT[0] + dx, PLUME_AT[1] + h * 0.6, PLUME_AT[2] + dz, r * 0.18],
        ],
        0.012,
      );
    const feathers = sdf
      .smoothUnion(
        0.022,
        feather(-0.2, -0.02, 0.13, 0.022),
        feather(-0.17, -0.07, 0.16, 0.026),
        feather(-0.12, -0.1, 0.175, 0.027),
        feather(-0.07, -0.09, 0.17, 0.025),
        feather(-0.03, -0.05, 0.15, 0.022),
        feather(0.04, -0.04, 0.12, 0.018),
        feather(-0.15, 0.03, 0.14, 0.02),
      )
      .paintWhere(sdf.sphere(0.07).at(...PLUME_AT), C.plumeDark, 0.04)
      .paintFn((x, y, z, base) =>
        Math.sin(Math.atan2(x - PLUME_AT[0], z - PLUME_AT[2]) * 26 + y * 40) > 0.6 ? [base[0] * 0.8, base[1] * 0.8, base[2] * 0.8] : base,
      );
    k.body('feathers', feathers, { color: C.plume, roughness: 0.8, detail: 0.004, bone: 'plume' });

    // ------------------------------------------------------------------ hair under the helm
    const insideHelm = helmInner.round(-0.003).union(opening.round(-0.008).intersect(helmOuter.round(-0.002)));
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.012, sdf.ellipsoid([0.24, 0.155, 0.23]).at(0, 0.61, 0.14));
    // Pointed locks fall from under the brow band onto the forehead.
    const lock = (x: number, len: number, lean: number, r: number) => {
      const top = sdf.surfacePoint(head, [x, BROW_Y + 0.01, 0.4], 0.004);
      return sdf.cone(top, [top[0] + lean, top[1] - len, top[2] + 0.014], r, 0.004);
    };
    const locks = sdf.union(
      lock(-0.13, 0.034, -0.01, 0.02),
      lock(-0.075, 0.026, -0.006, 0.02),
      lock(-0.02, 0.036, 0.008, 0.021),
      lock(0.04, 0.028, 0.01, 0.02),
      lock(0.1, 0.032, 0.012, 0.02),
      lock(0.152, 0.042, 0.01, 0.018),
    );
    const hair = sdf.smoothUnion(0.012, cap, locks).intersect(insideHelm);
    k.body('hair', hair, { color: C.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ torso: cuirass, mail skirt
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
    k.body('cuirass', cuirass, { color: C.steel, roughness: 0.4, metalness: 0.8, bone: 'chest' });

    // Mail: a short skirt below the cuirass and sleeves on the upper arms, rings in the normal map.
    const rings = (x: number, y: number, z: number) => {
      const u = Math.atan2(z, x) * 30;
      const v = y * 190 + (Math.floor(u / Math.PI) % 2) * Math.PI * 0.5;
      return 0.0012 * Math.abs(Math.sin(u)) * Math.abs(Math.sin(v));
    };
    const skirt = torso.round(0.006).smoothIntersect(0.006, sdf.box([0.5, 0.086, 0.5], 0.01).at(0, 0.219, 0));
    const sleeve = (s: V3, e: V3, tag: string) =>
      sdf.cone(s, lerp(s, e, 1.12), 0.046, 0.043).bone(tag);
    k.body(
      'mail',
      sdf.union(skirt.bone('hips'), sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R')),
      { color: C.mail, roughness: 0.55, metalness: 0.7, bump: rings },
    );

    // ------------------------------------------------------------------ pauldrons (two lames each)
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.1 * s, 0.066 * s, 0.096 * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.016 * s))
        .round(0.003);
    const pauldronPose = (s: sdf.Shape) => s.rotateZ(-26).at(0.158, 0.432, 0);
    const pauldronLocal = sdf.union(lame(1), lame(1.14).at(0, -0.034, 0));
    const pauldrons = pair(pauldronPose(pauldronLocal).bone('upperarm.L'));
    k.body('pauldrons', pauldrons, { color: C.steel, roughness: 0.4, metalness: 0.8 });
    // Gold trim along the lower edge of each lame.
    const edge = (s: number, y: number) =>
      lame(s)
        .round(0.003)
        .smoothIntersect(0.004, sdf.box([0.4, 0.014, 0.4]).at(0, -0.009 * s, 0))
        .at(0, y, 0);
    const pauldronTrim = pair(pauldronPose(sdf.union(edge(1, 0), edge(1.14, -0.034))).bone('upperarm.L'));

    // ------------------------------------------------------------------ gauntlets: vambraces and fists
    const vambrace = (e: V3, w: V3) => sdf.cone(lerp(e, w, 0.15), lerp(e, w, 1.02), 0.041, 0.047).round(0.003);
    const fistR = handPose(HAND_R, WRIST_R)(fistLocal(-1));
    const fistL = handPose(HAND_L, WRIST_L)(fistLocal(1));
    const gauntlets = sdf.union(
      sdf.smoothUnion(0.012, vambrace(ELBOW_L, WRIST_L).bone('forearm.L'), fistL.bone('hand.L')),
      sdf.smoothUnion(0.012, vambrace(ELBOW_R, WRIST_R).bone('forearm.R'), fistR.bone('hand.R')),
    );
    k.body('gauntlets', gauntlets, { color: C.steel, roughness: 0.4, metalness: 0.8 });

    // ------------------------------------------------------------------ belt, tassets, tabard
    const beltY = 0.252;
    const belt = cuirass.round(0.006).smoothIntersect(0.005, sdf.box([0.5, 0.046, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), { color: C.leather, roughness: 0.65 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const beltPlate = sdf
      .extrude(
        profile.polygon([
          [-0.03, 0.028],
          [0.03, 0.028],
          [0.03, -0.012],
          [0, -0.034],
          [-0.03, -0.012],
        ]),
        0.014,
        0.004,
      )
      .at(0, beltY, beltZ + 0.002);

    // Tassets: curved plates over the hips, each hung from the belt with a gold ring stud.
    const hipShell = torso.round(0.02).subtract(torso.round(0.004));
    const tassetL = hipShell
      .smoothIntersect(0.008, sdf.box([0.1, 0.1, 0.3], 0.02).rotateZ(10).at(0.105, 0.19, 0.08))
      .bone('leg.L');
    const tassets = pair(tassetL);
    k.body('tassets', tassets, { color: C.steel, roughness: 0.4, metalness: 0.8 });
    const studAt = sdf.surfacePoint(tassetL, [0.12, 0.2, 0.3], 0);
    const studs = pair(sdf.torus(0.016, 0.005).rotateX(90).rotateY(28).at(...studAt).bone('leg.L'));

    // The red tabard: two flaps hanging from the belt at the front, split in the middle.
    const flapL = sdf
      .extrude(
        profile.polygon([
          [0.002, 0.262],
          [0.056, 0.262],
          [0.072, 0.09],
          [0.003, 0.086],
        ]),
        0.016,
        0.006,
      )
      .rotateX(-8)
      .at(0, 0, 0.128);
    k.body('tabard', pair(flapL.bone('leg.L')), { color: C.red, roughness: 0.8 });

    // ------------------------------------------------------------------ scarf and cape
    const scarfRing = sdf
      .revolve(
        profile.polygon(
          [
            [0.05, 0.502],
            [0.095, 0.496],
            [0.132, 0.472],
            [0.142, 0.446],
            [0.12, 0.432],
            [0.085, 0.452],
            [0.05, 0.468],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9]);
    // The ends drape in a V over the breastplate.
    const drape = cuirass
      .round(0.012)
      .subtract(cuirass.round(-0.002))
      .intersect(
        sdf
          .extrude(
            profile.polygon([
              [-0.105, 0.47],
              [0.105, 0.47],
              [0.02, 0.37],
              [0, 0.36],
              [-0.02, 0.37],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      );
    const scarf = sdf
      .smoothUnion(0.012, scarfRing, drape)
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(z, x) * 9 + y * 60) > 0.75 ? [base[0] * 0.85, base[1] * 0.85, base[2] * 0.85] : base));
    k.body('scarf', scarf, { color: C.red, roughness: 0.8, bone: 'chest' });

    // A cone of cloth behind, open at the top and the hem; the folds bend both walls alike.
    const folds = (x: number, y: number, z: number) =>
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
        .displace(0.012, folds);
    const cape = capeCone(0.19, 0.285, 0.44, 0.09)
      .subtract(capeCone(0.168, 0.263, 0.46, 0.07))
      .at(0, 0, -0.025)
      .intersect(sdf.halfSpace([0, 0, 1], -0.02))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.12), C.redDark);
    k.body('cape', cape.bone('cloak'), { color: C.red, roughness: 0.8 });

    // ------------------------------------------------------------------ legs: leggings, knee cops, greaves, sabatons
    const leggings = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.112, 0.05, 0.084]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.095, 0.1, 0.004], 0.046).bone('leg.L')),
    );
    k.body('leggings', leggings, { color: C.leggings, roughness: 0.85 });
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
    k.body('greaves', pair(sdf.union(sdf.smoothUnion(0.01, greave, knee), sabaton)), {
      color: C.steel,
      roughness: 0.4,
      metalness: 0.8,
    });

    // ------------------------------------------------------------------ gold trims on the body
    k.body(
      'trim',
      sdf.union(beltPlate.bone('spine'), studs, pauldronTrim),
      { color: C.gold, roughness: 0.3, metalness: 0.9 },
    );

    // ------------------------------------------------------------------ sword in the right hand
    // Local frame: the grip center at the origin, the blade toward -Y, the flat facing +Z.
    const BLADE_W = 0.038;
    const BLADE_T = 0.011;
    const R = ((BLADE_W / 2) ** 2 + (BLADE_T / 2) ** 2) / BLADE_T;
    const lens = sdf.intersect(
      sdf.cylinder(R, 1).at(0, 0, R - BLADE_T / 2),
      sdf.cylinder(R, 1).at(0, 0, -(R - BLADE_T / 2)),
    );
    const bladeLocal = sdf
      .extrude(
        profile.polygon([
          [-BLADE_W / 2, -0.078],
          [BLADE_W / 2, -0.078],
          [BLADE_W / 2 - 0.003, -0.27],
          [0, -0.33],
          [-BLADE_W / 2 + 0.003, -0.27],
        ]),
        0.2,
      )
      .intersect(lens)
      .paintWhere(sdf.box([0.012, 0.6, 0.2]).at(0, -0.2, 0), '#b3b9c2', 0.003);
    const guardLocal = sdf
      .box([0.11, 0.018, 0.024], 0.008)
      .bend(5)
      .union(hard(sdf.sphere(0.014).at(0.056, -0.008, 0)))
      .at(0, -0.074, 0);
    const pommelLocal = sdf.smoothUnion(0.008, sdf.sphere(0.019).at(0, 0.052, 0), sdf.cone([0, 0.03, 0], [0, 0.045, 0], 0.013, 0.016));
    const gripLocal = sdf.cylinder(0.0135, 0.11, 0.004).at(0, -0.014, 0);
    const GRIP = handPoint(HAND_R, WRIST_R, [-0.007, -0.04, 0.004]);
    const swordPose = (s: sdf.Shape) => s.rotateX(-12).rotateZ(-44).at(...GRIP);
    k.body('sword', swordPose(bladeLocal), { color: C.steel, roughness: 0.3, metalness: 0.9, detail: 0.003, bone: 'hand.R' });
    k.body('hilt', swordPose(sdf.union(guardLocal, pommelLocal)), {
      color: C.gold,
      roughness: 0.3,
      metalness: 0.9,
      detail: 0.004,
      bone: 'hand.R',
    });
    k.body('grip', swordPose(gripLocal), {
      color: C.leather,
      roughness: 0.75,
      detail: 0.004,
      bone: 'hand.R',
      bump: (x, y, z) => 0.0012 * Math.abs(Math.sin(noise.noise3(x * 3, y * 3, z * 3) + (x + y) * 260)),
    });

    // ------------------------------------------------------------------ heater shield on the left forearm
    // Local frame: the face toward +Z, the point down. A raised steel rim around a red enamel
    // field, a gold band inside the rim with a V at the top, and a raised heart.
    const shieldPose = (s: sdf.Shape) => s.rotateZ(-4).rotateX(-4).rotateY(38).at(0.236, 0.3, 0.092);
    const inner = profile.offsetProfile(heater, -0.022);
    const steelPlate = sdf.union(
      sdf.extrude(heater, 0.024, 0.006),
      sdf.extrude(heater, 0.036, 0.008).subtract(sdf.extrude(inner, 0.1)),
    );
    const handle = sdf.capsule([-0.03, 0.02, -0.02], [0.03, -0.01, -0.02], 0.012);
    k.body('shield', shieldPose(sdf.union(steelPlate, handle)), {
      color: C.steel,
      roughness: 0.4,
      metalness: 0.8,
      bone: 'forearm.L',
    });
    const heartShape = sdf.extrude(heart, 0.032, 0.008).scale([1.2, 1.2, 1]).at(0, -0.014, 0.005);
    const swirl = sdf.extrude(profile.arc(0.03, 0.006, 200, 360), 0.3).at(0.006, 0.0, 0).union(
      sdf.extrude(profile.arc(0.016, 0.005, 20, 200), 0.3).at(0.02, 0.0, 0),
    );
    const face = sdf
      .union(sdf.extrude(profile.offsetProfile(heater, -0.018), 0.028, 0.005), heartShape.paint(C.heart))
      .paintWhere(swirl.scale([1.2, 1.2, 1]).at(0, -0.014, 0), C.redDark);
    k.body('shield-face', shieldPose(face), { color: C.enamel, roughness: 0.45, metalness: 0.1, bone: 'forearm.L' });
    const goldBand = sdf
      .extrude(profile.offsetProfile(heater, -0.024), 0.032, 0.004)
      .subtract(sdf.extrude(profile.offsetProfile(heater, -0.036), 0.1));
    const yoke = sdf.extrude(
      profile.polygon([
        [-0.1, 0.2],
        [-0.07, 0.2],
        [0, 0.132],
        [0.07, 0.2],
        [0.1, 0.2],
        [0, 0.1],
      ]),
      0.032,
      0.004,
    );
    k.body('shield-gold', shieldPose(sdf.union(goldBand, yoke)), {
      color: C.gold,
      roughness: 0.3,
      metalness: 0.9,
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
    const stride = (duration: number, legSwing: number, armSwing: number, lean: number, hop: number, flow: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        return {
          hips: {
            move: [0, -legDrop(LEG, legSwing * s) + hop * bump(p, 2, 0.25), 0] as const,
            rotate: [0, 7 * s, 0] as const,
          },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, 0] as const },
          plume: { rotate: [flow * 0.5 + 5 * wave(p, 2, 0.2), 0, 4 * wave(p, 2, 0.1)] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * 0.15 * s, 0, 3] as const },
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, -6] as const },
          'forearm.R': { rotate: [-armSwing * 0.2 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 26, 28, 3, 0, 6));
    k.animation('run', stride(0.56, 40, 50, 12, 0.03, 22));

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
    const BLADE_DIR = rotZ(rotX([0, -1, 0], -12), -44); // the blade (local -Y) at rest, as swordPose
    const FLAT = rotZ(rotX([0, 0, 1], -12), -44); // the flat's normal (local +Z) at rest
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
            [0.28, [-0.275, 0.472, -0.035]],
            [0.38, [-0.278, 0.476, -0.04]],
            [0.44, [-0.27, 0.475, 0.065]],
            [0.48, [-0.19, 0.43, 0.155]],
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
  },
});
