# Review task: bench/sonnet/npc-cards/s10

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 5 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/s10 (ambassador.png, commander.png, shrine-keeper.png, diplomat.png, general.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- ambassador: a court NPC from a far kingdom who brings messages and peace quests; a graceful, smiling ambassador in a teal and gold robe, holding out a sealed scroll with a ribbon.
- commander: a castle NPC who leads the defenders and gives defense quests; a steady, kind army commander in a blue cape and steel pauldrons, holding out a rolled battle map.
- shrine-keeper: a mountain shrine NPC who blesses travelers and gives spirit quests; a gentle young shrine keeper in white and pale blue robes, holding up a bell wand and a stone bowl of glowing water.
- diplomat: a court NPC who settles quarrels between towns and gives peace quests; a friendly young diplomat in a cream and green coat, holding up an olive branch and a scroll of terms.
- general: a castle NPC who plans the kingdom defense and gives big battle quests; a proud, kind old general in a red coat with gold epaulettes and a plumed bicorne hat, holding out a brass telescope.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 5 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/s10/review.json
