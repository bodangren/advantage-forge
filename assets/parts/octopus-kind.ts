import { defineAsset, motion, noise, profile, sdf } from '../../src/index.js';
import type { AnimationDef, AssetContext, AssetDefinition, BonePose } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

/**
 * Octopus kinds — a chibi octopus: a round head dome with a face and tentacles that leave its base
 * (catalog `monsters/abyssal-and-cosmic/void-tentacle` and `monsters/beast/kraken`). Each tentacle is
 * a tapered chain in its own vertical plane at an angle around the body, given as points
 * (out, up, radius) in that plane; every joint but the tip gets a bone (`arm<i>_<j>`), so the
 * tentacles curl and sway in every clip. The face: two glossy eyes, a small smile, and optional
 * small bumps on the dome. Clips: idle (a slow curl wave), walk (a crawl in place: the tentacles push
 * in turn and the body bobs), attack (the front tentacles rear up and slam down), hit, and death (the
 * head slumps and the tentacles go limp). A kind sets the shape and the palette and may add paint,
 * bodies (a portal, glowing tips), and poses.
 */

const OCTO_COLORS = {
  eye: '#141018',
  mouth: '#d84a5a',
  suckers: '#f0d8e0',
};

type V3 = [number, number, number];
type Pose = Record<string, BonePose>;
const DEG = Math.PI / 180;

/** One tentacle: its angle around the body (0 = front, +90 = the left, +X) and its points (out, up, radius). */
export interface Tentacle {
  readonly angle: number;
  readonly points: readonly (readonly [number, number, number])[];
}

/** An octopus kind: the slots, the head, the tentacles, and extra paint, bodies, and poses. */
export interface OctopusKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `body` and `eyes` (and up to two more); the first option of each is the default. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  readonly colors?: Partial<typeof OCTO_COLORS>;
  /** The head dome: its center and its radii. */
  readonly head: { readonly at: V3; readonly r: V3 };
  /** Where the tentacle planes meet: the center of the tentacle roots. */
  readonly base: V3;
  readonly tentacles: readonly Tentacle[];
  /** The eyes: the size, and the spread and height as shares of the head radii (default 0.034, 0.36, 0.0). */
  readonly eyes?: { readonly r?: number; readonly x?: number; readonly y?: number };
  /** The smile: its radius and stroke width in meters (default 0.04 and 0.012). */
  readonly smile?: { readonly r?: number; readonly width?: number };
  /**
   * True when the tentacles lie on the ground (a kraken): the clips only lift them (a droop would push
   * them into the ground), the tips droop a little at most, and the head slumps less in the death.
   */
  readonly grounded?: boolean;
  /** Small bumps on the top of the dome (default false). */
  readonly bumps?: boolean;
  /** Sucker dots on the under side of the tentacles (default false). */
  readonly suckers?: boolean;
  /** Paint on the skin (the head and the tentacles together). */
  paint?(skin: sdf.Shape, octo: OctopusShape): sdf.Shape;
  /** Extra bones (on `root` or `body`). */
  readonly bones?: Record<string, { readonly parent: string; readonly at: V3; readonly tail?: V3 }>;
  /** Extra bodies (a portal, glowing tips, a crown). */
  extra?(k: AssetContext, octo: OctopusShape): void;
  /** Poses of extra bones in a clip (`idle`, `walk`, `attack`, `hit`, `death`). */
  pose?(clip: string, p: number): Pose;
}

/** The octopus's shapes and helpers that a kind builds on. */
export interface OctopusShape {
  readonly head: sdf.Shape;
  readonly tentacles: sdf.Shape;
  /** Each tentacle's points in world meters [x, y, z, radius], its tip point, and the bone of its tip. */
  readonly arms: readonly { readonly points: readonly [number, number, number, number][]; readonly tip: V3; readonly tipBone: string }[];
  readonly tint: { readonly body: string; readonly eye: string };
  /** A fixed default color that follows a slot (`k.tint(slot, { color, follow })`). */
  tone(slot: string, color: string, follow?: number): string;
}

