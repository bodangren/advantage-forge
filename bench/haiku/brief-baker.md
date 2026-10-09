# baker (npcs/settlement/baker) -> assets/baker-<ARM>.ts

A cheerful village baker NPC, about 1.0 m to the top of the hat, faces +Z, for the Chibi Quest town. Bar 7.0/10 (NPC). Rated G.

Mockup: docs/npc-mockups/baker_001.jpg (set `reference` to that path; LOOK at it with the Read tool first). Match it: a tall puffy white chef hat (a band plus a soft mushroom top) with a little brown hair tuft at the front; a round happy face with rosy cheeks and a wide open smile; a warm brown long-sleeved shirt with cream rolled cuffs; a cream bib apron with two straps and a cream skirt panel to the knees; short dark brown trousers with cream socks; tan shoes; a flat wooden tray (a peel) held in both hands at the waist with two golden-brown round loaves on it (one with sesame seeds).

Palette: skin #f2c7a4; hat and cuffs and socks #f3ead6; hair #5a301d; shirt #8a5a3a; apron #e8dcc0 with #cdbb94 seams; trousers #4a3428; shoes #c89a6a; tray #9a6a3a; loaves #c88a3a with a lighter #e0a850 top.
Variant slots: skin, hair, eyes, cloth (the shirt). Use the same slot options as assets/avatar-base.ts. Presets: default plus one more.

Base: use `humanoidAsset` from assets/parts/humanoid-kind.ts (read its header and the `HumanoidKind` and `HumanoidShape` types; assets/avatar-base.ts is the plainest user; assets/dryad.ts and assets/innkeeper.ts show how an NPC dresses a base in `extra`). The humanoid kind gives the skeleton, head, face, arms, fists, torso, the clips idle, walk, run, attack, hit, rest, cheer, cast, and the `knife.L` and `knife.R` grip bones. Dress it in `extra`: the hat, the hair tuft, the shirt, the apron, the trousers, the socks, the shoes, the tray, and the loaves. Hold the tray rigid on the two hands (bones `knife.L`/`knife.R` or `hand.*`: read the kind to see which exist). Keep the tray level and 0.04 m clear of the face in every clip.

Limits: under 65,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. `./forge check <name>` must end with `result ok`. Look at the render and fix the three largest differences from the mockup: silhouette first, then proportions, then color. The hat, the apron, the tray with loaves, and the smile must read at 128 px.
