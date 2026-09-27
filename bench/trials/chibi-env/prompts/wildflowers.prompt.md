You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `wildflowers` (catalog id `nature/plants/wildflowers`) as `assets/wildflowers.ts`.

Description: A small patch of wildflowers for a cozy chibi fantasy meadow, about 0.7 m across and 0.5 m tall. A low tuft of green stems and leaves with five to seven round flower heads in two or three bright colors (red, yellow, white) on simple stems. Reads as one cheerful clump at 128 px. No rig or animation.

Concept image, in `reference/`:
- `reference/wildflowers.jpg`: the target look for this asset. Match the shapes, proportions, and colors. It is a style guide, not a trace: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/vegetation.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/wildflowers.ts` (helper files named `assets/_wildflowers-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render wildflowers --fast` writes `out/wildflowers/render.png`; look at it if you can view images. Also run `./forge inspect wildflowers --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all wildflowers` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
