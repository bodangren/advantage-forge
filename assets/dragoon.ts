import { addPart, defineAsset, mapTint, motion, profile, rgb, sdf } from '../src/index.js';
import { DRAGOON_HELM_MOUNT, dragoonHelm } from './parts/dragoon-helm.js';
import { dragoonLance } from './parts/dragoon-lance.js';

/**
 * Dragoon — Dragon Rider hero (catalog `heroes/martial/dragoon`), 1.0 m to the helm crown, the
 * center spike above that, the lance 1.5 m, faces +Z. Target: docs/hero-mockups/dragoon_001.jpg
 * (one front view; side and back are designed here; the mockup's beard is left out: the set has
 * one young, round, beardless face). Built on the knight's body, face, and skeleton.
 *
 * Role: player hero (a lancer), seen in 3D and as a 128 px sprite: the winged helm, the blue
 *   plate, the red cape, and the upright lance must read; the face shows under the brim.
 * One idea: a wide dark-blue helm with a silver riveted brim, a center spike, two curved horn
 *   blades, and a small dragon wing on each side frames a serious young face; a long steel lance
 *   stands upright beside the head in the right fist.
 * Proportions: spike top 1.085, helm crown 0.965, brim band 0.745, eyes 0.63, chin 0.48,
 *   shoulders 0.44, belt 0.25, skirt hem 0.112, knees 0.12; lance 1.5 (butt on the ground).
 * Shape language: sturdy and round (dome, pauldrons, fists) with triangular accents (spike,
 *   horns, wings, lance head, diamond buckle).
 * Palette (60/30/10): plate blue #3a4a6a (dark #26334a), silver #c3c8cf trims (light), red cape
 *   #c93a32 (accent). Skin #f2c7a4, hair #4a2e1c, leather #4e2d1c, lance shaft #4a4f55.
 * Bodies: skin, hair, helm, wings, helm-silver, cuirass, mail, pauldrons, gauntlets, belt,
 *   tassets, leggings, greaves, boots, knees, silver, cape, lance, lance-steel, lance-grip.
 * Rig: the knight's chibi skeleton (knees, `cloak`, `plume`); the lance is rigid on `hand.R`.
 *   Clips: idle, walk, run, attack (a two-handed forward thrust, the lance 20 degrees above
 *   level), attack2 (a jump strike: crouch, hop, lance down 45 degrees, landing), hit, death (the
 *   lance lies beside him), victory (the lance and the left fist up).
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
  hair: '#4a2e1c',
  plate: '#4a5a7a',
  plateDark: '#2e3a52',
  silver: '#c3c8cf',
  silverDark: '#8e959f',
  rivet: '#d8dce0',
  cape: '#c93a32',
  capeDark: '#8a2420',
  leather: '#4e2d1c',
  shaft: '#4a4f55',
  sole: '#1c2433',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');

// Joints. The right forearm carries the lance out to the side of the helm; the left arm hangs.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.205, 0.335, 0.01];
const WRIST_R: V3 = [-0.285, 0.31, 0.125];
const ELBOW_L: V3 = [0.175, 0.335, 0];
const WRIST_L: V3 = [0.2, 0.29, 0.085];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
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
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));
/** Rotate `w` by the shortest turn that takes direction `u` to direction `v`. */
const swing = (u: V3, v: V3, w: V3): V3 => {
  const a = cross(u, v);
  const s = Math.hypot(a[0], a[1], a[2]);
  if (s < 1e-6) return w;
  const ax = mul(a, 1 / s);
  const c = dot(u, v);
  const t = cross(ax, w);
  const k = dot(ax, w) * (1 - c);
  return [w[0] * c + t[0] * s + ax[0] * k, w[1] * c + t[1] * s + ax[1] * k, w[2] * c + t[2] * s + ax[2] * k];
};

/** A fist hanging from the wrist at the origin: palm, a finger roll at the front, a thumb. */
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.04, 0.045, 0.046]).at(0.007 * s, -0.04, 0.004),
    sdf.capsule([-0.009 * s, -0.061, 0.031], [-0.005 * s, -0.04, 0.044], 0.018),
    sdf.cone([0.021 * s, -0.024, 0.026], [0.001 * s, -0.035, 0.05], 0.017, 0.0135),
  );
