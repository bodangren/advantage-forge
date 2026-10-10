# Builder task: stablekeeper

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/stablekeeper.md. The mockup is docs/npc-mockups/stablekeeper_001.jpg.

The source assets/stablekeeper.ts exists. First look at out/stablekeeper/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The hair is a large round dark mass. It is much taller and wider than the swept, wavy hair in the mockup. Make the hair smaller and give it swept waves.
2. The mouth is a small open oval with teeth. In the three-quarter view it reads as surprise, not as the broad grin of the mockup. Widen the mouth into a broad smile.
3. The eyebrows are thin. The mockup has thick black eyebrows. Make the eyebrows thicker.
4. The red bandana is a thin collar. The mockup shows a knotted triangle on the chest. Add a triangle with a knot.
5. The horse brush reads as a wooden spoon. Add visible bristles on the face of the brush.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

`./forge check stablekeeper` fails now. Run it first and fix every item it lists, so that it ends with `result ok` and `ground ok`.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.

Rules:
- `./forge check stablekeeper` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/stablekeeper.ts. Never run git.
- Run `./forge check stablekeeper` before the final `./forge all stablekeeper`. Run no forge command after `./forge all`: a `--fast` build overwrites the textured GLB. Then run the typecheck from your agent rules.
- Report in three lines: triangles and warnings, the check result, and what remains.
