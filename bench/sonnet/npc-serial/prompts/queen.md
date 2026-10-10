# Builder task: queen

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/queen.md. The mockup is docs/npc-mockups/queen_001.jpg.

The source assets/queen.ts exists. First look at out/queen/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The crown is very large, with seven blunt, rounded points. It dominates the head and the sprites. The mockup crown is small, with sharp points and a purple gem at the front. Make the crown smaller with sharp points and a clear purple gem.
2. The free arm points out to the side with a fist. The mockup holds the hands together in front of the waist. Bring the free arm in toward the waist.
3. The scepter top is a star, so it reads as a magic wand. The mockup has an ornate gold top. Change the star to a small crown or a gold flower shape.
4. The skin is lighter than the warm brown skin of the mockup. Use a warmer, darker skin tone.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check queen` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/queen.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check queen` before the final `./forge all queen`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/queen/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
