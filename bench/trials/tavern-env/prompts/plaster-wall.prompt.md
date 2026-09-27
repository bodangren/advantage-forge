You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `plaster-wall` (catalog id `architecture/building-parts/plaster-wall`) as `assets/plaster-wall.ts`.

Description: A modular tavern wall piece, 2 m long (one tile), about 1.5 m tall, 0.12 m thick, standing on y = 0 with its length along X centered on z = 0. Warm white plaster infill between dark walnut timber: a chunky post at BOTH ends (square in section, slightly proud of the plaster), a sill beam along the bottom, a top rail, and one diagonal timber brace. The posts at the ends are the key feature: two walls meeting at a corner read as a proper timber corner with no dedicated corner piece. Soft bevels on every timber; the plaster panel sits a few mm recessed. The wall must look good from BOTH sides (it is seen from inside the room; keep the back clean too). No rig or animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its white plaster with dark timber braces and posts.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: timber dark walnut #6b4226 and deep #54331d, plaster warm white #f0e4cc with a soft #d8c9a8 shade near the sill.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the wall on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/plaster-wall.ts`. Do not change any other file.
- Iterate: `./forge render plaster-wall --fast` writes `out/plaster-wall/render.png`; also run `./forge inspect plaster-wall --fast`.
- Finish with `./forge all plaster-wall` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 8,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
