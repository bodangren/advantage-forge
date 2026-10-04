import { noise, sdf } from '../src/index.js';
import { ogreAsset } from './parts/ogre-kind.js';

/**
 * Hill giant — Chibi Quest monster (catalog `monsters/giant-and-ancient/hill-giant`), about 1.5 m
 * to the top of its head, faces +Z. Target: docs/monster-mockups/hill-giant_001.jpg (made with mmx).
 *
 * The ogre brute (`assets/ogre-brute.ts`; body, rig, and clips from `assets/parts/ogre-kind.ts`)
 * as a hill giant, bigger: tan human skin, a bigger head with a broad round nose (no tusks), a
 * big brown beard and a mop of hair, a shaggy fur collar over the shoulders, a fur loincloth, and
 * the spiked club.
 * Role: the plain brute of the giant family; the beard, the collar, and the size read at 128 px.
 * Palette (60/30/10): tan skin #d9a066 (a lighter belly); brown hair and beard #5a3a22; brown fur
 *   collar and loincloth #7a4a2a; the wooden club with a stone spike.
 * Bodies added: fur-collar (tagged to the chest).
 */
export default ogreAsset({
  name: 'hill-giant',
  description:
    'Chibi hill giant monster: a big tan giant with a round nose, a big brown beard and a mop of hair, a shaggy fur collar, a round belly, a fur loincloth with a rope belt, and a stone-spiked club.',
  reference: 'docs/monster-mockups/hill-giant_001.jpg',
  scale: 1.45,
  headScale: 1.15,
  variants: {
    skin: { tan: '#d9a066', fair: '#e8b88a', umber: '#a8744a' },
    cloth: { fur: '#7a4a2a', grey: '#6a625a', russet: '#8a4a2a' },
    leather: { brown: '#6e3f24', dark: '#3f2818', tan: '#9a7448' },
    mane: { brown: '#5a3a22', black: '#241a14', ginger: '#8a4a1e' },
  },
  presets: {
    highland: { skin: 'fair', cloth: 'russet', leather: 'tan', mane: 'ginger' },
    barrow: { skin: 'umber', cloth: 'grey', leather: 'dark', mane: 'black' },
  },
  colors: { skinDark: '#b07a44', skinLight: '#e8b884', lid: '#b07a44', mouth: '#5a2a1a', redDark: '#5a3418', hide: '#8a6a45' },
  nose: 'human',
  tusks: 0,
  extra(_k, o) {
    // A shaggy fur collar over the shoulders and the top of the chest, under the beard.
    const collar = o.trunk
      .round(0.032)
      .intersect(sdf.box([1, 0.15, 1]).at(0, 0.685, 0))
      .displace(0.014, (x, y, z) => noise.fbm(x * 26, y * 30, z * 26, 2) + 0.5 * Math.sin(Math.atan2(x, z) * 22 + y * 40))
      .bone('chest');
    o.put('fur-collar', collar, { color: o.tone('cloth', '#6a4428'), roughness: 0.9, detail: 0.007 });
  },
});
