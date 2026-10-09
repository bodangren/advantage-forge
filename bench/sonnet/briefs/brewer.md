# brewer (npcs/settlement/brewer) -> assets/brewer.ts

A jolly, round brewer in a flat cap and a brown vest, carrying a small wooden keg in both arms. About 1.0 m to the top of the flat cap, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a village NPC who brews and sells cider and ale; seen at the brewery and the tavern in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/brewer_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
a brown flat cap with a small green hop flower on the side; short ginger hair at the temples and the nape; a cream shirt with rolled sleeves; a brown vest; a short dark green apron; brown trousers; boots; a small round wooden keg with two iron hoops carried in front of the belly in both hands.

Palette: skin #f2c7a4; hair #b0582a; cap #6b4a32 with a hop #6a8a4a; shirt #f0ead8; vest #7a4a2c; apron #3f5e44; trousers #5a4434; boots #3a2a20; keg wood #a8743e with #5a5e66 hoops.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the vest #7a4a2c first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Two-hand hold: set `hold: { elbow, wrist }` on the kind (see assets/baker.ts: elbow [0.165, 0.325, 0.035], wrist [0.185, 0.295, 0.13]; move them for a higher or lower hold). The kind then keeps both fists on the item in every clip and keeps it level. Build the item in the rest pose between the fists, tagged `.bone('hand.R')`, so `./forge check` tests it as a held item. The item: a small wooden keg 0.22 m long and 0.17 m across with two iron hoops, lying on its side across the arms in front of the belly.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). A beard or a mustache is its own body on the head bone.
- Keep the kind's clips. Check the cheer and attack strips: nothing may pass through the head or tear.

Checks: `./forge check brewer` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/brewer.ts. Never commit. Finish with one `./forge all brewer`.
