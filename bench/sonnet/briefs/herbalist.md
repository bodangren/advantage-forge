# herbalist (npcs/settlement/herbalist) -> assets/herbalist.ts

A gentle young herbalist in a green headscarf and a sage dress, carrying a wicker basket of herbs and flowers in her left hand. About 1.0 m to the top of the headscarf, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a village NPC who sells herbs and potions; seen in the village and the forest edge in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/herbalist_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
a dark green headscarf tied at the nape; a long brown braid over the left shoulder (chain locks); a long-sleeved sage green dress to the knees; a brown laced bodice; a small brown pouch at the belt; brown boots; a round wicker basket with a handle, full of green herbs and small pink and yellow flowers, held by its handle in the left hand at hip height; a dark green scarf at the neck.

Palette: skin #f2c7a4; hair #6b3e22; headscarf #3f5e3a; dress #6f8a5a (dark sage; mid greens render lime); bodice and pouch #6b4226; boots #5a3a24; basket #b08a50 with #8a6a3a weave; herbs #4a6a3a; flowers #f0a0b0 and #f0d060.
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the dress #6f8a5a first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Left hand (the viewer's right in the mockup): a round wicker basket 0.2 m across and 0.09 m deep with an arched handle through the fist, herbs and flowers on top. Make it a body with the body option `bone: 'knife.L'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the left fist (x > 0).
`./forge check` must end with `result ok`.

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it `.bone('head')`.
- Clothes: grow the torso (`h.torso.round(t)`), cut with `h.band` or half-spaces, and tag with `h.weighted`. Sleeves follow `h.joints` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in `paintSkin` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). A beard or a mustache is its own body on the head bone.
- Keep the kind's clips. Check the cheer and attack strips: nothing may pass through the head or tear.

Checks: `./forge check herbalist` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/herbalist.ts. Never commit. Finish with one `./forge all herbalist`.
