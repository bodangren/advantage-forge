You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `coal` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/coal.ts`.

Description: A chunk of coal, about 0.16 m on each side, sitting on y = 0. An angular jet-black rock with a faint blue-black sheen #1a1a22 and a slight grey dust #4a4a4a on the edges. Reads at 128 px as one stout black rock.

Style anchors — `reference/blacksmith-quest_001.jpg`, `reference/tavern-quest_001.jpg`, `reference/chibi-quest.png`.

Shared rules — read `docs/blacksmith-mockups/construction.md`.

Art direction: rounded chunky forms, soft bevels, reads at 128 px. Palette contract: coal #1a1a1a, sheen #1a1a22, dust #4a4a4a.

Workflow:
- Read AGENTS.md and the forge-assets skill.
- Stand on y = 0.
- Set `reference` to `docs/blacksmith-mockups/blacksmith-quest_001.jpg`.
- Only edit `assets/coal.ts`.
- `./forge render coal --fast` → `./forge inspect coal --fast` → `./forge all coal` (no warnings).
- Under 4,000 triangles.
- About 40 minutes.