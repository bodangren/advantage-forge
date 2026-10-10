# Builder task: lady

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/lady.md. The mockup is docs/npc-mockups/lady_001.jpg.

The source assets/lady.ts exists. First look at out/lady/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The skirt is a stiff pyramid with sharp corners at the hem. Make a round bell skirt with soft folds, as in the mockup.
2. The small green purse sits at the skirt hem, away from the hand, and looks dropped. Put the purse in the left fist at hip height.
3. The back of the skirt is flat and wide in the back view. Give the back of the skirt a round, full volume.
4. The mockup shows a pearl necklace. Add a short pearl necklace above the lace collar.
5. In the walk clip, the skirt hides all leg motion and the body only bobs. Add a small sway to the skirt hem.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Third pass. Make the skirt a round bell: one `sdf.revolve` of a smooth profile (`profile.polygon(..., { smooth: true })`) with a round hem and no corners. Put the purse in the left fist.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check lady` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/lady.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check lady` before the final `./forge all lady`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/lady/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
