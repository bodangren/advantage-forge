You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `orb` (catalog id `equipment/magic-weapons/orb`) as `assets/orb.ts`.

Description: A magic orb on a small stand: a glowing glass sphere 0.2 m wide (emissive #6ad0ff on a dark base color, a see-through outer shell) held by three curled gold claws on a round wooden base on y = 0. Stand it on y = 0 (unless the description says otherwise), centred on the Y axis, front toward +Z.

Style anchors. Reference images are in `reference/`:
- `reference/orb-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/chibi-quest-heroes.png` (the heroes who use this gear) and `reference/chibi-quest.png` (the hamlet treatment: rounded forms, soft bevels, cheerful palette).
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Palette for this scene: iron #4a4f55 / #363a3f / highlight #a8acb1 (roughness 0.5, metalness 0.7); steel edge #c8ccd2; wood honey oak #b5814a, warm brown #8a5a35, pale cut wood #c9a06a, dark walnut #6b4226; leather #8a5a35 / #5c3a22; gold #d4a93a (metalness 1); magic glow on a dark base color.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. One body per material (wood, iron, cloth, stone, glass, food) with its own roughness and metalness. Glowing parts are emissive bodies, never bright plain paint. Give every emissive body a dark base color (for example #4a1405 under an orange glow, emissiveIntensity about 1.8): a bright base color takes white studio light and washes the glow out to pale peach.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters.
- Set the asset `reference` field to `reference/orb-mock.jpg`.
- Only create or edit `assets/orb.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render orb --fast` writes `out/orb/render.png`; look at it, then run `./forge inspect orb --fast`.
- Finish with `./forge all orb` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 3,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
