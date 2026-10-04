import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../../src/index.js';
import type { AssetContext, AssetDefinition } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';

/**
 * Boar kinds — the horned boar of `assets/horned-boar.ts` (catalog `monsters/beast/giant-boar`, its
 * horned variant) and the plain giant boar. One body, head, rig, and clip set; each kind sets the
 * palette and the slots, and may drop the horns, grow the tusks, and raise the mane. Bear kinds
 * (the dire bear, the owlbear) change the snout, the ears, the eyes, and the feet, and drop the
 * mane. The design notes of the body, the rig, and the clips are in `assets/horned-boar.ts`.
 */

const BOAR_COLORS = {
  fur: '#a8683a',
  furDark: '#7a4626',
  belly: '#c48c56',
  snout: '#e7848a',
  snoutDark: '#c05a64',
  nostril: '#3a1a1c',
  mouth: '#3a1a1c',
  lid: '#e27a86',
  earInner: '#e08a8e',
  ivory: '#efe6cf',
  ivoryBase: '#cbbd98',
  black: '#26221f',
  eye: '#f26a0a',
  pupil: '#141012',
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');

// Joint positions (rest pose). Short, thick legs keep the body low and heavy.
const SHOULDER: V3 = [0.13, 0.27, 0.07];
const FKNEE: V3 = [0.135, 0.14, 0.08];
const HIP: V3 = [0.12, 0.25, -0.16];
const BKNEE: V3 = [0.125, 0.13, -0.175];
const HEAD_C: V3 = [0, 0.46, 0.21];

/** A boar kind: the slots, fixed colors, and the horns, tusks, and mane. */
export interface BoarKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `fur`, `skin`, `eyes`, and the ivory slot (`horns` or `tusks`); the first option of each is the default. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  /** Fixed colors and the default shades of the slots (furDark, belly, lid, earInner, ivoryBase). */
  readonly colors?: Partial<typeof BOAR_COLORS>;
  /** The slot that colors the horns and the tusks (default `horns`). */
  readonly ivorySlot?: string;
  /** False for a boar without horns. */
  readonly horns?: boolean;
  /** The length of the tusks as a share of the horned boar's. */
  readonly tuskScale?: number;
  /** The height of the mane spikes as a share of the horned boar's. */
  readonly maneScale?: number;
  /** False: no mane spikes and no tail tuft (the brows stay). */
  readonly mane?: boolean;
  /** The snout: the pig disc (default), a bear muzzle in the skin slot with a black nose and a short stub tail (no teeth), or none (no mouth or teeth). */
  readonly snout?: 'pig' | 'bear' | false;
  /** The ears: pointed pig ears (default) or round bear ears. */
  readonly ears?: 'pig' | 'round';
  /** The feet: split hooves (default) or round paws with claws in the ivory slot color. */
  readonly feet?: 'hooves' | 'paws';
  /** The size of the eyes as a share of the boar's. */
  readonly eyeScale?: number;
  /** The glow of the eyes (default 0.9; 0 for plain eyes). */
  readonly eyeGlow?: number;
  /** False: no heavy brows over the eyes (a friendly face). */
  readonly brows?: boolean;
  /** False: no lid rings in the skin color over the eyes. */
  readonly lids?: boolean;
  /** False: no teeth under the pig snout. */
  readonly teeth?: boolean;
  /** The tail: long and thin (default with the pig snout), a short stub (default with the bear muzzle), or a curly pig tail (no mane tuft). */
  readonly tail?: 'long' | 'stub' | 'curl';
  /** The length of the bear muzzle as a share of the bear's; above 1 it grows forward and thinner (a badger or hedgehog snout). */
  readonly muzzleLength?: number;
  /** Extra paint on the fur (a face disc, a bib), with the slot colors. */
  paint?(fur: sdf.Shape, boar: BoarShape): sdf.Shape;
  /** Extra bodies (a beak, ear tufts), rigid on a bone or tagged to bones. */
  extra?(k: AssetContext, boar: BoarShape): void;
}

/** The boar's shapes and slot colors that a kind builds on. */
export interface BoarShape {
  /** The skull with its snout, centered near `HEAD_C`. */
  readonly headBase: sdf.Shape;
  /** The body without the legs: chest, rump, and head. */
  readonly trunk: sdf.Shape;
  /** The front surface point of the head at (x, y). */
  faceHit(x: number, y: number): V3;
  /** The center of the left eyeball and its radius. */
  readonly eye: { readonly center: V3; readonly r: number };
  readonly tint: Record<'fur' | 'furDark' | 'belly' | 'snout' | 'lid' | 'earInner' | 'eye' | 'ivory' | 'ivoryBase', string>;
  /** A fixed default color that follows a slot (`k.tint(slot, { color, follow })`). */
  tone(slot: string, color: string, follow?: number): string;
}

