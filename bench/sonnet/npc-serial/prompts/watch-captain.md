# Builder task: watch-captain

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/watch-captain.md. The mockup is docs/npc-mockups/watch-captain_001.jpg.

The source assets/watch-captain.ts exists. First look at out/watch-captain/render.png to see the current state.

An independent reviewer rated it 6.5/10 (bar 7.5). Fix these issues, largest first:
1. The model holds the lantern low at the hip. The mockup holds the lantern up at shoulder height. Raise the lantern arm.
2. The lantern has no glow. Make the lantern glass glow a warm orange, as in the mockup.
3. The mouth is open and shows teeth. The mockup shows a closed, confident smile. Close the mouth.
4. The skin is dark brown. The mockup skin is a warm tan. Make the skin lighter to match the mockup.
5. The helmet is a round dome with a hammered surface. The mockup helmet is smooth with a brim. Make the surface smooth and add the brim.
6. In the side view, the mace shaft crosses in front of the leg. Check the clearance in the walk clip.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check watch-captain` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/watch-captain.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one.
- Run `./forge check watch-captain` before the final `./forge all watch-captain`. Run no forge command after `./forge all`: a `--fast` build overwrites the textured GLB. Then run the typecheck from your agent rules.
- Report in three lines: triangles and warnings, the check result, and what remains.