// The right fist hangs straight from the wrist: its finger stack is vertical, around the lance.
// The left hand swings forward along its forearm, then turns about the forward axis.
const HAND_R = { pitch: 0, roll: 0 };
const HAND_L = { pitch: -62, roll: 26 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const handPoint = (h: { pitch: number; roll: number }, w: V3, p: V3) => add(rotZ(rotX(p, h.pitch), h.roll), w);

// The fist center on the lance axis; the lance stands on the ground with the butt at y = 0.
const GRIP = handPoint(HAND_R, WRIST_R, [-0.007, -0.04, 0.004]);

export default defineAsset({
  name: 'dragoon',
  description: 'Chibi dragoon hero: a dark-blue winged dragon helm, scale pauldrons, a red cape, and an upright steel lance.',
  detail: 0.006,
  reference: 'docs/hero-mockups/dragoon_001.jpg',
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { brown: C.hair, black: '#231a17', blond: '#c4974a' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    armor: { blue: C.plate, black: '#2a2a30', crimson: '#7a2a2a', green: '#2f5a3a' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'brown', skin: 'fair', armor: 'blue' },
    black: { eyes: 'brown', hair: 'black', skin: 'tan', armor: 'black' },
    crimson: { eyes: 'green', hair: 'blond', skin: 'fair', armor: 'crimson' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      skin: k.tint('skin'),
      plate: k.tint('armor'),
      plateDark: k.tint('armor', { color: C.plateDark, follow: 1 }),
      sole: k.tint('armor', { color: C.sole, follow: 1 }),
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
    // Thick brows, the inner ends low: a serious look. The mouth is a small, nearly flat line.
    const brows = pair(
      sdf.extrude(profile.arc(0.16, 0.03, 70, 106), 0.3).at(-0.0056, -0.16, 0).rotateZ(12).at(0.1056, 0.709, 0.1),
    );
    const smile = sdf.extrude(profile.arc(0.09, 0.011, 252, 288), 0.3).at(0, 0.528 + 0.09, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.135, 0.56));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, C.brow)
      .paintWhere(smile, C.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ helm: dome, brim, spike, horns, wings
    const helmPart = dragoonHelm(mapTint(k, { plate: 'armor' }));
    const helmPose = (s: sdf.Shape) => s.at(...DRAGOON_HELM_MOUNT);
    addPart(k, helmPart, { pose: helmPose });

    // ------------------------------------------------------------------ hair under the helm
    const BROW_Y = 0.745;
    const insideHelm = helmPose(helmPart.regions!.inside!);
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
    const hair = sdf.smoothUnion(0.012, cap, locks).intersect(insideHelm).intersect(sdf.halfSpace([0, -1, 0], -0.5));
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ torso: cuirass, sleeves
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
    const cuirassPaint = cuirass.paintWhere(sdf.halfSpace([0, 1, 0], 0.3), T.plateDark, 0.012);
    k.body('cuirass', cuirassPaint, { color: T.plate, roughness: 0.55, metalness: 0.4, bone: 'chest' });

    // A silver dragon crest on the breastplate: a diamond with two swept wings, raised 12 mm.
    const HALF: [number, number][] = [
      [0, 0.39],
      [0.022, 0.372],
      [0.054, 0.384],
      [0.046, 0.362],
      [0.058, 0.35],
      [0.034, 0.352],
      [0.022, 0.34],
      [0, 0.33],
    ];
    const crestOutline = profile.polygon([...HALF, ...HALF.slice(1, -1).reverse().map(([x, y]): [number, number] => [-x, y])]);
    const emblem = cuirass
      .round(0.011)
      .subtract(cuirass.round(-0.002))
      .intersect(sdf.extrude(crestOutline, 0.4, 0.004).at(0, 0, 0.2));
    // A 12 mm silver rim around the neck opening and along the lower edge of the breastplate.
    const cuirassRim = cuirass
      .round(0.012)
      .subtract(cuirass.round(-0.003))
      .intersect(sdf.union(sdf.box([0.6, 0.026, 0.6]).at(0, 0.458, 0), sdf.box([0.6, 0.02, 0.6]).at(0, 0.3, 0)));

    // Sleeves on the upper arms; the skirt hangs below (see the tassets).
    const rings = (x: number, y: number, z: number) => {
      const u = Math.atan2(z, x) * 30;
      const v = y * 190 + (Math.floor(u / Math.PI) % 2) * Math.PI * 0.5;
      return 0.0012 * Math.abs(Math.sin(u)) * Math.abs(Math.sin(v));
    };
    const sleeve = (s: V3, e: V3, tag: string) => sdf.cone(lerp(s, e, 0.5), lerp(s, e, 1.12), 0.046, 0.043).bone(tag);
    k.body('mail', sdf.union(sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R')), {
      color: T.plateDark,
      roughness: 0.55,
      metalness: 0.6,
      bump: rings,
    });

    // ------------------------------------------------------------------ pauldrons: three scale plates each
    // Each pauldron: three rounded plates, each 0.02 lower and a little wider than the one above.
    const PLATES: [number, number][] = [
      [0.0, 0],
      [0.024, 1],
      [0.048, 2],
    ];
    const plateBox = (i: number) => sdf.box([0.125 + 0.016 * i, 0.032, 0.106 + 0.01 * i], 0.014).at(0.008 * i, -PLATES[i]![0], 0);
    const pauldronPose = (s: sdf.Shape) => s.rotateZ(-24).at(0.158, 0.448, 0);
    const pauldronLocal = sdf.union(...PLATES.map(([, i]) => plateBox(i)));
    k.body('pauldrons', pair(pauldronPose(pauldronLocal).bone('upperarm.L')), {
      color: T.plate,
      roughness: 0.5,
      metalness: 0.45,
    });
    // A silver edge stroke along the outer lower rim of each plate.
    const plateEdge = (i: number) =>
      plateBox(i)
        .round(0.003)
        .smoothIntersect(0.003, sdf.box([0.4, 0.009, 0.4]).at(0, -PLATES[i]![0] - 0.0105, 0));
    const pauldronTrim = pair(pauldronPose(sdf.union(...PLATES.map(([, i]) => plateEdge(i)))).bone('upperarm.L'));

    // ------------------------------------------------------------------ gauntlets: vambraces and fists
    const vambrace = (e: V3, w: V3) => sdf.cone(lerp(e, w, 0.15), lerp(e, w, 1.02), 0.041, 0.047).round(0.003);
    const fistR = handPose(HAND_R, WRIST_R)(fistLocal(-1));
    const fistL = handPose(HAND_L, WRIST_L)(fistLocal(1));
    k.body(
      'gauntlets',
      sdf.union(
        sdf.smoothUnion(0.012, vambrace(ELBOW_L, WRIST_L).bone('forearm.L'), fistL.bone('hand.L')),
        sdf.smoothUnion(0.012, vambrace(ELBOW_R, WRIST_R).bone('forearm.R'), fistR.bone('hand.R')),
      ),
      { color: T.plate, roughness: 0.55, metalness: 0.4 },
    );

    const cuff = (e: V3, w: V3) => sdf.cone(lerp(e, w, 0.8), lerp(e, w, 0.9), 0.0475, 0.0485).round(0.002);
    // ------------------------------------------------------------------ belt, buckle, tasset skirt
    const beltY = 0.252;
    const belt = cuirass.round(0.006).smoothIntersect(0.005, sdf.box([0.5, 0.046, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), { color: C.leather, roughness: 0.65 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .extrude(
        profile.polygon([
          [-0.034, 0],
          [0, 0.036],
          [0.034, 0],
          [0, -0.036],
        ]),
        0.014,
        0.005,
      )
      .at(0, beltY, beltZ + 0.002);
    const studAt = (a: number) => {
      const s = Math.sin(a * rad);
      const c = Math.cos(a * rad);
      return sdf.raycast(belt, [0.6 * s, beltY, 0.6 * c], [-s, 0, -c])!;
    };
    const beltStuds = sdf.union(...[-84, -66, -48, -30, 30, 48, 66, 84].map((a) => sdf.sphere(0.0072).at(...studAt(a))));

    // Six plates hang from the belt: a wall of steel around the hips, cut by radial gaps at
    // +-30, +-90, +-150 degrees. The plate in front is the widest.
    const skirtWall = sdf
      .revolve(
        profile.polygon(
          [
            [0.146, 0.245],
            [0.152, 0.2],
            [0.166, 0.15],
            [0.178, 0.112],
            [0.167, 0.112],
            [0.155, 0.15],
            [0.141, 0.2],
            [0.135, 0.245],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.86])
      .round(0.002);
    // Each plate is the wall cut by a rounded slab 0.14 wide, so the six stay separate. The plate
    // edges and the hem are painted silver; a dark mail skirt shows in the gaps.
    const plateCut = (a: number) => sdf.box([0.14, 0.5, 0.3], 0.012).at(0, 0.2, 0.18).rotateY(a);
    const edgeBand = (x: number, z: number) => {
      const a = Math.atan2(x, z) / rad; // 0 in front, +90 on the left
      const d = Math.abs(((((a + 30) % 60) + 60) % 60) - 30); // degrees from the middle of the plate
      return d > 24;
    };
    const plates = sdf
      .union(...[0, 60, -60, 120, -120, 180].map((a) => skirtWall.intersect(plateCut(a))))
      .paintFn((x, y, z, base) => (y < 0.126 || edgeBand(x, z) ? rgb(C.silver) : base));
    k.body('tassets', plates, { color: T.plate, roughness: 0.55, metalness: 0.4, bone: 'hips' });
    const mailWall = sdf
      .revolve(
        profile.polygon(
          [
            [0.138, 0.245],
            [0.146, 0.2],
            [0.158, 0.15],
            [0.169, 0.118],
            [0.16, 0.118],
            [0.15, 0.15],
            [0.138, 0.2],
            [0.131, 0.245],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.86]);
    k.body('mail-skirt', mailWall, { color: T.plateDark, roughness: 0.55, metalness: 0.6, bump: rings, bone: 'hips', detail: 0.008, maxTriangles: 2500 });
    const plateRivet = (a: number) => {
      const s = Math.sin(a * rad);
      const c = Math.cos(a * rad);
      const p = sdf.raycast(skirtWall, [0.5 * s, 0.215, 0.5 * c], [-s, 0, -c])!;
      return sdf.sphere(0.0075).at(...p);
    };
    const plateRivets = sdf.union(...[0, 60, -60, 120, -120, 180].map(plateRivet));

    // ------------------------------------------------------------------ cape: short, at the back
    const folds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(z, x) * 6) * Math.min(1, Math.max(0, (0.42 - y) / 0.2));
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
    const cape = capeCone(0.19, 0.275, 0.44, 0.2)
      .subtract(capeCone(0.168, 0.253, 0.46, 0.18))
      .at(0, 0, -0.025)
      .intersect(sdf.halfSpace([0, 0, 1], -0.02))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.3), C.capeDark);
    k.body('cape', cape.bone('cloak'), { color: C.cape, roughness: 0.85 });

    // ------------------------------------------------------------------ legs: leggings, greaves, knee cops, boots
    k.body(
      'leggings',
      sdf.smoothUnion(
        0.03,
        sdf.ellipsoid([0.112, 0.05, 0.084]).at(0, 0.2, 0).bone('hips'),
        pair(sdf.capsule([HIP[0], 0.2, 0], [0.095, 0.1, 0.004], 0.046).bone('leg.L')),
      ),
      { color: T.plateDark, roughness: 0.85 },
    );
    const knee = sdf.ellipsoid([0.055, 0.034, 0.052]).at(0.095, 0.11, 0.022).bone('leg.L');
    const greave = sdf.cone([0.096, 0.098, 0.006], [0.098, 0.06, 0.004], 0.049, 0.052).bone('leg.L');
    k.body('greaves', pair(greave), { color: T.plate, roughness: 0.55, metalness: 0.4 });
    k.body('knees', pair(knee), { color: C.silver, roughness: 0.35, metalness: 0.8 });
    const sabatonFoot = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.052, 0.06, 0.02).at(0, 0.05, 0),
        sdf.ellipsoid([0.058, 0.05, 0.102]).at(0, 0.045, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const toeLines = sdf.union(
      sdf.box([0.2, 0.006, 0.2]).rotateX(-30).at(0, 0.075, 0.06),
      sdf.box([0.2, 0.006, 0.2]).rotateX(-40).at(0, 0.058, 0.1),
    );
    const sabaton = sabatonFoot
      .smoothSubtract(0.003, toeLines.intersect(sdf.halfSpace([0, 0, -1], -0.04)))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.012), T.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(sabaton), { color: T.plateDark, roughness: 0.55, metalness: 0.4 });

    // ------------------------------------------------------------------ silver trims on the body
    k.body(
      'silver',
      sdf.union(
        emblem.bone('chest'),
        cuirassRim.bone('chest'),
        cuff(ELBOW_L, WRIST_L).bone('forearm.L'),
        cuff(ELBOW_R, WRIST_R).bone('forearm.R'),
        buckle.bone('spine'),
        beltStuds.bone('spine'),
        plateRivets.bone('hips'),
        pauldronTrim,
      ),
      { color: C.silver, roughness: 0.35, metalness: 0.8, detail: 0.0055, maxTriangles: 7000 },
    );

    // ------------------------------------------------------------------ the lance, rigid on the right hand
    const lanceAt = (s: sdf.Shape) => s.at(GRIP[0], GRIP[1], GRIP[2]);
    addPart(k, dragoonLance(), { pose: lanceAt });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const mixDir = (a: V3, b: V3, t: number) => norm(add(mul(a, 1 - t), mul(b, t)));
    const UP: V3 = [0, 1, 0];
    const FWD: V3 = [0, 0, 1];
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    // The rest elbow's bend direction, so a solved arm starts and ends on the rest pose.
    const poleOf = (root: V3, mid: V3, end: V3): V3 => {
      const t = norm(sub(end, root));
      const e = sub(mid, root);
      const side = norm(sub(e, mul(t, dot(e, t))));
      return add(root, mul(side, 0.6));
    };
    const POLE_REST_R = poleOf(mx(SHOULDER), ELBOW_R, WRIST_R);
    const POLE_REST_L = poleOf(SHOULDER, ELBOW_L, WRIST_L);
    // The left fist's finger stack (its grip axis) and finger direction at rest.
    const AXIS_L = rotZ(rotX(UP, HAND_L.pitch), HAND_L.roll);
    const FING_L = rotZ(rotX(FWD, HAND_L.pitch), HAND_L.roll);
    // The right hand holds the lance: dir is the shaft direction (butt to tip) in the chest frame.
    const handR = (arm: { upper: V3; lower: V3 }, dir: V3) =>
      orient([arm.upper, arm.lower], { dir: UP, up: FWD }, { dir, up: swing(UP, dir, FWD) });
    const handL = (arm: { upper: V3; lower: V3 }, dir: V3) =>
      orient([arm.upper, arm.lower], { dir: AXIS_L, up: FING_L }, { dir, up: swing(AXIS_L, dir, FING_L) });

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [1.5 * wave(p), 0, 0] },
        neck: { rotate: [-1 * wave(p), 0, 0] },
        head: { rotate: [0, 3 * wave(p, 1, 0.25), 1 * wave(p, 1, 0.1)] },
        plume: { rotate: [3 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, -2 * bump(p)] },
        'forearm.L': { rotate: [-4 * bump(p), 0, 0] },
      }),
    });

    // The lance arm stays close to the body and the left arm swings; the legs come from motion.gait.
    const stride = (
      duration: number,
      step: number,
      footLift: number,
      duty: number,
      bob: number,
      armSwing: number,
      lean: number,
      flow: number,
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
          chest: { rotate: [lean * 0.5, -3 * s, 0] as const },
          head: { rotate: [-lean, 3 * s, 0] as const },
          plume: { rotate: [flow * 0.5 + 5 * wave(p, 2, 0.2), 0, 4 * wave(p, 2, 0.1)] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.6 * s, 0, 3] as const },
          'forearm.L': { rotate: [-armSwing * 0.2 * Math.max(0, -s), 0, 0] as const },
          'upperarm.R': { move: [0, 0.004 - legs.hipsY + 0.13 * Math.sin(lean * 1.5 * rad), 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.62, 0.005, 28, 3, 6));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.42, 0.025, 50, 12, 22));

    // attack: a two-handed thrust. The body turns to its right so both shoulders line up with the
    // lance; the head turns back to look ahead. The right hand takes the butt end, the left hand
    // comes over and grips forward of it. u = the stance, v = the thrust, w = the left hand on.
    const TW = { hips: -24, spine: -24, chest: -28, neck: 28, head: 42 };
    const DC = norm([0.912, 0.342, 0.227]); // the lance in the chest frame: 20 degrees up in the world
    const DC_READY = norm([0.84, 0.5, 0.2]);
    const WR_T: V3 = [-0.035, 0.315, 0.165];
    const GAP = 0.09;
    const FWDUP = norm([-0.05, 0.55, 0.83]);
    const POLE_R: V3 = [-0.5, 0.2, 0];
    const POLE_L: V3 = [0.5, 0.2, 0];
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const u = ease(0, 0.3, p) * (1 - ease(0.68, 0.96, p));
        const v = ease(0.3, 0.4, p) * (1 - ease(0.52, 0.66, p));
        const w = ease(0.14, 0.28, p) * (1 - ease(0.6, 0.78, p));
        const lunge = ease(0.28, 0.4, p) * (1 - ease(0.62, 0.92, p));
        const tgt = mixDir(DC_READY, DC, v);
        // The lance first tips forward, clear of the face, and then turns across the body.
        const dir = u < 0.5 ? mixDir(UP, FWDUP, u * 2) : mixDir(FWDUP, tgt, (u - 0.5) * 2);
        const wr = lerp(WRIST_R, lerp(sub(WR_T, mul(DC, 0.07)), WR_T, v), u);
        const mR = mul([0.03, 0, 0.05], u);
        const mL = mul([0, 0, 0.09], u * w);
        const armR = reach(ARM_R, sub(wr, mR), POLE_R);
        const wl = lerp(WRIST_L, add(wr, mul(dir, GAP)), w);
        const armL = reach(ARM_L, sub(wl, mL), POLE_L);
        const gripDir = mixDir(AXIS_L, mul(dir, -1), w);
        const step = 22 * lunge;
        return {
          hips: { move: [0, -legDrop(LEG, step), 0.03 * lunge], rotate: [0, TW.hips * u, 0] },
          spine: { rotate: [4 * lunge, TW.spine * u, 0] },
          chest: { rotate: [2 * lunge, TW.chest * u, 0] },
          neck: { rotate: [0, TW.neck * u, 0] },
          head: { rotate: [-2 * lunge, TW.head * u, 0] },
          plume: { rotate: [6 * u - 12 * lunge, 0, 0] },
          cloak: { rotate: [-3 * u + 10 * lunge, 0, 0] },
          'upperarm.R': { rotate: armR.upper, move: mR },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR(armR, dir) },
          'upperarm.L': { rotate: armL.upper, move: mL },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: handL(armL, gripDir) },
          'leg.L': { rotate: [-step, 0, 0] },
          'leg.R': { rotate: [step, 0, 0] },
          'foot.L': { rotate: [step, 0, 0] },
          'foot.R': { rotate: [-step, 0, 0] },
        };
      },
    });

    // attack2: a jump strike. Crouch with the lance raised, spring up, turn the lance down 45
    // degrees in the air, land in a crouch with the tip driven into the ground, and stand.
    k.animation('attack2', {
      duration: 0.9,
      loop: false,
      dig: 0.55,
      pose: (_t, p) => {
        const c1 = ease(0, 0.24, p) * (1 - ease(0.26, 0.36, p));
        const air = ease(0.26, 0.42, p) * (1 - ease(0.56, 0.7, p));
        const c2 = ease(0.64, 0.74, p) * (1 - ease(0.78, 0.96, p));
        const strike = ease(0.42, 0.6, p) * (1 - ease(0.8, 0.98, p));
        const th = 60 * c1 + 26 * air + 50 * c2;
        const hipsY = -0.125 * (1 - Math.cos(th * rad)) + 0.2 * air;
        const lean = 22 * strike + 6 * c1;
        const wr = keys(
          p,
          [
            [0, WRIST_R],
            [0.22, [-0.3, 0.43, 0.08]],
            [0.36, [-0.3, 0.46, 0.09]],
            [0.5, [-0.295, 0.46, 0.1]],
            [0.6, [-0.28, 0.44, 0.11]],
            [0.8, [-0.28, 0.44, 0.11]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const mR = mul([-0.03, 0, 0], ease(0.05, 0.3, p) * (1 - ease(0.8, 1, p)));
        const dirW = keys(
          p,
          [
            [0, UP],
            [0.22, norm([-0.1, 0.95, 0.25])],
            [0.36, norm([-0.1, 0.97, 0.2])],
            [0.5, norm([0, 0.55, 0.83])],
            [0.6, norm([0.12, -0.7, 0.7])],
            [0.8, norm([0.12, -0.7, 0.7])],
            [1, UP],
          ] as const,
          'spline',
        );
        const dir = rotX(norm(dirW), -lean);
        const armR = reach(ARM_R, sub(wr, mR), POLE_REST_R);
        const wl = keys(p, [[0, WRIST_L], [0.36, [0.27, 0.4, 0.05]], [0.6, [0.28, 0.34, 0.0]], [0.8, [0.28, 0.34, 0.0]], [1, WRIST_L]] as const, 'spline');
        const armL = reach(ARM_L, wl, [0.6, 0.2, -0.2]);
        const leg = { rotate: [-th, 0, 0] as const };
        const shin = { rotate: [2 * th, 0, 0] as const };
        const foot = { rotate: [-th, 0, 0] as const };
        const flap = keys(p, [[0, 0], [0.3, 0.6], [0.5, -0.8], [0.66, 0.9], [0.8, -0.3], [1, 0]] as const, 'spline');
        return {
          hips: { move: [0, hipsY, 0.05 * air] },
          spine: { rotate: [lean * 0.6, 0, 0] },
          chest: { rotate: [lean * 0.4, 0, 0] },
          head: { rotate: [-lean * 0.7 + 6 * strike, 0, 0] },
          plume: { rotate: [12 * flap, 0, 0] },
          cloak: { rotate: [-10 * flap, 0, 0] },
          'upperarm.R': { rotate: armR.upper, move: mR },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR(armR, dir) },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'leg.L': leg,
          'leg.R': leg,
          'shin.L': shin,
          'shin.R': shin,
          'foot.L': foot,
          'foot.R': foot,
        };
      },
    });

    // hit: a blow from the front. The head and the chest snap back, the right foot steps back and
    // returns; the left arm jolts; the cape lags. The lance hand holds on.
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
          'upperarm.R': { rotate: [2 * h, 0, -2 * h] },
          'upperarm.L': { rotate: [10 * jolt, 0, 10 * jolt] },
          'forearm.L': { rotate: [22 * jolt, 0, 0] },
          'leg.L': { rotate: [-plant, 0, 0] },
          'leg.R': { rotate: [plant + 8 * lift, 0, 0] },
          'foot.L': { rotate: [plant, 0, 0] },
          'foot.R': { rotate: [-plant - 8 * lift, 0, 0] },
        };
      },
    });

    // death: the blow snaps him back, he staggers a step, then topples onto his back. The lance
    // stays in his right hand and lies beside him, along his body; the cape flattens under him.
    const D = {
      tilt: 86,
      drop: 0.045,
      back: 0.15,
      neck: 9,
      head: 12,
      cape: 8,
      capeFlat: 0.4,
      leg: 34,
      wristR: [-0.3, 0.33, -0.05] as V3,
      dirR: norm([-0.45, 1, -0.1]),
      wristL: [0.2, 0.3, -0.03] as V3,
    };
    k.animation('death', {
      duration: 1.4,
      loop: false,
      dig: 0.05,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.2, 0.4], [0.3, 0]] as const);
        const stag = keys(p, [[0.04, 0], [0.22, 1]] as const);
        const f = keys(p, [[0.26, 0], [0.68, 1]] as const);
        const g = f * f; // the fall starts slowly and ends fast
        const stand = 1 - g;
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.14)));
        const flat = keys(p, [[0.28, 0], [0.56, 1]] as const);
        const crumple = keys(p, [[0.3, 0], [0.48, 1], [0.7, 1], [0.9, 0]] as const);
        const lag = keys(p, [[0, 0], [0.1, 0.8], [0.3, -0.3], [0.5, 0.6], [0.7, -1], [0.82, -0.6], [1, -0.7]] as const, 'spline');

        const wristR = keys(p, [[0, WRIST_R], [0.1, [-0.29, 0.32, 0.11]], [0.36, [-0.3, 0.33, 0.12]], [0.55, [-0.31, 0.33, 0.1]], [0.74, D.wristR]] as const);
        const poleR = keys(p, [[0, POLE_REST_R], [0.2, [-0.6, 0.3, -0.1]], [0.74, [-0.6, 0.4, -0.35]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const dirR = norm(keys(p, [[0, UP], [0.1, norm([-0.2, 1, 0.1])], [0.4, norm([-0.3, 1, 0.08])], [0.58, norm([-0.45, 1, 0.05])], [0.74, D.dirR]] as const));

        const wristL = keys(p, [[0, WRIST_L], [0.1, [0.26, 0.3, 0.06]], [0.36, [0.27, 0.31, 0.03]], [0.76, D.wristL]] as const);
        const poleL = keys(p, [[0, POLE_REST_L], [0.2, [0.6, 0.3, -0.1]], [0.76, [0.5, 0.3, -0.3]]] as const);
        const armL = reach(ARM_L, wristL, poleL);

        const plant = Math.asin((0.03 * stag * stand) / LEG) / rad;
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
          'hand.R': { rotate: handR(armR, dirR) },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'leg.L': { rotate: [legL, 0, 6 * g] },
          'leg.R': { rotate: [plant + 10 * stag * stand + (D.leg + 2) * g * g, 0, -6 * g] },
          'foot.L': { rotate: [plant + sole * (1 - toes) + 16 * toes, 0, 0] },
          'foot.R': { rotate: [-plant - 10 * stag * stand + sole * (1 - toes) + 16 * toes, 0, 0] },
        };
      },
    });

    // victory: the lance goes up and out to the right, the left fist rises at his side, the chest
    // opens, then a proud nod; the lance pumps once. The cape and the tail of the crest sway.
    const WIN = { wrist: [-0.3, 0.44, 0.13] as V3, dir: norm([-0.12, 1, 0.04]), wristL: [0.28, 0.45, 0.07] as V3 };
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const r = ease(0, 0.3, p);
        const arm = ease(0.04, 0.32, p);
        const nod = keys(p, [[0.42, 0], [0.54, 1], [0.68, -0.4], [0.8, 0]] as const);
        const pride = ease(0.6, 0.8, p);
        const look = r * (1 - ease(0.42, 0.6, p));
        const pump = keys(p, [[0.36, 0], [0.5, 1], [0.66, 0]] as const);
        const lag = keys(p, [[0, 0], [0.14, -0.6], [0.3, 0.7], [0.42, -0.3], [0.56, -0.8], [0.7, 0.9], [0.84, -0.35], [1, 0.1]] as const, 'spline');
        const sway = keys(p, [[0, 0], [0.18, -0.5], [0.34, 0.6], [0.5, -0.3], [0.66, 0.45], [0.82, -0.15], [1, 0.05]] as const, 'spline');
        const wr = add(lerp(WRIST_R, WIN.wrist, arm), [0, 0.025 * pump, 0]);
        const mvR = [-0.015 * arm, 0.012 * r, 0] as const;
        const armR = reach(ARM_R, sub(wr, mvR), POLE_REST_R);
        const dir = mixDir(UP, WIN.dir, arm);
        const armL = reach(ARM_L, lerp(WRIST_L, WIN.wristL, ease(0.08, 0.34, p)), [0.6, 0.3, -0.2]);
        const stance = 4 * r;
        return {
          hips: { move: [0, -legDrop(LEG, stance), 0] },
          spine: { rotate: [-4 * r, 0, -3 * r] },
          chest: { rotate: [-2 * r, 0, -6 * r] },
          neck: { rotate: [3 * nod, 0, 0] },
          head: { rotate: [-6 * look + 10 * nod - 5 * pride, -8 * look, 0] },
          plume: { rotate: [12 * lag, 0, 6 * sway] },
          cloak: { rotate: [8 * sway, 0, 4 * lag] },
          'upperarm.R': { rotate: armR.upper, move: mvR },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR(armR, dir) },
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
