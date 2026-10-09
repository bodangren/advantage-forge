# apothecary (npcs/settlement/apothecary) -> assets/apothecary.ts

A kind old apothecary woman with round spectacles and a gray bun, in a plum dress and a pocketed apron, holding up a glowing potion bottle. About 1.0 m to the top of the hair bun, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a shop NPC who sells potions and remedies; seen in the village shop in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/apothecary_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
gray hair in a round bun at the back of the head and soft gray locks at the temples; small round gold spectacles; a long-sleeved plum dress to the shins; a cream apron with three pockets holding small colored vials; brown shoes; a round glass potion bottle with teal liquid and a cork held out at chest height in the right hand; a small flask with glowing pale green liquid held up high in the left hand.

Palette: skin #f2c7a4; hair #b8b4c4; spectacles #c8a040; dress #6a3a5a; apron #e8dcc0; vials #b04a3a, #3a6ab0, #c8a040; shoes #5a3a24; bottle glass #c8e8e0 (opacity 0.6) with teal liquid #2a9a8a (emissive 0.6) and a #9a6a3a cork.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the dress #6a3a5a first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Right hand (the viewer's left in the mockup): a round glass potion bottle 0.1 m across with a neck, teal liquid, and a cork, held at chest height. Make it a body with the body option `bone: 'knife.R'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the right fist (x < 0).
Left hand (the viewer's right in the mockup): a small glass flask 0.06 m across with a long neck and glowing pale green liquid, held up high. Make it a body with the body option `bone: 'knife.L'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the left fist (x > 0).
Arm pose: the mockup shows the right hand held out in front at chest height and the left hand raised beside the head. Set `pose: { R: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] }, L: { elbow: [0.19, 0.345, 0.03], wrist: [0.215, 0.43, 0.09] } }` on the kind (left-side values; the kind mirrors R). Tune the values until the fist matches the mockup, and keep the fist and the item 0.04 m or more from the head. A posed arm keeps its pose in every clip. Build sleeves and cuffs with `h.perArm` so that they follow each arm, and build the item at the posed grip (`h.arms.R.GRIP` mirrored to x < 0 for the right hand, `h.arms.L.GRIP` for the left) in the orientation of the mockup.
`./forge check` must end with `result ok`.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). A beard or a mustache is its own body on the head bone.
- Keep the kind's clips. Check the cheer and attack strips: nothing may pass through the head or tear.

Checks: `./forge check apothecary` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/apothecary.ts. Never commit. Finish with one `./forge all apothecary`.
