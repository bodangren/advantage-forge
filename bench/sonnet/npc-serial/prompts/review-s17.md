# Review task: bench/sonnet/npc-cards/s17

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 5 P2 NPC characters. Do not edit any file except the output JSON. Never run git.

Bar (owner rule 2026-10-10): an NPC at 7.0 or above is accepted unless the model has a critical error. In each JSON entry, add `"critical": true|false` and `"criticalReason": "<one sentence or empty>"`. Critical errors: hair or another part through a head covering or another part, an accessory or held item that points the wrong way, a floating part, a held item that does not touch the hand, a hole. Style differences from the mockup (hair shape, color, size, expression, proportions) are not critical.

Cards dir: bench/sonnet/npc-cards/s17 (spy.png, regent.png, royal-guard.png, soldier.png, veteran.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- spy: a town NPC who gathers rumors and gives sneaking quests (playful and cheeky); a playful, sneaky young spy in a dark green hooded cloak, peeking through a small spyglass and holding a folded note.
- regent: a palace NPC who rules for the young prince and gives law and order quests (strict but kind); a wise, strict old regent in a dark plum robe with a high collar, holding a great royal seal and a scroll.
- royal-guard: a palace NPC who guards the throne room and gives royal errands; a loyal, proud royal guard in a red and gold uniform and a plumed silver helmet, holding a tall halberd upright.
- soldier: a castle NPC who patrols the walls and gives guard-duty quests; a cheerful young soldier in a blue tabard over chain mail, holding a spear upright and a round shield.
- veteran: a tavern and barracks NPC who tells war stories and trains new heroes; a grizzled, kind old veteran with a gray mustache and a worn blue coat, leaning on a cane with his old helmet under his arm.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 5 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/s17/review.json
