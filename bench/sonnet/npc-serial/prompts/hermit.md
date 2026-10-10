# Builder task: hermit

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/hermit.md. The mockup is docs/npc-mockups/hermit_001.jpg.

The source assets/hermit.ts exists. First look at out/hermit/render.png to see the current state.

An independent reviewer rated it 7/10, at the bar. Keep the look: change only what the note below needs.

Fix only the critical error: the white hair tuft comes through the top of the hood. Keep all hair inside the hood (intersect the hair with the inside of the hood) or remove the tuft.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check hermit` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/hermit.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check hermit` before the final `./forge all hermit`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/hermit/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
