RULES FOR EVERY ARM (read first)
- Your name is <ARM> (for example h3). Create only assets/baker-<ARM>.ts. The `name` field is `baker-<ARM>`. Edit no other file. Never run git. Never commit.
- Run every forge command as: `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge <cmd> baker-<ARM> ...`  (the machine has little memory; the lock queues builds one at a time. Wait for it; do not skip it.)
- Loop: write the file; `./forge render baker-<ARM> --fast`; Read `out/baker-<ARM>/render.png`; compare with docs/npc-mockups/baker_001.jpg; fix the largest difference. Stop after at most 6 renders. If a build gives an empty mesh or an error, fix that first.
- When the shape is right, run `./forge check baker-<ARM>` once and one `./forge all baker-<ARM>` (also under flock).
- Finish with a report of 8 lines or less: the file path, the check result, any warnings, the three largest remaining differences, and the number of renders used.
