import { defineAsset, motion, noise, profile, sdf } from '../../src/index.js';
import type { AnimationDef, AssetContext, AssetDefinition, BonePose } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

/**
 * Toad kinds — a chibi toad or frog sitting on the ground (catalog `monsters/beast/giant-toad`, later
 * `wildlife/water/frog`). One body plan: a round squat body that rises into a wide face, two eye
 * bumps with big round eyes on top, a wide smile, a pale belly, chunky front legs with three round
 * fingers, and folded back legs with long toes. A tongue on its own bone lies hidden in the mouth
 * and shoots out in the attack (as the dragon's breath, it is built tiny and scaled up in the
 * attack and the death). Clips: idle (breathing and a throat pulse), walk (a hop in place),
 * attack (a tongue lash), hit, and death (it flops flat with the legs out).
 * A kind sets the size, the palette, and the slots, and may add paint (spots) and bodies.
 */

const TOAD_COLORS = {
  mouth: '#8a3a4a',
  lip: '#f4b8b0',
  tongue: '#e86a7a',
  pupil: '#141012',
};

type V3 = [number, number, number];
type Pose = Record<string, BonePose>;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];

// Joints (at size 1): a round body sitting up, the wide face on top; the back legs fold beside it.
const HIPS: V3 = [0, 0.2, -0.02];
const CHEST: V3 = [0, 0.36, 0.02];
const HEAD: V3 = [0, 0.48, 0.05];
const SHOULDER: V3 = [0.17, 0.3, 0.08];
const ELBOW: V3 = [0.235, 0.17, 0.12];
const WRIST: V3 = [0.19, 0.05, 0.18];
const HIP: V3 = [0.16, 0.15, -0.08];
const KNEE: V3 = [0.29, 0.13, 0.03];
const ANKLE: V3 = [0.25, 0.05, -0.1];
const MOUTH_Y = 0.415;
const MOUTH_Z = 0.2; // the tongue root, inside the mouth
// The tongue is built at TONGUE_REST of its length, hidden in the mouth, so the rest pose and the
// static sprites show no tongue; the attack scales the `tongue` bone up to full size.
const TONGUE_REST = 0.08;

/** A toad kind: the slots, the size, the fixed colors, and extra paint, bodies, and poses. */
export interface ToadKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `skin`, `belly`, and `eyes` (and one more if a kind needs it); the first option of each is the default. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  readonly colors?: Partial<typeof TOAD_COLORS>;
  /** The size: 1 is a giant toad about 0.64 m tall to the eyes (default 1). */
  readonly size?: number;
  /** Warts: small bumps on the back (default true). */
  readonly warts?: boolean;
  /** Paint on the skin (spots, stripes), in rest-pose meters at size 1. */
  paint?(skin: sdf.Shape, toad: ToadShape): sdf.Shape;
  /** Extra bodies (a crown, a lily pad), at size 1. */
  extra?(k: AssetContext, toad: ToadShape): void;
  /** Poses of extra bones in a clip. */
  pose?(clip: string, p: number): Pose;
}

/** The toad's shapes and slot colors that a kind builds on (at size 1). */
export interface ToadShape {
  /** The body and face (no legs), for surface points. */
  readonly body: sdf.Shape;
  readonly tint: { readonly skin: string; readonly belly: string; readonly eye: string };
  /** A fixed default color that follows a slot (`k.tint(slot, { color, follow })`). */
  tone(slot: string, color: string, follow?: number): string;
}

