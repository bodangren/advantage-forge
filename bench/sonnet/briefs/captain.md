# captain (heroes/support/captain) -> assets/captain.ts

A young confident guard captain hero about 1.0 m to the top of the hair, faces +Z, on the paladin base (assets/paladin.ts: the knight's body, face, and chibi skeleton with knee bones, a big wave of hair on the `plume` bone, a cape on `cloak`; a hammer rigid in `hand.R`, a heater shield on the left forearm; clips idle, walk, run, attack, attack2, hit, death, victory; variant slots eyes, hair, skin, clothing with presets). Bar 8/10 (character).

Mockup: docs/hero-mockups/captain_001.jpg (set `reference` to that path). Match its idea. Short wavy blond hair swept up; big eyes and a calm confident smile; a red scarf at the neck; a steel breastplate with a gold lion-crest emblem and gold rivets, steel pauldrons with a gold edge; steel bracers over mail sleeves; a brown belt with a gold spearhead buckle and a hanging gold medal; a red tasset skirt with a gold scalloped hem; a red half-cape from the shoulders to the knees; steel greaves and boots; a longsword with a steel guard held low in the right hand; a round steel shield with a gold crest on the left forearm.

Palette: hair blond #d8b048 with #a88030 grooves; skin #f2c7a4; steel #bcc2cb with #8a9098 shadow (metalness 0.8, roughness 0.4); gold #e0b040 (metalness 0.8, roughness 0.35); scarf and skirt red #c93a32 with #8a2420 folds; cape #b83a30; mail #737a84; belt #6b4226; boots #4a4f55; sword blade #c3c8cf, guard #a8acb1, grip #3a2a20; shield face #a8acb1.
Variants (the hero slot set): eyes (green default #5a7a35, brown #6e4020, blue #2f6aa8), hair (blond default, brown #4a2e1c, black #231a17), skin (fair default, tan #d49a72, brown #8a5a3e), clothing (red default, blue #2f58b8, green #2e7a3c). Presets: default, blue, green.

Construction recipe:
1. Copy assets/paladin.ts. Remove the hammer, the sun emblem, and the tabard. Keep the rig, the clips (attack a sword slash, attack2 a rally: the sword raised high and a step forward), the hair (reshape shorter, swept up), the cuirass, the pauldrons, the mail, the gauntlets (as bracers), the belt, the greaves, the cape (shorten to the knees, recolor red), the shield (reshape round with a gold crest).
2. Head: the hair as a cap with 6 to 8 wavy locks swept up and back; big eyes; a calm smile; round human ears; the scarf (a torus at the neck with a short tail).
3. Body: the lion-crest emblem (an extruded shield outline 0.06 tall, gold) on the chest with 4 gold rivet spheres; a gold edge stroke on each pauldron; the belt with a spearhead buckle (an extruded rhombus) and a medal (a disc r 0.02 on a short ribbon); the red tasset skirt (a flared shell from the belt to y 0.15 with a gold scalloped hem stroke).
4. Held items: the longsword (a blade 0.4 long, 0.05 wide, a straight guard, a round pommel) rigid on `hand.R`, held low; the round shield (a disc r 0.13 with a rim and a gold crest) rigid on the left forearm. `./forge check captain` must end with `result ok` and the ground check must be ok.
5. Sprites: the blond hair, the steel plate with gold, the red cape and skirt, the sword, and the shield must read at 128 px.

Limits: under 65,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/captain.ts. Finish with one `./forge all captain`.
