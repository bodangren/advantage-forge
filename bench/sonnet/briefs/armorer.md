# armorer (npcs/settlement/armorer) -> assets/armorer.ts

A broad, cheerful armorer with a short brown beard, in a chain mail shirt and a leather apron, holding a round shield and a small hammer. About 1.0 m to the top of the hat or hair, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: an armor shop NPC who sells and repairs armor; seen in the smithy in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/armorer_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
short brown hair; a short full brown beard (its own body); a gray chain mail shirt with short sleeves (a ring pattern in paint or bump) over a brown tunic; a dark brown leather apron over the mail; thick leather bracers; dark trousers; heavy boots; a round wooden shield with a steel rim and a steel boss in the right hand at the side; a small steel hammer in the left hand.

Palette: skin #f2c7a4; hair and beard #5a301d; mail #8a8e98 (metalness 0.7); tunic #7a5a3a; apron #4a3428; bracers #6b4226; trousers #3a3438; boots #3a2a20; shield wood #9a6a3a, rim and boss #a8acb4 (metalness 0.8); hammer #6a6e78 with a #8a5a35 handle.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the tunic #7a5a3a first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Right hand (the viewer's left in the mockup): a round wooden shield 0.3 m across and 0.04 m thick with a steel rim and a steel boss, its face toward +Z, held at the side. Make it a body with the body option `bone: 'knife.R'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the right fist (x < 0).
Left hand (the viewer's right in the mockup): a small steel hammer 0.25 m long, the head 0.08 m wide, held out to the side. Make it a body with the body option `bone: 'knife.L'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the left fist (x > 0).
`./forge check` must end with `result ok`.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). A beard or a mustache is its own body on the head bone.
- Keep the kind's clips. Check the cheer and attack strips: nothing may pass through the head or tear.

Checks: `./forge check armorer` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/armorer.ts. Never commit. Finish with one `./forge all armorer`.
