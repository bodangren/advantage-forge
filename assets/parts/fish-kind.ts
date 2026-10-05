import { defineAsset, motion, noise, profile, sdf } from '../../src/index.js';
import type { AssetContext, AssetDefinition } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

/**
 * Fish kinds — chibi water animals of the wildlife catalog (fish, salmon, trout, dolphin, and seal)
 * that rest on their bellies on the ground. One body plan: a smooth body along a spine of round
 * sections from the nose (+Z) to the tail root (flattened from side to side for a fish, round for a
 * seal), a two-tone coat (top and belly), big glossy eyes at the sides of the head (with an optional
 * pale rim), and fins in one color: a back fin, a tail (a fan, a fork, or a flat fluke), and side fins
 * or flippers. A fish tail sways from side to side; a fluke beats up and down. One clip set: idle (a
 * slow sway, the side fins paddle, the body bobs), swim (a fast sway with an S through the body),
 * attack (a lunge with a tail kick), hit, and death (the body rolls onto its side). Units are the
 * kind's; an asset scales it with `scaleAsset`.
 */

const FISH_COLORS = {
  eyeWhite: '#fbf8f0',
  pupil: '#141012',
  glint: '#ffffff',
  mouth: '#b8392e',
  mouthDark: '#5a1a1a',
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');

/** Grooves that fan out from `o` in the plane of `u` and `v` (the ribs of a fin), which also scallop its edge. */
function ribbed(fin: sdf.Shape, o: V3, u: V3, v: V3, count: number, depth = 0.004): sdf.Shape {
  return fin.displace(
    depth,
    (x, y, z) => {
      const dx = x - o[0];
      const dy = y - o[1];
      const dz = z - o[2];
      const a = dx * u[0] + dy * u[1] + dz * u[2];
      const b = dx * v[0] + dy * v[1] + dz * v[2];
      const g = 0.5 + 0.5 * Math.cos(count * Math.atan2(b, a));
      return Math.min(1, Math.hypot(a, b) / 0.04) * g * g;
    },
    2,
  );
}

/** A fish kind: the slots, the body, the fins, and extras. */
export interface FishKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `body`, `belly`, `fins`, and `eyes`; the first option of each is the default. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  readonly colors?: Partial<typeof FISH_COLORS>;
  /** The body: round sections [y, z, radius] from the nose to the tail root. */
  readonly spine: readonly (readonly [number, number, number])[];
  /** A round head: the first two sections are balls joined with the blend (a soft crease at the
   * neck), not a tapered tube (default false). */
  readonly headBall?: boolean;
  /** The index of the spine section that holds the root joint (default: the thickest section). */
  readonly rootSection?: number;
  /** The body width as a share of its height (default 0.75; 1 for a round seal). */
  readonly width?: number;
  /** The smooth blend between the sections (default 0.05). */
  readonly blend?: number;
  /** A short separate beak or muzzle on the head: a capsule from [y, z] to [y, z] with radius r, joined with a small fillet; `width` widens it across (default 1). */
  readonly beak?: { readonly from: readonly [number, number]; readonly to: readonly [number, number]; readonly r: number; readonly width?: number };
  /** The belly line: the plane below which the belly color shows, as [y at z = 0, slope dy/dz]. */
  readonly belly?: readonly [number, number];
  /**
   * The eyes: [y, z] of the eye line, the angle from the front in degrees, and the radius. Style
   * 'ball' (default) is a white ball with a big iris; 'almond' is a calm dark almond set into the
   * face with one shine, its outer corner raised by `tilt` degrees (default 12), `long` times the
   * radius across (default 1.4). `glints` is the number of shines on a ball eye (default 2).
   */
  readonly eye: { readonly at: readonly [number, number]; readonly angle?: number; readonly r: number; readonly rim?: string; readonly style?: 'ball' | 'almond'; readonly tilt?: number; readonly long?: number; readonly glints?: 1 | 2 };
  /** The tail fin: a round fan, a forked fan, a flat fluke (dolphin), or two flat flippers (seal). */
  readonly tail: 'fan' | 'fork' | 'fluke' | 'flippers';
  /** The tail size (default 1). */
  readonly tailSize?: number;
  /** Turns the tail fin about X at its root in degrees; positive lifts the back end (default 0). */
  readonly tailTilt?: number;
  /** The back fin: a round fin, a pointed sail that leans back, a dolphin fin, or none (default 'fin'). */
  readonly dorsal?: 'fin' | 'sail' | 'dolphin' | false;
  /** Where the back fin sits along Z and its size (default [-0.02, 1]). */
  readonly dorsalAt?: readonly [number, number];
  /** The side fins: small fins or big flippers that rest on the ground (default 'fin'). */
  readonly pectoral?: 'fin' | 'flipper';
  /** Where the side fins join the body: [y, z] (default under the eye, behind it). */
  readonly pectoralAt?: readonly [number, number];
  /** The side fin size (default 1). */
  readonly pectoralSize?: number;
  /** The radii of a side flipper [length, thickness, width] at size 1 (default [0.085, 0.018, 0.042]). */
  readonly flipperShape?: readonly [number, number, number];
  /** The turn of a side flipper about Y in degrees (default -28; more negative points it further forward). */
  readonly flipperTurn?: number;
  /** Two small fins under the belly (default false). */
  readonly pelvic?: boolean;
  /** The swim clip's tail beat as a share of the default (default 1). */
  readonly swimAmp?: number;
  /** Paint on the body (spots, stripes, a mouth). */
  paint?(body: sdf.Shape, fish: FishShape): sdf.Shape;
  /** Extra bodies (a snout, whiskers). */
  extra?(k: AssetContext, fish: FishShape): void;
}

