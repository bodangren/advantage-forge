# Builder task: diplomat

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/diplomat.md. The mockup is docs/npc-mockups/diplomat_001.jpg.

The source assets/diplomat.ts exists. First look at out/diplomat/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The hair is a light caramel color, near the skin value. The mockup hair is dark brown. Make the hair dark brown, so the face has a clear frame.
2. The hair has rows of lumpy ridges, most visible from the back. Make a smooth side-parted shape with volume on top, as in the mockup.
3. The scroll is small, and the hand holds it low. Make the scroll larger and raise it to shoulder height.
4. The smile is small. The mockup has a wide smile. Make the mouth wider.
5. A dark, ragged edge shows at the back collar under the hair. Close the gap between the hair and the collar.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check diplomat` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/diplomat.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check diplomat` before the final `./forge all diplomat`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/diplomat/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
