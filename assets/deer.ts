import { DEER_COLORS, deerAsset } from './parts/deer-kind.js';

/**
 * Deer — Chibi Quest wildlife (catalog `wildlife/land/deer`), about 0.88 m to the top of the head
 * (1.0 m to the antler tips), faces +Z. Target: docs/wildlife-mockups/deer_001.jpg (made with
 * mmx; one three-quarter view). Base: the dire wolf (four-leg rig, trot machinery).
 *
 * Role: gentle ambient wildlife, seen in 3D and as a 128 px sprite; the big eyes must read.
 * One idea: a huge round head with big glossy eyes in cream eye patches, wide leaf ears, and
 *   small dark antlers, on a slim spotted body with long thin legs and small dark hooves.
 * Shape language: soft round masses (head, eyes, body) with thin verticals (legs, antlers).
 * Palette (60/30/10): warm fawn #c47a46; cream #f3e2b8 (eye patches, muzzle, belly) and a whiter
 *   bib #faf2e2 (chest, spots, tail); dark brown antlers #5c3b28 and hooves; black eyes and nose.
 * Value plan: the dark eyes and nose in the cream mask are the focal point; the dark antlers and
 *   hooves close the silhouette at the top and the bottom.
 * Bodies: fur, eyes, shine, nose, antlers, hooves, spots.
 * The body, the head, the rig, and the clips are shared with the deer kinds in
 *   `assets/parts/deer-kind.ts`.
 * Rig: the wolf's quadruped (hips, spine, neck, head, jaw, tail, front and back legs with shins)
 *   plus ear bones. Clips: idle, walk, run (bouncy), graze (the head goes down, nibbles, comes
 *   up), alert (the head high, the ears turn, a front hoof stamps), hit, death.
 */

export default deerAsset({
  name: 'deer',
  description: 'Chibi deer: a big round head with glossy eyes in cream patches, wide leaf ears, small dark antlers, a slim spotted fawn body, long thin legs, and a white tail; quadruped rig.',
  reference: 'docs/wildlife-mockups/deer_001.jpg',
  // Color slots for individual deer (the first option is the default look): real coat and eye
  // colors, all in the earthy family of the default.
  variants: {
    fur: { fawn: DEER_COLORS.fur, red: '#a8532f', grey: '#8c7a66', pale: '#d6a877' },
    eyes: { dark: DEER_COLORS.eye, brown: '#5a3418', hazel: '#6e5a2c' },
  },
  presets: {
    roe: { fur: 'red', eyes: 'brown' },
    winter: { fur: 'grey', eyes: 'dark' },
    pale: { fur: 'pale', eyes: 'hazel' },
  },
});
