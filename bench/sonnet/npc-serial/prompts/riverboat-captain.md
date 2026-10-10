# Builder task: riverboat-captain

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/riverboat-captain.md. The mockup is docs/npc-mockups/riverboat-captain_001.jpg.

The source assets/riverboat-captain.ts exists. First look at out/riverboat-captain/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The jacket is closed and navy at the center. The mockup has a long open coat with lapels over a black vest. Add the open coat flaps to the hips and a black vest at the center.
2. The spyglass is short and thin and points sideways at hip height. The mockup holds a large brass spyglass out at chest height. Raise the arm and make the spyglass longer and thicker.
3. The nose is small and pale. The mockup has a large round red nose. Enlarge the nose and paint it red.
4. The red corners of the mouth hang below the mustache and look like drops. Close the mouth corners into one grin shape.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Third pass. Make the jacket a long open coat (to the knees) over a black vest, as in the mockup. Hold the spyglass out at chest height and make it longer, about 0.2 m.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check riverboat-captain` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/riverboat-captain.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check riverboat-captain` before the final `./forge all riverboat-captain`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB.
- Report in three lines: triangles and warnings, the check result, and what remains.
