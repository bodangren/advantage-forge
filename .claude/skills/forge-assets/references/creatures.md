# Creatures and monsters

Worked example: `assets/horned-boar.ts` (quadruped, surface probes for eyes/horns/mane,
glowing eyes, trot and charge). Read it before building a creature.

## Design first

A creature is a character with a body plan. Decide:

- **Body plan**: quadruped, biped, blob/slime, serpent, flyer, insectoid. Borrow real anatomy
  (where the joints are, how the weight sits) and then caricature it.
- **Mass distribution**: where is the weight? Predators and brutes are front-heavy (big chest
  and head, small hips); cute critters are bottom-heavy (round belly, small head on top, or one
  big round body); fast creatures are long and low.
- **Threat level through shape language**: friendly = round, big eyes, short limbs; menacing
  = triangles (horns, spikes, tusks, claws), heavy brow, small glowing eyes, forward-leaning
  pose. A boss gets both: a readable big shape and aggressive details on top.
- **One signature feature** that no other creature in the set has (swept horns, a glowing
  crystal back, a huge jaw, a single eye). This is what the player remembers.

## Construction

- Torso: 2 or 3 ellipsoids (chest, hump or belly, rump) blended with k 0.07 to 0.1. Tag each
  part with its bone (`'spine'`, `'hips'`) so the body bends between them.
- Head: skull ellipsoid + snout or muzzle cone, blended; brows as small flattened ellipsoids
  slanted for the mood (inner end low = angry). Ears are flattened ellipsoids with a subtracted
  inner hollow.
- Legs: two cones per leg (upper, lower) with the joint where the knee is. Quadrupeds: front
  knees bend backward (hoof goes back when lifted), hind hocks bend forward. Keep legs thick
  and short for heavy creatures; the "pig on stilts" look comes from thin, long legs.
- Feet: hooves (cylinder with a cloven notch), paws (flattened sphere plus 3 or 4 toe
  bumps), claws (small cones). A darker, glossier material separates them from the fur.
- Tails: `sdf.chain` of 3 to 5 points with decreasing radius, tagged `'tail'`.
- **Attach details with probes.** Eyes, horns, spikes, and manes must sit on the surface:
  ```ts
  const eyeHit = sdf.raycast(headBase, [0.075, 0.46, 2], [0, 0, -1])!; // from the front
  const root = sdf.raycast(trunk, [0, 2, z], [0, -1, 0])!;           // top of the back at z
  ```
  Sink roots in a little (a few centimeters) so they blend with the body.
- Horns and tusks: `sdf.chain` with tapering radii and a curve, growth rings with a small
  `displace` of `Math.sin(...)`, and a pale tip with `paintFn`.
- Spikes and manes: a row of cones along the probed back line, tallest at the shoulders, with
  slight random tilt (`noise.random(i, ...)`) so they are not a perfect comb.
- Glowing eyes: a separate body with `emissive` equal to the color and `emissiveIntensity`
  about 2; make them bigger than feels right so they read small.
- Fur, scales, skin texture: fine detail in `bump` (fur: noise stretched along the body;
  scales: `noise.worley` cells); color variation in `paintFn`. Darken the legs and back,
  lighten the belly.

## Quadruped skeleton template (about 1 m long, facing +Z)

```ts
k.skeleton({
  hips: { at: [0, 0.38, -0.22] },
  spine: { parent: 'hips', at: [0, 0.41, 0.02] },
  neck: { parent: 'spine', at: [0, 0.42, 0.27] },
  head: { parent: 'neck', at: [0, 0.42, 0.36] },
  tail: { parent: 'hips', at: [0, 0.43, -0.42] },
  'fleg.L': { parent: 'spine', at: [0.15, 0.32, 0.2] },
  'fshin.L': { parent: 'fleg.L', at: [0.155, 0.16, 0.22] },
  'bleg.L': { parent: 'hips', at: [0.14, 0.32, -0.26] },
  'bshin.L': { parent: 'bleg.L', at: [0.145, 0.16, -0.29] },
  // ...and the .R mirrors with negated x
});
```

The trot, charge, and idle clips are in `references/animation.md`.

## Other body plans

- **Slime/blob**: one big ellipsoid with a flattened bottom (`intersect` a half space), eyes
  and mouth painted high on the front, a glossy low roughness (0.15) and a slightly lighter top.
  Give it a `core` bone at the bottom center and animate squash and stretch with `scale`
  (`core: { scale: [1 + 0.15 * s, 1 - 0.15 * s, 1 + 0.15 * s], move: [0, hop, 0] }`): squash
  on landing, stretch on the way up. Keep volume roughly constant (x and z grow when y shrinks).
- **Biped monster (goblin, orc, troll)**: use the humanoid template from `characters.md` with
  exaggerated proportions (goblin: big head and ears, thin limbs; troll: tiny head, huge arms
  and hands, short legs), hunched `spine` rest pose, and claws or crude weapons.
- **Flyer (bat, bird, small dragon)**: wings are `extrude` of a smooth membrane profile, thin
  but at least two mesh cells thick, attached to arm bones; flap with a large `rotate` on the
  wing bones and a small body bob.
- **Serpent/worm**: a `chain` of many points along a curve, one bone per 2 or 3 segments;
  slither with `wave(p, 1, i * 0.15)` offsets along the chain.

## Failure modes seen in practice

- **Pig on stilts**: legs too long and thin, body too high. Lower the body, shorten and thicken
  the legs.
- **Buried details**: spikes, eyes, and horns placed at guessed coordinates ended up inside the
  body. Probe the surface.
- **Sad instead of angry**: the brow slant was reversed.
- **Reads as a farm animal, not a monster**: needs triangles (horns, spikes, tusks), a heavy
  brow, glowing eyes, and a front-heavy mass.
- **Uniform color**: add a darker back and legs, lighter belly, and a contrasting accent
  (eyes, tusks, horn tips).
