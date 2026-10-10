# Review task: bench/sonnet/npc-cards/s14

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 5 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/s14 (prince.png, princess.png, lady.png, lord.png, noble.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- prince: a palace NPC who joins adventures and gives training quests; a brave, cheerful young prince with a small gold crown and a blue tunic, holding up a short ceremonial sword.
- princess: a palace NPC who loves exploring and gives garden and rescue quests; a kind, adventurous young princess with a tiara and a rose pink gown, holding out a bouquet of flowers.
- lady: a palace NPC who knows all the court news and gives social quests; An elegant, friendly court lady in a sage green gown and a lace collar, holding up a folding fan.
- lord: a manor NPC who owns the lands near the village and gives estate quests; a cheerful, proud lord in a dark blue doublet and a fur-trimmed cape, raising a silver goblet.
- noble: a town NPC from a rich family who gives fetch and fashion quests (vain but friendly); a dashing young noble in a feathered hat and a teal coat with a frilly collar, leaning on a fancy walking cane.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 5 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/s14/review.json
