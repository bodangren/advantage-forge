# riverboat-captain (npcs/wilderness/riverboat-captain) -> assets/riverboat-captain.ts

A jolly, round riverboat captain with a white beard and a navy cap, holding out a brass spyglass with one hand on his hip. About 1.0 m to the top of the captain cap, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a river port NPC who runs the riverboat and gives travel and cargo quests; seen at the river port and on the boat in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/riverboat-captain_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
a navy captain cap with a black visor and a gold anchor badge; white hair at the temples and the nape; a full short white beard (locks, its own body); rosy cheeks; a round belly; a navy double-breasted coat to the thigh with two rows of gold buttons and a white shirt collar; dark gray trousers; black boots; a brass spyglass held out in the right hand; the left fist on the hip; a hearty open laugh (round corners, one tooth band).

Palette: skin #f2c7a4 with #e08a7a cheeks; hair and beard #ece8e0; cap #2a3450 with a #2a2428 visor and a #e0b040 badge; coat #2a3450 with #e0b040 buttons; collar #f6f1ea; trousers #4a4448; boots #2a2428; spyglass #c8a040 (metalness 0.8).
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the coat #2a3450 first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Right hand (the viewer's left in the mockup): a brass spyglass 0.22 m long, 0.035 m across at the wide end, held out. Make it a body with the body option `bone: 'knife.R'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the right fist (x < 0).
Arm pose: the mockup shows the right hand held out in front at chest height and the left hand on the hip (elbow out). Set `pose: { R: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] }, L: { elbow: [0.2, 0.31, -0.03], wrist: [0.15, 0.25, 0.04] } }` on the kind (left-side values; the kind mirrors R). Tune the values until the fist matches the mockup, and keep the fist and the item 0.04 m or more from the head. A posed arm keeps its pose in every clip. Build sleeves and cuffs with `h.perArm` so that they follow each arm, and build the item at the posed grip (`h.arms.R.GRIP` mirrored to x < 0 for the right hand, `h.arms.L.GRIP` for the left) in the orientation of the mockup.
`./forge check` must end with `result ok`.

The mockup wins where it and this brief differ (sizes, sleeves, age, girl or boy).

What the reviewers failed most often in batches 1 to 3 (fix these before the first render):
- Hair as one smooth cap reads as a helmet or a hat, and a ragged lower edge reads as dripping. Build the visible hair from separate locks (8 or more chain locks or lobes) over a small cap that hugs the skull, with the mockup's fringe, parting, and color value.
- The role's held item is the focal point at 128 px. Make it at least the mockup size, with clear shape detail (a shoe has a toe, a heel, and laces; a letter is an envelope with a seal).
- Brows that slope down to the center read as stern. Keep them level or arched unless the mockup is angry.
- Skin must never show through gloves, sleeves, or hems, also in the walk strip seen from the side.
- A hat is the mockup's shape and height: a flat cap is low and wide, a tricorn has three soft upturned corners, not walls.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). Give a grin round corners and one white tooth band in the middle: sharp dark mouth corners read as fangs at 128 px. A beard or a mustache is its own body on the head bone. For men, boys, and elders whose mockup shows no lashes, set `lashes: false` on the kind (the default face paints winged lashes). A bigger or rounder nose is its own small body on the head bone in the skin tint (`k.tint('skin')`), not pink (a pink nose reads as a snout) unless the mockup shows a red nose. Large ears in the mockup: a larger ear shell over each kind ear in the skin tint.
- Keep the kind's clips. Check the cheer, attack, and rest strips (`./forge animate riverboat-captain --fast --clip rest`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check riverboat-captain` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/riverboat-captain.ts. Never commit. Finish with one `./forge all riverboat-captain`.
