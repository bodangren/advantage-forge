import { mixRgb, rgb, sdf } from '../src/index.js';
import { flameTongue } from './parts/element-features.js';
import { horseAsset } from './parts/horse-kind.js';

/**
 * Nightmare — Chibi Quest monster (catalog `monsters/fey-and-spirit/nightmare`), a black fey horse
 * about 1.2 m to the ear tips, faces +Z. Target: docs/monster-mockups/nightmare_001.jpg (made with
 * mmx from the horse mockup).
 *
 * The horse of `assets/horse.ts` (body, head, rig, and clips from `assets/parts/horse-kind.ts`) as
 * a nightmare: a black coat, glowing red eyes, a mane and tail of violet fire that turn pale at
 * the tips, and orange flames around the hooves; no halter, blaze, or socks.
 * Role: a dark mount of the haunted lands and a night enemy; the glowing eyes, the fire mane, and
 *   the burning hooves read at 128 px on dark ground.
 * Palette (60/30/10): near-black coat #26222a with a dark grey muzzle; violet fire #8a3ad8 with
 *   pale violet tips; orange hoof flames #ff8a2a; red glowing eyes as the accent.
 */

const ORANGE = rgb('#ff8a2a');

export default horseAsset({
  name: 'nightmare',
  description: 'Chibi nightmare: a black horse with glowing red eyes, a mane and tail of glowing violet fire, and burning orange hooves; quadruped rig.',
  reference: 'docs/monster-mockups/nightmare_001.jpg',
  variants: {
    coat: { black: '#26222a', ash: '#3a3640', night: '#1e2230' },
    mane: { violet: '#8a3ad8', ember: '#e0502a', ghost: '#4ac0c8' },
    eyes: { red: '#ff3a2a', amber: '#ffb02a', green: '#6aff5a' },
  },
  presets: {
    ash: { coat: 'ash', mane: 'ember', eyes: 'amber' },
    night: { coat: 'night', mane: 'ghost', eyes: 'green' },
  },
  colors: { muzzle: '#4a4248', coatDark: '#4a2a5a', brow: '#121014', hoof: '#1a1618', sclera: '#2a1418', nostril: '#120a0c' },
  muzzleFollow: 0.6,
  halter: false,
  blaze: false,
  socks: false,
  eyes: { emissive: '#ff3a2a', emissiveIntensity: 1.0 },
  hair: { roughness: 0.4, emissive: '#8a3ad8', emissiveIntensity: 0.6 },
  paintHair(hair, horse) {
    // Violet fire that turns pale violet toward the tips of the locks and the end of the tail.
    const v = rgb(horse.tint.mane);
    const pale = rgb(horse.tone('mane', '#d8b0ff'));
    return hair.paintFn((x, y) => {
      const tip = Math.max(Math.min(1, Math.max(0, (Math.abs(x) - 0.07) / 0.07)), Math.min(1, Math.max(0, (0.42 - y) / 0.2)));
      return mixRgb(v, pale, tip * 0.8);
    });
  },
  extra(k, horse) {
    const { FKNEE, BKNEE, HOOF_DZ } = horse.joints;
    // Flames around each hoof: five short tongues that lick up from the ground, skinned to the shin.
    const ring = (kn: readonly [number, number, number], bone: string) =>
      sdf
        .smoothUnion(
          0.015,
          ...[0, 72, 144, 216, 288].map((deg) => {
            const a = (deg * Math.PI) / 180;
            const x = kn[0] + Math.sin(a) * 0.06;
            const z = kn[2] + HOOF_DZ + Math.cos(a) * 0.06;
            return flameTongue(x, 0.035, z, Math.sin(a) * 20, 0.09, 0.03, -Math.cos(a) * 0.02);
          }),
        )
        .bone(bone);
    const flames = sdf
      .union(ring(FKNEE, 'fshin.L'), ring(BKNEE, 'bshin.L'))
      .mirror('x')
      .paintFn((_x, y) => mixRgb(ORANGE, rgb('#ffe060'), Math.min(1, Math.max(0, (y - 0.06) / 0.07))));
    k.body('hoof-flames', flames, { color: '#ff8a2a', roughness: 0.3, emissive: '#ff7a1a', emissiveIntensity: 0.8, detail: 0.004 });
  },
});
