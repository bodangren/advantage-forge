import { defineAsset, motion, noise, profile, rgb, sdf } from '../../src/index.js';
import type { AssetContext, AssetDefinition } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

/**
 * Imp kinds — the imp of `assets/imp.ts` (catalog `monsters/small/imp`) and its devil kinds (the
 * imp lord, the demon, the horned demon). One head, face, body plan, bat wings, rig, and clip set
 * (idle, fly, attack, hit, death, cast); each kind sets the palette and the slots, may change the
 * horns, the bulk of the body and the limbs, the size of the wings, and the hair crest, and may
 * add skin paint (markings) and bodies (a crown, a cape, bracers). The design notes of the body,
 * the rig, and the clips are in `assets/imp.ts`.
 */

const IMP_COLORS = {
  skin: '#d8503c',
  skinDark: '#a83426',
  belly: '#e8785c',
  eyeWhite: '#fbf1e2',
  iris: '#e8a030',
  irisDark: '#a85a18',
  pupil: '#1a0e0a',
  brow: '#6a1e16',
  mouth: '#5a1410',
  tongue: '#e0605a',
  tooth: '#fbf6ee',
  horn: '#4a2e24',
  hornTip: '#6e4636',
  claw: '#2a1e1e',
  membrane: '#e0704a',
  membraneDark: '#b8482e',
  wingBone: '#5a2e22',
  fire: '#ff5a0a',
  fireCore: '#ffc81e',
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const HEAD_C: V3 = [0, 0.52, 0.02];
const HEAD = [0.152, 0.142, 0.138] as const;
// Joints. The arms reach forward with the claws open; the legs dangle with the knees forward.
const SHOULDER: V3 = [0.072, 0.36, 0.0];
const ELBOW: V3 = [0.13, 0.31, 0.06];
const WRIST: V3 = [0.15, 0.3, 0.13];
const HIP: V3 = [0.05, 0.24, 0.0];
const KNEE: V3 = [0.075, 0.15, 0.05];
const ANKLE: V3 = [0.07, 0.07, -0.02];
const WING_ROOT: V3 = [0.055, 0.38, -0.07];
const HIPS_AT: V3 = [0, 0.25, -0.01];
// The fireball's bone: at the chest center, inside the torso, where it hides at scale 0.001.
const ORB_AT: V3 = [0, 0.31, 0.03];
const TAIL: V3[] = [
  [0, 0.23, -0.07],
  [-0.06, 0.13, -0.19],
  [-0.15, 0.15, -0.28],
  [-0.2, 0.26, -0.3],
];

/** A clawed hand at the wrist `w`, fingers spread forward and curled down; `s` mirrors it. */
const clawHand = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  const finger = (dx: number) =>
    sdf.chain(
      [
        [...o(dx * 0.6, -0.004, 0.024), 0.011],
        [...o(dx, 0.0, 0.05), 0.0095],
        [...o(dx * 1.1, -0.014, 0.066), 0.0085],
      ],
      0.004,
    );
  return {
    hand: sdf.smoothUnion(0.01, sdf.ellipsoid([0.03, 0.022, 0.032]).at(...o(0, -0.004, 0.012)), finger(-0.022), finger(0), finger(0.022), sdf.cone(o(0.024, 0.0, 0.006), o(0.04, 0.004, 0.034), 0.011, 0.008)),
    claws: sdf.union(
      ...[-0.022, 0, 0.022].map((dx) => sdf.cone(o(dx * 1.1, -0.014, 0.066), o(dx * 1.15, -0.034, 0.078), 0.008, 0.002)),
      sdf.cone(o(0.04, 0.004, 0.034), o(0.05, -0.01, 0.05), 0.007, 0.002),
    ),
  };
};

/** A clawed foot at the ankle `a`, toes pointing down and back; `s` mirrors it. */
const clawFoot = (a: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [a[0] + dx * s, a[1] + dy, a[2] + dz];
  return {
    foot: sdf.smoothUnion(
      0.01,
      sdf.ellipsoid([0.032, 0.03, 0.04]).at(...o(0, -0.02, 0.012)),
      ...[-0.018, 0, 0.018].map((dx) => sdf.capsule(o(dx, -0.03, 0.03), o(dx * 1.2, -0.05, 0.044), 0.011)),
    ),
    claws: sdf.union(...[-0.018, 0, 0.018].map((dx) => sdf.cone(o(dx * 1.2, -0.05, 0.044), o(dx * 1.25, -0.07, 0.046), 0.009, 0.002))),
  };
};

/** A chain of horn points: [x, y, z, radius] from the root on the head to the tip (left side). */
export type HornChain = [number, number, number, number][];

/** The imp's left horn: big, curved, and ringed. */
const IMP_HORN: HornChain = [
  [0.07, 0.61, 0.0, 0.034],
  [0.125, 0.665, -0.025, 0.03],
  [0.145, 0.735, -0.01, 0.022],
  [0.125, 0.79, 0.025, 0.012],
  [0.095, 0.81, 0.045, 0.004],
];

/** An imp kind: the slots, fixed colors, the horns, the bulk, and extra paint and bodies. */
export interface ImpKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `skin`, `wings`, `eyes`, and `horns` (no `horns` slot when `horns` is empty); the first option of each is the default look. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  /** Fixed colors and the default shades of the slots (skinDark, belly, brow, irisDark, vein). */
  readonly colors?: Partial<typeof IMP_COLORS> & { vein?: string };
  /** The left horns (each mirrored); the imp has one big ringed horn on each side. */
  readonly horns?: HornChain[];
  /** Light rings on the horns below this height (the imp: 0.74); false for plain horns. */
  readonly hornRings?: number | false;
  /** The thickness of the torso, the arms, and the legs as a share of the imp's (a demon is 1.3). */
  readonly bulk?: number;
  /** The size of the wings (the imp: 1.2). */
  readonly wingScale?: number;
  /** The little crest of spiky hair on the forehead (default true). */
  readonly crest?: boolean;
  /** The tip of the left ear and the root radius, for ears that stand up (default: swept out and back). */
  readonly ear?: { readonly tip: V3; readonly r: number };
  /** False: no angry brows and no slanted lids (a calm face). */
  readonly brows?: boolean;
  /** The mouth: the wicked open grin with fangs (default) or a small closed smile. */
  readonly mouth?: 'grin' | 'smile';
  /** False: no bat wings (a kind may hang its own wings on `wing.L` and `wing.R`). */
  readonly wings?: boolean;
  /** False: no tail and no spade (the tail bones stay). */
  readonly tail?: boolean;
  /** False: no dark claws on the hands and the feet. */
  readonly claws?: boolean;
  /** Extra skin paint (markings, a darker face). */
  paint?(skin: sdf.Shape, imp: ImpShape): sdf.Shape;
  /** Extra bodies (a crown, a cape, bracers), rigid on a bone or tagged to bones. */
  extra?(k: AssetContext, imp: ImpShape): void;
}

