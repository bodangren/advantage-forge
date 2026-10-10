# Review task: bench/sonnet/npc-cards/s11

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 5 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/s11 (commander.png, diplomat.png, general.png, guild-master.png, guild-member.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- commander: a castle NPC who leads the defenders and gives defense quests; a steady, kind army commander in a blue cape and steel pauldrons, holding out a rolled battle map.
- diplomat: a court NPC who settles quarrels between towns and gives peace quests; a friendly young diplomat in a cream and green coat, holding up an olive branch and a scroll of terms.
- general: a castle NPC who plans the kingdom defense and gives big battle quests; a proud, kind old general in a red coat with gold epaulettes and a plumed bicorne hat, holding out a brass telescope.
- guild-master: a guild hall NPC who runs the crafting guild and gives guild rank quests; a plump, jolly guild master with a gold chain of office and a fur-trimmed coat, holding up a big brass guild key and a coin purse.
- guild-member: a guild hall NPC who helps new members and gives crafting errands; An eager young guild crafter in a work apron with a guild badge, holding up a small guild banner and a wrapped package.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 5 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/s11/review.json
