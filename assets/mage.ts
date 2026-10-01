import { addPart, defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';
import { mageSpellbook } from './parts/mage-spellbook.js';
import { holdPose, mageWand, mageWandFlame } from './parts/mage-wand.js';

/**
 * Mage — Chibi Quest hero (catalog `heroes/magic/mage`), about 1.07 m to the hat point, faces +Z.
 * Target: docs/hero-mockups/mage_001.jpg (one front view). The mockup shows an old bearded man;
 * this mage is young and beardless (the rogue's round hero face) and keeps the round glasses.
 * Built on the wizard's body, skeleton, and clip set.
 *
 * One idea: a tall, hooked, star-spangled blue hat and round glasses over a young face; a short
 *   wand with a blue flame at its tip in the right hand, a small spellbook in the left.
 * Proportions: hat point about 1.07 (the hook curls down to his right, -X), brim 0.74 (radius
 *   0.36), eyes 0.63, chin 0.48, shoulders 0.385, belt 0.255, robe hem 0.106, under-robe 0.07.
 * Palette (60/30/10): deep blue cloth #3b5580 (hat, robe, cape, cowl, sleeves); silver #c4c0b8
 *   (stars, trims, cuffs) and silver hair; gray under-robe, brown leather; the cyan wand flame
 *   is the accent.
 * Value plan: the dark brim underside and the black glasses frame the light face; the wand flame
 *   is the brightest point; the silver stars and trims repeat the hair's light value.
 * Rig: the wizard's skeleton (`skirt` for the robe below the belt, `cloak` for the cape,
 *   `hatroot` and `hattip` for the hat, knee `shin` bones) with `orb` at the wand tip (the flame
 *   flares and flies from it). The wand is rigid on the right hand, the book on the left hand.
 *   Clips: idle, walk, run, attack (a wand flick), attack2 (a bolt cast over the raised book),
 *   hit, death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#1a2230',
  iris: '#3a6ea8',
  irisLow: '#7aaedb',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#8a857f',
  mouth: '#a4503f',
  hair: '#c4c0ba',
  blue: '#3b5580',
  blueDark: '#243650',
  hatInside: '#1c2a44',
  silver: '#c4c0b8',
  trim: '#aaa59d',
  under: '#7f7a73',
  leather: '#6a3f24',
  leatherDark: '#472817',
  gold: '#dcae4a',
  boot: '#5e3620',
  sole: '#3a2418',
  wood: '#4e2e1b',
  woodDark: '#321c10',
  glass: '#1d1b1f',
  cover: '#6e2c24',
  page: '#eee2c4',
  glow: '#1a5a82',
  glowCore: '#5cc4ea',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints (the wizard's). The right fist holds the wand out at his side; the left hand is open,
// palm up, with the book standing on it.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.198, 0.36, -0.004];
const WRIST_R: V3 = [-0.24, 0.35, 0.085];
const ELBOW_L: V3 = [0.198, 0.355, 0.012];
const WRIST_L: V3 = [0.258, 0.35, 0.07];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

const rad = Math.PI / 180;
const rotX = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
const rotY = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};
const rotZ = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};

/** A fist hanging from the wrist at the origin; its grip hole runs along Z. */
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.038, 0.043, 0.044]).at(0.007 * s, -0.038, 0.004),
    sdf.capsule([-0.009 * s, -0.058, 0.03], [-0.005 * s, -0.038, 0.042], 0.017),
    sdf.cone([0.02 * s, -0.023, 0.025], [0.001 * s, -0.033, 0.048], 0.016, 0.013),
  );
// The wand hand swings forward and tips out, so the wand leans outward, away from the hat.
const HAND_R = { pitch: -78, roll: 19 };
const handR = (s: sdf.Shape) => s.rotateX(HAND_R.pitch).rotateZ(HAND_R.roll).at(...WRIST_R);
const handRPoint = (p: V3) => add(rotZ(rotX(p, HAND_R.pitch), HAND_R.roll), WRIST_R);
const WAND_AXIS = rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll);
const GRIP = handRPoint([-0.007, -0.04, 0.004]);
const along = (t: number): V3 => add(GRIP, scale(WAND_AXIS, t));
const WAND_TIP = along(0.15);
/** The flame at the wand tip (and the `orb` bone that flares it): its height and base center. */
const FLAME_H = 0.14;
const ORB: V3 = add(WAND_TIP, [0, 0.022, 0]);
/** The hat's pivot: the center of the crown's base (and the `hatroot` bone). */
const HAT_AT: V3 = [0, 0.735, -0.012];
const hatPoint = (p: V3) => add(rotZ(rotX(p, -12), -10), HAT_AT);

/** An open hand, palm up, pointing along +X from the wrist at the origin. */
const openHand = sdf.smoothUnion(
  0.012,
  sdf.ellipsoid([0.046, 0.02, 0.04]).at(0.04, 0, 0.004),
  ...[-0.024, -0.008, 0.008, 0.024].map((z, i) =>
    sdf.capsule([0.07, 0.002, z], [0.098 - Math.abs(i - 1.5) * 0.006, 0.016, z * 1.1], 0.0105),
  ),
  sdf.capsule([0.03, 0.006, 0.036], [0.058, 0.022, 0.052], 0.012),
);
const HAND_L_YAW = -40;
const handL = (s: sdf.Shape) => s.rotateY(HAND_L_YAW).at(...WRIST_L);
/** The book stands on the open palm, out on the fingers, its cover turned to the front. */
const BOOK_AT: V3 = add(WRIST_L, rotY([0.085, 0.077, 0.012], HAND_L_YAW));
const bookPose = (s: sdf.Shape) => s.rotateZ(-8).rotateY(-22).at(...BOOK_AT);

