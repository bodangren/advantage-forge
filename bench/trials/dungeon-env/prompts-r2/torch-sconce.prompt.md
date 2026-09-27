You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset `torch-sconce` as `assets/torch-sconce.ts`. This is a round-2 RE-ROLL: a round-1 version exists but its stonework did not match the batch. Geometry guidance: A wall-mounted iron torch sconce on a 0.4 m wide, 1.2 m tall stub of canon-block wall (2 courses) so the asset stands alone on y = 0. Iron bracket and ring (metalness 0.8), short wooden handle, teardrop flame with emissive #ff9a3c at intensity about 2 — the brightest, warmest point of the kit. Paint a soft warm glow onto the stub stones around the flame. Clean stub top (round 1 had a broken top; keep this one intact).

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
- Only create or edit `assets/torch-sconce.ts`. Do not change any other file.
- Iterate: `./forge render torch-sconce --fast` and look at `out/torch-sconce/render.png`; compare your blocks against `reference/masonry-canon.png` — same course count, same block size, same bevel, same joints. Also run `./forge inspect torch-sconce --fast` for a text report.
- Finish with `./forge all torch-sconce` and make sure the build prints no `warning:` lines.
- Keep the whole asset under 4,000 triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
