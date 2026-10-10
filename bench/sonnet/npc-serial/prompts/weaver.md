# Builder task: weaver

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/weaver.md. The mockup is docs/npc-mockups/weaver_001.jpg.

The source assets/weaver.ts exists. First look at out/weaver/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. White streaks on the hair look like gray hair or tape. Remove the streaks and use a soft sheen.
2. The brows slope down to the center and make the face look stern. Raise the inner ends of the brows for a cheerful face.
3. The body is the standard slim base. The mockup weaver is plump. Make the body and the cheeks rounder.
4. The needles are long and thin, like antennae. Make them shorter and thicker, as in the mockup.
5. The basket is small and has few yarn colors. Make the basket larger and add green and purple yarn balls.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.

Rules:
- `./forge check weaver` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/weaver.ts. Never run git.
- Run `./forge check weaver` before the final `./forge all weaver`. Run no forge command after `./forge all`: a `--fast` build overwrites the textured GLB. Then run the typecheck from your agent rules.
- Report in three lines: triangles and warnings, the check result, and what remains.
