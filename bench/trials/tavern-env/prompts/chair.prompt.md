You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `chair` (catalog id `props/furniture/chair`) as `assets/chair.ts`.

Description: A simple wooden tavern chair, standing on y = 0 facing +Z (the back toward -Z). Seat 0.42 m x 0.4 m at 0.35 m high, a thick plank seat with a soft bevel; a solid plank back rising to 0.72 m with a gentle curve along the top edge and a slight backward lean; four chunky legs joined by side and back stretchers. The read at 128 px: seat slab plus tall back slab — bold and simple. No rig or animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its wooden seating.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: honey oak #b5814a seat and back, warm brown #8a5a35 legs and stretchers, pale cut wood #c9a06a edge wear.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the chair on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/chair.ts`. Do not change any other file.
- Iterate: `./forge render chair --fast` writes `out/chair/render.png`; also run `./forge inspect chair --fast`.
- Finish with `./forge all chair` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 5,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
