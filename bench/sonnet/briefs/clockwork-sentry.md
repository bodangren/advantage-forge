# clockwork-sentry (enemies/construct/clockwork-sentry) -> assets/clockwork-sentry.ts

A small brass automaton about 0.95 m tall, faces +Z, on the animated armor base (assets/animated-armor.ts: the construct rig with knee bones and a weapon hand; clips idle, walk, run, attack, hit, death, awaken; variant slots and presets). Bar 8/10 (character).

Mockup: docs/enemy-mockups/clockwork-sentry_001.jpg (set `reference` to that path). Match its idea: a wide domed brass head like a flattened capsule with two brass side clips and a single round blue glass lens on the front with a winding key on top; a round barrel body with a big round porthole showing a glowing blue gear inside; thin rod arms with copper coil joints ending in a small crossbow on the right arm and a claw on the left; two thin rod legs with coil ankles standing on a wide round riveted iron base plate that is part of the character (it walks with the plate as its feet); a small copper tail pipe behind.

Palette: brass #b8924a with lit #d8b878 and shade #8a6a30 (metalness 0.8, roughness 0.35); copper coils #8a5a3a; iron base and crossbow #4a4a50 (metalness 0.6, roughness 0.5); lens and gear glow #3ac8ff emissive 1.6 on a #0a2a3a base; glass #cfe8ff opacity 0.5.
Variants: metal (brass default, silver #b8bcc4, dark iron #4a4a50), glow (blue default, amber #ffb020, green #5aff6a).

Construction recipe:
1. Copy assets/animated-armor.ts. Keep the rig and the clips (awaken = a wind-up start). Replace the armor bodies: head (a flattened capsule 0.3 x 0.16 x 0.24 with a seam line in bump, two side clips as small rounded boxes, a front lens: a cylinder r 0.04 with a glass disc and an emissive core, a winding key on top: a small cylinder stem with a flat T bar), body (a sphere r 0.16 squashed to 0.18 x 0.2 x 0.16 with a porthole ring torus R 0.08 in front, a glass disc and an emissive gear disc behind it, rivets), arms (thin cylinders r 0.012 with copper coil joints: three stacked tori each), a crossbow on the right forearm (a small box with a bow arc and a bolt), a claw on the left (three finger cones), legs (thin cylinders with coil ankles), feet as one wide round base plate (cylinder r 0.22 h 0.04 with 12 rivets) split into two half-discs so each leg bone moves one half; a tail pipe (a chain) behind.
2. Clips: keep the base clips; the attack fires the crossbow (a short arm thrust); the death powers down (tilt and sink 0.05). `./forge check clockwork-sentry` must end with `result ok` (the crossbow is on the arm, not a held item, so "no held items" is also fine) and the ground check must be ok.
3. Sprites: the domed head, the blue lens, the porthole, and the round base must read at 128 px.

Limits: under 55,000 triangles, `detail` 0.004 on the head, 0.006 elsewhere. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/clockwork-sentry.ts. Finish with one `./forge all clockwork-sentry`.
