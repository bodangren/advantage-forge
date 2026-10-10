# Builder task: commander

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/commander.md. The mockup is docs/npc-mockups/commander_001.jpg.

The source assets/commander.ts exists. First look at out/commander/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The hair has tall, sharp spikes that look like a crown of horns. The mockup has short, messy tufts. Make the spikes shorter and softer.
2. The map is a plain cream cylinder. Give it a curled outer edge and a tan parchment color with one or two dark lines.
3. The brows angle down toward the nose, so the face looks stern. Raise the inner ends of the brows for a kind look.
4. The lower edge of the hair at the back has a row of round bumps. Make it one smooth edge.
5. The boots have steel toe caps. The mockup has plain brown boots. Remove the caps.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Third pass. Replace the tall sharp spikes with short messy tufts, as in the mockup: no tuft tip more than 3 cm above the skull.

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
