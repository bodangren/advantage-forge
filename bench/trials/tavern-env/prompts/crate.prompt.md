You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `crate` (catalog id `props/containers/crate`) as `assets/crate.ts`.

Description: A wooden storage crate, about 0.5 m × 0.4 m × 0.4 m (W × H × D), standing on y = 0. Honey-oak planks nailed to a chunky corner-post frame: two horizontal planks on each face, a top planked lid with a slight overhang, two dark iron strap hinges at the back, an iron banding at the top and bottom edges. Slight board separation, soft bevels, paint variation between boards. Reads at 128 px as one stout wooden box in the corner. No rig, no animation.

Style anchors — this is the critical requirement. Every tavern asset must look like it belongs to the SAME game as the hamlet set. Two reference images are in `reference/`:
- `reference/tavern-quest_001.jpg`: the batch style anchor. Match its stacked wooden crates.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms and soft bevels.
They are style guides, not traces.

Shared rules — read `docs/tavern-mockups/construction.md` §3 for the timber and iron palette. Honey oak is `#b5814a` / `#8a5a35`. Iron is `#4a4f55` with `roughness 0.5`, `metalness 0.7`.

Art direction (tavern treatment of Chibi Quest): rounded chunky forms, soft bevels, reads at 128 px. Palette contract: honey oak #b5814a planks with #8a5a35 shadow, dark iron #4a4f55 straps.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the crate on y = 0.
- Set the asset `reference` field to `docs/tavern-mockups/tavern-quest_001.jpg`.
- Only create or edit `assets/crate.ts`. Do not change any other file.
- Iterate: `./forge render crate --fast` writes `out/crate/render.png`; also run `./forge inspect crate --fast`.
- Finish with `./forge all crate` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 4,000 triangles.
- You have about 30 minutes. A finished, clean asset beats an ambitious broken one.