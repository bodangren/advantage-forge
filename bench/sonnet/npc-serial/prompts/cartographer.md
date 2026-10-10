# Builder task: cartographer

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/cartographer.md. The mockup is docs/npc-mockups/cartographer_001.jpg.

The source assets/cartographer.ts exists. First look at out/cartographer/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The hair is a large white cloud that covers the top and the back of the head. The mockup has a bald crown with a small tuft on top and white hair only at the sides. Remove the top mass and add a bald crown with a tuft.
2. The hair surface is lumpy and looks like a cauliflower in the side and back views. Shape the side hair into smooth locks.
3. The dividers are at shoulder height. The mockup holds the dividers up above the head. Raise the arm.
4. The nose is small and the spectacles hide it. The mockup nose is large and round. Make the nose larger.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Third pass. Two reviews disagreed about the hair. Look closely at the mockup and match its hair shape exactly (crown, tuft, and side hair); in the report, describe the mockup hair in one line.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check cartographer` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/cartographer.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check cartographer` before the final `./forge all cartographer`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB.
- Report in three lines: triangles and warnings, the check result, and what remains.
