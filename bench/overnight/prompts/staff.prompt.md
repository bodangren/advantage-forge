You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `staff` (catalog id `equipment/magic-weapons/staff`) as `assets/staff.ts`.

Description: A wizard's staff standing upright on its foot at y = 0: 1.2 m tall. A gnarled dark walnut #6b4226 / #54331d shaft with a leather grip wrap at hand height and an iron ferrule at the foot; the top splits into three curling tines that cradle a glowing crystal orb about 0.12 m wide. The orb is an emissive body (#6ad0ff, emissiveIntensity 2) with a slightly see-through outer shell.

Style anchors. Reference images are in `reference/`:
- `reference/staff-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/chibi-quest-heroes.png`: the heroes of the same game. Gear must look like it belongs to them.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette.
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. Separate bodies per material (wood, iron, leather, glass) with their own roughness and metalness.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0, centred on the Y axis.
- Set the asset `reference` field to `reference/staff-mock.jpg`.
- Only create or edit `assets/staff.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render staff --fast` writes `out/staff/render.png`; look at it, then run `./forge inspect staff --fast`.
- Finish with `./forge all staff` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 6,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.

Emissive rule: Give every emissive body a dark base color (for example #4a1405 under an orange glow, emissiveIntensity about 1.8): a bright base color takes white studio light and washes the glow out to pale peach.
