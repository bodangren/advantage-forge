import { defineAsset, mixRgb, motion, noise, rgb, sdf } from '../../src/index.js';
import type { AnimationDef, AssetContext, AssetDefinition, BonePose } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

/**
 * Serpent kinds — a chibi serpent built along a spine path (catalog `monsters/beast/giant-snake`,
 * `sea-serpent`, `monsters/dragon/lindworm`, `monsters/small/cave-worm`; later the wildlife eel).
 * The body is a tapered chain from the tail tip to the head joint, split into one segment per bone:
 * a `root` on the ground, `spine1`, `spine2`, ... toward the head, and `tail1`, `tail2`, ... toward
 * the tail tip. The kind paints a belly on the side that faces down (on the ground) or forward (where
 * the body rises), with plate lines, and builds the default snake head (a round dome, glossy eyes, a
 * lower jaw, and a forked tongue on its own bone), or the kind builds its own head. One clip set:
 * idle (a sway and a tongue flick), walk (a slither wave), attack (a rear-back and a strike, the jaw
 * open), hit, and death (the raised body falls to the ground).
 */

const SERPENT_COLORS = {
  bellyLine: '#d8c070',
  mouth: '#5a2430',
  tongue: '#e0707e',
  fang: '#fbf6ee',
  eye: '#141012',
  nostril: '#2a3a20',
};

type V3 = readonly [number, number, number];
type P4 = readonly [number, number, number, number];
type Pose = Record<string, BonePose>;
const DEG = Math.PI / 180;
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** Where a point lies along the body: the arc length, the share of the length, and its side. */
export interface Along {
  /** The arc length from the tail tip (meters). */
  readonly s: number;
  /** The share of the whole length (0 at the tail tip, 1 at the head joint). */
  readonly t: number;
  /** +1 on the back, -1 on the belly, 0 on the flanks. */
  readonly side: number;
}

/** A serpent kind: the slots, the spine path, the head, and extra paint, bodies, bones, and poses. */
export interface SerpentKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `body`, `belly`, and `eyes` (and one more if a kind needs it); the first option of each is the default. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  readonly colors?: Partial<typeof SERPENT_COLORS>;
  /** The spine from the tail tip to the head joint: [x, y, z, radius]. */
  readonly path: readonly P4[];
  /** The index of the root joint in the path (the joints before it form the tail chain). */
  readonly root: number;
  /** The share of the belly side that gets the belly color (default 0.35; 1 or more = no belly paint). */
  readonly bellyEdge?: number;
  /** The spacing of the belly plate lines in meters (default 0.045). */
  readonly plate?: number;
  /** The share of the length (from the tail tip) where the belly color starts (default 0: the whole length). */
  readonly bellyFrom?: number;
  /**
   * The head: the round snake head (default), or a drake head (a long snout with a grin of square
   * teeth and big eyes on top, for sea serpents and lindworms); false when the kind builds its own
   * head in `head`. `tongue` defaults to true on a snake and false on a drake, `teeth` to true.
   */
  readonly face?:
    | false
    | {
        readonly style?: 'snake' | 'drake';
        readonly r?: number;
        readonly eyeR?: number;
        readonly tongue?: boolean;
        readonly fangs?: boolean;
        readonly teeth?: boolean;
        /** A drake jaw that stands open at rest by this many degrees (default 0). */
        readonly open?: number;
        /** Where the drake eyes sit, as shares of the head size (default x 0.4, y 0.55, z 0.35, lift -0.4 of the eye radius). */
        readonly eyeAt?: { readonly x?: number; readonly y?: number; readonly z?: number; readonly lift?: number };
      };
  /** The jaw joint (default: at the back of the mouth line). */
  readonly jawAt?: V3;
  /** The kind's own head, on the `head` and `jaw` bones (and `tongue`). */
  head?(k: AssetContext, serpent: SerpentShape): void;
  /** Paint on the body (markings), with the `along` helper. */
  paint?(body: sdf.Shape, serpent: SerpentShape): sdf.Shape;
  /** Extra bones (legs, fins). */
  readonly bones?: Record<string, { parent: string; at: V3; tail?: V3 }>;
  /** Extra bodies (legs, fins, a back ridge). */
  extra?(k: AssetContext, serpent: SerpentShape): void;
  /** Poses of the extra bones in a clip (`idle`, `walk`, `attack`, `hit`, `death`). */
  pose?(clip: string, p: number): Pose;
  /** How far the raised body falls in the death clip (1 = to the ground, default). */
  readonly fall?: number;
}

