# Builder task: beggar

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/beggar.md. The mockup is docs/npc-mockups/beggar_001.jpg.

The source assets/beggar.ts exists. First look at out/beggar/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The hat is a hard round dome with a stiff brim. It looks like a metal helmet. Make a soft, floppy hat with a dented crown and a wavy brim.
2. The coat is a short knit vest to the hips. Make a long, ragged brown coat to the knees with visible patches.
3. The cup is small, silver, and clean. It looks like a glass. Make a larger, dark, dented tin cup.
4. The nose is small. The mockup has a large, round pink nose that is a focal point of the face.
5. The mustache hides the mouth, so the gentle smile does not read. Show a small smile under the mustache.
6. In walk, the cup arm stays still (known base limit).
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.

Rules:
- `./forge check beggar` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/beggar.ts. Never run git.
- Run `./forge check beggar` before the final `./forge all beggar`. Run no forge command after `./forge all`: a `--fast` build overwrites the textured GLB. Then run the typecheck from your agent rules.
- Report in three lines: triangles and warnings, the check result, and what remains.
