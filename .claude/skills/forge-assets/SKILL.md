---
name: forge-assets
description: Create and revise game-ready 3D assets with Fantasy Asset Forge — heroes, NPCs, monsters, wildlife, props, vegetation, buildings, terrain tiles, vehicles, effects, weapons, and items — as code-first SDF models with baked textures, rigging, animation, and pixel-art sprites. Use this skill for ANY request in this repo to make, model, sculpt, design, improve, texture, rig, animate, or render an asset (for example "make a goblin", "add a lantern prop", "build a tavern", "the tree looks like broccoli, fix it", "give the wolf a run cycle", "make sprites for the chest"), even when the user does not say "asset" or "skill". It contains the art direction that separates memorable assets from generic ones.
---

# Creating assets with Fantasy Asset Forge

You write an asset as a TypeScript file in `assets/<name>.ts`. Forge meshes it into smooth
medium-poly geometry, bakes textures, optionally rigs and animates it, and renders turnarounds
and sprites. The API reference is in `AGENTS.md` at the repo root; read it once before your
first asset. This skill is about *how to make assets good*: the process, the art direction, and
the pitfalls that cost the most time.

The bar is not "a shape that matches the words in the brief". The bar is an asset a game artist
would be happy to ship: it reads instantly as a silhouette, it has appealing proportions and a
clear focal point, its materials are distinct, its colors are harmonious, and it holds up at the
size the player will see it (often a 128 px sprite).

## Before you start

1. Read the brief and decide the category. Open the matching playbook — it has proportions,
   construction recipes, a skeleton template if relevant, and the failure modes to avoid:
   - characters (humanoids, NPCs, heroes): `references/characters.md`
   - creatures and monsters (beasts, quadrupeds, slimes, flyers): `references/creatures.md`
   - props (barrels, chests, crates, furniture, containers): `references/props.md`
   - vegetation and rocks (trees, bushes, flowers, boulders): `references/vegetation.md`
   - architecture (houses, walls, towers, wells, stalls): `references/architecture.md`
   - items (weapons, tools, potions, pickups, shields, equipment): `references/items.md`
   - vehicles, effects geometry (slash arcs, fireballs, mist), terrain tiles (roads, rivers,
     cliffs), and wildlife: `references/vehicles-effects-terrain.md`
   - rigging and animation for any category: `references/animation.md`
   - color, value, and material values: `references/materials-and-color.md`
   - review rubric and final report: `references/review.md`
2. Open the closest worked example in `assets/` and skim how it is built. They were iterated
   to a good result and show the techniques in context:
   `rogue.ts` (character: face, hair inside a hood, clothing, cape, rig, walk/run),
   `archer.ts` and `knight.ts` (heroes on the rogue's head and skeleton: a bow, a helm with
   hair under it, armor, a shield, a sword), `horned-boar.ts` (quadruped
   monster, surface probes, trot), `treasure-chest.ts` (prop with an opening lid),
   `barrel.ts` (hard-surface prop, per-stave color), `oak-tree.ts` (stylized tree, wind),
   `cottage.ts` (building, stone, timber frame, shingles), `knight-sword.ts` (item).

## The process

Work in passes, from big to small. Most weak results come from skipping ahead to details
before the silhouette and proportions are right; details cannot rescue a bad silhouette, and
every detail you add early makes later proportion changes more expensive.

### 1. Write a design note at the top of the file

In a comment, in 6 to 10 lines, decide:

- **Role**: what the asset is for in the game and how big it is on screen (hero character,
  background prop, pickup icon). This sets the detail budget.
- **Size** in meters, and where it stands (on `y = 0`, facing +Z).
- **The one idea**: the single most important visual trait, stated in one sentence
  ("a boar that is all head and shoulders, with tusks and swept horns"). Exaggerate this trait.
- **Shape language**: round (friendly, soft), square (sturdy, reliable), triangular/spiky
  (dangerous, fast). Pick a dominant language and one secondary.
- **Palette**: 3 to 5 colors with hex values and a value plan (which parts are dark, mid,
  light). One accent color for the focal point.
- **Materials**: one list entry per `k.body` (skin, cloth, leather, metal, wood, stone...).
- **Detail list**: primary forms, secondary forms (bands, plates, straps), tertiary texture
  (bump, paint). Mark the focal point.
- **Rig/animation**: needed or not; which clips.

This takes a minute and prevents the most common failure: a generic, featureless result.

### 2. Blockout (silhouette pass)

Build only the big forms: 3 to 8 primitives, no paint, no details, one or two bodies. Render
with `./forge render <name> --fast` and look at `out/<name>/render.png` with the Read tool.

