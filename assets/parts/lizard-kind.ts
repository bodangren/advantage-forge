import { defineAsset, motion, noise, sdf } from '../../src/index.js';
import type { AssetContext, AssetDefinition } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';
import { stretch } from './head-swell.js';

/**
 * Lizard kinds — chibi four-legged reptiles of the wildlife catalog (crocodile, turtle, and the riding
 * lizard). One body plan: a short round trunk with the chest held high, four thick legs that stand
 * a little out from the body with round toed feet, a big head on a short neck with a snout of any
 * length on a jaw bone (a slightly open smile shows the mouth), big glossy eyes (on bumps on top of
 * the head, or at its front), and a tail on three bones. Options: teeth along the upper jaw, rows of
 * soft spikes down the back and the tail, and a domed shell with a belly plate. One clip set: idle
 * (breathing, a tail sway, a look round), walk and run (diagonal pairs swing, the forward-swinging
 * pair lifts, the body and the tail sway), attack (a snap: the head lunges and the jaw opens), hit,
 * and death (a flop: the legs splay, the body settles, the head and the tail drop). Units are the
 * kind's (about 1 m from snout to tail tip); an asset scales it with `scaleAsset`.
 */

const LIZARD_COLORS = {
  eyeWhite: '#fbf8f0',
  pupil: '#141012',
  mouth: '#7a2a2a',
  tooth: '#fbf6e8',
  claw: '#e8dcc0',
  nostril: '#1e2a18',
};

type V3 = readonly [number, number, number];
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
type P4 = [number, number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const HIPS: V3 = [0, 0.22, -0.12];
const SPINE0: V3 = [0, 0.25, 0.04];
const SHOULDER0: V3 = [0.1, 0.24, 0.08];
const FKNEE0: V3 = [0.165, 0.14, 0.1];
const FFOOT0: V3 = [0.175, 0.03, 0.13];
const HIP: V3 = [0.1, 0.22, -0.14];
const BKNEE0: V3 = [0.17, 0.13, -0.15];
const BFOOT0: V3 = [0.175, 0.03, -0.13];

/** A lizard kind: the slots, the head, the extras, and paint. */
export interface LizardKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `skin`, `belly`, and `eyes` (and the `shell` slot with a shell); the first option of each is the default. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  readonly colors?: Partial<typeof LIZARD_COLORS>;
  /** The snout length in front of the skull (default 0.22; a turtle's 0.03). */
  readonly snout?: number;
  /** The snout half width (default 0.07). */
  readonly snoutWidth?: number;
  /** The snout half height before the head size (default 0.058). */
  readonly snoutHeight?: number;
  /** The skull size per axis as a share (default 1, 1, 1): above 1 in Y for a taller, rounder dome. */
  readonly skullScale?: V3;
  /** A round bulb at the tip of the snout with the nostrils on top (default true). */
  readonly bulb?: boolean;
  /** Moves the head, the neck, and the jaw (default none). */
  readonly headOffset?: V3;
  /** The head size (default 1). */
  readonly headScale?: number;
  /** The eyes: big round eyes on bumps on top of the head (default) or big dark eyes at the sides of the face. */
  readonly eyes?: 'top' | 'side';
  /** With side eyes: the angle from the front to each eye in degrees (default 40). */
  readonly eyeAngle?: number;
  /** The size of the eyes (default 1). */
  readonly eyeScale?: number;
  /** With side eyes: how deep the eye center sits inside the face, as a share of its radius (default 0.45). */
  readonly eyeSink?: number;
  /** With side eyes: a dark pupil on the front of each eye (default false: one color with glints). */
  readonly pupils?: boolean;
  /** With side eyes and pupils: a white eye with an iris in the eyes slot round the pupil, looking half to the front. */
  readonly eyeWhites?: boolean;
  /** With side eyes: meters the eyes sit higher on the head (default 0). */
  readonly eyeLift?: number;
  /** A lower jaw in the belly color with a mouth behind it (default true); without it the kind paints a smile. */
  readonly jaw?: boolean;
  /** The jaw opening at rest in degrees (default 3). */
  readonly jawOpen?: number;
  /** The number of teeth on each side of the upper jaw (default 4; 0 for none). */
  readonly teeth?: number;
  /** Rows of soft spikes down the back and the tail (default true; none with a shell). */
  readonly ridges?: boolean;
  /** The ridges: two rows of soft spikes on the back (default) or one row of round bumps. */
  readonly ridgeStyle?: 'spikes' | 'round';
  /** The tail length as a share of the crocodile's (default 1; 0 for a round stub inside the rump). */
  readonly tail?: number;
  /** The side sway of the tail in the walk and the run, as a share of the default (default 1). */
  readonly tailSway?: number;
  /** The leg thickness (default 1.25). */
  readonly legScale?: number;
  /** The sideways reach of the knees and the feet from the shoulders and the hips (default 1; 0.3 stands the legs straight under the body). */
  readonly legSpread?: number;
  /** 'skin': the lower jaw in the skin color, cream only underneath (default: the belly color). */
  readonly jawColor?: 'skin';
  /** Meters the tail tip curls up (the last two tail points rise; default 0). */
  readonly tailCurl?: number;
  /** Meters added to the trunk between the rump and the chest (below 0: a shorter, more compact body). */
  readonly bodyLength?: number;
  /** Lowers the body by this much (meters) on shorter legs; the feet stay on the ground (default 0). */
  readonly drop?: number;
  /** Raises the chest, the shoulders, and the front knees by this much (meters; default 0), so the
   * front legs stand straight and hold the chest high. Raise the head with `headOffset` too. */
  readonly chestLift?: number;
  /** The size of the cream throat and chest patch as a share of the default (default 1). */
  readonly bellyChest?: number;
  /** True: no belly color on the legs (the chest patch stops where the legs join). */
  readonly bellyOffLegs?: boolean;
  /** No ridges between these two z values (under a saddle). */
  readonly ridgeGap?: readonly [number, number];
  /** The size of the back ridges as a share of the default (default 1). */
  readonly ridgeSize?: number;
  /** The default ridge color that follows the skin slot (default '#4a9030'). */
  readonly ridgeShade?: string;
  /** A domed shell over the trunk and a belly plate, in this slot's color. */
  readonly shell?: string;
  /** Paint on the skin (spots, bands). */
  paint?(skin: sdf.Shape, lizard: LizardShape): sdf.Shape;
  /** Extra bodies (a saddle, a crown). */
  extra?(k: AssetContext, lizard: LizardShape): void;
}

