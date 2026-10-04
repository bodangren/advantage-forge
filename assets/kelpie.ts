import { mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import { horseAsset } from './parts/horse-kind.js';

/**
 * Kelpie — Chibi Quest monster (catalog `monsters/fey-and-spirit/kelpie`), a water horse about
 * 1.2 m to the ear tips, faces +Z. Target: docs/monster-mockups/kelpie_001.jpg (made with mmx
 * from the horse mockup).
 *
 * The horse of `assets/horse.ts` (body, head, rig, and clips from `assets/parts/horse-kind.ts`) as
 * a kelpie: a teal-green coat with pale scales on the lower legs, a glossy mane and tail of dark
 * green seaweed, fin frills on the cheeks and behind the shins, and dark teal hooves; no halter,
 * blaze, or socks.
 * Role: a lake and river trickster; the teal coat, the seaweed mane, and the fins read at 128 px.
 * Palette (60/30/10): teal-green coat #5aa89a with a pale teal muzzle and scales; dark seaweed
 *   green #2e6a4a; sea-green fins; dark blue eyes.
 */

export default horseAsset({
  name: 'kelpie',
  description: 'Chibi kelpie: a teal-green water horse with big glossy eyes, a glossy mane and tail of dark green seaweed, fin frills on its cheeks and legs, pale scales on its lower legs, and dark teal hooves; quadruped rig.',
  reference: 'docs/monster-mockups/kelpie_001.jpg',
  variants: {
    coat: { teal: '#5aa89a', sea: '#4a8ab0', moss: '#7a9a5a' },
    mane: { kelp: '#2e6a4a', deep: '#22465a', olive: '#5a6a2a' },
    eyes: { blue: '#22324a', green: '#2a4a3a', amber: '#8a5a1a' },
  },
  presets: {
    sea: { coat: 'sea', mane: 'deep', eyes: 'green' },
    moss: { coat: 'moss', mane: 'olive', eyes: 'amber' },
  },
  colors: { muzzle: '#bfe6dc', coatDark: '#3e7a70', brow: '#2a4a44', hoof: '#2a4a44' },
  muzzleFollow: 0.4,
  halter: false,
  blaze: false,
  socks: false,
  hair: { roughness: 0.3 },
  paint(coat, horse) {
    // Pale scales on the lower legs: a staggered grid of round spots below the knees.
    const pale = rgb(horse.tone('coat', '#a8dcd0', 1));
    return coat.paintFn((x, y, z, c) => {
      if (y > 0.3) return c;
      const row = Math.floor(y / 0.028);
      const u = Math.atan2(x - Math.sign(x) * 0.12, z) * 6 + (row % 2) * 0.5;
      const dv = (y / 0.028 - row - 0.5) * 2;
      const du = (u - Math.floor(u) - 0.5) * 2;
      const d = Math.hypot(du, dv);
      return mixRgb(c, pale, (d < 0.75 ? 0.7 : 0) * Math.min(1, (0.3 - y) / 0.05));
    });
  },
  paintHair(hair, horse) {
    const dark = rgb(horse.tone('mane', '#1e4a32'));
    return hair.paintFn((x, y, z, c) => mixRgb(c, dark, Math.max(0, noise.fbm(x * 30, y * 8, z * 30, 2)) * 0.8));
  },
  extra(k, horse) {
    const { FKNEE, BKNEE } = horse.joints;
    // A fin frill: a fan of three rounded rays, flat, built in the XY plane at its root.
    const fan = sdf.extrude(
      profile.polygon(
        [
          [0, 0],
          [0.05, 0.06],
          [0.075, 0.035],
          [0.1, 0.035],
          [0.105, 0.0],
          [0.11, -0.035],
          [0.08, -0.04],
          [0.05, -0.06],
        ],
        { smooth: true },
      ),
      0.008,
      0.003,
    );
    // Cheek fins: swept back from the jaw corners.
    const cheek = fan.scale(1.35).rotateY(62).at(0.15, 0.8, 0.28).bone('head');
    // Leg fins: behind each shin, swept back and down.
    const leg = (kn: readonly [number, number, number], bone: string) => fan.scale(0.9).rotateZ(-60).rotateY(90).at(kn[0], 0.22, kn[2] - 0.05).bone(bone);
    const fins = sdf.union(cheek, leg(FKNEE, 'fshin.L'), leg(BKNEE, 'bshin.L')).mirror('x');
    k.body('fins', fins, { color: horse.tone('coat', '#3e9a86', 0.8), roughness: 0.35, detail: 0.003 });
  },
});
