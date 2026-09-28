#!/usr/bin/env bash
# mmx mockups for the P1 dungeon denizens, in the style of docs/enemy-mockups/.
cd "$(dirname "$0")/../.." || exit 1
S="Cute chunky chibi 3D game character for a fantasy RPG, full body, standing, front three-quarter view, big head about one third of the height, plain warm beige studio background, soft studio lighting, matte clay toy look, rounded soft forms, no text."
gen() { [ -f "docs/enemy-mockups/$1_001.jpg" ] || timeout 180 mmx image generate --prompt "$2 $S" --aspect-ratio 1:1 --out "docs/enemy-mockups/$1_001.jpg" --quiet > /dev/null 2>&1; echo "$1 $([ -f docs/enemy-mockups/$1_001.jpg ] && echo ok || echo FAILED)"; }
gen ghost "A friendly-spooky floating ghost: a pale blue-white sheet body that tapers into a wispy tail instead of legs, two stubby arms, big dark hollow eyes with small glowing cyan pupils, a small open mouth, a faint cyan glow at the edges."
gen mummy "A small mummy: wrapped head to toe in cream linen bandages with loose trailing ends, one big glowing yellow eye peeking between the wraps, stubby arms reaching forward, a few dark gaps and a faded blue-gold collar."
gen kobold-warrior "A kobold warrior: a small reptile-dog creature with rust-orange scales, a long snout with tiny fangs, big yellow eyes, small horns, a tail, a battered leather vest, and a crude short spear with a rag tied under the tip."
gen minotaur-guard "A minotaur guard: a stocky bull-headed brute with brown fur, big curved horns, a brass nose ring, a heavy iron chest plate, a studded belt, hooves, and a big two-handed double axe."
gen lich "A lich boss: a skeletal sorcerer in a tattered deep purple robe with gold trim, a spiky gold crown on the skull, glowing green eye lights, a bony hand holding a staff topped with a glowing green gem, green magic wisps around it."
gen skeleton-knight "A skeleton knight: a chibi skeleton in dented dark iron armor with a round helmet with a plume stub, a tattered dark red tabard, a notched sword and a battered kite shield, glowing orange eye lights."
gen cultist "A dungeon cultist: a small robed figure in a deep crimson hooded robe with black trim, the face hidden in shadow except glowing purple eyes, a bone charm necklace, holding a curved ritual dagger and a black candle."
gen goblin-shaman "A goblin shaman: a small green goblin with big ears, a feathered bone headdress, face paint, a patched hide cloak, bead necklaces, and a crooked wooden staff topped with a skull and a glowing green flame."
gen bandit-archer "A bandit archer: a small hooded rogue in a dark green hood and a brown leather vest, a cloth mask over the lower face, a short bow in hand and a quiver of arrows on the back, a belt with pouches."
