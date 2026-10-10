# Review task: bench/sonnet/npc-cards/s12

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 5 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/s12 (general.png, guild-master.png, inquisitor.png, king.png, queen.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- general: a castle NPC who plans the kingdom defense and gives big battle quests; a proud, kind old general in a red coat with gold epaulettes and a plumed bicorne hat, holding out a brass telescope.
- guild-master: a guild hall NPC who runs the crafting guild and gives guild rank quests; a plump, jolly guild master with a gold chain of office and a fur-trimmed coat, holding up a big brass guild key and a coin purse.
- inquisitor: a court NPC who checks the facts in mystery quests (strict but fair, never cruel or scary); a stern but fair truth-seeker official in gray and white robes and a tall hat, holding a lantern of truth and a thick book of laws.
- king: the kind ruler of the kingdom who gives the main quests; a jolly old king with a gold crown and a red velvet robe with ermine, holding a scepter and a golden orb.
- queen: the wise ruler of the kingdom who gives the main quests; a gracious, kind queen with a tall gold crown and a purple gown with an ermine cape, holding a slim scepter.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 5 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/s12/review.json
