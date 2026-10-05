import { motion, profile, sdf } from '../../src/index.js';
import type { AssetDefinition } from '../../src/index.js';
import type { VariantPresets, VariantSlots } from '../../src/variants.js';
import { spiderAsset } from './spider-kind.js';

/**
 * Crab kinds — the giant crab of `assets/giant-crab.ts` (catalog `monsters/beast/giant-crab`): the
 * giant spider of `assets/parts/spider-kind.ts` with a wide low red shell
 * and a cream underside, eyeballs on stalks, two big raised claws on arm bones (the outer finger of
 * each claw opens on its own bone), and the spider's eight legs and clips. A kind sets the slots
 * and the face on the shell. The design notes are in `assets/giant-crab.ts`. The wildlife crab
 * (`assets/crab.ts`) is a round clay-toy crab of its own and does not use this kind.
 */

type V3 = [number, number, number];
const mxv = (p: V3): V3 => [-p[0], p[1], p[2]];

// A claw arm (left): the root in the side of the shell, the elbow, and the wrist; the outer finger
// pivots at NIP.
const ARM_ROOT: V3 = [0.22, 0.27, 0.12];
const ARM_ELBOW: V3 = [0.34, 0.39, 0.16];
const ARM_WRIST: V3 = [0.34, 0.51, 0.16];
const NIP: V3 = [0.4, 0.66, 0.16];

/** A crab kind: the slots and the face on the shell. */
export interface CrabKind {
  readonly name: string;
  readonly description: string;
  readonly reference: string;
  /** Slots `body`, `markings` (the underside), and `eyes`; the first option of each is the default. */
  readonly variants: VariantSlots;
  readonly presets?: VariantPresets;
  /** The face painted on the shell front: two dot eyes and a flat mouth (default), or pink cheeks and a smile. */
  readonly mood?: 'grumpy' | 'happy';
}

