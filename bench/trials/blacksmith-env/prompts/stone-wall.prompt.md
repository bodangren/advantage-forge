You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `stone-wall` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/stone-wall.ts`.

Description: An ashlar stone wall tile, 2 m × 1.5 m × 0.12 m, standing on y = 0 with its length along X. Cut blocks of warm grey #8a8a82 in a four-row bond pattern, #5e5e58 mortar lines, soft bevel on every stone edge. A darker capstone #5e5e58 across the top, a sill beam matching the timber wall's at the bottom. No windows or doors — solid stone.

Style anchors — this is the critical requirement. Reference images are in `reference/`:
- `reference/blacksmith-quest_001.jpg`: the batch style anchor.
- `reference/tavern-quest_001.jpg`: the half-timbered wall pattern, shared grammar.
- `reference/chibi-quest.png`: the hamlet treatment. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/blacksmith-mockups/construction.md` for the wall, floor, and iron/tool palette. Iron is `#4a4f55` / `#363a3f` / `#a8acb1` with `roughness 0.5`, `metalness 0.7`. Walnut is `#6b4226` / `#54331d`. Honey oak is `#b5814a` / `#8a5a35`.

Art direction: rounded chunky forms, soft bevels, reads at 128 px. Palette contract

Workflow:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`.
- Units are meters. Stand on y = 0.
- Set the asset `reference` field to `docs/blacksmith-mockups/blacksmith-quest_001.jpg`.
- Only create or edit `assets/stone-wall.ts`. Do not change any other file.
- Iterate: `./forge render stone-wall --fast`, then `./forge inspect stone-wall --fast`.
- Finish with `./forge all stone-wall` with no `warning:` lines.
- Under 6,000 triangles.
- About 40 minutes.
