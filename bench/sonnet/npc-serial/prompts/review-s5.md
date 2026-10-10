# Review task: bench/sonnet/npc-cards/s5

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 5 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/s5 (hermit.png, ferryman.png, chieftain.png, ranger-guide.png, watch-captain.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- hermit: a forest NPC who lives alone in the woods and gives riddles and herb quests (kind, never scary); a kind, wise old hermit in a patched hooded robe, leaning on a gnarled stick and holding a bowl of berries.
- ferryman: a river NPC who carries the player across rivers and tells river legends; a calm, friendly old ferryman in a wide straw hat, holding a long punting pole and a small lantern.
- chieftain: the leader of a highland village who gives alliance quests; a proud, kind highland chieftain with red braids and a fur-trimmed cloak, holding a carved staff topped with a bronze sun.
- ranger-guide: a forest trail NPC who guides the player through wild lands and gives scouting quests; a confident young ranger guide in a green hooded cloak with a longbow on her back, holding up a brass compass and a walking staff.
- watch-captain: a town guard NPC who leads the night watch and gives patrol quests; a proud, friendly watch captain in a blue tabard and a plumed helmet, holding up a glowing lantern.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 5 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/s5/review.json
