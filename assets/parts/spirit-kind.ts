import { defineAsset, motion, profile, sdf } from '../../src/index.js';
import type { AnimationDef, AssetContext, AssetDefinition, BodyOptions, BonePose } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

/**
 * Spirit kinds — the ghost of `assets/ghost.ts` (catalog `enemies/undead/ghost`) and the floating
 * elementals (catalog `monsters/elemental/*`). One egg head with dark eye hollows and glowing
 * pupils, two stubby arms, one rig, and one clip set. The ghost hangs a wavy sheet with stub feet
 * under its head; an elemental has a small wisp body that tapers into a tail curled to its left,
 * in its own element material, and adds element features (a crown of flames, crystals, a halo).
 * The design notes of the head, the face, the rig, and the clips are in `assets/ghost.ts`.
 */

type V3 = readonly [number, number, number];
type Pose = Record<string, BonePose>;

/** A spirit kind: its slots, its body plan, and its element features. */
export interface SpiritKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `body` (the head, and the wisp without an `element` slot), `eyes` (the glow), and optionally `element` (the wisp). */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  /** Fixed colors: the eye hollows, the pupil base, the mouth, and the low sheet tone (ghost). */
  readonly colors?: Partial<typeof GHOST_COLORS>;
  /** The ghost's sheet and stub feet, or an elemental's wisp body. Default 'wisp'. */
  readonly lower?: 'sheet' | 'wisp';
  /** The head material, and its paint (a face mask, freckles). */
  readonly head?: Pick<BodyOptions, 'roughness' | 'metalness' | 'flat' | 'opacity' | 'emissiveIntensity'> & {
    /** The head glows in its own color. */
    readonly glow?: boolean;
    paint?(head: sdf.Shape, spirit: SpiritShape): sdf.Shape;
  };
  /** The wisp material (the body, the arms, and the tail), and its paint or surface. */
  readonly wisp?: Pick<BodyOptions, 'roughness' | 'metalness' | 'opacity' | 'flat' | 'emissiveIntensity' | 'bump'> & {
    /** The body width as a share of the default (an earth spirit is a boulder). */
    readonly girth?: number;
    /** The wisp glows in its own color. */
    readonly glow?: boolean;
    /** The slot of the wisp color: `element` when the kind has it (default), or `body`. */
    readonly slot?: 'body' | 'element';
    paint?(wisp: sdf.Shape, spirit: SpiritShape): sdf.Shape;
  };
  readonly extra?: SpiritExtra;
}

/** Element features: their own bones, their bodies, and their motion in each clip. */
export interface SpiritExtra {
  /** Extra bones (a crown on `head`, a ring on `body`). */
  readonly bones?: Record<string, { parent: string; at: V3; tail?: V3 }>;
  build(k: AssetContext, spirit: SpiritShape): void;
  /** Poses added in a clip (`idle`, `walk`, `attack`, `hit`, `death`, `taunt`). */
  pose?(clip: string, p: number): Pose;
}

/** The spirit's shapes and colors that features build on. */
export interface SpiritShape {
  /** The egg head (before the eye hollows). */
  readonly head: sdf.Shape;
  /** The wisp: the body, the arms, and the tail (wisp kinds only). */
  readonly wisp?: sdf.Shape;
  /** The point on `shape` nearest to (x, y, z), moved out along the normal by `lift`. */
  on(shape: sdf.Shape, x: number, y: number, z: number, lift?: number): V3;
  /** The slot colors: the body, its low tone, the element (the body without the slot), the eye glow. */
  readonly tint: { readonly body: string; readonly low: string; readonly element: string; readonly glow: string };
  /** A fixed default color that follows a slot (`k.tint(slot, { color, follow })`). */
  tone(slot: string, color: string, follow?: number): string;
}

