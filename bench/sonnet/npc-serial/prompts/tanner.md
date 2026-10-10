# Builder task: tanner

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/tanner.md. The mockup is docs/npc-mockups/tanner_001.jpg.

The source assets/tanner.ts exists. First look at out/tanner/render.png to see the current state.

An independent reviewer rated it 6.5/10 (bar 7.5). Fix these issues, largest first:
1. One fist holds the hide roll low at the hip and the other arm hangs down. The mockup holds the roll up at the chest. Raise the roll to chest height and put both fists on it.
2. Hair strands cross the orange headband on all sides and look like hair through the band. Put the band fully over the hair, or cut the hair at the band.
3. The shirt is cream-white with large puffy sleeves. The mockup shirt is tan with short sleeves. Change the shirt to tan.
4. The strong body is not shown. The arms and shoulders are the same as the base. Make the shoulders and forearms larger.
5. The headband knot is a small bow on top. The mockup knot sits at the side with loose tails.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Third pass. Hold the rolled hide across the chest in both fists: make it a horizontal roll centered on x = 0 and use the kind `hold` option, so the two mirrored fists both grip it. Keep every hair strand under the headband.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check tanner` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/tanner.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check tanner` before the final `./forge all tanner`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB.
- Report in three lines: triangles and warnings, the check result, and what remains.
