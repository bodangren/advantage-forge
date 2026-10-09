# merchant (npcs/settlement/merchant) -> assets/merchant.ts

A plump, smiling market merchant in a long teal coat with gold trim and a wide orange sash, holding up a fat coin purse. About 1.0 m to the top of the hat or hair, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a market NPC who sells goods; seen at the market stalls in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/merchant_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
a soft round burgundy cap; short black hair at the sides; a short neat black beard (its own body); a long teal coat to the knees with gold trim at the hem and the front edge; a wide orange sash around a round belly; puffy cream sleeves; brown boots; a fat leather coin purse tied with a gold cord, gold coins at its mouth, held out in the left hand.

Palette: skin #f2c7a4; hair and beard #231a17; cap #7a2e3a; coat #2f7a7a with gold #e0b040 trim; sash #e08a3a; sleeves #f0e6d0; boots #5a3a24; purse #8a5a35, cord and coins #e0b040.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the coat #2f7a7a first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Left hand (the viewer's right in the mockup): a fat leather coin purse 0.1 m across, tied with a gold cord, three gold coins at its mouth. Make it a body with the body option `bone: 'knife.L'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the left fist (x > 0).
`./forge check` must end with `result ok`.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). A beard or a mustache is its own body on the head bone.
- Keep the kind's clips. Check the cheer and attack strips: nothing may pass through the head or tear.

Checks: `./forge check merchant` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/merchant.ts. Never commit. Finish with one `./forge all merchant`.
