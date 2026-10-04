import { mixRgb, noise, rgb, sdf } from '../src/index.js';
import { horseAsset } from './parts/horse-kind.js';

/**
 * Unicorn — Chibi Quest monster (catalog `monsters/fey-and-spirit/unicorn`), about 1.3 m to the
 * horn tip, faces +Z. Target: docs/monster-mockups/unicorn_001.jpg (made with mmx from the horse
 * mockup).
 *
 * The horse of `assets/horse.ts` (body, head, rig, and clips from `assets/parts/horse-kind.ts`) as
 * a unicorn: a white coat, a pastel rainbow mane and tail (pink, lilac, and sky blue), pale gold
 * hooves, no halter, and a spiral golden horn that rises out of the forelock.
 * Role: a rare fey creature (a friend, a quest goal, or a guardian); the horn and the rainbow mane
 *   read at 128 px.
 * Palette (60/30/10): white coat #f6f2f0 with a pink-white muzzle; pastel mane bands; gold horn
 *   and hooves as the accent; dark violet eyes.
 */

const BANDS = ['#f4a8c8', '#c4a8e8', '#a8d4f4'] as const;

export default horseAsset({
  name: 'unicorn',
  description: 'Chibi unicorn: a white horse with a big round head, huge glossy eyes, a spiral golden horn, a flowing pastel rainbow mane and tail in pink, lilac, and sky blue, and pale gold hooves; quadruped rig.',
  reference: 'docs/monster-mockups/unicorn_001.jpg',
  variants: {
    coat: { white: '#f6f2f0', pearl: '#ece6f2', cream: '#f6ecd8' },
    mane: { lilac: '#c4a8e8', rose: '#f4a8c8', sky: '#a8d4f4' },
    eyes: { violet: '#4a3070', blue: '#3a5a8c', brown: '#4a3020' },
  },
  presets: {
    pearl: { coat: 'pearl', mane: 'sky', eyes: 'blue' },
    cream: { coat: 'cream', mane: 'rose', eyes: 'brown' },
  },
  colors: { muzzle: '#fbe8ec', coatDark: '#e8c8d8', brow: '#c8b0c0', hoof: '#e8c878' },
  muzzleFollow: 0.6,
  halter: false,
  blaze: false,
  socks: false,
  hooves: { metalness: 0.4, roughness: 0.3 },
  paintHair(hair, horse) {
    // Soft rainbow bands: each band color follows the mane slot.
    const tones = BANDS.map((c) => rgb(horse.tone('mane', c)));
    return hair.paintFn((x, y, z) => {
      const t = (((y * 7 + x * 5 - z * 4) % 3) + 3) % 3;
      const i = Math.floor(t);
      return mixRgb(tones[i]!, tones[(i + 1) % 3]!, Math.max(0, (t - i - 0.7) / 0.3));
    });
  },
  extra(k) {
    // The horn: a slim cone that rises up and forward out of the forelock, with a spiral ridge.
    const base: [number, number, number] = [0, 1.07, 0.35];
    const tip: [number, number, number] = [0, 1.3, 0.46];
    const horn = sdf
      .cone(base, tip, 0.036, 0.004)
      .displace(0.0035, (x, y, z) => Math.sin(Math.atan2(x, z - 0.4) + (y - 1.07) * 95))
      .paintFn((x, y, z) => mixRgb(rgb('#e8b84a'), rgb('#fff0b8'), 0.5 + 0.5 * Math.sin(Math.atan2(x, z - 0.4) + (y - 1.07) * 95) + 0.1 * noise.noise3(x * 90, y * 90, z * 90)));
    k.body('horn', horn, { color: '#f0c860', roughness: 0.3, metalness: 0.5, bone: 'head', detail: 0.003 });
  },
});
