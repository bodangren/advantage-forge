import { defineAsset, motion, noise, profile, rgb, sdf } from '../../src/index.js';
import type { AssetContext, AssetDefinition } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

/**
 * Insect kinds — the chibi flying insects of the wildlife catalog (bee, wasp, butterfly, moth). One
 * body plan, upright as in a hover: a big round head with two big glossy eyes, a mouth, and antennae
 * on top of a small upright body (a round fuzzy ball, a waist with a striped pointed abdomen behind
 * it, a small slim body, or a round pear); short legs that hang under the body or two small arms at
 * its front; and two pairs of wings, small and clear behind the body or large and spread to the
 * sides. The rest pose is the hover pose with the lowest point on the ground. One clip set: idle (a
 * hover that lifts off the ground with beating wings), fly (leaning forward), attack (a dart), hit,
 * and death (the wings stop and the insect drops onto its side). Units are the kind's (about 0.75 m
 * to the antenna tips); an asset scales it with `scaleAsset`.
 */

const INSECT_COLORS = {
  eye: '#141012',
  mouth: '#3a1a1a',
  tongue: '#e0606a',
  cheek: '#f0a0a0',
  leg: '#2a2426',
  vein: '#a89a88',
};

type V3 = readonly [number, number, number];
type P4 = [number, number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');

/** An insect kind: the slots, the shapes, the antennae, the wings, and paint. */
export interface InsectKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `body` (the body, and the head unless `headSlot`), `stripes` (bands, antennae), and `wings`, and more if a kind needs them. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  readonly colors?: Partial<typeof INSECT_COLORS>;
  /** The slot of the head color (default `body`). */
  readonly headSlot?: string;
  /** The head radius (default 0.17). */
  readonly head?: number;
  /** The body: a round fuzzy ball (default), a waist with a striped pointed abdomen behind it, a small slim body, or a round pear. */
  readonly abdomen?: 'round' | 'pointed' | 'slim' | 'pear' | 'level';
  /** Stripe bands across the body (default 0). */
  readonly stripes?: number;
  /** The bands start in the stripe color (dark top, light band, dark bottom) instead of the body color. */
  readonly invertStripes?: boolean;
  /** The slot of the antenna color (default `stripes`). */
  readonly antennaSlot?: string;
  /** A small stinger at the abdomen tip. */
  readonly stinger?: boolean;
  /** Fine fuzz on the body and the head (bump strength; default 0). */
  readonly fuzz?: number;
  /** A big fluffy mane round the face, in this slot's color. */
  readonly mane?: string;
  /** The antennae: long and thin with ball tips (default), short with big round knobs, or long with curled tips. */
  readonly antennae?: 'ball' | 'knob' | 'curl' | 'spiral' | 'lobe';
  /** The wings: small clear oval wings (default), large spread butterfly wings, or broad rounded moth wings. */
  readonly wings?: 'clear' | 'butterfly' | 'moth';
  /** Moves the wing roots out to the sides and back (meters, default 0), clear of a mane. */
  readonly wingRootOut?: number;
  /** The wing size (default 1). */
  readonly wingScale?: number;
  /** The limbs: six short legs folded under the body (default) or two small arms at its front. */
  readonly limbs?: 'legs' | 'arms';
  /** The legs (with `limbs: 'legs'`): short and folded under the body (default), long and thin and spread out to the sides, or long and hanging down. */
  readonly legStyle?: 'tucked' | 'spread' | 'hang';
  /** The mouth: a closed smile (default) or an open happy mouth. */
  readonly mouth?: 'smile' | 'open';
  /** The size of the eyes (default 1). */
  readonly eyeScale?: number;
  /** Pink cheeks under the eyes. */
  readonly cheeks?: boolean;
  /** The rest pose hovers this high (meters, default 0): the feet stay off the ground. */
  readonly restHover?: number;
  /** A fuzzy ring round the neck that joins the head to the body (default false). */
  readonly collar?: boolean;
  /** The mane: a smooth ring (default) or spiky fluffy fur. */
  readonly maneStyle?: 'smooth' | 'spiky' | 'strands';
  /** The eyes: glossy dark balls (default), white balls with a big dark pupil, or dark balls with a colored iris. */
  readonly eyeStyle?: 'dark' | 'white' | 'iris';
  /** The iris color for `eyeStyle: 'iris'`. */
  readonly iris?: string;
  /** A small round nose between the eyes in this color (default none). */
  readonly nose?: string;
  /** The stripe range on the round body as [top, bottom] heights over the body center (default [0.12, -0.13]). */
  readonly stripeRange?: readonly [number, number];
  /** A dark band in the stripe color at the top of the thorax, under the head (default false). */
  readonly neckBand?: boolean;
  /** The length of a level abdomen as a share of the default (default 1). */
  readonly abdomenLength?: number;
  /** The arms: at the chest (default) or out at the sides. */
  readonly armPose?: 'chest' | 'out';
  /** Paint on a wing plate in its own frame (root at the origin, the wing along +X, the plate in XY). */
  paintWing?(plate: sdf.Shape, which: 'fore' | 'hind', shape: InsectShape): sdf.Shape;
  /** Paint on the head (a face patch). */
  paintHead?(head: sdf.Shape, shape: InsectShape): sdf.Shape;
  /** Extra bodies, rigid on a bone or tagged. */
  extra?(k: AssetContext, shape: InsectShape): void;
}

