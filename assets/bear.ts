import { profile, sdf } from '../src/index.js';
import { boarAsset } from './parts/boar-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Bear — Chibi Quest wildlife (catalog `wildlife/forest/bear`), a brown bear cub about 0.62 m tall
 * at the ears and 0.75 m from nose to tail, faces +Z. Target: docs/wildlife-mockups/bear_001.jpg
 * (made with mmx).
 *
 * The dire bear of `assets/dire-bear.ts` (body, head, rig, and clips from
 * `assets/parts/boar-kind.ts`) at 0.82 of its size, as a friendly bear cub: small glossy dark eyes
 * set into the face without brows or lid rings, a long tan muzzle with a black nose and a small
 * mouth, round ears with dark insides, and black paws without claws. The dire bear stays the angry
 * monster of the kind.
 * Role: a forest and mountain animal; the round ears and the tan muzzle read at 128 px.
 * Palette (60/30/10): brown fur #8a5434 (darker legs and back, lighter belly); a tan muzzle
 *   #e0b886; black paws; a black nose; dark eyes with a white glint.
 */
export default scaleAsset(
  boarAsset({
    name: 'bear',
    description: 'Chibi bear: a friendly brown bear cub with a big round head, round ears, a long tan muzzle with a black nose and a small mouth, small glossy dark eyes set into the face, a round body, black paws, and a stub tail; quadruped rig.',
    reference: 'docs/wildlife-mockups/bear_001.jpg',
    variants: {
      fur: { brown: '#8a5434', black: '#3a3230', honey: '#b07a40', grey: '#7a6a5e' },
      skin: { tan: '#e0b886', cream: '#f0dcb4', grey: '#b8b0a4' },
      eyes: { brown: '#6a3a1e', amber: '#8a5a1a', blue: '#3a5a8a' },
    },
    presets: {
      black: { fur: 'black', skin: 'tan', eyes: 'amber' },
      honey: { fur: 'honey', skin: 'cream', eyes: 'brown' },
      grizzly: { fur: 'grey', skin: 'grey', eyes: 'blue' },
    },
    colors: { furDark: '#5e3620', belly: '#a87048', earInner: '#5e3620', black: '#4a2a18', nostril: '#1a1416', ivoryBase: '#2a1e18' },
    // No claws, horns, or tusks: the unused ivory color follows the skin slot.
    ivorySlot: 'skin',
    horns: false,
    tuskScale: 0,
    mane: false,
    snout: 'bear',
    ears: 'round',
    feet: 'paws',
    eyeScale: 1.4,
    eyeInset: 0.018,
    eyeGlow: 0,
    muzzleLength: 1.55,
    muzzleWidth: 1.4,
    legLength: 0.05,
    flatPaws: true,
    claws: false,
    mouth: false,
    brows: false,
    lids: false,
    extra(k, boar) {
      // Soft upper lids in the fur color: a thin cap over the top of each eye, tilted down at the
      // outer corner.
      const { center: c, r } = boar.eye;
      const n = Math.hypot(0.25, 1);
      const lid = sdf
        .sphere(r + 0.005)
        .at(...c)
        .subtract(sdf.sphere(r + 0.001).at(...c))
        .intersect(sdf.halfSpace([-0.25 / n, -1 / n, 0], (-(c[1] + r * 0.35) - 0.25 * c[0]) / n));
      k.body('lids', lid.mirror('x').bone('head'), { color: boar.tint.fur, roughness: 0.6, detail: 0.003 });
    },
    paint(fur, boar) {
      // Black paws, and a small mouth under the nose: a short line down from the nose that opens
      // into two small curves.
      const nose = boar.faceHit(0, 0.415);
      const MY = nose[1] - 0.05;
      const line = sdf.box([0.005, 0.022, 0.3]).at(0, MY + 0.02, nose[2]);
      const curves = sdf.extrude(profile.arc(0.011, 0.005, 210, 330), 0.3).at(0.0105, MY + 0.02, nose[2]).mirror('x');
      // The tan of the muzzle wraps under the chin.
      const chin = sdf.ellipsoid([0.1, 0.05, 0.11]).at(0, 0.31, 0.44);
      return fur
        .paintWhere(chin, boar.tint.snout, 0.02)
        .paintWhere(sdf.box([0.6, 0.2, 1.2]).at(0, 0, 0), boar.tone('fur', '#1e1816', 0.15), 0.006)
        .paintWhere(sdf.union(line, curves).intersect(sdf.halfSpace([0, 0, -1], -(nose[2] - 0.08))), '#2a1a14', 0.002);
    },
  }),
  0.82,
);
