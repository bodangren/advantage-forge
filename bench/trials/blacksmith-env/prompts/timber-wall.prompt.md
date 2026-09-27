You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `timber-wall` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/timber-wall.ts`.

Description: A half-timbered wall tile, 2 m × 1.5 m × 0.12 m, standing on y = 0 with its length along X. A warm white plaster infill #f0e4cc recessed between chunky dark walnut timbers

Style anchors — this is the critical requirement. Reference images are in `reference/`:
- `reference/blacksmith-quest_001.jpg`: the batch style anchor.
- `reference/tavern-quest_001.jpg`: the half-timbered wall pattern, shared grammar.
- `reference/chibi-quest.png`: the hamlet treatment. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/blacksmith-mockups/construction.md` for the wall, floor, and iron/tool palette. Iron is `#4a4f55` / `#363a3f` / `#a8acb1` with `roughness 0.5`, `metalness 0.7`. Walnut is `#6b4226` / `#54331d`. Honey oak is `#b5814a` / `#8a5a35`.

Art direction: rounded chunky forms, soft bevels, reads at 128 px.  two square end posts at x = ±0.925 (0.16 × 0.18 m), a sill beam at the bottom, a top rail at the top, and one diagonal brace in walnut from lower-left to upper-right. Soft bevel on every timber.

Workflow:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`.
- Units are meters. Stand on y = 0.
- Set the asset `reference` field to `docs/blacksmith-mockups/blacksmith-quest_001.jpg`.
- Only create or edit `assets/timber-wall.ts`. Do not change any other file.
- Iterate: `./forge render timber-wall --fast`, then `./forge inspect timber-wall --fast`.
- Finish with `./forge all timber-wall` with no `warning:` lines.
- Under 6,000 triangles.
- About 40 minutes.
