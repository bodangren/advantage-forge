# Review task: bench/sonnet/npc-cards/b8

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 6 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/b8 (archaeologist.png, caravan-driver.png, cartographer.png, dockworker.png, ferryman.png, hermit.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- archaeologist: a ruins NPC who studies old relics and gives exploration quests; a curious, excited young archaeologist in a sun helmet, holding up a magnifying glass and a small clay tablet.
- caravan-driver: a road NPC who leads trade caravans between towns and gives escort quests; a sturdy, cheerful caravan driver in a wide sun hat and a long vest, holding a coiled rope and a water flask.
- cartographer: a map-maker NPC who sells maps and asks the player to explore new places; a careful, kind old cartographer with round spectacles, holding up brass dividers and a bundle of rolled maps.
- dockworker: a harbor NPC who loads ships and gives delivery quests; a big, cheerful dockworker in a striped shirt and a knit cap, carrying a wooden crate in both arms.
- ferryman: a river NPC who carries the player across rivers and tells river legends; a calm, friendly old ferryman in a wide straw hat, holding a long punting pole and a small lantern.
- hermit: a forest NPC who lives alone in the woods and gives riddles and herb quests (kind, never scary); a kind, wise old hermit in a patched hooded robe, leaning on a gnarled stick and holding a bowl of berries.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 6 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/b8/review.json
