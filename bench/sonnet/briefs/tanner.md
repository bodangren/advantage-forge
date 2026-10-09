# tanner (npcs/settlement/tanner) -> assets/tanner.ts

A strong, cheerful tanner in a thick leather apron, carrying a rolled leather hide in both hands. About 1.0 m to the top of the kerchief, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a craft NPC who buys hides and sells leather; seen at the tannery by the river in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/tanner_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
an orange kerchief tied over the hair with a knot at the back; brown hair at the temples and a short tail at the nape; a cream shirt with sleeves rolled to the elbow; a thick dark brown leather apron from the chest to the knees with a neck strap; brown trousers; tall brown boots; a rolled tan leather hide tied with a strap, carried across the chest in both hands; a confident smile.

Palette: skin #d49a72; kerchief #c87a3a; hair #6b3e22; shirt #f0e6cc; apron #4a3020; trousers #7a5a3a; boots #5a3a24; hide roll #c8a070 with #a88050 edges and a #6b4226 strap.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the shirt #f0e6cc first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Two-hand hold: set `hold: { elbow, wrist }` on the kind (see assets/baker.ts: elbow [0.165, 0.325, 0.035], wrist [0.185, 0.295, 0.13]; move them for a higher or lower hold). The kind then keeps both fists on the item in every clip and keeps it level. Build the item in the rest pose between the fists, tagged `.bone('hand.R')`, so `./forge check` tests it as a held item. The item: a rolled leather hide 0.26 m long and 0.08 m thick, tied with a strap, held level across the chest (raise the hold: wrist y about 0.31).

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). Give a grin round corners and one white tooth band in the middle: sharp dark mouth corners read as fangs at 128 px. A beard or a mustache is its own body on the head bone. For men, boys, and elders whose mockup shows no lashes, set `lashes: false` on the kind (the default face paints winged lashes). A bigger or rounder nose is its own small body on the head bone in the skin tint (`k.tint('skin')`).
- Keep the kind's clips. Check the cheer, attack, and rest strips (`./forge animate tanner --fast --clip rest`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check tanner` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/tanner.ts. Never commit. Finish with one `./forge all tanner`.
