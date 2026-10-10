# Review task: bench/sonnet/npc-cards/s7

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 5 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/s7 (teacher.png, cartographer.png, nomad.png, hermit.png, ranger-guide.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- teacher: a school NPC who teaches lessons and gives reading quests; a kind, cheerful teacher with a side braid and a mustard cardigan, raising a pointer stick and holding a red apple.
- cartographer: a map-maker NPC who sells maps and asks the player to explore new places; a careful, kind old cartographer with round spectacles, holding up brass dividers and a bundle of rolled maps.
- nomad: a desert NPC who trades news and spices and gives travel quests; a cheerful young desert wanderer with a sand-colored head scarf and goggles, carrying a bedroll and a walking staff with a bell.
- hermit: a forest NPC who lives alone in the woods and gives riddles and herb quests (kind, never scary); a kind, wise old hermit in a patched hooded robe, leaning on a gnarled stick and holding a bowl of berries.
- ranger-guide: a forest trail NPC who guides the player through wild lands and gives scouting quests; a confident young ranger guide in a green hooded cloak with a longbow on her back, holding up a brass compass and a walking staff.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 5 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/s7/review.json
