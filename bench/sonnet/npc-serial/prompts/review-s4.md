# Review task: bench/sonnet/npc-cards/s4

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 5 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/s4 (beggar.png, cartographer.png, dockworker.png, stablekeeper.png, nomad.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- beggar: a street NPC who asks for a coin and gives a small hint or a quest in return (kind and hopeful, never sad or scary); a humble, hopeful old man in a patched coat, holding out a dented tin cup with a gentle smile.
- cartographer: a map-maker NPC who sells maps and asks the player to explore new places; a careful, kind old cartographer with round spectacles, holding up brass dividers and a bundle of rolled maps.
- dockworker: a harbor NPC who loads ships and gives delivery quests; a big, cheerful dockworker in a striped shirt and a knit cap, carrying a wooden crate in both arms.
- stablekeeper: a stable NPC who rents and cares for horses; a sturdy, cheerful stablekeeper with a red neck bandana, holding up a horseshoe and a horse brush.
- nomad: a desert NPC who trades news and spices and gives travel quests; a cheerful young desert wanderer with a sand-colored head scarf and goggles, carrying a bedroll and a walking staff with a bell.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 5 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/s4/review.json
