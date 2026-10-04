import { defineAsset, motion, noise, profile, sdf } from '../../src/index.js';
import type { AnimationDef, AssetContext, AssetDefinition, BonePose } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

/**
 * Wolf kinds — the dire wolf of `assets/dire-wolf.ts` (catalog `monsters/beast/dire-wolf`) and its
 * beast kinds (the shadow hound, the displacer beast). One body, head, rig, and clip set; each kind
 * sets the palette and the slots, may scale the ears and make the eyes glow, and may add bodies on
 * their own bones (smoke, tentacles) with a pose in every clip. The design notes of the body, the
 * rig, and the clips are in `assets/dire-wolf.ts`.
 */

const WOLF_COLORS = {
  fur: '#4a5058',
  furLight: '#6b737d', // the chest and the lower cheeks
  furDark: '#363b42',
  cream: '#ece2c0',
  earInner: '#c49a7a',
  nose: '#1a1a1c',
  mouth: '#2a2426',
  tongue: '#b8505e',
  eye: '#f0a020',
  eyeRim: '#b0500c',
  pupil: '#141012',
  tooth: '#fbf7ee',
  claw: '#2a2a2e',
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');

// Joint positions (rest pose). Short, thick legs keep the body low under the big head.
const SHOULDER: V3 = [0.1, 0.24, 0.07];
const FKNEE: V3 = [0.105, 0.12, 0.08];
const HIP: V3 = [0.1, 0.24, -0.2];
const BKNEE: V3 = [0.105, 0.12, -0.22];
const HEAD_C: V3 = [0, 0.5, 0.17];
const JAW_AT: V3 = [0, 0.41, 0.2]; // the jaw hinge, behind the grin corners
// The grin line: the bottom arc of a circle (226 to 314 degrees). It paints the grin, and it is
// also the line where the lower jaw separates from the head.
const GRIN_R = 0.16;
const GRIN_Y = 0.39;
const GRIN_CORNER_Y = GRIN_Y + GRIN_R * (1 - Math.sin((46 * Math.PI) / 180));
const grinY = (x: number) => GRIN_Y + GRIN_R - Math.sqrt(GRIN_R * GRIN_R - x * x);

/** A wolf kind: the slots, fixed colors, the ears and eyes, and extra bodies on their own bones. */
export interface WolfKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `fur`, `markings`, and `eyes` (and one more if a kind needs it); the first option of each is the default. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  /** Fixed colors and the default shades of the slots (furLight, furDark, eyeRim, earInner, ...). */
  readonly colors?: Partial<typeof WOLF_COLORS>;
  /** The size of the ears as a share of the dire wolf's. */
  readonly earScale?: number;
  /** The eyes glow in the eye slot color at this strength. */
  readonly eyeGlow?: number;
  /** The heavy cream brows (on by default). */
  readonly brows?: boolean;
  /** The cream forelock on the crown (on by default). */
  readonly forelock?: boolean;
  /** A thin closed smile in place of the toothy grin (no upper teeth). */
  readonly smile?: boolean;
  /** The pointed cheek tufts (on by default). */
  readonly cheekTufts?: boolean;
  /** The chest: 'spiky' cream ruff points (default) or a 'smooth' cream bib (a dog, a cat). */
  readonly ruff?: 'spiky' | 'smooth';
  /** False for no pointed ears (the kind builds its own ears on the `head` bone in `extra`). */
  readonly ears?: boolean;
  /** The size of the painted eyes (default 1; a cat's big eyes 1.35). */
  readonly eyeScale?: number;
  /** The size of the pupils inside the painted eyes (default 1; a cat's big pupils 1.7). */
  readonly pupilScale?: number;
  /** The mouth line from and to these angles on the grin circle (default 226 to 314; a cat's small mouth 252 to 288). */
  readonly smileArc?: readonly [number, number];
  /** The size of the nose (default 1). */
  readonly noseScale?: number;
  /** The claws (on by default). */
  readonly claws?: boolean;
  /** False for no bushy tail (the kind builds its own tail on the `tail` bone in `extra`). */
  readonly tail?: boolean;
  /** Paint on the fur (ear tips, markings), with the slot colors. */
  paint?(fur: sdf.Shape, tint: WolfShape['tint'], tone: WolfShape['tone']): sdf.Shape;
  /** Extra bones (a tentacle on `spine`, a smoke plume on `hips`). */
  readonly bones?: Record<string, { parent: string; at: V3; tail?: V3 }>;
  /** Extra bodies (smoke, tentacles), rigid on a bone or tagged to bones. */
  extra?(k: AssetContext, wolf: WolfShape): void;
  /** Poses of the extra bones in a clip (`idle`, `walk`, `run`, `attack`, `hit`, `death`, `howl`). */
  pose?(clip: string, p: number): Record<string, BonePose>;
}

/** The wolf's shapes and slot colors that a kind builds on. */
export interface WolfShape {
  /** The body without the legs: chest, rump, neck, and head. */
  readonly trunk: sdf.Shape;
  /** The head with the muzzle (no ears or tufts). */
  readonly head: sdf.Shape;
  /** The point where a ray from the front (+Z) meets the head at (x, y). */
  faceHit(x: number, y: number): readonly [number, number, number];
  /** The center of the left eye on the face. */
  readonly eye: V3;
  /** The point on `shape` nearest to (x, y, z), moved out along the normal by `lift`. */
  on(shape: sdf.Shape, x: number, y: number, z: number, lift?: number): V3;
  readonly tint: { readonly fur: string; readonly furDark: string; readonly markings: string; readonly eye: string };
  /** A fixed default color that follows a slot (`k.tint(slot, { color, follow })`). */
  tone(slot: string, color: string, follow?: number): string;
}

