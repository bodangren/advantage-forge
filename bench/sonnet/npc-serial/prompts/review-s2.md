# Review task: bench/sonnet/npc-cards/s2

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 10 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/s2 (stablekeeper.png, nomad.png, caravan-driver.png, hermit.png, archaeologist.png, ferryman.png, chieftain.png, ranger-guide.png, ruin-keeper.png, shepherd.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- stablekeeper: a stable NPC who rents and cares for horses; a sturdy, cheerful stablekeeper with a red neck bandana, holding up a horseshoe and a horse brush.
- nomad: a desert NPC who trades news and spices and gives travel quests; a cheerful young desert wanderer with a sand-colored head scarf and goggles, carrying a bedroll and a walking staff with a bell.
- caravan-driver: a road NPC who leads trade caravans between towns and gives escort quests; a sturdy, cheerful caravan driver in a wide sun hat and a long vest, holding a coiled rope and a water flask.
- hermit: a forest NPC who lives alone in the woods and gives riddles and herb quests (kind, never scary); a kind, wise old hermit in a patched hooded robe, leaning on a gnarled stick and holding a bowl of berries.
- archaeologist: a ruins NPC who studies old relics and gives exploration quests; a curious, excited young archaeologist in a sun helmet, holding up a magnifying glass and a small clay tablet.
- ferryman: a river NPC who carries the player across rivers and tells river legends; a calm, friendly old ferryman in a wide straw hat, holding a long punting pole and a small lantern.
- chieftain: the leader of a highland village who gives alliance quests; a proud, kind highland chieftain with red braids and a fur-trimmed cloak, holding a carved staff topped with a bronze sun.
- ranger-guide: a forest trail NPC who guides the player through wild lands and gives scouting quests; a confident young ranger guide in a green hooded cloak with a longbow on her back, holding up a brass compass and a walking staff.
- ruin-keeper: a ruins NPC who guards old ruins, opens sealed doors, and tells their history (kind, never scary); a quiet, kind old ruin keeper in a mossy gray cloak, holding up a big ring of old iron keys and a lantern.
- shepherd: a farm NPC who keeps sheep and asks for help with lost lambs; a gentle, cheerful shepherd girl with long braids and a straw hat, holding a tall curled crook.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 10 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/s2/review.json
