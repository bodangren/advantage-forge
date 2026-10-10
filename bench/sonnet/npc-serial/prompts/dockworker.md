# Builder task: dockworker

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/dockworker.md. The mockup is docs/npc-mockups/dockworker_001.jpg.

The source assets/dockworker.ts exists. First look at out/dockworker/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The body is the standard size. The mockup dockworker is big, with wide shoulders and a thick torso. Make the shoulders and the torso wider.
2. The rope is one small yellow ring. It looks like metal. Make loose rope coils that hang from the hands.
3. From the side, the beard reads as a dark round patch on the cheek. Blend it into the jaw and the hair.
4. The fists go into the sides of the crate.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.

Rules:
- `./forge check dockworker` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/dockworker.ts. Never run git.
- Run `./forge check dockworker` before the final `./forge all dockworker`. Run no forge command after `./forge all`: a `--fast` build overwrites the textured GLB. Then run the typecheck from your agent rules.
- Report in three lines: triangles and warnings, the check result, and what remains.
