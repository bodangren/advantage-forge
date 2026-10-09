# halfling-citizen (npcs/fantasy-peoples/halfling-citizen) -> assets/halfling-citizen.ts

A cheerful, plump halfling with curly hair and big bare feet, holding a big round berry pie in both hands. About 0.85 m to the top of the hat or hair, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a halfling citizen of the hill village who loves food and parties and gives cooking errands; seen at the hill village and the market in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/halfling-citizen_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
curly chestnut hair (locks) tied back with a green ribbon; rosy cheeks; a white blouse with puffed sleeves; a mustard yellow waistcoat with brown buttons; a green skirt to the knee; big bare feet with curly brown hair tufts on top (set `shoes: false` and build big skin feet on the foot bones); a big round berry pie with a lattice crust held in both hands at the belly; a big warm smile.

Palette: skin #f2c7a4 with #e08a7a cheeks; hair #7a4a2c; ribbon #3f6a44; blouse #f6f1ea; waistcoat #d0a030 with #6b4226 buttons; skirt #4a7a44; foot hair #7a4a2c; pie #d8a060 crust with #8a2a4a berries in a #c8ccd4 tin.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the skirt #4a7a44 first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Two-hand hold: set `hold: { elbow, wrist }` on the kind (see assets/baker.ts: elbow [0.165, 0.325, 0.035], wrist [0.185, 0.295, 0.13]; move them for a higher or lower hold). The kind then keeps both fists on the item in every clip and keeps it level. Build the item in the rest pose between the fists, tagged `.bone('hand.R')`, so `./forge check` tests it as a held item. The item: a big round berry pie 0.22 m across and 0.05 m thick with a lattice crust in a tin, held level at the belly.
Size: a halfling is small. Export `scaleAsset(humanoidAsset({...}), 0.85)` (assets/parts/scale-asset.ts; worked example assets/bat.ts) and build everything in the kind's units (the scale applies last). The bare feet must stay on the ground (`./forge check` ground ok).

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
- Keep the kind's clips. Check the cheer, attack, and rest strips (`./forge animate halfling-citizen --fast --clip rest`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check halfling-citizen` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/halfling-citizen.ts. Never commit. Finish with one `./forge all halfling-citizen`.
