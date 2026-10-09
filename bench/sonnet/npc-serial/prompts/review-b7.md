# Review task: bench/sonnet/npc-cards/b7

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 7 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/b7 (tanner.png, tax-collector.png, teacher.png, traveler.png, undertaker.png, watch-captain.png, weaver.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- tanner: a craft NPC who buys hides and sells leather; a strong, cheerful tanner in a thick leather apron, carrying a rolled leather hide in both hands.
- tax-collector: a town hall NPC who collects the town fee and gives counting quests (fussy and funny, not mean); a fussy, prim tax collector in a tall hat and tailcoat, with an open ledger and a small coin box.
- teacher: a school NPC who teaches lessons and gives reading quests; a kind, cheerful teacher with a side braid and a mustard cardigan, raising a pointer stick and holding a red apple.
- traveler: a road NPC who trades news from far towns and gives travel quests; An eager young traveler with a big backpack and a feathered hat, reading an open map.
- undertaker: a graveyard NPC who tends the old cemetery and tells ghost legends (calm and kind, never scary); a calm, gentle undertaker in a long dark coat and a tall hat, holding a white lily and a small blue-glowing lantern.
- watch-captain: a town guard NPC who leads the night watch and gives patrol quests; a proud, friendly watch captain in a blue tabard and a plumed helmet, holding up a glowing lantern.
- weaver: a craft NPC who sells cloth and yarn; a cheerful, plump weaver with knitting needles in her bun, carrying a basket full of colorful yarn balls.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 7 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/b7/review.json
