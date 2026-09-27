You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `lantern` (catalog id `props/furniture/lantern`) as `assets/lantern.ts`.

Description: A standing outdoor lantern for a cozy chibi fantasy hamlet square, about 1.4 m tall. A dark iron post on a small round base, topped by a glass lantern head with a warm glowing flame inside and a small peaked cap. The glass head glows softly (emissive). Chunky and friendly, clear silhouette at 128 px. No rig or animation.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/lantern.ts` (helper files named `assets/_lantern-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render lantern --fast` writes `out/lantern/render.png`; look at it if you can view images. Also run `./forge inspect lantern --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all lantern` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
