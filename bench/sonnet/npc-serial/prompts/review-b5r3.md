# Review task: bench/sonnet/npc-cards/b5r3

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 6 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/b5r3 (miller.png, miner.png, musician.png, orphan.png, peddler.png, refugee.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- miller: a farm and mill NPC who sells flour and grain; a round, flour-dusted miller in a soft cap and a white smock, carrying a fat sack of flour on his shoulder.
- miner: a mine NPC who sells ore and gems and opens mine quests; a sturdy, cheerful miner with a helmet lamp and a soot-smudged face, holding up a mining hammer and a glowing crystal.
- musician: a town and tavern NPC who plays music; a joyful young street musician in a feathered beret and a striped vest, playing a little wooden fiddle.
- orphan: a town NPC kid who knows every alley and gives small quests; a cheerful, cheeky town kid in a patched cap and oversized coat, holding up a paper boat with a big grin.
- peddler: a traveling NPC who sells odd items on the roads; a chatty traveling peddler with a huge backpack hung with pots and trinkets, holding out a shiny gold teapot to sell.
- refugee: a road NPC who has lost a home and asks the player for help (a kind, hopeful quest giver); a hopeful young traveler from a far village, wrapped in a warm shawl, carrying a bundle on a stick and a small lantern.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 6 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/b5r3/review.json
