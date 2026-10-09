# scholar (npcs/settlement/scholar) -> assets/scholar.ts

A bright, curious young scholar in a blue academic robe and a square cap, reading a thick open book. About 1.0 m to the top of the square cap, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: an academy NPC who explains lore and gives reading quests; seen at the academy and the library in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/scholar_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
a dark blue square academic cap (a flat square board on a round skull cap) with a gold tassel; black curly hair in a round puff at the back and curls at the temples; round dark glasses frames; a dark blue scholar robe to the shins with a gold trimmed collar and wide sleeves (leg clearance in walk and run); brown shoes; an open thick book held in both hands in front of the chest; an excited smile.

Palette: skin #8a5a3e; hair #231a17; glasses #3a2a22; cap #232a44 with a #e0b040 tassel; robe #2f3f6a with #e0b040 trim; shoes #4a3424; book cover #7a3a2a, pages #f0e6cc.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the robe #2f3f6a first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Two-hand hold: set `hold: { elbow, wrist }` on the kind (see assets/baker.ts: elbow [0.165, 0.325, 0.035], wrist [0.185, 0.295, 0.13]; move them for a higher or lower hold). The kind then keeps both fists on the item in every clip and keeps it level. Build the item in the rest pose between the fists, tagged `.bone('hand.R')`, so `./forge check` tests it as a held item. The item: an open thick book 0.18 m wide and 0.12 m tall, the pages up and tilted toward her face, held in front of the chest (raise the hold: wrist y about 0.31).

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). Give a grin round corners and one white tooth band in the middle: sharp dark mouth corners read as fangs at 128 px. A beard or a mustache is its own body on the head bone. For men, boys, and elders whose mockup shows no lashes, set `lashes: false` on the kind (the default face paints winged lashes). A bigger or rounder nose is its own small body on the head bone in the skin tint (`k.tint('skin')`).
- Keep the kind's clips. Check the cheer, attack, and rest strips (`./forge animate scholar --fast --clip rest`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check scholar` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/scholar.ts. Never commit. Finish with one `./forge all scholar`.
