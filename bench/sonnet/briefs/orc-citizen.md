# orc-citizen (npcs/fantasy-peoples/orc-citizen) -> assets/orc-citizen.ts

A big, gentle orc farmer in a straw hat and overalls, carrying a basket of giant vegetables. About 1.1 m to the top of the straw hat, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: an orc citizen of the farm town who grows giant vegetables and gives farm errands (gentle and kind, never an enemy); seen at the farm and the market in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/orc-citizen_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
green skin; small round tusks; a black topknot poking out of a wide straw hat; kind eyes under level brows; blue denim overalls over a red checked shirt with rolled sleeves; big brown boots; a woven basket full of giant carrots, a cabbage, and a small pumpkin hanging from the right fist; the left hand raised in a wave; a big gentle smile.

Palette: skin: the orc warrior's green; hair #231a17; hat #d8b860 with a #b03a30 band; overalls #3a5a8a with #c8a040 buttons; shirt #b03a30 with #f0e6cc checks; boots #6b4226; basket #a8784a; carrots #e07a2a with #4a7a3a tops; cabbage #8ab04a; pumpkin #e0902a.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the overalls #3a5a8a first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: copy assets/orc-warrior.ts (the orc body, head, rig, and clips) to assets/orc-citizen.ts and rename it (the header, `name`, the catalog id). Keep the body, the head, the skeleton, and the clip names. Remove the pauldron, the bracers, the loincloth, the war look, and the axe. Soften the face: smaller round tusks, a big smile, level brows, and no scowl. Add the clothes, the hat, and the basket. The variant slots: skin, hair, eyes, and cloth (the overalls), on the orc's own skin options.
Right hand (the viewer's left in the mockup): a woven basket 0.2 m across full of giant vegetables, hanging from the fist, rigid on the bone that held the axe. Left hand: raised in a wave in the rest pose; in the clips keep the basket and both fists 0.04 m or more from the head and the hat.
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
- Keep the base's clip names. Check every strip (`./forge animate orc-citizen --fast --clip <clip>`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check orc-citizen` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/orc-citizen.ts. Never commit. Finish with one `./forge all orc-citizen`.
