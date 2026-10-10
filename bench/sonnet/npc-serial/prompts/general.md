# Builder task: general

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/general.md. The mockup is docs/npc-mockups/general_001.jpg.

The source assets/general.ts exists. First look at out/general/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The telescope is a chain of gold bulbs and reads as a club or a rattle. Make it a straight, tapered brass tube with dark rings and a dark lens end, as in the mockup.
2. The nose is long and pointed, and the mouth is a wide open shape. The mockup has a round nose and a closed, kind smile. Make the nose round and close the mouth in a smile.
3. The hat has wide side points. The mockup hat is rounder, with a front brim. This difference is small because the role asks for a bicorne.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Third pass. Make the telescope one straight brass tube about 0.22 m long, with two dark rings and a dark lens disc at the front end. No bulbs or steps.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check general` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/general.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check general` before the final `./forge all general`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/general/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