export function crabAsset(kind: CrabKind): AssetDefinition {
  return spiderAsset({
    name: kind.name,
    description: kind.description,
    reference: kind.reference,
    variants: kind.variants,
    ...(kind.presets ? { presets: kind.presets } : {}),
    colors: { bodyDark: '#b83a2a', claw: '#2a1a1a' },
    head: { size: [0.29, 0.2, 0.23], at: [0, 0.34, 0.1] },
    abdomen: false,
    web: false,
    chestMark: false,
    fangScale: 0,
    bands: 'none',
    face: {
      build(k, s) {
        // Two eyeballs on short stalks on the top of the shell, looking forward.
        const stalk = (x: number) => {
          const t = s.topHit(x, 0.12);
          return { base: t, top: [t[0] + x * 0.15, t[1] + 0.08, t[2] + 0.01] as V3 };
        };
        const L = stalk(0.07);
        const stalks = sdf.capsule([L.base[0], L.base[1] - 0.02, L.base[2]], L.top, 0.022).mirror('x');
        k.body('stalks', s.headPose(stalks), {
          color: s.tint.body,
          roughness: 0.6,
          bone: 'head',
          detail: 0.004,
        });
        const c: V3 = [L.top[0], L.top[1] + 0.055, L.top[2]];
        const ball = sdf
          .sphere(0.066)
          .at(...c)
          .paintWhere(sdf.sphere(0.036).at(c[0] - 0.007, c[1] - 0.005, c[2] + 0.054), s.tint.eye, 0.002)
          .paintWhere(sdf.sphere(0.011).at(c[0] + 0.01, c[1] + 0.014, c[2] + 0.065), '#ffffff', 0.002);
        k.body('eyeballs', s.headPose(ball.mirror('x')), {
          color: '#fbfaf6',
          roughness: 0.15,
          bone: 'head',
          textureDensity: 2,
          detail: 0.003,
        });
      },
      paint(carapace, s) {
        // The cream underside below the rim of the shell, and the face on its front: grumpy (two dot
        // eyes and a flat mouth) or happy (pink cheeks and a smile).
        const through = (p: ReturnType<typeof profile.circle>, x: number, y: number) =>
          sdf.extrude(p, 0.2).at(x, y, s.faceHit(Math.abs(x), y)[2]);
        const under = carapace.paintWhere(
          sdf.halfSpace([0, 1, 0], 0.215),
          s.tone('markings', '#f4e4c8'),
          0.012,
        );
        if (kind.mood === 'happy') {
          const smile = sdf
            .extrude(profile.arc(0.07, 0.016, 210, 330), 0.2)
            .at(0, 0.36, s.faceHit(0, 0.3)[2]);
          const cheeks = sdf.union(
            through(profile.circle(0.03), 0.15, 0.33),
            through(profile.circle(0.03), -0.15, 0.33),
          );
          return under
            .paintWhere(s.headPose(cheeks), s.tone('body', '#f49a9a', 0.3), 0.01)
            .paintWhere(s.headPose(smile), s.tone('eyes', '#1a1416'), 0.002);
        }
        const dots = sdf.union(
          through(profile.circle(0.026), 0.09, 0.37),
          through(profile.circle(0.026), -0.09, 0.37),
        );
        const mouth = through(profile.rect([0.12, 0.018], 0.008), 0, 0.3);
        return under.paintWhere(s.headPose(sdf.union(dots, mouth)), s.tone('eyes', '#1a1416'), 0.002);
      },
    },
    bones: {
      'arm.L': { parent: 'body', at: ARM_ROOT },
      'claw.L': { parent: 'arm.L', at: ARM_WRIST },
      'nip.L': { parent: 'claw.L', at: NIP, tail: [0.43, 0.78, 0.16] },
      'arm.R': { parent: 'body', at: mxv(ARM_ROOT) },
      'claw.R': { parent: 'arm.R', at: mxv(ARM_WRIST) },
      'nip.R': { parent: 'claw.R', at: mxv(NIP), tail: [-0.43, 0.78, 0.16] },
    },
    extra(k, s) {
      // A claw: an arm in two parts, a big palm with the inner finger, and the outer finger.
      const arm = sdf
        .smoothUnion(
          0.02,
          sdf.chain(
            [
              [...ARM_ROOT, 0.045],
              [...ARM_ELBOW, 0.055],
            ],
            0.01,
          ),
          sdf.chain(
            [
              [...ARM_ELBOW, 0.055],
              [...ARM_WRIST, 0.06],
            ],
            0.01,
          ),
        )
        .bone('arm.L');
      const palm = sdf
        .smoothUnion(
          0.02,
          sdf.ellipsoid([0.11, 0.12, 0.09]).at(0.34, 0.6, 0.16),
          sdf.cone([0.31, 0.68, 0.16], [0.28, 0.83, 0.16], 0.07, 0.03),
        )
        .bone('claw.L');
      const finger = sdf.cone(NIP, [0.43, 0.78, 0.16], 0.058, 0.026).bone('nip.L');
      k.body('claws', sdf.smoothUnion(0.018, arm, palm).union(finger).mirror('x'), {
        color: s.tint.body,
        roughness: 0.6,
      });
    },
    pose(clip, p) {
      const { wave, keys } = motion;
      // The claws snap now and then; the arms bob with the walk.
      let open = 8 + 8 * Math.max(0, wave(p, clip === 'idle' ? 2 : 1, 0.2));
      let fwd = 4 * wave(p, clip === 'run' ? 2 : 1);
      let out = 0;
      if (clip === 'attack') {
        // The claws swing forward and open wide in the rear-up, then snap shut on the bite.
        fwd = keys(p, [
          [0, 0],
          [0.3, -12],
          [0.42, -14],
          [0.48, 40],
          [0.62, 36],
          [1, 0],
        ] as const);
        open = keys(p, [
          [0, 8],
          [0.3, 34],
          [0.44, 36],
          [0.48, -6],
          [0.62, -6],
          [1, 8],
        ] as const);
      } else if (clip === 'hit') {
        fwd = keys(p, [
          [0, 0],
          [0.2, -18],
          [1, 0],
        ] as const);
        out = keys(p, [
          [0, 0],
          [0.2, 14],
          [1, 0],
        ] as const);
      } else if (clip === 'death') {
        out = keys(p, [
          [0, 0],
          [0.5, 40],
          [1, 46],
        ] as const);
        open = keys(p, [
          [0, 8],
          [0.5, 20],
          [1, 20],
        ] as const);
      }
      return {
        'arm.L': { rotate: [fwd, 0, -out] },
        'arm.R': { rotate: [fwd, 0, out] },
        'nip.L': { rotate: [0, 0, -open] },
        'nip.R': { rotate: [0, 0, open] },
      };
    },
  });
}
