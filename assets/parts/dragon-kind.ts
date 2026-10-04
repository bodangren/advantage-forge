import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../../src/index.js';
import type { AssetContext, AssetDefinition, BodyOptions } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

/**
 * Dragon kinds — the fire dragon of `assets/dragon-fire.ts` (catalog `monsters/dragon/dragon-fire`)
 * and its element kinds (ice, poison, shadow, and storm dragons). One body, face, rig, and clip
 * set; each kind sets the palette and the slots, may change the look of the horns, the crest, and
 * the wings, and may add bodies (a gem, a venom drop). The design notes of the body, the rig, and
 * the clips are in `assets/dragon-fire.ts`.
 */
/** The fire dragon's colors; a kind replaces any of them. */
export const FIRE_PALETTE = {
  red: '#d8463c',
  redDark: '#a83028',
  cream: '#f4e0a8',
  creamLine: '#d2b474',
  orange: '#f39a2a',
  horn: '#f2e8cc',
  hornBase: '#d8c8a0',
  eye: '#f6c01e',
  eyeLow: '#e0901a',
  pupil: '#1a1210',
  brow: '#2a1f1c',
  mouth: '#4a1a18',
  tooth: '#fbf6e8',
  claw: '#f2e4c0',
  tongue: '#c0505a',
  fireCore: '#ffe04a',
  fire: '#ff9a14',
  fireTip: '#f24a12',
};

export type DragonPalette = { readonly [K in keyof typeof FIRE_PALETTE]: string };

/** The parts whose material a kind may change (merged over the fire dragon's options). */
export interface DragonLooks {
  readonly horns?: BodyOptions;
  readonly crest?: BodyOptions;
  /** The tall middle spines on the head (the dark scale color by default). */
  readonly crestMid?: BodyOptions;
  readonly wings?: BodyOptions;
}

/** A dragon kind: the slots, the palette, the looks, and extra bodies. */
export interface DragonKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `scales`, `belly`, and `eyes`. The first option of each slot is its default color. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  /** Fixed colors that differ from the fire dragon (the slot defaults come from `variants`). */
  readonly palette?: Partial<DragonPalette>;
  readonly looks?: DragonLooks;
  /** Extra bodies, built after the wings (rigid on `head` or tagged to bones). */
  extra?(k: AssetContext, dragon: DragonShape): void;
}

/** The dragon's head shape and a ray helper for kinds that add bodies to the face. */
export interface DragonShape {
  /** The head (skull, snout, and brow shelf), for surface points. */
  readonly skull: sdf.Shape;
  /** The point where a ray from the front (+Z) meets the head at (x, y). */
  faceHit(x: number, y: number): readonly [number, number, number];
  /** The point where a ray from above meets the head at (x, z). */
  topHit(x: number, z: number): readonly [number, number, number];
}

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints. Short, thick legs; small arms held in front of the belly.
const SHOULDER: V3 = [0.17, 0.35, 0.04];
const ELBOW: V3 = [0.22, 0.29, 0.11];
const WRIST: V3 = [0.2, 0.25, 0.18];
const HIP: V3 = [0.13, 0.16, 0.02];
const ANKLE: V3 = [0.17, 0.06, 0.06];
const WING_ROOT: V3 = [0.12, 0.4, -0.12];
const TAIL: V3[] = [
  [0, 0.13, -0.16],
  [-0.1, 0.1, -0.3],
  [-0.24, 0.12, -0.38],
  [-0.34, 0.2, -0.38],
];
const HEAD_C: V3 = [0, 0.67, 0];
// The grin line: the bottom arc of a circle (236 to 304 degrees). It paints the grin, and it is
// also the line where the lower jaw separates from the head.
const GRIN_R = 0.22;
const GRIN_Y = 0.455;
const GRIN_CORNER_Y = GRIN_Y + GRIN_R * (1 - Math.sin((56 * Math.PI) / 180));
const JAW_AT: V3 = [0, 0.48, 0.05]; // the jaw hinge, behind the grin corners
// The fire breath is built at FLAME_REST of its size, hidden inside the mouth, so the rest pose
// and the static sprites show no fire; the attack scales the `breath` bone up to full size.
const BREATH_AT: V3 = [0, 0.425, 0.1];
const FLAME_REST = 0.02;

