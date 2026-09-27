You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `stone-floor` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/stone-floor.ts`.

Description: A cobblestone workshop floor tile, 2 m × 2 m × 0.06 m thick, standing on y = 0. Cut blocks of warm grey #8a8a82 in a four-row running bond, #5e5e58 mortar lines between, slightly varied per-tile so repeats don't show. A soft worn rounding on the block tops, gritty normal-map noise on the surface. Reads at 128 px as one stout cobble square.

Style anchors — this is the critical requirement. Every blacksmith-shop asset must look like it belongs to the SAME game as the tavern set. Reference images are in `reference/`:
- `reference/blacksmith-quest_001.jpg`: the batch style anchor.
- `reference/tavern-quest_001.jpg`: the half-timbered wall pattern from the tavern, shared grammar.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/blacksmith-mockups/construction.md` for the wall, floor, and iron/tool palette. Iron is `#4a4f55` / `#363a3f` / `#a8acb1` with `roughness 0.5`, `metalness 0.7`. Walnut is `#6b4226` / `#54331d` (shared with tavern construction §3). Honey oak is `#b5814a` / `#8a5a35`.

Art direction (blacksmith-shop treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: stone #8a8a82, mortar #5e5e58, shadow #6e6e66, light #a8a8a0.

Workflow:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0.
- Set the asset `reference` field to `docs/blacksmith-mockups/blacksmith-quest_001.jpg`.
- Only create or edit `assets/stone-floor.ts`. Do not change any other file.
- Iterate: `./forge render stone-floor --fast` writes `out/stone-floor/render.png`; also run `./forge inspect stone-floor --fast`.
- Finish with `./forge all stone-floor` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 6,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.