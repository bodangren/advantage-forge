You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `forge` (catalog id `props/craft-and-trade/forge`) as `assets/forge.ts`.

Description: A blacksmith's stone forge, the warm focal point of the workshop. About 1.3 m wide, 0.9 m deep, and 1.1 m to the top of the hearth, standing on y = 0 with its open front facing +Z. A chunky block of rounded fieldstone (cool gray #8a94a0, dark #5b6670) with a waist-high hearth bed. In the hearth: a mound of glowing coals and a bright fire under a stone hood. A short tapered stone chimney rises from the hood to about 2.0 m. An iron rim (#4a4f55) along the hearth edge. The fire must read through the front opening at 128 px.

Style anchors. Reference images are in `reference/`:
- `reference/blacksmith-quest_001.jpg`: the batch style anchor. Match its forge.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette.
They are style guides, not traces.

Shared rules: read `docs/blacksmith-mockups/construction.md` (section 4, forge focal). The fire and coals are emissive bodies: flame #ff9a3c and #ffd66b, emissiveIntensity 2 to 3, ember coals #ff6a2a. Never bake brightness into plain paint. Stone roughness about 0.9.

Art direction: rounded chunky forms, soft bevels everywhere, a silhouette that reads at 128 px.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the forge on y = 0.
- Set the asset `reference` field to `docs/blacksmith-mockups/blacksmith-quest_001.jpg`.
- Only create or edit `assets/forge.ts`. Do not change any other file. Work only inside the current directory.
- Iterate: `./forge render forge --fast` writes `out/forge/render.png`; also run `./forge inspect forge --fast`.
- Finish with `./forge all forge` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 8,000 triangles.
- You have about 45 minutes. A finished, clean asset beats an ambitious broken one.
