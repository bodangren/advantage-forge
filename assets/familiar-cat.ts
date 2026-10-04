import { profile, sdf } from '../src/index.js';
import { catAsset } from './parts/cat-kind.js';

/**
 * Familiar cat — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/familiar-cat`), about 0.48
 * m to the ear tips, faces +Z. Target: docs/wildlife-mockups/familiar-cat_001.jpg (made with mmx).
 *
 * The cat kind (`assets/parts/cat-kind.ts`: the dire wolf's body, rig, and clips at 0.6 scale) as a
 * wizard's black familiar: a black coat with a dark grey chest, big glowing violet eyes, violet
 * ear insides, pale whiskers, a purple collar with a glowing crescent moon charm, and a small
 * glowing star at the tail tip.
 * Role: a magic pet that follows the wizard hero (an avatar pet later); the glowing eyes and the
 *   moon charm read at 128 px, also in dark scenes.
 * Palette (60/30/10): black #2a2632 and dark grey #4a4452; purple collar #6a3a9a; glowing violet
 *   #b070ff eyes, moon, and star as the accent.
 */

export default catAsset({
  name: 'familiar-cat',
  description: 'Chibi familiar cat: a black cat with a big round head, big glowing violet eyes, pale whiskers, a purple collar with a glowing crescent moon charm, and a glowing star on the tip of its long curled tail; quadruped rig.',
  reference: 'docs/wildlife-mockups/familiar-cat_001.jpg',
  variants: {
    fur: { black: '#2a2632', grey: '#6a6670', white: '#ece8f0' },
    markings: { grey: '#4a4452', black: '#1e1a24', silver: '#c8c4d0' },
    eyes: { violet: '#b070ff', gold: '#f0c040', green: '#60e080', blue: '#60b0ff' },
    magic: { violet: '#b070ff', gold: '#f0c040', green: '#60e080', blue: '#60b0ff' },
  },
  presets: {
    grey: { fur: 'grey', markings: 'black', eyes: 'gold', magic: 'gold' },
    white: { fur: 'white', markings: 'silver', eyes: 'blue', magic: 'blue' },
    green: { fur: 'black', markings: 'grey', eyes: 'green', magic: 'green' },
  },
  colors: { earInner: '#6a4a8a', nose: '#8a6aa0', whisker: '#c8c0d0', eyeRim: '#5a2a9a', furLight: '#3e3848' },
  eyeGlow: 1.5,
  tailTip: false,
  extra(k) {
    const magic = k.tint('magic');
    // The collar: a band over the neck and the chest, lower in front.
    const neckline = sdf.smoothUnion(
      0.04,
      sdf.smoothUnion(0.07, sdf.ellipsoid([0.15, 0.15, 0.16]).at(0, 0.29, 0.03), sdf.ellipsoid([0.12, 0.12, 0.09]).at(0, 0.37, 0.08)),
      sdf.ellipsoid([0.115, 0.12, 0.075]).at(0, 0.31, 0.15),
    );
    const collar = neckline.round(0.014).smoothSubtract(0.004, neckline.round(-0.008)).smoothIntersect(0.006, sdf.box([0.6, 0.036, 0.6], 0.01).rotateX(29).at(0, 0.35, 0.075));
    k.body('collar', collar, { color: '#6a3a9a', roughness: 0.5, detail: 0.003, bone: 'neck' });
    // The charm: a crescent moon hanging at the front of the collar, and a star at the tail tip.
    const front = sdf.raycast(collar, [0, 0.27, 2], [0, 0, -1]);
    const moon = sdf.extrude(profile.arc(0.02, 0.012, 60, 300), 0.008, 0.002).at(0, 0.245, (front?.[2] ?? 0.22) + 0.006);
    const star = sdf.extrude(
      profile.polygon(Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * 2 * Math.PI;
        const r = i % 2 === 0 ? 0.032 : 0.014;
        return [r * Math.sin(a), r * Math.cos(a)] as [number, number];
      })),
      0.012,
      0.003,
    ).at(0.02, 0.63, -0.36);
    k.body('moon-charm', moon, { color: magic, emissive: magic, emissiveIntensity: 1.6, roughness: 0.3, detail: 0.002, bone: 'neck' });
    k.body('tail-star', star, { color: magic, emissive: magic, emissiveIntensity: 1.6, roughness: 0.3, detail: 0.002, bone: 'tail' });
  },
});