export function octopusAsset(kind: OctopusKind): AssetDefinition {
  const C = { ...OCTO_COLORS, ...kind.colors };
  const [hx, hy, hz] = kind.head.at;
  const [rx, ry, rz] = kind.head.r;
  const B = kind.base;
  // Each tentacle in world meters.
  const arms = kind.tentacles.map((t, i) => {
    const s = Math.sin(t.angle * DEG);
    const c = Math.cos(t.angle * DEG);
    const points = t.points.map(([u, v, r]) => [B[0] + s * u, v, B[2] + c * u, r] as [number, number, number, number]);
    const bones = points.slice(0, -1).map((_, j) => `arm${i}_${j}`);
    const last = points[points.length - 1]!;
    return { angle: t.angle, s, c, points, bones, tip: [last[0], last[1], last[2]] as V3, tipBone: bones[bones.length - 1]! };
  });

  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.005,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k) {
      const tone = (slot: string, color: string, follow = 1) => k.tint(slot, { color, follow });
      const T = { body: k.tint('body'), eye: k.tint('eyes') };

      // ------------------------------------------------------------------ skeleton
      const skeleton: Record<string, { parent?: string; at: V3; tail?: V3 }> = {
        root: { at: [B[0], 0, B[2]] },
        body: { parent: 'root', at: [B[0], B[1], B[2]], tail: [hx, hy + ry, hz] },
      };
      for (const a of arms) {
        a.bones.forEach((name, j) => {
          const p = a.points[j]!;
          skeleton[name] = { parent: j === 0 ? 'body' : a.bones[j - 1]!, at: [p[0], p[1], p[2]], ...(j === a.bones.length - 1 ? { tail: a.tip } : {}) };
        });
      }
      k.skeleton({ ...skeleton, ...kind.bones } as Parameters<typeof k.skeleton>[0]);

      // ------------------------------------------------------------------ head and tentacles
      const head = sdf.ellipsoid([rx, ry, rz]).at(hx, hy, hz);
      const tentacles = sdf.union(
        ...arms.map((a) => sdf.smoothUnion(0.012, ...a.points.slice(0, -1).map((p, j) => sdf.chain([p, a.points[j + 1]!], 0.01).bone(a.bones[j]!)))),
      );
      const bumps = kind.bumps
        ? sdf.union(
            ...Array.from({ length: 18 }, (_, i) => {
              const th = noise.random(i, 3, 1) * Math.PI * 2;
              const ph = 0.15 + noise.random(i, 5, 2) * 0.9; // from the top down to the eyes
              const p = sdf.surfacePoint(head, [hx + Math.sin(th) * Math.sin(ph) * rx, hy + Math.cos(ph) * ry, hz + Math.cos(th) * Math.sin(ph) * rz], -0.004);
              return sdf.sphere(0.008 + noise.random(i, 7, 3) * 0.006).at(...p);
            }),
          )
        : undefined;
      const dome = (bumps ? sdf.smoothUnion(0.006, head, bumps) : head).bone('body');
      // The tentacle roots join the head in a soft skirt.
      const skirt = sdf.ellipsoid([rx * 0.7, ry * 0.4, rz * 0.7]).at(B[0], B[1] + 0.02, B[2]).bone('body');
      let skin = sdf.smoothUnion(0.05, dome, skirt).smoothUnion(0.04, tentacles);
      const octo: OctopusShape = { head, tentacles, arms: arms.map((a) => ({ points: a.points, tip: a.tip, tipBone: a.tipBone })), tint: T, tone };
      if (kind.suckers) {
        // Pale sucker dots along the under side of each tentacle.
        const dots = sdf.union(
          ...arms.flatMap((a) =>
            a.points.slice(1).map((p, j) => {
              const prev = a.points[j]!;
              const mid: V3 = [(p[0] + prev[0]) / 2, (p[1] + prev[1]) / 2, (p[2] + prev[2]) / 2];
              const r = (p[3] + prev[3]) / 2;
              return sdf.sphere(r * 0.42).at(mid[0], mid[1] - r * 0.9, mid[2]);
            }),
          ),
        );
        skin = skin.paintWhere(dots, tone('body', C.suckers, 0.3), 0.004);
      }
      if (kind.paint) skin = kind.paint(skin, octo);
      // A small smile under the eyes.
      const smileY = hy - ry * 0.3;
      const sr = kind.smile?.r ?? 0.04;
      const smile = sdf.extrude(profile.arc(sr, kind.smile?.width ?? 0.012, 230, 310), 0.5).at(hx, smileY + sr, hz + 0.2);
      skin = skin.paintWhere(smile, C.mouth, 0.003);
      k.body('skin', skin, { color: T.body, roughness: 0.5, textureDensity: 1.6, bump: (x, y, z) => 0.0006 * noise.fbm(x * 60, y * 60, z * 60, 2) });

      // Two glossy eyes on the front of the dome.
      const E = kind.eyes ?? {};
      const er = E.r ?? 0.034;
      const eyeAt = sdf.surfacePoint(head, [hx + rx * (E.x ?? 0.36), hy + ry * (E.y ?? 0), hz + rz], -er * 0.45);
      const eye = sdf
        .sphere(er)
        .at(...eyeAt)
        .paintWhere(sdf.sphere(er * 0.32).at(eyeAt[0] + er * 0.3, eyeAt[1] + er * 0.4, eyeAt[2] + er * 0.75), '#ffffff', 0.001);
      k.body('eyes', eye.mirror('x').bone('body'), { color: T.eye, roughness: 0.1, textureDensity: 2, detail: 0.003 });

      kind.extra?.(k, octo);

      // ------------------------------------------------------------------ animation
      const { wave, bump, keys } = motion;
      const anim = (name: string, def: AnimationDef) =>
        k.animation(name, kind.pose ? { ...def, pose: (t, p) => ({ ...def.pose(t, p), ...kind.pose!(name, p) }) } : def);
      /** A curl of a tentacle bone in its own plane (+ droops the tip, - lifts it) and a sideways sway. */
      const bend = (a: (typeof arms)[number], curl: number, sway = 0): [number, number, number] => [curl * a.c, sway, -curl * a.s];
      const front = (a: (typeof arms)[number]) => Math.max(0, Math.cos(a.angle * DEG)); // 1 at the front, 0 at the sides and back
      const pose = (each: (a: (typeof arms)[number], i: number, j: number) => [number, number, number], extra: Pose): Pose => {
        const out: Pose = { ...extra };
        arms.forEach((a, i) => a.bones.forEach((b, j) => (out[b] = { rotate: each(a, i, j) })));
        return out;
      };
      // Ground tentacles: only the tip bone may droop, by 8 degrees at most.
      const lift = kind.grounded
        ? (a: (typeof arms)[number], curl: number, sway: number, j: number) =>
            bend(a, j === a.bones.length - 1 ? Math.min(curl, 8) : Math.min(curl, 0), sway)
        : (a: (typeof arms)[number], curl: number, sway: number) => bend(a, curl, sway);
      const sink = kind.grounded ? 0.3 : 1;

      // Idle: a slow wave runs out along each tentacle; the head bobs and tilts.
      anim('idle', {
        duration: 2.4,
        pose: (_t, p) =>
          pose((a, i, j) => lift(a, 7 * wave(p, 1, i * 0.13 + j * 0.12), 5 * wave(p, 1, i * 0.21 + 0.3), j), {
            body: { move: [0, 0.01 * wave(p, 1), 0], rotate: [3 * wave(p, 1, 0.25), 0, 2 * wave(p, 1, 0.1)] },
          }),
      });

      // Walk: a crawl in place: the tentacles push in turn, the body bobs twice per cycle.
      anim('walk', {
        duration: 1.0,
        pose: (_t, p) =>
          pose((a, i, j) => lift(a, 13 * wave(p, 1, i * 0.25 + j * 0.08), 8 * wave(p, 1, i * 0.25 + 0.25), j), {
            body: { move: [0, 0.02 * bump(p, 2), 0], rotate: [4 * wave(p, 2), 5 * wave(p, 1), 0] },
          }),
      });

      // Attack: it rears up, the front tentacles lift high, then they slam down forward with a lean.
      anim('attack', {
        duration: 0.9,
        loop: false,
        pose: (_t, p) => {
          const up = keys(p, [[0, 0], [0.3, 1], [0.4, 1], [0.52, -1.2], [0.66, -1], [1, 0]]);
          return pose((a, _i, j) => lift(a, (-28 * front(a) - 6) * up * (j === 0 ? 1 : 0.6), 0, j), {
            body: { move: [0, 0.03 * Math.max(0, up), 0.03 * Math.max(0, -up)], rotate: [-10 * up, 0, 0] },
          });
        },
      });

      // Hit: a jolt back, the tentacles curl up.
      anim('hit', {
        duration: 0.5,
        loop: false,
        pose: (_t, p) => {
          const s = keys(p, [[0, 0], [0.15, 1], [0.4, 0.7], [1, 0]]);
          return pose((a, _i, j) => lift(a, -16 * s * (j === 0 ? 0.6 : 1), 0, j), {
            body: { move: [0, 0, -0.03 * s], rotate: [-14 * s, 10 * s * wave(p, 3), 0] },
          });
        },
      });

      // Death: a shiver, then the head slumps forward and down and the tentacles go limp.
      anim('death', {
        duration: 1.4,
        loop: false,
        pose: (_t, p) => {
          const shiver = keys(p, [[0, 0], [0.12, 1], [0.3, 1], [0.38, 0]]);
          const slump = keys(p, [[0.3, 0], [0.65, 1], [0.72, 0.94], [0.8, 1]]);
          return pose((a, i, j) => lift(a, (j === 0 ? 18 : 10) * slump - 10 * shiver, 6 * shiver * wave(p, 6, i * 0.3), j), {
            body: { move: [0, -0.06 * slump * sink, 0.02 * slump], rotate: [18 * slump * sink, 0, 10 * slump] },
          });
        },
      });
    },
  });
}
