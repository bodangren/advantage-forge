# Builder task: hermit

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/hermit.md. The mockup is docs/npc-mockups/hermit_001.jpg.

The source assets/hermit.ts exists. First look at out/hermit/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The hood is a hard round dome with a knob. From the back and the side it reads as a ball or an acorn. The mockup hood is soft cloth that falls onto the shoulders. Make the hood soft and let it fall to the shoulders.
2. The ears are small. The mockup has large pointed ears that stand out from the hood. Make the ears larger.
3. The mustache hides the mouth. The mockup shows a soft smile under the mustache. Show a small smile.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

`./forge check hermit` fails now. Run it first and fix every item it lists, so that it ends with `result ok` and `ground ok`.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check hermit` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/hermit.ts. Never run git.
- Run `./forge check hermit` before the final `./forge all hermit`. Run no forge command after `./forge all`: a `--fast` build overwrites the textured GLB. Then run the typecheck from your agent rules.
- Report in three lines: triangles and warnings, the check result, and what remains.
