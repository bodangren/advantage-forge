You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `anvil` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/anvil.ts`.

Description: A classic blacksmith anvil, about 0.55 m long, 0.2 m wide, 0.35 m tall, standing on y = 0 facing +Z. The outline must read at 128 px: a flat rectangular face on top; a LONG tapered conical horn (about 0.18 m) sweeping out and slightly down from one end to a point; a short square heel at the other end; the body narrows to a clear waist under the face and flares again into four splayed feet. A hardy hole and a pritchel hole in the face. Dark iron #4a4f55 with a brighter worn face #a8acb1 on top. Rounded bevels on every edge.

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