/** The fish's shapes and colors that a kind builds on. */
export interface FishShape {
  readonly body: sdf.Shape;
  /** The front tip of the nose. */
  readonly nose: V3;
  /** The body center (the root joint). */
  readonly center: V3;
  readonly tint: { readonly body: string; readonly belly: string; readonly fins: string; readonly eye: string };
  /** A fixed default color that follows a slot (`k.tint(slot, { color, follow })`). */
  tone(slot: string, color: string, follow?: number): string;
}

/** A smile stroke on the front of the head: an arc under `nose`, pushed through the head along Z. */
export function smileAt(nose: V3, radius: number, width: number, drop: number, from = 222, to = 318): sdf.Shape {
  return sdf.extrude(profile.arc(radius, width, from, to), 0.24).at(0, nose[1] - drop + radius, nose[2] - 0.08);
}

/**
 * An arc stroke on the sides of the body, pushed through it along X. The arc lies in the side
 * plane round (cz, cy); angles count from the front (+Z, 0) towards the top (+Y, 90).
 */
export function sideArc(cz: number, cy: number, radius: number, width: number, fromDeg: number, toDeg: number): sdf.Shape {
  // A profile point (u, v) lands at z = u, y = v after the turn, so the angles carry over.
  return sdf.extrude(profile.arc(radius, width, fromDeg, toDeg), 0.6).rotateY(90).at(0, cy, cz);
}

/** Small dark speckles above `minY`: one dot in some cells of a 3D grid (spacing `cell`). */
export function speckles(cell: number, radius: number, share: number, minY: number, seed = 0) {
  return (x: number, y: number, z: number): boolean => {
    if (y < minY) return false;
    const i = Math.floor(x / cell);
    const j = Math.floor(y / cell);
    const k = Math.floor(z / cell);
    if (noise.random(i + seed, j, k) > share) return false;
    const ox = (i + 0.25 + 0.5 * noise.random(i, j + 7, k)) * cell;
    const oy = (j + 0.25 + 0.5 * noise.random(i, j, k + 13)) * cell;
    const oz = (k + 0.25 + 0.5 * noise.random(i + 3, j, k)) * cell;
    return Math.hypot(x - ox, y - oy, z - oz) < radius;
  };
}

