#!/usr/bin/env bash
# mmx mockups for the second batch of P1 dungeon enemies, in the style of docs/enemy-mockups/.
cd "$(dirname "$0")/../.." || exit 1
S="Cute chunky chibi 3D game character for a fantasy RPG, full body, standing, front three-quarter view, big head about one third of the height, plain warm beige studio background, soft studio lighting, matte clay toy look, rounded soft forms, no text."
gen() { [ -f "docs/enemy-mockups/$1_001.jpg" ] || timeout 180 mmx image generate --prompt "$2 $S" --aspect-ratio 1:1 --out "docs/enemy-mockups/$1_001.jpg" --quiet > /dev/null 2>&1; echo "$1 $([ -f docs/enemy-mockups/$1_001.jpg ] && echo ok || echo FAILED)"; }
gen zombie-soldier "A zombie soldier: a shambling chibi zombie with grey-green skin, sunken eyes with dull yellow pupils, stitches, a torn faded blue soldier tunic with a rusty dented half helmet and a broken rusty sword, one arm reaching forward."
gen ghoul "A ghoul: a hunched lean chibi ghoul with pale grey-violet skin, long pointed ears, a wide toothy grin, big glowing white eyes, long clawed fingers, and tattered dark rags around the waist, crouching slightly."
gen wraith "A wraith: a floating hooded spectre in a tattered dark blue-grey cloak that fades into wisps instead of legs, a black void face with two glowing pale blue eyes, thin skeletal hands, one holding a small rusty lantern with blue fire."
gen vampire "A vampire noble: a pale chibi vampire with slicked black hair, red eyes, small fangs, a high-collared black cape with a red lining, a burgundy vest with gold buttons, white cravat, and dark boots."
gen necromancer "A necromancer: a chibi dark sorcerer in a black and dark green hooded robe with bone trim, a pale face with glowing green eyes, a skull shoulder pad, holding a staff topped with a small skull and green flame."
gen stone-golem "A stone golem: a chunky round-shouldered golem made of grey mossy boulders, huge blocky fists, short stumpy legs, a small head with two glowing blue rune eyes and a glowing blue rune on the chest."
gen death-knight "A death knight: a chibi undead knight in black spiked plate armor with dark purple trim, a horned closed helmet with glowing icy blue eye slits, a tattered dark cape, and a big black runed greatsword."
gen bone-golem "A bone golem: a hulking chibi construct made of piled bones and skulls, a big rib-cage chest, thick bone arms with club-like hands, a large skull head with glowing red eyes, bound with dark iron bands."