/** A five-point star in the XY plane, point up. */
const starProfile = (R: number) =>
  profile.polygon(
    Array.from({ length: 10 }, (_, i): [number, number] => {
      const a = Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? R : R * 0.45;
      return [r * Math.cos(a), r * Math.sin(a)];
    }),
  );

export default defineAsset({
  name: 'mage',
  description: 'Chibi young mage hero with a tall starry blue hat, round glasses, a flame-tipped wand, and a spellbook.',
  detail: 0.005,
  reference: 'docs/hero-mockups/mage_001.jpg',
  // Color slots for individual mages (the first option is the default look). The silver trims
  // and stars, the leather, the book, and the wand flame are not in a slot.
  variants: {
    eyes: { blue: C.iris, green: '#3d7a45', violet: '#6a4a9e' },
    hair: { silver: C.hair, black: '#2a2426', auburn: '#7a3a22' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { blue: C.blue, plum: '#5e3d63', teal: '#2f6068' },
  },
  presets: {
    arcanist: { eyes: 'violet', hair: 'black', skin: 'fair', clothing: 'plum' },
    tidecaller: { eyes: 'green', hair: 'auburn', skin: 'tan', clothing: 'teal' },
    sage: { eyes: 'blue', hair: 'silver', skin: 'brown', clothing: 'plum' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cloth: k.tint('clothing'),
      clothDark: k.tint('clothing', { color: C.blueDark, follow: 1 }),
      hatInside: k.tint('clothing', { color: C.hatInside, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      skirt: { parent: 'hips', at: [0, 0.25, 0], tail: [0, 0.1, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      hatroot: { parent: 'head', at: HAT_AT },
      hattip: { parent: 'hatroot', at: hatPoint([-0.012, 0.235, -0.018]), tail: hatPoint([-0.29, 0.19, -0.044]) },
      cloak: { parent: 'chest', at: [0, 0.41, -0.13] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      orb: { parent: 'hand.R', at: ORB },
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
    const nose = sdf.ellipsoid([0.018, 0.014, 0.014]).at(0, 0.568, faceZ(0, 0.568) - 0.004).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.026, 0.044, 0.032])
        .subtract(sdf.sphere(0.017).at(0.016, 0, 0.006))
        .rotateY(-12)
        .at(0.2, 0.61, -0.01)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      handR(fistLocal(-1)).bone('hand.R'),
    );
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      handL(openHand).bone('hand.L'),
    );

    // The rogue's young face: big eyes, calm brows, a small smile.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.022, 58, 122), 0.3).at(0.1, 0.722 - 0.1, 0.1));
    const smile = sdf.extrude(profile.arc(0.07, 0.01, 241, 299), 0.3).at(0, 0.53 + 0.07, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.138, 0.562));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armR, armL)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(smile, T.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ round glasses
    // Two thin round rims in front of the eyes, turned to follow the face, a bridge over the
    // nose, and temples that run back into the hair above the ears.
    const GLASS_Y = EYE[1] + 0.004;
    const LENS_R = 0.064;
    const lensC: V3 = [EYE[0], GLASS_Y, faceZ(EYE[0], GLASS_Y) + 0.016];
    const onLens = (p: V3) => add(rotY(p, 20), lensC);
    const rim = sdf.torus(LENS_R, 0.0075).rotateX(90).rotateY(20).at(...lensC);
    const lensIn = onLens([-LENS_R, 0.004, 0]);
    const lensOut = onLens([LENS_R, 0.004, 0]);
    const bridgeZ = Math.max(lensIn[2], faceZ(0, GLASS_Y + 0.012) + 0.012);
    const bridge = sdf.chain(
      [
        [lensIn[0], lensIn[1], lensIn[2], 0.0055],
        [0, GLASS_Y + 0.014, bridgeZ, 0.005],
        [-lensIn[0], lensIn[1], lensIn[2], 0.0055],
      ],
      0.004,
    );
    const temple = sdf.chain(
      [
        [lensOut[0], lensOut[1], lensOut[2], 0.0055],
        [0.2, GLASS_Y + 0.01, 0.07, 0.005],
        [0.216, GLASS_Y + 0.012, -0.01, 0.0045],
      ],
      0.004,
    );
    k.body('glasses', sdf.union(hard(sdf.union(rim, temple)), bridge), {
      color: C.glass,
      roughness: 0.3,
      metalness: 0.6,
      detail: 0.003,
      bone: 'head',
    });

    // ------------------------------------------------------------------ the hat
    // Local frame: the crown's base center at the origin. The wizard's wide, soft brim; a tall
    // cone crown whose point hooks over to his right (-X) and droops. Silver stars on the felt.
    const BRIM_MID = [
      [0, 0.021],
      [0.2, 0.016],
      [0.26, 0.004],
      [0.32, -0.0215],
      [0.36, -0.047],
      [0.6, -0.1],
    ] as const;
    const brimMid = (r: number) => {
      let i = 0;
      while (i < BRIM_MID.length - 2 && r > BRIM_MID[i + 1]![0]) i++;
      const [r0, y0] = BRIM_MID[i]!;
      const [r1, y1] = BRIM_MID[i + 1]!;
      return y0 + (y1 - y0) * Math.min(1, Math.max(0, (r - r0) / (r1 - r0)));
    };
    const brimWave = (x: number, z: number) => Math.sin(Math.atan2(z, x) * 4 - 1.3) * Math.min(1, Math.max(0, (Math.hypot(x, z) - 0.2) / 0.15));
    const hatPose = (s: sdf.Shape) => s.rotateX(-12).rotateZ(-10).at(...HAT_AT);
    const brim = sdf
      .revolve(
        profile.polygon(
          [
            [0.0, 0.012],
            [0.2, 0.006],
            [0.27, -0.008],
            [0.32, -0.03],
            [0.35, -0.058],
            [0.364, -0.052],
            [0.357, -0.036],
            [0.32, -0.013],
            [0.26, 0.014],
            [0.2, 0.026],
            [0.0, 0.03],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .displace(0.016, (x, y, z) => brimWave(x, z) * Math.tanh((y - brimMid(Math.hypot(x, z))) / 0.004), 2);
    const crownCone = sdf.cone([0, 0.0, 0], [0, 0.19, -0.008], 0.212, 0.115);
    const point = sdf.chain(
      [
        [0.0, 0.17, -0.008, 0.115],
        [-0.012, 0.235, -0.018, 0.085],
        [-0.045, 0.29, -0.03, 0.058],
        [-0.1, 0.315, -0.04, 0.04],
        [-0.165, 0.3, -0.045, 0.028],
        [-0.22, 0.26, -0.048, 0.018],
        [-0.262, 0.215, -0.046, 0.009],
        [-0.29, 0.19, -0.044, 0.003],
      ],
      0.03,
    );
    const hatInner = sdf.ellipsoid([0.212, 0.2, 0.2]).at(0, -0.06, 0.01);
    const hatLocal = sdf
      .smoothUnion(0.03, brim.bone('hatroot'), crownCone.bone('hatroot'), point.bone('hattip'))
      .subtract(hatInner)
      .paintFn((x, y, z, base) => {
        // The underside of the brim and the inside of the crown are dark.
        const r = Math.hypot(x, z);
        return r < 0.4 && y < brimMid(r) - 0.016 * brimWave(x, z) ? rgb(T.hatInside) : base;
      });
    k.body('hat', hatPose(hatLocal), { color: T.cloth, roughness: 0.85 });
    // Raised silver stars: a thin shell of the crown, cut by star prisms that point out from the
    // crown's axis. The stars high on the point follow the hat tip.
    const crown = sdf.smoothUnion(0.03, crownCone, point);
    const crownShell = crown.round(0.006).subtract(crown.round(-0.002));
    const STARS: [number, number, number][] = [
      // [radius, azimuth (degrees from the front toward his left), height]
      [0.066, 0, 0.115],
      [0.05, 60, 0.1],
      [0.05, -60, 0.1],
      [0.03, -26, 0.205],
      [0.026, 30, 0.25],
      [0.055, 180, 0.11],
      [0.03, 125, 0.15],
      [0.032, -120, 0.13],
    ];
    const stars = sdf.union(
      ...STARS.map(([R, az, y]) =>
        crownShell
          .intersect(sdf.extrude(starProfile(R), 0.2).at(0, 0, 0.12).rotateY(az).at(0, y, 0))
          .bone(y > 0.19 ? 'hattip' : 'hatroot'),
      ),
    );
    k.body('stars', hatPose(stars), { color: C.silver, roughness: 0.45, metalness: 0.35, detail: 0.003 });

    // ------------------------------------------------------------------ hair
    // Silver hair under the hat: side-swept bangs, short sides that end at the ears, and a
    // short back. Hair may fill the crown's cavity and hang anywhere below the brim, never through it.
    const underBrim = sdf.revolve(
      profile.polygon([
        [0, -0.6],
        [0.6, -0.6],
        [0.6, -0.1],
        [0.36, -0.1],
        [0.32, -0.07],
        [0.27, -0.038],
        [0.2, -0.014],
        [0, -0.006],
      ]),
    );
    const underHat = hatPose(hatInner.round(-0.004).union(underBrim));
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.014, HEAD[1] + 0.012, HEAD[2] + 0.014])
      .at(0, HEAD_Y + 0.006, -0.012)
      .smoothSubtract(0.015, sdf.ellipsoid([0.23, 0.15, 0.22]).rotateZ(-10).at(-0.015, 0.625, 0.15));
    const waves = (x: number, y: number, z: number) => Math.sin(y * 70 + Math.atan2(z, x) * 3);
    const lock = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.02);
    const sideLocks = pair(
      sdf.union(
        lock([
          [0.16, 0.74, 0.08, 0.05],
          [0.195, 0.67, 0.07, 0.042],
          [0.205, 0.61, 0.055, 0.028],
          [0.212, 0.575, 0.045, 0.012],
        ]),
        lock([
          [0.12, 0.74, -0.14, 0.07],
          [0.17, 0.64, -0.12, 0.06],
          [0.175, 0.56, -0.1, 0.045],
          [0.17, 0.52, -0.08, 0.025],
        ]),
      ),
    );
    const backLocks = lock([
      [0, 0.72, -0.16, 0.09],
      [0, 0.6, -0.17, 0.08],
      [0.0, 0.52, -0.14, 0.055],
      [0.0, 0.48, -0.12, 0.03],
    ]);
    // A full fringe swept toward his right, ending just above the brows.
    const bangs = sdf.union(
      lock([
        [0.11, 0.81, 0.15, 0.036],
        [0.06, 0.77, 0.19, 0.03],
        [0.01, 0.75, 0.2, 0.012],
      ]),
      lock([
        [0.03, 0.815, 0.16, 0.036],
        [-0.03, 0.772, 0.195, 0.03],
        [-0.085, 0.748, 0.194, 0.012],
      ]),
      lock([
        [-0.06, 0.81, 0.15, 0.034],
        [-0.115, 0.765, 0.178, 0.028],
        [-0.158, 0.722, 0.16, 0.012],
      ]),
      lock([
        [0.15, 0.79, 0.12, 0.03],
        [0.168, 0.745, 0.142, 0.022],
        [0.165, 0.705, 0.14, 0.01],
      ]),
    );
    const hair = sdf
      .smoothUnion(0.025, cap, sideLocks, backLocks, bangs)
      .displace(0.004, waves)
      .intersect(underHat)
      .subtract(hatPose(brim).round(0.006));
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ robe, under-robe, cape
    const robeShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.126, 0.29],
            [0.134, 0.25],
            [0.158, 0.2],
            [0.186, 0.15],
            [0.21, 0.118],
            [0.2, 0.106],
            [0, 0.106],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    // Two silver bands run down the front from the cowl to the hem; a silver band edges the hem.
    const frontBands = hard(sdf.box([0.026, 0.5, 0.4]).at(0.045, 0.2, 0.2));
    const robe = robeShape.paintWhere(frontBands, C.trim).paintWhere(sdf.halfSpace([0, 1, 0], 0.135), C.trim);
    // Below the belt the robe skirt hangs from its own bone, so the hem can swing in a walk.
    const above = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, -1, 0], -y));
    const below = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, 1, 0], y));
    k.body('robe', sdf.union(above(robe, 0.25).bone('spine'), below(robe, 0.25).bone('skirt')), { color: T.cloth, roughness: 0.8 });
    // The gray under-robe shows below the hem, over the boot tops.
    const under = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.118, 0.3],
            [0.14, 0.21],
            [0.166, 0.15],
            [0.19, 0.09],
            [0.192, 0.078],
            [0.18, 0.07],
            [0, 0.07],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.8]);
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.1, 0.004], 0.045).bone('leg.L')),
    );
    k.body('tunic', sdf.union(above(under, 0.25).bone('spine'), below(under, 0.25).bone('skirt'), legs), { color: C.under, roughness: 0.85 });

    // A soft cowl around the neck, dipping to a point in front; the cape falls from it.
    const cowl = sdf
      .smoothUnion(
        0.03,
        sdf.torus(0.1, 0.038).scale([1.2, 1, 1.05]).rotateX(12).at(0, 0.448, -0.008),
        sdf.ellipsoid([0.08, 0.05, 0.034]).at(0, 0.41, 0.09),
      )
      .subtract(sdf.cylinder(0.06, 0.2).at(0, 0.5, -0.01));
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
    // The cape flares wide at the hem, so it shows on both sides from the front; a darker lining.
    const capeR = (y: number) => 0.18 + ((0.4 - 0.18) * (0.44 - y)) / (0.44 - 0.07);
    const lining = rgb(T.clothDark);
    const cape = capeCone(0.18, 0.4, 0.44, 0.07)
      .subtract(capeCone(0.158, 0.378, 0.46, 0.05))
      .at(0, 0, -0.03)
      .intersect(sdf.halfSpace([0, 0, 1], 0.03))
      .paintFn((x, y, z, base) => {
        const r = Math.hypot(x, (z + 0.03) / 0.85);
        return r < capeR(y) - 0.012 * folds(x, y, z + 0.03) - 0.011 ? lining : base;
      });
    k.body('cape', sdf.union(cape.bone('cloak'), cowl.bone('chest')), { color: T.cloth, roughness: 0.8 });

    // ------------------------------------------------------------------ sleeves with silver cuffs (one body, so the cuffs are cloth, not held items)
    const sleeve = (s: V3, e: V3, w: V3, tagU: string, tagF: string) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone([s[0] * 0.85, 0.405, 0], e, 0.048, 0.046).bone(tagU),
        sdf.cone(e, lerp(e, w, 0.78), 0.046, 0.054).bone(tagF),
      );
    const cuff = (e: V3, w: V3, tag: string) => sdf.cone(lerp(e, w, 0.7), lerp(e, w, 0.9), 0.056, 0.058).round(0.003).bone(tag);
    const sleeves = sdf.union(
      sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'),
      sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R'),
      cuff(ELBOW_L, WRIST_L, 'forearm.L').paint(C.trim),
      cuff(ELBOW_R, WRIST_R, 'forearm.R').paint(C.trim),
    );
    k.body('sleeves', sleeves, { color: T.cloth, roughness: 0.8 });

    // ------------------------------------------------------------------ belt and pouch (leather)
    const beltY = 0.255;
    const belt = robeShape.round(0.01).smoothIntersect(0.006, sdf.box([0.5, 0.04, 0.5], 0.006).at(0, beltY, 0));
    const pouchP = sdf.surfacePoint(belt, [-0.1, beltY - 0.02, 0.3], 0);
    const pouchPose = (s: sdf.Shape) =>
      s.rotateY((Math.atan2(pouchP[0], pouchP[2]) * 180) / Math.PI).at(pouchP[0], pouchP[1] - 0.026, pouchP[2] + 0.008);
    const pouch = pouchPose(
      sdf.union(sdf.box([0.056, 0.062, 0.034], 0.012), sdf.box([0.062, 0.026, 0.04], 0.008).at(0, 0.02, 0.002).paint(C.leatherDark)),
    );
    k.body('leather', sdf.union(belt.bone('spine'), pouch.bone('spine')), { color: C.leather, roughness: 0.6 });

    // ------------------------------------------------------------------ gold: buckle ring, pouch button
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf.union(
      sdf.torus(0.021, 0.0065).scale([1.2, 1, 1]).rotateX(90).at(0, beltY, beltZ + 0.004),
      sdf.capsule([0, beltY, beltZ + 0.006], [0.018, beltY, beltZ + 0.006], 0.004),
    );
    const pouchButton = pouchPose(sdf.sphere(0.008).scale([1, 1, 0.6]).at(0, 0.012, 0.022));
    k.body('gold', sdf.union(buckle.bone('spine'), pouchButton.bone('spine')), { color: C.gold, roughness: 0.32, metalness: 0.9 });

    // ------------------------------------------------------------------ boots
    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.05, 0.085, 0.02).at(0, 0.065, 0),
        sdf.ellipsoid([0.058, 0.052, 0.1]).at(0, 0.05, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf
      .union(bootFoot, sdf.cylinder(0.058, 0.026, 0.01).at(0, 0.1, 0).paint(C.sole))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the wand and its flame
    // The wand, its flame, and the book are parts (assets/parts/mage-wand.ts and
    // assets/parts/mage-spellbook.ts), shared with the standalone mage-wand and mage-spellbook
    // assets. The wand's grip is in the right fist; the flame stays upright above the tip.
    addPart(k, mageWand(), { pose: holdPose(GRIP, WAND_AXIS).pose });
    const flameBase: V3 = [ORB[0], ORB[1] - FLAME_H * 0.3, ORB[2]];
    addPart(k, mageWandFlame(), { pose: (s) => s.at(...flameBase) });

    // ------------------------------------------------------------------ the spellbook
    // A small leather-bound book standing on the open palm.
    addPart(k, mageSpellbook(), { pose: bookPose });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, follow, quat, euler } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const flicker = (p: number) => ({
      orb: { scale: [1 + 0.06 * wave(p, 7), 1 + 0.1 * wave(p, 5, 0.2), 1 + 0.06 * wave(p, 7, 0.4)] as const },
    });

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        ...flicker(p),
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] },
        hattip: { rotate: [4 * wave(p, 1, 0.4), 0, -6 * wave(p, 1, 0.35)] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        skirt: { rotate: [1.5 * wave(p, 1, 0.2), 0, 0] },
        // The book hand lifts a little, as if weighing the book.
        'forearm.L': { rotate: [-3 * bump(p), 0, 0] },
        'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, 0] },
      }),
    });

    // Both hands are busy, so the arms swing little; the hat point, the robe skirt, and the cape
    // carry the motion. The legs come from motion.gait (the wizard's stride).
    const stride = (duration: number, step: number, lift: number, duty: number, hop: number, armSwing: number, lean: number, flow: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          heel: [0.094, 0, -0.015],
          toe: [0.111, 0, 0.093],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...flicker(p),
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          skirt: { rotate: [flow * 0.25 + 3 * wave(p, 2, 0.1), -9 * wave(p, 1, 0.12), 4 * wave(p, 1, 0.3)] as const },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          hattip: { rotate: [flow * 0.4 + 6 * wave(p, 2, 0.2), 0, -8 * wave(p, 2, 0.1)] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.3 * s, 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.25 * s, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.6, 0.006, 28, 3, 6));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.4, 0.025, 50, 12, 22));

    // Posing by targets. The wrists follow keys in the chest's rest frame (reach); the wand hand
    // turns so the wand points along its own keys (orient); `up` rolls it about its length.
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const WAND = { dir: norm(WAND_AXIS), up: [0, 0, 1] as V3 };
    const PALM = { dir: rotY([1, 0, 0], HAND_L_YAW), up: [0, 1, 0] as V3 };
    const wandPose = (wrist: V3, dir: V3, up: V3 = [0, 0, 1], pole: V3 = [-0.5, 0.2, -0.3]) => {
      const arm = reach(ARM_R, wrist, pole);
      const hand = orient([arm.upper, arm.lower], WAND, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.R': { rotate: arm.upper }, 'forearm.R': { rotate: arm.lower }, 'hand.R': { rotate: hand } };
    };
    const palmPose = (wrist: V3, dir: V3, up: V3, pole: V3 = [0.5, 0.1, -0.3]) => {
      const arm = reach(ARM_L, wrist, pole);
      const hand = orient([arm.upper, arm.lower], PALM, { dir: norm(dir), up: norm(up) });
      return { 'upperarm.L': { rotate: arm.upper }, 'forearm.L': { rotate: arm.lower }, 'hand.L': { rotate: hand } };
    };

    // attack: a wand flick. He draws the wand back beside him (out and low, clear of the brim),
    // holds, then flicks it forward to point at the target; the tip flame flares and settles.
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.28, [-0.285, 0.38, 0.0]],
            [0.4, [-0.29, 0.385, -0.01]],
            [0.46, [-0.24, 0.395, 0.1]],
            [0.52, [-0.19, 0.385, 0.19]],
            [0.64, [-0.19, 0.38, 0.19]],
            [0.82, [-0.22, 0.365, 0.13]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = keys(
          p,
          [
            [0, WAND_AXIS],
            [0.28, norm([-0.45, 0.8, -0.38])],
            [0.4, norm([-0.46, 0.78, -0.42])],
            [0.46, norm([-0.18, 0.55, 0.82])],
            [0.52, norm([-0.04, 0.12, 1])],
            [0.64, norm([-0.04, 0.1, 1])],
            [0.82, norm([-0.2, 0.6, 0.78])],
            [1, WAND_AXIS],
          ] as const,
          'spline',
        );
        const up = keys(
          p,
          [
            [0, [0, 0, 1]],
            [0.28, [0, 0.45, 0.85]],
            [0.4, [0, 0.45, 0.85]],
            [0.46, [0, -0.5, 0.85]],
            [0.52, [0, -1, 0.12]],
            [0.64, [0, -1, 0.1]],
            [0.82, [0, -0.6, 0.8]],
            [1, [0, 0, 1]],
          ] as const,
        );
        const gather = ease(0.02, 0.28, p) * (1 - ease(0.42, 0.5, p));
        const cast = ease(0.42, 0.52, p) * (1 - ease(0.7, 1, p));
        const orb = keys(p, [[0, 1], [0.28, 0.7], [0.42, 0.8], [0.5, 2.1], [0.56, 2.4], [0.68, 1.5], [0.86, 1]] as const);
        return {
          ...wandPose(wrist, dir, up),
          ...palmPose(keys(p, [[0, WRIST_L], [0.3, [0.25, 0.335, 0.04]], [0.6, [0.265, 0.345, 0.09]], [1, WRIST_L]] as const), PALM.dir, PALM.up),
          orb: { scale: [orb, orb, orb] },
          hips: {
            move: [0, -legDrop(LEG, 14 * cast) - 0.005 * cast, 0.025 * cast - 0.01 * gather],
            rotate: [0, -12 * gather + 10 * cast, 0],
          },
          skirt: { rotate: [-3 * gather + 6 * cast, 6 * gather - 6 * cast, 0] },
          spine: { rotate: [-5 * gather + 9 * cast, 0, 0] },
          chest: { rotate: [-3 * gather + 5 * cast, -14 * gather + 12 * cast, 0] },
          head: { rotate: [4 * gather - 6 * cast, 12 * gather - 12 * cast, 0] },
          hattip: { rotate: [-6 * gather + 12 * cast, 0, -6 * gather] },
          cloak: { rotate: [4 * gather + 14 * cast, 0, 0] },
          'leg.L': { rotate: [2 * gather - 16 * cast, 0, 0] },
          'leg.R': { rotate: [-2 * gather + 10 * cast, 0, 0] },
          'foot.L': { rotate: [10 * cast, 0, 0] },
          'foot.R': { rotate: [-5 * cast, 0, 0] },
        };
      },
    });

    // attack2: a bolt cast over the book. The book comes up in front of him, cover to the enemy,
    // as the wand draws back; then the wand points forward and the tip flame flies off along it,
    // swells, and bursts away. A new small flame lights at the tip as the arms come back.
    k.animation('attack2', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0.02, 0.3, p) * (1 - ease(0.4, 0.48, p));
        const push = ease(0.4, 0.5, p) * (1 - ease(0.72, 1, p));
        const raise = ease(0.02, 0.3, p) * (1 - ease(0.72, 0.98, p));
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.3, [-0.29, 0.37, 0.02]],
            [0.4, [-0.29, 0.375, 0.015]],
            [0.48, [-0.21, 0.39, 0.14]],
            [0.54, [-0.17, 0.39, 0.19]],
            [0.7, [-0.17, 0.385, 0.19]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = keys(
          p,
          [
            [0, WAND_AXIS],
            [0.3, norm([-0.45, 0.85, -0.2])],
            [0.4, norm([-0.45, 0.85, -0.22])],
            [0.48, norm([-0.08, 0.5, 0.86])],
            [0.54, norm([0.06, 0.15, 0.98])],
            [0.7, norm([0.06, 0.15, 0.98])],
            [1, WAND_AXIS],
          ] as const,
          'spline',
        );
        const up = keys(p, [[0, [0, 0, 1]], [0.3, [0, 0.3, 0.95]], [0.4, [0, 0.3, 0.95]], [0.48, [0, -0.5, 0.85]], [0.54, [0, -1, 0.15]], [0.7, [0, -1, 0.15]], [1, [0, 0, 1]]] as const);
        // The flame: grows while charging, flies out along the wand, bursts, relights.
        const fly = ease(0.5, 0.66, p);
        const size = keys(p, [[0, 1], [0.3, 1.3], [0.4, 1.2], [0.5, 1.8], [0.62, 2.3], [0.67, 0.05], [0.84, 0.05], [0.98, 1]] as const);
        const away = 0.6 * fly * (p < 0.67 ? 1 : 1 - ease(0.67, 0.8, p));
        return {
          ...wandPose(wrist, dir, up),
          ...palmPose(lerp(WRIST_L, [0.17, 0.37, 0.17], raise), lerp(PALM.dir, norm([0.96, 0.05, 0.28]), raise), PALM.up),
          orb: { scale: [size, size, size], move: scale(WAND_AXIS, away) },
          hips: {
            move: [0, -legDrop(LEG, 14 * push) - 0.004 * push, 0.025 * push - 0.01 * wind],
            rotate: [0, -8 * wind + 6 * push, 0],
          },
          skirt: { rotate: [-2 * wind + 5 * push, 4 * wind - 4 * push, 0] },
          spine: { rotate: [-4 * wind + 8 * push, 0, 0] },
          chest: { rotate: [-2 * wind + 4 * push, -8 * wind + 6 * push, 0] },
          head: { rotate: [2 * wind - 6 * push, 8 * wind - 6 * push, 0] },
          hattip: { rotate: [-4 * wind + 10 * push, 0, 6 * wind] },
          cloak: { rotate: [3 * wind + 14 * push, 0, 0] },
          'leg.L': { rotate: [2 * wind - 16 * push, 0, 0] },
          'leg.R': { rotate: [-2 * wind + 10 * push, 0, 0] },
          'foot.L': { rotate: [10 * push, 0, 0] },
        };
      },
    });

    // hit: the head and chest snap back, a small step back, the wand tips out, the flame gutters.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = ease(0, 0.18, p) * (1 - ease(0.35, 1, p));
        const f = 1 - 0.35 * h;
        return {
          ...wandPose(lerp(WRIST_R, [-0.26, 0.36, 0.05], h), lerp(WAND_AXIS, norm([-0.45, 0.88, -0.08]), h)),
          orb: { scale: [f, f, f] },
          hips: { move: [0, -0.005 * h, -0.025 * h], rotate: [0, -6 * h, 0] },
          skirt: { rotate: [6 * h, 0, 0] },
          spine: { rotate: [-8 * h, 0, 0] },
          chest: { rotate: [-10 * h, -6 * h, 3 * h] },
          head: { rotate: [-14 * h, 8 * h, -5 * h] },
          hattip: { rotate: [14 * h, 0, -8 * h] },
          cloak: { rotate: [-8 * h, 0, 0] },
          'upperarm.L': { rotate: [-8 * h, 0, 10 * h] },
          'leg.R': { rotate: [10 * h, 0, 0] },
          'leg.L': { rotate: [-6 * h, 0, 0] },
          'foot.R': { rotate: [-10 * h, 0, 0] },
          'foot.L': { rotate: [6 * h, 0, 0] },
        };
      },
    });

    // death (the wizard's): a stagger, then he falls flat on his back; the flame goes out, the
    // wand drops beside his right side, and the hat lifts off, tumbles out to his left, and
    // settles on its brim on the floor. The hips drop below the floor on purpose: the build
    // lifts the body until it rests on the floor.
    const NECK_CHAIN: V3[] = [[0, 0.2, 0], [0, 0.26, 0], [0, 0.33, 0], [0, 0.43, -0.01], [0, 0.48, -0.01]];
    const HAT_FLOOR: V3 = [0.58, -0.033, -0.62];
    const HAT_REST = quat([0, 0, -10]).multiply(quat([-12, 0, 0]));
    const HAT_DOWN = quat([0, 0, -6]).multiply(quat([0, 70, 0]));
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const stagger = ease(0, 0.22, p) * (1 - ease(0.3, 0.45, p));
        const fall = ease(0.26, 0.7, p);
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.16)));
        const out = 1 - 0.95 * ease(0.3, 0.6, p);
        const tip = ease(0.4, 0.8, p);
        const drop = ease(0.45, 0.72, p);
        const leg = 30 * bump(fall) + 6 * fall;
        const flat = ease(0.4, 0.68, p);
        const hipsMove: V3 = [0, -0.14 * drop + 0.012 * land + 0.006 * stagger, -0.04 * stagger - 0.08 * fall];
        const bend = [-76 * fall - 4 * stagger, -6 * stagger, -4 * stagger, -5 * fall, -16 * stagger - 14 * fall];
        const lean = bend.reduce((a, b) => a + b, 0);
        const onHead = (pt: V3) =>
          follow(NECK_CHAIN.map((j) => add(j, hipsMove)), bend.map((a) => [a, 0, 0] as V3), add(pt, hipsMove));
        const off = ease(0.28, 0.46, p);
        const fly = ease(0.36, 0.8, p);
        const turn = ease(0.36, 0.66, p);
        const worn = onHead(HAT_AT);
        const lifted = onHead([HAT_AT[0] + 0.03 * off, HAT_AT[1] + 0.1 * off, HAT_AT[2]]);
        const hatAt = add(lerp(lifted, HAT_FLOOR, fly), [0, 0.14 * Math.sin(Math.PI * fly), 0]);
        const hatTurn = quat([lean, 0, 0]).multiply(HAT_REST).slerp(HAT_DOWN, turn);
        return {
          ...wandPose(
            keys(p, [[0, WRIST_R], [0.3, [-0.27, 0.34, 0.1]], [0.66, [-0.26, 0.34, -0.09]]] as const),
            keys(p, [[0, WAND_AXIS], [0.3, norm([-0.3, 0.75, 0.6])], [0.5, norm([-0.2, -0.2, 0.96])], [0.66, norm([-0.15, -1, 0.3])]] as const),
            keys(p, [[0, [0, 0, 1]], [0.3, [-1, 0, 0]], [0.66, [-1, 0, 0]]] as const),
            [-0.3, 0.2, -0.4],
          ),
          ...palmPose(lerp(WRIST_L, [0.26, 0.34, -0.09], ease(0.2, 0.66, p)), PALM.dir, lerp(PALM.up, [0, 0.3, 1], ease(0.2, 0.62, p)), [0.3, 0.2, -0.4]),
          orb: { scale: [out, out, out] },
          hatroot: {
            rotate: euler(quat([-lean, 0, 0]).multiply(hatTurn).multiply(HAT_REST.clone().invert())),
            move: follow([[0, 0, 0]], [[-lean, 0, 0]], sub(hatAt, worn)),
          },
          hattip: { rotate: [-10 * tip + 12 * land, 0, -10 * tip] },
          hips: { move: hipsMove, rotate: [bend[0]!, 0, 0] },
          skirt: { rotate: [8 * stagger + leg - 20 * fall, 0, 0] },
          spine: { rotate: [bend[1]!, 0, 0] },
          chest: { rotate: [bend[2]!, 0, 0] },
          neck: { rotate: [bend[3]!, 0, 0] },
          head: { rotate: [bend[4]!, 0, 0] },
          cloak: { rotate: [-10 * stagger - 8 * fall, 0, 0], scale: [1 + 0.15 * flat, 1, 1 - 0.86 * flat] },
          'leg.L': { rotate: [6 * stagger + leg, 0, 4 * fall] },
          'leg.R': { rotate: [-6 * stagger + leg + 2 * fall, 0, -5 * fall] },
          'foot.L': { rotate: [-14 * fall, 0, 0] },
          'foot.R': { rotate: [-18 * fall, 0, 0] },
        };
      },
    });

    // victory (the wizard's hop): an anticipation crouch, a push-off, a hop of about 8 cm, and a
    // landing that the knees absorb. In the push-off he raises the wand up and out to his right
    // (well clear of the brim) and the flame flares; the book hand hugs the book up to his side.
    const V_JUMP = 0.08;
    const V_DROP = 0.04;
    const [V_OFF, V_LAND] = [0.28, 0.48];
    const LEGS = { hip: HIP, knee: KNEE, ankle: ANKLE };
    k.animation('victory', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const pump = bump(Math.min(1, Math.max(0, (p - 0.52) / 0.4)), 2);
        let h: number;
        if (p < 0.2) h = -V_DROP * ease(0, 0.17, p);
        else if (p < V_OFF) h = -V_DROP * (1 - ((p - 0.2) / (V_OFF - 0.2)) ** 2);
        else if (p < V_LAND) h = (4 * V_JUMP * (p - V_OFF) * (V_LAND - p)) / (V_LAND - V_OFF) ** 2;
        else if (p < 0.56) h = -0.03 * Math.sin(((Math.PI / 2) * (p - V_LAND)) / (0.56 - V_LAND));
        else h = -0.03 * keys(p, [[0.56, 1], [0.66, 0.1], [0.72, 0.22], [0.84, 0]] as const);
        h -= 0.006 * pump;
        const bend = Math.max(0, -h) / V_DROP;
        const air = Math.max(0, h) / V_JUMP;
        const flight = p > V_OFF && p < V_LAND ? Math.sin((Math.PI * (p - V_OFF)) / (V_LAND - V_OFF)) : 0;
        const lift = Math.max(0, h) + 0.02 * flight;
        const pitch = Math.min(24, lift / 0.0022);
        const hips = { at: [0, 0.2, 0] as V3, move: [0, h, -0.2 * Math.max(0, -h)] as V3 };
        const legL = motion.legTo('L', LEGS, [ANKLE[0], ANKLE[1] + lift, 0], { hips, pitch });
        const legR = motion.legTo('R', LEGS, [-ANKLE[0], ANKLE[1] + lift, 0], { hips, pitch });
        const up = ease(0.18, 0.4, p);
        const f = 1 + 0.6 * up + 0.2 * pump;
        const wandWrist = add(lerp(WRIST_R, [-0.3, 0.45, 0.12], up), [0, 0.02 * pump, 0]);
        const bookWrist = keys(p, [[0, WRIST_L], [0.16, [0.25, 0.36, 0.1]], [0.4, [0.24, 0.375, 0.12]]] as const);
        return {
          ...wandPose(wandWrist, lerp(WAND_AXIS, norm([-0.7, 0.7, 0.1]), up)),
          ...palmPose(add(bookWrist, [0, 0.02 * pump, 0]), PALM.dir, PALM.up),
          orb: { scale: [f, f, f] },
          hips: { move: hips.move },
          skirt: { rotate: [-7 * bend - 5 * air + 3 * pump, 0, 0] },
          spine: { rotate: [8 * bend - 3 * air - 5 * up, 0, 0] },
          chest: { rotate: [4 * bend - 4 * up - 3 * pump, 5 * up, 0] },
          head: { rotate: [-4 * bend - 8 * up, 6 * up, 4 * up] },
          hattip: { rotate: [8 * bend - 14 * air + 6 * pump, 0, -8 * pump] },
          cloak: { rotate: [14 * air - 4 * bend, 0, 0] },
          'leg.L': { rotate: legL.leg },
          'shin.L': { rotate: legL.shin },
          'foot.L': { rotate: legL.foot },
          'leg.R': { rotate: legR.leg },
          'shin.R': { rotate: legR.shin },
          'foot.R': { rotate: legR.foot },
        };
      },
    });
  },
});
