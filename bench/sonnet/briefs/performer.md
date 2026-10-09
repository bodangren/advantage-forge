# performer (npcs/settlement/performer) -> assets/performer.ts

A cheerful juggler in a harlequin diamond tunic and a jester cap with bells, juggling three colorful balls. About 1.0 m to the top of the jester cap, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a fair and festival NPC who entertains the crowd; seen at fairs and in the square in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/performer_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
a two-pointed red and blue jester cap with gold bells at the tips; brown hair at the temples; a big smile; a tunic with a red, blue, and yellow diamond pattern (paint); a white ruff collar; red tights; curled green shoes; both hands up in front at chest height, three colorful balls in an arc above the hands (the balls are bodies on the hand bones; each ball touches a hand or the arc connects them with a faint thin trail, no floating parts).

Palette: skin #f2c7a4; hair #6b3e22; cap #b03a3a and #3a5a9a with #e0b040 bells; tunic diamonds #b03a3a, #3a5a9a, #e0b040; ruff #f6f1ea; tights #a83a3a; shoes #3f6a44; balls #e0503a, #3a8ad8, #e0c030.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the tunic red #b03a3a first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Right hand (the viewer's left in the mockup): one ball 0.06 m across in the open hand, and one ball 0.06 m across above the hands, joined to the right hand by a thin curved trail 0.01 m thick. Make it a body with the body option `bone: 'knife.R'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the right fist (x < 0).
Left hand (the viewer's right in the mockup): one ball 0.06 m across in the open hand. Make it a body with the body option `bone: 'knife.L'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the left fist (x > 0).
Arm pose: the mockup shows the right hand held out in front at chest height and the left hand held out in front at chest height. Set `pose: { R: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] }, L: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] } }` on the kind (left-side values; the kind mirrors R). Tune the values until the fist matches the mockup, and keep the fist and the item 0.04 m or more from the head. A posed arm keeps its pose in every clip. Build sleeves and cuffs with `h.perArm` so that they follow each arm, and build the item at the posed grip (`h.arms.R.GRIP` mirrored to x < 0 for the right hand, `h.arms.L.GRIP` for the left) in the orientation of the mockup.
`./forge check` must end with `result ok`.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). Give a grin round corners and one white tooth band in the middle: sharp dark mouth corners read as fangs at 128 px. A beard or a mustache is its own body on the head bone. For men, boys, and elders whose mockup shows no lashes, set `lashes: false` on the kind (the default face paints winged lashes). A bigger or rounder nose is its own small body on the head bone in the skin tint (`k.tint('skin')`).
- Keep the kind's clips. Check the cheer, attack, and rest strips (`./forge animate performer --fast --clip rest`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check performer` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/performer.ts. Never commit. Finish with one `./forge all performer`.
