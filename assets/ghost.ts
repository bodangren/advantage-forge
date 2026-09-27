import { defineAsset, motion, profile, sdf } from '../src/index.js';

/**
 * Ghost — Chibi Quest dungeon denizen (catalog `enemies/undead/ghost`, P1, the Sunken Vault), a
 * cute-spooky floater about 0.8 m tall, faces +Z. Target: docs/enemy-mockups/ghost_001.jpg.
 *
 * Role: a slow, haunting dungeon enemy, seen in 3D and as a 128 px sprite; the big egg head, the
 *   dark eyes with their cyan glow, and the wavy sheet hem must read.
 * One idea: a round pale egg of a head on a little draped sheet that flares into a wavy hem and
 *   curls into a wispy tail on its left, two stubby arms held out, and two tiny stub feet.
 * Proportions: head 0.265 to 0.8 (widest 0.25 at the eyes), eyes 0.44, mouth 0.36, arms 0.3,
 *   hem 0.03 to 0.06; the lowest point of the tail touches y = 0 in the rest pose.
 * Shape language: round and soft everywhere (egg head, bell sheet, blunt arms, rounded hem lobes);
 *   the only sharp shapes are the crisp rims of the eye hollows.
 * Palette (60/30/10): pale blue-white #dff2f8 on the head, cooler #bfe6f0 low on the sheet; near
 *   black eyes #16151d; glowing cyan pupils #3fe0ff as the accent.
 * Value plan: the dark eye hollows on the pale head are the strongest contrast (focal point); the
 *   glowing pupils sit high in them.
 * Bodies: ghost (head, sheet, arms, feet, tail), eyes, pupils.
 * Rig: root, body, head, arm.L/arm.R, a three-bone tail (tail1 to tail3). The lower sheet and the
 *   feet ride the root, so the hem lags when the body leans. Clips: idle (hover bob, tail sway),
 *   walk (float forward, leaning), attack (a "boo" lunge with both arms up), hit (knocked back,
 *   squash), death (spins down and shrinks into the floor), taunt (arms wave, spooky wobble).
 */

const C = {
  body: '#dff2f8',
  bodyLow: '#bfe6f0',
  eye: '#16151d',
  pupil: '#3fe0ff',
  pupilBase: '#0b3a46',
  mouth: '#2a1a26',
};

type V3 = readonly [number, number, number];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const DEG = 180 / Math.PI;
const smooth01 = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Joints.
const ROOT_AT: V3 = [0, 0.14, 0];
const BODY_AT: V3 = [0, 0.24, 0];
const HEAD_AT: V3 = [0, 0.35, 0];
const SHOULDER: V3 = [0.125, 0.29, 0.02];
const HAND: V3 = [0.27, 0.315, 0.035];
// The tail: [x, y, z, radius] from inside the back of the sheet out to +X, down to the floor, and
// curling up to its tip.
const TAIL: [number, number, number, number][] = [
  [0.08, 0.14, -0.13, 0.065],
  [0.165, 0.08, -0.17, 0.052],
  [0.235, 0.046, -0.19, 0.042],
  [0.295, 0.066, -0.195, 0.034],
  [0.318, 0.112, -0.185, 0.027],
  [0.302, 0.152, -0.17, 0.022],
  [0.27, 0.152, -0.16, 0.019],
];

/** Point `s` (built facing +Z at the origin) along the normal `n` and move it to `p`. */
const facing = (s: sdf.Shape, n: V3, p: V3) => s.rotateX(-Math.asin(n[1]) * DEG).rotateY(Math.atan2(n[0], n[2]) * DEG).at(...p);

