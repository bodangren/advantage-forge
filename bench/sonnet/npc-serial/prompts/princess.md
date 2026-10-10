# Builder task: princess

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/princess.md. The mockup is docs/npc-mockups/princess_001.jpg.

The source assets/princess.ts exists. First look at out/princess/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The skirt is a straight drum with a flat gold disc at the hem. From the side, a flat shelf shows at the waist. Make a flared bell skirt with a ruffled gold edge.
2. The legs are pink from the skirt to the ground. The mockup shows bare brown legs with small pink shoes. Show skin on the legs and keep pink only on the shoes.
3. The left wrist has a gold bracelet that the mockup does not show. Remove it or make it smaller.
4. The small dot on the forehead in the mockup is missing.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check princess` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/princess.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check princess` before the final `./forge all princess`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/princess/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
