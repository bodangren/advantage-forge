You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `stone-floor` (catalog family per docs/blacksmith-mockups/components.tsv) as `assets/stone-floor.ts`.

Description: A 2 m x 2 m cobblestone workshop floor tile, 0.06 m thick, top at y = 0.06, centred on the origin so tiles repeat on a 2 m grid (edges at x = ±1, z = ±1). Chunky irregular flagstones like the mockup: about 25 to 35 stones of varied size (0.25 to 0.5 m), each a slightly raised, softly bevelled block (rounded top edges, 0.01 to 0.02 m higher than the mortar), warm grey #8a8a82 with per-stone value variation (some lighter #a09f96, some darker #75756e), dark mortar #5e5e58 in the gaps. No stone may cross the tile edge: stones along the border stop at the edge so neighbouring tiles line up. Keep the whole tile as one or two bodies; use paintFn and bump for fine grit, not thousands of separate shapes.

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