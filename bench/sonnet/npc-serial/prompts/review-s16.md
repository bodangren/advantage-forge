# Review task: bench/sonnet/npc-cards/s16

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 4 P2 NPC characters. Do not edit any file except the output JSON. Never run git.

Bar (owner rule 2026-10-10): an NPC at 7.0 or above is accepted unless the model has a critical error. In each JSON entry, add `"critical": true|false` and `"criticalReason": "<one sentence or empty>"`. Critical errors: hair or another part through a head covering or another part, an accessory or held item that points the wrong way, a floating part, a held item that does not touch the hand, a hole. Style differences from the mockup (hair shape, color, size, expression, proportions) are not critical.

Cards dir: bench/sonnet/npc-cards/s16 (lady.png, masked-agent.png, spy.png, rebel.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- lady: a palace NPC who knows all the court news and gives social quests; An elegant, friendly court lady in a sage green gown and a lace collar, holding up a folding fan.
- masked-agent: a hidden NPC who passes secret tips and starts mystery quests (playful, never scary); a mysterious but friendly masked agent in a deep purple cloak and a white half mask, holding out a sealed secret letter.
- spy: a town NPC who gathers rumors and gives sneaking quests (playful and cheeky); a playful, sneaky young spy in a dark green hooded cloak, peeking through a small spyglass and holding a folded note.
- rebel: a forest camp NPC who fights for fair laws and gives scouting quests (hopeful and brave, no real violence); a brave, hopeful young rebel scout with a red bandana and a patched green jacket, holding a rolled flag and a slingshot.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 4 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the review JSON with one Write call, and the Part B JSON with one more Write call.

Output JSON: bench/sonnet/npc-cards/s16/review.json

## Part B: critical-error check only (no rating)

These four NPCs are accepted at 7.0 unless the model has a critical error. A builder fixed one critical error in each: banker (the quill went into the sleeve cuff), hermit (a hair tuft came through the hood), tanner (a hair tuft came through the scarf), baker (the chin went into the bib in the rest clip).
Read their cards in the same parallel step: bench/sonnet/npc-cards/s16/banker.png, bench/sonnet/npc-cards/s16/hermit.png, bench/sonnet/npc-cards/s16/tanner.png, bench/sonnet/npc-cards/s16/baker.png. For the baker you may open out/baker/anim/rest.png (it counts as an extra image).
Do not rate them. Decide only: critical error, yes or no. Write bench/sonnet/npc-cards/s16/critical.json as {"<name>": {"critical": true or false, "reason": "<one sentence>"}}.
