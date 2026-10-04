import { sdf, type Part, type PartTint } from '../../src/index.js';

/**
 * Avatar hair styles (the default style is part of `assets/avatar-base.ts`; each style also has a
 * standalone `assets/avatar-hair-<style>.ts`, a free head-slot item that hides the base hair).
 * Class: head. Local frame: the origin is the head center (0, 0.675, 0) of the hero base, +Y up,
 * the face toward +Z. Body: hair (bone `head`). Tint slot: `hair` (the lock lines are a darker
 * shade that follows it).
 *
 * Every style starts from one cap that hugs the skull 0.012 to 0.014 m out and leaves the face
 * and the ears open, so the styles fit under the same helmets and hats as the heroes' hair. The
 * locks are thick so that they read at 128 px.
 *
 * Each style also has a capped form, for wear under a head piece that keeps the hair (`capHair`
 * in `src/equip.ts`): a thin cap 0.005 m out above the cap line `CAP_LINE`, and the style's low
 * locks below it (side tufts, the long back and falls, a low ponytail from the nape). It has no
 * fringe, so a brim or a helmet edge covers the top of the hair. The tucked form, under a piece
 * that covers the nape or the cheeks (`tuckHair`), is the cap alone: the locks would come through.
 */

export type AvatarHairStyle = 'swept' | 'short' | 'long' | 'ponytail';
export const AVATAR_HAIR_STYLES: readonly AvatarHairStyle[] = ['swept', 'short', 'long', 'ponytail'];

const LOCK_LINE = '#3a1e12';
const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const local = (s: sdf.Shape) => s.at(0, -HEAD_Y, 0);

/** The skull cap, open for the face (the hairline rises on +X, the part side) and the ears. */
function cap(out = 0.012): sdf.Shape {
  const faceMask = sdf.ellipsoid([0.25, 0.16, 0.23]).rotateZ(14).at(0.02, 0.62, 0.14);
  return sdf
    .ellipsoid([HEAD[0] + out, HEAD[1] + out + 0.002, HEAD[2] + out])
    .at(0, HEAD_Y + 0.008, -0.01)
    .smoothSubtract(0.015, faceMask);
}

/**
 * The cap line of the capped hair (character frame): y = 0.66 + 0.3 z, at the brow (y 0.72) in
 * front and at the nape (y 0.6) behind, where helmets and hat brims come lower. Head pieces cover
 * the hair above it.
 */
const CAP_LINE = { y: 0.66, slope: 0.3 } as const;

/** The capped form: a thin cap 0.005 m out, and the given low locks of a style below the cap line. */
function capped(...locks: sdf.Shape[]): sdf.Shape {
  const n = Math.hypot(1, CAP_LINE.slope);
  const below = sdf.box([0.8, 0.8, 0.8]).at(0, 0.4, 0).intersect(sdf.halfSpace([0, 1 / n, -CAP_LINE.slope / n], CAP_LINE.y / n));
  const low = locks.length > 0 ? sdf.smoothUnion(0.02, cap(), ...locks).smoothIntersect(0.012, below) : null;
  return low ? sdf.smoothUnion(0.012, cap(0.005), low) : cap(0.005);
}

/**
 * Lock lines for the back of the head: thin vertical slabs that fan out from the crown axis and
 * cross the cap behind the ears, painted a darker shade, so the cap reads as locks.
 */
const lockLines = () =>
  sdf
    .union(...[-58, -34, -12, 12, 34, 58].map((a) => sdf.box([0.006, 0.6, 0.5]).at(0, 0.62, -0.25).rotateY(a)))
    .intersect(sdf.halfSpace([0, 0, 1], -0.06))
    .intersect(sdf.halfSpace([0, 1, 0], 0.84));

/** The outer limit of the hair volume near the skull: it keeps a fringe under hats and hoods. */
const crownLimit = () => sdf.ellipsoid([0.262, 0.252, 0.25]).at(0, 0.685, -0.012);

/** Side tufts in front of the ears. */
const tufts = () => pair(sdf.cone([0.185, 0.73, 0.09], [0.2, 0.635, 0.105], 0.03, 0.01));

/** Slimmer side tufts for the capped forms: they lie on the cheek, under a helmet's cheek guard. */
const cappedTufts = () => pair(sdf.cone([0.18, 0.72, 0.09], [0.19, 0.645, 0.1], 0.022, 0.007));

/** The rogue's fringe: one big lock swept from the part (on +X) to the right brow, and a curl. */
function sweptFringe(): sdf.Shape {
  const swoop = sdf.chain(
    [
      [0.12, 0.865, 0.1, 0.055],
      [0.035, 0.872, 0.17, 0.066],
      [-0.05, 0.842, 0.2, 0.06],
      [-0.105, 0.785, 0.214, 0.046],
      [-0.13, 0.725, 0.212, 0.032],
      [-0.128, 0.672, 0.205, 0.016],
    ],
    0.025,
  );
  const curl = sdf.chain(
    [
      [0.04, 0.862, 0.165, 0.046],
      [0.105, 0.822, 0.18, 0.04],
      [0.152, 0.768, 0.165, 0.026],
      [0.168, 0.735, 0.15, 0.011],
    ],
    0.02,
  );
  return sdf.union(swoop, curl);
}
/** Two shallow grooves along the swept fringe split it into locks. */
const fringeGrooves = () =>
  sdf.union(sdf.capsule([0.1, 0.885, 0.16], [-0.09, 0.8, 0.245], 0.007), sdf.capsule([0.05, 0.9, 0.12], [-0.13, 0.84, 0.21], 0.007));

