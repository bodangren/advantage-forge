import { sdf } from '../src/index.js';
import { ogreAsset, ogrePauldrons } from './parts/ogre-kind.js';

/**
 * Frost giant — Chibi Quest monster (catalog `monsters/giant-and-ancient/frost-giant`), about 1.5 m
 * to the top of its head (1.7 m to the horn tips), faces +Z. Target:
 * docs/monster-mockups/frost-giant_001.jpg (made with mmx).
 *
 * The ogre brute (`assets/ogre-brute.ts`; body, rig, and clips from `assets/parts/ogre-kind.ts`)
 * as a frost giant, bigger: pale ice-blue skin, a broad nose (no tusks), a big white beard and
 * side locks, a steel-blue horned helmet with a crest, steel-blue shoulder plates, a white fur
 * loincloth, and a frozen club with an ice spike.
 * Role: the frost brute of the giant family; the white beard and the horned helmet read at 128 px.
 * Palette (60/30/10): ice-blue skin #9cc8e0 (a lighter belly); a white beard and fur #eef2f6;
 *   steel blue armor #6a8aa8; the ice spike as the accent.
 * Bodies added: helmet and horns (rigid on the head), pauldrons (tagged to the upper arms).
 */
export default ogreAsset({
  name: 'frost-giant',
  description:
    'Chibi frost giant monster: a big ice-blue giant with a big white beard, a steel-blue horned helmet, steel-blue shoulder plates and bracers, a white fur loincloth, and a frozen club with an ice spike.',
  reference: 'docs/monster-mockups/frost-giant_001.jpg',
  scale: 1.45,
  headScale: 1.12,
  variants: {
    skin: { ice: '#9cc8e0', frost: '#b8d4e4', glacier: '#7ab0c8' },
    cloth: { snow: '#e8eef4', grey: '#a8b0b8', blue: '#5a7aa0' },
    leather: { steel: '#6a8aa8', silver: '#a8b4c4', navy: '#3a4a6a' },
    mane: { white: '#eef2f6', silver: '#c8d0d8', pale: '#e0e8d8' },
  },
  presets: {
    glacier: { skin: 'glacier', cloth: 'blue', leather: 'silver', mane: 'silver' },
    rime: { skin: 'frost', cloth: 'grey', leather: 'navy', mane: 'pale' },
  },
  colors: {
    skinDark: '#7aa4c0',
    skinLight: '#c0e0f0',
    lid: '#7aa4c0',
    mouth: '#3a4a6a',
    sclera: '#f8fcff',
    eye: '#1a2a4a',
    redDark: '#c4ccd8',
    hide: '#c8d0dc',
    leatherDark: '#4a6080',
    maneShade: '#b8c8d8',
    maneHi: '#ffffff',
    wood: '#5a6878',
    stone: '#c8eaf8',
    rope: '#a8b4c4',
    ropeDark: '#7a8898',
  },
  nose: 'human',
  tusks: 0,
  mane: { tuft: false },
  extra(_k, o) {
    // The helmet (head space): a cap over the skull above the brows, a thick rim, and a ridge
    // from the brow to the back; two horns rise from its sides.
    const above = (y: number) => sdf.halfSpace([0, -1, 0], -y);
    const cap = o.headShape.round(0.024).intersect(above(0.79));
    const rim = o.headShape.round(0.034).intersect(above(0.785)).intersect(sdf.halfSpace([0, 1, 0], 0.82));
    const ridge = sdf.ellipsoid([0.024, 0.07, 0.21]).at(0, 0.9, -0.01);
    const helmet = sdf.smoothUnion(0.012, cap, rim, ridge);
    o.put('helmet', o.head(helmet), { color: o.tint.leather, roughness: 0.4, metalness: 0.55, bone: 'head', detail: 0.005 });
    const horn = sdf.chain(
      [
        [0.16, 0.83, -0.02, 0.046],
        [0.235, 0.88, -0.03, 0.038],
        [0.27, 0.97, -0.02, 0.028],
        [0.265, 1.07, 0.01, 0.012],
      ],
      0.02,
    );
    o.put('horns', o.head(horn.mirror('x')), { color: '#eef2f6', roughness: 0.45, bone: 'head', detail: 0.004 });
    o.put('pauldrons', ogrePauldrons(o), { color: o.tint.leather, roughness: 0.4, metalness: 0.55, detail: 0.006 });
  },
});
