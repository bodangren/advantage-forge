# kobold-trapper (enemies/humanoid/kobold-trapper) -> assets/kobold-trapper.ts

A small hooded kobold about 0.9 m tall, faces +Z, on the kobold warrior base (assets/kobold-warrior.ts: the small lizard rig with knee bones and a weapon hand; clips idle, walk, run, attack, hit, death, taunt; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/kobold-trapper_001.jpg (set `reference` to that path). Match its idea: a dull olive-green scaled kobold with a long crocodile-like snout, a wide sly smile, one yellow eye and a round leather eyepatch with a strap over the other; huge fan-shaped ears; a fur-trimmed brown leather hood; a shaggy fur mantle on the shoulders; crossed leather straps over the chest with a coiled rope knot at the center; a rope belt with two yellow leather pouches and an iron ring; a long tail; a hooked iron trap-setting tool in the right hand and an iron spike-pin in the left; clawed feet.

Palette: scales #7a8a3e with shade #5a6a2c (compensate for the renderer, which lifts greens one step) and a pale belly #b8b48a; hood leather #5a3e2a with fur trim #a89878; straps #4a3020; rope #a08a5a; pouches #c8a030; iron #5a5a60 (metalness 0.6); eyepatch #4a2e1c; eye #ffd23a with a black pupil.
Variants: scales (olive default, red #b84a2e, blue #4a6a9a), hood (brown default, black #2a2a2e, green #3a5a3a), pouches (yellow default, red #8a3a2a, grey #6a6a6a).

Construction recipe:
1. Copy assets/kobold-warrior.ts. Keep the rig and the clips. Remove the warrior gear. Lengthen the snout (a rounded box 0.14 long tapering, with two nostril dents and a wide mouth line), keep one eye (r 0.03 with a pupil) and add an eyepatch (a flattened disc r 0.035 with a strap torus around the head); huge fan ears (flattened ellipsoids 0.14 x 0.12 rotated outward).
2. Hood: a revolve around the skull open at the face, with a fur trim torus (displaced) at the opening and a fur mantle (a displaced ellipsoid band) over the shoulders; `bone` weights from the head and chest.
3. Body: crossed chest straps (two thin diagonal boxes) with a rope knot (three small tori), a rope belt (torus with a twist in bump), two pouches (rounded boxes 0.05 with a flap), an iron ring, a tail (`sdf.chain` from the hips curling to the side), a pale belly by paintWhere, clawed hands and feet.
4. Tools: a hooked iron tool 0.3 m (a shaft with a hook ring at the end) in `hand.R` and a spike pin 0.2 m in `hand.L`; the attack is a low sweep with the hook; keep taunt. `./forge check kobold-trapper` must end with `result ok` and the ground check must be ok.
5. Sprites: the ears, the hood, the snout, and the eyepatch must read at 128 px.

Limits: under 60,000 triangles, `detail` 0.004 on the face, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/kobold-trapper.ts. Finish with one `./forge all kobold-trapper`.
