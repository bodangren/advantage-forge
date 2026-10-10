# Builder task: trapper

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/trapper.md. The mockup is docs/npc-mockups/trapper_001.jpg.

The source assets/trapper.ts exists. First look at out/trapper/render.png to see the current state.

An independent reviewer rated it 6.5/10 (bar 7.5). Fix these issues, largest first:
1. The coat is short and pale tan, with a lumpy surface. The mockup coat is a long, mid-brown buckskin coat to the knees, with beige fur cuffs. Make the coat longer, darker, and smoother.
2. The hat has two round bear ears. The mockup hat is a plain brimmed felt hat. Remove the ears.
3. The plaid shows as a flat square bib on the chest. The mockup has a red plaid scarf around the neck, with ends that hang down. Make the plaid a scarf around the neck.
4. The beard is thinner than the mockup beard. Make the beard fuller and bushier.
5. The back hair under the hat has uneven drip shapes. Make the back hair one smooth mass.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check trapper` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/trapper.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check trapper` before the final `./forge all trapper`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/trapper/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
