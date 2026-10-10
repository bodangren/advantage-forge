# Builder task: masked-agent

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/masked-agent.md. The mockup is docs/npc-mockups/masked-agent_001.jpg.

The source assets/masked-agent.ts exists. First look at out/masked-agent/render.png to see the current state.

An independent reviewer rated it 6.5/10 (bar 7.5). Fix these issues, largest first:
1. A skin-colored spot shows through the center of the mask above the eyes. Close the mask surface so that it is fully white.
2. The mask is a narrow band with round eye holes and gold rims, and it reads as goggles. Make a broader half mask that covers the nose bridge, as in the mockup.
3. The hood is a large round dome, and the cloak stops at the knees. Give the hood a soft point and make the cloak long to the ankles.
4. The free hand hangs at the side. Raise the free hand to the chin, as in the mockup.
5. The back view and the back sprites show only a plain purple shape. Add folds and a hem edge to the back of the cloak.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check masked-agent` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/masked-agent.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check masked-agent` before the final `./forge all masked-agent`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/masked-agent/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
