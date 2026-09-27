You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `plaster-wall-window` (catalog family `architecture/building-parts`, covers the `window` row) as `assets/plaster-wall-window.ts`.

Description: The same modular tavern wall as `plaster-wall` — 2 m long, about 1.5 m tall, 0.12 m thick, standing on y = 0 with its length along X — but with a shuttered window centered at about 0.95 m height: a dark walnut frame around a 0.6 m x 0.6 m opening, two wooden shutter leaves standing open against the plaster, a chunky deep sill, and dark glass or a dark recess behind (evening outside — a very dark blue #1a2433, NOT emissive). Timber posts at both ends, sill beam, top rail (the diagonal brace moves or splits to clear the window). Soft bevels everywhere. Keep the back side clean. No rig or animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its white plaster, dark timber, and shuttered window.
- `reference/chibi-quest.png`: the hamlet treatment of the same game.
They are style guides, not traces.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: timber dark walnut #6b4226 and deep #54331d, plaster warm white #f0e4cc, window recess very dark blue #1a2433.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the wall on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/plaster-wall-window.ts`. Do not change any other file.
- Iterate: `./forge render plaster-wall-window --fast` writes `out/plaster-wall-window/render.png`; also run `./forge inspect plaster-wall-window --fast`.
- Finish with `./forge all plaster-wall-window` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 8,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
