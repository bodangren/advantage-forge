#!/usr/bin/env bash
# mmx mockups for P2 map batch 1 -> docs/map-mockups/<slug>.jpg. Usage: make-map-mocks.sh [slug ...]
cd "$(dirname "$0")/../.." || exit 1
S="Cute chibi 3D game map diorama for a fantasy RPG, isometric three-quarter overhead view from about 45 degrees, the whole map as one floating tile-based diorama on a plain warm beige studio background, matte clay toy look, rounded chunky forms, soft bevels, cheerful saturated palette, soft studio lighting, no characters larger than a few small figures, no text, no UI."
declare -A P
P[library]="A cutaway interior of a grand library hall: tall wooden bookshelves along the walls, reading tables with open books and candles, a ladder, a globe, a central rug, warm lamp light, three walls standing and the roof removed."
P[alchemy-lab]="A cutaway interior of an alchemy laboratory: workbenches with bubbling flasks and glowing potions, a copper still, shelves of jars and herbs, a cauldron, a stone furnace, warm light, three walls standing and the roof removed."
P[wizard-tower]="A cutaway interior of a wizard tower room: a round stone chamber with a spiral staircase, a desk with scrolls and a crystal ball, a telescope, star charts, floating candles, a bookshelf, blue-purple magic glow, walls standing and the roof removed."
P[arcane-sanctum]="A cutaway interior of an arcane sanctum: a round stone hall with a glowing rune circle on the floor, four rune pillars, an altar with a floating crystal, hanging banners, violet and cyan magic light, walls standing and the roof removed."
P[crypt]="A dark stone crypt level: a central hall with rows of stone sarcophagi, skull niches in the walls, candles, cobwebs, bone piles, an iron gate, cool blue slate stone with warm torch light, low walls so the interior is visible from above."
P[crystal-cave]="A crystal cave level: a cavern floor of dark rock with large glowing crystal clusters in cyan, pink and violet, a small underground pool, stalagmites, mushrooms, a winding path, rock walls around the edge, low so the interior is visible from above."
P[labyrinth]="A hedge-and-stone labyrinth level: a square maze of low stone walls with moss, a clear winding corridor path, torches at corners, a statue at a dead end, a goal door in the middle, low walls so the whole maze is visible from above."
P[boss-arena]="A boss arena level: a large circular stone fighting pit with sand floor, a ring of broken pillars, torches in braziers, spiked barricades, a big stone throne on the north edge, a gate on the south, low walls so the arena is visible from above."
P[goblin-camp]="A goblin camp in a forest clearing: crude wooden huts with tattered hides, a central bonfire with a pot, spiked log palisade, bone totems, tents, crates and sacks of loot, dirt ground, a few trees around the edge."
P[gatehouse]="A castle gatehouse and outer wall: a stone gatehouse with a portcullis and two round towers, crenellated walls going left and right, a wooden drawbridge over a dry moat, banners, a cobble road leading to the gate, grass around."
P[grassland]="An open grassland level: rolling green grass with wildflowers, a few trees and rocks, a winding dirt road with one bend, a small pond, a wooden fence section, bright sunny cheerful colours."
P[mountain-pass]="A mountain pass level: a narrow rocky path winding between two steep grey cliff walls with snow patches on the high ground, pine trees, boulders, a rope bridge over a gap, a stone waypoint marker."
P[swamp]="A swamp level: murky green water with lily pads and reeds, twisted mangrove trees with hanging moss, a winding wooden boardwalk, mushrooms, a rotting boat, fog wisps, a dead tree."
P[castle]="A castle level seen from above: a stone keep with four corner towers and a courtyard, inner walls, a gate, banners, a well, training dummies, a stable corner, a throne hall roof removed to show a red carpet, cobbled courtyard."
P[market-square]="A medieval market square: cobble square with many colourful stall canopies selling fruit, bread, cloth and pots, a central fountain, crates and barrels, a few timber houses around the edge, hanging bunting."
P[inn]="A cutaway interior of a wayfarers inn: a common room with long tables and benches, a fireplace, a counter with barrels, a staircase to the rooms, a hanging lantern, warm light, three walls standing and the roof removed."
P[coast]="A rocky coast level: a sandy beach strip with a gentle sea at one edge, rocks and tide pools, a small wooden pier with a rowboat, palm trees, driftwood, shells, a lighthouse-free open shore, sunny colours."
P[mine]="A mine level: a dark rock cavern with wooden support beams, rail tracks with a loaded mine cart, ore veins glowing in the walls, lanterns, a pickaxe rack, a lift shaft, barrels, low rock walls so the interior is visible from above."
P[arena]="A civic gladiator arena: an oval sand pit surrounded by stepped stone stands with small cheering crowds, banners, two gates at the ends, a central podium, flagpoles, sunny colours."
P[town]="A small medieval town: a cobble main street with a market corner, two rows of timber and stone houses with tiled roofs, a church with a bell tower, a well, hanging signs, a town gate, window boxes with flowers."
P[shrine]="A small forest shrine: a round stone platform with a carved stone shrine and a glowing offering bowl, stone lanterns, a short stone path with steps, a torii-like arch of timber, wind chimes, ferns and mossy rocks, cherry trees, soft golden light."
for slug in "${@:-${!P[@]}}"; do
  out="docs/map-mockups/$slug.jpg"
  [ -f "$out" ] || timeout 240 mmx image generate --prompt "${P[$slug]} $S" --aspect-ratio 4:3 --out "$out" --quiet > /dev/null 2>&1
  echo "$slug $([ -f "$out" ] && echo ok || echo FAILED)"
done
