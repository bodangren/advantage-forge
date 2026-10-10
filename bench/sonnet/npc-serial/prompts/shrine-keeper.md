# Builder task: shrine-keeper

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/shrine-keeper.md. The mockup is docs/npc-mockups/shrine-keeper_001.jpg.

The source assets/shrine-keeper.ts exists. First look at out/shrine-keeper/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The hair is mid brown. The mockup hair is near black. Change the hair color to a dark charcoal black.
2. The hair is a round puffy cap. The mockup hair has a swept, spiky fringe with loose tufts. Shape the fringe into separate locks.
3. The back of the hair has two large lumps. They do not read as a bun. Make one clear bun or remove the lumps.
4. The sleeves are narrower than the wide robe sleeves in the mockup. Make the sleeve ends wider and longer.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Third pass. The mockup hair is near black: add a near-black hair option first (keep the others). Make a spiky swept fringe and remove the two large lumps at the back of the hair.

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
