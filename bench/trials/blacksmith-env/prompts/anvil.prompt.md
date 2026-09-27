You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `anvil` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/anvil.ts`.

Description: A heavy iron anvil, about 0.45 m long, 0.18 m wide, 0.3 m tall, standing on y = 0 facing +Z. A wide flat top, a pronounced horn on one end, a hardie hole and a pritchel hole on top, a soft swell through the waist, and a wide splayed cast-iron base. Slight worn bright spots on the top from use. Reads at 128 px as one stout dark-iron anvil.

Style anchors — see `reference/blacksmith-quest_001.jpg`, `reference/tavern-quest_001.jpg`, `reference/chibi-quest.png`.

Shared rules — read `docs/blacksmith-mockups/construction.md`. Iron is `#4a4f55` / `#363a3f` / `#a8acb1` with `roughness 0.5`, `metalness 0.7`.

Art direction: rounded chunky forms, soft bevels, reads at 128 px. Palette contract: iron #4a4f55, shadow #363a3f, highlight #a8acb1.

Workflow:
- Read AGENTS.md and `.claude/skills/forge-assets/SKILL.md`.
- Stand the anvil on y = 0.
- Set `reference` field to `docs/blacksmith-mockups/blacksmith-quest_001.jpg`.
- Only create or edit `assets/anvil.ts`.
- `./forge render anvil --fast` → `./forge inspect anvil --fast` → `./forge all anvil` (no warnings).
- Under 4,000 triangles.
- About 40 minutes.