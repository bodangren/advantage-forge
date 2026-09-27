You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `bush` (catalog id `nature/plants/bush`) as `assets/bush.ts`.

Description: A rounded leafy bush for a cozy chibi fantasy hamlet, about 0.9 m wide and 0.7 m tall. A soft lumpy dome of overlapping leaf clumps in two greens, sitting on the ground with no visible pot or trunk. Maybe two or three tiny lighter leaf highlights. Chunky and friendly, clear silhouette at 128 px. No rig or animation.

Concept image, in `reference/`:
- `reference/bush.jpg`: the target look for this asset. Match the shapes, proportions, and colors. It is a style guide, not a trace: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/vegetation.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/bush.ts` (helper files named `assets/_bush-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render bush --fast` writes `out/bush/render.png`; look at it if you can view images. Also run `./forge inspect bush --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all bush` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
