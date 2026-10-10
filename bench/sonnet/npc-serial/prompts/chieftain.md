# Builder task: chieftain

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/chieftain.md. The mockup is docs/npc-mockups/chieftain_001.jpg.

The source assets/chieftain.ts exists. First look at out/chieftain/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The bronze sun on the staff is a small ring. The mockup sun is a large disc with rays, about the size of the head. Make the sun about three times larger.
2. The tunic is bright orange. The mockup tunic is dark red brown. Make the tunic darker.
3. The belt buckle is small. The mockup has a large round gold buckle. Make the buckle larger and round.
4. The staff is wavy along its full length. The mockup staff is straighter with a carved head. This difference is small.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

`./forge check chieftain` fails now. Run it first and fix every item it lists, so that it ends with `result ok` and `ground ok`.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check chieftain` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/chieftain.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one.
- Run `./forge check chieftain` before the final `./forge all chieftain`. Run no forge command after `./forge all`: a `--fast` build overwrites the textured GLB. Then run the typecheck from your agent rules.
- Report in three lines: triangles and warnings, the check result, and what remains.
