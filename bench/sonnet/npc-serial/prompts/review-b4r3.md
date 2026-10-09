# Review task: bench/sonnet/npc-cards/b4r3

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 5 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/b4r3 (gravedigger.png, jeweler.png, lumberjack.png, mason.png, magistrate.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- gravedigger: the churchyard keeper NPC who knows old stories and secrets; a gentle, lanky old groundskeeper in a flat cap and a patched gray coat, leaning on a spade and holding a little lantern.
- jeweler: a shop NPC who buys and sells gems and rings; a neat, delighted jeweler with a gold monocle and a purple velvet vest, holding up a sparkling blue gem.
- lumberjack: a forest camp NPC who sells wood and clears paths; a big, friendly lumberjack with a brown beard, a red plaid shirt, and a knit cap, resting an axe on his shoulder.
- mason: a builder NPC who repairs walls and builds houses; a strong, cheerful stonemason with a dusty cap and a gray apron, holding a trowel and a stone block.
- magistrate: the town judge NPC who settles disputes in quests; a fair, serious magistrate in a white curled wig and a black robe with a white collar band, holding a gavel and a law book.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 5 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/b4r3/review.json
