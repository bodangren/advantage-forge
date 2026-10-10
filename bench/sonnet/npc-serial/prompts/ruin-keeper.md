# Builder task: ruin-keeper

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/ruin-keeper.md. The mockup is docs/npc-mockups/ruin-keeper_001.jpg.

The source assets/ruin-keeper.ts exists. First look at out/ruin-keeper/render.png to see the current state.

An independent reviewer rated it 6.5/10 (bar 7.5). Fix these issues, largest first:
1. White hair pokes through the hood on the top and the sides. The side and three-quarter views show it. Shrink the hair or cut it with the inside of the hood.
2. The hood is a round knit cap with a knob. The mockup hood is soft cloth with a point that falls onto the shoulders. Change the hood to a soft cloth hood.
3. The model wears round glasses. The mockup has no glasses. Remove the glasses.
4. The cloak is plain gray with a thin green edge. The mockup cloak is gray green with moss tones. Add a green moss tint to the cloak.
5. The key ring is small. The mockup ring is large and held up near the face. Make the ring larger.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

The build prints one `warning:` line now. Fix its cause.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check ruin-keeper` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/ruin-keeper.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check ruin-keeper` before the final `./forge all ruin-keeper`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB.
- Report in three lines: triangles and warnings, the check result, and what remains.