Judge the silhouette only. Would a stranger name the object from a black cutout of the front
and side views? Are the proportions exaggerated in the direction of "the one idea"? Is there a
clear big/medium/small rhythm of forms, or is everything the same size? Iterate until yes —
moving a primitive now costs seconds.

### 3. Forms (shape pass)

Blend the blockout into sculpted forms with `smoothUnion`, add the secondary forms (joints,
cheeks, bellies, plates, trims), and tag parts with `.bone()` if it will be rigged. Keep
comparing front, side, and back. If there is a reference image, set `reference:` so it shows
above the views, and compare silhouette, then proportions, then details.

### 4. Materials and color

Split into one body per material with fitting `roughness`/`metalness`
(`references/materials-and-color.md`). Paint with `paintWhere`, `paintFn`, and noise. Check
the value plan: squint at the render — the focal point should have the strongest contrast.

### 5. Details

Add details in order of importance, and stop when the asset reads. Attach details to surfaces
with the probes (`sdf.raycast`, `sdf.surfacePoint`), never by guessing coordinates. Put fine
surface texture (stone, grain, fur, weave, shingles) in the body's `bump` option, not in
`displace`, so it goes into the normal map and the mesh stays light.

### 6. Review after every render

After each render, write down the three largest problems, in order, then fix the first one.
If you cannot view images, run `./forge inspect <name> --fast` after every build instead: it
reports, as text, how much of each part is visible from each view (0% means buried inside
another part), the silhouette size per view, the value and color spread, floating parts, and
ground contact. Treat its warnings as problems to fix. Even with vision, run it once: it
catches buried and floating parts that are easy to miss in a picture.
Use the rubric in `references/review.md`. Zoom in with `--focus x,y,z,r` on faces, hands,
and joins. Look at the sprites (`./forge sprites <name> --fast`) early for anything a player
will see small: this is where thin details and weak faces show up.

### 7. Rig and animate (if needed)

Follow `references/animation.md`: skeleton at real joints, `.bone()` tags on the parts you
built from, rigid `bone:` for accessories, clips as `pose(t, phase)` functions. Review with
`./forge animate <name> --fast` and read the strip image: feet planted, no intersections,
loop seamless, motion reads in the side view.

### 8. Final build and report

Run `./forge all <name>` (textures, turnaround, sprites, all clips). Read the final
`render.png` and `sprites/preview.png`. Fix any `warning:` line. Then report using the template
in `references/review.md`: what you made, triangles, timings, file paths, and known limits.

## Art direction principles

These are the choices that make an asset interesting rather than merely correct.

**Silhouette first.** Players recognize things by outline before anything else. Give every
asset at least one feature that breaks its outline: horns, a crest, a tilted hat brim, a
chimney, a curved guard, a branch sticking out of a canopy. A shape that is a smooth blob or a
plain box from every side is forgettable. Check the side view: many silhouettes die there.

**Exaggerate the defining trait.** Stylized art is caricature. If it is a boar, the head,
shoulders, and tusks are huge and the rump is small. If it is a chibi, the head is 40% of the
height. If it is a treasure chest, it bulges with gold. Push proportions further than feels
comfortable, then look again.

**Big, medium, small.** Good forms have a rhythm: one dominant mass, a few medium forms, many
small ones. Avoid many parts of the same size — ten equal spheres read as noise. The tree canopy
works because clumps range from 0.36 to 0.62 m around a big central mass.

**Rest areas.** Detail needs calm around it to read. Leave plain areas (a smooth cheek, a
plain plaster wall, a clean blade) and concentrate detail at the focal point (face, lock,
emblem, door). Noise applied everywhere turns into mush.

**Shape language tells character.** Round and soft for friendly, cute, and harmless. Square and
blocky for sturdy, stubborn, and safe. Triangles and spikes for danger, speed, and aggression.
A monster made only of spheres looks like a toy; add spikes, horns, a heavy angry brow. A
friendly villager made of sharp angles looks sinister.

**Value before hue.** Plan light, mid, and dark areas first; hue comes second. The focal point
gets the strongest value contrast. Use 60/30/10: one dominant color, one secondary, and a small
accent (gold lock, glowing eyes, flower box, teal scarf). Keep saturated colors small. Avoid
pure black and pure white; shade with a darker, slightly warmer or cooler version of the base
color, not gray.

**Materials must read as different.** Each material differs from its neighbors in at least two
of: value, hue, roughness, metalness. Metal is metalness 0.7 to 1 and roughness 0.25 to 0.55;
wood 0.8; cloth 0.85; skin 0.5 to 0.6; stone 0.9; gems roughness 0.1 with `flat: true`.

