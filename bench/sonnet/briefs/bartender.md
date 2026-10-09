# bartender (npcs/settlement/bartender) -> assets/bartender.ts

A cheerful tavern bartender with a curled mustache, a green vest, and a long apron, holding up a foaming tankard. About 1.0 m to the top of the hat or hair, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a tavern NPC who serves drinks; seen in the tavern scene in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/bartender_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
short dark brown hair with a side part; a curled brown mustache (its own body); a white shirt with sleeves rolled to the elbow; a dark green vest with three brass buttons; a long cream apron from the waist to the knees; a cream-and-red striped towel over the left shoulder; brown boots; a big wooden tankard with two brass bands and white foam held up in the right hand.

Palette: skin #f2c7a4; hair and mustache #4a2e1c; shirt #f0ead8; vest #3f5e44 with brass #c8a040 buttons; apron #e8dcc0; towel #f0ead8 with #b04a3a stripes; boots #5a3a24; tankard wood #9a6a3a, bands #c8a040, foam #fbf6ee.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the vest #3f5e44 first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Right hand (the viewer's left in the mockup): a wooden tankard 0.1 m across and 0.12 m tall with two brass bands, a handle, and a foam dome. Make it a body with the body option `bone: 'knife.R'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the right fist (x < 0).
`./forge check` must end with `result ok`.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). A beard or a mustache is its own body on the head bone.
- Keep the kind's clips. Check the cheer and attack strips: nothing may pass through the head or tear.

Checks: `./forge check bartender` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/bartender.ts. Never commit. Finish with one `./forge all bartender`.
