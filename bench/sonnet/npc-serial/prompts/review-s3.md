# Review task: bench/sonnet/npc-cards/s3

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 5 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/s3 (archaeologist.png, tanner.png, tax-collector.png, teacher.png, weaver.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- archaeologist: a ruins NPC who studies old relics and gives exploration quests; a curious, excited young archaeologist in a sun helmet, holding up a magnifying glass and a small clay tablet.
- tanner: a craft NPC who buys hides and sells leather; a strong, cheerful tanner in a thick leather apron, carrying a rolled leather hide in both hands.
- tax-collector: a town hall NPC who collects the town fee and gives counting quests (fussy and funny, not mean); a fussy, prim tax collector in a tall hat and tailcoat, with an open ledger and a small coin box.
- teacher: a school NPC who teaches lessons and gives reading quests; a kind, cheerful teacher with a side braid and a mustard cardigan, raising a pointer stick and holding a red apple.
- weaver: a craft NPC who sells cloth and yarn; a cheerful, plump weaver with knitting needles in her bun, carrying a basket full of colorful yarn balls.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 5 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/s3/review.json
