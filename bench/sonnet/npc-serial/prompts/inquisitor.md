# Builder task: inquisitor

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/inquisitor.md. The mockup is docs/npc-mockups/inquisitor_001.jpg.

The source assets/inquisitor.ts exists. First look at out/inquisitor/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The goatee is a round gray ball on the chin. The mockup has a pointed goatee. Shape the goatee as a short point below the mouth.
2. The lantern is small and silver and it has no light. The mockup lantern is larger and glows warm yellow. Make the lantern larger and give the glass a warm emissive glow.
3. The body is gray from the hat to the hem. The mockup has a beige vest and a white shirt under the coat. Paint the vest beige to give a warm accent at the chest.
4. The nose is small. The mockup has a large round nose. Make the nose larger.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check inquisitor` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/inquisitor.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check inquisitor` before the final `./forge all inquisitor`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/inquisitor/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
