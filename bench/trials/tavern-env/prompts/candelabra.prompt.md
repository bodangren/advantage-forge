You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `candelabra` (catalog id `props/furniture/candelabra`) as `assets/candelabra.ts`.

Description: A three-arm table candelabra, lit. About 0.45 m tall, standing on y = 0 on a round dark-walnut base (about 0.16 m diameter, 0.025 m thick), a chunky central column rising with a low swell, branching at the top into three curved arms (each ending in a small drip cup and a lit candle flame). The three flames are emissive — the room's warm accent. Iron strapping at the base and the arm junctions for material contrast. Reads at 128 px as one dark-metal silhouette with three warm flame blobs. No rig, no animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its three-arm candelabra shape and warm flame color.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/tavern-mockups/construction.md` §3 for the timber palette. Iron is `#4a4f55` with `roughness 0.5`, `metalness 0.7`. Flame emissive uses warm amber, not blue or white.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: dark iron #4a4f55, walnut base #6b4226, flame emissive amber #ffb255 with hot core #fff1c2.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the candelabra on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/candelabra.ts`. Do not change any other file.
- Iterate: `./forge render candelabra --fast` writes `out/candelabra/render.png`; also run `./forge inspect candelabra --fast`.
- Finish with `./forge all candelabra` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 5,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.