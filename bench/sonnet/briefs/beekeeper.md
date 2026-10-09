# beekeeper (npcs/settlement/beekeeper) -> assets/beekeeper.ts

A cheerful beekeeper in a wide hat with a net veil pushed back, a cream work suit, and thick gloves, holding up a honey pot with a dipper. About 1.0 m to the top of the hat, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a village NPC who sells honey and wax; seen at the farm and the meadow in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/beekeeper_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
a short blond bob; a wide cream hat with a white net veil pushed back over the brim; a small yellow-and-black striped bee sitting on the hat (attached, not floating); a cream work suit with a zip; thick yellow gloves; tall brown boots; a round clay honey pot with dripping honey and a wooden dipper, held up in the right hand.

Palette: skin #f2c7a4; hair #d8b060; hat #ece0c4; veil #f6f1ea (opacity 0.7); bee #e0b030 with #2a2428 stripes; suit #e8e0cc with #c8bea8 seams; gloves #e0b040; boots #6b4226; pot #c8804a with honey #e8a020; dipper #9a6a3a.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the work suit #e8e0cc first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Right hand (the viewer's left in the mockup): a round clay honey pot 0.1 m across with honey dripping from the rim and a wooden dipper standing in it. Make it a body with the body option `bone: 'knife.R'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the right fist (x < 0).
Arm pose: the mockup shows the right hand held out in front at chest height. Set `pose: { R: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] } }` on the kind (left-side values; the kind mirrors R). Tune the values until the fist matches the mockup, and keep the fist and the item 0.04 m or more from the head. A posed arm keeps its pose in every clip. Build sleeves and cuffs with `h.perArm` so that they follow each arm, and build the item at the posed grip (`h.arms.R.GRIP` mirrored to x < 0 for the right hand, `h.arms.L.GRIP` for the left) in the orientation of the mockup.
`./forge check` must end with `result ok`.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). Give a grin round corners and one white tooth band in the middle: sharp dark mouth corners read as fangs at 128 px. A beard or a mustache is its own body on the head bone. For men, boys, and elders whose mockup shows no lashes, set `lashes: false` on the kind (the default face paints winged lashes). A bigger or rounder nose is its own small body on the head bone in the skin tint (`k.tint('skin')`).
- Keep the kind's clips. Check the cheer, attack, and rest strips (`./forge animate beekeeper --fast --clip rest`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check beekeeper` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/beekeeper.ts. Never commit. Finish with one `./forge all beekeeper`.