/** The serpent's shapes, path, and slot colors that a kind builds on. */
export interface SerpentShape {
  /** The body chain from the tail tip to the head joint. */
  readonly body: sdf.Shape;
  /** The spine path (as given) and its bone names, one per joint (the tail tip has none). */
  readonly path: readonly P4[];
  readonly boneAt: readonly string[];
  /** The head joint, and the body direction there (pointing up the body toward the head). */
  readonly headAt: V3;
  readonly headDir: V3;
  /** The head center, its size, the mouth line, and the skull (none when the kind builds its own head). */
  readonly headC: V3;
  readonly headR: number;
  readonly mouthY: number;
  readonly skull?: sdf.Shape;
  /** Where a point lies along the body. */
  along(x: number, y: number, z: number): Along;
  /**
   * The body at a share `t` of the length (0 at the tail tip, 1 at the head joint): the spine point,
   * the direction toward the head, the belly direction, the radius, and the bone that owns it.
   */
  frame(t: number): { readonly p: V3; readonly dir: V3; readonly belly: V3; readonly r: number; readonly bone: string };
  readonly tint: { readonly body: string; readonly belly: string; readonly eye: string };
  /** A fixed default color that follows a slot (`k.tint(slot, { color, follow })`). */
  tone(slot: string, color: string, follow?: number): string;
}

