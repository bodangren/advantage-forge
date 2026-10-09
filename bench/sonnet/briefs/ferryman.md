# ferryman (npcs/wilderness/ferryman) -> assets/ferryman.ts

A calm, friendly old ferryman in a wide straw hat, holding a long punting pole and a small lantern. About 1.0 m to the top of the straw hat, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: a river NPC who carries the player across rivers and tells river legends; seen at river crossings in 3D and as a 128 px sprite.

Mockup: docs/npc-mockups/ferryman_001.jpg. Set `reference` to that path and LOOK at it with the Read tool before the first edit. Match it:
a wide flat straw hat (a low cone with a wide brim); gray hair at the temples and the nape; a long gray mustache (its own body); a faded blue loose shirt with rolled sleeves; a brown cloth sash; dark gray trousers rolled to the shins; straw sandals; a long wooden punting pole held upright in the right hand; a small round paper lantern with a warm glow hanging from the left hand; a gentle smile.

Palette: skin #e8b48e; hair and mustache #a8a4a0; hat #d8c08a; shirt #6a8aa8; sash #7a5a3a; trousers #4a4448; sandals #c8a870; pole #8a6a3a; lantern #f0d8a0 with glow #ffc060 (emissive 0.6).
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: the shirt #6a8aa8 first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: `humanoidAsset` in assets/parts/humanoid-kind.ts. Read its header, `HumanoidKind`, and `HumanoidShape`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in `paintSkin`, a two-hand `hold`). Build this role's own clothes and props. Do not copy the baker's look.
Right hand (the viewer's left in the mockup): a long wooden punting pole 1.1 m long and 0.03 m thick, held upright; its foot 0.03 m above the ground at rest; 0.04 m or more from the head and the hat brim in every clip. Make it a body with the body option `bone: 'knife.R'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the right fist (x < 0).
Left hand (the viewer's right in the mockup): a small round paper lantern 0.1 m across with a warm glow, hanging from the fist. Make it a body with the body option `bone: 'knife.L'` (the fist's grip bone; read the `GRIP` and `ITEM_DIR` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the left fist (x > 0).
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
- Keep the kind's clips. Check the cheer, attack, and rest strips (`./forge animate ferryman --fast --clip rest`): nothing may pass through the head or tear. In rest the head bows forward: a bib, a collar, a scarf, or a beard must clear the chin.

Checks: `./forge check ferryman` ends with `result ok` (or "no held items to check" when the hands are empty) and `ground ok`; no `warning:` lines; under 65,000 triangles.
Builds: run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/ferryman.ts. Never commit. Finish with one `./forge all ferryman`.
