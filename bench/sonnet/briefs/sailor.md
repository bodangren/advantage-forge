# sailor (heroes/support/sailor) -> assets/sailor.ts

A young cheerful sailor hero about 0.98 m to the top of the cap, faces +Z, on the adventurer base (assets/adventurer.ts: the rogue's head and chibi skeleton with knee bones; shirt, trousers, belt, shoes; a sword rigid in `hand.R`, a map on `hand.L`, a pack on the chest; clips idle, walk, run, attack, attack2, hit, death, victory; variant slots eyes, hair, skin, clothing with presets). Bar 8/10 (character).

Mockup: docs/hero-mockups/sailor_001.jpg (set `reference` to that path). Match its idea. A blue knit cap (a soft dome with a rolled cuff and a knit groove bump) worn back on the head; dark brown hair swept forward under it; big eyes, rosy cheeks, a wide smile; a blue and white horizontally striped shirt with a square sailor collar and a red neckerchief knotted at the front; a coiled rope over the left shoulder across to the right hip; a brown belt with a steel buckle; white trousers rolled at the calf; a cutlass with a brass guard held low in the right hand; bare feet (the base's shoes recolored skin, toes in paint or 3 small toe bumps).

Palette: cap #4a8ac0 with #2a6aa0 grooves (roughness 0.95); hair #3a2418; skin #f2c7a4, cheeks #f09a86; shirt stripes #3f6a9a and #f4f0e8; collar #3f6a9a with a #f4f0e8 edge stroke; neckerchief red #c93a32; rope #c8b088 with a twist bump; belt #6b4226, buckle #a8acb1; trousers #ece8dc with #c8c4b8 folds; cutlass blade #c3c8cf, guard brass #c9a24a, grip #3a2a20.
Variants (the hero slot set): eyes (brown default, blue #2f6aa8, green #3d7a35), hair (brown default, black #231a17, blond #c4974a), skin (fair default, tan #d49a72, brown #8a5a3e), clothing (blue default: the cap and the stripes; red #a83a32, green #2e7a5c). Presets: default, red, green.

Construction recipe:
1. Copy assets/adventurer.ts. Remove the pack, the bedroll, the lantern, the map, the bandana, and the neckerchief. Keep the rig (drop `knot` and `lantern`), the clips (attack a cutlass slash, attack2 a rope-swing hop: a crouch, a hop, a landing), the shirt (add the stripes in paint and the square collar), the trousers (widen, roll at the calf with a cuff torus), the belt, the shoes (as bare feet), the sword (reshape as the cutlass).
2. Head: the cap (a soft dome r 0.17 sitting back on the head from y 0.78, with a rolled cuff torus and a knit groove bump); the hair swept forward under the cap front; big eyes; rosy cheek discs; a wide smile; round human ears.
3. Body: the square collar (a flat shell panel at the back of the neck 0.16 wide and two front points) with the edge stroke; the neckerchief (two flat triangles with a knot sphere at the front); the rope coil (a torus R 0.07 r 0.022 with a twist bump) over the left shoulder; the belt with a buckle.
4. Held item: the cutlass (a curved blade 0.32 long, 0.05 wide, a brass cup guard from a half sphere, a grip 0.08) rigid on `hand.R`, held low at the side. Attack is a slash; attack2 is a hop. `./forge check sailor` must end with `result ok` and the ground check must be ok.
5. Sprites: the blue cap, the striped shirt, the red neckerchief, the rope, and the cutlass must read at 128 px.

Limits: under 65,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/sailor.ts. Finish with one `./forge all sailor`.
