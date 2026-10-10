# Builder task: lady

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/lady.md. The mockup is docs/npc-mockups/lady_001.jpg.

The source assets/lady.ts exists. First look at out/lady/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. In the walk, a dark green shoe pushes through the front of the skirt (t=0.11, t=0.22, t=0.67). Keep the feet inside the skirt during the walk.
2. The purse is pink. The mockup purse is green and cream. Change the purse color.
3. The gown is narrower than in the mockup. The mockup gown is very full. Make the skirt wider at the hem.
4. The fan is small. The mockup fan is larger. Make the fan larger.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

An earlier pass stopped in the middle (a network error), so the source may hold part of the fixes. Fix 1 is a clip defect: after the fix, view out/lady/anim/walk.png once (run `./forge animate lady --fast --clip walk`) to confirm that no shoe pushes through the skirt.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check lady` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/lady.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check lady` before the final `./forge all lady`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/lady/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
