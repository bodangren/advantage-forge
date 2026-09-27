You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `farm-field` (catalog id `architecture/landscape-parts/farm-field`) as `assets/farm-field.ts`.

Description: A rectangular farm field plot for a cozy chibi fantasy hamlet, about 4 m by 3 m and 0.1 m tall, top at y = 0.1. A framed plot of dark tilled soil surrounded by a low wooden border beam, with neat short rows of small green sprout dots across the soil. Chunky and friendly, clear at 128 px. No rig or animation.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/farm-field.ts` (helper files named `assets/_farm-field-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render farm-field --fast` writes `out/farm-field/render.png`; look at it if you can view images. Also run `./forge inspect farm-field --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all farm-field` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