**Readable at game size.** At 128 px, anything thinner than about 1.5% of the asset height
disappears, and faces become 10 pixels wide. Make eyes large and high contrast, mouths bold,
emblems simple. Thicken straps and blades beyond realism. Check `sprites/preview.png`.

**Soft bevels everywhere.** Nothing in this style has a razor edge: round boxes
(`box(size, 0.01..0.03)`), fillets (`smoothUnion` k 0.01 to 0.06). Bevels catch light and make
forms read.

**Tell a small story.** One or two touches of use and place: moss on the north side of a
trunk, a dent, a stain, coins spilling from a chest, flowers under a window. Keep them small and
few; they are seasoning.

**Consistency across a set.** Assets that belong together share scale (a door is 2 m), bevel
size, palette family, and detail density. When you add to an existing set, open a neighbor
asset and match it.

## Technical rules that save the most time

- Conventions: meters, +Y up, the asset faces +Z, stands on `y = 0`, +X is its left (`.L`).
- **Probe, don't guess.** Place eyes, horns, spikes, rivets, and buttons with
  `sdf.raycast(shape, from, direction)` or `sdf.surfacePoint(shape, p, lift)` on the shape they
  sit on. Guessed coordinates bury details inside the body or leave them floating.
- **Paint stencils must cross the surface.** A thin torus floating in front of a face paints
  nothing. For face marks use `sdf.extrude(profile.arc(...), 0.3)` pushed through the face.
- **`bump` for texture, `displace` for form.** Displacement over about 5 mm, or that changes the
  silhouette, belongs in `displace`. Stone, grain, fur, shingles, and weave belong in `bump`.
  Displacing fine noise multiplies triangle counts (a cottage went from 40k to 188k).
- **Keep parts at least two cells thick** (`2 * detail`). Thinner parts break up. Lower
  `detail` for that body, or make the part thicker (it will read better anyway).
- **Unique names**: bones and bodies share one namespace. A body named `lid` and a bone named
  `lid` breaks the animation.
- **`halfSpace` must be intersected** with a finite shape; alone it has no bounds.
- **`.mirror('x')`** blends the two halves where they meet (good for organic shapes). Use
  `.mirror('x', 0)` for hard-surface copies that must stay separate (fittings, straps).
- **Smooth-blend size `k`** is the fillet in meters: 0.005 to 0.015 crisp, 0.02 to 0.04 soft,
  0.05 to 0.1 fleshy. Too large a `k` melts features together.
- **Faces and small painted detail**: set `textureDensity: 2` on that body.
- **Budget**: the asset file makes the full-quality model. Do not remove detail that shows to
  meet a triangle number; a reduced real-time model is planned as a separate output later.
  Typical full models: heroes 40k to 70k triangles, props 3k to 30k, buildings 30k to 60k,
  items 2k to 10k. `./forge build` prints the count per body. Cut waste, not look: a body far
  over its share almost always has fine `displace` that should be `bump`, or hidden surfaces.
- **Iterate with `--fast`** (vertex colors, about 5 s). Textured builds take 15 to 30 s; do them
  when the shape is right, and to check bump detail.
- **Worn equipment is a part module.** Build a character's helmet, hat, weapon, or shield in
  `assets/parts/<host>-<piece>.ts` (a function that returns a `Part`), add it to the character
  with `addPart(k, part, { pose })`, and give it a standalone `assets/<host>-<piece>.ts` that
  stands it on the ground. The part keeps the exact worn size. Follow `docs/equipment-parts.md`.
- **Equipment declares where it goes on the avatar.** Give every wearable asset an `equip` block
  (`slot`, `origin` and `rotate` from its rest pose, `fitScale`, `hides`) and run
  `./forge check <piece>` until it ends with `fit ok`; look at
  `./forge render avatar-base --wear <piece> --fast`. Sockets: `docs/equipment-parts.md`.
- **If the tool is missing something, extend `src/`** with a small, tested function rather than
  forcing a hack into the asset. Run `pnpm test` and `pnpm typecheck` afterwards.

## When you are stuck

- *It looks generic.* Go back to the design note. Exaggerate the one idea by 30%, add a
  silhouette-breaking feature, and cut detail that does not serve the focal point.
- *It looks lumpy.* Too many same-size parts or too much noise. Merge small parts into fewer
  bigger forms; lower noise amplitude; add rest areas.
- *It looks like a toy.* All-round shapes and flat color. Add some hard or sharp forms, a
  material with metalness, and value contrast.
- *The face is weak.* Bigger eyes, higher contrast, brows that express the mood (inner end
  low = angry, outer end low = sad), a clear mouth shape. See `references/characters.md`.
- *A detail keeps disappearing.* It is inside another body or thinner than two cells. Probe
  the surface and check thickness.
