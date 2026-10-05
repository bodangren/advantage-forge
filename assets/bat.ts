import { sitterAsset } from './parts/sitter-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Bat — Chibi Quest wildlife (catalog `wildlife/forest/bat`), a small brown fruit bat about 0.42 m
 * tall to the ear tips and 0.5 m across the wings, faces +Z. Target:
 * docs/wildlife-mockups/bat_001.jpg (made with mmx).
 *
 * The sitter of `assets/parts/sitter-kind.ts` (a big head on a small upright body, small feet, front
 * paws at the chest, rig, and clips) at 0.55 of its size, with wings, as a friendly fruit bat: a
 * big brown head with a cream face mask (the lower face and round the eyes, a brown V down the
 * forehead), big pointed ears with orange rims and dark insides, big glossy eyes with white rings,
 * a dark round nose, and a small smile; a brown body with a cream belly, small orange feet, and
 * brown wings spread at the sides. The move clip is a short flight.
 * Role: ambient life in caves, towers, and night scenes; the ears and the wings read at 128 px.
 *   The giant bat (`assets/parts/bat-kind.ts`) stays the purple monster.
 * Palette (60/30/10): brown fur #9a5a36; cream face and belly #f0c88a; orange ear rims and feet
 *   #d8813e; dark eyes and nose.
 */
export default scaleAsset(
  sitterAsset({
    name: 'bat',
    description: 'Chibi bat: a small brown fruit bat with a big head, a cream face mask and belly, big pointed ears with orange rims and dark insides, big glossy eyes with white rings, a dark nose, a small smile, small orange feet, and brown wings spread at the sides; sitter rig with a short flight.',
    reference: 'docs/wildlife-mockups/bat_001.jpg',
    variants: {
      fur: { brown: '#9a5a36', grey: '#6a6460', black: '#3a3436', golden: '#b0823e' },
      markings: { cream: '#f0c88a', pale: '#eadcc4', tan: '#c8a070' },
      trim: { orange: '#d8813e', tan: '#b88a5a', grey: '#8a8280' },
      eyes: { brown: '#6a3a1e', dark: '#2a1a12', amber: '#a86a1a' },
    },
    presets: {
      grey: { fur: 'grey', markings: 'pale', trim: 'grey', eyes: 'dark' },
      black: { fur: 'black', markings: 'tan', trim: 'tan', eyes: 'amber' },
      golden: { fur: 'golden', markings: 'cream', trim: 'orange', eyes: 'brown' },
    },
    colors: { earInner: '#6a3a22', wing: '#7a4428' },
    ears: 'pointed',
    earScale: 1.15,
    earSlot: 'trim',
    mask: 'v',
    sclera: true,
    eyeScale: 1.15,
    feet: 'small',
    feetSlot: 'trim',
    nose: 'dark',
    mouth: 'smile',
    tail: false,
    wings: true,
  }),
  0.55,
);
