# goblin-citizen (npcs/fantasy-peoples/goblin-citizen) -> assets/goblin-citizen.ts

A friendly, chatty goblin junk trader with a huge backpack of odds and ends, holding up a little brass bell. About 0.85 m to the top of the headscarf, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a goblin citizen of the market who trades odd trinkets and gives swap errands (friendly, never an enemy); seen at the market and the goblin bazaar in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/goblin-citizen_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
green skin; big pointed ears with small gold earrings; a yellow headscarf (no crest); a patched brown vest over a cream shirt; a red sash; baggy purple striped trousers; red pointed slippers; a huge backpack piled with pots, scrolls, and a small lantern (0.04 m or more from the head in every clip); a little brass bell held up in the right hand; a big friendly grin (round corners, never a snarl).

Palette: skin: the goblin default; scarf #e0b040; earrings #e0b040 (metalness 0.8); vest #6b4226 with #8a6a3a patches; shirt #ece0c8; sash #b03a3a; trousers #6a5a8a with #4a3a6a stripes; slippers #b03a3a; pack #8a6a3a with #c8a040 pots and #f0e6cc scrolls; bell #e0b040 (metalness 0.8).
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the vest #6b4226 first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `goblinAsset` in assets/parts/goblin-kind.ts. Read its header, `GoblinKind`, and `GoblinShape`. Worked example: assets/gremlin.ts (its own outfit in `outfit`, a wrench in place of the dagger in `weapon`, extra bodies in `extra`). Set `tuft: false` under the headscarf. Build this role's own clothes and props. The variant slots are the goblin kind's (`eyes`, `skin`, `clothing`, and one more), not the humanoid slots above.
Right hand (the viewer's left in the mockup): a little brass bell 0.07 m tall on a short wooden handle, built in `weapon` in the dagger frame (`goblin.held`), rigid on `dagger`. The backpack is rigid on `chest`; keep it 0.04 m or more from the head and the ears in every clip.
`./forge check` must end with `result ok`.

The mockup wins where it and this brief differ (sizes, sleeves, age, girl or boy).

What the reviewers failed most often in batches 1 to 3 (fix these before the first render):
- Hair as one smooth cap reads as a helmet or a hat, and a ragged lower edge reads as dripping. Build the visible hair from separate locks (8 or more chain locks or lobes) over a small cap that hugs the skull, with the mockup's fringe, parting, and color value.
- The role's held item is the focal point at 128 px. Make it at least the mockup size, with clear shape detail (a shoe has a toe, a heel, and laces; a letter is an envelope with a seal).
- Brows that slope down to the center read as stern. Keep them level or arched unless the mockup is angry.
- Skin must never show through gloves, sleeves, or hems, also in the walk strip seen from the side.
- A hat is the mockup's shape and height: a flat cap is low and wide, a tricorn has three soft upturned corners, not walls.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the body under them and cut bands with half-spaces; tag them like the body under them. Skirts and coat tails end above the knee unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the base's face, made friendly (level or arched brows, a smile, no scowl). Give a grin round corners and one white tooth band in the middle: sharp dark mouth corners read as fangs at 128 px. A beard or a mustache is its own body on the head bone.  A bigger or rounder nose is its own small body on the head bone in the skin tint (`k.tint('skin')`), not pink (a pink nose reads as a snout) unless the mockup shows a red nose. Large ears in the mockup: a larger ear shell over each kind ear in the skin tint.
- Keep the base's clip names. Check every strip (`./forge animate goblin-citizen --fast --clip <clip>`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check goblin-citizen` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/goblin-citizen.ts. Never commit. Finish with one `./forge all goblin-citizen`.
