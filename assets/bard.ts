import { addPart, defineAsset, mapTint, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Bard — Chibi Quest hero (catalog `heroes/support/bard`), about 1.0 m tall (the plume a little
 * more), faces +Z. Built on the rogue: the same face, skeleton, knee bones, and clip set.
 * Target: docs/hero-mockups/bard_001.jpg (one front view). The mockup's beard and adult face are
 * left out on purpose: the hero keeps the young, round, beardless face of the set.
 *
 * One idea: a cheerful musician behind a big wooden lute, under a wide teal cap with a red plume.
 * The cap and plume are the silhouette; the lute crosses the body on a diagonal (the body low on
 * the right hip, the neck up to the left hand).
 * Palette: teal cap and doublet #3d8479 / #4a948a; red plume #c4403c; gold trim #d8a93c; brown
 *   curls #5a301d; dark brown cape #5a3a26; maroon-brown trousers #5a2e25; lute wood #7b4a2a.
 * Rig: the rogue's chibi skeleton; the arms rest bent, holding the lute. The lute is rigid on a
 *   `lute` bone (child of the left hand, at the grip on the neck); a music note hides inside the
 *   lute body on a `note` bone and flies out on the strum. Clips idle, walk, run, attack (a strum
 *   with a bounce that sends a note), attack2 (a one-handed lute swing), hit, death (the lute drops
 *   beside her), victory (a strum and hop, a note, and a flourish).
 */

import { bardHat } from './parts/bard-hat.js';
import { bardLute } from './parts/bard-lute.js';

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#6e4020',
  irisLow: '#a8702f',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#4a2a1a',
  mouth: '#a4503f',
  hair: '#5a301d',
  doublet: '#3d8479',
  cap: '#4a948a',
  puff: '#43897f',
  clothDark: '#2c655d',
  feather: '#c4403c',
  featherDark: '#8e2a2c',
  gold: '#d8a93c',
  cape: '#5a3a26',
  capeLining: '#8a6038',
  leather: '#6b3a22',
  leatherDark: '#452616',
  pants: '#5a2e25',
  boot: '#4a2c1c',
  sole: '#2e1c12',
  wood: '#6e3f22',
  woodRib: '#4e2b17',
  soundboard: '#96623a',
  fingerboard: '#3b2417',
  hole: '#2a170e',
  string: '#efe4c8',
  note: '#f2c14e',
};

type V3 = readonly [number, number, number];
type Chain = { root: V3; mid: V3; end: V3 };
const rad = Math.PI / 180;
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const lerp = (a: V3, b: V3, t: number): V3 => add(a, sub(b, a), t);
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** A pole point in the arm's rest bend plane, on the elbow's side: IK to the rest wrist gives no turn. */
const restPole = (c: Chain): V3 => add(c.mid, sub(c.mid, lerp(c.root, c.end, 0.5)), 4);

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// The lute: built in its own frame (origin at the body center, +X along the neck, +Z out of the
// soundboard), then tilted up to the left hand and set in front of the belly.
const LUTE_AT: V3 = [-0.03, 0.265, 0.176];
const LUTE_SCALE = 1.2;
const LUTE_TILT = 21;
const LC = Math.cos(LUTE_TILT * rad);
const LS = Math.sin(LUTE_TILT * rad);
const luteWorld = (q: V3): V3 => {
  const p: V3 = [q[0] * LUTE_SCALE, q[1] * LUTE_SCALE, q[2] * LUTE_SCALE];
  return [LUTE_AT[0] + p[0] * LC - p[1] * LS, LUTE_AT[1] + p[0] * LS + p[1] * LC, LUTE_AT[2] + p[2]];
};
const lutePose = (s: sdf.Shape) => s.scale(LUTE_SCALE).rotateZ(LUTE_TILT).at(...LUTE_AT);
/** The lute part is already at the worn scale; the host tilts and sets it. */
const hostLutePose = (s: sdf.Shape) => s.rotateZ(LUTE_TILT).at(...LUTE_AT);
const LUTE_AXIS: V3 = [LC, LS, 0];
const ACROSS: V3 = [-LS, LC, 0]; // across the strings, toward the upper edge

// Arms in the rest pose: bent, the left fist around the neck, the right hand on the strings.
const LGRIP = luteWorld([0.24, 0, 0.006]);
const RHAND = luteWorld([-0.03, 0.022, 0.036]);
const NOTE_AT = luteWorld([-0.005, 0.004, -0.014]);
const CHAIN_L: Chain = { root: [0.13, 0.385, 0], mid: [0.205, 0.3, 0.05], end: add(LGRIP, [-0.008, -0.02, -0.033]) };
const CHAIN_R: Chain = { root: [-0.13, 0.385, 0], mid: [-0.185, 0.3, 0.08], end: add(RHAND, [-0.035, 0.008, -0.035]) };

