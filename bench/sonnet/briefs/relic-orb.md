# relic-orb (items/quest-and-treasure/relic-orb) -> assets/relic-orb.ts

A relic orb: a glowing violet sphere r 0.09 (#b070f0 at full brightness, emissive #b070f0 at 0.45, roughness 0.1) resting in a gold three-claw stand (three curved gold prongs from a gold disc base r 0.08), total height 0.26 m.

Size: about 0.25 m tall or wide, standing on y = 0, front toward +Z.
Mockup: docs/item-mockups/relic-orb-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch per the description. Documents stand propped at 70 degrees on a small wedge so the front view shows the face; relics are chunky with one glowing or gold focal part. Emissive parts use a full-brightness base color with emissiveIntensity 0.35 to 0.5. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,500 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render relic-orb --fast`, then run `./forge all relic-orb` once. Never commit. Only create or edit assets/relic-orb.ts.