function swept(): sdf.Shape {
  return sdf.smoothUnion(0.02, cap(), sweptFringe(), tufts()).smoothIntersect(0.012, crownLimit()).smoothSubtract(0.006, fringeGrooves());
}

function short(): sdf.Shape {
  // A cropped cut: a row of short, thick locks along the hairline that fall forward onto the brow.
  const lock = (x: number, y: number, z: number, r: number) =>
    sdf.cone([x * 0.85, y + 0.02, z - 0.06], [x * 1.05, y - 0.035, z + 0.03], r, 0.012);
  const locks = sdf.union(
    lock(0, 0.85, 0.15, 0.036),
    pair(sdf.union(lock(0.06, 0.845, 0.145, 0.034), lock(0.115, 0.82, 0.12, 0.032), lock(0.16, 0.775, 0.08, 0.028))),
  );
  return sdf.smoothUnion(0.022, cap(), locks, tufts()).smoothIntersect(0.012, crownLimit());
}

/** Long hair: a mass that falls behind the head to the shoulders. */
const longBack = () =>
  sdf
    .ellipsoid([0.222, 0.25, 0.15])
    .at(0, 0.62, -0.085)
    .intersect(sdf.halfSpace([0, 0, 1], -0.005));

/** Long hair: two broad locks in front of the ears to the jaw. */
const longFalls = () =>
  pair(
    sdf.chain(
      [
        [0.17, 0.74, 0.03, 0.045],
        [0.19, 0.66, 0.025, 0.045],
        [0.19, 0.58, 0.0, 0.038],
        [0.175, 0.51, -0.025, 0.026],
      ],
      0.03,
    ),
  );

function long(): sdf.Shape {
  // Long hair: the swept fringe, the back mass, and the falls.
  const top = sdf.smoothUnion(0.02, cap(), sweptFringe()).smoothIntersect(0.012, crownLimit());
  return sdf.smoothUnion(0.03, top, longBack(), longFalls()).smoothSubtract(0.006, fringeGrooves());
}

function ponytail(): sdf.Shape {
  // A side-swept fringe and a high ponytail from the crown that falls down the back.
  const fringe = sdf.chain(
    [
      [0.1, 0.87, 0.13, 0.045],
      [0.02, 0.86, 0.18, 0.05],
      [-0.07, 0.82, 0.2, 0.042],
      [-0.13, 0.75, 0.2, 0.026],
    ],
    0.02,
  );
  const tie = sdf.torus(0.028, 0.012).rotateX(70).at(0, 0.83, -0.2);
  const tail = sdf.chain(
    [
      [0, 0.84, -0.2, 0.038],
      [0, 0.82, -0.27, 0.05],
      [0, 0.74, -0.31, 0.048],
      [0, 0.64, -0.3, 0.04],
      [0, 0.55, -0.27, 0.026],
      [0, 0.5, -0.25, 0.012],
    ],
    0.025,
  );
  return sdf.smoothUnion(0.02, cap(), fringe, tufts(), tail).union(tie);
}

/** The capped ponytail: the high tail cannot pass a helmet, so a low tail falls from the nape. */
function ponytailCapped(): sdf.Shape {
  const tie = sdf.torus(0.024, 0.011).rotateX(80).at(0, 0.555, -0.2);
  const tail = sdf.chain(
    [
      [0, 0.575, -0.185, 0.032],
      [0, 0.54, -0.22, 0.038],
      [0, 0.48, -0.235, 0.034],
      [0, 0.42, -0.228, 0.022],
      [0, 0.38, -0.215, 0.01],
    ],
    0.02,
  );
  return sdf.smoothUnion(0.015, capped(cappedTufts()), tail).union(tie);
}

const STYLES: Record<AvatarHairStyle, () => sdf.Shape> = { swept, short, long, ponytail };
const CAPPED: Record<AvatarHairStyle, () => sdf.Shape> = {
  swept: () => capped(cappedTufts()),
  short: () => capped(cappedTufts()),
  long: () => capped(longBack(), longFalls()),
  ponytail: ponytailCapped,
};

export interface AvatarHairOptions {
  /** The capped form, for wear under a head piece that keeps the hair. */
  readonly capped?: boolean;
  /** The tucked form, the cap without locks, under a head piece that covers the nape or the cheeks. */
  readonly tucked?: boolean;
}

export function avatarHair(style: AvatarHairStyle, tint: PartTint, options: AvatarHairOptions = {}): Part {
  const lines = tint('hair', { color: LOCK_LINE, follow: 1 });
  const shape = options.tucked ? capped() : (options.capped ? CAPPED : STYLES)[style]();
  return {
    name: `avatar-hair-${style}`,
    bodies: [
      {
        name: 'hair',
        shape: local(shape.paintWhere(lockLines(), lines, 0.004)),
        options: { color: tint('hair'), roughness: 0.6, detail: 0.004 },
        bone: 'head',
      },
    ],
  };
}
