# weaponsmith (npcs/settlement/weaponsmith) -> assets/weaponsmith.ts

A sturdy weaponsmith with spiky red hair and soot on the cheeks, in a heavy leather apron, holding up a new sword. About 1.0 m to the top of the hat or hair, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a weapon shop NPC who sells and upgrades weapons; seen in the smithy in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/weaponsmith_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
short spiky red hair (chain spikes); a soot smudge on the left cheek (paintSkin); a gray shirt with sleeves rolled to the elbow; a heavy brown leather apron from the chest to the knees with brass rivets at the corners; thick brown gloves over the fists; dark trousers; heavy boots; a hammer at the left hip on the belt; a shiny steel sword with a crossguard and a leather grip held up in the right hand.

Palette: skin #f2c7a4; hair #a8401c; soot #4a4448; shirt #8a8a90; apron #6b4226 with #c8a040 rivets; gloves #5a3a24; trousers #3a3438; boots #3a2a20; hammer head #6a6e78 with a #8a5a35 handle; sword steel #c8ccd4 (metalness 0.8) with a #e0b040 guard and a #5a3a24 grip.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the shirt #8a8a90 first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Right hand (the viewer's left in the mockup): a steel sword 0.5 m long with a crossguard, a blade 0.04 m wide and 0.03 m thick, and a leather grip. Make it a body with the body option `bone: 'knife.R'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the right fist (x < 0).
`./forge check` must end with `result ok`.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). A beard or a mustache is its own body on the head bone.
- Keep the kind's clips. Check the cheer and attack strips: nothing may pass through the head or tear.

Checks: `./forge check weaponsmith` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/weaponsmith.ts. Never commit. Finish with one `./forge all weaponsmith`.
