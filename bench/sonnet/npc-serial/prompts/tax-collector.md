# Builder task: tax-collector

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/tax-collector.md. The mockup is docs/npc-mockups/tax-collector_001.jpg.

The source assets/tax-collector.ts exists. First look at out/tax-collector/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The ledger is a flat cream card with lines and a gold rim. It looks like a sign. The mockup ledger is an open brown leather book with pages. Make an open book with a brown cover.
2. The coat stops at the hips at the back. The mockup tailcoat has long tails to the knees. Add two coat tails at the back.
3. The face has no nose and the mustache hides the mouth, so the fussy, funny expression is weak. Add a round nose and raise one eyebrow.
4. The coat is plain black. The mockup coat and trousers have pinstripes too.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Third pass. Make the ledger an open brown leather book with cream pages (two page blocks and a spine), not a flat card.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.
- View one render after your last edit, before the final check, so the report describes the final shape.

Rules:
- `./forge check tax-collector` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/tax-collector.ts. Never run git.
- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.
- Run the typecheck from your agent rules and `./forge check tax-collector` before the final `./forge all tax-collector`. Edit nothing and run no forge command after `./forge all`: a later edit makes the build old, and a `--fast` build overwrites the textured GLB.
- Report in three lines: triangles and warnings, the check result, and what remains.
