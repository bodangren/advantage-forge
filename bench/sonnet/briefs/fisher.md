# fisher (npcs/settlement/fisher) -> assets/fisher.ts

A cheerful fisher in a yellow rain hat and a yellow raincoat, holding a fishing rod and a fish. About 1.0 m to the top of the sou'wester hat, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a harbor and river NPC who sells fish; seen at the docks in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/fisher_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
a yellow sou'wester rain hat with a long back brim; short black hair at the temples; a yellow raincoat to the knees with toggle buttons; a navy sweater collar at the neck; tall dark green boots; a silver fish held out by the tail in the right hand; a wooden fishing rod held upright in the left hand (with a line and a small red float).

Palette: skin #f2c7a4; hair #231a17; hat and coat #e0b030 with #b08a20 seams; toggles #6b4226; collar #2a3a5a; boots #2f4a3a; rod #9a6a3a with a #b03a3a float; fish #a8b0b8 (metalness 0.4) with a #6a7a8a back.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the raincoat #e0b030 first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Right hand (the viewer's left in the mockup): a silver fish 0.2 m long and 0.03 m thick, held by the tail, hanging down, held out in front. Make it a body with the body option `bone: 'knife.R'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the right fist (x < 0).
Left hand (the viewer's right in the mockup): a wooden fishing rod 0.7 m long and 0.03 m thick, held upright, with a reel, a line, and a small red float. Make it a body with the body option `bone: 'knife.L'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the left fist (x > 0).
Arm pose: the mockup shows the right hand held out in front at chest height. Set `pose: { R: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] } }` on the kind (left-side values; the kind mirrors R). Tune the values until the fist matches the mockup, and keep the fist and the item 0.04 m or more from the head. A posed arm keeps its pose in every clip. Build sleeves and cuffs with `h.perArm` so that they follow each arm, and build the item at the posed grip (`h.arms.R.GRIP` mirrored to x < 0 for the right hand, `h.arms.L.GRIP` for the left) in the orientation of the mockup.
`./forge check` must end with `result ok`.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). A beard or a mustache is its own body on the head bone.
- Keep the kind's clips. Check the cheer and attack strips: nothing may pass through the head or tear.

Checks: `./forge check fisher` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/fisher.ts. Never commit. Finish with one `./forge all fisher`.
