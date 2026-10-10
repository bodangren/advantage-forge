# Review task: bench/sonnet/npc-cards/s20

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 2 P2 NPC characters. Do not edit any file except the output JSON. Never run git.

Bar (owner rule 2026-10-10): an NPC at 7.0 or above is accepted unless the model has a critical error. In each JSON entry, add `"critical": true|false` and `"criticalReason": "<one sentence or empty>"`. Critical errors: hair or another part through a head covering or another part, an accessory or held item that points the wrong way, a floating part, a held item that does not touch the hand, a hole. Style differences from the mockup (hair shape, color, size, expression, proportions) are not critical.

Cards dir: bench/sonnet/npc-cards/s20 (goblin-citizen.png, lizardfolk-citizen.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- goblin-citizen: a goblin citizen of the market who trades odd trinkets and gives swap errands (friendly, never an enemy); a friendly, chatty goblin junk trader with a huge backpack of odds and ends, holding up a little brass bell.
- lizardfolk-citizen: a lizardfolk citizen of the river town who trades shells and river goods and gives river errands (friendly, never an enemy); a friendly green lizardfolk river trader with a teal headscarf and a shell necklace, holding up a big spiral seashell.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 2 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/s20/review.json
