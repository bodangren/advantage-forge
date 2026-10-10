# Builder task: goblin-citizen

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/goblin-citizen.md. The mockup is docs/npc-mockups/goblin-citizen_001.jpg.

The source assets/goblin-citizen.ts exists. First look at out/goblin-citizen/render.png to see the current state.

An independent reviewer rated it 6.5/10 (bar 7.0). Fix these issues, largest first:
1. The bell is upside down relative to the grip. The crown and its knob point up, and the fist holds a short stem below the bell mouth. Put the handle in the fist and hang the bell below it, mouth down.
2. The arm holds the bell at chest height. The mockup holds the bell up at head height. Raise the arm.
3. The backpack is a small box with two pots. The mockup and the role show a huge sack of odds and ends. Make the pack larger than the torso and add more items.
4. The head covering is a yellow pointed cap. The mockup shows an orange bandana with a knot. Change the cap to a wrapped orange bandana.
5. The neck scarf is a plain yellow ring. The mockup shows an orange scarf with a hanging end. Add the hanging end and use orange.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

The critical error comes first: hold the bell by its handle in the fist, with the bell mouth down and the handle up. View a --focus render of the fist to confirm.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.
- Critical errors block acceptance (owner rule): hair or a part through a head covering or another part, a held item that points the wrong way or does not touch the hand, a floating part, a hole. Fix every critical error that you see before the final build. For each held item, check in a `--focus` render that the fist grips the handle and that the item points the way the mockup shows it.
- A held pole, spear, or staff: put its foot about 0.06 m above the ground. The rest and run clips lower the chest by 6 to 7 cm, and a lower foot fails the ground check.

Rules:
- `./forge check goblin-citizen` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/goblin-citizen.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check goblin-citizen` before the final `./forge all goblin-citizen`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/goblin-citizen/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
