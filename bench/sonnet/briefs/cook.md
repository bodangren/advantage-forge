# cook (npcs/settlement/cook) -> assets/cook.ts

A round, happy cook in a white kerchief cap and a white jacket with a red neckerchief, carrying a steaming soup pot and holding up a wooden spoon. About 1.0 m to the top of the kerchief cap, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a tavern and castle kitchen NPC who serves food; seen in the kitchen in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/cook_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
a white kerchief cap tied at the back, brown curls at the temples and the nape; a white double-breasted cook jacket with two rows of buttons; a red neckerchief; a long white apron to the knees; gray trousers; black shoes; a round copper soup pot with a ladle sticking out and a small puff of white steam, carried low in the right hand; a wooden spoon held up in the left hand.

Palette: skin #f2c7a4; hair #6b3e22; cap, jacket and apron #f6f1ea with #d8d0c4 shadows; buttons #c8a040; neckerchief #b03a3a; trousers #6a6870; shoes #2a2428; pot #b8683a (metalness 0.6) with #8a4a2a handles; soup #c88a3a; ladle #9a6a3a; steam #fbf6ee (opacity 0.7).
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the neckerchief #b03a3a first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Right hand (the viewer's left in the mockup): a round copper soup pot 0.18 m across and 0.12 m tall carried by a bail handle at hip height, soup inside, a ladle leaning out, and a small steam puff. Make it a body with the body option `bone: 'knife.R'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the right fist (x < 0).
Left hand (the viewer's right in the mockup): a wooden spoon 0.2 m long with a little food on it, held up. Make it a body with the body option `bone: 'knife.L'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the left fist (x > 0).
Arm pose: the mockup shows the left hand raised beside the head. Set `pose: { L: { elbow: [0.19, 0.345, 0.03], wrist: [0.215, 0.43, 0.09] } }` on the kind (left-side values; the kind mirrors R). Tune the values until the fist matches the mockup, and keep the fist and the item 0.04 m or more from the head. A posed arm keeps its pose in every clip. Build sleeves and cuffs with `h.perArm` so that they follow each arm, and build the item at the posed grip (`h.arms.R.GRIP` mirrored to x < 0 for the right hand, `h.arms.L.GRIP` for the left) in the orientation of the mockup.
`./forge check` must end with `result ok`.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). A beard or a mustache is its own body on the head bone.
- Keep the kind's clips. Check the cheer and attack strips: nothing may pass through the head or tear.

Checks: `./forge check cook` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/cook.ts. Never commit. Finish with one `./forge all cook`.
