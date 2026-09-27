You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `apple` (catalog id `props/food/apple`) as `assets/apple.ts`.

Description: A single shiny red apple for a cozy chibi fantasy market, about 0.12 m across. A rounded apple body with a slight dent at the top, one short brown stem, and one small green leaf. Bright red with a soft lighter highlight side. Reads clearly even though tiny. No rig or animation.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/apple.ts` (helper files named `assets/_apple-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render apple --fast` writes `out/apple/render.png`; look at it if you can view images. Also run `./forge inspect apple --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all apple` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
