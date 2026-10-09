# potter (npcs/settlement/potter) -> assets/potter.ts

A calm, smiling potter with clay-smudged sleeves and a stained apron, holding up a freshly made clay vase. About 1.0 m to the top of the top-knot bun, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a craft NPC who sells pots and jars; seen at the pottery in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/potter_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
dark brown hair in a top-knot bun with a blue band, locks at the temples; a clay smudge on the cheek (paint); clay smudges on the forearms (paint); a mustard yellow shirt with rolled sleeves; a clay-stained brown apron; gray trousers; brown clogs; a freshly made orange clay vase with a curved handle, held up in front of the chest in both hands.

Palette: skin #f2c7a4; hair #4a2e1c; headband #3a6ab0; clay smudges #b8683a; shirt #d0a030; apron #7a5a3a with #b8683a stains; trousers #6a6870; clogs #6b4226; vase #c8703a with #a8582a rings.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the shirt #d0a030 first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Two-hand hold: set `hold: { elbow, wrist }` on the kind (see assets/baker.ts: elbow [0.165, 0.325, 0.035], wrist [0.185, 0.295, 0.13]; move them for a higher or lower hold). The kind then keeps both fists on the item in every clip and keeps it level. Build the item in the rest pose between the fists, tagged `.bone('hand.R')`, so `./forge check` tests it as a held item. The item: an orange clay vase 0.18 m tall and 0.13 m across with one curved handle, held upright in front of the chest (raise the hold: wrist y about 0.33).

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). Give a grin round corners and one white tooth band in the middle: sharp dark mouth corners read as fangs at 128 px. A beard or a mustache is its own body on the head bone. For men, boys, and elders whose mockup shows no lashes, set `lashes: false` on the kind (the default face paints winged lashes). A bigger or rounder nose is its own small body on the head bone in the skin tint (`k.tint('skin')`).
- Keep the kind's clips. Check the cheer, attack, and rest strips (`./forge animate potter --fast --clip rest`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check potter` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/potter.ts. Never commit. Finish with one `./forge all potter`.
