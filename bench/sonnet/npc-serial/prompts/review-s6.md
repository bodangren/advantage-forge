# Review task: bench/sonnet/npc-cards/s6

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 5 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/s6 (riverboat-captain.png, caravan-driver.png, ruin-keeper.png, tanner.png, tax-collector.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- riverboat-captain: a river port NPC who runs the riverboat and gives travel and cargo quests; a jolly, round riverboat captain with a white beard and a navy cap, holding out a brass spyglass with one hand on his hip.
- caravan-driver: a road NPC who leads trade caravans between towns and gives escort quests; a sturdy, cheerful caravan driver in a wide sun hat and a long vest, holding a coiled rope and a water flask.
- ruin-keeper: a ruins NPC who guards old ruins, opens sealed doors, and tells their history (kind, never scary); a quiet, kind old ruin keeper in a mossy gray cloak, holding up a big ring of old iron keys and a lantern.
- tanner: a craft NPC who buys hides and sells leather; a strong, cheerful tanner in a thick leather apron, carrying a rolled leather hide in both hands.
- tax-collector: a town hall NPC who collects the town fee and gives counting quests (fussy and funny, not mean); a fussy, prim tax collector in a tall hat and tailcoat, with an open ledger and a small coin box.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 5 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/s6/review.json
