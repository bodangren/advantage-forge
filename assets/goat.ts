import { noise, sdf } from '../src/index.js';
import { deerAsset } from './parts/deer-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Goat — Chibi Quest wildlife (catalog `wildlife/land/goat`), about 0.8 m to the horn tips, faces
 * +Z. Target: docs/wildlife-mockups/goat_001.jpg (made with mmx).
 *
 * The deer of `assets/deer.ts` (body, head, rig, and clips from `assets/parts/deer-kind.ts`) at
 * 0.85 of its size, as a goat: short golden horns that curl back, floppy ears held out to the
 * sides with brown insides, a swept white forelock, a fluffy chest tuft, a pink nose, a white coat
 * with brown patches, and black hooves; no beard, fawn spots, bib, eye patches, or antlers.
 * Role: a farm and mountain animal for village and hamlet scenes; the horns, the forelock, and the
 *   floppy ears read at 128 px.
 * Palette (60/30/10): white coat #f2e9d6; brown patches #8a5a3a; golden horns #c8a060; a pink
 *   nose and black hooves.
 */

export default scaleAsset(
  deerAsset({
    name: 'goat',
    description: 'Chibi goat: a big round head with glossy eyes, short golden horns curving back, floppy ears, a swept forelock, a fluffy chest tuft, a white coat with brown patches, and black hooves; quadruped rig.',
    reference: 'docs/wildlife-mockups/goat_001.jpg',
    variants: {
      fur: { white: '#f2e9d6', cream: '#e6d2b0', brown: '#9a6a44', black: '#3a3230' },
      eyes: { brown: '#5a3418', amber: '#a87a2a', dark: '#2a1a12' },
      patch: { brown: '#8a5a3a', black: '#2e2826', grey: '#8a8580' },
    },
    presets: {
      cream: { fur: 'cream', eyes: 'amber', patch: 'brown' },
      brown: { fur: 'brown', eyes: 'amber', patch: 'black' },
      black: { fur: 'black', eyes: 'amber', patch: 'grey' },
    },
    colors: { cream: '#efe6d6', earInner: '#9a6a4a', nose: '#c88a7a', mouth: '#8a5a4a', hoof: '#221c1a' },
    mask: false,
    bib: false,
    spots: false,
    antlers: false,
    legThick: 1.35,
    legLength: -0.05,
    earTilt: -122,
    earTurn: 28,
    headProbes: [[0.15, 0.82, 0.0], [-0.15, 0.82, 0.0], [0.12, 0.96, 0.04], [-0.12, 0.96, 0.04], [0, 0.47, 0.285]],
    paint(fur, deer) {
      const patch = deer.tone('patch', '#8a5a3a');
      return fur
        .paintWhere(sdf.ellipsoid([0.075, 0.065, 0.065]).at(0.1, 0.42, -0.19), patch, 0.01)
        .paintWhere(sdf.ellipsoid([0.06, 0.05, 0.05]).at(-0.1, 0.39, 0.06), patch, 0.008);
    },
    extra(k, deer) {
      // Horns: thick ridged curls from the crown that sweep back round the side of the head and
      // curl down and forward at the end.
      const BASE = [0.05, 0.83, 0.13] as const;
      const horn = sdf
        .chain(
          [
            [0.06, 0.83, 0.12, 0.036],
            [0.1, 0.905, 0.085, 0.034],
            [0.135, 0.93, 0.01, 0.031],
            [0.16, 0.875, -0.045, 0.027],
            [0.175, 0.795, -0.025, 0.022],
            [0.175, 0.765, 0.035, 0.016],
          ],
          0.012,
        )
        .paintFn((x, y, z, c) => {
          const d = Math.hypot(x - BASE[0], y - BASE[1], z - BASE[2]);
          const ring = Math.floor(d / 0.022) % 2 === 1 ? 0.82 : 1;
          return [c[0] * ring, c[1] * ring, c[2] * ring];
        });
      k.body('horns', horn.mirror('x'), { color: '#c8a060', roughness: 0.5, detail: 0.003, bone: 'head' });
      // No beard. A swept forelock on the forehead that curls forward and down at its tip, and a
      // small lock beside it.
      const lock = (x: number, s: number) =>
        sdf.chain(
          [
            [x, 0.835, 0.13, 0.034 * s],
            [x + 0.01 * s, 0.885, 0.175, 0.03 * s],
            [x + 0.02 * s, 0.9, 0.225, 0.022 * s],
            [x + 0.02 * s, 0.875, 0.255, 0.012 * s],
          ],
          0.01,
        );
      const tuft = sdf.smoothUnion(0.012, lock(-0.01, 1), lock(0.025, 0.7));
      k.body('tuft', tuft, { color: deer.tint.fur, roughness: 0.85, detail: 0.003, bone: 'head' });
      // A fluffy chest tuft: soft points that hang down in a V on the front of the chest.
      const hair = (s: sdf.Shape) => s.displace(0.002, (x, y, z) => noise.fbm(x * 70, y * 30, z * 70, 2));
      const fluff = hair(
        sdf.smoothUnion(
          0.012,
          ...[-0.04, -0.02, 0, 0.02, 0.04].map((x, i) => sdf.cone([x, 0.5, 0.155], [x * 0.6, 0.43 - (2 - Math.abs(i - 2)) * 0.02, 0.175], 0.024, 0.006)),
        ),
      );
      k.body('chest-fluff', fluff, { color: deer.tone('fur', '#f8f4ec', 0.2), roughness: 0.9, detail: 0.003, bone: 'spine' });
    },
  }),
  0.85,
);
