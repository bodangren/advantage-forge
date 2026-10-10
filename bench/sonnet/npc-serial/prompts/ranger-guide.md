# Builder task: ranger-guide

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/ranger-guide.md. The mockup is docs/npc-mockups/ranger-guide_001.jpg.

The source assets/ranger-guide.ts exists. First look at out/ranger-guide/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. Thin dark ring lines show inside the cloak hem around the legs in the front view. Remove or close the thin shell that makes these lines.
2. The lower garment is cream and short. The mockup has brown trousers into the boots. Change it to brown trousers.
3. The mouth is open. The mockup has a closed smile. Close the mouth.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Third pass. First remove the thin dark ring lines inside the cloak hem around the legs (a visible defect): look at a `--focus` render of the hem. Then soften the hood into a peak at the back.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check ranger-guide` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/ranger-guide.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check ranger-guide` before the final `./forge all ranger-guide`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB.
- Report in three lines: triangles and warnings, the check result, and what remains.