export default defineAsset({
  name: 'bard',
  description: 'Chibi bard hero with a teal feathered cap, a teal doublet with puffed sleeves, a short brown cape, and a wooden lute.',
  detail: 0.005,
  reference: 'docs/hero-mockups/bard_001.jpg',
  // Color slots for individual bards (the first option is the default look).
  variants: {
    eyes: { brown: C.iris, green: '#4d7a3c', blue: '#3f6f96' },
    hair: { brown: C.hair, black: '#231a17', auburn: '#8e3b1c' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { teal: C.doublet, plum: '#74405f', mustard: '#a3842f' },
  },
  presets: {
    troubadour: { eyes: 'green', hair: 'auburn', skin: 'fair', clothing: 'plum' },
    minstrel: { eyes: 'blue', hair: 'black', skin: 'tan', clothing: 'mustard' },
    wanderer: { eyes: 'brown', hair: 'black', skin: 'brown', clothing: 'teal' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cloth: k.tint('clothing'),
      cap: k.tint('clothing', { color: C.cap, follow: 1 }),
      puff: k.tint('clothing', { color: C.puff, follow: 1 }),
      clothDark: k.tint('clothing', { color: C.clothDark, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    const HIP = [0.068, 0.195, 0] as const;
    const ANKLE = [0.098, 0.07, 0] as const;
    const KNEE = [0.083, 0.1325, 0] as const; // the knee: splits the leg (shin.L takes the weight below it)
    const mx = (p: V3) => [-p[0], p[1], p[2]] as const;
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      cloak: { parent: 'chest', at: [0, 0.43, -0.12] },
      'upperarm.L': { parent: 'chest', at: CHAIN_L.root },
      'forearm.L': { parent: 'upperarm.L', at: CHAIN_L.mid },
      'hand.L': { parent: 'forearm.L', at: CHAIN_L.end },
      'upperarm.R': { parent: 'chest', at: CHAIN_R.root },
      'forearm.R': { parent: 'upperarm.R', at: CHAIN_R.mid },
      'hand.R': { parent: 'forearm.R', at: CHAIN_R.end },
      lute: { parent: 'hand.L', at: LGRIP },
      note: { parent: 'lute', at: NOTE_AT },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and face (the rogue's)
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
        .ellipsoid([0.026, 0.044, 0.032])
        .subtract(sdf.sphere(0.017).at(0.016, 0, 0.006))
        .rotateY(-12)
        .at(0.2, 0.61, -0.01)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    // Arms: bent, from the rest chains; hands shaped for the lute.
    const armShape = (c: Chain, tag: 'L' | 'R', hand: sdf.Shape) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone(c.root, c.mid, 0.04, 0.036).bone(`upperarm.${tag}`),
        sdf.cone(c.mid, c.end, 0.036, 0.031).bone(`forearm.${tag}`),
        hand.bone(`hand.${tag}`),
      );
    // The left fist closes around the neck: the fingers curl over its front, the thumb behind.
    const fistL = sdf.smoothUnion(
      0.014,
      sdf.ellipsoid([0.036, 0.038, 0.036]).at(...add(LGRIP, [0.003, -0.005, -0.008])),
      sdf.capsule(add(add(LGRIP, LUTE_AXIS, -0.02), [0, -0.004, 0.024]), add(add(LGRIP, LUTE_AXIS, 0.016), [0, -0.004, 0.024]), 0.015),
      sdf.cone(add(LGRIP, [-0.012, 0.024, -0.014]), add(LGRIP, [-0.026, 0.028, 0.008]), 0.014, 0.011),
    );
    // The right hand lies on the strings, the fingers down across them.
    const handR = sdf.smoothUnion(
      0.014,
      sdf.ellipsoid([0.034, 0.038, 0.03]).at(...RHAND),
      sdf.capsule(add(RHAND, [0.006, -0.02, 0.012]), add(RHAND, [0.018, -0.04, 0.004]), 0.014),
      sdf.cone(add(RHAND, [-0.02, 0.004, 0.016]), add(RHAND, [-0.03, -0.02, 0.02]), 0.013, 0.011),
    );
    const arms = sdf.union(armShape(CHAIN_L, 'L', fistL), armShape(CHAIN_R, 'R', handR));

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.055, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.041, 0.048, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.035, 0.042, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.027, 0.03, 0.07]), EYE[0], EYE[1] + 0.004));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.011, 18, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const lash = pair(
      sdf
        .extrude(
          profile.polygon([
            [0, 0],
            [0.022, 0.016],
            [0.026, 0.01],
            [0.004, -0.008],
          ]),
          0.3,
        )
        .at(EYE[0] + 0.043, EYE[1] + 0.012, 0.1),
    );
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.022, 58, 122), 0.3).at(0.1, 0.722 - 0.1, 0.1));
    // A wider, happier smile than the rogue's sly one.
    const smile = sdf.extrude(profile.arc(0.07, 0.012, 236, 304), 0.3).at(0, 0.53 + 0.07, 0.1);
    const blush = pair(at(sdf.sphere(0.032), 0.135, 0.56));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(arms)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(lash, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(smile, T.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ cap with the plume
    // Built at its own origin (the brim plane), then tipped back and a little to her left.
    const hatPose = (s: sdf.Shape) => s.rotateX(-15).rotateZ(4).at(0, 0.815, -0.01);
    const hatPart = bardHat(mapTint(k));
    addPart(k, hatPart, { pose: hatPose });

    // ------------------------------------------------------------------ curly hair under the cap
    const faceMask = sdf.ellipsoid([0.23, 0.16, 0.22]).at(0, 0.6, 0.15);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.014, HEAD[1] + 0.016, HEAD[2] + 0.014])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.015, faceMask);
    const curl = (x: number, y: number, z: number, r: number) => sdf.sphere(r).at(x, y, z);
    const curls = sdf.smoothUnion(
      0.012,
      curl(0, 0.8, 0.162, 0.04),
      pair(curl(0.075, 0.795, 0.152, 0.04)),
      pair(curl(0.14, 0.772, 0.118, 0.04)),
      pair(curl(0.19, 0.735, 0.06, 0.042)),
      pair(curl(0.205, 0.69, -0.005, 0.04)),
      pair(curl(0.195, 0.7, -0.07, 0.045)),
      pair(curl(0.16, 0.68, -0.135, 0.046)),
      pair(curl(0.09, 0.655, -0.18, 0.048)),
      curl(0, 0.65, -0.195, 0.05),
      pair(curl(0.12, 0.745, -0.17, 0.05)),
      curl(0, 0.745, -0.205, 0.05),
    );
    const hair = sdf
      .smoothUnion(0.02, cap, curls)
      .displace(0.006, (x, y, z) => noise.fbm(x * 32, y * 32, z * 32, 2))
      .intersect(hatPose(sdf.halfSpace([0, 1, 0], -0.004)));
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ doublet and puffed sleeves
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
            [0.132, 0.25],
            [0.142, 0.2],
            [0.148, 0.174],
            [0.138, 0.162],
            [0, 0.162],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    // A darker placket down the front, where the buttons sit.
    const placket = sdf.box([0.03, 0.3, 0.3]).at(0, 0.33, 0.15);
    k.body('doublet', torso.paintWhere(placket, T.clothDark, 0.004).bone('spine'), { color: T.cloth, roughness: 0.8 });
    const puffShape = (c: Chain, tag: 'L' | 'R') => {
      const side = Math.sign(c.root[0]);
      const center = add(lerp(c.root, c.mid, 0.35), [0.014 * side, 0.006, 0]);
      const slashes = (x: number, y: number, z: number) => Math.sin(Math.atan2(z - center[2], x - center[0]) * 8);
      return sdf
        .smoothUnion(0.02, sdf.ellipsoid([0.066, 0.066, 0.064]).at(...center), sdf.cone(c.root, lerp(c.root, c.mid, 0.92), 0.05, 0.043))
        .displace(0.004, slashes)
        .paintFn((x, y, z, base) => (slashes(x, y, z) < -0.6 ? rgb(C.clothDark) : base))
        .bone(`upperarm.${tag}`);
    };
    k.body('sleeves', sdf.union(puffShape(CHAIN_L, 'L'), puffShape(CHAIN_R, 'R')), { color: T.puff, roughness: 0.85 });

    // ------------------------------------------------------------------ short cape (behind)
    const folds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(z, x) * 6) * Math.min(1, Math.max(0, (0.38 - y) / 0.26));
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
    const capeInner = capeCone(0.128, 0.278, 0.47, 0.1).at(0, 0, -0.03);
    const capeShell = capeCone(0.15, 0.3, 0.45, 0.12)
      .at(0, 0, -0.03)
      .subtract(capeInner)
      .intersect(sdf.halfSpace([0, 0, 1], -0.03));
    const cape = capeShell.paintWhere(capeInner.round(0.006), C.capeLining, 0.008);
    k.body('cape', cape.bone('cloak'), { color: C.cape, roughness: 0.85 });

    // ------------------------------------------------------------------ leather: belt and pouch
    const beltY = 0.252;
    const belt = torso.round(0.01).smoothIntersect(0.006, sdf.box([0.5, 0.05, 0.5], 0.006).at(0, beltY, 0));
    const pouch = sdf
      .box([0.06, 0.07, 0.035], 0.012)
      .paintWhere(sdf.box([0.1, 0.03, 0.1]).at(0, 0.024, 0), C.leatherDark)
      .rotateY(40)
      .at(0.14, 0.215, 0.05);
    k.body('leather', sdf.union(belt, pouch).bone('spine'), { color: C.leather, roughness: 0.6 });

    // ------------------------------------------------------------------ gold: collar, buttons, hem trim, buckle, cuffs
    const collar = sdf.union(
      sdf.torus(0.07, 0.013).scale([1, 1, 0.9]).at(0, 0.458, -0.004),
      pair(sdf.sphere(0.022).at(0.062, 0.45, 0.052)),
      sdf.sphere(0.017).at(0, 0.44, 0.074),
    );
    const torsoZ = (y: number) => sdf.raycast(torso, [0, y, 1], [0, 0, -1])![2];
    const buttons = sdf.union(...[0.405, 0.37, 0.335, 0.3].map((y) => sdf.sphere(0.012).at(0, y, torsoZ(y) + 0.002)));
    const hemTrim = torso.round(0.006).smoothIntersect(0.004, sdf.box([0.5, 0.022, 0.5]).at(0, 0.173, 0));
    const beltZ = sdf.raycast(belt, [0.05, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .box([0.04, 0.04, 0.01], 0.005)
      .subtract(sdf.box([0.022, 0.022, 0.03], 0.002))
      .at(0.05, beltY, beltZ + 0.004);
    const cuff = (c: Chain, tag: 'L' | 'R') => sdf.cone(lerp(c.mid, c.end, 0.55), lerp(c.mid, c.end, 1), 0.04, 0.043).bone(`forearm.${tag}`);
    k.body(
      'gold',
      sdf.union(collar.bone('chest'), buttons.bone('chest'), hemTrim.bone('spine'), buckle.bone('spine'), cuff(CHAIN_L, 'L'), cuff(CHAIN_R, 'R')),
      { color: C.gold, roughness: 0.32, metalness: 0.9 },
    );

    // ------------------------------------------------------------------ legs and boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.115, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.11, 0.004], 0.05).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85 });
    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.05, 0.09, 0.02).at(0, 0.07, 0),
        sdf.ellipsoid([0.058, 0.055, 0.1]).at(0, 0.052, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootCuff = sdf.cylinder(0.057, 0.032, 0.013).at(0, 0.1, 0);
    const boot = sdf
      .union(bootFoot, sole.paint(C.sole), bootCuff)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the lute (rigid on `lute`)
    addPart(k, bardLute(), { pose: hostLutePose });
    // The note hides inside the lute body until a strum sends it out (bone `note`, scaled up in flight).
    const noteShape = sdf
      .union(
        sdf.ellipsoid([0.015, 0.011, 0.006]).rotateZ(25).at(-0.013, -0.018, 0),
        sdf.capsule([-0.0005, -0.016, 0], [-0.0005, 0.03, 0], 0.0042),
        sdf.chain(
          [
            [-0.0005, 0.03, 0, 0.0045],
            [0.012, 0.018, 0, 0.004],
            [0.016, 0.005, 0, 0.0035],
          ],
          0.005,
        ),
      )
      .at(-0.005, 0.004, -0.014);
    k.body('noteMark', lutePose(noteShape), {
      color: C.note,
      roughness: 0.4,
      emissive: C.note,
      emissiveIntensity: 0.6,
      detail: 0.0025,
      bone: 'note',
    });

    // ------------------------------------------------------------------ animation helpers
    const { wave, bump, legDrop, keys, reach, orient, follow, quat, euler } = motion;
    const LEG = 0.19;
    const LEG_PART = 0.127; // hip to ankle through the knee
    type BonePoses = Record<string, { rotate?: V3; move?: V3; scale?: V3 }>;
    /** Bent knees that lower the hips by `drop` with the feet flat on the ground. */
    const knees = (drop: number): BonePoses => {
      const a = Math.acos(Math.max(-1, Math.min(1, 1 - drop / LEG_PART))) / rad;
      const out: BonePoses = {};
      for (const s of ['L', 'R']) {
        out[`leg.${s}`] = { rotate: [-a, 0, 0] };
        out[`shin.${s}`] = { rotate: [2 * a, 0, 0] };
        out[`foot.${s}`] = { rotate: [-a, 0, 0] };
      }
      return out;
    };
    /** A world offset turned into the frame at the end of a chain of posed bones. */
    const toLocal = (rots: readonly V3[], w: V3): V3 => {
      const q = rots.reduce((a, r) => a.multiply(quat(r)), new THREE.Quaternion()).invert();
      const v = new THREE.Vector3(...w).applyQuaternion(q);
      return [v.x, v.y, v.z];
    };
    const POLE_L = restPole(CHAIN_L);
    const POLE_R = restPole(CHAIN_R);
    const armIK = (tag: 'L' | 'R', wrist: V3, pole: V3): { upper: V3; lower: V3 } =>
      reach(tag === 'L' ? CHAIN_L : CHAIN_R, wrist, pole);
    // The right wrist above and below the strings, for a strum.
    const STRUM_UP = add(add(CHAIN_R.end, ACROSS, 0.035), [0, 0, 0.03]);
    const STRUM_DOWN = add(add(CHAIN_R.end, ACROSS, -0.055), [0, 0, 0.012]);

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p, 2), 0] }, // a small bob to the beat
        chest: { rotate: [2 * wave(p), 3 * wave(p, 1, 0.1), 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [3 * wave(p, 2, 0.1), 6 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        'forearm.R': { rotate: [0, 0, 3 * wave(p, 4)] }, // light picking
        'hand.R': { rotate: [4 * wave(p, 4, 0.1), 0, 0] },
      }),
    });

    // The legs come from motion.gait (as the rogue's); the arms hold the lute and only bob.
    const stride = (duration: number, step: number, lift: number, duty: number, lean: number, hop: number, flow: number, bob: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 5 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [ANKLE[0], 0, -0.045],
          toe: [ANKLE[0], 0, 0.11],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        const b = bob * wave(p, 2, 0.1);
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [b, 0, 0] as const },
          'upperarm.R': { rotate: [b, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 3, 0.006, 6, 2));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 10, 0.03, 22, 4));

    // ------------------------------------------------------------------ attack: a strum that sends a note
    // She dips and lifts the right hand, rakes it down across the strings, and bounces up on her
    // toes; the lute kicks up a little on the stroke. The note leaves the lute on the stroke,
    // grows, and floats forward and up, away from her face, then fades (shrinks) away.
    k.animation('attack', {
      duration: 0.75,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, CHAIN_R.end],
            [0.2, STRUM_UP],
            [0.3, STRUM_DOWN],
            [0.36, add(STRUM_DOWN, [0.01, -0.012, 0.02])],
            [0.62, add(CHAIN_R.end, ACROSS, 0.01)],
            [1, CHAIN_R.end],
          ] as [number, V3][],
          'spline',
        );
        const r = armIK('R', wrist, POLE_R);
        const flick = keys(p, [[0, 0], [0.2, -1], [0.3, 1], [0.45, 0.6], [0.75, 0]] as const);
        const kick = keys(p, [[0.22, 0], [0.32, 1], [0.55, 0]] as const);
        const dip = keys(p, [[0, 0], [0.2, 1], [0.3, 0.2], [0.34, 0], [0.56, 0], [0.64, 0.7], [0.8, 0], [1, 0]] as const);
        const hop = 0.028 * keys(p, [[0.3, 0], [0.44, 1], [0.58, 0]] as const);
        const lean = keys(p, [[0, 0], [0.2, -4], [0.32, 5], [0.5, -2], [1, 0]] as const);
        const upperL: V3 = [-6 * kick, 0, 2 * kick];
        const noteOut = keys(
          p,
          [
            [0.28, [0, 0, 0]],
            [0.45, [0.03, 0.16, 0.22]],
            [0.7, [0.08, 0.34, 0.32]],
            [0.9, [0.1, 0.4, 0.34]],
          ] as [number, V3][],
        );
        const grow = keys(p, [[0.28, 1], [0.36, 2.2], [0.7, 3], [0.9, 0.001], [1, 0.001]] as const);
        const spineR: V3 = [lean, 0, 0];
        const chestR: V3 = [lean * 0.5, 0, 0];
        return {
          hips: { move: [0, hop - 0.02 * dip, 0] },
          ...knees(0.02 * dip),
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          head: { rotate: [-lean - 6 * kick, 0, 5 * kick] },
          cloak: { rotate: [4 * dip + 6 * hop / 0.028, 0, 0] },
          'upperarm.R': { rotate: r.upper },
          'forearm.R': { rotate: r.lower },
          'hand.R': { rotate: [18 * flick, 0, -8 * flick] },
          'upperarm.L': { rotate: upperL },
          note: { move: toLocal([[0, 0, 0], spineR, chestR, upperL], noteOut), scale: [grow, grow, grow] },
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a lute swing
    // The right hand lets go and drops back to her side. The left hand takes the lute out to the
    // left, the body of the lute trailing; the torso unwinds and the left arm sweeps the lute flat
    // across the front at chest height, the body leading like a club, and follows through to the
    // right. Then the lute comes back into both hands. The swing stays below the chin.
    const luteRest = { dir: norm(sub(LUTE_AT, LGRIP)), up: [0, 0, 1] as V3 };
    k.animation('attack2', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        const wristL = keys(
          p,
          [
            [0, CHAIN_L.end],
            [0.1, [0.24, 0.37, 0.16]], // the lute swings up and out in front first
            [0.22, [0.34, 0.36, -0.02]], // out to the left, the arm long
            [0.32, [0.3, 0.36, 0.14]],
            [0.38, [0.16, 0.36, 0.22]],
            [0.46, [0.02, 0.35, 0.22]],
            [0.62, [0.08, 0.33, 0.2]],
            [1, CHAIN_L.end],
          ] as [number, V3][],
          'spline',
        );
        const poleL = keys(
          p,
          [
            [0, POLE_L],
            [0.22, [0.45, 0.2, -0.25]],
            [0.38, [0.4, 0.05, 0.1]],
            [0.46, [0.2, 0, 0.2]],
            [0.62, [0.3, 0, 0.1]],
            [1, POLE_L],
          ] as [number, V3][],
        );
        const dir = norm(
          keys(
            p,
            [
              [0, luteRest.dir],
              [0.1, norm([0.1, 0.3, 1])],
              [0.22, norm([1, 0.15, -0.25])],
              [0.32, norm([0.8, 0.05, 0.6])],
              [0.38, norm([0.1, 0, 1])],
              [0.46, norm([-0.9, -0.05, 0.5])],
              [0.62, norm([-0.95, -0.3, 0.15])],
              [1, luteRest.dir],
            ] as [number, V3][],
            'spline',
          ),
        );
        const up = norm(keys(p, [[0, [0, 0, 1]], [0.1, [0, 1, -0.2]], [0.2, [0, 1, 0]], [0.55, [0, 1, 0]], [0.8, [0, 0, 1]], [1, [0, 0, 1]]] as [number, V3][]));
        const l = armIK('L', wristL, poleL);
        const handL = orient([l.upper, l.lower], luteRest, { dir, up });
        const wristR = keys(p, [[0, CHAIN_R.end], [0.14, [-0.21, 0.27, -0.02]], [0.64, [-0.21, 0.27, -0.02]], [0.86, CHAIN_R.end]] as [number, V3][]);
        const poleR = keys(p, [[0, POLE_R], [0.14, [-0.5, 0.2, -0.2]], [0.64, [-0.5, 0.2, -0.2]], [0.86, POLE_R]] as [number, V3][]);
        const r = armIK('R', wristR, poleR);
        // +Y turns the front toward her left: wind left, unwind right.
        const chestY = keys(p, [[0, 0], [0.22, 20], [0.3, 14], [0.44, -24], [0.56, -22], [1, 0]] as const);
        const hipsY = 0.5 * chestY;
        const lean = keys(p, [[0, 0], [0.22, -3], [0.42, 8], [0.6, 6], [1, 0]] as const);
        const crouch = keys(p, [[0, 0], [0.22, 0.5], [0.44, 1], [0.62, 1], [1, 0]] as const);
        return {
          hips: { move: [0, -0.018 * crouch, 0.01 * crouch], rotate: [0, hipsY, 0] },
          ...knees(0.018 * crouch),
          spine: { rotate: [lean, 0, 0] },
          chest: { rotate: [lean / 3, chestY - hipsY, 0] },
          head: { rotate: [-0.6 * lean, -0.8 * chestY, 0] },
          cloak: { rotate: [4 + 10 * crouch, -0.3 * chestY, 0] },
          'upperarm.L': { rotate: l.upper },
          'forearm.L': { rotate: l.lower },
          'hand.L': { rotate: handL },
          'upperarm.R': { rotate: r.upper },
          'forearm.R': { rotate: r.lower },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
        const whip = keys(p, [[0, 0], [0.2, 1], [0.4, 0.5], [0.6, -0.2], [0.82, 0]] as const, 'spline');
        const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
        const lift = bump(clamp01((p - 0.04) / 0.2)) + bump(clamp01((p - 0.58) / 0.32));
        const lag = keys(p, [[0, 0], [0.12, 0.3], [0.28, 1], [0.5, -0.45], [0.74, 0.15], [1, 0]] as const, 'spline');
        const back = 0.03 * step;
        const lean = Math.asin(back / LEG) / rad;
        return {
          hips: { move: [0, -legDrop(LEG, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-4 * whip, 0, 0] },
          head: { rotate: [-10 * whip, -6 * whip, 4 * whip] },
          cloak: { rotate: [12 * lag, 0, 4 * lag] },
          'upperarm.L': { rotate: [-8 * h, 0, 6 * h] },
          'forearm.L': { rotate: [-6 * h, 0, 0] },
          'upperarm.R': { rotate: [-8 * h, 0, -6 * h] },
          'forearm.R': { rotate: [-6 * h, 0, 0] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'leg.R': { rotate: [lean + 8 * lift, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'foot.R': { rotate: [-lean - 8 * lift, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    // The rogue's fall. The arms fly out and fall to the ground at her sides; the lute leaves the
    // left hand and lies face up on the floor beside it, the neck pointing up past her shoulder.
    const LIE = 78;
    const LIE_Y = 0.178;
    const HEEL = 0.05;
    const FIST_Y = 0.03;
    const BEND_NECK = 10;
    const BEND_HEAD = 12;
    const TURN = 22;
    const HIPS0: V3 = [0, 0.2, 0];
    const TRUNK: readonly V3[] = [HIPS0, [0, 0.26, 0], [0, 0.33, 0]];
    const turnX = (v: V3, deg: number): V3 => {
      const c = Math.cos(deg * rad);
      const s = Math.sin(deg * rad);
      return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
    };
    const END: V3 = [0, LIE_Y - 0.2, -HEEL - 0.2 * Math.sin(LIE * rad) + HEEL * Math.cos(LIE * rad)];
    const toWorld = (v: V3): V3 => add(add(HIPS0, END), turnX(sub(v, HIPS0), -LIE));
    const toBody = (w: V3): V3 => add(HIPS0, turnX(sub(w, add(HIPS0, END)), LIE));
    const LEG_DOWN = Math.asin(clamp01((LIE_Y - 0.035) / 0.165)) / rad - (90 - LIE);
    type Weights = { hitB: number; sag: number; fly: number; land: number; loose: number };
    const deathArm = (side: 1 | -1) => {
      const f = (v: V3): V3 => [v[0] * side, v[1], v[2]];
      const tag = side === 1 ? 'L' : 'R';
      const c = side === 1 ? CHAIN_L : CHAIN_R;
      const chain: Chain = { root: c.root, mid: c.mid, end: side === 1 ? LGRIP : RHAND }; // the hand stays straight
      const joints: readonly V3[] = [...TRUNK, c.root, c.mid, c.end];
      const pole0 = restPole(chain);
      const shoulderW = toWorld(chain.root);
      const span = Math.sqrt(Math.max(0, 0.22 ** 2 - (shoulderW[1] - FIST_Y) ** 2));
      const out = norm([0.93 * side, 0, 0.37]);
      const fistW: V3 = [shoulderW[0] + out[0] * span, FIST_Y, shoulderW[2] + out[2] * span];
      const fistEnd = toBody(fistW);
      const luteAt: V3 = [fistW[0] + 0.1, 0.024, fistW[2] + 0.02]; // face down: the ribbed bowl up
      const dropKeys: [number, V3][] = [
        [0.44, add(luteAt, [0, 0.12, 0])],
        [0.6, luteAt],
        [0.65, add(luteAt, [0, 0.015, 0])],
        [0.7, luteAt],
      ];
      const dropTurn = quat(orient([], { dir: LUTE_AXIS, up: [0, 0, 1] }, { dir: norm([0.25, 0, -1]), up: [0, -1, 0] }));
      return (p: number, trunk: readonly V3[], move: V3, w: Weights): BonePoses => {
        const stand = add(add(add(chain.end, f([0.04, 0.04, 0.05]), w.hitB), [0, -0.03, 0.02], w.sag), f([0.08, 0.06, 0.02]), w.fly);
        const arm = reach(chain, lerp(stand, fistEnd, w.land), lerp(pole0, f([0.6, 0.45, 0.1]), w.land));
        const bones: BonePoses = {
          [`upperarm.${tag}`]: { rotate: arm.upper },
          [`forearm.${tag}`]: { rotate: arm.lower },
        };
        if (side === -1) return bones;
        const rots: V3[] = [...trunk, arm.upper, arm.lower];
        const handQ = rots.reduce((q, r) => q.multiply(quat(r)), new THREE.Quaternion());
        const inv = handQ.clone().invert();
        const held = add(follow(joints, [...rots, [0, 0, 0]], chain.end), move);
        const d = new THREE.Vector3(...sub(lerp(held, keys(p, dropKeys), w.loose), held)).applyQuaternion(inv);
        bones.lute = { move: [d.x, d.y, d.z], rotate: euler(inv.clone().multiply(handQ.clone().slerp(dropTurn, w.loose))) };
        return bones;
      };
    };
    const deathL = deathArm(1);
    const deathR = deathArm(-1);
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = clamp01((p - 0.36) / 0.24);
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 4 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const loose = keys(p, [[0.44, 0], [0.6, 1]] as const);
        const settle = keys(p, [[0.56, 0], [0.8, 1]] as const);
        const flat = keys(p, [[0.4, 0], [0.62, 1]] as const);
        const crumple = keys(p, [[0.42, 0], [0.56, 1], [0.72, 1], [0.9, 0]] as const);
        const back = 0.022 * hitB;
        const lean = Math.asin(back / LEG) / rad;
        const a = tilt * rad;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(LEG, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        const legs = LEG_DOWN * clamp01((tilt - LIE + 18) / 18);
        const w = { hitB, sag, fly, land, loose };
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag + BEND_NECK * land, 0, 0] },
          head: { rotate: [-14 * hitB + 8 * sag + BEND_HEAD * land, -8 * hitB + TURN * settle, 8 * wob] },
          cloak: {
            rotate: [10 * hitB - 8 * flat - 12 * crumple, 0, 5 * wob],
            scale: [1 + 0.12 * flat, 1 - 0.15 * crumple, 1 - 0.6 * flat],
          },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean + 10 * settle, 18 * settle, 0] },
          'foot.R': { rotate: [lean + 10 * settle, -18 * settle, 0] },
          ...deathL(p, [hipsR, spineR, chestR], hipsMove, w),
          ...deathR(p, [hipsR, spineR, chestR], hipsMove, w),
        };
      },
    });

    // ------------------------------------------------------------------ victory: strum, hop, and a flourish
    // A crouch and a big strum; she hops as a large note flies up and out to her right; she lands,
    // sweeps the right hand up and out in a flourish, lifts the lute neck, and sings with her head
    // tipped back. She holds the pose (the note hangs in the air) to the end.
    k.animation('victory', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const crouch = keys(p, [[0, 0], [0.14, 1], [0.24, 0.2], [0.42, 0], [0.5, 0.8], [0.62, 0], [1, 0]] as const);
        const air = keys(p, [[0.22, 0], [0.33, 1], [0.44, 0]] as const);
        const c = keys(p, [[0.46, 0], [0.7, 1]] as const);
        const wrist = keys(
          p,
          [
            [0, CHAIN_R.end],
            [0.14, STRUM_UP],
            [0.24, STRUM_DOWN],
            [0.46, add(STRUM_DOWN, [0, -0.01, 0.02])],
            [0.7, [-0.33, 0.43, 0.08]],
            [1, [-0.33, 0.43, 0.08]],
          ] as [number, V3][],
          'spline',
        );
        const poleR = keys(p, [[0, POLE_R], [0.46, POLE_R], [0.7, [-0.3, 0.1, -0.15]], [1, [-0.3, 0.1, -0.15]]] as [number, V3][]);
        const r = armIK('R', wrist, poleR);
        const lean = -4 * c;
        const upperL: V3 = [-8 * c, 0, 5 * c];
        const spineR: V3 = [lean, 0, 0];
        const chestR: V3 = [lean, 6 * c, 0];
        const noteOut = keys(
          p,
          [
            [0.24, [0, 0, 0]],
            [0.45, [-0.06, 0.22, 0.2]],
            [0.8, [-0.16, 0.48, 0.3]],
          ] as [number, V3][],
        );
        const grow = keys(p, [[0.24, 1], [0.32, 2], [0.8, 2.8]] as const);
        return {
          hips: { move: [0, 0.055 * air - 0.028 * crouch, 0] },
          ...knees(0.028 * crouch),
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-4 * c, 0, 0] },
          head: { rotate: [-10 * c, -8 * c, 7 * c] },
          cloak: { rotate: [8 * air + 3 * c, 0, 0] },
          'upperarm.R': { rotate: r.upper },
          'forearm.R': { rotate: r.lower },
          'hand.R': { rotate: [0, 0, -25 * c] },
          'upperarm.L': { rotate: upperL },
          note: { move: toLocal([[0, 0, 0], spineR, chestR, upperL], noteOut), scale: [grow, grow, grow] },
        };
      },
    });
  },
});
