You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `pine-tree` (catalog id `nature/trees/pine-tree`) as `assets/pine-tree.ts`.

Description: A stylized pine tree for a cozy chibi fantasy forest edge, about 5 m tall. A short brown trunk and three stacked cone-shaped foliage tiers in a fresh green, each tier soft and rounded with a gently drooping edge. Slightly asymmetric so it does not look machine-made. Chunky and friendly, clear silhouette at 128 px sprite size. No rig or animation.

Concept image, in `reference/`:
- `reference/pine-tree.jpg`: the target look for this asset. Match the shapes, proportions, and colors. It is a style guide, not a trace: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/vegetation.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/pine-tree.ts` (helper files named `assets/_pine-tree-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render pine-tree --fast` writes `out/pine-tree/render.png`; look at it if you can view images. Also run `./forge inspect pine-tree --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all pine-tree` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
