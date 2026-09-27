You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `iron-ore` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/iron-ore.ts`.

Description: A chunk of raw iron ore, about 0.18 m on each side, sitting on y = 0. An angular lumpy dark stone in warm grey #5a5248 with reddish-orange rust streaks #b85838 and a small dark grey metallic sheen on a fresh face. Reads at 128 px as one stout lumpy ore rock.

Style anchors — `reference/blacksmith-quest_001.jpg`, `reference/tavern-quest_001.jpg`, `reference/chibi-quest.png`.

Shared rules — read `docs/blacksmith-mockups/construction.md`.

Art direction: rounded chunky forms, soft bevels, reads at 128 px. Palette contract: ore #5a5248, rust #b85838, metallic #4a4f55.

Workflow:
- Read AGENTS.md and the forge-assets skill.
- Stand on y = 0.
- Set `reference` to `docs/blacksmith-mockups/blacksmith-quest_001.jpg`.
- Only edit `assets/iron-ore.ts`.
- `./forge render iron-ore --fast` → `./forge inspect iron-ore --fast` → `./forge all iron-ore` (no warnings).
- Under 4,000 triangles.
- About 40 minutes.