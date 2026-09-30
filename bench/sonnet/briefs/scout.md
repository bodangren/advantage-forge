# scout (heroes/martial/scout) -> assets/scout.ts

A young light-footed scout hero about 0.98 m to the top of the hair, faces +Z, on the rogue base (assets/rogue.ts: the chibi skeleton with knee bones and `cloak`; the young round hero face; a hood, a mantle, a cape, a tunic, sleeves; daggers rigid on `knife.L` and `knife.R`; clips idle, walk, run, attack, attack2, hit, death, victory; variant slots eyes, hair, skin, clothing with presets). Bar 8/10 (character).

Mockup: docs/hero-mockups/scout_001.jpg (set `reference` to that path). Match its idea. Short spiky blond hair swept up and to the right; big green eyes and a calm small mouth; a grey wool scarf wrapped around the neck and up under the chin; a short grey cloak over the shoulders to the elbows; a grey-green padded jerkin; a brown leather chest strap with a steel buckle and a leather belt with a pouch at the left hip; a brass spyglass held up in the right hand; a short curved dagger with a steel guard held low in the left hand; tan shorts to the knee; soft brown boots.

Palette: hair blond #d8b048 with #a88030 grooves; skin #f2c7a4; scarf #a8a8a0 with #888880 folds (roughness 0.95); cloak #8a8a80 with #6a6a60 folds; jerkin grey-green #8a9080 with #6a7060 seams; straps and belt #6b4226, buckle #a8acb1 (metalness 0.7, roughness 0.5); spyglass brass #b8925a (metalness 0.7, roughness 0.4), lens #202830; dagger blade #c3c8cf, guard #a8acb1, grip #3a2a20; shorts #b8a888; boots #5a3a24.
Variants (the hero slot set): eyes (green default #3d7a35, brown #6e4020, blue #2f6aa8), hair (blond default, brown #6b3a20, black #231a17), skin (fair default, tan #d49a72, brown #8a5a3e), clothing (grey default, teal #3f6a6a, olive #6a6a3a). Presets: default, teal, olive.

Construction recipe:
1. Copy assets/rogue.ts. Remove the hood and the right dagger; keep the left dagger on `knife.L`. Keep the rig, the clips (rewrite attack as a dagger slash and attack2 as a spyglass point-and-dash), the mantle (reshape as the short cloak), the cape (shorten to the elbow), the tunic (reshape as the padded jerkin), the sleeves, the leather, the boots.
2. Head: hair as 10 to 12 short pointed spikes (cones, smoothUnion 0.012) swept up and to +X from a cap; big eyes; a calm small mouth; round human ears; the scarf (a thick torus R 0.11 r 0.04 at the neck, pulled up under the chin, with a fold ridge in bump).
3. Body: the padded jerkin (the tunic with three horizontal quilt seams in bump); the chest strap with a buckle; the belt with a pouch box at the left hip; the shorts to the knee; the soft boots with a rolled cuff.
4. Held items: the spyglass (three stepped cylinders 0.14 long, r 0.016 to 0.022, a dark lens disc) rigid on `hand.R`, the right forearm raised so the spyglass points forward and up at eye level; the dagger (a curved blade 0.14 long) on `knife.L`, held low at the left side. Attack is a dagger slash; attack2 is a spyglass point and a quick dash step. `./forge check scout` must end with `result ok` and the ground check must be ok.
5. Sprites: the blond spikes, the grey scarf, the short cloak, the spyglass, and the dagger must read at 128 px.

Limits: under 65,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/scout.ts. Finish with one `./forge all scout`.