const GHOST_COLORS = {
  bodyLow: '#bfe6f0',
  eye: '#16151d',
  pupilBase: '#0b3a46',
  mouth: '#2a1a26',
};

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
// The ghost's tail: [x, y, z, radius] from inside the back of the sheet out to +X, down to the
// floor, and curling up to its tip.
const SHEET_TAIL: [number, number, number, number][] = [
  [0.08, 0.14, -0.13, 0.065],
  [0.165, 0.08, -0.17, 0.052],
  [0.235, 0.046, -0.19, 0.042],
  [0.295, 0.066, -0.195, 0.034],
  [0.318, 0.112, -0.185, 0.027],
  [0.302, 0.152, -0.17, 0.022],
  [0.27, 0.152, -0.16, 0.019],
];
// An elemental's tail: from the tip of the wisp out to +X and a little back, down to the floor,
// and curling up beside the body.
const WISP_TAIL: [number, number, number, number][] = [
  [0.02, 0.1, -0.02, 0.06],
  [0.075, 0.056, -0.05, 0.046],
  [0.135, 0.042, -0.07, 0.037],
  [0.19, 0.05, -0.08, 0.03],
  [0.215, 0.092, -0.075, 0.024],
  [0.2, 0.128, -0.064, 0.019],
  [0.168, 0.134, -0.055, 0.016],
];

/** Point `s` (built facing +Z at the origin) along the normal `n` and move it to `p`. */
const facing = (s: sdf.Shape, n: V3, p: V3) => s.rotateX(-Math.asin(n[1]) * DEG).rotateY(Math.atan2(n[0], n[2]) * DEG).at(...p);

