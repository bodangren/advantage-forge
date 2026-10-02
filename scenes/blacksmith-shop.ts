/**
 * Chibi Quest blacksmith shop: an 6 m x 6 m interior cutaway matched to
 * docs/blacksmith-mockups/blacksmith-quest_001.jpg. Two walls stand (north and west), the roof
 * is off, and the camera looks in from the south-east. Kit rules: docs/blacksmith-mockups/
 * construction.md. Pieces that are still being built are optional slots.
 *
 * Grid: 4 x 3 floor tiles of 2 m. +X is east, -Z is north. Yaw 0 faces south.
 */
import type { Place } from './chibi-quest.js';

const BENCH_TOP = 0.99;

export function blacksmithShopPlaces(): Place[] {
  const places: Place[] = [];
  const put = (asset: string, x: number, z: number, yaw = 0, y = 0, optional = false, scale = 1) => {
    const p: Place = { asset, at: [x, y, z] };
    if (scale !== 1) p.scale = scale;
    if (yaw !== 0) p.yaw = yaw;
    if (optional) p.optional = true;
    places.push(p);
  };

  // Floor: 6 m x 6 m of cobblestone tiles (3 x 3 tiles of 2 m).
  for (const x of [-3, -1, 1]) for (const z of [-2, 0, 2]) put('stone-floor', x, z);

  // North wall: stone behind the forge, half-timber toward the workbench. West wall: stone.
  put('stone-wall', -3, -3.05);
  put('stone-wall', -1, -3.05);
  put('timber-wall', 1, -3.05);
  for (const z of [-2, 0, 2]) put('stone-wall', -4.05, z, 90);

  // Work triangle in the north-west: forge, bellows, coal, anvil, quench tub.
  put('forge', -3.1, -2.2, 0, 0, false, 1.35);
  put('bellows', -2.0, -2.4, 270, 0, true);
  put('coal', -3.4, -1.25, 20, 0, true);
  put('coal', -2.9, -1.2, 80, 0, true);
  put('coal', -2.4, -1.3, 140, 0, true);
  put('coal', -1.3, -2.6, 40, 0, true);
  put('anvil', -1.5, -0.8, 0, 0, false, 1.2);
  put('blacksmith', -1.5, -1.55);
  put('quench-tub', -0.5, -0.8, 0, 0, true);
  put('bucket', -0.6, -1.5, 0, 0, true);

  // Work wall: bench with tools, cash box, wall sconces; stock leans on the north wall.
  put('workbench', 1.1, -2.55);
  put('hammer', 0.7, -2.5, 30, BENCH_TOP, true);
  put('tongs', 1.4, -2.45, 100, BENCH_TOP, true);
  put('cash-box', 1.7, -2.6, 0, BENCH_TOP, true);
  put('wall-sconce', -0.9, -2.95, 0, 1.05, true);
  put('wall-sconce', 1.0, -2.95, 0, 1.05, true);
  put('tower-shield', 0.4, -2.8, 0);
  put('kite-shield', -0.5, -2.85, 0);
  put('round-shield', -1.0, -2.85, 0);
  put('long-sword', 0.0, -2.85, 0);
  put('greatsword', -0.25, -2.85, 0);
  put('short-sword', 0.55, -2.85, 0);
  put('warhammer', 1.9, -2.2, 0);

  // East edge: grinding wheel, storage.
  put('grinding-wheel', 1.55, -1.5, 270);
  put('barrel', 1.6, 0.9, 20);
  put('barrel', 1.6, 1.5, 70);
  put('crate', 1.0, 1.0, 15);
  put('crate', 1.0, 1.6, 75);
  put('sack', 0.55, 1.2, 40);
  put('sack', 0.55, 1.7, 100);
  put('handcart', 1.3, 2.4, 90);

  // West wall: ore heaps, rope, tools, finished stock.
  put('iron-ore', -3.4, -0.7, 10);
  put('iron-ore', -3.0, -0.4, 60);
  put('copper-ore', -3.45, 0.0, 30);
  put('silver-ore', -3.3, 0.45, 80);
  put('gold-ore', -3.5, 0.9, 20);
  put('rope-coil', -3.3, 1.5, 30);
  put('axe', -3.75, 2.0, 90, 0, true);
  put('pickaxe', -3.75, 2.35, 90, 0, true);
  put('shovel', -3.75, 2.7, 90, 0, true);
  put('chains', -3.85, 1.7, 90, 0.4);
  put('wall-sconce', -3.9, -0.6, 90, 1.05, true);
  put('wall-sconce', -3.9, 1.2, 90, 1.05, true);
  put('round-shield', -3.8, 0.4, 90);
  put('stool', -0.9, 0.4, 20);
  put('bucket', -2.6, 1.6, 0, 0);
  put('wheelbarrow', -0.8, 2.5, 90);
  put('rope-coil', -1.9, 2.4, 110);

  // A customer waits for a sword.
  put('adventurer', 0.2, 0.9, 200);
  return places;
}
