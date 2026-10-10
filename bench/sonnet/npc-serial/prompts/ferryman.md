# Builder task: ferryman

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/ferryman.md. The mockup is docs/npc-mockups/ferryman_001.jpg.

The source assets/ferryman.ts exists. First look at out/ferryman/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The lantern is small and pale and does not glow. The mockup lantern is large and orange and glows. Make the lantern larger and give it an orange glow.
2. The shirt is light blue. The mockup shirt is dark teal green. Change the shirt to dark teal green.
3. The hat brim is narrower than the mockup brim. The mockup hat is a wide flat cone. Widen the brim and make the straw a little darker.
4. The mustache is small. The mockup has a large mustache that curls out over the beard. Make the mustache larger.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

`./forge check ferryman` fails now. Run it first and fix every item it lists, so that it ends with `result ok` and `ground ok`.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check ferryman` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/ferryman.ts. Never run git.
- Run `./forge check ferryman` before the final `./forge all ferryman`. Run no forge command after `./forge all`: a `--fast` build overwrites the textured GLB. Then run the typecheck from your agent rules.
- Report in three lines: triangles and warnings, the check result, and what remains.
