# Builder task: baker

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/baker.md. The mockup is docs/npc-mockups/baker_001.jpg.

The source assets/baker.ts exists. First look at out/baker/render.png to see the current state.

An independent reviewer rated it 7/10, at the bar. Keep the look: change only what the note below needs.

Fix only the critical error: in the rest clip from t = 0.80 the head bows and the chin goes into the apron bib. Lower the bib top or keep the chin clear of it. After the fix, view out/baker/anim/rest.png once (run `./forge animate baker --fast --clip rest`, then the final `./forge all baker`).

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check baker` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/baker.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check baker` before the final `./forge all baker`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/baker/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
