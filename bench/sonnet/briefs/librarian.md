# librarian (npcs/settlement/librarian) -> assets/librarian.ts

A kind older librarian with half-moon glasses on a chain and a gray-blue cardigan, carrying a tall stack of books in both hands. About 1.0 m to the top of the hair bun, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a town NPC who keeps the library and lends books; seen at the library in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/librarian_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
silver hair in a neat low bun and soft locks at the temples; half-moon glasses on a thin gold chain; a soft gray-blue cardigan over a cream blouse with a lace collar; a long dark green skirt to the ankles (leg clearance in walk and run); brown shoes; a tall stack of four old books (red, blue, green, brown) carried in front of the chest with both hands; a gentle smile.

Palette: skin #f2c7a4; hair #c8c4cc; glasses and chain #c8a040; cardigan #6a7a9a; blouse #f0ead8; skirt #2f4a3a; shoes #5a3a24; books #a03a3a, #3a5a9a, #3f6a44, #7a4a2c with #ece0c4 pages.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the cardigan #6a7a9a first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Two-hand hold: set `hold: { elbow, wrist }` on the kind (see assets/baker.ts: elbow [0.165, 0.325, 0.035], wrist [0.185, 0.295, 0.13]; move them for a higher or lower hold). The kind then keeps both fists on the item in every clip and keeps it level. Build the item in the rest pose between the fists, tagged `.bone('hand.R')`, so `./forge check` tests it as a held item. The item: a stack of four books 0.2 x 0.15 m and 0.22 m tall in all, carried upright in front of the chest (raise the hold: wrist y about 0.32).

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). Give a grin round corners and one white tooth band in the middle: sharp dark mouth corners read as fangs at 128 px. A beard or a mustache is its own body on the head bone. For men, boys, and elders whose mockup shows no lashes, set `lashes: false` on the kind (the default face paints winged lashes). A bigger or rounder nose is its own small body on the head bone in the skin tint (`k.tint('skin')`).
- Keep the kind's clips. Check the cheer, attack, and rest strips (`./forge animate librarian --fast --clip rest`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check librarian` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/librarian.ts. Never commit. Finish with one `./forge all librarian`.
