# Builder task: teacher

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/teacher.md. The mockup is docs/npc-mockups/teacher_001.jpg.

The source assets/teacher.ts exists, but an earlier pass stopped before it finished. First run `./forge render teacher --fast` and look at out/teacher/render.png to see the current state.
Then complete the brief: match the mockup in silhouette, then proportions, then color, then details.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.

Rules:
- `./forge check teacher` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/teacher.ts. Never run git.
- Finish with one `./forge all teacher`, then the typecheck from your agent rules.
- Report in three lines: triangles and warnings, the check result, and what remains.
