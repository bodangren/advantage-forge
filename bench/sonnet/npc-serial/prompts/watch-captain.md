# Builder task: watch-captain

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/watch-captain.md. The mockup is docs/npc-mockups/watch-captain_001.jpg.

The source assets/watch-captain.ts exists. First look at out/watch-captain/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The skin is light peach. The mockup has medium brown skin. Change the default skin to match the mockup.
2. The cheek guards are flat plates that float at the temples below the brim. Attach them to the helmet brim and let them hang down along the cheeks.
3. The hair is short and curly. The mockup has hair to the shoulders under the helmet. Lengthen the hair.
4. The lantern is small and the glow is weak. Make the lantern larger with a bright amber glow, because it is the focal prop.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Third pass. Make the default skin the medium brown of the mockup (put that option first, keep the others). Attach the cheek guards to the helmet brim so they do not float at the temples (a visible defect); check them in a `--views side --focus` render.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check watch-captain` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/watch-captain.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check watch-captain` before the final `./forge all watch-captain`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB.
- Report in three lines: triangles and warnings, the check result, and what remains.
