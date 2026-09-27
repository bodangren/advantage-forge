You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `bellows` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/bellows.ts`.

Description: A pair of hand bellows, about 0.35 m long, 0.18 m tall, 0.12 m wide, sitting on y = 0. Two stacked teardrop leather bags in warm tan #8a5a35 with brass nozzle, a chunky wooden handle and a leather hinge at the back. Slight puff of darker charcoal near the nozzle. Reads at 128 px as one stout little leather pump.

Style anchors — `reference/blacksmith-quest_001.jpg`, `reference/tavern-quest_001.jpg`, `reference/chibi-quest.png`.

Shared rules — read `docs/blacksmith-mockups/construction.md`. Iron `#4a4f55`, walnut `#6b4226` / `#54331d`.

Art direction: rounded chunky forms, soft bevels, reads at 128 px. Palette contract: leather #8a5a35, brass #caa24a, walnut handle #6b4226.

Workflow:
- Read AGENTS.md and the forge-assets skill.
- Stand on y = 0.
- Set `reference` to `docs/blacksmith-mockups/blacksmith-quest_001.jpg`.
- Only edit `assets/bellows.ts`.
- `./forge render bellows --fast` → `./forge inspect bellows --fast` → `./forge all bellows` (no warnings).
- Under 4,000 triangles.
- About 40 minutes.