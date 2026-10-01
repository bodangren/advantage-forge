import { addPart, defineAsset, motion, profile, rgb, sdf } from '../src/index.js';
import { enchanterStaff, MOUNT as STAFF_MOUNT } from './parts/enchanter-staff.js';
import { enchanterScroll, enchanterScrollFlame, FLAME_MOUNT } from './parts/enchanter-scroll.js';

/**
 * Enchanter — Chibi Quest hero (catalog `heroes/magic/enchanter`), about 1.0 m to the top of the
 * hair, faces +Z. Target: docs/hero-mockups/enchanter_001.jpg (one front view). The mockup has
 * pointed ears; this enchanter has small round human ears and the rogue's round young face.
 * Built on the mage's body, skeleton, and clip set (the hat, glasses, book, and long cape are gone).
 *
 * One idea: a young charmer with a big rolled cloud of silver hair, a gold circlet with a pink
 *   teardrop gem, and a glowing pink scroll unrolling from his open left hand under pink sparks.
 * Shape language: round and soft (rolled locks, puffed sleeves), a few gold points to break it.
 * Palette (60/30/10): teal #5aa898 robe and boots; silver hair #d8dce0 and cream under-skirt;
 *   gold #e0b040 trims; the pink gems, scroll glow, and sparks are the accent.
 * Value plan: the bright silver hair frames the warm face; the dark teal robe carries the gold;
 *   the pink gems repeat the pink of the scroll.
 * Rig: the mage's skeleton (`skirt`, `cloak`, `hatroot`/`hattip` unused, knee `shin` bones) with
 *   `orb` on the left hand above the scroll (the sparks). The short wand is rigid on the right hand.
 *   Clips: idle, walk, run, attack (a scroll flourish with a spark burst), attack2 (a wand point),
 *   hit, death, victory.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#16303a',
  iris: '#3a8a8a',
  irisLow: '#8ad0c8',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#8a929a',
  mouth: '#8a3030',
  teeth: '#f8f2ea',
  hair: '#e8ecf2',
  hairDark: '#c4ccd8',
  robe: '#5aa898',
  robeDark: '#3a7a6a',
  cream: '#ece0c4',
  lining: '#c8b070',
  gold: '#e0b040',
  leather: '#6b4226',
  boot: '#4a8a80',
  sole: '#2e3a38',
  wood: '#5c3a22',
  woodDark: '#3c2416',
  gem: '#f04080',
  gemBase: '#601030',
  paper: '#f4ecd8',
  glow: '#ff7ad8',
  spark: '#f080e0',
  sparkBase: '#501040',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints (the mage's). The right fist holds the wand out at his side; the left hand is open,
// palm up, with the scroll resting on it.
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
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** A fist hanging from the wrist at the origin; its grip hole runs along Z. */
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.038, 0.043, 0.044]).at(0.007 * s, -0.038, 0.004),
    sdf.capsule([-0.009 * s, -0.058, 0.03], [-0.005 * s, -0.038, 0.042], 0.017),
    sdf.cone([0.02 * s, -0.023, 0.025], [0.001 * s, -0.033, 0.048], 0.016, 0.013),
  );
// The wand hand swings forward and tips out, so the wand leans outward.
const HAND_R = { pitch: -78, roll: 19 };
const handR = (s: sdf.Shape) => s.rotateX(HAND_R.pitch).rotateZ(HAND_R.roll).at(...WRIST_R);
const WAND_AXIS = rotZ(rotX([0, 0, 1], HAND_R.pitch), HAND_R.roll);
/** The hat bones are unused (the mage's rig kept whole): the hat's pivot and the point's bone. */
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

/**
 * The scroll: a roll across the open palm, its axis along the local Z of this frame, turned so the
 * unrolled strip faces the front. The strip rises from the roll in a gentle S.
 */
