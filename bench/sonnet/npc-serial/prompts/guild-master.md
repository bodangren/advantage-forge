# Builder task: guild-master

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/guild-master.md. The mockup is docs/npc-mockups/guild-master_001.jpg.

The source assets/guild-master.ts exists. First look at out/guild-master/render.png to see the current state.

An independent reviewer rated it 6.5/10 (bar 7.5). Fix these issues, largest first:
1. The body is narrow and the bald head is much wider than the coat. The mockup is a plump man with a big round belly. Make the belly and the coat wider and rounder.
2. The big gold medallion of the chain of office does not show. The chest shows a gold panel. Add a large round gold medallion on the belly, on a thick gold chain.
3. The key is a small ring on a short rod and the bit does not show. Make the key larger, with a decorative bow and a clear bit.
4. The side whiskers are two brown blocks. In the side and back views they look attached to the head like handles. Shape them as curls that join the beard.
5. The forehead has a pink patch on peach skin. The mockup has an even, ruddy skin on the whole head. Use one even, warm skin tone with blush on the cheeks.
6. The brown coat has a fuzzy surface like the fur trim. The mockup coat is smooth. Make the coat smooth so that the fur trim stands out.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Third pass. The body must be plump: make the torso, coat, and waistcoat about 1.25 times wider and deeper at the belly, so the coat is wider than the head. Show the big gold medallion below the beard, and make the key 1.5 times larger.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check guild-master` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/guild-master.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check guild-master` before the final `./forge all guild-master`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/guild-master/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
