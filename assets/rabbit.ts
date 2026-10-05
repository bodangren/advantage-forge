import { sitterAsset } from './parts/sitter-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Rabbit — Chibi Quest wildlife (catalog `wildlife/forest/rabbit`), a small seated rabbit about 0.4 m
 * tall to the ear tips, faces +Z. Target: docs/wildlife-mockups/rabbit_001.jpg (made with mmx).
 *
 * The sitter of `assets/parts/sitter-kind.ts` (a big head on a small seated body, feet forward, front
 * paws, rig, and clips) at 0.55 of its size, as a rabbit: a big warm cream head with long upright
 * ears with pink insides, big glossy dark eyes with lashes, a small pink nose, a small smile, and
 * whiskers; a grey seated body with white feet and a white puff tail. The move clip is a hop.
 * Role: a small field and garden animal; the long ears and the seated shape read at 128 px.
 * Palette (60/30/10): cream #f2ece0 head; grey #8e8c90 body; white feet and tail; pink ear insides
 *   and nose as the accent.
 */
export default scaleAsset(
  sitterAsset({
    name: 'rabbit',
    description: 'Chibi rabbit: a small seated rabbit with a big warm cream head, long upright ears with pink insides, big glossy dark eyes with lashes, a small pink nose, a small smile, whiskers, a grey body, white feet, and a white puff tail; sitter rig with a hop.',
    reference: 'docs/wildlife-mockups/rabbit_001.jpg',
    variants: {
      fur: { cream: '#ebe0cc', white: '#e2e0dc', brown: '#b08a64', grey: '#a8a6aa' },
      // The mockup body is grey under a cream head (the review note of 2026-10-05 asked for a cream
      // body; the mockup shows grey, so the grey stays the default and cream is an option).
      coat: { grey: '#8e8c90', cream: '#e6dac4', brown: '#8a6a4a', black: '#3a3638' },
      markings: { white: '#f6f4f0', cream: '#f2e8d6' },
      eyes: { brown: '#5e4434', dark: '#2a1e1a', blue: '#3a5a8a' },
    },
    presets: {
      brown: { fur: 'brown', coat: 'brown', markings: 'cream', eyes: 'dark' },
      grey: { fur: 'white', coat: 'grey', markings: 'white', eyes: 'brown' },
      snow: { fur: 'white', coat: 'cream', markings: 'white', eyes: 'blue' },
      dusk: { fur: 'grey', coat: 'black', markings: 'white', eyes: 'dark' },
    },
    bodySlot: 'coat',
    ears: 'long',
    earScale: 1.05,
    earWidth: 1.3,
    earSplay: 18,
    toeLines: true,
    colors: { earInner: '#e4b0a2' },
    belly: false,
    lashes: true,
    brows: true,
    feet: 'small',
    whiskers: true,
    nose: 'pink',
    eyeScale: 0.82,
    arms: 'down',
    headShape: [1.0, 1.0],
    cheeks: 0.9,
    muzzle: 0.32,
    chest: 1.3,
    armScale: 1.3,
  }),
  0.55,
);
