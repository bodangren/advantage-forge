You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `iron-helmet` (catalog id `equipment/armor/iron-helmet`) as `assets/iron-helmet.ts`.

Description: An open iron helmet sized for a chibi hero's big head: about 0.36 m wide, 0.30 m tall, 0.38 m deep, resting on its rim at y = 0. It is a SHELL, open at the bottom like a bowl turned upside down (not a closed ball): a round dome skull cap, a raised brow band with rivets, a nasal guard hanging down at the front, and two short cheek guards; the back curves down only to about the nape. One iron family for the whole helmet (#4a4f55 body, #a8acb1 worn highlights on the crown and rivets), never a pale top on a dark bottom. Front toward +Z. Keep reflections calm: very small or no displacement on the metal.

Style anchors. Reference images are in `reference/`:
- `reference/iron-helmet-mock.jpg`: a concept mockup of this asset. Match its idea and colors, not every detail.
- `reference/chibi-quest-heroes.png`: the heroes of the same game. Gear must look like it belongs to them.
- `reference/chibi-quest.png`: the hamlet treatment of the same game. Match its rounded forms, soft bevels, and cheerful palette.
They are style guides, not traces: keep the geometry simple enough to model with primitives.

Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, slightly oversized readable features, a silhouette that reads at 128 px. Separate bodies per material (wood, iron, leather, glass) with their own roughness and metalness.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0, centred on the Y axis.
- Set the asset `reference` field to `reference/iron-helmet-mock.jpg`.
- Only create or edit `assets/iron-helmet.ts`. Do not change any other file. Work only inside the current directory; never use absolute paths.
- Iterate: `./forge render iron-helmet --fast` writes `out/iron-helmet/render.png`; look at it, then run `./forge inspect iron-helmet --fast`.
- Finish with `./forge all iron-helmet` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 6,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
