You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `health-potion` (catalog id `items/consumables/health-potion`) as `assets/health-potion.ts`.

Description: A health potion: a round-bottomed glass flask 0.18 m tall on a flat base at y = 0, bright red liquid (#e0344a, faint emissive glow, intensity 0.4) filling two thirds of the bulb, a see-through glass shell (opacity about 0.35) around it, a cork stopper (#b08a5a), and a twine tie at the neck.

Style anchors. Reference images are in `reference/`:
- `reference/health-potion-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/chibi-quest-heroes.png`: the heroes of the same game. Gear must look like it belongs to them.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette.
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. Separate bodies per material (wood, iron, leather, glass) with their own roughness and metalness.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0, centred on the Y axis.
- Set the asset `reference` field to `reference/health-potion-mock.jpg`.
- Only create or edit `assets/health-potion.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render health-potion --fast` writes `out/health-potion/render.png`; look at it, then run `./forge inspect health-potion --fast`.
- Finish with `./forge all health-potion` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 4,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.

Emissive rule: Give every emissive body a dark base color (for example #4a1405 under an orange glow, emissiveIntensity about 1.8): a bright base color takes white studio light and washes the glow out to pale peach.
