#!/usr/bin/env bash
# mmx mockups for P1 heroes, with the rogue mockup as the subject reference so faces stay in one style.
cd "$(dirname "$0")/../.." || exit 1
S="Cute chunky chibi 3D game hero for a fantasy RPG, a young beardless hero with a round childlike face and big eyes, full body, standing, front three-quarter view, big head about one third of the height, plain warm beige studio background, soft studio lighting, matte clay toy look, rounded soft forms, no text."
REF="type=character,image=docs/hero-mockups/rogue_001.jpg"
gen() { [ -f "docs/hero-mockups/$1_001.jpg" ] || timeout 180 mmx image generate --prompt "$2 $S" --aspect-ratio 1:1 --out "docs/hero-mockups/$1_001.jpg" --quiet > /dev/null 2>&1; echo "$1 $([ -f docs/hero-mockups/$1_001.jpg ] && echo ok || echo FAILED)"; }
gen paladin "A young paladin hero: shining silver plate armor with gold trim, a white tabard with a gold sun emblem, a short blue cape, short blond hair, a round warm face, holding a war hammer with a gold head and a small round shield with a sun."
gen ranger "A ranger hero: a forest-green hooded cloak over a brown leather jerkin, a longbow in hand, a quiver on the back, bracers, tall boots, auburn hair in a short ponytail, freckles."
gen monk "A monk hero: a shaved bald head with a small top knot and no hat, an orange and saffron wrap robe with a brown sash, cloth hand wraps, bare feet with sandals, prayer beads around the neck, a calm smile, in a fighting stance with open palms."
gen barbarian "A barbarian hero: a stocky young warrior with wild red hair and braids, a fur shoulder mantle, bare arms with blue tribal paint, a leather kilt and fur boots, holding a big two-handed axe."
gen bard "A bard hero: a feathered cap with a red feather, a teal doublet with puffed sleeves and gold buttons, a short cape, brown curly hair, a cheerful grin, playing a small wooden lute."
gen mage "A young mage hero: a tall pointed deep-blue hat with silver stars, a blue robe with a silver trim and a belt with a pouch, silver hair, round glasses, holding a short wand with a glowing blue tip and a small spellbook."
gen priest "A priest hero: a white and gold vestment robe with a gold stole, a small gold circlet, short dark hair, a kind face, holding a staff topped with a gold sunburst and a small holy book."
gen samurai "A samurai hero: red lacquered armor plates over a dark blue kimono, a small crested helmet (kabuto) with gold horns, a topknot, a katana at the hip with a hand on the hilt."
