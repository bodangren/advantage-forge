# town-crier (npcs/settlement/town-crier) -> assets/town-crier.ts

An eager young town crier in a blue tricorn hat and a blue long coat, ringing a big brass hand bell and holding a notice. About 1.0 m to the top of the tricorn hat, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a town square NPC who calls out news; seen in the town square in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/town-crier_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
a blue tricorn hat with gold edge trim; short brown hair at the temples; an open calling mouth; a long royal blue coat to the knees with gold buttons and gold cuffs; a white collar; cream knee trousers; white stockings; black shoes with gold buckles; a big brass hand bell with a wooden handle held up in the left hand; a parchment notice in the right hand.

Palette: skin #f2c7a4; hair #5a301d; hat and coat #2f4f8a with gold #e0b040 trim and buttons; collar #f6f1ea; trousers #e8dcc0; stockings #f6f1ea; shoes #2a2428 with gold buckles; bell #c8a040 with a #6b4226 handle; notice #ece0c4.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the coat #2f4f8a first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Right hand (the viewer's left in the mockup): a parchment notice 0.12 x 0.16 m, 0.03 m thick at its rolled top. Make it a body with the body option `bone: 'knife.R'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the right fist (x < 0).
Left hand (the viewer's right in the mockup): a brass hand bell 0.1 m tall and 0.08 m across at the mouth, on a wooden handle 0.06 m long. Make it a body with the body option `bone: 'knife.L'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the left fist (x > 0).
`./forge check` must end with `result ok`.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). A beard or a mustache is its own body on the head bone.
- Keep the kind's clips. Check the cheer and attack strips: nothing may pass through the head or tear.

Checks: `./forge check town-crier` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/town-crier.ts. Never commit. Finish with one `./forge all town-crier`.
