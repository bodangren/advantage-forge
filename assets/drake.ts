import { mixRgb, rgb } from '../src/index.js';
import { dragonAsset } from './parts/dragon-kind.js';

/**
 * Drake — Chibi Quest monster (catalog `monsters/dragon/drake`), a wingless dragon about 0.9 m to
 * the horn tips, faces +Z. Target: docs/monster-mockups/drake_001.jpg (made with mmx from the fire
 * dragon mockup).
 *
 * The fire dragon (`assets/dragon-fire.ts`; body, rig, and clips from `assets/parts/dragon-kind.ts`)
 * as a drake: no wings (and so no fly clip), orange-brown scales with darker stripes across the
 * back and the tail, a cream belly, short swept-back horns, and yellow eyes.
 * Role: a ground dragon of the wilds and the canyons, between the wyrmling and the dragons; the
 *   wingless outline and the stripes set it apart from the fire dragon at 128 px.
 * Palette (60/30/10): orange-brown #d8742a with dark rust stripes #8a4418; cream belly #f4dcae;
 *   dark rust crest; pale horns; yellow eyes as the accent.
 * Clips: idle, walk, run, attack, hit, death, roar (the fire dragon's, without fly).
 */
export default dragonAsset({
  name: 'drake',
  description: 'Chibi drake monster: a wingless orange-brown dragon with dark rust stripes, a cream belly, short swept-back horns, a dark crest down its back, yellow eyes, and a toothy grin.',
  reference: 'docs/monster-mockups/drake_001.jpg',
  variants: {
    scales: { rust: '#d8742a', sand: '#c8a050', moss: '#6a8a3a' },
    belly: { cream: '#f4dcae', pale: '#efe6d0', ochre: '#e8c078' },
    eyes: { yellow: '#f6c01e', green: '#9ad040', red: '#ff5a2a' },
  },
  presets: {
    sand: { scales: 'sand', belly: 'pale', eyes: 'green' },
    moss: { scales: 'moss', belly: 'ochre', eyes: 'red' },
  },
  palette: {
    redDark: '#8a4418',
    creamLine: '#c8a878',
    horn: '#efe2c4',
    hornBase: '#c8b088',
    brow: '#3a1e10',
  },
  looks: {
    crest: { color: '#8a4418' },
  },
  wings: false,
  horn: [
    [0.11, 0.8, -0.03, 0.04],
    [0.16, 0.835, -0.07, 0.032],
    [0.19, 0.865, -0.12, 0.02],
    [0.195, 0.88, -0.15, 0.007],
  ],
  hornBaseBelow: 0.81,
  paint(scales, tint) {
    const dark = rgb(tint.dark);
    // Stripes across the back and the top of the tail (diagonal bands behind the body center),
    // below the head (on the back of the round head they would make rings).
    return scales.paintFn((_x, y, z, c) => {
      const band = Math.sin((y - z * 1.3) * 42) > 0.45 ? 1 : 0;
      const back = Math.min(1, Math.max(0, (-z - 0.02) * 12)) * Math.min(1, Math.max(0, (0.5 - y) * 25));
      return mixRgb(c, dark, band * back * 0.75);
    });
  },
});
