# Builder task: caravan-driver

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/caravan-driver.md. The mockup is docs/npc-mockups/caravan-driver_001.jpg.

The source assets/caravan-driver.ts exists. First look at out/caravan-driver/render.png to see the current state.

An independent reviewer rated it 6.5/10 (bar 7.5). Fix these issues, largest first:
1. The mouth is an open grimace with teeth. In the three-quarter view it reads as worry. The mockup shows a smile under the mustache. Change the mouth to a smile.
2. The skin is dark brown. The mockup skin is light tan. Change the default skin to the mockup tone.
3. The arms hang down and hold the rope and the flask at the hips. The mockup holds both in front of the body. Raise the forearms to waist and chest height.
4. The red neckerchief is missing, and the red is on a waist sash. The mockup has a red neckerchief and a brown belt. Move the red to the neck.
5. The hat is pale cream. The mockup hat is warm ochre tan. Make the hat darker and warmer.
6. A flat flap hangs from the back of the hat. It reads as a board in the side and back views. Remove the flap.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

`./forge check caravan-driver` fails now. Run it first and fix every item it lists, so that it ends with `result ok` and `ground ok`.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check caravan-driver` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/caravan-driver.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check caravan-driver` before the final `./forge all caravan-driver`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB.
- Report in three lines: triangles and warnings, the check result, and what remains.
