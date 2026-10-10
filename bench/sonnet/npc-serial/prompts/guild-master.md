# Builder task: guild-master

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/guild-master.md. The mockup is docs/npc-mockups/guild-master_001.jpg.

The source assets/guild-master.ts exists. First look at out/guild-master/render.png to see the current state.

An independent reviewer rated it 6.5/10 (bar 7.5). Fix these issues, largest first:
1. The side hair is two large curled blocks that look like ram horns or ear muffs. The mockup has smaller bushy curls that join the beard. Make the side hair smaller and blend it into the beard.
2. The beard is a thin chin strap, and the mustache ends curl up to the lower eyelids. The mockup has a full, bushy beard and a mustache that curls out to the sides. Make the beard full and turn the mustache ends outward, below the eyes.
3. The body is not plump. The coat is a straight box with no belly. Add a large round belly under the vest.
4. The coin purse hangs at foot level, near the ground. The mockup holds the purse at hip height. Raise the purse to the fist.
5. The gold medallion is on the gold vest, and the two parts merge. Make the vest a warmer yellow and add a dark chain, as in the mockup.
6. The face is pale, with a pink forehead. The mockup has a red, ruddy face. Add warm red to the cheeks and the nose.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check guild-master` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/guild-master.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check guild-master` before the final `./forge all guild-master`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/guild-master/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
