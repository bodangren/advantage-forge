# Builder task: archaeologist

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/archaeologist.md. The mockup is docs/npc-mockups/archaeologist_001.jpg.

The source assets/archaeologist.ts exists. First look at out/archaeologist/render.png to see the current state.

An independent reviewer rated it 7.5/10, at the bar. Keep the look: change only what the note below needs.

`./forge check archaeologist` fails now. Run it first and fix every item it lists, so that it ends with `result ok` and `ground ok`.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.

Rules:
- `./forge check archaeologist` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/archaeologist.ts. Never run git.
- Finish with one `./forge all archaeologist`, then the typecheck from your agent rules.
- Report in three lines: triangles and warnings, the check result, and what remains.
