You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `pumpkin` (catalog id `props/food/pumpkin`) as `assets/pumpkin.ts`.

Description: A round orange pumpkin for a cozy chibi fantasy market and farm, about 0.45 m across and 0.35 m tall. A plump ribbed body (six to eight soft vertical lobes), a short thick green stem, and a slight flat spot at the base. Warm orange with deeper grooves. Chunky and friendly, clear silhouette at 128 px. No rig or animation.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/pumpkin.ts` (helper files named `assets/_pumpkin-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render pumpkin --fast` writes `out/pumpkin/render.png`; look at it if you can view images. Also run `./forge inspect pumpkin --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all pumpkin` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
