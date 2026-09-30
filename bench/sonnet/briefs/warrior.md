# warrior (heroes/martial/warrior) -> assets/warrior.ts

A young sturdy warrior hero about 1.0 m to the top of the hair, the greatsword above the shoulder, faces +Z, on the barbarian base (assets/barbarian.ts: the knight's body, face, and chibi skeleton with knee bones, `plume` and `cloak` bones; an axe rigid in `hand.R`; a fur cape; clips idle, walk, run, attack, attack2, hit, death, victory; variant slots hair, eyes, skin, paint with presets). Bar 8/10 (character).

Mockup: docs/hero-mockups/warrior_001.jpg (set `reference` to that path). Match its idea, with one change: no beard; every hero on this set has the young, round, beardless face. Short thick dark brown hair swept up; a gold headband; a serious brow and big eyes; a shaggy cream fur mantle over both shoulders; a steel breastplate with a diamond emblem over a red tunic that ends in a short skirt; a dark leather belt with a steel buckle; engraved steel bracers; a short dark brown cape; fur-cuffed dark boots with steel toe caps; a big two-handed greatsword resting on the right shoulder, the grip in the right hand; the left hand a fist.

Palette: hair #4a2e1c with #2e1c10 grooves; headband gold #e0b040 (metalness 0.7, roughness 0.4); skin #f2c7a4; fur #e0d4b0 with #b8a880 shadow (roughness 1.0); breastplate and bracers #bcc2cb with #8a9098 shadow (metalness 0.8, roughness 0.4); tunic red #c93a32 with #8a2420 folds; belt #4e2d1c, buckle #a8acb1; cape #5a3a24; boots #4a2e1c, toe caps #a8acb1; sword blade #c3c8cf, guard #6a6e74, grip #3a2a20.
Variants (the hero slot set): eyes (brown default, blue #2f6aa8, green #3d7a35), hair (brown default, black #231a17, blond #c9a050), skin (fair default, tan #d49a72, brown #8a5a3e), clothing (red default, blue #2f58b8, green #2e7a3c). Presets: default, blue, green.

Construction recipe:
1. Copy assets/barbarian.ts. Remove the axe, the war paint, and the top knot. Keep the rig, the clips (rewrite attack and attack2 for the greatsword), the body, the fur cape (reshape as the mantle), the leather, the boots.
2. Head: hair as a cap with 8 to 10 thick swept-up locks (chains, smoothUnion 0.012); the gold headband (a torus R 0.15 r 0.012 around the brow at y 0.72); a serious brow; round human ears.
3. Body: the fur mantle (two displaced ellipsoids on the shoulders, one body); the breastplate (a rounded box 0.24 x 0.16 x 0.14 on the chest with a small diamond emblem extruded 0.004); the tunic under it with a skirt hem at y 0.15; the belt and buckle; the bracers (cylinders with a groove stroke); the short cape from the shoulders to y 0.25 at the back; the boots with fur cuffs (displaced tori) and steel toe caps.
4. Held item: the greatsword (a blade 0.7 m long, 0.09 wide, a cross guard 0.16 wide, a grip 0.12, a round pommel) rigid on `hand.R`, resting on the right shoulder with the tip up and back in idle, at least 0.04 m clear of the head in every clip. Attack is a two-handed horizontal sweep; attack2 is an overhead chop. `./forge check warrior` must end with `result ok` and the ground check must be ok.
5. Sprites: the fur mantle, the steel breastplate, the red tunic, the headband, and the greatsword must read at 128 px.

Limits: under 65,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/warrior.ts. Finish with one `./forge all warrior`.