export function wolfAsset(kind: WolfKind): AssetDefinition {
  const C = { ...WOLF_COLORS, ...kind.colors };
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
        fur: k.tint('fur'),
        furLight: k.tint('fur', { color: C.furLight, follow: 1 }),
        furDark: k.tint('fur', { color: C.furDark, follow: 1 }),
        cream: k.tint('markings'),
        eye: k.tint('eyes'),
        eyeRim: k.tint('eyes', { color: C.eyeRim, follow: 1 }),
      };
      k.skeleton({
        hips: { at: [0, 0.27, -0.17] },
        spine: { parent: 'hips', at: [0, 0.29, 0.0] },
        neck: { parent: 'spine', at: [0, 0.34, 0.1] },
        head: { parent: 'neck', at: [0, 0.4, 0.14] },
        jaw: { parent: 'head', at: JAW_AT, tail: [0, 0.385, 0.36] },
        tail: { parent: 'hips', at: [0, 0.32, -0.3], tail: [0.06, 0.5, -0.42] },
        'fleg.L': { parent: 'spine', at: SHOULDER },
        'fshin.L': { parent: 'fleg.L', at: FKNEE },
        'fleg.R': { parent: 'spine', at: [-SHOULDER[0], SHOULDER[1], SHOULDER[2]] },
        'fshin.R': { parent: 'fleg.R', at: [-FKNEE[0], FKNEE[1], FKNEE[2]] },
        'bleg.L': { parent: 'hips', at: HIP },
        'bshin.L': { parent: 'bleg.L', at: BKNEE },
        'bleg.R': { parent: 'hips', at: [-HIP[0], HIP[1], HIP[2]] },
        'bshin.R': { parent: 'bleg.R', at: [-BKNEE[0], BKNEE[1], BKNEE[2]] },
        ...kind.bones,
      });

      // ------------------------------------------------------------------ body
      const chest = sdf.ellipsoid([0.15, 0.15, 0.16]).at(0, 0.29, 0.03);
      const rump = sdf.ellipsoid([0.13, 0.13, 0.14]).at(0, 0.26, -0.18);
      const neck = sdf.ellipsoid([0.12, 0.12, 0.09]).at(0, 0.37, 0.08);

      // ------------------------------------------------------------------ head
      const skull = sdf.smoothUnion(
        0.06,
        sdf.ellipsoid([0.2, 0.175, 0.17]).at(...HEAD_C),
        pair(sdf.sphere(0.09).at(0.1, 0.44, 0.22)), // cheeks
      );
      const MUZZLE: V3 = [0, 0.43, 0.3];
      const muzzle = sdf.smoothUnion(
        0.03,
        sdf.ellipsoid([0.14, 0.075, 0.085]).at(...MUZZLE),
        sdf.ellipsoid([0.06, 0.04, 0.06]).at(0, 0.47, 0.3), // the bridge up to the brows
      );
      const headBase = sdf.smoothUnion(0.03, skull, muzzle);
      // The outer bound of the lower jaw (see jawZone below).
      const JAW_BOUND = sdf.ellipsoid([0.15, 0.12, 0.2]).at(0, 0.39, 0.33);
      // The cream muzzle spreads out over the cheeks to a wide grin: the muzzle plus the head
      // surface inside a patch on each side that rises outward, below the eyes. Below the grin
      // corners the patch stays inside the jaw bound, so no cream crosses the side of the jaw cut.
      const cheekPatch = pair(sdf.ellipsoid([0.07, 0.035, 0.09]).rotateZ(25).at(0.12, 0.44, 0.26));
      const besideJaw = sdf.halfSpace([0, 1, 0], GRIN_CORNER_Y).subtract(JAW_BOUND.round(-0.006));
      const muzzleWide = sdf.union(muzzle, headBase.smoothIntersect(0.01, cheekPatch).subtract(besideJaw));
      const faceHit = (x: number, y: number) => sdf.raycast(headBase, [x, y, 2], [0, 0, -1])!;

      // Pointed cheek tufts, two on each side, flattened front to back.
      const tuft = (from: V3, to: V3, r: number) => sdf.cone(from, to, r, 0.004).scale([1, 1, 0.55]);
      const cheekTufts = pair(
        sdf.smoothUnion(
          0.02,
          tuft([0.14, 0.5, 0.18], [0.29, 0.52, 0.2], 0.06),
          tuft([0.13, 0.43, 0.2], [0.26, 0.38, 0.22], 0.055),
        ),
      );
      // Tall pointed ears, cupped toward the front.
      const earPose = (s: sdf.Shape) => (kind.earScale ? s.scale(kind.earScale) : s).rotateZ(-14).rotateX(-6).at(0.105, 0.62, 0.14);
      const earLocal = sdf
        .cone([0, 0, 0], [0, 0.17, 0], 0.07, 0.008)
        .scale([1, 1, 0.45])
        .smoothSubtract(0.006, sdf.cone([0, 0.02, 0.02], [0, 0.15, 0.02], 0.05, 0.004).scale([1, 1, 0.55]));
      const earCup = sdf.cone([0, 0.02, 0.03], [0, 0.15, 0.03], 0.052, 0.005).scale([1, 1, 0.8]);
      const ears = pair(earPose(earLocal.paintWhere(earCup, C.earInner, 0.006)));

      // ------------------------------------------------------------------ legs, paws, tail
      const leg = (hip: V3, knee: V3, upper: string, lower: string) =>
        sdf.smoothUnion(
          0.03,
          sdf.cone(hip, knee, 0.07, 0.056).bone(upper),
          sdf.cone(knee, [knee[0], 0.05, knee[2] + 0.02], 0.056, 0.05).bone(lower),
        );
      const legs = sdf.union(pair(leg(SHOULDER, FKNEE, 'fleg.L', 'fshin.L')), pair(leg(HIP, BKNEE, 'bleg.L', 'bshin.L')));
      // Big round paws with three toe pads at the front.
      const pawLocal = sdf
        .smoothUnion(
          0.015,
          sdf.ellipsoid([0.058, 0.04, 0.07]).at(0, 0.036, 0.02),
          ...[-0.03, 0, 0.03].map((x) => sdf.sphere(0.024).at(x, 0.026, 0.075 - Math.abs(x) * 0.4)),
        )
        .intersect(sdf.halfSpace([0, -1, 0], 0));
      const paw = (knee: V3, bone: string) => pawLocal.at(knee[0], 0, knee[2] + 0.02).bone(bone);
      const paws = sdf.union(pair(paw(FKNEE, 'fshin.L')), pair(paw(BKNEE, 'bshin.L')));
      // A big bushy tail that curls up, flat-sided, with a cream tip.
      const TAIL_TIP: V3 = [0.09, 0.56, -0.44];
      const tailShape = sdf
        .chain(
          [
            [0, 0.31, -0.28, 0.04],
            [0.02, 0.36, -0.38, 0.07],
            [0.05, 0.45, -0.43, 0.078],
            [TAIL_TIP[0], TAIL_TIP[1], TAIL_TIP[2], 0.012],
          ],
          0.03,
        )
        .scale([0.8, 1, 1]);

      // ------------------------------------------------------------------ fur body
      const trunk = sdf.smoothUnion(0.07, chest.bone('spine'), rump.bone('hips'), neck.bone('neck'), headBase.bone('head'));
      const eyeC = (x: number): V3 => {
        const h = faceHit(x, 0.53);
        return [h[0], h[1], h[2]];
      };
      const EYE_X = 0.078;
      const eL = eyeC(EYE_X);
      const ES = kind.eyeScale ?? 1;
      const PS = ES * (kind.pupilScale ?? 1);
      // Larger eyes keep their paint near the eye (the long cylinders would also reach the bridge).
      const nearEye = (s: sdf.Shape) => (ES === 1 ? s : s.intersect(pair(sdf.sphere(0.06 * ES).at(...eL))));
      const eyeRing = nearEye(pair(sdf.cylinder(0.037 * ES, 1).rotateX(90).at(eL[0], eL[1], 0)));
      const eye = nearEye(pair(sdf.cylinder(0.031 * ES, 1).rotateX(90).at(eL[0], eL[1], 0)));
      const pupil = pair(sdf.cylinder(0.014 * PS, 1).rotateX(90).at(eL[0] - 0.004 * ES, eL[1] - 0.002 * ES, 0));
      const shine = pair(sdf.sphere(0.008 * ES).at(eL[0] + 0.01 * ES, eL[1] + 0.012 * ES, eL[2]));
      const furLegs = trunk.smoothUnion(0.03, legs).smoothUnion(0.02, paws);
      const furLower = (kind.tail === false ? furLegs : furLegs.smoothUnion(0.02, tailShape.bone('tail')))
        .smoothUnion(0.015, ...(kind.cheekTufts === false ? [] : [cheekTufts.bone('head')]), ...(kind.ears === false ? [] : [ears.bone('head')]))
        // Lighter fur on the lower cheeks (below the eyes, so the dark face keeps the eye contrast)
        // and on the chest under the ruff.
        .paintWhere(pair(sdf.ellipsoid([0.12, 0.09, 0.13]).at(0.17, 0.4, 0.19)).intersect(sdf.halfSpace([0, 1, 0], 0.47)), T.furLight, 0.03)
        .paintWhere(sdf.ellipsoid([0.13, 0.14, 0.1]).at(0, 0.22, 0.17), T.furLight, 0.04)
        .paintWhere(sdf.union(legs, paws).intersect(sdf.halfSpace([0, 1, 0], 0.16)), T.furDark, 0.04);
      const furTip = kind.tail === false ? furLower : furLower.paintWhere(sdf.sphere(0.12).at(...TAIL_TIP).intersect(sdf.halfSpace([-0.3, -0.6, 0.74], -0.55)), T.cream, 0.02);
      const furBase = furTip
        .paintWhere(eyeRing.intersect(sdf.halfSpace([0, 0, -1], -0.2)), T.eyeRim, 0.002)
        .paintWhere(eye.intersect(sdf.halfSpace([0, 0, -1], -0.2)), T.eye, 0.002)
        .paintWhere(pupil.intersect(sdf.halfSpace([0, 0, -1], -0.2)), C.pupil, 0.002)
        .paintWhere(shine, '#ffffff', 0.002);
      const tint = { fur: T.fur, furDark: T.furDark, markings: T.cream, eye: T.eye };
      const fur = kind.paint ? kind.paint(furBase, tint, (slot, color, follow = 1) => k.tint(slot, { color, follow })) : furBase;
      // The lower jaw zone: below the grin circle and below the grin corners, inside a rounded
      // bound that keeps the outer cheeks and the cheek tufts on the head. The head keeps the rest;
      // the jaw pieces are rigid on `jaw` and reach 3 mm into the head, so no seam groove shows.
      // The cut faces (the roof of the mouth and the top of the jaw) are dark, but not the skin.
      const jawZone = JAW_BOUND.intersect(sdf.halfSpace([0, 1, 0], GRIN_CORNER_Y))
        .subtract(sdf.cylinder(GRIN_R, 0.6).rotateX(90).at(0, GRIN_Y + GRIN_R, 0.3));
      const jawPart = jawZone.round(0.003);
      const roofPaint = (inside: sdf.Shape) => jawPart.intersect(inside);
      const jawTopPaint = (inside: sdf.Shape) => inside.subtract(jawZone.round(-0.003));
      const furLook = { color: T.fur, roughness: 0.85, textureDensity: 1.5, bump: (x: number, y: number, z: number) => 0.0008 * noise.fbm(x * 60, y * 25, z * 60, 2) };
      k.body('fur', fur.subtract(jawZone).paintWhere(roofPaint(headBase.round(-0.004)), C.mouth, 0.002), furLook);
      k.body('jawFur', fur.intersect(jawPart).paintWhere(jawTopPaint(headBase.round(-0.004)), C.mouth, 0.002), { ...furLook, bone: 'jaw' });
      // The dark mouth inside the head (seen when the jaw opens), and the tongue on the jaw. Both
      // stay inside the closed head.
      const inHead = headBase.round(-0.006);
      k.body('mouth', sdf.ellipsoid([0.085, 0.045, 0.08]).at(0, 0.385, 0.24).intersect(inHead).bone('head'), {
        color: C.mouth,
        roughness: 0.6,
      });
      k.body('tongue', sdf.ellipsoid([0.05, 0.014, 0.075]).at(0, 0.384, 0.29).intersect(inHead), {
        color: C.tongue,
        roughness: 0.35,
        bone: 'jaw',
      });

      // ------------------------------------------------------------------ cream: muzzle, brows, forelock, ruff
      // The grin: a dark band on the muzzle that curves up at the corners. The lower half of the
      // band goes with the lower jaw.
      const [ARC_FROM, ARC_TO] = kind.smileArc ?? [226, 314];
      const grin = sdf.extrude(profile.arc(GRIN_R, kind.smile ? 0.011 : 0.028, ARC_FROM, ARC_TO), 0.4).at(0, GRIN_Y + GRIN_R, 0.3);
      const muzzleCream = muzzleWide.round(0.004).paintWhere(grin, C.mouth, 0.002);
      k.body('jawCream', muzzleCream.intersect(jawPart).paintWhere(jawTopPaint(muzzleWide), C.mouth, 0.002), {
        color: T.cream,
        roughness: 0.8,
        textureDensity: 1.5,
        bone: 'jaw',
      });
      const browAt = (x: number, y: number): V3 => {
        const h = faceHit(x, y);
        return [h[0], h[1], h[2] - 0.008];
      };
      const brows = pair(
        sdf.chain(
          [
            [...browAt(0.15, 0.6), 0.018],
            [...browAt(0.1, 0.59), 0.022],
            [...browAt(0.05, 0.565), 0.022],
            [...browAt(0.03, 0.545), 0.018],
          ],
          0.01,
        ),
      );
      const top = sdf.raycast(skull, [0, 2, 0.16], [0, -1, 0])!;
      const forelock = sdf.chain(
        [
          [top[0], top[1] - 0.02, top[2] + 0.02, 0.036],
          [top[0] + 0.01, top[1] + 0.04, top[2] + 0.0, 0.03],
          [top[0] + 0.035, top[1] + 0.07, top[2] - 0.04, 0.008],
        ],
        0.012,
      );
      // The ruff: pointed tufts around the front of the neck, longest at the chest.
      const ruffRow = (n: number, y: number, spread: number, reach: number, lenMax: number, r: number) =>
        Array.from({ length: n }, (_, i) => {
          const u = (i - (n - 1) / 2) / ((n - 1) / 2);
          const a = u * spread * (Math.PI / 180);
          const len = lenMax * (1 - 0.35 * Math.abs(u));
          const from: V3 = [Math.sin(a) * 0.11, y, 0.12 + Math.cos(a) * 0.08];
          const to: V3 = [Math.sin(a) * (0.13 + len * 0.6), y - len, 0.15 + Math.cos(a) * reach];
          return sdf.cone(from, to, r, 0.004);
        });
      const ruff =
        kind.ruff === 'smooth'
          ? sdf.ellipsoid([0.115, 0.12, 0.075]).at(0, 0.31, 0.15)
          : sdf.smoothUnion(
              0.025,
              sdf.ellipsoid([0.12, 0.1, 0.07]).at(0, 0.33, 0.14), // the cream chest
              ...ruffRow(9, 0.39, 95, 0.13, 0.13, 0.05),
              ...ruffRow(6, 0.31, 55, 0.13, 0.12, 0.042),
            );
      const muzzleTop = muzzleCream.subtract(jawZone).paintWhere(roofPaint(muzzleWide), C.mouth, 0.002);
      const cream = sdf.union(
        muzzleTop.bone('head'),
        ...(kind.brows === false ? [] : [brows.bone('head')]),
        ...(kind.forelock === false ? [] : [forelock.bone('head')]),
        ruff.bone('neck'),
      );
      k.body('cream', cream, { color: T.cream, roughness: 0.8, textureDensity: 1.5 });

      // ------------------------------------------------------------------ nose, teeth, claws
      const noseAt = faceHit(0, 0.465);
      const NS = kind.noseScale ?? 1;
      k.body('nose', sdf.ellipsoid([0.05 * NS, 0.034 * NS, 0.036 * NS]).at(noseAt[0], noseAt[1], noseAt[2] - 0.004).bone('head'), {
        color: C.nose,
        roughness: 0.25,
      });
      // Small square teeth along the top of the grin, and a fang at each corner.
      const teeth = sdf.union(
        ...[-0.06, -0.02, 0.02, 0.06].map((x) => {
          const y = GRIN_Y + GRIN_R - Math.sqrt(GRIN_R * GRIN_R - x * x) + 0.008;
          const h = faceHit(x, y);
          return sdf.box([0.02, 0.018, 0.014], 0.005).at(h[0], h[1], h[2] - 0.002);
        }),
        ...[-0.092, 0.092].map((x) => {
          const y = GRIN_Y + GRIN_R - Math.sqrt(GRIN_R * GRIN_R - x * x) + 0.01;
          const h = faceHit(x, y);
          return sdf.cone([h[0], h[1] + 0.004, h[2] - 0.004], [h[0], h[1] - 0.022, h[2] + 0.002], 0.011, 0.003);
        }),
      );
      if (!kind.smile) k.body('teeth', teeth.bone('head'), { color: C.tooth, roughness: 0.3, detail: 0.003 });
      // Two lower fangs on the jaw, 5 mm behind the lip: hidden in the closed grin, they stand up
      // from the jaw when it opens.
      const lowerFangs = sdf.union(
        ...[-0.072, 0.072].map((x) => {
          const y = grinY(x);
          const h = faceHit(x, y - 0.004);
          return sdf.cone([h[0], y - 0.012, h[2] - 0.008], [h[0], y + 0.014, h[2] - 0.006], 0.009, 0.0025);
        }),
      );
      k.body('jawTeeth', lowerFangs, { color: C.tooth, roughness: 0.3, detail: 0.003, bone: 'jaw' });
      const claws = sdf.union(
        ...[FKNEE, BKNEE].flatMap((kn, j) =>
          [-0.03, 0, 0.03].map((x) =>
            sdf
              .cone([kn[0] + x, 0.02, kn[2] + 0.02 + 0.085 - Math.abs(x) * 0.4], [kn[0] + x, 0.004, kn[2] + 0.02 + 0.11 - Math.abs(x) * 0.4], 0.01, 0.003)
              .bone(j === 0 ? 'fshin.L' : 'bshin.L'),
          ),
        ),
      );
      if (kind.claws !== false) k.body('claws', pair(claws), { color: C.claw, roughness: 0.4, detail: 0.003 });

      // Glowing eyes: a thin skin over the painted eye discs (without the pupils) that glows.
      if (kind.eyeGlow) {
        const front = sdf.halfSpace([0, 0, -1], -0.2);
        const glow = headBase.round(0.0015).intersect(eye.intersect(front)).subtract(pupil.round(0.002));
        k.body('eye-glow', glow.bone('head'), { color: T.eye, roughness: 0.3, emissive: T.eye, emissiveIntensity: kind.eyeGlow, detail: 0.003 });
      }
      const wolf: WolfShape = {
        trunk,
        head: headBase,
        faceHit,
        eye: eL,
        on: (shape, x, y, z, lift = 0) => sdf.surfacePoint(shape, [x, y, z], lift) as V3,
        tint,
        tone: (slot, color, follow = 1) => k.tint(slot, { color, follow }),
      };
      kind.extra?.(k, wolf);

      // ------------------------------------------------------------------ animation
      const { wave, bump, keys } = motion;
      // Every clip also poses the kind's extra bones.
      const clip = (name: string, def: AnimationDef) =>
        k.animation(name, kind.pose ? { ...def, pose: (t, p) => ({ ...def.pose(t, p), ...kind.pose!(name, p) }) } : def);

      // Ground contact. The paws and the claws are rigid on the shins, and the claws sit far in
      // front of the knee, so a shin that turns back (+X) swings the claw tips down into the floor.
      // A planted paw stays flat: its shin cancels the turn of the upper leg (and of the spine for a
      // front leg). motion.plant then sets the hips height from these chains, so the lowest point of
      // the paws (claw tips, toe pads, pad, heel) rests on the ground.
      type Rot = readonly [number, number, number];
      type Pose = Record<string, { rotate?: Rot; move?: Rot; scale?: Rot }>;
      const mx = (v: V3): V3 => [-v[0], v[1], v[2]];
      const HIPS_AT: V3 = [0, 0.27, -0.17];
      const SPINE_AT: V3 = [0, 0.29, 0.0];
      const pawSole = (kn: V3): V3[] => {
        const pts: V3[] = [];
        const c: V3 = [kn[0], 0.036, kn[2] + 0.04]; // the paw ellipsoid (flat bottom at y = 0)
        for (const th of [26, 45, 65, 90])
          for (let ph = 0; ph < 360; ph += 30) {
            const s = Math.sin((th * Math.PI) / 180);
            const a = (ph * Math.PI) / 180;
            pts.push([c[0] + 0.058 * s * Math.cos(a), Math.max(0, c[1] - 0.04 * Math.cos((th * Math.PI) / 180)), c[2] + 0.07 * s * Math.sin(a)]);
          }
        for (const x of [-0.03, 0, 0.03]) {
          const pad = kn[2] + 0.095 - Math.abs(x) * 0.4;
          pts.push([kn[0] + x, 0.002, pad], [kn[0] + x, 0.009, pad + 0.017]); // the toe pad
          pts.push([kn[0] + x, 0.001, kn[2] + 0.13 - Math.abs(x) * 0.4], [kn[0] + x, 0.012, kn[2] + 0.115 - Math.abs(x) * 0.4]); // the claw
        }
        return pts;
      };
      const LEGS = [
        { bones: ['hips', 'spine', 'fleg.L', 'fshin.L'], joints: [HIPS_AT, SPINE_AT, SHOULDER, FKNEE], sole: pawSole(FKNEE) },
        { bones: ['hips', 'spine', 'fleg.R', 'fshin.R'], joints: [HIPS_AT, SPINE_AT, mx(SHOULDER), mx(FKNEE)], sole: pawSole(mx(FKNEE)) },
        { bones: ['hips', 'bleg.L', 'bshin.L'], joints: [HIPS_AT, HIP, BKNEE], sole: pawSole(BKNEE) },
        { bones: ['hips', 'bleg.R', 'bshin.R'], joints: [HIPS_AT, mx(HIP), mx(BKNEE)], sole: pawSole(mx(BKNEE)) },
      ];
      const chains = (pose: Pose, legs: readonly (typeof LEGS)[number][] = LEGS) =>
        legs.map((l) => ({ joints: l.joints, rotations: l.bones.map((b) => pose[b]?.rotate ?? ([0, 0, 0] as const)), sole: l.sole }));
      // The hips lift for the pose, and then each planted paw ([index in LEGS, weight]) that floats
      // tips its toes down (the heel lifts) until the claws touch the ground: the push-off at the
      // end of a step, and a paw on the high side of a hips roll. It changes the shins in `pose`.
      const planted = (pose: Pose, settle: readonly (readonly [leg: number, weight: number])[] = []) => {
        const y = motion.plant(chains(pose));
        for (const [i, weight] of settle) {
          const l = LEGS[i]!;
          const shin = l.bones[l.bones.length - 1]!;
          const r = pose[shin]?.rotate ?? ([0, 0, 0] as const);
          const floats = (w: number) => {
            pose[shin] = { rotate: [r[0] + w, r[1], r[2]] };
            return y - motion.plant(chains(pose, [l])) > 0.001; // the paw's lowest point is above the ground
          };
          let lo = 0;
          if (floats(0)) {
            let hi = 30;
            for (let n = 0; n < 12; n++) {
              const mid = (lo + hi) / 2;
              if (floats(mid)) lo = mid;
              else hi = mid;
            }
          }
          pose[shin] = { rotate: [r[0] + lo * weight, r[1], r[2]] };
        }
        return y;
      };

      // Trot: diagonal pairs move together (front-left with back-right). A paw stays flat on the
      // ground while its leg pushes back. While the leg swings forward, the upper leg lifts the knee
      // (`fold`) and the paw tips its toes up (`toe`); a paw's rounded pad sits in front of the
      // knee, so the tip lifts all of it. The hind knee sits behind the hip, so the hind leg needs
      // more of both. The hips follow the planted paws (motion.plant), plus a small `hop` between
      // the steps of the run.
      type Swing = readonly [fold: number, toe: number];
      const gait = (duration: number, swing: number, front: Swing, hind: Swing, hop: number, headDip: number, tailUp: number) => ({
        duration,
        pose: (_t: number, p: number) => {
          const a = wave(p);
          const pitch = 2 * wave(p, 2);
          // The bias sets each knee straight under its shoulder or hip, so a planted paw rises the
          // same height at both ends of the stride (the front knee sits 1 cm in front of the
          // shoulder, the hind knee 2 cm behind the hip).
          const leg = (s: 1 | -1, isFront: boolean) => {
            const lift = Math.max(0, s * wave(p, 1, 0.25)); // 0 while planted, 1 at mid-swing
            const [fold, toe] = isFront ? front : hind;
            const upper = (isFront ? 4.8 : -9.5) - s * swing * a - fold * lift;
            const lower = -upper - (isFront ? pitch : 0) - toe * lift;
            return { upper: { rotate: [upper, 0, 0] as Rot }, lower: { rotate: [lower, 0, 0] as Rot }, lift };
          };
          const legs = [leg(1, true), leg(-1, true), leg(-1, false), leg(1, false)]; // LEGS order
          const pose: Pose = {
            hips: { rotate: [0, 0, 3 * a] },
            spine: { rotate: [pitch, 0, -3 * a] },
            neck: { rotate: [headDip, 0, 0] },
            head: { rotate: [-4 * wave(p, 2, 0.25), 4 * a, 0] },
            tail: { rotate: [tailUp + 8 * wave(p, 2, 0.1), 18 * wave(p, 1, 0.2), 0] },
          };
          legs.forEach((l, i) => {
            pose[LEGS[i]!.bones.at(-2)!] = l.upper;
            pose[LEGS[i]!.bones.at(-1)!] = l.lower;
          });
          // A planted paw settles fully; the settle fades out early in the swing, so the paw leaves
          // the ground toes last and lands toes first, without a jump.
          const settle = legs.map((l, i) => [i, Math.max(0, 1 - l.lift / 0.4)] as const).filter(([, w]) => w > 0);
          pose.hips = { ...pose.hips, move: [0, planted(pose, settle) + hop * bump(p, 2) ** 2, 0] };
          return pose;
        },
      });
      clip('walk', gait(0.6, 24, [34, 10], [40, 22], 0, 0, 0));
      clip('run', gait(0.36, 36, [50, 14], [54, 26], 0.008, 10, 14));
      clip('idle', {
        duration: 2.6,
        pose: (_t, p) => ({
          spine: { move: [0, 0.004 * bump(p, 2), 0] },
          neck: { rotate: [3 * bump(p), 5 * wave(p, 1, 0.2), 0] },
          head: { rotate: [-3 * wave(p, 2, 0.1), 0, 3 * wave(p)] },
          tail: { rotate: [4 * wave(p, 1, 0.3), 20 * wave(p, 2), 0] },
        }),
      });

      // The bite: a coiled crouch, a leap with the jaws wide open, a hard snap at the peak with the
      // nose driving forward and down, a landing on the front paws, and a hop back to the start.
      // The legs are keyed as world angles: the upper leg, and the shin that carries the rigid paw
      // (0 = a flat paw, + = toes down); the local turns cancel the parent turns. In the crouch all
      // four upper legs lean forward like a parallelogram, so the body sinks and rocks back over
      // the planted paws. `head` is the head's world pitch (+ = nose down); it never tosses up.
      // While all four paws are down (`level`), the body pitch is solved so the front and the hind
      // paws both touch; in the air (`air`) the hips follow `airY`, never lower than the paws allow.
      type Track = readonly (readonly [number, number])[];
      const ATTACK: Record<string, Track> = {
        hu: [[0, 0], [0.24, -60], [0.3, -62], [0.38, 20], [0.46, 42], [0.52, 20], [0.58, -30], [0.66, -40], [0.74, -38], [0.86, 0], [1, 0]],
        hs: [[0, 0], [0.3, 0], [0.38, 30], [0.46, 50], [0.52, 30], [0.6, 0], [1, 0]],
        fu: [[0, 0], [0.24, -55], [0.3, -56], [0.38, -70], [0.46, -80], [0.52, -70], [0.58, -22], [0.66, -35], [0.74, -33], [0.86, 0], [1, 0]],
        fs: [[0, 0], [0.3, 0], [0.38, -30], [0.46, -35], [0.52, -30], [0.58, -6], [0.66, 0], [1, 0]],
        s: [[0, 0], [0.24, 4], [0.3, 4], [0.38, -4], [0.46, -2], [0.52, 2], [0.58, 4], [0.66, 3], [0.8, 0], [1, 0]],
        h: [[0, 0], [0.3, 0], [0.38, -12], [0.46, -6], [0.52, 2], [0.58, 7], [0.66, 0], [1, 0]],
        neck: [[0, 0], [0.24, 26], [0.3, 28], [0.38, 10], [0.46, 16], [0.52, 28], [0.58, 20], [0.66, 14], [0.8, 4], [1, 0]],
        head: [[0, 0], [0.24, 8], [0.3, 8], [0.38, -2], [0.46, 0], [0.5, 14], [0.58, 10], [0.66, 6], [0.8, 2], [1, 0]],
        jaw: [[0, 0], [0.3, 0], [0.38, 0.75], [0.44, 1], [0.47, 1], [0.5, 0], [1, 0]],
        tail: [[0, 0], [0.24, -20], [0.3, -22], [0.38, -30], [0.46, -36], [0.52, -28], [0.6, -14], [0.72, -6], [1, 0]],
        z: [[0, 0], [0.24, -0.1], [0.3, -0.105], [0.38, 0.08], [0.46, 0.15], [0.52, 0.19], [0.58, 0.2], [0.76, 0.2], [0.88, 0.01], [1, 0]],
        air: [[0.34, 0], [0.42, 1], [0.52, 1], [0.6, 0]],
        airY: [[0.34, 0.02], [0.44, 0.1], [0.5, 0.1], [0.58, 0.02]],
        hop: [[0.74, 0], [0.8, 0.03], [0.86, 0.02], [0.9, 0]],
        level: [[0, 1], [0.32, 1], [0.38, 0], [0.56, 0], [0.64, 1], [1, 1]],
      };
      const FRONT = LEGS.slice(0, 2);
      const HIND = LEGS.slice(2);
      const needY = (pose: Pose, legs: readonly (typeof LEGS)[number][] = LEGS) => motion.plant(chains(pose, legs));
      clip('attack', {
        duration: 1.0,
        loop: false,
        pose: (_t, p) => {
          const v = (name: string) => keys(p, ATTACK[name]!);
          const [hu, hs, fu, fs, s, neck] = [v('hu'), v('hs'), v('fu'), v('fs'), v('s'), v('neck')];
          const make = (h: number): Pose => {
            const pose: Pose = {
              hips: { rotate: [h, 0, 0] },
              spine: { rotate: [s, 0, 0] },
              neck: { rotate: [neck, 0, 0] },
              head: { rotate: [v('head') - h - s - neck, 0, 0] },
              jaw: { rotate: [35 * v('jaw'), 0, 0] },
              tail: { rotate: [v('tail') - h, 8 * wave(p, 3), 0] },
            };
            for (const side of ['L', 'R']) {
              pose[`fleg.${side}`] = { rotate: [fu - h - s, 0, 0] };
              pose[`fshin.${side}`] = { rotate: [fs - fu, 0, 0] };
              pose[`bleg.${side}`] = { rotate: [hu - h, 0, 0] };
              pose[`bshin.${side}`] = { rotate: [hs - hu, 0, 0] };
            }
            return pose;
          };
          // The pitch that puts the front and the hind paws on the ground together.
          let level = 0;
          if (v('level') > 0) {
            let lo = -25;
            let hi = 25;
            for (let n = 0; n < 14; n++) {
              const mid = (lo + hi) / 2;
              const pose = make(v('h') + mid);
              if (needY(pose, FRONT) > needY(pose, HIND)) hi = mid;
              else lo = mid;
            }
            level = ((lo + hi) / 2) * v('level');
          }
          const pose = make(v('h') + level);
          const ground = needY(pose);
          const y = Math.max(ground, ground + (v('airY') - ground) * v('air')) + v('hop');
          pose.hips = { ...pose.hips, move: [0, y, v('z')] };
          return pose;
        },
      });

      // Hit, struck from the front: a yelp. The head jerks up and back (the nose and the grin point
      // up, the ears sweep back), the body flinches back and a little to its right, and the tail
      // tucks down; then a quick return. Each upper leg leans by the angle that cancels the body's
      // shift and each shin turns back by the same angle, so the paws stay flat and planted; the
      // hips sink by the height the leaning upper legs lose.
      const DEG = 180 / Math.PI;
      const UPPER = 0.12; // shoulder or hip joint to knee
      clip('hit', {
        duration: 0.4,
        loop: false,
        pose: (_t, p) => {
          const h = keys(p, [[0, 0], [0.15, 1], [0.34, 0.85], [1, 0]] as const);
          const tuck = keys(p, [[0, 0], [0.14, 1], [0.55, 0.75], [1, 0]] as const);
          const back = 0.028 * h;
          const side = 0.01 * h;
          const a = Math.asin(back / UPPER) * DEG;
          const c = Math.asin(side / UPPER) * DEG;
          const sink = UPPER - Math.sqrt(UPPER * UPPER - back * back - side * side);
          const upper = { rotate: [-a, 0, c] as const };
          const lower = { rotate: [a, 0, -c] as const };
          return {
            hips: { move: [-side, 0.005 * h - sink, -back] },
            neck: { rotate: [-14 * h, -4 * h, 0] },
            head: { rotate: [-26 * h, -5 * h, 8 * h] },
            tail: { rotate: [-50 * tuck, 10 * tuck, 0] },
            'fleg.L': upper,
            'fleg.R': upper,
            'bleg.L': upper,
            'bleg.R': upper,
            'fshin.L': lower,
            'fshin.R': lower,
            'bshin.L': lower,
            'bshin.R': lower,
          };
        },
      });

      // Death: a yelping recoil and a stagger, then the legs give way: the front legs fold forward
      // with the forearms flat (the big paws cannot kneel), the hind legs bend, and the chest drops.
      // Then the wolf rolls onto its right side and lies still, the legs out and the head down.
      // The head is much wider than the body (the cheek tufts), so the neck turns it part of the way
      // back up: the head then rests on its lower cheek tuft instead of pushing the tuft into the
      // ground. The hips lift keeps every part on or above the ground, measured per phase with the
      // rigid-bone ground probe (scratch tool); zero where the pose already clears the ground.
      const DEATH_LIFT: readonly (readonly [number, number])[] = [
        [0, 0], [0.275, 0], [0.3, 0.004], [0.325, 0.008], [0.35, 0.011], [0.375, 0.012], [0.4, 0.011],
        [0.425, 0.014], [0.45, 0.019], [0.475, 0.025], [0.5, 0.032], [0.525, 0.034], [0.55, 0.036],
        [0.575, 0.041], [0.6, 0.046], [0.625, 0.04], [0.65, 0.028], [0.675, 0.02], [0.7, 0.016],
        [0.725, 0.012], [0.75, 0.006], [0.775, 0], [0.8, 0.002], [0.825, 0.009], [0.85, 0.015], [0.875, 0.016], [1, 0.016],
      ];
      clip('death', {
        duration: 1.4,
        loop: false,
        pose: (_t, p) => {
          const recoil = keys(p, [[0, 0], [0.06, 1], [0.16, 0.3], [0.26, 0]] as const);
          const sway = keys(p, [[0.05, 0], [0.14, 1], [0.24, -0.5], [0.34, 0]] as const);
          const fold = keys(p, [[0.22, 0], [0.36, 1]] as const); // the front legs buckle
          const drop = keys(p, [[0.26, 0], [0.42, 1], [0.55, 0.9], [0.74, 0]] as const); // onto the chest
          const crouch = keys(p, [[0.26, 0], [0.42, 1]] as const);
          const roll = keys(p, [[0.42, 0], [0.74, 1]] as const); // over onto the right side
          const outL = keys(p, [[0.46, 0], [0.68, 1]] as const); // the upper legs go out first
          const outR = keys(p, [[0.56, 0], [0.82, 1]] as const); // the lower legs slide out last
          const tuckR = keys(p, [[0.42, 0], [0.56, 1], [0.74, 0.3], [0.84, 0]] as const); // the lower legs fold under the belly
          const bounce = keys(p, [[0.72, 0], [0.78, 1], [0.86, 0]] as const);
          const twitch = Math.max(0, Math.sin((p - 0.86) * Math.PI * 12)) * Math.max(0, Math.min(1, (p - 0.86) / 0.03, (1 - p) / 0.06));
          const legZ = -5 * sway;
          const frontLeg = (f: number, out: number, z: number, tw: number) => ({
            upper: [45 * f - 24 * out - tw, 0, legZ + z] as const,
            lower: [-100 * f - 8 * out, 0, 0] as const,
          });
          // The shin also cancels the hips pitch, so the hind paws stay flat instead of toes-down.
          const backLeg = (c: number, out: number, z: number, tw: number) => ({
            upper: [-50 * c + 24 * out + tw, 0, legZ + z] as const,
            lower: [50 * c + 6 * out - 16 * drop, 0, 0] as const,
          });
          const fL = frontLeg(fold * (1 - outL), outL, 14 * outL, 6 * twitch);
          const fR = frontLeg(fold * (1 - outR), outR, -6 * outR + 35 * tuckR, 0);
          const bL = backLeg(crouch * (1 - outL), outL, 14 * outL, 5 * twitch);
          const bR = backLeg(crouch * (1 - outR), outR, -6 * outR + 35 * tuckR, 0);
          const y = 0.012 * Math.abs(sway) - 0.03 * drop * (1 - roll) - 0.1 * roll + 0.012 * bounce + keys(p, DEATH_LIFT, 'linear');
          return {
            hips: { move: [-0.02 * sway - 0.08 * roll, y, -0.03 * recoil], rotate: [16 * drop, 0, 5 * sway + 90 * roll] },
            spine: { rotate: [0, -6 * sway, 0] },
            neck: { rotate: [-16 * recoil + 10 * drop + 8 * roll, 0, -32 * roll] },
            head: { rotate: [-24 * recoil + 6 * drop + 4 * roll, 0, -13 * roll] },
            tail: { rotate: [-35 * recoil - 45 * roll, 20 * sway, 0] },
            'fleg.L': { rotate: fL.upper },
            'fshin.L': { rotate: fL.lower },
            'fleg.R': { rotate: fR.upper },
            'fshin.R': { rotate: fR.lower },
            'bleg.L': { rotate: bL.upper },
            'bshin.L': { rotate: bL.lower },
            'bleg.R': { rotate: bR.upper },
            'bshin.R': { rotate: bR.lower },
          };
        },
      });

      // Howl, when the wolf spots the player or calls its pack. A breath: the front legs plant, the
      // chest swells and lifts, the rear sinks on bent hind legs, and the head dips. Then the head
      // tips far back with the nose to the sky, the jaw opens, and the tail rises; the howl holds
      // 0.8 s with a tremble in the jaw and the head. Then the head comes down, the jaw closes, a
      // quick shake of the head, and rest. The front legs keep their rest angles in the world, so
      // the hips move keeps the front paws in place. Each hind leg is solved (motion.reach) so the
      // back edge of its sole stays in place; its toes lift a little as the knee bends.
      // The spine scale (the swell) also moves the shoulder joints; `swelled` adds that to the
      // rest chains of the front legs. fleg and neck cancel the scale, so only the chest grows.
      const HOWL: Record<string, Track> = {
        body: [[0, 0], [0.22, 3], [0.33, 4], [0.73, 4], [0.87, 0], [1, 0]], // hips pitch, + = nose up
        chest: [[0, 0], [0.22, 4], [0.33, 5], [0.73, 4], [0.87, 0], [1, 0]], // spine pitch, + = nose up
        swell: [[0, 0], [0.24, 1], [0.34, 1], [0.73, 0.3], [0.86, 0], [1, 0]],
        neck: [[0, 0], [0.2, 8], [0.26, 8], [0.35, -28], [0.73, -28], [0.82, 5], [0.9, 0], [1, 0]], // + = nose down
        head: [[0, 0], [0.2, 6], [0.26, 6], [0.36, -34], [0.73, -34], [0.82, 3], [0.9, 0], [1, 0]],
        jaw: [[0, 0], [0.27, 0], [0.35, 1], [0.72, 1], [0.8, 0], [1, 0]],
        tail: [[0, 0], [0.22, -6], [0.36, 26], [0.73, 26], [0.9, 0], [1, 0]],
        hum: [[0.33, 0], [0.37, 1], [0.7, 1], [0.74, 0]], // the tremble of the sound
        shake: [[0.78, 0], [0.82, 1], [0.94, 0]],
      };
      const swelled = (l: (typeof LEGS)[number], s: number) => {
        if (l.bones[1] !== 'spine') return l;
        const d = [0, 1, 2].map((j) => (l.joints[2]![j]! - SPINE_AT[j]!) * (s - 1));
        const add = (v: V3): V3 => [v[0] + d[0]!, v[1] + d[1]!, v[2] + d[2]!];
        return { ...l, joints: [l.joints[0]!, l.joints[1]!, add(l.joints[2]!), add(l.joints[3]!)], sole: l.sole.map(add) };
      };
      const swellChains = (pose: Pose, s: number, legs: readonly (typeof LEGS)[number][] = LEGS) =>
        chains(pose, legs.map((l) => swelled(l, s)));
      const HEEL: V3 = [BKNEE[0], 0, BKNEE[2] + 0.009]; // the back edge of the flat hind sole
      const FPAW: V3 = [FKNEE[0], 0, FKNEE[2] + 0.04]; // the middle of the front sole
      const pitchX = (v: V3, deg: number, about: V3): V3 => {
        const a = (deg * Math.PI) / 180;
        const y = v[1] - about[1];
        const z = v[2] - about[2];
        return [v[0], about[1] + y * Math.cos(a) - z * Math.sin(a), about[2] + y * Math.sin(a) + z * Math.cos(a)];
      };
      clip('howl', {
        duration: 2.0,
        loop: false,
        pose: (t, p) => {
          const v = (name: string) => keys(p, HOWL[name]!);
          const [body, chest, s] = [v('body'), v('chest'), 1 + 0.05 * v('swell')];
          const hum = v('hum');
          const shakeT = ((p - 0.78) / 0.16) * 4 * Math.PI; // two shakes
          const shake = v('shake') * Math.sin(shakeT);
          const inv = [1 / s, 1 / s, 1 / s] as const;
          const pose: Pose = {
            hips: { rotate: [-body, 0, 0] },
            spine: { rotate: [-chest, 0, 0], scale: [s, s, s] },
            neck: { rotate: [v('neck'), 0, 0], scale: inv },
            head: { rotate: [v('head') + 1.2 * hum * Math.sin(t * 2 * Math.PI * 7), 14 * shake, 7 * shake] },
            jaw: { rotate: [30 * v('jaw') + 3 * hum * Math.sin(t * 2 * Math.PI * 11), 0, 0] },
            tail: { rotate: [v('tail') + body, 6 * wave(p, 3), 0] },
          };
          for (const side of ['L', 'R']) pose[`fleg.${side}`] = { rotate: [body + chest, 0, 0], scale: inv };
          // The hips move that keeps the front paws in place.
          const front = swelled(LEGS[0]!, s);
          const d = [0, 1, 2].map((j) => front.joints[3]![j]! - FKNEE[j]!);
          const rots = front.bones.map((b) => pose[b]?.rotate ?? ([0, 0, 0] as const));
          const pawZ = motion.follow(front.joints, rots, [FPAW[0] + d[0]!, FPAW[1] + d[1]!, FPAW[2] + d[2]!])[2];
          const move: V3 = [0, motion.plant(swellChains(pose, s, [LEGS[0]!])), FPAW[2] - pawZ];
          // Each hind leg reaches from its posed hip back to the rest heel, in the hips' rest frame.
          const heel = pitchX([HEEL[0], HEEL[1] - move[1], HEEL[2] - move[2]], body, HIPS_AT);
          const r = motion.reach({ root: HIP, mid: BKNEE, end: HEEL }, heel, BKNEE);
          pose['bleg.L'] = { rotate: r.upper };
          pose['bshin.L'] = { rotate: r.lower };
          pose['bleg.R'] = { rotate: [r.upper[0], -r.upper[1], -r.upper[2]] };
          pose['bshin.R'] = { rotate: [r.lower[0], -r.lower[1], -r.lower[2]] };
          // Nothing goes under the floor: a heel that rolls lifts the body by that much.
          pose.hips = { ...pose.hips, move: [0, Math.max(move[1], motion.plant(swellChains(pose, s))), move[2]] };
          return pose;
        },
      });
    },
  });
}
