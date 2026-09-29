# clockwork-soldier (enemies/construct/clockwork-soldier) -> assets/clockwork-soldier.ts

A brass clockwork knight about 1.05 m tall, faces +Z, on the animated armor base (assets/animated-armor.ts: the construct rig with knee bones and a weapon hand; clips idle, walk, run, attack, hit, death, awaken; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/clockwork-soldier_001.jpg (set `reference` to that path). Match its idea: a big boxy riveted brass head with a round front window showing gears and a glowing orange core, a small dome on top and a round side dial; a rounded brass chest plate with rivets, two round pauldrons; spring-coil upper arms and box forearms with a spiked bracer each; a right hand holding a halberd (a pole with a wide axe blade and a top spike), a left arm ending in a hooked grapple with a chain; a brass pelvis plate and hip guards; spring-coil thighs and box shins with wedge feet; oil stains and worn edges.

Palette: brass #b8924a with lit #d8b878 and shade #8a6a30 (metalness 0.8, roughness 0.4); springs and steel #6a6a70 (metalness 0.7); core glow #ff8a1a emissive 1.6 on a #3a1a08 base; gears #4a3a2a; oil stains by paintFn in #5a4a30.
Variants: metal (brass default, iron #5a5a60, copper #9a5a3a), glow (orange default, blue #3ac8ff, green #5aff6a).

Construction recipe:
1. Copy assets/animated-armor.ts. Keep the rig, the clips (awaken = wind-up), and the weapon hand. Replace the armor bodies: head (a chamfered box 0.28 x 0.24 x 0.26 with rivet rows, a round window: a torus ring R 0.08 in front with a dark gear disc and an emissive core sphere, a small dome on top, a round dial on the left side), chest (a rounded box 0.36 x 0.3 x 0.26 with rivets and two round pauldron domes), arms (upper arms as spring coils: 5 stacked tori r 0.02, forearms as chamfered boxes with a spike wedge), pelvis plate and hip guards, thighs as coils, shins as boxes, wedge feet (tapered boxes) flat on y 0.
2. Halberd: 1.0 m in `hand.R`, a pole with a wide axe blade (extruded crescent 0.2) and a top spike, held upright at rest, a chop in `attack`; a grapple hook with a short chain on the left forearm. `./forge check clockwork-soldier` must end with `result ok` and the ground check must be ok.
3. Sprites: the boxy head with its glowing window, the pauldrons, and the halberd must read at 128 px.

Limits: under 65,000 triangles, `detail` 0.004 on the head, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/clockwork-soldier.ts. Finish with one `./forge all clockwork-soldier`.
