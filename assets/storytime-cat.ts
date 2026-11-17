import { catAsset } from './parts/cat-kind.js';

/**
 * Storytime cat — Chibi Sprouts song videos, week 6 (inventory section 5 row "cat": "gray; W6 sits
 * on a wooden fence, mouth wide open; in a meadow"). Catalog-style prop, about 0.56 m tall.
 *
 * The cat kind (`assets/parts/cat-kind.ts`: the dire wolf's body, rig, and clips at 0.6 scale) as the
 * grey song cat: a big round head, big amber eyes with lashes, a white muzzle, chest, and paws, a
 * pink nose and ear insides, dark whiskers, darker grey tabby stripes, and a long tail that curls up
 * at its side. The mouth is an open oval with a pink tongue (`openMouth`), so the cat sings at rest
 * and the `sit` clip holds it on the fence.
 * Role: the cat of the week 6 song video, on the wooden fence in the meadow; the grey coat, the
 *   amber eyes, and the open mouth read at 128 px.
 * Palette (60/30/10): grey #9a9a9e with darker grey stripes #6e6e74; white #fff6ec; amber eyes
 *   #d89a20 and the pink tongue #e88a9a as the accent.
 */

export default catAsset({
  name: 'storytime-cat',
  description:
    'Chibi storytime cat: a grey cat with a big round head, big amber eyes, pointed ears with pink insides, whiskers, a wide open oval mouth with a pink tongue, lashes, a white muzzle, chest, and paws, darker grey tabby stripes on its forehead, back, and legs, and a long tail that curls up at its side; quadruped rig.',
  reference: 'docs/wildlife-mockups/cat_001.jpg',
  // The song video sits the cat on the fence: the rest pose stands, and the `sit` clip holds the
  // sitting pose (see the kind).
  sit: true,
  // A big head over short legs, with a small cream muzzle.
  headScale: 1.4,
  muzzleWidth: 0.75,
  variants: {
    // The book colour is the default, so no preset recolour is needed.
    fur: { grey: '#9a9a9e', orange: '#e8913a', brown: '#8a6040', cream: '#ecd6b0' },
    markings: { white: '#fff6ec', cream: '#f4e4c8' },
    eyes: { amber: '#d89a20', green: '#4a9a3a', blue: '#3a7ac0' },
  },
  // A wide open mouth at rest (W6 "mouth wide open"): the cat sings without a clip.
  openMouth: true,
  stripes: '#6e6e74',
  lashes: true,
});