/** The lizard's shapes and colors that a kind builds on. */
export interface LizardShape {
  readonly trunk: sdf.Shape;
  readonly skull: sdf.Shape;
  readonly joints: { readonly HIPS: V3; readonly SPINE: V3; readonly HEAD_C: V3 };
  /** With side eyes: the left eye (radius, outward direction, and center; scaled 1, 1.1, 0.8). */
  readonly eye?: { readonly r: number; readonly dir: V3; readonly center: V3 };
  readonly tint: { readonly skin: string; readonly belly: string; readonly eye: string };
  /** A fixed default color that follows a slot (`k.tint(slot, { color, follow })`). */
  tone(slot: string, color: string, follow?: number): string;
}

export function lizardAsset(kind: LizardKind): AssetDefinition {
  const C = { ...LIZARD_COLORS, ...kind.colors };
  const L = kind.snout ?? 0.22;
  const hs = kind.headScale ?? 1;
  const SW = (kind.snoutWidth ?? 0.07) * hs;
  const TL = kind.tail ?? 1;
  const TSW = kind.tailSway ?? 1;
  const ls = kind.legScale ?? 1.25;
  const shell = kind.shell;
  const off = kind.headOffset ?? [0, 0, 0];
  const NECK = add([0, 0.3, 0.14], [off[0] * 0.3, off[1] * 0.3, off[2] * 0.3]);
  const HEAD = add([0, 0.35, 0.2], off);
  const HEAD_C = add([0, 0.4, 0.22], off);
  const SNOUT_Y = HEAD_C[1] - 0.015 * hs;
  const SNOUT_Z = HEAD_C[2] + 0.07 * hs; // where the snout leaves the skull
  const TIP_Z = SNOUT_Z + L;
  const MOUTH_Y = SNOUT_Y - 0.052 * hs;
  const JAW: V3 = [0, MOUTH_Y + 0.01, HEAD_C[2] - 0.02];
  const TC = kind.tailCurl;
  const TAIL: V3[] = TC
    ? [
        [0, 0.23, -0.24],
        [0, 0.19, -0.24 - 0.14 * TL],
        [0, 0.13 + TC * 0.35, -0.24 - 0.27 * TL],
        [0, 0.07 + TC, -0.24 - 0.37 * TL],
      ]
    : [
        [0, 0.23, -0.24],
        [0, 0.19, -0.24 - 0.14 * TL],
        [0, 0.13, -0.24 - 0.27 * TL],
        [0, 0.07, -0.24 - 0.4 * TL],
      ];
  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.005,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k00) {
      // With `bodyLength`, space between the rump and the chest stretches (or shrinks) along Z.
      const k0 = kind.bodyLength ? stretch(k00, 2, kind.bodyLength, -0.1, 0.04) : k00;
      // With `drop`, every body and bone moves down; the legs are built longer by the same amount
      // below the knee (half above it), so they end on the ground again.
      const D = kind.drop ?? 0;
      const down = (p: V3): V3 => [p[0], p[1] - D, p[2]];
      const k: AssetContext = D
        ? {
            ...k0,
            body: (name, shape, o) => k0.body(name, shape.at(0, -D, 0), o),
            skeleton: (d) =>
              k0.skeleton(Object.fromEntries(Object.entries(d).map(([bone, b]) => [bone, { ...b, at: down(b.at), ...(b.tail ? { tail: down(b.tail) } : {}) }]))),
            animation: (name, a) => k0.animation(name, a),
            tint: k0.tint,
          }
        : k0;
      const up = (p: V3, f: number): V3 => [p[0], p[1] + D * f, p[2]];
      const CL = kind.chestLift ?? 0;
      const SPINE: V3 = [SPINE0[0], SPINE0[1] + CL, SPINE0[2]];
      const SHOULDER: V3 = [SHOULDER0[0], SHOULDER0[1] + CL, SHOULDER0[2]];
      const sp = kind.legSpread ?? 1;
      const inX = (p: V3, root: V3): V3 => (sp === 1 ? p : [root[0] + (p[0] - root[0]) * sp, p[1], p[2]]);
      const FKNEE: V3 = inX([FKNEE0[0], FKNEE0[1] + D * 0.5 + CL * 0.6, FKNEE0[2]], SHOULDER0);
      const BKNEE = inX(up(BKNEE0, 0.5), HIP);
      const FFOOT = inX(up(FFOOT0, 1), SHOULDER0);
      const BFOOT = inX(up(BFOOT0, 1), HIP);
      const tone = (slot: string, color: string, follow = 1) => k.tint(slot, { color, follow });
      const T = { skin: k.tint('skin'), belly: k.tint('belly'), eye: k.tint('eyes') };
      const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
      k.skeleton({
        hips: { at: HIPS },
        spine: { parent: 'hips', at: SPINE },
        neck: { parent: 'spine', at: NECK },
        head: { parent: 'neck', at: HEAD, tail: [0, SNOUT_Y, TIP_Z] },
        jaw: { parent: 'head', at: JAW, tail: [0, MOUTH_Y - 0.02, TIP_Z] },
        tail1: { parent: 'hips', at: TAIL[0]! },
        tail2: { parent: 'tail1', at: TAIL[1]! },
        tail3: { parent: 'tail2', at: TAIL[2]!, tail: TAIL[3]! },
        'fleg.L': { parent: 'spine', at: SHOULDER },
        'fshin.L': { parent: 'fleg.L', at: FKNEE, tail: FFOOT },
        'fleg.R': { parent: 'spine', at: mx(SHOULDER) },
        'fshin.R': { parent: 'fleg.R', at: mx(FKNEE), tail: mx(FFOOT) },
        'bleg.L': { parent: 'hips', at: HIP },
        'bshin.L': { parent: 'bleg.L', at: BKNEE, tail: BFOOT },
        'bleg.R': { parent: 'hips', at: mx(HIP) },
        'bshin.R': { parent: 'bleg.R', at: mx(BKNEE), tail: mx(BFOOT) },
      });

      // ------------------------------------------------------------------ trunk, tail, legs
      // Under a shell the trunk is lower, so it stays inside the dome.
      const chest = (shell ? sdf.ellipsoid([0.15, 0.105, 0.16]).at(0, 0.23, 0.04) : sdf.ellipsoid([0.15, 0.135, 0.16]).at(0, 0.25 + CL, 0.04)).bone('spine');
      const rump = (shell ? sdf.ellipsoid([0.14, 0.095, 0.15]).at(0, 0.22, -0.12) : sdf.ellipsoid([0.14, 0.12, 0.15]).at(0, 0.23, -0.12)).bone('hips');
      // A short thick neck, or (with a moved head) a neck that reaches from the chest to the head.
      const moved = off[0] !== 0 || off[1] !== 0 || off[2] !== 0;
      const neck = (moved ? sdf.capsule(shell ? [0, 0.21, 0.14] : [0, 0.27 + CL, 0.12], HEAD, 0.07 * Math.min(hs, 1.15)) : sdf.ellipsoid([0.11 * hs, 0.1, 0.09]).at(0, NECK[1] + 0.01, NECK[2] + 0.02)).bone('neck');
      const trunk = sdf.smoothUnion(0.06, chest, rump, neck);
      const tr = Math.min(1, TL + 0.2); // a short tail is also thinner
      const tailChain = TL <= 0 ? sdf.ellipsoid([0.06, 0.06, 0.05]).at(0, 0.21, -0.22).bone('tail1') : sdf.smoothUnion(
        0.02,
        sdf.chain([[0, 0.23, -0.16, 0.1 * tr], [...TAIL[0]!, 0.085 * tr] as P4, [...TAIL[1]!, 0.06 * tr] as P4], 0.02).bone('tail1'),
        sdf.chain([[...TAIL[1]!, 0.06 * tr] as P4, [...TAIL[2]!, 0.038 * tr] as P4], 0.015).bone('tail2'),
        sdf.chain([[...TAIL[2]!, 0.038 * tr] as P4, [...TAIL[3]!, 0.01] as P4], 0.01).bone('tail3'),
      );
      const foot = (f: V3) => {
        const toes = sdf.union(...[-0.032, 0, 0.032].map((dx) => sdf.sphere(0.022 * ls).scale([1, 0.8, 1.1]).at(f[0] + dx * ls, 0.019 * ls + D, f[2] + 0.055 * ls)));
        return sdf.smoothUnion(0.015, sdf.ellipsoid([0.055 * ls, 0.03 * ls, 0.06 * ls]).at(f[0], 0.03 * ls + D, f[2] + 0.015), toes);
      };
      const leg = (root: V3, knee: V3, f: V3, upper: string, lower: string) =>
        sdf.smoothUnion(
          0.025,
          sdf.chain([[...root, 0.065 * (shell ? 1 : ls)] as P4, [...knee, 0.05 * ls] as P4], 0.01).bone(upper),
          sdf.smoothUnion(0.02, sdf.chain([[...knee, 0.05 * ls] as P4, [f[0], f[1] + 0.02, f[2], 0.042 * ls]], 0.01), foot(f)).bone(lower),
        );
      const legs = sdf.union(pair(leg(SHOULDER, FKNEE, FFOOT, 'fleg.L', 'fshin.L')), pair(leg(HIP, BKNEE, BFOOT, 'bleg.L', 'bshin.L')));

      // ------------------------------------------------------------------ head: skull, snout, jaw
      const bulbOn = (kind.bulb ?? true) && L > 0.1;
      const bulbC: V3 = [0, SNOUT_Y + 0.022, TIP_Z - 0.04];
      const snout = sdf.ellipsoid([SW, (kind.snoutHeight ?? 0.058) * hs, L / 2 + 0.04]).at(0, SNOUT_Y, SNOUT_Z + L / 2 - 0.02);
      const SK = kind.skullScale ?? [1, 1, 1];
      const skull = sdf.smoothUnion(
        0.04,
        sdf.ellipsoid([0.125 * hs * SK[0], 0.105 * hs * SK[1], 0.115 * hs * SK[2]]).at(...HEAD_C),
        bulbOn ? snout.smoothUnion(0.03, sdf.ellipsoid([SW * 1.2, 0.058, 0.06]).at(...bulbC)) : snout,
      );
      const eyesTop = (kind.eyes ?? 'top') === 'top';
      const es = (kind.eyeScale ?? 1) * hs;
      const bumpC: V3 = [0.055 * hs, HEAD_C[1] + 0.08 * hs, HEAD_C[2] + 0.005];
      const head = eyesTop ? sdf.smoothUnion(0.03, skull, pair(sdf.sphere(0.056 * es).at(...bumpC))) : skull;
      // The jaw is built closed, then turned open about its joint.
      const jawOpen = kind.jawOpen ?? 3;
      const jawShape = sdf
        .smoothUnion(
          0.035,
          sdf.ellipsoid([SW * 0.8, 0.036, L / 2 + 0.02]).at(0, MOUTH_Y - 0.018, SNOUT_Z + L / 2 - 0.045),
          sdf.ellipsoid([0.105 * hs, 0.055, 0.08 * hs]).at(0, MOUTH_Y - 0.01, HEAD_C[2] + 0.01),
        )
        .at(-JAW[0], -JAW[1], -JAW[2])
        .rotateX(jawOpen)
        .at(...JAW)
        .bone('jaw');

      // ------------------------------------------------------------------ skin
      // The domed shell (without its plate grooves); the skin is cut away inside it, so no shoulder or
      // neck root shows through.
      const domeBase = sdf.ellipsoid([0.235, 0.22, 0.285]).at(0, 0.19, -0.04).intersect(sdf.halfSpace([0, -1, 0], -0.15));
      const joined = sdf.smoothUnion(0.03, trunk, tailChain).smoothUnion(0.03, legs).smoothUnion(0.04, head.bone('head'));
      const bodyShape = shell ? joined.subtract(domeBase.round(-0.02)) : joined;
      // The cream belly: the underside, the chest front up to the throat, and the underside of the tail.
      const bellyZone = sdf.union(
        sdf.ellipsoid([0.12, 0.09, 0.3]).at(0, 0.11, -0.05),
        sdf.ellipsoid([0.1 * (kind.bellyChest ?? 1), 0.14 * (kind.bellyChest ?? 1), 0.1]).at(0, 0.25 + CL, 0.19 + CL * 0.3),
        sdf.capsule([0, 0.13, -0.2], [0, 0.0, -0.24 - 0.4 * TL], 0.05),
      );
      let skin = bodyShape
        .paintFn((x, y, z, base) => {
          const n = 0.96 + 0.04 * noise.fbm(x * 16, y * 16, z * 16, 2);
          return [base[0] * n, base[1] * n, base[2] * n];
        })
        .paintWhere(kind.bellyOffLegs ? bellyZone.subtract(legs.round(0.012)) : bellyZone, T.belly, 0.025);
      // The nostrils on top of the snout tip.
      const nostril = bulbOn
        ? pair(sdf.sphere(0.014).at(0.028, bulbC[1] + 0.05, bulbC[2] + 0.02))
        : pair(sdf.sphere(0.008 * hs).at(...sdf.raycast(skull, [0.022 * hs, SNOUT_Y + 0.012 * hs, 2], [0, 0, -1])!));
      skin = skin.paintWhere(nostril, C.nostril, 0.003);
      // A side eye (the left one): its radius, its outward direction, and its center.
      const sideEye = () => {
        const r = 0.042 * es;
        const a = ((kind.eyeAngle ?? 40) * Math.PI) / 180;
        const dir: V3 = [Math.sin(a), 0, Math.cos(a)];
        const h = sdf.raycast(skull, add(add(HEAD_C, [0, 0.02 * hs + (kind.eyeLift ?? 0), 0]), [dir[0], 0, dir[2]]), [-dir[0], 0, -dir[2]])!;
        const sink = kind.eyeSink ?? 0.45;
        const center: V3 = [h[0] - dir[0] * r * sink, h[1], h[2] - dir[2] * r * sink];
        return { r, dir, center };
      };
      const lizard: LizardShape = { trunk, skull, joints: { HIPS, SPINE, HEAD_C }, tint: T, tone, ...(eyesTop ? {} : { eye: sideEye() }) };
      if (kind.paint) skin = kind.paint(skin, lizard);
      k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 1.4 });
      const hasJaw = kind.jaw !== false;
      if (hasJaw && kind.jawColor === 'skin') k.body('jaw-skin', jawShape.paintWhere(sdf.halfSpace([0, 1, 0], MOUTH_Y - 0.04), T.belly, 0.012), { color: T.skin, roughness: 0.55 });
      else if (hasJaw) k.body('jaw-skin', jawShape, { color: T.belly, roughness: 0.55 });
      // The mouth inside, seen in the open smile.
      if (hasJaw)
        k.body('mouth', sdf.ellipsoid([SW * 0.66, 0.022, L / 2]).at(0, MOUTH_Y - 0.004, SNOUT_Z + L / 2 - 0.05).bone('head'), { color: C.mouth, roughness: 0.6 });

      // ------------------------------------------------------------------ eyes
      if (eyesTop) {
        const ER = 0.048 * es;
        const c: V3 = [bumpC[0] + 0.004, bumpC[1] + 0.012 * es, bumpC[2] + 0.022 * es];
        const eye = sdf
          .sphere(ER)
          .at(...c)
          .paintWhere(sdf.sphere(ER * 0.72).at(c[0] - ER * 0.2, c[1] - ER * 0.05, c[2] + ER * 0.62), T.eye, 0.002)
          .paintWhere(sdf.sphere(ER * 0.56).at(c[0] - ER * 0.2, c[1] - ER * 0.05, c[2] + ER * 0.8), C.pupil, 0.002)
          .paintWhere(sdf.sphere(ER * 0.17).at(c[0] - ER * 0.02, c[1] + ER * 0.3, c[2] + ER * 0.96), '#ffffff', 0.002);
        k.body('eyes', pair(eye).bone('head'), { color: C.eyeWhite, roughness: 0.15, detail: 0.003 });
      } else {
        const { r: ER, dir, center: c } = sideEye();
        const ball = sdf
          .sphere(ER)
          .scale([1, 1.1, 0.8])
          .at(...c);
        const white = kind.pupils && kind.eyeWhites;
        // With white eyes, the iris and the pupil look halfway between the eye's own direction and +Z.
        const look: V3 = white ? norm([dir[0] * 0.5, 0, dir[2] * 0.5 + 0.5]) : dir;
        const front = (f: number): V3 => [c[0] + look[0] * ER * f, c[1], c[2] + look[2] * ER * 0.8 * f];
        const iris = white ? ball.paintWhere(sdf.sphere(ER * 0.72).at(...front(0.85)), T.eye, 0.002) : ball;
        const eye = (kind.pupils ? iris.paintWhere(sdf.sphere(ER * 0.5).at(...front(1)), C.pupil, 0.002) : iris)
          .paintWhere(sdf.sphere(ER * 0.26).at(c[0] + dir[0] * ER * 0.7, c[1] + ER * 0.42, c[2] + dir[2] * ER * 0.7), '#ffffff', 0.002)
          .paintWhere(sdf.sphere(ER * 0.12).at(c[0] + dir[0] * ER * 0.85 - ER * 0.2, c[1] - ER * 0.3, c[2] + dir[2] * ER * 0.85), '#ffffff', 0.002);
        k.body('eyes', pair(eye).bone('head'), { color: kind.pupils && kind.eyeWhites ? C.eyeWhite : T.eye, roughness: 0.12, detail: 0.003 });
      }

      // ------------------------------------------------------------------ teeth, ridges, claws
      const nTeeth = kind.teeth ?? 4;
      if (nTeeth > 0) {
        const upper = skull.intersect(sdf.halfSpace([0, -1, 0], -(MOUTH_Y + 0.004)));
        const teeth = sdf.union(
          ...Array.from({ length: nTeeth }, (_, i) => {
            const z = TIP_Z - 0.06 - ((L - 0.05) * i) / Math.max(1, nTeeth - 1);
            const hit = sdf.raycast(upper, [0.3, MOUTH_Y + 0.012, z], [-1, 0, 0]);
            // Outside the narrower jaw, so the teeth hang over the lower lip.
            const jz = (z - (SNOUT_Z + L / 2 - 0.045)) / (L / 2 + 0.02);
            const jawX = SW * 0.8 * Math.sqrt(Math.max(0, 1 - jz * jz)) + 0.005;
            const x = Math.max((hit ? hit[0] : SW * 0.75) - 0.004, jawX);
            const size = i === 0 || i === nTeeth - 1 ? 1.2 : 1;
            return sdf.cone([x, MOUTH_Y + 0.014, z], [x + 0.002, MOUTH_Y - 0.018 * size, z], 0.0105 * size, 0.0035);
          }),
        );
        k.body('teeth', pair(teeth).bone('head'), { color: C.tooth, roughness: 0.3, detail: 0.003 });
      }
      if (kind.ridges !== false && !shell) {
        const back = sdf.smoothUnion(0.03, trunk, tailChain);
        const ridge: sdf.Shape[] = [];
        const z0 = 0.1;
        const z1 = TAIL[3]![2] + 0.05;
        const n = 13;
        for (let i = 0; i < n; i++) {
          const z = z0 + ((z1 - z0) * i) / (n - 1);
          if (kind.ridgeGap && z > kind.ridgeGap[0] && z < kind.ridgeGap[1]) continue;
          const bone = z > -0.02 ? 'spine' : z > TAIL[0]![2] ? 'hips' : z > TAIL[1]![2] ? 'tail1' : z > TAIL[2]![2] ? 'tail2' : 'tail3';
          const f = (1 - (0.6 * i) / (n - 1)) * (kind.ridgeSize ?? 1);
          const single = kind.ridgeStyle === 'round';
          for (const x of z > TAIL[0]![2] + 0.02 && !single ? [0.045, -0.045] : [0]) {
            const top = sdf.raycast(back, [x, 1, z], [0, -1, 0]);
            if (!top) continue;
            // One row of round bumps, or two rows of soft spikes.
            ridge.push((single ? sdf.cone([x, top[1] - 0.012, top[2]], [x, top[1] + 0.045 * f, top[2] - 0.006], 0.034 * f, 0.012 * f) : sdf.cone([x, top[1] - 0.012, top[2]], [x, top[1] + 0.05 * f, top[2] - 0.008], 0.026 * f, 0.005)).bone(bone));
          }
        }
        k.body('ridges', sdf.union(...ridge), { color: tone('skin', kind.ridgeShade ?? '#4a9030', 1), roughness: 0.55, detail: 0.004 });
      }
      const claws = (f: V3, bone: string) =>
        sdf.union(...[-0.032, 0, 0.032].map((dx) => sdf.sphere(0.012 * ls).scale([1, 0.7, 1]).at(f[0] + dx * ls, 0.012 * ls + D, f[2] + 0.075 * ls))).bone(bone);
      k.body('claws', pair(sdf.union(claws(FFOOT, 'fshin.L'), claws(BFOOT, 'bshin.L'))), { color: tone('belly', C.claw, 1), roughness: 0.45, detail: 0.003 });

      // ------------------------------------------------------------------ shell
      if (shell) {
        const S = k.tint(shell);
        // Plates: the dome cut into cells round fixed points. Each plate bulges; a groove runs
        // along each seam between two cells.
        const cells: V3[] = [
          [0, 0.42, -0.04],
          [0, 0.37, -0.21],
          [0, 0.37, 0.13],
          [0.15, 0.34, 0.06],
          [0.15, 0.33, -0.14],
          [-0.15, 0.34, 0.06],
          [-0.15, 0.33, -0.14],
        ];
        const seam = (x: number, y: number, z: number) => {
          let a = Infinity;
          let b = Infinity;
          for (const c of cells) {
            const d = Math.hypot(x - c[0], y - c[1], z - c[2]);
            if (d < a) {
              b = a;
              a = d;
            } else if (d < b) b = d;
          }
          return b - a;
        };
        const RIM_Y = 0.19;
        const dome = domeBase.displace(0.012, (x, y, z) => (y < RIM_Y + 0.01 ? 0 : Math.max(0, 1 - seam(x, y, z) / 0.03) ** 2), 1.5);
        const plates = dome.paintFn((x, y, z, base) => {
          const t = Math.max(0, 1 - seam(x, y, z) / 0.03);
          const f = 1 - 0.25 * t * t;
          return [base[0] * f, base[1] * f, base[2] * f];
        });
        k.body('shell', plates.bone('spine'), { color: S, roughness: 0.45, textureDensity: 1.5 });
        // A round rim band in the belly color under the plates, and the belly plate.
        const rim = sdf
          .ellipsoid([0.25, 0.2, 0.3])
          .at(0, 0.19, -0.04)
          .intersect(sdf.box([0.7, RIM_Y + 0.012 - 0.14, 0.8], 0.004).at(0, (RIM_Y + 0.012 + 0.14) / 2, -0.04))
          .round(0.008);
        k.body('rim', rim.bone('spine'), { color: T.belly, roughness: 0.5 });
        const plastron = sdf.ellipsoid([0.17, 0.035, 0.22]).at(0, 0.12, -0.04).bone('hips');
        k.body('plastron', plastron, { color: T.belly, roughness: 0.5 });
      }
      kind.extra?.(k, lizard);

      // ------------------------------------------------------------------ animation
      const { wave, bump, keys } = motion;
      type R3 = [number, number, number];
      const both = (name: string, r: R3) => ({ [`${name}.L`]: { rotate: r }, [`${name}.R`]: { rotate: [r[0], -r[1], -r[2]] as R3 } });
      k.animation('idle', {
        duration: 3,
        pose: (_t, p) => ({
          spine: { move: [0, 0.004 * bump(p, 2), 0] },
          neck: { rotate: [3 * wave(p, 1, 0.2), 10 * wave(p), 0] },
          jaw: { rotate: [6 * Math.max(0, wave(p, 3)) * bump(p), 0, 0] },
          tail1: { rotate: [0, 8 * wave(p, 1, 0.1), 0] },
          tail2: { rotate: [0, 10 * wave(p, 1, 0.2), 0] },
          tail3: { rotate: [0, 12 * wave(p, 1, 0.3), 0] },
        }),
      });
      // Diagonal pairs: front left with back right. +X swings a leg back; the pair that swings forward
      // lifts its feet (the shins bend), and the body and the tail sway with the steps.
      const gait = (duration: number, swing: number, lift: number, bob: number) => ({
        duration,
        pose: (_t: number, p: number) => {
          const a = wave(p); // +1: front left back
          const upA = Math.max(0, -wave(p, 1, 0.25));
          const upB = Math.max(0, wave(p, 1, 0.25));
          return {
            hips: { move: [0, -bob * bump(p, 2), 0] as R3, rotate: [0, 5 * a, 0] as R3 },
            spine: { rotate: [0, -7 * a, 0] as R3 },
            neck: { rotate: [0, 5 * a, 0] as R3 },
            tail1: { rotate: [0, -10 * a * TSW, 0] as R3 },
            tail2: { rotate: [0, -12 * wave(p, 1, 0.1) * TSW, 0] as R3 },
            tail3: { rotate: [0, -14 * wave(p, 1, 0.2) * TSW, 0] as R3 },
            'fleg.L': { rotate: [swing * a, 0, 0] as R3 },
            'bleg.R': { rotate: [swing * a, 0, 0] as R3 },
            'fleg.R': { rotate: [-swing * a, 0, 0] as R3 },
            'bleg.L': { rotate: [-swing * a, 0, 0] as R3 },
            'fshin.L': { rotate: [-lift * upA, 0, 0] as R3 },
            'bshin.R': { rotate: [lift * upA, 0, 0] as R3 },
            'fshin.R': { rotate: [-lift * upB, 0, 0] as R3 },
            'bshin.L': { rotate: [lift * upB, 0, 0] as R3 },
          };
        },
      });
      k.animation('walk', gait(0.8, 22, 30, 0.008));
      k.animation('run', gait(0.48, 32, 44, 0.016));
      k.animation('attack', {
        duration: 0.8,
        loop: false,
        pose: (_t, p) => {
          const lunge = keys(p, [[0, 0], [0.3, -0.3], [0.45, 1], [0.6, 1], [1, 0]] as const);
          const open = keys(p, [[0, 0], [0.3, 0.7], [0.42, 1], [0.5, 0], [0.6, 0], [1, 0]] as const);
          return {
            spine: { move: [0, 0.01 * Math.max(0, lunge), 0.05 * lunge] },
            neck: { rotate: [-8 * open, 0, 0] },
            head: { rotate: [-8 * open + 4 * Math.max(0, lunge), 0, 0] },
            jaw: { rotate: [30 * open, 0, 0] },
            tail1: { rotate: [0, 10 * Math.sin(p * Math.PI * 2), 0] },
          };
        },
      });
      k.animation('hit', {
        duration: 0.5,
        loop: false,
        pose: (_t, p) => {
          const h = keys(p, [[0, 0], [0.15, 1], [1, 0]] as const);
          return {
            spine: { move: [0, 0, -0.03 * h], rotate: [-6 * h, 0, 6 * h] },
            neck: { rotate: [-14 * h, -10 * h, 0] },
            jaw: { rotate: [16 * h, 0, 0] },
            tail1: { rotate: [8 * h, 14 * h, 0] },
          };
        },
      });
      k.animation('death', {
        duration: 1.4,
        loop: false,
        pose: (_t, p) => {
          const d = keys(p, [[0, 0], [0.5, 0.8], [0.7, 1], [1, 1]] as const);
          return {
            hips: { move: [0, -0.07 * d, 0] },
            neck: { rotate: [14 * d, 14 * d, 0] },
            jaw: { rotate: [10 * d, 0, 0] },
            tail1: { rotate: [6 * d, 12 * d, 0] },
            tail2: { rotate: [4 * d, 10 * d, 0] },
            ...both('fleg', [-10 * d, 0, 34 * d]),
            ...both('bleg', [10 * d, 0, 34 * d]),
          };
        },
      });
    },
  });
}
