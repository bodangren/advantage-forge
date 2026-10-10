# Builder task: shrine-keeper

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/shrine-keeper.md. The mockup is docs/npc-mockups/shrine-keeper_001.jpg.

The source assets/shrine-keeper.ts exists. First look at out/shrine-keeper/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The wand is short and gold, with two bells. The mockup staff is a long, rustic wooden staff with a crossbar. Make the wand longer and use a wood color. Keep the small bells.
2. The hair is black, with stiff, lumpy locks that point up, mostly at the back. The mockup hair is a soft, dark brown mop. Make the locks softer and lower, and use a dark brown.
3. The pants are sky blue and puffy. The mockup pants are sage teal and straight to the ankle. Make the pants straight and move the color toward the sage teal of the mockup.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check shrine-keeper` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/shrine-keeper.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check shrine-keeper` before the final `./forge all shrine-keeper`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/shrine-keeper/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
