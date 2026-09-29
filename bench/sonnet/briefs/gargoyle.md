# gargoyle (enemies/construct/gargoyle) -> assets/gargoyle.ts

A crouching winged stone demon about 0.95 m tall to the horn tips, 1.2 m wide across the spread wings, faces +Z, on the imp base (assets/imp.ts: a small winged rig with bat wings, a tail, clips idle, fly, attack, hit, death, cast; variant slots and presets). Bar 8/10 (character). No plinth: the gargoyle stands on the ground plane y = 0 on its own clawed feet (the mockup's stone base is not part of the asset).

Mockup: docs/enemy-mockups/gargoyle_001.jpg (set `reference` to that path). Match its idea: a wide horned head with two long ridged horns curving up and out, a central brow crest, big pointed ears, angry yellow eyes, a wide open fanged grin with white teeth; a crouched hunched body with a ridged chest; long clawed arms reaching down to the ground; short crouched legs with three-toed claws; big bat wings with a claw at each wing elbow; a long thin tail with a spade tip; the whole thing carved grey stone with cracks and moss stains.

Palette: stone #6f7378 with lit #8b8f94 and shade #4e5257 (roughness 0.9, metalness 0); moss #5a6a48 stains by paintFn noise in the crevices; eyes yellow #ffd23a emissive 1.5 on dark sockets; teeth #e8e2d0; mouth #2a1a1a.
Variants: stone (grey default, sandstone #a08a6a, obsidian #2c2c32), eyes (yellow default, red #ff3a3a, cyan #4fe8ff), moss (green default, none = stone color, rust #8a4a22).

Construction recipe:
1. Copy assets/imp.ts. Keep the rig, the wings, the tail, and the clips. Replace the skin with one grey stone body (one material, `flat: false`, cracks in `bump` only, moss by paintFn).
2. Head: an ellipsoid 0.26 x 0.22 x 0.22 with a brow crest (an extruded wedge on the centerline), two ridged horns (`sdf.chain` curving out to x +-0.2 and up to y 0.95, r 0.04 to 0.012, ridges in bump), big pointed ears (flattened cones), an open mouth cut by a subtracted box with a dark inner body and two rows of cone teeth.
3. Body: hunched chest (ellipsoid tilted forward), ridged belly plates painted with darker lines, long arms (cones) that reach the ground with three claw fingers each, short bent legs, three-toed feet on y = 0.
4. Wings: keep the imp wing shape but 1.5x larger, membrane in the same stone color, a small claw cone at each wing elbow. Tail with a spade tip (a flat extruded diamond).
5. Clips: idle breathes and folds the wings slightly; fly keeps the base hover; attack is a lunge with both claws; death crumbles (scale down and sink is fine). No held items. `./forge check gargoyle` must end with `result ok` and the ground check must be ok.
6. Sprites: the horns, the spread wings, the yellow eyes, and the grin must read at 128 px.

Limits: under 60,000 triangles, `detail` 0.004 on the head, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/gargoyle.ts. Finish with one `./forge all gargoyle`.
