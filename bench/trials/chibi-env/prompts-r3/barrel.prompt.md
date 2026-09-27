You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `barrel` (catalog id `props/containers/barrel`) as `assets/barrel.ts`.

Description: A chunky wooden barrel, about 0.9 m tall and 0.65 m wide, with gently bulged staves, two dark iron hoops (top and bottom thirds) and a close-fitting lid with a small round bung. Clear silhouette that reads at 128 px sprite size. No rig or animation.

Style anchors — this is the critical requirement. The barrel must look like it belongs to the SAME game as the props and buildings already built for this hamlet:
- Read `assets/fence.ts` and `assets/barn.ts`. Study their wood palette constants. REUSE their wood palette family: warm honey-brown wood with a subtle grain, exactly the tones the fence and barn use.
- Read `assets/lantern.ts` and `assets/apple.ts` for the settlement's prop language: rounded chunky forms, soft edges, slightly exaggerated proportions, bright readable silhouettes.
- Match the hoop color family to the settlement's dark metal accents (see `assets/lantern.ts`).
- Do NOT copy those files' geometry and do NOT copy any older baseline barrel: build your own barrel in the same style family as the existing props.

Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/props.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Iterate with `./forge render barrel --fast` and look at the render before finishing. Compare it against `./forge render fence --fast`: same game, same wood palette.
- Finish with a full textured build: `./forge all barrel`.
- Keep the whole asset under 8,000 triangles in the final build.