export function toadAsset(kind: ToadKind): AssetDefinition {
  const C = { ...TOAD_COLORS, ...kind.colors };
  const S = kind.size ?? 1;
  const at = (p: V3): V3 => [p[0] * S, p[1] * S, p[2] * S];
  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.005,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k) {
      const tone = (slot: string, color: string, follow = 1) => k.tint(slot, { color, follow });
      const T = { skin: k.tint('skin'), skinDark: k.tint('skin', -0.25), belly: k.tint('belly'), eye: k.tint('eyes') };
      // Everything is built at size 1 and scaled once per body.
      const sized = (s: sdf.Shape) => (S === 1 ? s : s.scale(S));

      // ------------------------------------------------------------------ skeleton
      k.skeleton({
        hips: { at: at(HIPS) },
        chest: { parent: 'hips', at: at(CHEST) },
        head: { parent: 'chest', at: at(HEAD), tail: at([0, 0.6, 0.12]) },
        tongue: { parent: 'head', at: at([0, MOUTH_Y, MOUTH_Z]), tail: at([0, MOUTH_Y, MOUTH_Z + 0.42]) },
        'arm.L': { parent: 'chest', at: at(SHOULDER) },
        'hand.L': { parent: 'arm.L', at: at(WRIST) },
        'arm.R': { parent: 'chest', at: at(mx(SHOULDER)) },
        'hand.R': { parent: 'arm.R', at: at(mx(WRIST)) },
        'thigh.L': { parent: 'hips', at: at(HIP) },
        'shin.L': { parent: 'thigh.L', at: at(KNEE) },
        'foot.L': { parent: 'shin.L', at: at(ANKLE), tail: at([0.3, 0.02, 0.08]) },
        'thigh.R': { parent: 'hips', at: at(mx(HIP)) },
        'shin.R': { parent: 'thigh.R', at: at(mx(KNEE)) },
        'foot.R': { parent: 'shin.R', at: at(mx(ANKLE)), tail: at([-0.3, 0.02, 0.08]) },
      });

      // ------------------------------------------------------------------ body and face
      const body = sdf.smoothUnion(
        0.06,
        sdf.ellipsoid([0.25, 0.24, 0.22]).at(0, 0.24, -0.02).bone('hips'),
        sdf.ellipsoid([0.27, 0.15, 0.21]).at(0, 0.43, 0.03).bone('head'),
        // The eye bumps on top of the face.
        pair(sdf.sphere(0.078).at(0.13, 0.55, 0.06)).bone('head'),
      );
      const toad: ToadShape = { body, tint: { skin: T.skin, belly: T.belly, eye: T.eye }, tone };
      // A wide smile: a dark crescent across the front with a pale lip below it.
      const smile = sdf.extrude(profile.arc(0.26, 0.06, 234, 306), 0.5).at(0, MOUTH_Y + 0.26, 0.2);
      const lip = sdf.extrude(profile.arc(0.26, 0.022, 236, 304), 0.5).at(0, MOUTH_Y + 0.26 - 0.04, 0.2);
      // The pale belly and throat at the front, below the smile.
      const bellyZone = sdf.ellipsoid([0.2, 0.24, 0.3]).at(0, 0.2, 0.15).displace(0.008, (x, y, z) => noise.fbm(x * 12, y * 12, z * 12, 2));
      const warts = kind.warts === false ? undefined : sdf.union(
        ...Array.from({ length: 22 }, (_, i) => {
          const a = noise.random(i, 2, 9) * Math.PI * 1.6 + Math.PI * 0.7; // the back and the flanks
          const y = 0.18 + noise.random(i, 4, 1) * 0.3;
          const p = sdf.surfacePoint(body, [Math.sin(a) * 0.3, y, Math.cos(a) * 0.3], -0.006);
          return sdf.sphere(0.012 + noise.random(i, 6, 3) * 0.01).at(...p);
        }),
      );
      let skin: sdf.Shape = warts ? sdf.smoothUnion(0.008, body, warts) : body;
      skin = skin.paintWhere(bellyZone, T.belly, 0.01);
      if (kind.paint) skin = kind.paint(skin, toad);
      skin = skin.paintWhere(smile, C.mouth, 0.003).paintWhere(lip, tone('belly', C.lip, 0.4), 0.003);
      k.body('skin', sized(skin), {
        color: T.skin,
        roughness: 0.55,
        textureDensity: 1.6,
        bump: (x, y, z) => 0.0008 * noise.fbm(x * 70, y * 70, z * 70, 2),
      });

      // ------------------------------------------------------------------ eyes
      // Big round eyes on the bumps: a slot-colored ball, a wide dark pupil, and a shine.
      const eyeAt: V3 = [0.14, 0.565, 0.095];
      const eye = sdf
        .sphere(0.06)
        .at(...eyeAt)
        .paintWhere(sdf.ellipsoid([0.032, 0.026, 0.05]).at(eyeAt[0] - 0.004, eyeAt[1] - 0.004, eyeAt[2] + 0.04), C.pupil, 0.002)
        .paintWhere(sdf.sphere(0.014).at(eyeAt[0] + 0.014, eyeAt[1] + 0.024, eyeAt[2] + 0.048), '#ffffff', 0.001);
      k.body('eyes', sized(pair(eye).bone('head')), { color: T.eye, roughness: 0.12, textureDensity: 2, detail: 0.003 });
      // Lids: the skin over the top back of each eye.
      const lid = sdf
        .sphere(0.066)
        .at(...eyeAt)
        .intersect(sdf.halfSpace([0, -0.55, 0.85], -0.55 * eyeAt[1] + 0.85 * eyeAt[2] - 0.022));
      k.body('lids', sized(pair(lid).bone('head')), { color: T.skin, roughness: 0.55 });

      // ------------------------------------------------------------------ legs
      // Front legs: a chunky arm to a hand of three round fingers on the ground.
      const fingers = sdf.union(
        ...[-35, 0, 35].map((deg) => {
          const a = (deg * Math.PI) / 180;
          const tip: V3 = [WRIST[0] + Math.sin(a) * 0.055, 0.016, WRIST[2] + Math.cos(a) * 0.05];
          return sdf.smoothUnion(0.006, sdf.capsule([WRIST[0], 0.022, WRIST[2]], tip, 0.012), sdf.sphere(0.017).at(...tip));
        }),
      );
      const arm = sdf.smoothUnion(
        0.02,
        sdf.chain([[...SHOULDER, 0.068], [...ELBOW, 0.056], [WRIST[0], WRIST[1] - 0.008, WRIST[2], 0.044]], 0.01).bone('arm.L'),
        fingers.bone('hand.L'),
      );
      // Back legs: a fat thigh forward to the knee, the shin folded back under it, and a long foot
      // with four toes forward and out.
      const toes = sdf.union(
        ...[-20, 5, 30, 55].map((deg) => {
          const a = (deg * Math.PI) / 180;
          const tip: V3 = [ANKLE[0] + Math.sin(a) * 0.13, 0.016, ANKLE[2] + 0.06 + Math.cos(a) * 0.12];
          return sdf.smoothUnion(0.006, sdf.capsule([ANKLE[0], 0.025, ANKLE[2] + 0.05], tip, 0.012), sdf.sphere(0.018).at(...tip));
        }),
      );
      const leg = sdf.smoothUnion(
        0.025,
        sdf.chain([[...HIP, 0.085], [...KNEE, 0.07]], 0.02).bone('thigh.L'),
        sdf.chain([[...KNEE, 0.062], [...ANKLE, 0.045]], 0.02).bone('shin.L'),
        sdf.smoothUnion(0.02, sdf.ellipsoid([0.04, 0.025, 0.07]).at(ANKLE[0] + 0.01, 0.03, ANKLE[2] + 0.05), toes).bone('foot.L'),
      );
      k.body('legs', sized(pair(sdf.union(arm, leg)).paintWhere(sdf.halfSpace([0, 1, 0], 0.03), T.skinDark, 0.02)), {
        color: T.skin,
        roughness: 0.55,
        bump: (x, y, z) => 0.0006 * noise.fbm(x * 70, y * 70, z * 70, 2),
      });

      // ------------------------------------------------------------------ tongue (hidden in the mouth)
      const tongue = sdf
        .smoothUnion(
          0.02,
          sdf.capsule([0, 0, 0], [0, 0.01, 0.38], 0.022),
          sdf.sphere(0.045).scale([1, 0.75, 1]).at(0, 0.01, 0.4),
        )
        .scale(TONGUE_REST)
        .at(0, MOUTH_Y, MOUTH_Z);
      k.body('tongue-mesh', sized(tongue.bone('tongue')), { color: C.tongue, roughness: 0.35, detail: 0.002 });

      kind.extra?.(k, toad);

      // ------------------------------------------------------------------ animation
      const { wave, bump, keys } = motion;
      const anim = (name: string, def: AnimationDef) =>
        k.animation(name, kind.pose ? { ...def, pose: (t, p) => ({ ...def.pose(t, p), ...kind.pose!(name, p) }) } : def);
      const m = (v: number) => v * S; // a move in meters at the kind's size

      // Idle: slow breathing, a throat pulse, and a small look around.
      anim('idle', {
        duration: 2.4,
        pose: (_t, p) => ({
          chest: { scale: [1 + 0.03 * bump(p, 2), 1 + 0.02 * bump(p, 2), 1 + 0.03 * bump(p, 2)] },
          head: { rotate: [2 * wave(p, 1, 0.2), 8 * wave(p, 1, 0.4), 0] },
        }),
      });

      // Walk: a hop in place. It crouches, the back legs kick out straight, the body flies up and
      // forward-tilted, and it lands with a squash.
      anim('walk', {
        duration: 0.9,
        pose: (_t, p) => {
          const crouch = keys(p, [[0, 0], [0.18, 1], [0.28, 0], [0.62, 0], [0.72, 1], [0.88, 0.2], [1, 0]]);
          const up = keys(p, [[0.2, 0], [0.32, 0.6], [0.45, 1], [0.58, 0.6], [0.68, 0]]);
          const kick = keys(p, [[0.2, 0], [0.3, 1], [0.5, 0.8], [0.66, 0]]);
          return {
            hips: { move: [0, m(0.12 * up - 0.03 * crouch), 0], rotate: [-12 * up + 4 * crouch, 0, 0] },
            chest: { scale: [1 + 0.05 * crouch, 1 - 0.06 * crouch, 1 + 0.03 * crouch] },
            head: { rotate: [6 * up, 0, 0] },
            'thigh.L': { rotate: [50 * kick, -30 * kick, 0] },
            'thigh.R': { rotate: [50 * kick, 30 * kick, 0] },
            'shin.L': { rotate: [-40 * kick, 0, 0] },
            'shin.R': { rotate: [-40 * kick, 0, 0] },
            'arm.L': { rotate: [-25 * up, 0, 10 * up] },
            'arm.R': { rotate: [-25 * up, 0, -10 * up] },
            };
        },
      });

      // Attack: a tongue lash. It leans back and gulps, leans forward, the tongue shoots out and
      // snaps back, and it settles with a pleased bob.
      anim('attack', {
        duration: 0.9,
        loop: false,
        pose: (_t, p) => {
          const lean = keys(p, [[0, 0], [0.22, -1], [0.34, 1], [0.6, 0.8], [1, 0]]);
          const out = Math.max(TONGUE_REST, keys(p, [[0.3, 0], [0.36, 1], [0.5, 1], [0.6, 0]], 'linear')) / TONGUE_REST;
          return {
            hips: { rotate: [6 * lean, 0, 0] },
            chest: { rotate: [6 * lean, 0, 0] },
            head: { rotate: [-4 * lean, 0, 0] },
            tongue: { scale: [out, out, out] },
            'arm.L': { rotate: [-8 * lean, 0, 0] },
            'arm.R': { rotate: [-8 * lean, 0, 0] },
          };
        },
      });

      // Hit: a squash and a jolt back, the eyes shut tight (the head drops).
      anim('hit', {
        duration: 0.5,
        loop: false,
        pose: (_t, p) => {
          const s = keys(p, [[0, 0], [0.15, 1], [0.4, 0.6], [1, 0]]);
          return {
            hips: { move: [0, m(-0.02 * s), m(-0.03 * s)], rotate: [-8 * s, 0, 0] },
            chest: { scale: [1 + 0.08 * s, 1 - 0.1 * s, 1 + 0.05 * s] },
            head: { rotate: [-10 * s, 10 * s * wave(p, 3), 0] },
            };
        },
      });

      // Death: a croak with the head up, then it flops flat on its belly, the legs slide out to the
      // sides, and the tongue hangs out a little.
      anim('death', {
        duration: 1.4,
        loop: false,
        pose: (_t, p) => {
          const croak = keys(p, [[0, 0], [0.12, 1], [0.28, 1], [0.38, 0]]);
          const flop = keys(p, [[0.3, 0], [0.62, 1], [0.7, 0.92], [0.78, 1]]);
          const tip = Math.max(TONGUE_REST, keys(p, [[0.6, 0], [0.8, 0.3]])) / TONGUE_REST;
          return {
            hips: { move: [0, m(-0.06 * flop), 0], rotate: [4 * flop, 0, 0] },
            chest: { scale: [1 + 0.06 * flop, 1 - 0.1 * flop, 1], rotate: [8 * flop, 0, 0] },
            head: { rotate: [-16 * croak + 14 * flop, 0, 10 * flop] },
            'arm.L': { rotate: [-20 * flop, 0, 50 * flop] },
            'arm.R': { rotate: [-20 * flop, 0, -50 * flop] },
            'thigh.L': { rotate: [30 * flop, 0, 25 * flop] },
            'thigh.R': { rotate: [30 * flop, 0, -25 * flop] },
            tongue: { scale: [tip, tip, tip] },
          };
        },
      });
    },
  });
}