export function spiritAsset(kind: SpiritKind): AssetDefinition {
  const C = { ...GHOST_COLORS, ...kind.colors };
  const sheet = kind.lower === 'sheet';
  const TAIL = sheet ? SHEET_TAIL : WISP_TAIL;
  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.005,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k) {
      const T = {
        body: k.tint('body'),
        bodyLow: k.tint('body', { color: C.bodyLow, follow: 1 }),
        glow: k.tint('eyes'),
        pupil: k.tint('eyes', { color: C.pupilBase, follow: 1 }),
      };
      const element = kind.variants.element ? k.tint('element') : T.body;
      k.skeleton({
        root: { at: ROOT_AT },
        body: { parent: 'root', at: BODY_AT },
        head: { parent: 'body', at: HEAD_AT, tail: [0, 0.8, 0] },
        'arm.L': { parent: 'body', at: SHOULDER, tail: HAND },
        'arm.R': { parent: 'body', at: mx(SHOULDER), tail: mx(HAND) },
        tail1: { parent: 'root', at: [TAIL[0]![0], TAIL[0]![1], TAIL[0]![2]] },
        tail2: { parent: 'tail1', at: [TAIL[2]![0], TAIL[2]![1], TAIL[2]![2]] },
        tail3: { parent: 'tail2', at: [TAIL[4]![0], TAIL[4]![1], TAIL[4]![2]], tail: [TAIL[6]![0], TAIL[6]![1], TAIL[6]![2]] },
        ...kind.extra?.bones,
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

      // ------------------------------------------------------------------ tail
      const P = (i: number) => TAIL[i]!;
      const tail = sdf.smoothUnion(
        0.02,
        sdf.chain([P(0), P(1), P(2)], 0.02).bone('tail1'),
        sdf.chain([P(2), P(3), P(4)], 0.015).bone('tail2'),
        sdf.chain([P(4), P(5), P(6)], 0.01).bone('tail3'),
      );
      const SPLIT = 0.17;

      const on = (shape: sdf.Shape, x: number, y: number, z: number, lift = 0) => sdf.surfacePoint(shape, [x, y, z], lift) as V3;
      const tint = { body: T.body, low: T.bodyLow, element, glow: T.glow };
      const tone = (slot: string, color: string, follow = 1) => k.tint(slot, { color, follow });
      let spirit: SpiritShape = { head, on, tint, tone };

      if (sheet) {
        // ---------------------------------------------------------------- sheet
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
        const sheetShape = sdf
          .revolve(profile.polygon(bell, { smooth: true }))
          .displace(0.01, folds, 1.8)
          .smoothIntersect(0.008, hemCut)
          .smoothSubtract(0.02, sdf.ellipsoid([0.185, 0.09, 0.185]).at(0, 0.04, 0));
        const sheetUpper = sheetShape.intersect(sdf.box([0.6, 0.4, 0.6]).at(0, SPLIT + 0.2, 0)).bone('body');
        const sheetLower = sheetShape.intersect(sdf.box([0.6, 0.3, 0.6]).at(0, SPLIT - 0.15, 0)).bone('root');
        // A hard union: a smooth one would swell a ridge along the split.
        const sheetAll = sdf.union(sheetUpper, sheetLower);
        const foot = sdf.cone([0.074, 0.12, 0.03], [0.082, 0.044, 0.05], 0.028, 0.032).bone('root');

        const ghost = sdf
          .smoothUnion(0.028, headCarved, sheetAll)
          .smoothUnion(0.02, arm.mirror('x'))
          .smoothUnion(0.03, tail)
          .smoothUnion(0.018, foot.mirror('x'))
          .paintWhere(sdf.box([1, 0.3, 1]).at(0, 0.02, 0), T.bodyLow, 0.12)
          .paintWhere(mouth, C.mouth, 0.002);
        k.body('ghost', ghost, { color: T.body, roughness: 0.62, textureDensity: 1.5 });
      } else {
        // ---------------------------------------------------------------- wisp
        // A small round body under the head that tapers to a point and runs into the tail; its
        // top hides inside the head. It splits like the sheet, so the tail end lags a lean.
        const wispHalf: [number, number][] = [
          [0.1, 0.36],
          [0.128, 0.3],
          [0.138, 0.235],
          [0.125, 0.17],
          [0.092, 0.115],
          [0.05, 0.08],
        ];
        const wispProfile = [[0, 0.38], ...wispHalf, [0, 0.06], ...wispHalf.map(([u, v]) => [-u, v]).reverse()] as [number, number][];
        const g = kind.wisp?.girth ?? 1;
        const wispBody = sdf.revolve(profile.polygon(wispProfile, { smooth: true })).scale([g, 1, g]);
        const wispUpper = wispBody.intersect(sdf.box([0.6, 0.4, 0.6]).at(0, SPLIT + 0.2, 0)).bone('body');
        const wispLower = wispBody.intersect(sdf.box([0.6, 0.3, 0.6]).at(0, SPLIT - 0.15, 0)).bone('root');
        const wisp = sdf.union(wispUpper, wispLower).smoothUnion(0.02, arm.mirror('x')).smoothUnion(0.03, tail);
        spirit = { ...spirit, wisp };

        const headPainted = headCarved.paintWhere(mouth, C.mouth, 0.002);
        k.body('face', kind.head?.paint?.(headPainted, spirit) ?? headPainted, {
          color: T.body,
          roughness: kind.head?.roughness ?? 0.62,
          ...(kind.head?.metalness !== undefined && { metalness: kind.head.metalness }),
          ...(kind.head?.flat && { flat: true }),
          ...(kind.head?.opacity !== undefined && { opacity: kind.head.opacity }),
          ...(kind.head?.glow && { emissive: T.body, emissiveIntensity: kind.head.emissiveIntensity ?? 0.5 }),
          textureDensity: 1.5,
        });
        const w = kind.wisp;
        const wispColor = w?.slot === 'body' ? T.body : element;
        k.body('wisp', w?.paint?.(wisp, spirit) ?? wisp, {
          color: wispColor,
          roughness: w?.roughness ?? 0.62,
          ...(w?.metalness !== undefined && { metalness: w.metalness }),
          ...(w?.opacity !== undefined && { opacity: w.opacity }),
          ...(w?.flat && { flat: true }),
          ...(w?.bump && { bump: w.bump }),
          ...(w?.glow && { emissive: wispColor, emissiveIntensity: w.emissiveIntensity ?? 0.5 }),
          textureDensity: 1.5,
        });
      }
      k.body('eyes', eyes.bone('head'), { color: C.eye, roughness: 0.12, detail: 0.003 });
      k.body('pupils', pupils.bone('head'), { color: T.pupil, roughness: 0.3, emissive: T.glow, emissiveIntensity: 1.3, detail: 0.003 });
      kind.extra?.build(k, spirit);

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
      // Every clip also poses the element features, if the kind has them.
      const clip = (name: string, def: AnimationDef) => {
        const extra = kind.extra?.pose;
        k.animation(name, extra ? { ...def, pose: (t, p) => add(def.pose(t, p) as Pose, extra(name, p) as Pose) } : def);
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
      clip('idle', { duration: 1.6, pose: (_t, p) => idle(p) });

      // Walk: floating forward, leaning into it, the hem lagging, the arms swept back, the tail
      // streaming behind.
      clip('walk', {
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
      clip('attack', {
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
      clip('hit', {
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
      // The lowest point stays at the floor: the spirit scales by `sy` about the root (0.14 above its
      // lowest point), so the root drops by 0.14 * (1 - sy).
      clip('death', {
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
      // whole spirit wobbles side to side, and the head rolls the other way: a spooky "wooo".
      clip('taunt', {
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
}
