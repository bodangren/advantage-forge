You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `well` (catalog id `architecture/structure/well`) as `assets/well.ts`. Reproduce the well from our concept map as closely as you can.

Concept images, in `reference/`:
- `reference/well-concept.png`: the well, cropped from the map and enlarged. This is the main target.
- `reference/well-context.png`: the same well with the cobbled road crossing and the four lanterns around it. For scale, the lantern posts are about 2.5 m tall.
- `reference/riven-lands-v2.png`: the whole concept map (the "Riven Lands" hamlet), for the style.

The concept map is an orthographic three-quarter view from the south, looking north, from about 35 degrees above the ground. Its art direction for every building is: "Tall, narrow gables, heavy stone footings, exposed timber braces, dark slate roofs, rugged ground, gnarled trees, and muted earth colors."

Scope: the well and the low ring of edging stones directly around it. Leave out the cobbled road and the lanterns; they are separate assets.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/architecture.md` and `references/props.md`.
- Look at the concept images before you model. Start `assets/well.ts` with a comment that describes the concept well: its parts, proportions, and colors.
- Set `reference: 'reference/well-concept.png'` in the asset, so every render shows the concept above your views.
- Units are meters. Stand the asset on y = 0. Turn it so that the gable end of the roof faces +Z, like the lower-left side of the concept well. Then `./forge render well --fast --az 40 --el 35` adds a view from about the concept's camera angle.
- Only create or edit `assets/well.ts` (helper files named `assets/_well-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render well --fast` writes `out/well/render.png`. Look at it and compare it with the concept. Also run `./forge inspect well --fast` for a text report of part visibility, silhouette, values, and colors.
- Finish with `./forge all well` and make sure the build prints no `warning:` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
- In your final message, say whether you could see the concept images.
