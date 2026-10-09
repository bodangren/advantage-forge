# traveler (npcs/settlement/traveler) -> assets/traveler.ts

An eager young traveler with a big backpack and a feathered hat, reading an open map. About 1.0 m to the top of the hat, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a road NPC who trades news from far towns and gives travel quests; seen at the inn and on roads in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/traveler_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
a wide-brimmed brown traveler hat with a red feather; tousled sandy blond hair at the temples and the nape; a short dark green cloak over the shoulders to the waist; a tan tunic; a brown belt with two pouches; brown trousers; tall brown boots; a big backpack on the back with a rolled red blanket on top (a body on the chest bone); an open paper map held in both hands in front of the chest; an eager smile.

Palette: skin #e8b48e; hair #c4974a; hat #6b4a2c with a #c84040 feather; cloak #2f4a3a; tunic #c8a878; belt #5a3a24; trousers #6b4a2c; boots #4a3424; backpack #8a6a3a with a #a83a3a blanket; map #ece0c4 with #7a5a3a lines.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the cloak #2f4a3a first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Two-hand hold: set `hold: { elbow, wrist }` on the kind (see assets/baker.ts: elbow [0.165, 0.325, 0.035], wrist [0.185, 0.295, 0.13]; move them for a higher or lower hold). The kind then keeps both fists on the item in every clip and keeps it level. Build the item in the rest pose between the fists, tagged `.bone('hand.R')`, so `./forge check` tests it as a held item. The item: an open paper map 0.24 x 0.16 m and 0.012 m thick or more, held open in front of the chest and tilted toward his face (raise the hold: wrist y about 0.31).

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). Give a grin round corners and one white tooth band in the middle: sharp dark mouth corners read as fangs at 128 px. A beard or a mustache is its own body on the head bone. For men, boys, and elders whose mockup shows no lashes, set `lashes: false` on the kind (the default face paints winged lashes). A bigger or rounder nose is its own small body on the head bone in the skin tint (`k.tint('skin')`).
- Keep the kind's clips. Check the cheer, attack, and rest strips (`./forge animate traveler --fast --clip rest`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check traveler` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/traveler.ts. Never commit. Finish with one `./forge all traveler`.
