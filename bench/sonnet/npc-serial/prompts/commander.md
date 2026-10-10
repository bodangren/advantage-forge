# Builder task: commander

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/commander.md. The mockup is docs/npc-mockups/commander_001.jpg.

The source assets/commander.ts exists. First look at out/commander/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The beard is a flat black slab with grey speckle noise. From the side it looks like a mask. Give the beard a rounded volume, a dark brown-black color, and fewer speckles.
2. The hair is a ring of even spikes and reads as a crown. The mockup hair is messy and swept, with loose tufts. Make the spikes uneven and swept back.
3. The map is a thin cylinder with tan and cream stripes. It reads as a stick or a bone. Make a wider paper roll with a curled edge.
4. The eyebrows are thin and brown, but the hair and beard are black. The mockup has thick black brows. Make the brows thick and dark.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check commander` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/commander.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check commander` before the final `./forge all commander`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/commander/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
