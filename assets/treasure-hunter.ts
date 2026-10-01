import { treasureHunterHat } from './parts/treasure-hunter-hat.js';
import { treasureHunterTorch } from './parts/treasure-hunter-torch.js';
import { treasureHunterWhip } from './parts/treasure-hunter-whip.js';
import { addPart, defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Treasure hunter — Chibi Quest hero (catalog `heroes/support/treasure-hunter`), about 1.02 m to the
 * top of the hat, faces +Z. Target: docs/hero-mockups/treasure-hunter_001.jpg (one front view).
 * Built on the adventurer (the rogue's head and chibi skeleton with knees), so the heroes read as
 * one set.
 *
 * Role: player hero (support), seen in 3D and as a 128 px sprite; the fedora, the grin, the gold
 *   idol, and the torch flame must read small.
 * One idea: a grinning kid under a huge brown fedora, a golden idol held up in one fist and a
 *   lit torch in the other, a coiled whip at the hip: ready to loot a temple.
 * Proportions: hat top 1.0, brim 0.81 (r 0.30, crown r 0.19), eyes 0.63, chin 0.48, shoulders
 *   0.385, belt 0.245, boot tops 0.125.
 * Shape language: round and soft (face, curls, boots, satchel) with the wide flat brim, the idol's
 *   fan headdress, and the flame as the pointed accents.
 * Palette (60/30/10): brown leather jacket #7a4a2c and hat #8a5a35 (dark 60), cream shirt #ece0c4
 *   (light 30), grey-green trousers #6e7560; rust scarf #b85a3a as the accent at the focal point
 *   under the face; gold idol and buckle, orange flame as the small bright accents.
 * Value plan: the dark curls and the hat frame the light face; the cream shirt stands out from
 *   the dark jacket and belt; the flame is the brightest spot.
 * Bodies: skin, hair, hat, hat-band, shirt, jacket, scarf, trousers, leather, satchel, buckle,
 *   whip-coil, whip-lash, boots, idol, torch, torch-wrap, torch-head, flame.
 * Rig: the adventurer's chibi skeleton plus `whip` and whip1 to whip6 (the lash); the idol is
 *   rigid on the right hand, the torch on the left hand. Clips: idle, walk, run, attack (a whip
 *   crack: the lash uncoils forward and snaps back), attack2 (a lunging torch swing), hit, death,
 *   victory (a crouch and a jump with the idol and the torch thrust up).
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#6e4020',
  irisLow: '#b07a34',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#1e140d',
  mouth: '#7a2a2a',
  teeth: '#fbf5ee',
  tongue: '#e0706a',
  hair: '#2e1e14',
  hairLight: '#4e3626',
  hairDark: '#140c08',
  hat: '#8a5a35',
  hatBand: '#6b4226',
  hatLight: '#a16a40',
  scarf: '#b85a3a',
  scarfDark: '#8a3c24',
  shirt: '#ece0c4',
  shirtShade: '#cdbd98',
  jacket: '#7a4a2c',
  seam: '#5a3418',
  leather: '#6b4226',
  belt: '#4e2d1c',
  gold: '#e0b040',
  idol: '#d9b24c',
  idolDark: '#a07a20',
  whip: '#4a2e1c',
  whipDark: '#3e2616',
  trousers: '#6e7560',
  boot: '#5a3a24',
  bootDark: '#3e2616',
  sole: '#2e1c12',
  torch: '#6b4226',
  wrap: '#c8a870',
  torchHead: '#5a2a05',
  flame: '#f0a030',
  flameGlow: '#ff8a20',
  flameCore: '#ffe060',
  cloth: '#2a160a',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => scl(a, 1 / Math.hypot(a[0], a[1], a[2]));
const along = (p: V3, d: V3, s: number): V3 => add(p, scl(d, s));
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** `b` without its component along the unit vector `a`, normalized. */
const perp = (b: V3, a: V3): V3 => norm(sub(b, scl(a, dot(a, b))));
/** Places a shape built in a local frame: local X, Y, Z go to `ex`, `ey`, `ez`; the origin to `p`. */
const frame = (s: sdf.Shape, ex: V3, ey: V3, ez: V3, p: V3) => s.transform([...ex, 0, ...ey, 0, ...ez, 0, ...p, 1]);

// Joints: the rogue's shoulders and legs. Both forearms hang a little forward, each fist around a
// shaft that stands up (the idol in the right hand, the torch in the left).
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.18, 0.332, 0.012];
const WRIST: V3 = [0.205, 0.238, 0.03];
const ELBOW_R: V3 = [-0.18, 0.332, 0.0];
const WRIST_R: V3 = [-0.2, 0.236, 0.025];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)

/** A frame from an up direction and a forward hint: local X, Y, Z go to the returned axes. */
const axes = (up: V3, forward: V3): { ex: V3; ey: V3; ez: V3 } => {
  const ey = norm(up);
  const ez = perp(forward, ey);
  return { ex: cross(ey, ez), ey, ez };
};
// The idol stands on a rod in the right fist, leaning out a little, facing forward.
const FIST_R = along(WRIST_R, norm(sub(WRIST_R, ELBOW_R)), 0.04);
const IDOL_DIR = norm([-0.3, 1, 0.05]);
const IDOL_FACE = perp([0.1, 0, 1], IDOL_DIR);
const idolAxes = axes(IDOL_DIR, IDOL_FACE);
const idolPose = (s: sdf.Shape) => frame(s.scale(1.45), idolAxes.ex, idolAxes.ey, idolAxes.ez, FIST_R);
// The torch stands in the left fist, leaning out, the flame on top.
const FIST_L = along(WRIST, norm(sub(WRIST, ELBOW)), 0.04);
const TORCH_DIR = norm([0.24, 1, 0.08]);
const TORCH_FACE = perp([0, 0, 1], TORCH_DIR);
const torchAxes = axes(TORCH_DIR, TORCH_FACE);
const torchPose = (s: sdf.Shape) => frame(s.scale(1.25), torchAxes.ex, torchAxes.ey, torchAxes.ez, FIST_L);

