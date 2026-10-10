# Builder task: lord

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/lord.md. The mockup is docs/npc-mockups/lord_001.jpg.

The source assets/lord.ts exists. First look at out/lord/render.png to see the current state.

An independent reviewer rated it 6.5/10 (bar 7.5). Fix these issues, largest first:
1. The face reads as stern. The brows angle down at the center and the mouth is a small grin. The mockup has raised brows and a wide laugh. Raise the brows and open the mouth.
2. The hair is a large mop of long curly locks. The mockup hair is short and swept back. Make the hair short and swept back.
3. The fur trim is only lumps at the cape corners and the shoulders. The mockup has fur along the cape edges. Put a fur band along the cape edges.
4. The beard is a pointed goatee. The mockup has a short full beard on the jaw.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check lord` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/lord.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check lord` before the final `./forge all lord`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/lord/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
