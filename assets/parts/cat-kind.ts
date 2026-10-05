import { sdf } from '../../src/index.js';
import type { AssetContext, AssetDefinition } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';
import { scaleAsset } from './scale-asset.js';
import type { WolfShape } from './wolf-kind.js';
import { wolfAsset } from './wolf-kind.js';

/**
 * Cat kinds — the village cat and the familiar cat on the wolf kind (`assets/parts/wolf-kind.ts`)
 * at 0.6 of the dire wolf's size: pointed ears with pink insides, big painted eyes, a small pink
 * nose, whiskers, a smooth chest, no cheek tufts, brows, forelock, or claws, and a long thin tail
 * on the tail bone that curls up at the cat's side. A kind sets the slots, the stripes, and extras (a
 * collar and a charm).
 */

type V3 = readonly [number, number, number];

/** The tail tip before the kind's 0.6 scale (a charm on the tail tip goes here). */
export const CAT_TAIL_TIP: V3 = [0.08, 0.52, -0.22];

export interface CatKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `fur`, `markings`, and `eyes` (and one more); the first option of each is the default. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  readonly colors?: { earInner?: string; eyeRim?: string; furDark?: string; furLight?: string; nose?: string; whisker?: string };
  /** Tabby stripes on the forehead, the back, and the legs, in this color that follows the fur slot (none if left out). */
  readonly stripes?: string;
  readonly eyeGlow?: number;
  /** The tail tip in the markings color (default false). */
  readonly tailTip?: boolean;
  /** The size of the painted eyes (default 1.45) and of the pupils inside them (default 1.7). */
  readonly eyeScale?: number;
  readonly pupilScale?: number;
  /** Two short dark lashes at the outer top corner of each eye (default false). */
  readonly lashes?: boolean;
  /** True: a `sit` clip (see the wolf kind). */
  readonly sit?: boolean;
  extra?(k: AssetContext, w: WolfShape): void;
}

export function catAsset(kind: CatKind): AssetDefinition {
  return scaleAsset(
    wolfAsset({
      name: kind.name,
      description: kind.description,
      reference: kind.reference,
      variants: kind.variants,
      ...(kind.presets ? { presets: kind.presets } : {}),
      // The kind darkens the lower legs to `furDark`; a cat keeps its fur color down to the paws.
      colors: { furLight: '#fff6ec', furDark: Object.values(kind.variants.fur ?? {})[0] as string, earInner: '#f0a8a8', eyeRim: '#1a1a10', nose: '#e88a8a', ...kind.colors },
      // A tiny closed mouth under the nose, with no fangs.
      smileArc: [263, 277],
      fangs: false,
      noseScale: 0.6,
      earScale: 0.9,
      eyeScale: kind.eyeScale ?? 1.45,
      pupilScale: kind.pupilScale ?? 1.7,
      ...(kind.eyeGlow ? { eyeGlow: kind.eyeGlow } : {}),
      brows: false,
      forelock: false,
      smile: true,
      cheekTufts: false,
      ruff: 'smooth',
      claws: false,
      tail: false,
      ...(kind.sit ? { sit: true } : {}),
      paint(furIn, t, tone) {
        // White paws (only the paws, no stockings).
        const fur = furIn.paintWhere(sdf.halfSpace([0, 1, 0], 0.045), t.markings, 0.012);
        if (!kind.stripes) return fur;
        const color = tone('fur', kind.stripes);
        // Three short stripes on the forehead, bands across the back, and rings on the legs.
        const forehead = sdf.union(...[-0.04, 0, 0.04].map((x) => sdf.box([0.014, 0.06, 0.6], 0.006).rotateZ(x * 150).at(x, 0.64 - Math.abs(x) * 0.4, 0)));
        const back = sdf.union(...[0.06, -0.03, -0.12, -0.21].map((z) => sdf.box([0.5, 0.2, 0.026], 0.008).rotateX(15).at(0, 0.45, z))).intersect(sdf.halfSpace([0, -1, 0], -0.33));
        const legRings = sdf
          .union(...[0.13, 0.19].flatMap((y) => [sdf.cylinder(0.08, 0.016).at(0.105, y, 0.08), sdf.cylinder(0.08, 0.016).at(0.105, y, -0.21)]))
          .mirror('x');
        return fur.paintWhere(forehead.intersect(sdf.halfSpace([0, 0, -1], -0.2)), color, 0.004).paintWhere(back, color, 0.008).paintWhere(legRings, color, 0.006);
      },
      extra(k, w) {
        // Whiskers: three thin strokes from each side of the muzzle.
        const wh = (dy: number, out: number): V3 => [0.2, 0.43 + dy + out, 0.3];
        const whiskers = sdf
          .union(...[-0.018, 0, 0.018].map((dy, i) => sdf.capsule([0.1, 0.43 + dy, 0.33], wh(dy, (i - 1) * 0.02), 0.0035)))
          .mirror('x');
        k.body('whiskers', whiskers, { color: kind.colors?.whisker ?? '#3a2a24', roughness: 0.6, detail: 0.002, bone: 'head' });
        // The long tail: back from the rump, out to the cat's left side, and up in a curl, like a
        // question mark seen from behind.
        const tail = sdf.chain(
          [
            [0, 0.3, -0.28, 0.028],
            [0.06, 0.29, -0.36, 0.027],
            [0.14, 0.33, -0.38, 0.026],
            [0.19, 0.43, -0.33, 0.025],
            [0.18, 0.53, -0.27, 0.023],
            [0.12, 0.56, -0.24, 0.021],
            [CAT_TAIL_TIP[0], CAT_TAIL_TIP[1], CAT_TAIL_TIP[2], 0.019],
          ],
          0.03,
        );
        const tipped = kind.tailTip ? tail.paintWhere(sdf.sphere(0.05).at(...CAT_TAIL_TIP), w.tint.markings, 0.01) : tail;
        k.body('tail-fur', tipped.bone('tail'), { color: w.tint.fur, roughness: 0.85 });
        if (kind.lashes) {
          // Two short dark lashes at the outer top corner of each eye.
          const e = w.eye;
          const r = 0.031 * (kind.eyeScale ?? 1.45) * 1.08;
          const lashes = sdf
            .union(
              ...[30, 52].map((deg) => {
                const a = (deg * Math.PI) / 180;
                const base: V3 = [e[0] + Math.cos(a) * r, e[1] + Math.sin(a) * r, e[2] - 0.004];
                return sdf.cone(base, [base[0] + Math.cos(a) * 0.02, base[1] + Math.sin(a) * 0.018, base[2] - 0.004], 0.005, 0.0015);
              }),
            )
            .mirror('x');
          k.body('lashes', lashes.bone('head'), { color: '#1a100a', roughness: 0.6, detail: 0.002 });
        }
        kind.extra?.(k, w);
      },
    }),
    0.6,
  );
}
