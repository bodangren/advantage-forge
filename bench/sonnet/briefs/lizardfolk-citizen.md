# lizardfolk-citizen (npcs/fantasy-peoples/lizardfolk-citizen) -> assets/lizardfolk-citizen.ts

A friendly green lizardfolk river trader with a teal headscarf and a shell necklace, holding up a big spiral seashell. About 1.0 m to the top of the frill, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a lizardfolk citizen of the river town who trades shells and river goods and gives river errands (friendly, never an enemy); seen at the river market and the docks in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/lizardfolk-citizen_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
green scaly skin (scales in bump); a long rounded snout with a closed friendly smile (no bared teeth); big yellow eyes; a small orange head frill; a cream belly; a long green tail; a teal headscarf; a woven reed vest; a necklace of small shells; a brown wrap skirt with a belt; bare clawed feet; a big pink spiral seashell held up in the right hand; a cheerful look.

Palette: skin #5a8a4a with a #e8dcb0 belly; frill #e0803a; eyes #f0c830; scarf #2a7a7a; vest #c8a870; shells #f0d0c0 and #ece0c8; skirt #6b4226 with a #5a3a24 belt; claws #ece0c8; seashell #f0a0a0 with #f6e0d0.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the vest #c8a870 first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: copy assets/kobold-warrior.ts (a reptile body on the goblin skeleton, with a tail and clips) to assets/lizardfolk-citizen.ts and rename it (the header, `name`, the catalog id). Keep the body plan, the skeleton, the tail, and the clip names. Remove the armor and the spear. Make the face friendly: a rounder, shorter snout, a closed smile, level brows, no fangs. The kobold is 0.87 m tall: export `scaleAsset(defineAsset({...}), 1.15)` (assets/parts/scale-asset.ts) so that the citizen is about 1.0 m. The variant slots: skin (the scale color), eyes, cloth (the vest), and one more (the scarf).
Right hand (the viewer's left in the mockup): a big pink spiral seashell 0.12 m long, held up, rigid on the bone that held the spear (move that bone's joint to the fist if needed). Keep the shell 0.04 m or more from the head and the snout in every clip.
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
- Keep the base's clip names. Check every strip (`./forge animate lizardfolk-citizen --fast --clip <clip>`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check lizardfolk-citizen` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/lizardfolk-citizen.ts. Never commit. Finish with one `./forge all lizardfolk-citizen`.
