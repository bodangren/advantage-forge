import { noise, sdf } from '../src/index.js';
import { deerAsset } from './parts/deer-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Goat — Chibi Quest wildlife (catalog `wildlife/land/goat`), about 0.8 m to the horn tips, faces
 * +Z. Target: docs/wildlife-mockups/goat_001.jpg (made with mmx).
 *
 * The deer of `assets/deer.ts` (body, head, rig, and clips from `assets/parts/deer-kind.ts`) at
 * 0.85 of its size, as a goat: short golden horns that curve back, floppy ears held out to the
 * sides with brown insides, a white beard, a white tuft on the forehead, a pink nose, a white coat
 * with brown patches, and black hooves; no fawn spots, bib, eye patches, or antlers.
 * Role: a farm and mountain animal for village and hamlet scenes; the horns, the beard, and the
 *   floppy ears read at 128 px.
 * Palette (60/30/10): white coat #f2e9d6; brown patches #8a5a3a; golden horns #c8a060; a pink
 *   nose and black hooves.
 */

export default scaleAsset(
  deerAsset({
    name: 'goat',
    description: 'Chibi goat: a big round head with glossy eyes, short golden horns curving back, floppy ears, a white beard and forehead tuft, a white coat with brown patches, and black hooves; quadruped rig.',
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
      // Horns: thick ridged curls from the crown, back and down beside the head.
      const BASE = [0.05, 0.83, 0.13] as const;
      const horn = sdf
        .chain([[0.05, 0.83, 0.13, 0.036], [0.08, 0.915, 0.1, 0.034], [0.11, 0.955, 0.035, 0.03], [0.13, 0.9, -0.02, 0.025], [0.14, 0.83, 0.0, 0.016]], 0.012)
        .paintFn((x, y, z, c) => {
          const d = Math.hypot(x - BASE[0], y - BASE[1], z - BASE[2]);
          const ring = Math.floor(d / 0.022) % 2 === 1 ? 0.82 : 1;
          return [c[0] * ring, c[1] * ring, c[2] * ring];
        });
      k.body('horns', horn.mirror('x'), { color: '#c8a060', roughness: 0.5, detail: 0.003, bone: 'head' });
      // A white beard from the chin, and a tuft on the forehead.
      const hair = (s: sdf.Shape) => s.displace(0.003, (x, y, z) => noise.fbm(x * 70, y * 30, z * 70, 2));
      const beard = hair(sdf.chain([[0, 0.575, 0.27, 0.03], [0, 0.53, 0.282, 0.025], [0, 0.48, 0.288, 0.01]], 0.015));
      k.body('beard', beard, { color: deer.tone('fur', '#f8f4ec', 0.2), roughness: 0.9, detail: 0.003, bone: 'jaw' });
      const tuft = sdf.smoothUnion(0.015, sdf.ellipsoid([0.055, 0.03, 0.045]).rotateX(-25).at(0, 0.855, 0.2), sdf.ellipsoid([0.03, 0.022, 0.03]).at(0.012, 0.885, 0.235));
      k.body('tuft', tuft, { color: deer.tint.fur, roughness: 0.85, detail: 0.003, bone: 'head' });
    },
  }),
  0.85,
);
