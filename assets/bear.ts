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
      eyes: { dark: '#2a1a12', amber: '#8a5a1a', blue: '#3a5a8a' },
    },
    presets: {
      black: { fur: 'black', skin: 'tan', eyes: 'amber' },
      honey: { fur: 'honey', skin: 'cream', eyes: 'dark' },
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
    eyeScale: 1.2,
    eyeInset: 0.018,
    eyeGlow: 0,
    muzzleLength: 1.3,
    claws: false,
    mouth: false,
    brows: false,
    lids: false,
    paint(fur, boar) {
      // Black paws, and a small mouth under the nose: a short line down from the nose that opens
      // into two small curves.
      const nose = boar.faceHit(0, 0.415);
      const MY = nose[1] - 0.05;
      const line = sdf.box([0.006, 0.03, 0.3]).at(0, MY + 0.016, nose[2]);
      const curves = sdf.extrude(profile.arc(0.018, 0.006, 200, 340), 0.3).at(0.017, MY + 0.016, nose[2]).mirror('x');
      return fur
        .paintWhere(sdf.box([0.6, 0.2, 1.2]).at(0, 0, 0), boar.tone('fur', '#1e1816', 0.15), 0.006)
        .paintWhere(sdf.union(line, curves).intersect(sdf.halfSpace([0, 0, -1], -(nose[2] - 0.08))), '#2a1a14', 0.002);
    },
  }),
  0.82,
);
