You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `rope-coil` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/rope-coil.ts`.

Description: A coiled length of hemp rope, about 0.4 m diameter, 0.12 m tall, sitting on y = 0. Rope warm tan #c2a06a wound in three neat circles with visible twist strands; a free end tucked under the coil. Reads at 128 px as one stout rope donut.

Style anchors — `reference/blacksmith-quest_001.jpg`, `reference/tavern-quest_001.jpg`, `reference/chibi-quest.png`.

Shared rules — read `docs/blacksmith-mockups/construction.md`. Rope uses the burlap family `#c2a06a` / `#9a7d4c`.

Art direction: rounded chunky forms, soft bevels, reads at 128 px. Palette contract: rope #c2a06a, shadow #9a7d4c, light #d8b888.

Workflow:
- Read AGENTS.md and the forge-assets skill.
- Stand on y = 0.
- Set `reference` to `docs/blacksmith-mockups/blacksmith-quest_001.jpg`.
- Only edit `assets/rope-coil.ts`.
- `./forge render rope-coil --fast` → `./forge inspect rope-coil --fast` → `./forge all rope-coil` (no warnings).
- Under 4,000 triangles.
- About 40 minutes.