/** A fist closed around a grip through `g` along the unit axis `a`, entered from the wrist `w`. */
const fistAround = (g: V3, a: V3, w: V3) => {
  const toW = perp(sub(w, g), a);
  const side = cross(a, toW);
  const o = (u: number, v: number, s: number): V3 => add(add(add(g, scl(a, u)), scl(toW, v)), scl(side, s));
  return sdf.smoothUnion(
    0.012,
    sdf.capsule(o(0.012, 0.006, 0), o(-0.01, 0.006, 0), 0.034), // the palm around the grip
    sdf.capsule(o(0.016, -0.018, 0.004), o(-0.016, -0.018, 0.004), 0.02), // the finger roll
    sdf.cone(o(0.004, 0.012, 0.026), o(0.02, -0.004, 0.024), 0.015, 0.012), // the thumb over the grip
  );
};

export default defineAsset({
  name: 'treasure-hunter',
  description:
    'Chibi treasure hunter hero in a brown fedora with dark curls, a leather jacket over a cream shirt, a rust scarf, a whip at the hip, a golden idol in one hand and a lit torch in the other.',
  detail: 0.006,
  reference: 'docs/hero-mockups/treasure-hunter_001.jpg',
  // Color slots for individual hunters (the first option is the default look). The skin options
  // are the rogue's, so the heroes share one set of skin tones.
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { black: C.hair, brown: '#4a2e1c', blond: '#c4974a' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    clothing: { rust: C.scarf, teal: '#3f8a8a', olive: '#7a7a48' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'black', skin: 'fair', clothing: 'rust' },
    teal: { eyes: 'green', hair: 'brown', skin: 'tan', clothing: 'teal' },
    olive: { eyes: 'blue', hair: 'blond', skin: 'brown', clothing: 'olive' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot keep their exact default color and follow
    // the slot fully (follow: 1) when a game recolors the slot.
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairLight: k.tint('hair', { color: C.hairLight, follow: 1 }),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      scarf: k.tint('clothing'),
      scarfDark: k.tint('clothing', { color: C.scarfDark, follow: 1 }),
    };

    // The whip: a coil on the right hip (hanging from the belt, in front of the hip)
    // and a lash of six segments that hangs from it. Local frame of the coil: its axis along Z.
    const COIL_AT: V3 = [-0.099, 0.195, 0.125];
    const COIL_R = 0.05;
    const COIL_ANGLE = -29; // degrees about Y: the coil's axis points out and forward
    const coilPose = (s: sdf.Shape) => s.rotateY(COIL_ANGLE).at(...COIL_AT);
    const TAIL_D = norm([-0.2, -1, 0.14]);
    const SEG = 0.024;
    const TAIL_START: V3 = [COIL_AT[0] + 0.004, COIL_AT[1] - COIL_R + 0.004, COIL_AT[2]];
    const tailPts: V3[] = Array.from({ length: 7 }, (_, i) => along(TAIL_START, TAIL_D, SEG * i));

    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      whip: { parent: 'spine', at: COIL_AT, tail: TAIL_START },
      whip1: { parent: 'whip', at: tailPts[0]!, tail: tailPts[1]! },
      whip2: { parent: 'whip1', at: tailPts[1]!, tail: tailPts[2]! },
      whip3: { parent: 'whip2', at: tailPts[2]!, tail: tailPts[3]! },
      whip4: { parent: 'whip3', at: tailPts[3]!, tail: tailPts[4]! },
      whip5: { parent: 'whip4', at: tailPts[4]!, tail: tailPts[5]! },
      whip6: { parent: 'whip5', at: tailPts[5]!, tail: tailPts[6]! },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
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
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.024, 0.02, 0.018]).at(0, 0.572, faceZ(0, 0.572) - 0.002).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.034, 0.045, 0.036])
        .subtract(sdf.sphere(0.014).at(0.02, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.612, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.036, 0.032).bone('forearm.L'),
      fistAround(FIST_L, TORCH_DIR, WRIST).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      fistAround(FIST_R, IDOL_DIR, WRIST_R).bone('hand.R'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.054, 0.058, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.044, 0.05, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.038, 0.044, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.025, 0.028, 0.07]), EYE[0], EYE[1] - 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.052, 0.009, 20, 160), 0.3).at(EYE[0], EYE[1] - 0.006, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.013), x + 0.016, EYE[1] + 0.018),
        at(sdf.sphere(0.0065), x - 0.015, EYE[1] - 0.022),
      ]),
    );
    // Thick, arched, eager brows, well below the brim.
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.024, 60, 118), 0.3).at(0.102, 0.725 - 0.1, 0.1));
    // A closed grin: a thin curved line with a white row of teeth just under it.
    const MOUTH: V3 = [0, 0.596, 0.1];
    const mouth = sdf.extrude(profile.arc(0.06, 0.0085, 228, 312), 0.3).at(...MOUTH);
    const teeth = sdf.extrude(profile.arc(0.0672, 0.0075, 234, 306), 0.3).at(...MOUTH);
    const blush = pair(at(sdf.sphere(0.038), 0.142, 0.562));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(mouth, T.mouth)
      .paintWhere(teeth, C.teeth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ the fedora
    // Local frame: the brim's plane at y = 0 on the head's axis; tilted up 10 degrees at the front
    // and set on the head, so the brow and the eyes show below it. The brim (r 0.305) is 1.6 times
    // the crown's radius (0.19) and 0.024 thick.
    const BRIM_Y = 0.81;
    const hatPose = (s: sdf.Shape) => s.rotateX(-10).at(0, BRIM_Y, 0);
    addPart(k, treasureHunterHat(), { pose: hatPose });

    // ------------------------------------------------------------------ hair: dark curls under the brim
    // A cap under the brim, six round curls across the forehead, thick curled locks at the sides and
    // the back, and a curl in front of each ear. Everything stays below the brim's tilted plane.
    const DEG = Math.PI / 180;
    const faceMask = sdf.ellipsoid([0.235, 0.16, 0.22]).at(0, 0.61, 0.15);
    const volume0 = sdf.ellipsoid([HEAD[0] + 0.018, HEAD[1] + 0.018, HEAD[2] + 0.018]).at(0, HEAD_Y + 0.008, -0.01);
    const volume = volume0.smoothSubtract(0.015, faceMask).intersect(sdf.halfSpace([0, -1, 0.3], -0.66));
    const HC: V3 = [0, 0.7, -0.01];
    /** The point on the hair volume in direction (polar `th` from the top, azimuth `ph` from the front toward his left), lifted along the ray. */
    const hs = (th: number, ph: number, lift = 0): V3 => {
      const d: V3 = [Math.sin(th * DEG) * Math.sin(ph * DEG), Math.cos(th * DEG), Math.sin(th * DEG) * Math.cos(ph * DEG)];
      const hit = sdf.raycast(volume0, along(HC, d, 0.6), scl(d, -1))!;
      return along(hit, d, lift);
    };
    const up = (p: V3, dy: number): V3 => [p[0], p[1] + dy, p[2]];
    const curlEnd = (p: V3, r: number) => sdf.sphere(r).at(...p);
    const lockAt = (ph: number, i: number) => {
      const a = hs(66, ph - 6, -0.022);
      const b = hs(82, ph, 0.008);
      const c = up(hs(94, ph + 10, 0.028 + (i % 2) * 0.01), -0.004);
      const d = up(hs(102, ph + 20, 0.04 + (i % 2) * 0.008), -0.008);
      return sdf.smoothUnion(
        0.012,
        sdf.chain([[...a, 0.04], [...b, 0.036], [...c, 0.03], [...d, 0.026]], 0.012),
        curlEnd(d, 0.03),
      );
    };
    const locks = sdf.union(...[84, 112, 140, 168, 196, 224, 252, 280].map((ph, i) => lockAt(ph, i)));
    // Forehead curls under the brim.
    const fh = (x: number, y: number, lift: number): V3 => [x, y, faceZ(Math.abs(x), y) + lift];
    const bangs = sdf.union(
      ...[
        [-0.15, 0.775, 0.032],
        [-0.092, 0.787, 0.034],
        [-0.032, 0.78, 0.034],
        [0.03, 0.787, 0.034],
        [0.092, 0.777, 0.034],
        [0.15, 0.772, 0.032],
      ].map(([x, y, r], i) => {
        const p = fh(x!, y!, 0.004 - (i % 2) * 0.004);
        return sdf.ellipsoid([r!, r! * 0.85, r!]).at(...p);
      }),
    );
    const temple = pair(
      sdf.smoothUnion(
        0.02,
        sdf.cone([0.192, 0.76, 0.04], [0.196, 0.70, 0.06], 0.032, 0.026),
        sdf.sphere(0.03).at(0.196, 0.69, 0.064),
      ),
    );
    const hair = volume
      .smoothUnion(0.02, temple)
      .smoothUnion(0.014, locks.intersect(sdf.halfSpace([0, 1, -0.174], 0.795)), bangs.intersect(sdf.halfSpace([0, 1, -0.174], 0.795)))
      // Lighter tips on the curls (separating them from the dark cap) and a darker core.
      .paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 70, y * 70, z * 70, 2);
        const t = Math.min(1, Math.max(0, (n - 0.05) / 0.4)) * 0.7;
        const l = rgb(T.hairLight);
        return [base[0] + (l[0] - base[0]) * t, base[1] + (l[1] - base[1]) * t, base[2] + (l[2] - base[2]) * t];
      });
    k.body('hair', hair, { color: T.hair, roughness: 0.55, detail: 0.0048, bone: 'head' });

    // ------------------------------------------------------------------ shirt, jacket, trousers, scarf
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
    // Long cream sleeves to the wrist, each with a turned cuff.
    const sleeve = (s: V3, e: V3, w: V3, tagU: string, tagF: string) =>
      sdf.union(
        sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 1.02), 0.048, 0.045).bone(tagU),
        sdf
          .smoothUnion(
            0.01,
            sdf.cone(lerp(s, e, 0.98), lerp(e, w, 0.84), 0.045, 0.041),
            sdf.cone(lerp(e, w, 0.72), lerp(e, w, 0.9), 0.0445, 0.0445).round(0.005).paint(C.shirtShade),
          )
          .bone(tagF),
      );
    const shirt = sdf
      .union(torso.bone('spine'), sleeve(SHOULDER, ELBOW, WRIST, 'upperarm.L', 'forearm.L'), sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R'))
      .paintWhere(sdf.extrude(profile.rect([0.006, 0.2], 0.002), 0.4).at(0.0, 0.33, 0.2), C.shirtShade, 0.002);
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.85 });

    // The jacket: a shell over the torso and the upper arms, open at the front (a V) to show the
    // shirt, with a raised collar at the back and two lapels.
    const jacketTorso = torso
      .round(0.012)
      .intersect(sdf.halfSpace([0, -1, 0], -0.19))
      .subtract(
        sdf
          .extrude(
            profile.polygon([
              [-0.074, 0.52],
              [0.074, 0.52],
              [0.032, 0.245],
              [0.02, 0.18],
              [-0.02, 0.18],
              [-0.032, 0.245],
            ]),
            0.3,
          )
          .at(0, 0, 0.18),
      );
    const jSleeve = (s: V3, e: V3, tag: string) =>
      sdf
        .smoothUnion(
          0.01,
          sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 1.0), 0.056, 0.053),
          sdf.cone(lerp(s, e, 0.86), lerp(s, e, 1.08), 0.0565, 0.0565).round(0.004).paint(C.seam), // cuff seam
        )
        .bone(tag);
    const collar = sdf
      .revolve(
        profile.polygon(
          [
            [0.085, 0.522],
            [0.115, 0.514],
            [0.148, 0.478],
            [0.155, 0.43],
            [0.13, 0.42],
            [0.1, 0.458],
            [0.09, 0.492],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9])
      .intersect(sdf.halfSpace([0, 0, 1], 0.045));
    const lapel = (s: 1 | -1) =>
      sdf
        .box([0.046, 0.15, 0.02], 0.009)
        .rotateZ(s * -10)
        .rotateY(s * 12)
        .at(s * 0.074, 0.385, 0.108);
    const jacket = sdf
      .union(
        sdf.smoothUnion(0.01, jacketTorso, collar, lapel(1), lapel(-1)).bone('spine'),
        jSleeve(SHOULDER, ELBOW, 'upperarm.L'),
        jSleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'),
      )
      // Seams: the hem, and one stitch line along the shoulder.
      .paintFn((x, y, z, base) => (y < 0.205 && Math.abs(x) < 0.2 ? rgb(C.seam) : base));
    k.body('jacket', jacket, {
      color: C.jacket,
      roughness: 0.6,
      bump: (x, y, z) => 0.0009 * noise.fbm(x * 100, y * 100, z * 100, 2),
    });

    const trousers = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.055, 0.088]).at(0, 0.205, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.1, 0.004], 0.05).bone('leg.L')),
    );
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.85 });

    // The scarf: a thick rolled ring at the neck with one tail down the front.
    const scarfRing = sdf.torus(0.1, 0.045).scale([1.05, 1, 0.98]).at(0, 0.452, 0.0);
    const scarfTip = torso
      .round(0.016)
      .subtract(torso.round(-0.002))
      .intersect(
        sdf
          .extrude(
            profile.polygon([
              [-0.11, 0.47],
              [0.02, 0.47],
              [0.05, 0.4],
              [0.03, 0.335],
              [0.0, 0.32],
              [-0.03, 0.34],
              [-0.07, 0.4],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      );
    const scarf = sdf
      .smoothUnion(0.012, scarfRing, scarfTip)
      .paintFn((x, y, z, base) => (Math.abs(y - 0.474) < 0.0028 || Math.abs(y - 0.43) < 0.0028 || Math.abs(Math.sin(Math.atan2(z, x) * 7 + y * 40) - 0.95) < 0.04 ? rgb(T.scarfDark) : base));
    k.body('scarf', scarf.bone('chest'), { color: T.scarf, roughness: 0.8 });

    // ------------------------------------------------------------------ leather: cross strap, belt, buckle, satchel, whip
    const crossStrap = torso
      .round(0.02)
      .smoothIntersect(0.005, sdf.box([0.036, 0.62, 0.8], 0.006).rotateZ(-45.7).at(-0.0175, 0.32, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.2))
      .intersect(sdf.halfSpace([0, 1, 0], 0.46));
    const beltY = 0.245;
    const belt = torso.round(0.02).smoothIntersect(0.006, sdf.box([0.5, 0.05, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), { color: C.belt, roughness: 0.6 });
    const SATCHEL: V3 = [-0.152, 0.163, -0.04];
    const satchelBody = sdf
      .union(
        sdf.box([0.042, 0.082, 0.086], 0.013),
        sdf.box([0.048, 0.04, 0.09], 0.012).at(0, 0.03, 0).paint(C.belt), // the flap
      )
      .rotateY(-30)
      .at(...SATCHEL);
    k.body('leather', sdf.union(crossStrap, satchelBody).bone('spine'), {
      color: C.leather,
      roughness: 0.6,
      bump: (x, y, z) => 0.0007 * noise.fbm(x * 120, y * 120, z * 120, 2),
    });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.torus(0.026, 0.0085).rotateX(90), sdf.capsule([-0.022, 0, 0], [0.022, 0, 0], 0.0055).at(0, 0, 0))
      .at(0, beltY, beltZ + 0.004);
    k.body('buckle', buckle.bone('spine'), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.004 });

    // The whip: a three-turn coil on the belt (rigid on the `whip` bone) and a lash of six
    // segments that hang from it, each on its own bone.
    const whipPart = treasureHunterWhip();
    addPart(k, { ...whipPart, bodies: whipPart.bodies.filter((b) => b.name !== 'whip-lash') }, { pose: coilPose });
    addPart(k, { ...whipPart, bodies: whipPart.bodies.filter((b) => b.name === 'whip-lash') });

    // ------------------------------------------------------------------ boots
    // A foot with a tall shaft and a turned-down cuff: the trousers are tucked in.
    const shoeFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.05, 0.075, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const shaft = sdf.cylinder(0.0575, 0.078, 0.014).at(0, 0.087, 0);
    const cuffRing = sdf.torus(0.0575, 0.0105).at(0, 0.121, 0);
    const boot = sdf
      .smoothUnion(0.012, shoeFoot, shaft, cuffRing)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .paintFn((x, y, z, base) => (y > 0.108 && y < 0.14 ? rgb(C.bootDark) : base))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the golden idol in the right fist
    // Local frame: the grip center at the origin, the shaft along +Y, the idol's face toward +Z.
    // A rod with a pommel, and on top a squat figure with a round head and a fan headdress.
    const eyeSlots = sdf.union(sdf.box([0.011, 0.0055, 0.014], 0.0015).at(0.0125, 0.104, 0.02), sdf.box([0.011, 0.0055, 0.014], 0.0015).at(-0.0125, 0.104, 0.02));
    const mouthSlot = sdf.box([0.026, 0.0055, 0.014], 0.0015).at(0, 0.07, 0.02);
    const browLine = sdf.box([0.034, 0.0035, 0.014], 0.001).at(0, 0.118, 0.02);
    const idol = sdf
      .union(
        sdf.cylinder(0.0115, 0.11, 0.004).at(0, -0.005, 0).paint(C.idolDark), // the short handle and the stem
        sdf.torus(0.0135, 0.006).at(0, 0.046, 0).paint(C.idolDark),
        sdf.sphere(0.0145).at(0, -0.062, 0).paint(C.idolDark),
        sdf.box([0.05, 0.08, 0.04], 0.012).at(0, 0.09, 0).subtract(eyeSlots, mouthSlot, browLine),
        sdf.sphere(0.012).at(0, 0.139, 0), // the knob on top
        hard(sdf.sphere(0.0075).at(0.03, 0.108, 0)),
        hard(sdf.sphere(0.0075).at(0.03, 0.072, 0)),
      )
      // The carved lines are darker gold.
      .paintWhere(sdf.union(eyeSlots.round(0.002), mouthSlot.round(0.002), browLine.round(0.002)), C.idolDark, 0.002);
    k.body('idol', idolPose(idol), {
      color: C.idol,
      roughness: 0.4,
      metalness: 0.8,
      detail: 0.004,
      bone: 'hand.R',
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 160, y * 160, z * 160, 2),
    });

    // ------------------------------------------------------------------ the torch in the left fist
    // Local frame: the grip center at the origin, the stick along +Y. A wrapped stick, a dark cup,
    // and a flame of three tongues (orange, emissive).
    addPart(k, treasureHunterTorch(), { pose: torchPose });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const IDOL = { dir: IDOL_DIR, up: IDOL_FACE };
    const TORCH = { dir: TORCH_DIR, up: TORCH_FACE };
    type P = Record<string, { rotate?: V3; move?: V3; scale?: V3 }>;
    /** The right arm: the wrist at `wrist`, the idol's shaft along `dir`. */
    const armIdol = (wrist: V3, dir: V3, pole: V3 = [-0.5, 0.25, -0.35]) => {
      const arm = reach(ARM_R, wrist, pole);
      return { upper: arm.upper, lower: arm.lower, hand: orient([arm.upper, arm.lower], IDOL, { dir: norm(dir), up: IDOL_FACE }) };
    };
    /** The left arm: the wrist at `wrist`, the torch's stick along `dir`. */
    const armTorch = (wrist: V3, dir: V3, pole: V3 = [0.5, 0.3, -0.3]) => {
      const arm = reach(ARM_L, wrist, pole);
      return { upper: arm.upper, lower: arm.lower, hand: orient([arm.upper, arm.lower], TORCH, { dir: norm(dir), up: TORCH_FACE }) };
    };
    /** The whip's bones: the coil bone aims the lash along `dir`; segment `i` bends by `bends[i]` degrees; `stretch` lengthens the lash. */
    const WHIP_REST = { dir: TAIL_D, up: [0, 0, 1] as V3 };
    const whipBones = (dir: V3, bends: readonly number[], stretch = 1): P => {
      const d = norm(dir);
      const out: P = { whip: { rotate: orient([], WHIP_REST, { dir: d, up: perp([0, 0, 1], d) }) } };
      bends.forEach((b, i) => {
        out[`whip${i + 1}`] = { rotate: [b, 0, 0], ...(i === 0 && stretch !== 1 ? { scale: [1, stretch, 1] as V3 } : {}) };
      });
      return out;
    };
    const idleWhip = (amp: number, p: number, cycles = 1): P => {
      const swing = wave(p, cycles, 0.2);
      return whipBones(lerp(TAIL_D, [0.3, -0.9, 0.1], 0), [0, 1, 2, 3, 4, 5].map((i) => amp * swing * (0.6 + 0.3 * i)));
    };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        ...idleWhip(2, p),
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -5 - 3 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        // The idol bobs a little, as if he is showing it off.
        'hand.R': { rotate: [-2 * bump(p, 1, 0.2), 0, 0] },
        'hand.L': { rotate: [2 * wave(p, 2, 0.1), 0, 0] },
      }),
    });

    // The legs come from motion.gait: planted stance feet, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `lift` the swing height, `duty` the share of the
    // cycle a foot is down (a run has a flight between steps), `hop` the hips bob. The heel and
    // the toe are the ends of the boot's sole at y = 0.
    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, { // left heel strike at 0.25, with the left arm back
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [0.093, 0, -0.021],
          toe: [0.108, 0, 0.087],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          // The whip lash trails and swings a little after the steps.
          ...idleWhip(4 + lean * 0.8, p, 2),
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          // The idol arm swings less and keeps the idol up, clear of the ground.
          'upperarm.R': { rotate: [-armSwing * 0.35 * s, 0, -14] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.2 - armSwing * 0.1 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 28, 3, 0.006));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 46, 12, 0.03));


    // ---------------------------------------------------------------- attack: a whip crack
    // Wind-up: the chest turns away, the lash swings back and up behind the hip, the torch arm
    // lifts out to the side (clear of the lash's path), and the idol rises. Strike: the hips and
    // chest turn in, the right foot steps forward, and the lash whips out forward in a wave, each
    // segment bending a little after the one before it, while the coil unwinds (the lash
    // lengthens). Then it snaps back to the hip.
    const lashDir = (p: number) =>
      keys(
        p,
        [
          [0, TAIL_D],
          [0.14, norm([-0.6, -0.6, 0.2])],
          [0.3, norm([-0.95, 0.15, -0.1])],
          [0.4, norm([-0.95, 0.12, -0.05])],
          [0.47, norm([-0.45, 0.1, 0.88])],
          [0.62, norm([-0.5, 0.0, 0.85])],
          [0.78, norm([-0.4, -0.7, 0.3])],
          [1, TAIL_D],
        ] as const,
        'smooth',
      );
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0.02, 0.3, p) * (1 - ease(0.36, 0.44, p));
        const cut = ease(0.36, 0.48, p) * (1 - ease(0.66, 1, p));
        const out = ease(0.44, 0.5, p) * (1 - ease(0.7, 0.8, p)); // the lash is out straight
        // Each segment bends as the crack's wave passes it, then flutters and settles.
        const bends = [1, 2, 3, 4, 5, 6].map((i) => {
          const pass = Math.exp(-(((p - (0.46 + 0.02 * i)) / 0.035) ** 2));
          const flutter = Math.sin((p - 0.6) * 34 + i) * 10 * ease(0.56, 0.62, p) * (1 - ease(0.62, 0.92, p));
          return 12 * wind + 42 * pass * (i % 2 === 0 ? -1 : 1) * 0.6 + flutter;
        });
        const idol = armIdol(
          keys(p, [[0, WRIST_R], [0.3, [-0.27, 0.35, 0.03]], [0.72, [-0.27, 0.35, 0.03]], [1, WRIST_R]] as const),
          keys(p, [[0, IDOL_DIR], [0.3, norm([-0.6, 0.8, 0.05])], [0.72, norm([-0.6, 0.8, 0.05])], [1, IDOL_DIR]] as const),
        );
        const torch = armTorch(
          keys(p, [[0, WRIST], [0.3, [0.27, 0.4, 0.02]], [0.74, [0.27, 0.4, 0.02]], [1, WRIST]] as const),
          keys(p, [[0, TORCH_DIR], [0.3, norm([0.46, 0.88, 0.05])], [0.74, norm([0.46, 0.88, 0.05])], [1, TORCH_DIR]] as const),
        );
        // The right foot steps forward in the cut; the left foot stays planted.
        const step = ease(0.4, 0.52, p) * (1 - ease(0.7, 0.98, p));
        const hipsZ = -0.012 * wind + 0.03 * cut;
        const plant = (Math.asin(Math.max(-0.9, Math.min(0.9, hipsZ / 0.13))) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, Math.max(Math.abs(plant), 20 * step)) - 0.008 * wind, hipsZ], rotate: [0, -10 * wind + 10 * cut, 0] },
          spine: { rotate: [-3 * wind + 5 * cut, -6 * wind + 4 * cut, 0] },
          chest: { rotate: [-4 * wind + 3 * cut, -22 * wind + 18 * cut, 0] },
          head: { rotate: [-3 * wind + 3 * cut, 26 * wind - 22 * cut, 0] },
          ...whipBones(lashDir(p), bends, 1 + 1.5 * out),
          'upperarm.R': { rotate: idol.upper },
          'forearm.R': { rotate: idol.lower },
          'hand.R': { rotate: idol.hand },
          'upperarm.L': { rotate: torch.upper },
          'forearm.L': { rotate: torch.lower },
          'hand.L': { rotate: torch.hand },
          'leg.L': { rotate: [plant, 12 * wind - 14 * cut, 0] },
          'leg.R': { rotate: [plant - 26 * step, 12 * wind - 14 * cut, 0] },
          'foot.L': { rotate: [-plant * 0.5, 0, 0] },
          'foot.R': { rotate: [20 * step - 20 * bump(Math.min(1, Math.max(0, (p - 0.4) / 0.14)) * 0.5), 0, 0] },
        } as P;
      },
    });

    // ---------------------------------------------------------------- legs on the knees
    // A planted leg reaches from the hip through the knee to an ankle target in the hips' rest
    // frame (so it moves against the hips), and the foot takes the opposite turn: `pitch` > 0
    // points the toes down, < 0 lifts them. `yaw` is the hips' turn about Y; the foot then turns
    // back by it, so it keeps pointing to world +Z.
    const FLAT_FOOT = { dir: [0, 0, 1] as V3, up: [0, 1, 0] as V3 };
    const legTo = (side: 1 | -1, ankle: V3, pitch: number, yaw = 0) => {
      const m = (v: V3): V3 => (side > 0 ? v : mx(v));
      const a = (pitch * Math.PI) / 180;
      const c = Math.cos(-yaw * DEG), s = Math.sin(-yaw * DEG);
      const want = { dir: [Math.cos(a) * s, -Math.sin(a), Math.cos(a) * c] as V3, up: [Math.sin(a) * s, Math.cos(a), Math.sin(a) * c] as V3 };
      if (Math.hypot(ankle[0] - ANKLE[0], ankle[1] - ANKLE[1], ankle[2] - ANKLE[2]) < 1e-6) {
        return { leg: [0, 0, 0] as V3, shin: [0, 0, 0] as V3, foot: orient([], FLAT_FOOT, want) };
      }
      const { upper, lower } = reach({ root: m(HIP), mid: m(KNEE), end: m(ANKLE) }, m(ankle), m([KNEE[0], KNEE[1], 0.3]));
      return { leg: upper, shin: lower, foot: orient([upper, lower], FLAT_FOOT, want) };
    };
    // A world point into the hips' rest frame, for hips that move by `move` and turn by `yaw`
    // degrees about their vertical axis (x = z = 0).
    const intoHips = (w: V3, move: V3, yaw: number): V3 => {
      const c = Math.cos(-yaw * DEG), s = Math.sin(-yaw * DEG);
      const x = w[0] - move[0], z = w[2] - move[2];
      return [x * c + z * s, w[1] - move[1], -x * s + z * c];
    };


    // ---------------------------------------------------------------- attack2: a lunging torch swing
    // The torch goes back over the left shoulder (out to the side, clear of the head), then
    // swings down and forward in a wide arc with the flame leading, as the right foot lunges.
    // The legs: the right foot lifts, swings forward toes up, lands heel first 16.6 cm ahead, and
    // rolls flat around the planted heel. The hips drop 4 cm and move 11.3 cm forward, so the front
    // knee bends over the foot (the shin about vertical) and the rear leg straightens back while
    // its heel lifts around the planted toe. In the recovery the front foot steps back to its spot.
    // The sole's heel is 2.1 cm behind the ankle and its toe 8.7 cm ahead, both 7 cm below it.
    const STEP = 0.166;
    const SINK = 0.04;
    const HIPS_FWD = 0.113; // with the step and the sink, the rear leg is straight (99 percent of its length)
    const TOES_UP = -20; // the front foot's pitch at the heel strike
    const HEEL_LIFT = 7; // the rear foot's pitch around its toe at full extension
    const onHeel = (heelZ: number, pitch: number): [number, number] => {
      const a = pitch * DEG;
      return [ANKLE[1] * Math.cos(a) - 0.021 * Math.sin(a), heelZ + 0.021 * Math.cos(a) + ANKLE[1] * Math.sin(a)];
    };
    const onToe = (pitch: number): V3 => {
      const a = pitch * DEG;
      return [ANKLE[0], 0.087 * Math.sin(a) + ANKLE[1] * Math.cos(a), 0.087 * (1 - Math.cos(a)) + ANKLE[1] * Math.sin(a)];
    };
    const HEEL_AT = STEP - 0.021;
    const STRIKE = onHeel(HEEL_AT, TOES_UP);
    const frontFoot = (p: number): { at: V3; pitch: number } => {
      if (p < 0.47) {
        // Lift, carry forward with the toes coming up, and put the heel down.
        const s = Math.min(1, Math.max(0, (p - 0.36) / 0.11));
        const e = s * s * (3 - 2 * s);
        return { at: [-ANKLE[0], ANKLE[1] + (STRIKE[0] - ANKLE[1]) * e + 0.025 * Math.sin(Math.PI * s), STRIKE[1] * e], pitch: TOES_UP * e };
      }
      if (p < 0.68) {
        // Roll down onto the sole around the planted heel.
        const pitch = TOES_UP * (1 - ease(0.47, 0.53, p));
        const [y, z] = onHeel(HEEL_AT, pitch);
        return { at: [-ANKLE[0], y, z], pitch };
      }
      // Push off and step back to the rest spot.
      const s = Math.min(1, (p - 0.68) / 0.24);
      const e = s * s * (3 - 2 * s);
      return { at: [-ANKLE[0], ANKLE[1] + 0.02 * Math.sin(Math.PI * s), STEP * (1 - e)], pitch: 6 * Math.sin(Math.PI * s) };
    };
    k.animation('attack2', {
      duration: 0.75,
      loop: false,
      pose: (_t, p) => {
        const torch = armTorch(
          keys(p, [
            [0, WRIST],
            [0.3, [0.26, 0.45, -0.04]],
            [0.4, [0.26, 0.45, -0.04]],
            [0.46, [0.22, 0.4, 0.07]],
            [0.52, [0.14, 0.36, 0.165]],
            [0.64, [0.14, 0.36, 0.165]],
            [1, WRIST],
          ] as const, 'smooth'),
          keys(p, [
            [0, TORCH_DIR],
            [0.3, norm([0.6, 0.75, -0.35])],
            [0.4, norm([0.6, 0.75, -0.35])],
            [0.46, norm([0.55, 0.6, 0.35])],
            [0.52, norm([0.12, 0.5, 0.85])],
            [0.64, norm([0.12, 0.5, 0.85])],
            [1, TORCH_DIR],
          ] as const, 'smooth'),
          [0.5, 0.2, -0.3],
        );
        // The idol waves up and out, lifted in triumph.
        const idol = armIdol(
          keys(p, [[0, WRIST_R], [0.3, [-0.27, 0.35, -0.03]], [0.5, [-0.27, 0.36, 0.05]], [0.64, [-0.27, 0.36, 0.05]], [1, WRIST_R]] as const),
          keys(p, [[0, IDOL_DIR], [0.3, norm([-0.65, 0.75, 0.0])], [0.64, norm([-0.6, 0.78, 0.1])], [1, IDOL_DIR]] as const),
        );
        const coil = ease(0.02, 0.32, p) * (1 - ease(0.4, 0.5, p));
        const lunge = ease(0.4, 0.5, p) * (1 - ease(0.64, 1, p));
        // The body drive: the hips follow the step down and forward, then rise back in the recovery.
        const drive = ease(0.37, 0.53, p) * (1 - ease(0.66, 0.98, p));
        const move: V3 = [0, -0.012 * coil - SINK * drive, -0.015 * coil + HIPS_FWD * drive];
        // The hips turn only 4 deg into the lunge (the feet stay square); the spine takes the rest.
        const yaw = -14 * coil + 4 * drive;
        const front = frontFoot(p);
        const legR = legTo(-1, mx(intoHips(front.at, move, yaw)), front.pitch, yaw);
        const legL = legTo(1, intoHips(onToe(HEEL_LIFT * drive), move, yaw), HEEL_LIFT * drive, yaw);
        return {
          hips: { move, rotate: [0, yaw, 0] },
          spine: { rotate: [2 * coil + 12 * lunge, 6 * coil - 14 * lunge - 4 * drive, 0] },
          chest: { rotate: [-2 * coil + 4 * lunge, 14 * coil - 16 * lunge, 0] },
          head: { rotate: [-2 * coil - 10 * lunge, -26 * coil + 20 * lunge, 0] },
          ...whipBones(TAIL_D, [14 * lunge, 12 * lunge, 10 * lunge, 8 * lunge, 6 * lunge, 4 * lunge]),
          'upperarm.R': { rotate: idol.upper },
          'forearm.R': { rotate: idol.lower },
          'hand.R': { rotate: idol.hand },
          'upperarm.L': { rotate: torch.upper },
          'forearm.L': { rotate: torch.lower },
          'hand.L': { rotate: torch.hand },
          'leg.L': { rotate: legL.leg },
          'shin.L': { rotate: legL.shin },
          'foot.L': { rotate: legL.foot },
          'leg.R': { rotate: legR.leg },
          'shin.R': { rotate: legR.shin },
          'foot.R': { rotate: legR.foot },
        } as P;
      },
    });

    // ---------------------------------------------------------------- hit: snap back from a blow
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.18, 1], [0.35, 0.85], [1, 0]] as const);
        const back = -0.022 * h;
        const lean = (Math.asin(back / 0.13) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, lean), back], rotate: [0, 6 * h, 0] },
          spine: { rotate: [-8 * h, 0, 0] },
          chest: { rotate: [-10 * h, 8 * h, 4 * h] },
          head: { rotate: [-16 * h, -8 * h, -6 * h] },
          ...whipBones(TAIL_D, [-10 * h, -14 * h, -16 * h, -14 * h, -10 * h, -8 * h]),
          'leg.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean, 0, 0] },
          'foot.L': { rotate: [-lean, 0, 0] },
          'foot.R': { rotate: [-lean, 0, 0] },
          'upperarm.L': { rotate: [-4 * h, 0, -16 * h] },
          'upperarm.R': { rotate: [-4 * h, 0, 16 * h] },
          'forearm.L': { rotate: [0, 0, 0] },
          'forearm.R': { rotate: [-4 * h, 0, 0] },
        } as P;
      },
    });

    // ---------------------------------------------------------------- death: stagger back, then fall face down
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.1, 1], [0.24, 0.3], [0.34, 0]] as const);
        const sag = keys(p, [[0.14, 0], [0.36, 1]] as const);
        // The fall: 0 standing, 1 on the ground; a small bounce at the impact.
        const fall = keys(p, [[0.3, 0], [0.62, 1.03], [0.7, 0.97], [0.78, 1]] as const, 'smooth');
        const f2 = fall * fall;
        // On the ground the chest frame is turned about 86 deg forward: each shaft then points
        // along his body toward the feet (chest -Y) with its face toward the sky (chest -Z).
        const upperR: V3 = [-10 * hitB - 20 * sag * (1 - fall) - 30 * fall, 0, -30 * sag - 8 * fall];
        const lowerR: V3 = [-20 * sag * (1 - fall) - 10 * fall, 0, 0];
        const upperL: V3 = [-10 * hitB - 20 * sag * (1 - fall) - 30 * fall, 0, 30 * sag + 8 * fall];
        const lowerL: V3 = [-20 * sag * (1 - fall) - 10 * fall, 0, 0];
        // Mid-fall the shaft points almost straight down; tip it out to the side for a moment so
        // the end touches the floor and does not go into it.
        const tipOut = keys(p, [[0.36, 0], [0.48, 1], [0.6, 0]] as const, 'smooth');
        const lay = (base: V3, s: 1 | -1, face: V3) =>
          norm(lerp(lerp(lerp(base, [0, -0.2, 1], 0.6 * sag), [s * 0.25, -1, 0.1], fall), [s * 1, -0.2, 0.1], 0.3 * tipOut));
        const handR = orient([upperR, lowerR], IDOL, { dir: lay(IDOL_DIR, -1, IDOL_FACE), up: norm(lerp(IDOL_FACE, [0, 0.1, -1], fall)) });
        const handL = orient([upperL, lowerL], TORCH, { dir: lay(TORCH_DIR, 1, TORCH_FACE), up: norm(lerp(TORCH_FACE, [0, 0.1, -1], fall)) });
        return {
          hips: {
            move: [0, -0.016 * sag - 0.042 * fall, -0.02 * hitB + 0.13 * f2],
            rotate: [86 * f2, 8 * sag, 6 * fall],
          },
          spine: { rotate: [-10 * hitB + 8 * sag - 4 * fall, 0, 0] },
          chest: { rotate: [-10 * hitB + 6 * sag - 6 * fall, 0, 0] },
          neck: { rotate: [-12 * fall, 0, 0] },
          head: { rotate: [-16 * hitB + 10 * sag - 12 * fall, 20 * fall, 10 * sag - 4 * fall] },
          ...whipBones(TAIL_D, [-20 * hitB + 25 * fall, -20 * hitB + 20 * fall, -10 * hitB + 10 * fall, 0, 0, 0]),
          // The legs straighten back along the ground, the feet turned out.
          'leg.L': { rotate: [-6 * sag - 44 * fall, 0, 10 * fall] },
          'leg.R': { rotate: [4 * sag - 40 * fall, 0, -12 * fall] },
          'foot.L': { rotate: [30 * fall, 0, 0] },
          'foot.R': { rotate: [30 * fall, 0, 0] },
          // The arms flail out in the stagger, then lie out beside his body, well clear of the head.
          'upperarm.L': { rotate: upperL },
          'upperarm.R': { rotate: upperR },
          'forearm.L': { rotate: lowerL },
          'forearm.R': { rotate: lowerR },
          'hand.L': { rotate: handL },
          'hand.R': { rotate: handR },
        } as P;
      },
    });

    // ---------------------------------------------------------------- victory: a jump with the idol and the torch thrust up
    // An anticipation crouch on bent knees with the arms pulled down, a push-off that straightens
    // the legs, a jump of about 9 cm with the knees tucked and the toes pointing down, both items
    // thrust up at the top, and a landing on both feet that the knees absorb with a small bounce.
    // The legs use legTo (above attack2): the soles stay flat on the floor.
    const JUMP = 0.09; // the hips' rise at the top of the jump
    const DROP = 0.045; // the depth of the anticipation crouch
    const [T_OFF, T_TOP, T_LAND] = [0.3, 0.41, 0.52];
    k.animation('victory', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        // The hips' height: the crouch, a push-off that speeds up, a parabola in the air, then the
        // landing dip and a smaller second dip.
        let h: number;
        if (p < 0.24) h = -DROP * ease(0, 0.2, p);
        else if (p < T_OFF) h = -DROP * (1 - ((p - 0.24) / (T_OFF - 0.24)) ** 2);
        else if (p < T_LAND) h = (4 * JUMP * (p - T_OFF) * (T_LAND - p)) / (T_LAND - T_OFF) ** 2;
        else if (p < 0.6) h = -0.034 * Math.sin(((Math.PI / 2) * (p - T_LAND)) / (0.6 - T_LAND));
        else h = -0.034 * keys(p, [[0.6, 1], [0.7, 0.12], [0.77, 0.28], [0.9, 0]] as const);
        const bend = Math.max(0, -h) / DROP; // 1 at the bottom of the crouch
        const air = Math.max(0, h) / JUMP; // 1 at the top of the jump
        const flight = p > T_OFF && p < T_LAND ? Math.sin((Math.PI * (p - T_OFF)) / (T_LAND - T_OFF)) : 0;
        // In the air the knees tuck and the toes point down, but never lower than the floor.
        const tuck = 0.025 * flight;
        const pitch = Math.min(26, (Math.max(0, h) + tuck) / 0.0025);
        // The hips sit back a little over the heels when they drop.
        const back = -0.25 * Math.max(0, -h);
        const ankle: V3 = [ANKLE[0], ANKLE[1] - Math.min(0, h) + tuck, -back];
        const legL = legTo(1, ankle, pitch);
        const legR = legTo(-1, ankle, pitch);
        // The arms pull down and back in the crouch and swing up in the push-off; both items get to
        // full height at the top of the jump, out to the sides (never in front of the face).
        const pull = keys(p, [[0, 0], [0.2, 1], [0.25, 1], [0.31, 0]] as const);
        const raise = ease(0.26, T_TOP, p);
        const raiseL = ease(0.29, T_TOP + 0.03, p);
        const idol = armIdol(
          lerp(lerp(WRIST_R, [-0.21, 0.222, -0.012], pull), [-0.285, 0.42, 0.07], raise),
          lerp(IDOL_DIR, [-0.6, 0.8, 0.1], raise),
          [-0.6, 0.1, -0.3],
        );
        const torch = armTorch(
          lerp(lerp(WRIST, [0.21, 0.222, -0.012], pull), [0.285, 0.42, 0.07], raiseL),
          lerp(TORCH_DIR, [0.6, 0.8, 0.1], raiseL),
          [0.6, 0.1, -0.3],
        );
        // The lash trails behind the jump and swings after the landing.
        const swing = keys(p, [[T_LAND, 0], [0.6, 1], [1, 0]] as const);
        return {
          hips: { move: [0, h, back] },
          spine: { rotate: [10 * bend - 4 * air - 6 * raise, 0, 0] },
          chest: { rotate: [6 * bend - 6 * raise, 8 * raise, 0] },
          head: { rotate: [-3 * bend - 12 * raise, 8 * raise, -6 * raise] },
          ...whipBones(TAIL_D, [0, 1, 2, 3, 4, 5].map((i) => -10 * air + 8 * bend + 6 * swing * wave(p, 3, i * 0.06))),
          'leg.L': { rotate: legL.leg },
          'shin.L': { rotate: legL.shin },
          'foot.L': { rotate: legL.foot },
          'leg.R': { rotate: legR.leg },
          'shin.R': { rotate: legR.shin },
          'foot.R': { rotate: legR.foot },
          'upperarm.R': { rotate: idol.upper },
          'forearm.R': { rotate: idol.lower },
          'hand.R': { rotate: idol.hand },
          'upperarm.L': { rotate: torch.upper },
          'forearm.L': { rotate: torch.lower },
          'hand.L': { rotate: torch.hand },
        } as P;
      },
    });
  },
});
