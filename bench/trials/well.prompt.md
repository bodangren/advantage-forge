You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `well` (catalog id `architecture/structure/well`) as `assets/well.ts`.

Description: A village well for a cozy fantasy RPG hamlet. A round fieldstone well ring, about 1.4 m across and 0.8 m tall, with a dark water opening. Two sturdy wooden posts rise from the ring and hold a small, steep, peaked shingle roof. A wooden crank (windlass) with a handle spans the posts; a rope winds around it, and a wooden bucket with iron bands hangs above the opening. Stylized and chunky, with a clear silhouette that reads at small sprite size. About 2.5 m tall overall. No rig or animation.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/props.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/well.ts` (helper files named `assets/_well-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render well --fast` writes `out/well/render.png`; look at it if you can view images. Also run `./forge inspect well --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all well` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
