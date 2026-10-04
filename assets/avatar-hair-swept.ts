import { addPart, defineAsset } from '../src/index.js';
import { avatarHair } from './parts/avatar-hair.js';

/**
 * Avatar hair, swept style: a free head-slot item for the avatar base (it hides the base hair), from
 * the shared part `assets/parts/avatar-hair.ts`, at the exact worn size. Static: no rig.
 * Display pose: as worn, lifted so that its lowest point is on y = 0, the face side toward +Z.
 */

/** The lowest point of the style in the head frame, lifted onto y = 0. */
const LIFT = 0.206;

export default defineAsset({
  name: 'avatar-hair-swept',
  description: 'The avatar swept hair style, at its worn size.',
  detail: 0.005,
  texture: { size: 512 },
  variants: { hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' } },
  equip: { slot: 'hair', origin: [0, LIFT, 0], hides: ['hair'] },

  build(k) {
    addPart(k, avatarHair('swept', k.tint, { capped: k.worn?.capHair ?? false }), { pose: (s) => s.at(0, LIFT, 0), bones: null });
  },
});