export function fishAsset(kind: FishKind): AssetDefinition {
  const C = { ...FISH_COLORS, ...kind.colors };
  const W = kind.width ?? 0.75;
  const spine = kind.spine;
  const head = spine[0]!;
  const root = spine[spine.length - 1]!;
  const maxR = Math.max(...spine.map((p) => p[2]));
  // The root joint: the thickest section, or the section a kind names.
  const mid = kind.rootSection !== undefined ? spine[kind.rootSection]! : spine.find((p) => p[2] === maxR)!;
  const CENTER: V3 = [0, mid[0], mid[1]];
  const HEAD_J: V3 = [0, (head[0] + mid[0]) / 2, (head[1] + mid[1]) / 2];
  const tailStart = spine[Math.max(1, spine.length - 2)]!;
  const TAIL1: V3 = [0, (mid[0] + tailStart[0]) / 2, (mid[1] + tailStart[1]) / 2];
  const TAIL2: V3 = [0, root[0], root[1]];
  const fluke = kind.tail === 'fluke' || kind.tail === 'flippers';
  const ts = kind.tailSize ?? 1;
  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.005,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k) {
      const tone = (slot: string, color: string, follow = 1) => k.tint(slot, { color, follow });
      const T = { body: k.tint('body'), belly: k.tint('belly'), fins: k.tint('fins'), eye: k.tint('eyes') };
      const tailEnd: V3 = [0, root[0], root[1] - 0.12 * ts];
      k.skeleton({
        body: { at: CENTER },
        head: { parent: 'body', at: HEAD_J, tail: [0, head[0], head[1] + head[2]] },
        tail1: { parent: 'body', at: TAIL1 },
        tail2: { parent: 'tail1', at: TAIL2, tail: tailEnd },
        'fin.L': { parent: 'body', at: [0.05, CENTER[1], CENTER[2]] },
        'fin.R': { parent: 'body', at: [-0.05, CENTER[1], CENTER[2]] },
      });

      // ------------------------------------------------------------------ body
      const bone = (z: number) => (z > HEAD_J[2] ? 'head' : z > TAIL1[2] ? 'body' : z > TAIL2[2] + 0.03 ? 'tail1' : 'tail2');
      const segs: sdf.Shape[] = [];
      for (let i = 0; i + 1 < spine.length; i++) {
        const a = spine[i]!;
        const b = spine[i + 1]!;
        if (i === 0 && kind.headBall) {
          segs.push(sdf.sphere(a[2]).at(0, a[0], a[1]).bone('head'), sdf.sphere(b[2]).at(0, b[0], b[1]).bone(bone(b[1])));
          continue;
        }
        segs.push(sdf.chain([[0, a[0], a[1], a[2]], [0, b[0], b[1], b[2]]], 0.01).bone(bone((a[1] + b[1]) / 2)));
      }
      const B = kind.beak;
      const core = sdf.smoothUnion(kind.blend ?? 0.05, ...segs).scale([W, 1, 1]);
      const beak = B ? sdf.capsule([0, B.from[0], B.from[1]], [0, B.to[0], B.to[1]], B.r) : undefined;
      const trunk = B && beak ? core.smoothUnion(0.022, (B.width && B.width !== 1 ? beak.scale([B.width, 1, 1]) : beak).bone('head')) : core;
      const nose = B ? sdf.raycast(trunk, [0, B.to[0], 2], [0, 0, -1])! : sdf.raycast(trunk, [0, head[0], 2], [0, 0, -1])!;
      const [by, slope] = kind.belly ?? [CENTER[1] - 0.03, 0];
      const n = Math.hypot(1, slope);
      let body = trunk.paintWhere(sdf.halfSpace([0, 1 / n, -slope / n], by / n), T.belly, 0.008);
      const fish: FishShape = { body: trunk, nose, center: CENTER, tint: T, tone };
      if (kind.paint) body = kind.paint(body, fish);
      k.body('skin', body, { color: T.body, roughness: 0.5, textureDensity: 1.5 });

      // ------------------------------------------------------------------ eyes
      const E = kind.eye;
      const a = ((E.angle ?? 60) * Math.PI) / 180;
      const dir: V3 = [Math.sin(a), 0, Math.cos(a)];
      const hit = sdf.raycast(trunk, [dir[0], E.at[0], E.at[1] + dir[2]], [-dir[0], 0, -dir[2]])!;
      const R = E.r;
      const c: V3 = [hit[0] - dir[0] * R * 0.3, hit[1], hit[2] - dir[2] * R * 0.3];
      const out = (s: number, up = 0, side = 0): V3 => [c[0] + dir[0] * R * s + dir[2] * R * side, c[1] + R * up, c[2] + dir[2] * R * s - dir[0] * R * side];
      if (E.style === 'almond') {
        // A dark almond, long across the face and flat, its outer corner raised, with one shine.
        const almond = sdf
          .ellipsoid([R * (E.long ?? 1.4), R * 0.72, R * 0.55])
          .rotateZ(E.tilt ?? 12)
          .rotateY((E.angle ?? 60))
          .at(...out(0.2))
          .paintWhere(sdf.sphere(R * 0.24).at(...out(0.75, 0.25, 0.35)), C.glint, 0.002);
        k.body('eyes', pair(almond).bone('head'), { color: T.eye, roughness: 0.15, detail: 0.003 });
      } else {
        const eye = sdf
          .sphere(R)
          .at(...c)
          .paintWhere(sdf.sphere(R * 0.9).at(...out(0.32, -0.03)), T.eye, 0.002)
          .paintWhere(sdf.sphere(R * (E.glints === 1 ? 0.24 : 0.32)).at(...out(0.86, 0.36, 0.18)), C.glint, 0.002);
        const eyes = E.glints === 1 ? eye : eye.paintWhere(sdf.sphere(R * 0.14).at(...out(0.92, -0.32, -0.25)), C.glint, 0.002);
        k.body('eyes', pair(eyes).bone('head'), { color: C.eyeWhite, roughness: 0.12, detail: 0.003 });
      }
      // A ring round each eye where it meets the head, facing along the eye's direction.
      if (E.rim) {
        const ring = sdf
          .torus(R * 0.98, R * 0.17)
          .rotateX(90)
          .rotateY((E.angle ?? 60))
          .at(...out(0.12));
        k.body('eye-rims', pair(ring).bone('head'), { color: E.rim, roughness: 0.5, detail: 0.003 });
      }

      // ------------------------------------------------------------------ fins
      const fins: sdf.Shape[] = [];
      // The tail.
      const tr: V3 = [0, root[0], root[1]];
      if (kind.tail === 'fan') {
        fins.push(ribbed(sdf.ellipsoid([0.018, 0.12 * ts, 0.075 * ts]).at(tr[0], tr[1], tr[2] - 0.06 * ts), [0, tr[1], tr[2] + 0.01], [0, 0, -1], [0, 1, 0], 14));
      } else if (kind.tail === 'fork') {
        for (const s of [1, -1])
          fins.push(
            ribbed(
              sdf
                .ellipsoid([0.016, 0.1 * ts, 0.04 * ts])
                .rotateX(-s * 52)
                .at(tr[0], tr[1] + s * 0.065 * ts, tr[2] - 0.055 * ts),
              [0, tr[1], tr[2] + 0.01],
              [0, 0, -1],
              [0, 1, 0],
              16,
            ),
          );
      } else {
        const r = kind.tail === 'flippers' ? [0.075, 0.016, 0.05] : [0.09, 0.014, 0.042];
        for (const s of [1, -1])
          fins.push(
            sdf
              .ellipsoid([r[0]! * ts, r[1]! * ts, r[2]! * ts])
              .rotateY(s * 32)
              .at(s * 0.055 * ts, tr[1], tr[2] - 0.05 * ts),
          );
      }
      const tilt = kind.tailTilt ?? 0;
      const tailFins = sdf.smoothUnion(0.01, ...fins);
      k.body('tail-fin', (tilt ? tailFins.at(-tr[0], -tr[1], -tr[2]).rotateX(tilt).at(...tr) : tailFins).bone('tail2'), { color: T.fins, roughness: 0.5, detail: fluke ? 0.005 : 0.0035 });
      // The back fin.
      if (kind.dorsal !== false) {
        const [dz, dsz] = kind.dorsalAt ?? [-0.02, 1];
        const top = sdf.raycast(trunk, [0, 2, dz], [0, -1, 0])!;
        // The sail: a triangle in the side plane (u along Z, v up) with a pointed tip that leans back.
        const sail = () =>
          ribbed(
            sdf
              .extrude(
                profile.polygon(
                  [
                    [0.055, -0.03],
                    [0.02, 0.03],
                    [-0.035, 0.09],
                    [-0.05, 0.075],
                    [-0.045, 0.02],
                    [-0.06, -0.03],
                  ].map(([u, v]) => [u! * dsz, v! * dsz] as [number, number]),
                  { smooth: true },
                ),
                0.022,
                0.008,
              )
              .rotateY(90),
            [0, -0.03 * dsz, 0.04 * dsz],
            [0, 0, -1],
            [0, 1, 0],
            12,
            0.003,
          );
        const fin =
          kind.dorsal === 'dolphin'
            ? sdf.cone([0, 0, 0.03 * dsz], [0, 0.085 * dsz, -0.045 * dsz], 0.045 * dsz, 0.012 * dsz).scale([0.35, 1, 1])
            : kind.dorsal === 'sail'
              ? sail()
              : ribbed(sdf.ellipsoid([0.016, 0.065 * dsz, 0.075 * dsz]).rotateX(-30), [0, -0.05 * dsz, 0.02 * dsz], [0, 0, -1], [0, 1, 0], 12);
        k.body('back-fin', fin.at(0, top[1] + (kind.dorsal === 'dolphin' ? -0.02 : 0.03 * dsz), top[2]).bone('body'), { color: T.fins, roughness: 0.5, detail: 0.0035 });
      }
      // The side fins.
      const flipper = kind.pectoral === 'flipper';
      const ps = kind.pectoralSize ?? 1;
      const [py, pz] = kind.pectoralAt ?? [CENTER[1] - maxR * 0.45, E.at[1] - 0.1];
      const side = sdf.raycast(trunk, [1, py, pz], [-1, 0, 0])!;
      const fl = kind.flipperShape ?? [0.085, 0.018, 0.042];
      const pec = flipper
        ? sdf
            .ellipsoid([fl[0] * ps, fl[1] * ps, fl[2] * ps])
            .rotateY(kind.flipperTurn ?? -28)
            .rotateZ(-30)
            .at(side[0] + 0.06 * ps, side[1] - 0.03 * ps, side[2] - 0.015)
        : ribbed(sdf.ellipsoid([0.05 * ps, 0.013, 0.032 * ps]), [-0.045 * ps, 0, 0], [1, 0, 0], [0, 0, 1], 10, 0.003)
            .rotateY(-35)
            .rotateZ(-28)
            .at(side[0] + 0.03 * ps, side[1] - 0.012, side[2] - 0.02);
      let sideFins = pec.bone('fin.L');
      if (kind.pelvic) {
        const under = sdf.raycast(trunk, [0.06, -1, CENTER[2] - 0.04], [0, 1, 0])!;
        sideFins = sdf.union(sideFins, sdf.ellipsoid([0.01, 0.035, 0.03]).rotateX(-35).rotateZ(-25).at(under[0] + 0.01, under[1] - 0.01, under[2]).bone('body'));
      }
      k.body('side-fins', pair(sideFins), { color: T.fins, roughness: 0.5, detail: 0.0035 });
      kind.extra?.(k, fish);

      // ------------------------------------------------------------------ animation
      const { wave, keys } = motion;
      type R3 = [number, number, number];
      // A fish tail turns about Y (side to side); a fluke about X (up and down).
      const sway = (deg: number): R3 => (fluke ? [deg, 0, 0] : [0, deg, 0]);
      const flap = (deg: number) => ({ 'fin.L': { rotate: [0, 0, deg] as R3 }, 'fin.R': { rotate: [0, 0, -deg] as R3 } });
      const swim = (duration: number, amp: number, bob: number) => ({
        duration,
        pose: (_t: number, p: number) => ({
          body: { move: [0, bob * (0.5 + 0.5 * wave(p, 2)), 0] as R3, rotate: sway(-0.3 * amp * wave(p, 1, 0.5)) },
          head: { rotate: sway(-0.25 * amp * wave(p)) },
          tail1: { rotate: sway(0.6 * amp * wave(p, 1, 0.15)) },
          tail2: { rotate: sway(amp * wave(p, 1, 0.3)) },
          ...flap((flipper ? 10 : 22) * wave(p, 2)),
        }),
      });
      k.animation('idle', swim(2, 10, 0.008));
      k.animation('swim', swim(0.6, 24 * (kind.swimAmp ?? 1), 0.012));
      k.animation('attack', {
        duration: 0.7,
        loop: false,
        pose: (_t, p) => {
          const lunge = keys(p, [[0, 0], [0.3, -0.4], [0.45, 1], [0.6, 1], [1, 0]] as const);
          const kick = keys(p, [[0, 0], [0.3, 1], [0.45, -1], [0.7, 0.3], [1, 0]] as const);
          return {
            body: { move: [0, 0.015 * Math.max(0, lunge), 0.06 * lunge] },
            head: { rotate: [-8 * Math.max(0, lunge), 0, 0] },
            tail1: { rotate: sway(20 * kick) },
            tail2: { rotate: sway(30 * kick) },
            ...flap(-20 * Math.max(0, lunge)),
          };
        },
      });
      k.animation('hit', {
        duration: 0.5,
        loop: false,
        pose: (_t, p) => {
          const h = keys(p, [[0, 0], [0.15, 1], [1, 0]] as const);
          return {
            body: { move: [0, 0, -0.03 * h], rotate: [-8 * h, 0, 10 * h] },
            head: { rotate: [-10 * h, 0, 0] },
            tail2: { rotate: sway(20 * h) },
            ...flap(25 * h),
          };
        },
      });
      // Death: the body rolls onto its right side and settles on the ground.
      const lie = CENTER[1] - (kind.rootSection !== undefined ? mid[2] : maxR) * W - 0.005;
      k.animation('death', {
        duration: 1.3,
        loop: false,
        pose: (_t, p) => {
          const d = keys(p, [[0, 0], [0.5, 0.85], [0.7, 1], [1, 1]] as const);
          return {
            body: { move: [0, -lie * d, 0], rotate: [0, 0, -80 * d] },
            tail2: { rotate: sway(10 * d) },
            'fin.L': { rotate: [0, 0, 20 * d] },
            'fin.R': { rotate: [0, 0, 50 * d] },
          };
        },
      });
    },
  });
}
