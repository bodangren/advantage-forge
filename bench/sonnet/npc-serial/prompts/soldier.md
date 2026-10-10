# Builder task: soldier

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/soldier.md. The mockup is docs/npc-mockups/soldier_001.jpg.

Build the new asset assets/soldier.ts from the brief.

Budget: about 35 tool calls and 8 images (a new build).
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.
- Critical errors block acceptance (owner rule): hair or a part through a head covering or another part, a held item that points the wrong way or does not touch the hand, a floating part, a hole. Fix every critical error that you see before the final build.

Rules:
- `./forge check soldier` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/soldier.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check soldier` before the final `./forge all soldier`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/soldier/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
