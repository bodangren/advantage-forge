#!/usr/bin/env bash
# mmx mockups for P2 map batch 3 -> docs/map-mockups/<slug>.jpg. Usage: make-map-mocks3.sh [slug ...]
cd "$(dirname "$0")/../.." || exit 1
S="Cute chibi 3D game map diorama for a fantasy RPG, isometric three-quarter overhead view from about 45 degrees, the whole map as one floating tile-based diorama on a plain warm beige studio background, matte clay toy look, rounded chunky forms, soft bevels, cheerful saturated palette, soft studio lighting, no characters larger than a few small figures, no text, no UI."
declare -A P
P[cave]="A natural cave: rock walls, a narrow winding tunnel into a wide chamber, stalagmites, a small underground pool, glowing mushrooms, bones, a campfire ring, a treasure nook."
P[shipwreck]="A shipwreck: a broken hulled ship on its side on a sandy beach, a snapped mast, torn sail, scattered cargo crates and barrels, a half-buried chest, crabs, driftwood, rocks, a few palms."
P[archive]="A records archive: tall shelves of scrolls and ledgers in aisles, a sliding ladder, a clerk desk with quills, a map table, candles, lockable cabinets, a stair to a gallery."
P[bank]="A bank hall: a long teller counter with brass grilles, a vault door at the back, stacks of coins, strongboxes, a guard, a marble floor, chandeliers, a clerk desk."
P[bathhouse]="A bathhouse: a big tiled steam pool in the middle, benches, towel racks, wooden buckets, columns, braziers, a massage table, steam, an attendant."
P[courthouse]="A courthouse: a raised judge bench at the north, a witness stand, a jury box, rows of public benches, a bailiff, a scales-of-justice statue, banners, tall windows."
P[granary]="A granary: a big raised grain barn on stilts with a ramp, stacked sacks and wheat bales, a threshing floor, a cart, a hand mill, chickens, a fence, a farmer."
P[mill]="A watermill by a river: the mill house with a turning wheel, a millpond and sluice, a stone bridge, grain sacks, a cart, a miller, willow trees, a path."
P[palace]="A palace: a grand domed palace with two wings, a front courtyard with a fountain, formal hedge gardens, a gate with guards, banners, statues, a long approach road."
P[theater]="A theater: a raised stage with curtains and painted scenery, rows of benches, a balcony, lanterns, a prompter box, props, actors, a red carpet aisle."
P[town-hall]="A town hall: a grand timber-and-stone hall with a bell tower, a front square with a fountain, a notice board, a speaker platform, banners, benches, townsfolk, a market corner."
P[city]="A medieval city district: dense rows of townhouses along cobble streets, a central market square with a fountain, a cathedral-like tower, a gate, carts, lanterns."
P[cliff-village]="A village on a cliff: terraced stone houses stepped up a rock face, rope bridges, ladders, a lift basket, goat paths, a lookout, banners, a waterfall edge."
P[desert-city]="A desert city: flat-roofed sandstone houses, domed towers, a bazaar with awnings, a palm oasis fountain, a caravan gate, camels, lanterns, narrow sandy streets."
P[floating-city]="A floating city: a rocky sky island with a few cottages and a tower, glowing crystals under it, rope bridges to smaller islets, balloons, windmill sails, clouds."
P[fortified-city]="A walled city: tall curtain walls with towers around a dense district, a main gate with a barbican, a keep on a rise, ramparts with archers, a road, a moat."
P[mountain-city]="A mountain city: stone terraces and stairs climbing a mountainside, carved halls, bridges between peaks, a high temple, snow, forges with smoke, banners."
P[port-city]="A port city: a harbor with piers and moored ships, warehouses, a lighthouse, a fish market, crane, cobble quays, townhouses behind, boats, barrels and crates."
P[ruined-city]="A ruined city: collapsed houses and broken walls along overgrown cobble streets, a toppled statue, a dry fountain, rubble, vines, a surviving tower, crows."
P[underground-city]="An underground city: a huge cavern with stacked stone houses lit by lanterns and glowing crystals, a central plaza with a fountain, stair streets, mushroom farms, bridges over a chasm."
P[beach]="A beach: soft sand with a curved shoreline, palm trees, a beach hut, a campfire, a rowboat pulled ashore, shells and starfish, driftwood, rocks, a boardwalk, a pier stub."
P[coral-reef]="A shallow coral reef: bright coral clusters in many colors, sandy channels, a sunken wreck prow, a giant clam with a pearl, kelp, rocks, a treasure chest, shoals of fish."
P[glacier]="A glacier: a wide ice sheet with crevasses, ice spires, snow drifts, a frozen lake, a mountaineer camp tent, a rope bridge over a crevasse, blue crystals, pines at the edge."
P[island]="A small tropical island: a round sandy beach ring, a grassy hill with palm trees, a hut, a campfire, a tiny dock with a rowboat, a treasure marker, rocks, flowers."
P[lake-shore]="A lake shore: a calm lake along the north edge, a wooden pier with a rowboat, a fisherman cottage, reeds, willow trees, a campfire, a path along the shore, boulders."
P[riverbank]="A river bank: a river bend across the map, a small wooden bridge, stepping stones, a ford, a fishing spot with a bench, reeds, willows, a mill cart path, wildflowers."
for slug in "${@:-${!P[@]}}"; do
  out="docs/map-mockups/$slug.jpg"
  [ -f "$out" ] || timeout 240 mmx image generate --prompt "${P[$slug]} $S" --aspect-ratio 4:3 --out "$out" --quiet > /dev/null 2>&1
  echo "$slug $([ -f "$out" ] && echo ok || echo FAILED)"
done
