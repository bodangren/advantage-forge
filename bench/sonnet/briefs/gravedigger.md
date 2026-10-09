# gravedigger (npcs/settlement/gravedigger) -> assets/gravedigger.ts

A gentle, lanky old groundskeeper in a flat cap and a patched gray coat, leaning on a spade and holding a little lantern. About 1.05 m to the top of the flat cap, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: the churchyard keeper NPC who knows old stories and secrets; seen at the chapel yard in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/gravedigger_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
a gray flat cap; gray hair at the temples; bushy gray brows; a full gray beard to the chest (its own body, soft locks) and a gray mustache; a red round nose (its own small body); a long gray coat to the knees with brown elbow and knee patches; a dark green scarf; brown trousers; muddy brown boots; a small glowing lantern held low in the right hand; a wooden spade held upright in the left hand, its blade near the ground; a calm small smile.

Palette: skin #f2c7a4; hair, brows and beard #a8a4ac; nose #e89080; cap and coat #6a6870 with #7a5a3a patches; scarf #2f4a3a; trousers #5a4434; boots #4a3428 with #6b5a44 mud; lantern frame #4a4448 with glow #ffc060 (emissive 0.6); spade handle #8a6a3a and blade #8a8e98 (metalness 0.6).
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the coat #6a6870 first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Right hand (the viewer's left in the mockup): a small lantern 0.14 m tall with a dark iron frame, a glowing pane, and a ring handle, hanging from the fist. Make it a body with the body option `bone: 'knife.R'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the right fist (x < 0).
Left hand (the viewer's right in the mockup): a wooden spade 0.85 m long and 0.03 m thick with a steel blade 0.14 m wide, held upright, its blade near the ground. Make it a body with the body option `bone: 'knife.L'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the left fist (x > 0).
`./forge check` must end with `result ok`.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). Give a grin round corners and one white tooth band in the middle: sharp dark mouth corners read as fangs at 128 px. A beard or a mustache is its own body on the head bone. For men, boys, and elders whose mockup shows no lashes, set `lashes: false` on the kind (the default face paints winged lashes). A bigger or rounder nose is its own small body on the head bone in the skin tint (`k.tint('skin')`).
- Keep the kind's clips. Check the cheer, attack, and rest strips (`./forge animate gravedigger --fast --clip rest`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check gravedigger` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/gravedigger.ts. Never commit. Finish with one `./forge all gravedigger`.
