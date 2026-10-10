# Builder task: ruin-keeper

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/ruin-keeper.md. The mockup is docs/npc-mockups/ruin-keeper_001.jpg.

The source assets/ruin-keeper.ts exists. First look at out/ruin-keeper/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The hood is a tight round dome, and the hair bun on top looks like a pom-pom on a beanie. The mockup hood is soft and draped, with a peak and a wide green lining around the face. Make the hood looser, add folds, and show the lining.
2. From the side and the back, the hood and the cloak form one smooth gray sack. Let the hood fall onto the shoulders as a separate cape layer.
3. The cloak is plain gray with dark green stains. The mockup cloak is gray-green with moss at the edges. Shift the cloak color toward green and keep the moss at the hems.
4. The key ring is a ring of dark knobs with small keys. The mockup shows a large chain ring with clear keys. Make the keys larger and separate.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Third pass. Make the hood soft and draped, with folds and a green lining at the face opening. No bun and no ball shape on top (it reads as a beanie pom-pom).

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check ruin-keeper` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/ruin-keeper.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check ruin-keeper` before the final `./forge all ruin-keeper`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/ruin-keeper/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