const SCROLL_YAW = 72;
const ROLL_C: V3 = add(WRIST_L, rotY([0.1, 0.034, 0], HAND_L_YAW));
const scrollPoint = (p: V3): V3 => add(rotY(p, SCROLL_YAW), ROLL_C);
const scrollPose = (s: sdf.Shape) => s.rotateY(SCROLL_YAW).at(...ROLL_C);
/** The pink flame rises from the roll; the `orb` bone sits at its base. */
const ORB_L: V3 = scrollPoint([0, 0.05, 0]);

export default defineAsset({
  name: 'enchanter',
  description: 'Chibi young enchanter hero with silver rolled hair, a gold circlet, a teal robe, a glowing scroll, and a short wand.',
  detail: 0.006,
  reference: 'docs/hero-mockups/enchanter_001.jpg',
  variants: {
    eyes: { teal: C.iris, brown: '#6e4020', violet: '#6a4a9e' },
    hair: { silver: C.hair, black: '#2a2426', rose: '#d0a0b0' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { teal: C.robe, plum: '#5e3d63', gold: '#b08a3a' },
  },
  presets: {
    default: { eyes: 'teal', hair: 'silver', skin: 'fair', clothing: 'teal' },
    plum: { eyes: 'violet', hair: 'rose', skin: 'fair', clothing: 'plum' },
    gold: { eyes: 'brown', hair: 'black', skin: 'tan', clothing: 'gold' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cloth: k.tint('clothing'),
      clothDark: k.tint('clothing', { color: C.robeDark, follow: 1 }),
      lining: k.tint('clothing', { color: C.lining, follow: 0.4 }),
      boot: k.tint('clothing', { color: C.boot, follow: 1 }),
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
      orb: { parent: 'hand.L', at: ORB_L },
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
    // Pointed elf ears (the mockup's): a soft cup with a cone 0.06 m long swept up and out.
    const ears = pair(
      sdf
        .smoothUnion(
          0.012,
          sdf.ellipsoid([0.025, 0.04, 0.03]).subtract(sdf.sphere(0.016).at(0.016, 0, 0.006)).rotateY(-12).at(0.2, 0.61, -0.01),
          sdf.cone([0.194, 0.62, -0.008], [0.262, 0.675, -0.022], 0.03, 0.004),
        )
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

    // The young round face: big eyes, soft brows, rosy cheeks, a happy open smile with teeth.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.054, 0.058, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.045, 0.052, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.039, 0.046, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.018));
    const pupil = pair(at(sdf.ellipsoid([0.027, 0.031, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.052, 0.013, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.013), x + 0.017, EYE[1] + 0.02),
        at(sdf.sphere(0.006), x - 0.015, EYE[1] - 0.023),
      ]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.012, 62, 118), 0.3).at(0.1, 0.725 - 0.1, 0.1));
    const mouthOpen = sdf.extrude(profile.arc(0.07, 0.024, 243, 297), 0.3).at(0, 0.548 + 0.07, 0.1);
    const teeth = sdf.extrude(profile.arc(0.0625, 0.0075, 247, 293), 0.3).at(0, 0.548 + 0.07, 0.1);
    const blush = pair(at(sdf.sphere(0.04), 0.14, 0.56));
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
      .paintWhere(mouthOpen, T.mouth)
      .paintWhere(teeth, C.teeth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hair
    // A cap plus six rolled locks (r 0.03 to 0.045) curling from the crown around the head, a swept
    // fringe lock over the right brow (-X), two long side locks in front of the ears, a short nape.
    // The grooves between the rolls are shaded darker by paintFn.
    const HC: V3 = [0, HEAD_Y + 0.006, -0.012];
    const CAP = [HEAD[0] + 0.008, HEAD[1] + 0.008, HEAD[2] + 0.008] as const;
    const onSkull = (az: number, el: number, m: number): V3 => [
      HEAD[0] * m * Math.cos(el * rad) * Math.sin(az * rad),
      HC[1] + HEAD[1] * m * Math.sin(el * rad),
      HC[2] + HEAD[2] * m * Math.cos(el * rad) * Math.cos(az * rad),
    ];
    const rolled = (az: number, e0: number, e1: number, r0: number, r1: number, m = 1.15) => {
      const pts = [0, 1 / 3, 2 / 3, 1].map((t) => {
        const p = onSkull(az, e0 + (e1 - e0) * t, m + 0.03 * Math.sin(Math.PI * t));
        return [p[0], p[1], p[2], r0 + (r1 - r0) * t] as [number, number, number, number];
      });
      // The roll: the last point curls outward.
      const last = pts[3]!;
      const out = norm([last[0], last[1] - HC[1], last[2] - HC[2]]);
      pts.push([last[0] + out[0] * 0.028, last[1] + out[1] * 0.028 - 0.008, last[2] + out[2] * 0.028, r1 * 0.85]);
      return sdf.chain(pts, 0.014);
    };
    const LOCKS: [number, number, number, number, number][] = [
      [-55, 86, 42, 0.045, 0.036],
      [55, 86, 42, 0.045, 0.036],
      [-115, 82, 22, 0.045, 0.038],
      [115, 82, 22, 0.045, 0.038],
      [-168, 76, 14, 0.045, 0.04],
      [168, 76, 14, 0.045, 0.04],
    ];
    const cap = sdf.ellipsoid(CAP).at(...HC);
    const nape = sdf.chain(
      [
        [0, 0.66, -0.16, 0.085],
        [0, 0.55, -0.16, 0.07],
        [0, 0.5, -0.13, 0.045],
      ],
      0.02,
    );
    const faceMask = sdf.ellipsoid([0.25, 0.165, 0.23]).at(0, 0.618, 0.135);
    const earCut = hard(sdf.sphere(0.075).at(0.21, 0.63, -0.01));
    const waves = (x: number, y: number, z: number) => Math.sin(y * 34 + Math.atan2(z, x) * 5);
    const hairMain = sdf
      .smoothUnion(0.012, cap, nape, rolled(0, 90, 90, 0.04, 0.04, 1.15), ...LOCKS.map(([a, e0, e1, r0, r1]) => rolled(a, e0, e1, r0, r1)))
      .displace(0.003, waves)
      .smoothSubtract(0.014, faceMask, earCut);
    // The swept fringe over the right brow, and the long side locks in front of the ears.
    const fringe = sdf.chain(
      [
        [0.05, 0.9, 0.06, 0.04],
        [-0.02, 0.865, 0.14, 0.037],
        [-0.09, 0.835, 0.145, 0.032],
        [-0.15, 0.795, 0.11, 0.022],
      ],
      0.014,
    );
    const longLocks = pair(
      sdf.chain(
        [
          [0.19, 0.74, 0.03, 0.045],
          [0.2, 0.64, 0.085, 0.036],
          [0.196, 0.54, 0.09, 0.035],
          [0.19, 0.46, 0.092, 0.032],
          [0.186, 0.4, 0.094, 0.022],
        ],
        0.03,
      ),
    );
    const grooveC = rgb(T.hairDark);
    const hair = sdf
      .smoothUnion(0.012, hairMain, fringe, longLocks)
      .paintFn((x, y, z, base) => {
        // Near the cap surface the rolls meet: those are the grooves.
        const q = Math.hypot(x / CAP[0], (y - HC[1]) / CAP[1], (z - HC[2]) / CAP[2]);
        const g = 1 - smooth(1.03, 1.1, q);
        return [base[0] + (grooveC[0] - base[0]) * g, base[1] + (grooveC[1] - base[1]) * g, base[2] + (grooveC[2] - base[2]) * g] as const;
      });
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.005, bone: 'head' });

    // ------------------------------------------------------------------ robe, under-skirt, cape
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
    // The robe opens in a V below the belt, showing the cream under-skirt.
    const openPoly = profile.polygon([
      [-0.026, 0.236],
      [0.026, 0.236],
      [0.085, 0.08],
      [-0.085, 0.08],
    ]);
    const wedge = (p: ReturnType<typeof profile.polygon>) => sdf.extrude(p, 0.5).at(0, 0, 0.25);
    const opening = wedge(openPoly);
    const folds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(z, x) * 9) * Math.min(1, Math.max(0, (0.27 - y) / 0.1));
    const foldDark = rgb(T.clothDark);
    const robe = robeShape
      .displace(0.004, folds)
      .subtract(opening)
      .paintFn((x, y, z, base) => (y < 0.27 && folds(x, y, z) < -0.55 ? foldDark : base));
    const above = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, -1, 0], -y));
    const below = (sh: sdf.Shape, y: number) => sh.intersect(sdf.halfSpace([0, 1, 0], y));
    k.body('robe', sdf.union(above(robe, 0.25).bone('spine'), below(robe, 0.25).bone('skirt')), { color: T.cloth, roughness: 0.8 });
    // The cream under-skirt shows through the opening and below the hem, over the boot tops.
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
    k.body('tunic', sdf.union(above(under, 0.25).bone('spine'), below(under, 0.25).bone('skirt'), legs), { color: C.cream, roughness: 0.85 });

    // The short teal cape: a rounded shell over the shoulders down to y 0.25, wide enough that its
    // front edges show past the shoulders; a gold-tan lining inside and a gold band on the edge.
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
        .displace(0.008, (x, y, z) => Math.sin(Math.atan2(z, x) * 6) * Math.min(1, Math.max(0, (0.42 - y) / 0.17)));
    const capeR = (y: number) => 0.2 + ((0.34 - 0.2) * (0.45 - y)) / 0.2;
    const liningC = rgb(T.lining);
    const capeShell = capeCone(0.2, 0.34, 0.45, 0.25)
      .subtract(capeCone(0.18, 0.32, 0.47, 0.23))
      .at(0, 0, -0.03)
      .intersect(sdf.halfSpace([0, 0, 1], 0.06));
    const cape = capeShell.paintFn((x, y, z, base) => (Math.hypot(x, (z + 0.03) / 0.85) < capeR(y) - 0.016 ? liningC : base));
    k.body('cape', cape.bone('cloak'), { color: T.cloth, roughness: 0.8 });
    const capeBand = capeShell
      .round(0.003)
      .intersect(sdf.union(sdf.box([1, 0.02, 1]).at(0, 0.26, 0), sdf.box([1, 1, 0.02]).at(0, 0.35, 0.05)))
      .bone('cloak');

    // ------------------------------------------------------------------ puffed sleeves
    const puff2 = (s: V3, e: V3, tagU: string) =>
      sdf.smoothUnion(
        0.02,
        sdf.ellipsoid([0.066, 0.058, 0.064]).at(...lerp(s, e, 0.2)).at(0, 0.012, 0),
        sdf.cone(lerp(s, e, 0.05), lerp(s, e, 0.42), 0.058, 0.05),
      ).bone(tagU);
    const sleeves = sdf.union(puff2(SHOULDER, ELBOW_L, 'upperarm.L'), puff2(mx(SHOULDER), ELBOW_R, 'upperarm.R'));
    k.body('sleeves', sleeves, { color: T.cloth, roughness: 0.8 });

    // ------------------------------------------------------------------ belt (leather)
    const beltY = 0.255;
    const belt = robeShape.round(0.01).smoothIntersect(0.006, sdf.box([0.5, 0.04, 0.5], 0.006).at(0, beltY, 0));
    // The belt tie: a knot at the right hip with two tails that hang over the skirt.
    const knotP = sdf.surfacePoint(belt, [-0.11, beltY, 0.3], 0.004);
    const tail = (x1: number, y1: number, x2: number, y2: number, r: number) => {
      const b = sdf.surfacePoint(robeShape, [x1, y1, 0.3], 0.008);
      const c = sdf.surfacePoint(robeShape, [x2, y2, 0.3], 0.008);
      return sdf.chain([[...knotP, r], [...b, r], [...c, r * 0.7]] as [number, number, number, number][], 0.008);
    };
    const tie = sdf.union(
      sdf.sphere(0.02).scale([1, 1, 0.8]).at(...knotP),
      tail(-0.13, 0.19, -0.15, 0.135, 0.013),
      tail(-0.09, 0.185, -0.1, 0.13, 0.012),
    );
    k.body('leather', sdf.union(belt.bone('spine'), tie.bone('spine')), { color: C.leather, roughness: 0.6 });

    // ------------------------------------------------------------------ boots
    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.05, 0.085, 0.02).at(0, 0.065, 0),
        sdf.ellipsoid([0.058, 0.052, 0.1]).at(0, 0.05, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootSolid = sdf.union(bootFoot, sdf.cylinder(0.058, 0.026, 0.01).at(0, 0.1, 0));
    const bootPose = (s: sdf.Shape, tag: string) => s.rotateY(12).at(ANKLE[0], 0, 0).bone(tag);
    const boot = bootPose(bootSolid.paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole), 'foot.L');
    k.body('boots', pair(boot), { color: T.boot, roughness: 0.6 });
    const toeCap = bootPose(
      bootSolid
        .round(0.004)
        .intersect(sdf.box([0.2, 0.05, 0.05]).at(0, 0.03, 0.14))
        .intersect(sdf.halfSpace([0, -1, 0], 0)),
      'foot.L',
    );

    // ------------------------------------------------------------------ gold: circlet, collar, trims
    const circletBand = head
      .round(0.012)
      .smoothIntersect(0.004, sdf.box([1, 0.018, 1]).at(0, 0.782, 0));
    const zBrow = faceZ(0, 0.8);
    const teardrop = (s: number, depth: number) => {
      const half: [number, number][] = [
        [0, 0.034],
        [0.009, 0.02],
        [0.019, 0.004],
        [0.021, -0.008],
        [0.014, -0.02],
        [0.005, -0.026],
      ];
      const pts: [number, number][] = [...half, ...half.slice(1, -1).reverse().map(([x, y]): [number, number] => [-x, y])].map(([x, y]) => [x * s, (y + 0.004) * s]);
      return sdf.extrude(profile.polygon(pts, { smooth: true, samples: 6 }), depth);
    };
    const gemAt = (s: sdf.Shape) => s.at(0, 0.812, zBrow + 0.004);
    const circletBezel = gemAt(teardrop(1.28, 0.026)).bone('head');
    const leaf = pair(sdf.cone([0.14, 0.86, 0.03], [0.176, 0.965, 0.0], 0.024, 0.004).round(0.002).bone('head'));
    // The collar: a soft gold ring at the neck with a setting for its gem.
    const robeZ = sdf.raycast(robeShape, [0, 0.43, 1], [0, 0, -1])![2];
    const collar = sdf
      .smoothUnion(
        0.008,
        sdf.torus(0.094, 0.015).scale([1.12, 1, 1.02]).rotateX(8).at(0, 0.447, -0.012),
        sdf.ellipsoid([0.026, 0.022, 0.012]).at(0, 0.426, robeZ + 0.004),
      )
      .bone('chest');
    // The belt clasp: a gold disc with a setting.
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const clasp = sdf.union(
      sdf.cylinder(0.03, 0.01, 0.004).rotateX(90).at(0, beltY, beltZ + 0.004),
      sdf.torus(0.02, 0.005).rotateX(90).at(0, beltY, beltZ + 0.012),
    ).bone('spine');
    // The robe edges: a gold hem band, gold edges along the opening, a gold hem on the under-skirt.
    const robeOut = robeShape.round(0.006);
    const ring = wedge(profile.offsetProfile(openPoly, 0.014)).subtract(opening);
    const robeTrim = sdf.union(
      robeOut.intersect(sdf.halfSpace([0, 1, 0], 0.124)),
      robeOut.intersect(ring).intersect(sdf.halfSpace([0, 1, 0], 0.25)),
    );
    const underTrim = under.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.088));
    // Small cuffs on the puffed sleeves.
    const cuffAt = (s: V3, e: V3, tag: string) => sdf.cone(lerp(s, e, 0.4), lerp(s, e, 0.47), 0.056, 0.056).round(0.002).bone(tag);
    // The staff's gold knob and collar, the chevrons on the under-skirt, and the cape's edge band.
    const chevron = (y: number) =>
      under
        .round(0.004)
        .intersect(
          sdf
            .extrude(
              profile.polygon([
                [-0.07, y + 0.03],
                [-0.07, y + 0.042],
                [0, y + 0.012],
                [0.07, y + 0.042],
                [0.07, y + 0.03],
                [0, y],
              ]),
              0.6,
            )
            .at(0, 0, 0.3),
        );
    const chevrons = sdf.union(chevron(0.2), chevron(0.165), chevron(0.13)).bone('skirt');
    const gold = sdf.union(
      circletBand.bone('head'),
      circletBezel,
      leaf,
      collar,
      clasp,
      below(robeTrim, 0.25).bone('skirt'),
      below(underTrim, 0.25).bone('skirt'),
      cuffAt(SHOULDER, ELBOW_L, 'upperarm.L'),
      cuffAt(mx(SHOULDER), ELBOW_R, 'upperarm.R'),
      pair(toeCap),
      chevrons,
      capeBand,
    );
    k.body('gold', gold, { color: C.gold, roughness: 0.4, metalness: 0.7, detail: 0.004 });

    // The gems: pink teardrop on the brow, one in the collar, one in the belt clasp.
    const gemHead = gemAt(teardrop(1.0, 0.032)).bone('head');
    const gemCollar = sdf.sphere(0.014).scale([1.1, 1, 0.6]).at(0, 0.426, robeZ + 0.014).bone('spine');
    const gemBelt = sdf.sphere(0.015).scale([1.2, 1.2, 0.6]).at(0, beltY, beltZ + 0.017).bone('spine');
    k.body('gems', sdf.union(gemHead, gemCollar, gemBelt), {
      color: C.gemBase,
      roughness: 0.15,
      emissive: C.gem,
      emissiveIntensity: 0.8,
      flat: true,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ the staff (walnut, gold knob)
    addPart(k, enchanterStaff(), { pose: (s) => s.at(...STAFF_MOUNT) });

    // ------------------------------------------------------------------ the scroll and its flame
    addPart(k, enchanterScroll(), { pose: scrollPose });
    addPart(k, enchanterScrollFlame(), { pose: (s) => s.at(...FLAME_MOUNT) });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const ease = smooth;
    const flicker = (p: number) => ({
      orb: { scale: [1 + 0.07 * wave(p, 7), 1 + 0.12 * wave(p, 5, 0.2), 1 + 0.07 * wave(p, 7, 0.4)] as const },
    });

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        ...flicker(p),
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] },
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        skirt: { rotate: [1.5 * wave(p, 1, 0.2), 0, 0] },
        // The scroll hand lifts a little, as if weighing the scroll.
        'forearm.L': { rotate: [-3 * bump(p), 0, 0] },
        'upperarm.R': { rotate: [1.5 * wave(p, 1, 0.1), 0, 0] },
      }),
    });

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
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.3 * s, 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.25 * s, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.6, 0.006, 28, 3, 6));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.4, 0.025, 50, 12, 22));

    // Posing by targets (see the mage): the wrists follow keys in the chest's rest frame.
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

    // attack: a scroll flourish. The scroll hand dips back and low, then sweeps up and out in front
    // of him; the strip rides up and the sparks flare into a burst, then settle.
    k.animation('attack', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const gather = ease(0.02, 0.3, p) * (1 - ease(0.42, 0.5, p));
        const cast = ease(0.42, 0.52, p) * (1 - ease(0.72, 1, p));
        const hold = ease(0.02, 0.3, p) * (1 - ease(0.72, 1, p));
        const wristL = keys(
          p,
          [
            [0, WRIST_L],
            [0.3, [0.26, 0.32, 0.03]],
            [0.5, [0.37, 0.39, 0.2]],
            [0.7, [0.37, 0.39, 0.2]],
            [1, WRIST_L],
          ] as const,
          'spline',
        );
        const dirL = keys(
          p,
          [
            [0, PALM.dir],
            [0.3, norm(add(PALM.dir, [0, -0.25, -0.1]))],
            [0.5, norm(add(PALM.dir, [0.1, 0.15, 0.3]))],
            [0.7, norm(add(PALM.dir, [0.1, 0.15, 0.3]))],
            [1, PALM.dir],
          ] as const,
          'spline',
        );
        const sparksK = keys(p, [[0, 1], [0.3, 0.8], [0.44, 1], [0.52, 1.35], [0.6, 1.25], [0.78, 1.1], [1, 1]] as const);
        return {
          ...wandPose(lerp(WRIST_R, [-0.26, 0.4, 0.03], hold), lerp(WAND_AXIS, norm([-0.35, 0.9, 0.05]), hold)),
          ...palmPose(wristL, dirL, PALM.up),
          orb: { scale: [sparksK, sparksK, sparksK] },
          hips: {
            move: [0, -legDrop(LEG, 14 * cast) - 0.005 * cast, 0.025 * cast - 0.01 * gather],
            rotate: [0, 12 * gather - 10 * cast, 0],
          },
          skirt: { rotate: [-3 * gather + 6 * cast, -6 * gather + 6 * cast, 0] },
          spine: { rotate: [-5 * gather + 9 * cast, 0, 0] },
          chest: { rotate: [-3 * gather + 5 * cast, 12 * gather - 12 * cast, 0] },
          head: { rotate: [4 * gather - 4 * cast, -6 * gather + 4 * cast, 0] },
          cloak: { rotate: [4 * gather + 14 * cast, 0, 0] },
          'leg.L': { rotate: [2 * gather - 16 * cast, 0, 0] },
          'leg.R': { rotate: [-2 * gather + 10 * cast, 0, 0] },
          'foot.L': { rotate: [10 * cast, 0, 0] },
          'foot.R': { rotate: [-5 * cast, 0, 0] },
        };
      },
    });

    // attack2: a wand point. He draws the wand back beside him (out and low), holds, then thrusts it
    // forward to point at the target; the sparks pulse with the cast.
    k.animation('attack2', {
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
          'spline',
        );
        const gather = ease(0.02, 0.28, p) * (1 - ease(0.42, 0.5, p));
        const cast = ease(0.42, 0.52, p) * (1 - ease(0.7, 1, p));
        const pulse = keys(p, [[0, 1], [0.4, 1.1], [0.52, 2.0], [0.62, 1.7], [0.86, 1]] as const);
        return {
          ...wandPose(wrist, dir, up),
          ...palmPose(lerp(WRIST_L, [0.26, 0.34, 0.05], 0.8 * gather + 0.4 * cast), PALM.dir, PALM.up),
          orb: { scale: [pulse, pulse, pulse] },
          hips: {
            move: [0, -legDrop(LEG, 14 * cast) - 0.005 * cast, 0.025 * cast - 0.01 * gather],
            rotate: [0, -12 * gather + 10 * cast, 0],
          },
          skirt: { rotate: [-3 * gather + 6 * cast, 6 * gather - 6 * cast, 0] },
          spine: { rotate: [-5 * gather + 9 * cast, 0, 0] },
          chest: { rotate: [-3 * gather + 5 * cast, -14 * gather + 12 * cast, 0] },
          head: { rotate: [4 * gather - 6 * cast, 12 * gather - 12 * cast, 0] },
          cloak: { rotate: [4 * gather + 14 * cast, 0, 0] },
          'leg.L': { rotate: [2 * gather - 16 * cast, 0, 0] },
          'leg.R': { rotate: [-2 * gather + 10 * cast, 0, 0] },
          'foot.L': { rotate: [10 * cast, 0, 0] },
          'foot.R': { rotate: [-5 * cast, 0, 0] },
        };
      },
    });

    // hit: the head and chest snap back, a small step back, the wand tips out, the sparks gutter.
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
          cloak: { rotate: [-8 * h, 0, 0] },
          'upperarm.L': { rotate: [-8 * h, 0, 10 * h] },
          'leg.R': { rotate: [10 * h, 0, 0] },
          'leg.L': { rotate: [-6 * h, 0, 0] },
          'foot.R': { rotate: [-10 * h, 0, 0] },
          'foot.L': { rotate: [6 * h, 0, 0] },
        };
      },
    });

    // death (the mage's fall): a stagger, then he falls flat on his back; the sparks go out and the
    // wand drops beside his right side. The hips drop below the floor on purpose: the build lifts
    // the body until it rests on the floor.
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const stagger = ease(0, 0.22, p) * (1 - ease(0.3, 0.45, p));
        const fall = ease(0.26, 0.7, p);
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.16)));
        const out = 1 - 0.95 * ease(0.3, 0.6, p);
        const drop = ease(0.45, 0.72, p);
        const leg = 30 * bump(fall) + 6 * fall;
        const flat = ease(0.4, 0.68, p);
        const hipsMove: V3 = [0, -0.14 * drop + 0.012 * land + 0.006 * stagger, -0.04 * stagger - 0.08 * fall];
        const bend = [-76 * fall - 4 * stagger, -6 * stagger, -4 * stagger, -5 * fall, -16 * stagger - 14 * fall];
        return {
          ...wandPose(
            keys(p, [[0, WRIST_R], [0.3, [-0.27, 0.34, 0.1]], [0.66, [-0.26, 0.34, -0.09]]] as const),
            keys(p, [[0, WAND_AXIS], [0.3, norm([-0.3, 0.75, 0.6])], [0.5, norm([-0.2, -0.2, 0.96])], [0.66, norm([-0.15, -1, 0.3])]] as const),
            keys(p, [[0, [0, 0, 1]], [0.3, [-1, 0, 0]], [0.66, [-1, 0, 0]]] as const),
            [-0.3, 0.2, -0.4],
          ),
          ...palmPose(lerp(WRIST_L, [0.33, 0.32, 0.0], ease(0.2, 0.66, p)), PALM.dir, lerp(PALM.up, [0, 0.3, 1], ease(0.2, 0.62, p)), [0.3, 0.2, -0.4]),
          orb: { scale: [out, out, out] },
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

    // victory (the mage's hop): a crouch, a push-off, a hop of about 8 cm, and a landing the knees
    // absorb. In the push-off he raises the wand up and out to his right; the scroll hand lifts
    // out to his left and the sparks flare.
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
        const wandWrist = add(lerp(WRIST_R, [-0.36, 0.42, 0.12], up), [0, 0.02 * pump, 0]);
        const scrollWrist = keys(p, [[0, WRIST_L], [0.16, [0.26, 0.35, 0.09]], [0.4, [0.3, 0.44, 0.12]]] as const);
        return {
          ...wandPose(wandWrist, lerp(WAND_AXIS, norm([-0.45, 0.88, 0.08]), up)),
          ...palmPose(add(scrollWrist, [0, 0.02 * pump, 0]), PALM.dir, PALM.up),
          orb: { scale: [f, f, f] },
          hips: { move: hips.move },
          skirt: { rotate: [-7 * bend - 5 * air + 3 * pump, 0, 0] },
          spine: { rotate: [8 * bend - 3 * air - 5 * up, 0, 0] },
          chest: { rotate: [4 * bend - 4 * up - 3 * pump, 5 * up, 0] },
          head: { rotate: [-4 * bend - 8 * up, 6 * up, 4 * up] },
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
    void sub;
  },
});