/** The imp's shapes, joints, and slot colors that a kind builds on. */
export interface ImpShape {
  /** The head (skull, cheeks, jaw, and brow), centered at `HEAD_C`. */
  readonly head: sdf.Shape;
  /** The torso (chest, belly, and neck), tagged to its bones. */
  readonly torso: sdf.Shape;
  /** The center of the left eye on the face (x, y). */
  readonly eye: readonly [number, number];
  /** The z of the front of the head at (x, y). */
  faceZ(x: number, y: number): number;
  readonly joints: { readonly HEAD_C: V3; readonly SHOULDER: V3; readonly ELBOW: V3; readonly WRIST: V3; readonly HIP: V3; readonly KNEE: V3; readonly ANKLE: V3; readonly WING_ROOT: V3 };
  /** The slot colors and their shades. */
  readonly tint: Record<'skin' | 'skinDark' | 'belly' | 'brow' | 'membrane' | 'iris' | 'horn', string>;
  /** A fixed default color that follows a slot (`k.tint(slot, { color, follow })`). */
  tone(slot: string, color: string, follow?: number): string;
}

export function impAsset(kind: ImpKind): AssetDefinition {
  const C = { ...IMP_COLORS, ...kind.colors };
  const bulk = kind.bulk ?? 1;
  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.004,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k) {
      // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
      const T = {
        skin: k.tint('skin'),
        skinDark: k.tint('skin', { color: C.skinDark, follow: 1 }),
        belly: k.tint('skin', { color: C.belly, follow: 1 }),
        brow: k.tint('skin', { color: C.brow, follow: 1 }),
        membrane: k.tint('wings'),
        // The veins: the membrane times (0.8, 0.75, 0.75) in linear light, as an exact shade.
        vein: k.tint('wings', { color: C.vein ?? '#cb6240', follow: 1 }),
        iris: k.tint('eyes'),
        irisDark: k.tint('eyes', { color: C.irisDark, follow: 1 }),
        horn: kind.horns?.length === 0 ? C.horn : k.tint('horns'),
      };
      k.skeleton({
        hips: { at: HIPS_AT },
        spine: { parent: 'hips', at: [0, 0.3, 0] },
        chest: { parent: 'spine', at: [0, 0.35, 0] },
        neck: { parent: 'chest', at: [0, 0.39, 0] },
        head: { parent: 'neck', at: [0, 0.42, 0.01] },
        'wing.L': { parent: 'chest', at: WING_ROOT, tail: [0.45, 0.56, -0.16] },
        'wing.R': { parent: 'chest', at: mx(WING_ROOT), tail: [-0.45, 0.56, -0.16] },
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
        'shin.L': { parent: 'leg.L', at: KNEE },
        'foot.L': { parent: 'shin.L', at: ANKLE },
        'leg.R': { parent: 'hips', at: mx(HIP) },
        'shin.R': { parent: 'leg.R', at: mx(KNEE) },
        'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
        orb: { parent: 'hips', at: ORB_AT },
      });

      // ------------------------------------------------------------------ head
      const head = sdf.smoothUnion(
        0.04,
        sdf.ellipsoid(HEAD).at(...HEAD_C),
        pair(sdf.sphere(0.07).at(0.07, 0.46, 0.08)), // cheeks
        sdf.ellipsoid([0.09, 0.05, 0.07]).at(0, 0.43, 0.07), // jaw
        sdf.ellipsoid([0.11, 0.028, 0.05]).at(0, 0.565, 0.1), // a heavy brow ridge
      );
      const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
      const nose = sdf.ellipsoid([0.02, 0.016, 0.016]).at(0, 0.49, faceZ(0, 0.49) - 0.003);
      // Pointed ears swept out and back.
      const ear = kind.ear;
      const ears = ear
        ? pair(
            sdf
              .cone([0.12, 0.52, 0.0], ear.tip, ear.r, 0.004)
              .smoothSubtract(0.004, sdf.cone([0.13, 0.52, ear.r * 0.5], lerp([0.12, 0.52, ear.r * 0.6], ear.tip, 0.85), ear.r * 0.6, 0.002)),
          )
        : pair(
            sdf
              .cone([0.12, 0.52, 0.0], [0.24, 0.56, -0.05], 0.038, 0.004)
              .smoothSubtract(0.004, sdf.cone([0.13, 0.52, 0.018], [0.22, 0.55, -0.03], 0.022, 0.002)),
          );
      // A little crest of spiky hair on the forehead.
      const crestAt = sdf.raycast(head, [0, 2, 0.06], [0, -1, 0])!;
      const crest = sdf.union(
        ...[
          [0, 0.05, 0.03],
          [-0.03, 0.035, 0.0],
          [0.03, 0.035, 0.0],
        ].map(([dx, h, dz]) => sdf.cone([crestAt[0] + dx!, crestAt[1] - 0.02, crestAt[2] + dz!], [crestAt[0] + dx! * 1.3, crestAt[1] + h!, crestAt[2] + dz! + 0.03], 0.024, 0.004)),
      );

      // ------------------------------------------------------------------ body, arms, legs, tail
      const torso = sdf.smoothUnion(
        0.04,
        sdf.ellipsoid([0.095 * bulk, 0.075 * bulk, 0.072 * bulk]).at(0, 0.34, 0.0).bone('chest'),
        sdf.ellipsoid([0.085 * bulk, 0.07 * bulk, 0.075 * bulk]).at(0, 0.27, 0.015).bone('spine'),
        sdf.capsule([0, 0.36, 0], [0, 0.44, 0.01], 0.04 * bulk).bone('neck'),
      );
      const armAt = (s: 1 | -1) => {
        const side = s > 0 ? 'L' : 'R';
        const sh = s > 0 ? SHOULDER : mx(SHOULDER);
        const el = s > 0 ? ELBOW : mx(ELBOW);
        const wr = s > 0 ? WRIST : mx(WRIST);
        const { hand } = clawHand(wr, s);
        return sdf.smoothUnion(
          0.015,
          sdf.cone(sh, el, 0.036 * bulk, 0.031 * bulk).bone(`upperarm.${side}`),
          sdf.cone(el, wr, 0.031 * bulk, 0.027 * bulk).bone(`forearm.${side}`),
          hand.bone(`hand.${side}`),
        );
      };
      const legAt = (s: 1 | -1) => {
        const side = s > 0 ? 'L' : 'R';
        const h = s > 0 ? HIP : mx(HIP);
        const kn = s > 0 ? KNEE : mx(KNEE);
        const an = s > 0 ? ANKLE : mx(ANKLE);
        const { foot } = clawFoot(an, s);
        return sdf.smoothUnion(
          0.015,
          sdf.cone(h, kn, 0.048 * bulk, 0.036 * bulk).bone(`leg.${side}`),
          sdf.cone(kn, an, 0.036 * bulk, 0.027 * bulk).bone(`shin.${side}`),
          foot.bone(`foot.${side}`),
        );
      };
      const tailShape = sdf.smoothUnion(
        0.012,
        sdf.chain([[...TAIL[0]!, 0.022], [...TAIL[1]!, 0.016]], 0.01).bone('tail1'),
        sdf.chain([[...TAIL[1]!, 0.016], [...TAIL[2]!, 0.012]], 0.01).bone('tail2'),
        sdf.chain([[...TAIL[2]!, 0.012], [...TAIL[3]!, 0.01]], 0.01).bone('tail3'),
      );
      // The arrow tip: a flat heart-shaped spade at the end of the tail.
      const tip = TAIL[3]!;
      const spade = sdf
        .extrude(
          profile.polygon(
            [
              [0, 0.07],
              [0.036, 0.018],
              [0.02, 0.0],
              [0.006, 0.01],
              [0, -0.006],
              [-0.006, 0.01],
              [-0.02, 0.0],
              [-0.036, 0.018],
            ],
            { smooth: true, samples: 3 },
          ),
          0.016,
          0.006,
        )
        .rotateZ(30)
        .rotateY(40)
        .at(tip[0] - 0.01, tip[1] - 0.005, tip[2])
        .bone('tail3');

      // ------------------------------------------------------------------ face paint
      const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
      const EYE: V3 = [0.064, 0.512, 0];
      const eyeWhite = pair(at(sdf.ellipsoid([0.049, 0.047, 0.06]), EYE[0], EYE[1]));
      const iris = pair(at(sdf.ellipsoid([0.038, 0.04, 0.06]), EYE[0] - 0.004, EYE[1] - 0.004));
      const irisDark = iris.intersect(sdf.halfSpace([0, -1, 0], -(EYE[1] + 0.01)));
      const pupil = pair(at(sdf.ellipsoid([0.019, 0.026, 0.06]), EYE[0] - 0.007, EYE[1] - 0.005));
      const shine = pair(at(sdf.sphere(0.009), EYE[0] + 0.006, EYE[1] + 0.014));
      // An angry lid: the top of each eye is cut on a slant, lower toward the nose.
      const lid = pair(
        sdf
          .extrude(
            profile.polygon([
              [EYE[0] - 0.05, EYE[1] + 0.012],
              [EYE[0] + 0.05, EYE[1] + 0.04],
              [EYE[0] + 0.05, EYE[1] + 0.08],
              [EYE[0] - 0.05, EYE[1] + 0.08],
            ]),
            0.3,
          )
          .at(0, 0, 0.1),
      );
      const brows = pair(
        sdf
          .extrude(
            profile.polygon(
              [
                [0.12, 0.574],
                [0.085, 0.582],
                [0.05, 0.566],
                [0.022, 0.542],
                [0.028, 0.53],
                [0.055, 0.548],
                [0.088, 0.562],
                [0.118, 0.562],
              ],
              { smooth: true, samples: 3 },
            ),
            0.3,
          )
          .at(0, 0, 0.1),
      );
      // A wide, wicked grin, open, with a tongue.
      const MOUTH_Y = 0.448;
      const mouth = sdf
        .extrude(
          profile.polygon(
            [
              [-0.06, 0.012],
              [0.06, 0.012],
              [0.045, -0.012],
              [0.02, -0.026],
              [0, -0.03],
              [-0.02, -0.026],
              [-0.045, -0.012],
            ],
            { smooth: true, samples: 4 },
          ),
          0.3,
        )
        .at(0, MOUTH_Y, 0.1);
      const tongue = mouth.round(-0.005).intersect(sdf.sphere(0.024).at(0, MOUTH_Y - 0.028, 0.2).elongate(0.01, 0, 0.2));
      const limbs = sdf
        .smoothUnion(0.03, head.bone('head'), torso)
        .smoothUnion(0.01, nose.bone('head'), ears.bone('head'), ...(kind.crest === false ? [] : [crest.bone('head')]))
        .union(armAt(1), armAt(-1), legAt(1), legAt(-1));
      const calm = kind.brows === false;
      const smile = kind.mouth === 'smile';
      // A small closed smile: a thin arc, low on the face.
      const smileLine = sdf.extrude(profile.arc(0.05, 0.007, 235, 305), 0.3).at(0, MOUTH_Y + 0.05, 0.1);
      const bodyShape = kind.tail === false ? limbs : limbs.smoothUnion(0.012, tailShape).union(spade);
      const painted = bodyShape
        .paintWhere(sdf.halfSpace([0, 0, 1], -0.06).intersect(sdf.sphere(0.4).at(0, 0.3, -0.1)), T.skinDark, 0.06) // a darker back
        .paintWhere(sdf.ellipsoid([0.06, 0.07, 0.1]).at(0, 0.3, 0.06), T.belly, 0.03)
        .paintWhere(eyeWhite, C.eyeWhite)
        .paintWhere(iris, T.iris)
        .paintWhere(irisDark, T.irisDark, 0.008)
        .paintWhere(pupil, C.pupil)
        .paintWhere(shine, '#ffffff');
      const faced = calm ? painted : painted.paintWhere(lid.intersect(eyeWhite.round(0.004)), T.skinDark, 0.002).paintWhere(brows, T.brow, 0.002);
      const skin = smile ? faced.paintWhere(smileLine, C.mouth, 0.002) : faced.paintWhere(mouth, C.mouth, 0.002).paintWhere(tongue, C.tongue, 0.004);
      const tone = (slot: string, color: string, follow = 1) => k.tint(slot, { color, follow });
      const imp: ImpShape = {
        head,
        torso,
        eye: [EYE[0], EYE[1]],
        faceZ,
        joints: { HEAD_C, SHOULDER, ELBOW, WRIST, HIP, KNEE, ANKLE, WING_ROOT },
        tint: { skin: T.skin, skinDark: T.skinDark, belly: T.belly, brow: T.brow, membrane: T.membrane, iris: T.iris, horn: T.horn },
        tone,
      };
      k.body('skin', kind.paint?.(skin, imp) ?? skin, {
        color: T.skin,
        roughness: 0.5,
        textureDensity: 2,
        bump: (x, y, z) => 0.0005 * noise.fbm(x * 100, y * 100, z * 100, 2),
      });

      // ------------------------------------------------------------------ teeth: a row of small fangs
      const grinTop = MOUTH_Y + 0.012;
      const teeth = sdf.union(
        ...[-0.042, -0.014, 0.014, 0.042].map((x, i) => {
          const z = faceZ(Math.abs(x), grinTop) - 0.004;
          const long = i === 0 || i === 3;
          return sdf.cone([x, grinTop + 0.004, z], [x * 0.95, grinTop - (long ? 0.03 : 0.018), z + 0.004], long ? 0.011 : 0.009, 0.002);
        }),
      );
      if (!smile) k.body('teeth', teeth.bone('head'), { color: C.tooth, roughness: 0.3, detail: 0.003 });

      // ------------------------------------------------------------------ horns: big, curved, ringed
      const rings = kind.hornRings ?? 0.74;
      const chains = (kind.horns ?? [IMP_HORN]).map((h) => sdf.chain(h, 0.012));
      if (chains.length > 0) {
        const horn = (chains.length === 1 ? chains[0]! : sdf.union(...chains)).paintFn((_x, y, _z, base) =>
          rings !== false && Math.sin(y * 260) > 0.6 && y < rings ? [base[0] * 1.25, base[1] * 1.25, base[2] * 1.25] : base,
        );
        k.body('horns', pair(horn).bone('head'), { color: T.horn, roughness: 0.45 });
      }
      const claws = sdf.union(
        clawHand(WRIST, 1).claws.bone('hand.L'),
        clawHand(mx(WRIST), -1).claws.bone('hand.R'),
        clawFoot(ANKLE, 1).claws.bone('foot.L'),
        clawFoot(mx(ANKLE), -1).claws.bone('foot.R'),
      );
      if (kind.claws !== false) k.body('claws', claws, { color: C.claw, roughness: 0.35, detail: 0.003 });

      // ------------------------------------------------------------------ bat wings
      // Local frame: the root at the origin, the wing spread along +X, the membrane in the XY plane.
      // The arm bone arches up and out to a high knuckle; four long fingers fan down from it.
      const KNUCKLE: V3 = [0.2, 0.22, 0];
      const fingerTips: V3[] = [
        [0.42, 0.2, 0],
        [0.45, 0.04, 0],
        [0.35, -0.11, 0],
        [0.19, -0.13, 0],
      ];
      // The membrane scallops between the finger tips.
      const wingOutline = profile.polygon(
        [
          [0.0, 0.05],
          [0.1, 0.17],
          [KNUCKLE[0], KNUCKLE[1]],
          [0.32, 0.23],
          [fingerTips[0]![0], fingerTips[0]![1]],
          [0.37, 0.11],
          [fingerTips[1]![0], fingerTips[1]![1]],
          [0.34, -0.0],
          [fingerTips[2]![0], fingerTips[2]![1]],
          [0.24, -0.05],
          [fingerTips[3]![0], fingerTips[3]![1]],
          [0.1, -0.05],
          [0.0, -0.02],
        ],
        { smooth: false },
      );
      const membrane = sdf
        .extrude(wingOutline, 0.012, 0.004)
        .paintFn((x, y, _z, base) => {
          // Darker veins fanning from the knuckle.
          const a = Math.atan2(y - KNUCKLE[1], x - KNUCKLE[0]);
          return Math.abs(Math.sin(a * 6)) < 0.12 ? rgb(T.vein) : base;
        });
      const wingBones = sdf.union(
        sdf.chain([[0, 0.04, 0, 0.02], [0.1, 0.17, 0, 0.017], [KNUCKLE[0], KNUCKLE[1], 0, 0.015]], 0.008),
        sdf.sphere(0.018).at(...KNUCKLE),
        ...fingerTips.map((t) => sdf.chain([[KNUCKLE[0], KNUCKLE[1], 0, 0.011], [t[0], t[1], 0, 0.004]], 0.004)),
        sdf.cone([KNUCKLE[0], KNUCKLE[1], 0], [KNUCKLE[0] - 0.01, KNUCKLE[1] + 0.05, 0], 0.012, 0.003), // the thumb claw
      );
      const wingPose = (s: sdf.Shape) => s.scale(kind.wingScale ?? 1.2).rotateY(22).rotateZ(10).at(...WING_ROOT);
      if (kind.wings !== false) {
        k.body('wing-membranes', pair(wingPose(membrane).bone('wing.L')), { color: T.membrane, roughness: 0.6 });
        k.body('wing-bones', pair(wingPose(wingBones).bone('wing.L')), { color: C.wingBone, roughness: 0.5 });
      }

      // ------------------------------------------------------------------ the fireball (cast only)
      // A ball of fire 5.6 cm across: orange flame licks over a yellow-white core that shows in the
      // hollows between them. It rides the `orb` bone and hides at scale 0.001 outside the cast.
      const fire = rgb(C.fire);
      const fireCore = rgb(C.fireCore);
      const lick = (x: number, y: number, z: number) => noise.fbm(x * 80, y * 80, z * 80, 2);
      const fireball = sdf
        .sphere(0.028)
        .displace(0.003, lick)
        .paintFn((x, y, z) => {
          const t = Math.min(1, Math.max(0, 0.55 - 2 * lick(x, y, z)));
          return [fireCore[0] + (fire[0] - fireCore[0]) * t, fireCore[1] + (fire[1] - fireCore[1]) * t, fireCore[2] + (fire[2] - fireCore[2]) * t] as const;
        })
        .at(...ORB_AT);
      k.body('fireball', fireball, { bone: 'orb', color: C.fire, roughness: 0.3, emissive: C.fire, emissiveIntensity: 0.9, detail: 0.003 });
      kind.extra?.(k, imp);

      // ------------------------------------------------------------------ animation
      const { wave, keys, reach, quat, euler } = motion;
      const hover = (p: number, beats: number, lift: number, bob: number) => ({
        move: [0, lift + bob * wave(p, beats, 0.25), 0] as const,
      });
      const HIDE = { scale: [0.001, 0.001, 0.001] as V3 }; // the fireball, outside the cast
      const ease = (a: number, b: number, x: number) => {
        const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
        return t * t * (3 - 2 * t);
      };

      // The wing beat. A beat about Z alone keeps the membrane in one plane, so the side and the
      // three-quarter cameras see it edge-on near the top and the bottom of the stroke. A wing pose is
      // three angles: `raise` (Z, the tip up), `fwd` (Y, the tip forward), and `twist` about the
      // wing's own rest span (+ turns the leading edge forward and down). They compose as twist, then
      // sweep, then raise; the right wing mirrors the left.
      type WingAngles = { raise: number; fwd: number; twist: number };
      const restWing = quat([0, 0, 10]).multiply(quat([0, 22, 0])); // wingPose: rotateY(22), then rotateZ(10)
      const restWingInv = restWing.clone().invert();
      const wings = ({ raise, fwd, twist }: WingAngles) => {
        const q = quat([0, 0, raise]).multiply(quat([0, -fwd, 0])).multiply(restWing).multiply(quat([twist, 0, 0])).multiply(restWingInv);
        const r = euler(q);
        return { 'wing.L': { rotate: r }, 'wing.R': { rotate: [r[0], -r[1], -r[2]] as typeof r } };
      };
      // One beat cycle; `u` counts beats (0 = mid-upstroke, 0.25 = top, 0.75 = bottom). The tip sweeps
      // back at the top and forward at the bottom (forward through the downstroke, back through the
      // upstroke), and the leading edge turns down through the downstroke and up through the upstroke.
      // With these angles at least a third of the membrane area faces the side and the three-quarter
      // cameras in every frame of idle and fly (a Z-only beat dropped to 14% at the top of fly).
      const flap = (u: number, amp: number, lift: number): WingAngles => {
        const w = Math.sin(2 * Math.PI * u);
        const c = Math.cos(2 * Math.PI * u);
        return { raise: lift + amp * w, fwd: -15 - 20 * (0.966 * w + 0.259 * c), twist: -15 - 15 * (-0.766 * w + 0.643 * c) };
      };
      const mixWing = (a: WingAngles, b: WingAngles, t: number): WingAngles => ({
        raise: a.raise + (b.raise - a.raise) * t,
        fwd: a.fwd + (b.fwd - a.fwd) * t,
        twist: a.twist + (b.twist - a.twist) * t,
      });
      const IDLE_BEAT = { amp: 40, lift: 8 };
      const idleWing = (u: number) => flap(u, IDLE_BEAT.amp, IDLE_BEAT.lift);

      // Idle: hovering in place, the wings beating, the tail and legs trailing.
      k.animation('idle', {
        duration: 0.8,
        pose: (_t, p) => {
          return {
            hips: { ...hover(p, 2, 0.18, 0.025), rotate: [4, 0, 0] },
            head: { rotate: [2 * wave(p, 1, 0.3), 6 * wave(p, 1, 0.1), 0] },
            ...wings(idleWing(2 * p)),
            tail1: { rotate: [8 * wave(p, 1, 0.2), 10 * wave(p, 1, 0.1), 0] },
            tail2: { rotate: [10 * wave(p, 1, 0.35), 12 * wave(p, 1, 0.25), 0] },
            tail3: { rotate: [12 * wave(p, 1, 0.5), 14 * wave(p, 1, 0.4), 0] },
            'leg.L': { rotate: [8 + 6 * wave(p, 2, 0.4), 0, 0] },
            'leg.R': { rotate: [8 + 6 * wave(p, 2, 0.45), 0, 0] },
            'upperarm.L': { rotate: [-4 * wave(p, 2, 0.3), 0, 0] },
            'upperarm.R': { rotate: [-4 * wave(p, 2, 0.35), 0, 0] },
            orb: HIDE,
          };
        },
      });

      // Fly: leaning into forward flight, bigger and faster wing beats, the legs swept back.
      k.animation('fly', {
        duration: 0.5,
        pose: (_t, p) => {
          return {
            hips: { ...hover(p, 1, 0.22, 0.03), rotate: [26, 0, 3 * wave(p, 1, 0.1)] },
            head: { rotate: [-20, 0, 0] },
            ...wings(flap(p, 45, 5)),
            tail1: { rotate: [18 + 6 * wave(p, 1, 0.3), 0, 0] },
            tail2: { rotate: [8 + 10 * wave(p, 1, 0.45), 8 * wave(p, 1, 0.4), 0] },
            tail3: { rotate: [10 * wave(p, 1, 0.6), 12 * wave(p, 1, 0.55), 0] },
            'leg.L': { rotate: [34, 0, 0] },
            'leg.R': { rotate: [30, 0, 0] },
            'shin.L': { rotate: [20, 0, 0] },
            'shin.R': { rotate: [24, 0, 0] },
            'upperarm.L': { rotate: [-10, 0, 0] },
            'upperarm.R': { rotate: [-10, 0, 0] },
            orb: HIDE,
          };
        },
      });

      // Attack (0.8 s): a wind-up, a diving double claw rake, and a recovery.
      // 0 to 0.34: it rises and pulls back; the claws come up and back beside the head; the wings go up.
      // 0.34 to 0.71: the body drives 0.27 m forward and 0.15 m down; both claws reach forward toward
      //   the target and hold there at contact (0.44 to 0.59, 0.12 s), then rake down across it; the
      //   wings sweep down hard once, then fold back a little.
      // 0.6 to 1: two strong beats back to the hover (the last frame is the first idle frame).
      // The claw targets are wrist positions in the chest's rest frame; the chest leans with the dive.
      const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
      const ARM_R = { root: mx(SHOULDER), mid: mx(ELBOW), end: mx(WRIST) };
      const start = idleWing(0);
      k.animation('attack', {
        duration: 0.8,
        loop: false,
        pose: (_t, p) => {
          const wrist = keys(p, [
            [0, WRIST],
            [0.3, [0.2, 0.44, 0.0]], // up and back beside the head
            [0.36, [0.2, 0.46, 0.01]],
            [0.44, [0.11, 0.44, 0.15]], // reach forward at the target
            [0.59, [0.11, 0.43, 0.16]], // hold the reach at contact (0.12 s)
            [0.65, [0.1, 0.3, 0.13]], // rake down across it
            [0.71, [0.12, 0.24, 0.06]], // follow-through, low
            [0.9, WRIST],
            [1, WRIST],
          ]);
          const armL = reach(ARM_L, wrist, [0.45, 0.15, -0.2]);
          const armR = reach(ARM_R, mx(wrist), [-0.45, 0.15, -0.2]);
          const hand = keys(p, [[0, 0], [0.3, -25], [0.4, -20], [0.44, 10], [0.59, 12], [0.66, 35], [0.74, 20], [0.92, 0]]);
          const x = Math.max(0, (p - 0.6) / 0.4);
          const keyed: WingAngles = {
            raise: keys(p, [[0, start.raise], [0.3, 60], [0.36, 64], [0.46, -48], [0.6, -8]]),
            fwd: keys(p, [[0, start.fwd], [0.3, 5], [0.36, 5], [0.46, 15], [0.6, -20]]),
            twist: keys(p, [[0, start.twist], [0.3, 20], [0.36, 22], [0.46, -32], [0.6, -40]]),
          };
          const wing = mixWing(keyed, flap(2 * x, 58 - 18 * x, IDLE_BEAT.lift), ease(0.6, 0.68, p));
          const back = (a: number) => keys(p, [[0, a], [0.3, 0], [0.8, 0], [1, a]]); // idle values fade out and back
          return {
            hips: {
              move: keys(p, [
                [0, [0, 0.205, 0]],
                [0.3, [0, 0.27, -0.06]],
                [0.36, [0, 0.275, -0.065]],
                [0.44, [0, 0.15, 0.16]],
                [0.59, [0, 0.13, 0.2]],
                [0.66, [0, 0.12, 0.21]],
                [0.82, [0, 0.19, 0.08]],
                [1, [0, 0.205, 0]],
              ]),
              rotate: [keys(p, [[0, 4], [0.3, -16], [0.36, -18], [0.44, 28], [0.59, 32], [0.66, 34], [0.82, 12], [1, 4]]), 0, 0],
            },
            chest: { rotate: [keys(p, [[0, 0], [0.3, -8], [0.36, -9], [0.44, 10], [0.59, 12], [0.66, 14], [0.86, 0]]), 0, 0] },
            head: { rotate: [keys(p, [[0, 1.9], [0.3, 12], [0.44, -22], [0.59, -24], [0.66, -26], [0.86, -4], [1, 1.9]]), back(3.5), 0] },
            ...wings(wing),
            'upperarm.L': { rotate: armL.upper },
            'forearm.L': { rotate: armL.lower },
            'upperarm.R': { rotate: armR.upper },
            'forearm.R': { rotate: armR.lower },
            'hand.L': { rotate: [hand, 0, 0] },
            'hand.R': { rotate: [hand, 0, 0] },
            tail1: { rotate: [keys(p, [[0, 7.6], [0.3, -10], [0.46, 25], [0.66, 20], [1, 7.6]]), back(5.9), 0] },
            tail2: { rotate: [keys(p, [[0, 8.1], [0.3, -5], [0.46, 15], [0.68, 5], [1, 8.1]]), back(12), 0] },
            tail3: { rotate: [keys(p, [[0, 0], [0.3, -20], [0.46, 30], [0.68, -10], [0.86, 5], [1, 0]]), back(8.2), 0] },
            'leg.L': { rotate: [keys(p, [[0, 11.5], [0.3, -10], [0.46, 30], [0.66, 34], [0.86, 12], [1, 11.5]]), 0, 0] },
            'leg.R': { rotate: [keys(p, [[0, 9.9], [0.3, -12], [0.46, 28], [0.66, 32], [0.86, 10], [1, 9.9]]), 0, 0] },
            'shin.L': { rotate: [keys(p, [[0, 0], [0.3, 30], [0.46, 25], [0.66, 20], [1, 0]]), 0, 0] },
            'shin.R': { rotate: [keys(p, [[0, 0], [0.3, 34], [0.46, 22], [0.66, 18], [1, 0]]), 0, 0] },
            orb: HIDE,
          };
        },
      });

      // Hit: a jolt back in the hover with a yelp pose; the head snaps back, the wings fold in for a
      // moment, the arms fly out, and the tail whips; then the hover and the wing beat come back. The
      // last frame is the first idle frame.
      k.animation('hit', {
        duration: 0.4,
        loop: false,
        pose: (_t, p) => {
          const h = keys(p, [[0, 0], [0.14, 1], [0.38, 0.75], [1, 0]]);
          const free = 1 - h;
          const whip = (d: number, a: number) => a * keys(p, [[0, 0], [0.1 + d, 1], [0.3 + d, -0.6], [0.56 + d, 0.2], [1, 0]]);
          return {
            hips: { move: [0, 0.18 + 0.025 * wave(p, 1, 0.25) + 0.02 * h, -0.07 * h], rotate: [4 - 20 * h, 0, 6 * h] },
            chest: { rotate: [-8 * h, 0, 0] },
            head: { rotate: [2 * wave(p, 1, 0.3) - 24 * h, 6 * wave(p, 1, 0.1) * free, -8 * h] },
            ...wings(mixWing(idleWing(p), { raise: -30, fwd: -40, twist: 0 }, h)),
            tail1: { rotate: [8 * wave(p, 1, 0.2) + 20 * h, 10 * wave(p, 1, 0.1) + whip(0, 30), 0] },
            tail2: { rotate: [10 * wave(p, 1, 0.35) + 10 * h, 12 * wave(p, 1, 0.25) + whip(0.06, -40), 0] },
            tail3: { rotate: [12 * wave(p, 1, 0.5), 14 * wave(p, 1, 0.4) + whip(0.12, 50), 0] },
            'leg.L': { rotate: [8 + 6 * wave(p, 1, 0.4) - 18 * h, 0, 8 * h] },
            'leg.R': { rotate: [8 + 6 * wave(p, 1, 0.45) - 14 * h, 0, -8 * h] },
            'shin.L': { rotate: [30 * h, 0, 0] },
            'shin.R': { rotate: [26 * h, 0, 0] },
            'upperarm.L': { rotate: [-4 * wave(p, 1, 0.3) + 20 * h, 0, 70 * h] },
            'upperarm.R': { rotate: [-4 * wave(p, 1, 0.35) + 20 * h, 0, -70 * h] },
            'forearm.L': { rotate: [30 * h, 0, 30 * h] },
            'forearm.R': { rotate: [30 * h, 0, -30 * h] },
            orb: HIDE,
          };
        },
      });

      // Death: a jolt in the hover, the wings stop and crumple, it tumbles back and drops, lands with a
      // small bounce, and lies on its back: the wings limp on the floor, the arms flopped out to the
      // sides, the knees up, the head turned to one side, and the tail laid out with its tip curled.
      const HOVER0 = 0.205; // hips move y in the first idle frame
      const idle0 = wings(idleWing(0))['wing.L'].rotate; // the wing in the first idle frame
      const LIE = -0.16; // hips move y when it lies on its back (the build lifts it if it sinks)
      k.animation('death', {
        duration: 1.4,
        loop: false,
        pose: (_t, p) => {
          const f = Math.min(1, Math.max(0, (p - 0.12) / 0.34));
          const y =
            p < 0.12
              ? keys(p, [[0, HOVER0], [0.09, HOVER0 + 0.03], [0.12, HOVER0 + 0.03]])
              : p < 0.46
                ? HOVER0 + 0.03 + (LIE - HOVER0 - 0.03) * f * f // accelerates like a drop
                : keys(p, [[0.46, LIE], [0.56, LIE + 0.05], [0.66, LIE], [0.74, LIE + 0.01], [0.82, LIE]]);
          return {
            hips: {
              move: [0, y, keys(p, [[0, 0], [0.08, -0.06], [0.46, 0.06], [1, 0.08]])],
              rotate: [
                keys(p, [[0, 4], [0.08, -18], [0.16, -10], [0.46, -100], [0.56, -84], [0.66, -93], [1, -90]]),
                keys(p, [[0, 0], [0.46, 14], [1, 20]]),
                keys(p, [[0, 0], [0.1, 8], [0.3, -24], [0.46, 6], [0.6, -3], [0.75, 0]]),
              ],
            },
            chest: { rotate: [keys(p, [[0, 0], [0.08, -10], [0.3, 4], [0.5, 0]]), 0, 0] },
            orb: HIDE,
            head: {
              rotate: [
                keys(p, [[0, 1.9], [0.08, -30], [0.3, 6], [0.46, -12], [0.58, 22], [0.7, 12], [1, 15]]),
                keys(p, [[0, 3.5], [0.3, -10], [0.5, 10], [0.7, 32], [1, 30]]),
                keys(p, [[0, 0], [0.08, -10], [0.3, 8], [0.5, 0]]),
              ],
            },
            ...(['L', 'R'] as const).reduce((acc, side) => {
              const s = side === 'L' ? 1 : -1;
              acc[`wing.${side}`] = {
                rotate: [
                  keys(p, [[0, idle0[0]], [0.08, 0]]),
                  s * keys(p, [[0, idle0[1]], [0.08, 30], [0.3, 40], [0.46, 20], [0.56, -16], [0.66, -6], [1, -10]]),
                  s * keys(p, [[0, idle0[2]], [0.08, 50], [0.2, 20], [0.3, 60], [0.46, 40], [0.56, -34], [0.66, -20], [1, -28]]),
                ],
              };
              acc[`upperarm.${side}`] = {
                rotate: [
                  keys(p, [[0, 2.4], [0.08, 10], [0.3, -25], [0.46, 0], [0.58, 60], [0.7, 45], [1, 50]]),
                  0,
                  s * keys(p, [[0, 0], [0.08, 70], [0.3, 65], [0.46, 45], [0.58, 55], [1, 50]]),
                ],
              };
              acc[`forearm.${side}`] = { rotate: [keys(p, [[0, 0], [0.08, 30], [0.3, 10], [0.5, 40], [0.62, 75], [1, 70]]), 0, s * keys(p, [[0, 0], [0.08, 30], [0.3, 20], [0.5, 0]])] };
              return acc;
            }, {} as Record<string, { rotate: [number, number, number] }>),
            'leg.L': { rotate: [keys(p, [[0, 11.5], [0.08, -20], [0.3, 10], [0.46, -10], [0.58, -45], [0.7, -32], [1, -38]]), 0, keys(p, [[0, 0], [0.5, 12], [1, 14]])] },
            'leg.R': { rotate: [keys(p, [[0, 9.9], [0.08, -16], [0.3, 14], [0.46, -6], [0.6, -38], [0.72, -26], [1, -30]]), 0, keys(p, [[0, 0], [0.5, -10], [1, -12]])] },
            'shin.L': { rotate: [keys(p, [[0, 0], [0.08, 30], [0.3, 10], [0.5, 40], [0.6, 80], [1, 72]]), 0, 0] },
            'shin.R': { rotate: [keys(p, [[0, 0], [0.08, 26], [0.3, 14], [0.5, 36], [0.62, 70], [1, 64]]), 0, 0] },
            tail1: {
              rotate: [
                keys(p, [[0, 7.6], [0.08, 30], [0.3, 20], [0.46, -20], [0.6, -50], [1, -45]]),
                keys(p, [[0, 5.9], [0.08, 25], [0.2, -20], [0.34, 15], [0.5, 0]]),
                keys(p, [[0, 0], [0.4, 0], [0.62, -40], [1, -35]]),
              ],
            },
            tail2: {
              rotate: [
                keys(p, [[0, 8.1], [0.1, 25], [0.3, 10], [0.46, -30], [0.62, -62], [1, -57]]),
                keys(p, [[0, 12], [0.12, -30], [0.24, 25], [0.38, -15], [0.55, 0]]),
                0,
              ],
            },
            tail3: {
              rotate: [
                keys(p, [[0, 0], [0.12, 20], [0.3, -10], [0.46, 40], [0.66, 118], [0.8, 104], [1, 110]]),
                keys(p, [[0, 8.2], [0.16, 40], [0.28, -35], [0.42, 20], [0.6, 0]]),
                0,
              ],
            },
          };
        },
      });
      // Cast (1.2 s): a thrown fireball. The wings beat at the idle rate the whole time (three beats,
      // a little stronger through the throw), and the hover bob keeps running.
      // 0 to 0.42 (gather): it rises 4.5 cm and draws back, leaning back; both hands come together in
      //   front of the chest, palms turned in, and the fireball grows between them from nothing.
      // 0.42 to 0.55 (throw): it pulls the ball back to the chest, then lunges 13 cm forward and down
      //   on the downstroke, and both hands push the ball out at chest height, the arms straight.
      // 0.55 to 0.72: the ball flies 1 m forward to a target in front at chest height in 0.2 s,
      //   stretched along its path, then shrinks away.
      // 0.55 to 1 (recovery): it settles back to the hover (the last frame is the first idle frame).
      // Wrist targets and the ball's path before the release are in the hips' rest frame (the spine
      // and the chest stay still); the flight is a straight world path, converted to that frame.
      const rotX = (v: V3, deg: number): V3 => {
        const a = (deg * Math.PI) / 180;
        return [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)];
      };
      const castHips = (p: number) => ({
        move: [
          0,
          0.18 + 0.025 * wave(p, 3, 0.25) + keys(p, [[0, 0], [0.2, 0.025], [0.42, 0.045], [0.48, 0.05], [0.55, -0.005], [0.64, -0.015], [0.82, 0], [1, 0]]),
          keys(p, [[0, 0], [0.2, -0.03], [0.42, -0.05], [0.48, -0.06], [0.55, 0.07], [0.64, 0.09], [0.82, 0.03], [1, 0]]),
        ] as V3,
        rx: keys(p, [[0, 4], [0.2, -2], [0.42, -10], [0.48, -14], [0.55, 20], [0.64, 24], [0.82, 10], [1, 4]]),
      });
      type HipsPose = ReturnType<typeof castHips>;
      const hipsToWorld = (v: V3, h: HipsPose): V3 => {
        const r = rotX([v[0] - HIPS_AT[0], v[1] - HIPS_AT[1], v[2] - HIPS_AT[2]], h.rx);
        return [HIPS_AT[0] + h.move[0] + r[0], HIPS_AT[1] + h.move[1] + r[1], HIPS_AT[2] + h.move[2] + r[2]];
      };
      const worldToHips = (w: V3, h: HipsPose): V3 => {
        const r = rotX([w[0] - HIPS_AT[0] - h.move[0], w[1] - HIPS_AT[1] - h.move[1], w[2] - HIPS_AT[2] - h.move[2]], -h.rx);
        return [HIPS_AT[0] + r[0], HIPS_AT[1] + r[1], HIPS_AT[2] + r[2]];
      };
      const castWrist = (p: number): V3 =>
        keys(p, [
          [0, WRIST],
          [0.2, [0.064, 0.32, 0.13]], // hands together in front of the chest
          [0.42, [0.064, 0.325, 0.125]],
          [0.48, [0.066, 0.34, 0.105]], // the ball pulled back to the chest
          [0.55, [0.045, 0.37, 0.165]], // pushed out at chest height, the arms straight
          [0.64, [0.05, 0.36, 0.16]],
          [0.86, WRIST],
          [1, WRIST],
        ]);
      const ballAt = (w: V3): V3 => [0, w[1] + 0.004, w[2] + 0.05]; // between the palms, in front of the claws
      const RELEASE = 0.55;
      const FLIGHT = 0.2 / 1.2; // 0.2 s
      const TARGET: V3 = [0, 0.5, 1.3]; // chest height in the hover, about 1 m in front of the release
      const launch = hipsToWorld(ballAt(castWrist(RELEASE)), castHips(RELEASE));
      k.animation('cast', {
        duration: 1.2,
        loop: false,
        pose: (_t, p) => {
          const h = castHips(p);
          const w = castWrist(p);
          const armL = reach(ARM_L, w, [0.45, 0.15, -0.2]);
          const armR = reach(ARM_R, mx(w), [-0.45, 0.15, -0.2]);
          const back = (a: number) => keys(p, [[0, a], [0.2, 0], [0.86, 0], [1, a]]); // idle values fade out and back
          const cup = keys(p, [[0, 0], [0.2, 30], [0.48, 30], [0.55, 15], [0.66, 10], [0.9, 0]]);
          const push = keys(p, [[0, 0], [0.42, 0], [0.48, 10], [0.55, -30], [0.64, -20], [0.86, 0]]);
          const beat = keys(p, [[0, 0], [0.4, 0], [0.5, 1], [0.66, 1], [0.85, 0]]);
          // The fireball: it grows between the palms, then flies a straight world path and is gone.
          let orb: { move: V3; rotate?: V3; scale: V3 };
          if (p < RELEASE) {
            const g = keys(p, [[0.12, 0.001], [0.4, 1], [0.44, 0.92], [0.48, 1.05], [0.55, 1.1]]);
            const b = ballAt(w);
            orb = { move: [b[0] - ORB_AT[0], b[1] - ORB_AT[1], b[2] - ORB_AT[2]], scale: [g, g, g] };
          } else {
            const f = Math.min(1, (p - RELEASE) / FLIGHT);
            const at = worldToHips(lerp(launch, TARGET, 1 - (1 - f) ** 1.4), h);
            const g = f < 1 ? keys(f, [[0, 1.1], [0.2, 1], [0.8, 1], [1, 0.001]]) : 0.001;
            const st = keys(f, [[0, 1], [0.15, 1.4], [0.8, 1.4], [1, 1]]); // stretched along the path
            orb = { move: [at[0] - ORB_AT[0], at[1] - ORB_AT[1], at[2] - ORB_AT[2]], rotate: [-h.rx, 0, 0], scale: [g * 0.9, g * 0.9, g * st] };
          }
          return {
            hips: { move: h.move, rotate: [h.rx, 0, 0] },
            head: { rotate: [keys(p, [[0, 1.9], [0.2, 10], [0.42, 12], [0.48, 8], [0.55, -14], [0.64, -16], [0.86, -2], [1, 1.9]]), back(3.5), 0] },
            ...wings(flap(3 * p, IDLE_BEAT.amp + 14 * beat, IDLE_BEAT.lift + 6 * beat)),
            'upperarm.L': { rotate: [armL.upper[0] + back(-3.8), armL.upper[1], armL.upper[2]] as V3 },
            'forearm.L': { rotate: armL.lower },
            'upperarm.R': { rotate: [armR.upper[0] + back(-3.2), armR.upper[1], armR.upper[2]] as V3 },
            'forearm.R': { rotate: armR.lower },
            'hand.L': { rotate: [push, 0, -cup] },
            'hand.R': { rotate: [push, 0, cup] },
            orb,
            tail1: { rotate: [keys(p, [[0, 7.6], [0.45, -8], [0.56, 22], [0.7, 15], [1, 7.6]]), back(5.9), 0] },
            tail2: { rotate: [keys(p, [[0, 8.1], [0.45, -4], [0.58, 14], [0.72, 4], [1, 8.1]]), back(12), 0] },
            tail3: { rotate: [keys(p, [[0, 0], [0.45, -18], [0.58, 26], [0.74, -8], [0.88, 4], [1, 0]]), back(8.2), 0] },
            'leg.L': { rotate: [keys(p, [[0, 11.5], [0.2, 4], [0.45, -6], [0.55, 24], [0.66, 28], [0.86, 12], [1, 11.5]]), 0, 0] },
            'leg.R': { rotate: [keys(p, [[0, 9.9], [0.2, 2], [0.45, -8], [0.55, 20], [0.66, 26], [0.86, 10], [1, 9.9]]), 0, 0] },
            'shin.L': { rotate: [keys(p, [[0, 0], [0.3, 18], [0.48, 26], [0.56, 12], [0.7, 20], [1, 0]]), 0, 0] },
            'shin.R': { rotate: [keys(p, [[0, 0], [0.3, 22], [0.48, 30], [0.56, 14], [0.7, 16], [1, 0]]), 0, 0] },
          };
        },
      });
    },
  });
}