export function dragonAsset(kind: DragonKind): AssetDefinition {
  // The slot defaults follow the kind's variants, so a kind sets its colors in one place.
  const first = (slot: string) => Object.values(kind.variants[slot] ?? {})[0] as string | undefined;
  const C: DragonPalette = {
    ...FIRE_PALETTE,
    ...kind.palette,
    red: first('scales') ?? kind.palette?.red ?? FIRE_PALETTE.red,
    cream: first('belly') ?? kind.palette?.cream ?? FIRE_PALETTE.cream,
    eye: first('eyes') ?? kind.palette?.eye ?? FIRE_PALETTE.eye,
  };
  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.005,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k) {
      // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
      const T = {
        red: k.tint('scales'),
        redDark: k.tint('scales', { color: C.redDark, follow: 1 }),
        cream: k.tint('belly'),
        creamLine: k.tint('belly', { color: C.creamLine, follow: 1 }),
        eye: k.tint('eyes'),
        eyeLow: k.tint('eyes', { color: C.eyeLow, follow: 1 }),
      };
      // ------------------------------------------------------------------ skeleton
      k.skeleton({
        hips: { at: [0, 0.17, 0] },
        spine: { parent: 'hips', at: [0, 0.27, 0] },
        chest: { parent: 'spine', at: [0, 0.36, 0] },
        neck: { parent: 'chest', at: [0, 0.42, -0.01] },
        head: { parent: 'neck', at: [0, 0.47, 0] },
        jaw: { parent: 'head', at: JAW_AT, tail: [0, 0.44, 0.2] },
        breath: { parent: 'head', at: BREATH_AT, tail: [0, BREATH_AT[1], 0.6] },
        'wing.L': { parent: 'chest', at: WING_ROOT, tail: [0.6, 0.5, -0.24] },
        'wing.R': { parent: 'chest', at: mx(WING_ROOT), tail: [-0.6, 0.5, -0.24] },
        tail1: { parent: 'hips', at: TAIL[0]! },
        tail2: { parent: 'tail1', at: TAIL[1]! },
        tail3: { parent: 'tail2', at: TAIL[2]!, tail: TAIL[3]! },
        'upperarm.L': { parent: 'chest', at: SHOULDER },
        'forearm.L': { parent: 'upperarm.L', at: ELBOW },
        'hand.L': { parent: 'forearm.L', at: WRIST },
        'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
        'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
        'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
        'leg.L': { parent: 'hips', at: HIP },
        'foot.L': { parent: 'leg.L', at: ANKLE },
        'leg.R': { parent: 'hips', at: mx(HIP) },
        'foot.R': { parent: 'leg.R', at: mx(ANKLE) },
      });

      // ------------------------------------------------------------------ head
      const skull = sdf.smoothUnion(
        0.07,
        sdf.ellipsoid([0.205, 0.19, 0.18]).at(...HEAD_C),
        sdf.ellipsoid([0.17, 0.1, 0.13]).at(0, 0.53, 0.09), // the snout and jaw
        sdf.ellipsoid([0.17, 0.035, 0.07]).at(0, 0.735, 0.12), // a heavy brow shelf
      );
      const faceHit = (x: number, y: number) => sdf.raycast(skull, [x, y, 2], [0, 0, -1])!;
      const nostrilAt = faceHit(0.04, 0.585);
      const nostrils = pair(sdf.ellipsoid([0.017, 0.012, 0.02]).at(nostrilAt[0], nostrilAt[1], nostrilAt[2] + 0.006));
      const head = skull.smoothSubtract(0.006, nostrils);
      // Cheek frills: small fans of spines behind the jaw.
      const frill = sdf.smoothUnion(
        0.012,
        ...[
          [0.3, 0.6, -0.04],
          [0.31, 0.55, -0.05],
          [0.29, 0.5, -0.05],
        ].map(([x, y, z]) => sdf.cone([0.17, 0.55, -0.02], [x!, y!, z!], 0.035, 0.006).scale([1, 1, 0.5])),
      );

      // ------------------------------------------------------------------ body, arms, legs, tail
      const trunk = sdf.smoothUnion(
        0.07,
        sdf.ellipsoid([0.25, 0.2, 0.2]).at(0, 0.19, 0).bone('spine'),
        sdf.ellipsoid([0.19, 0.12, 0.16]).at(0, 0.34, 0).bone('chest'),
        sdf.ellipsoid([0.11, 0.08, 0.1]).at(0, 0.46, 0).bone('neck'),
      );
      const armAt = (s: 1 | -1) => {
        const side = s > 0 ? 'L' : 'R';
        const sh = s > 0 ? SHOULDER : mx(SHOULDER);
        const el = s > 0 ? ELBOW : mx(ELBOW);
        const wr = s > 0 ? WRIST : mx(WRIST);
        return sdf.smoothUnion(
          0.02,
          sdf.cone(sh, el, 0.05, 0.042).bone(`upperarm.${side}`),
          sdf.cone(el, wr, 0.042, 0.036).bone(`forearm.${side}`),
          sdf.ellipsoid([0.04, 0.036, 0.04]).at(wr[0], wr[1] - 0.012, wr[2] + 0.012).bone(`hand.${side}`),
        );
      };
      const legs = pair(sdf.capsule([HIP[0], 0.17, 0], [ANKLE[0], 0.09, 0.02], 0.085).bone('leg.L'));
      const footLocal = sdf.ellipsoid([0.085, 0.055, 0.115]).at(0, 0.045, 0.04).intersect(sdf.halfSpace([0, -1, 0], 0));
      const feet = pair(footLocal.rotateY(14).at(ANKLE[0], 0, ANKLE[2]).bone('foot.L'));
      const tailShape = sdf.smoothUnion(
        0.03,
        sdf.chain([[...TAIL[0]!, 0.1], [...lerp(TAIL[0]!, TAIL[1]!, 0.6), 0.078]], 0.02).bone('tail1'),
        sdf.chain([[...lerp(TAIL[0]!, TAIL[1]!, 0.6), 0.078], [...TAIL[2]!, 0.05]], 0.02).bone('tail2'),
        sdf.chain([[...TAIL[2]!, 0.05], [...TAIL[3]!, 0.028]], 0.02).bone('tail3'),
      );

      // ------------------------------------------------------------------ face paint
      const EYE_X = 0.09;
      const EYE_Y = 0.665;
      const at = (s: sdf.Shape, x: number, y: number) => {
        const h = faceHit(Math.abs(x), y);
        return s.at(x, y, h[2]);
      };
      const eyeWhite = pair(at(sdf.ellipsoid([0.058, 0.05, 0.08]), EYE_X, EYE_Y));
      const iris = pair(at(sdf.ellipsoid([0.05, 0.043, 0.08]), EYE_X - 0.002, EYE_Y - 0.003));
      const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE_Y - 0.02));
      const pupil = pair(at(sdf.ellipsoid([0.02, 0.03, 0.08]), EYE_X - 0.012, EYE_Y - 0.004));
      const shine = pair(at(sdf.sphere(0.01), EYE_X + 0.012, EYE_Y + 0.016));
      // A heavy lid across the top of each eye, lower toward the middle: a glare.
      const lid = pair(
        sdf
          .extrude(
            profile.polygon([
              [EYE_X - 0.07, EYE_Y + 0.004],
              [EYE_X + 0.07, EYE_Y + 0.036],
              [EYE_X + 0.07, EYE_Y + 0.1],
              [EYE_X - 0.07, EYE_Y + 0.1],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      );
      // The grin: a wide dark mouth that curves up at the corners.
      const grin = sdf.extrude(profile.arc(GRIN_R, 0.05, 236, 304), 0.4).at(0, GRIN_Y + GRIN_R, 0.3);
      const scales = sdf
        .union(
          sdf.smoothUnion(0.05, trunk, head.bone('head')).smoothUnion(0.02, pair(frill).bone('head')),
          armAt(1),
          armAt(-1),
        )
        .smoothUnion(0.03, legs)
        .union(feet)
        .smoothUnion(0.03, tailShape)
        .paintFn((x, y, z, base) => {
          // Darker scales on the back and the top of the tail; a faint scale pattern.
          const back = Math.min(1, Math.max(0, -z * 4 - 0.2));
          const n = noise.fbm(x * 30, y * 30, z * 30, 2) > 0.45 ? 0.12 : 0;
          return mixRgb(base, rgb(T.redDark), Math.min(1, back * 0.5 + n));
        })
        .paintWhere(eyeWhite, '#fbf4e0')
        .paintWhere(iris, T.eye)
        .paintWhere(irisLow, T.eyeLow, 0.012)
        .paintWhere(pupil, C.pupil)
        .paintWhere(shine, '#ffffff')
        .paintWhere(lid.intersect(eyeWhite.round(0.006)), T.red, 0.002)
        .paintWhere(grin, C.mouth, 0.003)
        .paintWhere(nostrils.round(0.006), C.mouth, 0.004);
      // The lower jaw zone: below the grin circle and below the grin corners, above the chin (y
      // 0.425, so the neck and the chest stay on the body), inside a rounded bound around the snout.
      // The head keeps the rest; the jaw piece is rigid on `jaw` and reaches 3 mm into the head, so
      // no seam groove shows. The cut faces inside the skull (the roof of the mouth and the top of
      // the jaw) are dark; the skin is not.
      const jawZone = sdf
        .ellipsoid([0.16, 0.09, 0.13])
        .at(0, 0.45, 0.17)
        .intersect(sdf.halfSpace([0, 1, 0], GRIN_CORNER_Y))
        .intersect(sdf.halfSpace([0, -1, 0], -0.425))
        .subtract(sdf.cylinder(GRIN_R, 0.7).rotateX(90).at(0, GRIN_Y + GRIN_R, 0.25));
      const jawPart = jawZone.round(0.003);
      const inSkull = skull.round(-0.004);
      const scaleLook = {
        color: T.red,
        roughness: 0.55,
        textureDensity: 2,
        bump: (x: number, y: number, z: number) => 0.0007 * noise.fbm(x * 90, y * 90, z * 90, 2),
      };
      k.body('scales', scales.subtract(jawZone).paintWhere(jawPart.intersect(inSkull), C.mouth, 0.002), scaleLook);
      k.body('jaw-scales', scales.intersect(jawPart).paintWhere(inSkull.subtract(jawZone.round(-0.003)), C.mouth, 0.002), {
        ...scaleLook,
        bone: 'jaw',
      });
      // The dark mouth inside the head (seen when the jaw opens), and the tongue on the jaw. Both
      // stay inside the closed head.
      k.body('mouth', sdf.ellipsoid([0.1, 0.04, 0.08]).at(0, 0.465, 0.08).intersect(skull.round(-0.006)).bone('head'), {
        color: C.mouth,
        roughness: 0.6,
      });
      k.body('tongue', sdf.ellipsoid([0.055, 0.012, 0.07]).at(0, 0.452, 0.1).intersect(skull.round(-0.008)), {
        color: C.tongue,
        roughness: 0.35,
        bone: 'jaw',
      });

      // ------------------------------------------------------------------ belly plate with ridges
      // Tagged like the trunk, so the plate follows the chest when it turns and fills with air.
      const bellyBase = sdf.smoothUnion(0.07, sdf.ellipsoid([0.25, 0.2, 0.2]).at(0, 0.19, 0).bone('spine'), sdf.ellipsoid([0.19, 0.12, 0.16]).at(0, 0.34, 0).bone('chest'));
      const bellyOval = sdf.extrude(profile.polygon([[-0.1, 0.4], [0.1, 0.4], [0.16, 0.25], [0.16, 0.08], [0.09, 0.01], [-0.09, 0.01], [-0.16, 0.08], [-0.16, 0.25]], { smooth: true, samples: 5 }), 0.5).at(0, 0, 0.25);
      const belly = bellyBase
        .round(0.012)
        .subtract(bellyBase.round(-0.004))
        .smoothIntersect(0.006, bellyOval)
        .paintFn((x, y, _z, base) => (Math.abs(Math.sin((y + 0.02 * (x / 0.14) ** 2) * 95)) < 0.1 ? rgb(T.creamLine) : base));
      k.body('belly', belly, { color: T.cream, roughness: 0.6 });

      // ------------------------------------------------------------------ horns
      const horn = sdf
        .chain(
          [
            [0.13, 0.79, -0.03, 0.05],
            [0.2, 0.84, -0.04, 0.043],
            [0.235, 0.92, -0.03, 0.032],
            [0.225, 0.995, -0.01, 0.01],
          ],
          0.015,
        )
        .paintFn((_x, y, _z, base) => (y < 0.83 ? rgb(C.hornBase) : base));
      k.body('horns', pair(horn).bone('head'), { color: C.horn, roughness: 0.4, ...kind.looks?.horns });

      // ------------------------------------------------------------------ crest: spines on the head and down the back and tail
      const top = (x: number, z: number) => sdf.raycast(skull, [x, 2, z], [0, -1, 0])!;
      const spine = (root: V3, dir: V3, len: number, r: number) =>
        sdf.cone([root[0], root[1] - 0.02, root[2]], [root[0] + dir[0] * len, root[1] + dir[1] * len, root[2] + dir[2] * len], r, 0.005);
      const headCrest = sdf.union(
        spine(top(0.07, 0.02), [0.35, 0.9, 0.2], 0.1, 0.032),
        spine(top(-0.07, 0.02), [-0.35, 0.9, 0.2], 0.1, 0.032),
        spine(top(0, 0.1), [0, 0.8, 0.6], 0.09, 0.032),
      );
      // The tall middle spines are red, as in the mockup.
      const redCrest = sdf.union(
        spine(top(0, 0.03), [0, 0.95, 0.3], 0.15, 0.04),
        spine(top(0.035, -0.04), [0.2, 0.95, -0.25], 0.12, 0.034),
        spine(top(-0.035, -0.04), [-0.2, 0.95, -0.25], 0.12, 0.034),
      );
      const backLine = (z: number, y0: number) => sdf.raycast(trunk, [0, 2, z], [0, -1, 0]) ?? ([0, y0, z] as V3);
      const backCrest = sdf.union(
        ...[-0.06, -0.12].map((z, i) => spine(backLine(z, 0.4), [0, 0.7, -0.7], 0.06 - i * 0.01, 0.028)),
      );
      const tailCrest = sdf.union(
        ...[0.3, 0.6].map((t) => {
          const p = lerp(TAIL[0]!, TAIL[1]!, t);
          return spine([p[0], p[1] + 0.07, p[2]], [0, 1, -0.2], 0.05, 0.022);
        }),
      );
      // The tail fin: a fan of flame-like spines at the tip.
      const tip = TAIL[3]!;
      const fin = sdf.smoothUnion(
        0.012,
        ...[
          [-0.08, 0.12, 0.0],
          [-0.12, 0.05, 0.02],
          [-0.03, 0.14, -0.02],
          [0.02, 0.12, 0.01],
          [-0.1, -0.02, 0.0],
        ].map(([dx, dy, dz]) => sdf.cone(tip, [tip[0] + dx!, tip[1] + dy!, tip[2] + dz!], 0.03, 0.005)),
      );
      k.body('crest', sdf.union(headCrest.bone('head'), backCrest.bone('chest'), tailCrest.bone('tail1'), fin.bone('tail3')), {
        color: C.orange,
        roughness: 0.5,
        ...kind.looks?.crest,
      });

      // ------------------------------------------------------------------ brows and teeth
      const browAt = (x: number, y: number): V3 => {
        const h = faceHit(x, y);
        return [h[0], h[1], h[2] - 0.01];
      };
      const brows = pair(
        sdf.chain(
          [
            [...browAt(EYE_X + 0.075, EYE_Y + 0.07), 0.024],
            [...browAt(EYE_X + 0.02, EYE_Y + 0.058), 0.028],
            [...browAt(EYE_X - 0.05, EYE_Y + 0.03), 0.024],
          ],
          0.01,
        ),
      );
      k.body('brows', brows.bone('head'), { color: C.brow, roughness: 0.5 });
      k.body('crest-red', redCrest.bone('head'), { color: T.redDark, roughness: 0.5, ...kind.looks?.crestMid });
      const grinTop = (x: number) => GRIN_Y + GRIN_R - Math.sqrt(GRIN_R * GRIN_R - x * x) + 0.022;
      const teeth = sdf.union(
        ...[-0.06, -0.02, 0.02, 0.06].map((x) => {
          const h = faceHit(x, grinTop(x));
          return sdf.box([0.034, 0.026, 0.02], 0.007).at(h[0], h[1] - 0.008, h[2] - 0.004);
        }),
        ...[-0.1, 0.1].map((x) => {
          const h = faceHit(x, grinTop(x));
          return sdf.cone([h[0], h[1], h[2] - 0.006], [h[0] - Math.sign(x) * 0.004, h[1] - 0.04, h[2] + 0.002], 0.016, 0.004);
        }),
      );
      k.body('teeth', teeth.bone('head'), { color: C.tooth, roughness: 0.3, detail: 0.003 });
      // Two lower teeth stand up from the bottom of the grin; they go with the jaw.
      const lowerTeeth = sdf.union(
        ...[-0.035, 0.035].map((x) => {
          const h = faceHit(x, GRIN_Y + 0.004);
          return sdf.box([0.026, 0.02, 0.018], 0.006).at(h[0], h[1] + 0.006, h[2] - 0.006);
        }),
      );
      k.body('jaw-teeth', lowerTeeth, { color: C.tooth, roughness: 0.3, detail: 0.003, bone: 'jaw' });

      // ------------------------------------------------------------------ fire breath
      // Built at full size along +Z from its root (a narrow jet that swells into a rolling cone about
      // 0.5 m beyond the lips), then shrunk to FLAME_REST and hidden in the mouth.
      const fc = [rgb(C.fireCore), rgb(C.fire), rgb(C.fireTip)] as const;
      const flame = sdf
        .smoothUnion(
          0.05,
          sdf.cone([0, 0, 0], [0, 0, 0.34], 0.018, 0.085),
          sdf.cone([0, 0, 0.3], [0, 0.02, 0.58], 0.085, 0.025),
          sdf.sphere(0.07).at(0.03, 0.02, 0.37),
          sdf.sphere(0.06).at(-0.035, -0.015, 0.46),
        )
        .displace(0.012, (x, y, z) => noise.fbm(x * 16, y * 16, z * 10, 2))
        .paintFn((x, y, z) => {
          const r = Math.hypot(x, y);
          const t = Math.min(1, Math.max(0, z / 0.56 + r * 2));
          return t < 0.4 ? mixRgb(fc[0], fc[1], t / 0.4) : mixRgb(fc[1], fc[2], (t - 0.4) / 0.6);
        });
      k.body('fire-breath', flame.scale(FLAME_REST).at(...BREATH_AT), {
        color: C.fire,
        roughness: 1,
        emissive: C.fireTip,
        emissiveIntensity: 0.7,
        opacity: 0.9,
        detail: 0.006 * FLAME_REST,
        textureDensity: 0.5 / FLAME_REST,
        bone: 'breath',
      });

      // ------------------------------------------------------------------ claws on the hands and feet
      const handClaws = (s: 1 | -1) => {
        const wr = s > 0 ? WRIST : mx(WRIST);
        return sdf.union(
          ...[-0.022, 0, 0.022].map((dx) =>
            sdf.cone([wr[0] + dx, wr[1] - 0.02, wr[2] + 0.035], [wr[0] + dx * 1.2, wr[1] - 0.05, wr[2] + 0.06], 0.012, 0.003),
          ),
        ).bone(`hand.${s > 0 ? 'L' : 'R'}`);
      };
      const footClaws = pair(
        sdf
          .union(...[-0.045, 0, 0.045].map((x) => sdf.ellipsoid([0.022, 0.02, 0.028]).at(x, 0.02, 0.15 - Math.abs(x) * 0.5)))
          .rotateY(14)
          .at(ANKLE[0], 0, ANKLE[2])
          .bone('foot.L'),
      );
      k.body('claws', sdf.union(handClaws(1), handClaws(-1), footClaws), { color: C.claw, roughness: 0.4 });

      // ------------------------------------------------------------------ wings: orange membranes on red bones
      // Local frame: the root at the origin, the wing spread along +X, the membrane in the XY plane.
      const wingOutline = profile.polygon(
        [
          [0.0, 0.05],
          [0.12, 0.13],
          [0.24, 0.19],
          [0.4, 0.2],
          [0.34, 0.1],
          [0.3, 0.12],
          [0.25, 0.02],
          [0.19, 0.07],
          [0.12, -0.03],
          [0.06, 0.0],
          [0.0, -0.02],
        ],
        { smooth: false },
      );
      const membrane = sdf.extrude(wingOutline, 0.014, 0.004);
      const wingBones = sdf.union(
        sdf.chain([[0, 0.03, 0, 0.03], [0.24, 0.2, 0, 0.02], [0.41, 0.205, 0, 0.008]], 0.01),
        sdf.chain([[0.24, 0.2, 0, 0.016], [0.34, 0.1, 0, 0.006]], 0.006),
        sdf.chain([[0.24, 0.2, 0, 0.016], [0.25, 0.02, 0, 0.006]], 0.006),
        sdf.chain([[0.24, 0.2, 0, 0.016], [0.12, -0.03, 0, 0.006]], 0.006),
      );
      const wingPose = (s: sdf.Shape) => s.scale(1.25).rotateY(14).rotateZ(4).at(...WING_ROOT);
      k.body('wing-membranes', pair(wingPose(membrane).bone('wing.L')), { color: C.orange, roughness: 0.6, ...kind.looks?.wings });
      k.body('wing-bones', pair(wingPose(wingBones).bone('wing.L')), { color: T.red, roughness: 0.55 });

      kind.extra?.(k, { skull, faceHit, topHit: top });

      // ------------------------------------------------------------------ animation
      const { wave, bump, legDrop, keys } = motion;
      type R3 = [number, number, number];
      const DEG = 180 / Math.PI;
      const LEG = 0.11;
      const HIDE = [0.001, 0.001, 0.001] as const; // the fire breath, in every clip but the attack

      k.animation('idle', {
        duration: 2.6,
        pose: (_t, p) => ({
          hips: { move: [0, -0.004 * bump(p), 0] },
          chest: { rotate: [3 * wave(p), 0, 0] },
          head: { rotate: [0, 6 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] },
          'wing.L': { rotate: [0, 0, 10 * wave(p, 2, 0.1)] },
          'wing.R': { rotate: [0, 0, -10 * wave(p, 2, 0.1)] },
          tail1: { rotate: [0, 8 * wave(p, 1, 0.2), 0] },
          tail2: { rotate: [0, 10 * wave(p, 1, 0.35), 0] },
          tail3: { rotate: [4 * wave(p, 1, 0.5), 12 * wave(p, 1, 0.5), 0] },
          'upperarm.L': { rotate: [3 * wave(p, 1, 0.1), 0, 0] },
          'upperarm.R': { rotate: [3 * wave(p, 1, 0.1), 0, 0] },
          breath: { scale: HIDE },
        }),
      });

      // A waddle: short steps, a big side-to-side roll, wings beating, the tail swinging after.
      const stride = (duration: number, legSwing: number, roll: number, lean: number, hop: number, flap: number) => ({
        duration,
        pose: (_t: number, p: number) => {
          const s = wave(p);
          return {
            hips: {
              move: [0, -legDrop(LEG, legSwing * s) + hop * bump(p, 2, 0.25), 0] as const,
              rotate: [0, 6 * s, roll * s] as const,
            },
            spine: { rotate: [lean, 0, -roll * 0.5 * s] as const },
            chest: { rotate: [lean * 0.4, -6 * s, 0] as const },
            head: { rotate: [-lean, 4 * s, -roll * 0.3 * s] as const },
            'wing.L': { rotate: [0, 0, flap * wave(p, 2, 0.15)] as const },
            'wing.R': { rotate: [0, 0, -flap * wave(p, 2, 0.15)] as const },
            tail1: { rotate: [0, 12 * wave(p, 1, 0.2), 0] as const },
            tail2: { rotate: [0, 14 * wave(p, 1, 0.35), 0] as const },
            tail3: { rotate: [0, 16 * wave(p, 1, 0.5), 0] as const },
            'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
            'leg.R': { rotate: [legSwing * s, 0, 0] as const },
            'foot.L': { rotate: [legSwing * 0.6 * s + 10 * Math.max(0, -s), 0, 0] as const },
            'foot.R': { rotate: [-legSwing * 0.6 * s + 10 * Math.max(0, s), 0, 0] as const },
            'upperarm.L': { rotate: [8 * s, 0, 0] as const },
            'upperarm.R': { rotate: [-8 * s, 0, 0] as const },
            breath: { scale: HIDE },
          };
        },
      });
      k.animation('walk', stride(0.8, 26, 6, 3, 0, 12));
      k.animation('run', stride(0.5, 36, 7, 10, 0.02, 24));

      // Flying: lifted off the ground and tilted forward, the wings beat through a full stroke,
      // the body rises on each downstroke, the legs dangle back, and the tail trails and waves.
      k.animation('fly', {
        duration: 0.6,
        pose: (_t, p) => {
          const beat = wave(p); // +1 at the top of the upstroke
          const rise = wave(p, 1, 0.25); // the body lags the wings by a quarter beat
          return {
            hips: { move: [0, 0.36 + 0.035 * rise, 0], rotate: [14, 0, 0] },
            spine: { rotate: [4, 0, 0] },
            chest: { rotate: [2 * rise, 0, 0] },
            head: { rotate: [-16 - 2 * rise, 0, 0] },
            'wing.L': { rotate: [0, 6 * rise, 10 + 42 * beat] },
            'wing.R': { rotate: [0, -6 * rise, -10 - 42 * beat] },
            'upperarm.L': { rotate: [-18, 0, 0] },
            'upperarm.R': { rotate: [-18, 0, 0] },
            'forearm.L': { rotate: [-30, 0, 0] },
            'forearm.R': { rotate: [-30, 0, 0] },
            'leg.L': { rotate: [28 + 4 * rise, 0, 4] },
            'leg.R': { rotate: [28 + 4 * rise, 0, -4] },
            'foot.L': { rotate: [30, 0, 0] },
            'foot.R': { rotate: [30, 0, 0] },
            tail1: { rotate: [18 + 5 * wave(p, 1, 0.35), 0, 0] },
            tail2: { rotate: [6 + 8 * wave(p, 1, 0.5), 6 * wave(p, 1, 0.4), 0] },
            tail3: { rotate: [8 * wave(p, 1, 0.65), 10 * wave(p, 1, 0.55), 0] },
            breath: { scale: HIDE },
          };
        },
      });

      // The attack: a fire-breath roar. It draws back and up (the head tipped back, the chest filled
      // with air, the wings and the claws raised), hops 9 cm forward with the head level and the
      // jaws wide open, breathes a cone of fire at chest height for about a quarter second (it
      // grows in 0.1 s and flickers), then closes the jaws and hops back to the start.
      // `head` is the head's world pitch (- = nose up): the head's own turn cancels the body's.
      // `feet` is where the hops put the feet; `lean` is the hips ahead of the feet (the legs slant
      // so the feet stay flat and put).
      const FLAME_FULL = 1 / FLAME_REST;
      type Track = readonly (readonly [number, number])[];
      const ATTACK: Record<string, Track> = {
        feet: [[0, 0], [0.36, 0], [0.46, 0.09], [0.84, 0.09], [0.96, 0], [1, 0]],
        lean: [[0, 0], [0.3, -0.025], [0.36, -0.025], [0.46, 0.02], [0.8, 0.02], [0.92, 0], [1, 0]],
        hop: [[0, 0], [0.36, 0], [0.41, 0.035], [0.46, 0], [0.84, 0], [0.9, 0.025], [0.96, 0], [1, 0]],
        tuck: [[0, 0], [0.36, 0], [0.41, 1], [0.46, 0], [0.84, 0], [0.9, 1], [0.96, 0], [1, 0]],
        hx: [[0, 0], [0.3, -4], [0.36, -4], [0.46, 4], [0.8, 4], [1, 0]],
        sp: [[0, 0], [0.3, -8], [0.36, -9], [0.46, 9], [0.8, 9], [1, 0]],
        ch: [[0, 0], [0.3, -7], [0.36, -8], [0.46, 7], [0.8, 7], [1, 0]],
        nk: [[0, 0], [0.3, -10], [0.36, -11], [0.46, 4], [0.8, 4], [1, 0]],
        ny: [[0, 0], [0.3, 0.025], [0.36, 0.03], [0.46, 0.05], [0.8, 0.05], [0.94, 0], [1, 0]],
        nz: [[0, 0], [0.3, -0.02], [0.36, -0.02], [0.46, 0.05], [0.8, 0.05], [0.94, 0], [1, 0]],
        head: [[0, 0], [0.3, -34], [0.36, -36], [0.46, 0], [0.8, 0], [1, 0]],
        fill: [[0, 0], [0.3, 1], [0.36, 1], [0.46, -0.25], [0.8, -0.25], [1, 0]],
        jaw: [[0, 0], [0.3, 0.15], [0.38, 0.3], [0.46, 1], [0.78, 1], [0.88, 0], [1, 0]],
        fire: [[0, 0], [0.44, 0], [0.52, 1], [0.74, 1], [0.82, 0], [1, 0]],
        raise: [[0, 0], [0.3, 1], [0.36, 1], [0.46, 0], [1, 0]],
        flare: [[0, 0], [0.36, 0], [0.46, 1], [0.8, 1], [0.96, 0], [1, 0]],
        t1: [[0, 0], [0.3, 14], [0.36, 14], [0.46, -8], [0.8, -8], [1, 0]],
        t3: [[0, 0], [0.3, -20], [0.36, -20], [0.46, 14], [0.8, 14], [1, 0]],
      };
      k.animation('attack', {
        duration: 1.2,
        loop: false,
        pose: (_t, p) => {
          const v = (n: string) => keys(p, ATTACK[n]!);
          const lean = v('lean');
          const legA = Math.asin(lean / LEG) * DEG;
          const [hx, sp, ch, nk] = [v('hx'), v('sp'), v('ch'), v('nk')];
          const fill = v('fill');
          const cs: R3 = [1 + 0.08 * fill, 1 + 0.04 * fill, 1 + 0.08 * fill];
          const fire = v('fire');
          const flick = (c: number, o: number) => Math.max(0.001, FLAME_FULL * fire * (1 + 0.07 * wave(p, c, o)));
          const [raise, flare, tuck] = [v('raise'), v('flare'), v('tuck')];
          const shake = fire * wave(p, 8) * 2.5;
          const flap = 5 * fire * wave(p, 6);
          return {
            hips: { move: [0, v('hop') - legDrop(LEG, legA), v('feet') + lean], rotate: [hx, 0, 0] },
            spine: { rotate: [sp, 0, 0] },
            chest: { rotate: [ch, 0, 0], scale: cs },
            neck: { rotate: [nk, 0, 0], move: [0, v('ny'), v('nz')], scale: [1 / cs[0], 1 / cs[1], 1 / cs[2]] },
            head: { rotate: [v('head') - hx - sp - ch - nk, shake, 0] },
            jaw: { rotate: [35 * v('jaw'), 0, 0] },
            breath: { scale: [flick(11, 0), flick(11, 0.3), flick(7, 0.6)] },
            'wing.L': { rotate: [-12 * raise - 4 * flare, 18 * flare, 40 * raise + 16 * flare + flap] },
            'wing.R': { rotate: [-12 * raise - 4 * flare, -18 * flare, -40 * raise - 16 * flare - flap] },
            'upperarm.L': { rotate: [-35 * raise - 20 * flare, 0, 12 * raise + 26 * flare] },
            'upperarm.R': { rotate: [-35 * raise - 20 * flare, 0, -12 * raise - 26 * flare] },
            'forearm.L': { rotate: [-20 * raise, 0, 0] },
            'forearm.R': { rotate: [-20 * raise, 0, 0] },
            'leg.L': { rotate: [legA - hx - 14 * tuck, 0, 0] },
            'leg.R': { rotate: [legA - hx - 14 * tuck, 0, 0] },
            'foot.L': { rotate: [-legA + 14 * tuck, 0, 0] },
            'foot.R': { rotate: [-legA + 14 * tuck, 0, 0] },
            tail1: { rotate: [v('t1') - hx, 0, 0] },
            tail2: { rotate: [0, 8 * fire * wave(p, 3), 0] },
            tail3: { rotate: [v('t3'), 10 * fire * wave(p, 3, 0.2), 0] },
          };
        },
      });

      // A hit: the head snaps back in a pained roar, the body flinches back on planted feet, the
      // wings flare for a moment, and the tail whips; then a quick return.
      k.animation('hit', {
        duration: 0.4,
        loop: false,
        pose: (_t, p) => {
          const s = keys(p, [[0, 0], [0.16, 1], [0.34, 0.8], [1, 0]]);
          const flare = keys(p, [[0, 0], [0.14, 1], [0.4, 0.45], [1, 0]]);
          const whip = (lag: number) => keys(p, [[0, 0], [0.16 + lag, 1], [0.42 + lag, -0.7], [0.7 + lag, 0.25], [1, 0]]);
          const back = 0.016 * s;
          const legA = Math.asin(back / LEG) * DEG; // the legs lean forward so the feet stay put
          const tilt = -4 * s;
          return {
            hips: { move: [0, -legDrop(LEG, legA), -back], rotate: [tilt, 0, 0] },
            spine: { rotate: [-5 * s, 0, 2 * s] },
            chest: { rotate: [-5 * s, 0, 0] },
            neck: { rotate: [-7 * s, 0, 0] },
            head: { rotate: [-16 * s, 7 * s, 5 * s] },
            'wing.L': { rotate: [-8 * flare, 14 * flare, 36 * flare] },
            'wing.R': { rotate: [-8 * flare, -14 * flare, -36 * flare] },
            'upperarm.L': { rotate: [-28 * s, 0, 16 * s] },
            'upperarm.R': { rotate: [-28 * s, 0, -16 * s] },
            'forearm.L': { rotate: [-18 * s, 0, 0] },
            'forearm.R': { rotate: [-18 * s, 0, 0] },
            'leg.L': { rotate: [-tilt - legA, 0, 0] },
            'leg.R': { rotate: [-tilt - legA, 0, 0] },
            'foot.L': { rotate: [legA, 0, 0] },
            'foot.R': { rotate: [legA, 0, 0] },
            tail1: { rotate: [10 * s, 14 * whip(0), 0] },
            tail2: { rotate: [0, 20 * whip(0.05), 0] },
            tail3: { rotate: [8 * s, 28 * whip(0.1), 0] },
            breath: { scale: HIDE },
          };
        },
      });

      // Death: it rears up with a last roar, then the legs buckle and it rolls onto its right side.
      // It ends with the head down, the tail limp, the right wing flat on the floor, and the left
      // wing over its back.
      k.animation('death', {
        duration: 1.4,
        loop: false,
        pose: (_t, p) => {
          const k3 = (list: [number, R3][]) => keys(p, list) as R3;
          const roar = keys(p, [[0.14, 0], [0.2, 1], [0.3, 1], [0.36, 0]]);
          const shake = roar * wave(p, 9) * 5;
          const hipsX = keys(p, [[0, 0], [0.2, -10], [0.32, -8], [0.5, 8], [0.72, 0], [1, 0]]);
          const roll = keys(p, [[0, 0], [0.34, 0], [0.5, 16], [0.7, 82], [0.79, 72], [0.89, 79], [1, 77]]);
          const head = k3([[0, [0, 0, 0]], [0.2, [-26, 0, 0]], [0.32, [-24, 0, 0]], [0.5, [14, 0, 4]], [0.72, [14, 0, 2]], [0.82, [12, -4, 2]], [1, [12, -4, -2]]]);
          return {
            hips: {
              move: [
                keys(p, [[0.34, 0], [0.72, -0.08]]),
                keys(p, [[0, 0], [0.2, 0.012], [0.5, -0.02], [0.7, 0.04], [1, 0.04]]),
                keys(p, [[0, 0], [0.2, -0.02], [0.5, 0.02], [1, 0.02]]),
              ],
              rotate: [hipsX, 0, roll],
            },
            spine: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.32, -6], [0.5, 10], [0.72, 3], [1, 3]]), 0, 0] },
            chest: { rotate: [keys(p, [[0, 0], [0.2, -7], [0.32, -6], [0.5, 8], [1, 2]]), 0, 0] },
            neck: { rotate: k3([[0, [0, 0, 0]], [0.2, [-10, 0, 0]], [0.32, [-8, 0, 0]], [0.5, [10, 0, 6]], [0.7, [8, 0, 4]], [0.8, [10, 0, 6]], [0.9, [10, 0, 1]], [1, [10, 0, 3]]]) },
            head: { rotate: [head[0], head[1] + shake, head[2]] },
            'wing.L': { rotate: k3([[0, [0, 0, 0]], [0.2, [-10, 10, 46]], [0.32, [-8, 10, 40]], [0.5, [0, -10, 56]], [0.66, [0, 60, 20]], [0.8, [0, 125, -4]], [0.9, [0, 120, -12]], [1, [0, 128, -10]]]) },
            'wing.R': { rotate: k3([[0, [0, 0, 0]], [0.2, [-10, -10, -46]], [0.32, [-8, -10, -40]], [0.5, [0, -40, -20]], [0.62, [0, -75, 0]], [0.76, [0, -80, 0]], [1, [0, -76, 0]]]) },
            'upperarm.L': { rotate: k3([[0, [0, 0, 0]], [0.2, [-50, 0, 24]], [0.32, [-44, 0, 20]], [0.5, [-10, 0, 30]], [0.72, [-30, 0, -6]], [1, [-34, 0, -10]]]) },
            'upperarm.R': { rotate: k3([[0, [0, 0, 0]], [0.2, [-50, 0, -24]], [0.32, [-44, 0, -20]], [0.5, [-10, 0, -10]], [0.72, [-30, 0, 10]], [1, [-34, 0, 12]]]) },
            'forearm.L': { rotate: k3([[0, [0, 0, 0]], [0.2, [-30, 0, 0]], [0.5, [0, 0, 0]], [1, [10, 0, 0]]]) },
            'forearm.R': { rotate: k3([[0, [0, 0, 0]], [0.2, [-30, 0, 0]], [0.5, [0, 0, 0]], [1, [10, 0, 0]]]) },
            'leg.L': { rotate: k3([[0, [0, 0, 0]], [0.2, [10, 0, 0]], [0.32, [8, 0, 0]], [0.5, [-14, 0, 24]], [0.7, [-28, 0, 6]], [1, [-30, 0, 2]]]) },
            'leg.R': { rotate: k3([[0, [0, 0, 0]], [0.2, [10, 0, 0]], [0.32, [8, 0, 0]], [0.5, [-14, 0, -10]], [0.7, [-28, 0, 18]], [1, [-30, 0, 22]]]) },
            'foot.L': { rotate: k3([[0, [0, 0, 0]], [0.32, [0, 0, 0]], [0.5, [10, 0, 0]], [1, [36, 0, 0]]]) },
            'foot.R': { rotate: k3([[0, [0, 0, 0]], [0.32, [0, 0, 0]], [0.5, [10, 0, 0]], [1, [36, 0, 0]]]) },
            tail1: { rotate: k3([[0, [0, 0, 0]], [0.2, [12, 0, 0]], [0.32, [10, 8, 0]], [0.5, [-4, -10, 0]], [0.72, [0, -22, 0]], [1, [0, -20, 0]]]) },
            tail2: { rotate: k3([[0, [0, 0, 0]], [0.2, [6, 10, 0]], [0.4, [0, -12, 0]], [0.6, [0, 10, 0]], [0.8, [0, -30, 0]], [1, [0, -28, 0]]]) },
            tail3: { rotate: k3([[0, [0, 0, 0]], [0.22, [-10, 16, 0]], [0.45, [0, -18, 0]], [0.65, [0, 16, 0]], [0.85, [0, -34, 0]], [1, [0, -32, 0]]]) },
            breath: { scale: HIDE },
          };
        },
      });

      // A roar: it rears up (the pelvis comes over the feet, the spine arches back, the chest fills,
      // the front claws rise, the wings spread wide and up, the tail lifts), thrusts the head forward
      // and up with the jaws wide, puffs a small burst of fire, and holds the roar with a shake of
      // the head and the chest. Then the jaws close, the wings fold, and it drops forward onto its
      // front claws with a stomp (the chest squashes, the body bounces) and settles at rest.
      // `legA` is the world pitch of both legs; the hips move so that both ankles stay exactly put.
      const rotX = (y: number, z: number, deg: number): [number, number] => {
        const r = deg / DEG;
        return [y * Math.cos(r) - z * Math.sin(r), y * Math.sin(r) + z * Math.cos(r)];
      };
      const HIPS_AT: V3 = [0, 0.17, 0];
      const HIP_D = [HIP[1] - HIPS_AT[1], HIP[2] - HIPS_AT[2]] as const; // the hip joint from the hips pivot
      const LEG_D = [ANKLE[1] - HIP[1], ANKLE[2] - HIP[2]] as const; // the ankle from the hip joint
      const ROAR: Record<string, Track> = {
        legA: [[0, 0], [0.26, 18], [0.74, 18], [0.84, 10], [0.88, -5], [0.93, 1], [1, 0]],
        hx: [[0, 0], [0.26, -6], [0.74, -6], [0.84, -3], [0.88, 4], [0.94, -1], [1, 0]],
        sp: [[0, 0], [0.26, -10], [0.33, -12], [0.74, -12], [0.84, -4], [0.88, 8], [0.94, -2], [1, 0]],
        ch: [[0, 0], [0.26, -8], [0.33, -4], [0.74, -4], [0.84, -2], [0.88, 6], [0.94, -1], [1, 0]],
        nk: [[0, 0], [0.26, -6], [0.33, 6], [0.74, 6], [0.84, 0], [0.88, 4], [1, 0]],
        ny: [[0, 0], [0.26, 0.02], [0.33, 0.04], [0.74, 0.04], [0.84, 0.01], [0.88, -0.005], [0.94, 0], [1, 0]],
        nz: [[0, 0], [0.26, -0.015], [0.33, 0.05], [0.74, 0.05], [0.84, 0.01], [0.9, 0.005], [1, 0]],
        head: [[0, 0], [0.26, -10], [0.33, -18], [0.74, -18], [0.84, -4], [0.88, 6], [0.94, -2], [1, 0]],
        fill: [[0, 0], [0.26, 1], [0.33, 0.6], [0.74, 0.2], [0.86, 0], [1, 0]],
        squash: [[0, 0], [0.86, 0], [0.89, 1], [0.95, 0], [1, 0]],
        jaw: [[0, 0], [0.2, 0.1], [0.28, 0.15], [0.34, 1], [0.74, 1], [0.82, 0], [1, 0]],
        puff: [[0, 0], [0.34, 0], [0.37, 1], [0.44, 0.8], [0.5, 0], [1, 0]],
        shake: [[0, 0], [0.36, 0], [0.4, 1], [0.7, 1], [0.76, 0], [1, 0]],
        spread: [[0, 0], [0.24, 1], [0.76, 1], [0.86, -0.15], [0.94, 0.05], [1, 0]],
        raise: [[0, 0], [0.24, 1], [0.74, 1], [0.83, 0.8], [0.88, -0.1], [0.94, 0.03], [1, 0]],
        t1: [[0, 0], [0.26, 24], [0.74, 24], [0.86, 6], [0.9, 0], [0.95, 2], [1, 0]],
        t2: [[0, 0], [0.28, 10], [0.74, 10], [0.88, 0], [1, 0]],
        t3: [[0, 0], [0.3, 14], [0.74, 14], [0.9, -4], [1, 0]],
      };
      k.animation('roar', {
        duration: 1.8,
        loop: false,
        pose: (_t, p) => {
          const v = (n: string) => keys(p, ROAR[n]!);
          const [legA, hx, sp, ch, nk] = [v('legA'), v('hx'), v('sp'), v('ch'), v('nk')];
          // The hips move that keeps the ankles on their rest spots after the hips and legs turn.
          const hd = rotX(HIP_D[0], HIP_D[1], hx);
          const ld = rotX(LEG_D[0], LEG_D[1], legA);
          const my = HIP_D[0] - hd[0] + LEG_D[0] - ld[0];
          const mz = HIP_D[1] - hd[1] + LEG_D[1] - ld[1];
          const [fill, sq] = [v('fill'), v('squash')];
          const cs: R3 = [1 + 0.08 * fill + 0.05 * sq, 1 + 0.04 * fill - 0.07 * sq, 1 + 0.08 * fill + 0.05 * sq];
          const shake = v('shake');
          const puff = v('puff');
          const burst = (c: number, o: number) => Math.max(0.001, 0.25 * FLAME_FULL * puff * (1 + 0.1 * wave(p, c, o)));
          const [spread, raise] = [v('spread'), v('raise')];
          const flutter = 6 * shake * wave(p, 7);
          return {
            hips: { move: [0, my, mz], rotate: [hx, 0, 0] },
            spine: { rotate: [sp, 0, 0] },
            chest: { rotate: [ch, 2 * shake * wave(p, 9, 0.2), 2.5 * shake * wave(p, 9)], scale: cs },
            neck: { rotate: [nk, 0, 0], move: [0, v('ny'), v('nz')], scale: [1 / cs[0], 1 / cs[1], 1 / cs[2]] },
            head: { rotate: [v('head') - hx - sp - ch - nk, 7 * shake * wave(p, 8), 3 * shake * wave(p, 8, 0.25)] },
            jaw: { rotate: [40 * v('jaw'), 0, 0] },
            breath: { move: [0, 0, 0.08], scale: [burst(13, 0), burst(13, 0.3), burst(9, 0.6)] }, // a puff at the lips
            'wing.L': { rotate: [-10 * spread, -14 * spread, 40 * spread + flutter] },
            'wing.R': { rotate: [-10 * spread, 14 * spread, -40 * spread - flutter] },
            'upperarm.L': { rotate: [-55 * raise, 0, 18 * raise] },
            'upperarm.R': { rotate: [-55 * raise, 0, -18 * raise] },
            'forearm.L': { rotate: [-35 * raise, 0, 0] },
            'forearm.R': { rotate: [-35 * raise, 0, 0] },
            'leg.L': { rotate: [legA - hx, 0, 0] },
            'leg.R': { rotate: [legA - hx, 0, 0] },
            'foot.L': { rotate: [-legA, 0, 0] },
            'foot.R': { rotate: [-legA, 0, 0] },
            tail1: { rotate: [v('t1') - hx, 0, 0] },
            tail2: { rotate: [v('t2'), 8 * shake * wave(p, 3), 0] },
            tail3: { rotate: [v('t3'), 10 * shake * wave(p, 3, 0.2), 0] },
          };
        },
      });
    },
  });
}
