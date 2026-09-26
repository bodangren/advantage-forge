# Characters (humanoids, NPCs, heroes)

Worked example: `assets/rogue.ts` (face, hair inside a hood, tunic, belt, cape, boots, rig,
idle/walk/run). Read it before building a humanoid. `assets/archer.ts` and `assets/knight.ts`
use the same head and skeleton: start new heroes from it, so the set stays consistent.

## Proportions

Pick a style and measure everything in heads (H = head height).

| Style               | Total height | Head share | Notes                                                        |
| ------------------- | ------------ | ---------- | ------------------------------------------------------------ |
| Chibi               | 2 to 2.5 H   | 40 to 45%  | tiny body, stubby limbs, big hands and feet, huge eyes       |
| Cute stylized       | 3 to 4 H     | 25 to 33%  | readable at small sprite sizes; good default for NPCs         |
| Heroic stylized     | 5 to 6 H     | 17 to 20%  | broad shoulders, small waist, long legs, big hands           |

A 1 m tall chibi (like the rogue): head center at 0.675, head radius about 0.2, eyes at 0.63,
shoulders at 0.385, belt at 0.25, tunic hem at 0.17, ankles at 0.07. Scale these for other heights.

Exaggerate the character's role in the body: a guard is sturdy (square shoulders, thick boots),
a mage is tall and narrow with big sleeves, a thief is lean with long limbs, a blacksmith has a
huge upper body and small legs.

## Construction

Build the body from blended primitives, grouped by material into bodies:

- **skin** (head, neck, arms, hands), **hair**, **clothes** (one body per cloth color if the
  roughness differs), **leather** (belt, boots), **metal** (helmet, buckles, weapons).
- Head: an ellipsoid plus chubby cheek spheres (`mirror('x')`) and a chin ellipsoid, blended
  with `smoothUnion(0.06, ...)`. Cheeks make faces cute; a longer jaw makes them mature.
- Limbs: one `sdf.cone(a, b, ra, rb)` per segment (upper arm, forearm), blended with k 0.02.
  Tag each with `.bone()` at the same time.
- Hands: palm ellipsoid + thumb cone + 3 or 4 finger cones blended with k 0.008 (so fingers
  read as separate but joined). Big hands read better than realistic ones.
- Clothes that fit: grow the body shape and cut it. A tunic is a `revolve` of a smooth profile
  scaled flatter in Z; sleeves are cones blended to it; a belt is
  `torso.round(0.009).smoothIntersect(0.006, sdf.box([0.5, 0.04, 0.5]).at(0, beltY, 0))`.
- Trims (hems, cuffs): paint a band with `paintWhere(sdf.halfSpace([0, 1, 0], hemY), trimColor)`
  or add a small torus for a raised cuff.
- Hats and helmets: build in a local frame with a pose helper
  (`const helmetPose = (s) => s.rotateX(-13).at(0, 0.73, 0)`), a shelled ellipsoid dome plus a
  revolved brim profile. Emblems follow the dome by intersecting a thin shell of the dome with
  an extruded outline.
- Hair under a hat: a cap ellipsoid slightly larger than the skull, minus a face mask
  displaced with a sine for a wavy fringe, then intersected with the inside of the hat.
  Add 3 to 5 locks (cones) across the forehead and sideburns in front of the ears.

## Faces

Faces carry the character; spend detail here and give the skin body `textureDensity: 2`.

- Eyes: dark vertical ovals, large (chibi: eye height about 14% of the head height), wide
  apart, set at or below the middle of the head. Paint them as ellipsoid stencils that cross
  the face, plus a small white highlight dot up and to one side.
- Mouth: a stroke, not a hole: `sdf.extrude(profile.arc(r, width, 222, 318), 0.3)` pushed
  through the face. Angles 222 to 318 are a smile; flip for a frown.
- Brows carry the mood: inner ends lower = angry, outer ends lower = sad or worried,
  raised and curved = surprised or friendly.
- Nose: a small ellipsoid blended with k about 0.012. Keep it small in cute styles.
- Blush: soft `paintWhere` with a large `soft` value (0.02 to 0.03) and a pale pink.
- Check at sprite size: `./forge sprites <name> --fast`. If the face does not read at 128 px,
  make the eyes bigger and the marks bolder, not more detailed.

## Skeleton template (1 m chibi; scale positions by height)

```ts
const SHOULDER = [0.13, 0.385, 0] as const;
const ELBOW = [0.18, 0.332, 0.012] as const;
const WRIST = [0.205, 0.238, 0.03] as const;
const mx = (p: readonly [number, number, number]) => [-p[0], p[1], p[2]] as const;
k.skeleton({
  hips: { at: [0, 0.2, 0] },
  spine: { parent: 'hips', at: [0, 0.26, 0] },
  chest: { parent: 'spine', at: [0, 0.33, 0] },
  neck: { parent: 'chest', at: [0, 0.43, -0.01] },
  head: { parent: 'neck', at: [0, 0.48, -0.01] },
  'upperarm.L': { parent: 'chest', at: SHOULDER },
  'forearm.L': { parent: 'upperarm.L', at: ELBOW },
  'hand.L': { parent: 'forearm.L', at: WRIST },
  'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
  'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
  'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
  'leg.L': { parent: 'hips', at: HIP }, // HIP = [0.068, 0.195, 0]
  'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 }, // KNEE = [0.083, 0.1325, 0]
  'foot.L': { parent: 'shin.L', at: ANKLE }, // ANKLE = [0.098, 0.07, 0]
  'leg.R': { parent: 'hips', at: mx(HIP) },
  'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
  'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
});
```

Every humanoid has a knee (`shin.L`). With `split`, the shin takes the part of the leg below
the knee, so a leg built and tagged as one part (`'leg.L'`) still bends at the knee; tag a
separate shin part `'shin.L'` only if you build one. Tag the matching parts: head/ears/nose `'head'`, neck `'neck'`, torso `'spine'` (or split chest/belly),
sleeves `'upperarm.L'`, legs `'leg.L'`, boots `'foot.L'`; bind hair, hats, helmets `bone: 'head'`,
scarves `'chest'`, belts `'spine'`. Build the left side and `pair()` it; tags are renamed.

The walk and run gaits used by the rogue are in `references/animation.md`.

## Failure modes seen in practice

- **Eyes too small or too close**: the face reads as blank at game size.
- **Hat or helmet swallowing the head**: brim too low and too wide; keep the fringe and the
  brows visible.
- **Hair poking through a hat**: intersect the hair with the hat's inside.
- **Fork fingers**: thin separate fingers read as claws; make them thicker and blend them.
- **Brow slant backwards**: gives the opposite mood. Check which end is lower.
- **Stiff A-pose silhouette with arms glued to the body**: angle the arms 25 to 35 degrees
  out so the silhouette separates arms from the torso.
