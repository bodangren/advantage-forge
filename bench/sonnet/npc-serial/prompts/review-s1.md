# Review task: bench/sonnet/npc-cards/s1

Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.
You review a batch of 9 P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.

Cards dir: bench/sonnet/npc-cards/s1 (beggar.png, scribe.png, storyteller.png, student.png, tailor.png, prospector.png, riverboat-captain.png, cartographer.png, dockworker.png). Each mockup is also at docs/npc-mockups/<name>_001.jpg.

Roles (one line each):
- beggar: a street NPC who asks for a coin and gives a small hint or a quest in return (kind and hopeful, never sad or scary); a humble, hopeful old man in a patched coat, holding out a dented tin cup with a gentle smile.
- scribe: a town hall NPC who writes letters and records quests; a neat, focused young scribe writing on a scroll board with a long white quill.
- storyteller: a village NPC who tells legends and starts story quests; a warm, cheerful old storyteller with a patchwork shawl, holding an open storybook and a carved toy dragon.
- student: a school NPC who studies with the player and asks for help with lessons; a cheerful young student boy with freckles and a satchel, holding up a small slate with a chalk star.
- tailor: a shop NPC who sells and dyes clothes; a neat, friendly tailor with a measuring tape around her neck, holding up big silver scissors and a spool of thread.
- prospector: a hills NPC who searches rivers for gold and gives treasure quests; a cheerful old prospector with a bushy beard and a floppy hat, holding out a gold pan with shiny nuggets.
- riverboat-captain: a river port NPC who runs the riverboat and gives travel and cargo quests; a jolly, round riverboat captain with a white beard and a navy cap, holding out a brass spyglass with one hand on his hip.
- cartographer: a map-maker NPC who sells maps and asks the player to explore new places; a careful, kind old cartographer with round spectacles, holding up brass dividers and a bundle of rolled maps.
- dockworker: a harbor NPC who loads ships and gives delivery quests; a big, cheerful dockworker in a striped shirt and a knit cap, carrying a wooden crate in both arms.

All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.

House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.

Work in few steps:
1. Read the reviewer brief.
2. Read all 9 cards in one step, with parallel Read calls.
3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.
4. Write the JSON with one Write call.

Output JSON: bench/sonnet/npc-cards/s1/review.json