/** The insect's shapes, joints, and slot colors that a kind builds on. */
export interface InsectShape {
  readonly headShape: sdf.Shape;
  readonly joints: { readonly HEAD_C: V3; readonly HR: number; readonly BODY_C: V3 };
  faceHit(x: number, y: number): V3;
  readonly tint: { readonly body: string; readonly stripes: string; readonly wings: string; readonly head: string };
  /** A fixed default color that follows a slot (`k.tint(slot, { color, follow })`). */
  tone(slot: string, color: string, follow?: number): string;
}

export function insectAsset(kind: InsectKind): AssetDefinition {
  const C = { ...INSECT_COLORS, ...kind.colors };
  const HR = kind.head ?? 0.17;
  const abdKind = kind.abdomen ?? 'round';
  const limbs = kind.limbs ?? 'legs';
  // The body center and the neck (the top of the body); the head sits on the neck.
  const BODY_C: V3 =
    abdKind === 'round'
      ? [0, 0.26, -0.04]
      : abdKind === 'pointed'
        ? [0, 0.3, -0.02]
        : abdKind === 'level'
          ? [0, 0.3, 0.0]
          : abdKind === 'slim'
            ? [0, 0.22, -0.01]
            : [0, 0.2, -0.02];
  const NECK_Y = abdKind === 'round' ? 0.38 : abdKind === 'pointed' ? 0.36 : abdKind === 'level' ? 0.37 : abdKind === 'slim' ? 0.29 : 0.33;
  const HEAD_C: V3 = [0, NECK_Y + HR * 0.82, 0.03];
  const NECK: V3 = [0, NECK_Y, 0.0];
  const ABD_AT: V3 = [0, BODY_C[1] - 0.02, BODY_C[2] - 0.04];
  const WO = kind.wingRootOut ?? 0;
  const WING_ROOT: V3 = [0.05 + WO, NECK_Y - 0.02, -0.07 - WO * 0.5];
  const WING2_ROOT: V3 = [0.05 + WO, NECK_Y - 0.07, -0.08 - WO * 0.5];
  const wingKind = kind.wings ?? 'clear';
  const big = wingKind !== 'clear';
  const ws = kind.wingScale ?? 1;
  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.005,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k0) {
      // With `restHover`, every body and bone moves up: the rest pose is the hover.
      const LIFT = kind.restHover ?? 0;
      // The level abdomen leaves the back of the thorax and points back and a little down.
      const levelRoot: V3 = [0, BODY_C[1] - 0.025, BODY_C[2] - 0.06];
      const lv = (12 * Math.PI) / 180;
      const levelAxis: V3 = [0, -Math.sin(lv), -Math.cos(lv)];
      const lift = (p: V3): V3 => [p[0], p[1] + LIFT, p[2]];
      const k: AssetContext = LIFT
        ? {
            ...k0,
            body: (name, sh, o) => k0.body(name, sh.at(0, LIFT, 0), o),
            skeleton: (d) => k0.skeleton(Object.fromEntries(Object.entries(d).map(([bone, b]) => [bone, { ...b, at: lift(b.at), ...(b.tail ? { tail: lift(b.tail) } : {}) }]))),
            animation: (name, a) => k0.animation(name, a),
            tint: k0.tint,
          }
        : k0;
      const tone = (slot: string, color: string, follow = 1) => k.tint(slot, { color, follow });
      const T = { body: k.tint('body'), stripes: k.tint('stripes'), wings: k.tint('wings'), head: k.tint(kind.headSlot ?? 'body') };
      const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
      const add = (p: V3, d: V3): V3 => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
      const legStyle = kind.legStyle ?? 'tucked';
      const longLegs = limbs === 'legs' && legStyle !== 'tucked';
      k.skeleton({
        body: { at: BODY_C },
        head: { parent: 'body', at: NECK, tail: [0, HEAD_C[1] + HR, HEAD_C[2]] },
        abdomen: { parent: 'body', at: ABD_AT, tail: [0, 0.05, -0.2] },
        'wing.L': { parent: 'body', at: WING_ROOT, tail: add(WING_ROOT, [0.2, 0.1, 0]) },
        'wing.R': { parent: 'body', at: mx(WING_ROOT), tail: add(mx(WING_ROOT), [-0.2, 0.1, 0]) },
        'wing2.L': { parent: 'body', at: WING2_ROOT, tail: add(WING2_ROOT, [0.2, -0.05, 0]) },
        'wing2.R': { parent: 'body', at: mx(WING2_ROOT), tail: add(mx(WING2_ROOT), [-0.2, -0.05, 0]) },
        ...(longLegs ? { 'leg-set': { parent: 'body', at: [0, BODY_C[1] - 0.06, BODY_C[2]] as V3, tail: [0, BODY_C[1] - 0.2, BODY_C[2]] as V3 } } : {}),
      });

      // ------------------------------------------------------------------ body (thorax and abdomen)
      let thorax: sdf.Shape;
      let abdomen: sdf.Shape | null = null;
      let tip: V3 = [0, 0.05, -0.1];
      let bands: [number, number] = [0, 0]; // the band range along the abdomen axis
      let bandAxis: (x: number, y: number, z: number) => number = (_x, y) => y;
      if (abdKind === 'round') {
        // A fuzzy ball, a little taller than wide.
        thorax = sdf.ellipsoid([0.15, 0.155, 0.15]).at(...BODY_C);
        const sr = kind.stripeRange ?? [0.12, -0.13];
        bands = [BODY_C[1] + sr[0], BODY_C[1] + sr[1]];
      } else if (abdKind === 'pointed') {
        // A small round thorax at the waist, and the striped pointed abdomen hanging behind and below.
        thorax = sdf.ellipsoid([0.085, 0.08, 0.08]).at(...BODY_C);
        const along = (s: sdf.Shape) => s.rotateX(-38).at(0, BODY_C[1] - 0.12, BODY_C[2] - 0.12);
        abdomen = along(sdf.smoothUnion(0.03, sdf.ellipsoid([0.1, 0.13, 0.1]), sdf.cone([0, -0.08, 0], [0, -0.17, 0], 0.06, 0.012)));
        tip = add([0, BODY_C[1] - 0.12, BODY_C[2] - 0.12], [0, -0.17 * Math.cos((38 * Math.PI) / 180), -0.17 * Math.sin((38 * Math.PI) / 180)]);
        const ax = [0, Math.cos((38 * Math.PI) / 180), Math.sin((38 * Math.PI) / 180)];
        const o: V3 = [0, BODY_C[1] - 0.12, BODY_C[2] - 0.12];
        bandAxis = (_x, y, z) => (y - o[1]) * ax[1]! + (z - o[2]) * ax[2]!;
        bands = [0.11, -0.16];
      } else if (abdKind === 'level') {
        // A small round thorax under the head, and a pear-shaped striped abdomen straight behind it,
        // nearly level (a flying wasp), along the axis `levelAxis`.
        thorax = sdf.ellipsoid([0.08, 0.085, 0.085]).at(...BODY_C);
        const L = kind.abdomenLength ?? 1;
        const o = levelRoot;
        const d = levelAxis;
        const at = (t: number, r: number): P4 => [o[0] + d[0] * t * L, o[1] + d[1] * t * L, o[2] + d[2] * t * L, r];
        abdomen = sdf.chain([at(0, 0.06), at(0.07, 0.095), at(0.15, 0.1), at(0.24, 0.07), at(0.31, 0.022)], 0.03);
        bandAxis = (_x, y, z) => (y - o[1]) * d[1] + (z - o[2]) * d[2];
        bands = [0.04 * L, 0.3 * L];
        tip = at(0.31, 0).slice(0, 3) as unknown as V3;
      } else if (abdKind === 'slim') {
        // A short round body: a round chest and a smaller round belly under it.
        thorax = sdf.smoothUnion(0.03, sdf.ellipsoid([0.075, 0.075, 0.07]).at(BODY_C[0], BODY_C[1] + 0.025, BODY_C[2]), sdf.ellipsoid([0.066, 0.065, 0.062]).at(BODY_C[0], BODY_C[1] - 0.045, BODY_C[2] - 0.005));
        bands = [BODY_C[1] - 0.03, BODY_C[1] - 0.12];
      } else {
        // A round pear: narrow at the neck, round at the bottom.
        thorax = sdf.smoothUnion(0.06, sdf.ellipsoid([0.085, 0.07, 0.08]).at(0, NECK_Y - 0.04, BODY_C[2]), sdf.ellipsoid([0.13, 0.15, 0.12]).at(0, BODY_C[1] - 0.03, BODY_C[2]));
        bands = [BODY_C[1] - 0.02, BODY_C[1] - 0.17];
      }
      const n = kind.stripes ?? 0;
      const stripeRgb = rgb(T.stripes);
      const stripe = (s: sdf.Shape) =>
        n > 0
          ? s.paintFn((x, y, z, base) => {
              const t = (bandAxis(x, y, z) - bands[0]) / (bands[1] - bands[0]);
              if (t < 0 || t > 1) return base;
              return (Math.floor(t * (2 * n + 1)) % 2 === 1) !== !!kind.invertStripes ? stripeRgb : base;
            })
          : s;
      const fuzz = kind.fuzz ?? 0;
      const bodyLook = {
        color: T.body,
        roughness: fuzz > 0 ? 0.9 : 0.6,
        textureDensity: 1.4,
        ...(fuzz > 0 ? { bump: (x: number, y: number, z: number) => fuzz * 0.002 * noise.fbm(x * 120, y * 120, z * 120, 2) } : {}),
      };
      const neckBand = (s: sdf.Shape) => (kind.neckBand ? s.paintWhere(sdf.halfSpace([0, -1, 0], -(BODY_C[1] + 0.035)), T.stripes, 0.01) : s);
      k.body('thorax', neckBand(abdomen ? thorax : stripe(thorax)).bone('body'), bodyLook);
      if (abdomen) k.body('abdomen-fur', stripe(abdomen).bone('abdomen'), bodyLook);
      if (kind.stinger) {
        // The stinger grows out of the abdomen tip: find the tip with a ray toward the abdomen's
        // center from far out along its axis (whichever way the axis turned), then point the stinger on.
        if (abdKind === 'level') {
          const d = levelAxis;
          const sting = sdf.cone([tip[0] - d[0] * 0.02, tip[1] - d[1] * 0.02, tip[2] - d[2] * 0.02], [tip[0] + d[0] * 0.045, tip[1] + d[1] * 0.045, tip[2] + d[2] * 0.045], 0.016, 0.002).bone('abdomen');
          k.body('stinger', sting, { color: C.leg, roughness: 0.4, detail: 0.003 });
        }
        const sh = abdomen ?? thorax;
        const o: V3 = abdomen ? [0, BODY_C[1] - 0.12, BODY_C[2] - 0.12] : BODY_C;
        const cands: V3[] = abdomen ? [[0, -Math.cos(0.663), -Math.sin(0.663)], [0, -Math.cos(0.663), Math.sin(0.663)]] : [[0, -0.6, -0.8]];
        let best: { hit: V3; d: V3 } | null = null;
        for (const d of cands) {
          const hit = sdf.raycast(sh, [o[0] + d[0], o[1] + d[1], o[2] + d[2]], [-d[0], -d[1], -d[2]]) as V3 | null;
          if (hit && (!best || Math.hypot(hit[1] - o[1], hit[2] - o[2]) > Math.hypot(best.hit[1] - o[1], best.hit[2] - o[2]))) best = { hit, d };
        }
        if (best && abdKind !== 'level') {
          const { hit, d } = best;
          tip = hit;
          const sting = sdf.cone([hit[0] - d[0] * 0.012, hit[1] - d[1] * 0.012, hit[2] - d[2] * 0.012], [hit[0] + d[0] * 0.04, hit[1] + d[1] * 0.04, hit[2] + d[2] * 0.04], 0.016, 0.002).bone('abdomen');
          k.body('stinger', sting, { color: C.leg, roughness: 0.4, detail: 0.003 });
        }
      }
      if (kind.collar) {
        // A fuzzy ring at the neck that joins the head to the body.
        const ring = sdf.torus(0.075, 0.042).at(0, NECK_Y + 0.005, 0.0).displace(0.006, (x, y, z) => noise.fbm(x * 40, y * 40, z * 40, 2));
        k.body('collar', ring.bone('body'), { ...bodyLook, color: T.body });
      }

      // ------------------------------------------------------------------ head: eyes, mouth, antennae
      const headShape = sdf.ellipsoid([HR * 1.05, HR, HR * 0.95]).at(...HEAD_C);
      const faceHit = (x: number, y: number): V3 => sdf.raycast(headShape, [x, y, 2], [0, 0, -1])! as V3;
      const shape: InsectShape = { headShape, joints: { HEAD_C, HR, BODY_C }, faceHit, tint: T, tone };
      const MOUTH_Y = HEAD_C[1] - HR * 0.42;
      const front = sdf.halfSpace([0, 0, -1], -HEAD_C[2]);
      // The kind's face paint goes on first, so the mouth and the cheeks show over it.
      let head = kind.paintHead ? kind.paintHead(headShape, shape) : headShape;
      if ((kind.mouth ?? 'smile') === 'open') {
        // An open happy mouth: a dark half oval with a pink tongue, pushed through the face along Z.
        const m = sdf.ellipsoid([HR * 0.26, HR * 0.2, 0.6]).at(0, MOUTH_Y + HR * 0.06, HEAD_C[2]).intersect(sdf.halfSpace([0, 1, 0], MOUTH_Y + HR * 0.06));
        const tongue = sdf.ellipsoid([HR * 0.16, HR * 0.09, 0.6]).at(0, MOUTH_Y - HR * 0.1, HEAD_C[2]);
        head = head.paintWhere(m.intersect(front), C.mouth, 0.003).paintWhere(tongue.intersect(m).intersect(front), C.tongue, 0.003);
      } else {
        const smile = sdf.extrude(profile.arc(HR * 0.3, HR * 0.07, 220, 320), 0.6).at(0, MOUTH_Y + HR * 0.3, HEAD_C[2] + 0.3);
        head = head.paintWhere(smile.intersect(front), C.mouth, 0.003);
      }
      if (kind.cheeks) {
        const ch = faceHit(HR * 0.62, HEAD_C[1] - HR * 0.3);
        head = head.paintWhere(sdf.sphere(HR * 0.2).at(...ch).mirror('x'), C.cheek, HR * 0.12);
      }
      k.body('head-fur', head.bone('head'), {
        color: T.head,
        roughness: fuzz > 0 ? 0.85 : 0.55,
        textureDensity: 2,
        ...(fuzz > 0 ? { bump: (x: number, y: number, z: number) => fuzz * 0.0015 * noise.fbm(x * 120, y * 120, z * 120, 2) } : {}),
      });
      const es = kind.eyeScale ?? 1;
      const ER = HR * 0.28 * es;
      const eh = faceHit(HR * 0.4 * Math.max(1, es * 0.85), HEAD_C[1] + HR * 0.06);
      const eyeC: V3 = [eh[0], eh[1], eh[2] - ER * 0.45];
      const glint = sdf.sphere(ER * 0.3).at(eyeC[0] + ER * 0.28, eyeC[1] + ER * 0.36, eyeC[2] + ER * 0.82);
      const glint2 = sdf.sphere(ER * 0.14).at(eyeC[0] - ER * 0.3, eyeC[1] - ER * 0.32, eyeC[2] + ER * 0.9);
      const eyeStyle = kind.eyeStyle ?? 'dark';
      // The pupil looks a little in toward the nose.
      const look = (r: number, f: number) => sdf.sphere(ER * r).at(eyeC[0] - ER * 0.12, eyeC[1] - ER * 0.04, eyeC[2] + ER * f);
      let eyeBall = sdf.sphere(ER).at(...eyeC);
      if (eyeStyle === 'white') eyeBall = eyeBall.paintWhere(look(0.76, 0.72), C.eye, 0.002);
      if (eyeStyle === 'iris') eyeBall = eyeBall.paintWhere(look(0.72, 0.7), kind.iris ?? '#7a4a24', 0.002).paintWhere(look(0.44, 0.9), C.eye, 0.002);
      k.body('eyes', pair(eyeBall.paintWhere(sdf.union(glint, glint2), '#ffffff', 0.002)).bone('head'), {
        color: eyeStyle === 'white' ? '#fbf8f2' : C.eye,
        roughness: 0.12,
        detail: 0.003,
      });
      if (kind.nose) {
        const nh = faceHit(0, HEAD_C[1] - HR * 0.16);
        k.body('nose', sdf.ellipsoid([HR * 0.11, HR * 0.085, HR * 0.08]).at(nh[0], nh[1], nh[2] - HR * 0.02).bone('head'), { color: kind.nose, roughness: 0.4, detail: 0.003 });
      }
      const antKind = kind.antennae ?? 'ball';
      const root = sdf.raycast(headShape, [HR * 0.36, 2, HEAD_C[2] + HR * 0.1], [0, -1, 0])!;
      const [ax, ay, az] = root;
      let antenna: sdf.Shape;
      if (antKind === 'knob') {
        antenna = sdf.union(
          sdf.chain([[ax, ay - 0.01, az, 0.013], [ax + 0.025, ay + 0.07, az + 0.005, 0.011]], 0.008),
          sdf.sphere(0.04).at(ax + 0.032, ay + 0.1, az + 0.008),
        );
      } else if (antKind === 'curl') {
        // A long stalk that ends in a curl that rolls outward.
        const pts: P4[] = [
          [ax, ay - 0.01, az, 0.011],
          [ax + 0.02, ay + 0.1, az, 0.009],
        ];
        // An open curve: less than one turn, so it reads as a long bend out, not a spiral.
        const cx = ax + 0.08;
        const cy = ay + 0.12;
        for (let i = 0; i <= 10; i++) {
          const a = Math.PI - (i / 10) * Math.PI * 0.95;
          const r = 0.06 - i * 0.0015;
          pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), az + 0.005, 0.009 - i * 0.00035]);
        }
        antenna = sdf.chain(pts, 0.006);
      } else if (antKind === 'spiral') {
        // A long stalk that ends in a tight spiral of one and a half turns, rolling outward.
        const pts: P4[] = [
          [ax, ay - 0.01, az, 0.011],
          [ax + 0.02, ay + 0.1, az, 0.009],
          [ax + 0.035, ay + 0.15, az, 0.0085],
        ];
        const cx = ax + 0.075;
        const cy = ay + 0.155;
        const N = 18;
        for (let i = 0; i <= N; i++) {
          const t = i / N;
          const a = Math.PI - t * Math.PI * 3;
          const r = 0.04 * (1 - 0.72 * t);
          pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), az + 0.005, 0.0085 - 0.003 * t]);
        }
        antenna = sdf.chain(pts, 0.004);
      } else if (antKind === 'lobe') {
        // A short stalk and a big round flat lobe that leans out (a moth's feathery antenna).
        antenna = sdf.smoothUnion(
          0.01,
          sdf.chain([[ax, ay - 0.01, az, 0.013], [ax + 0.03, ay + 0.06, az + 0.005, 0.011]], 0.008),
          sdf.ellipsoid([0.058, 0.07, 0.04]).rotateZ(-25).at(ax + 0.07, ay + 0.12, az + 0.005),
        );
      } else {
        antenna = sdf.union(
          sdf.chain(
            [
              [ax, ay - 0.01, az, 0.011],
              [ax + 0.04, ay + 0.11, az + 0.01, 0.009],
              [ax + 0.08, ay + 0.19, az + 0.03, 0.008],
            ],
            0.008,
          ),
          sdf.sphere(0.026).at(ax + 0.085, ay + 0.2, az + 0.035),
        );
      }
      k.body('antennae', pair(antenna).bone('head'), { color: kind.antennaSlot ? k.tint(kind.antennaSlot) : T.stripes, roughness: 0.5, detail: 0.003 });
      if (kind.mane && kind.maneStyle === 'strands') {
        // A soft mane of fur clumps round the face only: a ring of round clumps that point out from
        // the edge of the face, and a few on top of the head, each with soft strand grooves.
        const fc: V3 = [HEAD_C[0], HEAD_C[1] - HR * 0.05, HEAD_C[2] + HR * 0.3];
        // The base: the head grown out, without the face in front, so the fur is one thick mass.
        const faceHole = sdf.cylinder(HR * 0.84, 1).rotateX(90).at(0, HEAD_C[1] - HR * 0.05, HEAD_C[2] + 0.5);
        const clumps: sdf.Shape[] = [headShape.round(HR * 0.26).subtract(faceHole.intersect(sdf.halfSpace([0, 0, -1], -(HEAD_C[2] + HR * 0.1))))];
        const NR = 20;
        for (let i = 0; i < NR; i++) {
          const a = (i / NR) * Math.PI * 2 + 0.1;
          const ca = Math.cos(a);
          const sa = Math.sin(a);
          const r0 = HR * 0.98;
          const inner: V3 = [fc[0] + ca * r0, fc[1] + sa * r0 * 0.95, fc[2] - HR * 0.08];
          const len = HR * (0.3 + 0.1 * noise.random(i, 2, 5)) * (sa < -0.5 ? 1.3 : 1);
          const outer: V3 = [inner[0] + ca * len, inner[1] + sa * len * 0.95, inner[2] - HR * 0.1];
          clumps.push(sdf.capsule(inner, outer, HR * 0.24));
        }
        for (const [x, z] of [[-0.35, -0.1], [0.35, -0.1], [0, 0.05], [0, -0.35]] as const) {
          const top = sdf.raycast(headShape, [HEAD_C[0] + HR * x, 2, HEAD_C[2] + HR * z], [0, -1, 0])!;
          clumps.push(sdf.capsule([top[0], top[1] - HR * 0.05, top[2]], [top[0] + HR * x * 0.3, top[1] + HR * 0.22, top[2] - HR * 0.1], HR * 0.2));
        }
        // The strand grooves are in the normal map only: as geometry they split the mesh into
        // thousands of UV charts and the texture bake fails.
        const mane = sdf.smoothUnion(HR * 0.1, ...clumps).displace(0.004, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2));
        k.body('mane', mane.bone('head'), {
          color: k.tint(kind.mane),
          roughness: 0.95,
          detail: 0.005,
          bump: (x, y, z) => 0.003 * (Math.abs(Math.sin(Math.atan2(y - fc[1], x - fc[0]) * 46)) - 0.5) + 0.001 * noise.fbm(x * 40, y * 40, z * 40, 2),
        });
      } else if (kind.mane) {
        // A fluffy ring that frames the face: the head grown out, without the face in front.
        const faceHole = sdf.cylinder(HR * 0.78, 1).rotateX(90).at(0, HEAD_C[1] - HR * 0.05, HEAD_C[2] + 0.5);
        const spiky = kind.maneStyle === 'spiky';
        const mane = headShape
          .round(spiky ? 0.06 : 0.055)
          .subtract(faceHole.intersect(sdf.halfSpace([0, 0, -1], -(HEAD_C[2] + HR * 0.15))))
          .displace(
            spiky ? 0.024 : 0.012,
            spiky
              ? // Tufts: a cone of fur at the middle of each cell of a latitude and longitude grid round the head.
                (x, y, z) => {
                  const [dx, dy, dz] = [x - HEAD_C[0], y - HEAD_C[1], z - HEAD_C[2]];
                  const r = Math.hypot(dx, dy, dz) || 1;
                  const lat = Math.acos(Math.max(-1, Math.min(1, dy / r))) / (Math.PI / 8);
                  const row = Math.floor(lat);
                  const lon = (Math.atan2(dx, dz) / (2 * Math.PI)) * 18 + (row % 2) * 0.5;
                  const du = lon - Math.floor(lon) - 0.5;
                  const dv = lat - row - 0.5;
                  const h = Math.max(0, 1 - 2 * Math.hypot(du, dv));
                  return 0.6 - 1.2 * h * h + 0.15 * noise.fbm(x * 30, y * 30, z * 30, 2);
                }
              : (x, y, z) => 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2) + 0.5 * Math.abs(Math.sin(Math.atan2(y - HEAD_C[1], x) * 11)),
            // The tufts are steeper than a true distance; divide the field back (see `displace`).
            spiky ? 2.6 : 1,
          );
        k.body('mane', mane.bone('head'), { color: k.tint(kind.mane), roughness: 0.95, detail: 0.004 });
      }

      // ------------------------------------------------------------------ limbs
      if (limbs === 'legs' && legStyle === 'spread') {
        // Six long thin legs that spread out to the sides: out and a little up to the knee, then down
        // and out to a small round foot; the front pair reaches forward, the back pair back.
        const legs = sdf.union(
          ...[0.42, 0, -0.42].map((turn, i) => {
            const c = Math.cos(turn);
            const sn = Math.sin(turn);
            const out = (r: number, y: number): V3 => [BODY_C[0] + c * r, BODY_C[1] + y, BODY_C[2] + sn * r];
            const hip = out(0.1, -0.06);
            const knee = out(0.18 + 0.01 * i, -0.1);
            const foot = out(0.21, -0.25 + 0.015 * i);
            return sdf.union(sdf.chain([[...hip, 0.011] as P4, [...knee, 0.009] as P4, [...foot, 0.008] as P4], 0.004), sdf.sphere(0.014).at(...foot));
          }),
        );
        k.body('legs', pair(legs).bone('leg-set'), { color: C.leg, roughness: 0.5, detail: 0.003 });
      } else if (limbs === 'legs' && legStyle === 'hang') {
        // Six long legs that hang down under the thorax, the knees a little forward and out.
        const legs = sdf.union(
          ...[0.035, -0.005, -0.045].map((z, i) => {
            const hip: V3 = [0.045, BODY_C[1] - 0.05, BODY_C[2] + z];
            const knee: V3 = [0.085, BODY_C[1] - 0.12, BODY_C[2] + z + 0.035];
            const foot: V3 = [0.075 + 0.006 * i, BODY_C[1] - 0.25 + 0.012 * i, BODY_C[2] + z + 0.005];
            return sdf.union(sdf.chain([[...hip, 0.015] as P4, [...knee, 0.013] as P4, [...foot, 0.011] as P4], 0.005), sdf.sphere(0.016).at(...foot));
          }),
        );
        k.body('legs', pair(legs).bone('leg-set'), { color: C.leg, roughness: 0.5, detail: 0.003 });
      } else if (limbs === 'legs') {
        // Six short legs folded under the body: out a little to the knee, then back in under the body.
        const bottom = abdKind === 'round' ? BODY_C[1] - 0.1 : BODY_C[1] - 0.05;
        const legs = sdf.union(
          ...[0.04, -0.01, -0.06].map((z, i) => {
            const x0 = abdKind === 'round' ? 0.08 : 0.05;
            const top: V3 = [x0, bottom + 0.02, BODY_C[2] + z * 1.4];
            const knee: V3 = [x0 + 0.035, bottom - 0.035, BODY_C[2] + z * 1.8 + 0.01];
            const foot: V3 = [x0 + 0.005 - i * 0.004, bottom - 0.07, BODY_C[2] + z * 1.6 + 0.02];
            return sdf.union(sdf.chain([[...top, 0.016] as P4, [...knee, 0.014] as P4, [...foot, 0.012] as P4], 0.006), sdf.sphere(0.019).at(...foot));
          }),
        );
        k.body('legs', pair(legs).bone('body'), { color: C.leg, roughness: 0.5, detail: 0.003 });
      } else {
        // Two small arms at the front of the body, the hands together at the chest.
        const s: V3 = [0.07, NECK_Y - 0.06, BODY_C[2] + 0.06];
        const arm =
          kind.armPose === 'out'
            ? sdf.chain([[...s, 0.022] as P4, [0.13, NECK_Y - 0.1, BODY_C[2] + 0.08, 0.019], [0.17, NECK_Y - 0.06, BODY_C[2] + 0.1, 0.022]], 0.01)
            : sdf.chain([[...s, 0.022] as P4, [0.075, NECK_Y - 0.12, BODY_C[2] + 0.11, 0.019], [0.035, NECK_Y - 0.13, BODY_C[2] + 0.14, 0.022]], 0.01);
        k.body('arms', pair(arm).bone('body'), { color: T.body, roughness: 0.6, detail: 0.004 });
      }

      // ------------------------------------------------------------------ wings
      const plate = (outline: [number, number][], thick: number) => sdf.extrude(profile.polygon(outline.map(([u, v]) => [u * ws, v * ws] as [number, number]), { smooth: true }), thick, thick * 0.45);
      let fore: sdf.Shape;
      let hind: sdf.Shape;
      let forePose: (s: sdf.Shape) => sdf.Shape;
      let hindPose: (s: sdf.Shape) => sdf.Shape;
      if (wingKind === 'butterfly') {
        // Large wings spread to the sides behind the body: the fore wings up and out, the hind wings down.
        // Broad round wings.
        fore = plate([[0, 0], [0.06, 0.1], [0.15, 0.2], [0.26, 0.22], [0.32, 0.15], [0.31, 0.05], [0.2, -0.02], [0.06, -0.03]], 0.012);
        hind = plate([[0, 0], [0.09, 0.0], [0.2, -0.04], [0.26, -0.13], [0.2, -0.22], [0.1, -0.2], [0.03, -0.09]], 0.012);
        forePose = (s) => s.rotateZ(4).rotateY(14).at(...WING_ROOT);
        hindPose = (s) => s.rotateZ(-6).rotateY(18).at(...WING2_ROOT);
      } else if (wingKind === 'moth') {
        fore = plate([[0, 0], [0.12, 0.06], [0.26, 0.09], [0.32, 0.03], [0.27, -0.04], [0.12, -0.05], [0.03, -0.03]], 0.012);
        hind = plate([[0, 0], [0.08, 0.0], [0.2, -0.04], [0.22, -0.11], [0.14, -0.15], [0.05, -0.11], [0.01, -0.04]], 0.012);
        forePose = (s) => s.rotateZ(10).rotateY(14).at(...WING_ROOT);
        hindPose = (s) => s.rotateZ(-10).rotateY(18).at(...WING2_ROOT);
      } else {
        // Small clear wings behind the body, up and back.
        fore = plate([[0, 0], [0.1, 0.05], [0.25, 0.065], [0.31, 0.015], [0.25, -0.05], [0.1, -0.04]], 0.008);
        hind = plate([[0, 0], [0.07, 0.025], [0.18, 0.025], [0.22, -0.01], [0.16, -0.05], [0.06, -0.035]], 0.008);
        forePose = (s) => s.rotateZ(40).rotateY(48).at(...WING_ROOT);
        hindPose = (s) => s.rotateZ(24).rotateY(60).at(...WING2_ROOT);
      }
      const veins = (s: sdf.Shape) =>
        s.paintFn((x, y, _z, base) => {
          const a = Math.atan2(y, x);
          return Math.abs(Math.sin(a * 7)) < 0.12 || Math.abs(Math.hypot(x, y) - 0.12) < 0.004 ? [base[0] * 0.75, base[1] * 0.75, base[2] * 0.75] : base;
        });
      const foreP = kind.paintWing ? kind.paintWing(fore, 'fore', shape) : big ? fore : veins(fore);
      const hindP = kind.paintWing ? kind.paintWing(hind, 'hind', shape) : big ? hind : veins(hind);
      const wingLook = big ? { color: T.wings, roughness: 0.6, detail: 0.003 } : { color: T.wings, roughness: 0.2, opacity: 0.5, detail: 0.003 };
      k.body('wings', pair(forePose(foreP).bone('wing.L')), wingLook);
      k.body('hind-wings', pair(hindPose(hindP).bone('wing2.L')), wingLook);
      kind.extra?.(k, shape);

      // ------------------------------------------------------------------ animation
      const { wave, keys } = motion;
      // The clips lift the body this much over the rest pose (less when the rest pose already hovers).
      const HOVER = Math.max(0, 0.08 - LIFT);
      type R3 = [number, number, number];
      // Buzzing wings beat fast and small about Y (back and forth); big wings flap slow and wide about Z... for
      // spread wings, a flap turns the wing about Y (towards the back) with the tips up.
      const beat = (p: number, cycles: number) => (big ? 34 * wave(p, Math.max(1, Math.round(cycles / 4))) : 48 * wave(p, cycles));
      // Long legs hang and swing a little behind the body's motion.
      const legsAt = (deg: number) => (longLegs ? { 'leg-set': { rotate: [deg, 0, 0] as R3 } } : {});
      // Big wings flap up and down at the sides (about the body's long axis), with a small sweep back.
      const wingsAt = (a: number, a2 = a) =>
        big
          ? {
              'wing.L': { rotate: [0, a * 0.2, a] as R3 },
              'wing.R': { rotate: [0, -a * 0.2, -a] as R3 },
              'wing2.L': { rotate: [0, a2 * 0.2, a2] as R3 },
              'wing2.R': { rotate: [0, -a2 * 0.2, -a2] as R3 },
            }
          : {
              'wing.L': { rotate: [0, 0, a] as R3 },
              'wing.R': { rotate: [0, 0, -a] as R3 },
              'wing2.L': { rotate: [0, 0, a2] as R3 },
              'wing2.R': { rotate: [0, 0, -a2] as R3 },
            };
      k.animation('idle', {
        duration: 1,
        pose: (_t, p) => ({
          body: { move: [0, HOVER + 0.025 * wave(p, 2), 0], rotate: [3 * wave(p, 1), 0, 0] },
          head: { rotate: [3 * wave(p, 2, 0.2), 8 * wave(p, 1), 0] },
          abdomen: { rotate: [6 * wave(p, 2, 0.1), 0, 0] },
          ...legsAt(6 * wave(p, 2, 0.3)),
          ...wingsAt(beat(p, 12), beat(p, 12) * 0.85),
        }),
      });
      k.animation('fly', {
        duration: 0.5,
        pose: (_t, p) => ({
          body: { move: [0, HOVER + 0.06 + 0.025 * wave(p, 1), 0], rotate: [18, 0, 3 * wave(p, 1, 0.1)] },
          head: { rotate: [-12, 0, 0] },
          abdomen: { rotate: [10 + 4 * wave(p, 1, 0.2), 0, 0] },
          ...legsAt(14 + 8 * wave(p, 1, 0.35)),
          ...wingsAt(beat(p, 8) + 6, beat(p, 8) * 0.85 + 6),
        }),
      });
      // Attack: a dart. Draw back and up (0 to 0.3), dart forward (0.3 to 0.5), hold, and return.
      k.animation('attack', {
        duration: 0.8,
        loop: false,
        pose: (_t, p) => {
          const z = keys(p, [[0, 0], [0.3, -0.06], [0.48, 0.2], [0.6, 0.2], [1, 0]] as const);
          const y = keys(p, [[0, HOVER], [0.3, HOVER + 0.05], [0.48, HOVER], [0.6, HOVER], [1, HOVER]] as const);
          const pitch = keys(p, [[0, 0], [0.3, -10], [0.48, 20], [0.6, 20], [1, 0]] as const);
          const curl = keys(p, [[0, 0], [0.3, 6], [0.46, -30], [0.62, -30], [0.85, 0], [1, 0]] as const);
          return {
            body: { move: [0, y, z], rotate: [pitch, 0, 0] },
            head: { rotate: [keys(p, [[0, 0], [0.3, -10], [0.48, 8], [1, 0]] as const), 0, 0] },
            abdomen: { rotate: [curl, 0, 0] },
            ...wingsAt(beat(p, 10) + 8, beat(p, 10) * 0.85 + 8),
          };
        },
      });
      k.animation('hit', {
        duration: 0.5,
        loop: false,
        pose: (_t, p) => {
          const h = keys(p, [[0, 0], [0.15, 1], [0.4, 0.6], [1, 0]] as const);
          return {
            body: { move: [0, HOVER + 0.04 * h, -0.08 * h], rotate: [-20 * h, 0, 10 * h] },
            head: { rotate: [-14 * h, 0, -8 * h] },
            abdomen: { rotate: [14 * h, 0, 0] },
            ...wingsAt(beat(p, 6) * (1 - 0.7 * h) + 20 * h, beat(p, 6) * (1 - 0.7 * h) + 14 * h),
          };
        },
      });
      // Death: the wings slow and stop, the insect drops and tips onto its side on the ground.
      const side = BODY_C[1] - 0.12;
      k.animation('death', {
        duration: 1.4,
        loop: false,
        // It falls from the hover to the ground.
        ...(LIFT ? { dig: LIFT + 0.01 } : {}),
        pose: (_t, p) => {
          const y = keys(p, [[0, HOVER], [0.15, HOVER + 0.04], [0.45, -LIFT], [1, -LIFT]] as const);
          const tipOver = keys(p, [[0, 0], [0.45, 0.2], [0.75, 1], [1, 1]] as const);
          const slow = Math.max(0, 1 - p / 0.45);
          return {
            body: { move: [0, y - side * tipOver * 0.6, 0], rotate: [0, 0, 70 * tipOver] },
            head: { rotate: [10 * tipOver, 0, 10 * tipOver] },
            abdomen: { rotate: [-8 * tipOver, 0, 0] },
            ...wingsAt(beat(p, 10) * slow, beat(p, 10) * slow),
          };
        },
      });
    },
  });
}