export function serpentAsset(kind: SerpentKind): AssetDefinition {
  const C = { ...SERPENT_COLORS, ...kind.colors };
  const P = kind.path;
  const R = kind.root;
  const n = P.length;
  const pt = (i: number): V3 => [P[i]![0], P[i]![1], P[i]![2]];
  // The bone at each joint: tail bones before the root, spine bones after it, the head at the end.
  const boneAt = P.map((_, i) => (i === n - 1 ? 'head' : i === R ? 'root' : i < R ? `tail${R - i}` : `spine${i - R}`));
  const forward = boneAt.slice(R + 1); // spine1..., head
  const backward = boneAt.slice(1, R).reverse(); // tail1, tail2, ... (toward the tip)
  // How much each forward bone's segment rises (0 flat on the ground, 1 straight up): the attack and
  // the death pitch only the raised part.
  const riseOf = (i: number) => {
    const a = pt(Math.max(0, i - 1));
    const b = pt(Math.min(n - 1, i + 1));
    const d = norm(sub(b, a));
    return Math.min(1, Math.max(0, (Math.abs(d[1]) - 0.2) * 1.6));
  };
  const rise = boneAt.map((_, i) => riseOf(i));

  // Dense samples along the path, for `along`: arc length and the belly direction at each one.
  const SAMPLES: { p: V3; s: number; belly: V3; dir: V3; r: number; bone: string }[] = [];
  let total = 0;
  for (let i = 0; i < n - 1; i++) {
    const a = pt(i);
    const b = pt(i + 1);
    const segLen = Math.hypot(...sub(b, a));
    const t = norm(sub(b, a));
    const perp = (v: V3) => norm(sub(v, scale(t, dot(v, t))));
    const v = Math.min(1, Math.abs(t[1]) * 1.4);
    const belly = norm(add(scale(perp([0, -1, 0]), 1 - v), scale(perp([0, 0, 1]), v)));
    const steps = 24;
    const bone = i >= R ? boneAt[i]! : boneAt[i + 1]!;
    for (let j = 0; j < steps; j++) {
      const u = j / steps;
      SAMPLES.push({ p: add(a, scale(sub(b, a), u)), s: total + segLen * u, belly, dir: t, r: P[i]![3] + (P[i + 1]![3] - P[i]![3]) * u, bone });
    }
    total += segLen;
  }
  const last = SAMPLES[SAMPLES.length - 1]!;
  SAMPLES.push({ ...last, p: pt(n - 1), s: total, r: P[n - 1]![3] });
  const frame = (t: number) => {
    const want = Math.max(0, Math.min(1, t)) * total;
    let i = 0;
    while (i < SAMPLES.length - 1 && SAMPLES[i + 1]!.s <= want) i++;
    const S = SAMPLES[i]!;
    return { p: S.p, dir: S.dir, belly: S.belly, r: S.r, bone: S.bone };
  };
  const along = (x: number, y: number, z: number): Along => {
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < SAMPLES.length; i++) {
      const q = SAMPLES[i]!.p;
      const d = (x - q[0]) ** 2 + (y - q[1]) ** 2 + (z - q[2]) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    const S = SAMPLES[best]!;
    const off = norm(sub([x, y, z], S.p));
    return { s: S.s, t: S.s / total, side: -dot(off, S.belly) };
  };

  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.005,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k) {
      const tone = (slot: string, color: string, follow = 1) => k.tint(slot, { color, follow });
      const T = { body: k.tint('body'), belly: k.tint('belly'), eye: k.tint('eyes') };
      const headAt = pt(n - 1);
      const headDir = norm(sub(pt(n - 1), pt(n - 2)));
      const sh = kind.face === false ? undefined : (kind.face ?? {});
      const drake = sh?.style === 'drake';
      const HR = sh?.r ?? 0.15;
      // The snake head: a wide round dome resting on the head joint, facing +Z. The drake head: a
      // round cranium over the head joint and a long snout in front of it.
      const HEAD_C: V3 = drake ? [headAt[0], headAt[1] + HR * 0.5, headAt[2] + HR * 0.05] : [headAt[0], headAt[1] + HR * 0.62, headAt[2] + HR * 0.4];
      const MY = HEAD_C[1] - HR * (drake ? 0.38 : 0.62); // the mouth line
      const TEETH = drake && sh?.teeth !== false ? HR * 0.12 : 0; // the height of the grin of teeth
      const jawAt: V3 = kind.jawAt ?? (drake ? [headAt[0], MY - TEETH, HEAD_C[2] - HR * 0.1] : [headAt[0], MY, HEAD_C[2] - HR * 0.35]);
      const bones: Record<string, { parent?: string; at: V3; tail?: V3 }> = {};
      P.forEach((_, i) => {
        if (i === 0) return;
        const name = boneAt[i]!;
        const parent = i === R ? undefined : i < R ? boneAt[i + 1]! : boneAt[i - 1]!;
        bones[name] = { ...(parent ? { parent } : {}), at: pt(i), ...(i === n - 1 ? { tail: add(pt(i), scale(headDir, 0.15)) } : {}) };
      });
      bones.jaw = { parent: 'head', at: jawAt, tail: [jawAt[0], jawAt[1] - 0.02, jawAt[2] + 0.15] };
      bones.tongue = { parent: 'head', at: [HEAD_C[0], MY, HEAD_C[2] + HR * 0.5], tail: [HEAD_C[0], MY - HR * 0.2, HEAD_C[2] + HR * 1.2] };
      k.skeleton({ ...bones, ...kind.bones } as Parameters<typeof k.skeleton>[0]);

      // ------------------------------------------------------------------ body
      // One chain segment per bone; a segment belongs to the bone at its joint nearer the root.
      const segs = P.slice(0, -1).map((a, i) => {
        const owner = i >= R ? boneAt[i]! : boneAt[i + 1]!;
        return sdf.chain([a as [number, number, number, number], P[i + 1] as [number, number, number, number]], 0.01).bone(owner);
      });
      const body = sdf.smoothUnion(0.02, ...segs);
      const edge = kind.bellyEdge ?? 0.35;
      const line = tone('belly', C.bellyLine);
      // rgb() runs inside the paint function: a slot mask build reads the colors at that time.
      const bodyPainted = edge >= 1 ? body : body.paintFn((x, y, z, c) => {
        const a = along(x, y, z);
        const from = kind.bellyFrom ? Math.min(1, Math.max(0, (a.t - kind.bellyFrom) / 0.04 + 0.5)) : 1;
        const w = Math.min(1, Math.max(0, (-a.side - edge) / 0.12 + 0.5)) * from;
        if (w <= 0) return c;
        const plate = rgb((a.s / (kind.plate ?? 0.045)) % 1 < 0.1 ? line : T.belly);
        return mixRgb(c, plate, w);
      });
      const serpent: SerpentShape = {
        body,
        path: P,
        boneAt,
        headAt,
        headDir,
        headC: HEAD_C,
        headR: HR,
        mouthY: MY,
        along,
        frame,
        tint: { body: T.body, belly: T.belly, eye: T.eye },
        tone,
      };
      k.body('body', kind.paint ? kind.paint(bodyPainted, serpent) : bodyPainted, {
        color: T.body,
        roughness: 0.6,
        textureDensity: 1.5,
        bump: (x, y, z) => 0.0005 * noise.fbm(x * 80, y * 80, z * 80, 2),
      });

      // ------------------------------------------------------------------ the drake head
      if (sh && drake) {
        const SZ = HEAD_C[2] + HR * 0.7; // the snout center
        const raw = sdf.smoothUnion(
          0.06,
          sdf.ellipsoid([HR * 0.82, HR * 0.78, HR * 0.8]).at(...HEAD_C),
          sdf.ellipsoid([HR * 0.7, HR * 0.46, HR * 0.9]).at(HEAD_C[0], HEAD_C[1] - HR * 0.12, SZ),
        );
        // The upper snout ends flat at the mouth line; the teeth and the jaw sit under it.
        const skull = raw.smoothSubtract(0.015, sdf.box([HR * 3, HR, HR * 3]).at(HEAD_C[0], MY - HR * 0.5, HEAD_C[2] + HR * 1.3));
        const top = (x: number, z: number): V3 => sdf.raycast(skull, [x, 2, z], [0, -1, 0])! as V3;
        const nose = top(HR * 0.2, SZ + HR * 0.62);
        const nostrils = sdf.union(sdf.sphere(0.009).at(nose[0], nose[1], nose[2]), sdf.sphere(0.009).at(-nose[0], nose[1], nose[2]));
        k.body('skull', skull.paintWhere(nostrils, C.nostril, 0.003).bone('head'), { color: T.body, roughness: 0.6, textureDensity: 1.8 });
        (serpent as { skull?: sdf.Shape }).skull = skull;
        // Big round eyes on top of the cranium, looking forward: a white ball, a slot-colored iris, a
        // dark pupil, and a shine.
        const eyeR = sh.eyeR ?? HR * 0.3;
        const ea = sh.eyeAt ?? {};
        const eyeAt = sdf.surfacePoint(skull, [HR * (ea.x ?? 0.4), HEAD_C[1] + HR * (ea.y ?? 0.55), HEAD_C[2] + HR * (ea.z ?? 0.35)], eyeR * (ea.lift ?? -0.4));
        const look = (d: number, r: number) => sdf.sphere(r).at(eyeAt[0] + eyeR * 0.12, eyeAt[1], eyeAt[2] + d);
        const eye = sdf
          .sphere(eyeR)
          .at(...eyeAt)
          .paintWhere(look(eyeR * 0.82, eyeR * 0.62), T.eye, 0.003)
          .paintWhere(look(eyeR * 0.95, eyeR * 0.36), C.eye, 0.002)
          .paintWhere(sdf.sphere(eyeR * 0.2).at(eyeAt[0] + eyeR * 0.3, eyeAt[1] + eyeR * 0.4, eyeAt[2] + eyeR * 0.85), '#ffffff', 0.002);
        k.body('eyes', eye.mirror('x').bone('head'), { color: '#fbf8f2', roughness: 0.15, textureDensity: 2, detail: 0.003 });
        // The lower jaw: flat on top under the teeth and rising toward the back, so the corners of the
        // mouth close; the chin in the belly color.
        const jawTop = MY - TEETH;
        const zf = SZ + HR * 0.5;
        const lid = sdf.halfSpace([0, 1, 0.13], (jawTop + 0.13 * zf) / Math.hypot(1, 0.13));
        const jaw = sdf
          .ellipsoid([HR * 0.62, HR * 0.26, HR * 0.84])
          .at(HEAD_C[0], jawTop - HR * 0.06, SZ - HR * 0.08)
          .smoothIntersect(0.012, lid.intersect(sdf.sphere(HR * 2).at(...HEAD_C)));
        const chin = jaw.paintWhere(sdf.halfSpace([0, 1, 0], jawTop - HR * 0.14), T.belly, 0.01);
        const open = sh.open ?? 0;
        const hinge = (s: sdf.Shape, deg: number) => s.at(-jawAt[0], -jawAt[1], -jawAt[2]).rotateX(deg).at(...jawAt);
        k.body('chin', open ? hinge(chin, open) : chin, { color: T.body, roughness: 0.6, bone: 'jaw' });
        // The dark mouth behind the teeth (filling the gap of an open jaw), and a grin of square teeth
        // along the front of the snout.
        const mouth = sdf.ellipsoid([HR * 0.55, HR * 0.1 + TEETH * 0.5, HR * 0.72]).at(HEAD_C[0], MY - TEETH * 0.5, SZ - HR * 0.08);
        k.body('mouth', (open ? sdf.union(mouth, hinge(mouth, open * 0.5), hinge(mouth, open * 0.85)) : mouth).bone('head'), {
          color: C.mouth,
          roughness: 0.6,
        });
        if (TEETH > 0) {
          // The snout's outline at the mouth line is an ellipse; the teeth stand just inside it.
          const ax = HR * 0.7 * Math.sqrt(1 - ((MY - (HEAD_C[1] - HR * 0.12)) / (HR * 0.46)) ** 2) * 0.88;
          const az = (ax / 0.7) * 0.9;
          const teeth = sdf.union(
            ...[-3, -2, -1, 0, 1, 2, 3].map((i) => {
              const a = i * 24;
              return sdf
                .box([HR * 0.13, TEETH * 1.3, HR * 0.07], 0.004)
                .rotateY(a)
                .at(HEAD_C[0] + ax * Math.sin(a * DEG), MY - TEETH * 0.5, SZ + az * Math.cos(a * DEG));
            }),
          );
          k.body('teeth', teeth.bone('head'), { color: C.fang, roughness: 0.3, detail: 0.003 });
        }
        if (sh.fangs) {
          const fang = (x: number) => sdf.cone([x, MY, SZ + HR * 0.55], [x, MY - TEETH - HR * 0.2, SZ + HR * 0.6], 0.014, 0.002);
          k.body('fangs', sdf.union(fang(HR * 0.34), fang(-HR * 0.34)).bone('head'), { color: C.fang, roughness: 0.3, detail: 0.003 });
        }
      }

      // ------------------------------------------------------------------ the default snake head
      if (sh && !drake) {
        const dome = sdf.smoothUnion(
          0.04,
          sdf.ellipsoid([HR, HR * 0.82, HR * 0.92]).at(...HEAD_C),
          sdf.ellipsoid([HR * 0.72, HR * 0.5, HR * 0.6]).at(HEAD_C[0], HEAD_C[1] - HR * 0.3, HEAD_C[2] + HR * 0.4), // the snout
        );
        const face = (x: number, y: number): V3 => sdf.raycast(dome, [x, y, 2], [0, 0, -1])! as V3;
        const nose = face(HR * 0.2, HEAD_C[1] - HR * 0.25);
        const nostrils = sdf.union(sdf.sphere(0.008).at(nose[0], nose[1], nose[2]), sdf.sphere(0.008).at(-nose[0], nose[1], nose[2]));
        // The throat and the chin in the belly color, on the front half only (no collar from behind).
        const front = sdf.halfSpace([0, 0, -1], -(HEAD_C[2] - HR * 0.2));
        const throat = sdf.halfSpace([0, 1, 0], MY).intersect(front);
        const head = dome.paintWhere(throat, T.belly, 0.012).paintWhere(nostrils, C.nostril, 0.003);
        k.body('skull', head.bone('head'), { color: T.body, roughness: 0.6, textureDensity: 1.8 });
        (serpent as { skull?: sdf.Shape }).skull = dome;
        // Glossy eyes on the sides of the dome, looking forward and out.
        const eyeR = sh.eyeR ?? HR * 0.26;
        const eyeAt = sdf.surfacePoint(dome, [HR * 0.62, HEAD_C[1] + HR * 0.08, HEAD_C[2] + HR * 0.66], -eyeR * 0.5);
        const eye = sdf
          .sphere(eyeR)
          .at(...eyeAt)
          .paintWhere(sdf.sphere(eyeR * 0.36).at(eyeAt[0] + eyeR * 0.15, eyeAt[1] + eyeR * 0.45, eyeAt[2] + eyeR * 0.75), '#ffffff', 0.002);
        k.body('eyes', eye.mirror('x').bone('head'), { color: C.eye, roughness: 0.1, textureDensity: 2, detail: 0.003 });
        // A lower jaw under the dome, and a dark mouth inside that shows when it opens.
        const jaw = sdf.ellipsoid([HR * 0.74, HR * 0.2, HR * 0.78]).at(HEAD_C[0], MY - HR * 0.1, HEAD_C[2] + HR * 0.22);
        k.body('chin', jaw.paintWhere(sdf.halfSpace([0, 1, 0], MY - HR * 0.14).intersect(front), T.belly, 0.01), { color: T.body, roughness: 0.6, bone: 'jaw' });
        k.body('mouth', sdf.ellipsoid([HR * 0.66, HR * 0.18, HR * 0.7]).at(HEAD_C[0], MY + HR * 0.02, HEAD_C[2] + HR * 0.26).bone('head'), { color: C.mouth, roughness: 0.6 });
        if (sh.fangs) {
          const fang = (x: number) => sdf.cone([x, MY + HR * 0.04, HEAD_C[2] + HR * 0.8], [x, MY - HR * 0.18, HEAD_C[2] + HR * 0.84], 0.012, 0.002);
          k.body('fangs', sdf.union(fang(HR * 0.22), fang(-HR * 0.22)).bone('head'), { color: C.fang, roughness: 0.3, detail: 0.003 });
        }
        if (sh.tongue !== false) {
          // A forked tongue that hangs from the front of the mouth.
          const t0: V3 = [HEAD_C[0], MY - HR * 0.04, HEAD_C[2] + HR * 0.7];
          const tongue = sdf.smoothUnion(
            0.006,
            sdf.capsule(t0, [t0[0], t0[1] - HR * 0.25, t0[2] + HR * 0.35], 0.012),
            sdf.capsule([t0[0], t0[1] - HR * 0.25, t0[2] + HR * 0.35], [t0[0] + HR * 0.12, t0[1] - HR * 0.55, t0[2] + HR * 0.4], 0.009),
            sdf.capsule([t0[0], t0[1] - HR * 0.25, t0[2] + HR * 0.35], [t0[0] - HR * 0.12, t0[1] - HR * 0.55, t0[2] + HR * 0.4], 0.009),
          );
          k.body('forked-tongue', tongue.bone('tongue'), { color: C.tongue, roughness: 0.4, detail: 0.003 });
        }
      }
      kind.head?.(k, serpent);
      kind.extra?.(k, serpent);

      // ------------------------------------------------------------------ animation
      const { wave, bump, keys } = motion;
      type Rot = [number, number, number];
      const anim = (name: string, def: AnimationDef) =>
        k.animation(name, kind.pose ? { ...def, pose: (t, p) => ({ ...def.pose(t, p), ...kind.pose!(name, p) }) } : def);
      const fwdIdx = forward.map((b) => boneAt.indexOf(b));
      /** The raised part pitches by `deg` per bone (weighted by how much it rises), the flat part sways by `yaw`. */
      const chain = (pose: Record<string, { rotate?: Rot; move?: Rot; scale?: Rot }>, deg: (j: number) => number, yaw: (j: number) => number, roll = 0) => {
        forward.forEach((b, j) => {
          const w = rise[fwdIdx[j]!]!;
          pose[b] = { rotate: [deg(j) * w, yaw(j), roll * w] };
        });
      };
      const tailWave = (pose: Record<string, { rotate?: Rot }>, p: number, amp: number, cycles: number) => {
        backward.forEach((b, j) => {
          pose[b] = { rotate: [0, amp * wave(p, cycles, j * 0.12), 0] };
        });
      };
      const HIDE: Rot = [0.001, 0.001, 0.001];

      // Idle: a slow sway of the raised body, the head looking around, the tail tip twitching, and
      // a quick tongue flick twice.
      anim('idle', {
        duration: 2.4,
        pose: (_t, p) => {
          const pose: Record<string, { rotate?: Rot; move?: Rot; scale?: Rot }> = {};
          chain(pose, (j) => 2 * wave(p, 1, 0.1 * j), (j) => 3 * wave(p, 1, 0.08 * j));
          pose.head = { rotate: [2 * wave(p, 2), 8 * wave(p, 1, 0.3), 3 * wave(p, 1, 0.1)] };
          tailWave(pose, p, 6, 1);
          const flick = Math.max(keys(p, [[0.2, 0], [0.24, 1], [0.3, 0.2], [0.34, 1], [0.4, 0]]), keys(p, [[0.7, 0], [0.74, 1], [0.8, 0]]));
          pose.tongue = { rotate: [-10 * flick, 0, 0], scale: [1, 1 + 0.4 * flick, 1] };
          return pose;
        },
      });

      // Walk: a slither in place; a wave runs down the body from the head to the tail tip.
      anim('walk', {
        duration: 1.0,
        pose: (_t, p) => {
          const pose: Record<string, { rotate?: Rot; move?: Rot; scale?: Rot }> = { root: { rotate: [0, 6 * wave(p, 1, 0.5), 0] } };
          chain(pose, (j) => 2 * bump(p, 2), (j) => 8 * wave(p, 1, 0.4 - j * 0.1) * (1 - rise[fwdIdx[j]!]! * 0.6));
          pose.head = { rotate: [0, -6 * wave(p, 1, 0.1), 0] };
          tailWave(pose, p, 14, 1);
          return pose;
        },
      });

      // Attack: it draws the raised body back with the jaw opening, strikes forward and down, the
      // jaw snaps shut, and it recoils to rest.
      anim('attack', {
        duration: 0.9,
        loop: false,
        pose: (_t, p) => {
          const back = keys(p, [[0, 0], [0.3, 1], [0.38, 1], [0.48, -1.3], [0.6, -1.2], [1, 0]]);
          const jaw = keys(p, [[0, 0], [0.25, 0.6], [0.42, 1], [0.5, 0], [1, 0]]);
          const pose: Record<string, { rotate?: Rot; move?: Rot; scale?: Rot }> = {};
          chain(pose, () => -12 * back, () => 0);
          pose.head = { rotate: [6 * back, 0, 0] };
          pose.jaw = { rotate: [34 * jaw, 0, 0] };
          pose.tongue = { scale: HIDE };
          tailWave(pose, p, 10 * Math.abs(back), 2);
          return pose;
        },
      });

      // Hit: a jolt back with a shake of the head.
      anim('hit', {
        duration: 0.5,
        loop: false,
        pose: (_t, p) => {
          const s = keys(p, [[0, 0], [0.16, 1], [0.36, 0.8], [1, 0]]);
          const pose: Record<string, { rotate?: Rot; move?: Rot; scale?: Rot }> = {};
          chain(pose, () => -9 * s, () => 0);
          pose.head = { rotate: [-10 * s, 10 * s * wave(p, 3), 0] };
          pose.jaw = { rotate: [18 * s, 0, 0] };
          tailWave(pose, p, 12 * s, 2);
          return pose;
        },
      });

      // Death: a cry with the jaw open, then the raised body topples forward and to the side onto the
      // ground, the head rolls, and the tail goes limp.
      const fall = kind.fall ?? 1;
      anim('death', {
        duration: 1.4,
        loop: false,
        pose: (_t, p) => {
          const cry = keys(p, [[0, 0], [0.12, 1], [0.26, 1], [0.36, 0]]);
          const drop = keys(p, [[0.28, 0], [0.62, 1], [0.68, 0.94], [0.74, 1]]);
          const pose: Record<string, { rotate?: Rot; move?: Rot; scale?: Rot }> = {};
          chain(pose, () => (-8 * cry + 22 * drop) * fall, () => 0, 10 * drop * fall);
          pose.head = { rotate: [-14 * cry + 10 * drop, 0, 30 * drop] };
          pose.jaw = { rotate: [26 * cry + 10 * drop, 0, 0] };
          pose.tongue = { scale: drop > 0.5 ? [1, 1, 1] : HIDE };
          tailWave(pose, p, 8 * (1 - drop), 2);
          return pose;
        },
      });
    },
  });
}
