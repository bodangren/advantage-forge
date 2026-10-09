# midwife (npcs/settlement/midwife) -> assets/midwife.ts

A warm, motherly village midwife in a white headscarf and a blue dress, carrying a basket of folded blankets and herbs. About 1.0 m to the top of the headscarf, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a village healer NPC who cares for mothers and babies; seen in the village in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/midwife_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
a white headscarf tied at the nape with brown hair at the temples; rosy round cheeks; a long-sleeved soft blue dress to the shins (leg clearance in walk and run); a white apron; a small brown satchel at the right hip; brown shoes; a wicker basket with folded white and pink blankets and green herbs held by its handle in the left hand; the right hand raised in a gentle wave (open hand).

Palette: skin #f2c7a4; hair #6b3e22; headscarf #f6f1ea; dress #6a8ab0; apron #f6f1ea; satchel #8a5a35; shoes #5a3a24; basket #b08a50; blankets #f6f1ea and #f0b0c0; herbs #4a6a3a.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the dress #6a8ab0 first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Right hand (the viewer's left in the mockup): nothing: the right hand is raised in a gentle wave (a raised fist or an open hand). Make it a body with the body option `bone: 'knife.R'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the right fist (x < 0).
Left hand (the viewer's right in the mockup): a wicker basket 0.2 m across with an arched handle through the fist, folded white and pink blankets and green herbs on top. Make it a body with the body option `bone: 'knife.L'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the left fist (x > 0).
Arm pose: the mockup shows the right hand raised beside the head. Set `pose: { R: { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] } }` on the kind (left-side values; the kind mirrors R). Tune the values until the fist matches the mockup, and keep the fist and the item 0.04 m or more from the head. A posed arm keeps its pose in every clip. Build sleeves and cuffs with `h.perArm` so that they follow each arm, and build the item at the posed grip (`h.arms.R.GRIP` mirrored to x < 0 for the right hand, `h.arms.L.GRIP` for the left) in the orientation of the mockup.
`./forge check` must end with `result ok`.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). Give a grin round corners and one white tooth band in the middle: sharp dark mouth corners read as fangs at 128 px. A beard or a mustache is its own body on the head bone. For men, boys, and elders whose mockup shows no lashes, set `lashes: false` on the kind (the default face paints winged lashes). A bigger or rounder nose is its own small body on the head bone in the skin tint (`k.tint('skin')`).
- Keep the kind's clips. Check the cheer, attack, and rest strips (`./forge animate midwife --fast --clip rest`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check midwife` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/midwife.ts. Never commit. Finish with one `./forge all midwife`.
