# revenant (enemies/undead/revenant) -> assets/revenant.ts

An undead soldier enemy about 1.0 m to the plume tip, faces +Z, on the zombie soldier base (assets/zombie-soldier.ts: the zombie rig with knee bones; clips idle, walk, run, attack, hit, death, rise; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/revenant_001.jpg (set `reference` to that path). Match its idea: a pale green skull-like face (dark eye sockets, one glowing orange eye, a stitched grin of teeth across the lower face), long pointed ears, a cracked round iron helm with a nasal bar and a torn red plume stub; a torn light-blue tabard over a rusted iron collar and small pauldrons, brown crossed straps and a belt with a square buckle; one leather bracer; a chipped hand axe in the right hand and a cracked round iron shield on the left arm; dirty brown boots.

Palette: skin pale green #b7c39a with #8a9a70 shade; sockets #14110c; glowing eye orange #ff8a2a (emissive 1.8 on #3a1a05); teeth cream #efe4cc; helm iron #8a8f96 with crack lines in bump and #5a5f66 shade; plume red #b83a2e; tabard blue #7aa3b8 with #5a8398 shade and a jagged hem; straps #6e3f24; shield iron with a brass boss #d4a93a; axe head iron, haft #6b4226; boots #5a3a22.
Variants: keep the zombie soldier's slots (skin, cloth, leather) with a tabard color option set (blue default, red, green).

Construction recipe:
1. Copy assets/zombie-soldier.ts; keep the rig and clips; rebuild the head as a skull-faced zombie: dark eye sockets (two spheres subtracted), one glowing eye sphere in the right socket, a painted stitched grin (`paintWhere` a row of small boxes) across the jaw, pointed ears.
2. Helm: a sphere-cylinder bowl r 0.24 with a nasal bar and a rim, crack lines in bump, a short torn plume (three flat strips) on top, `bone: 'head'`.
3. Tabard: a flat front and back panel with a jagged hem over the torso; iron collar ring and two small pauldron domes; crossed straps (two torus segments) and a belt with a buckle; one bracer on the right forearm.
4. Weapons: the hand axe 0.4 m in `hand.R` (a haft capsule and a wedge head), the round shield r 0.2 with a brass boss on the left forearm (`bone: 'forearm.L'`); `attack` is an axe chop, keep the base timing. `./forge check revenant` must end with `result ok`.
5. Sprites: the helm, the plume, the shield disc, and the orange eye must read at 128 px.

Limits: under 60,000 triangles, `detail` 0.004 on the face and hands, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/revenant.ts. Finish with one `./forge all revenant`.
