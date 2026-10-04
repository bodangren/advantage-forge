import { horseAsset } from './parts/horse-kind.js';

/**
 * Horse — Chibi Quest wildlife (catalog `wildlife/land/horse`), about 1.2 m to the ear tips and
 * 1.1 m from muzzle to tail, faces +Z. Target: docs/wildlife-mockups/horse_001.jpg (made with mmx;
 * one three-quarter view). Base: assets/dire-wolf.ts (the quadruped rig and clip set).
 *
 * Role: a friendly riding horse for a 1 m chibi hero, seen in 3D and as a 128 px sprite.
 * One idea: a big round head with huge glossy eyes, a white blaze, and a pale bulbous muzzle in a
 *   leather halter, on a chunky barrel body with sturdy straight legs, white socks, and dark hooves.
 * Shape language: soft round masses (head, muzzle, barrel, haunches), long S-curves (mane locks,
 *   forelock curl, tail), and simple cylinders (legs) on bell-shaped hooves.
 * Palette (60/30/10): chestnut coat #b8683a; dark brown mane, tail, hooves, and halter; a cream
 *   muzzle #f0d6be, a white blaze and socks; near-black eyes with white shines as the accent.
 * Value plan: the white blaze between the dark eyes, above the pale muzzle, is the focal point;
 *   the dark mane and tail frame the warm coat; the white socks over dark hooves ground the legs.
 * Bodies: coat, muzzle, eyes, mane (forelock and mane), tail, halter, socks, hooves.
 * The body, the head, the rig, and the clips are shared with the fey horses in
 *   `assets/parts/horse-kind.ts`.
 * Rig: quadruped (hips, spine, neck, head, mane, tail, front and back legs with shins). Clips:
 *   idle, walk (four-beat), run (gallop), rear, neigh, hit, death.
 */

export default horseAsset({
  name: 'horse',
  description: 'Chibi horse: a big round head with huge eyes, a white blaze, a cream muzzle and a leather halter, a chunky chestnut body, white socks, dark hooves, and a flowing dark mane and tail; quadruped rig.',
  reference: 'docs/wildlife-mockups/horse_001.jpg',
  // Color slots for individual horses (the first option is the default look): natural coats,
  // manes, and eye colors.
  variants: {
    coat: { chestnut: '#a95f36', bay: '#7e4428', dun: '#b99566', grey: '#a9a49b', black: '#35302d' },
    mane: { dark: '#4a2e24', cream: '#e9dcc0', sorrel: '#8e4c2c' },
    eyes: { brown: '#2a1a12', hazel: '#6b4a22', blue: '#4f6f8c' },
  },
  presets: {
    bay: { coat: 'bay', mane: 'dark', eyes: 'brown' },
    palomino: { coat: 'dun', mane: 'cream', eyes: 'hazel' },
    grey: { coat: 'grey', mane: 'cream', eyes: 'brown' },
    black: { coat: 'black', mane: 'dark', eyes: 'blue' },
  },
});
