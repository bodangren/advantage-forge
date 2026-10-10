# Builder task: tanner

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/tanner.md. The mockup is docs/npc-mockups/tanner_001.jpg.

The source assets/tanner.ts exists. First look at out/tanner/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The orange bandana covers the full crown like a cap. Make it a band with a knot on top, and show dark hair above it.
2. The hair is medium brown. The mockup hair is dark brown, almost black. Make the hair darker.
3. The skin is light peach. The mockup skin is a warm tan. Make the skin warmer and darker.
4. The model holds the hide flat and horizontal. The mockup holds it diagonal and upright against the chest.
5. The arms are thin and the sleeves are full. Roll up the sleeves and show thicker forearms for the strong trait.
6. From the back, the hair hangs in loose strands with a vertical strip. Make the back of the head a clean shape.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.

Rules:
- `./forge check tanner` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/tanner.ts. Never run git.
- Finish with one `./forge all tanner`, then the typecheck from your agent rules.
- Report in three lines: triangles and warnings, the check result, and what remains.
