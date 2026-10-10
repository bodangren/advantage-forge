# Builder task: cartographer

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/cartographer.md. The mockup is docs/npc-mockups/cartographer_001.jpg.

The source assets/cartographer.ts exists. First look at out/cartographer/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The head is bald with a small white puff on top. The mockup has full white hair swept up into a crest. Cover the top of the head with swept-back white hair.
2. The glasses are gold. The mockup glasses are black.
3. The maps are pale cream. The mockup maps are tan parchment.
4. The white hair at the back is a lumpy band.
5. In walk, the arms stay still (known base limit).
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.

Rules:
- `./forge check cartographer` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/cartographer.ts. Never run git.
- Run `./forge check cartographer` before the final `./forge all cartographer`. Run no forge command after `./forge all`: a `--fast` build overwrites the textured GLB. Then run the typecheck from your agent rules.
- Report in three lines: triangles and warnings, the check result, and what remains.