export function boarAsset(kind: BoarKind): AssetDefinition {
  const C = { ...BOAR_COLORS, ...kind.colors };
  const ts = kind.tuskScale ?? 1;
  const tr = Math.sqrt(ts);
  return defineAsset({
    name: kind.name,
    description: kind.description,
    detail: 0.005,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),

    build(k) {
      // Colors of the variant slots. Shades keep their exact default color and follow their slot.
      const T = {
        fur: k.tint('fur'),
        furDark: k.tint('fur', { color: C.furDark, follow: 1 }),
        belly: k.tint('fur', { color: C.belly, follow: 1 }),
        snout: k.tint('skin'),
        lid: k.tint('skin', { color: C.lid, follow: 1 }),
        earInner: k.tint('skin', { color: C.earInner, follow: 1 }),
        eye: k.tint('eyes'),
        ivory: k.tint(kind.ivorySlot ?? 'horns'),
        ivoryBase: k.tint(kind.ivorySlot ?? 'horns', { color: C.ivoryBase, follow: 1 }),
      };
      k.skeleton({
        hips: { at: [0, 0.31, -0.16] },
        spine: { parent: 'hips', at: [0, 0.35, 0.02] },
        neck: { parent: 'spine', at: [0, 0.4, 0.13] },
        head: { parent: 'neck', at: [0, 0.44, 0.19] },
        tail: { parent: 'hips', at: [0, 0.34, -0.3] },
        'fleg.L': { parent: 'spine', at: SHOULDER },
        'fshin.L': { parent: 'fleg.L', at: FKNEE },
        'fleg.R': { parent: 'spine', at: [-SHOULDER[0], SHOULDER[1], SHOULDER[2]] },
        'fshin.R': { parent: 'fleg.R', at: [-FKNEE[0], FKNEE[1], FKNEE[2]] },
        'bleg.L': { parent: 'hips', at: HIP },
        'bshin.L': { parent: 'bleg.L', at: BKNEE },
        'bleg.R': { parent: 'hips', at: [-HIP[0], HIP[1], HIP[2]] },
        'bshin.R': { parent: 'bleg.R', at: [-BKNEE[0], BKNEE[1], BKNEE[2]] },
      });

      // ------------------------------------------------------------------ body: big chest, small rump
      const chest = sdf.smoothUnion(
        0.08,
        sdf.ellipsoid([0.19, 0.18, 0.18]).at(0, 0.33, 0.0),
        sdf.ellipsoid([0.16, 0.11, 0.13]).at(0, 0.42, 0.04), // shoulder hump
      );
      const rump = sdf.ellipsoid([0.15, 0.14, 0.14]).at(0, 0.28, -0.14);

      // ------------------------------------------------------------------ head: huge, with jowls and a snout
      const skull = sdf.smoothUnion(
        0.07,
        sdf.ellipsoid([0.235, 0.205, 0.2]).at(...HEAD_C),
        pair(sdf.sphere(0.11).at(0.12, 0.37, 0.27)), // heavy jowls
        sdf.ellipsoid([0.14, 0.07, 0.12]).at(0, 0.31, 0.29), // lower jaw
      );
      // The snout: a short thick cylinder pointing forward, a little down, ending in a flat disc.
      const SNOUT: V3 = [0, 0.38, 0.41];
      const snoutLocal = sdf.cylinder(0.082, 0.11, 0.03);
      const snoutPose = (s: sdf.Shape) => s.rotateX(82).at(...SNOUT);
      const snout = snoutPose(snoutLocal);
      // A bear muzzle: a round block on the front of the face, a little down.
      const ml = kind.muzzleLength ?? 1;
      const muzzle =
        ml === 1
          ? sdf.ellipsoid([0.105, 0.08, 0.1]).at(0, 0.385, 0.37)
          : sdf.ellipsoid([0.105 / Math.sqrt(ml), 0.08 / Math.sqrt(ml), 0.1 * ml]).at(0, 0.385, 0.37 + 0.1 * (ml - 1));
      const headBase =
        kind.snout === 'bear' ? sdf.smoothUnion(0.05, skull, muzzle) : kind.snout === false ? skull : sdf.smoothUnion(0.04, skull, snout);

      // Details are placed on the modeled surface by probing it, not by guessing coordinates.
      const faceHit = (x: number, y: number) => sdf.raycast(headBase, [x, y, 2], [0, 0, -1])!;
      const EYE_X = 0.098;
      const EYE_Y = 0.495;
      const eyeHit = faceHit(EYE_X, EYE_Y);
      const eyeNormal = sdf.normalAt(headBase, eyeHit);
      const es = kind.eyeScale ?? 1;
      const EYE_R = 0.05 * es;
      // The eyeball center sits a little inside the surface, so the eye bulges out by about half; a
      // bigger eye sits deeper, so it does not stand out of the face in the side view.
      const inset = 0.022 + Math.max(0, EYE_R - 0.05) * 0.7;
      const eyeCenter: V3 = [eyeHit[0] - eyeNormal[0] * inset, eyeHit[1] - eyeNormal[1] * inset, eyeHit[2] - eyeNormal[2] * inset];
      const out = (d: number): V3 => [eyeCenter[0] + eyeNormal[0] * d, eyeCenter[1] + eyeNormal[1] * d, eyeCenter[2] + eyeNormal[2] * d];

      // Pointed pig ears on the top corners of the head, cupped toward the front.
      const earLocal = sdf
        .cone([0, 0, 0], [0, 0.11, 0], 0.052, 0.01)
        .scale([1, 1, 0.42])
        .smoothSubtract(0.008, sdf.cone([0, 0.012, 0.016], [0, 0.1, 0.016], 0.036, 0.004).scale([1, 1, 0.5]));
      const earCup = sdf.cone([0, 0.012, 0.03], [0, 0.1, 0.03], 0.04, 0.006).scale([1, 1, 0.8]).intersect(sdf.halfSpace([0, -1, 0], -0.03));
      const earRoot = sdf.surfacePoint(headBase, [0.2, 0.64, 0.3], -0.02);
      const earPose = (s: sdf.Shape) => s.scale(1.35).rotateX(-12).rotateZ(-44).rotateY(22).at(...earRoot);
      const pigEars = () => pair(earPose(earLocal.paintWhere(earCup, T.earInner, 0.006)));
      // Round bear ears: flat discs on the top corners of the head, cupped toward the front.
      const roundEars = () => {
        const root = sdf.surfacePoint(headBase, [0.17, 0.68, 0.2], -0.025);
        const ear = sdf
          .sphere(0.068)
          .scale([1, 1, 0.5])
          .paintWhere(sdf.sphere(0.048).scale([1, 1, 0.4]).at(0.006, 0.01, 0.026), T.earInner, 0.006)
          .rotateZ(-28)
          .rotateY(12)
          .at(root[0], root[1] + 0.03, root[2]);
        return pair(ear);
      };
      const ears = kind.ears === 'round' ? roundEars() : pigEars();

      // ------------------------------------------------------------------ legs, tail
      // The shin ends inside the hoof: its round end stops at y = 0.023, above the sole (y = 0), and
      // it enters the hoof top (y = 0.06) at a radius of 0.057, inside the hoof's flat top.
      const leg = (hip: V3, knee: V3, upper: string, lower: string) =>
        sdf.smoothUnion(
          0.03,
          sdf.cone(hip, knee, 0.09, 0.074).bone(upper),
          sdf.cone(knee, [knee[0], 0.085, knee[2] + 0.012], 0.074, 0.062).bone(lower),
        );
      const legs = sdf.union(pair(leg(SHOULDER, FKNEE, 'fleg.L', 'fshin.L')), pair(leg(HIP, BKNEE, 'bleg.L', 'bshin.L')));
      // Round paws (bear kinds): a wide pad under each shin, a little forward.
      const paw = (at: V3, bone: string) => sdf.ellipsoid([0.08, 0.048, 0.092]).at(at[0], 0.048, at[2] + 0.03).bone(bone);
      const paws = kind.feet === 'paws' ? sdf.union(pair(paw(FKNEE, 'fshin.L')), pair(paw(BKNEE, 'bshin.L'))) : undefined;
      const limbs = paws ? sdf.smoothUnion(0.03, legs, paws) : legs;
      const TAIL_TIP: V3 = [0.02, 0.34, -0.41];
      const longTail = sdf
        .chain(
          [
            [0, 0.33, -0.29, 0.026],
            [0, 0.35, -0.36, 0.02],
            [TAIL_TIP[0], TAIL_TIP[1], TAIL_TIP[2], 0.014],
          ],
          0.015,
        )
        .bone('tail');
      // A curly pig tail: up from the rump, then one loop behind it.
      const curlTail = () => {
        const C0: V3 = [0.022, 0.375, -0.35];
        const loop = Array.from({ length: 7 }, (_, i): [number, number, number, number] => {
          const a = Math.PI + (i / 6) * Math.PI * 1.7;
          return [C0[0] + 0.026 * Math.cos(a), C0[1] + 0.026 * Math.sin(a), C0[2] - 0.004 * i, 0.014 - 0.0006 * i];
        });
        return sdf.chain([[0, 0.33, -0.29, 0.02], [0, 0.355, -0.33, 0.016], ...loop], 0.008).bone('tail');
      };
      const tailKind = kind.tail ?? (kind.snout === 'bear' ? 'stub' : 'long');
      const tail =
        tailKind === 'stub' ? sdf.ellipsoid([0.045, 0.045, 0.04]).at(0, 0.33, -0.29).bone('tail') : tailKind === 'curl' ? curlTail() : longTail;

      // ------------------------------------------------------------------ fur
      const trunk = sdf.smoothUnion(0.08, chest.bone('spine'), rump.bone('hips'), headBase.bone('head'));
      const bodyShape = trunk.smoothUnion(0.035, limbs).smoothUnion(0.02, tail).smoothUnion(0.012, ears.bone('head'));
      const lidRing = pair(sdf.sphere(EYE_R + 0.012).at(...eyeCenter).intersect(sdf.halfSpace([0, 1, 0], eyeCenter[1] - 0.006)));
      const MOUTH_Y = 0.272;
      const mouth = sdf.extrude(profile.arc(0.16, 0.013, 236, 304), 0.5).at(0, MOUTH_Y + 0.16, 0.3);
      const furLegs = bodyShape
        .paintFn((x, y, z, base) => mixRgb(base, rgb(T.furDark), 0.22 * (0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 5, 2))))
        .paintWhere(sdf.ellipsoid([0.17, 0.08, 0.28]).at(0, 0.16, -0.04), T.belly, 0.05)
        .paintWhere(limbs.intersect(sdf.halfSpace([0, 1, 0], 0.16)), T.furDark, 0.04);
      const furBase = kind.lids === false ? furLegs : furLegs.paintWhere(lidRing, T.lid, 0.004);
      // The bear muzzle in the skin slot color: the front of the muzzle, below the eyes.
      const furMuzzle = kind.snout === 'bear' ? furBase.paintWhere(muzzle.round(0.012).intersect(sdf.halfSpace([0, 0, -1], -0.36)), T.snout, 0.012) : furBase;
      const furMouth = kind.snout === false ? furMuzzle : furMuzzle.paintWhere(mouth, C.mouth, 0.003);
      const tone = (slot: string, color: string, follow = 1) => k.tint(slot, { color, follow });
      const boar: BoarShape = { headBase, trunk, faceHit, eye: { center: eyeCenter, r: EYE_R }, tint: T, tone };
      const fur = kind.paint ? kind.paint(furMouth, boar) : furMouth;
      k.body('fur', fur, {
        color: T.fur,
        roughness: 0.8,
        textureDensity: 1.4,
        bump: (x, y, z) => 0.0006 * noise.fbm(x * 90, y * 90, z * 30, 2),
      });

      // The snout disc: pink, with two big dark nostrils. A separate body so its edge stays crisp.
      const snoutFront = snoutPose(sdf.cylinder(0.087, 0.03, 0.014).at(0, 0.052, 0));
      const nostrils = pair(snoutPose(sdf.ellipsoid([0.018, 0.012, 0.027]).at(0.034, 0.068, 0.004)));
      if (kind.snout === 'bear') {
        // A black nose on the tip of the muzzle.
        const tipAt = faceHit(0, 0.415);
        const nose = sdf.ellipsoid([0.046, 0.032, 0.03]).at(tipAt[0], tipAt[1], tipAt[2] - 0.006);
        k.body('nose', nose.paintWhere(sdf.sphere(0.009).at(tipAt[0] - 0.014, tipAt[1] + 0.016, tipAt[2] + 0.018), '#6a6060', 0.004).bone('head'), {
          color: C.nostril,
          roughness: 0.25,
          detail: 0.003,
        });
      } else if (kind.snout !== false) {
        k.body('snout', snoutFront.smoothSubtract(0.006, nostrils).paintWhere(nostrils.round(0.006), C.nostril, 0.004).bone('head'), {
          color: T.snout,
          roughness: 0.5,
        });
      }
      // Small blunt teeth along the lower lip, under the snout.
      const teeth = sdf.union(
        ...[-0.05, -0.018, 0.018, 0.05].map((x) => {
          const p = faceHit(x, MOUTH_Y + 0.004 + 0.12 * x * x);
          return sdf.cone([p[0], p[1] - 0.012, p[2] - 0.008], [p[0], p[1] + 0.012, p[2] - 0.002], 0.011, 0.007);
        }),
      );
      if ((kind.snout ?? 'pig') === 'pig' && kind.teeth !== false) k.body('teeth', teeth.bone('head'), { color: C.ivory, roughness: 0.35, detail: 0.003 });

      // ------------------------------------------------------------------ eyes: glowing irises, dark pupils
      const eyes = pair(sdf.sphere(EYE_R).at(...eyeCenter));
      const glow = kind.eyeGlow ?? 0.9;
      k.body('eyes', eyes.bone('head'), { color: T.eye, roughness: 0.2, ...(glow > 0 ? { emissive: T.eye, emissiveIntensity: glow } : {}) });
      const pupilAt = out(EYE_R - 0.006);
      const pupils = pair(
        sdf
          .ellipsoid([0.026 * es, 0.03 * es, 0.014 * es])
          .at(pupilAt[0] - 0.004 * es, pupilAt[1], pupilAt[2])
          .paintWhere(sdf.sphere(0.0065 * es).at(pupilAt[0] + 0.004 * es, pupilAt[1] + 0.01 * es, pupilAt[2] + 0.012 * es), '#ffffff', 0.002),
      );
      k.body('pupils', pupils.bone('head'), { color: C.pupil, roughness: 0.15, detail: 0.003 });

      // ------------------------------------------------------------------ black: mane spikes, brows, tail tuft
      // Heavy angry brows over the eyes: the inner ends dip toward the snout.
      const browAt = faceHit(EYE_X + 0.002, EYE_Y + 0.056);
      const brows = pair(
        sdf.chain(
          [
            [browAt[0] + 0.05, browAt[1] + 0.034, browAt[2] - 0.035, 0.016],
            [browAt[0] + 0.004, browAt[1] + 0.008, browAt[2] - 0.004, 0.022],
            [browAt[0] - 0.045, browAt[1] - 0.036, browAt[2] - 0.002, 0.017],
          ],
          0.01,
        ),
      ).bone('head');
      // Spikes rooted on the probed top line, from the crown back to the rump; tallest on the head.
      const spikes = Array.from({ length: 11 }, (_, i) => {
        const t = i / 10;
        const z = 0.25 - t * 0.45;
        const root = sdf.raycast(trunk, [0, 2, z], [0, -1, 0])!;
        const h = (0.035 + 0.075 * Math.max(0, 1 - t * 1.25)) * (kind.maneScale ?? 1);
        const bone = z > 0.16 ? 'head' : z > 0.1 ? 'neck' : z > -0.12 ? 'spine' : 'hips';
        const tilt = (noise.random(i, 9) - 0.5) * 14;
        return sdf
          .cone([root[0], root[1] - 0.02, root[2]], [root[0], root[1] + h, root[2] - 0.035], 0.03 + 0.012 * (1 - t), 0.004)
          .rotateZ(tilt)
          .bone(bone);
      });
      // A spiky tuft at the tail tip.
      const tuft = sdf
        .union(
          ...[
            [-0.03, 0.04],
            [0.035, 0.035],
            [0.0, 0.055],
            [-0.02, -0.03],
            [0.03, -0.035],
          ].map(([dx, dy]) => sdf.cone(TAIL_TIP, [TAIL_TIP[0] + dx!, TAIL_TIP[1] + dy!, TAIL_TIP[2] - 0.05], 0.016, 0.003)),
        )
        .bone('tail');
      const noBrows = kind.brows === false;
      const maneShape =
        kind.mane === false
          ? noBrows
            ? undefined
            : brows
          : noBrows
            ? sdf.union(sdf.smoothUnion(0.02, ...spikes), tuft)
            : sdf.union(sdf.smoothUnion(0.02, ...spikes), brows, tuft);
      if (maneShape) k.body('mane', maneShape, { color: C.black, roughness: 0.55 });

      // ------------------------------------------------------------------ horns and tusks: cream, darker at the root
      const hornRoot = sdf.raycast(headBase, [0.14, 2, 0.16], [0, -1, 0])!;
      const [hx, hy, hz] = hornRoot;
      const horns = pair(
        sdf
          .chain(
            [
              [hx - 0.01, hy - 0.03, hz, 0.052],
              [hx + 0.07, hy + 0.02, hz - 0.01, 0.047],
              [hx + 0.125, hy + 0.09, hz - 0.01, 0.036],
              [hx + 0.13, hy + 0.165, hz + 0.005, 0.022],
              [hx + 0.1, hy + 0.21, hz + 0.02, 0.008],
            ],
            0.02,
          )
          .paintFn((x, _y, _z, base) => mixRgb(rgb(T.ivoryBase), base, Math.max(0, Math.min(1, (x - hx - 0.02) / 0.08)))),
      );
      if (kind.horns !== false) k.body('horns', horns.bone('head'), { color: T.ivory, roughness: 0.4 });
      // Tusks grow from the corners of the mouth, out and up past the snout.
      const tuskRoot = sdf.surfacePoint(headBase, [0.1, MOUTH_Y + 0.02, 0.5], -0.02);
      const [tx, ty, tz] = tuskRoot;
      const tusks = pair(
        sdf.chain(
          [
            [tx, ty, tz, 0.028 * tr],
            [tx + 0.06 * ts, ty + 0.018 * ts, tz + 0.035 * ts, 0.026 * tr],
            [tx + 0.095 * ts, ty + 0.07 * ts, tz + 0.04 * ts, 0.019 * tr],
            [tx + 0.08 * ts, ty + 0.115 * ts, tz + 0.03 * ts, 0.007 * tr],
          ],
          0.015,
        ),
      );
      if (ts > 0) k.body('tusks', tusks.bone('head'), { color: T.ivory, roughness: 0.35 });

      // ------------------------------------------------------------------ hooves: split, black, glossy
      const hoof = (at: V3, bone: string) =>
        sdf
          .cylinder(0.074, 0.06, 0.016)
          .subtract(sdf.box([0.012, 0.1, 0.08]).at(0, -0.02, 0.06)) // cloven front
          .at(at[0], 0.03, at[2] + 0.014)
          .bone(bone);
      const hooves = sdf.union(pair(hoof(FKNEE, 'fshin.L')), pair(hoof(BKNEE, 'bshin.L')));
      if (kind.feet === 'paws') {
        // Three short claws on the front of each paw, in the ivory slot color.
        const clawsAt = (at: V3, bone: string) =>
          sdf.union(...[-0.04, 0, 0.04].map((dx) => sdf.cone([at[0] + dx, 0.03, at[2] + 0.1], [at[0] + dx * 1.15, 0.008, at[2] + 0.135], 0.014, 0.004))).bone(bone);
        k.body('claws', sdf.union(pair(clawsAt(FKNEE, 'fshin.L')), pair(clawsAt(BKNEE, 'bshin.L'))), { color: T.ivory, roughness: 0.35, detail: 0.003 });
      } else {
        k.body('hooves', hooves, { color: C.black, roughness: 0.35 });
      }
      kind.extra?.(k, boar);

      // ------------------------------------------------------------------ animation
      const { wave, bump } = motion;

      // Trot: diagonal pairs move together (front-left with back-right).
      const gait = (duration: number, swing: number, lift: number, bob: number, headDip: number) => ({
        duration,
        pose: (_t: number, p: number) => {
          const a = wave(p); // +1: front-left forward
          const liftA = Math.max(0, wave(p, 1, 0.25)); // raise the pair that is swinging forward
          const liftB = Math.max(0, -wave(p, 1, 0.25));
          return {
            hips: { move: [0, -bob * bump(p, 2), 0] as const, rotate: [0, 0, 3 * a] as const },
            spine: { rotate: [2 * wave(p, 2), 0, -3 * a] as const },
            neck: { rotate: [headDip, 0, 0] as const },
            head: { rotate: [-4 * wave(p, 2, 0.25), 4 * a, 0] as const },
            tail: { rotate: [10 * wave(p, 2), 25 * wave(p, 2, 0.1), 0] as const },
            'fleg.L': { rotate: [-swing * a, 0, 0] as const },
            'bleg.R': { rotate: [-swing * a, 0, 0] as const },
            'fleg.R': { rotate: [swing * a, 0, 0] as const },
            'bleg.L': { rotate: [swing * a, 0, 0] as const },
            'fshin.L': { rotate: [lift * liftA, 0, 0] as const },
            'bshin.R': { rotate: [-lift * liftA, 0, 0] as const },
            'fshin.R': { rotate: [lift * liftB, 0, 0] as const },
            'bshin.L': { rotate: [-lift * liftB, 0, 0] as const },
          };
        },
      });
      k.animation('walk', gait(0.7, 24, 38, 0.01, 0));
      k.animation('charge', gait(0.42, 40, 62, 0.028, 12));
      k.animation('idle', {
        duration: 3,
        pose: (_t, p) => ({
          spine: { move: [0, 0.004 * bump(p, 2), 0] },
          neck: { rotate: [4 * bump(p), 6 * wave(p, 1, 0.2), 0] },
          head: { rotate: [-6 * Math.max(0, wave(p, 3)) * bump(p), 0, 3 * wave(p)] }, // sniffing
          tail: { rotate: [0, 30 * wave(p, 4), 0] },
        }),
      });

      // A gore, solved by targets. The legs use two-bone IK (reach). The hind hooves stay planted and
      // roll onto the toe as the legs push; the front hooves take a short step forward in the charge
      // and a step back in the recovery. Each hoof rises until its lowest rim point touches the
      // ground, so no hoof goes into the floor.
      // Gather (0 to 0.3) and hold (to 0.4): the body rocks back and down over the bent hind legs,
      // the head drops until the snout is at knee height, and the horns and the tusks point forward.
      // Charge (0.4 to 0.56): the hips drive 0.2 m forward. Toss (0.52 to 0.64): the head hooks up
      // and to the boar's left, with the tusks leading. Hold (to 0.72), then recover to rest.
      const { keys, reach, follow } = motion;
      type P3 = Parameters<typeof reach>[1];
      const SPINE_J: P3 = [0, 0.35, 0.02];
      const HOOF_Y = 0.03; // the hoof center: the IK end joint
      const RIM_R = 0.058; // the center line of the hoof's rounded bottom edge
      const RIM_Y = 0.016;
      const rotX = (v: P3, deg: number, about: P3): P3 => {
        const a = (deg * Math.PI) / 180;
        const y = v[1] - about[1];
        const z = v[2] - about[2];
        return [v[0], about[1] + y * Math.cos(a) - z * Math.sin(a), about[2] + y * Math.sin(a) + z * Math.cos(a)];
      };
      const sub = (a: P3, b: P3): P3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
      const mx = (v: V3, s = -1): P3 => [s * v[0], v[1], v[2]];
      const mkLeg = (root: P3, mid: P3, front: boolean) => {
        const end: P3 = [mid[0], HOOF_Y, mid[2] + 0.014];
        // The front knees bend forward; the hind legs bend back, as in the rest pose.
        const pole: P3 = [mid[0], mid[1], mid[2] + (front ? 0.6 : -0.6)];
        const sole = Array.from({ length: 12 }, (_, i): P3 => {
          const a = (i / 12) * Math.PI * 2;
          return [end[0] + RIM_R * Math.cos(a), RIM_Y, end[2] + RIM_R * Math.sin(a)];
        });
        return { root, mid, end, pole, sole, front, rest: reach({ root, mid, end }, end, pole) };
      };
      const LEGS = {
        'fleg.L': mkLeg(mx(SHOULDER, 1), mx(FKNEE, 1), true),
        'fleg.R': mkLeg(mx(SHOULDER), mx(FKNEE), true),
        'bleg.L': mkLeg(mx(HIP, 1), mx(BKNEE, 1), false),
        'bleg.R': mkLeg(mx(HIP), mx(BKNEE), false),
      };
      // Rotations that put the hoof center at `target` (world), with the hips moved by `hm` and the
      // spine turned by `spineX`; the rest solution is taken off, so the rest target gives the rest pose.
      const solveLeg = (leg: ReturnType<typeof mkLeg>, spineX: number, hm: P3, target: P3) => {
        const spine: P3 = [spineX, 0, 0];
        const toLocal = (q: P3): P3 => {
          const l: P3 = [q[0] - hm[0], q[1] - hm[1], q[2] - hm[2]];
          return leg.front ? rotX(l, -spineX, SPINE_J) : l;
        };
        const lowest = (upper: P3, lower: P3) =>
          Math.min(
            ...leg.sole.map((s) => (leg.front ? follow([SPINE_J, leg.root, leg.mid], [spine, upper, lower], s) : follow([leg.root, leg.mid], [upper, lower], s))[1] + hm[1]),
          );
        let lift = 0;
        for (let i = 0; ; i++) {
          const r = reach(leg, toLocal([target[0], target[1] + lift, target[2]]), leg.pole);
          const upper = sub(r.upper, leg.rest.upper);
          const lower = sub(r.lower, leg.rest.lower);
          if (i === 4) return { upper, lower };
          lift = Math.max(0, lift + target[1] - HOOF_Y + RIM_Y - lowest(upper, lower));
        }
      };
      // A front hoof's step: forward by `dz` in the charge, back in the recovery, on a small arc.
      const step = (p: number, out: readonly [number, number], back: readonly [number, number], dz: number, h: number) => {
        const arc = (a: number, b: number, hh: number) => (p > a && p < b ? hh * Math.sin(((p - a) / (b - a)) * Math.PI) : 0);
        const z = keys(p, [[out[0], 0], [out[1], dz], [back[0], dz], [back[1], 0]]);
        return { z, y: arc(out[0], out[1], h) + arc(back[0], back[1], h * 0.7) };
      };
      k.animation('attack', {
        duration: 1.0,
        loop: false,
        pose: (_t, p) => {
          const hm: P3 = [
            0,
            keys(p, [[0, 0], [0.3, -0.035], [0.4, -0.04], [0.54, -0.045], [0.64, -0.02], [0.72, -0.022], [1, 0]] as const),
            keys(p, [[0, 0], [0.3, -0.045], [0.4, -0.05], [0.56, 0.15], [0.64, 0.155], [0.72, 0.145], [1, 0]] as const),
          ];
          const spineX = keys(p, [[0, 0], [0.3, 10], [0.4, 11], [0.54, 7], [0.64, -4], [0.72, -3], [1, 0]] as const);
          const hook = keys(p, [[0, 0], [0.4, 0], [0.52, -0.25], [0.64, 1], [0.72, 0.85], [1, 0]] as const);
          const fL = step(p, [0.42, 0.54], [0.74, 0.9], 0.13, 0.045);
          const fR = step(p, [0.46, 0.58], [0.78, 0.94], 0.12, 0.045);
          const front = (leg: ReturnType<typeof mkLeg>, s: { z: number; y: number }) =>
            solveLeg(leg, spineX, hm, [leg.end[0], HOOF_Y + s.y, leg.end[2] + s.z]);
          const lFL = front(LEGS['fleg.L'], fL);
          const lFR = front(LEGS['fleg.R'], fR);
          const lBL = solveLeg(LEGS['bleg.L'], spineX, hm, LEGS['bleg.L'].end);
          const lBR = solveLeg(LEGS['bleg.R'], spineX, hm, LEGS['bleg.R'].end);
          return {
            hips: { move: hm },
            spine: { rotate: [spineX, 0, 0] },
            neck: {
              rotate: [keys(p, [[0, 0], [0.3, 16], [0.4, 17], [0.54, 16], [0.64, -11], [0.72, -8], [1, 0]] as const), 12 * hook, 0],
              move: [0, 0, keys(p, [[0, 0], [0.3, 0.035], [0.54, 0.045], [0.66, 0.015], [1, 0]] as const)],
            },
            head: {
              rotate: [keys(p, [[0, 0], [0.3, 26], [0.4, 28], [0.52, 26], [0.64, -28], [0.72, -23], [1, 0]] as const), 30 * hook, 20 * hook],
            },
            tail: { rotate: [keys(p, [[0, 0], [0.3, 20], [0.45, 50], [0.7, 45], [1, 0]] as const), 15 * wave(p, 3), 0] },
            'fleg.L': { rotate: lFL.upper },
            'fshin.L': { rotate: lFL.lower },
            'fleg.R': { rotate: lFR.upper },
            'fshin.R': { rotate: lFR.lower },
            'bleg.L': { rotate: lBL.upper },
            'bshin.L': { rotate: lBL.lower },
            'bleg.R': { rotate: lBR.upper },
            'bshin.R': { rotate: lBR.lower },
          };
        },
      });

      // Hit, struck from the front-left: the head jerks up and back, the body flinches back and to
      // its right, and the tail flicks; then a quick return. The legs brace: each leg leans by the
      // angle that cancels the body's shift, so the hooves stay planted.
      const DEG = 180 / Math.PI;
      k.animation('hit', {
        duration: 0.4,
        loop: false,
        pose: (_t, p) => {
          const h = keys(p, [[0, 0], [0.16, 1], [0.34, 0.8], [1, 0]] as const);
          const flick = keys(p, [[0, 0], [0.12, 1], [0.45, -0.35], [0.8, 0.1], [1, 0]] as const);
          const back = 0.035 * h;
          const side = 0.018 * h;
          const lean = (legLength: number, d: number) => Math.asin(d / legLength) * DEG;
          const twist = 2.8 * h; // the spine's turn moves the left shoulder forward and the right one back
          return {
            hips: { move: [-side, 0.004 * h, -back] },
            spine: { rotate: [0, -6 * h, 0] },
            neck: { rotate: [-12 * h, -6 * h, 0] },
            head: { rotate: [-20 * h, -4 * h, 8 * h] },
            tail: { rotate: [40 * flick, 25 * flick, 0] },
            'fleg.L': { rotate: [-lean(0.27, back) + twist, 0, lean(0.27, side) + 1.5 * h] },
            'fleg.R': { rotate: [-lean(0.27, back) - twist, 0, lean(0.27, side) + 1.5 * h] },
            'bleg.L': { rotate: [-lean(0.25, back), 0, lean(0.25, side)] },
            'bleg.R': { rotate: [-lean(0.25, back), 0, lean(0.25, side)] },
          };
        },
      });

      // Death: a recoil and a stagger, the front legs buckle and the boar drops onto its knees, then
      // it rolls onto its right side and lies still, the legs out stiffly and the head on the ground.
      // Lying on its side the head is wider than the body, so the neck turns the head part of the way
      // back up: the lower horn then stays clear of the ground and the jowl carries the head.
      // The hips lift that keeps every part on or above the ground, measured per phase with the
      // rigid-bone ground probe (scratch tool); zero where the pose already clears the ground.
      const DEATH_LIFT: readonly (readonly [number, number])[] = [
        [0, 0], [0.225, 0], [0.25, 0.01], [0.275, 0.015], [0.3, 0.015], [0.325, 0.018], [0.35, 0.022],
        [0.375, 0.021], [0.4, 0.019], [0.425, 0.018], [0.45, 0.022], [0.475, 0.034], [0.5, 0.049],
        [0.525, 0.064], [0.55, 0.075], [0.575, 0.078], [0.6, 0.072], [0.625, 0.058], [0.65, 0.036],
        [0.675, 0.013], [0.7, 0.003], [0.725, 0],
      ];
      k.animation('death', {
        duration: 1.4,
        loop: false,
        pose: (_t, p) => {
          const recoil = keys(p, [[0, 0], [0.06, 1], [0.16, 0.3], [0.26, 0]] as const);
          const sway = keys(p, [[0.05, 0], [0.14, 1], [0.24, -0.5], [0.34, 0]] as const);
          const fold = keys(p, [[0.22, 0], [0.36, 1]] as const); // the front legs buckle at the knees
          const drop = keys(p, [[0.26, 0], [0.42, 1], [0.55, 0.9], [0.74, 0]] as const); // onto the knees
          const crouch = keys(p, [[0.26, 0], [0.42, 1]] as const);
          const roll = keys(p, [[0.42, 0], [0.74, 1]] as const); // over onto the right side
          const outL = keys(p, [[0.5, 0], [0.7, 1]] as const); // the upper legs kick out first
          const outR = keys(p, [[0.7, 0], [0.86, 1]] as const); // the lower legs slide out last
          const bounce = keys(p, [[0.72, 0], [0.78, 1], [0.86, 0]] as const);
          const twitch = Math.max(0, Math.sin((p - 0.86) * Math.PI * 12)) * Math.max(0, Math.min(1, (p - 0.86) / 0.03, (1 - p) / 0.06));
          const legZ = -5 * sway;
          const frontLeg = (f: number, out: number, side: number, tw: number) => ({
            upper: [-49 * f - 18 * out - tw, 0, legZ + side * out] as const,
            lower: [121 * f - 6 * out, 0, 0] as const,
          });
          const backLeg = (c: number, out: number, side: number, tw: number) => ({
            upper: [-57 * c + 18 * out + tw, 0, legZ + side * out] as const,
            lower: [70 * c + 4 * out, 0, 0] as const,
          });
          const fL = frontLeg(fold * (1 - outL), outL, 12, 6 * twitch);
          const fR = frontLeg(fold * (1 - outR), outR, 6, 0);
          const bL = backLeg(crouch * (1 - outL), outL, 12, 5 * twitch);
          const bR = backLeg(crouch * (1 - outR), outR, 6, 0);
          const y = 0.012 * Math.abs(sway) - 0.012 * drop * (1 - roll) - 0.075 * roll + 0.012 * bounce + keys(p, DEATH_LIFT, 'linear');
          return {
            hips: { move: [-0.02 * sway - 0.1 * roll, y, -0.03 * recoil], rotate: [18 * drop, 0, 5 * sway + 90 * roll] },
            spine: { rotate: [0, -6 * sway, 0] },
            neck: { rotate: [-16 * recoil + 10 * drop + 14 * roll, 0, -28 * roll] },
            head: { rotate: [-18 * recoil + 4 * drop + 6 * roll, 0, -8 * roll] },
            tail: { rotate: [40 * recoil - 25 * roll, 20 * sway, 0] },
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
      // Taunt, before a charge: the boar lowers its head until the horns and the tusks point at the
      // player, and its weight shifts back onto the hind legs. It snorts twice (the head jerks up a
      // little, and the body and the head shudder) and scrapes the ground twice with the left front
      // hoof: the hoof lifts, sets down ahead, draws back along the floor on its toe, and returns.
      // The other three hooves stay planted (the same IK as the attack), and the tail lashes. The
      // ears have no bones; they shake with the head.
      const TAUNT_S = 1.8;
      const SNORTS = [0.16, 0.5] as const; // the phase of each snort
      const SCRAPES = [0.2, 0.52] as const; // the start phase of each scrape
      const SCRAPE_LEN = 0.26;
      // The front legs are almost straight at rest, so a small drop of the shoulder bends the knee a
      // lot and tips the hoof. This gives the hips height that keeps a planted front leg at its rest
      // length while the body shifts back: the leg leans as one piece, and the hoof rolls a little
      // onto its heel (the hoof center rises until the lowest rim point touches the floor).
      const FR = LEGS['fleg.R'];
      const FRONT_LEN = Math.hypot(...sub(FR.root, FR.end)) - 0.0002;
      const FRONT_LEAN = Math.atan2(FR.root[2] - FR.end[2], FR.root[1] - FR.end[1]);
      const frontHold = (spineX: number, hx: number, hz: number) => {
        const sh = rotX(FR.root, spineX, SPINE_J);
        const dx = sh[0] + hx - FR.end[0];
        const dz = sh[2] + hz - FR.end[2];
        const dy = Math.sqrt(FRONT_LEN ** 2 - dx * dx - dz * dz);
        const tilt = Math.atan2(dz, dy) - FRONT_LEAN;
        const lift = (HOOF_Y - RIM_Y) * (Math.cos(tilt) - 1) + RIM_R * Math.abs(Math.sin(tilt));
        return HOOF_Y + lift + dy - sh[1];
      };
      k.animation('taunt', {
        duration: TAUNT_S,
        loop: false,
        pose: (t, p) => {
          const low = keys(p, [[0, 0], [0.14, 1], [0.8, 1], [0.96, 0]] as const); // head down, weight back
          let snort = 0;
          let shudder = 0;
          for (const s of SNORTS) {
            snort += keys(p, [[s - 0.001, 0], [s + 0.025, 1], [s + 0.11, 0]] as const);
            const dt = t - s * TAUNT_S;
            if (dt > 0) shudder += Math.exp(-dt / 0.1) * Math.sin(2 * Math.PI * 9 * dt);
          }
          // The scraping hoof, relative to its rest place: forward and up, down ahead, back along the
          // floor (dy = 0: solveLeg keeps the lowest rim point on the floor), then up and home.
          let dz = 0;
          let dy = 0;
          let lifted = 0;
          for (const a of SCRAPES) {
            const u = (p - a) / SCRAPE_LEN;
            if (u <= 0 || u >= 1) continue;
            dz += keys(u, [[0, 0], [0.28, 0.05], [0.36, 0.05], [0.74, -0.075], [1, 0]] as const);
            dy += keys(u, [[0, 0], [0.16, 0.065], [0.34, 0], [0.74, 0], [0.87, 0.05], [1, 0]] as const);
            lifted += keys(u, [[0, 0], [0.14, 1], [0.86, 1], [1, 0]] as const);
          }
          const spineX = 1.5 * low - 1.5 * snort + 1.2 * shudder;
          const hx = -0.01 * lifted;
          const hz = -0.02 * low - 0.008 * lifted;
          const hm: P3 = [hx, frontHold(spineX, hx, hz), hz];
          const fL = LEGS['fleg.L'];
          const lFL = solveLeg(fL, spineX, hm, [fL.end[0], HOOF_Y + dy, fL.end[2] + dz]);
          const lFR = solveLeg(LEGS['fleg.R'], spineX, hm, LEGS['fleg.R'].end);
          const lBL = solveLeg(LEGS['bleg.L'], spineX, hm, LEGS['bleg.L'].end);
          const lBR = solveLeg(LEGS['bleg.R'], spineX, hm, LEGS['bleg.R'].end);
          const lash = keys(p, [[0.08, 0], [0.2, 1], [0.8, 1], [0.94, 0]] as const);
          return {
            hips: { move: hm },
            spine: { rotate: [spineX, 0, 0] },
            neck: { rotate: [11 * low - 4 * snort, 0, 0] },
            head: { rotate: [19 * low - 9 * snort, 0, 4 * shudder] },
            tail: { rotate: [30 * lash + 10 * snort, 38 * lash * wave(p, 5), 0] },
            'fleg.L': { rotate: lFL.upper },
            'fshin.L': { rotate: lFL.lower },
            'fleg.R': { rotate: lFR.upper },
            'fshin.R': { rotate: lFR.lower },
            'bleg.L': { rotate: lBL.upper },
            'bshin.L': { rotate: lBL.lower },
            'bleg.R': { rotate: lBR.upper },
            'bshin.R': { rotate: lBR.lower },
          };
        },
      });
    },
  });
}
