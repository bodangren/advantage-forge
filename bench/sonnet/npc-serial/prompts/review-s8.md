# Review task: bench/sonnet/npc-cards/s8

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 5 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/s8 (watch-captain.png, riverboat-captain.png, ruin-keeper.png, shrine-keeper.png, trapper.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- watch-captain: a town guard NPC who leads the night watch and gives patrol quests; a proud, friendly watch captain in a blue tabard and a plumed helmet, holding up a glowing lantern.
- riverboat-captain: a river port NPC who runs the riverboat and gives travel and cargo quests; a jolly, round riverboat captain with a white beard and a navy cap, holding out a brass spyglass with one hand on his hip.
- ruin-keeper: a ruins NPC who guards old ruins, opens sealed doors, and tells their history (kind, never scary); a quiet, kind old ruin keeper in a mossy gray cloak, holding up a big ring of old iron keys and a lantern.
- shrine-keeper: a mountain shrine NPC who blesses travelers and gives spirit quests; a gentle young shrine keeper in white and pale blue robes, holding up a bell wand and a stone bowl of glowing water.
- trapper: a northern forest NPC who knows the wild trails and trades furs and supplies (no animals hurt on screen); a rugged, friendly woodland trapper in a fur hat and a long buckskin coat, holding a coil of rope and a lantern.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 5 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/s8/review.json
