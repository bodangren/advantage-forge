import { catAsset } from './parts/cat-kind.js';

/**
 * Cat — Chibi Quest wildlife (catalog `wildlife/land/cat`), about 0.48 m to the ear tips, faces +Z.
 * Target: docs/wildlife-mockups/cat_001.jpg (made with mmx).
 *
 * The cat kind (`assets/parts/cat-kind.ts`: the dire wolf's body, rig, and clips at 0.6 scale) as
 * an orange tabby village cat: darker stripes on the forehead, the back, and the legs, big green
 * eyes with lashes, pink ear insides and nose, dark whiskers, a tiny closed mouth, a white muzzle,
 * chest, and paws, and a long tail that curls up at its side.
 * Role: a village pet and a hero companion; the stripes, the green eyes, and the curled tail read
 *   at 128 px.
 * Palette (60/30/10): orange #e8913a with stripes #b85a20; white #fff6ec; green eyes #4a9a3a as the
 *   accent.
 */

export default catAsset({
  name: 'cat',
  description: 'Chibi cat: an orange tabby with a big round head, big green eyes, pointed ears with pink insides, whiskers, a tiny closed mouth, lashes, a white muzzle, chest, and paws, stripes on its forehead, back, and legs, and a long tail that curls up at its side; quadruped rig.',
  reference: 'docs/wildlife-mockups/cat_001.jpg',
  // The mockup sits: the rest pose stands (for the walk), and the `sit` clip holds the sitting pose.
  sit: true,
  variants: {
    fur: { orange: '#e8913a', grey: '#9a9a9e', brown: '#8a6040', cream: '#ecd6b0' },
    markings: { white: '#fff6ec', cream: '#f4e4c8' },
    eyes: { green: '#4a9a3a', amber: '#d89a20', blue: '#3a7ac0' },
  },
  presets: {
    grey: { fur: 'grey', markings: 'white', eyes: 'amber' },
    brown: { fur: 'brown', markings: 'cream', eyes: 'green' },
    cream: { fur: 'cream', markings: 'white', eyes: 'blue' },
  },
  stripes: '#b85a20',
  lashes: true,
});
