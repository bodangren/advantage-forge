# Builder task: tax-collector

Work in /home/daniebo/Desktop/advantage-forge.
The brief is bench/sonnet/briefs/tax-collector.md. The mockup is docs/npc-mockups/tax-collector_001.jpg.

The source assets/tax-collector.ts exists. First look at out/tax-collector/render.png to see the current state.

An independent reviewer rated it 7/10 (bar 7.5). Fix these issues, largest first:
1. The hair and the mustache are brown. The mockup hair and mustache are black. Make them black.
2. The model adds round gold spectacles that the mockup does not show. Remove them or make them smaller so the eyes read as in the mockup.
3. The coin box is dark and the ledger has a red cover. The mockup props are gold. Make the props gold to give the focal accent.
4. The ledger is small and low at the hip. Make it larger and raise it toward the chest as in the mockup.
5. The coat is dark blue-gray. The mockup coat is black. Make the coat darker for more contrast with the vest.
Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.

Budget: about 25 tool calls and 6 images.
- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.
- For a small fix, render with `--views` or `--focus` instead of all views.
- Do not read the source again after an edit.

Rules:
- `./forge check tax-collector` ends with `result ok` and `ground ok`.
- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.
- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.
- Edit only assets/tax-collector.ts. Never run git.
- Finish with one `./forge all tax-collector`, then the typecheck from your agent rules.
- Report in three lines: triangles and warnings, the check result, and what remains.
