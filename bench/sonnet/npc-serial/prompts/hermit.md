# Builder task: hermit

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/hermit.md. The mockup is docs/npc-mockups/hermit_001.jpg.

The source assets/hermit.ts exists. First look at out/hermit/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The hood is a tight cap with a tall bent point at the back. From the side and the back it reads as a gnome hat. Make a soft hood that frames the face and falls to the shoulders, as in the mockup.
2. The nose is small and the mustache hides it. Make the large round nose of the mockup, because it is a main trait of the face.
3. The berry bowl is at the waist. Lift the bowl to chest height and move it forward, as in the mockup.
4. The walk is stiff. The robe hides the legs and the upper body has little bob.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Third pass. The hood must be a soft cloth hood that frames the face and falls onto the shoulders, with NO point (a tall bent point reads as a gnome hat from the side and the back).

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check hermit` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/hermit.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check hermit` before the final `./forge all hermit`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB.
- Report in three lines: triangles and warnings, the check result, and what remains.
