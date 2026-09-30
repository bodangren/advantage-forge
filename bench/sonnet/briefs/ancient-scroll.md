# ancient-scroll (items/quest-and-treasure/ancient-scroll) -> assets/ancient-scroll.ts

An ancient scroll: aged tan paper (#d8b98a with #a88a5c edges and a torn ragged end shown as small notches in the paper edge profile), dark bone knobs (#e8dcc0) instead of wood, a faded purple ribbon (#7a4a8a) and a cracked black wax seal (#2a2622) with a small gold rune painted on it.

Size: 0.37 m long with its knobs, 0.08 m thick, lying on y = 0 with its axis along X.
Mockup: docs/item-mockups/ancient-scroll-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/scroll.ts. Read it first. Copy the base with cp, keep its paper roll, rod, knobs, ribbon and seal construction, and change only the paper tint, the knob material, the ribbon color and the identifying mark as the description says.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 4,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render ancient-scroll --fast`, then run `./forge all ancient-scroll` once. Never commit. Only create or edit assets/ancient-scroll.ts.
