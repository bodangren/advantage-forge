# Builder task: teacher

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/teacher.md. The mockup is docs/npc-mockups/teacher_001.jpg.

The source assets/teacher.ts exists. First look at out/teacher/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The hair is one large smooth round mass high above the forehead. From the back it looks like a helmet. The mockup hair is soft, wavy, and near the shoulders, with side bangs. Rebuild the hair as wavy locks with bangs and a lower crown.
2. The bare high forehead and thin eyebrows make the face look older than the young, cheerful mockup face. Add bangs to frame the face.
3. The cardigan has a check pattern. The mockup cardigan is plain mustard knit. Remove the check pattern.
4. The side braid is thin and short. Make it thicker and longer.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Third pass. Break the hair into soft wavy locks that end near the shoulders (a `sdf.chain` lock per strand, blended with a small smoothUnion), with side bangs; the back must not read as one smooth helmet.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check teacher` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/teacher.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check teacher` before the final `./forge all teacher`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB.
- Report in three lines: triangles and warnings, the check result, and what remains.
