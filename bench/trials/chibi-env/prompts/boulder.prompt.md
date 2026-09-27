You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `boulder` (catalog id `nature/terrain/boulder`) as `assets/boulder.ts`.

Description: A weathered granite boulder for a cozy chibi fantasy landscape, about 1.2 m wide and 0.8 m tall. One rounded lumpy stone mass with two or three softer facet planes, a flatter base where it meets the ground, and a patch of moss on one side. Cool gray stone, chunky and friendly, clear silhouette at 128 px. No rig or animation.

Concept image, in `reference/`:
- `reference/boulder.jpg`: the target look for this asset. Match the shapes, proportions, and colors. It is a style guide, not a trace: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/vegetation.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/boulder.ts` (helper files named `assets/_boulder-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render boulder --fast` writes `out/boulder/render.png`; look at it if you can view images. Also run `./forge inspect boulder --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all boulder` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
