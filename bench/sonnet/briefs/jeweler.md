# jeweler (npcs/settlement/jeweler) -> assets/jeweler.ts

A neat, delighted jeweler with a gold monocle and a purple velvet vest, holding up a sparkling blue gem. About 1.0 m to the top of the hat or hair, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a shop NPC who buys and sells gems and rings; seen at the jewelry shop in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/jeweler_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
slicked black hair; a small pointed black beard (its own body); a round gold monocle over the left eye (on the viewer's right); a white shirt; a purple velvet vest with gold buttons and a gold watch chain; black trousers; shiny black shoes; a big faceted blue gem set on a gold handle (like a hand mirror) held up in the right hand; a small red velvet ring box with a gold ring in the left hand.

Palette: skin #f2c7a4; hair and beard #231a17; monocle #c8a040 with a #a8d8e8 lens; shirt #f6f1ea; vest #5a3a7a with gold #e0b040 buttons and chain; trousers and shoes #2a2428; gem #3a8ad8 (emissive 0.4, metalness 0.3); box #a03040 with a #e0b040 ring.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the vest #5a3a7a first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Right hand (the viewer's left in the mockup): a big faceted blue gem 0.09 m across set on a gold handle 0.1 m long, held up like a hand mirror. Make it a body with the body option `bone: 'knife.R'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the right fist (x < 0).
Left hand (the viewer's right in the mockup): a small red velvet ring box 0.07 m across, open, with a gold ring. Make it a body with the body option `bone: 'knife.L'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the left fist (x > 0).
Arm pose: the mockup shows the right hand raised beside the head. Set `pose: { R: { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] } }` on the kind (left-side values; the kind mirrors R). Tune the values until the fist matches the mockup, and keep the fist and the item 0.04 m or more from the head. A posed arm keeps its pose in every clip. Build sleeves and cuffs with `h.perArm` so that they follow each arm, and build the item at the posed grip (`h.arms.R.GRIP` mirrored to x < 0 for the right hand, `h.arms.L.GRIP` for the left) in the orientation of the mockup.
`./forge check` must end with `result ok`.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). Give a grin round corners and one white tooth band in the middle: sharp dark mouth corners read as fangs at 128 px. A beard or a mustache is its own body on the head bone. For men, boys, and elders whose mockup shows no lashes, set `lashes: false` on the kind (the default face paints winged lashes). A bigger or rounder nose is its own small body on the head bone in the skin tint (`k.tint('skin')`).
- Keep the kind's clips. Check the cheer, attack, and rest strips (`./forge animate jeweler --fast --clip rest`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check jeweler` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/jeweler.ts. Never commit. Finish with one `./forge all jeweler`.
