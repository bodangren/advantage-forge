# Builder task: spy

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/spy.md. The mockup is docs/npc-mockups/spy_001.jpg.

The source assets/spy.ts exists. First look at out/spy/render.png to see the current state.

An independent reviewer rated it 6.5/10 (bar 7.5). Fix these issues, largest first:
1. Dark hair tips come through the outer surface of the hood on the character's left side. They show in the front, three-quarter, and side views. Keep all hair inside the hood.
2. The mouth is open with a small fang-like tooth. The mockup shows a closed smile. Change the mouth to a closed smile.
3. The hood is a smooth round dome with a small tip. The mockup hood is soft and loose, with messy hair that spills out. Make the hood looser and let more hair show at the front.
4. The cloak back is one smooth green bell. Add folds and a hem line so the back reads as cloth.
5. The mockup cloak is darker and more muted. The model green is a little bright.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Fix the critical error first: dark hair tips come through the outer surface of the hood on the left side. Keep all hair inside the hood (intersect the hair with the inside of the hood). Then the fix list.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.
- Critical errors block acceptance (owner rule): hair or a part through a head covering or another part, a held item that points the wrong way or does not touch the hand, a floating part, a hole. Fix every critical error that you see before the final build.

Rules:
- `./forge check spy` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/spy.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check spy` before the final `./forge all spy`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/spy/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
