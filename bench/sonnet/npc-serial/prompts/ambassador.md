# Builder task: ambassador

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/ambassador.md. The mockup is docs/npc-mockups/ambassador_001.jpg.

The source assets/ambassador.ts exists. First look at out/ambassador/render.png to see the current state.

An independent reviewer rated it 6.5/10 (bar 7.5). Fix these issues, largest first:
1. The sleeves are narrow with large gold puffed cuffs. The mockup has wide hanging sleeves, the main shape of the graceful silhouette. Make wide open sleeves with gold edges.
2. The robe ends at the shin and flares out. The mockup robe is long and reaches the shoes. Make the robe longer and straighter.
3. The scroll is small and the hand holds it forward at the waist. The mockup holds a large scroll up at shoulder height. Make the scroll larger and raise the arm.
4. The skin is much darker than the warm medium brown skin in the mockup. Use the mockup skin tone for the default preset.
5. The belt is gold. The mockup has a red-orange sash with a gold medallion. Change the sash color.
6. The hair has a rough braided texture. The mockup hair is smooth and swept back. Smooth the hair surface.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- The budget is a limit, not a target: stop when the brief or the fix list is done.
- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check ambassador` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/ambassador.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check ambassador` before the final `./forge all ambassador`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB. Exception: if the textured out/ambassador/render.png shows a defect that the fast render did not show, fix it, run the check again, and run `./forge all` once more.
- Report in three lines: triangles and warnings, the check result, and what remains.