export default defineAsset({
  name: 'ghost',
  description: 'Chibi ghost dungeon enemy: a pale blue-white egg head on a wavy sheet with a curled wispy tail, stubby arms, dark hollow eyes with glowing cyan pupils, and a small smile.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/ghost_001.jpg',
  // Color slots for individual ghosts (the first option is the default look): the pale body and
  // the glow of the pupils. The dark eye hollows and the mouth stay fixed.
  variants: {
    body: { pale: C.body, mint: '#daf5e6', lavender: '#e8e2f7', grey: '#e4e7ea' },
    eyes: { cyan: C.pupil, green: '#5cf08c', violet: '#b48cff' },
  },
  presets: {
    wisp: { body: 'mint', eyes: 'green' },
    phantom: { body: 'lavender', eyes: 'violet' },
    shade: { body: 'grey', eyes: 'cyan' },
  },

  build(k) {
    const T = {
      body: k.tint('body'),
      bodyLow: k.tint('body', { color: C.bodyLow, follow: 1 }),
      glow: k.tint('eyes'),
      pupil: k.tint('eyes', { color: C.pupilBase, follow: 1 }),
    };
    k.skeleton({
      root: { at: ROOT_AT },
      body: { parent: 'root', at: BODY_AT },
      head: { parent: 'body', at: HEAD_AT, tail: [0, 0.8, 0] },
      'arm.L': { parent: 'body', at: SHOULDER, tail: HAND },
      'arm.R': { parent: 'body', at: mx(SHOULDER), tail: mx(HAND) },
      tail1: { parent: 'root', at: [TAIL[0]![0], TAIL[0]![1], TAIL[0]![2]] },
      tail2: { parent: 'tail1', at: [TAIL[2]![0], TAIL[2]![1], TAIL[2]![2]] },
      tail3: { parent: 'tail2', at: [TAIL[4]![0], TAIL[4]![1], TAIL[4]![2]], tail: [TAIL[6]![0], TAIL[6]![1], TAIL[6]![2]] },
    });

    // ------------------------------------------------------------------ head
    // An egg, broad end down: widest at the eyes, rounder and narrower on top.
    const eggHalf: [number, number][] = [
      [0.08, 0.792],
      [0.142, 0.763],
      [0.19, 0.71],
      [0.226, 0.635],
      [0.245, 0.55],
      [0.25, 0.47],
      [0.236, 0.385],
      [0.2, 0.318],
      [0.13, 0.279],
    ];
    const egg = [[0, 0.8], ...eggHalf, [0, 0.266], ...eggHalf.map(([u, v]) => [-u, v]).reverse()] as [number, number][];
    const head = sdf.revolve(profile.polygon(egg, { smooth: true })).scale([1, 1, 0.9]);
    const surf = (x: number, y: number): V3 => sdf.raycast(head, [x, y, 1], [0, 0, -1])!;

    // Eyes: deep oval hollows with crisp rims; the dark glass follows the head's curve 7 mm inside.
    const EYE: V3 = [0.113, 0.44, 0];
    const eyeP = surf(EYE[0], EYE[1]);
    const eyeN = sdf.normalAt(head, eyeP);
    const hollow = facing(sdf.ellipsoid([0.066, 0.078, 0.09]), eyeN, eyeP);
    const hollows = hollow.mirror('x');
    const eyes = head.round(-0.007).intersect(hollows.round(0.004));
    // The pupils: small glowing discs high in each eye, a little proud of the glass.
    const PUPIL: V3 = [0.116, 0.462, 0];
    const pupilP = surf(PUPIL[0], PUPIL[1]);
    const pupilN = sdf.normalAt(head, pupilP);
    const pupilAt: V3 = [pupilP[0] - pupilN[0] * 0.012, pupilP[1] - pupilN[1] * 0.012, pupilP[2] - pupilN[2] * 0.012];
    const pupils = facing(sdf.ellipsoid([0.021, 0.023, 0.009]), pupilN, pupilAt).mirror('x');

    // The smile: a small dark D, flat on top and round below.
    const MOUTH_Y = 0.362;
    const mouthShape = profile.polygon(
      [
        [-0.036, 0.016],
        [0, 0.012],
        [0.036, 0.016],
        [0.03, -0.004],
        [0.016, -0.015],
        [0, -0.018],
        [-0.016, -0.015],
        [-0.03, -0.004],
      ],
      { smooth: true },
    );
    const mouth = sdf.extrude(mouthShape, 0.12).at(0, MOUTH_Y, surf(0, MOUTH_Y)[2]);
    const headCarved = head.smoothSubtract(0.004, hollows).bone('head');

    // ------------------------------------------------------------------ sheet
    // A bell under the head, flaring to the hem, with a hollow underside.
    const bellHalf: [number, number][] = [
      [0.115, 0.385],
      [0.15, 0.31],
      [0.18, 0.215],
      [0.212, 0.125],
      [0.236, 0.05],
      [0.235, 0.0],
    ];
    const bell = [[0, 0.41], ...bellHalf, [0, -0.01], ...bellHalf.map(([u, v]) => [-u, v]).reverse()] as [number, number][];
    const LOBES = 8;
    // A point at the front center; the arches beside it show the stub feet.
    const ang = (x: number, z: number) => Math.atan2(x, z);
    const rim = (x: number, z: number) => Math.min(1, Math.hypot(x, z) / 0.12);
    // Vertical folds that grow toward the hem, lined up with the hem's hanging points.
    const folds = (x: number, y: number, z: number) => -smooth01(0.3, 0.06, y) * Math.cos(LOBES * ang(x, z)) * rim(x, z);
    // The wavy hem: a floor that rises between the points (y 0.05 at a point, 0.1 between).
    const hemCut = sdf
      .halfSpace([0, -1, 0], -0.075)
      .displace(0.025, (x, _y, z) => -Math.cos(LOBES * ang(x, z)) * rim(x, z), 2.6);
    const sheet = sdf
      .revolve(profile.polygon(bell, { smooth: true }))
      .displace(0.01, folds, 1.8)
      .smoothIntersect(0.008, hemCut)
      .smoothSubtract(0.02, sdf.ellipsoid([0.185, 0.09, 0.185]).at(0, 0.04, 0));
    const SPLIT = 0.17;
    const sheetUpper = sheet.intersect(sdf.box([0.6, 0.4, 0.6]).at(0, SPLIT + 0.2, 0)).bone('body');
    const sheetLower = sheet.intersect(sdf.box([0.6, 0.3, 0.6]).at(0, SPLIT - 0.15, 0)).bone('root');
    // A hard union: a smooth one would swell a ridge along the split.
    const sheetAll = sdf.union(sheetUpper, sheetLower);

    // ------------------------------------------------------------------ arms
    // Stubby arms held out, each ending in a blunt mitten with two finger bumps and a thumb.
    const arm = sdf
      .smoothUnion(
        0.014,
        sdf.cone(SHOULDER, [0.235, 0.308, 0.032], 0.05, 0.036),
        sdf.ellipsoid([0.036, 0.042, 0.024]).at(HAND[0] - 0.012, HAND[1], HAND[2]),
        sdf.sphere(0.016).at(0.285, 0.325, 0.036),
        sdf.sphere(0.015).at(0.29, 0.297, 0.036),
        sdf.sphere(0.013).at(0.262, 0.352, 0.036),
      )
      .bone('arm.L');

    // ------------------------------------------------------------------ feet and tail
    const foot = sdf.cone([0.074, 0.12, 0.03], [0.082, 0.044, 0.05], 0.028, 0.032).bone('root');
    const P = (i: number) => TAIL[i]!;
    const tail = sdf.smoothUnion(
      0.02,
      sdf.chain([P(0), P(1), P(2)], 0.02).bone('tail1'),
      sdf.chain([P(2), P(3), P(4)], 0.015).bone('tail2'),
      sdf.chain([P(4), P(5), P(6)], 0.01).bone('tail3'),
    );

    // ------------------------------------------------------------------ bodies
    const ghost = sdf
      .smoothUnion(0.028, headCarved, sheetAll)
      .smoothUnion(0.02, arm.mirror('x'))
      .smoothUnion(0.03, tail)
      .smoothUnion(0.018, foot.mirror('x'))
      .paintWhere(sdf.box([1, 0.3, 1]).at(0, 0.02, 0), T.bodyLow, 0.12)
      .paintWhere(mouth, C.mouth, 0.002);
    k.body('ghost', ghost, { color: T.body, roughness: 0.62, textureDensity: 1.5 });
    k.body('eyes', eyes.bone('head'), { color: C.eye, roughness: 0.12, detail: 0.003 });
    k.body('pupils', pupils.bone('head'), { color: T.pupil, roughness: 0.3, emissive: T.glow, emissiveIntensity: 1.3, detail: 0.003 });

    // ------------------------------------------------------------------ animation
    const { wave, keys } = motion;
    type BP = { rotate?: V3; move?: V3; scale?: V3 };
    type Pose = Record<string, BP>;
    const addV = (a: V3 | undefined, b: V3 | undefined): V3 | undefined =>
      a && b ? [a[0] + b[0], a[1] + b[1], a[2] + b[2]] : (a ?? b);
    const mulV = (a: V3 | undefined, b: V3 | undefined): V3 | undefined =>
      a && b ? [a[0] * b[0], a[1] * b[1], a[2] * b[2]] : (a ?? b);
    /** The sum of two poses: rotations and moves add, scales multiply. */
    const add = (a: Pose, b: Pose): Pose => {
      const out: Pose = { ...a };
      for (const [bone, p] of Object.entries(b)) {
        const q = out[bone] ?? {};
        const rotate = addV(q.rotate, p.rotate);
        const move = addV(q.move, p.move);
        const scale = mulV(q.scale, p.scale);
        out[bone] = { ...(rotate && { rotate }), ...(move && { move }), ...(scale && { scale }) };
      }
      return out;
    };
    /** Idle: a slow hover bob, a gentle sway, the arms drifting, and the tail swishing. */
    const idle = (p: number): Pose => ({
      root: { move: [0, 0.045 + 0.018 * wave(p, 1, 0.25), 0], rotate: [2 * wave(p, 1, 0.5), 0, 3 * wave(p, 1)] },
      body: { rotate: [1.5 * wave(p, 1, 0.7), 0, -2 * wave(p, 1, 0.1)] },
      head: { rotate: [2 * wave(p, 1, 0.8), 5 * wave(p, 1, 0.15), 2 * wave(p, 1, 0.2)] },
      'arm.L': { rotate: [0, 0, 8 * wave(p, 1, 0.3)] },
      'arm.R': { rotate: [0, 0, -8 * wave(p, 1, 0.35)] },
      tail1: { rotate: [4 * wave(p, 1, 0.2), 10 * wave(p, 1, 0.1), 0] },
      tail2: { rotate: [6 * wave(p, 1, 0.35), 14 * wave(p, 1, 0.25), 0] },
      tail3: { rotate: [8 * wave(p, 1, 0.5), 18 * wave(p, 1, 0.4), 0] },
    });
    k.animation('idle', { duration: 1.6, pose: (_t, p) => idle(p) });

    // Walk: floating forward, leaning into it, the hem lagging, the arms swept back, the tail
    // streaming behind.
    k.animation('walk', {
      duration: 1.2,
      pose: (_t, p) => ({
        root: { move: [0, 0.07 + 0.014 * wave(p, 2, 0.25), 0], rotate: [12 + 2 * wave(p, 2), 3 * wave(p, 1, 0.1), 4 * wave(p, 1)] },
        body: { rotate: [6 + 2 * wave(p, 2, 0.2), 0, -3 * wave(p, 1, 0.2)] },
        head: { rotate: [-12 + 2 * wave(p, 2, 0.4), -3 * wave(p, 1, 0.1), 2 * wave(p, 1, 0.3)] },
        'arm.L': { rotate: [0, 28 + 6 * wave(p, 2, 0.1), -12 + 6 * wave(p, 2, 0.3)] },
        'arm.R': { rotate: [0, -28 - 6 * wave(p, 2, 0.1), 12 - 6 * wave(p, 2, 0.35)] },
        tail1: { rotate: [-14 + 4 * wave(p, 1, 0.2), 14 * wave(p, 1, 0.1), 0] },
        tail2: { rotate: [-8 + 6 * wave(p, 1, 0.35), 18 * wave(p, 1, 0.25), 0] },
        tail3: { rotate: [8 * wave(p, 1, 0.5), 24 * wave(p, 1, 0.4), 0] },
      }),
    });

    // Attack (0.9 s): it rears back with both arms up (0 to 0.3), lunges forward with a "boo", the
    // head swelling (0.3 to 0.45), holds it (to 0.62), and floats back to the hover. The hover bob
    // keeps running under it; the first and last frames are idle frames.
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const T3 = (list: [number, V3][]) => keys(p, list);
        const k1 = (list: [number, number][]) => keys(p, list);
        const up = k1([[0, 0], [0.26, 1], [0.62, 1], [0.9, 0], [1, 0]]); // arms up (tail curl)
        const boo = k1([[0, 0], [0.3, 0], [0.4, 1], [0.6, 1], [0.8, 0], [1, 0]]);
        const armUp = k1([[0, 0], [0.22, 26], [0.3, 27], [0.4, 15], [0.62, 14], [0.88, 0]]);
        const armFwd = k1([[0, 0], [0.22, 30], [0.3, 32], [0.4, 60], [0.62, 58], [0.88, 0]]);
        return add(idle(p), {
          root: {
            move: T3([[0, [0, 0, 0]], [0.28, [0, 0.05, -0.06]], [0.42, [0, -0.01, 0.16]], [0.62, [0, 0, 0.17]], [0.9, [0, 0.01, 0.02]], [1, [0, 0, 0]]]),
            rotate: [k1([[0, 0], [0.28, -12], [0.42, 9], [0.62, 7], [0.9, 0]]), 0, 0],
          },
          body: { rotate: [k1([[0, 0], [0.28, -6], [0.42, 5], [0.62, 4], [0.9, 0]]), 0, 0] },
          // The head stays level at the lunge, so the face (and the boo) meets the target.
          head: { rotate: [k1([[0, 0], [0.28, 2], [0.42, -12], [0.62, -10], [0.9, 0]]), 0, 0], scale: [1 + 0.05 * boo, 1 + 0.05 * boo, 1 + 0.05 * boo] },
          // The arms: up and out in the wind-up, then reaching forward past the cheeks for the boo
          // (raised higher, they would sink into the big head).
          'arm.L': { rotate: [0, -armFwd, armUp] },
          'arm.R': { rotate: [0, armFwd, -armUp] },
          tail1: { rotate: [-20 * boo, 0, 0] },
          tail2: { rotate: [-10 * boo, 20 * up, 0] },
          tail3: { rotate: [10 * up, 30 * boo, 0] },
        });
      },
    });

    // Hit (0.45 s): knocked back and up, squashed flat for a moment, the arms flung out, the tail
    // whipping; then it bobs back into the hover.
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.16, 1], [0.4, 0.7], [1, 0]]);
        const sq = keys(p, [[0, 0], [0.14, 1], [0.3, -0.5], [0.5, 0.2], [0.7, 0], [1, 0]]);
        const whip = (d: number, a: number) => a * keys(p, [[0, 0], [0.12 + d, 1], [0.32 + d, -0.6], [0.6 + d, 0.2], [1, 0]]);
        return add(idle(p), {
          root: { move: [0, 0.02 * h, -0.1 * h], rotate: [-11 * h, 0, 7 * h], scale: [1 + 0.09 * sq, 1 - 0.12 * sq, 1 + 0.09 * sq] },
          body: { rotate: [-5 * h, 0, 0] },
          head: { rotate: [-8 * h, 0, -8 * h] },
          'arm.L': { rotate: [0, -15 * h, 20 * h] },
          'arm.R': { rotate: [0, 15 * h, -20 * h] },
          tail1: { rotate: [0, whip(0, 25), 0] },
          tail2: { rotate: [0, whip(0.06, -35), 0] },
          tail3: { rotate: [0, whip(0.12, 45), 0] },
        });
      },
    });

    // Death (1.6 s): a jolt, then it spins faster and faster while it shrinks to a quarter of its
    // size and melts flat into a small puddle on the floor. It stops at a quarter (and 2 cm high):
    // the sprite framer treats a mesh that some clip shrinks below 5 mm as a hidden effect part.
    // The lowest point stays at the floor: the ghost scales by `sy` about the root (0.14 above its
    // lowest point), so the root drops by 0.14 * (1 - sy).
    k.animation('death', {
      duration: 1.6,
      loop: false,
      pose: (_t, p) => {
        const f = smooth01(0.15, 0.9, p);
        const s = 1 - 0.75 * f;
        const sy = s * (1 - 0.92 * smooth01(0.55, 1, p));
        const jolt = keys(p, [[0, 0], [0.08, 1], [0.2, 0.3], [0.35, 0]]);
        const hover = 0.063 * (1 - smooth01(0.1, 0.5, p));
        const spin = 900 * f * f;
        const base = idle(0);
        return add(base, {
          root: {
            move: [0, hover - 0.063 + 0.03 * jolt - ROOT_AT[1] * (1 - sy), -0.04 * jolt],
            rotate: [-12 * jolt, spin, 0],
            scale: [s, sy, s],
          },
          head: { rotate: [-18 * jolt, 0, 0] },
          'arm.L': { rotate: [0, -15 * jolt, 18 * jolt + 12 * f] },
          'arm.R': { rotate: [0, 15 * jolt, -18 * jolt - 12 * f] },
          tail1: { rotate: [0, 30 * f, 0] },
          tail2: { rotate: [0, 30 * f, 0] },
          tail3: { rotate: [0, 30 * f, 0] },
        });
      },
    });

    // Taunt (1.4 s): the arms flap up and down in turns (kept below the big head's cheeks), the
    // whole ghost wobbles side to side, and the head rolls the other way: a spooky "wooo".
    k.animation('taunt', {
      duration: 1.4,
      pose: (_t, p) => ({
        root: { move: [0, 0.06 + 0.02 * wave(p, 2, 0.25), 0], rotate: [0, 8 * wave(p, 1, 0.25), 9 * wave(p, 1)] },
        body: { rotate: [0, 0, -6 * wave(p, 1, 0.1)], scale: [1 + 0.03 * wave(p, 2, 0.5), 1 + 0.04 * wave(p, 2), 1 + 0.03 * wave(p, 2, 0.5)] },
        head: { rotate: [4 * wave(p, 2, 0.1), 0, -12 * wave(p, 1, 0.15)] },
        'arm.L': { rotate: [0, -25 + 15 * wave(p, 2, 0.25), 5 + 20 * wave(p, 2)] },
        'arm.R': { rotate: [0, 25 - 15 * wave(p, 2, 0.75), -5 - 20 * wave(p, 2, 0.5)] },
        tail1: { rotate: [6 * wave(p, 1, 0.2), 16 * wave(p, 1, 0.1), 0] },
        tail2: { rotate: [8 * wave(p, 1, 0.35), 22 * wave(p, 1, 0.25), 0] },
        tail3: { rotate: [10 * wave(p, 1, 0.5), 28 * wave(p, 1, 0.4), 0] },
      }),
    });
  },
});
