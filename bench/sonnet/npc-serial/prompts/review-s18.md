# Review task: bench/sonnet/npc-cards/s18

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 5 P2 NPC characters. Do not edit any file except the output JSON. Never run git.

Bar (owner rule 2026-10-10): an NPC at 7.0 or above is accepted unless the model has a critical error. In each JSON entry, add `"critical": true|false` and `"criticalReason": "<one sentence or empty>"`. Critical errors: hair or another part through a head covering or another part, an accessory or held item that points the wrong way, a floating part, a held item that does not touch the hand, a hole. Style differences from the mockup (hair shape, color, size, expression, proportions) are not critical.

Cards dir: bench/sonnet/npc-cards/s18 (dwarf-citizen.png, elf-citizen.png, fae-citizen.png, gnome-citizen.png, halfling-citizen.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- dwarf-citizen: a dwarf citizen of the mountain town who trades gems and gives mining and crafting errands; a cheerful, stocky dwarf townsman with a huge braided red beard, holding up a shiny blue gem and a small hammer.
- elf-citizen: an elf citizen of the forest town who tends the moon gardens and gives nature errands; a graceful, friendly elf with long pointed ears and long silver-blond hair, holding up a glowing blue bell flower like a lantern.
- fae-citizen: a fae citizen of the flower meadow who knows garden secrets and gives flower errands; a tiny, cheerful fae girl with butterfly wings and a flower crown, holding a big daisy like a parasol.
- gnome-citizen: a gnome citizen of the hill town who fixes clever gadgets and gives tinkering errands; a tiny, twinkly gnome tinkerer with a tall red pointed hat and a long white beard, holding up a little brass wind-up gadget.
- halfling-citizen: a halfling citizen of the hill village who loves food and parties and gives cooking errands; a cheerful, plump halfling with curly hair and big bare feet, holding a big round berry pie in both hands.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 5 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/s18/review.json
