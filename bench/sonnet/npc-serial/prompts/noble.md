# Builder task: noble

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/noble.md. The mockup is docs/npc-mockups/noble_001.jpg.

The source assets/noble.ts exists. First look at out/noble/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The hat is flat with yellow stripes and reads as a boater. The mockup hat has a turned brim and a dark teal band. Remove the yellow edge and turn up the brim.
2. The feather is a white lump. Shape it as a long curved plume.
3. The coat stops at the hips and has gold edges. The mockup coat goes to the knees with plain teal lapels. Make the coat longer.
4. The cane hangs at the side and has a ball top. The mockup noble leans on a cane with a curved handle. Put a curved handle on the cane and angle it out.
5. The jabot is a flat white shape. The mockup jabot is frilly.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check noble` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/noble.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check noble` before the final `./forge all noble`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/noble/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
