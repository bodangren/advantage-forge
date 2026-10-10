# Builder task: teacher

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/teacher.md. The mockup is docs/npc-mockups/teacher_001.jpg.

The source assets/teacher.ts exists. First look at out/teacher/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The hair is a tall, lumpy mass with a rough surface. The mockup hair is a smooth, wavy bob with bangs. Make the hair lower and smooth, and add bangs.
2. From the back and the side, the hair texture is noisy. Reduce the hair displacement so the hair has calm areas.
3. The hair sits low on the forehead and makes the face look small. Show more forehead and a rounder face, as in the mockup.
4. The braid hangs on the opposite side from the mockup. Move the braid to the pointer side.
5. The skirt is dark brown. The mockup skirt is a warm rust color. Make the skirt warmer.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.

Rules:
- `./forge check teacher` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/teacher.ts. Never run git.
- Run `./forge check teacher` before the final `./forge all teacher`. Run no forge command after `./forge all`: a `--fast` build overwrites the textured GLB. Then run the typecheck from your agent rules.
- Report in three lines: triangles and warnings, the check result, and what remains.
