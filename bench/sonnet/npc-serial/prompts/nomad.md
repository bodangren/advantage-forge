# Builder task: nomad

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/nomad.md. The mockup is docs/npc-mockups/nomad_001.jpg.

The source assets/nomad.ts exists. First look at out/nomad/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The hair is thick rope locks with gold bands. The mockup hair is soft, wavy, shoulder-length curls without bands. Change the locks to wavy curls and remove the gold bands.
2. The bedroll is a red disk with a cream spiral. The mockup bedroll is tan with a brown rim. Change the bedroll to tan, so that the red does not pull focus.
3. The staff leans out at a wide angle and the hand holds it low. The mockup holds the staff upright at chest height.
4. The coat has a quilted diamond pattern and ends above the knee. The mockup coat is smooth and ends at the knee.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Third pass. Make the hair soft wavy curls (no rope locks, no gold bands) and the bedroll tan, as in the mockup.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check nomad` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/nomad.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check nomad` before the final `./forge all nomad`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB.
- Report in three lines: triangles and warnings, the check result, and what remains.
