# Builder task: nomad

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/nomad.md. The mockup is docs/npc-mockups/nomad_001.jpg.

The source assets/nomad.ts exists. First look at out/nomad/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The orange coat ends at the hips. The mockup coat is long and reaches the knees. Make the coat longer and let it flare at the hem.
2. The mouth is open with teeth. The mockup shows a closed soft smile. Change the mouth to a closed smile.
3. The waist has a cream band. The mockup has a brown leather belt with a buckle. Change the band to a brown belt.
4. The scarf is a short fur collar. The mockup scarf wraps the neck and hangs down. Add hanging scarf ends.
5. The bedroll is on the back. The mockup holds a round roll at the hip. This difference is small.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

`./forge check nomad` fails now. Run it first and fix every item it lists, so that it ends with `result ok` and `ground ok`.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.

Rules:
- `./forge check nomad` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/nomad.ts. Never run git.
- Run `./forge check nomad` before the final `./forge all nomad`. Run no forge command after `./forge all`: a `--fast` build overwrites the textured GLB. Then run the typecheck from your agent rules.
- Report in three lines: triangles and warnings, the check result, and what remains.
