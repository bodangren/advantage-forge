You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `plaster-wall-door` (catalog family `architecture/building-parts`, covers the `wood-door` P0 row) as `assets/plaster-wall-door.ts`.

Description: The same modular tavern wall as `plaster-wall` — 2 m long, about 1.5 m tall, 0.12 m thick, standing on y = 0 with its length along X — but with a doorway about 0.85 m wide and 1.2 m tall: a chunky dark walnut frame (two posts and a lintel) and the wooden door leaf standing AJAR, opened about 30 degrees toward +Z (into the room). The door leaf is warm honey oak with vertical planks, two dark iron strap hinges, and a small dark ring handle. Timber posts at both wall ends, sill beams stepping around the opening, top rail. Soft bevels everywhere. The door leaf is a separate body from the wall so it reads as one piece. No rig or animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its open wooden door and dark timber frame.
- `reference/chibi-quest.png`: the hamlet treatment of the same game.
They are style guides, not traces.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: timber dark walnut #6b4226 and deep #54331d, plaster warm white #f0e4cc, door honey oak #b5814a with warm brown #8a5a35 planks, iron dark gray #4a4f55.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the wall on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/plaster-wall-door.ts`. Do not change any other file.
- Iterate: `./forge render plaster-wall-door --fast` writes `out/plaster-wall-door/render.png`; also run `./forge inspect plaster-wall-door --fast`.
- Finish with `./forge all plaster-wall-door` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 8,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
