You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `wall-alcove` as `assets/wall-alcove.ts`. This is a round-2 RE-ROLL: a round-1 version exists but its stonework did not match the batch. Geometry guidance: A 2 m wall segment, exactly 2 canon courses (0.60 m each), 0.4 m thick, with ONE arched niche cut into the +Z face: about 0.5 m wide, 0.7 m tall, 0.25 m deep, arched top from radial segments of the same course height, jamb of whole blocks either side. The niche interior paints deep slate #2a3547 and stays EMPTY (dressing assets slot in at assembly). Round-1 failure to avoid: it built 4-5 courses of smaller, lighter blocks with a smooth voussoir arch and an unrequested window sill, and stood taller than the kit. Match the canon plate exactly.

MASONRY CANON — the critical requirement. `reference/masonry-canon.png` is the canonical dungeon wall. Your stonework must read as THE SAME WALL built by the same hand:
- Exactly 2 block courses per 1.2 m of height (course height 0.60 m). Never more, smaller courses.
- Blocks about 0.55 m long (half-blocks at run ends), deep rounded pillow bevels of about 0.04 m.
- Joints recessed about 0.03 m, deep navy #2a3547. Block faces #4a5d75, slightly convex; worn tops #7a8ba0.
- Moss: small #3fae9a clumps at the BASE only — never a blob on top.
- Stone roughness 0.9, metalness 0. Keep the whole asset economical (the canon wall is 2,626 triangles).
FORBIDDEN: brick courses smaller than the canon, crazy-paving cells, smooth stacked drums, lighter smooth voussoirs.

Overall mood reference: `reference/dungeon-quest_002.jpg` (chunky rounded stone, warm torch accents, teal moss). The masonry canon plate overrides it wherever they disagree on block details.

Instructions:
- Before modeling, read AGENTS.md and the skill at `.claude/skills/forge-assets/SKILL.md`, with `references/architecture.md` and `references/materials-and-color.md`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit `assets/wall-alcove.ts`. Do not change any other file.
- Iterate: `./forge render wall-alcove --fast` and look at `out/wall-alcove/render.png`; compare your blocks against `reference/masonry-canon.png` — same course count, same block size, same bevel, same joints. Also run `./forge inspect wall-alcove --fast` for a text report.
- Finish with `./forge all wall-alcove` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 8,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
