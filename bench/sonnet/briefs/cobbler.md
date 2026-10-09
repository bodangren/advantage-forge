# cobbler (npcs/settlement/cobbler) -> assets/cobbler.ts

An old cobbler with white hair, a white mustache, and spectacles on the nose, in a leather apron, holding up a little red shoe and a small hammer. About 1.0 m to the top of the head, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a village NPC who makes and mends shoes; seen in the village shop in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/cobbler_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
a bald top with fluffy white hair at the sides and the back; a white mustache (its own body); small round spectacles on the nose; a cream shirt with rolled sleeves; a brown leather apron from the chest to the knees; dark green trousers; brown shoes; a little red shoe held up in the right hand; a small cobbler hammer held up in the left hand.

Palette: skin #f2c7a4; hair and mustache #f0ece4; spectacles #6a6e78; shirt #f0ead8; apron #6b4226; trousers #3f5040; shoes #5a3a24; red shoe #b03a3a with a #3a2a20 sole; hammer #6a6e78 with a #8a5a35 handle.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the apron #6b4226 first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Right hand (the viewer's left in the mockup): a little red shoe 0.14 m long and 0.06 m tall with a dark sole, held up beside the head. Make it a body with the body option `bone: 'knife.R'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the right fist (x < 0).
Left hand (the viewer's right in the mockup): a small cobbler hammer 0.2 m long with a round head, held up beside the head. Make it a body with the body option `bone: 'knife.L'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the left fist (x > 0).
Arm pose: the mockup shows the right hand raised beside the head and the left hand raised beside the head. Set `pose: { R: { elbow: [0.19, 0.345, 0.03], wrist: [0.215, 0.43, 0.09] }, L: { elbow: [0.19, 0.345, 0.03], wrist: [0.215, 0.43, 0.09] } }` on the kind (left-side values; the kind mirrors R). Tune the values until the fist matches the mockup, and keep the fist and the item 0.04 m or more from the head. A posed arm keeps its pose in every clip. Build sleeves and cuffs with `h.perArm` so that they follow each arm, and build the item at the posed grip (`h.arms.R.GRIP` mirrored to x < 0 for the right hand, `h.arms.L.GRIP` for the left) in the orientation of the mockup.
`./forge check` must end with `result ok`.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). A beard or a mustache is its own body on the head bone.
- Keep the kind's clips. Check the cheer and attack strips: nothing may pass through the head or tear.

Checks: `./forge check cobbler` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/cobbler.ts. Never commit. Finish with one `./forge all cobbler`.
