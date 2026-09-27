You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `barn` (catalog id `architecture/structure/barn`) as `assets/barn.ts`.

Description: A red wooden barn for a cozy chibi fantasy hamlet, about 4.5 m wide, 3.5 m deep, and 4 m tall to the ridge. Rounded chunky forms with a broad bright roof, big double doors at the front, a small hay door above them, and simple white trim boards on the corners. Stylized and friendly, with a clear silhouette that reads at 128 px sprite size. No rig or animation.

Concept image, in `reference/`:
- `reference/barn.jpg`: the target look for this asset. Match the shapes, proportions, and colors. It is a style guide, not a trace: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/barn.ts` (helper files named `assets/_barn-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render barn --fast` writes `out/barn/render.png`; look at it if you can view images. Also run `./forge inspect barn --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all barn` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
