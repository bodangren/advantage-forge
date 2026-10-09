# weaver (npcs/settlement/weaver) -> assets/weaver.ts

A cheerful, plump weaver with knitting needles in her bun, carrying a basket full of colorful yarn balls. About 1.0 m to the top of the hair bun, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a craft NPC who sells cloth and yarn; seen at the weaving house and the market in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/weaver_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
brown hair with gray streaks in a round bun with two knitting needles stuck in it, soft locks at the temples; rosy cheeks; a short knitted scarf with red, yellow, blue, and green stripes (it must clear the chin in the rest clip); a lavender dress to the knee; a cream apron; a plump round body; brown shoes; a round wicker basket with five yarn balls carried in both hands; a warm smile.

Palette: skin #f2c7a4; hair #7a5a44 with #a8a0a0 streaks; needles #c8a060; scarf stripes #c84040, #e0b040, #3a6ab0, #3f6a44; dress #8a78a8; apron #f0e6cc; shoes #5a3a24; basket #a8784a; yarn #c84040, #e0b040, #3a6ab0, #b05a90, #f0e6cc.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the dress #8a78a8 first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Two-hand hold: set `hold: { elbow, wrist }` on the kind (see assets/baker.ts: elbow [0.165, 0.325, 0.035], wrist [0.185, 0.295, 0.13]; move them for a higher or lower hold). The kind then keeps both fists on the item in every clip and keeps it level. Build the item in the rest pose between the fists, tagged `.bone('hand.R')`, so `./forge check` tests it as a held item. The item: a round wicker basket 0.22 m across and 0.1 m tall with five yarn balls 0.05 m across, carried in front of the waist (wrist y about 0.29).

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
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). Give a grin round corners and one white tooth band in the middle: sharp dark mouth corners read as fangs at 128 px. A beard or a mustache is its own body on the head bone. For men, boys, and elders whose mockup shows no lashes, set `lashes: false` on the kind (the default face paints winged lashes). A bigger or rounder nose is its own small body on the head bone in the skin tint (`k.tint('skin')`), not pink (a pink nose reads as a snout) unless the mockup shows a red nose. Large ears in the mockup: a larger ear shell over each kind ear in the skin tint.
- Keep the kind's clips. Check the cheer, attack, and rest strips (`./forge animate weaver --fast --clip rest`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check weaver` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/weaver.ts. Never commit. Finish with one `./forge all weaver`.
